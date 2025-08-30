import { useSyncExternalStore } from 'use-sync-external-store/shim';
import type { MemoryProfilerDevToolsEvent } from '../types';
import { useMemoryProfilerStore, type MemoryProfilerStore } from './devtools-store';
import { MemoryProfiler } from './memory-profiler';

// Export the devtools state type
export type MemoryProfilerDevToolsState = ReturnType<typeof useMemoryProfilerStore.getState>;

// Public interface for the DevTools client
export interface IMemoryProfilerDevToolsClient {
  subscribe<T = any>(eventType: string, callback: (data: T) => void): () => void;
  subscribe(callback: () => void): () => void;
  emit<T = any>(eventType: string, data: T): void;
  getSnapshot(): any;
  start(samplingInterval?: number): void;
  stop(): void;
  updateConfig(configUpdate: any): void;
  createSnapshot(name: string): void;
  reset(): void;
  forceGC(): void;
  exportData(): string;
  importData(jsonData: string): void;
  getProfiler(): MemoryProfiler;
  isSupported(): boolean;
  getSupportInfo(): {
    memoryAPI: boolean;
    performanceObserver: boolean;
    gc: boolean;
    reactDevTools: boolean;
    tanStackDevTools: boolean;
  };
}

class MemoryProfilerDevToolsClient implements IMemoryProfilerDevToolsClient {
  private subscribers = new Set<() => void>();
  private eventSubscribers = new Map<string, Set<(data: any) => void>>();
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
        this.emitDevToolsEvent('memory-measurement', measurement);
      },

      onComponentUpdate: (components) => {
        useMemoryProfilerStore.getState().updateComponents(components);
        this.emitDevToolsEvent('component-update', components);
      },

      onHookUpdate: (hooks) => {
        useMemoryProfilerStore.getState().updateHooks(hooks);
        this.emitDevToolsEvent('hook-update', hooks);
      },

      onLeakDetected: (leak) => {
        useMemoryProfilerStore.getState().addLeak(leak);
        this.emitDevToolsEvent('leak-detected', leak);
      },

      onPerformanceUpdate: (metrics) => {
        useMemoryProfilerStore.getState().updatePerformance(metrics);
        this.emitDevToolsEvent('performance-update', metrics);
      },

      onGCEvent: (event) => {
        useMemoryProfilerStore.getState().addGCEvent(event);
        this.emitDevToolsEvent('gc-event', event);
      },

      onSuggestion: (suggestion) => {
        useMemoryProfilerStore.getState().addSuggestion(suggestion);
        this.emitDevToolsEvent('suggestion-generated', suggestion);
      }
    });
  }

  subscribe<T = any>(eventType: string, callback: (data: T) => void): () => void;
  subscribe(callback: () => void): () => void;
  subscribe<T = any>(eventTypeOrCallback: string | (() => void), callback?: (data: T) => void): () => void {
    if (typeof eventTypeOrCallback === 'string' && callback) {
      // Event-specific subscription
      if (!this.eventSubscribers.has(eventTypeOrCallback)) {
        this.eventSubscribers.set(eventTypeOrCallback, new Set());
      }
      this.eventSubscribers.get(eventTypeOrCallback)!.add(callback);
      
      return () => {
        const subscribers = this.eventSubscribers.get(eventTypeOrCallback);
        if (subscribers) {
          subscribers.delete(callback);
          if (subscribers.size === 0) {
            this.eventSubscribers.delete(eventTypeOrCallback);
          }
        }
      };
    } else if (typeof eventTypeOrCallback === 'function') {
      // General state subscription
      this.subscribers.add(eventTypeOrCallback);
      return () => {
        this.subscribers.delete(eventTypeOrCallback);
      };
    }
    
    return () => {};
  }

  emit<T = any>(eventType: string, data: T): void {
    // Emit to event subscribers
    const subscribers = this.eventSubscribers.get(eventType);
    if (subscribers) {
      subscribers.forEach(callback => callback(data));
    }
    
    // Also emit as devtools event using the private emit method
    this.emitDevToolsEvent(eventType, data);
  }

  private emitDevToolsEvent<T>(type: string, payload: T): void {
    const event: MemoryProfilerDevToolsEvent = {
      type: type as any,
      payload,
      timestamp: Date.now()
    };

    // Emit to TanStack DevTools if available
    if (typeof window !== 'undefined') {
      const devtools = (window as any).__TANSTACK_DEVTOOLS__;
      if (devtools) {
        devtools.emit('memory-profiler', event);
      }
    }

    // Notify local subscribers
    this.subscribers.forEach(callback => callback());

    // Log for debugging
    console.debug('MemoryProfiler DevTools Event:', event);
  }

  getSnapshot(): any {
    return useMemoryProfilerStore.getState();
  }

  // Public API methods
  start(samplingInterval?: number): void {
    if (!this.isInitialized) {
      this.initialize();
    }

    const store = useMemoryProfilerStore.getState();
    
    // Update config if sampling interval provided
    if (samplingInterval && samplingInterval !== store.config.samplingInterval) {
      store.updateConfig({ samplingInterval });
    }

    this.memoryProfiler.start(store.config.samplingInterval);
    store.startProfiling();

    this.emitDevToolsEvent('profiling-started', { 
      config: store.config,
      timestamp: Date.now() 
    });
  }

  stop(): void {
    this.memoryProfiler.stop();
    useMemoryProfilerStore.getState().stopProfiling();

    this.emitDevToolsEvent('profiling-stopped', { timestamp: Date.now() });
  }

  updateConfig(configUpdate: any): void {
    const store = useMemoryProfilerStore.getState();
    store.updateConfig(configUpdate);

    // Restart profiler if running with new config
    if (store.isRunning) {
      this.memoryProfiler.stop();
      this.memoryProfiler.start(store.config.samplingInterval);
    }

    this.emitDevToolsEvent('config-changed', store.config);
  }

  createSnapshot(name: string): void {
    const store = useMemoryProfilerStore.getState();
    store.createSnapshot(name);

    const snapshots = store.snapshots;
    const latestSnapshot = snapshots[snapshots.length - 1];

    this.emitDevToolsEvent('snapshot-created', latestSnapshot);
  }

  reset(): void {
    this.memoryProfiler.reset();
    useMemoryProfilerStore.getState().reset();

    this.emitDevToolsEvent('data-reset', { timestamp: Date.now() });
  }

  // Force garbage collection (if supported)
  forceGC(): void {
    if ((window as any).gc) {
      (window as any).gc();
      this.emitDevToolsEvent('gc-forced', { timestamp: Date.now() });
    } else {
      console.warn('Garbage collection not available. Run Chrome with --enable-precise-memory-info --js-flags="--expose-gc"');
    }
  }

  // Export data
  exportData(): string {
    const state = useMemoryProfilerStore.getState();
    const exportData = {
      config: state.config,
      timeline: state.timeline,
      components: state.components,
      hooks: state.hooks,
      leaks: state.leaks,
      performance: state.performance,
      gcEvents: state.gcEvents,
      snapshots: state.snapshots,
      suggestions: state.suggestions,
      exportedAt: Date.now()
    };

    return JSON.stringify(exportData, null, 2);
  }

  // Import data
  importData(jsonData: string): void {
    try {
      const data = JSON.parse(jsonData);
      const store = useMemoryProfilerStore.getState();

      // Validate and import data
      if (data.config) {
        store.updateConfig(data.config);
      }

      if (data.components) {
        store.updateComponents(data.components);
      }

      if (data.hooks) {
        store.updateHooks(data.hooks);
      }

      if (data.leaks) {
        data.leaks.forEach((leak: any) => store.addLeak(leak));
      }

      if (data.performance) {
        store.updatePerformance(data.performance);
      }

      if (data.gcEvents) {
        data.gcEvents.forEach((event: any) => store.addGCEvent(event));
      }

      if (data.suggestions) {
        data.suggestions.forEach((suggestion: any) => store.addSuggestion(suggestion));
      }

      this.emitDevToolsEvent('data-imported', { 
        importedAt: Date.now(),
        originalExportDate: data.exportedAt 
      });

    } catch (error) {
      console.error('Failed to import memory profiler data:', error);
      throw new Error('Invalid import data format');
    }
  }

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

    // Subscribe to store changes
    useMemoryProfilerStore.subscribe(
      (state) => state,
      () => {
        this.subscribers.forEach(callback => callback());
      }
    );

    this.isInitialized = true;
  }

  // Get profiler instance for advanced usage
  getProfiler(): MemoryProfiler {
    return this.memoryProfiler;
  }

  // Check if profiler is supported
  isSupported(): boolean {
    return !!(
      typeof window !== 'undefined' &&
      window.performance &&
      'memory' in window.performance &&
      'PerformanceObserver' in window
    );
  }

  // Get support info
  getSupportInfo(): {
    memoryAPI: boolean;
    performanceObserver: boolean;
    gc: boolean;
    reactDevTools: boolean;
    tanStackDevTools: boolean;
  } {
    return {
      memoryAPI: !!(window.performance && 'memory' in window.performance),
      performanceObserver: 'PerformanceObserver' in window,
      gc: !!(window as any).gc,
      reactDevTools: !!(window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__,
      tanStackDevTools: !!(window as any).__TANSTACK_DEVTOOLS__
    };
  }
}

