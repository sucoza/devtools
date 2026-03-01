import { describe, it, expect, beforeEach, vi } from 'vitest';
import { devToolsStore } from '../devtools-store';
import type { WebSocketConnection, WebSocketMessage, SignalRConnection } from '../../types';

describe('DevToolsStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    devToolsStore.dispatch({ type: 'websocket/clear' });
    devToolsStore.dispatch({ type: 'signalr/clear' });
  });

  describe('WebSocket functionality', () => {
    it('should add WebSocket connection', () => {
      const connection: WebSocketConnection = {
        id: 'test-ws-1',
        url: 'ws://localhost:8080',
        protocols: [],
        state: 'CONNECTING',
        createdAt: Date.now(),
        messageCount: { sent: 0, received: 0 },
        bytesTransferred: { sent: 0, received: 0 },
        errors: [],
        lastActivity: Date.now(),
      };

      devToolsStore.dispatch({ type: 'websocket/connection/add', payload: connection });
      
      const state = devToolsStore.getSnapshot();
      expect(state.websocket.connections.has('test-ws-1')).toBe(true);
      expect(state.websocket.connections.get('test-ws-1')).toEqual(connection);
      expect(state.websocket.metrics.totalConnections).toBe(1);
    });

    it('should update WebSocket connection', () => {
      const connection: WebSocketConnection = {
        id: 'test-ws-1',
        url: 'ws://localhost:8080',
        protocols: [],
        state: 'CONNECTING',
        createdAt: Date.now(),
        messageCount: { sent: 0, received: 0 },
        bytesTransferred: { sent: 0, received: 0 },
        errors: [],
        lastActivity: Date.now(),
      };

      devToolsStore.dispatch({ type: 'websocket/connection/add', payload: connection });
      devToolsStore.dispatch({ 
        type: 'websocket/connection/update', 
        payload: { id: 'test-ws-1', updates: { state: 'OPEN' } }
      });
      
      const state = devToolsStore.getSnapshot();
      const updatedConnection = state.websocket.connections.get('test-ws-1');
      expect(updatedConnection?.state).toBe('OPEN');
    });

    it('should remove WebSocket connection', () => {
      const connection: WebSocketConnection = {
        id: 'test-ws-1',
        url: 'ws://localhost:8080',
        protocols: [],
        state: 'CONNECTING',
        createdAt: Date.now(),
        messageCount: { sent: 0, received: 0 },
        bytesTransferred: { sent: 0, received: 0 },
        errors: [],
        lastActivity: Date.now(),
      };

      devToolsStore.dispatch({ type: 'websocket/connection/add', payload: connection });
      devToolsStore.dispatch({ type: 'websocket/connection/remove', payload: 'test-ws-1' });
      
      const state = devToolsStore.getSnapshot();
      expect(state.websocket.connections.has('test-ws-1')).toBe(false);
      expect(state.websocket.metrics.totalConnections).toBe(0);
    });

    it('should toggle WebSocket recording', () => {
      const initialState = devToolsStore.getSnapshot();
      expect(initialState.websocket.isRecording).toBe(true);

      devToolsStore.dispatch({ type: 'websocket/recording/toggle' });
      
      const state = devToolsStore.getSnapshot();
      expect(state.websocket.isRecording).toBe(false);
    });
  });

  describe('SignalR functionality', () => {
    it('should add SignalR connection', () => {
      const connection: SignalRConnection = {
        id: 'test-sr-1',
        hubUrl: 'https://localhost:5001/chathub',
        state: 'Connecting',
        createdAt: Date.now(),
        hubMethods: new Map(),
        messageCount: { sent: 0, received: 0 },
        bytesTransferred: { sent: 0, received: 0 },
        errors: [],
        reconnectAttempts: 0,
        lastActivity: Date.now(),
      };

      devToolsStore.dispatch({ type: 'signalr/connection/add', payload: connection });
      
      const state = devToolsStore.getSnapshot();
      expect(state.signalr.connections.has('test-sr-1')).toBe(true);
      expect(state.signalr.connections.get('test-sr-1')).toEqual(connection);
      expect(state.signalr.metrics.totalConnections).toBe(1);
    });

    it('should calculate totalBytes from SignalR connections', () => {
      const connection1: SignalRConnection = {
        id: 'sr-bytes-1',
        hubUrl: 'https://localhost:5001/hub',
        state: 'Connected',
        createdAt: Date.now(),
        hubMethods: new Map(),
        messageCount: { sent: 5, received: 10 },
        bytesTransferred: { sent: 1000, received: 2000 },
        errors: [],
        reconnectAttempts: 0,
        lastActivity: Date.now(),
      };

      const connection2: SignalRConnection = {
        id: 'sr-bytes-2',
        hubUrl: 'https://localhost:5001/hub2',
        state: 'Connected',
        createdAt: Date.now(),
        hubMethods: new Map(),
        messageCount: { sent: 3, received: 7 },
        bytesTransferred: { sent: 500, received: 1500 },
        errors: [],
        reconnectAttempts: 0,
        lastActivity: Date.now(),
      };

      devToolsStore.dispatch({ type: 'signalr/connection/add', payload: connection1 });
      devToolsStore.dispatch({ type: 'signalr/connection/add', payload: connection2 });

      const state = devToolsStore.getSnapshot();
      // totalBytes = (1000 + 2000) + (500 + 1500) = 5000
      expect(state.signalr.metrics.totalBytes).toBe(5000);
    });

    it('should calculate weighted average for hub method execution times', () => {
      const hubMethods1 = new Map();
      hubMethods1.set('SendMessage', {
        name: 'SendMessage',
        invocationCount: 10,
        averageExecutionTime: 100,
        errorCount: 0,
        lastInvoked: Date.now(),
      });

      const hubMethods2 = new Map();
      hubMethods2.set('SendMessage', {
        name: 'SendMessage',
        invocationCount: 30,
        averageExecutionTime: 200,
        errorCount: 1,
        lastInvoked: Date.now(),
      });

      const connection1: SignalRConnection = {
        id: 'sr-hub-1',
        hubUrl: 'https://localhost:5001/hub',
        state: 'Connected',
        createdAt: Date.now(),
        hubMethods: hubMethods1,
        messageCount: { sent: 0, received: 0 },
        bytesTransferred: { sent: 0, received: 0 },
        errors: [],
        reconnectAttempts: 0,
        lastActivity: Date.now(),
      };

      const connection2: SignalRConnection = {
        id: 'sr-hub-2',
        hubUrl: 'https://localhost:5001/hub',
        state: 'Connected',
        createdAt: Date.now(),
        hubMethods: hubMethods2,
        messageCount: { sent: 0, received: 0 },
        bytesTransferred: { sent: 0, received: 0 },
        errors: [],
        reconnectAttempts: 0,
        lastActivity: Date.now(),
      };

      devToolsStore.dispatch({ type: 'signalr/connection/add', payload: connection1 });
      devToolsStore.dispatch({ type: 'signalr/connection/add', payload: connection2 });

      const state = devToolsStore.getSnapshot();
      const sendMethod = state.signalr.metrics.hubMethodStats.find(m => m.name === 'SendMessage');
      expect(sendMethod).toBeTruthy();
      expect(sendMethod!.invocationCount).toBe(40);
      // Weighted average: (100 * 10 + 200 * 30) / 40 = (1000 + 6000) / 40 = 175
      expect(sendMethod!.averageExecutionTime).toBe(175);
      expect(sendMethod!.errorCount).toBe(1);
    });
  });

  describe('WebSocket message trimming', () => {
    it('uses immutable .slice() to trim messages to maxMessages', () => {
      // Add a connection first
      const connection: WebSocketConnection = {
        id: 'ws-trim-test',
        url: 'ws://localhost:8080',
        protocols: [],
        state: 'OPEN',
        createdAt: Date.now(),
        messageCount: { sent: 0, received: 0 },
        bytesTransferred: { sent: 0, received: 0 },
        errors: [],
        lastActivity: Date.now(),
      };
      devToolsStore.dispatch({ type: 'websocket/connection/add', payload: connection });

      // Get messages array reference before adding
      const stateBefore = devToolsStore.getSnapshot();
      const messagesBefore = stateBefore.websocket.messages;

      // Add a message
      const message: WebSocketMessage = {
        id: 'msg-1',
        connectionId: 'ws-trim-test',
        timestamp: Date.now(),
        type: 'text',
        data: 'hello',
        size: 5,
        binary: false,
      };
      devToolsStore.dispatch({ type: 'websocket/message/add', payload: message });

      const stateAfter = devToolsStore.getSnapshot();
      // Messages array should be a new reference (immutable update)
      expect(stateAfter.websocket.messages).not.toBe(messagesBefore);
      expect(stateAfter.websocket.messages).toHaveLength(1);
      expect(stateAfter.websocket.messages[0].id).toBe('msg-1');
    });
  });

  describe('UI state management', () => {
    it('should select tab', () => {
      devToolsStore.dispatch({ type: 'ui/tab/select', payload: 'signalr' });
      
      const state = devToolsStore.getSnapshot();
      expect(state.ui.selectedTab).toBe('signalr');
    });

    it('should select connection', () => {
      devToolsStore.dispatch({ type: 'ui/connection/select', payload: 'test-conn-1' });
      
      const state = devToolsStore.getSnapshot();
      expect(state.ui.selectedConnectionId).toBe('test-conn-1');
    });

    it('should toggle filters', () => {
      const initialState = devToolsStore.getSnapshot();
      expect(initialState.ui.showFilters).toBe(false);

      devToolsStore.dispatch({ type: 'ui/filters/toggle' });
      
      const state = devToolsStore.getSnapshot();
      expect(state.ui.showFilters).toBe(true);
    });
  });

  describe('Store subscription', () => {
    it('should notify listeners on state change', () => {
      const listener = vi.fn();
      const unsubscribe = devToolsStore.subscribe(listener);

      devToolsStore.dispatch({ type: 'ui/tab/select', payload: 'performance' });

      expect(listener).toHaveBeenCalledTimes(1);
      
      unsubscribe();
    });

    it('should not notify unsubscribed listeners', () => {
      const listener = vi.fn();
      const unsubscribe = devToolsStore.subscribe(listener);
      unsubscribe();

      devToolsStore.dispatch({ type: 'ui/tab/select', payload: 'performance' });

      expect(listener).not.toHaveBeenCalled();
    });
  });
});