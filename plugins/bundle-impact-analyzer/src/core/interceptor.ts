import type { BundleModule, BundleChunk, BundleBuildInfo } from '../types';
import { createBundleAnalyzerEventClient } from './devtools-client';

/**
 * Bundle interceptor for tracking imports, chunks, and build information
 */
export class BundleInterceptor {
  private eventClient = createBundleAnalyzerEventClient();
  private isActive = false;
  
  // Module tracking
  private moduleCache = new Map<string, BundleModule>();
  private importGraph = new Map<string, Set<string>>();
  
  // Performance tracking
  private loadTimes = new Map<string, number>();
  private resourceObserver?: PerformanceObserver;
  
  // Build tool specific interceptors
  private webpackInterceptor?: WebpackInterceptor;
  private viteInterceptor?: ViteInterceptor;

  /**
   * Start bundle interception
   */
  start() {
    if (this.isActive) return;
    
    this.isActive = true;
    this.setupResourceObserver();
    this.setupBuildToolInterceptors();
    this.setupModuleInterception();
    
    console.log('[Bundle Interceptor] Started bundle tracking');
  }

  /**
   * Stop bundle interception
   */
  stop() {
    if (!this.isActive) return;
    
    this.isActive = false;
    this.cleanup();
    
    console.log('[Bundle Interceptor] Stopped bundle tracking');
  }

