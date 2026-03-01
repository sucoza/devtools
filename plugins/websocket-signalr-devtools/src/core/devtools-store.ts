import { useSyncExternalStore } from 'use-sync-external-store/shim';
import { useRef, useCallback } from 'react';
import type { 
  DevToolsState, 
  DevToolsAction, 
  WebSocketConnection,
  WebSocketMessage,
  SignalRConnection,
  SignalRMessage,
  WebSocketMetrics,
  SignalRMetrics
} from '../types';
import { WebSocketInterceptor } from './websocket-interceptor';
import { SignalRInterceptor } from './signalr-interceptor';

class DevToolsStore {
  private state: DevToolsState = {
    websocket: {
      connections: new Map(),
      messages: [],
      metrics: {
        totalConnections: 0,
        activeConnections: 0,
        totalMessages: 0,
        totalBytes: 0,
        averageLatency: 0,
        errorRate: 0,
      },
      filter: {},
      isRecording: true,
      maxMessages: 1000,
    },
    signalr: {
      connections: new Map(),
      messages: [],
      metrics: {
        totalConnections: 0,
        activeConnections: 0,
        totalInvocations: 0,
        totalMessages: 0,
        totalBytes: 0,
        averageLatency: 0,
        reconnectionRate: 0,
        errorRate: 0,
        hubMethodStats: [],
      },
      filter: {},
      isRecording: true,
      maxMessages: 1000,
    },
    ui: {
      selectedTab: 'websocket',
      showFilters: false,
      theme: 'auto',
    },
    simulation: {
      isActive: false,
      connections: [],
      messageTemplates: [],
    },
  };

  private listeners = new Set<() => void>();
  private websocketInterceptor = new WebSocketInterceptor();
  private signalrInterceptor = new SignalRInterceptor();

  constructor() {
    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // WebSocket interceptor events
    this.websocketInterceptor.on('connectionCreated', (connection) => {
      this.dispatch({ type: 'websocket/connection/add', payload: connection });
    });

    this.websocketInterceptor.on('connectionUpdated', ({ id, updates }) => {
      this.dispatch({ type: 'websocket/connection/update', payload: { id, updates } });
    });

    this.websocketInterceptor.on('messageAdded', (message) => {
      if (this.state.websocket.isRecording) {
        this.dispatch({ type: 'websocket/message/add', payload: message });
      }
    });

    this.websocketInterceptor.on('errorOccurred', (_error) => {
      // Errors are already added to connection.errors in the interceptor
    });

    // SignalR interceptor events
    this.signalrInterceptor.on('connectionCreated', (connection) => {
      this.dispatch({ type: 'signalr/connection/add', payload: connection });
    });

    this.signalrInterceptor.on('connectionUpdated', ({ id, updates }) => {
      this.dispatch({ type: 'signalr/connection/update', payload: { id, updates } });
    });

    this.signalrInterceptor.on('messageAdded', (message) => {
      if (this.state.signalr.isRecording) {
        this.dispatch({ type: 'signalr/message/add', payload: message });
      }
    });

    this.signalrInterceptor.on('errorOccurred', (_error) => {
      // Errors are already added to connection.errors in the interceptor
    });
  }

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  getSnapshot = (): DevToolsState => {
    return this.state;
  };

  dispatch = (action: DevToolsAction): void => {
    this.state = this.reducer(this.state, action);
    this.notifyListeners();
  };

