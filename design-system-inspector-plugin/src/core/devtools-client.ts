import type { DesignSystemState, DesignSystemAction } from '../types';
import { getDesignSystemDevToolsStore } from './devtools-store';

// Basic event client interface (simplified from @tanstack/devtools)
export interface DevToolsEventClient<TEvents extends Record<string, any>> {
  subscribe: (callback: (event: TEvents[keyof TEvents], type: keyof TEvents) => void) => () => void;
}

export interface DesignSystemEvents {
  'design-system:state': DesignSystemState;
  'design-system:action': DesignSystemAction;
  'design-system:component-detected': {
    component: import('../types').ComponentUsage;
    timestamp: number;
  };
  'design-system:token-used': {
    token: import('../types').DesignToken;
    element: HTMLElement;
    timestamp: number;
  };
  'design-system:issue-detected': {
    issue: import('../types').ConsistencyIssue;
    timestamp: number;
  };
}

export class DesignSystemDevToolsClient implements DevToolsEventClient<DesignSystemEvents> {
  private unsubscribe?: () => void;
  private store = getDesignSystemDevToolsStore();

  constructor() {
    // Initialize analysis when client is created
    this.initializeAnalysis();
  }

  subscribe = (callback: (events: DesignSystemEvents[keyof DesignSystemEvents], type: keyof DesignSystemEvents) => void) => {
    // Subscribe to store changes and emit state updates
    this.unsubscribe = this.store.subscribe(() => {
      const state = this.store.getSnapshot();
      callback(state, 'design-system:state');
    });

    // Send initial state
    const initialState = this.store.getSnapshot();
    callback(initialState, 'design-system:state');

    return () => {
      this.unsubscribe?.();
      this.cleanup();
    };
  };

  // Handle incoming actions from DevTools
  handleAction = (action: DesignSystemAction) => {
    this.store.dispatch(action);
  };

  // Get current state
  getState = (): DesignSystemState => {
    return this.store.getSnapshot();
  };

  // Control methods
  startAnalysis = async (options?: Partial<import('../types').AnalysisOptions>) => {
    await this.store.startAnalysis(options);
  };

  stopAnalysis = () => {
    this.store.stopAnalysis();
  };

  enableRealTime = () => {
    this.store.enableRealTime();
  };

  disableRealTime = () => {
    this.store.disableRealTime();
  };

  // UI control methods
  selectTab = (tab: DesignSystemState['ui']['activeTab']) => {
    this.store.dispatch({ type: 'ui/tab/select', payload: tab });
  };

  selectComponent = (id: string | undefined) => {
    this.store.dispatch({ type: 'ui/component/select', payload: id });
  };

  selectToken = (id: string | undefined) => {
    this.store.dispatch({ type: 'ui/token/select', payload: id });
  };

  selectIssue = (id: string | undefined) => {
    this.store.dispatch({ type: 'ui/issue/select', payload: id });
  };

  setSearchQuery = (query: string) => {
    this.store.dispatch({ type: 'ui/search', payload: query });
  };

  setSeverityFilter = (severity: ('error' | 'warning' | 'info')[]) => {
    this.store.dispatch({ type: 'ui/filter/severity', payload: severity });
  };

  setIssueTypesFilter = (types: import('../types').ConsistencyIssueType[]) => {
    this.store.dispatch({ type: 'ui/filter/issueTypes', payload: types });
  };

  setTokenTypesFilter = (types: import('../types').DesignTokenType[]) => {
    this.store.dispatch({ type: 'ui/filter/tokenTypes', payload: types });
  };

  toggleShowOnlyIssues = () => {
    this.store.dispatch({ type: 'ui/showOnlyIssues/toggle' });
  };

  // Analysis control
  updateSettings = (settings: Partial<Pick<DesignSystemState, 'analysisDepth' | 'includeThirdParty'>>) => {
    this.store.dispatch({ type: 'settings/update', payload: settings });
  };

