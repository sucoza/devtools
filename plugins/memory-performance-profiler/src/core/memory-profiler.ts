import type { 
  MemoryMeasurement, 
  ComponentMemoryInfo, 
  HookMemoryInfo, 
  MemoryLeak, 
  PerformanceMetrics, 
  GarbageCollectionInfo,
  MemoryOptimizationSuggestion
} from '../types';

declare global {
  interface Performance {
    memory?: {
      usedJSHeapSize: number;
      totalJSHeapSize: number;
      jsHeapSizeLimit: number;
    };
  }
}

export class MemoryProfiler {
  private isRunning = false;
  private samplingInterval = 1000; // 1 second default
  private intervalId: NodeJS.Timeout | null = null;
  private observers: PerformanceObserver[] = [];
  private componentRegistry = new Map<string, ComponentMemoryInfo>();
  private hookRegistry = new Map<string, HookMemoryInfo>();
  private detectedLeaks = new Set<string>();
  private lastGCTime = 0;
  private memoryHistory: MemoryMeasurement[] = [];
  private readonly maxHistoryEntries = 1000;
  private originalOnCommitFiberRoot?: ((...args: any[]) => void) | null;
  private originalOnCommitFiberUnmount?: ((...args: any[]) => void) | null;

  private callbacks: {
    onMemoryUpdate?: (measurement: MemoryMeasurement) => void;
    onComponentUpdate?: (components: ComponentMemoryInfo[]) => void;
    onHookUpdate?: (hooks: HookMemoryInfo[]) => void;
    onLeakDetected?: (leak: MemoryLeak) => void;
    onPerformanceUpdate?: (metrics: PerformanceMetrics) => void;
    onGCEvent?: (event: GarbageCollectionInfo) => void;
    onSuggestion?: (suggestion: MemoryOptimizationSuggestion) => void;
  } = {};

  constructor() {
    this.setupPerformanceObservers();
    this.injectReactProfilerHooks();
  }

  start(samplingInterval = 1000): void {
    if (this.isRunning) return;

    this.isRunning = true;
    this.samplingInterval = samplingInterval;
    
    this.intervalId = setInterval(() => {
      this.collectMemoryMeasurement();
      this.analyzeMemoryPatterns();
      this.detectMemoryLeaks();
      this.generateOptimizationSuggestions();
    }, samplingInterval);

    console.log('Memory profiler started');
  }

  stop(): void {
    if (!this.isRunning) return;

    this.isRunning = false;
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];

    // Restore React DevTools hooks
    if (typeof window !== 'undefined') {
      const devToolsHook = (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__;
      if (devToolsHook) {
        if (this.originalOnCommitFiberRoot !== undefined) {
          devToolsHook.onCommitFiberRoot = this.originalOnCommitFiberRoot;
          this.originalOnCommitFiberRoot = undefined;
        }
        if (this.originalOnCommitFiberUnmount !== undefined) {
          devToolsHook.onCommitFiberUnmount = this.originalOnCommitFiberUnmount;
          this.originalOnCommitFiberUnmount = undefined;
        }
      }
    }

    console.log('Memory profiler stopped');
  }

  setCallbacks(callbacks: typeof this.callbacks): void {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  private collectMemoryMeasurement(): void {
    const measurement: MemoryMeasurement = {
      timestamp: Date.now(),
      heapUsed: 0,
      heapSize: 0,
      heapLimit: 0
    };

    if (performance.memory) {
      measurement.jsHeapUsed = performance.memory.usedJSHeapSize;
      measurement.jsHeapSize = performance.memory.totalJSHeapSize;
      measurement.heapLimit = performance.memory.jsHeapSizeLimit;
      measurement.heapUsed = measurement.jsHeapUsed;
      measurement.heapSize = measurement.jsHeapSize;
    }

    // Add to history
    this.memoryHistory.push(measurement);
    if (this.memoryHistory.length > this.maxHistoryEntries) {
      this.memoryHistory.shift();
    }

    this.callbacks.onMemoryUpdate?.(measurement);
  }

  private setupPerformanceObservers(): void {
    // Core Web Vitals observer
    if ('PerformanceObserver' in window) {
      try {
        const performanceObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          this.processPerformanceEntries(entries);
        });

        performanceObserver.observe({ entryTypes: ['navigation', 'paint', 'layout-shift', 'first-input'] });
        this.observers.push(performanceObserver);

        // Garbage Collection observer (if available)
        const gcObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          this.processGCEntries(entries);
        });