  private reducer(state: DevToolsState, action: DevToolsAction): DevToolsState {
    switch (action.type) {
      case 'websocket/connection/add': {
        const newConnections = new Map(state.websocket.connections);
        newConnections.set(action.payload.id, action.payload);
        
        return {
          ...state,
          websocket: {
            ...state.websocket,
            connections: newConnections,
            metrics: this.calculateWebSocketMetrics(newConnections, state.websocket.messages),
          },
        };
      }

      case 'websocket/connection/update': {
        const { id, updates } = action.payload;
        const connection = state.websocket.connections.get(id);
        if (!connection) return state;

        const newConnections = new Map(state.websocket.connections);
        newConnections.set(id, { ...connection, ...updates });

        return {
          ...state,
          websocket: {
            ...state.websocket,
            connections: newConnections,
            metrics: this.calculateWebSocketMetrics(newConnections, state.websocket.messages),
          },
        };
      }

      case 'websocket/connection/remove': {
        const newConnections = new Map(state.websocket.connections);
        newConnections.delete(action.payload);

        return {
          ...state,
          websocket: {
            ...state.websocket,
            connections: newConnections,
            metrics: this.calculateWebSocketMetrics(newConnections, state.websocket.messages),
          },
        };
      }

      case 'websocket/message/add': {
        const messages = [...state.websocket.messages, action.payload];
        // Keep only the most recent messages
        if (messages.length > state.websocket.maxMessages) {
          messages.splice(0, messages.length - state.websocket.maxMessages);
        }

        return {
          ...state,
          websocket: {
            ...state.websocket,
            messages,
            metrics: this.calculateWebSocketMetrics(state.websocket.connections, messages),
          },
        };
      }

      case 'websocket/filter/update': {
        return {
          ...state,
          websocket: {
            ...state.websocket,
            filter: { ...state.websocket.filter, ...action.payload },
          },
        };
      }

      case 'websocket/recording/toggle': {
        return {
          ...state,
          websocket: {
            ...state.websocket,
            isRecording: !state.websocket.isRecording,
          },
        };
      }

      case 'websocket/clear': {
        return {
          ...state,
          websocket: {
            ...state.websocket,
            connections: new Map(),
            messages: [],
            metrics: {
              totalConnections: 0,
              activeConnections: 0,
              totalMessages: 0,
              totalBytes: 0,
              averageLatency: 0,
              errorRate: 0,
            },
          },
        };
      }

      case 'signalr/connection/add': {
        const newConnections = new Map(state.signalr.connections);
        newConnections.set(action.payload.id, action.payload);
        
        return {
          ...state,
          signalr: {
            ...state.signalr,
            connections: newConnections,
            metrics: this.calculateSignalRMetrics(newConnections, state.signalr.messages),
          },
        };
      }

      case 'signalr/connection/update': {
        const { id, updates } = action.payload;
        const connection = state.signalr.connections.get(id);
        if (!connection) return state;

        const newConnections = new Map(state.signalr.connections);
        newConnections.set(id, { ...connection, ...updates });

        return {
          ...state,
          signalr: {
            ...state.signalr,
            connections: newConnections,
            metrics: this.calculateSignalRMetrics(newConnections, state.signalr.messages),
          },
        };
      }

      case 'signalr/connection/remove': {
        const newConnections = new Map(state.signalr.connections);
        newConnections.delete(action.payload);

        return {
          ...state,
          signalr: {
            ...state.signalr,
            connections: newConnections,
            metrics: this.calculateSignalRMetrics(newConnections, state.signalr.messages),
          },
        };
      }

      case 'signalr/message/add': {
        const messages = [...state.signalr.messages, action.payload];
        // Keep only the most recent messages
        if (messages.length > state.signalr.maxMessages) {
          messages.splice(0, messages.length - state.signalr.maxMessages);
        }

        return {
          ...state,
          signalr: {
            ...state.signalr,
            messages,
            metrics: this.calculateSignalRMetrics(state.signalr.connections, messages),
          },
        };
      }

      case 'signalr/filter/update': {
        return {
          ...state,
          signalr: {
            ...state.signalr,
            filter: { ...state.signalr.filter, ...action.payload },
          },
        };
      }

      case 'signalr/recording/toggle': {
        return {
          ...state,
          signalr: {
            ...state.signalr,
            isRecording: !state.signalr.isRecording,
          },
        };
      }

      case 'signalr/clear': {
        return {
          ...state,
          signalr: {
            ...state.signalr,
            connections: new Map(),
            messages: [],
            metrics: {
              totalConnections: 0,
              activeConnections: 0,
              totalInvocations: 0,
              totalMessages: 0,
              totalBytes: 0,
              averageLatency: 0,
              reconnectionRate: 0,
              errorRate: 0,
              hubMethodStats: [],
            },
          },
        };
      }

      case 'ui/tab/select': {
        return {
          ...state,
          ui: {
            ...state.ui,
            selectedTab: action.payload,
          },
        };
      }

      case 'ui/connection/select': {
        return {
          ...state,
          ui: {
            ...state.ui,
            selectedConnectionId: action.payload,
            selectedMessageId: undefined, // Clear selected message when changing connection
          },
        };
      }

      case 'ui/message/select': {
        return {
          ...state,
          ui: {
            ...state.ui,
            selectedMessageId: action.payload,
          },
        };
      }

      case 'ui/filters/toggle': {
        return {
          ...state,
          ui: {
            ...state.ui,
            showFilters: !state.ui.showFilters,
          },
        };
      }

      case 'ui/theme/set': {
        return {
          ...state,
          ui: {
            ...state.ui,
            theme: action.payload,
          },
        };
      }

      default:
        return state;
    }
  }

