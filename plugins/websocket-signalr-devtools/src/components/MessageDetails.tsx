import React from 'react';
import { useDevToolsSelector } from '../core/devtools-store';
import { createWebSocketSignalRDevToolsClient } from '../core/devtools-client';
import type { WebSocketMessage, SignalRMessage } from '../types';

interface MessageDetailsProps {
  messageId: string;
  type: 'websocket' | 'signalr';
}

export function MessageDetails({ messageId, type }: MessageDetailsProps) {
  const message = useDevToolsSelector(state => {
    if (type === 'websocket') {
      return state.websocket.messages.find(m => m.id === messageId);
    } else {
      return state.signalr.messages.find(m => m.id === messageId);
    }
  }) as WebSocketMessage | SignalRMessage | undefined;

  const client = React.useMemo(() => createWebSocketSignalRDevToolsClient(), []);

  const [viewMode, setViewMode] = React.useState<'formatted' | 'raw'>('formatted');

  if (!message) {
    return (
      <div className="message-details">
        <div className="details-header">
          <h3>Message Not Found</h3>
          <button 
            onClick={() => client.selectMessage(undefined)}
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

  const formatData = (data: unknown, formatted: boolean = true) => {
    if (data === null || data === undefined) return 'null';
    
    if (typeof data === 'string') {
      try {
        // Try to parse as JSON for prettier formatting
        const parsed = JSON.parse(data);
        return formatted ? JSON.stringify(parsed, null, 2) : data;
      } catch {
        return data;
      }
    }

    if (data instanceof ArrayBuffer) {
      return `[ArrayBuffer ${data.byteLength} bytes]`;
    }

    if (data instanceof Blob) {
      return `[Blob ${data.size} bytes, type: ${data.type || 'unknown'}]`;
    }

    try {
      return formatted ? JSON.stringify(data, null, 2) : JSON.stringify(data);
    } catch {
      return String(data);
    }
  };

  const renderWebSocketMessage = (msg: WebSocketMessage) => (
    <>
      <div className="detail-section">
        <h4>Message Info</h4>
        <div className="detail-item">
          <span className="detail-label">Type:</span>
          <span className={`detail-value message-type ${msg.type}`}>
            {msg.type.toUpperCase()}
          </span>
        </div>
        <div className="detail-item">
          <span className="detail-label">Timestamp:</span>
          <span className="detail-value">{formatTimestamp(msg.timestamp)}</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">Size:</span>
          <span className="detail-value">
            {msg.size > 1024 ? `${(msg.size / 1024).toFixed(1)}KB` : `${msg.size}B`}
          </span>
        </div>
        <div className="detail-item">
          <span className="detail-label">Binary:</span>
          <span className="detail-value">{msg.binary ? 'Yes' : 'No'}</span>
        </div>
        {msg.error && (
          <div className="detail-item">
            <span className="detail-label">Error:</span>
            <span className="detail-value error">{msg.error}</span>
          </div>
        )}
      </div>
    </>
  );

  const renderSignalRMessage = (msg: SignalRMessage) => (
    <>
      <div className="detail-section">
        <h4>Message Info</h4>
        <div className="detail-item">
          <span className="detail-label">Type:</span>
          <span className={`detail-value message-type ${msg.direction}`}>
            {msg.type}
          </span>
        </div>
        <div className="detail-item">
          <span className="detail-label">Direction:</span>
          <span className={`detail-value direction ${msg.direction}`}>
            {msg.direction === 'send' ? '↑ Outbound' : '↓ Inbound'}
          </span>
        </div>
        <div className="detail-item">
          <span className="detail-label">Timestamp:</span>
          <span className="detail-value">{formatTimestamp(msg.timestamp)}</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">Size:</span>
          <span className="detail-value">
            {msg.size > 1024 ? `${(msg.size / 1024).toFixed(1)}KB` : `${msg.size}B`}
          </span>
        </div>
        {msg.target && (
          <div className="detail-item">
            <span className="detail-label">Target:</span>
            <span className="detail-value">{msg.target}</span>
          </div>
        )}
        {msg.invocationId && (
          <div className="detail-item">
            <span className="detail-label">Invocation ID:</span>
            <span className="detail-value">{msg.invocationId}</span>
          </div>
        )}
        {msg.streamIds && msg.streamIds.length > 0 && (
          <div className="detail-item">
            <span className="detail-label">Stream IDs:</span>
            <span className="detail-value">{msg.streamIds.join(', ')}</span>
          </div>
        )}
        {msg.error && (
          <div className="detail-item">
            <span className="detail-label">Error:</span>
            <span className="detail-value error">{msg.error}</span>
          </div>
        )}
      </div>
    </>
  );

  const getMessagePayload = () => {
    if (type === 'websocket') {
      const wsMsg = message as WebSocketMessage;
      return wsMsg.data;
    } else {
      const srMsg = message as SignalRMessage;
      if (srMsg.arguments) return srMsg.arguments;
      if (srMsg.result !== undefined) return srMsg.result;
      return null;
    }
  };

  const payload = getMessagePayload();
  const hasPayload = payload !== null && payload !== undefined;

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
  };

  const exportMessage = () => {
    const exportData = {
      id: message.id,
      connectionId: message.connectionId,
      timestamp: message.timestamp,
      type: type === 'websocket' ? (message as WebSocketMessage).type : (message as SignalRMessage).type,
      ...(type === 'signalr' && { direction: (message as SignalRMessage).direction }),
      payload: getMessagePayload(),
      size: message.size,
      ...(type === 'websocket' && { binary: (message as WebSocketMessage).binary }),
      ...(type === 'signalr' && (message as SignalRMessage).target && { target: (message as SignalRMessage).target }),
    };

    copyToClipboard(JSON.stringify(exportData, null, 2));
  };

  return (
    <div className="message-details">
      <div className="details-header">
        <h3>{type === 'websocket' ? 'WebSocket' : 'SignalR'} Message</h3>
        <div className="header-actions">
          <button
            onClick={exportMessage}
            className="action-btn"
            title="Copy to Clipboard"
          >
            📋
          </button>
          <button 
            onClick={() => client.selectMessage(undefined)}
            className="close-btn"
            title="Close Details"
          >
            ✕
          </button>
        </div>
      </div>

      <div className="details-body">
        {type === 'websocket' 
          ? renderWebSocketMessage(message as WebSocketMessage)
          : renderSignalRMessage(message as SignalRMessage)
        }

        {hasPayload && (
          <div className="detail-section">
            <div className="payload-header">
              <h4>Payload</h4>
              <div className="view-mode-toggle">
                <button
                  onClick={() => setViewMode('formatted')}
                  className={`toggle-btn ${viewMode === 'formatted' ? 'active' : ''}`}
                >
                  Formatted
                </button>
                <button
                  onClick={() => setViewMode('raw')}
                  className={`toggle-btn ${viewMode === 'raw' ? 'active' : ''}`}
                >
                  Raw
                </button>
              </div>
            </div>
            <div className="payload-content">
              <pre className="payload-data">
                {formatData(payload, viewMode === 'formatted')}
              </pre>
            </div>
          </div>
        )}

        {type === 'signalr' && (message as SignalRMessage).headers && (
          <div className="detail-section">
            <h4>Headers</h4>
            <div className="headers-content">
              <pre className="headers-data">
                {formatData((message as SignalRMessage).headers, true)}
              </pre>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .message-details {
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

        .header-actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .action-btn,
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
          font-size: 12px;
        }

        .action-btn:hover,
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

        .detail-value.message-type.send,
        .detail-value.direction.send {
          color: var(--devtools-accent);
          font-weight: 600;
        }

        .detail-value.message-type.receive,
        .detail-value.direction.receive {
          color: var(--devtools-success);
          font-weight: 600;
        }

        .detail-value.message-type.error {
          color: var(--devtools-danger);
          font-weight: 600;
        }

        .detail-value.error {
          color: var(--devtools-danger);
        }

        .payload-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .view-mode-toggle {
          display: flex;
          border: 1px solid var(--devtools-border);
          border-radius: 4px;
          overflow: hidden;
        }

        .toggle-btn {
          padding: 4px 12px;
          border: none;
          background: var(--devtools-button-bg);
          color: var(--devtools-color);
          cursor: pointer;
          font-size: 11px;
          transition: all 0.15s ease;
        }

        .toggle-btn:hover {
          background: var(--devtools-button-hover-bg);
        }

        .toggle-btn.active {
          background: var(--devtools-accent);
          color: var(--devtools-accent-contrast);
        }

        .toggle-btn + .toggle-btn {
          border-left: 1px solid var(--devtools-border);
        }

        .payload-content,
        .headers-content {
          max-height: 400px;
          overflow: auto;
          border: 1px solid var(--devtools-border);
          border-radius: 4px;
        }

        .payload-data,
        .headers-data {
          margin: 0;
          padding: 12px;
          background: var(--devtools-bg);
          color: var(--devtools-color);
          font-family: 'SF Mono', Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
          font-size: 11px;
          line-height: 1.4;
          white-space: pre-wrap;
          word-break: break-word;
        }
      `}</style>
    </div>
  );
}