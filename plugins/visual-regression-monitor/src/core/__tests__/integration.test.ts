import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ScreenshotEngine } from '../screenshot-engine';
import { DiffAlgorithm } from '../diff-algorithm';
import type { CaptureRequest, Screenshot } from '../../types';

// Mock MCP Playwright tools for integration tests
const mockMCPTools = {
  browser_navigate: vi.fn().mockResolvedValue(undefined),
  browser_resize: vi.fn().mockResolvedValue(undefined),
  browser_take_screenshot: vi.fn(),
  browser_snapshot: vi.fn().mockResolvedValue({ elements: [] }),
  browser_evaluate: vi.fn().mockResolvedValue(undefined),
  browser_wait_for: vi.fn().mockResolvedValue(undefined),
  browser_click: vi.fn().mockResolvedValue(undefined),
  browser_hover: vi.fn().mockResolvedValue(undefined),
  browser_close: vi.fn().mockResolvedValue(undefined),
  browser_install: vi.fn().mockResolvedValue(undefined),
};

// Mock Web Workers
global.Worker = vi.fn().mockImplementation(() => ({
  postMessage: vi.fn(),
  terminate: vi.fn(),
  onmessage: null,
  onerror: null,
}));

Object.defineProperty(global, 'window', {
  writable: true,
  value: {
    mcpPlaywrightTools: mockMCPTools,
  },
});

Object.defineProperty(navigator, 'hardwareConcurrency', {
  writable: true,
  value: 4,
});

// Helper function to create test image data URLs
function createTestImageDataUrl(width: number, height: number, color: string): string {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, width, height);
    
    // Add some text to make it more realistic
    ctx.fillStyle = 'white';
    ctx.font = '16px Arial';
    ctx.fillText(`${width}x${height} ${color}`, 10, 30);
  }
  return canvas.toDataURL();
}

