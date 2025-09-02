import React from 'react';
import { useDevToolsSelector } from '../core/devtools-store';
import { createWebSocketSignalRDevToolsClient } from '../core/devtools-client';
import { TabNavigation } from './TabNavigation';
import { WebSocketPanel } from './WebSocketPanel';
import { SignalRPanel } from './SignalRPanel';
import { PerformancePanel } from './PerformancePanel';
import { ConnectionDetails } from './ConnectionDetails';
import { MessageDetails } from './MessageDetails';
import { FilterPanel } from './FilterPanel';
import { clsx } from 'clsx';

export interface WebSocketSignalRDevToolsPanelProps {
  className?: string;
  height?: number;
  theme?: 'light' | 'dark' | 'auto';
}

export function WebSocketSignalRDevToolsPanel({ 
  className,
  height = 600,
  theme = 'auto'
}: WebSocketSignalRDevToolsPanelProps) {
  // Use selective subscriptions to avoid re-renders
  const selectedTab = useDevToolsSelector(state => state.ui.selectedTab);
  const showFilters = useDevToolsSelector(state => state.ui.showFilters);
  const uiTheme = useDevToolsSelector(state => state.ui.theme);
  const selectedConnectionId = useDevToolsSelector(state => state.ui.selectedConnectionId);
  const selectedMessageId = useDevToolsSelector(state => state.ui.selectedMessageId);
  const wsRecording = useDevToolsSelector(state => state.websocket.isRecording);
  const srRecording = useDevToolsSelector(state => state.signalr.isRecording);
  
  const client = React.useMemo(() => createWebSocketSignalRDevToolsClient(), []);

  React.useEffect(() => {
    if (theme !== 'auto') {
      client.setTheme(theme);
    }
  }, [client, theme]);

  const renderActivePanel = () => {
    switch (selectedTab) {
      case 'websocket':
        return <WebSocketPanel />;
      case 'signalr':
        return <SignalRPanel />;
      case 'performance':
        return <PerformancePanel />;
      default:
        return <WebSocketPanel />;
    }
  };

  return (
    <div 
      className={clsx(
        'websocket-signalr-devtools',
        `theme-${uiTheme}`,
        className
      )}
      style={{ height }}
    >
      <div className="devtools-header">
        <TabNavigation />
        <div className="devtools-actions">
          <button
            onClick={client.toggleFilters}
            className={clsx('btn btn-sm', {
              'active': showFilters
            })}
            title="Toggle Filters"
          >
            🔍
          </button>
          <button
            onClick={() => {
              if (selectedTab === 'websocket') {
                client.clearWebSocketData();
              } else if (selectedTab === 'signalr') {
                client.clearSignalRData();
              }
            }}
            className="btn btn-sm"
            title="Clear Data"
          >
            🗑️
          </button>
          <button
            onClick={() => {
              if (selectedTab === 'websocket') {
                client.toggleWebSocketRecording();
              } else if (selectedTab === 'signalr') {
                client.toggleSignalRRecording();
              }
            }}
            className={clsx('btn btn-sm', {
              'recording': selectedTab === 'websocket' 
                ? wsRecording 
                : srRecording
            })}
            title="Toggle Recording"
          >
            {selectedTab === 'websocket' 
              ? (wsRecording ? '⏸️' : '▶️')
              : (srRecording ? '⏸️' : '▶️')
            }
          </button>
        </div>
      </div>

      <div className="devtools-body">
        {showFilters && (
          <div className="devtools-filters">
            <FilterPanel />
          </div>
        )}
        
        <div className="devtools-content">
          <div className="devtools-main">
            {renderActivePanel()}
          </div>
          
          {selectedConnectionId && (
            <div className="devtools-sidebar">
              <ConnectionDetails 
                connectionId={selectedConnectionId}
                type={selectedTab as 'websocket' | 'signalr'}
              />
            </div>
          )}
          
          {selectedMessageId && (
            <div className="devtools-message-details">
              <MessageDetails 
                messageId={selectedMessageId}
                type={selectedTab as 'websocket' | 'signalr'}
              />
            </div>
          )}
        </div>
      </div>

      <style>{`
        .websocket-signalr-devtools {
          display: flex;
          flex-direction: column;
          background: var(--devtools-bg);
          color: var(--devtools-color);
          font-family: system-ui, -apple-system, sans-serif;
          font-size: 13px;
          border: 1px solid var(--devtools-border);
        }

        .devtools-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 12px;
          background: var(--devtools-header-bg);
          border-bottom: 1px solid var(--devtools-border);
        }

        .devtools-actions {
          display: flex;
          gap: 8px;
        }

        .devtools-body {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .devtools-filters {
          border-bottom: 1px solid var(--devtools-border);
          background: var(--devtools-panel-bg);
        }

        .devtools-content {
          flex: 1;
          display: flex;
          overflow: hidden;
        }

        .devtools-main {
          flex: 1;
          overflow: hidden;
        }

        .devtools-sidebar {
          width: 300px;
          border-left: 1px solid var(--devtools-border);
          background: var(--devtools-panel-bg);
        }

        .devtools-message-details {
          width: 400px;
          border-left: 1px solid var(--devtools-border);
          background: var(--devtools-panel-bg);
        }

        .btn {
          padding: 4px 8px;
          border: 1px solid var(--devtools-border);
          background: var(--devtools-button-bg);
          color: var(--devtools-color);
          cursor: pointer;
          border-radius: 3px;
          font-size: 11px;
        }

        .btn:hover {
          background: var(--devtools-button-hover-bg);
        }

        .btn.active {
          background: var(--devtools-accent);
          color: var(--devtools-accent-contrast);
        }

        .btn.recording {
          background: var(--devtools-success);
          color: white;
        }

        .btn-sm {
          padding: 2px 6px;
          font-size: 10px;
        }

        /* Theme variables */
        .theme-light {
          --devtools-bg: #ffffff;
          --devtools-color: #333333;
          --devtools-border: #e1e1e1;
          --devtools-header-bg: #f8f9fa;
          --devtools-panel-bg: #f5f6f7;
          --devtools-button-bg: #ffffff;
          --devtools-button-hover-bg: #f0f0f0;
          --devtools-accent: #007acc;
          --devtools-accent-contrast: #ffffff;
          --devtools-success: #28a745;
          --devtools-warning: #ffc107;
          --devtools-danger: #dc3545;
        }

        .theme-dark {
          --devtools-bg: #1e1e1e;
          --devtools-color: #cccccc;
          --devtools-border: #3e3e42;
          --devtools-header-bg: #2d2d30;
          --devtools-panel-bg: #252526;
          --devtools-button-bg: #3c3c3c;
          --devtools-button-hover-bg: #464647;
          --devtools-accent: #0e639c;
          --devtools-accent-contrast: #ffffff;
          --devtools-success: #107c10;
          --devtools-warning: #ffb900;
          --devtools-danger: #d13438;
        }

        .theme-auto {
          --devtools-bg: #ffffff;
          --devtools-color: #333333;
          --devtools-border: #e1e1e1;
          --devtools-header-bg: #f8f9fa;
          --devtools-panel-bg: #f5f6f7;
          --devtools-button-bg: #ffffff;
          --devtools-button-hover-bg: #f0f0f0;
          --devtools-accent: #007acc;
          --devtools-accent-contrast: #ffffff;
          --devtools-success: #28a745;
          --devtools-warning: #ffc107;
          --devtools-danger: #dc3545;
        }

        @media (prefers-color-scheme: dark) {
          .theme-auto {
            --devtools-bg: #1e1e1e;
            --devtools-color: #cccccc;
            --devtools-border: #3e3e42;
            --devtools-header-bg: #2d2d30;
            --devtools-panel-bg: #252526;
            --devtools-button-bg: #3c3c3c;
            --devtools-button-hover-bg: #464647;
            --devtools-accent: #0e639c;
            --devtools-accent-contrast: #ffffff;
            --devtools-success: #107c10;
            --devtools-warning: #ffb900;
            --devtools-danger: #d13438;
          }
        }
      `}</style>
    </div>
  );
}