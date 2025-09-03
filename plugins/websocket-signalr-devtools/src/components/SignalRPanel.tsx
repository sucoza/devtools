import React from 'react';
import { useDevToolsSelector } from '../core/devtools-store';
import { createWebSocketSignalRDevToolsClient } from '../core/devtools-client';
import { ConnectionList } from './ConnectionList';
import { MessageList } from './MessageList';
import { MetricsBar } from './MetricsBar';
import { HubMethodsList } from './HubMethodsList';
import type { SignalRConnection, SignalRMessage } from '../types';

export function SignalRPanel() {
  const connectionsMap = useDevToolsSelector(state => state.signalr.connections);
  const messages = useDevToolsSelector(state => state.signalr.messages);
  const metrics = useDevToolsSelector(state => state.signalr.metrics);
  const filter = useDevToolsSelector(state => state.signalr.filter);
  const selectedConnectionId = useDevToolsSelector(state => state.ui.selectedConnectionId);
  
  const connections = React.useMemo(() => Array.from(connectionsMap.values()), [connectionsMap]);
  const client = React.useMemo(() => createWebSocketSignalRDevToolsClient(), []);

  // Filter connections and messages based on current filter
  const filteredConnections = React.useMemo(() => {
    return connections.filter(connection => {
      if (filter.connectionIds?.length && !filter.connectionIds.includes(connection.id)) {
        return false;
      }
      if (filter.hubUrls?.length && !filter.hubUrls.some(url => connection.hubUrl.includes(url))) {
        return false;
      }
      if (filter.states?.length && !filter.states.includes(connection.state)) {
        return false;
      }
      if (filter.transports?.length && connection.transport && !filter.transports.includes(connection.transport)) {
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
      if (filter.hubMethods?.length && message.target && !filter.hubMethods.includes(message.target)) {
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
        const searchableContent = [
          message.target,
          JSON.stringify(message.arguments),
          JSON.stringify(message.result),
          message.error
        ].filter(Boolean).join(' ');
        
        if (!searchableContent.toLowerCase().includes(searchLower)) {
          return false;
        }
      }
      return true;
    });
  }, [messages, filter, selectedConnectionId]);

  const selectedConnection = React.useMemo(() => {
    return selectedConnectionId 
      ? connections.find(conn => conn.id === selectedConnectionId)
      : null;
  }, [connections, selectedConnectionId]);

  const hubMethods = React.useMemo(() => {
    if (!selectedConnection) return [];
    return Array.from(selectedConnection.hubMethods.values());
  }, [selectedConnection]);

  const handleConnectionSelect = (connection: SignalRConnection | null) => {
    client.selectConnection(connection?.id);
  };

  const handleMessageSelect = (message: SignalRMessage | null) => {
    client.selectMessage(message?.id);
  };

  const handleConnectionClose = (connection: SignalRConnection) => {
    client.closeConnection('signalr', connection.id);
  };

  if (connections.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">📡</div>
        <div className="empty-title">No SignalR Connections</div>
        <div className="empty-description">
          SignalR connections will appear here when your application creates them.
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
    <div className="signalr-panel">
      <MetricsBar 
        metrics={{
          connections: metrics.activeConnections,
          totalConnections: metrics.totalConnections,
          messages: metrics.totalMessages,
          invocations: metrics.totalInvocations,
          reconnections: metrics.reconnectionRate,
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
            type="signalr"
          />
        </div>

        <div className="main-content">
          <div className="messages-section">
            <div className="section-header">
              <h3>Messages ({filteredMessages.length})</h3>
            </div>
            <MessageList
              messages={filteredMessages}
              onMessageSelect={handleMessageSelect}
              type="signalr"
            />
          </div>

          {selectedConnectionId && hubMethods.length > 0 && (
            <div className="hub-methods-section">
              <div className="section-header">
                <h3>Hub Methods ({hubMethods.length})</h3>
              </div>
              <HubMethodsList
                hubMethods={hubMethods}
                connectionId={selectedConnectionId}
              />
            </div>
          )}
        </div>
      </div>

      <style>{`
        .signalr-panel {
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

        .main-content {
          flex: 1;
          background: var(--devtools-bg);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          border-radius: 0 6px 6px 0;
        }

        .messages-section {
          flex: 2;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .hub-methods-section {
          flex: 1;
          border-top: 1px solid var(--devtools-border);
          display: flex;
          flex-direction: column;
          min-height: 200px;
          margin-top: 1px;
          background: var(--devtools-bg);
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