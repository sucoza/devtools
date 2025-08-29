import type { 
  DesignSystemState, 
  DesignSystemAction,
  ComponentUsage,
  DesignToken,
  ConsistencyIssue,
  AnalysisOptions,
  DesignSystemStats
} from '../types';
import { initialDesignSystemState } from '../types/devtools';
import { generateId, getTimestamp } from '../utils';

/**
 * DevTools store for managing Design System Inspector state
 */
class DesignSystemDevToolsStore {
  private state: DesignSystemState = { ...initialDesignSystemState };
  private listeners: Set<() => void> = new Set();
  private analysisWorker?: Worker;
  private realTimeObserver?: MutationObserver;

  constructor() {
    this.loadPersistedState();
  }

  /**
   * Get current state snapshot
   */
  getSnapshot(): DesignSystemState {
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
  dispatch(action: DesignSystemAction): void {
    this.state = this.reduce(this.state, action);
    this.notifyListeners();
    this.persistState();
  }

  /**
   * Start comprehensive design system analysis
   */
  async startAnalysis(options: Partial<AnalysisOptions> = {}): Promise<void> {
    this.dispatch({ type: 'analysis/start' });
    
    try {
      const startTime = performance.now();
      
      const analysisResult = await this.performAnalysis({
        includeComponents: true,
        includeTokens: true,
        includeColors: true,
        includeTypography: true,
        includeSpacing: true,
        includeBorders: true,
        includeShadows: true,
        depth: this.state.analysisDepth,
        includeThirdParty: this.state.includeThirdParty,
        ...options,
      });

      const endTime = performance.now();
      const analysisTime = endTime - startTime;

      this.dispatch({ 
        type: 'analysis/complete', 
        payload: {
          ...analysisResult,
          stats: {
            ...analysisResult.stats,
            lastAnalysis: getTimestamp(),
            analysisTime,
          }
        }
      });
    } catch (error) {
      this.dispatch({ 
        type: 'analysis/error', 
        payload: error instanceof Error ? error.message : 'Analysis failed' 
      });
    }
  }

  /**
   * Stop analysis
   */
  stopAnalysis(): void {
    if (this.analysisWorker) {
      this.analysisWorker.terminate();
      this.analysisWorker = undefined;
    }
    this.dispatch({ type: 'analysis/toggle' });
  }

  /**
   * Enable real-time monitoring
   */
  enableRealTime(): void {
    if (!this.realTimeObserver) {
      this.realTimeObserver = new MutationObserver(this.handleMutations.bind(this));
      this.realTimeObserver.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class', 'style'],
      });
    }
    this.dispatch({ type: 'realtime/toggle' });
  }

  /**
   * Disable real-time monitoring
   */
  disableRealTime(): void {
    if (this.realTimeObserver) {
      this.realTimeObserver.disconnect();
      this.realTimeObserver = undefined;
    }
    this.dispatch({ type: 'realtime/toggle' });
  }

  /**
   * Track component usage
   */
  trackComponent(component: ComponentUsage): void {
    this.dispatch({ type: 'component/track', payload: component });
  }

  /**
   * Add or update design token
   */
  addToken(token: DesignToken): void {
    this.dispatch({ type: 'token/add', payload: token });
  }

  /**
   * Update existing token
   */
  updateToken(id: string, updates: Partial<DesignToken>): void {
    this.dispatch({ type: 'token/update', payload: { id, updates } });
  }

  /**
   * Add consistency issue
   */
  addIssue(issue: ConsistencyIssue): void {
    this.dispatch({ type: 'issue/add', payload: issue });
  }

  /**
   * Resolve consistency issue
   */
  resolveIssue(id: string): void {
    this.dispatch({ type: 'issue/resolve', payload: id });
  }

  /**
   * State reducer
   */
  private reduce(state: DesignSystemState, action: DesignSystemAction): DesignSystemState {
    switch (action.type) {
      case 'analysis/start':
        return {
          ...state,
          stats: {
            ...state.stats,
            lastAnalysis: getTimestamp(),
          },
        };

      case 'analysis/complete':
        return {
          ...state,
          ...action.payload,
        };

      case 'analysis/error':
        return state; // Handle error state if needed

      case 'analysis/toggle':
        return {
          ...state,
          isAnalysisEnabled: !state.isAnalysisEnabled,
        };

      case 'realtime/toggle':
        return {
          ...state,
          isRealTimeMode: !state.isRealTimeMode,
        };

      case 'settings/update':
        return {
          ...state,
          ...action.payload,
        };

      case 'component/track':
        const existingComponent = state.componentUsage.find(c => c.id === action.payload.id);
        if (existingComponent) {
          return {
            ...state,
            componentUsage: state.componentUsage.map(c =>
              c.id === action.payload.id
                ? {
                    ...c,
                    usageCount: c.usageCount + 1,
                    lastSeen: getTimestamp(),
                    props: this.mergeProps(c.props, action.payload.props),
                  }
                : c
            ),
          };
        } else {
          return {
            ...state,
            componentUsage: [...state.componentUsage, action.payload],
            stats: {
              ...state.stats,
              totalComponents: state.stats.totalComponents + 1,
            },
          };
        }

      case 'token/add':
        const existingToken = state.tokens.find(t => t.id === action.payload.id);
        if (existingToken) {
          return {
            ...state,
            tokens: state.tokens.map(t =>
              t.id === action.payload.id
                ? { ...t, usageCount: t.usageCount + 1 }
                : t
            ),
          };
        } else {
          return {
            ...state,
            tokens: [...state.tokens, action.payload],
            stats: {
              ...state.stats,
              totalTokens: state.stats.totalTokens + 1,
            },
          };
        }

      case 'token/update':
        return {
          ...state,
          tokens: state.tokens.map(t =>
            t.id === action.payload.id
              ? { ...t, ...action.payload.updates }
              : t
          ),
        };

      case 'issue/add':
        return {
          ...state,
          consistencyIssues: [...state.consistencyIssues, action.payload],
          stats: {
            ...state.stats,
            totalIssues: state.stats.totalIssues + 1,
          },
        };

      case 'issue/resolve':
        return {
          ...state,
          consistencyIssues: state.consistencyIssues.filter(i => i.id !== action.payload),
          stats: {
            ...state.stats,
            totalIssues: Math.max(0, state.stats.totalIssues - 1),
          },
        };

      case 'ui/tab/select':
        return {
          ...state,
          ui: {
            ...state.ui,
            activeTab: action.payload,
          },
        };

      case 'ui/component/select':
        return {
          ...state,
          ui: {
            ...state.ui,
            selectedComponent: action.payload,
          },
        };

      case 'ui/token/select':
        return {
          ...state,
          ui: {
            ...state.ui,
            selectedToken: action.payload,
          },
        };

      case 'ui/issue/select':
        return {
          ...state,
          ui: {
            ...state.ui,
            selectedIssue: action.payload,
          },
        };

      case 'ui/search':
        return {
          ...state,
          ui: {
            ...state.ui,
            searchQuery: action.payload,
          },
        };

      case 'ui/filter/severity':
        return {
          ...state,
          ui: {
            ...state.ui,
            filters: {
              ...state.ui.filters,
              severity: action.payload,
            },
          },
        };

      case 'ui/filter/issueTypes':
        return {
          ...state,
          ui: {
            ...state.ui,
            filters: {
              ...state.ui.filters,
              issueTypes: action.payload,
            },
          },
        };

      case 'ui/filter/tokenTypes':
        return {
          ...state,
          ui: {
            ...state.ui,
            filters: {
              ...state.ui.filters,
              tokenTypes: action.payload,
            },
          },
        };

      case 'ui/showOnlyIssues/toggle':
        return {
          ...state,
          ui: {
            ...state.ui,
            showOnlyIssues: !state.ui.showOnlyIssues,
          },
        };

      default:
        return state;
    }
  }

  /**
   * Perform comprehensive design system analysis
   */
  private async performAnalysis(options: AnalysisOptions) {
    const { getDesignSystemAnalyzer } = await import('./analyzer');
    const analyzer = getDesignSystemAnalyzer();
    
    return analyzer.analyze(options);
  }

  /**
   * Handle DOM mutations for real-time analysis
   */
  private handleMutations(mutations: MutationRecord[]): void {
    if (!this.state.isRealTimeMode) return;

    // Debounce mutations to avoid excessive analysis
    clearTimeout(this.mutationTimeout);
    this.mutationTimeout = setTimeout(() => {
      this.performIncrementalAnalysis(mutations);
    }, 500);
  }

  private mutationTimeout?: ReturnType<typeof setTimeout>;

  /**
   * Perform incremental analysis on changed elements
   */
  private async performIncrementalAnalysis(mutations: MutationRecord[]): Promise<void> {
    const { getDesignSystemAnalyzer } = await import('./analyzer');
    const analyzer = getDesignSystemAnalyzer();

    for (const mutation of mutations) {
      if (mutation.type === 'childList') {
        for (const node of Array.from(mutation.addedNodes)) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element;
            await analyzer.analyzeElement(element);
          }
        }
      } else if (mutation.type === 'attributes') {
        const element = mutation.target as Element;
        await analyzer.analyzeElement(element);
      }
    }
  }

  /**
   * Merge component props usage
   */
  private mergeProps(existingProps: any[], newProps: any[]) {
    const propsMap = new Map(existingProps.map(p => [p.name, p]));
    
    for (const newProp of newProps) {
      const existing = propsMap.get(newProp.name);
      if (existing) {
        existing.usageCount += newProp.usageCount;
        // Merge values
        const valueMap = new Map(existing.values.map((v: any) => [v.value, v]));
        for (const newValue of newProp.values) {
          const existingValue = valueMap.get(newValue.value);
          if (existingValue) {
            (existingValue as any).count += (newValue as any).count;
          } else {
            existing.values.push(newValue);
          }
        }
        // Recalculate percentages
        const totalCount = existing.values.reduce((sum: number, v: any) => sum + v.count, 0);
        existing.values.forEach((v: any) => {
          v.percentage = (v.count / totalCount) * 100;
        });
      } else {
        propsMap.set(newProp.name, newProp);
      }
    }
    
    return Array.from(propsMap.values());
  }

  /**
   * Load persisted state from localStorage
   */
  private loadPersistedState(): void {
    try {
      const persistedState = localStorage.getItem('design-system-inspector-state');
      if (persistedState) {
        const parsed = JSON.parse(persistedState);
        this.state = {
          ...this.state,
          ui: {
            ...this.state.ui,
            ...parsed.ui,
          },
          isAnalysisEnabled: parsed.isAnalysisEnabled ?? this.state.isAnalysisEnabled,
          analysisDepth: parsed.analysisDepth ?? this.state.analysisDepth,
          includeThirdParty: parsed.includeThirdParty ?? this.state.includeThirdParty,
        };
      }
    } catch (error) {
      console.error('Failed to load persisted state:', error);
    }
  }

  /**
   * Persist state to localStorage
   */
  private persistState(): void {
    try {
      const stateToPersist = {
        ui: this.state.ui,
        isAnalysisEnabled: this.state.isAnalysisEnabled,
        analysisDepth: this.state.analysisDepth,
        includeThirdParty: this.state.includeThirdParty,
      };
      localStorage.setItem('design-system-inspector-state', JSON.stringify(stateToPersist));
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
        console.error('Error in Design System DevTools store listener:', error);
      }
    });
  }
}

// Singleton instance
let storeInstance: DesignSystemDevToolsStore | null = null;

export function getDesignSystemDevToolsStore(): DesignSystemDevToolsStore {
  if (!storeInstance) {
    storeInstance = new DesignSystemDevToolsStore();
  }
  return storeInstance;
}

export type { DesignSystemDevToolsStore };