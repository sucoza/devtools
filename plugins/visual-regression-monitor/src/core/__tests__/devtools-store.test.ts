import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { VisualRegressionStore, getVisualRegressionStore } from '../devtools-store';
import type { 
  Screenshot, 
  VisualDiff, 
  TestSuite, 
  AnimationSequence, 
  VisualRegressionSettings,
  DevToolsState,
  ActivityItem
} from '../../types';

// Mock the storage engine
const mockStorageEngine = {
  loadScreenshots: vi.fn().mockReturnValue({}),
  loadVisualDiffs: vi.fn().mockReturnValue({}),
  loadTestSuites: vi.fn().mockReturnValue({}),
  loadSettings: vi.fn().mockReturnValue({}),
  saveScreenshots: vi.fn(),
  saveVisualDiffs: vi.fn(),
  saveTestSuites: vi.fn(),
  saveSettings: vi.fn(),
};

// Mock storage module
vi.mock('../storage', () => ({
  getStorageEngine: () => mockStorageEngine,
}));

// Mock utils
vi.mock('../../utils', () => ({
  generateId: vi.fn(() => 'test-id-' + Math.random()),
  getTimestamp: vi.fn(() => Date.now()),
}));

// Helper functions to create test data
function createTestScreenshot(overrides: Partial<Screenshot> = {}): Screenshot {
  return {
    id: 'screenshot-1',
    name: 'Test Screenshot',
    url: 'https://example.com',
    viewport: {
      width: 1920,
      height: 1080,
      deviceScaleFactor: 1,
      isMobile: false,
    },
    browserEngine: 'chromium',
    timestamp: Date.now(),
    dataUrl: 'data:image/png;base64,test-data',
    metadata: {
      userAgent: 'Test Agent',
      pixelRatio: 1,
      colorDepth: 24,
      fileSize: 1024,
      dimensions: { width: 1920, height: 1080 },
      hash: 'test-hash',
    },
    tags: ['test'],
    ...overrides,
  };
}

function createTestVisualDiff(overrides: Partial<VisualDiff> = {}): VisualDiff {
  return {
    id: 'diff-1',
    baselineId: 'screenshot-1',
    comparisonId: 'screenshot-2',
    status: 'passed',
    threshold: 0.1,
    createdAt: Date.now(),
    metrics: {
      totalPixels: 2073600,
      changedPixels: 1000,
      percentageChanged: 0.05,
      similarity: 0.95,
    },
    differences: [],
    ...overrides,
  };
}

function createTestSuite(overrides: Partial<TestSuite> = {}): TestSuite {
  return {
    id: 'suite-1',
    name: 'Test Suite',
    description: 'A test suite',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    baselineScreenshotIds: [],
    comparisonScreenshotIds: [],
    tags: ['test'],
    settings: {
      threshold: 0.1,
      ignoreAntialiasing: true,
      ignoreColors: false,
      ignoreDifferences: false,
    },
    ...overrides,
  };
}

describe('VisualRegressionStore', () => {
  let store: VisualRegressionStore;
  let mockListener: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    store = new VisualRegressionStore();
    mockListener = vi.fn();
  });

  describe('Initialization', () => {
    it('should initialize with default state', () => {
      const state = store.getSnapshot();
      expect(state).toMatchObject({
        screenshots: {},
        visualDiffs: {},
        testSuites: {},
        animationSequences: {},
        isCapturing: false,
        isAnalyzing: false,
        isPlaywrightConnected: false,
      });
    });

    it('should load persisted state on initialization', () => {
      const mockScreenshots = { 'id1': createTestScreenshot({ id: 'id1' }) };
      const mockDiffs = { 'diff1': createTestVisualDiff({ id: 'diff1' }) };

      mockStorageEngine.loadScreenshots.mockReturnValue(mockScreenshots);
      mockStorageEngine.loadVisualDiffs.mockReturnValue(mockDiffs);

      const newStore = new VisualRegressionStore();
      const state = newStore.getSnapshot();

      expect(state.screenshots).toEqual(mockScreenshots);
      expect(state.visualDiffs).toEqual(mockDiffs);
    });
  });

  describe('Screenshot Management', () => {
    it('should add a screenshot', () => {
      const screenshot = createTestScreenshot();
      store.addScreenshot(screenshot);
      
      const state = store.getSnapshot();
      expect(state.screenshots[screenshot.id]).toEqual(screenshot);
      expect(state.stats.totalScreenshots).toBe(1);
    });

    it('should update a screenshot', () => {
      const screenshot = createTestScreenshot();
      store.addScreenshot(screenshot);
      
      const updates = { name: 'Updated Screenshot' };
      store.updateScreenshot(screenshot.id, updates);
      
      const state = store.getSnapshot();
      expect(state.screenshots[screenshot.id].name).toBe('Updated Screenshot');
    });

    it('should remove a screenshot', () => {
      const screenshot = createTestScreenshot();
      store.addScreenshot(screenshot);
      
      store.removeScreenshot(screenshot.id);
      
      const state = store.getSnapshot();
      expect(state.screenshots[screenshot.id]).toBeUndefined();
    });

    it('should clear all screenshots', () => {
      const screenshot1 = createTestScreenshot({ id: 'screenshot-1' });
      const screenshot2 = createTestScreenshot({ id: 'screenshot-2' });
      
      store.addScreenshot(screenshot1);
      store.addScreenshot(screenshot2);
      
      store.clearScreenshots();
      
      const state = store.getSnapshot();
      expect(Object.keys(state.screenshots)).toHaveLength(0);
    });
  });

  describe('Visual Diff Management', () => {
    it('should add a visual diff', () => {
      const diff = createTestVisualDiff();
      store.addVisualDiff(diff);
      
      const state = store.getSnapshot();
      expect(state.visualDiffs[diff.id]).toEqual(diff);
      expect(state.stats.totalDiffs).toBe(1);
    });

    it('should update stats correctly for passed diff', () => {
      const diff = createTestVisualDiff({ status: 'passed' });
      store.addVisualDiff(diff);
      
      const state = store.getSnapshot();
      expect(state.stats.passedTests).toBe(1);
      expect(state.stats.failedTests).toBe(0);
    });

    it('should update stats correctly for failed diff', () => {
      const diff = createTestVisualDiff({ status: 'failed' });
      store.addVisualDiff(diff);
      
      const state = store.getSnapshot();
      expect(state.stats.passedTests).toBe(0);
      expect(state.stats.failedTests).toBe(1);
    });
  });

  describe('Subscription System', () => {
    it('should allow subscribing to state changes', () => {
      const unsubscribe = store.subscribe(mockListener);
      expect(typeof unsubscribe).toBe('function');
    });

    it('should notify listeners on state changes', () => {
      store.subscribe(mockListener);
      
      const screenshot = createTestScreenshot();
      store.addScreenshot(screenshot);
      
      expect(mockListener).toHaveBeenCalled();
    });

    it('should allow unsubscribing from state changes', () => {
      const unsubscribe = store.subscribe(mockListener);
      unsubscribe();
      
      const screenshot = createTestScreenshot();
      store.addScreenshot(screenshot);
      
      expect(mockListener).not.toHaveBeenCalled();
    });
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance from getVisualRegressionStore', () => {
      const store1 = getVisualRegressionStore();
      const store2 = getVisualRegressionStore();
      
      expect(store1).toBe(store2);
    });
  });
});
