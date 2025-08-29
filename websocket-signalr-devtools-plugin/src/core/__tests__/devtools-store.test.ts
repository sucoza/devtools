import { describe, it, expect, beforeEach, vi } from 'vitest';
import { devToolsStore } from '../devtools-store';
import type { WebSocketConnection, SignalRConnection } from '../../types';

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