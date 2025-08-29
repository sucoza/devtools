# Memory Performance Profiler Plugin

A comprehensive React memory analysis plugin for TanStack DevTools that provides real-time memory profiling, component memory tracking, memory leak detection, garbage collection monitoring, and performance optimization recommendations.

## Features

### 🧠 **React-Specific Memory Analysis**
- Real-time React component memory usage tracking
- Hook memory consumption analysis and optimization
- Fiber tree memory profiling with component hierarchy mapping
- React state and props memory impact assessment

### 📊 **Memory Timeline & Visualization**
- Interactive memory usage timeline with historical tracking
- Memory allocation patterns visualization and trend analysis
- Garbage collection event correlation and impact analysis
- Component lifecycle memory usage mapping

### 🔍 **Memory Leak Detection**
- Automated memory leak pattern detection and classification
- Component-specific leak identification with root cause analysis
- Event listener and timer leak detection
- DOM reference and closure leak identification

### ⚠️ **Smart Warning System**
- Real-time memory pressure monitoring and alerting
- Component-level memory usage warnings and thresholds
- Performance degradation detection and notifications
- Memory budget tracking with customizable limits

### 🎯 **Optimization Recommendations**
- Automated memory optimization suggestions with implementation guides
- Memoization opportunities identification and priority ranking
- Lazy loading recommendations for memory-heavy components
- Bundle splitting suggestions for memory optimization

### 📈 **Performance Metrics Integration**
- Core Web Vitals correlation with memory usage
- Render performance impact analysis and optimization
- Memory pressure correlation with user experience metrics
- Real-time performance degradation monitoring

### 🛠️ **Component Memory Tree**
- Interactive component memory hierarchy visualization
- Per-component memory breakdown and analysis
- Hook-level memory usage inspection and optimization
- Memory usage comparison across renders and updates

## Installation

```bash
npm install @sucoza/memory-performance-profiler-devtools-plugin
```

## Usage

### Basic Setup

```tsx
import React from 'react';
import { MemoryProfilerPanel } from '@sucoza/memory-performance-profiler-devtools-plugin';

function App() {
  return (
    <div>
      {/* Your app content */}
      
      {/* Memory Profiler DevTools Panel */}
      <MemoryProfilerPanel />
    </div>
  );
}
```

### With Event Client Integration

```tsx
import React, { useEffect } from 'react';
import { 
  MemoryProfilerPanel,
  createMemoryProfilerEventClient 
} from '@sucoza/memory-performance-profiler-devtools-plugin';

function App() {
  useEffect(() => {
    // Initialize the memory profiler event client
    const client = createMemoryProfilerEventClient();
    
    // Optional: Listen for memory profiler events
    const unsubscribe = client.subscribe((event, type) => {
      if (type === 'memory:leak-detected') {
        console.log('Memory leak detected:', event);
      }
      if (type === 'memory:warning') {
        console.log('Memory warning:', event);
      }
      if (type === 'memory:optimization-suggestion') {
        console.log('Optimization suggestion:', event);
      }
    });
    
    return unsubscribe;
  }, []);

  return (
    <div>
      <MemoryProfilerPanel />
    </div>
  );
}
```

### Using the Hook

