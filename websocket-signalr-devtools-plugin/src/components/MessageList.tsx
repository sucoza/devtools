import React from 'react';
import { clsx } from 'clsx';
import type { WebSocketMessage, SignalRMessage } from '../types';

interface MessageListProps {
  messages: (WebSocketMessage | SignalRMessage)[];
  onMessageSelect: (message: WebSocketMessage | SignalRMessage | null) => void;
  type: 'websocket' | 'signalr';
}

export function MessageList({ messages, onMessageSelect, type }: MessageListProps) {
  const [selectedMessageId, setSelectedMessageId] = React.useState<string>();

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString(undefined, { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      fractionalSecondDigits: 3 
    });
  };

  const getMessageTypeColor = (message: WebSocketMessage | SignalRMessage) => {
    if (type === 'websocket') {
      const wsMessage = message as WebSocketMessage;
      switch (wsMessage.type) {
        case 'send': return 'var(--devtools-accent)';
        case 'receive': return 'var(--devtools-success)';
        case 'error': return 'var(--devtools-danger)';
        case 'open': return 'var(--devtools-success)';
        case 'close': return 'var(--devtools-warning)';
        default: return 'var(--devtools-color)';
      }
    } else {
      const srMessage = message as SignalRMessage;
      switch (srMessage.type) {
        case 'Invocation': 
          return srMessage.direction === 'send' ? 'var(--devtools-accent)' : 'var(--devtools-success)';
        case 'Completion': return 'var(--devtools-success)';
        case 'StreamItem': return 'var(--devtools-warning)';
        case 'Ping': return 'var(--devtools-color)';
        case 'Close': return 'var(--devtools-danger)';
        case 'Handshake': return 'var(--devtools-success)';
        default: return 'var(--devtools-color)';
      }
    }
  };

  const getMessageTypeIcon = (message: WebSocketMessage | SignalRMessage) => {
    if (type === 'websocket') {
      const wsMessage = message as WebSocketMessage;
      switch (wsMessage.type) {
        case 'send': return '↑';
        case 'receive': return '↓';
        case 'error': return '❌';
        case 'open': return '🔌';
        case 'close': return '🔚';
        default: return '•';
      }
    } else {
      const srMessage = message as SignalRMessage;
      switch (srMessage.type) {
        case 'Invocation': 
          return srMessage.direction === 'send' ? '📤' : '📥';
        case 'Completion': return '✅';
        case 'StreamItem': return '🌊';
        case 'Ping': return '🏓';
        case 'Close': return '🔚';
        case 'Handshake': return '🤝';
        default: return '•';
      }
    }
  };

  const getMessagePreview = (message: WebSocketMessage | SignalRMessage) => {
    if (type === 'websocket') {
      const wsMessage = message as WebSocketMessage;
      if (wsMessage.error) return wsMessage.error;
      
      if (typeof wsMessage.data === 'string') {
        return wsMessage.data.length > 100 ? wsMessage.data.substring(0, 100) + '...' : wsMessage.data;
      } else {
        try {
          const jsonStr = JSON.stringify(wsMessage.data);
          return jsonStr.length > 100 ? jsonStr.substring(0, 100) + '...' : jsonStr;
        } catch {
          return '[Binary Data]';
        }
      }
    } else {
      const srMessage = message as SignalRMessage;
      
      if (srMessage.error) return srMessage.error;
      if (srMessage.target) {
        const args = srMessage.arguments ? JSON.stringify(srMessage.arguments) : '';
        const result = srMessage.result ? JSON.stringify(srMessage.result) : '';
        const preview = `${srMessage.target}(${args})${result ? ' => ' + result : ''}`;
        return preview.length > 100 ? preview.substring(0, 100) + '...' : preview;
      }
      
      return srMessage.type;
    }
  };

  const handleMessageClick = (message: WebSocketMessage | SignalRMessage) => {
    const newSelectedId = selectedMessageId === message.id ? undefined : message.id;
    setSelectedMessageId(newSelectedId);
    onMessageSelect(newSelectedId ? message : null);
  };

  if (messages.length === 0) {
    return (
      <div className="message-list-empty">
        <div>No messages to display</div>

        <style jsx>{`
          .message-list-empty {
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
    <div className="message-list">
      <div className="message-header">
        <div className="header-col time">Time</div>
        <div className="header-col type">Type</div>
        <div className="header-col size">Size</div>
        <div className="header-col preview">Preview</div>
      </div>
      
      <div className="message-body">
        {messages.map(message => (
          <div
            key={message.id}
            className={clsx('message-item', {
              'selected': selectedMessageId === message.id
            })}
            onClick={() => handleMessageClick(message)}
          >
            <div className="message-col time">{formatTimestamp(message.timestamp)}</div>
            <div 
              className="message-col type"
              style={{ color: getMessageTypeColor(message) }}
            >
              <span className="type-icon">{getMessageTypeIcon(message)}</span>
              <span className="type-text">
                {type === 'websocket' 
                  ? (message as WebSocketMessage).type 
                  : (message as SignalRMessage).type
                }
              </span>
            </div>
            <div className="message-col size">
              {message.size > 0 ? `${message.size}B` : '-'}
            </div>
            <div className="message-col preview">
              {getMessagePreview(message)}
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        .message-list {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          font-family: 'SF Mono', Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
        }

        .message-header {
          display: flex;
          background: var(--devtools-panel-bg);
          border-bottom: 1px solid var(--devtools-border);
          padding: 8px 12px;
          font-size: 11px;
          font-weight: 600;
          color: var(--devtools-color);
          opacity: 0.8;
          position: sticky;
          top: 0;
          z-index: 1;
        }

        .message-body {
          flex: 1;
          overflow-y: auto;
          padding: 4px;
        }

        .header-col,
        .message-col {
          padding: 0 4px;
        }

        .header-col.time,
        .message-col.time {
          width: 100px;
          flex-shrink: 0;
        }

        .header-col.type,
        .message-col.type {
          width: 120px;
          flex-shrink: 0;
        }

        .header-col.size,
        .message-col.size {
          width: 60px;
          flex-shrink: 0;
          text-align: right;
        }

        .header-col.preview,
        .message-col.preview {
          flex: 1;
          min-width: 0;
        }

        .message-item {
          display: flex;
          align-items: center;
          padding: 6px 8px;
          margin-bottom: 1px;
          font-size: 12px;
          cursor: pointer;
          border-radius: 3px;
          transition: background-color 0.15s ease;
        }

        .message-item:hover {
          background: var(--devtools-button-hover-bg);
        }

        .message-item.selected {
          background: var(--devtools-accent);
          color: var(--devtools-accent-contrast);
        }

        .message-col.type {
          display: flex;
          align-items: center;
          gap: 6px;
          font-weight: 500;
        }

        .type-icon {
          font-size: 14px;
          line-height: 1;
        }

        .type-text {
          font-size: 11px;
          text-transform: uppercase;
        }

        .message-col.preview {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          font-size: 11px;
          opacity: 0.9;
        }

        .message-item.selected .message-col.preview {
          color: var(--devtools-accent-contrast);
          opacity: 1;
        }

        .message-col.time {
          font-size: 11px;
          opacity: 0.7;
          font-variant-numeric: tabular-nums;
        }

        .message-item.selected .message-col.time {
          color: var(--devtools-accent-contrast);
          opacity: 0.9;
        }

        .message-col.size {
          font-size: 11px;
          opacity: 0.7;
          font-variant-numeric: tabular-nums;
        }

        .message-item.selected .message-col.size {
          color: var(--devtools-accent-contrast);
          opacity: 0.9;
        }
      `}</style>
    </div>
  );
}