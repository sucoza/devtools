/**
 * Router State Manager
 * Manages the global router state and navigation history
 */

import { 
  NavigationState, 
  NavigationHistoryEntry, 
  RouteInfo, 
  IRouterAdapter,
  RouterDevToolsConfig 
} from '../types/router';
import { routerEventClient } from './router-event-client';

export class RouterStateManager {
  private adapter: IRouterAdapter | null = null;
  private currentState: NavigationState | null = null;
  private routeTree: RouteInfo[] = [];
  private navigationHistory: NavigationHistoryEntry[] = [];
  private unsubscribeAdapter: (() => void) | null = null;
  private config: RouterDevToolsConfig;

  constructor(config: RouterDevToolsConfig = {}) {
    this.config = {
      maxHistoryEntries: 50,
      autoExpandRoutes: true,
      enableLiveEditing: true,
      ...config
    };

    this.setupEventListeners();
  }

  /**
   * Register a router adapter
   */
  registerAdapter(adapter: IRouterAdapter): void {
    // Clean up previous adapter
    if (this.unsubscribeAdapter) {
      this.unsubscribeAdapter();
    }

    this.adapter = adapter;
    this.routeTree = adapter.getRouteTree();
    this.currentState = adapter.getCurrentState();

    // Subscribe to adapter changes
    this.unsubscribeAdapter = adapter.subscribe((state) => {
      this.handleNavigationChange(state);
    });

    // Emit registration event
    routerEventClient.emit('router-adapter-registered', {
      routerType: adapter.getRouterType(),
      timestamp: Date.now()
    });

    // Emit initial state
    this.emitStateUpdate();
  }

  /**
   * Get current navigation state
   */
  getCurrentState(): NavigationState | null {
    return this.currentState;
  }

  /**
   * Get route tree
   */
  getRouteTree(): RouteInfo[] {
    return this.routeTree;
  }

  /**
   * Get navigation history
   */
  getNavigationHistory(): NavigationHistoryEntry[] {
    return this.navigationHistory;
  }

  /**
   * Navigate programmatically
   */
  navigate(to: string, options?: { replace?: boolean; state?: unknown }): void {
    if (!this.adapter) {
      console.warn('No router adapter registered');
      return;
    }

    this.adapter.navigate(to, options);
  }

  /**
   * Update route parameters
   */
  updateParams(params: Record<string, string>): void {
    if (!this.adapter) {
      console.warn('No router adapter registered');
      return;
    }

    if (!this.config.enableLiveEditing) {
      console.warn('Live editing is disabled');
      return;
    }

    // Apply parameter validation if provided
    const validatedParams = this.config.paramValidator 
      ? this.config.paramValidator(params)
      : params;

    this.adapter.updateParams(validatedParams);
  }

  /**
   * Update search parameters
   */
  updateSearch(search: string): void {
    if (!this.adapter) {
      console.warn('No router adapter registered');
      return;
    }

    if (!this.config.enableLiveEditing) {
      console.warn('Live editing is disabled');
      return;
    }

    this.adapter.updateSearch(search);
  }

  /**
   * Clear navigation history
   */
  clearHistory(): void {
    this.navigationHistory = [];
    this.emitStateUpdate();
  }

  /**
   * Handle navigation state changes from the adapter
   */
  private handleNavigationChange(state: NavigationState): void {
    const previousState = this.currentState;
    this.currentState = state;

    // Create navigation history entry
    if (previousState) {
      const historyEntry: NavigationHistoryEntry = {
        id: `nav-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
        location: state.location,
        matches: state.matches,
        action: this.detectNavigationAction(previousState.location, state.location),
        loadingState: state.navigation.state,
      };

      // Add to history
      this.navigationHistory.push(historyEntry);

      // Trim history to max size
      if (this.navigationHistory.length > this.config.maxHistoryEntries!) {
        this.navigationHistory = this.navigationHistory.slice(-this.config.maxHistoryEntries!);
      }

      // Emit navigation event
      routerEventClient.emit('router-navigation', {
        entry: historyEntry,
        state: state
      });
    }

    this.emitStateUpdate();
  }

  /**
   * Detect the type of navigation action
   */
  private detectNavigationAction(
    previousLocation: NavigationState['location'], 
    currentLocation: NavigationState['location']
  ): 'PUSH' | 'REPLACE' | 'POP' {
    // This is a simplified detection - in reality, you'd need to track the browser history
    if (currentLocation.key !== previousLocation.key) {
      return 'PUSH';
    }
    return 'REPLACE';
  }

  /**
   * Emit state update event
   */
  private emitStateUpdate(): void {
    if (!this.currentState) return;

    routerEventClient.emit('router-state-update', {
      state: this.currentState,
      routeTree: this.routeTree,
      timestamp: Date.now()
    });
  }

  /**
   * Set up event listeners for DevTools panel communication
   */
  private setupEventListeners(): void {
    // Listen for state requests from the DevTools panel
    routerEventClient.on('router-state-request', () => {
      routerEventClient.emit('router-state-response', {
        state: this.currentState,
        routeTree: this.routeTree,
        history: this.navigationHistory
      });
    });

    // Listen for navigation requests from the DevTools panel
    routerEventClient.on('router-navigate', (event) => {
      this.navigate(event.payload.to, event.payload.options);
    });

    // Listen for parameter update requests
    routerEventClient.on('router-update-params', (event) => {
      this.updateParams(event.payload.params);
    });

    // Listen for search update requests
    routerEventClient.on('router-update-search', (event) => {
      this.updateSearch(event.payload.search);
    });
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    if (this.unsubscribeAdapter) {
      this.unsubscribeAdapter();
    }
    routerEventClient.destroy();
  }
}

// Global state manager instance
export const routerStateManager = new RouterStateManager();