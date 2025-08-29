import type { DevToolsState, DevToolsAction, ApiCall, MockRule, MockScenario, ApiStats } from '../types';
import { initialDevToolsState } from '../types/devtools';
import { getStorageEngine } from './storage';
import { getApiInterceptor } from './interceptor';
import { getRequestMatcher } from './matcher';
import { getMockResponseEngine } from './mocker';
import { generateId, getTimestamp } from '../utils';

/**
 * DevTools store for managing API interceptor state
 */
class DevToolsStore {
  private state: DevToolsState = { ...initialDevToolsState };
  private listeners: Set<() => void> = new Set();
  private storageEngine = getStorageEngine();
  private interceptor = getApiInterceptor();
  private matcher = getRequestMatcher();
  private mocker = getMockResponseEngine();

  constructor() {
    this.loadPersistedState();
    this.setupInterceptorListener();
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
   * Enable API interception
   */
  enableInterception(): void {
    if (!this.state.isInterceptionEnabled) {
      this.interceptor.enableInterception();
      this.dispatch({ type: 'interception/toggle' });
    }
  }

  /**
   * Disable API interception
   */
  disableInterception(): void {
    if (this.state.isInterceptionEnabled) {
      this.interceptor.disableInterception();
      this.dispatch({ type: 'interception/toggle' });
    }
  }

  /**
   * Add a new mock rule
   */
  addMockRule(rule: MockRule): void {
    this.dispatch({ type: 'mock/rule/add', payload: rule });
  }

  /**
   * Update an existing mock rule
   */
  updateMockRule(id: string, updates: Partial<MockRule>): void {
    this.dispatch({ type: 'mock/rule/update', payload: { id, updates } });
  }

  /**
   * Remove a mock rule
   */
  removeMockRule(id: string): void {
    this.dispatch({ type: 'mock/rule/remove', payload: id });
  }

  /**
   * Toggle a mock rule enabled/disabled
   */
  toggleMockRule(id: string): void {
    this.dispatch({ type: 'mock/rule/toggle', payload: id });
  }

  /**
   * Clear all API calls
   */
  clearApiCalls(): void {
    this.dispatch({ type: 'api/calls/clear' });
  }

  /**
   * Set network conditions
   */
  setNetworkConditions(conditions: any): void {
    this.dispatch({ type: 'network/conditions/update', payload: conditions });
  }

  /**
   * State reducer
   */
  private reduce(state: DevToolsState, action: DevToolsAction): DevToolsState {
    switch (action.type) {
      // API call actions
      case 'api/call/add':
        return {
          ...state,
          apiCalls: {
            ...state.apiCalls,
            [action.payload.id]: action.payload,
          },
          stats: this.updateStats(state.stats, action.payload),
        };

      case 'api/call/update':
        const existingCall = state.apiCalls[action.payload.id];
        if (!existingCall) return state;
        
        const updatedCall = { ...existingCall, ...action.payload.updates };
        return {
          ...state,
          apiCalls: {
            ...state.apiCalls,
            [action.payload.id]: updatedCall,
          },
          stats: this.recalculateStats(Object.values({ ...state.apiCalls, [action.payload.id]: updatedCall })),
        };

      case 'api/call/remove':
        const { [action.payload]: removed, ...remainingCalls } = state.apiCalls;
        return {
          ...state,
          apiCalls: remainingCalls,
          stats: this.recalculateStats(Object.values(remainingCalls)),
          ui: {
            ...state.ui,
            selectedCallId: state.ui.selectedCallId === action.payload ? undefined : state.ui.selectedCallId,
          },
        };

      case 'api/calls/clear':
        return {
          ...state,
          apiCalls: {},
          stats: {
            totalCalls: 0,
            mockedCalls: 0,
            errorCount: 0,
            averageResponseTime: 0,
            methodBreakdown: {} as any,
            statusBreakdown: {},
          },
          ui: {
            ...state.ui,
            selectedCallId: undefined,
          },
        };

      // Mock rule actions
      case 'mock/rule/add':
        return {
          ...state,
          mockRules: {
            ...state.mockRules,
            [action.payload.id]: action.payload,
          },
        };

      case 'mock/rule/update':
        const existingRule = state.mockRules[action.payload.id];
        if (!existingRule) return state;
        
        return {
          ...state,
          mockRules: {
            ...state.mockRules,
            [action.payload.id]: {
              ...existingRule,
              ...action.payload.updates,
              updatedAt: getTimestamp(),
            },
          },
        };

      case 'mock/rule/remove':
        const { [action.payload]: removedRule, ...remainingRules } = state.mockRules;
        return {
          ...state,
          mockRules: remainingRules,
          ui: {
            ...state.ui,
            selectedRuleId: state.ui.selectedRuleId === action.payload ? undefined : state.ui.selectedRuleId,
          },
        };

      case 'mock/rule/toggle':
        const ruleToToggle = state.mockRules[action.payload];
        if (!ruleToToggle) return state;
        
        return {
          ...state,
          mockRules: {
            ...state.mockRules,
            [action.payload]: {
              ...ruleToToggle,
              enabled: !ruleToToggle.enabled,
              updatedAt: getTimestamp(),
            },
          },
        };

      case 'mock/rules/clear':
        return {
          ...state,
          mockRules: {},
          ui: {
            ...state.ui,
            selectedRuleId: undefined,
          },
        };

      // Mock scenario actions
      case 'mock/scenario/add':
        return {
          ...state,
          mockScenarios: {
            ...state.mockScenarios,
            [action.payload.id]: action.payload,
          },
        };

      case 'mock/scenario/update':
        const existingScenario = state.mockScenarios[action.payload.id];
        if (!existingScenario) return state;
        
        return {
          ...state,
          mockScenarios: {
            ...state.mockScenarios,
            [action.payload.id]: {
              ...existingScenario,
              ...action.payload.updates,
              updatedAt: getTimestamp(),
            },
          },
        };

      case 'mock/scenario/remove':
        const { [action.payload]: removedScenario, ...remainingScenarios } = state.mockScenarios;
        return {
          ...state,
          mockScenarios: remainingScenarios,
          activeMockScenario: state.activeMockScenario === action.payload ? undefined : state.activeMockScenario,
          ui: {
            ...state.ui,
            selectedScenarioId: state.ui.selectedScenarioId === action.payload ? undefined : state.ui.selectedScenarioId,
          },
        };

      case 'mock/scenario/activate':
        return {
          ...state,
          activeMockScenario: action.payload,
        };

      case 'mock/scenario/deactivate':
        return {
          ...state,
          activeMockScenario: undefined,
        };

      // Control actions
      case 'interception/toggle':
        return {
          ...state,
          isInterceptionEnabled: !state.isInterceptionEnabled,
        };

      case 'recording/toggle':
        return {
          ...state,
          isRecording: !state.isRecording,
        };

      case 'network/conditions/update':
        return {
          ...state,
          networkConditions: {
            ...state.networkConditions,
            ...action.payload,
          },
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

      case 'ui/call/select':
        return {
          ...state,
          ui: {
            ...state.ui,
            selectedCallId: action.payload,
          },
        };

      case 'ui/rule/select':
        return {
          ...state,
          ui: {
            ...state.ui,
            selectedRuleId: action.payload,
          },
        };

      case 'ui/scenario/select':
        return {
          ...state,
          ui: {
            ...state.ui,
            selectedScenarioId: action.payload,
          },
        };

      case 'ui/filters/toggle':
        return {
          ...state,
          ui: {
            ...state.ui,
            showFilters: !state.ui.showFilters,
          },
        };

      case 'ui/filter/update':
        return {
          ...state,
          ui: {
            ...state.ui,
            filter: {
              ...state.ui.filter,
              ...action.payload,
            },
          },
        };

      case 'ui/theme/set':
        return {
          ...state,
          ui: {
            ...state.ui,
            theme: action.payload,
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
            totalCalls: 0,
            mockedCalls: 0,
            errorCount: 0,
            averageResponseTime: 0,
            methodBreakdown: {} as any,
            statusBreakdown: {},
          },
        };

      default:
        return state;
    }
  }

  /**
   * Setup interceptor listener
   */
  private setupInterceptorListener(): void {
    this.interceptor.addListener((apiCall: ApiCall) => {
      if (this.state.isRecording) {
        // Check if request matches any mock rules
        const matchingRules = this.matcher.findMatches(
          apiCall.request,
          Object.values(this.state.mockRules).map(rule => ({
            id: rule.id,
            matcher: rule.matcher,
            priority: rule.priority,
            enabled: rule.enabled,
          }))
        );

        if (matchingRules.length > 0) {
          // Apply first matching mock rule
          const ruleId = matchingRules[0];
          const rule = this.state.mockRules[ruleId];
          if (rule) {
            apiCall.isMocked = true;
            apiCall.mockScenarioId = ruleId;
          }
        }

        this.dispatch({ type: 'api/call/add', payload: apiCall });
      }
    });
  }

  /**
   * Load persisted state from storage
   */
  private loadPersistedState(): void {
    try {
      const mockRules = this.storageEngine.loadMockRules();
      const mockScenarios = this.storageEngine.loadMockScenarios();
      const activeMockScenario = this.storageEngine.loadActiveScenario();
      const networkConditions = this.storageEngine.loadNetworkConditions();

      this.state = {
        ...this.state,
        mockRules,
        mockScenarios,
        activeMockScenario,
        networkConditions,
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
      this.storageEngine.saveMockRules(this.state.mockRules);
      this.storageEngine.saveMockScenarios(this.state.mockScenarios);
      this.storageEngine.saveActiveScenario(this.state.activeMockScenario);
      this.storageEngine.saveNetworkConditions(this.state.networkConditions);
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
        console.error('Error in DevTools store listener:', error);
      }
    });
  }

  /**
   * Update stats with new API call
   */
  private updateStats(currentStats: ApiStats, apiCall: ApiCall): ApiStats {
    const newStats = { ...currentStats };
    
    newStats.totalCalls++;
    
    if (apiCall.isMocked) {
      newStats.mockedCalls++;
    }
    
    if (apiCall.error) {
      newStats.errorCount++;
    }

    // Update method breakdown
    newStats.methodBreakdown = {
      ...newStats.methodBreakdown,
      [apiCall.request.method]: (newStats.methodBreakdown[apiCall.request.method] || 0) + 1,
    };

    // Update status breakdown
    if (apiCall.response) {
      newStats.statusBreakdown = {
        ...newStats.statusBreakdown,
        [apiCall.response.status]: (newStats.statusBreakdown[apiCall.response.status] || 0) + 1,
      };
    }

    // Update average response time
    if (apiCall.duration) {
      const totalTime = currentStats.averageResponseTime * (currentStats.totalCalls - 1) + apiCall.duration;
      newStats.averageResponseTime = Math.round(totalTime / currentStats.totalCalls);
    }

    return newStats;
  }

  /**
   * Recalculate stats from all API calls
   */
  private recalculateStats(apiCalls: ApiCall[]): ApiStats {
    const stats: ApiStats = {
      totalCalls: apiCalls.length,
      mockedCalls: 0,
      errorCount: 0,
      averageResponseTime: 0,
      methodBreakdown: {} as any,
      statusBreakdown: {},
    };

    let totalDuration = 0;

    apiCalls.forEach(apiCall => {
      if (apiCall.isMocked) {
        stats.mockedCalls++;
      }
      
      if (apiCall.error) {
        stats.errorCount++;
      }

      // Update method breakdown
      stats.methodBreakdown[apiCall.request.method] = 
        (stats.methodBreakdown[apiCall.request.method] || 0) + 1;

      // Update status breakdown
      if (apiCall.response) {
        stats.statusBreakdown[apiCall.response.status] = 
          (stats.statusBreakdown[apiCall.response.status] || 0) + 1;
      }

      // Add to total duration
      if (apiCall.duration) {
        totalDuration += apiCall.duration;
      }
    });

    // Calculate average response time
    if (apiCalls.length > 0) {
      stats.averageResponseTime = Math.round(totalDuration / apiCalls.length);
    }

    return stats;
  }
}

// Singleton instance
let storeInstance: DevToolsStore | null = null;

export function getDevToolsStore(): DevToolsStore {
  if (!storeInstance) {
    storeInstance = new DevToolsStore();
  }
  return storeInstance;
}

export { DevToolsStore };