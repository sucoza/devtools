import React from 'react';
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

  const handleFilterChange = (updates: any) => {
    client.updateFilter(selectedTab as 'websocket' | 'signalr', updates);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFilterChange({ searchText: e.target.value || undefined });
  };

  const handleTimeRangeChange = (field: 'start' | 'end', value: string) => {
    if (!value) {
      handleFilterChange({ timeRange: undefined });
      return;
    }

    const timestamp = new Date(value).getTime();
    const currentRange = filter.timeRange || { start: 0, end: Date.now() };
    
    handleFilterChange({
      timeRange: {
        ...currentRange,
        [field]: timestamp
      }
    });
  };

  const clearFilters = () => {
    handleFilterChange({
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

  const getUniqueUrls = () => {
    if (selectedTab === 'websocket') {
      return [...new Set(websocketConnections.map(conn => {
        try {
          return new URL(conn.url).hostname;
        } catch {
          return conn.url;
        }
      }))];
    } else {
      return [...new Set(signalrConnections.map(conn => {
        try {
          return new URL(conn.hubUrl).hostname;
        } catch {
          return conn.hubUrl;
        }
      }))];
    }
  };

  const getHubMethods = () => {
    if (selectedTab !== 'signalr') return [];
    
    const methods = new Set<string>();
    signalrConnections.forEach(conn => {
      conn.hubMethods.forEach((_, methodName) => {
        methods.add(methodName);
      });
    });
    return Array.from(methods);
  };

  return (
    <div className="filter-panel">
      <div className="filter-section">
        <div className="filter-row">
          <div className="filter-group">
            <label htmlFor="search">Search:</label>
            <input
              id="search"
              type="text"
              placeholder="Search messages..."
              value={filter.searchText || ''}
              onChange={handleSearchChange}
              className="filter-input"
            />
          </div>

          <div className="filter-group">
            <label htmlFor="timeStart">From:</label>
            <input
              id="timeStart"
              type="datetime-local"
              value={filter.timeRange?.start ? new Date(filter.timeRange.start).toISOString().slice(0, 16) : ''}
              onChange={(e) => handleTimeRangeChange('start', e.target.value)}
              className="filter-input"
            />
          </div>

          <div className="filter-group">
            <label htmlFor="timeEnd">To:</label>
            <input
              id="timeEnd"
              type="datetime-local"
              value={filter.timeRange?.end ? new Date(filter.timeRange.end).toISOString().slice(0, 16) : ''}
              onChange={(e) => handleTimeRangeChange('end', e.target.value)}
              className="filter-input"
            />
          </div>

          <button onClick={clearFilters} className="clear-btn">
            Clear Filters
          </button>
        </div>

        <div className="filter-row">
          <div className="filter-group">
            <label>States:</label>
            <div className="checkbox-group">
              {getAvailableStates().map(state => (
                <label key={state} className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={filter.states?.includes(state as any) || false}
                    onChange={(e) => {
                      const currentStates = filter.states || [];
                      const newStates = e.target.checked
                        ? [...currentStates, state]
                        : currentStates.filter(s => s !== state);
                      handleFilterChange({ states: newStates.length > 0 ? newStates : undefined });
                    }}
                  />
                  {state}
                </label>
              ))}
            </div>
          </div>

          <div className="filter-group">
            <label>Message Types:</label>
            <div className="checkbox-group">
              {getAvailableMessageTypes().map(type => (
                <label key={type} className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={filter.messageTypes?.includes(type as any) || false}
                    onChange={(e) => {
                      const currentTypes = filter.messageTypes || [];
                      const newTypes = e.target.checked
                        ? [...currentTypes, type]
                        : currentTypes.filter(t => t !== type);
                      handleFilterChange({ messageTypes: newTypes.length > 0 ? newTypes : undefined });
                    }}
                  />
                  {type}
                </label>
              ))}
            </div>
          </div>

          {selectedTab === 'signalr' && (
            <>
              <div className="filter-group">
                <label>Transports:</label>
                <div className="checkbox-group">
                  {getAvailableTransports().map(transport => (
                    <label key={transport} className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={(signalrFilter as any).transports?.includes(transport) || false}
                        onChange={(e) => {
                          const currentTransports = (signalrFilter as any).transports || [];
                          const newTransports = e.target.checked
                            ? [...currentTransports, transport]
                            : currentTransports.filter((t: any) => t !== transport);
                          handleFilterChange({ transports: newTransports.length > 0 ? newTransports : undefined });
                        }}
                      />
                      {transport}
                    </label>
                  ))}
                </div>
              </div>

              <div className="filter-group">
                <label>Hub Methods:</label>
                <div className="checkbox-group">
                  {getHubMethods().slice(0, 10).map(method => (
                    <label key={method} className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={(signalrFilter as any).hubMethods?.includes(method) || false}
                        onChange={(e) => {
                          const currentMethods = (signalrFilter as any).hubMethods || [];
                          const newMethods = e.target.checked
                            ? [...currentMethods, method]
                            : currentMethods.filter((m: any) => m !== method);
                          handleFilterChange({ hubMethods: newMethods.length > 0 ? newMethods : undefined });
                        }}
                      />
                      <span title={method}>
                        {method.length > 20 ? method.substring(0, 20) + '...' : method}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <style jsx>{`
        .filter-panel {
          padding: 16px;
          background: var(--devtools-panel-bg);
        }

        .filter-section {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .filter-row {
          display: flex;
          align-items: flex-start;
          gap: 24px;
          flex-wrap: wrap;
        }

        .filter-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
          min-width: 200px;
        }

        .filter-group label:first-child {
          font-size: 12px;
          font-weight: 600;
          color: var(--devtools-color);
          margin-bottom: 4px;
        }

        .filter-input {
          padding: 6px 8px;
          border: 1px solid var(--devtools-border);
          border-radius: 4px;
          background: var(--devtools-bg);
          color: var(--devtools-color);
          font-size: 12px;
        }

        .filter-input:focus {
          outline: none;
          border-color: var(--devtools-accent);
        }

        .checkbox-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
          max-height: 120px;
          overflow-y: auto;
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          color: var(--devtools-color);
          cursor: pointer;
        }

        .checkbox-label input[type="checkbox"] {
          margin: 0;
        }

        .clear-btn {
          padding: 6px 12px;
          border: 1px solid var(--devtools-border);
          border-radius: 4px;
          background: var(--devtools-button-bg);
          color: var(--devtools-color);
          cursor: pointer;
          font-size: 12px;
          white-space: nowrap;
          height: fit-content;
          margin-top: 20px;
        }

        .clear-btn:hover {
          background: var(--devtools-button-hover-bg);
        }
      `}</style>
    </div>
  );
}