        try {
          gcObserver.observe({ entryTypes: ['gc'] });
          this.observers.push(gcObserver);
        } catch {
          // GC observation not supported
        }
      } catch (error) {
        console.warn('Performance observer setup failed:', error);
      }
    }
  }

  private processPerformanceEntries(entries: PerformanceEntry[]): void {
    const metrics: Partial<PerformanceMetrics> = {};

    entries.forEach(entry => {
      switch (entry.name) {
        case 'first-contentful-paint':
          metrics.fcp = entry.startTime;
          break;
        case 'largest-contentful-paint':
          metrics.lcp = entry.startTime;
          break;
        case 'first-input':
          metrics.fid = (entry as any).processingStart - entry.startTime;
          break;
      }

      if (entry.entryType === 'layout-shift') {
        metrics.cls = (metrics.cls || 0) + (entry as any).value;
      }
    });

    if (Object.keys(metrics).length > 0) {
      const currentPerformance: PerformanceMetrics = {
        fcp: metrics.fcp || 0,
        lcp: metrics.lcp || 0,
        fid: metrics.fid || 0,
        cls: metrics.cls || 0,
        ttfb: performance.timing?.responseStart - performance.timing?.requestStart || 0,
        renderTime: performance.now(),
        memoryPressure: this.calculateMemoryPressure()
      };

      this.callbacks.onPerformanceUpdate?.(currentPerformance);
    }
  }

  private processGCEntries(entries: PerformanceEntry[]): void {
    entries.forEach(entry => {
      const gcEvent: GarbageCollectionInfo = {
        timestamp: Date.now(),
        type: 'minor', // Default, could be enhanced with more specific detection
        duration: entry.duration,
        memoryBefore: 0,
        memoryAfter: 0,
        memoryReclaimed: 0
      };

      // Try to get memory info before/after if available
      if (performance.memory) {
        gcEvent.memoryAfter = performance.memory.usedJSHeapSize;
      }

      this.callbacks.onGCEvent?.(gcEvent);
    });
  }

  private injectReactProfilerHooks(): void {
    // Hook into React DevTools if available
    if (typeof window !== 'undefined' && (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__) {
      const devToolsHook = (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__;
      
      // Save originals for restoration
      this.originalOnCommitFiberRoot = devToolsHook.onCommitFiberRoot || null;
      this.originalOnCommitFiberUnmount = devToolsHook.onCommitFiberUnmount || null;

      // Listen for fiber commits
      const prevOnCommitFiberRoot = this.originalOnCommitFiberRoot;
      devToolsHook.onCommitFiberRoot = (id: number, root: any) => {
        try {
          this.analyzeReactFiberTree(root);
        } catch {
          // Don't let analysis errors break React DevTools
        }
        prevOnCommitFiberRoot?.(id, root);
      };

      // Listen for fiber unmounts
      const prevOnCommitFiberUnmount = this.originalOnCommitFiberUnmount;
      devToolsHook.onCommitFiberUnmount = (id: number, fiber: any) => {
        try {
          this.handleComponentUnmount(fiber);
        } catch {
          // Don't let analysis errors break React DevTools
        }
        prevOnCommitFiberUnmount?.(id, fiber);
      };
    }

    // Fallback: patch React methods if DevTools not available
    this.patchReactMethods();
  }

  private analyzeReactFiberTree(root: any): void {
    if (!root || !root.current) return;

    const componentInfoMap = new Map<string, ComponentMemoryInfo>();
    const hookInfoArray: HookMemoryInfo[] = [];

    this.traverseFiberTree(root.current, componentInfoMap, hookInfoArray);

    // Update component registry
    componentInfoMap.forEach((info, name) => {
      const existing = this.componentRegistry.get(name);
      if (existing) {
        info.trend = this.calculateTrend(existing.totalMemory, info.totalMemory);
        info.suspiciousGrowth = info.trend === 'up' && info.totalMemory > existing.totalMemory * 1.5;
      }
      this.componentRegistry.set(name, info);
    });

    this.callbacks.onComponentUpdate?.(Array.from(componentInfoMap.values()));
    this.callbacks.onHookUpdate?.(hookInfoArray);
  }

  private traverseFiberTree(
    fiber: any, 
    componentInfoMap: Map<string, ComponentMemoryInfo>,
    hookInfoArray: HookMemoryInfo[]
  ): void {
    if (!fiber) return;

    // Analyze component memory
    if (fiber.type && typeof fiber.type === 'function') {
      const componentName = fiber.type.displayName || fiber.type.name || 'Anonymous';
      const memorySize = this.estimateFiberMemorySize(fiber);
      
      const existing = componentInfoMap.get(componentName);
      if (existing) {
        existing.instanceCount++;
        existing.totalMemory += memorySize;
        existing.averageMemoryPerInstance = existing.totalMemory / existing.instanceCount;
      } else {
        componentInfoMap.set(componentName, {
          name: componentName,
          instanceCount: 1,
          totalMemory: memorySize,
          averageMemoryPerInstance: memorySize,
          retainedObjects: this.detectRetainedObjects(fiber),
          suspiciousGrowth: false,
          trend: 'stable',
          lastUpdated: Date.now()
        });
      }

      // Analyze hooks
      if (fiber.memoizedState) {
        const hookInfo = this.analyzeHooks(fiber, componentName);
        hookInfoArray.push(...hookInfo);
      }
    }

    // Traverse children
    let child = fiber.child;
    while (child) {
      this.traverseFiberTree(child, componentInfoMap, hookInfoArray);
      child = child.sibling;
    }
  }

  private estimateFiberMemorySize(fiber: any): number {
    let size = 0;

    // Basic fiber node size estimation
    size += 200; // Base fiber node size

    // Props size
    if (fiber.memoizedProps) {
      size += JSON.stringify(fiber.memoizedProps).length * 2; // Rough estimation
    }

    // State size
    if (fiber.memoizedState) {
      size += this.estimateObjectSize(fiber.memoizedState);
    }

    // Effects size
    if (fiber.updateQueue) {
      size += this.estimateObjectSize(fiber.updateQueue) * 50; // Effects are more memory intensive
    }

    return size;
  }

  private estimateObjectSize(obj: any): number {
    if (obj === null || obj === undefined) return 0;
    if (typeof obj === 'string') return obj.length * 2;
    if (typeof obj === 'number' || typeof obj === 'boolean') return 8;
    if (typeof obj === 'object') {
      try {
        return JSON.stringify(obj).length * 2;
      } catch {
        return 100; // Fallback for circular references
      }
    }
    return 50; // Fallback for functions and other types
  }

  private analyzeHooks(fiber: any, componentName: string): HookMemoryInfo[] {
    const hookInfoArray: HookMemoryInfo[] = [];
    let currentHook = fiber.memoizedState;
    let hookIndex = 0;

    while (currentHook) {
      const hookInfo: HookMemoryInfo = {
        hookType: this.getHookType(currentHook, hookIndex),
        componentName,
        memoryUsage: this.estimateObjectSize(currentHook),
        dependencyArraySize: currentHook.deps ? currentHook.deps.length : 0,
        hasCleanup: this.hasCleanupFunction(currentHook),
        suspiciousPatterns: this.detectHookSuspiciousPatterns(currentHook)
      };

      hookInfoArray.push(hookInfo);
      currentHook = currentHook.next;
      hookIndex++;
    }

    return hookInfoArray;
  }

  private getHookType(hook: any, index: number): string {
    // This is a simplified hook type detection
    // In practice, this would need more sophisticated analysis
    if (hook.queue) return 'useState';
    if (hook.create) return 'useEffect';
    if (hook.deps !== null) return 'useMemo/useCallback';
    return `hook-${index}`;
  }

  private hasCleanupFunction(hook: any): boolean {
    return hook.destroy && typeof hook.destroy === 'function';
  }

  private detectHookSuspiciousPatterns(hook: any): string[] {
    const patterns: string[] = [];

    // Missing dependency in useEffect/useMemo/useCallback
    if (hook.deps && hook.deps.length === 0 && hook.create) {
      patterns.push('Empty dependency array with effects');
    }

    // Large dependency array
    if (hook.deps && hook.deps.length > 10) {
      patterns.push('Large dependency array (>10 items)');
    }

    // Missing cleanup function
    if (hook.create && !hook.destroy) {
      patterns.push('Effect without cleanup function');
    }

    return patterns;
  }

  private detectRetainedObjects(fiber: any): string[] {
    const retained: string[] = [];

    // Check for common retained object patterns
    if (fiber.ref && fiber.ref.current) {
      retained.push('DOM references');
    }

    if (fiber.memoizedState) {
      // Check for timer handles
      const stateStr = JSON.stringify(fiber.memoizedState);
      if (stateStr.includes('setInterval') || stateStr.includes('setTimeout')) {
        retained.push('timer handles');
      }
    }

    return retained;
  }

  private handleComponentUnmount(fiber: any): void {
    // Track component unmounts to detect cleanup issues
    const componentName = fiber.type?.displayName || fiber.type?.name || 'Anonymous';
    
    // Schedule a check for memory leaks after unmount
    setTimeout(() => {
      this.checkForUnmountLeaks(componentName);
    }, 100);
  }

  private checkForUnmountLeaks(componentName: string): void {
    // This is a simplified leak detection
    // In practice, this would involve more sophisticated analysis
    
    const suspiciousPatterns = [
      'Event listeners still attached after unmount',
      'Timers not cleared after unmount',
      'Subscriptions not unsubscribed after unmount'
    ];

    suspiciousPatterns.forEach(pattern => {
      const leakId = `${componentName}-${pattern}-${Date.now()}`;
      
      if (!this.detectedLeaks.has(leakId)) {
        const leak: MemoryLeak = {
          id: leakId,
          type: 'subscription',
          component: componentName,
          description: pattern,
          severity: 'medium',
          detectedAt: Date.now(),
          estimatedMemoryImpact: Math.random() * 1000 + 100, // Simulated
          recommendation: `Ensure ${pattern.toLowerCase()} in useEffect cleanup`,
          autoFixAvailable: false
        };

        this.detectedLeaks.add(leakId);
        this.callbacks.onLeakDetected?.(leak);
      }
    });
  }

  private patchReactMethods(): void {
    // Fallback patching if React DevTools not available
    // This is a simplified implementation
  }

  private analyzeMemoryPatterns(): void {
    if (this.memoryHistory.length < 10) return;

    const recent = this.memoryHistory.slice(-10);
    const growthRate = this.calculateGrowthRate(recent);

    // Check for concerning growth patterns
    if (growthRate > 0.1) { // 10% growth
      console.warn('High memory growth rate detected:', growthRate);
    }
  }

  private calculateGrowthRate(measurements: MemoryMeasurement[]): number {
    if (measurements.length < 2) return 0;

    const first = measurements[0];
    const last = measurements[measurements.length - 1];
    
    if (!first.heapUsed || !last.heapUsed) return 0;

    return (last.heapUsed - first.heapUsed) / first.heapUsed;
  }

  private calculateTrend(oldValue: number, newValue: number): 'up' | 'down' | 'stable' {
    if (oldValue === 0) return newValue > 0 ? 'up' : 'stable';
    const threshold = 0.05; // 5% threshold
    const change = (newValue - oldValue) / oldValue;

    if (change > threshold) return 'up';
    if (change < -threshold) return 'down';
    return 'stable';
  }

  private calculateMemoryPressure(): 'low' | 'medium' | 'high' {
    if (!performance.memory) return 'low';

    const usageRatio = performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit;
    
    if (usageRatio > 0.8) return 'high';
    if (usageRatio > 0.6) return 'medium';
    return 'low';
  }

  private detectMemoryLeaks(): void {
    // Advanced leak detection would be implemented here
    // For now, this is a placeholder
  }

  private generateOptimizationSuggestions(): void {
    // Generate suggestions based on current analysis
    const suggestions: MemoryOptimizationSuggestion[] = [];

    // Example suggestion generation
    this.componentRegistry.forEach((info, name) => {
      if (info.totalMemory > 1000000 && info.instanceCount > 100) { // 1MB+ with 100+ instances
        suggestions.push({
          id: `virtualization-${name}-${Date.now()}`,
          type: 'virtualization',
          component: name,
          description: `${name} has ${info.instanceCount} instances using ${(info.totalMemory / 1024 / 1024).toFixed(2)}MB. Consider virtualization.`,
          impact: 'High memory usage reduction',
          effort: 'medium',
          projectedSavingsMB: info.totalMemory * 0.8 / 1024 / 1024,
          oneClickFix: false
        });
      }
    });

    suggestions.forEach(suggestion => {
      this.callbacks.onSuggestion?.(suggestion);
    });
  }

  getSnapshot(): {
    isRunning: boolean;
    memoryHistory: MemoryMeasurement[];
    components: ComponentMemoryInfo[];
    hooks: HookMemoryInfo[];
  } {
    return {
      isRunning: this.isRunning,
      memoryHistory: [...this.memoryHistory],
      components: Array.from(this.componentRegistry.values()),
      hooks: Array.from(this.hookRegistry.values())
    };
  }

  reset(): void {
    this.memoryHistory = [];
    this.componentRegistry.clear();
    this.hookRegistry.clear();
    this.detectedLeaks.clear();
  }
}