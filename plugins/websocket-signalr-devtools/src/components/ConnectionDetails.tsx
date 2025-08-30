import React from 'react';
import { useDevToolsSelector } from '../core/devtools-store';
import { createWebSocketSignalRDevToolsClient } from '../core/devtools-client';
import type { WebSocketConnection, SignalRConnection } from '../types';

interface ConnectionDetailsProps {
  connectionId: string;
  type: 'websocket' | 'signalr';
}

export function ConnectionDetails({ connectionId, type }: ConnectionDetailsProps) {
  const connection = useDevToolsSelector(state => {
    if (type === 'websocket') {
      return state.websocket.connections.get(connectionId);
    } else {
      return state.signalr.connections.get(connectionId);
    }
  }) as WebSocketConnection | SignalRConnection | undefined;

  const client = createWebSocketSignalRDevToolsClient();

  if (!connection) {
    return (
      <div className="connection-details">
        <div className="details-header">
          <h3>Connection Not Found</h3>
          <button 
            onClick={() => client.selectConnection(undefined)}
            className="close-btn"
            title="Close Details"
          >
            ✕
          </button>
        </div>
      </div>
    );
  }

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatDuration = (start: number, end?: number) => {
    const duration = (end || Date.now()) - start;
    if (duration < 1000) return `${duration}ms`;
    if (duration < 60000) return `${(duration / 1000).toFixed(1)}s`;
    if (duration < 3600000) return `${Math.floor(duration / 60000)}m ${Math.floor((duration % 60000) / 1000)}s`;
    return `${Math.floor(duration / 3600000)}h ${Math.floor((duration % 3600000) / 60000)}m`;
  };

  const renderWebSocketDetails = (conn: WebSocketConnection) => (
    <>
      <div className="detail-section">
        <h4>Connection Info</h4>
        <div className="detail-item">
          <span className="detail-label">URL:</span>
          <span className="detail-value" title={conn.url}>{conn.url}</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">State:</span>
          <span className="detail-value state" data-state={conn.state.toLowerCase()}>
            {conn.state}
          </span>
        </div>
        {conn.protocols.length > 0 && (
          <div className="detail-item">
            <span className="detail-label">Protocols:</span>
            <span className="detail-value">{conn.protocols.join(', ')}</span>
          </div>
        )}
        {conn.closeCode && (
          <div className="detail-item">
            <span className="detail-label">Close Code:</span>
            <span className="detail-value">{conn.closeCode}</span>
          </div>
        )}
        {conn.closeReason && (
          <div className="detail-item">
            <span className="detail-label">Close Reason:</span>
            <span className="detail-value">{conn.closeReason}</span>
          </div>
        )}
      </div>

      <div className="detail-section">
        <h4>Timing</h4>
        <div className="detail-item">
          <span className="detail-label">Created:</span>
          <span className="detail-value">{formatTimestamp(conn.createdAt)}</span>
        </div>
        {conn.connectedAt && (
          <div className="detail-item">
            <span className="detail-label">Connected:</span>
            <span className="detail-value">{formatTimestamp(conn.connectedAt)}</span>
          </div>
        )}
        {conn.closedAt && (
          <div className="detail-item">
            <span className="detail-label">Closed:</span>
            <span className="detail-value">{formatTimestamp(conn.closedAt)}</span>
          </div>
        )}
        <div className="detail-item">
          <span className="detail-label">Duration:</span>
          <span className="detail-value">
            {formatDuration(conn.connectedAt || conn.createdAt, conn.closedAt)}
          </span>
        </div>
        <div className="detail-item">
          <span className="detail-label">Last Activity:</span>
          <span className="detail-value">{formatTimestamp(conn.lastActivity)}</span>
        </div>
      </div>
    </>
  );

  const renderSignalRDetails = (conn: SignalRConnection) => (
    <>
      <div className="detail-section">
        <h4>Connection Info</h4>
        <div className="detail-item">
          <span className="detail-label">Hub URL:</span>
          <span className="detail-value" title={conn.hubUrl}>{conn.hubUrl}</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">State:</span>
          <span className="detail-value state" data-state={conn.state.toLowerCase()}>
            {conn.state}
          </span>
        </div>
        {conn.connectionId && (
          <div className="detail-item">
            <span className="detail-label">Connection ID:</span>
            <span className="detail-value">{conn.connectionId}</span>
          </div>
        )}
        {conn.transport && (
          <div className="detail-item">
            <span className="detail-label">Transport:</span>
            <span className="detail-value">{conn.transport}</span>
          </div>
        )}
        {conn.reconnectAttempts > 0 && (
          <div className="detail-item">
            <span className="detail-label">Reconnect Attempts:</span>
            <span className="detail-value">{conn.reconnectAttempts}</span>
          </div>
        )}
      </div>

      <div className="detail-section">
        <h4>Features</h4>
        {conn.features?.automaticReconnect && (
          <div className="detail-item">
            <span className="detail-label">Auto Reconnect:</span>
            <span className="detail-value">✅ Enabled</span>
          </div>
        )}
        {conn.features?.serverTimeout && (
          <div className="detail-item">
            <span className="detail-label">Server Timeout:</span>
            <span className="detail-value">{conn.features.serverTimeout}ms</span>
          </div>
        )}
        {conn.features?.keepAliveInterval && (
          <div className="detail-item">
            <span className="detail-label">Keep Alive:</span>
            <span className="detail-value">{conn.features.keepAliveInterval}ms</span>
          </div>
        )}
        {conn.features?.messagePackProtocol && (
          <div className="detail-item">
            <span className="detail-label">MessagePack:</span>
            <span className="detail-value">✅ Enabled</span>
          </div>
        )}
      </div>

      <div className="detail-section">
        <h4>Timing</h4>
        <div className="detail-item">
          <span className="detail-label">Created:</span>
          <span className="detail-value">{formatTimestamp(conn.createdAt)}</span>
        </div>
        {conn.connectedAt && (
          <div className="detail-item">
            <span className="detail-label">Connected:</span>
            <span className="detail-value">{formatTimestamp(conn.connectedAt)}</span>
          </div>
        )}
        {conn.disconnectedAt && (
          <div className="detail-item">
            <span className="detail-label">Disconnected:</span>
            <span className="detail-value">{formatTimestamp(conn.disconnectedAt)}</span>
          </div>
        )}
        <div className="detail-item">
          <span className="detail-label">Duration:</span>
          <span className="detail-value">
            {formatDuration(conn.connectedAt || conn.createdAt, conn.disconnectedAt)}
          </span>
        </div>
        <div className="detail-item">
          <span className="detail-label">Last Activity:</span>
          <span className="detail-value">{formatTimestamp(conn.lastActivity)}</span>
        </div>
      </div>
    </>
  );

  return (
    <div className="connection-details">
      <div className="details-header">
        <h3>{type === 'websocket' ? 'WebSocket' : 'SignalR'} Connection</h3>
        <button 
          onClick={() => client.selectConnection(undefined)}
          className="close-btn"
          title="Close Details"
        >
          ✕
        </button>
      </div>

      <div className="details-body">
        {type === 'websocket' 
          ? renderWebSocketDetails(connection as WebSocketConnection)
          : renderSignalRDetails(connection as SignalRConnection)
        }

        <div className="detail-section">
          <h4>Statistics</h4>
          <div className="detail-item">
            <span className="detail-label">Messages Sent:</span>
            <span className="detail-value">{connection.messageCount.sent}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Messages Received:</span>
            <span className="detail-value">{connection.messageCount.received}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Bytes Sent:</span>
            <span className="detail-value">
              {connection.bytesTransferred.sent > 1024 
                ? `${(connection.bytesTransferred.sent / 1024).toFixed(1)}KB`
                : `${connection.bytesTransferred.sent}B`
              }
            </span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Bytes Received:</span>
            <span className="detail-value">
              {connection.bytesTransferred.received > 1024 
                ? `${(connection.bytesTransferred.received / 1024).toFixed(1)}KB`
                : `${connection.bytesTransferred.received}B`
              }
            </span>
          </div>
        </div>

        {connection.errors.length > 0 && (
          <div className="detail-section">
            <h4>Errors ({connection.errors.length})</h4>
            <div className="errors-list">
              {connection.errors.slice(0, 5).map(error => (
                <div key={error.id} className="error-item">
                  <div className="error-header">
                    <span className="error-type">{error.type}</span>
                    <span className="error-time">{formatTimestamp(error.timestamp)}</span>
                  </div>
                  <div className="error-message">{error.error}</div>
                </div>
              ))}
              {connection.errors.length > 5 && (
                <div className="error-more">
                  ... and {connection.errors.length - 5} more errors
                </div>
              )}
            </div>
          </div>
        )}

        <div className="detail-actions">
          <button
            onClick={() => client.closeConnection(type, connection.id)}
            className="action-btn danger"
            disabled={connection.state === 'CLOSED' || connection.state === 'Disconnected'}
          >
            Close Connection
          </button>
        </div>
      </div>

      <style>{`
        .connection-details {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: var(--devtools-panel-bg);
        }

        .details-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          border-bottom: 1px solid var(--devtools-border);
          background: var(--devtools-header-bg);
        }

        .details-header h3 {
          margin: 0;
          font-size: 14px;
          font-weight: 600;
          color: var(--devtools-color);
        }

        .close-btn {
          width: 24px;
          height: 24px;
          border: none;
          background: transparent;
          color: var(--devtools-color);
          cursor: pointer;
          border-radius: 3px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .close-btn:hover {
          background: var(--devtools-button-hover-bg);
        }

        .details-body {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
        }

        .detail-section {
          margin-bottom: 24px;
        }

        .detail-section h4 {
          margin: 0 0 12px 0;
          font-size: 12px;
          font-weight: 600;
          color: var(--devtools-color);
          text-transform: uppercase;
          opacity: 0.8;
        }

        .detail-item {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 8px;
          gap: 12px;
        }

        .detail-label {
          font-size: 12px;
          color: var(--devtools-color);
          opacity: 0.7;
          flex-shrink: 0;
        }

        .detail-value {
          font-size: 12px;
          color: var(--devtools-color);
          text-align: right;
          word-break: break-all;
          flex: 1;
        }

        .detail-value.state[data-state="open"],
        .detail-value.state[data-state="connected"] {
          color: var(--devtools-success);
          font-weight: 600;
        }

        .detail-value.state[data-state="connecting"],
        .detail-value.state[data-state="reconnecting"] {
          color: var(--devtools-warning);
          font-weight: 600;
        }

        .detail-value.state[data-state="closed"],
        .detail-value.state[data-state="disconnected"] {
          color: var(--devtools-danger);
          font-weight: 600;
        }

        .errors-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .error-item {
          background: var(--devtools-bg);
          border: 1px solid var(--devtools-danger);
          border-left: 4px solid var(--devtools-danger);
          border-radius: 4px;
          padding: 8px;
        }

        .error-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 4px;
        }

        .error-type {
          font-size: 11px;
          font-weight: 600;
          color: var(--devtools-danger);
          text-transform: uppercase;
        }

        .error-time {
          font-size: 10px;
          color: var(--devtools-color);
          opacity: 0.6;
        }

        .error-message {
          font-size: 11px;
          color: var(--devtools-color);
          word-break: break-word;
        }

        .error-more {
          font-size: 11px;
          color: var(--devtools-color);
          opacity: 0.6;
          text-align: center;
          padding: 8px;
        }

        .detail-actions {
          padding-top: 16px;
          border-top: 1px solid var(--devtools-border);
        }

        .action-btn {
          padding: 8px 16px;
          border: 1px solid var(--devtools-border);
          border-radius: 4px;
          background: var(--devtools-button-bg);
          color: var(--devtools-color);
          cursor: pointer;
          font-size: 12px;
        }

        .action-btn:hover:not(:disabled) {
          background: var(--devtools-button-hover-bg);
        }

        .action-btn.danger {
          background: var(--devtools-danger);
          color: white;
          border-color: var(--devtools-danger);
        }

        .action-btn.danger:hover:not(:disabled) {
          opacity: 0.9;
        }

        .action-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}