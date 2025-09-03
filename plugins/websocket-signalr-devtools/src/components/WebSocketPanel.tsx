import React from 'react';
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
      <div className="empty-state">
        <div className="empty-icon">🔌</div>
        <div className="empty-title">No WebSocket Connections</div>
        <div className="empty-description">
          WebSocket connections will appear here when your application creates them.
          Make sure the DevTools is enabled before creating connections.
        </div>

        <style>{`
          .empty-state {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100%;
            text-align: center;
            color: var(--devtools-text-secondary);
            padding: 2rem;
          }

          .empty-icon {
            font-size: 64px;
            margin-bottom: 1.5rem;
            opacity: 0.6;
          }

          .empty-title {
            font-size: 1.25rem;
            font-weight: 600;
            margin-bottom: 0.75rem;
            color: var(--devtools-color);
          }

          .empty-description {
            font-size: 0.875rem;
            max-width: 320px;
            line-height: 1.6;
            color: var(--devtools-text-muted);
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="websocket-panel">
      <MetricsBar 
        metrics={{
          connections: metrics.activeConnections,
          totalConnections: metrics.totalConnections,
          messages: metrics.totalMessages,
          bytes: metrics.totalBytes,
          errors: metrics.errorRate,
        }}
      />

      <div className="panel-content">
        <div className="connections-section">
          <div className="section-header">
            <h3>Connections ({filteredConnections.length})</h3>
          </div>
          <ConnectionList
            connections={filteredConnections}
            selectedConnectionId={selectedConnectionId}
            onConnectionSelect={handleConnectionSelect}
            onConnectionClose={handleConnectionClose}
            type="websocket"
          />
        </div>

        <div className="messages-section">
          <div className="section-header">
            <h3>Messages ({filteredMessages.length})</h3>
          </div>
          <MessageList
            messages={filteredMessages}
            onMessageSelect={handleMessageSelect}
            type="websocket"
          />
        </div>
      </div>

      <style>{`
        .websocket-panel {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: var(--devtools-bg);
        }

        .panel-content {
          flex: 1;
          display: flex;
          overflow: hidden;
          gap: 1px;
          background: var(--devtools-border);
        }

        .connections-section {
          width: 320px;
          background: var(--devtools-bg);
          display: flex;
          flex-direction: column;
          border-radius: 6px 0 0 6px;
        }

        .messages-section {
          flex: 1;
          background: var(--devtools-bg);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          border-radius: 0 6px 6px 0;
        }

        .section-header {
          padding: 1rem 1.25rem;
          background: var(--devtools-panel-bg);
          border-bottom: 1px solid var(--devtools-border);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .section-header h3 {
          margin: 0;
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--devtools-color);
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
      `}</style>
    </div>
  );
}