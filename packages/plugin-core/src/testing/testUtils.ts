import { renderHook, act } from '@testing-library/react';
import type { BaseDevToolsClient } from '../devtools-client/BaseDevToolsClient';
import type { PluginStore, BasePluginState } from '../store/createPluginStore';

/**
 * Mock DevTools client for testing
 */
export class MockDevToolsClient<TState> extends BaseDevToolsClient<TState> {
  public events: any[] = [];
  
  constructor(store: any) {
    super(store);
  }

  startMonitoring(): void {
    this.emit('start-monitoring', {});
  }

  stopMonitoring(): void {
    this.emit('stop-monitoring', {});
  }

  cleanup(): void {
    this.events = [];
  }

  protected emit<T>(type: string, payload: T): void {
    const event = {
      type,
      payload,
      timestamp: Date.now(),
      id: this.generateEventId()
    };
    
    this.events.push(event);
    super.emit(type, payload);
  }

  getEmittedEvents(): any[] {
    return [...this.events];
  }

  clearEvents(): void {
    this.events = [];
  }
}

/**
 * Create mock store for testing
 */
export function createMockStore<T extends BasePluginState>(
  initialState: T
): PluginStore<T> {
  const state = { ...initialState };
  const listeners: (() => void)[] = [];

  const mockStore = {
    ...state,
    
    setActive: (active: boolean) => {
      (state as any).isActive = active;
      listeners.forEach(listener => listener());
    },

    setMonitoring: (monitoring: boolean) => {
      (state as any).isMonitoring = monitoring;
      listeners.forEach(listener => listener());
    },

    updateConfig: (config: Partial<T['config']>) => {
      state.config = { ...state.config, ...config };
      listeners.forEach(listener => listener());
    },

    updateUI: (ui: Partial<T['ui']>) => {
      state.ui = { ...state.ui, ...ui };
      listeners.forEach(listener => listener());
    },

    updateFilter: (filter: Partial<T['ui']['filter']>) => {
      state.ui = {
        ...state.ui,
        filter: { ...state.ui.filter, ...filter }
      };
      listeners.forEach(listener => listener());
    },

    reset: () => {
      Object.assign(state, initialState);
      listeners.forEach(listener => listener());
    },

    subscribe: (listener: () => void) => {
      listeners.push(listener);
      return () => {
        const index = listeners.indexOf(listener);
        if (index > -1) {
          listeners.splice(index, 1);
        }
      };
    },

    getSnapshot: () => ({ ...state }),

    emit: (event: any) => {
      console.log('Mock store event:', event);
    }
  } as PluginStore<T>;

  return mockStore;
}

/**
 * Test helper for plugin hooks
 */
export function testPluginHook<TResult>(
  hook: () => TResult,
  setup?: () => void
): { result: { current: TResult }; rerender: () => void } {
  if (setup) {
    setup();
  }

  const { result, rerender } = renderHook(hook);
  
  return {
    result,
    rerender
  };
}

/**
 * Wait for async operations in tests
 */
export function waitFor(
  condition: () => boolean,
  timeout: number = 5000
): Promise<void> {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    const check = () => {
      if (condition()) {
        resolve();
        return;
      }
      
      if (Date.now() - startTime > timeout) {
        reject(new Error(`Condition not met within ${timeout}ms`));
        return;
      }
      
      setTimeout(check, 50);
    };
    
    check();
  });
}

/**
 * Mock data generators for common test scenarios
 */
export const mockData = {
  generateEvents: (count: number) => {
    return Array.from({ length: count }, (_, i) => ({
      id: `event-${i}`,
      type: 'test-event',
      timestamp: Date.now() - (count - i) * 1000,
      payload: { index: i }
    }));
  },

  generatePerformanceData: (count: number) => {
    return Array.from({ length: count }, (_, i) => ({
      timestamp: Date.now() - (count - i) * 1000,
      value: Math.random() * 100,
      metadata: { index: i }
    }));
  },

  generateFilterOptions: (options: string[]) => {
    return options.map(option => ({
      key: option.toLowerCase(),
      label: option,
      values: [
        { value: true, label: 'Enabled' },
        { value: false, label: 'Disabled' }
      ]
    }));
  }
};