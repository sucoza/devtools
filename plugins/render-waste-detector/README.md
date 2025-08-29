# Render Waste Detector Plugin

A comprehensive React render optimization plugin for TanStack DevTools that provides real-time unnecessary render detection, performance impact analysis, optimization suggestions, and visual heat map visualization for React applications.

## Features

### 🔍 **Unnecessary Render Detection**
- Real-time detection of wasteful re-renders with root cause analysis
- Prop, state, and context change tracking with deep comparison
- Parent-induced render cascade identification and optimization
- Hook dependency change analysis and optimization suggestions

### 📊 **Performance Impact Analysis**
- Render frequency analysis with performance bottleneck identification
- Component render time profiling and optimization prioritization
- Render waste percentage calculation with impact scoring
- Performance degradation correlation and trend analysis

### 🎯 **Smart Optimization Suggestions**
- Automated memoization recommendations (React.memo, useMemo, useCallback)
- Component splitting and state optimization guidance
- Context selector pattern suggestions for performance
- Virtual scrolling recommendations for large lists

### 🔥 **Visual Heat Map**
- Interactive component heat map with render frequency visualization
- Color-coded waste level indication and hotspot identification
- Click-to-inspect functionality with detailed component analysis
- Real-time heat map updates during application usage

### 📈 **Component Timeline Analysis**
- Historical render timeline with event correlation
- Render reason tracking and pattern identification
- Component lifecycle analysis with optimization opportunities
- Before/after optimization impact measurement

### 🧪 **Virtual DOM Diff Analysis**
- Real-time Virtual DOM change detection and analysis
- Efficient diff algorithms with minimal performance overhead
- Change impact assessment and optimization recommendations
- Diff visualization with detailed change breakdowns

### 📋 **Recording & Replay**
- Profiling session management with configurable parameters
- Render event recording with detailed metadata capture
- Session export/import for team collaboration and analysis
- Automated optimization opportunity detection during recording

## Installation

```bash
npm install @sucoza/render-waste-detector-devtools-plugin
```

## Usage

### Basic Setup

```tsx
import React from 'react';
import { RenderWasteDetectorPanel } from '@sucoza/render-waste-detector-devtools-plugin';

function App() {
  return (
    <div>
      {/* Your app content */}
      
      {/* Render Waste Detector DevTools Panel */}
      <RenderWasteDetectorPanel />
    </div>
  );
}
```

### With Event Client Integration

```tsx
import React, { useEffect } from 'react';
import { 
  RenderWasteDetectorPanel,
  createRenderWasteEventClient 
} from '@sucoza/render-waste-detector-devtools-plugin';

function App() {
  useEffect(() => {
    // Initialize the render waste detector event client
    const client = createRenderWasteEventClient();
    
    // Optional: Listen for render waste events
    const unsubscribe = client.subscribe((event, type) => {
      if (type === 'render:unnecessary') {
        console.log('Unnecessary render detected:', event);
      }
      if (type === 'render:optimization-suggestion') {
        console.log('Optimization suggestion:', event);
      }
      if (type === 'render:performance-impact') {
        console.log('Performance impact detected:', event);
      }
    });
    
    return unsubscribe;
  }, []);

  return (
    <div>
      <RenderWasteDetectorPanel />
    </div>
  );
}
```

### Using the Hook