  private calculateWebSocketMetrics(
    connections: Map<string, WebSocketConnection>,
    messages: WebSocketMessage[]
  ): WebSocketMetrics {
    const connectionsArray = Array.from(connections.values());
    const totalConnections = connectionsArray.length;
    const activeConnections = connectionsArray.filter(c => c.state === 'OPEN').length;
    const totalMessages = messages.length;
    const totalBytes = connectionsArray.reduce(
      (sum, conn) => sum + conn.bytesTransferred.sent + conn.bytesTransferred.received,
      0
    );

    // Calculate error rate
    const totalErrors = connectionsArray.reduce((sum, conn) => sum + conn.errors.length, 0);
    const errorRate = totalConnections > 0 ? (totalErrors / totalConnections) * 100 : 0;

    // TODO: Calculate average latency (requires ping/pong implementation)
    const averageLatency = 0;

    return {
      totalConnections,
      activeConnections,
      totalMessages,
      totalBytes,
      averageLatency,
      errorRate,
    };
  }

  private calculateSignalRMetrics(
    connections: Map<string, SignalRConnection>,
    messages: SignalRMessage[]
  ): SignalRMetrics {
    const connectionsArray = Array.from(connections.values());
    const totalConnections = connectionsArray.length;
    const activeConnections = connectionsArray.filter(c => c.state === 'Connected').length;
    const totalMessages = messages.length;
    const totalInvocations = messages.filter(m => m.type === 'Invocation').length;
    const totalBytes = connectionsArray.reduce(
      (sum, conn) => sum + conn.bytesTransferred.sent + conn.bytesTransferred.received,
      0
    );

    // Calculate reconnection rate
    const totalReconnects = connectionsArray.reduce((sum, conn) => sum + conn.reconnectAttempts, 0);
    const reconnectionRate = totalConnections > 0 ? (totalReconnects / totalConnections) : 0;

    // Calculate error rate
    const totalErrors = connectionsArray.reduce((sum, conn) => sum + conn.errors.length, 0);
    const errorRate = totalConnections > 0 ? (totalErrors / totalConnections) * 100 : 0;

    // Collect hub method stats
    const hubMethodStats = new Map();
    connectionsArray.forEach(conn => {
      conn.hubMethods.forEach((method, name) => {
        if (hubMethodStats.has(name)) {
          const existing = hubMethodStats.get(name);
          const prevCount = existing.invocationCount;
          const newCount = prevCount + method.invocationCount;
          existing.averageExecutionTime = newCount > 0
            ? (existing.averageExecutionTime * prevCount + method.averageExecutionTime * method.invocationCount) / newCount
            : 0;
          existing.invocationCount = newCount;
          existing.errorCount += method.errorCount;
          existing.lastInvoked = Math.max(existing.lastInvoked, method.lastInvoked);
        } else {
          hubMethodStats.set(name, { ...method });
        }
      });
    });

    // TODO: Calculate average latency
    const averageLatency = 0;

    return {
      totalConnections,
      activeConnections,
      totalInvocations,
      totalMessages,
      totalBytes,
      averageLatency,
      reconnectionRate,
      errorRate,
      hubMethodStats: Array.from(hubMethodStats.values()),
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener());
  }

  // Public methods for controlling interceptors
  enableWebSocketInterception(): void {
    this.websocketInterceptor.enable();
  }

  disableWebSocketInterception(): void {
    this.websocketInterceptor.disable();
  }

  enableSignalRInterception(): void {
    this.signalrInterceptor.enable();
  }

  disableSignalRInterception(): void {
    this.signalrInterceptor.disable();
  }

  closeConnection(type: 'websocket' | 'signalr', id: string): void {
    if (type === 'websocket') {
      this.websocketInterceptor.closeConnection(id);
    } else {
      this.signalrInterceptor.closeConnection(id);
    }
  }
}

export const devToolsStore = new DevToolsStore();

// Hook for React components
export function useDevToolsStore(): DevToolsState {
  return useSyncExternalStore(
    devToolsStore.subscribe,
    devToolsStore.getSnapshot,
    devToolsStore.getSnapshot
  );
}

// Hook with selector for performance
export function useDevToolsSelector<T>(selector: (state: DevToolsState) => T): T {
  // Memoize the selector result to prevent infinite loops
  const selectorRef = useRef(selector);
  const resultRef = useRef<T | undefined>(undefined);
  
  // Update selector ref on each render
  selectorRef.current = selector;
  
  // Create stable getSnapshot that caches result
  const getSnapshot = useCallback(() => {
    const state = devToolsStore.getSnapshot();
    const newResult = selectorRef.current(state);
    
    // Only update if result actually changed (using Object.is for comparison)
    if (!Object.is(resultRef.current, newResult)) {
      resultRef.current = newResult;
    }
    
    return resultRef.current as T;
  }, []);
  
  return useSyncExternalStore(
    devToolsStore.subscribe,
    getSnapshot,
    getSnapshot
  );
}

export { devToolsStore as store };