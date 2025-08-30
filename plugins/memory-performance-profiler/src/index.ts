// Main plugin exports
export { MemoryProfilerPanel } from './components';
export { 
  MemoryProfiler, 
  useMemoryProfilerStore, 
  memoryProfilerClient, 
  useMemoryProfilerDevTools 
} from './core';

// Type exports
export type {
  MemoryMeasurement,
  ComponentMemoryInfo,
  HookMemoryInfo,
  MemoryLeak,
  PerformanceMetrics,
  GarbageCollectionInfo,
  MemoryOptimizationSuggestion,
  MemoryProfilerConfig,
  MemoryProfilerState,
  MemoryProfilerSnapshot,
  MemoryTimeline,
  MemoryBudget,
  MemoryProfilerDevToolsEvent
} from './types';

// Initialize plugin when imported
import { memoryProfilerClient as _memoryProfilerClient } from './core/devtools-client';

// Auto-initialize in browser environments
if (typeof window !== 'undefined') {
  // Plugin will auto-initialize when used
  // console.log('Memory & Performance Profiler Plugin loaded');
}