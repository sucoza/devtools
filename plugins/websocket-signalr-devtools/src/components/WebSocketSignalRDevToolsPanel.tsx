import React from 'react';
import { 
  Tabs,
  StatusIndicator,
  Footer,
  ScrollableContainer,
  Badge,
  COLORS,
  TYPOGRAPHY,
  SPACING,
  RADIUS
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
      className={className}
      style={{
        height,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: COLORS.background.primary,
        color: COLORS.text.primary,
        fontFamily: TYPOGRAPHY.fontFamily.sans,
        fontSize: TYPOGRAPHY.fontSize.sm,
        border: `1px solid ${COLORS.border.primary}`,
        borderRadius: RADIUS.lg,
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)'
      }}
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

      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: `${SPACING.md} ${SPACING.lg}`,
        backgroundColor: COLORS.background.secondary,
        borderBottom: `1px solid ${COLORS.border.primary}`
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: SPACING.lg
        }}>
          <StatusIndicator
            status={selectedTab === 'websocket' ? (wsRecording ? 'success' : 'inactive') : (srRecording ? 'success' : 'inactive')}
            label={selectedTab === 'websocket' ? (wsRecording ? 'Recording WebSocket' : 'WebSocket Paused') : (srRecording ? 'Recording SignalR' : 'SignalR Paused')}
            size="sm"
          />
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: SPACING.md
        }}>
          <ConfigMenu items={configMenuItems} />
        </div>
      </div>

      <ScrollableContainer
        style={{ flex: 1, height: '100%' }}
        autoHideScrollbar={true}
      >
        {showFilters && (
          <div style={{
            borderBottom: `1px solid ${COLORS.border.primary}`,
            backgroundColor: COLORS.background.secondary,
            padding: `${SPACING.lg} ${SPACING['2xl']}`
          }}>
            <FilterPanel />
          </div>
        )}
        
        <div style={{
          flex: 1,
          display: 'flex',
          overflow: 'hidden',
          backgroundColor: COLORS.background.primary
        }}>
          <div style={{
            flex: 1,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {tabs.find(tab => tab.id === selectedTab)?.content || tabs[0].content}
          </div>
          
          {selectedConnectionId && (
            <div style={{
              width: '320px',
              borderLeft: `1px solid ${COLORS.border.primary}`,
              backgroundColor: COLORS.background.secondary,
              display: 'flex',
              flexDirection: 'column'
            }}>
              <ConnectionDetails 
                connectionId={selectedConnectionId}
                type={selectedTab as 'websocket' | 'signalr'}
              />
            </div>
          )}
          
          {selectedMessageId && (
            <div style={{
              width: '400px',
              borderLeft: `1px solid ${COLORS.border.primary}`,
              backgroundColor: COLORS.background.secondary,
              display: 'flex',
              flexDirection: 'column'
            }}>
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

    </div>
  );
}