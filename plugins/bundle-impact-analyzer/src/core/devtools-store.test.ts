import { describe, it, expect, beforeEach } from 'vitest';
import { useBundleAnalyzerStore } from './devtools-store';
import type { BundleModule, BundleChunk } from '../types';

describe('BundleAnalyzerStore', () => {
  beforeEach(() => {
    // Get the store and reset to initial state by updating the store directly
    const store = useBundleAnalyzerStore.getState();
    
    // Reset all store state
    store.updateModules([]);
    store.updateChunks([]);
    store.clearFilters();
    store.selectModule(null);
    store.selectChunk(null);
    store.stopAnalysis();
    
    // Clear jobs array manually by setting it directly
    useBundleAnalyzerStore.setState({ jobs: [] });
  });

  it('has correct initial state', () => {
    const state = useBundleAnalyzerStore.getState();
    expect(state.modules).toEqual([]);
    expect(state.chunks).toEqual([]);
    expect(state.isAnalyzing).toBe(false);
    expect(state.selectedModule).toBeNull();
    expect(state.selectedChunk).toBeNull();
    expect(state.recommendations).toEqual([]);
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

    const { addModule } = useBundleAnalyzerStore.getState();
    addModule(module);
    
    const state = useBundleAnalyzerStore.getState();
    expect(state.modules).toHaveLength(1);
    expect(state.modules[0]).toEqual(module);
    expect(state.stats.moduleCount).toBe(1);
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

    const { updateModules } = useBundleAnalyzerStore.getState();
    updateModules(modules);
    
    const state = useBundleAnalyzerStore.getState();
    expect(state.modules).toHaveLength(2);
    expect(state.stats.moduleCount).toBe(2);
    expect(state.stats.totalSize).toBe(3072); // 1024 + 2048
  });

  it('can select and deselect modules', () => {
    const { selectModule } = useBundleAnalyzerStore.getState();
    selectModule('test-module');
    
    let state = useBundleAnalyzerStore.getState();
    expect(state.selectedModule).toBe('test-module');
    
    selectModule(null);
    state = useBundleAnalyzerStore.getState();
    expect(state.selectedModule).toBeNull();
  });

  it('can update filters', () => {
    const { updateFilters } = useBundleAnalyzerStore.getState();
    updateFilters({
      showOnlyLargeModules: true,
      searchQuery: 'test',
      minimumSize: 1024,
    });
    
    const state = useBundleAnalyzerStore.getState();
    expect(state.filters.showOnlyLargeModules).toBe(true);
    expect(state.filters.searchQuery).toBe('test');
    expect(state.filters.minimumSize).toBe(1024);
  });

  it('can start and stop analysis', () => {
    const { startAnalysis, stopAnalysis } = useBundleAnalyzerStore.getState();
    startAnalysis();
    
    let state = useBundleAnalyzerStore.getState();
    expect(state.isAnalyzing).toBe(true);
    expect(state.lastAnalysisTime).toBeGreaterThan(0);
    
    stopAnalysis();
    state = useBundleAnalyzerStore.getState();
    expect(state.isAnalyzing).toBe(false);
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

    const { updateModules } = useBundleAnalyzerStore.getState();
    updateModules([largeModule]);
    
    const state = useBundleAnalyzerStore.getState();
    // Should generate recommendations automatically
    expect(state.recommendations.length).toBeGreaterThan(0);
    expect(state.recommendations[0].type).toBe('code-split');
    expect(state.recommendations[0].severity).toBe('critical');
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

    const { updateModules, analyzeImportImpact } = useBundleAnalyzerStore.getState();
    updateModules([module]);
    
    const impact = analyzeImportImpact('/test.js');
    
    expect(impact).toBeTruthy();
    expect(impact!.module).toBe('test.js');
    expect(impact!.sizeAdded).toBe(1024);
    expect(impact!.treeshakingPotential).toBeGreaterThan(0);
  });

  it('can manage analysis jobs', () => {
    const { startJob, updateJob, completeJob } = useBundleAnalyzerStore.getState();
    const jobId = startJob({
      type: 'full-analysis',
      status: 'pending',
      progress: 0,
    });
    
    let state = useBundleAnalyzerStore.getState();
    expect(state.jobs).toHaveLength(1);
    expect(state.jobs[0].id).toBe(jobId);
    expect(state.jobs[0].status).toBe('pending');
    
    updateJob(jobId, { status: 'running', progress: 50 });
    state = useBundleAnalyzerStore.getState();
    expect(state.jobs[0].status).toBe('running');
    expect(state.jobs[0].progress).toBe(50);
    
    completeJob(jobId, { result: 'success' });
    state = useBundleAnalyzerStore.getState();
    expect(state.jobs[0].status).toBe('completed');
    expect(state.jobs[0].progress).toBe(100);
  });

  it('can update configuration', () => {
    const { updateConfig } = useBundleAnalyzerStore.getState();
    updateConfig({
      enableRealTimeTracking: false,
      thresholds: {
        largeModuleSize: 200 * 1024,
        criticalRecommendationThreshold: 1000 * 1024,
        treeShakingEfficiencyThreshold: 0.9,
      },
    });
    
    const state = useBundleAnalyzerStore.getState();
    expect(state.config.enableRealTimeTracking).toBe(false);
    expect(state.config.thresholds.largeModuleSize).toBe(200 * 1024);
  });
});