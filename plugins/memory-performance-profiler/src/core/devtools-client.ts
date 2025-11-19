import { useMemoryProfilerStore } from './devtools-store';
import { MemoryProfiler } from './memory-profiler';

// Export the devtools state type
export type MemoryProfilerDevToolsState = ReturnType<typeof useMemoryProfilerStore.getState>;

/**
 * DevTools event client interface following TanStack patterns
 */
export interface DevToolsEventClient<TEvents extends Record<string, any>> {
  subscribe: (callback: (event: TEvents[keyof TEvents], type: keyof TEvents) => void) => () => void;
  getState: () => MemoryProfilerDevToolsState;
}

export interface MemoryProfilerEvents {
  'memory-profiler:state': MemoryProfilerDevToolsState;
  'memory-profiler:error': { message: string; stack?: string };
}

/**
 * Memory Profiler DevTools event client
 * Follows the simplified TanStack DevTools pattern
 */
class MemoryProfilerDevToolsClient implements DevToolsEventClient<MemoryProfilerEvents> {
  private unsubscribeStore?: () => void;
  private memoryProfiler: MemoryProfiler;
  private isInitialized = false;

  constructor() {
    this.memoryProfiler = new MemoryProfiler();
    this.setupProfilerCallbacks();
  }

  private setupProfilerCallbacks(): void {
    this.memoryProfiler.setCallbacks({
      onMemoryUpdate: (measurement) => {
        useMemoryProfilerStore.getState().addMemoryMeasurement(measurement);
      },

      onComponentUpdate: (components) => {
        useMemoryProfilerStore.getState().updateComponents(components);
      },

      onHookUpdate: (hooks) => {
        useMemoryProfilerStore.getState().updateHooks(hooks);
      },

      onLeakDetected: (leak) => {
        useMemoryProfilerStore.getState().addLeak(leak);
      },

      onPerformanceUpdate: (metrics) => {
        useMemoryProfilerStore.getState().updatePerformance(metrics);
      },

      onGCEvent: (event) => {
        useMemoryProfilerStore.getState().addGCEvent(event);
      },

      onSuggestion: (suggestion) => {
        useMemoryProfilerStore.getState().addSuggestion(suggestion);
      }
    });
  }

  /**
   * Subscribe to store changes
   */
  subscribe = (
    callback: (
      event: MemoryProfilerEvents[keyof MemoryProfilerEvents],
      type: keyof MemoryProfilerEvents
    ) => void
  ) => {
    // Subscribe to store changes
    this.unsubscribeStore = useMemoryProfilerStore.subscribe((state) => {
      callback(state, 'memory-profiler:state');
    });

    // Send initial state
    const initialState = useMemoryProfilerStore.getState();
    callback(initialState, 'memory-profiler:state');

    // Initialize on first subscription
    if (!this.isInitialized) {
      this.initialize();
    }

    return () => {
      this.unsubscribeStore?.();
    };
  };

  /**
   * Get current state
   */
  getState = (): MemoryProfilerDevToolsState => {
    return useMemoryProfilerStore.getState();
  };

  // Alias for compatibility
  getSnapshot = (): MemoryProfilerDevToolsState => {
    return this.getState();
  };

  // Profiling control methods
  start = (samplingInterval?: number): void => {
    useMemoryProfilerStore.getState().startProfiling();
    this.memoryProfiler.start(samplingInterval);
  };

  stop = (): void => {
    this.memoryProfiler.stop();
    useMemoryProfilerStore.getState().stopProfiling();
  };

  // Configuration methods
  updateConfig = (configUpdate: Partial<MemoryProfilerDevToolsState['config']>): void => {
    useMemoryProfilerStore.getState().updateConfig(configUpdate);
  };

  // Snapshot methods
  createSnapshot = (name: string): void => {
    useMemoryProfilerStore.getState().createSnapshot(name);
  };

  // Data management methods
  reset = (): void => {
    useMemoryProfilerStore.getState().reset();
  };

