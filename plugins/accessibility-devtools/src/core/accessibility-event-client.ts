import type {
  AccessibilityDevToolsState,
  AccessibilityDevToolsAction,
  AccessibilityDevToolsEvents,
} from '../types';
import { getAccessibilityDevToolsStore } from './devtools-store';

/**
 * Event client interface following TanStack DevTools patterns
 */
export interface AccessibilityEventClient {
  subscribe: (
    callback: (
      event: AccessibilityDevToolsEvents[keyof AccessibilityDevToolsEvents],
      type: keyof AccessibilityDevToolsEvents
    ) => void
  ) => () => void;
  emit: <TEventType extends keyof AccessibilityDevToolsEvents>(
    type: TEventType,
    event: AccessibilityDevToolsEvents[TEventType]
  ) => void;
  getState: () => AccessibilityDevToolsState;
  dispatch: (action: AccessibilityDevToolsAction) => void;
}

/**
 * Accessibility DevTools event client implementation
 */
export class AccessibilityDevToolsEventClient implements AccessibilityEventClient {
  private unsubscribe?: () => void;
  private store = getAccessibilityDevToolsStore();
  private subscribers = new Set<(
    event: AccessibilityDevToolsEvents[keyof AccessibilityDevToolsEvents],
    type: keyof AccessibilityDevToolsEvents
  ) => void>();
  
  constructor() {
    // Auto-start scanning if configured
    const state = this.store.getState();
    if (state.settings.autoScan) {
      this.store.startScanning();
    }
  }
  
  /**
   * Subscribe to store changes and emit events
   */
  subscribe = (
    callback: (
      event: AccessibilityDevToolsEvents[keyof AccessibilityDevToolsEvents],
      type: keyof AccessibilityDevToolsEvents
    ) => void
  ) => {
    this.subscribers.add(callback);
    
    // Subscribe to store changes
    this.unsubscribe = this.store.subscribe(() => {
      const state = this.store.getState();
      callback(state, 'accessibility:state');
    });
    
    // Send initial state
    const initialState = this.store.getState();
    callback(initialState, 'accessibility:state');
    
    return () => {
      this.subscribers.delete(callback);
      if (this.subscribers.size === 0) {
        this.unsubscribe?.();
        this.store.stopScanning();
      }
    };
  };
  
  /**
   * Emit event to all subscribers
   */
  emit = <TEventType extends keyof AccessibilityDevToolsEvents>(
    type: TEventType,
    event: AccessibilityDevToolsEvents[TEventType]
  ): void => {
    this.subscribers.forEach(callback => {
      callback(event, type);
    });
  };
  
  /**
   * Get current state from store
   */
  getState = (): AccessibilityDevToolsState => {
    return this.store.getState();
  };
  
  /**
   * Dispatch action to store
   */
  dispatch = (action: AccessibilityDevToolsAction): void => {
    this.store.dispatch(action);
    
    // Emit action event
    this.emit('accessibility:action', action);
  };
  
  // Convenience methods for common actions
  
  /**
   * Start accessibility scan
   */
  startScan = (elementSelector?: string): void => {
    this.dispatch({ type: 'scan/start', payload: { elementSelector } });
  };
  
  /**
   * Pause scanning
   */
  pauseScan = (): void => {
    this.dispatch({ type: 'scan/pause' });
  };
  
  /**
   * Resume scanning
   */
  resumeScan = (): void => {
    this.dispatch({ type: 'scan/resume' });
  };
  
  /**
   * Stop scanning
   */
  stopScan = (): void => {
    this.dispatch({ type: 'scan/stop' });
  };
  
  /**
   * Update scan options
   */
  updateScanOptions = (options: Parameters<AccessibilityDevToolsAction>['payload']): void => {
    this.dispatch({ type: 'options/update', payload: options });
  };
  
  /**
   * Select tab in DevTools panel
   */
  selectTab = (tab: AccessibilityDevToolsState['ui']['activeTab']): void => {
    this.dispatch({ type: 'ui/tab/select', payload: tab });
  };
  
  /**
   * Select accessibility issue for inspection
   */
  selectIssue = (issue: AccessibilityDevToolsState['ui']['selectedIssue']): void => {
    this.dispatch({ type: 'ui/issue/select', payload: issue });
  };
  
  /**
   * Highlight element on page
   */
  highlightElement = (selector: string | null): void => {
    this.dispatch({ type: 'ui/element/highlight', payload: selector });
    this.emit('accessibility:element-highlight', { selector });
  };
  
  /**
   * Toggle overlay visibility
   */
  toggleOverlay = (): void => {
    this.dispatch({ type: 'ui/overlay/toggle' });
    const state = this.store.getState();
    this.emit('accessibility:overlay-toggle', {
      enabled: state.overlayState.enabled,
      state: state.overlayState,
    });
  };
  
  /**
   * Update accessibility settings
   */
  updateSettings = (settings: Partial<AccessibilityDevToolsState['settings']>): void => {
    this.dispatch({ type: 'settings/update', payload: settings });
  };
  
  /**
   * Clear audit history
   */
  clearHistory = (): void => {
    this.dispatch({ type: 'history/clear' });
  };
  
  /**
   * Export audit data
   */
  exportData = (): void => {
    this.dispatch({ type: 'history/export' });
  };
  
  /**
   * Import audit data
   */
  importData = (data: Parameters<AccessibilityDevToolsAction>['payload']): void => {
    this.dispatch({ type: 'history/import', payload: data });
  };
  
  /**
   * Toggle severity filter
   */
  toggleSeverityFilter = (severity: 'critical' | 'serious' | 'moderate' | 'minor'): void => {
    this.dispatch({ type: 'filters/severity/toggle', payload: severity });
  };
  
  /**
   * Toggle rule filter
   */
  toggleRuleFilter = (ruleId: string): void => {
    this.dispatch({ type: 'filters/rule/toggle', payload: ruleId });
  };
  
  /**
   * Update search filter
   */
  updateSearch = (query: string): void => {
    this.dispatch({ type: 'filters/search/update', payload: query });
  };
  
  /**
   * Reset all filters
   */
  resetFilters = (): void => {
    this.dispatch({ type: 'filters/reset' });
  };
  
  /**
   * Set theme
   */
  setTheme = (theme: 'light' | 'dark' | 'auto'): void => {
    this.dispatch({ type: 'ui/theme/set', payload: theme });
  };
  
  /**
   * Toggle compact mode
   */
  toggleCompactMode = (): void => {
    this.dispatch({ type: 'ui/compact-mode/toggle' });
  };
  
  /**
   * Cleanup resources
   */
  destroy = (): void => {
    this.unsubscribe?.();
    this.store.stopScanning();
    this.subscribers.clear();
  };
}

// Singleton instance
let eventClientInstance: AccessibilityDevToolsEventClient | null = null;

/**
 * Create or get accessibility DevTools event client
 */
export function createAccessibilityDevToolsEventClient(): AccessibilityDevToolsEventClient {
  if (!eventClientInstance) {
    eventClientInstance = new AccessibilityDevToolsEventClient();
  }
  return eventClientInstance;
}

/**
 * Get existing accessibility DevTools event client
 */
export function getAccessibilityDevToolsEventClient(): AccessibilityDevToolsEventClient | null {
  return eventClientInstance;
}

/**
 * Reset event client instance (useful for testing)
 */
export function resetAccessibilityDevToolsEventClient(): void {
  if (eventClientInstance) {
    eventClientInstance.destroy();
    eventClientInstance = null;
  }
}