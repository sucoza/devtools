import React from 'react';
import { DataTable, Badge, EmptyState } from '@sucoza/shared-components';
import type { Column } from '@sucoza/shared-components';
import type { WebSocketMessage, SignalRMessage } from '../types';

interface MessageListProps {
  messages: (WebSocketMessage | SignalRMessage)[];
  onMessageSelect: (message: WebSocketMessage | SignalRMessage | null) => void;
  type: 'websocket' | 'signalr';
}

export function MessageList({ messages, onMessageSelect, type }: MessageListProps) {
  const [selectedRows, setSelectedRows] = React.useState<string[]>([]);

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString(undefined, { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit'
    } as Intl.DateTimeFormatOptions);
  };

  const getMessageTypeBadgeVariant = (message: WebSocketMessage | SignalRMessage) => {
    if (type === 'websocket') {
      const wsMessage = message as WebSocketMessage;
      switch (wsMessage.type) {
        case 'send': return 'primary';
        case 'receive': return 'success';
        case 'error': return 'error';
        case 'open': return 'success';
        case 'close': return 'warning';
        default: return 'secondary';
      }
    } else {
      const srMessage = message as SignalRMessage;
      switch (srMessage.type) {
        case 'Invocation': 
          return srMessage.direction === 'send' ? 'primary' : 'success';
        case 'Completion': return 'success';
        case 'StreamItem': return 'warning';
        case 'Ping': return 'secondary';
        case 'Close': return 'error';
        case 'Handshake': return 'success';
        default: return 'secondary';
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
        return wsMessage.data.length > 80 ? wsMessage.data.substring(0, 80) + '...' : wsMessage.data;
      } else {
        try {
          const jsonStr = JSON.stringify(wsMessage.data);
          return jsonStr.length > 80 ? jsonStr.substring(0, 80) + '...' : jsonStr;
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
        return preview.length > 80 ? preview.substring(0, 80) + '...' : preview;
      }
      
      return srMessage.type;
    }
  };

  const columns: Column<WebSocketMessage | SignalRMessage>[] = [
    {
      key: 'timestamp',
      header: 'Time',
      width: 100,
      render: (message: WebSocketMessage | SignalRMessage) => (
        <span style={{ fontVariantNumeric: 'tabular-nums', fontSize: '11px', opacity: 0.8 }}>
          {formatTimestamp(message.timestamp)}
        </span>
      )
    },
    {
      key: 'type',
      header: 'Type',
      width: 120,
      render: (message: WebSocketMessage | SignalRMessage) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span>{getMessageTypeIcon(message)}</span>
          <Badge 
            variant={getMessageTypeBadgeVariant(message) as any}
            size="xs"
          >
            {type === 'websocket' 
              ? (message as WebSocketMessage).type 
              : (message as SignalRMessage).type
            }
          </Badge>
        </div>
      )
    },
    {
      key: 'size',
      header: 'Size',
      width: 60,
      align: 'right',
      render: (message: WebSocketMessage | SignalRMessage) => (
        <span style={{ fontSize: '11px', opacity: 0.7 }}>
          {message.size > 0 ? `${message.size}B` : '-'}
        </span>
      )
    },
    {
      key: 'preview',
      header: 'Preview',
      flex: 1,
      render: (message: WebSocketMessage | SignalRMessage) => (
        <span style={{ 
          fontSize: '11px', 
          opacity: 0.9,
          fontFamily: 'monospace'
        }}>
          {getMessagePreview(message)}
        </span>
      )
    }
  ];

  const handleRowSelect = (messageIds: string[]) => {
    setSelectedRows(messageIds);
    const selectedMessage = messageIds.length > 0 
      ? messages.find(m => m.id === messageIds[0]) || null
      : null;
    onMessageSelect(selectedMessage);
  };

  if (messages.length === 0) {
    return (
      <EmptyState
        title="No Messages"
        description={`No ${type === 'websocket' ? 'WebSocket' : 'SignalR'} messages to display`}
        icon="📡"
      />
    );
  }

  return (
    <DataTable
      data={messages}
      columns={columns}
      selectedRows={new Set(selectedRows.map((id, idx) => idx))}
      onRowSelect={handleRowSelect}
      selectionMode="single"
      size="sm"
      striped
      hoverable
      stickyHeader
      virtualScrolling={messages.length > 500}
    />
  );
}