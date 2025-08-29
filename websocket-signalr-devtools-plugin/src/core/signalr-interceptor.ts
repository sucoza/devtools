import type {
  SignalRConnection,
  SignalRMessage,
  SignalRConnectionState,
  SignalRMessageType,
  SignalRHubMethod,
  SignalRError,
  SignalRTransport
} from '../types/signalr';
import { EventEmitter } from './event-emitter';
import { generateId } from '../utils/id-generator';

export class SignalRInterceptor extends EventEmitter<{
  connectionCreated: SignalRConnection;
  connectionUpdated: { id: string; updates: Partial<SignalRConnection> };
  connectionClosed: string;
  messageAdded: SignalRMessage;
  errorOccurred: SignalRError;
  hubMethodCalled: { connectionId: string; method: SignalRHubMethod };
}> {
  private connections = new Map<any, string>();
  private connectionData = new Map<string, SignalRConnection>();
  private isEnabled = false;
  private originalHubConnection: any;

  constructor() {
    super();
  }

  enable(): void {
    if (this.isEnabled) return;
    this.isEnabled = true;
    this.interceptSignalR();
  }

  disable(): void {
    if (!this.isEnabled) return;
    this.isEnabled = false;
    this.connections.clear();
    this.connectionData.clear();
  }

  getConnection(id: string): SignalRConnection | undefined {
    return this.connectionData.get(id);
  }

  getAllConnections(): SignalRConnection[] {
    return Array.from(this.connectionData.values());
  }

  closeConnection(id: string): void {
    const connection = this.connectionData.get(id);
    if (!connection) return;

    const hubConnection = Array.from(this.connections.entries())
      .find(([_, connId]) => connId === id)?.[0];
    
    if (hubConnection?.stop) {
      hubConnection.stop();
    }
  }

  private interceptSignalR(): void {
    // Intercept @microsoft/signalr library
    this.interceptSignalRModule();
    
    // Also try to intercept global signalR if available
    this.interceptGlobalSignalR();
  }

  private interceptSignalRModule(): void {
    try {
      // Dynamic import to avoid breaking if SignalR is not available
      const signalR = (window as any).signalR || 
                     (global as any).signalR ||
                     require?.('@microsoft/signalr');
      
      if (signalR?.HubConnectionBuilder) {
        this.interceptHubConnectionBuilder(signalR.HubConnectionBuilder);
      }
    } catch (error) {
      // SignalR not available, skip interception
    }
  }

  private interceptGlobalSignalR(): void {
    // Check for global signalR object (older versions)
    const globalSignalR = (window as any).signalR;
    if (globalSignalR?.HubConnectionBuilder) {
      this.interceptHubConnectionBuilder(globalSignalR.HubConnectionBuilder);
    }
  }

  private interceptHubConnectionBuilder(HubConnectionBuilder: any): void {
    const interceptor = this;
    const originalBuild = HubConnectionBuilder.prototype.build;

    HubConnectionBuilder.prototype.build = function() {
      const hubConnection = originalBuild.call(this);
      interceptor.wrapHubConnection(hubConnection);
      return hubConnection;
    };
  }

  private wrapHubConnection(hubConnection: any): void {
    const connectionId = generateId();
    const startTime = Date.now();
    
    // Extract URL from hub connection
    const baseUrl = hubConnection.baseUrl || hubConnection._baseUrl || 'Unknown';
    
    const connection: SignalRConnection = {
      id: connectionId,
      hubUrl: baseUrl,
      state: 'Disconnected',
      createdAt: startTime,
      hubMethods: new Map(),
      messageCount: { sent: 0, received: 0 },
      bytesTransferred: { sent: 0, received: 0 },
      errors: [],
      reconnectAttempts: 0,
      lastActivity: startTime,
      features: {
        automaticReconnect: hubConnection._reconnectPolicy ? true : false,
        serverTimeout: hubConnection._serverTimeoutInMilliseconds,
        keepAliveInterval: hubConnection._keepAliveIntervalInMilliseconds,
      }
    };

    this.connections.set(hubConnection, connectionId);
    this.connectionData.set(connectionId, connection);
    this.emit('connectionCreated', connection);

    // Wrap connection methods
    this.wrapConnectionMethods(hubConnection, connectionId);
    this.wrapConnectionEvents(hubConnection, connectionId);
  }

  private wrapConnectionMethods(hubConnection: any, connectionId: string): void {
    const interceptor = this;
    const connection = this.connectionData.get(connectionId)!;

    // Wrap start method
    const originalStart = hubConnection.start.bind(hubConnection);
    hubConnection.start = async function() {
      const startTime = Date.now();
      
      interceptor.updateConnection(connectionId, { 
        state: 'Connecting',
        lastActivity: startTime 
      });

      try {
        const result = await originalStart();
        
        interceptor.updateConnection(connectionId, { 
          state: 'Connected',
          connectedAt: Date.now(),
          connectionId: hubConnection.connectionId,
          transport: interceptor.getTransportName(hubConnection),
          lastActivity: Date.now()
        });

        interceptor.addMessage(connectionId, {
          type: 'Handshake',
          direction: 'send',
          size: 0,
        });

        return result;
      } catch (error) {
        const errorObj: SignalRError = {
          id: generateId(),
          connectionId,
          timestamp: Date.now(),
          type: 'connection',
          error: error instanceof Error ? error.message : String(error),
        };

        connection.errors.push(errorObj);
        interceptor.emit('errorOccurred', errorObj);
        
        interceptor.updateConnection(connectionId, { 
          state: 'Disconnected',
          errors: connection.errors,
          lastActivity: Date.now()
        });

        throw error;
      }
    };

    // Wrap stop method
    const originalStop = hubConnection.stop.bind(hubConnection);
    hubConnection.stop = async function() {
      interceptor.updateConnection(connectionId, { 
        state: 'Disconnecting',
        lastActivity: Date.now()
      });

      try {
        const result = await originalStop();
        
        interceptor.updateConnection(connectionId, { 
          state: 'Disconnected',
          disconnectedAt: Date.now(),
          lastActivity: Date.now()
        });

        interceptor.addMessage(connectionId, {
          type: 'Close',
          direction: 'send',
          size: 0,
        });

        return result;
      } catch (error) {
        const errorObj: SignalRError = {
          id: generateId(),
          connectionId,
          timestamp: Date.now(),
          type: 'connection',
          error: error instanceof Error ? error.message : String(error),
        };

        connection.errors.push(errorObj);
        interceptor.emit('errorOccurred', errorObj);
        throw error;
      }
    };

    // Wrap invoke method
    const originalInvoke = hubConnection.invoke.bind(hubConnection);
    hubConnection.invoke = async function(methodName: string, ...args: any[]) {
      const invocationId = generateId();
      const startTime = Date.now();

      interceptor.addMessage(connectionId, {
        type: 'Invocation',
        direction: 'send',
        target: methodName,
        arguments: args,
        invocationId,
        size: interceptor.calculateSize(args),
      });

      interceptor.updateHubMethodStats(connectionId, methodName, startTime);

      try {
        const result = await originalInvoke(methodName, ...args);
        const endTime = Date.now();

        interceptor.addMessage(connectionId, {
          type: 'Completion',
          direction: 'receive',
          target: methodName,
          result,
          invocationId,
          size: interceptor.calculateSize(result),
        });

        interceptor.updateHubMethodStats(connectionId, methodName, startTime, endTime);
        return result;
      } catch (error) {
        const errorObj: SignalRError = {
          id: generateId(),
          connectionId,
          timestamp: Date.now(),
          type: 'invocation',
          error: error instanceof Error ? error.message : String(error),
          hubMethod: methodName,
          invocationId,
        };

        connection.errors.push(errorObj);
        interceptor.emit('errorOccurred', errorObj);

        interceptor.addMessage(connectionId, {
          type: 'Completion',
          direction: 'receive',
          target: methodName,
          error: errorObj.error,
          invocationId,
          size: 0,
        });

        throw error;
      }
    };

    // Wrap send method
    const originalSend = hubConnection.send.bind(hubConnection);
    hubConnection.send = function(methodName: string, ...args: any[]) {
      interceptor.addMessage(connectionId, {
        type: 'Invocation',
        direction: 'send',
        target: methodName,
        arguments: args,
        size: interceptor.calculateSize(args),
      });

      interceptor.updateHubMethodStats(connectionId, methodName, Date.now());
      return originalSend(methodName, ...args);
    };

    // Wrap on method for incoming messages
    const originalOn = hubConnection.on.bind(hubConnection);
    hubConnection.on = function(methodName: string, newMethod: (...args: any[]) => void) {
      const wrappedMethod = (...args: any[]) => {
        interceptor.addMessage(connectionId, {
          type: 'Invocation',
          direction: 'receive',
          target: methodName,
          arguments: args,
          size: interceptor.calculateSize(args),
        });

        return newMethod(...args);
      };

      return originalOn(methodName, wrappedMethod);
    };
  }

  private wrapConnectionEvents(hubConnection: any, connectionId: string): void {
    const connection = this.connectionData.get(connectionId)!;

    // Handle reconnecting event
    hubConnection.onreconnecting = (error?: Error) => {
      connection.reconnectAttempts++;
      
      this.updateConnection(connectionId, { 
        state: 'Reconnecting',
        reconnectAttempts: connection.reconnectAttempts,
        lastActivity: Date.now()
      });

      if (error) {
        const errorObj: SignalRError = {
          id: generateId(),
          connectionId,
          timestamp: Date.now(),
          type: 'connection',
          error: error.message,
        };

        connection.errors.push(errorObj);
        this.emit('errorOccurred', errorObj);
      }
    };

    // Handle reconnected event
    hubConnection.onreconnected = (connectionIdString?: string) => {
      this.updateConnection(connectionId, { 
        state: 'Connected',
        connectionId: connectionIdString || hubConnection.connectionId,
        lastActivity: Date.now()
      });

      this.addMessage(connectionId, {
        type: 'Handshake',
        direction: 'send',
        size: 0,
      });
    };

    // Handle close event
    hubConnection.onclose = (error?: Error) => {
      this.updateConnection(connectionId, { 
        state: 'Disconnected',
        disconnectedAt: Date.now(),
        lastActivity: Date.now()
      });

      if (error) {
        const errorObj: SignalRError = {
          id: generateId(),
          connectionId,
          timestamp: Date.now(),
          type: 'connection',
          error: error.message,
        };

        connection.errors.push(errorObj);
        this.emit('errorOccurred', errorObj);
      }

      this.addMessage(connectionId, {
        type: 'Close',
        direction: 'receive',
        size: 0,
      });
    };
  }

  private updateConnection(id: string, updates: Partial<SignalRConnection>): void {
    const connection = this.connectionData.get(id);
    if (!connection) return;

    Object.assign(connection, updates);
    this.emit('connectionUpdated', { id, updates });
  }

  private addMessage(connectionId: string, messageData: Partial<SignalRMessage>): void {
    const message: SignalRMessage = {
      id: generateId(),
      connectionId,
      timestamp: Date.now(),
      direction: 'send',
      type: 'Invocation',
      size: 0,
      ...messageData,
    };

    const connection = this.connectionData.get(connectionId);
    if (connection) {
      if (message.direction === 'send') {
        connection.messageCount.sent++;
        connection.bytesTransferred.sent += message.size;
      } else {
        connection.messageCount.received++;
        connection.bytesTransferred.received += message.size;
      }
      connection.lastActivity = message.timestamp;
      
      this.emit('connectionUpdated', { 
        id: connectionId, 
        updates: { 
          messageCount: connection.messageCount,
          bytesTransferred: connection.bytesTransferred,
          lastActivity: connection.lastActivity
        }
      });
    }

    this.emit('messageAdded', message);
  }

  private updateHubMethodStats(connectionId: string, methodName: string, startTime: number, endTime?: number): void {
    const connection = this.connectionData.get(connectionId);
    if (!connection) return;

    let method = connection.hubMethods.get(methodName);
    if (!method) {
      method = {
        name: methodName,
        invocationCount: 0,
        averageExecutionTime: 0,
        errorCount: 0,
        lastInvoked: startTime,
      };
      connection.hubMethods.set(methodName, method);
    }

    method.invocationCount++;
    method.lastInvoked = startTime;

    if (endTime) {
      const executionTime = endTime - startTime;
      method.averageExecutionTime = (method.averageExecutionTime + executionTime) / 2;
    }

    this.emit('hubMethodCalled', { connectionId, method });
  }

  private getTransportName(hubConnection: any): SignalRTransport | undefined {
    const transport = hubConnection._transport || hubConnection.transport;
    if (!transport) return undefined;

    // Extract transport name from the transport object
    if (transport.name) return transport.name;
    if (transport.constructor?.name) {
      const name = transport.constructor.name;
      if (name.includes('WebSocket')) return 'WebSockets';
      if (name.includes('ServerSent') || name.includes('EventSource')) return 'ServerSentEvents';
      if (name.includes('LongPolling')) return 'LongPolling';
    }

    return undefined;
  }

  private calculateSize(data: any): number {
    if (data === null || data === undefined) return 0;
    
    try {
      return new Blob([JSON.stringify(data)]).size;
    } catch {
      return new Blob([String(data)]).size;
    }
  }
}