```tsx
import React from 'react';
import { useMemoryProfiler } from '@sucoza/memory-performance-profiler-devtools-plugin';

function MyComponent() {
  const {
    currentSnapshot,
    memoryTimeline,
    warnings,
    recommendations,
    isRecording,
    startRecording,
    stopRecording,
    takeSnapshot,
    analyzeLeaks,
    getComponentStats
  } = useMemoryProfiler();
  
  const formatMemory = (bytes: number) => {
    return (bytes / 1024 / 1024).toFixed(2) + ' MB';
  };
  
  return (
    <div>
      <div>
        <h3>Memory Status</h3>
        {currentSnapshot && (
          <>
            <p>Used Memory: {formatMemory(currentSnapshot.memoryInfo.usedJSHeapSize)}</p>
            <p>Total Memory: {formatMemory(currentSnapshot.memoryInfo.totalJSHeapSize)}</p>
            <p>Heap Utilization: {(currentSnapshot.performanceMetrics.heapUtilization * 100).toFixed(1)}%</p>
            <p>Memory Pressure: {currentSnapshot.performanceMetrics.memoryPressure}</p>
          </>
        )}
      </div>
      
      <div>
        <button onClick={startRecording} disabled={isRecording}>
          {isRecording ? 'Recording...' : 'Start Recording'}
        </button>
        <button onClick={stopRecording} disabled={!isRecording}>
          Stop Recording
        </button>
        <button onClick={takeSnapshot}>
          Take Snapshot
        </button>
        <button onClick={analyzeLeaks}>
          Analyze Memory Leaks
        </button>
      </div>
      
      {warnings.length > 0 && (
        <div>
          <h3>Memory Warnings</h3>
          {warnings.map(warning => (
            <div key={warning.id} className={`warning-${warning.severity}`}>
              <h4>{warning.type}</h4>
              <p>{warning.message}</p>
              <p>Affected Components: {warning.affectedComponents.join(', ')}</p>
              {warning.recommendations.map((rec, i) => (
                <p key={i}><strong>Recommendation:</strong> {rec}</p>
              ))}
            </div>
          ))}
        </div>
      )}
      
      {recommendations.length > 0 && (
        <div>
          <h3>Optimization Recommendations</h3>
          {recommendations.map(rec => (
            <div key={rec.id} className={`priority-${rec.priority}`}>
              <h4>{rec.title}</h4>
              <p>{rec.description}</p>
              <p><strong>Impact:</strong> {rec.impact}</p>
              <p><strong>Estimated Savings:</strong> {formatMemory(rec.estimatedSavings.memory)}</p>
              {rec.codeExample && (
                <pre><code>{rec.codeExample}</code></pre>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

## Configuration

### Recording Configuration

```tsx
import { useMemoryProfiler } from '@sucoza/memory-performance-profiler-devtools-plugin';

function MyComponent() {
  const { updateConfiguration } = useMemoryProfiler();
  
  // Configure memory profiling
  updateConfiguration({
    samplingInterval: 1000, // 1 second
    maxSnapshots: 100,
    enableComponentTracking: true,
    enablePerformanceMetrics: true,
    enableLeakDetection: true,
    autoOptimizations: false,
    excludeComponents: ['DevToolsPanel', 'Profiler'],
  });
}
```

### Memory Budget Setup

```tsx
import { useMemoryProfiler } from '@sucoza/memory-performance-profiler-devtools-plugin';

function MyComponent() {
  const { setMemoryBudget } = useMemoryProfiler();
  
  // Set memory budget limits
  setMemoryBudget({
    total: 50 * 1024 * 1024, // 50MB total limit
    warning: 35 * 1024 * 1024, // 35MB warning threshold
    critical: 45 * 1024 * 1024, // 45MB critical threshold
    components: {
      'DataTable': 10 * 1024 * 1024, // 10MB limit for DataTable
      'Chart': 5 * 1024 * 1024, // 5MB limit for Chart components
    },
  });
}
```

### Optimization Settings

```tsx
import { useMemoryProfiler } from '@sucoza/memory-performance-profiler-devtools-plugin';

