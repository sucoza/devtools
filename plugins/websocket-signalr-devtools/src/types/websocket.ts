export type WebSocketState = 
  | 'CONNECTING'
  | 'OPEN'
  | 'CLOSING'
  | 'CLOSED';

export type MessageType = 'send' | 'receive' | 'error' | 'close' | 'open';

export interface WebSocketMessage {
  id: string;
  connectionId: string;
  timestamp: number;
  type: MessageType;
  data: unknown;
  size: number;
  binary: boolean;
  error?: string;
}

export interface WebSocketConnection {
  id: string;
  url: string;
  protocols: string[];
  state: WebSocketState;
  createdAt: number;
  connectedAt?: number;
  closedAt?: number;
  closeCode?: number;
  closeReason?: string;
  messageCount: {
    sent: number;
    received: number;
  };
  bytesTransferred: {
    sent: number;
    received: number;
  };
  errors: WebSocketError[];
  lastActivity: number;
}

export interface WebSocketError {
  id: string;
  connectionId: string;
  timestamp: number;
  type: 'connection' | 'message' | 'close';
  error: string;
  code?: number;
}

export interface WebSocketMetrics {
  totalConnections: number;
  activeConnections: number;
  totalMessages: number;
  totalBytes: number;
  averageLatency: number;
  errorRate: number;
}

export interface WebSocketFilter {
  connectionIds?: string[];
  urls?: string[];
  states?: WebSocketState[];
  messageTypes?: MessageType[];
  timeRange?: {
    start: number;
    end: number;
  };
  searchText?: string;
}