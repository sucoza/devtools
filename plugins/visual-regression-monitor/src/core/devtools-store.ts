import type { 
  DevToolsState, 
  DevToolsAction, 
  Screenshot, 
  VisualDiff, 
  TestSuite, 
  AnimationSequence,
  VisualRegressionStats,
  ActivityItem,
  VisualRegressionSettings
} from '../types';
import { initialDevToolsState } from '../types';
import { getStorageEngine } from './storage';
import { generateId, getTimestamp } from '../utils';

/**
 * DevTools store for managing visual regression state
 */
class VisualRegressionStore {
  private state: DevToolsState = { ...initialDevToolsState };
  private listeners: Set<() => void> = new Set();
  private storageEngine = getStorageEngine();

  constructor() {
    this.loadPersistedState();
  }

  /**
   * Get current state snapshot
   */
  getSnapshot(): DevToolsState {
    return this.state;
  }

  /**
   * Subscribe to state changes
   */
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Dispatch action to update state
   */
  dispatch(action: DevToolsAction): void {
    this.state = this.reduce(this.state, action);
    this.notifyListeners();
    this.persistState();
  }

  /**
   * Add a new screenshot
   */
  addScreenshot(screenshot: Screenshot): void {
    this.dispatch({ type: 'screenshot/add', payload: screenshot });
    // Add activity without triggering another stats update
    this.addActivityWithoutDispatch({
      id: generateId(),
      type: 'screenshot',
      title: `Screenshot captured: ${screenshot.name}`,
      description: `${screenshot.viewport.width}x${screenshot.viewport.height} • ${screenshot.browserEngine}`,
      timestamp: getTimestamp(),
      metadata: { screenshotId: screenshot.id, url: screenshot.url },
    });
  }

  /**
   * Update an existing screenshot
   */
  updateScreenshot(id: string, updates: Partial<Screenshot>): void {
    this.dispatch({ type: 'screenshot/update', payload: { id, updates } });
  }

  /**
   * Remove a screenshot
   */
  removeScreenshot(id: string): void {
    this.dispatch({ type: 'screenshot/remove', payload: id });
  }

  /**
   * Clear all screenshots
   */
  clearScreenshots(): void {
    this.dispatch({ type: 'screenshot/clear' });
  }

  /**
   * Set a screenshot as baseline for a test suite
   */
  setBaseline(screenshotId: string, suiteId: string): void {
    this.dispatch({ type: 'screenshot/set_baseline', payload: { screenshotId, suiteId } });
    this.addActivityWithoutDispatch({
      id: generateId(),
      type: 'baseline_updated',
      title: 'Baseline updated',
      description: `Screenshot set as baseline for test suite`,
      timestamp: getTimestamp(),
      metadata: { screenshotId, suiteId },
    });
  }

  /**
   * Add a new visual diff
   */
  addVisualDiff(diff: VisualDiff): void {
    this.dispatch({ type: 'diff/add', payload: diff });
    this.addActivityWithoutDispatch({
      id: generateId(),
      type: 'diff',
      title: `Visual comparison ${diff.status}`,
      description: `${diff.metrics.percentageChanged.toFixed(2)}% pixels changed`,
      timestamp: getTimestamp(),
      metadata: { diffId: diff.id, status: diff.status },
    });
  }

  /**
   * Update an existing visual diff
   */
  updateVisualDiff(id: string, updates: Partial<VisualDiff>): void {
    this.dispatch({ type: 'diff/update', payload: { id, updates } });
  }

  /**
   * Remove a visual diff
   */
  removeVisualDiff(id: string): void {
    this.dispatch({ type: 'diff/remove', payload: id });
  }

  /**
   * Clear all visual diffs
   */
  clearVisualDiffs(): void {
    this.dispatch({ type: 'diff/clear' });
  }

  /**
   * Add a new test suite
   */
  addTestSuite(suite: TestSuite): void {
    this.dispatch({ type: 'suite/add', payload: suite });
    this.addActivityWithoutDispatch({
      id: generateId(),
      type: 'suite_created',
      title: `Test suite created: ${suite.name}`,
      description: suite.description || 'New test suite',
      timestamp: getTimestamp(),
      metadata: { suiteId: suite.id },
    });
  }

  /**
   * Update an existing test suite
   */
  updateTestSuite(id: string, updates: Partial<TestSuite>): void {
    this.dispatch({ type: 'suite/update', payload: { id, updates } });
  }

  /**
   * Remove a test suite
   */
  removeTestSuite(id: string): void {
    this.dispatch({ type: 'suite/remove', payload: id });
  }

  /**
   * Add an animation sequence
   */
  addAnimationSequence(animation: AnimationSequence): void {
    this.dispatch({ type: 'animation/add', payload: animation });
  }

