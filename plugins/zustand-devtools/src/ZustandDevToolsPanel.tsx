import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Toolbar,
  Tabs,
  ScrollableContainer,
  Footer,
  Badge,
  StatusIndicator,
  EmptyState,
  ConfigMenu,
  ThemeProvider,
  type ConfigMenuItem
} from '@sucoza/shared-components';
import '@sucoza/shared-components/dist/styles/theme.css';
import { zustandEventClient } from './zustandEventClient';
import type { ZustandStoreState } from './zustandEventClient';

interface StoreAction {
  storeName: string;
  action: string;
  prevState: unknown;
  nextState: unknown;
  timestamp: number;
}

// UI State persistence helpers
const ZUSTAND_UI_STATE_KEY = 'zustand-devtools-ui-state';

interface ZustandUIState {
  selectedStore: string | null;
  selectedHistoryIndex: number | null;
  activeTab: 'state' | 'diff';
  autoRefresh: boolean;
  searchQuery: string;
  expandedStates: string[];
  collapsedStores: string[];
  expandedTreeNodes: string[];
}

const saveUIState = (state: ZustandUIState) => {
  try {
    localStorage.setItem(ZUSTAND_UI_STATE_KEY, JSON.stringify(state));
  } catch {
    // Ignore localStorage errors
  }
};

