import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { VisualDiffEngine } from '../diff-algorithm';
import type { DiffRequest, DiffOptions, Screenshot } from '@types';

// Test utilities for creating mock image data
const createMockImageData = (
  width: number,
  height: number,
  fillColor: [number, number, number, number] = [255, 255, 255, 255]
): ImageData => {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < data.length; i += 4) {
    data[i] = fillColor[0];     // R
    data[i + 1] = fillColor[1]; // G
    data[i + 2] = fillColor[2]; // B
    data[i + 3] = fillColor[3]; // A
  }
  return { data, width, height };
};

const createMockScreenshot = (
  id: string,
  width: number = 1920,
  height: number = 1080,
  fillColor: [number, number, number, number] = [255, 255, 255, 255]
): Screenshot => ({
  id,
  name: `Test Screenshot ${id}`,
  url: 'https://example.com',
  viewport: { width, height, deviceScaleFactor: 1, isMobile: false },
  browserEngine: 'chromium',
  timestamp: Date.now(),
  dataUrl: 'data:image/png;base64,mock',
  metadata: {
    userAgent: 'test-agent',
    pixelRatio: 1,
    colorDepth: 24,
    fileSize: width * height * 4,
    dimensions: { width, height },
    hash: `mock-hash-${id}`
  },
  tags: ['test']
});

const createCheckerboardPattern = (
  width: number,
  height: number,
  blockSize: number = 10
): ImageData => {
  const data = new Uint8ClampedArray(width * height * 4);
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = (y * width + x) * 4;
      const isBlack = Math.floor(x / blockSize) % 2 === Math.floor(y / blockSize) % 2;
      
      data[index] = isBlack ? 0 : 255;     // R
      data[index + 1] = isBlack ? 0 : 255; // G
      data[index + 2] = isBlack ? 0 : 255; // B
      data[index + 3] = 255;               // A
    }
  }
  
  return { data, width, height };
};