  /**
   * Set up performance observer for resource timing
   */
  private setupResourceObserver() {
    if (typeof PerformanceObserver === 'undefined') return;

    this.resourceObserver = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.entryType === 'resource' && this.isBundleResource(entry.name)) {
          this.trackResourceLoad(entry as PerformanceResourceTiming);
        }
      });
    });

    this.resourceObserver.observe({ entryTypes: ['resource'] });
  }

  /**
   * Check if a resource is a bundle
   */
  private isBundleResource(url: string): boolean {
    const bundlePatterns = [
      /\.m?js$/,
      /\.css$/,
      /chunk/,
      /bundle/,
      /vendor/,
      /main\./,
      /app\./,
      /index\./
    ];

    return bundlePatterns.some(pattern => pattern.test(url)) &&
           !url.includes('node_modules') &&
           !url.includes('sockjs') &&
           !url.includes('hot-update');
  }

  /**
   * Track resource load timing and size
   */
  private trackResourceLoad(entry: PerformanceResourceTiming) {
    const url = entry.name;
    const size = entry.transferSize || entry.encodedBodySize || 0;
    const loadTime = entry.responseEnd - entry.startTime;
    
    this.loadTimes.set(url, loadTime);

    // Create or update module entry
    const moduleId = this.getModuleId(url);
    let module = this.moduleCache.get(moduleId);

    if (!module) {
      module = {
        id: moduleId,
        name: this.extractModuleName(url),
        size,
        gzipSize: entry.encodedBodySize,
        path: url,
        imports: [],
        exports: [],
        isTreeShakeable: this.isTreeShakeable(url),
        isDynamic: this.isDynamicImport(url),
        timestamp: Date.now(),
      };
      
      this.moduleCache.set(moduleId, module);
      this.eventClient.emit('bundle:module-added', { module });
    } else {
      // Update existing module
      module.size = size;
      module.gzipSize = entry.encodedBodySize;
      module.timestamp = Date.now();
      
      this.eventClient.emit('bundle:module-updated', { module });
    }
  }

  /**
   * Generate module ID from URL
   */
  private getModuleId(url: string): string {
    // Remove query parameters and create consistent ID
    const cleanUrl = url.split('?')[0];
    const parts = cleanUrl.split('/');
    return parts[parts.length - 1] || cleanUrl;
  }

  /**
   * Extract human-readable module name
   */
  private extractModuleName(url: string): string {
    const filename = url.split('/').pop() || url;
    return filename.split('?')[0];
  }

  /**
   * Check if module supports tree-shaking
   */
  private isTreeShakeable(url: string): boolean {
    // Heuristics for tree-shakeable modules
    return url.includes('.mjs') || 
           url.includes('.esm') ||
           !url.includes('umd') &&
           !url.includes('cjs');
  }

  /**
   * Check if module was loaded via dynamic import
   */
  private isDynamicImport(url: string): boolean {
    return url.includes('chunk') && !url.includes('main');
  }

  /**
   * Set up build tool specific interceptors
   */
  private setupBuildToolInterceptors() {
    // Webpack integration
    if (typeof window !== 'undefined' && (window as any).__webpack_require__) {
      this.webpackInterceptor = new WebpackInterceptor(this.eventClient);
      this.webpackInterceptor.start();
    }
    
    // Vite integration
    if (typeof window !== 'undefined' && (window as any).__vite__) {
      this.viteInterceptor = new ViteInterceptor(this.eventClient);
      this.viteInterceptor.start();
    }
  }

  /**
   * Set up module interception using various methods
   */
  private setupModuleInterception() {
    this.interceptDynamicImports();
    this.interceptRequire();
    this.trackExistingScripts();
  }

  /**
   * Intercept dynamic imports
   */
  private interceptDynamicImports() {
    if (typeof window === 'undefined') return;

    const originalImport = (window as any).__original_import__ || window.eval('(0, eval)("import")').bind(window);
    
    if (!originalImport) return;

    const self = this;
    (window as any).__original_import__ = originalImport;
    
    // Replace global import function
    try {
      window.eval(`
        (function() {
          const originalImport = window.__original_import__;
          if (!originalImport) return;
          
          window.import = function(specifier) {
            // Track the import
            window.__bundleInterceptor__?.trackDynamicImport?.(specifier);
            return originalImport.call(this, specifier);
          };
        })()
      `);
      
      (window as any).__bundleInterceptor__ = {
        trackDynamicImport: (specifier: string) => {
          this.trackImport(specifier, true);
        }
      };
    } catch (error) {
      console.warn('[Bundle Interceptor] Could not intercept dynamic imports:', error);
    }
  }

  /**
   * Intercept CommonJS require (if available)
   */
  private interceptRequire() {
    if (typeof require !== 'undefined' && typeof module !== 'undefined') {
      const originalRequire = require;
      const self = this;
      
      // This is a simplified approach - in practice, this would need
      // more sophisticated handling for different module systems
      // require = function(id: string) {
      //   self.trackImport(id, false);
      //   return originalRequire(id);
      // };
    }
  }

  /**
   * Track existing scripts at startup
   */
  private trackExistingScripts() {
    if (typeof document === 'undefined') return;

    const scripts = document.querySelectorAll('script[src]');
    scripts.forEach((script) => {
      const src = (script as HTMLScriptElement).src;
      if (this.isBundleResource(src)) {
        // Create synthetic performance entry
        const fakeEntry: Partial<PerformanceResourceTiming> = {
          name: src,
          transferSize: 0,
          encodedBodySize: 0,
          startTime: Date.now(),
          responseEnd: Date.now(),
        };
        
        // Try to get actual size
        this.getBundleSize(src).then(size => {
          this.trackResourceLoad({
            ...fakeEntry,
            transferSize: size,
            encodedBodySize: size * 0.7, // Estimate gzip
          } as PerformanceResourceTiming);
        });
      }
    });
  }

  /**
   * Get bundle size using fetch HEAD request
   */
  private async getBundleSize(url: string): Promise<number> {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      const contentLength = response.headers.get('Content-Length');
      return contentLength ? parseInt(contentLength, 10) : 0;
    } catch {
      return 0;
    }
  }

  /**
   * Track import relationship
   */
  private trackImport(specifier: string, isDynamic: boolean) {
    // Add to import graph
    const currentModule = this.getCurrentModuleId();
    if (currentModule) {
      if (!this.importGraph.has(currentModule)) {
        this.importGraph.set(currentModule, new Set());
      }
      this.importGraph.get(currentModule)!.add(specifier);
    }

    // Create module entry if it doesn't exist
    const moduleId = this.getModuleId(specifier);
    if (!this.moduleCache.has(moduleId)) {
      const module: BundleModule = {
        id: moduleId,
        name: this.extractModuleName(specifier),
        size: 0,
        path: specifier,
        imports: [],
        exports: [],
        isTreeShakeable: true,
        isDynamic,
        timestamp: Date.now(),
      };
      
      this.moduleCache.set(moduleId, module);
      this.eventClient.emit('bundle:module-added', { module });
    }
  }

  /**
   * Get current module ID (heuristic)
   */
  private getCurrentModuleId(): string | null {
    if (typeof document === 'undefined') return null;
    
    // Try to get from stack trace
    const stack = new Error().stack;
    if (stack) {
      const lines = stack.split('\n');
      for (const line of lines) {
        const match = line.match(/https?:\/\/[^)]+\.m?js/);
        if (match) {
          return this.getModuleId(match[0]);
        }
      }
    }
    
    return null;
  }

  /**
   * Get all tracked modules
   */
  getModules(): BundleModule[] {
    return Array.from(this.moduleCache.values());
  }

  /**
   * Get import graph
   */
  getImportGraph(): Map<string, Set<string>> {
    return new Map(this.importGraph);
  }

  /**
   * Cleanup resources
   */
  private cleanup() {
    this.resourceObserver?.disconnect();
    this.webpackInterceptor?.stop();
    this.viteInterceptor?.stop();
    
    // Restore original functions
    if ((window as any).__original_import__) {
      try {
        window.eval(`window.import = window.__original_import__;`);
      } catch {}
    }
    
    if ((window as any).__bundleInterceptor__) {
      delete (window as any).__bundleInterceptor__;
    }
  }
}

/**
 * Webpack-specific interceptor
 */
class WebpackInterceptor {
  private eventClient: ReturnType<typeof createBundleAnalyzerEventClient>;
  
  constructor(eventClient: ReturnType<typeof createBundleAnalyzerEventClient>) {
    this.eventClient = eventClient;
  }

  start() {
    this.trackWebpackChunks();
    this.interceptWebpackRequire();
  }

  stop() {
    // Cleanup webpack interception
  }

