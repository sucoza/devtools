import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useBundleAnalyzerStore } from './devtools-store';
import type { BundleModule } from '../types';

describe('BundleAnalyzerStore – interval and division-by-zero fixes', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    const store = useBundleAnalyzerStore.getState();
    store.updateModules([]);
    store.updateChunks([]);
    store.clearFilters();
    store.selectModule(null);
    store.selectChunk(null);
    store.stopAnalysis();
    useBundleAnalyzerStore.setState({ jobs: [] });
  });

  afterEach(() => {
    // Make sure any lingering intervals are cleaned up
    useBundleAnalyzerStore.getState().stopAnalysis();
    vi.useRealTimers();
  });

  // --- startAnalysis creates an interval that progresses ---

  it('startAnalysis creates an interval that advances job progress', () => {
    const { startAnalysis } = useBundleAnalyzerStore.getState();
    startAnalysis();

    let state = useBundleAnalyzerStore.getState();
    expect(state.isAnalyzing).toBe(true);
    expect(state.jobs.length).toBeGreaterThan(0);

    const jobId = state.jobs[state.jobs.length - 1].id;
    const initialProgress = state.jobs.find(j => j.id === jobId)!.progress;

    // Advance the timer by one interval tick (200ms)
    vi.advanceTimersByTime(200);

    state = useBundleAnalyzerStore.getState();
    const updatedProgress = state.jobs.find(j => j.id === jobId)!.progress;
    expect(updatedProgress).toBeGreaterThan(initialProgress);
  });

  it('startAnalysis completes the job after enough ticks', () => {
    const { startAnalysis } = useBundleAnalyzerStore.getState();
    startAnalysis();

    // Progress goes 0 -> 10 -> 20 -> ... -> 100 in 200ms intervals
    // That's 10 ticks of 200ms plus one more to detect completion = 2200ms
    vi.advanceTimersByTime(2200);

    const state = useBundleAnalyzerStore.getState();
    const completedJob = state.jobs.find(j => j.status === 'completed');
    expect(completedJob).toBeDefined();
    expect(completedJob!.progress).toBe(100);
    expect(state.isAnalyzing).toBe(false);
  });

  // --- stopAnalysis clears the interval ---

  it('stopAnalysis prevents further progress updates', () => {
    const { startAnalysis, stopAnalysis } = useBundleAnalyzerStore.getState();
    startAnalysis();

    // Let it progress a couple ticks
    vi.advanceTimersByTime(400);

    let state = useBundleAnalyzerStore.getState();
    const jobId = state.jobs[state.jobs.length - 1].id;
    const progressAfterTwoTicks = state.jobs.find(j => j.id === jobId)!.progress;
    expect(progressAfterTwoTicks).toBeGreaterThan(0);

    // Stop analysis
    stopAnalysis();

    state = useBundleAnalyzerStore.getState();
    expect(state.isAnalyzing).toBe(false);

    // Advance more time — progress should NOT change
    const progressAtStop = state.jobs.find(j => j.id === jobId)!.progress;
    vi.advanceTimersByTime(2000);

    state = useBundleAnalyzerStore.getState();
    const progressAfterMoreTime = state.jobs.find(j => j.id === jobId)!.progress;
    expect(progressAfterMoreTime).toBe(progressAtStop);
  });

  // --- Division by zero guard: empty exports array ---

  it('analyzeImportImpact does not produce Infinity for module with empty exports', () => {
    const moduleWithEmptyExports: BundleModule = {
      id: 'empty-exports',
      name: 'empty.js',
      size: 5000,
      path: '/empty.js',
      imports: [],
      exports: [],          // <-- empty exports array
      unusedExports: [],
      usedExports: [],
      isTreeShakeable: true,
      isDynamic: false,
      timestamp: Date.now(),
    };

    const { updateModules, analyzeImportImpact } = useBundleAnalyzerStore.getState();
    updateModules([moduleWithEmptyExports]);

    const impact = analyzeImportImpact('/empty.js');
    expect(impact).not.toBeNull();
    expect(Number.isFinite(impact!.sizeAdded)).toBe(true);
    expect(Number.isFinite(impact!.treeshakingPotential)).toBe(true);
    // treeshakingPotential should be 0 since there are no exports to tree-shake
    expect(impact!.treeshakingPotential).toBe(0);
  });

  it('analyzeImportImpact works normally for module with exports', () => {
    const module: BundleModule = {
      id: 'normal',
      name: 'normal.js',
      size: 10000,
      path: '/normal.js',
      imports: [],
      exports: ['a', 'b', 'c'],
      unusedExports: ['b', 'c'],
      usedExports: ['a'],
      isTreeShakeable: true,
      isDynamic: false,
      timestamp: Date.now(),
    };

    const { updateModules, analyzeImportImpact } = useBundleAnalyzerStore.getState();
    updateModules([module]);

    const impact = analyzeImportImpact('/normal.js');
    expect(impact).not.toBeNull();
    expect(impact!.module).toBe('normal.js');
    expect(impact!.sizeAdded).toBe(10000);
    // 2 unused out of 3 exports => (2/3) * 10000 ≈ 6666.67
    expect(impact!.treeshakingPotential).toBeCloseTo((2 / 3) * 10000, 0);
  });

  it('generateRecommendations does not produce Infinity for modules with empty exports', () => {
    const moduleWithEmptyExports: BundleModule = {
      id: 'no-exports',
      name: 'no-exports.js',
      size: 200 * 1024, // large enough to trigger recommendation
      path: '/no-exports.js',
      imports: [],
      exports: [],
      unusedExports: ['phantom'], // unusual but should not cause Infinity
      isTreeShakeable: false,
      isDynamic: false,
      timestamp: Date.now(),
    };

    const { updateModules } = useBundleAnalyzerStore.getState();
    updateModules([moduleWithEmptyExports]);

    const state = useBundleAnalyzerStore.getState();
    // Check that no recommendation has Infinity in estimatedSavings
    for (const rec of state.recommendations) {
      expect(Number.isFinite(rec.estimatedSavings)).toBe(true);
    }
    // Stats should also not have Infinity
    expect(Number.isFinite(state.stats.unusedCodeSize)).toBe(true);
    expect(Number.isFinite(state.stats.treeShakingEfficiency)).toBe(true);
  });
});
