import React from 'react';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, EmptyState } from '@sucoza/shared-components';
import { useDevToolsSelector } from '../core/devtools-store';
import { createWebSocketSignalRDevToolsClient } from '../core/devtools-client';
import { ConnectionList } from './ConnectionList';
import { MessageList } from './MessageList';
import { MetricsBar } from './MetricsBar';
import type { WebSocketConnection, WebSocketMessage } from '../types';

export function WebSocketPanel() {
  const connectionsMap = useDevToolsSelector(state => state.websocket.connections);
  const messages = useDevToolsSelector(state => state.websocket.messages);
  const metrics = useDevToolsSelector(state => state.websocket.metrics);
  const filter = useDevToolsSelector(state => state.websocket.filter);
  const selectedConnectionId = useDevToolsSelector(state => state.ui.selectedConnectionId);
  
  const connections = React.useMemo(() => Array.from(connectionsMap.values()), [connectionsMap]);
  const client = React.useMemo(() => createWebSocketSignalRDevToolsClient(), []);

  // Filter connections and messages based on current filter
  const filteredConnections = React.useMemo(() => {
    return connections.filter(connection => {
      if (filter.connectionIds?.length && !filter.connectionIds.includes(connection.id)) {
        return false;
      }
      if (filter.urls?.length && !filter.urls.some(url => connection.url.includes(url))) {
        return false;
      }
      if (filter.states?.length && !filter.states.includes(connection.state)) {
        return false;
      }
      if (filter.timeRange) {
        const { start, end } = filter.timeRange;
        if (connection.createdAt < start || connection.createdAt > end) {
          return false;
        }
      }
      return true;
    });
  }, [connections, filter]);

  const filteredMessages = React.useMemo(() => {
    return messages.filter(message => {
      if (selectedConnectionId && message.connectionId !== selectedConnectionId) {
        return false;
      }
      if (filter.messageTypes?.length && !filter.messageTypes.includes(message.type)) {
        return false;
      }
      if (filter.timeRange) {
        const { start, end } = filter.timeRange;
        if (message.timestamp < start || message.timestamp > end) {
          return false;
        }
      }
      if (filter.searchText) {
        const searchLower = filter.searchText.toLowerCase();
        const dataString = typeof message.data === 'string' 
          ? message.data 
          : JSON.stringify(message.data);
        if (!dataString.toLowerCase().includes(searchLower)) {
          return false;
        }
      }
      return true;
    });
  }, [messages, filter, selectedConnectionId]);

  const handleConnectionSelect = (connection: WebSocketConnection | null) => {
    client.selectConnection(connection?.id);
  };

  const handleMessageSelect = (message: WebSocketMessage | null) => {
    client.selectMessage(message?.id);
  };

  const handleConnectionClose = (connection: WebSocketConnection) => {
    client.closeConnection('websocket', connection.id);
  };

  if (connections.length === 0) {
    return (
      <EmptyState
        icon="🔌"
        title="No WebSocket Connections"
        description="WebSocket connections will appear here when your application creates them. Make sure the DevTools is enabled before creating connections."
      />
    );
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      backgroundColor: COLORS.background.primary
    }}>
      <MetricsBar 
        metrics={{
          connections: metrics.activeConnections,
          totalConnections: metrics.totalConnections,
          messages: metrics.totalMessages,
          bytes: metrics.totalBytes,
          errors: metrics.errorRate,
        }}
      />

      <div style={{
        flex: 1,
        display: 'flex',
        overflow: 'hidden',
        gap: '1px',
        backgroundColor: COLORS.border.primary
      }}>
        <div style={{
          width: '320px',
          backgroundColor: COLORS.background.primary,
          display: 'flex',
          flexDirection: 'column',
          borderRadius: `${RADIUS.md} 0 0 ${RADIUS.md}`
        }}>
          <div style={{
            padding: `${SPACING['2xl']} ${SPACING['2.5xl']}`,
            backgroundColor: COLORS.background.secondary,
            borderBottom: `1px solid ${COLORS.border.primary}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <h3 style={{
              margin: 0,
              fontSize: TYPOGRAPHY.fontSize.sm,
              fontWeight: TYPOGRAPHY.fontWeight.semibold,
              color: COLORS.text.primary,
              display: 'flex',
              alignItems: 'center',
              gap: SPACING.md
            }}>
              Connections ({filteredConnections.length})
            </h3>
          </div>
          <ConnectionList
            connections={filteredConnections}
            selectedConnectionId={selectedConnectionId}
            onConnectionSelect={handleConnectionSelect}
            onConnectionClose={handleConnectionClose}
            type="websocket"
          />
        </div>

        <div style={{
          flex: 1,
          backgroundColor: COLORS.background.primary,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          borderRadius: `0 ${RADIUS.md} ${RADIUS.md} 0`
        }}>
          <div style={{
            padding: `${SPACING['2xl']} ${SPACING['2.5xl']}`,
            backgroundColor: COLORS.background.secondary,
            borderBottom: `1px solid ${COLORS.border.primary}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <h3 style={{
              margin: 0,
              fontSize: TYPOGRAPHY.fontSize.sm,
              fontWeight: TYPOGRAPHY.fontWeight.semibold,
              color: COLORS.text.primary,
              display: 'flex',
              alignItems: 'center',
              gap: SPACING.md
            }}>
              Messages ({filteredMessages.length})
            </h3>
          </div>
          <MessageList
            messages={filteredMessages}
            onMessageSelect={handleMessageSelect}
            type="websocket"
          />
        </div>
      </div>
    </div>
  );
}