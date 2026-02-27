import type { 
  WebSocketConnection, 
  WebSocketMessage, 
  // WebSocketState, 
  // MessageType,
  WebSocketError 
} from '../types/websocket';
import { EventEmitter } from './event-emitter';
import { generateId } from '../utils/id-generator';

export class WebSocketInterceptor extends EventEmitter<{
  connectionCreated: WebSocketConnection;
  connectionUpdated: { id: string; updates: Partial<WebSocketConnection> };
  connectionClosed: string;
  messageAdded: WebSocketMessage;
  errorOccurred: WebSocketError;
}> {
  private originalWebSocket: typeof WebSocket;
  private connections = new Map<WebSocket, string>();
  private connectionData = new Map<string, WebSocketConnection>();
  private isEnabled = false;

  constructor() {
    super();
    // Safe access to window.WebSocket for test environments
    this.originalWebSocket = typeof window !== 'undefined' && window.WebSocket || (global as Record<string, unknown>).WebSocket as typeof WebSocket;
  }

  enable(): void {
    if (this.isEnabled) return;

    this.isEnabled = true;
    this.interceptWebSocket();
  }

  disable(): void {
    if (!this.isEnabled) return;

    this.isEnabled = false;
    if (typeof window !== 'undefined' && window.WebSocket) {
      window.WebSocket = this.originalWebSocket;
    }
    this.connections.clear();
    this.connectionData.clear();
    this.removeAllListeners();
  }

  getConnection(id: string): WebSocketConnection | undefined {
    return this.connectionData.get(id);
  }

  getAllConnections(): WebSocketConnection[] {
    return Array.from(this.connectionData.values());
  }

  closeConnection(id: string): void {
    const connection = this.connectionData.get(id);
    if (!connection) return;

    const ws = Array.from(this.connections.entries())
      .find(([_, connId]) => connId === id)?.[0];
    
    if (ws) {
      ws.close();
    }
  }

  private interceptWebSocket(): void {
    if (typeof window === 'undefined' || !window.WebSocket) {
      return; // Skip interception in non-browser environments
    }

    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const interceptor = this;
    
    window.WebSocket = class extends interceptor.originalWebSocket {
      private connectionId: string;
      private startTime: number;

      constructor(url: string | URL, protocols?: string | string[]) {
        super(url, protocols);
        
        this.connectionId = generateId();
        this.startTime = Date.now();
        
        const protocolArray = Array.isArray(protocols) 
          ? protocols 
          : protocols 
            ? [protocols] 
            : [];

        const connection: WebSocketConnection = {
          id: this.connectionId,
          url: url.toString(),
          protocols: protocolArray,
          state: 'CONNECTING',
          createdAt: this.startTime,
          messageCount: { sent: 0, received: 0 },
          bytesTransferred: { sent: 0, received: 0 },
          errors: [],
          lastActivity: this.startTime,
        };

        interceptor.connections.set(this, this.connectionId);
        interceptor.connectionData.set(this.connectionId, connection);
        interceptor.emit('connectionCreated', connection);

        this.setupEventListeners();
      }

      private setupEventListeners(): void {
        const originalAddEventListener = this.addEventListener.bind(this);
        const _originalRemoveEventListener = this.removeEventListener.bind(this);

        // Override addEventListener to intercept events
        this.addEventListener = (type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions) => {
          if (type === 'open') {
            const wrappedListener = this.wrapOpenListener(listener);
            originalAddEventListener(type, wrappedListener, options);
          } else if (type === 'message') {
            const wrappedListener = this.wrapMessageListener(listener);
            originalAddEventListener(type, wrappedListener, options);
          } else if (type === 'close') {
            const wrappedListener = this.wrapCloseListener(listener);
            originalAddEventListener(type, wrappedListener, options);
          } else if (type === 'error') {
            const wrappedListener = this.wrapErrorListener(listener);
            originalAddEventListener(type, wrappedListener, options);
          } else {
            originalAddEventListener(type, listener, options);
          }
        };

        // Set up default event handlers for monitoring
        originalAddEventListener('open', this.handleOpen.bind(this));
        originalAddEventListener('message', this.handleMessage.bind(this));
        originalAddEventListener('close', this.handleClose.bind(this));
        originalAddEventListener('error', this.handleError.bind(this));
      }

      private wrapOpenListener(listener: EventListenerOrEventListenerObject) {
        return (event: Event) => {
          if (typeof listener === 'function') {
            listener(event);
          } else if (listener?.handleEvent) {
            listener.handleEvent(event);
          }
        };
      }

      private wrapMessageListener(listener: EventListenerOrEventListenerObject) {
        return (event: MessageEvent) => {
          if (typeof listener === 'function') {
            listener(event);
          } else if (listener?.handleEvent) {
            listener.handleEvent(event);
          }
        };
      }

      private wrapCloseListener(listener: EventListenerOrEventListenerObject) {
        return (event: CloseEvent) => {
          if (typeof listener === 'function') {
            listener(event);
          } else if (listener?.handleEvent) {
            listener.handleEvent(event);
          }
        };
      }

      private wrapErrorListener(listener: EventListenerOrEventListenerObject) {
        return (event: Event) => {
          if (typeof listener === 'function') {
            listener(event);
          } else if (listener?.handleEvent) {
            listener.handleEvent(event);
          }
        };
      }

      private handleOpen(_event: Event): void {
        const connection = interceptor.connectionData.get(this.connectionId);
        if (!connection) return;

        const now = Date.now();
        const updates: Partial<WebSocketConnection> = {
          state: 'OPEN',
          connectedAt: now,
          lastActivity: now,
        };

        Object.assign(connection, updates);
        interceptor.emit('connectionUpdated', { id: this.connectionId, updates });

        const message: WebSocketMessage = {
          id: generateId(),
          connectionId: this.connectionId,
          timestamp: now,
          type: 'open',
          data: 'Connection opened',
          size: 0,
          binary: false,
        };

        interceptor.emit('messageAdded', message);
      }

      private handleMessage(event: MessageEvent): void {
        const connection = interceptor.connectionData.get(this.connectionId);
        if (!connection) return;

        const now = Date.now();
        const size = interceptor.calculateMessageSize(event.data);
        const isBinary = event.data instanceof ArrayBuffer || event.data instanceof Blob;

        connection.messageCount.received++;
        connection.bytesTransferred.received += size;
        connection.lastActivity = now;

        const message: WebSocketMessage = {
          id: generateId(),
          connectionId: this.connectionId,
          timestamp: now,
          type: 'receive',
          data: event.data,
          size,
          binary: isBinary,
        };

        interceptor.emit('messageAdded', message);
        interceptor.emit('connectionUpdated', { 
          id: this.connectionId, 
          updates: { 
            messageCount: connection.messageCount,
            bytesTransferred: connection.bytesTransferred,
            lastActivity: now
          }
        });
      }

      private handleClose(event: CloseEvent): void {
        const connection = interceptor.connectionData.get(this.connectionId);
        if (!connection) return;

        const now = Date.now();
        const updates: Partial<WebSocketConnection> = {
          state: 'CLOSED',
          closedAt: now,
          closeCode: event.code,
          closeReason: event.reason,
          lastActivity: now,
        };

        Object.assign(connection, updates);
        interceptor.emit('connectionUpdated', { id: this.connectionId, updates });

        const message: WebSocketMessage = {
          id: generateId(),
          connectionId: this.connectionId,
          timestamp: now,
          type: 'close',
          data: `Connection closed (${event.code}: ${event.reason})`,
          size: 0,
          binary: false,
        };

        interceptor.emit('messageAdded', message);
        interceptor.connections.delete(this);
      }

      private handleError(_event: Event): void {
        const connection = interceptor.connectionData.get(this.connectionId);
        if (!connection) return;

        const now = Date.now();
        const error: WebSocketError = {
          id: generateId(),
          connectionId: this.connectionId,
          timestamp: now,
          type: 'connection',
          error: 'WebSocket error occurred',
        };

        connection.errors.push(error);
        connection.lastActivity = now;

        interceptor.emit('errorOccurred', error);
        interceptor.emit('connectionUpdated', { 
          id: this.connectionId, 
          updates: { errors: connection.errors, lastActivity: now }
        });

        const message: WebSocketMessage = {
          id: generateId(),
          connectionId: this.connectionId,
          timestamp: now,
          type: 'error',
          data: 'WebSocket error',
          size: 0,
          binary: false,
          error: 'Connection error',
        };

        interceptor.emit('messageAdded', message);
      }

      // Override send method to track outgoing messages
      send(data: string | ArrayBufferLike | Blob | ArrayBufferView): void {
        const connection = interceptor.connectionData.get(this.connectionId);
        if (connection) {
          const now = Date.now();
          const size = interceptor.calculateMessageSize(data);
          const isBinary = !(typeof data === 'string');

          connection.messageCount.sent++;
          connection.bytesTransferred.sent += size;
          connection.lastActivity = now;

          const message: WebSocketMessage = {
            id: generateId(),
            connectionId: this.connectionId,
            timestamp: now,
            type: 'send',
            data,
            size,
            binary: isBinary,
          };

          interceptor.emit('messageAdded', message);
          interceptor.emit('connectionUpdated', { 
            id: this.connectionId, 
            updates: { 
              messageCount: connection.messageCount,
              bytesTransferred: connection.bytesTransferred,
              lastActivity: now
            }
          });
        }

        super.send(data);
      }

      // Override close method to track state
      close(code?: number, reason?: string): void {
        const connection = interceptor.connectionData.get(this.connectionId);
        if (connection) {
          const updates: Partial<WebSocketConnection> = {
            state: 'CLOSING',
            lastActivity: Date.now(),
          };
          Object.assign(connection, updates);
          interceptor.emit('connectionUpdated', { id: this.connectionId, updates });
        }

        super.close(code, reason);
      }

      get readyState(): number {
        return super.readyState;
      }
    };
  }

  private calculateMessageSize(data: unknown): number {
    if (typeof data === 'string') {
      return new Blob([data]).size;
    } else if (data instanceof ArrayBuffer) {
      return data.byteLength;
    } else if (data instanceof Blob) {
      return data.size;
    } else if ((data as { buffer?: ArrayBuffer })?.buffer instanceof ArrayBuffer) {
      return (data as { buffer: ArrayBuffer }).buffer.byteLength;
    }
    return 0;
  }
}