import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { MemoryProfilerPanel, useMemoryProfiler, useMemoryStats } from '@sucoza/memory-performance-profiler-devtools-plugin';

// // Demo components to showcase different memory patterns
// import { MemoryLeakDemo } from './components/MemoryLeakDemo';
// import { PerformanceDemo } from './components/PerformanceDemo';
// import { OptimizationDemo } from './components/OptimizationDemo';
// import { MetricsDisplay } from './components/MetricsDisplay';

export default function App() {
  const [showDevTools, setShowDevTools] = useState(false);
  const [activeDemo, setActiveDemo] = useState<'memory-leak' | 'performance' | 'optimization' | null>(null);
  
  // Use our memory profiler hooks
  const memoryProfiler = useMemoryProfiler();
  const memoryStats = useMemoryStats();

  // Auto-start profiling when the app loads
  useEffect(() => {
    if (!memoryProfiler.isRecording) {
      memoryProfiler.startProfiling({
        samplingInterval: 1000,
        enableComponentTracking: true,
        enablePerformanceMetrics: true,
        enableLeakDetection: true
      });
    }
  }, []);

  const toggleDevTools = useCallback(() => {
    setShowDevTools(prev => !prev);
  }, []);

  const startDemo = useCallback((demoType: typeof activeDemo) => {
    setActiveDemo(demoType);
  }, []);

  const stopDemo = useCallback(() => {
    setActiveDemo(null);
  }, []);

  const renderActiveDemo = () => {
    // switch (activeDemo) {
    //   case 'memory-leak':
    //     return <MemoryLeakDemo onStop={stopDemo} />;
    //   case 'performance':
    //     return <PerformanceDemo onStop={stopDemo} />;
    //   case 'optimization':
    //     return <OptimizationDemo onStop={stopDemo} />;
    //   default:
        return null;
    // }
  };

  return (
    <div className="example-container">
      {/* Toggle DevTools Button */}
      <button className="devtools-toggle" onClick={toggleDevTools}>
        {showDevTools ? 'Hide' : 'Show'} Memory Profiler
      </button>

      {/* Header */}
      <div className="example-header">
        <h1>Memory & Performance Profiler</h1>
        <p>
          Interactive example demonstrating memory leak detection, performance monitoring,
          and optimization recommendations in real-time.
        </p>
        <MetricsDisplay 
          memoryStats={memoryStats}
          isRecording={memoryProfiler.isRecording}
        />
      </div>

      {/* Demo Selection */}
      <div className="example-section">
        <h2>Interactive Demos</h2>
        <p>
          Choose a demo to see how the Memory & Performance Profiler detects issues
          and provides optimization recommendations:
        </p>
        
        <div className="demo-grid">
          <div className="memory-leak-demo">
            <h3>🚨 Memory Leak Detection</h3>
            <p>
              Demonstrates growing arrays, unremoved event listeners, 
              and uncleaned timers that cause memory leaks.
            </p>
            <button 
              onClick={() => startDemo('memory-leak')}
              disabled={activeDemo !== null}
            >
              Start Memory Leak Demo
            </button>
          </div>

          <div className="performance-demo">
            <h3>⚡ Performance Monitoring</h3>
            <p>
              Shows Core Web Vitals tracking, render performance analysis,
              and layout shift detection.
            </p>
            <button 
              onClick={() => startDemo('performance')}
              disabled={activeDemo !== null}
            >
              Start Performance Demo
            </button>
          </div>

          <div className="optimization-demo">
            <h3>🔧 Optimization Recommendations</h3>
            <p>
              Demonstrates how the profiler generates actionable
              optimization recommendations for your components.
            </p>
            <button 
              onClick={() => startDemo('optimization')}
              disabled={activeDemo !== null}
            >
              Start Optimization Demo
            </button>
          </div>
        </div>

        {activeDemo && (
          <div className="warning">
            <strong>Demo Running:</strong> The {activeDemo.replace('-', ' ')} demo is currently active. 
            Watch the Memory Profiler DevTools below to see real-time analysis and recommendations.
          </div>
        )}
      </div>

      {/* Active Demo Component */}
      {renderActiveDemo()}

      {/* Instructions */}
      <div className="example-section">
        <h2>How to Use</h2>
        <ol>
          <li><strong>Open DevTools:</strong> Click the "Show Memory Profiler" button at the top right</li>
          <li><strong>Start a Demo:</strong> Choose one of the demo scenarios above</li>
          <li><strong>Monitor in Real-time:</strong> Watch the profiler detect issues and provide recommendations</li>
          <li><strong>Explore Features:</strong> Use the tabs in the DevTools panel to view different aspects:
            <ul>
              <li><strong>Overview:</strong> Current memory usage and performance metrics</li>
              <li><strong>Timeline:</strong> Memory usage over time with GC events</li>
              <li><strong>Components:</strong> Per-component memory analysis</li>
              <li><strong>Leaks:</strong> Detected memory leak patterns</li>
              <li><strong>Optimize:</strong> Actionable recommendations for improvement</li>
              <li><strong>Settings:</strong> Configure profiling parameters</li>
            </ul>
          </li>
        </ol>
      </div>

      {/* DevTools Panel */}
      {showDevTools && (
        <div className="devtools-panel">
          <MemoryProfilerPanel />
        </div>
      )}
    </div>
  );
}