import type {
  AccessibilityDevToolsState,
  AccessibilityDevToolsEvents,
} from '../types';
import { useAccessibilityDevToolsStore } from './devtools-store';

/**
 * DevTools event client interface following TanStack patterns
 */
export interface DevToolsEventClient<TEvents extends Record<string, any>> {
  subscribe: (callback: (event: TEvents[keyof TEvents], type: keyof TEvents) => void) => () => void;
  getState: () => AccessibilityDevToolsState;
}

/**
 * Accessibility DevTools event client
 * Follows the simplified TanStack DevTools pattern
 */
export class AccessibilityDevToolsClient implements DevToolsEventClient<AccessibilityDevToolsEvents> {
  private unsubscribeStore?: () => void;
  private store = useAccessibilityDevToolsStore;

  /**
   * Subscribe to store changes
   */
  subscribe = (
    callback: (
      event: AccessibilityDevToolsEvents[keyof AccessibilityDevToolsEvents],
      type: keyof AccessibilityDevToolsEvents
    ) => void
  ) => {
    // Subscribe to store changes
    this.unsubscribeStore = this.store.subscribe((state) => {
      callback(state, 'accessibility:state');
    });

    // Send initial state
    const initialState = this.store.getState();
    callback(initialState, 'accessibility:state');

    return () => {
      this.unsubscribeStore?.();
      // Stop scanning when last subscriber disconnects
      const currentState = this.store.getState();
      currentState.stopScanning();
    };
  };

  /**
   * Get current state from store
   */
  getState = (): AccessibilityDevToolsState => {
    return this.store.getState();
  };

  // Scanning control methods
  startScanning = (): void => {
    this.store.getState().startScanning();
  };

  stopScanning = (): void => {
    this.store.getState().stopScanning();
  };

  toggleScanning = (): void => {
    this.store.getState().toggleScanning();
  };

  // Audit management methods
  runAudit = (): void => {
    this.store.getState().runAudit();
  };

  selectAuditResult = (id: string | null): void => {
    this.store.getState().selectAuditResult(id);
  };

  dismissViolation = (id: string): void => {
    this.store.getState().dismissViolation(id);
  };

  // Filters methods
  updateFilters = (filters: Partial<AccessibilityDevToolsState['filters']>): void => {
    this.store.getState().updateFilters(filters);
  };

  // Settings methods
  updateSettings = (settings: Partial<AccessibilityDevToolsState['settings']>): void => {
    this.store.getState().updateSettings(settings);
  };

  // UI control methods
  selectTab = (tab: AccessibilityDevToolsState['ui']['activeTab']): void => {
    this.store.getState().selectTab(tab);
  };

  setTheme = (theme: 'light' | 'dark' | 'auto'): void => {
    this.store.getState().setTheme(theme);
  };

  toggleCompactMode = (): void => {
    this.store.getState().toggleCompactMode();
  };

  /**
   * Cleanup resources
   */
  destroy = (): void => {
    this.unsubscribeStore?.();
    const state = this.store.getState();
    state.stopScanning();
  };
}

// Singleton instance
let clientInstance: AccessibilityDevToolsClient | null = null;

/**
 * Create or get accessibility DevTools event client
 */
export function createAccessibilityDevToolsEventClient(): AccessibilityDevToolsClient {
  if (!clientInstance) {
    clientInstance = new AccessibilityDevToolsClient();
  }
  return clientInstance;
}

/**
 * Get existing accessibility DevTools event client
 */
export function getAccessibilityDevToolsEventClient(): AccessibilityDevToolsClient | null {
  return clientInstance;
}

/**
 * Reset event client instance (useful for testing)
 */
export function resetAccessibilityDevToolsEventClient(): void {
  clientInstance = null;
}
