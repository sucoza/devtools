import React from 'react';
import { 
  Tabs,
  StatusIndicator,
  Footer,
  ScrollableContainer,
  Badge
} from '@sucoza/shared-components';
import { useDevToolsSelector } from '../core/devtools-store';
import { createWebSocketSignalRDevToolsClient } from '../core/devtools-client';
import { WebSocketPanel } from './WebSocketPanel';
import { SignalRPanel } from './SignalRPanel';
import { PerformancePanel } from './PerformancePanel';
import { ConnectionDetails } from './ConnectionDetails';
import { MessageDetails } from './MessageDetails';
import { FilterPanel } from './FilterPanel';
import { ConfigMenu, type ConfigMenuItem } from '@sucoza/shared-components';
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

  const websocketMetrics = useDevToolsSelector(state => state.websocket.metrics);
  const signalrMetrics = useDevToolsSelector(state => state.signalr.metrics);

  const tabs = [
    {
      id: 'websocket',
      label: 'WebSocket',
      icon: '🔌',
      badge: websocketMetrics.activeConnections > 0 ? <Badge size="xs" variant="primary">{websocketMetrics.activeConnections}</Badge> : undefined,
      content: <WebSocketPanel />
    },
    {
      id: 'signalr',
      label: 'SignalR',
      icon: '📡',
      badge: signalrMetrics.activeConnections > 0 ? <Badge size="xs" variant="primary">{signalrMetrics.activeConnections}</Badge> : undefined,
      content: <SignalRPanel />
    },
    {
      id: 'performance',
      label: 'Performance',
      icon: '📊',
      content: <PerformancePanel />
    }
  ];

  const wsConnectionsCount = Object.keys(useDevToolsSelector(state => state.websocket.connections)).length;
  const srConnectionsCount = Object.keys(useDevToolsSelector(state => state.signalr.connections)).length;
  const wsMessagesCount = Object.values(useDevToolsSelector(state => state.websocket.messages)).flat().length;
  const srMessagesCount = Object.values(useDevToolsSelector(state => state.signalr.messages)).flat().length;

  const configMenuItems: ConfigMenuItem[] = [
    {
      id: 'toggle-recording',
      icon: selectedTab === 'websocket' 
        ? (wsRecording ? '⏸️' : '▶️')
        : (srRecording ? '⏸️' : '▶️'),
      label: selectedTab === 'websocket' 
        ? (wsRecording ? 'Pause Recording' : 'Start Recording')
        : (srRecording ? 'Pause Recording' : 'Start Recording'),
      onClick: () => {
        if (selectedTab === 'websocket') {
          client.toggleWebSocketRecording();
        } else if (selectedTab === 'signalr') {
          client.toggleSignalRRecording();
        }
      },
      shortcut: 'Ctrl+R'
    },
    {
      id: 'toggle-filters',
      icon: '🔍',
      label: showFilters ? 'Hide Filters' : 'Show Filters',
      onClick: client.toggleFilters,
      shortcut: 'Ctrl+F'
    },
    {
      id: 'clear-data',
      icon: '🗑️',
      label: `Clear ${selectedTab === 'websocket' ? 'WebSocket' : 'SignalR'} Data`,
      onClick: () => {
        if (selectedTab === 'websocket') {
          client.clearWebSocketData();
        } else if (selectedTab === 'signalr') {
          client.clearSignalRData();
        }
      },
      separator: true,
      shortcut: 'Ctrl+K'
    },
    {
      id: 'export-data',
      icon: '💾',
      label: 'Export Data',
      onClick: () => {
        // TODO: Implement export functionality
        console.log('Export data functionality to be implemented');
      },
      shortcut: 'Ctrl+E'
    },
    {
      id: 'settings',
      icon: '⚙️',
      label: 'Settings',
      onClick: () => {
        // TODO: Implement settings functionality
        console.log('Settings functionality to be implemented');
      },
      separator: true
    }
  ];

  return (
    <div 
      className={clsx(
        'websocket-signalr-devtools',
        `theme-${uiTheme}`,
        className
      )}
      style={{ height }}
    >
      <Tabs
        tabs={tabs}
        activeTab={selectedTab}
        onTabChange={(tabId) => client.selectTab(tabId as 'websocket' | 'signalr' | 'performance')}
        variant="underline"
        size="md"
        tabListStyle={{ borderBottom: '1px solid var(--devtools-border)' }}
        panelStyle={{ display: 'none' }} // Hide panel content since we render it separately
      />

      <div className="devtools-toolbar">
        <div className="toolbar-left">
          <StatusIndicator
            status={selectedTab === 'websocket' ? (wsRecording ? 'success' : 'inactive') : (srRecording ? 'success' : 'inactive')}
            label={selectedTab === 'websocket' ? (wsRecording ? 'Recording WebSocket' : 'WebSocket Paused') : (srRecording ? 'Recording SignalR' : 'SignalR Paused')}
            size="sm"
          />
        </div>
        <div className="toolbar-right">
          <ConfigMenu items={configMenuItems} />
        </div>
      </div>

      <ScrollableContainer
        style={{ flex: 1, height: '100%' }}
        autoHideScrollbar={true}
      >
        {showFilters && (
          <div className="devtools-filters">
            <FilterPanel />
          </div>
        )}
        
        <div className="devtools-content">
          <div className="devtools-main">
            {tabs.find(tab => tab.id === selectedTab)?.content || tabs[0].content}
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
      </ScrollableContainer>

      <Footer
        stats={[
          {
            id: 'connections',
            label: 'Connections',
            value: selectedTab === 'websocket' ? wsConnectionsCount : srConnectionsCount,
            tooltip: `${selectedTab === 'websocket' ? wsConnectionsCount : srConnectionsCount} active connections`
          },
          {
            id: 'messages',
            label: 'Messages',
            value: selectedTab === 'websocket' ? wsMessagesCount : srMessagesCount,
            tooltip: `${selectedTab === 'websocket' ? wsMessagesCount : srMessagesCount} total messages`
          }
        ]}
        status={{
          type: selectedTab === 'websocket' ? (wsRecording ? 'connected' : 'disconnected') : (srRecording ? 'connected' : 'disconnected'),
          message: selectedTab === 'websocket' 
            ? (wsRecording ? 'WebSocket Recording' : 'WebSocket Paused')
            : (srRecording ? 'SignalR Recording' : 'SignalR Paused')
        }}
        size="xs"
        variant="compact"
      />

      <style>{`
        .websocket-signalr-devtools {
          display: flex;
          flex-direction: column;
          background: var(--devtools-bg);
          color: var(--devtools-color);
          font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;
          font-size: 13px;
          border: 1px solid var(--devtools-border);
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        }

        .devtools-filters {
          border-bottom: 1px solid var(--devtools-border);
          background: var(--devtools-panel-bg);
          padding: 12px 16px;
        }

        .devtools-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 12px;
          background: var(--devtools-panel-bg);
          border-bottom: 1px solid var(--devtools-border);
        }

        .toolbar-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .toolbar-right {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .devtools-content {
          flex: 1;
          display: flex;
          overflow: hidden;
          background: var(--devtools-bg);
        }

        .devtools-main {
          flex: 1;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .devtools-sidebar {
          width: 320px;
          border-left: 1px solid var(--devtools-border);
          background: var(--devtools-panel-bg);
          display: flex;
          flex-direction: column;
        }

        .devtools-message-details {
          width: 400px;
          border-left: 1px solid var(--devtools-border);
          background: var(--devtools-panel-bg);
          display: flex;
          flex-direction: column;
        }

        /* Modern theme variables */
        .theme-light {
          --devtools-bg: #ffffff;
          --devtools-color: #1e293b;
          --devtools-border: #e2e8f0;
          --devtools-panel-bg: #f8fafc;
          --devtools-accent: #3b82f6;
          --devtools-accent-hover: #2563eb;
          --devtools-accent-contrast: #ffffff;
          --devtools-success: #10b981;
          --devtools-warning: #f59e0b;
          --devtools-danger: #ef4444;
          --devtools-text-secondary: #64748b;
          --devtools-text-muted: #94a3b8;
          --devtools-button-bg: #ffffff;
          --devtools-button-hover-bg: #f1f5f9;
        }

        .theme-dark {
          --devtools-bg: #0f172a;
          --devtools-color: #f1f5f9;
          --devtools-border: #334155;
          --devtools-panel-bg: #1e293b;
          --devtools-accent: #60a5fa;
          --devtools-accent-hover: #3b82f6;
          --devtools-accent-contrast: #ffffff;
          --devtools-success: #34d399;
          --devtools-warning: #fbbf24;
          --devtools-danger: #f87171;
          --devtools-text-secondary: #cbd5e1;
          --devtools-text-muted: #94a3b8;
          --devtools-button-bg: #334155;
          --devtools-button-hover-bg: #475569;
        }

        .theme-auto {
          --devtools-bg: #ffffff;
          --devtools-color: #1e293b;
          --devtools-border: #e2e8f0;
          --devtools-panel-bg: #f8fafc;
          --devtools-accent: #3b82f6;
          --devtools-accent-hover: #2563eb;
          --devtools-accent-contrast: #ffffff;
          --devtools-success: #10b981;
          --devtools-warning: #f59e0b;
          --devtools-danger: #ef4444;
          --devtools-text-secondary: #64748b;
          --devtools-text-muted: #94a3b8;
          --devtools-button-bg: #ffffff;
          --devtools-button-hover-bg: #f1f5f9;
        }

        @media (prefers-color-scheme: dark) {
          .theme-auto {
            --devtools-bg: #0f172a;
            --devtools-color: #f1f5f9;
            --devtools-border: #334155;
            --devtools-panel-bg: #1e293b;
            --devtools-accent: #60a5fa;
            --devtools-accent-hover: #3b82f6;
            --devtools-accent-contrast: #ffffff;
            --devtools-success: #34d399;
            --devtools-warning: #fbbf24;
            --devtools-danger: #f87171;
            --devtools-text-secondary: #cbd5e1;
            --devtools-text-muted: #94a3b8;
            --devtools-button-bg: #334155;
            --devtools-button-hover-bg: #475569;
          }
        }
      `}</style>
    </div>
  );
}