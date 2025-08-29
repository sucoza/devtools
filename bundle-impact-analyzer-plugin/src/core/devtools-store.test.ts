import { describe, it, expect, beforeEach } from 'vitest';
import { useBundleAnalyzerStore } from './devtools-store';
import type { BundleModule, BundleChunk } from '../types';

describe('BundleAnalyzerStore', () => {
  let store: ReturnType<typeof useBundleAnalyzerStore>;

  beforeEach(() => {
    // Get a fresh store instance
    store = useBundleAnalyzerStore.getState();
    
    // Reset store to initial state
    store.updateModules([]);
    store.updateChunks([]);
    store.clearFilters();
  });

  it('has correct initial state', () => {
    expect(store.modules).toEqual([]);
    expect(store.chunks).toEqual([]);
    expect(store.isAnalyzing).toBe(false);
    expect(store.selectedModule).toBeNull();
    expect(store.selectedChunk).toBeNull();
    expect(store.recommendations).toEqual([]);
  });

  it('can add modules', () => {
    const module: BundleModule = {
      id: 'test-module',
      name: 'test.js',
      size: 1024,
      path: '/test.js',
      imports: [],
      exports: ['default'],
      isTreeShakeable: true,
      isDynamic: false,
      timestamp: Date.now(),
    };

    store.addModule(module);
    
    expect(store.modules).toHaveLength(1);
    expect(store.modules[0]).toEqual(module);
    expect(store.stats.moduleCount).toBe(1);
  });

  it('can update modules', () => {
    const modules: BundleModule[] = [
      {
        id: 'module1',
        name: 'module1.js',
        size: 1024,
        path: '/module1.js',
        imports: [],
        exports: ['export1'],
        isTreeShakeable: true,
        isDynamic: false,
        timestamp: Date.now(),
      },
      {
        id: 'module2',
        name: 'module2.js',
        size: 2048,
        path: '/module2.js',
        imports: ['module1'],
        exports: ['export2'],
        isTreeShakeable: false,
        isDynamic: true,
        timestamp: Date.now(),
      },
    ];

    store.updateModules(modules);
    
    expect(store.modules).toHaveLength(2);
    expect(store.stats.moduleCount).toBe(2);
    expect(store.stats.totalSize).toBe(3072); // 1024 + 2048
  });

  it('can select and deselect modules', () => {
    store.selectModule('test-module');
    expect(store.selectedModule).toBe('test-module');
    
    store.selectModule(null);
    expect(store.selectedModule).toBeNull();
  });

  it('can update filters', () => {
    store.updateFilters({
      showOnlyLargeModules: true,
      searchQuery: 'test',
      minimumSize: 1024,
    });
    
    expect(store.filters.showOnlyLargeModules).toBe(true);
    expect(store.filters.searchQuery).toBe('test');
    expect(store.filters.minimumSize).toBe(1024);
  });

  it('can start and stop analysis', () => {
    store.startAnalysis();
    expect(store.isAnalyzing).toBe(true);
    expect(store.lastAnalysisTime).toBeGreaterThan(0);
    
    store.stopAnalysis();
    expect(store.isAnalyzing).toBe(false);
  });

  it('generates recommendations for large modules', () => {
    const largeModule: BundleModule = {
      id: 'large-module',
      name: 'large.js',
      size: 600 * 1024, // 600KB - larger than threshold
      path: '/large.js',
      imports: [],
      exports: ['default'],
      isTreeShakeable: true,
      isDynamic: false,
      timestamp: Date.now(),
    };

    store.updateModules([largeModule]);
    
    // Should generate recommendations automatically
    expect(store.recommendations.length).toBeGreaterThan(0);
    expect(store.recommendations[0].type).toBe('code-split');
    expect(store.recommendations[0].severity).toBe('critical');
  });

  it('can analyze import impact', () => {
    const module: BundleModule = {
      id: 'test-module',
      name: 'test.js',
      size: 1024,
      path: '/test.js',
      imports: [],
      exports: ['export1', 'export2', 'export3'],
      usedExports: ['export1'],
      unusedExports: ['export2', 'export3'],
      isTreeShakeable: true,
      isDynamic: false,
      timestamp: Date.now(),
    };

    store.updateModules([module]);
    
    const impact = store.analyzeImportImpact('/test.js');
    
    expect(impact).toBeTruthy();
    expect(impact!.module).toBe('test.js');
    expect(impact!.sizeAdded).toBe(1024);
    expect(impact!.treeshakingPotential).toBeGreaterThan(0);
  });

  it('can manage analysis jobs', () => {
    const jobId = store.startJob({
      type: 'full-analysis',
      status: 'pending',
      progress: 0,
    });
    
    expect(store.jobs).toHaveLength(1);
    expect(store.jobs[0].id).toBe(jobId);
    expect(store.jobs[0].status).toBe('pending');
    
    store.updateJob(jobId, { status: 'running', progress: 50 });
    expect(store.jobs[0].status).toBe('running');
    expect(store.jobs[0].progress).toBe(50);
    
    store.completeJob(jobId, { result: 'success' });
    expect(store.jobs[0].status).toBe('completed');
    expect(store.jobs[0].progress).toBe(100);
  });

  it('can update configuration', () => {
    store.updateConfig({
      enableRealTimeTracking: false,
      thresholds: {
        largeModuleSize: 200 * 1024,
        criticalRecommendationThreshold: 1000 * 1024,
        treeShakingEfficiencyThreshold: 0.9,
      },
    });
    
    expect(store.config.enableRealTimeTracking).toBe(false);
    expect(store.config.thresholds.largeModuleSize).toBe(200 * 1024);
  });
});