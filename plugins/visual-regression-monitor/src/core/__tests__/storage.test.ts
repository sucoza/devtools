import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StorageEngine } from '../storage';
import type { Screenshot, VisualDiff } from '../../types';

// Mock the utils module
vi.mock('../../utils', () => ({
  compressString: vi.fn((s: string) => s),
  decompressString: vi.fn((s: string) => s),
}));

function createMockScreenshot(id: string, timestamp: number): Screenshot {
  return {
    id,
    name: `Screenshot ${id}`,
    url: 'https://example.com',
    viewport: { width: 1920, height: 1080, deviceScaleFactor: 1, isMobile: false },
    browserEngine: 'chromium',
    timestamp,
    dataUrl: 'data:image/png;base64,test',
    metadata: {
      userAgent: 'test',
      pixelRatio: 1,
      colorDepth: 24,
      fileSize: 100,
      dimensions: { width: 1920, height: 1080 },
      hash: 'hash',
    },
    tags: [],
  };
}

function createMockDiff(id: string, timestamp: number): VisualDiff {
  return {
    id,
    baselineId: 'baseline',
    comparisonId: 'comparison',
    timestamp,
    status: 'passed',
    differences: [],
    metrics: {
      totalPixels: 100,
      changedPixels: 0,
      percentageChanged: 0,
      similarity: 1,
      meanColorDelta: 0,
      maxColorDelta: 0,
      regions: 0,
    },
    threshold: 0.1,
  };
}

describe('StorageEngine', () => {
  let engine: StorageEngine;
  let mockStorage: Record<string, string>;

  beforeEach(() => {
    mockStorage = {};

    // Set up localStorage mock
    (global.localStorage.getItem as ReturnType<typeof vi.fn>).mockImplementation(
      (key: string) => mockStorage[key] ?? null
    );
    (global.localStorage.setItem as ReturnType<typeof vi.fn>).mockImplementation(
      (key: string, value: string) => { mockStorage[key] = value; }
    );
    (global.localStorage.removeItem as ReturnType<typeof vi.fn>).mockImplementation(
      (key: string) => { delete mockStorage[key]; }
    );
    (global.localStorage.clear as ReturnType<typeof vi.fn>).mockImplementation(
      () => { mockStorage = {}; }
    );

    Object.defineProperty(global.localStorage, 'length', {
      get: () => Object.keys(mockStorage).length,
      configurable: true,
    });

    (global.localStorage.key as ReturnType<typeof vi.fn>).mockImplementation(
      (index: number) => Object.keys(mockStorage)[index] ?? null
    );

    engine = new StorageEngine();
  });

  describe('cleanup', () => {
    it('keeps only the 100 newest screenshots when there are more than 100', () => {
      // Create 120 screenshots with sequential timestamps
      const screenshots: Record<string, Screenshot> = {};
      for (let i = 0; i < 120; i++) {
        const id = `screenshot-${i}`;
        screenshots[id] = createMockScreenshot(id, 1000 + i);
      }

      // Store the screenshots
      mockStorage['visual-regression:screenshots'] = JSON.stringify(screenshots);

      // Run cleanup
      engine.cleanup();

      // Read back saved screenshots
      const savedData = mockStorage['visual-regression:screenshots'];
      expect(savedData).toBeDefined();
      const saved = JSON.parse(savedData) as Record<string, Screenshot>;
      const savedEntries = Object.values(saved);

      expect(savedEntries).toHaveLength(100);

      // They should be the newest 100 (timestamps 1020-1119)
      const timestamps = savedEntries.map(s => s.timestamp).sort((a, b) => a - b);
      expect(timestamps[0]).toBe(1020);
      expect(timestamps[timestamps.length - 1]).toBe(1119);
    });

    it('preserves all screenshots when there are fewer than 100', () => {
      const screenshots: Record<string, Screenshot> = {};
      for (let i = 0; i < 50; i++) {
        const id = `screenshot-${i}`;
        screenshots[id] = createMockScreenshot(id, 1000 + i);
      }

      mockStorage['visual-regression:screenshots'] = JSON.stringify(screenshots);

      engine.cleanup();

      const savedData = mockStorage['visual-regression:screenshots'];
      expect(savedData).toBeDefined();
      const saved = JSON.parse(savedData) as Record<string, Screenshot>;

      expect(Object.keys(saved)).toHaveLength(50);
    });

    it('keeps only the 50 newest diffs when there are more than 50', () => {
      const diffs: Record<string, VisualDiff> = {};
      for (let i = 0; i < 70; i++) {
        const id = `diff-${i}`;
        diffs[id] = createMockDiff(id, 2000 + i);
      }

      mockStorage['visual-regression:diffs'] = JSON.stringify(diffs);

      engine.cleanup();

      const savedData = mockStorage['visual-regression:diffs'];
      expect(savedData).toBeDefined();
      const saved = JSON.parse(savedData) as Record<string, VisualDiff>;
      const savedEntries = Object.values(saved);

      expect(savedEntries).toHaveLength(50);

      // They should be the newest 50 (timestamps 2020-2069)
      const timestamps = savedEntries.map(d => d.timestamp).sort((a, b) => a - b);
      expect(timestamps[0]).toBe(2020);
      expect(timestamps[timestamps.length - 1]).toBe(2069);
    });

    it('preserves all diffs when there are fewer than 50', () => {
      const diffs: Record<string, VisualDiff> = {};
      for (let i = 0; i < 30; i++) {
        const id = `diff-${i}`;
        diffs[id] = createMockDiff(id, 2000 + i);
      }

      mockStorage['visual-regression:diffs'] = JSON.stringify(diffs);

      engine.cleanup();

      const savedData = mockStorage['visual-regression:diffs'];
      expect(savedData).toBeDefined();
      const saved = JSON.parse(savedData) as Record<string, VisualDiff>;

      expect(Object.keys(saved)).toHaveLength(30);
    });

    it('handles empty storage gracefully', () => {
      // No data in storage
      expect(() => engine.cleanup()).not.toThrow();
    });

    it('handles exactly 100 screenshots without removing any', () => {
      const screenshots: Record<string, Screenshot> = {};
      for (let i = 0; i < 100; i++) {
        const id = `screenshot-${i}`;
        screenshots[id] = createMockScreenshot(id, 1000 + i);
      }

      mockStorage['visual-regression:screenshots'] = JSON.stringify(screenshots);

      engine.cleanup();

      const savedData = mockStorage['visual-regression:screenshots'];
      expect(savedData).toBeDefined();
      const saved = JSON.parse(savedData) as Record<string, Screenshot>;

      expect(Object.keys(saved)).toHaveLength(100);
    });
  });
});
