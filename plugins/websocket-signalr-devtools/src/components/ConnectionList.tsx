import React from 'react';
import { clsx } from 'clsx';
import type { WebSocketConnection, SignalRConnection } from '../types';

interface ConnectionListProps {
  connections: (WebSocketConnection | SignalRConnection)[];
  selectedConnectionId?: string;
  onConnectionSelect: (connection: WebSocketConnection | SignalRConnection | null) => void;
  onConnectionClose: (connection: WebSocketConnection | SignalRConnection) => void;
  type: 'websocket' | 'signalr';
}

export function ConnectionList({ 
  connections, 
  selectedConnectionId, 
  onConnectionSelect,
  onConnectionClose,
  type 
}: ConnectionListProps) {
  const formatUrl = (url: string) => {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname + urlObj.pathname;
    } catch {
      return url;
    }
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const getStateColor = (state: string) => {
    switch (state) {
      case 'OPEN':
      case 'Connected':
        return 'var(--devtools-success)';
      case 'CONNECTING':
      case 'Connecting':
      case 'Reconnecting':
        return 'var(--devtools-warning)';
      case 'CLOSING':
      case 'Disconnecting':
        return 'var(--devtools-warning)';
      case 'CLOSED':
      case 'Disconnected':
        return 'var(--devtools-danger)';
      default:
        return 'var(--devtools-color)';
    }
  };

  const getStateIcon = (state: string) => {
    switch (state) {
      case 'OPEN':
      case 'Connected':
        return '🟢';
      case 'CONNECTING':
      case 'Connecting':
        return '🟡';
      case 'Reconnecting':
        return '🔄';
      case 'CLOSING':
      case 'Disconnecting':
        return '🟠';
      case 'CLOSED':
      case 'Disconnected':
        return '🔴';
      default:
        return '⚪';
    }
  };

  if (connections.length === 0) {
    return (
      <div className="connection-list-empty">
        <div>No connections found</div>

        <style jsx>{`
          .connection-list-empty {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--devtools-color);
            opacity: 0.5;
            font-size: 14px;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="connection-list">
      {connections.map(connection => (
        <div
          key={connection.id}
          className={clsx('connection-item', {
            'selected': selectedConnectionId === connection.id
          })}
          onClick={() => onConnectionSelect(connection)}
        >
          <div className="connection-header">
            <div className="connection-status">
              <span className="status-icon">
                {getStateIcon(connection.state)}
              </span>
              <span 
                className="status-text"
                style={{ color: getStateColor(connection.state) }}
              >
                {connection.state}
              </span>
            </div>
            <div className="connection-actions">
              {(connection.state === 'OPEN' || connection.state === 'Connected') && (
                <button
                  className="action-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    onConnectionClose(connection);
                  }}
                  title="Close Connection"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          <div className="connection-url" title={type === 'websocket' ? (connection as WebSocketConnection).url : (connection as SignalRConnection).hubUrl}>
            {type === 'websocket' 
              ? formatUrl((connection as WebSocketConnection).url)
              : formatUrl((connection as SignalRConnection).hubUrl)
            }
          </div>

          <div className="connection-details">
            <div className="detail-row">
              <span className="detail-label">Created:</span>
              <span className="detail-value">{formatTimestamp(connection.createdAt)}</span>
            </div>
            
            {type === 'signalr' && (connection as SignalRConnection).transport && (
              <div className="detail-row">
                <span className="detail-label">Transport:</span>
                <span className="detail-value">{(connection as SignalRConnection).transport}</span>
              </div>
            )}

            {type === 'signalr' && (connection as SignalRConnection).reconnectAttempts > 0 && (
              <div className="detail-row">
                <span className="detail-label">Reconnects:</span>
                <span className="detail-value">{(connection as SignalRConnection).reconnectAttempts}</span>
              </div>
            )}
            
            <div className="detail-row">
              <span className="detail-label">Messages:</span>
              <span className="detail-value">
                ↑{connection.messageCount.sent} ↓{connection.messageCount.received}
              </span>
            </div>
            
            <div className="detail-row">
              <span className="detail-label">Bytes:</span>
              <span className="detail-value">
                {Math.round((connection.bytesTransferred.sent + connection.bytesTransferred.received) / 1024)}KB
              </span>
            </div>

            {connection.errors.length > 0 && (
              <div className="detail-row">
                <span className="detail-label">Errors:</span>
                <span className="detail-value error">{connection.errors.length}</span>
              </div>
            )}
          </div>
        </div>
      ))}

      <style jsx>{`
        .connection-list {
          flex: 1;
          overflow-y: auto;
          padding: 8px;
        }

        .connection-item {
          background: var(--devtools-panel-bg);
          border: 1px solid var(--devtools-border);
          border-radius: 6px;
          margin-bottom: 8px;
          padding: 12px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .connection-item:hover {
          border-color: var(--devtools-accent);
          background: var(--devtools-button-hover-bg);
        }

        .connection-item.selected {
          border-color: var(--devtools-accent);
          background: var(--devtools-accent);
          color: var(--devtools-accent-contrast);
        }

        .connection-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 8px;
        }

        .connection-status {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .status-icon {
          font-size: 12px;
          line-height: 1;
        }

        .status-text {
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
        }

        .connection-actions {
          display: flex;
          gap: 4px;
        }

        .action-btn {
          width: 20px;
          height: 20px;
          border: none;
          background: var(--devtools-danger);
          color: white;
          border-radius: 3px;
          cursor: pointer;
          font-size: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .action-btn:hover {
          opacity: 0.8;
        }

        .connection-url {
          font-weight: 600;
          margin-bottom: 8px;
          word-break: break-all;
          font-size: 13px;
          opacity: 0.9;
        }

        .connection-item.selected .connection-url {
          color: var(--devtools-accent-contrast);
        }

        .connection-details {
          font-size: 11px;
          opacity: 0.8;
        }

        .connection-item.selected .connection-details {
          opacity: 1;
          color: var(--devtools-accent-contrast);
        }

        .detail-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2px;
        }

        .detail-label {
          color: var(--devtools-color);
          opacity: 0.7;
        }

        .connection-item.selected .detail-label {
          color: var(--devtools-accent-contrast);
          opacity: 0.8;
        }

        .detail-value {
          font-weight: 500;
        }

        .detail-value.error {
          color: var(--devtools-danger);
          font-weight: 600;
        }

        .connection-item.selected .detail-value.error {
          color: #ffcccb;
        }
      `}</style>
    </div>
  );
}