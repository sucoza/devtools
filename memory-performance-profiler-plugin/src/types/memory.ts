export interface MemoryInfo {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

export interface ComponentMemoryData {
  id: string;
  componentName: string;
  fiber: any;
  memoryUsage: number;
  renderCount: number;
  lastRenderTime: number;
  props: Record<string, any>;
  state: Record<string, any>;
  hooks: HookMemoryData[];
  children: ComponentMemoryData[];
  warnings: MemoryWarning[];
}

export interface HookMemoryData {
  type: string;
  index: number;
  memoryUsage: number;
  value: any;
  dependencies?: any[];
}

export interface MemorySnapshot {
  id: string;
  timestamp: number;
  memoryInfo: MemoryInfo;
  componentTree: ComponentMemoryData[];
  gcEvents: GCEvent[];
  performanceMetrics: PerformanceMetrics;
  warnings: MemoryWarning[];
}

export interface GCEvent {
  id: string;
  timestamp: number;
  type: 'major' | 'minor' | 'incremental';
  duration: number;
  memoryBefore: number;
  memoryAfter: number;
  memoryFreed: number;
}

export interface PerformanceMetrics {
  cls: number; // Cumulative Layout Shift
  fid: number; // First Input Delay
  lcp: number; // Largest Contentful Paint
  fcp: number; // First Contentful Paint
  ttfb: number; // Time to First Byte
  renderTime: number;
  memoryPressure: 'low' | 'medium' | 'high';
  heapUtilization: number;
}

export interface MemoryWarning {
  id: string;
  type: 'memory-leak' | 'excessive-renders' | 'large-object' | 'gc-pressure' | 'performance-degradation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  componentName?: string;
  timestamp: number;
  affectedComponents: string[];
  recommendations: string[];
  details: Record<string, any>;
}

export interface MemoryLeakPattern {
  id: string;
  pattern: 'growing-array' | 'event-listeners' | 'timers' | 'closures' | 'dom-refs';
  confidence: number; // 0-1
  affectedComponents: string[];
  memoryGrowthRate: number; // bytes per second
  detectedAt: number;
  samples: MemorySnapshot[];
}

export interface OptimizationRecommendation {
  id: string;
  type: 'memoization' | 'lazy-loading' | 'virtualization' | 'cleanup' | 'bundling';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  impact: string;
  implementationGuide: string;
  codeExample?: string;
  estimatedSavings: {
    memory: number; // bytes
    performance: number; // percentage improvement
  };
  affectedComponents: string[];
}

export interface MemoryBudget {
  total: number; // bytes
  warning: number; // bytes
  critical: number; // bytes
  components: Record<string, number>; // component name -> max memory
}

export interface ProfilingSession {
  id: string;
  startTime: number;
  endTime?: number;
  snapshots: MemorySnapshot[];
  leakPatterns: MemoryLeakPattern[];
  recommendations: OptimizationRecommendation[];
  configuration: ProfilingConfiguration;
  status: 'running' | 'paused' | 'stopped' | 'analyzing';
}

export interface ProfilingConfiguration {
  samplingInterval: number; // milliseconds
  maxSnapshots: number;
  enableComponentTracking: boolean;
  enablePerformanceMetrics: boolean;
  enableLeakDetection: boolean;
  memoryBudget?: MemoryBudget;
  excludeComponents: string[];
  autoOptimizations: boolean;
}

export interface MemoryTimelinePoint {
  timestamp: number;
  usedMemory: number;
  totalMemory: number;
  gcEvent?: GCEvent;
  warning?: MemoryWarning;
}

export interface ComponentPerformanceStats {
  componentName: string;
  averageMemoryUsage: number;
  peakMemoryUsage: number;
  renderCount: number;
  averageRenderTime: number;
  memoryGrowthRate: number;
  efficiency: number; // 0-1 score
}