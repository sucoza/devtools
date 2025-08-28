import React, { useState, useEffect, useCallback } from 'react';
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
  } catch (e) {
    // Ignore localStorage errors
  }
};

const loadUIState = (): Partial<ZustandUIState> => {
  try {
    const saved = localStorage.getItem(ZUSTAND_UI_STATE_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch (e) {
    return {};
  }
};

export function ZustandDevToolsPanel() {
  // Load saved UI state
  const savedState = loadUIState();
  
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
    const unsubscribeRegister = zustandEventClient.on('zustand-store-registered', (event: any) => {
      console.log(`Store registered: ${event.payload.storeName}`);
    });

    // Subscribe to store actions
    const unsubscribeAction = zustandEventClient.on('zustand-store-action', (event: any) => {
      if (autoRefresh) {
        setActionHistory(prev => [...prev, event.payload].slice(-50)); // Keep last 50 actions
      }
    });

    // Request initial state when component mounts
    zustandEventClient.emit('zustand-state-request', undefined);

    return () => {
      unsubscribeState();
      unsubscribeStateResponse();
      unsubscribeRegister();
      unsubscribeAction();
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
          <span style={{ background: '#1e3a28', color: '#4ec9b0' }}>
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
                  <span style={{ color: '#4ec9b0' }}>+ "{key}": {renderJson(next[key])}</span>
                </div>
              );
            } else if (!hasInNext) {
              // Removed property
              return (
                <div key={key} style={{ marginLeft: '20px', background: '#3c2415' }}>
                  <span style={{ color: '#f48771', textDecoration: 'line-through' }}>- "{key}": {renderJson(prev[key])}</span>
                </div>
              );
            } else if (JSON.stringify(prev[key]) !== JSON.stringify(next[key])) {
              // Modified property
              return (
                <div key={key} style={{ marginLeft: '20px' }}>
                  <span style={{ color: '#e74c3c' }}>"{key}"</span>
                  <span style={{ color: '#ecf0f1' }}>: </span>
                  {renderDiff(prev[key], next[key], `${path}.${key}`)}
                </div>
              );
            } else {
              // Unchanged property
              return (
                <div key={key} style={{ marginLeft: '20px' }}>
                  <span style={{ color: '#e74c3c' }}>"{key}"</span>
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
        <span style={{ background: '#1e3a28', color: '#4ec9b0' }}>
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
      return <span style={{ color: '#27ae60' }}>"<span style={{ wordBreak: 'break-all' }}>{data}</span>"</span>;
    }

    if (typeof data === 'number') {
      return <span style={{ color: '#3498db' }}>{String(data)}</span>;
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
                  <span style={{ color: '#e74c3c', fontSize: '11px', minWidth: 'fit-content' }}>"{key}":</span>
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
      return <span style={{ color: '#27ae60' }}>"{data}"</span>;
    }

    if (typeof data === 'number') {
      return <span style={{ color: '#3498db' }}>{String(data)}</span>;
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
              <span style={{ color: '#e74c3c' }}>"{key}"</span>
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

  return (
    <div style={{ 
      padding: '10px', 
      fontFamily: '"SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, "Courier New", monospace', 
      fontSize: '12px',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: '#1e1e1e',
      color: '#d4d4d4'
    }}>
      <div style={{ marginBottom: '10px', borderBottom: '1px solid #3c3c3c', paddingBottom: '10px' }}>
        <h3 style={{ margin: '0 0 10px 0', color: '#cccccc', fontSize: '14px', fontWeight: '600' }}>
          🔍 Zustand Store Inspector
        </h3>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Search stores..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              padding: '4px 8px',
              borderRadius: '4px',
              border: '1px solid #3c3c3c',
              background: '#252526',
              color: '#cccccc',
              flex: 1
            }}
          />
          <label style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#cccccc' }}>
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            Auto-refresh
          </label>
          <button
            onClick={() => setActionHistory([])}
            style={{
              padding: '4px 8px',
              borderRadius: '4px',
              border: '1px solid #3c3c3c',
              background: '#2d2d30',
              color: '#cccccc',
              cursor: 'pointer'
            }}
          >
            Clear History
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '10px', flex: 1, overflow: 'hidden' }}>
        {/* Action History - Left Side */}
        <div style={{ 
          flex: '0 0 250px', 
          borderRight: '1px solid #3c3c3c',
          paddingRight: '10px',
          overflowY: 'auto'
        }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#9cdcfe', fontSize: '12px' }}>
            Stores ({filteredStores.length})
          </h4>
          {filteredStores.map(([name, store]) => {
            const storeHistory = actionHistory.filter(action => action.storeName === name);
            const isCollapsed = collapsedStores.has(name);
            
            return (
              <div key={name} style={{ marginBottom: '10px' }}>
                <div 
                  onClick={() => toggleStoreCollapse(name)}
                  style={{ 
                    fontWeight: '500', 
                    color: '#4ec9b0', 
                    marginBottom: '4px',
                    padding: '4px 8px',
                    background: '#2d2d30',
                    borderRadius: '3px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <span>{isCollapsed ? '▸' : '▾'} {name}</span>
                  <span style={{ fontSize: '10px', color: '#969696' }}>
                    {storeHistory.length + 1} entries
                  </span>
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
                      <div style={{ color: '#cccccc', fontWeight: '500' }}>Current</div>
                      <div style={{ fontSize: '10px', color: '#969696' }}>
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
                          <div style={{ color: '#969696', fontSize: '10px' }}>
                            {new Date(action.timestamp).toLocaleTimeString()}
                          </div>
                          <div style={{ fontSize: '10px', color: '#969696' }}>
                            {countProperties(action.nextState)} properties
                          </div>
                        </div>
                      ))}
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* Right Panel with Tabs */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {selectedStore && stores[selectedStore] ? (
            <>
              {/* Tab Header */}
              <div style={{ display: 'flex', borderBottom: '1px solid #3c3c3c', marginBottom: '10px' }}>
                <button
                  onClick={() => setActiveTab('state')}
                  style={{
                    padding: '6px 16px',
                    background: activeTab === 'state' ? '#1e1e1e' : 'transparent',
                    border: 'none',
                    borderBottom: activeTab === 'state' ? '2px solid #007acc' : '2px solid transparent',
                    color: activeTab === 'state' ? '#cccccc' : '#969696',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: '500'
                  }}
                >
                  State
                </button>
                <button
                  onClick={() => setActiveTab('diff')}
                  style={{
                    padding: '6px 16px',
                    background: activeTab === 'diff' ? '#1e1e1e' : 'transparent',
                    border: 'none',
                    borderBottom: activeTab === 'diff' ? '2px solid #007acc' : '2px solid transparent',
                    color: activeTab === 'diff' ? '#cccccc' : '#969696',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: '500'
                  }}
                >
                  Diff
                </button>
                <div style={{ flex: 1 }} />
                {/* Copy button */}
                <button
                  onClick={() => {
                    const dataToShow = selectedHistoryIndex !== null 
                      ? actionHistory[selectedHistoryIndex].nextState 
                      : stores[selectedStore].state;
                    copyToClipboard(dataToShow, selectedStore);
                  }}
                  style={{
                    padding: '4px 12px',
                    fontSize: '11px',
                    border: '1px solid #3c3c3c',
                    background: copySuccess === selectedStore ? '#1e5f1e' : '#2d2d30',
                    color: copySuccess === selectedStore ? '#4ec9b0' : '#cccccc',
                    cursor: 'pointer',
                    borderRadius: '3px',
                    margin: '2px 4px',
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
                      padding: '4px 12px',
                      fontSize: '11px',
                      border: '1px solid #3c3c3c',
                      background: '#2d2d30',
                      color: '#cccccc',
                      cursor: 'pointer',
                      borderRadius: '3px',
                      margin: '2px 8px'
                    }}
                  >
                    {expandedStates.has(selectedStore) ? 'JSON View' : 'Tree View'}
                  </button>
                )}
              </div>

              {/* Tab Content */}
              <div style={{ 
                flex: 1, 
                overflowY: 'auto',
                background: '#252526',
                padding: '12px',
                borderRadius: '4px',
                border: '1px solid #3c3c3c'
              }}>
                {activeTab === 'state' ? (
                  // State Tab - Show current or selected historical state
                  <>
                    <h5 style={{ margin: '0 0 10px 0', color: '#9cdcfe', fontSize: '12px' }}>
                      {selectedHistoryIndex !== null 
                        ? `Historical State - ${new Date(actionHistory[selectedHistoryIndex].timestamp).toLocaleTimeString()}`
                        : 'Current State'
                      }
                    </h5>
                    {expandedStates.has(selectedStore) 
                      ? (
                          <div style={{ fontSize: '12px' }}>
                            <TreeNode 
                              data={selectedHistoryIndex !== null 
                                ? actionHistory[selectedHistoryIndex].nextState 
                                : stores[selectedStore].state
                              }
                              path={selectedStore || 'root'}
                            />
                          </div>
                        )
                      : (
                        <pre style={{ margin: 0, color: '#d4d4d4' }}>
                          {JSON.stringify(
                            selectedHistoryIndex !== null 
                              ? actionHistory[selectedHistoryIndex].nextState 
                              : stores[selectedStore].state, 
                            null, 
                            2
                          )}
                        </pre>
                      )
                    }
                  </>
                ) : (
                  // Diff Tab - Show inline diff
                  <>
                    {(() => {
                      // Get the diff data based on selection
                      let prevState, nextState, timeLabel;
                      
                      if (selectedHistoryIndex !== null) {
                        // Historical entry selected - show that diff
                        prevState = actionHistory[selectedHistoryIndex].prevState;
                        nextState = actionHistory[selectedHistoryIndex].nextState;
                        timeLabel = `Changes at ${new Date(actionHistory[selectedHistoryIndex].timestamp).toLocaleTimeString()}`;
                      } else {
                        // Current selected - compare with last action for this store
                        const storeHistory = actionHistory.filter(a => a.storeName === selectedStore);
                        if (storeHistory.length > 0) {
                          const lastAction = storeHistory[storeHistory.length - 1];
                          prevState = lastAction.nextState;
                          nextState = stores[selectedStore].state;
                          timeLabel = 'Changes since last action';
                        } else {
                          // No history - show initial state
                          prevState = {};
                          nextState = stores[selectedStore].state;
                          timeLabel = 'Initial state';
                        }
                      }
                      
                      return (
                        <>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                            <h5 style={{ margin: 0, color: '#9cdcfe', fontSize: '12px' }}>
                              {timeLabel}
                            </h5>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button
                                onClick={() => copyToClipboard(prevState, `${selectedStore}-prev`)}
                                style={{
                                  padding: '2px 8px',
                                  fontSize: '10px',
                                  border: '1px solid #3c3c3c',
                                  background: copySuccess === `${selectedStore}-prev` ? '#1e5f1e' : '#2d2d30',
                                  color: copySuccess === `${selectedStore}-prev` ? '#4ec9b0' : '#cccccc',
                                  cursor: 'pointer',
                                  borderRadius: '2px'
                                }}
                              >
                                {copySuccess === `${selectedStore}-prev` ? '✓ Prev' : 'Copy Prev'}
                              </button>
                              <button
                                onClick={() => copyToClipboard(nextState, `${selectedStore}-next`)}
                                style={{
                                  padding: '2px 8px',
                                  fontSize: '10px',
                                  border: '1px solid #3c3c3c',
                                  background: copySuccess === `${selectedStore}-next` ? '#1e5f1e' : '#2d2d30',
                                  color: copySuccess === `${selectedStore}-next` ? '#4ec9b0' : '#cccccc',
                                  cursor: 'pointer',
                                  borderRadius: '2px'
                                }}
                              >
                                {copySuccess === `${selectedStore}-next` ? '✓ Next' : 'Copy Next'}
                              </button>
                            </div>
                          </div>
                          <div>
                            {renderDiff(prevState, nextState)}
                          </div>
                        </>
                      );
                    })()}
                  </>
                )}
              </div>
            </>
          ) : (
            <div style={{ color: '#969696', textAlign: 'center', marginTop: '20px' }}>
              Select a store to inspect
            </div>
          )}
        </div>
      </div>
    </div>
  );
}