import { EventClient } from '@tanstack/devtools-event-client';
import type { DevToolsState, DevToolsAction } from '../types';
import { devToolsStore } from './devtools-store';

export interface WebSocketSignalREvents {
  'websocket-signalr:state': DevToolsState;
  'websocket-signalr:action': DevToolsAction;
}

export class WebSocketSignalRDevToolsClient extends EventClient<WebSocketSignalREvents> {
  private unsubscribe?: () => void;

  constructor() {
    super({
      pluginId: 'websocket-signalr'
    });

    // Enable interceptors when client is created
    devToolsStore.enableWebSocketInterception();
    devToolsStore.enableSignalRInterception();
  }

  subscribe = (callback: (events: WebSocketSignalREvents[keyof WebSocketSignalREvents], type: keyof WebSocketSignalREvents) => void) => {
    // Subscribe to store changes and emit state updates
    this.unsubscribe = devToolsStore.subscribe(() => {
      const state = devToolsStore.getSnapshot();
      callback(state, 'websocket-signalr:state');
    });

    // Send initial state
    const initialState = devToolsStore.getSnapshot();
    callback(initialState, 'websocket-signalr:state');

    return () => {
      this.unsubscribe?.();
      devToolsStore.disableWebSocketInterception();
      devToolsStore.disableSignalRInterception();
    };
  };

  // Handle incoming actions from DevTools
  handleAction = (action: DevToolsAction) => {
    devToolsStore.dispatch(action);
  };

  // Get current state
  getState = (): DevToolsState => {
    return devToolsStore.getSnapshot();
  };

  // Control methods
  clearWebSocketData = () => {
    devToolsStore.dispatch({ type: 'websocket/clear' });
  };

  clearSignalRData = () => {
    devToolsStore.dispatch({ type: 'signalr/clear' });
  };

  toggleWebSocketRecording = () => {
    devToolsStore.dispatch({ type: 'websocket/recording/toggle' });
  };

  toggleSignalRRecording = () => {
    devToolsStore.dispatch({ type: 'signalr/recording/toggle' });
  };

  closeConnection = (type: 'websocket' | 'signalr', id: string) => {
    devToolsStore.closeConnection(type, id);
  };

  updateFilter = (type: 'websocket' | 'signalr', filter: Record<string, unknown>) => {
    if (type === 'websocket') {
      devToolsStore.dispatch({ type: 'websocket/filter/update', payload: filter });
    } else {
      devToolsStore.dispatch({ type: 'signalr/filter/update', payload: filter });
    }
  };

  selectTab = (tab: 'websocket' | 'signalr' | 'performance') => {
    devToolsStore.dispatch({ type: 'ui/tab/select', payload: tab });
  };

  selectConnection = (id: string | undefined) => {
    devToolsStore.dispatch({ type: 'ui/connection/select', payload: id });
  };

  selectMessage = (id: string | undefined) => {
    devToolsStore.dispatch({ type: 'ui/message/select', payload: id });
  };

  toggleFilters = () => {
    devToolsStore.dispatch({ type: 'ui/filters/toggle' });
  };

  setTheme = (theme: 'light' | 'dark' | 'auto') => {
    devToolsStore.dispatch({ type: 'ui/theme/set', payload: theme });
  };
}

let clientInstance: WebSocketSignalRDevToolsClient | null = null;

export function createWebSocketSignalRDevToolsClient(): WebSocketSignalRDevToolsClient {
  if (!clientInstance) {
    clientInstance = new WebSocketSignalRDevToolsClient();
  }
  return clientInstance;
}

export function getWebSocketSignalRDevToolsClient(): WebSocketSignalRDevToolsClient | null {
  return clientInstance;
}