// Create singleton instance
export const memoryProfilerClient = new MemoryProfilerDevToolsClient();

// Factory function for creating event clients
export function createMemoryProfilerEventClient(): IMemoryProfilerDevToolsClient {
  return memoryProfilerClient;
}

// React hook for using the devtools client
export function useMemoryProfilerDevTools() {
  const state = useSyncExternalStore(
    memoryProfilerClient.subscribe.bind(memoryProfilerClient),
    memoryProfilerClient.getSnapshot.bind(memoryProfilerClient)
  );

  return {
    ...(state as MemoryProfilerStore),
    client: memoryProfilerClient,
    
    // Convenience methods
    start: memoryProfilerClient.start.bind(memoryProfilerClient),
    stop: memoryProfilerClient.stop.bind(memoryProfilerClient),
    reset: memoryProfilerClient.reset.bind(memoryProfilerClient),
    createSnapshot: memoryProfilerClient.createSnapshot.bind(memoryProfilerClient),
    updateConfig: memoryProfilerClient.updateConfig.bind(memoryProfilerClient),
    exportData: memoryProfilerClient.exportData.bind(memoryProfilerClient),
    importData: memoryProfilerClient.importData.bind(memoryProfilerClient),
    forceGC: memoryProfilerClient.forceGC.bind(memoryProfilerClient),
    
    // Support info
    isSupported: memoryProfilerClient.isSupported(),
    supportInfo: memoryProfilerClient.getSupportInfo()
  };
}