```tsx
import React from 'react';
import { useRenderWasteDetector } from '@sucoza/render-waste-detector-devtools-plugin';

function MyComponent() {
  const {
    stats,
    suggestions,
    heatMapData,
    isRecording,
    currentSession,
    startRecording,
    stopRecording,
    analyzeComponent,
    getComponentMetrics,
    generateReport
  } = useRenderWasteDetector();
  
  return (
    <div>
      <div>
        <h3>Render Statistics</h3>
        <p>Total Renders: {stats.totalRenders}</p>
        <p>Unnecessary Renders: {stats.unnecessaryRenders}</p>
        <p>Waste Percentage: {stats.wastePercentage.toFixed(1)}%</p>
        <p>Most Wasteful Components:</p>
        <ul>
          {stats.mostWastefulComponents.slice(0, 5).map(comp => (
            <li key={comp.componentName}>
              {comp.componentName}: {comp.wastePercentage.toFixed(1)}% 
              ({comp.renderCount} renders)
            </li>
          ))}
        </ul>
      </div>
      
      <div>
        <button onClick={startRecording} disabled={isRecording}>
          {isRecording ? 'Recording...' : 'Start Recording'}
        </button>
        <button onClick={stopRecording} disabled={!isRecording}>
          Stop Recording
        </button>
        <button onClick={generateReport}>
          Generate Report
        </button>
      </div>
      
      {suggestions.length > 0 && (
        <div>
          <h3>Optimization Suggestions</h3>
          {suggestions.map(suggestion => (
            <div key={suggestion.id} className={`severity-${suggestion.severity}`}>
              <h4>{suggestion.title}</h4>
              <p><strong>Component:</strong> {suggestion.componentName}</p>
              <p><strong>Type:</strong> {suggestion.type}</p>
              <p>{suggestion.description}</p>
              <p><strong>Solution:</strong> {suggestion.solution}</p>
              <p><strong>Impact:</strong> {suggestion.impact.renderReduction}% render reduction</p>
              {suggestion.codeExample && (
                <details>
                  <summary>Code Example</summary>
                  <pre><code>{suggestion.codeExample}</code></pre>
                </details>
              )}
            </div>
          ))}
        </div>
      )}
      
      {heatMapData.length > 0 && (
        <div>
          <h3>Component Heat Map</h3>
          <div className="heat-map-container">
            {heatMapData.map(item => (
              <div
                key={item.componentId}
                className="heat-map-item"
                style={{
                  backgroundColor: item.color,
                  opacity: item.intensity / 100,
                  position: 'absolute',
                  left: item.position.x,
                  top: item.position.y,
                  width: item.position.width,
                  height: item.position.height,
                }}
                title={item.tooltip}
                onClick={() => analyzeComponent(item.componentId)}
              >
                {item.componentName}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

## Configuration

### Recording Settings

```tsx
import { useRenderWasteDetector } from '@sucoza/render-waste-detector-devtools-plugin';

function MyComponent() {
  const { updateRecordingSettings } = useRenderWasteDetector();
  
  // Configure recording behavior
  updateRecordingSettings({
    trackAllComponents: false, // Only track problematic components
    trackOnlyProblematic: true,
    minRenderThreshold: 5, // Minimum renders to track
    maxRecordingTime: 60000, // 1 minute max
    maxEvents: 1000, // Maximum events to store
    enableHeatMap: true,
    enableSuggestions: true,
    enableVDomDiff: true,
    debounceMs: 100, // Debounce render events
    excludePatterns: ['DevTools*', '*Test*'],
    includePatterns: ['App*', 'Page*'],
  });
}
```

### Filter Configuration

```tsx
import { useRenderWasteDetector } from '@sucoza/render-waste-detector-devtools-plugin';

function MyComponent() {
  const { updateFilters } = useRenderWasteDetector();
  
  // Configure filtering options
  updateFilters({
    componentNameFilter: 'Button',
    showOnlyWasteful: true,
    showOnlyRecent: false,
    minRenderCount: 10,
    minWastePercentage: 20,
    timeRange: {
      start: Date.now() - 60000, // Last minute
      end: Date.now(),
    },
    severityFilter: new Set(['high', 'critical']),
    suggestionTypeFilter: new Set(['use-memo', 'react-memo', 'use-callback']),
  });
}
```

### View Options

```tsx
import { useRenderWasteDetector } from '@sucoza/render-waste-detector-devtools-plugin';

