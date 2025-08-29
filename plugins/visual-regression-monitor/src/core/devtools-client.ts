import type { DevToolsState, DevToolsAction, VisualRegressionEvents } from '../types';
import { getVisualRegressionStore } from './devtools-store';

// Basic event client interface (simplified from @tanstack/devtools)
export interface DevToolsEventClient<TEvents extends Record<string, any>> {
  subscribe: (callback: (event: TEvents[keyof TEvents], type: keyof TEvents) => void) => () => void;
}

export class VisualRegressionDevToolsClient implements DevToolsEventClient<VisualRegressionEvents> {
  private unsubscribe?: () => void;
  private store = getVisualRegressionStore();

  constructor() {
    // Initialize any connections or setup here
  }

  subscribe = (callback: (events: VisualRegressionEvents[keyof VisualRegressionEvents], type: keyof VisualRegressionEvents) => void) => {
    // Subscribe to store changes and emit state updates
    this.unsubscribe = this.store.subscribe(() => {
      const state = this.store.getSnapshot();
      callback(state, 'visual-regression:state');
    });

    // Send initial state
    const initialState = this.store.getSnapshot();
    callback(initialState, 'visual-regression:state');

    return () => {
      this.unsubscribe?.();
    };
  };

  // Handle incoming actions from DevTools
  handleAction = (action: DevToolsAction) => {
    this.store.dispatch(action);
  };

  // Get current state
  getState = (): DevToolsState => {
    return this.store.getSnapshot();
  };

  // Screenshot management methods
  clearScreenshots = () => {
    this.store.clearScreenshots();
  };

  addScreenshot = (screenshot: import('../types').Screenshot) => {
    this.store.addScreenshot(screenshot);
  };

  updateScreenshot = (id: string, updates: Partial<import('../types').Screenshot>) => {
    this.store.updateScreenshot(id, updates);
  };

  removeScreenshot = (id: string) => {
    this.store.removeScreenshot(id);
  };

  setBaseline = (screenshotId: string, suiteId: string) => {
    this.store.setBaseline(screenshotId, suiteId);
  };

  // Visual diff management methods
  clearVisualDiffs = () => {
    this.store.clearVisualDiffs();
  };

  addVisualDiff = (diff: import('../types').VisualDiff) => {
    this.store.addVisualDiff(diff);
  };

  updateVisualDiff = (id: string, updates: Partial<import('../types').VisualDiff>) => {
    this.store.updateVisualDiff(id, updates);
  };

  removeVisualDiff = (id: string) => {
    this.store.removeVisualDiff(id);
  };

  // Test suite management methods
  addTestSuite = (suite: import('../types').TestSuite) => {
    this.store.addTestSuite(suite);
  };

  updateTestSuite = (id: string, updates: Partial<import('../types').TestSuite>) => {
    this.store.updateTestSuite(id, updates);
  };

  removeTestSuite = (id: string) => {
    this.store.removeTestSuite(id);
  };

  // Animation management methods
  addAnimationSequence = (animation: import('../types').AnimationSequence) => {
    this.store.addAnimationSequence(animation);
  };

  updateAnimationSequence = (id: string, updates: Partial<import('../types').AnimationSequence>) => {
    this.store.updateAnimationSequence(id, updates);
  };

  removeAnimationSequence = (id: string) => {
    this.store.removeAnimationSequence(id);
  };

  // Settings management methods
  updateSettings = (updates: Partial<import('../types').VisualRegressionSettings>) => {
    this.store.updateSettings(updates);
  };

  resetSettings = () => {
    this.store.resetSettings();
  };

  // Control methods
  startCapture = () => {
    this.store.startCapture();
  };

  stopCapture = () => {
    this.store.stopCapture();
  };

  startAnalysis = () => {
    this.store.startAnalysis();
  };

  stopAnalysis = () => {
    this.store.stopAnalysis();
  };

  connectPlaywright = () => {
    this.store.connectPlaywright();
  };

  disconnectPlaywright = () => {
    this.store.disconnectPlaywright();
  };

  // UI control methods
  selectTab = (tab: 'screenshots' | 'comparisons' | 'timeline' | 'animations' | 'settings') => {
    this.store.dispatch({ type: 'ui/tab/select', payload: tab });
  };

  selectScreenshot = (id: string | undefined) => {
    this.store.dispatch({ type: 'ui/screenshot/select', payload: id });
  };

  selectDiff = (id: string | undefined) => {
    this.store.dispatch({ type: 'ui/diff/select', payload: id });
  };

  selectSuite = (id: string | undefined) => {
    this.store.dispatch({ type: 'ui/suite/select', payload: id });
  };

  setViewMode = (mode: 'grid' | 'list' | 'timeline') => {
    this.store.dispatch({ type: 'ui/view_mode/set', payload: mode });
  };

  toggleDiffOverlay = () => {
    this.store.dispatch({ type: 'ui/diff_overlay/toggle' });
  };

  toggleMetadata = () => {
    this.store.dispatch({ type: 'ui/metadata/toggle' });
  };

  toggleSidebar = () => {
    this.store.dispatch({ type: 'ui/sidebar/toggle' });
  };

  setZoom = (level: number) => {
    this.store.dispatch({ type: 'ui/zoom/set', payload: level });
  };

  updateFilter = (filter: Partial<import('../types').FilterSettings>) => {
    this.store.dispatch({ type: 'ui/filter/update', payload: filter });
  };

  // Stats methods
  updateStats = (stats: Partial<import('../types').VisualRegressionStats>) => {
    this.store.dispatch({ type: 'stats/update', payload: stats });
  };

  resetStats = () => {
    this.store.dispatch({ type: 'stats/reset' });
  };

  // Export/Import methods
  exportConfiguration = (): import('../types').ExportData => {
    const storageEngine = this.store['storageEngine'];
    return storageEngine.exportData();
  };

  importConfiguration = (data: import('../types').ExportData): boolean => {
    const storageEngine = this.store['storageEngine'];
    return storageEngine.importData(data);
  };

  // Storage information
  getStorageInfo = () => {
    const storageEngine = this.store['storageEngine'];
    return storageEngine.getStorageInfo();
  };

  // Cleanup
  cleanupStorage = () => {
    const storageEngine = this.store['storageEngine'];
    storageEngine.cleanup();
  };

  // Clear all data
  clearAllData = () => {
    this.store.clearScreenshots();
    this.store.clearVisualDiffs();
    this.store.dispatch({ type: 'stats/reset' });
  };
}

let clientInstance: VisualRegressionDevToolsClient | null = null;

export function createVisualRegressionDevToolsClient(): VisualRegressionDevToolsClient {
  if (!clientInstance) {
    clientInstance = new VisualRegressionDevToolsClient();
  }
  return clientInstance;
}

export function getVisualRegressionDevToolsClient(): VisualRegressionDevToolsClient | null {
  return clientInstance;
}