import type {
  BundleAnalyzerState,
  BundleAnalyzerEvent,
  BundleAnalyzerConfig,
  BundleModule,
  BundleChunk,
  BundleStats,
  ImportImpact,
  OptimizationRecommendation,
  BundleBuildInfo,
  CDNAnalysis,
  AnalysisJob,
} from '../types';
import { useBundleAnalyzerStore } from './devtools-store';

/**
 * Bundle analyzer event types for TanStack DevTools integration
 */
export interface BundleAnalyzerEvents {
  'bundle:state': BundleAnalyzerState;
  'bundle:analysis-started': { timestamp: number; type: string };
  'bundle:analysis-complete': { timestamp: number; stats: BundleStats };
  'bundle:analysis-error': { timestamp: number; error: string };
  'bundle:module-added': { module: BundleModule };
  'bundle:module-updated': { module: BundleModule };
  'bundle:chunk-added': { chunk: BundleChunk };
  'bundle:chunk-updated': { chunk: BundleChunk };
  'bundle:recommendations-updated': { recommendations: OptimizationRecommendation[] };
  'bundle:import-analyzed': { impact: ImportImpact };
  'bundle:cdn-analysis-complete': { analysis: CDNAnalysis[] };
  'bundle:job-started': { job: AnalysisJob };
  'bundle:job-updated': { job: AnalysisJob };
  'bundle:job-completed': { job: AnalysisJob };
  'bundle:job-failed': { job: AnalysisJob };
  'bundle:config-updated': { config: BundleAnalyzerConfig };
  'bundle:error': { message: string; stack?: string };
}

/**
 * Event client interface following TanStack DevTools patterns
 */
export interface BundleAnalyzerEventClient {
  subscribe: (
    callback: (
      event: BundleAnalyzerEvents[keyof BundleAnalyzerEvents],
      type: keyof BundleAnalyzerEvents
    ) => void
  ) => () => void;
  emit: <TEventType extends keyof BundleAnalyzerEvents>(
    type: TEventType,
    event: BundleAnalyzerEvents[TEventType]
  ) => void;
  getState: () => BundleAnalyzerState;
  startAnalysis: () => void;
  stopAnalysis: () => void;
}

/**
 * Bundle Analyzer DevTools event client implementation
 */
export class BundleAnalyzerDevToolsEventClient implements BundleAnalyzerEventClient {
  private unsubscribe?: () => void;
  private getStore = () => useBundleAnalyzerStore.getState();
  private store = useBundleAnalyzerStore;
  private subscribers = new Set<(
    event: BundleAnalyzerEvents[keyof BundleAnalyzerEvents],
    type: keyof BundleAnalyzerEvents
  ) => void>();
  
  // Bundle analysis state
  private analysisActive = false;
  private bundleObserver?: MutationObserver;
  private performanceObserver?: PerformanceObserver;
  
  constructor() {
    this.setupBundleTracking();
    this.setupJobNotifications();
  }

  /**
   * Set up bundle tracking and monitoring
   */
  private setupBundleTracking() {
    // Monitor script tag additions for bundle changes
    this.setupScriptObserver();
    
    // Monitor dynamic imports
    this.setupDynamicImportTracking();
    
    // Monitor webpack/vite build info if available
    this.setupBuildToolIntegration();
  }

  /**
   * Set up job completion notifications
   */
  private setupJobNotifications() {
    // Subscribe to job updates in the store
    let previousJobs: AnalysisJob[] = [];
    const unsubscribeJobs = this.store.subscribe(
      (state) => {
        const jobs = state.jobs;
        const newJobs = jobs.filter(job => 
          !previousJobs.some(prevJob => prevJob.id === job.id)
        );
        
        const updatedJobs = jobs.filter(job => {
          const prevJob = previousJobs.find(p => p.id === job.id);
          return prevJob && (
            prevJob.status !== job.status || 
            prevJob.progress !== job.progress
          );
        });

        newJobs.forEach(job => {
          this.emit('bundle:job-started', { job });
        });

        updatedJobs.forEach(job => {
          if (job.status === 'completed') {
            this.emit('bundle:job-completed', { job });
          } else if (job.status === 'failed') {
            this.emit('bundle:job-failed', { job });
          } else {
            this.emit('bundle:job-updated', { job });
          }
        });

        previousJobs = jobs;
      }
    );
  }

