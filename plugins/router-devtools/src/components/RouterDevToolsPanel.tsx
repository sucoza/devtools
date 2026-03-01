/**
 * Main Router DevTools Panel Component
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Toolbar,
  Tabs,
  Footer,
  Alert,
  ScrollableContainer,
  ConfigMenu,
  ThemeProvider,
  type Tab
} from '@sucoza/shared-components';
import '@sucoza/shared-components/dist/styles/theme.css';
import { Navigation } from 'lucide-react';
import { routerEventClient } from '../core/router-event-client';
import { 
  NavigationState, 
  NavigationHistoryEntry, 
  RouteInfo, 
  RouteTreeNode,
  RouteParamEditContext 
} from '../types/router';
import { 
  convertToRouteTree, 
  filterRoutes, 
  getRouteStatistics 
} from '../utils/route-tree-utils';
import { createParamEditContext } from '../utils/param-validation';
import { RouteTreeView } from './RouteTreeView';
import { RouteParameterInspector } from './RouteParameterInspector';
import { NavigationTimeline } from './NavigationTimeline';

interface RouterDevToolsState {
  currentState: NavigationState | null;
  routeTree: RouteInfo[];
  navigationHistory: NavigationHistoryEntry[];
  routeTreeNodes: RouteTreeNode[];
  activeTab: 'tree' | 'params' | 'timeline';
  searchQuery: string;
  selectedRouteId: string | null;
  expandedRouteIds: Set<string>;
  paramEditContext: RouteParamEditContext;
  isConnected: boolean;
}

// UI State persistence
const ROUTER_UI_STATE_KEY = 'router-devtools-ui-state';

interface RouterUIState {
  activeTab: 'tree' | 'params' | 'timeline';
  searchQuery: string;
  selectedRouteId: string | null;
  expandedRouteIds: string[];
}

const saveUIState = (state: RouterUIState) => {
  try {
    localStorage.setItem(ROUTER_UI_STATE_KEY, JSON.stringify(state));
  } catch {
    // Ignore localStorage errors
  }
};

const loadUIState = (): Partial<RouterUIState> => {
  try {
    const saved = localStorage.getItem(ROUTER_UI_STATE_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
};

interface RouterDevToolsPanelProps {
  theme?: 'light' | 'dark' | 'auto'
}

function RouterDevToolsPanelInner() {
  // Load saved UI state (lazy initializer — runs only on first render)
  const [savedState] = useState(loadUIState);

  const [state, setState] = useState<RouterDevToolsState>({
    currentState: null,
    routeTree: [],
    navigationHistory: [],
    routeTreeNodes: [],
    activeTab: savedState.activeTab || 'tree',
    searchQuery: savedState.searchQuery || '',
    selectedRouteId: savedState.selectedRouteId || null,
    expandedRouteIds: new Set(savedState.expandedRouteIds || []),
    paramEditContext: createParamEditContext({}, ''),
    isConnected: false
  });

  // Update route tree nodes when state changes
  useEffect(() => {
    if (state.currentState && state.routeTree.length > 0) {
      const nodes = convertToRouteTree(state.routeTree, state.currentState.matches);
      const filteredNodes = filterRoutes(nodes, state.searchQuery);
      
      setState(prevState => ({
        ...prevState,
        routeTreeNodes: filteredNodes,
        paramEditContext: createParamEditContext(
          state.currentState?.matches?.[0]?.params || {},
          state.currentState?.location.search || ''
        )
      }));
    }
  }, [state.currentState, state.routeTree, state.searchQuery]);

  // Set up event listeners
  useEffect(() => {
    // Subscribe to state updates
    const unsubscribeState = routerEventClient.on('router-state-update', (event) => {
      setState(prevState => ({
        ...prevState,
        currentState: event.payload.state,
        routeTree: event.payload.routeTree,
        isConnected: true
      }));
    });

    // Subscribe to navigation events
    const unsubscribeNavigation = routerEventClient.on('router-navigation', (event) => {
      setState(prevState => ({
        ...prevState,
        navigationHistory: [...prevState.navigationHistory, event.payload.entry].slice(-50)
      }));
    });

    // Subscribe to state responses
    const unsubscribeStateResponse = routerEventClient.on('router-state-response', (event) => {
      setState(prevState => ({
        ...prevState,
        currentState: event.payload.state,
        routeTree: event.payload.routeTree,
        navigationHistory: event.payload.history,
        isConnected: true
      }));
    });

    // Subscribe to adapter registration
    const unsubscribeAdapterRegistered = routerEventClient.on('router-adapter-registered', (_event) => {
      // console.log(`Router adapter registered: ${event.payload.routerType}`);
      setState(prevState => ({ ...prevState, isConnected: true }));
    });

    // Request initial state
    routerEventClient.emit('router-state-request', undefined);

    return () => {
      unsubscribeState();
      unsubscribeNavigation();
      unsubscribeStateResponse();
      unsubscribeAdapterRegistered();
    };
  }, []);

  // Save UI state when it changes
  useEffect(() => {
    const currentUIState: RouterUIState = {
      activeTab: state.activeTab,
      searchQuery: state.searchQuery,
      selectedRouteId: state.selectedRouteId,
      expandedRouteIds: Array.from(state.expandedRouteIds)
    };
    saveUIState(currentUIState);
  }, [state.activeTab, state.searchQuery, state.selectedRouteId, state.expandedRouteIds]);

  // Handlers
  const handleTabChange = useCallback((tab: 'tree' | 'params' | 'timeline') => {
    setState(prevState => ({ ...prevState, activeTab: tab }));
  }, []);

  const handleSearchChange = useCallback((query: string) => {
    setState(prevState => ({ ...prevState, searchQuery: query }));
  }, []);

  const handleRouteSelect = useCallback((routeId: string) => {
    setState(prevState => ({ ...prevState, selectedRouteId: routeId }));
  }, []);

  const handleRouteExpand = useCallback((routeId: string) => {
    setState(prevState => {
      const newExpandedIds = new Set(prevState.expandedRouteIds);
      if (newExpandedIds.has(routeId)) {
        newExpandedIds.delete(routeId);
      } else {
        newExpandedIds.add(routeId);
      }
      return { ...prevState, expandedRouteIds: newExpandedIds };
    });
  }, []);

  const handleNavigate = useCallback((to: string, options?: { replace?: boolean; state?: unknown }) => {
    routerEventClient.emit('router-navigate', { to, options });
  }, []);

  const handleParamUpdate = useCallback((params: Record<string, string>) => {
    routerEventClient.emit('router-update-params', { params });
  }, []);

  const handleSearchUpdate = useCallback((search: string) => {
    routerEventClient.emit('router-update-search', { search });
  }, []);

  const handleParamEditContextChange = useCallback((newContext: RouteParamEditContext) => {
    setState(prevState => ({ ...prevState, paramEditContext: newContext }));
  }, []);

  const clearHistory = useCallback(() => {
    setState(prevState => ({ ...prevState, navigationHistory: [] }));
  }, []);

  const exportRoutes = useCallback(() => {
    const exportData = {
      routeTree: state.routeTree,
      navigationHistory: state.navigationHistory,
      currentState: state.currentState,
      timestamp: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    try {
      const link = document.createElement('a');
      link.href = url;
      link.download = `router-devtools-export-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
    } finally {
      URL.revokeObjectURL(url);
    }
  }, [state.routeTree, state.navigationHistory, state.currentState]);

  // ConfigMenu items
  const configMenuItems = [
    {
      id: 'toggle-recording',
      label: 'Toggle Recording',
      icon: '🔄',
      shortcut: 'Ctrl+R',
      onClick: () => {
        // Toggle recording functionality would be implemented here
        console.log('Toggle recording');
      },
    },
    {
      id: 'clear-history',
      label: 'Clear History',
      icon: '🗑️',
      shortcut: 'Ctrl+K',
      onClick: clearHistory,
    },
    {
      id: 'reset-navigation',
      label: 'Reset Navigation',
      icon: '📍',
      onClick: () => {
        setState(prevState => ({
          ...prevState,
          selectedRouteId: null,
          expandedRouteIds: new Set(),
          searchQuery: '',
        }));
      },
    },
    {
      id: 'export-routes',
      label: 'Export Routes',
      icon: '💾',
      shortcut: 'Ctrl+E',
      onClick: exportRoutes,
      separator: true,
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: '⚙️',
      shortcut: 'Ctrl+S',
      onClick: () => {
        // Settings would open a settings dialog or panel
        console.log('Open settings');
      },
    },
  ];

  // Get route statistics
  const routeStats = getRouteStatistics(state.routeTreeNodes);

  if (!state.isConnected) {
    return (
      <div style={{
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}>
        <Alert
          type="warning"
          title="Router DevTools"
          description={
            <div>
              <p>Waiting for router adapter to connect...</p>
              <p style={{ marginTop: '8px', fontSize: '12px' }}>
                Make sure you have registered a router adapter in your application.
              </p>
            </div>
          }
          icon={<Navigation size={20} />}
          showIcon
        />
      </div>
    );
  }

  // Define tabs
  const tabs: Tab[] = [
    {
      id: 'tree',
      label: 'Route Tree',
      icon: <Navigation size={16} />
    },
    {
      id: 'params',
      label: 'Parameters'
    },
    {
      id: 'timeline',
      label: 'Timeline'
    }
  ];

  return (
    <div style={{ position: 'relative', height: '100%' }}>
      <div style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header Toolbar */}
        <Toolbar
          title="🧭 Router DevTools Enhanced"
          subtitle={`${routeStats.totalRoutes} routes • ${routeStats.activeRoutes} active • ${state.navigationHistory.length} history`}
          showSearch
          searchValue={state.searchQuery}
          onSearchChange={handleSearchChange}
          searchPlaceholder="Search routes..."
          size="md"
          variant="default"
        />

      {/* Tab Navigation */}
      <Tabs
        tabs={tabs}
        activeTab={state.activeTab}
        onTabChange={(tabId) => handleTabChange(tabId as 'tree' | 'params' | 'timeline')}
        variant="underline"
        size="md"
        fullWidth={false}
      />

      {/* Tab Content */}
      <ScrollableContainer style={{ flex: 1 }}>
        {state.activeTab === 'tree' && (
          <RouteTreeView
            nodes={state.routeTreeNodes}
            selectedId={state.selectedRouteId}
            expandedIds={state.expandedRouteIds}
            onRouteSelect={handleRouteSelect}
            onRouteExpand={handleRouteExpand}
            onNavigate={handleNavigate}
            currentLocation={state.currentState?.location}
          />
        )}
        
        {state.activeTab === 'params' && (
          <RouteParameterInspector
            currentState={state.currentState}
            editContext={state.paramEditContext}
            onEditContextChange={handleParamEditContextChange}
            onParamUpdate={handleParamUpdate}
            onSearchUpdate={handleSearchUpdate}
            onNavigate={handleNavigate}
          />
        )}
        
        {state.activeTab === 'timeline' && (
          <NavigationTimeline
            history={state.navigationHistory}
            currentState={state.currentState}
            onNavigate={handleNavigate}
            onClearHistory={clearHistory}
          />
        )}
      </ScrollableContainer>
      
      {/* Footer with Statistics */}
      <Footer
        stats={[
          {
            id: 'total-routes',
            label: 'Total Routes',
            value: routeStats.totalRoutes,
            tooltip: 'Total number of defined routes'
          },
          {
            id: 'active-routes',
            label: 'Active Routes',
            value: routeStats.activeRoutes,
            tooltip: 'Number of currently active/matched routes',
            variant: 'success'
          },
          {
            id: 'navigation-count',
            label: 'Navigation Count',
            value: state.navigationHistory.length,
            tooltip: 'Total number of navigation events'
          },
          {
            id: 'error-rate',
            label: 'Error Rate',
            value: `${((state.navigationHistory.filter(h => h.loadingState === 'submitting' && h.duration && h.duration > 5000).length / Math.max(state.navigationHistory.length, 1)) * 100).toFixed(1)}%`,
            tooltip: 'Percentage of navigation attempts that were slow or problematic',
            variant: state.navigationHistory.filter(h => h.loadingState === 'submitting' && h.duration && h.duration > 5000).length > 0 ? 'warning' : 'default'
          }
        ]}
        status={{
          type: state.isConnected ? 'connected' : 'disconnected',
          message: state.isConnected ? 'Router Adapter Connected' : 'Router Adapter Disconnected'
        }}
        size="sm"
        variant="default"
      />
      </div>

      {/* ConfigMenu overlay */}
      <div style={{
        position: 'absolute',
        top: '12px',
        right: '12px',
        zIndex: 10
      }}>
        <ConfigMenu items={configMenuItems} size="sm" />
      </div>
    </div>
  );
}

export function RouterDevToolsPanel(props: RouterDevToolsPanelProps = {}) {
  const { theme = 'auto' } = props

  const resolvedTheme = useMemo(() => {
    if (theme === 'auto') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
    return theme
  }, [theme])

  return (
    <ThemeProvider defaultTheme={resolvedTheme}>
      <RouterDevToolsPanelInner />
    </ThemeProvider>
  )
}