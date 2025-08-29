export interface MemoryMeasurement {
  timestamp: number;
  heapUsed: number;
  heapSize: number;
  heapLimit: number;
  jsHeapUsed?: number;
  jsHeapSize?: number;
}

export interface ComponentMemoryInfo {
  name: string;
  instanceCount: number;
  totalMemory: number;
  averageMemoryPerInstance: number;
  retainedObjects: string[];
  suspiciousGrowth: boolean;
  trend: 'up' | 'down' | 'stable';
  lastUpdated: number;
}

export interface HookMemoryInfo {
  hookType: string;
  componentName: string;
  memoryUsage: number;
  dependencyArraySize: number;
  hasCleanup: boolean;
  suspiciousPatterns: string[];
}

export interface MemoryLeak {
  id: string;
  type: 'event-listener' | 'timer' | 'closure-retention' | 'dom-reference' | 'subscription';
  component?: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  detectedAt: number;
  estimatedMemoryImpact: number;
  recommendation: string;
  autoFixAvailable: boolean;
}

export interface PerformanceMetrics {
  fcp: number; // First Contentful Paint
  lcp: number; // Largest Contentful Paint
  fid: number; // First Input Delay
  cls: number; // Cumulative Layout Shift
  ttfb: number; // Time to First Byte
  renderTime: number;
  memoryPressure: 'low' | 'medium' | 'high';
}

export interface MemoryBudget {
  route?: string;
  component?: string;
  budgetMB: number;
  currentUsageMB: number;
  isExceeded: boolean;
  warningThresholdMB: number;
}

export interface GarbageCollectionInfo {
  timestamp: number;
  type: 'minor' | 'major' | 'incremental';
  duration: number;
  memoryBefore: number;
  memoryAfter: number;
  memoryReclaimed: number;
}

export interface MemoryOptimizationSuggestion {
  id: string;
  type: 'virtualization' | 'lazy-loading' | 'memoization' | 'cleanup' | 'ref-optimization';
  component: string;
  description: string;
  impact: string;
  effort: 'low' | 'medium' | 'high';
  projectedSavingsMB: number;
  codeExample?: string;
  oneClickFix: boolean;
}

export interface MemoryProfilerConfig {
  enabled: boolean;
  samplingInterval: number; // milliseconds
  trackComponents: boolean;
  trackHooks: boolean;
  detectLeaks: boolean;
  monitorPerformance: boolean;
  budgets: MemoryBudget[];
  alertThresholds: {
    memoryLimitMB: number;
    growthRatePercent: number;
    leakSeverity: MemoryLeak['severity'];
  };
}

export interface MemoryProfilerSnapshot {
  id: string;
  timestamp: number;
  name: string;
  memory: MemoryMeasurement;
  components: ComponentMemoryInfo[];
  hooks: HookMemoryInfo[];
  leaks: MemoryLeak[];
  performance: PerformanceMetrics;
  gcEvents: GarbageCollectionInfo[];
}

export interface MemoryTimeline {
  startTime: number;
  endTime: number;
  measurements: MemoryMeasurement[];
  events: Array<{
    timestamp: number;
    type: 'navigation' | 'component-mount' | 'component-unmount' | 'gc' | 'user-action';
    description: string;
    memoryImpact?: number;
  }>;
}

export interface ReactFiberMemoryInfo {
  fiberNode: any; // React Fiber node
  componentName: string;
  memorySize: number;
  childrenCount: number;
  propsSize: number;
  stateSize: number;
  effectsCount: number;
}

export interface MemoryProfilerState {
  isRunning: boolean;
  config: MemoryProfilerConfig;
  currentMemory: MemoryMeasurement | null;
  timeline: MemoryTimeline | null;
  components: ComponentMemoryInfo[];
  hooks: HookMemoryInfo[];
  leaks: MemoryLeak[];
  performance: PerformanceMetrics | null;
  gcEvents: GarbageCollectionInfo[];
  snapshots: MemoryProfilerSnapshot[];
  suggestions: MemoryOptimizationSuggestion[];
  budgets: MemoryBudget[];
  alerts: Array<{
    id: string;
    type: 'budget-exceeded' | 'leak-detected' | 'performance-degraded' | 'memory-limit';
    message: string;
    severity: 'info' | 'warning' | 'error';
    timestamp: number;
  }>;
}