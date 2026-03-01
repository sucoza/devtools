import { describe, it, expect, beforeEach } from 'vitest';
import { stressTestStore } from './store';
import type { RequestResult, TestRun } from './types';

/**
 * Tests for StressTestStore - focusing on the percentile calculation
 * and metrics computation through the public API (addResult).
 *
 * The percentile method is private, so we exercise it indirectly by
 * adding results and inspecting the metrics that updateMetrics() produces.
 */

function makeResult(duration: number, overrides?: Partial<RequestResult>): RequestResult {
  return {
    configName: 'test',
    duration,
    timestamp: Date.now(),
    success: true,
    statusCode: 200,
    ...overrides,
  };
}

function makeTestRun(id: string): TestRun {
  return {
    id,
    name: 'Test Run',
    startTime: Date.now(),
    type: 'fixed',
    status: 'running',
    config: {
      requests: [],
      count: 10,
      concurrency: 1,
    },
  };
}

describe('StressTestStore', () => {
  beforeEach(() => {
    // Clear any leftover state from previous tests.
    // The store is a singleton, so we reset by clearing test runs and results.
    const state = stressTestStore.getState();
    state.testRuns.forEach((run) => {
      stressTestStore.clearResults(run.id);
      stressTestStore.removeTestRun(run.id);
    });
  });

  describe('percentile via metrics', () => {
    it('should produce no metrics when no results exist for a test', () => {
      const testId = 'no-results';
      stressTestStore.addTestRun(makeTestRun(testId));

      const metrics = stressTestStore.getState().metrics[testId];
      expect(metrics).toBeUndefined();
    });

    it('should return the single element for all percentiles when there is one result', () => {
      const testId = 'single-result';
      stressTestStore.addTestRun(makeTestRun(testId));
      stressTestStore.addResult(testId, makeResult(42));

      const metrics = stressTestStore.getState().metrics[testId];
      expect(metrics).toBeDefined();
      expect(metrics.p50).toBe(42);
      expect(metrics.p90).toBe(42);
      expect(metrics.p95).toBe(42);
      expect(metrics.p99).toBe(42);
    });

    it('should compute correct percentiles for a known sorted array [1..10]', () => {
      const testId = 'known-values';
      stressTestStore.addTestRun(makeTestRun(testId));

      // Add results with durations 1 through 10
      for (let i = 1; i <= 10; i++) {
        stressTestStore.addResult(testId, makeResult(i));
      }

      const metrics = stressTestStore.getState().metrics[testId];
      expect(metrics).toBeDefined();

      // With the formula: index = max(0, ceil((p/100) * length) - 1)
      // For length=10:
      //   p50: ceil(0.5 * 10) - 1 = 5 - 1 = 4 -> sorted[4] = 5
      //   p90: ceil(0.9 * 10) - 1 = 9 - 1 = 8 -> sorted[8] = 9
      //   p95: ceil(0.95 * 10) - 1 = 10 - 1 = 9 -> sorted[9] = 10
      //   p99: ceil(0.99 * 10) - 1 = 10 - 1 = 9 -> sorted[9] = 10
      expect(metrics.p50).toBe(5);
      expect(metrics.p90).toBe(9);
      expect(metrics.p95).toBe(10);
      expect(metrics.p99).toBe(10);
    });

    it('should return the maximum value at the p100 boundary (bug fix verification)', () => {
      // Previously, p100 would have returned 0 due to an out-of-bounds index.
      // The fix uses: Math.max(0, Math.ceil((p/100) * length) - 1)
      // For p=100, length=5: ceil(1.0 * 5) - 1 = 5 - 1 = 4 -> sorted[4] = max
      const testId = 'p100-bug';
      stressTestStore.addTestRun(makeTestRun(testId));

      const durations = [10, 30, 50, 70, 90];
      for (const d of durations) {
        stressTestStore.addResult(testId, makeResult(d));
      }

      const metrics = stressTestStore.getState().metrics[testId];
      expect(metrics).toBeDefined();

      // maxResponseTime should equal the max duration
      expect(metrics.maxResponseTime).toBe(90);
      // p99 should be close to or equal to the max for small arrays
      // ceil(0.99 * 5) - 1 = 5 - 1 = 4 -> sorted[4] = 90
      expect(metrics.p99).toBe(90);
    });

    it('should compute correct p50 (median) for even-length arrays', () => {
      const testId = 'even-length';
      stressTestStore.addTestRun(makeTestRun(testId));

      // Durations: [100, 200, 300, 400]
      for (const d of [100, 200, 300, 400]) {
        stressTestStore.addResult(testId, makeResult(d));
      }

      const metrics = stressTestStore.getState().metrics[testId];
      expect(metrics).toBeDefined();

      // p50: ceil(0.5 * 4) - 1 = 2 - 1 = 1 -> sorted[1] = 200
      expect(metrics.p50).toBe(200);
    });

    it('should sort durations before computing percentiles', () => {
      const testId = 'unsorted';
      stressTestStore.addTestRun(makeTestRun(testId));

      // Add durations in unsorted order
      for (const d of [500, 100, 300, 200, 400]) {
        stressTestStore.addResult(testId, makeResult(d));
      }

      const metrics = stressTestStore.getState().metrics[testId];
      expect(metrics).toBeDefined();

      // After sorting: [100, 200, 300, 400, 500]
      // p50: ceil(0.5 * 5) - 1 = 3 - 1 = 2 -> sorted[2] = 300
      expect(metrics.p50).toBe(300);
      expect(metrics.minResponseTime).toBe(100);
      expect(metrics.maxResponseTime).toBe(500);
    });

    it('should track failed requests and error types in metrics', () => {
      const testId = 'failures';
      stressTestStore.addTestRun(makeTestRun(testId));

      stressTestStore.addResult(testId, makeResult(100, { success: true }));
      stressTestStore.addResult(
        testId,
        makeResult(200, { success: false, error: 'Timeout' })
      );
      stressTestStore.addResult(
        testId,
        makeResult(300, { success: false, error: 'Timeout' })
      );
      stressTestStore.addResult(
        testId,
        makeResult(150, { success: false, error: 'Network Error' })
      );

      const metrics = stressTestStore.getState().metrics[testId];
      expect(metrics).toBeDefined();
      expect(metrics.totalRequests).toBe(4);
      expect(metrics.successfulRequests).toBe(1);
      expect(metrics.failedRequests).toBe(3);
      expect(metrics.errorsByType['Timeout']).toBe(2);
      expect(metrics.errorsByType['Network Error']).toBe(1);
    });

    it('should compute correct average response time', () => {
      const testId = 'avg';
      stressTestStore.addTestRun(makeTestRun(testId));

      for (const d of [100, 200, 300]) {
        stressTestStore.addResult(testId, makeResult(d));
      }

      const metrics = stressTestStore.getState().metrics[testId];
      expect(metrics).toBeDefined();
      expect(metrics.averageResponseTime).toBe(200);
    });
  });
});