  /**
   * Update an animation sequence
   */
  updateAnimationSequence(id: string, updates: Partial<AnimationSequence>): void {
    this.dispatch({ type: 'animation/update', payload: { id, updates } });
  }

  /**
   * Remove an animation sequence
   */
  removeAnimationSequence(id: string): void {
    this.dispatch({ type: 'animation/remove', payload: id });
  }

  /**
   * Update settings
   */
  updateSettings(updates: Partial<VisualRegressionSettings>): void {
    this.dispatch({ type: 'settings/update', payload: updates });
  }

  /**
   * Reset settings to defaults
   */
  resetSettings(): void {
    this.dispatch({ type: 'settings/reset' });
  }

  /**
   * Start capture mode
   */
  startCapture(): void {
    this.dispatch({ type: 'capture/start' });
  }

  /**
   * Stop capture mode
   */
  stopCapture(): void {
    this.dispatch({ type: 'capture/stop' });
  }

  /**
   * Start analysis mode
   */
  startAnalysis(): void {
    this.dispatch({ type: 'analysis/start' });
  }

  /**
   * Stop analysis mode
   */
  stopAnalysis(): void {
    this.dispatch({ type: 'analysis/stop' });
  }

  /**
   * Connect to Playwright
   */
  connectPlaywright(): void {
    this.dispatch({ type: 'playwright/connect' });
  }

  /**
   * Disconnect from Playwright
   */
  disconnectPlaywright(): void {
    this.dispatch({ type: 'playwright/disconnect' });
  }

