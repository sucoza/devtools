import type { DevToolsState, DevToolsAction } from '../types';
import { getDevToolsStore } from './devtools-store';

// Basic event client interface (simplified from @tanstack/devtools)
export interface DevToolsEventClient<TEvents extends Record<string, any>> {
  subscribe: (callback: (event: TEvents[keyof TEvents], type: keyof TEvents) => void) => () => void;
}

export interface ApiMockInterceptorEvents {
  'api-mock-interceptor:state': DevToolsState;
  'api-mock-interceptor:action': DevToolsAction;
}

export class ApiMockInterceptorDevToolsClient implements DevToolsEventClient<ApiMockInterceptorEvents> {
  private unsubscribe?: () => void;
  private store = getDevToolsStore();

  constructor() {
    // Enable interception when client is created
    this.store.enableInterception();
  }

  subscribe = (callback: (events: ApiMockInterceptorEvents[keyof ApiMockInterceptorEvents], type: keyof ApiMockInterceptorEvents) => void) => {
    // Subscribe to store changes and emit state updates
    this.unsubscribe = this.store.subscribe(() => {
      const state = this.store.getSnapshot();
      callback(state, 'api-mock-interceptor:state');
    });

    // Send initial state
    const initialState = this.store.getSnapshot();
    callback(initialState, 'api-mock-interceptor:state');

    return () => {
      this.unsubscribe?.();
      this.store.disableInterception();
    };
  };

  // Handle incoming actions from DevTools
  handleAction = (action: DevToolsAction) => {
    this.store.dispatch(action);
  };

  // Get current state
  getState = (): DevToolsState => {
    return this.store.getSnapshot();
  };

  // Control methods
  clearApiCalls = () => {
    this.store.clearApiCalls();
  };

  toggleInterception = () => {
    const state = this.store.getSnapshot();
    if (state.isInterceptionEnabled) {
      this.store.disableInterception();
    } else {
      this.store.enableInterception();
    }
  };

  toggleRecording = () => {
    this.store.dispatch({ type: 'recording/toggle' });
  };

  addMockRule = (rule: import('../types').MockRule) => {
    this.store.addMockRule(rule);
  };

  updateMockRule = (id: string, updates: Partial<import('../types').MockRule>) => {
    this.store.updateMockRule(id, updates);
  };

  removeMockRule = (id: string) => {
    this.store.removeMockRule(id);
  };

  toggleMockRule = (id: string) => {
    this.store.toggleMockRule(id);
  };

  setNetworkConditions = (conditions: import('../types').NetworkConditions) => {
    this.store.setNetworkConditions(conditions);
  };

  selectTab = (tab: 'calls' | 'mocks' | 'scenarios' | 'settings') => {
    this.store.dispatch({ type: 'ui/tab/select', payload: tab });
  };

  selectCall = (id: string | undefined) => {
    this.store.dispatch({ type: 'ui/call/select', payload: id });
  };

  selectRule = (id: string | undefined) => {
    this.store.dispatch({ type: 'ui/rule/select', payload: id });
  };

  selectScenario = (id: string | undefined) => {
    this.store.dispatch({ type: 'ui/scenario/select', payload: id });
  };

  toggleFilters = () => {
    this.store.dispatch({ type: 'ui/filters/toggle' });
  };

  setTheme = (theme: 'light' | 'dark' | 'auto') => {
    this.store.dispatch({ type: 'ui/theme/set', payload: theme });
  };

  updateFilter = (filter: Partial<import('../types').ApiCallFilter>) => {
    this.store.dispatch({ type: 'ui/filter/update', payload: filter });
  };

  exportConfiguration = () => {
    const storageEngine = this.store['storageEngine'];
    return storageEngine.exportData();
  };

  importConfiguration = (data: import('../types').ExportData) => {
    const storageEngine = this.store['storageEngine'];
    return storageEngine.importData(data);
  };
}

let clientInstance: ApiMockInterceptorDevToolsClient | null = null;

export function createApiMockInterceptorDevToolsClient(): ApiMockInterceptorDevToolsClient {
  if (!clientInstance) {
    clientInstance = new ApiMockInterceptorDevToolsClient();
  }
  return clientInstance;
}

export function getApiMockInterceptorDevToolsClient(): ApiMockInterceptorDevToolsClient | null {
  return clientInstance;
}