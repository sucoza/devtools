import { useSyncExternalStore } from 'use-sync-external-store/shim';
import type { DesignSystemState, AnalysisOptions, ConsistencyIssueType, DesignTokenType } from '../types';
import { getDesignSystemDevToolsStore } from '../core/devtools-store';

/**
 * Main hook for accessing design system inspector state and actions
 */
export function useDesignSystemInspector() {
  const store = getDesignSystemDevToolsStore();
  
  const state = useSyncExternalStore(
    store.subscribe.bind(store),
    store.getSnapshot.bind(store),
    store.getSnapshot.bind(store) // SSR fallback
  ) as DesignSystemState;

  const actions = {
    // Analysis control
    startAnalysis: (options?: Partial<AnalysisOptions>) => store.startAnalysis(options),
    stopAnalysis: () => store.stopAnalysis(),
    enableRealTime: () => store.enableRealTime(),
    disableRealTime: () => store.disableRealTime(),
    
    // Data management
    trackComponent: store.trackComponent.bind(store),
    addToken: store.addToken.bind(store),
    updateToken: store.updateToken.bind(store),
    addIssue: store.addIssue.bind(store),
    resolveIssue: store.resolveIssue.bind(store),
    
    // UI actions
    dispatch: store.dispatch.bind(store),
    selectTab: (tab: DesignSystemState['ui']['activeTab']) => 
      store.dispatch({ type: 'ui/tab/select', payload: tab }),
    selectComponent: (id: string | undefined) => 
      store.dispatch({ type: 'ui/component/select', payload: id }),
    selectToken: (id: string | undefined) => 
      store.dispatch({ type: 'ui/token/select', payload: id }),
    selectIssue: (id: string | undefined) => 
      store.dispatch({ type: 'ui/issue/select', payload: id }),
    setSearchQuery: (query: string) => 
      store.dispatch({ type: 'ui/search', payload: query }),
    setSeverityFilter: (severity: ('error' | 'warning' | 'info')[]) => 
      store.dispatch({ type: 'ui/filter/severity', payload: severity }),
    setIssueTypesFilter: (types: ConsistencyIssueType[]) => 
      store.dispatch({ type: 'ui/filter/issueTypes', payload: types }),
    setTokenTypesFilter: (types: DesignTokenType[]) => 
      store.dispatch({ type: 'ui/filter/tokenTypes', payload: types }),
    toggleShowOnlyIssues: () => 
      store.dispatch({ type: 'ui/showOnlyIssues/toggle' }),
    
    // Settings
    updateSettings: (settings: Partial<Pick<DesignSystemState, 'analysisDepth' | 'includeThirdParty'>>) => 
      store.dispatch({ type: 'settings/update', payload: settings }),
  };

  return {
    state,
    actions,
  };
}