  /**
   * State reducer
   */
  private reduce(state: DevToolsState, action: DevToolsAction): DevToolsState {
    switch (action.type) {
      // Screenshot actions
      case 'screenshot/add':
        return {
          ...state,
          screenshots: {
            ...state.screenshots,
            [action.payload.id]: action.payload,
          },
          stats: this.updateStatsWithScreenshot(state.stats, action.payload),
        };

      case 'screenshot/update': {
        const existingScreenshot = state.screenshots[action.payload.id];
        if (!existingScreenshot) return state;
        
        const updatedScreenshot = { ...existingScreenshot, ...action.payload.updates };
        return {
          ...state,
          screenshots: {
            ...state.screenshots,
            [action.payload.id]: updatedScreenshot,
          },
        };
      }

      case 'screenshot/remove': {
        const { [action.payload]: _removed, ...remainingScreenshots } = state.screenshots;
        return {
          ...state,
          screenshots: remainingScreenshots,
          stats: this.recalculateStats(Object.values(remainingScreenshots), Object.values(state.visualDiffs)),
          ui: {
            ...state.ui,
            selectedScreenshotId: state.ui.selectedScreenshotId === action.payload ? undefined : state.ui.selectedScreenshotId,
          },
        };
      }

      case 'screenshot/clear':
        return {
          ...state,
          screenshots: {},
          ui: {
            ...state.ui,
            selectedScreenshotId: undefined,
          },
          stats: {
            ...state.stats,
            totalScreenshots: 0,
          },
        };

      case 'screenshot/set_baseline': {
        const suite = state.testSuites[action.payload.suiteId];
        if (!suite) return state;
        
        return {
          ...state,
          testSuites: {
            ...state.testSuites,
            [action.payload.suiteId]: {
              ...suite,
              baselineScreenshotIds: [...suite.baselineScreenshotIds, action.payload.screenshotId],
              updatedAt: getTimestamp(),
            },
          },
        };
      }

      // Visual diff actions
      case 'diff/add':
        return {
          ...state,
          visualDiffs: {
            ...state.visualDiffs,
            [action.payload.id]: action.payload,
          },
          stats: this.updateStatsWithDiff(state.stats, action.payload),
        };

      case 'diff/update': {
        const existingDiff = state.visualDiffs[action.payload.id];
        if (!existingDiff) return state;
        
        const updatedDiff = { ...existingDiff, ...action.payload.updates };
        return {
          ...state,
          visualDiffs: {
            ...state.visualDiffs,
            [action.payload.id]: updatedDiff,
          },
          stats: this.recalculateStats(Object.values(state.screenshots), Object.values({ ...state.visualDiffs, [action.payload.id]: updatedDiff })),
        };
      }

      case 'diff/remove': {
        const { [action.payload]: _removedDiff, ...remainingDiffs } = state.visualDiffs;
        return {
          ...state,
          visualDiffs: remainingDiffs,
          stats: this.recalculateStats(Object.values(state.screenshots), Object.values(remainingDiffs)),
          ui: {
            ...state.ui,
            selectedDiffId: state.ui.selectedDiffId === action.payload ? undefined : state.ui.selectedDiffId,
          },
        };
      }

      case 'diff/clear':
        return {
          ...state,
          visualDiffs: {},
          ui: {
            ...state.ui,
            selectedDiffId: undefined,
          },
          stats: {
            ...state.stats,
            totalDiffs: 0,
            passedTests: 0,
            failedTests: 0,
          },
        };

      // Test suite actions
      case 'suite/add':
        return {
          ...state,
          testSuites: {
            ...state.testSuites,
            [action.payload.id]: action.payload,
          },
        };

      case 'suite/update': {
        const existingSuite = state.testSuites[action.payload.id];
        if (!existingSuite) return state;
        
        return {
          ...state,
          testSuites: {
            ...state.testSuites,
            [action.payload.id]: {
              ...existingSuite,
              ...action.payload.updates,
              updatedAt: getTimestamp(),
            },
          },
        };
      }

      case 'suite/remove': {
        const { [action.payload]: _removedSuite, ...remainingSuites } = state.testSuites;
        return {
          ...state,
          testSuites: remainingSuites,
          ui: {
            ...state.ui,
            selectedSuiteId: state.ui.selectedSuiteId === action.payload ? undefined : state.ui.selectedSuiteId,
          },
        };
      }

      // Animation actions
      case 'animation/add':
        return {
          ...state,
          animationSequences: {
            ...state.animationSequences,
            [action.payload.id]: action.payload,
          },
        };

      case 'animation/update': {
        const existingAnimation = state.animationSequences[action.payload.id];
        if (!existingAnimation) return state;
        
        return {
          ...state,
          animationSequences: {
            ...state.animationSequences,
            [action.payload.id]: {
              ...existingAnimation,
              ...action.payload.updates,
            },
          },
        };
      }

      case 'animation/remove': {
        const { [action.payload]: _removedAnimation, ...remainingAnimations } = state.animationSequences;
        return {
          ...state,
          animationSequences: remainingAnimations,
        };
      }

      // Settings actions
      case 'settings/update':
        return {
          ...state,
          settings: {
            ...state.settings,
            ...action.payload,
          },
        };

      case 'settings/reset':
        return {
          ...state,
          settings: { ...initialDevToolsState.settings },
        };

      // Control actions
      case 'capture/start':
        return {
          ...state,
          isCapturing: true,
        };

      case 'capture/stop':
        return {
          ...state,
          isCapturing: false,
        };

      case 'analysis/start':
        return {
          ...state,
          isAnalyzing: true,
        };

      case 'analysis/stop':
        return {
          ...state,
          isAnalyzing: false,
        };

      case 'playwright/connect':
        return {
          ...state,
          isPlaywrightConnected: true,
        };

      case 'playwright/disconnect':
        return {
          ...state,
          isPlaywrightConnected: false,
        };

      // UI actions
      case 'ui/tab/select':
        return {
          ...state,
          ui: {
            ...state.ui,
            activeTab: action.payload,
          },
        };

      case 'ui/screenshot/select':
        return {
          ...state,
          ui: {
            ...state.ui,
            selectedScreenshotId: action.payload,
          },
        };

      case 'ui/diff/select':
        return {
          ...state,
          ui: {
            ...state.ui,
            selectedDiffId: action.payload,
          },
        };

      case 'ui/suite/select':
        return {
          ...state,
          ui: {
            ...state.ui,
            selectedSuiteId: action.payload,
          },
        };

      case 'ui/view_mode/set':
        return {
          ...state,
          ui: {
            ...state.ui,
            viewMode: action.payload,
          },
        };

      case 'ui/diff_overlay/toggle':
        return {
          ...state,
          ui: {
            ...state.ui,
            showDiffOverlay: !state.ui.showDiffOverlay,
          },
        };

      case 'ui/metadata/toggle':
        return {
          ...state,
          ui: {
            ...state.ui,
            showMetadata: !state.ui.showMetadata,
          },
        };

      case 'ui/sidebar/toggle':
        return {
          ...state,
          ui: {
            ...state.ui,
            sidebarOpen: !state.ui.sidebarOpen,
          },
        };

      case 'ui/zoom/set':
        return {
          ...state,
          ui: {
            ...state.ui,
            zoomLevel: action.payload,
          },
        };

      case 'ui/filter/update':
        return {
          ...state,
          ui: {
            ...state.ui,
            filterSettings: {
              ...state.ui.filterSettings,
              ...action.payload,
            },
          },
        };

      // Stats actions
      case 'stats/update':
        return {
          ...state,
          stats: {
            ...state.stats,
            ...action.payload,
          },
        };

      case 'stats/reset':
        return {
          ...state,
          stats: {
            ...initialDevToolsState.stats,
          },
        };

      case 'activity/add': {
        const newActivity = [action.payload, ...state.stats.recentActivity].slice(0, 50); // Keep last 50 activities
        return {
          ...state,
          stats: {
            ...state.stats,
            recentActivity: newActivity,
          },
        };
      }

      default:
        return state;
    }
  }

