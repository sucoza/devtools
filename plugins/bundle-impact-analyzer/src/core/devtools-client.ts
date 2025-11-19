import type {
  BundleAnalyzerState,
  BundleAnalyzerConfig,
  BundleModule,
} from '../types';
import { useBundleAnalyzerStore } from './devtools-store';

// Type alias for visualization settings
type VisualizationSettings = BundleAnalyzerState['visualization'];

/**
 * DevTools event client interface following TanStack patterns
 */
export interface DevToolsEventClient<TEvents extends Record<string, any>> {
  subscribe: (callback: (event: TEvents[keyof TEvents], type: keyof TEvents) => void) => () => void;
  getState: () => BundleAnalyzerState;
}

export interface BundleAnalyzerEvents {
  'bundle:state': BundleAnalyzerState;
  'bundle:error': { message: string; stack?: string };
}

/**
 * Bundle Analyzer DevTools event client
 * Follows the simplified TanStack DevTools pattern
 */
export class BundleAnalyzerDevToolsClient implements DevToolsEventClient<BundleAnalyzerEvents> {
  private unsubscribeStore?: () => void;

  /**
   * Subscribe to store changes
   */
  subscribe = (
    callback: (
      event: BundleAnalyzerEvents[keyof BundleAnalyzerEvents],
      type: keyof BundleAnalyzerEvents
    ) => void
  ) => {
    // Subscribe to Zustand store changes
    this.unsubscribeStore = useBundleAnalyzerStore.subscribe((state) => {
      callback(state, 'bundle:state');
    });

    // Send initial state
    const initialState = useBundleAnalyzerStore.getState();
    callback(initialState, 'bundle:state');

    return () => {
      this.unsubscribeStore?.();
    };
  };

  /**
   * Get current state
   */
  getState = (): BundleAnalyzerState => {
    return useBundleAnalyzerStore.getState();
  };

  // Analysis control methods
  startAnalysis = (): void => {
    useBundleAnalyzerStore.getState().startAnalysis();
  };

  stopAnalysis = (): void => {
    useBundleAnalyzerStore.getState().stopAnalysis();
  };

  startCDNAnalysis = (): void => {
    useBundleAnalyzerStore.getState().startCDNAnalysis();
  };

  // Module methods
  getFilteredModules = (): BundleModule[] => {
    return useBundleAnalyzerStore.getState().getFilteredModules();
  };

  selectModule = (moduleId: string | null): void => {
    useBundleAnalyzerStore.getState().selectModule(moduleId);
  };

  analyzeImport = (modulePath: string): void => {
    useBundleAnalyzerStore.getState().analyzeImport(modulePath);
  };

  // UI methods
  selectTab = (tabId: string): void => {
    useBundleAnalyzerStore.getState().selectTab(tabId);
  };

  // Recommendations methods
  generateRecommendations = (): void => {
    useBundleAnalyzerStore.getState().generateRecommendations();
  };

  // Configuration methods
  updateConfig = (config: Partial<BundleAnalyzerConfig>): void => {
    useBundleAnalyzerStore.getState().updateConfig(config);
  };

  // Data generation methods
  generateSampleData = (): void => {
    useBundleAnalyzerStore.getState().generateSampleData();
  };

  // Visualization methods
  updateVisualization = (settings: Partial<VisualizationSettings>): void => {
    useBundleAnalyzerStore.getState().updateVisualization(settings);
  };
}

// Singleton instance
let clientInstance: BundleAnalyzerDevToolsClient | null = null;

/**
 * Create or get bundle analyzer DevTools event client
 */
export function createBundleAnalyzerEventClient(): BundleAnalyzerDevToolsClient {
  if (!clientInstance) {
    clientInstance = new BundleAnalyzerDevToolsClient();
  }
  return clientInstance;
}

/**
 * Get existing bundle analyzer DevTools event client
 */
export function getBundleAnalyzerEventClient(): BundleAnalyzerDevToolsClient | null {
  return clientInstance;
}

/**
 * Reset event client instance (useful for testing)
 */
export function resetBundleAnalyzerEventClient(): void {
  clientInstance = null;
}