  forceGC = (): void => {
    if ((window as any).gc) {
      (window as any).gc();
    } else {
      console.warn('Manual GC is not available. Start Chrome with --expose-gc flag.');
    }
  };

  exportData = (): string => {
    const state = useMemoryProfilerStore.getState();
    return JSON.stringify({
      measurements: state.timeline?.measurements || [],
      snapshots: state.snapshots,
      leaks: state.leaks,
      performance: state.performance,
      config: state.config,
      timestamp: Date.now()
    }, null, 2);
  };

  importData = (jsonData: string): void => {
    try {
      const data = JSON.parse(jsonData);
      useMemoryProfilerStore.getState().importSession(data);
    } catch (error) {
      console.error('Failed to import memory profiler data:', error);
      throw new Error('Invalid import data format');
    }
  };

  private initialize(): void {
    if (this.isInitialized) return;

    // Initialize TanStack DevTools integration
    if (typeof window !== 'undefined') {
      // Register with TanStack DevTools if available
      const devtools = (window as any).__TANSTACK_DEVTOOLS__;
      if (devtools) {
        devtools.register('memory-profiler', {
          name: 'Memory & Performance Profiler',
          version: '0.1.0',
          client: this
        });
      }

      // Set up global access for debugging
      (window as any).__MEMORY_PROFILER_DEVTOOLS__ = this;
    }

    this.isInitialized = true;
  }

  // Get profiler instance for advanced usage
  getProfiler = (): MemoryProfiler => {
    return this.memoryProfiler;
  };

  // Check if profiler is supported
  isSupported = (): boolean => {
    return !!(
      typeof window !== 'undefined' &&
      window.performance &&
      'memory' in window.performance &&
      'PerformanceObserver' in window
    );
  };

  // Get support info
  getSupportInfo = (): {
    memoryAPI: boolean;
    performanceObserver: boolean;
    gc: boolean;
    reactDevTools: boolean;
    tanStackDevTools: boolean;
  } => {
    if (typeof window === 'undefined') {
      return {
        memoryAPI: false,
        performanceObserver: false,
        gc: false,
        reactDevTools: false,
        tanStackDevTools: false
      };
    }

    return {
      memoryAPI: !!(window.performance && 'memory' in window.performance),
      performanceObserver: 'PerformanceObserver' in window,
      gc: !!(window as any).gc,
      reactDevTools: !!(window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__,
      tanStackDevTools: !!(window as any).__TANSTACK_DEVTOOLS__
    };
  };
}

// Create singleton instance
export const memoryProfilerClient = new MemoryProfilerDevToolsClient();

// Factory function for creating event clients
export function createMemoryProfilerEventClient(): MemoryProfilerDevToolsClient {
  return memoryProfilerClient;
}

// Get existing client
export function getMemoryProfilerEventClient(): MemoryProfilerDevToolsClient {
  return memoryProfilerClient;
}

/**
 * React hook for using the Memory Profiler DevTools
 * Combines client methods with reactive state from the store
 */
export function useMemoryProfilerDevTools() {
  const state = useMemoryProfilerStore.getState();
  const client = memoryProfilerClient;

  return {
    // State from store
    isRunning: state.isRunning,
    currentMemory: state.currentMemory,
    timeline: state.timeline,
    components: state.components,
    hooks: state.hooks,
    leaks: state.leaks,
    performance: state.performance,
    gcEvents: state.gcEvents,
    snapshots: state.snapshots,
    suggestions: state.suggestions,
    budgets: state.budgets,
    alerts: state.alerts,
    config: state.config,

    // Client methods
    start: client.start,
    stop: client.stop,
    reset: client.reset,
    createSnapshot: client.createSnapshot,
    forceGC: client.forceGC,
    exportData: client.exportData,
    importData: client.importData,
    updateConfig: client.updateConfig,

    // Client utilities
    isSupported: client.isSupported(),
    supportInfo: client.getSupportInfo(),

    // Store actions
    dismissAlert: state.dismissAlert,
    dismissSuggestion: state.dismissSuggestion,
  };
}
