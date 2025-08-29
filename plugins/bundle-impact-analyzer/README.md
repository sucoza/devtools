# Bundle Impact Analyzer Plugin

A comprehensive bundle analysis plugin for TanStack DevTools that provides real-time bundle size optimization, module analysis, tree shaking insights, and performance recommendations for JavaScript applications.

## Features

### 📦 **Comprehensive Bundle Analysis**
- Real-time bundle size tracking and monitoring
- Module dependency analysis and visualization
- Chunk analysis with size breakdown and relationships
- Build tool detection (Webpack, Vite, Rollup, esbuild, Parcel)

### 🌲 **Tree Shaking Analysis**
- Tree shaking efficiency measurement and optimization
- Dead code detection and elimination suggestions
- Unused export identification and cleanup recommendations
- Side effects analysis and optimization opportunities

### 📊 **Module Impact Tracking**
- Individual module size impact analysis
- Import cost analysis with dependency chain tracking
- Duplicate module detection and deduplication suggestions
- Module usage statistics and optimization recommendations

### 🎯 **Smart Optimization Recommendations**
- Automated optimization suggestions with impact estimates
- Code splitting opportunities and implementation guidance
- Bundle size reduction strategies with estimated savings
- Performance impact analysis and prioritized improvements

### 🌐 **CDN Analysis & Opportunities**
- CDN replacement analysis for popular libraries
- Bundle vs CDN size comparison and recommendations
- Compatibility assessment for CDN migrations
- Performance impact estimation for external dependencies

### 📈 **Visual Bundle Insights**
- Interactive bundle visualization with size mapping
- Chunk dependency graphs and relationship visualization
- Module treemap with size proportions
- Performance trend analysis and historical tracking

## Installation

```bash
npm install @sucoza/bundle-impact-analyzer-devtools-plugin
```

## Usage

### Basic Setup

```tsx
import React from 'react';
import { BundleImpactAnalyzerPanel } from '@sucoza/bundle-impact-analyzer-devtools-plugin';

function App() {
  return (
    <div>
      {/* Your app content */}
      
      {/* Bundle Impact Analyzer DevTools Panel */}
      <BundleImpactAnalyzerPanel />
    </div>
  );
}
```

### With Event Client Integration

```tsx
import React, { useEffect } from 'react';
import { 
  BundleImpactAnalyzerPanel,
  createBundleAnalyzerEventClient 
} from '@sucoza/bundle-impact-analyzer-devtools-plugin';

function App() {
  useEffect(() => {
    // Initialize the bundle analyzer event client
    const client = createBundleAnalyzerEventClient();
    
    // Optional: Listen for bundle analysis events
    const unsubscribe = client.subscribe((event, type) => {
      if (type === 'bundle:analysis-complete') {
        console.log('Bundle analysis completed:', event);
      }
      if (type === 'bundle:recommendation') {
        console.log('New optimization recommendation:', event);
      }
    });
    
    return unsubscribe;
  }, []);

  return (
    <div>
      <BundleImpactAnalyzerPanel />
    </div>
  );
}
```

### Using the Hook

```tsx
import React from 'react';
import { useBundleAnalyzer } from '@sucoza/bundle-impact-analyzer-devtools-plugin';

function MyComponent() {
  const {
    stats,
    modules,
    chunks,
    recommendations,
    isAnalyzing,
    startAnalysis,
    startTreeShakingAnalysis,
    startCDNAnalysis
  } = useBundleAnalyzer();
  
  return (
    <div>
      <div>
        <h3>Bundle Statistics</h3>
        <p>Total Size: {(stats.totalSize / 1024).toFixed(2)} KB</p>
        <p>Gzipped Size: {(stats.totalGzipSize / 1024).toFixed(2)} KB</p>
        <p>Module Count: {stats.moduleCount}</p>
        <p>Tree Shaking Efficiency: {(stats.treeShakingEfficiency * 100).toFixed(1)}%</p>
      </div>
      
      <div>
        <button onClick={startAnalysis} disabled={isAnalyzing}>
          {isAnalyzing ? 'Analyzing...' : 'Start Analysis'}
        </button>
        <button onClick={startTreeShakingAnalysis}>
          Analyze Tree Shaking
        </button>
        <button onClick={startCDNAnalysis}>
          Analyze CDN Opportunities
        </button>
      </div>
      
      {recommendations.length > 0 && (
        <div>
          <h3>Optimization Recommendations</h3>
          {recommendations.map(rec => (
            <div key={rec.module}>
              <h4>{rec.type}</h4>
              <p>{rec.description}</p>
              <p>Estimated Savings: {(rec.estimatedSavings / 1024).toFixed(2)} KB</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

## Configuration

### Analysis Options

```tsx
import { useBundleAnalyzer } from '@sucoza/bundle-impact-analyzer-devtools-plugin';

