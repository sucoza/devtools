import React from 'react';
import { useDevToolsSelector } from '../core/devtools-store';
import { createWebSocketSignalRDevToolsClient } from '../core/devtools-client';
import { ConnectionList } from './ConnectionList';
import { MessageList } from './MessageList';
import { MetricsBar } from './MetricsBar';
import { HubMethodsList } from './HubMethodsList';
import type { SignalRConnection, SignalRMessage } from '../types';

export function SignalRPanel() {
  const connections = useDevToolsSelector(state => Array.from(state.signalr.connections.values()));
  const messages = useDevToolsSelector(state => state.signalr.messages);
  const metrics = useDevToolsSelector(state => state.signalr.metrics);
  const filter = useDevToolsSelector(state => state.signalr.filter);
  const selectedConnectionId = useDevToolsSelector(state => state.ui.selectedConnectionId);
  
  const client = createWebSocketSignalRDevToolsClient();

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

        <style jsx>{`
          .empty-state {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100%;
            text-align: center;
            color: var(--devtools-color);
            opacity: 0.6;
          }

          .empty-icon {
            font-size: 48px;
            margin-bottom: 16px;
          }

          .empty-title {
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 8px;
          }

          .empty-description {
            font-size: 14px;
            max-width: 300px;
            line-height: 1.4;
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

      <style jsx>{`
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
        }

        .connections-section {
          width: 300px;
          border-right: 1px solid var(--devtools-border);
          display: flex;
          flex-direction: column;
        }

        .main-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
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
        }

        .section-header {
          padding: 12px 16px;
          border-bottom: 1px solid var(--devtools-border);
          background: var(--devtools-panel-bg);
        }

        .section-header h3 {
          margin: 0;
          font-size: 14px;
          font-weight: 600;
          color: var(--devtools-color);
        }
      `}</style>
    </div>
  );
}