function MyComponent() {
  const { updateOptimizationSettings } = useMemoryProfiler();
  
  // Configure optimization detection
  updateOptimizationSettings({
    enableMemoizationDetection: true,
    enableLazyLoadingSuggestions: true,
    enableVirtualizationAnalysis: true,
    enableBundleSplittingAdvice: true,
    minMemoryImpact: 1024 * 1024, // 1MB minimum impact
    minPerformanceGain: 10, // 10% minimum performance gain
  });
}
```

## Components

### MemoryProfilerPanel
The main panel component that provides the complete memory profiling interface.

### Individual Components
You can also use individual components for specific functionality:

- `MemoryTimeline` - Interactive memory usage timeline visualization
- `ComponentMemoryTree` - Hierarchical component memory breakdown
- `MemoryWarnings` - Real-time memory warnings and alerts
- `OptimizationRecommendations` - Automated optimization suggestions
- `MemoryLeakDetector` - Memory leak detection and analysis
- `PerformanceMetrics` - Core Web Vitals and performance correlation
- `ProfilingSettings` - Configuration and profiling options

## API Reference

### Types

```typescript
interface MemorySnapshot {
  id: string;
  timestamp: number;
  memoryInfo: MemoryInfo;
  componentTree: ComponentMemoryData[];
  gcEvents: GCEvent[];
  performanceMetrics: PerformanceMetrics;
  warnings: MemoryWarning[];
}

interface ComponentMemoryData {
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

interface MemoryWarning {
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

interface OptimizationRecommendation {
  id: string;
  type: 'memoization' | 'lazy-loading' | 'virtualization' | 'cleanup' | 'bundling';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  impact: string;
  implementationGuide: string;
  codeExample?: string;
  estimatedSavings: {
    memory: number;
    performance: number;
  };
  affectedComponents: string[];
}

interface PerformanceMetrics {
  cls: number;
  fid: number;
  lcp: number;
  fcp: number;
  ttfb: number;
  renderTime: number;
  memoryPressure: 'low' | 'medium' | 'high';
  heapUtilization: number;
}
```

### Event Client

```typescript
interface MemoryProfilerEvents {
  'memory:state': MemoryProfilerState;
  'memory:snapshot': { snapshot: MemorySnapshot };
  'memory:warning': { warning: MemoryWarning };
  'memory:leak-detected': { pattern: MemoryLeakPattern };
  'memory:optimization-suggestion': { recommendation: OptimizationRecommendation };
  'memory:gc-event': { event: GCEvent };
  'memory:performance-degradation': { metrics: PerformanceMetrics };
  'memory:budget-exceeded': { budget: MemoryBudget; current: number };
}
```

### Hook API

```typescript
interface UseMemoryProfilerReturn {
  // Current state
  currentSnapshot: MemorySnapshot | null;
  memoryTimeline: MemoryTimelinePoint[];
  warnings: MemoryWarning[];
  recommendations: OptimizationRecommendation[];
  leakPatterns: MemoryLeakPattern[];
  
  // Recording control
  isRecording: boolean;
  startRecording: () => void;
  stopRecording: () => void;
  takeSnapshot: () => MemorySnapshot;
  
  // Analysis functions
  analyzeLeaks: () => Promise<MemoryLeakPattern[]>;
  getComponentStats: (componentName: string) => ComponentPerformanceStats;
  generateReport: () => MemoryAnalysisReport;
  
  // Configuration
  updateConfiguration: (config: Partial<ProfilingConfiguration>) => void;
  setMemoryBudget: (budget: MemoryBudget) => void;
  updateOptimizationSettings: (settings: OptimizationSettings) => void;
}
```

## Examples

Check out the `example/` directory for a complete demonstration of the plugin with various memory scenarios and optimization examples.

To run the example:

```bash
cd example
npm install
npm run dev
```

The example includes:
- Memory leak scenarios and detection
- Component memory optimization examples
- Performance correlation demonstrations
- Memory budget configuration examples
- Optimization recommendation testing
- Real-world memory profiling scenarios

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT

---

Part of the @sucoza TanStack DevTools ecosystem.

## Powered By

- [React DevTools Profiler](https://reactjs.org/blog/2018/09/10/introducing-the-react-profiler.html) - React profiling integration
- [Performance Observer API](https://developer.mozilla.org/en-US/docs/Web/API/Performance_Observer_API) - Browser performance monitoring
- [Memory API](https://developer.mozilla.org/en-US/docs/Web/API/Performance/memory) - Browser memory information
- [TanStack DevTools](https://tanstack.com/devtools) - Development tools framework
- [Zustand](https://github.com/pmndrs/zustand) - State management