  private trackWebpackChunks() {
    const webpackRequire = (window as any).__webpack_require__;
    if (!webpackRequire) return;

    // Access webpack chunk loading
    const chunkLoadingGlobal = (window as any)[webpackRequire.chunkName] || 
                              (window as any).webpackChunk ||
                              [];

    if (Array.isArray(chunkLoadingGlobal)) {
      const originalPush = chunkLoadingGlobal.push.bind(chunkLoadingGlobal);
      chunkLoadingGlobal.push = (...args: any[]) => {
        this.handleChunkLoad(args[0]);
        return originalPush(...args);
      };
    }
  }

  private handleChunkLoad(chunkData: any) {
    if (!Array.isArray(chunkData) || chunkData.length < 2) return;
    
    const [chunkIds, modules] = chunkData;
    
    // Create chunk entry
    const chunk: BundleChunk = {
      id: Array.isArray(chunkIds) ? chunkIds.join(',') : String(chunkIds),
      name: `chunk-${Array.isArray(chunkIds) ? chunkIds.join('-') : chunkIds}`,
      size: 0,
      modules: [],
      parents: [],
      children: [],
      isEntry: false,
      isAsync: true,
      files: [],
      timestamp: Date.now(),
    };

    // Process modules in chunk
    if (modules && typeof modules === 'object') {
      Object.keys(modules).forEach(moduleId => {
        const moduleFunction = modules[moduleId];
        if (typeof moduleFunction === 'function') {
          // Estimate module size from function string length
          const size = moduleFunction.toString().length;
          
          const module: BundleModule = {
            id: moduleId,
            name: `module-${moduleId}`,
            size,
            path: `webpack:///${moduleId}`,
            imports: [],
            exports: [],
            isTreeShakeable: true,
            isDynamic: true,
            chunk: chunk.id,
            timestamp: Date.now(),
          };
          
          chunk.modules.push(module);
          chunk.size += size;
        }
      });
    }

    this.eventClient.emit('bundle:chunk-added', { chunk });
  }

  private interceptWebpackRequire() {
    const webpackRequire = (window as any).__webpack_require__;
    if (!webpackRequire || webpackRequire.__intercepted__) return;

    const originalRequire = webpackRequire;
    const self = this;

    (window as any).__webpack_require__ = function(moduleId: string) {
      // Track the require
      self.trackWebpackRequire(moduleId);
      return originalRequire.apply(this, arguments);
    };

    // Copy properties
    Object.keys(originalRequire).forEach(key => {
      (window as any).__webpack_require__[key] = originalRequire[key];
    });

    (window as any).__webpack_require__.__intercepted__ = true;
  }

  private trackWebpackRequire(moduleId: string) {
    // Track webpack module access
    // This helps build the dependency graph
    console.debug(`[Webpack Interceptor] Module required: ${moduleId}`);
  }
}

/**
 * Vite-specific interceptor
 */
class ViteInterceptor {
  private eventClient: ReturnType<typeof createBundleAnalyzerEventClient>;
  
  constructor(eventClient: ReturnType<typeof createBundleAnalyzerEventClient>) {
    this.eventClient = eventClient;
  }

  start() {
    this.trackViteHMR();
    this.analyzeBuildInfo();
  }

  stop() {
    // Cleanup Vite interception
  }

  private trackViteHMR() {
    if (typeof (import.meta as any)?.hot !== 'undefined') {
      const hot = (import.meta as any).hot;
      
      // Track HMR updates
      hot.on('vite:beforeUpdate', (payload) => {
        console.debug('[Vite Interceptor] HMR update:', payload);
      });
    }
  }

  private analyzeBuildInfo() {
    const buildInfo: BundleBuildInfo = {
      buildTool: 'vite',
      buildTime: Date.now(),
      environment: (import.meta as any).env?.PROD ? 'production' : 'development',
      optimization: {
        minimize: (import.meta as any).env?.PROD || false,
        treeShaking: true,
        splitChunks: true,
        sideEffects: false,
      },
      warnings: [],
      errors: [],
    };

    // Call setBuildInfo method on the store
    const store = (this.eventClient as any).store;
    if (store && store.setBuildInfo) {
      store.setBuildInfo(buildInfo);
    }
  }
}

// Singleton instance
let interceptorInstance: BundleInterceptor | null = null;

/**
 * Get or create bundle interceptor instance
 */
export function getBundleInterceptor(): BundleInterceptor {
  if (!interceptorInstance) {
    interceptorInstance = new BundleInterceptor();
  }
  return interceptorInstance;
}

/**
 * Start bundle interception
 */
export function startBundleInterception(): void {
  getBundleInterceptor().start();
}

/**
 * Stop bundle interception
 */
export function stopBundleInterception(): void {
  if (interceptorInstance) {
    interceptorInstance.stop();
  }
}

/**
 * Reset interceptor instance (useful for testing)
 */
export function resetBundleInterceptor(): void {
  if (interceptorInstance) {
    interceptorInstance.stop();
    interceptorInstance = null;
  }
}