  /**
   * Add activity item
   */
  private addActivity(activity: ActivityItem): void {
    this.dispatch({ type: 'activity/add', payload: activity });
  }

  /**
   * Add activity item without triggering dispatch (to avoid double state updates)
   */
  private addActivityWithoutDispatch(activity: ActivityItem): void {
    const newActivity = [activity, ...this.state.stats.recentActivity].slice(0, 50);
    this.state = {
      ...this.state,
      stats: {
        ...this.state.stats,
        recentActivity: newActivity,
      },
    };
    this.notifyListeners();
    this.persistState();
  }

  /**
   * Load persisted state from storage
   */
  private loadPersistedState(): void {
    try {
      const screenshots = this.storageEngine.loadScreenshots();
      const diffs = this.storageEngine.loadVisualDiffs();
      const suites = this.storageEngine.loadTestSuites();
      const settings = this.storageEngine.loadSettings();

      this.state = {
        ...this.state,
        screenshots,
        visualDiffs: diffs,
        testSuites: suites,
        settings: { ...this.state.settings, ...settings },
        stats: this.recalculateStats(Object.values(screenshots), Object.values(diffs)),
      };
    } catch (error) {
      console.error('Failed to load persisted state:', error);
    }
  }

  /**
   * Persist state to storage
   */
  private persistState(): void {
    try {
      this.storageEngine.saveScreenshots(this.state.screenshots);
      this.storageEngine.saveVisualDiffs(this.state.visualDiffs);
      this.storageEngine.saveTestSuites(this.state.testSuites);
      this.storageEngine.saveSettings(this.state.settings);
    } catch (error) {
      console.error('Failed to persist state:', error);
    }
  }

  /**
   * Notify all listeners of state changes
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener();
      } catch (error) {
        console.error('Error in Visual Regression store listener:', error);
      }
    });
  }

  /**
   * Update stats with new screenshot
   */
  private updateStatsWithScreenshot(currentStats: VisualRegressionStats, screenshot: Screenshot): VisualRegressionStats {
    return {
      ...currentStats,
      totalScreenshots: currentStats.totalScreenshots + 1,
      lastCaptureTime: screenshot.timestamp,
      storageUsed: currentStats.storageUsed + screenshot.metadata.fileSize,
    };
  }

  /**
   * Update stats with new diff
   */
  private updateStatsWithDiff(currentStats: VisualRegressionStats, diff: VisualDiff): VisualRegressionStats {
    const newStats = {
      ...currentStats,
      totalDiffs: currentStats.totalDiffs + 1,
    };

    if (diff.status === 'passed') {
      newStats.passedTests = currentStats.passedTests + 1;
    } else if (diff.status === 'failed') {
      newStats.failedTests = currentStats.failedTests + 1;
    }

    // Update average diff time (assuming diff has a processingTime property we could add)
    // For now, we'll use a placeholder calculation
    const totalTime = currentStats.averageDiffTime * (currentStats.totalDiffs - 1);
    newStats.averageDiffTime = Math.round((totalTime + 100) / currentStats.totalDiffs); // 100ms placeholder

    return newStats;
  }

  /**
   * Recalculate stats from all screenshots and diffs
   */
  private recalculateStats(screenshots: Screenshot[], diffs: VisualDiff[]): VisualRegressionStats {
    const stats: VisualRegressionStats = {
      totalScreenshots: screenshots.length,
      totalDiffs: diffs.length,
      passedTests: 0,
      failedTests: 0,
      averageDiffTime: 0,
      storageUsed: 0,
      recentActivity: this.state?.stats?.recentActivity || [],
    };

    // Calculate storage usage
    stats.storageUsed = screenshots.reduce((total, screenshot) => 
      total + screenshot.metadata.fileSize, 0);

    // Calculate test results
    diffs.forEach(diff => {
      if (diff.status === 'passed') {
        stats.passedTests++;
      } else if (diff.status === 'failed') {
        stats.failedTests++;
      }
    });

    // Find last capture time
    if (screenshots.length > 0) {
      stats.lastCaptureTime = Math.max(...screenshots.map(s => s.timestamp));
    }

    return stats;
  }
}

// Singleton instance
let storeInstance: VisualRegressionStore | null = null;

export function getVisualRegressionStore(): VisualRegressionStore {
  if (!storeInstance) {
    storeInstance = new VisualRegressionStore();
  }
  return storeInstance;
}

export { VisualRegressionStore };