describe('Integration Tests', () => {
  let screenshotEngine: ScreenshotEngine;
  let diffAlgorithm: DiffAlgorithm;

  beforeEach(() => {
    screenshotEngine = new ScreenshotEngine();
    diffAlgorithm = new DiffAlgorithm();
    vi.clearAllMocks();
    // Reset global Worker mock if it exists
    if (vi.isMockFunction(global.Worker)) {
      vi.mocked(global.Worker).mockRestore();
    }
  });

  afterEach(async () => {
    await screenshotEngine.cleanup();
    diffAlgorithm.cleanup();
  });

  describe('End-to-End Visual Regression Testing', () => {
    it('should perform complete visual regression workflow', async () => {
      // Step 1: Capture baseline screenshot
      mockMCPTools.browser_take_screenshot.mockResolvedValueOnce(
        createTestImageDataUrl(1920, 1080, 'blue')
      );

      const baselineRequest: CaptureRequest = {
        url: 'https://example.com',
        name: 'Homepage Baseline',
        tags: ['homepage', 'baseline'],
      };

      const baselineResult = await screenshotEngine.captureScreenshot(baselineRequest);
      expect(baselineResult.success).toBe(true);
      
      const baseline = baselineResult.screenshot!;
      expect(baseline).toBeDefined();

      // Step 2: Capture comparison screenshot
      mockMCPTools.browser_take_screenshot.mockResolvedValueOnce(
        createTestImageDataUrl(1920, 1080, 'lightblue') // Slightly different
      );

      const comparisonRequest: CaptureRequest = {
        url: 'https://example.com',
        name: 'Homepage Current',
        tags: ['homepage', 'current'],
      };

      const comparisonResult = await screenshotEngine.captureScreenshot(comparisonRequest);
      expect(comparisonResult.success).toBe(true);
      
      const comparison = comparisonResult.screenshot!;
      expect(comparison).toBeDefined();

      // Step 3: Compare screenshots
      const diffResult = await diffAlgorithm.compareScreenshots(baseline, comparison);
      
      expect(diffResult.success).toBe(true);
      expect(diffResult.diff).toBeDefined();
      expect(diffResult.diffImageUrl).toBeDefined();
      
      const diff = diffResult.diff!;
      expect(['passed', 'failed']).toContain(diff.status);
      expect(diff.metrics.totalPixels).toBeGreaterThan(0);
      expect(diff.differences).toBeDefined();
    });

    it('should handle responsive visual regression testing', async () => {
      const viewports = [
        { width: 375, height: 667, deviceScaleFactor: 2, isMobile: true },
        { width: 768, height: 1024, deviceScaleFactor: 1, isMobile: false },
        { width: 1920, height: 1080, deviceScaleFactor: 1, isMobile: false },
      ];

      // Capture baseline screenshots for all viewports
      const baselinePromises = viewports.map(async (viewport, index) => {
        mockMCPTools.browser_take_screenshot.mockResolvedValueOnce(
          createTestImageDataUrl(viewport.width, viewport.height, 'green')
        );

        const request: CaptureRequest = {
          url: 'https://example.com',
          viewport,
          name: `Baseline ${viewport.width}x${viewport.height}`,
          tags: ['responsive', 'baseline'],
        };

        return screenshotEngine.captureScreenshot(request);
      });

      const baselineResults = await Promise.all(baselinePromises);
      expect(baselineResults.every(r => r.success)).toBe(true);
      const baselines = baselineResults.map(r => r.screenshot!);

      // Capture comparison screenshots
      const comparisonPromises = viewports.map(async (viewport, index) => {
        mockMCPTools.browser_take_screenshot.mockResolvedValueOnce(
          createTestImageDataUrl(viewport.width, viewport.height, 'darkgreen')
        );

        const request: CaptureRequest = {
          url: 'https://example.com',
          viewport,
          name: `Current ${viewport.width}x${viewport.height}`,
          tags: ['responsive', 'current'],
        };

        return screenshotEngine.captureScreenshot(request);
      });

      const comparisonResults = await Promise.all(comparisonPromises);
      expect(comparisonResults.every(r => r.success)).toBe(true);
      const comparisons = comparisonResults.map(r => r.screenshot!);

      // Compare all viewport combinations
      const diffPromises = baselines.map(async (baseline, index) => {
        return diffAlgorithm.compareScreenshots(baseline, comparisons[index]);
      });

      const diffResults = await Promise.all(diffPromises);
      expect(diffResults.every(r => r.success)).toBe(true);

      // Verify each comparison has appropriate viewport info
      diffResults.forEach((diffResult, index) => {
        const diff = diffResult.diff!;
        expect(diff.baselineId).toBe(baselines[index].id);
        expect(diff.comparisonId).toBe(comparisons[index].id);
      });
    });

    it('should perform batch comparison testing', async () => {
      // Create one baseline
      mockMCPTools.browser_take_screenshot.mockResolvedValueOnce(
        createTestImageDataUrl(800, 600, 'red')
      );

      const baselineRequest: CaptureRequest = {
        url: 'https://example.com',
        name: 'Batch Test Baseline',
      };

      const baselineResult = await screenshotEngine.captureScreenshot(baselineRequest);
      const baseline = baselineResult.screenshot!;

      // Create multiple comparison screenshots
      const comparisonScreenshots: Screenshot[] = [];
      const colors = ['red', 'orange', 'yellow', 'green', 'blue'];

      for (let i = 0; i < colors.length; i++) {
        mockMCPTools.browser_take_screenshot.mockResolvedValueOnce(
          createTestImageDataUrl(800, 600, colors[i])
        );

        const request: CaptureRequest = {
          url: 'https://example.com',
          name: `Comparison ${i + 1}`,
          tags: [colors[i]],
        };

        const result = await screenshotEngine.captureScreenshot(request);
        comparisonScreenshots.push(result.screenshot!);
      }

      // Batch compare
      const batchResults = await diffAlgorithm.batchCompareScreenshots(
        baseline, 
        comparisonScreenshots
      );

      expect(batchResults).toHaveLength(colors.length);
      expect(batchResults.every(r => r.success)).toBe(true);

      // Check that identical comparison (red vs red) passes
      expect(batchResults[0].diff!.status).toBe('passed');

      // Check that different comparisons have different metrics
      const metrics = batchResults.map(r => r.diff!.metrics.percentageChanged);
      expect(metrics[0]).toBeLessThan(metrics[1]); // red vs red should have less change than red vs orange
    });
  });

  describe('Performance and Memory Integration', () => {
    it('should handle large image processing efficiently', async () => {
      // Create large screenshots
      mockMCPTools.browser_take_screenshot.mockResolvedValueOnce(
        createTestImageDataUrl(2560, 1440, 'purple')
      );
      mockMCPTools.browser_take_screenshot.mockResolvedValueOnce(
        createTestImageDataUrl(2560, 1440, 'darkpurple')
      );

      const request1: CaptureRequest = {
        url: 'https://example.com',
        name: 'Large Screenshot 1',
        viewport: { width: 2560, height: 1440, deviceScaleFactor: 1, isMobile: false },
      };

      const request2: CaptureRequest = {
        url: 'https://example.com',
        name: 'Large Screenshot 2', 
        viewport: { width: 2560, height: 1440, deviceScaleFactor: 1, isMobile: false },
      };

      const startTime = performance.now();

      const [baseline, comparison] = await Promise.all([
        screenshotEngine.captureScreenshot(request1),
        screenshotEngine.captureScreenshot(request2),
      ]);

      const captureTime = performance.now() - startTime;
      expect(captureTime).toBeLessThan(10000); // Should complete within 10 seconds

      expect(baseline.success && comparison.success).toBe(true);

      // Compare large images
      const diffStart = performance.now();
      const diffResult = await diffAlgorithm.compareScreenshots(
        baseline.screenshot!,
        comparison.screenshot!
      );
      const diffTime = performance.now() - diffStart;

      expect(diffResult.success).toBe(true);
      expect(diffTime).toBeLessThan(15000); // Should complete within 15 seconds

      // Check performance metrics
      const perfMetrics = diffAlgorithm.getPerformanceMetrics();
      expect(perfMetrics.totalComparisons).toBeGreaterThan(0);
      expect(perfMetrics.averageComparisonTime).toBeGreaterThan(0);
    });

    it('should optimize settings for different image characteristics', async () => {
      // Test with different image sizes and complexity
      const testCases = [
        { size: [400, 300], color: 'white', name: 'Small Simple' },
        { size: [1920, 1080], color: 'black', name: 'Large Simple' },
        { size: [800, 600], color: 'linear-gradient(45deg, red, blue)', name: 'Medium Complex' },
      ];

      for (const testCase of testCases) {
        const [width, height] = testCase.size;
        
        mockMCPTools.browser_take_screenshot.mockResolvedValueOnce(
          createTestImageDataUrl(width, height, testCase.color)
        );
        mockMCPTools.browser_take_screenshot.mockResolvedValueOnce(
          createTestImageDataUrl(width, height, testCase.color)
        );

        const request1: CaptureRequest = {
          url: 'https://example.com',
          name: `${testCase.name} Baseline`,
          viewport: { width, height, deviceScaleFactor: 1, isMobile: false },
        };

        const request2: CaptureRequest = {
          url: 'https://example.com', 
          name: `${testCase.name} Comparison`,
          viewport: { width, height, deviceScaleFactor: 1, isMobile: false },
        };

        const [baseline, comparison] = await Promise.all([
          screenshotEngine.captureScreenshot(request1),
          screenshotEngine.captureScreenshot(request2),
        ]);

        expect(baseline.success && comparison.success).toBe(true);

        const diffResult = await diffAlgorithm.compareScreenshots(
          baseline.screenshot!,
          comparison.screenshot!
        );

        expect(diffResult.success).toBe(true);
        expect(diffResult.diff!.status).toBe('passed'); // Identical images should pass
      }
    });
  });

  describe('Error Recovery and Resilience', () => {
    it('should handle mixed success/failure scenarios', async () => {
      // Disable retries to ensure predictable failure pattern
      screenshotEngine.configureRetry({ maxRetries: 0, retryDelay: 10 });
      
      // Mock alternating success/failure pattern
      let callCount = 0;
      mockMCPTools.browser_take_screenshot.mockImplementation(() => {
        callCount++;
        if (callCount % 2 === 0) {
          throw new Error('Intermittent failure');
        }
        return createTestImageDataUrl(800, 600, 'cyan');
      });

      const requests: CaptureRequest[] = [
        { url: 'https://example.com/page1', name: 'Page 1' },
        { url: 'https://example.com/page2', name: 'Page 2' },
        { url: 'https://example.com/page3', name: 'Page 3' },
        { url: 'https://example.com/page4', name: 'Page 4' },
      ];

      const results = await Promise.allSettled(
        requests.map(req => screenshotEngine.captureScreenshot(req))
      );

      // Should have alternating success/failure
      expect(results[0].status).toBe('fulfilled');
      expect((results[0] as any).value.success).toBe(true);
      expect(results[1].status).toBe('fulfilled');
      expect((results[1] as any).value.success).toBe(false);
      expect(results[2].status).toBe('fulfilled'); 
      expect((results[2] as any).value.success).toBe(true);
      expect(results[3].status).toBe('fulfilled');
      expect((results[3] as any).value.success).toBe(false);
      
      // Reset retry configuration
      screenshotEngine.configureRetry({ maxRetries: 3, retryDelay: 1000 });
    });

    it('should handle diff algorithm fallbacks', async () => {
      // Create screenshots
      mockMCPTools.browser_take_screenshot.mockResolvedValueOnce(
        createTestImageDataUrl(100, 100, 'magenta')
      );
      mockMCPTools.browser_take_screenshot.mockResolvedValueOnce(
        createTestImageDataUrl(100, 100, 'pink')
      );

      const baselineResult = await screenshotEngine.captureScreenshot({
        url: 'https://example.com',
        name: 'Fallback Test Baseline',
      });

      const comparisonResult = await screenshotEngine.captureScreenshot({
        url: 'https://example.com',
        name: 'Fallback Test Comparison',
      });

      // Force Web Worker failure by creating new instance without workers
      const originalWorker = global.Worker;
      // @ts-expect-error Mock Worker constructor
      global.Worker = undefined;

      const fallbackDiffAlgorithm = new DiffAlgorithm();
      
      const diffResult = await fallbackDiffAlgorithm.compareScreenshots(
        baselineResult.screenshot!,
        comparisonResult.screenshot!
      );
      
      // Restore original Worker constructor
      global.Worker = originalWorker;

      expect(diffResult.success).toBe(true);
      expect(diffResult.diff).toBeDefined();
      
      fallbackDiffAlgorithm.cleanup();
    });
  });

  describe('Cross-Platform Compatibility', () => {
    it('should work with different browser engines in integration', async () => {
      const engines = ['chromium', 'firefox', 'webkit'] as const;
      
      for (const engine of engines) {
        mockMCPTools.browser_take_screenshot.mockResolvedValueOnce(
          createTestImageDataUrl(1024, 768, 'teal')
        );
        mockMCPTools.browser_take_screenshot.mockResolvedValueOnce(
          createTestImageDataUrl(1024, 768, 'turquoise')
        );

        const baselineRequest: CaptureRequest = {
          url: 'https://example.com',
          browserEngine: engine,
          name: `${engine} Baseline`,
        };

        const comparisonRequest: CaptureRequest = {
          url: 'https://example.com',
          browserEngine: engine,
          name: `${engine} Comparison`,
        };

        const [baseline, comparison] = await Promise.all([
          screenshotEngine.captureScreenshot(baselineRequest),
          screenshotEngine.captureScreenshot(comparisonRequest),
        ]);

        expect(baseline.success && comparison.success).toBe(true);
        expect(baseline.screenshot!.browserEngine).toBe(engine);
        expect(comparison.screenshot!.browserEngine).toBe(engine);

        const diffResult = await diffAlgorithm.compareScreenshots(
          baseline.screenshot!,
          comparison.screenshot!
        );

        expect(diffResult.success).toBe(true);
      }
    });
  });

  describe('Resource Management Integration', () => {
    it('should properly cleanup all resources in integration scenario', async () => {
      // Perform several operations to use resources
      mockMCPTools.browser_take_screenshot.mockResolvedValue(
        createTestImageDataUrl(640, 480, 'coral')
      );

      const operations = [];
      for (let i = 0; i < 5; i++) {
        operations.push(screenshotEngine.captureScreenshot({
          url: `https://example.com/page${i}`,
          name: `Resource Test ${i}`,
        }));
      }

      const results = await Promise.all(operations);
      expect(results.every(r => r.success)).toBe(true);

      // Perform comparisons
      const diffPromises = [];
      for (let i = 1; i < results.length; i++) {
        diffPromises.push(diffAlgorithm.compareScreenshots(
          results[0].screenshot!,
          results[i].screenshot!
        ));
      }

      const diffResults = await Promise.all(diffPromises);
      expect(diffResults.every(r => r.success)).toBe(true);

      // Verify performance metrics are being tracked
      const perfMetrics = diffAlgorithm.getPerformanceMetrics();
      expect(perfMetrics.totalComparisons).toBe(4);

      // Cleanup should not throw
      expect(async () => {
        await screenshotEngine.cleanup();
        diffAlgorithm.cleanup();
      }).not.toThrow();
    });
  });
});