export type SignalRConnectionState =
  | 'Disconnected'
  | 'Connecting'
  | 'Connected'
  | 'Disconnecting'
  | 'Reconnecting';

export type SignalRTransport = 
  | 'WebSockets'
  | 'ServerSentEvents'
  | 'LongPolling';

export type SignalRMessageType = 
  | 'Invocation'
  | 'StreamItem'
  | 'Completion'
  | 'StreamInvocation'
  | 'CancelInvocation'
  | 'Ping'
  | 'Close'
  | 'Handshake';

export interface SignalRMessage {
  id: string;
  connectionId: string;
  timestamp: number;
  direction: 'send' | 'receive';
  type: SignalRMessageType;
  target?: string;
  arguments?: unknown[];
  result?: unknown;
  error?: string;
  invocationId?: string;
  streamIds?: string[];
  headers?: Record<string, string>;
  size: number;
}

export interface SignalRHubMethod {
  name: string;
  invocationCount: number;
  averageExecutionTime: number;
  errorCount: number;
  lastInvoked: number;
}

export interface SignalRConnection {
  id: string;
  hubUrl: string;
  connectionId?: string;
  state: SignalRConnectionState;
  transport?: SignalRTransport;
  createdAt: number;
  connectedAt?: number;
  disconnectedAt?: number;
  hubMethods: Map<string, SignalRHubMethod>;
  messageCount: {
    sent: number;
    received: number;
  };
  bytesTransferred: {
    sent: number;
    received: number;
  };
  errors: SignalRError[];
  reconnectAttempts: number;
  lastActivity: number;
  features?: {
    messagePackProtocol?: boolean;
    automaticReconnect?: boolean;
    serverTimeout?: number;
    keepAliveInterval?: number;
  };
}

export interface SignalRError {
  id: string;
  connectionId: string;
  timestamp: number;
  type: 'connection' | 'invocation' | 'transport' | 'protocol';
  error: string;
  hubMethod?: string;
  invocationId?: string;
}

export interface SignalRMetrics {
  totalConnections: number;
  activeConnections: number;
  totalInvocations: number;
  totalMessages: number;
  totalBytes: number;
  averageLatency: number;
  reconnectionRate: number;
  errorRate: number;
  hubMethodStats: SignalRHubMethod[];
}

export interface SignalRFilter {
  connectionIds?: string[];
  hubUrls?: string[];
  states?: SignalRConnectionState[];
  messageTypes?: SignalRMessageType[];
  hubMethods?: string[];
  transports?: SignalRTransport[];
  timeRange?: {
    start: number;
    end: number;
  };
  searchText?: string;
}