const loadUIState = (): Partial<ZustandUIState> => {
  try {
    const saved = localStorage.getItem(ZUSTAND_UI_STATE_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
};

interface ZustandDevToolsPanelProps {
  theme?: 'light' | 'dark' | 'auto'
}

function ZustandDevToolsPanelInner() {
  // Load saved UI state (lazy initializer — runs only on first render)
  const [savedState] = useState(loadUIState);
  
  const [stores, setStores] = useState<Record<string, ZustandStoreState>>({});
  const [selectedStore, setSelectedStore] = useState<string | null>(savedState.selectedStore || null);
  const [actionHistory, setActionHistory] = useState<StoreAction[]>([]);
  const [selectedHistoryIndex, setSelectedHistoryIndex] = useState<number | null>(savedState.selectedHistoryIndex || null);
  const [activeTab, setActiveTab] = useState<'state' | 'diff'>(savedState.activeTab || 'state');
  const [autoRefresh, setAutoRefresh] = useState(savedState.autoRefresh ?? true);
  const [searchQuery, setSearchQuery] = useState(savedState.searchQuery || '');
  const [expandedStates, setExpandedStates] = useState<Set<string>>(new Set(savedState.expandedStates || []));
  const [collapsedStores, setCollapsedStores] = useState<Set<string>>(new Set(savedState.collapsedStores || []));
  const [expandedTreeNodes, setExpandedTreeNodes] = useState<Set<string>>(new Set(savedState.expandedTreeNodes || []));
  const [copySuccess, setCopySuccess] = useState<string | null>(null);
  const [_isTimeTravel, setIsTimeTravel] = useState(false);
  const [showSnapshotDialog, setShowSnapshotDialog] = useState(false);
  const [snapshotName, setSnapshotName] = useState('');

  useEffect(() => {
    // Subscribe to state updates
    const unsubscribeState = zustandEventClient.on('zustand-state-update', (event: any) => {
      setStores(event.payload.stores);
    });

    // Subscribe to state responses (for initial state load)
    const unsubscribeStateResponse = zustandEventClient.on('zustand-state-response', (event: any) => {
      setStores(event.payload.stores);
    });

    // Subscribe to store registrations
    const unsubscribeRegister = zustandEventClient.on('zustand-store-registered', (_event: any) => {
      // console.log(`Store registered: ${event.payload.storeName}`);
    });

    // Subscribe to store actions
    const unsubscribeAction = zustandEventClient.on('zustand-store-action', (event: any) => {
      if (autoRefresh) {
        setActionHistory(prev => [...prev, event.payload].slice(-50)); // Keep last 50 actions
      }
    });

    // Subscribe to state restoration confirmations
    const unsubscribeRestored = zustandEventClient.on('zustand-state-restored', (event: any) => {
      console.log(`State restored for ${event.payload.storeName}`);
      setIsTimeTravel(false);
      setSelectedHistoryIndex(null);
    });

    // Request initial state when component mounts
    zustandEventClient.emit('zustand-state-request', undefined);

    return () => {
      unsubscribeState();
      unsubscribeStateResponse();
      unsubscribeRegister();
      unsubscribeAction();
      unsubscribeRestored();
    };
  }, [autoRefresh]);

  // Save UI state whenever it changes
  useEffect(() => {
    const currentState: ZustandUIState = {
      selectedStore,
      selectedHistoryIndex,
      activeTab,
      autoRefresh,
      searchQuery,
      expandedStates: Array.from(expandedStates),
      collapsedStores: Array.from(collapsedStores),
      expandedTreeNodes: Array.from(expandedTreeNodes),
    };
    saveUIState(currentState);
  }, [selectedStore, selectedHistoryIndex, activeTab, autoRefresh, searchQuery, expandedStates, collapsedStores, expandedTreeNodes]);

  const toggleTreeNode = useCallback((path: string) => {
    setExpandedTreeNodes(prev => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  }, []);

  const copyToClipboard = useCallback(async (data: any, label: string) => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      setCopySuccess(label);
      setTimeout(() => setCopySuccess(null), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
      setCopySuccess('Failed to copy');
      setTimeout(() => setCopySuccess(null), 2000);
    }
  }, []);

  const toggleStateExpansion = useCallback((storeName: string) => {
    setExpandedStates(prev => {
      const next = new Set(prev);
      if (next.has(storeName)) {
        next.delete(storeName);
      } else {
        next.add(storeName);
      }
      return next;
    });
  }, []);

  const toggleStoreCollapse = useCallback((storeName: string) => {
    setCollapsedStores(prev => {
      const next = new Set(prev);
      if (next.has(storeName)) {
        next.delete(storeName);
      } else {
        next.add(storeName);
      }
      return next;
    });
  }, []);

  const countProperties = (obj: any): number => {
    if (!obj || typeof obj !== 'object') return 0;
    return Object.keys(obj).length;
  };

  // Helper to create inline diff view
  const renderDiff = (prev: any, next: any, path: string = ''): React.ReactNode => {
    if (prev === next) {
      return renderJson(next);
    }

    if (typeof prev !== typeof next) {
      return (
        <div>
          <span style={{ background: '#3c2415', color: '#f48771', textDecoration: 'line-through', marginRight: '8px' }}>
            {renderJson(prev)}
          </span>
          <span style={{ background: '#1e3a28', color: "var(--dt-accent-secondary)" }}>
            {renderJson(next)}
          </span>
        </div>
      );
    }

    if (typeof prev === 'object' && prev !== null && next !== null) {
      const allKeys = new Set([...Object.keys(prev), ...Object.keys(next)]);
      return (
        <div>
          <span style={{ color: '#95a5a6' }}>{'{'}</span>
          {Array.from(allKeys).map(key => {
            const hasInPrev = key in prev;
            const hasInNext = key in next;
            
            if (!hasInPrev) {
              // Added property
              return (
                <div key={key} style={{ marginLeft: '20px', background: '#1e3a28' }}>
                  <span style={{ color: "var(--dt-accent-secondary)" }}>+ &quot;{key}&quot;: {renderJson(next[key])}</span>
                </div>
              );
            } else if (!hasInNext) {
              // Removed property
              return (
                <div key={key} style={{ marginLeft: '20px', background: '#3c2415' }}>
                  <span style={{ color: '#f48771', textDecoration: 'line-through' }}>- &quot;{key}&quot;: {renderJson(prev[key])}</span>
                </div>
              );
            } else if (JSON.stringify(prev[key]) !== JSON.stringify(next[key])) {
              // Modified property
              return (
                <div key={key} style={{ marginLeft: '20px' }}>
                  <span style={{ color: "var(--dt-status-error)" }}>&quot;{key}&quot;</span>
                  <span style={{ color: '#ecf0f1' }}>: </span>
                  {renderDiff(prev[key], next[key], `${path}.${key}`)}
                </div>
              );
            } else {
              // Unchanged property
              return (
                <div key={key} style={{ marginLeft: '20px' }}>
                  <span style={{ color: "var(--dt-status-error)" }}>&quot;{key}&quot;</span>
                  <span style={{ color: '#ecf0f1' }}>: </span>
                  {renderJson(next[key])}
                </div>
              );
            }
          })}
          <span style={{ color: '#95a5a6' }}>{'}'}</span>
        </div>
      );
    }

    return (
      <span>
        <span style={{ background: '#3c2415', color: '#f48771', textDecoration: 'line-through', marginRight: '8px' }}>
          {String(prev)}
        </span>
        <span style={{ background: '#1e3a28', color: "var(--dt-accent-secondary)" }}>
          {String(next)}
        </span>
      </span>
    );
  };

  const TreeNode = ({ data, path, depth = 0 }: { data: unknown; path: string; depth?: number }) => {
    const isExpanded = expandedTreeNodes.has(path);
    const hasChildren = data !== null && typeof data === 'object' && (Array.isArray(data) ? data.length > 0 : Object.keys(data).length > 0);

    if (data === null || data === undefined) {
      return <span style={{ color: '#7f8c8d' }}>null</span>;
    }

    if (typeof data === 'string') {
      if (data.startsWith('[') && data.endsWith(']')) {
        return <span style={{ color: '#95a5a6', fontStyle: 'italic' }}>{data}</span>;
      }
      return <span style={{ color: '#27ae60' }}>&quot;<span style={{ wordBreak: 'break-all' }}>{data}</span>&quot;</span>;
    }

    if (typeof data === 'number') {
      return <span style={{ color: "var(--dt-border-focus)" }}>{String(data)}</span>;
    }

    if (typeof data === 'boolean') {
      return <span style={{ color: '#e67e22' }}>{String(data)}</span>;
    }

    if (Array.isArray(data)) {
      if (!hasChildren) {
        return <span style={{ color: '#95a5a6' }}>[]</span>;
      }

      return (
        <div>
          <span 
            onClick={() => hasChildren && toggleTreeNode(path)}
            style={{ 
              cursor: hasChildren ? 'pointer' : 'default',
              color: '#95a5a6',
              userSelect: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            {hasChildren && (
              <span style={{ 
                fontSize: '10px', 
                transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                transition: 'transform 0.1s ease'
              }}>
                ▶
              </span>
            )}
            [{data.length}]
          </span>
          {isExpanded && hasChildren && (
            <div style={{ marginLeft: '16px', borderLeft: '1px solid #404040', paddingLeft: '8px' }}>
              {data.map((item, index) => (
                <div key={index} style={{ margin: '2px 0', display: 'flex', alignItems: 'flex-start' }}>
                  <span style={{ color: '#8e44ad', minWidth: '20px', fontSize: '11px' }}>{index}:</span>
                  <div style={{ marginLeft: '8px' }}>
                    <TreeNode data={item} path={`${path}[${index}]`} depth={depth + 1} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    if (typeof data === 'object') {
      const entries = Object.entries(data);
      if (!hasChildren) {
        return <span style={{ color: '#95a5a6' }}>{'{}'}</span>;
      }

      return (
        <div>
          <span 
            onClick={() => hasChildren && toggleTreeNode(path)}
            style={{ 
              cursor: hasChildren ? 'pointer' : 'default',
              color: '#95a5a6',
              userSelect: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            {hasChildren && (
              <span style={{ 
                fontSize: '10px', 
                transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                transition: 'transform 0.1s ease'
              }}>
                ▶
              </span>
            )}
            {'{'}  {!isExpanded && `${entries.length} ${entries.length === 1 ? 'property' : 'properties'}`} {'}'}
          </span>
          {isExpanded && hasChildren && (
            <div style={{ marginLeft: '16px', borderLeft: '1px solid #404040', paddingLeft: '8px' }}>
              {entries.map(([key, value]) => (
                <div key={key} style={{ margin: '2px 0', display: 'flex', alignItems: 'flex-start' }}>
                  <span style={{ color: "var(--dt-status-error)", fontSize: '11px', minWidth: 'fit-content' }}>&quot;{key}&quot;:</span>
                  <div style={{ marginLeft: '8px' }}>
                    <TreeNode data={value} path={`${path}.${key}`} depth={depth + 1} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    return <span style={{ color: '#ecf0f1' }}>{String(data)}</span>;
  };

  const renderJson = (data: unknown, depth = 0): React.ReactNode => {
    if (data === null || data === undefined) {
      return <span style={{ color: '#7f8c8d' }}>null</span>;
    }

    if (typeof data === 'string') {
      // Check for special placeholder strings
      if (data.startsWith('[') && data.endsWith(']')) {
        return <span style={{ color: '#95a5a6', fontStyle: 'italic' }}>{data}</span>;
      }
      return <span style={{ color: '#27ae60' }}>&quot;{data}&quot;</span>;
    }

    if (typeof data === 'number') {
      return <span style={{ color: "var(--dt-border-focus)" }}>{String(data)}</span>;
    }

    if (typeof data === 'boolean') {
      return <span style={{ color: '#e67e22' }}>{String(data)}</span>;
    }

    if (Array.isArray(data)) {
      if (depth > 2) {
        return <span style={{ color: '#7f8c8d' }}>[...]</span>;
      }
      return (
        <div style={{ marginLeft: depth > 0 ? '20px' : '0' }}>
          <span style={{ color: '#95a5a6' }}>[</span>
          {data.map((item, index) => (
            <div key={index} style={{ marginLeft: '20px' }}>
              <span style={{ color: '#8e44ad' }}>{index}</span>
              <span style={{ color: '#ecf0f1' }}>: </span>
              {renderJson(item, depth + 1)}
            </div>
          ))}
          <span style={{ color: '#95a5a6' }}>]</span>
        </div>
      );
    }

    if (typeof data === 'object') {
      if (depth > 2) {
        return <span style={{ color: '#7f8c8d' }}>{'{ ... }'}</span>;
      }
      return (
        <div style={{ marginLeft: depth > 0 ? '20px' : '0' }}>
          <span style={{ color: '#95a5a6' }}>{'{'}</span>
          {Object.entries(data).map(([key, value]) => (
            <div key={key} style={{ marginLeft: '20px' }}>
              <span style={{ color: "var(--dt-status-error)" }}>&quot;{key}&quot;</span>
              <span style={{ color: '#ecf0f1' }}>: </span>
              {renderJson(value, depth + 1)}
            </div>
          ))}
          <span style={{ color: '#95a5a6' }}>{'}'}</span>
        </div>
      );
    }

    return <span style={{ color: '#ecf0f1' }}>{String(data)}</span>;
  };

  const filteredStores = Object.entries(stores).filter(([name]) =>
    name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Helper functions for ConfigMenu
  const handleToggleRecording = useCallback(() => {
    setAutoRefresh(prev => !prev);
  }, []);

  const handleTakeSnapshot = useCallback(() => {
    // Force a state request to capture current snapshot
    zustandEventClient.emit('zustand-state-request', undefined);
  }, []);

  const handleClearHistory = useCallback(() => {
    if (confirm('Are you sure you want to clear all store history?')) {
      setActionHistory([]);
    }
  }, []);

  const handleExportState = useCallback(() => {
    const exportData = {
      stores,
      actionHistory,
      timestamp: Date.now()
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `zustand-state-export-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [stores, actionHistory]);

  const handleResetStore = useCallback(() => {
    if (selectedStore && confirm(`Are you sure you want to reset the "${selectedStore}" store?`)) {
      // Emit a reset request for the selected store
      zustandEventClient.emit('zustand-store-reset', { storeName: selectedStore });
    }
  }, [selectedStore]);

  const handleRestoreState = useCallback(() => {
    if (!selectedStore || selectedHistoryIndex === null) return;

    const action = actionHistory[selectedHistoryIndex];
    if (!action || action.storeName !== selectedStore) return;

    if (confirm(`Rewind "${selectedStore}" to this state?`)) {
      zustandEventClient.emit('zustand-restore-state', {
        storeName: selectedStore,
        state: action.nextState,
        timestamp: action.timestamp
      });
    }
  }, [selectedStore, selectedHistoryIndex, actionHistory]);

  const handleJumpToCurrent = useCallback(() => {
    setSelectedHistoryIndex(null);
    setIsTimeTravel(false);
  }, []);

  const handleNavigateHistory = useCallback((direction: 'prev' | 'next') => {
    if (!selectedStore) return;

    const storeHistory = actionHistory.filter(action => action.storeName === selectedStore);
    if (storeHistory.length === 0) return;

    if (selectedHistoryIndex === null) {
      // Start from most recent
      if (direction === 'prev' && storeHistory.length > 0) {
        const lastAction = storeHistory[storeHistory.length - 1];
        setSelectedHistoryIndex(actionHistory.indexOf(lastAction));
        setIsTimeTravel(true);
      }
    } else {
      const currentAction = actionHistory[selectedHistoryIndex];
      const currentStoreIndex = storeHistory.indexOf(currentAction);

      if (direction === 'prev' && currentStoreIndex > 0) {
        const prevAction = storeHistory[currentStoreIndex - 1];
        setSelectedHistoryIndex(actionHistory.indexOf(prevAction));
      } else if (direction === 'next') {
        if (currentStoreIndex < storeHistory.length - 1) {
          const nextAction = storeHistory[currentStoreIndex + 1];
          setSelectedHistoryIndex(actionHistory.indexOf(nextAction));
        } else {
          // Jump back to current
          handleJumpToCurrent();
        }
      }
    }
  }, [selectedStore, selectedHistoryIndex, actionHistory, handleJumpToCurrent]);

  const handleSaveSnapshot = useCallback(() => {
    const name = snapshotName.trim() || `Snapshot ${new Date().toLocaleString()}`;

    zustandEventClient.emit('zustand-save-snapshot', {
      name,
      stores: Object.entries(stores).reduce((acc, [storeName, storeData]) => {
        acc[storeName] = storeData.state;
        return acc;
      }, {} as Record<string, unknown>)
    });

    setSnapshotName('');
    setShowSnapshotDialog(false);
    alert(`Snapshot "${name}" saved successfully!`);
  }, [snapshotName, stores]);

  const toolbarActions = [
    {
      id: 'auto-refresh',
      label: (
        <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <input
            type="checkbox"
            checked={autoRefresh}
            onChange={(e) => setAutoRefresh(e.target.checked)}
          />
          Auto-refresh
        </label>
      ),
      tooltip: 'Toggle automatic refresh of store data',
    },
  ];

  // Convert actions into config menu items
  const configMenuItems: ConfigMenuItem[] = [
    {
      id: 'toggle-recording',
      label: autoRefresh ? 'Stop Recording' : 'Start Recording',
      icon: '🔄',
      onClick: handleToggleRecording,
      shortcut: 'Ctrl+R'
    },
    {
      id: 'take-snapshot',
      label: 'Take Snapshot',
      icon: '📸',
      onClick: handleTakeSnapshot,
      shortcut: 'Ctrl+T'
    },
    {
      id: 'save-snapshot',
      label: 'Save State Snapshot',
      icon: '💾',
      onClick: () => setShowSnapshotDialog(true),
      disabled: Object.keys(stores).length === 0,
      separator: true
    },
    {
      id: 'clear-history',
      label: 'Clear State History',
      icon: '🗑️',
      onClick: handleClearHistory,
      disabled: actionHistory.length === 0,
      shortcut: 'Ctrl+K'
    },
    {
      id: 'export-state',
      label: 'Export State',
      icon: '💾',
      onClick: handleExportState,
      disabled: Object.keys(stores).length === 0,
      shortcut: 'Ctrl+E'
    },
    {
      id: 'reset-store',
      label: 'Reset Store',
      icon: '🔄',
      onClick: handleResetStore,
      disabled: !selectedStore,
      separator: true
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: '⚙️',
      onClick: () => {
        // Open settings - could expand to a settings modal/tab
        alert('Settings functionality to be implemented');
      }
    }
  ];

  return (
    <div style={{ position: 'relative', height: '100%' }}>
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Toolbar
        title="🔍 Zustand Store Inspector"
        showSearch={true}
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search stores..."
        actions={toolbarActions}
        showClear={true}
        onClear={() => setActionHistory([])}
        size="md"
        variant="default"
      />

      <div style={{ display: 'flex', gap: '10px', flex: 1, overflow: 'hidden' }}>
        {/* Store List - Left Side */}
        <div style={{ flex: '0 0 250px', borderRight: '1px solid #3c3c3c' }}>
          <div style={{ padding: '8px 10px', borderBottom: "1px solid var(--dt-border-primary)" }}>
            <h4 style={{ margin: '0', color: '#9cdcfe', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              Stores 
              <Badge variant="outline" size="sm">
                {filteredStores.length}
              </Badge>
            </h4>
          </div>
          <ScrollableContainer style={{ height: '100%', padding: '10px' }} autoHideScrollbar={true}>
            {filteredStores.map(([name, store]) => {
              const storeHistory = actionHistory.filter(action => action.storeName === name);
              const isCollapsed = collapsedStores.has(name);
              
              return (
                <div key={name} style={{ marginBottom: '10px' }}>
                  <div 
                    onClick={() => toggleStoreCollapse(name)}
                    style={{ 
                      fontWeight: '500', 
                      color: "var(--dt-accent-secondary)", 
                      marginBottom: '4px',
                      padding: '4px 8px',
                      background: "var(--dt-bg-tertiary)",
                      borderRadius: '3px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <span>{isCollapsed ? '▸' : '▾'} {name}</span>
                    <Badge variant="outline" size="xs">
                      {storeHistory.length + 1}
                    </Badge>
                  </div>
                  
                  {!isCollapsed && (
                    <>
                      {/* Current state entry */}
                      <div
                        onClick={() => {
                          setSelectedStore(name);
                          setSelectedHistoryIndex(null);
                        }}
                        style={{
                          padding: '4px 8px',
                          margin: '2px 0 2px 12px',
                          borderRadius: '3px',
                          background: selectedStore === name && selectedHistoryIndex === null ? '#094771' : '#252526',
                          cursor: 'pointer',
                          border: '1px solid',
                          borderColor: selectedStore === name && selectedHistoryIndex === null ? '#007acc' : 'transparent',
                          fontSize: '11px'
                        }}
                      >
                        <div style={{ color: "var(--dt-text-primary)", fontWeight: '500', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          Current
                          <StatusIndicator 
                            status="success" 
                            size="xs" 
                            label="Current"
                          />
                        </div>
                        <div style={{ fontSize: '10px', color: "var(--dt-text-secondary)" }}>
                          {countProperties(store.state)} properties
                        </div>
                      </div>
                      
                      {/* History entries for this store */}
                      {storeHistory
                        .slice(0, 10)
                        .map((action, index) => (
                          <div
                            key={`${action.timestamp}-${index}`}
                            onClick={() => {
                              setSelectedStore(name);
                              setSelectedHistoryIndex(actionHistory.indexOf(action));
                            }}
                            style={{
                              padding: '4px 8px',
                              margin: '2px 0 2px 12px',
                              borderRadius: '3px',
                              background: selectedStore === name && selectedHistoryIndex === actionHistory.indexOf(action) ? '#094771' : '#252526',
                              cursor: 'pointer',
                              border: '1px solid',
                              borderColor: selectedStore === name && selectedHistoryIndex === actionHistory.indexOf(action) ? '#007acc' : 'transparent',
                              fontSize: '11px'
                            }}
                          >
                            <div style={{ color: "var(--dt-text-secondary)", fontSize: '10px' }}>
                              {new Date(action.timestamp).toLocaleTimeString()}
                            </div>
                            <div style={{ fontSize: '10px', color: "var(--dt-text-secondary)" }}>
                              {countProperties(action.nextState)} properties
                            </div>
                          </div>
                        ))}
                    </>
                  )}
                </div>
              );
            })}
          </ScrollableContainer>
        </div>

        {/* Right Panel with Tabs */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {selectedStore && stores[selectedStore] ? (
            <>
              <Tabs
                tabs={[
                  { id: 'state', label: 'State' },
                  { id: 'diff', label: 'Diff' }
                ]}
                activeTab={activeTab}
                onTabChange={(tabId) => setActiveTab(tabId as 'state' | 'diff')}
                variant="underline"
                size="md"
              />

              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                {/* Time-travel banner */}
                {selectedHistoryIndex !== null && (
                  <div style={{
                    background: '#2d4f7c',
                    padding: '8px 12px',
                    borderBottom: '2px solid #007acc',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '12px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#9cdcfe' }}>
                      <span style={{ fontSize: '16px' }}>⏱️</span>
                      <span style={{ fontWeight: 'bold' }}>Time-Travel Mode</span>
                      <span style={{ color: "var(--dt-text-primary)" }}>
                        Viewing state from {new Date(actionHistory[selectedHistoryIndex].timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => handleNavigateHistory('prev')}
                        disabled={(() => {
                          const storeHistory = actionHistory.filter(a => a.storeName === selectedStore);
                          const currentAction = actionHistory[selectedHistoryIndex];
                          const currentIndex = storeHistory.indexOf(currentAction);
                          return currentIndex === 0;
                        })()}
                        style={{
                          padding: '4px 8px',
                          fontSize: '11px',
                          border: "1px solid var(--dt-border-primary)",
                          background: "var(--dt-bg-tertiary)",
                          color: "var(--dt-text-primary)",
                          cursor: 'pointer',
                          borderRadius: '3px',
                          opacity: (() => {
                            const storeHistory = actionHistory.filter(a => a.storeName === selectedStore);
                            const currentAction = actionHistory[selectedHistoryIndex];
                            const currentIndex = storeHistory.indexOf(currentAction);
                            return currentIndex === 0 ? 0.5 : 1;
                          })()
                        }}
                        title="Navigate to previous state"
                      >
                        ◀ Prev
                      </button>
                      <button
                        onClick={() => handleNavigateHistory('next')}
                        style={{
                          padding: '4px 8px',
                          fontSize: '11px',
                          border: "1px solid var(--dt-border-primary)",
                          background: "var(--dt-bg-tertiary)",
                          color: "var(--dt-text-primary)",
                          cursor: 'pointer',
                          borderRadius: '3px'
                        }}
                        title="Navigate to next state or return to current"
                      >
                        Next ▶
                      </button>
                      <button
                        onClick={handleRestoreState}
                        style={{
                          padding: '4px 12px',
                          fontSize: '11px',
                          border: "1px solid var(--dt-border-primary)",
                          background: '#1e5f1e',
                          color: "var(--dt-accent-secondary)",
                          cursor: 'pointer',
                          borderRadius: '3px',
                          fontWeight: 'bold'
                        }}
                        title="Rewind store to this state"
                      >
                        🔄 Rewind to Here
                      </button>
                      <button
                        onClick={handleJumpToCurrent}
                        style={{
                          padding: '4px 8px',
                          fontSize: '11px',
                          border: "1px solid var(--dt-border-primary)",
                          background: "var(--dt-bg-tertiary)",
                          color: "var(--dt-text-primary)",
                          cursor: 'pointer',
                          borderRadius: '3px'
                        }}
                        title="Return to current state"
                      >
                        ✕ Exit
                      </button>
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px' }}>
                  <div style={{ fontSize: '12px', color: '#9cdcfe' }}>
                    {activeTab === 'state' ? (
                      selectedHistoryIndex !== null
                        ? `Historical State - ${new Date(actionHistory[selectedHistoryIndex].timestamp).toLocaleTimeString()}`
                        : 'Current State'
                    ) : (
                      selectedHistoryIndex !== null
                        ? `Changes at ${new Date(actionHistory[selectedHistoryIndex].timestamp).toLocaleTimeString()}`
                        : 'Changes since last action'
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => {
                        const dataToShow = selectedHistoryIndex !== null 
                          ? actionHistory[selectedHistoryIndex].nextState 
                          : stores[selectedStore].state;
                        copyToClipboard(dataToShow, selectedStore);
                      }}
                      style={{
                        padding: '4px 8px',
                        fontSize: '11px',
                        border: "1px solid var(--dt-border-primary)",
                        background: copySuccess === selectedStore ? '#1e5f1e' : '#2d2d30',
                        color: copySuccess === selectedStore ? '#4ec9b0' : '#cccccc',
                        cursor: 'pointer',
                        borderRadius: '3px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      {copySuccess === selectedStore ? '✓ Copied!' : '📋 Copy'}
                    </button>
                    
                    {activeTab === 'state' && (
                      <button
                        onClick={() => toggleStateExpansion(selectedStore)}
                        style={{
                          padding: '4px 8px',
                          fontSize: '11px',
                          border: "1px solid var(--dt-border-primary)",
                          background: "var(--dt-bg-tertiary)",
                          color: "var(--dt-text-primary)",
                          cursor: 'pointer',
                          borderRadius: '3px'
                        }}
                      >
                        {expandedStates.has(selectedStore) ? 'JSON View' : 'Tree View'}
                      </button>
                    )}
                  </div>
                </div>

                <ScrollableContainer
                  style={{ height: '100%', flex: 1 }}
                  autoHideScrollbar={true}
                >
                  {activeTab === 'state' ? (
                    expandedStates.has(selectedStore) ? (
                      <div style={{ fontSize: '12px' }}>
                        <TreeNode 
                          data={selectedHistoryIndex !== null 
                            ? actionHistory[selectedHistoryIndex].nextState 
                            : stores[selectedStore].state
                          }
                          path={selectedStore || 'root'}
                        />
                      </div>
                    ) : (
                      <pre style={{ margin: 0, color: "var(--dt-text-primary)" }}>
                        {JSON.stringify(
                          selectedHistoryIndex !== null 
                            ? actionHistory[selectedHistoryIndex].nextState 
                            : stores[selectedStore].state, 
                          null, 
                          2
                        )}
                      </pre>
                    )
                  ) : (
                    <div>
                      {(() => {
                        // Get the diff data based on selection
                        let prevState, nextState;
                        
                        if (selectedHistoryIndex !== null) {
                          prevState = actionHistory[selectedHistoryIndex].prevState;
                          nextState = actionHistory[selectedHistoryIndex].nextState;
                        } else {
                          const storeHistory = actionHistory.filter(a => a.storeName === selectedStore);
                          if (storeHistory.length > 0) {
                            const lastAction = storeHistory[storeHistory.length - 1];
                            prevState = lastAction.nextState;
                            nextState = stores[selectedStore].state;
                          } else {
                            prevState = {};
                            nextState = stores[selectedStore].state;
                          }
                        }
                        
                        return renderDiff(prevState, nextState);
                      })()}
                    </div>
                  )}
                </ScrollableContainer>
              </div>
            </>
          ) : (
            <EmptyState
              title="No Store Selected"
              description="Select a store from the left panel to inspect its state and history"
              icon="📦"
            />
          )}
        </div>
      </div>

      <Footer
        stats={[
          {
            id: 'store-count',
            label: 'Stores',
            value: filteredStores.length,
            tooltip: `${filteredStores.length} stores found`
          },
          {
            id: 'history-count',
            label: 'History',
            value: actionHistory.length,
            tooltip: `${actionHistory.length} actions recorded`
          }
        ]}
        status={{
          type: autoRefresh ? 'connected' : 'disconnected',
          message: autoRefresh ? 'Auto-refresh enabled' : 'Auto-refresh disabled'
        }}
        size="sm"
        variant="compact"
      />
      </div>

      <div style={{ position: 'absolute', top: '12px', right: '12px', zIndex: 10 }}>
        <ConfigMenu items={configMenuItems} size="sm" />
      </div>

      {/* Snapshot Dialog */}
      {showSnapshotDialog && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100
        }}>
          <div style={{
            background: "var(--dt-bg-tertiary)",
            padding: '24px',
            borderRadius: '8px',
            border: "1px solid var(--dt-border-primary)",
            minWidth: '400px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)'
          }}>
            <h3 style={{ margin: '0 0 16px 0', color: '#9cdcfe', fontSize: '16px' }}>
              Save State Snapshot
            </h3>
            <p style={{ margin: '0 0 12px 0', color: "var(--dt-text-primary)", fontSize: '12px' }}>
              Create a snapshot of all store states that you can restore later.
            </p>
            <input
              type="text"
              value={snapshotName}
              onChange={(e) => setSnapshotName(e.target.value)}
              placeholder="Snapshot name (optional)"
              style={{
                width: '100%',
                padding: '8px',
                background: "var(--dt-bg-primary)",
                border: "1px solid var(--dt-border-primary)",
                color: "var(--dt-text-primary)",
                borderRadius: '4px',
                fontSize: '12px',
                marginBottom: '16px',
                boxSizing: 'border-box'
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleSaveSnapshot();
                }
              }}
              autoFocus
            />
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowSnapshotDialog(false);
                  setSnapshotName('');
                }}
                style={{
                  padding: '8px 16px',
                  background: "var(--dt-bg-tertiary)",
                  border: "1px solid var(--dt-border-primary)",
                  color: "var(--dt-text-primary)",
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSnapshot}
                style={{
                  padding: '8px 16px',
                  background: "var(--dt-border-focus)",
                  border: "1px solid var(--dt-border-focus)",
                  color: "var(--dt-text-on-primary)",
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}
              >
                Save Snapshot
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function ZustandDevToolsPanel(props: ZustandDevToolsPanelProps = {}) {
  const { theme = "auto" } = props

  const resolvedTheme = useMemo(() => {
    if (theme === "auto") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
    }
    return theme
  }, [theme])

  return (
    <ThemeProvider defaultTheme={resolvedTheme}>
      <ZustandDevToolsPanelInner />
    </ThemeProvider>
  )
}
