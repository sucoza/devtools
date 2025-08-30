/**
 * Main Router DevTools Panel Component
 */

import React, { useState, useEffect, useCallback } from 'react';
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

export function RouterDevToolsPanel() {
  // Load saved UI state
  const savedState = loadUIState();

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

  // Get route statistics
  const routeStats = getRouteStatistics(state.routeTreeNodes);

  if (!state.isConnected) {
    return (
      <div style={{
        padding: '20px',
        textAlign: 'center',
        color: '#969696',
        fontFamily: '"SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, "Courier New", monospace',
        background: '#1e1e1e',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column'
      }}>
        <div style={{ fontSize: '16px', marginBottom: '10px' }}>Router DevTools</div>
        <div style={{ fontSize: '14px', marginBottom: '20px' }}>
          Waiting for router adapter to connect...
        </div>
        <div style={{ fontSize: '12px', color: '#666' }}>
          Make sure you have registered a router adapter in your application.
        </div>
      </div>
    );
  }

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
      {/* Header */}
      <div style={{ marginBottom: '10px', borderBottom: '1px solid #3c3c3c', paddingBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <h3 style={{ margin: 0, color: '#cccccc', fontSize: '14px', fontWeight: '600' }}>
            🧭 Router DevTools Enhanced
          </h3>
          <div style={{ fontSize: '11px', color: '#969696' }}>
            {routeStats.totalRoutes} routes • {routeStats.activeRoutes} active • {state.navigationHistory.length} history
          </div>
        </div>
        
        {/* Search Bar */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Search routes..."
            value={state.searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            style={{
              padding: '4px 8px',
              borderRadius: '4px',
              border: '1px solid #3c3c3c',
              background: '#252526',
              color: '#cccccc',
              flex: 1,
              fontSize: '11px'
            }}
          />
          <button
            onClick={clearHistory}
            style={{
              padding: '4px 8px',
              borderRadius: '4px',
              border: '1px solid #3c3c3c',
              background: '#2d2d30',
              color: '#cccccc',
              cursor: 'pointer',
              fontSize: '11px'
            }}
          >
            Clear History
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={{ 
        display: 'flex', 
        borderBottom: '1px solid #3c3c3c', 
        marginBottom: '10px',
        gap: '1px'
      }}>
        {[
          { key: 'tree', label: 'Route Tree' },
          { key: 'params', label: 'Parameters' },
          { key: 'timeline', label: 'Timeline' }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => handleTabChange(tab.key as 'tree' | 'params' | 'timeline')}
            style={{
              padding: '8px 16px',
              background: state.activeTab === tab.key ? '#1e1e1e' : 'transparent',
              border: 'none',
              borderBottom: state.activeTab === tab.key ? '2px solid #007acc' : '2px solid transparent',
              color: state.activeTab === tab.key ? '#cccccc' : '#969696',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: '500'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
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
      </div>
    </div>
  );
}