function MyComponent() {
  const { updateViewOptions } = useRenderWasteDetector();
  
  // Configure visualization options
  updateViewOptions({
    heatMapMode: 'waste', // 'renders' | 'waste' | 'time' | 'impact'
    treeViewExpanded: true,
    showMetrics: true,
    showSuggestions: true,
    showVDomDiff: false,
    timelineZoom: 1.0,
    groupBy: 'component', // 'component' | 'file' | 'none'
    sortBy: 'waste', // 'name' | 'renders' | 'waste' | 'impact' | 'time'
    sortOrder: 'desc',
  });
}
```

## Components

### RenderWasteDetectorPanel
The main panel component that provides the complete render waste detection interface.

### Individual Tab Components
You can also use individual tab components for specific functionality:

- `OverviewTab` - Overall render statistics and summary metrics
- `ComponentsTab` - Detailed component render analysis and metrics
- `SuggestionsTab` - Optimization suggestions with implementation guides
- `HeatMapTab` - Interactive visual heat map of render activity
- `TimelineTab` - Historical render timeline with event correlation
- `SettingsTab` - Configuration options and recording parameters

## API Reference

### Types

```typescript
interface RenderEvent {
  id: string;
  componentId: string;
  componentName: string;
  timestamp: number;
  duration: number;
  phase: "mount" | "update" | "unmount";
  reason: RenderReason;
  propsChanges: PropChange[];
  stateChanges: StateChange[];
  contextChanges: ContextChange[];
  renderCount: number;
  actualDuration: number;
  baseDuration: number;
  startTime: number;
  commitTime: number;
}

interface OptimizationSuggestion {
  id: string;
  componentId: string;
  componentName: string;
  type: SuggestionType;
  severity: "low" | "medium" | "high" | "critical";
  title: string;
  description: string;
  solution: string;
  codeExample?: string;
  impact: {
    renderReduction: number;
    performanceGain: number;
    complexity: "low" | "medium" | "high";
  };
  relatedProps?: string[];
  relatedHooks?: string[];
}

interface RenderMetrics {
  componentId: string;
  componentName: string;
  totalRenders: number;
  unnecessaryRenders: number;
  wastePercentage: number;
  avgRenderTime: number;
  maxRenderTime: number;
  minRenderTime: number;
  totalRenderTime: number;
  lastRenderTime: number;
  renderFrequency: number;
  impactScore: number;
  hotness: number;
}

interface HeatMapData {
  componentId: string;
  componentName: string;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  intensity: number;
  renderCount: number;
  wasteLevel: number;
  color: string;
  tooltip: string;
}
```

### Event Client

```typescript
interface RenderWasteEvents {
  'render:state': RenderWasteDetectorState;
  'render:event': { event: RenderEvent };
  'render:unnecessary': { event: RenderEvent; reason: string };
  'render:optimization-suggestion': { suggestion: OptimizationSuggestion };
  'render:performance-impact': { component: string; impact: number };
  'render:session-start': { session: RecordingSession };
  'render:session-end': { session: RecordingSession; stats: RenderStats };
  'render:heat-map-update': { data: HeatMapData[] };
}
```

### Hook API

```typescript
interface UseRenderWasteDetectorReturn {
  // Current state
  stats: RenderStats;
  suggestions: OptimizationSuggestion[];
  heatMapData: HeatMapData[];
  currentSession: RecordingSession | null;
  renderTree: RenderTree;
  
  // Recording control
  isRecording: boolean;
  startRecording: (settings?: Partial<RecordingSettings>) => void;
  stopRecording: () => void;
  pauseRecording: () => void;
  resumeRecording: () => void;
  
  // Analysis functions
  analyzeComponent: (componentId: string) => ComponentAnalysis;
  getComponentMetrics: (componentName: string) => RenderMetrics;
  generateReport: () => RenderAnalysisReport;
  exportSession: () => ExportData;
  
  // Configuration
  updateRecordingSettings: (settings: Partial<RecordingSettings>) => void;
  updateFilters: (filters: Partial<RenderFilters>) => void;
  updateViewOptions: (options: Partial<ViewOptions>) => void;
}
```

## Examples

Check out the `example/` directory for a complete demonstration of the plugin with various render optimization scenarios.

To run the example:

```bash
cd example
npm install
npm run dev
```

The example includes:
- Common unnecessary render scenarios and solutions
- Optimization technique demonstrations (memo, useMemo, useCallback)
- Component splitting and state optimization examples
- Context optimization patterns and best practices
- Performance measurement and comparison tools
- Heat map visualization with real components

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
- [React Fiber](https://github.com/acdlite/react-fiber-architecture) - React internals access
- [TanStack DevTools](https://tanstack.com/devtools) - Development tools framework
- [Zustand](https://github.com/pmndrs/zustand) - State management
- [D3.js](https://d3js.org/) - Data visualization for heat maps and timelines