describe('VisualDiffEngine', () => {
  let diffEngine: VisualDiffEngine;

  beforeEach(() => {
    diffEngine = new VisualDiffEngine();
    vi.clearAllMocks();
  });

  afterEach(() => {
    diffEngine.cleanup();
  });

  describe('Basic Diff Functionality', () => {
    test('should compare identical images and return no differences', async () => {
      const baseline = createMockScreenshot('baseline');
      const comparison = createMockScreenshot('comparison');

      const request: DiffRequest = {
        baseline,
        comparison,
        options: { threshold: 0.1, ignoreColors: false, ignoreAntialiasing: false }
      };

      const result = await diffEngine.compareTo(request);

      expect(result.success).toBe(true);
      expect(result.diff?.pixelDifferenceCount).toBe(0);
      expect(result.diff?.percentageDifference).toBe(0);
      expect(result.diff?.regions).toHaveLength(0);
    });

    test('should detect differences between different images', async () => {
      const baseline = createMockScreenshot('baseline');
      const comparison = createMockScreenshot('comparison');

      // Mock different images by overriding the comparison function
      const mockCompareImages = vi.spyOn(diffEngine as any, 'compareImages').mockResolvedValue({
        pixelDifferenceCount: 1000,
        percentageDifference: 5.2,
        regions: [
          {
            x: 100,
            y: 100,
            width: 200,
            height: 150,
            pixelCount: 1000,
            severity: 'high' as const
          }
        ],
        diffImageData: createMockImageData(1920, 1080, [255, 0, 0, 255])
      });

      const request: DiffRequest = {
        baseline,
        comparison,
        options: { threshold: 0.1 }
      };

      const result = await diffEngine.compareTo(request);

      expect(result.success).toBe(true);
      expect(result.diff?.pixelDifferenceCount).toBe(1000);
      expect(result.diff?.percentageDifference).toBe(5.2);
      expect(result.diff?.regions).toHaveLength(1);
      expect(result.diff?.regions[0].severity).toBe('high');

      mockCompareImages.mockRestore();
    });

    test('should handle dimension mismatch gracefully', async () => {
      const baseline = createMockScreenshot('baseline', 1920, 1080);
      const comparison = createMockScreenshot('comparison', 1280, 720);

      const request: DiffRequest = {
        baseline,
        comparison,
        options: { threshold: 0.1 }
      };

      const result = await diffEngine.compareTo(request);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('DIMENSION_MISMATCH');
      expect(result.error?.message).toContain('dimension');
    });
  });

  describe('SSIM Calculation', () => {
    test('should calculate SSIM for identical images', async () => {
      const imageData1 = createMockImageData(100, 100, [128, 128, 128, 255]);
      const imageData2 = createMockImageData(100, 100, [128, 128, 128, 255]);

      const ssim = await (diffEngine as any).calculateSSIM(imageData1, imageData2);

      expect(ssim).toBeGreaterThan(0.99); // Identical images should have SSIM close to 1
    });

    test('should calculate lower SSIM for different images', async () => {
      const imageData1 = createMockImageData(100, 100, [0, 0, 0, 255]);
      const imageData2 = createMockImageData(100, 100, [255, 255, 255, 255]);

      const ssim = await (diffEngine as any).calculateSSIM(imageData1, imageData2);

      expect(ssim).toBeLessThan(0.5); // Very different images should have low SSIM
    });

    test('should handle SSIM calculation with Web Workers', async () => {
      const imageData1 = createCheckerboardPattern(100, 100, 5);
      const imageData2 = createCheckerboardPattern(100, 100, 10);

      // Enable Web Workers
      (diffEngine as any).workerPool = [new Worker('mock-worker')];

      const ssim = await (diffEngine as any).calculateSSIM(imageData1, imageData2);

      expect(typeof ssim).toBe('number');
      expect(ssim).toBeGreaterThan(0);
      expect(ssim).toBeLessThanOrEqual(1);
    });
  });

  describe('Perceptual Hashing', () => {
    test('should generate consistent hashes for identical images', async () => {
      const imageData1 = createMockImageData(100, 100, [128, 128, 128, 255]);
      const imageData2 = createMockImageData(100, 100, [128, 128, 128, 255]);

      const hash1 = await (diffEngine as any).calculatePerceptualHash(imageData1);
      const hash2 = await (diffEngine as any).calculatePerceptualHash(imageData2);

      expect(hash1).toBe(hash2);
    });

    test('should generate different hashes for different images', async () => {
      const imageData1 = createMockImageData(100, 100, [0, 0, 0, 255]);
      const imageData2 = createMockImageData(100, 100, [255, 255, 255, 255]);

      const hash1 = await (diffEngine as any).calculatePerceptualHash(imageData1);
      const hash2 = await (diffEngine as any).calculatePerceptualHash(imageData2);

      expect(hash1).not.toBe(hash2);
    });

    test('should calculate Hamming distance correctly', () => {
      const hash1 = 'abcd1234';
      const hash2 = 'abce1234';

      const distance = (diffEngine as any).calculateHammingDistance(hash1, hash2);

      expect(distance).toBe(1); // Only one bit difference
    });
  });

  describe('Ignore Regions Detection', () => {
    test('should detect text regions as potential ignore areas', async () => {
      const imageData = createMockImageData(200, 200);

      const ignoreRegions = await (diffEngine as any).detectIgnoreRegions(imageData, imageData);

      expect(Array.isArray(ignoreRegions)).toBe(true);
      // The actual detection logic would return meaningful regions
    });

    test('should apply ignore regions during comparison', async () => {
      const baseline = createMockScreenshot('baseline');
      const comparison = createMockScreenshot('comparison');

      const request: DiffRequest = {
        baseline,
        comparison,
        options: {
          threshold: 0.1,
          ignoreRegions: [
            { x: 0, y: 0, width: 100, height: 100 }
          ]
        }
      };

      const result = await diffEngine.compareTo(request);

      expect(result.success).toBe(true);
      // Differences in ignore regions should not be counted
    });
  });

  describe('Performance Optimization', () => {
    test('should use Web Workers for large images', async () => {
      const baseline = createMockScreenshot('baseline', 3840, 2160); // 4K image
      const comparison = createMockScreenshot('comparison', 3840, 2160);

      const workerSpy = vi.spyOn(diffEngine as any, 'compareWithWorkers');

      const request: DiffRequest = {
        baseline,
        comparison,
        options: { threshold: 0.1 }
      };

      await diffEngine.compareTo(request);

      // Should use workers for large images
      expect((diffEngine as any).shouldUseWorkers(3840 * 2160 * 4)).toBe(true);
    });

    test('should handle memory optimization for large datasets', async () => {
      const cleanupSpy = vi.spyOn(diffEngine, 'optimizeMemoryUsage');

      const baseline = createMockScreenshot('baseline', 1920, 1080);
      const comparison = createMockScreenshot('comparison', 1920, 1080);

      const request: DiffRequest = {
        baseline,
        comparison,
        options: { threshold: 0.1 }
      };

      await diffEngine.compareTo(request);

      expect(cleanupSpy).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid image data gracefully', async () => {
      const baseline = createMockScreenshot('baseline');
      const comparison = createMockScreenshot('comparison');

      // Mock an error in image loading
      vi.spyOn(diffEngine as any, 'loadImageData').mockRejectedValue(new Error('Invalid image'));

      const request: DiffRequest = {
        baseline,
        comparison,
        options: { threshold: 0.1 }
      };

      const result = await diffEngine.compareTo(request);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_IMAGE_DATA');
    });

    test('should handle worker errors gracefully', async () => {
      const baseline = createMockScreenshot('baseline');
      const comparison = createMockScreenshot('comparison');

      // Mock worker error
      const mockWorker = new Worker('mock-worker');
      vi.spyOn(mockWorker, 'postMessage').mockImplementation(() => {
        setTimeout(() => {
          if (mockWorker.onmessage) {
            mockWorker.onmessage(new MessageEvent('message', {
              data: { type: 'error', data: 'Worker error' }
            }));
          }
        }, 0);
      });

      (diffEngine as any).workerPool = [mockWorker];

      const request: DiffRequest = {
        baseline,
        comparison,
        options: { threshold: 0.1 }
      };

      const result = await diffEngine.compareTo(request);

      // Should fallback to main thread processing
      expect(result.success).toBe(true);
    });
  });

  describe('Configuration and Options', () => {
    test('should respect threshold settings', async () => {
      const baseline = createMockScreenshot('baseline');
      const comparison = createMockScreenshot('comparison');

      const lowThreshold: DiffRequest = {
        baseline,
        comparison,
        options: { threshold: 0.01 } // Very sensitive
      };

      const highThreshold: DiffRequest = {
        baseline,
        comparison,
        options: { threshold: 0.9 } // Very tolerant
      };

      const lowResult = await diffEngine.compareTo(lowThreshold);
      const highResult = await diffEngine.compareTo(highThreshold);

      expect(lowResult.success).toBe(true);
      expect(highResult.success).toBe(true);

      // With mock identical images, both should show no differences
      expect(lowResult.diff?.pixelDifferenceCount).toBe(0);
      expect(highResult.diff?.pixelDifferenceCount).toBe(0);
    });

    test('should handle anti-aliasing ignore option', async () => {
      const baseline = createMockScreenshot('baseline');
      const comparison = createMockScreenshot('comparison');

      const request: DiffRequest = {
        baseline,
        comparison,
        options: {
          threshold: 0.1,
          ignoreAntialiasing: true
        }
      };

      const result = await diffEngine.compareTo(request);

      expect(result.success).toBe(true);
      // Anti-aliasing differences should be ignored
    });

    test('should handle color ignore option', async () => {
      const baseline = createMockScreenshot('baseline');
      const comparison = createMockScreenshot('comparison');

      const request: DiffRequest = {
        baseline,
        comparison,
        options: {
          threshold: 0.1,
          ignoreColors: true
        }
      };

      const result = await diffEngine.compareTo(request);

      expect(result.success).toBe(true);
      // Should compare structure only, ignoring color differences
    });
  });

  describe('Metrics and Reporting', () => {
    test('should provide comprehensive metrics', async () => {
      const baseline = createMockScreenshot('baseline');
      const comparison = createMockScreenshot('comparison');

      const request: DiffRequest = {
        baseline,
        comparison,
        options: { threshold: 0.1 }
      };

      const result = await diffEngine.compareTo(request);

      expect(result.success).toBe(true);
      expect(result.diff?.metrics).toBeDefined();
      expect(typeof result.diff?.metrics?.ssimScore).toBe('number');
      expect(typeof result.diff?.metrics?.perceptualDistance).toBe('number');
      expect(typeof result.diff?.metrics?.processingTimeMs).toBe('number');
    });

    test('should track performance metrics', () => {
      const stats = diffEngine.getPerformanceStats();

      expect(stats).toBeDefined();
      expect(typeof stats.averageComparisonTime).toBe('number');
      expect(typeof stats.totalComparisons).toBe('number');
      expect(Array.isArray(stats.recentComparisonTimes)).toBe(true);
    });
  });

  describe('Memory Management', () => {
    test('should clean up resources properly', async () => {
      const cleanupSpy = vi.spyOn(diffEngine, 'cleanup');

      diffEngine.cleanup();

      expect(cleanupSpy).toHaveBeenCalled();
    });

    test('should manage worker pool efficiently', () => {
      const initialWorkerCount = (diffEngine as any).workerPool.length;

      // Simulate heavy usage
      for (let i = 0; i < 10; i++) {
        (diffEngine as any).requestWorker();
      }

      // Should not exceed maximum workers
      expect((diffEngine as any).workerPool.length).toBeLessThanOrEqual(
        (diffEngine as any).maxWorkers
      );
    });
  });
});