function MyComponent() {
  const { updateAnalysisOptions } = useBundleAnalyzer();
  
  // Configure analysis behavior
  updateAnalysisOptions({
    enableRealTime: true,
    analysisDepth: 'deep',
    includeNodeModules: false,
    includeDevDependencies: false,
    minModuleSize: 1024, // Ignore modules smaller than 1KB
    enableTreeShaking: true,
    enableCDNAnalysis: true,
    enableVisualization: true,
  });
}
```

### Filtering Options

```tsx
import { useBundleAnalyzer } from '@sucoza/bundle-impact-analyzer-devtools-plugin';

function MyComponent() {
  const { updateFilters } = useBundleAnalyzer();
  
  // Configure filtering options
  updateFilters({
    showOnlyLargeModules: true,
    showOnlyUnusedCode: false,
    showOnlyDuplicates: false,
    searchQuery: '',
    minSize: 5120, // 5KB minimum
    moduleTypes: ['js', 'ts', 'tsx'],
    excludePatterns: ['node_modules', 'vendor'],
  });
}
```

## Components

### BundleImpactAnalyzerPanel
The main panel component that provides the complete bundle analysis interface with multiple tabs.

### Individual Tab Components
You can also use individual tab components for specific functionality:

- `OverviewTab` - Bundle statistics and summary metrics
- `ModulesTab` - Detailed module analysis and dependencies
- `ChunksTab` - Chunk breakdown and relationships
- `TreeShakingTab` - Tree shaking analysis and optimization
- `RecommendationsTab` - Automated optimization suggestions
- `CDNAnalysisTab` - CDN replacement opportunities
- `VisualizationTab` - Interactive bundle visualization
- `SettingsTab` - Configuration and analysis options

## API Reference

### Types

```typescript
interface BundleModule {
  id: string;
  name: string;
  size: number;
  gzipSize?: number;
  path: string;
  imports: string[];
  exports: string[];
  isTreeShakeable: boolean;
  isDynamic: boolean;
  chunk?: string;
  usedExports?: string[];
  unusedExports?: string[];
  reasons?: ModuleReason[];
  timestamp: number;
}

interface BundleChunk {
  id: string;
  name: string;
  size: number;
  gzipSize?: number;
  modules: BundleModule[];
  parents: string[];
  children: string[];
  isEntry: boolean;
  isAsync: boolean;
  files: string[];
  timestamp: number;
}

interface OptimizationRecommendation {
  type: 'code-split' | 'tree-shake' | 'cdn-replace' | 'remove-unused' | 'deduplicate';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  estimatedSavings: number;
  implementation: string;
  module?: string;
  chunks?: string[];
}

interface BundleStats {
  totalSize: number;
  totalGzipSize: number;
  moduleCount: number;
  chunkCount: number;
  duplicateModules: DuplicateModule[];
  treeShakingEfficiency: number;
  unusedCodeSize: number;
  timestamp: number;
}
```

### Event Client

```typescript
interface BundleAnalyzerEvents {
  'bundle:state': BundleAnalyzerState;
  'bundle:action': BundleAnalyzerAction;
  'bundle:analysis-started': { timestamp: number; target?: string };
  'bundle:analysis-complete': { modules: BundleModule[]; chunks: BundleChunk[]; stats: BundleStats };
  'bundle:recommendation': { recommendation: OptimizationRecommendation; isNew: boolean };
  'bundle:tree-shaking-complete': { efficiency: number; unusedCode: string[] };
  'bundle:cdn-analysis-complete': { opportunities: CDNAnalysis[] };
  'bundle:module-selected': { module: BundleModule };
  'bundle:chunk-selected': { chunk: BundleChunk };
}
```

## Examples

Check out the `example/` directory for a complete demonstration of the plugin with various bundle configurations and optimization scenarios.

To run the example:

```bash
cd example
npm install
npm run dev
```

The example includes:
- Multiple bundle configurations (Webpack, Vite, Rollup)
- Various optimization scenarios and recommendations
- Interactive visualization demonstrations
- CDN analysis examples
- Tree shaking optimization cases

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

- [Webpack Bundle Analyzer](https://github.com/webpack-contrib/webpack-bundle-analyzer) - Bundle analysis inspiration
- [TanStack DevTools](https://tanstack.com/devtools) - Development tools framework
- [Zustand](https://github.com/pmndrs/zustand) - State management
- [D3.js](https://d3js.org/) - Data visualization for bundle treemaps
- [Rollup](https://rollupjs.org/) - Module bundler analysis integration