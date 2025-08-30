import React from 'react';
import { FilterPanel as SharedFilterPanel, FilterConfig } from '@sucoza/shared-components';
import { useDevToolsSelector } from '../core/devtools-store';
import { createWebSocketSignalRDevToolsClient } from '../core/devtools-client';

export function FilterPanel() {
  const selectedTab = useDevToolsSelector(state => state.ui.selectedTab);
  const websocketFilter = useDevToolsSelector(state => state.websocket.filter);
  const signalrFilter = useDevToolsSelector(state => state.signalr.filter);
  const websocketConnections = useDevToolsSelector(state => Array.from(state.websocket.connections.values()));
  const signalrConnections = useDevToolsSelector(state => Array.from(state.signalr.connections.values()));
  
  const client = createWebSocketSignalRDevToolsClient();
  const filter = selectedTab === 'websocket' ? websocketFilter : signalrFilter;

  const getAvailableStates = () => {
    if (selectedTab === 'websocket') {
      return ['CONNECTING', 'OPEN', 'CLOSING', 'CLOSED'];
    } else {
      return ['Disconnected', 'Connecting', 'Connected', 'Disconnecting', 'Reconnecting'];
    }
  };

  const getAvailableMessageTypes = () => {
    if (selectedTab === 'websocket') {
      return ['send', 'receive', 'error', 'close', 'open'];
    } else {
      return ['Invocation', 'StreamItem', 'Completion', 'StreamInvocation', 'CancelInvocation', 'Ping', 'Close', 'Handshake'];
    }
  };

  const getAvailableTransports = () => {
    return ['WebSockets', 'ServerSentEvents', 'LongPolling'];
  };

  const getHubMethods = () => {
    if (selectedTab !== 'signalr') return [];
    
    const methods = new Set<string>();
    signalrConnections.forEach(conn => {
      conn.hubMethods.forEach((_, methodName) => {
        methods.add(methodName);
      });
    });
    return Array.from(methods).slice(0, 10); // Limit for UI performance
  };

  // Configure filter options for the shared component
  const filterConfig: FilterConfig = {
    searchText: filter.searchText,
    timeRange: filter.timeRange,
    options: [
      {
        key: 'states',
        label: 'Connection States',
        values: getAvailableStates().map(state => ({ value: state, label: state })),
        multiple: true,
      },
      {
        key: 'messageTypes',
        label: 'Message Types',
        values: getAvailableMessageTypes().map(type => ({ value: type, label: type })),
        multiple: true,
      },
      ...(selectedTab === 'signalr' ? [
        {
          key: 'transports',
          label: 'Transports',
          values: getAvailableTransports().map(transport => ({ value: transport, label: transport })),
          multiple: true,
        },
        {
          key: 'hubMethods',
          label: 'Hub Methods',
          values: getHubMethods().map(method => ({ 
            value: method, 
            label: method.length > 20 ? method.substring(0, 20) + '...' : method 
          })),
          multiple: true,
        }
      ] : []),
    ]
  };

  const handleFilterChange = (updates: Partial<FilterConfig>) => {
    // Map shared component updates back to plugin-specific filter format
    const pluginUpdates: any = {};
    
    if ('searchText' in updates) {
      pluginUpdates.searchText = updates.searchText;
    }
    
    if ('timeRange' in updates) {
      pluginUpdates.timeRange = updates.timeRange;
    }

    // Handle other filter updates
    Object.entries(updates).forEach(([key, value]) => {
      if (key !== 'searchText' && key !== 'timeRange' && key !== 'options') {
        pluginUpdates[key] = value;
      }
    });

    client.updateFilter(selectedTab as 'websocket' | 'signalr', pluginUpdates);
  };

  const clearAllFilters = () => {
    client.updateFilter(selectedTab as 'websocket' | 'signalr', {
      connectionIds: undefined,
      urls: undefined,
      hubUrls: undefined,
      states: undefined,
      messageTypes: undefined,
      hubMethods: undefined,
      transports: undefined,
      timeRange: undefined,
      searchText: undefined,
    });
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-gray-900 dark:text-white">
          {selectedTab === 'websocket' ? 'WebSocket' : 'SignalR'} Filters
        </h3>
      </div>
      
      <SharedFilterPanel
        filter={filterConfig}
        onFilterChange={handleFilterChange}
        onClearFilters={clearAllFilters}
        placeholder="Search messages..."
        className="bg-transparent border-0 p-0"
      />
    </div>
  );
}

export default FilterPanel;