  // Issue management
  resolveIssue = (id: string) => {
    this.store.resolveIssue(id);
  };

  // Data tracking methods
  trackComponent = (component: import('../types').ComponentUsage) => {
    this.store.trackComponent(component);
    
    // Emit component detection event
    const callback = this.eventCallback;
    if (callback) {
      callback({
        component,
        timestamp: Date.now(),
      }, 'design-system:component-detected');
    }
  };

  trackToken = (token: import('../types').DesignToken, element: HTMLElement) => {
    this.store.addToken(token);
    
    // Emit token usage event
    const callback = this.eventCallback;
    if (callback) {
      callback({
        token,
        element,
        timestamp: Date.now(),
      }, 'design-system:token-used');
    }
  };

  reportIssue = (issue: import('../types').ConsistencyIssue) => {
    this.store.addIssue(issue);
    
    // Emit issue detection event
    const callback = this.eventCallback;
    if (callback) {
      callback({
        issue,
        timestamp: Date.now(),
      }, 'design-system:issue-detected');
    }
  };

  // Export/Import functionality
  exportData = () => {
    const state = this.store.getSnapshot();
    return {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      data: {
        tokens: state.tokens,
        componentUsage: state.componentUsage,
        consistencyIssues: state.consistencyIssues,
        colorPalette: state.colorPalette,
        settings: {
          analysisDepth: state.analysisDepth,
          includeThirdParty: state.includeThirdParty,
        },
      },
    };
  };

  importData = (data: ReturnType<typeof this.exportData>) => {
    try {
      // Validate data structure
      if (!data.data || !data.version) {
        throw new Error('Invalid data format');
      }

      // Import tokens
      if (data.data.tokens) {
        data.data.tokens.forEach(token => {
          this.store.addToken(token);
        });
      }

      // Import components
      if (data.data.componentUsage) {
        data.data.componentUsage.forEach(component => {
          this.store.trackComponent(component);
        });
      }

      // Import issues
      if (data.data.consistencyIssues) {
        data.data.consistencyIssues.forEach(issue => {
          this.store.addIssue(issue);
        });
      }

      // Import settings
      if (data.data.settings) {
        this.store.dispatch({
          type: 'settings/update',
          payload: data.data.settings,
        });
      }

      return { success: true };
    } catch (error) {
      console.error('Failed to import data:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Import failed' 
      };
    }
  };

  // Clear data
  clearData = (type?: 'tokens' | 'components' | 'issues' | 'all') => {
    switch (type) {
      case 'tokens':
        // Clear tokens - would need to implement in store
        break;
      case 'components':
        // Clear components - would need to implement in store
        break;
      case 'issues':
        // Clear issues - would need to implement in store
        break;
      case 'all':
      default:
        // Clear all data - would need to implement in store
        break;
    }
  };

  private eventCallback?: (event: DesignSystemEvents[keyof DesignSystemEvents], type: keyof DesignSystemEvents) => void;

  /**
   * Initialize analysis system
   */
  private async initializeAnalysis(): Promise<void> {
    try {
      // Start initial analysis if enabled
      const state = this.store.getSnapshot();
      if (state.isAnalysisEnabled) {
        await this.store.startAnalysis();
      }

      // Set up real-time monitoring if enabled
      if (state.isRealTimeMode) {
        this.store.enableRealTime();
      }
    } catch (error) {
      console.error('Failed to initialize design system analysis:', error);
    }
  }

  /**
   * Cleanup when client is destroyed
   */
  private cleanup(): void {
    this.store.stopAnalysis();
    this.store.disableRealTime();
  }
}

let clientInstance: DesignSystemDevToolsClient | null = null;

export function createDesignSystemDevToolsClient(): DesignSystemDevToolsClient {
  if (!clientInstance) {
    clientInstance = new DesignSystemDevToolsClient();
  }
  return clientInstance;
}

export function getDesignSystemDevToolsClient(): DesignSystemDevToolsClient | null {
  return clientInstance;
}