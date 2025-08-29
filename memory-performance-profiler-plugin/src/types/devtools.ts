import { MemoryProfilerState } from './memory-profiler';

export interface MemoryProfilerDevToolsEvent {
  type: 'memory-measurement' | 'component-update' | 'leak-detected' | 'performance-update' | 'gc-event' | 'config-change' | 'snapshot-created';
  payload: any;
  timestamp: number;
}

export interface DevToolsEventClient {
  subscribe<T>(eventType: string, callback: (event: T) => void): () => void;
  emit<T>(eventType: string, payload: T): void;
  getSnapshot(): any;
}

export interface MemoryProfilerDevToolsStore {
  state: MemoryProfilerState;
  actions: {
    startProfiling: () => void;
    stopProfiling: () => void;
    updateConfig: (config: Partial<MemoryProfilerState['config']>) => void;
    addMemoryMeasurement: (measurement: MemoryProfilerState['currentMemory']) => void;
    updateComponents: (components: MemoryProfilerState['components']) => void;
    updateHooks: (hooks: MemoryProfilerState['hooks']) => void;
    addLeak: (leak: MemoryProfilerState['leaks'][0]) => void;
    updatePerformance: (metrics: MemoryProfilerState['performance']) => void;
    addGCEvent: (event: MemoryProfilerState['gcEvents'][0]) => void;
    createSnapshot: (name: string) => void;
    addSuggestion: (suggestion: MemoryProfilerState['suggestions'][0]) => void;
    updateBudgets: (budgets: MemoryProfilerState['budgets']) => void;
    addAlert: (alert: MemoryProfilerState['alerts'][0]) => void;
    clearAlerts: () => void;
    reset: () => void;
  };
}