  /**
   * Monitor script tags for new bundles
   */
  private setupScriptObserver() {
    if (typeof window === 'undefined' || typeof MutationObserver === 'undefined') return;

    this.bundleObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element;
            
            // Check for script tags (potential bundles)
            if (element.tagName === 'SCRIPT' && element.getAttribute('src')) {
              this.analyzeScriptTag(element as HTMLScriptElement);
            }
            
            // Check for link tags (CSS bundles)
            if (element.tagName === 'LINK' && element.getAttribute('rel') === 'stylesheet') {
              this.analyzeLinkTag(element as HTMLLinkElement);
            }
          }
        });
      });
    });

    this.bundleObserver.observe(document.head, {
      childList: true,
      subtree: true,
    });
  }

  /**
   * Analyze a script tag and extract bundle information
   */
  private analyzeScriptTag(script: HTMLScriptElement) {
    const src = script.src;
    if (!src || !this.isBundle(src)) return;

    // Create a synthetic module entry
    const module: BundleModule = {
      id: `script_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: this.extractModuleName(src),
      size: 0, // Will be updated when loaded
      path: src,
      imports: [],
      exports: [],
      isTreeShakeable: false,
      isDynamic: false,
      timestamp: Date.now(),
    };

    // Try to get actual size
    this.getBundleSize(src).then(size => {
      if (size > 0) {
        module.size = size;
        this.getStore().addModule(module);
        this.emit('bundle:module-added', { module });
      }
    });
  }

  /**
   * Analyze a CSS link tag
   */
  private analyzeLinkTag(link: HTMLLinkElement) {
    const href = link.href;
    if (!href || !this.isCSSBundle(href)) return;

    const module: BundleModule = {
      id: `css_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: this.extractModuleName(href),
      size: 0,
      path: href,
      imports: [],
      exports: [],
      isTreeShakeable: false,
      isDynamic: false,
      timestamp: Date.now(),
    };

    this.getBundleSize(href).then(size => {
      if (size > 0) {
        module.size = size;
        this.getStore().addModule(module);
        this.emit('bundle:module-added', { module });
      }
    });
  }

  /**
   * Check if URL looks like a bundle
   */
  private isBundle(url: string): boolean {
    return /\.(js|mjs|ts|tsx|jsx)$/.test(url) || 
           url.includes('chunk') || 
           url.includes('bundle') ||
           url.includes('vendor');
  }

  /**
   * Check if URL is a CSS bundle
   */
  private isCSSBundle(url: string): boolean {
    return /\.css$/.test(url) && (
      url.includes('chunk') || 
      url.includes('bundle') ||
      url.includes('main')
    );
  }

  /**
   * Extract module name from URL
   */
  private extractModuleName(url: string): string {
    const parts = url.split('/');
    const filename = parts[parts.length - 1];
    return filename.split('?')[0]; // Remove query parameters
  }

  /**
   * Get bundle size using fetch
   */
  private async getBundleSize(url: string): Promise<number> {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      const contentLength = response.headers.get('Content-Length');
      return contentLength ? parseInt(contentLength, 10) : 0;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Set up dynamic import tracking
   */
  private setupDynamicImportTracking() {
    if (typeof window === 'undefined') return;

    // Monkey patch dynamic import (if possible)
    const originalImport = window.eval('(function() { return this; })()')?.import;
    if (typeof originalImport === 'function') {
      const self = this;
      window.eval('(function() { return this; })()')!.import = function(specifier: string) {
        self.trackDynamicImport(specifier);
        return originalImport.call(this, specifier);
      };
    }
  }

  /**
   * Track dynamic import
   */
  private trackDynamicImport(specifier: string) {
    const module: BundleModule = {
      id: `dynamic_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: specifier,
      size: 0,
      path: specifier,
      imports: [],
      exports: [],
      isTreeShakeable: true,
      isDynamic: true,
      timestamp: Date.now(),
    };

    this.getStore().addModule(module);
    this.emit('bundle:module-added', { module });
  }

  /**
   * Set up build tool integration
   */
  private setupBuildToolIntegration() {
    // Check for webpack
    if (typeof window !== 'undefined' && (window as any).__webpack_require__) {
      this.setupWebpackIntegration();
    }
    
    // Check for Vite
    if (typeof window !== 'undefined' && (window as any).__vite_plugin_react_preamble_installed__) {
      this.setupViteIntegration();
    }
  }

  /**
   * Set up webpack integration
   */
  private setupWebpackIntegration() {
    const webpackRequire = (window as any).__webpack_require__;
    if (!webpackRequire) return;

    const buildInfo: BundleBuildInfo = {
      buildTool: 'webpack',
      buildTime: Date.now(),
      environment: process.env.NODE_ENV === 'production' ? 'production' : 'development',
      optimization: {
        minimize: process.env.NODE_ENV === 'production',
        treeShaking: true,
        splitChunks: true,
        sideEffects: false,
      },
      warnings: [],
      errors: [],
    };

    this.getStore().setBuildInfo(buildInfo);
  }

  /**
   * Set up Vite integration
   */
  private setupViteIntegration() {
    const buildInfo: BundleBuildInfo = {
      buildTool: 'vite',
      buildTime: Date.now(),
      environment: (import.meta as any).env?.PROD ? 'production' : 'development',
      optimization: {
        minimize: (import.meta as any).env?.PROD,
        treeShaking: true,
        splitChunks: true,
        sideEffects: false,
      },
      warnings: [],
      errors: [],
    };

    this.getStore().setBuildInfo(buildInfo);
  }

  /**
   * Subscribe to store changes and emit events
   */
  subscribe = (
    callback: (
      event: BundleAnalyzerEvents[keyof BundleAnalyzerEvents],
      type: keyof BundleAnalyzerEvents
    ) => void
  ) => {
    this.subscribers.add(callback);

    // Subscribe to store changes
    this.unsubscribe = this.store.subscribe((state) => {
      callback(state, 'bundle:state');
    });

    // Send initial state
    const initialState = this.store.getState();
    callback(initialState, 'bundle:state');

    return () => {
      this.subscribers.delete(callback);
      if (this.subscribers.size === 0) {
        this.unsubscribe?.();
        this.cleanup();
      }
    };
  };

  /**
   * Emit event to all subscribers
   */
  emit = <TEventType extends keyof BundleAnalyzerEvents>(
    type: TEventType,
    event: BundleAnalyzerEvents[TEventType]
  ): void => {
    this.subscribers.forEach(callback => {
      callback(event, type);
    });
  };

  /**
   * Get current state from store
   */
  getState = (): BundleAnalyzerState => {
    return this.store.getState();
  };

  /**
   * Start bundle analysis
   */
  startAnalysis = (): void => {
    if (this.analysisActive) return;
    
    this.analysisActive = true;
    this.emit('bundle:analysis-started', { 
      timestamp: Date.now(), 
      type: 'full-analysis' 
    });
    
    this.getStore().startAnalysis();
  };

  /**
   * Stop bundle analysis
   */
  stopAnalysis = (): void => {
    if (!this.analysisActive) return;
    
    this.analysisActive = false;
    this.getStore().stopAnalysis();
  };

  // Convenience methods for common operations

  /**
   * Analyze import impact
   */
  analyzeImport = (importPath: string): void => {
    try {
      const impact = this.getStore().analyzeImportImpact(importPath);
      if (impact) {
        this.emit('bundle:import-analyzed', { impact });
      }
    } catch (error) {
      this.emit('bundle:error', {
        message: `Failed to analyze import "${importPath}": ${error instanceof Error ? error.message : String(error)}`,
        stack: error instanceof Error ? error.stack : undefined,
      });
    }
  };

  /**
   * Start CDN analysis
   */
  startCDNAnalysis = (): void => {
    try {
      this.getStore().analyzeCDNOpportunities();
    } catch (error) {
      this.emit('bundle:error', {
        message: `CDN analysis failed: ${error instanceof Error ? error.message : String(error)}`,
        stack: error instanceof Error ? error.stack : undefined,
      });
    }
  };

  /**
   * Start tree-shaking analysis
   */
  startTreeShakingAnalysis = (): void => {
    try {
      this.getStore().analyzeTreeShaking();
    } catch (error) {
      this.emit('bundle:error', {
        message: `Tree-shaking analysis failed: ${error instanceof Error ? error.message : String(error)}`,
        stack: error instanceof Error ? error.stack : undefined,
      });
    }
  };

  /**
   * Update configuration
   */
  updateConfig = (config: Partial<BundleAnalyzerConfig>): void => {
    this.getStore().updateConfig(config);
    this.emit('bundle:config-updated', { config: this.store.getState().config });
  };

  /**
   * Select module for detailed view
   */
  selectModule = (moduleId: string | null): void => {
    this.getStore().selectModule(moduleId);
    this.emit('bundle:state', this.store.getState());
  };

  /**
   * Select chunk for detailed view
   */
  selectChunk = (chunkId: string | null): void => {
    this.getStore().selectChunk(chunkId);
    this.emit('bundle:state', this.store.getState());
  };

  /**
   * Update filters
   */
  updateFilters = (filters: Partial<BundleAnalyzerState['filters']>): void => {
    this.getStore().updateFilters(filters);
    this.emit('bundle:state', this.store.getState());
  };

  /**
   * Update visualization settings
   */
  updateVisualization = (viz: Partial<BundleAnalyzerState['visualization']>): void => {
    this.getStore().updateVisualization(viz);
    this.emit('bundle:state', this.store.getState());
  };

  /**
   * Get filtered modules
   */
  getFilteredModules = (): BundleModule[] => {
    return this.getStore().getFilteredModules();
  };

  /**
   * Simulate bundle data for development/demo
   */
  generateSampleData = (): void => {
    const sampleModules: BundleModule[] = [
      {
        id: 'react',
        name: 'react',
        size: 42.2 * 1024, // 42.2KB
        gzipSize: 13.2 * 1024,
        path: 'node_modules/react/index.js',
        imports: [],
        exports: ['createElement', 'Component', 'useState', 'useEffect'],
        usedExports: ['createElement', 'useState'],
        unusedExports: ['Component', 'useEffect'],
        isTreeShakeable: true,
        isDynamic: false,
        timestamp: Date.now(),
      },
      {
        id: 'lodash',
        name: 'lodash',
        size: 528 * 1024, // 528KB
        gzipSize: 94 * 1024,
        path: 'node_modules/lodash/index.js',
        imports: [],
        exports: ['map', 'filter', 'reduce', 'forEach', 'find', 'some', 'every'],
        usedExports: ['map'],
        unusedExports: ['filter', 'reduce', 'forEach', 'find', 'some', 'every'],
        isTreeShakeable: false,
        isDynamic: false,
        timestamp: Date.now(),
      },
      {
        id: 'app-bundle',
        name: 'main.js',
        size: 156 * 1024, // 156KB
        gzipSize: 45 * 1024,
        path: '/dist/main.js',
        imports: ['react', 'lodash'],
        exports: [],
        isTreeShakeable: true,
        isDynamic: false,
        timestamp: Date.now(),
      },
    ];

    const sampleChunks: BundleChunk[] = [
      {
        id: 'main',
        name: 'main',
        size: 200 * 1024,
        gzipSize: 58 * 1024,
        modules: [sampleModules[2]],
        parents: [],
        children: ['vendor'],
        isEntry: true,
        isAsync: false,
        files: ['/dist/main.js'],
        timestamp: Date.now(),
      },
      {
        id: 'vendor',
        name: 'vendor',
        size: 570 * 1024,
        gzipSize: 107 * 1024,
        modules: [sampleModules[0], sampleModules[1]],
        parents: ['main'],
        children: [],
        isEntry: false,
        isAsync: false,
        files: ['/dist/vendor.js'],
        timestamp: Date.now(),
      },
    ];

    this.getStore().updateModules(sampleModules);
    this.getStore().updateChunks(sampleChunks);
    
    // Trigger analysis
    this.getStore().generateRecommendations();
    
    this.emit('bundle:state', this.store.getState());
  };

  /**
   * Cleanup resources
   */
  private cleanup = (): void => {
    this.bundleObserver?.disconnect();
    this.performanceObserver?.disconnect();
  };

  /**
   * Destroy event client and cleanup resources
   */
  destroy = (): void => {
    this.unsubscribe?.();
    this.cleanup();
    this.subscribers.clear();
  };
}

// Singleton instance
let eventClientInstance: BundleAnalyzerDevToolsEventClient | null = null;

/**
 * Create or get bundle analyzer DevTools event client
 */
export function createBundleAnalyzerEventClient(): BundleAnalyzerDevToolsEventClient {
  if (!eventClientInstance) {
    eventClientInstance = new BundleAnalyzerDevToolsEventClient();
  }
  return eventClientInstance;
}

/**
 * Get existing bundle analyzer DevTools event client
 */
export function getBundleAnalyzerEventClient(): BundleAnalyzerDevToolsEventClient | null {
  return eventClientInstance;
}

/**
 * Reset event client instance (useful for testing)
 */
export function resetBundleAnalyzerEventClient(): void {
  if (eventClientInstance) {
    eventClientInstance.destroy();
    eventClientInstance = null;
  }
}