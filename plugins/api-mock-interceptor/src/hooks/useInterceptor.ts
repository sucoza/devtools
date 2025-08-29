import { useSyncExternalStore, useCallback } from 'react';
import type { DevToolsState, ApiCall, MockRule, MockScenario, NetworkConditions } from '../types';
import { getDevToolsStore } from '../core/devtools-store';

/**
 * React hook for interacting with the API Mock Interceptor DevTools
 */
export function useInterceptor() {
  const store = getDevToolsStore();
  
  const state = useSyncExternalStore(
    store.subscribe.bind(store),
    store.getSnapshot.bind(store)
  );

  // Actions
  const actions = {
    // Interception control
    enableInterception: useCallback(() => store.enableInterception(), [store]),
    disableInterception: useCallback(() => store.disableInterception(), [store]),
    toggleRecording: useCallback(() => store.dispatch({ type: 'recording/toggle' }), [store]),

    // API calls management
    clearApiCalls: useCallback(() => store.clearApiCalls(), [store]),
    selectCall: useCallback((id?: string) => store.dispatch({ type: 'ui/call/select', payload: id }), [store]),

    // Mock rules management
    addMockRule: useCallback((rule: MockRule) => store.addMockRule(rule), [store]),
    updateMockRule: useCallback((id: string, updates: Partial<MockRule>) => store.updateMockRule(id, updates), [store]),
    removeMockRule: useCallback((id: string) => store.removeMockRule(id), [store]),
    toggleMockRule: useCallback((id: string) => store.toggleMockRule(id), [store]),
    selectRule: useCallback((id?: string) => store.dispatch({ type: 'ui/rule/select', payload: id }), [store]),

    // Mock scenarios management
    addScenario: useCallback((scenario: MockScenario) => store.dispatch({ type: 'mock/scenario/add', payload: scenario }), [store]),
    updateScenario: useCallback((id: string, updates: Partial<MockScenario>) => 
      store.dispatch({ type: 'mock/scenario/update', payload: { id, updates } }), [store]),
    removeScenario: useCallback((id: string) => store.dispatch({ type: 'mock/scenario/remove', payload: id }), [store]),
    activateScenario: useCallback((id: string) => store.dispatch({ type: 'mock/scenario/activate', payload: id }), [store]),
    deactivateScenario: useCallback(() => store.dispatch({ type: 'mock/scenario/deactivate' }), [store]),
    selectScenario: useCallback((id?: string) => store.dispatch({ type: 'ui/scenario/select', payload: id }), [store]),

    // Network conditions
    setNetworkConditions: useCallback((conditions: NetworkConditions) => store.setNetworkConditions(conditions), [store]),

    // UI management
    selectTab: useCallback((tab: 'calls' | 'mocks' | 'scenarios' | 'settings') => 
      store.dispatch({ type: 'ui/tab/select', payload: tab }), [store]),
    toggleFilters: useCallback(() => store.dispatch({ type: 'ui/filters/toggle' }), [store]),
    updateFilter: useCallback((filter: Partial<import('../types').ApiCallFilter>) => 
      store.dispatch({ type: 'ui/filter/update', payload: filter }), [store]),
    setTheme: useCallback((theme: 'light' | 'dark' | 'auto') => 
      store.dispatch({ type: 'ui/theme/set', payload: theme }), [store]),
  };

  // Derived selectors
  const selectors = {
    // Get filtered API calls
    getFilteredApiCalls: useCallback(() => {
      const calls = Object.values(state.apiCalls);
      const filter = state.ui.filter;

      return calls.filter(call => {
        if (filter.method?.length && !filter.method.includes(call.request.method)) {
          return false;
        }
        
        if (filter.status?.length && call.response && !filter.status.includes(call.response.status)) {
          return false;
        }
        
        if (filter.url && !call.request.url.toLowerCase().includes(filter.url.toLowerCase())) {
          return false;
        }
        
        if (filter.isMocked !== undefined && call.isMocked !== filter.isMocked) {
          return false;
        }
        
        if (filter.hasError !== undefined) {
          const hasError = !!call.error;
          if (hasError !== filter.hasError) {
            return false;
          }
        }
        
        if (filter.timeRange) {
          if (call.timestamp < filter.timeRange.start || call.timestamp > filter.timeRange.end) {
            return false;
          }
        }
        
        return true;
      }).sort((a, b) => b.timestamp - a.timestamp); // Most recent first
    }, [state.apiCalls, state.ui.filter]),

    // Get enabled mock rules
    getEnabledMockRules: useCallback(() => {
      return Object.values(state.mockRules)
        .filter(rule => rule.enabled)
        .sort((a, b) => b.priority - a.priority);
    }, [state.mockRules]),

    // Get active scenario rules
    getActiveScenarioRules: useCallback(() => {
      const activeScenario = state.activeMockScenario ? state.mockScenarios[state.activeMockScenario] : null;
      if (!activeScenario || !activeScenario.enabled) {
        return [];
      }
      
      return activeScenario.rules.filter(rule => rule.enabled);
    }, [state.activeMockScenario, state.mockScenarios]),

    // Get selected items
    getSelectedCall: useCallback(() => {
      return state.ui.selectedCallId ? state.apiCalls[state.ui.selectedCallId] : null;
    }, [state.apiCalls, state.ui.selectedCallId]),

    getSelectedRule: useCallback(() => {
      return state.ui.selectedRuleId ? state.mockRules[state.ui.selectedRuleId] : null;
    }, [state.mockRules, state.ui.selectedRuleId]),

    getSelectedScenario: useCallback(() => {
      return state.ui.selectedScenarioId ? state.mockScenarios[state.ui.selectedScenarioId] : null;
    }, [state.mockScenarios, state.ui.selectedScenarioId]),
  };

  return {
    state,
    actions,
    selectors,
  };
}

export default useInterceptor;