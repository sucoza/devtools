import {
  FeatureFlag,
  FlagOverride,
  EvaluationContext,
  FlagEvaluation,
  UserSegment,
  Experiment
} from './types';
import { FlagEvaluator } from './evaluator';
import { StorageAdapter, LocalStorageAdapter, MemoryStorageAdapter } from './storage';

export interface FeatureFlagManagerOptions {
  storage?: StorageAdapter;
  defaultContext?: EvaluationContext;
  persistOverrides?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export class FeatureFlagManager {
  private flags = new Map<string, FeatureFlag>();
  private overrides = new Map<string, FlagOverride>();
  private userSegments: UserSegment[] = [];
  private experiments: Experiment[] = [];
  private currentContext: EvaluationContext;
  private evaluator: FlagEvaluator;
  private storage: StorageAdapter;
  private options: FeatureFlagManagerOptions;
  private refreshTimer?: NodeJS.Timeout;
  private listeners = new Map<string, Set<(data: any) => void>>();

  constructor(options: FeatureFlagManagerOptions = {}) {
    this.options = {
      persistOverrides: true,
      autoRefresh: false,
      refreshInterval: 30000,
      ...options
    };

    this.storage = options.storage || 
      (typeof window !== 'undefined' ? new LocalStorageAdapter() : new MemoryStorageAdapter());

    this.currentContext = options.defaultContext || this.getDefaultContext();

    this.evaluator = new FlagEvaluator({
      getFlag: (id) => this.getFlag(id),
      getOverride: (flagId) => this.getOverride(flagId),
      getUserSegments: () => this.userSegments
    });

    this.loadPersistedState();

    if (this.options.autoRefresh) {
      this.startAutoRefresh();
    }
  }

  private getDefaultContext(): EvaluationContext {
    return {
      userId: typeof window !== 'undefined' ? 
        `user-${Math.random().toString(36).substr(2, 9)}` : undefined,
      sessionId: typeof window !== 'undefined' ? 
        `session-${Math.random().toString(36).substr(2, 9)}` : undefined,
      environment: 'development',
      attributes: {}
    };
  }

  private loadPersistedState(): void {
    if (!this.options.persistOverrides) return;

    try {
      const persistedOverrides = this.storage.getItem<FlagOverride[]>('overrides');
      if (persistedOverrides) {
        persistedOverrides.forEach(override => {
          if (!override.expiresAt || new Date(override.expiresAt) > new Date()) {
            this.overrides.set(override.flagId, override);
          }
        });
      }

      const persistedContext = this.storage.getItem<EvaluationContext>('context');
      if (persistedContext) {
        this.currentContext = { ...this.currentContext, ...persistedContext };
      }
    } catch (error) {
      console.warn('Failed to load persisted feature flag state:', error);
    }
  }

  private persistState(): void {
    if (!this.options.persistOverrides) return;

    try {
      this.storage.setItem('overrides', Array.from(this.overrides.values()));
      this.storage.setItem('context', this.currentContext);
    } catch (error) {
      console.warn('Failed to persist feature flag state:', error);
    }
  }

  private startAutoRefresh(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }

    this.refreshTimer = setInterval(() => {
      this.emit('refresh', { timestamp: Date.now() });
    }, this.options.refreshInterval);
  }

  // Flag management
  setFlags(flags: FeatureFlag[]): void {
    this.flags.clear();
    flags.forEach(flag => {
      this.flags.set(flag.id, flag);
    });
    this.emit('flags-updated', flags);
  }

  addFlag(flag: FeatureFlag): void {
    this.flags.set(flag.id, flag);
    this.emit('flag-added', flag);
  }

  updateFlag(flag: FeatureFlag): void {
    this.flags.set(flag.id, flag);
    this.emit('flag-updated', flag);
  }

  removeFlag(flagId: string): void {
    const flag = this.flags.get(flagId);
    if (flag) {
      this.flags.delete(flagId);
      this.emit('flag-removed', flag);
    }
  }

  getFlag(id: string): FeatureFlag | null {
    return this.flags.get(id) || null;
  }

  getAllFlags(): FeatureFlag[] {
    return Array.from(this.flags.values());
  }

  // Override management
  setOverride(override: FlagOverride): void {
    this.overrides.set(override.flagId, override);
    this.persistState();
    this.emit('override-set', override);
  }

  removeOverride(flagId: string): void {
    const override = this.overrides.get(flagId);
    if (override) {
      this.overrides.delete(flagId);
      this.persistState();
      this.emit('override-removed', override);
    }
  }

  getOverride(flagId: string): FlagOverride | null {
    return this.overrides.get(flagId) || null;
  }

  getAllOverrides(): FlagOverride[] {
    return Array.from(this.overrides.values());
  }

  clearAllOverrides(): void {
    this.overrides.clear();
    this.persistState();
    this.emit('overrides-cleared', null);
  }

  // Context management
  setContext(context: Partial<EvaluationContext>): void {
    this.currentContext = { ...this.currentContext, ...context };
    this.persistState();
    this.emit('context-updated', this.currentContext);
  }

  getContext(): EvaluationContext {
    return { ...this.currentContext };
  }

  // Evaluation
  async evaluate(flagId: string, context?: EvaluationContext): Promise<FlagEvaluation> {
    const evalContext = context || this.currentContext;
    const evaluation = await this.evaluator.evaluate(flagId, evalContext);
    this.emit('flag-evaluated', { flagId, evaluation, context: evalContext });
    return evaluation;
  }

  async evaluateAll(context?: EvaluationContext): Promise<Map<string, FlagEvaluation>> {
    const evalContext = context || this.currentContext;
    const evaluations = new Map<string, FlagEvaluation>();
    
    for (const flag of this.flags.values()) {
      evaluations.set(flag.id, await this.evaluate(flag.id, evalContext));
    }
    
    return evaluations;
  }

  // User segments
  setUserSegments(segments: UserSegment[]): void {
    this.userSegments = segments;
    this.emit('segments-updated', segments);
  }

  getUserSegments(): UserSegment[] {
    return [...this.userSegments];
  }

  // Experiments
  setExperiments(experiments: Experiment[]): void {
    this.experiments = experiments;
    this.emit('experiments-updated', experiments);
  }

  getExperiments(): Experiment[] {
    return [...this.experiments];
  }

  // Event handling
  on(event: string, listener: (data: any) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);
  }

  off(event: string, listener: (data: any) => void): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.delete(listener);
    }
  }

  private emit(event: string, data: any): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  // Cleanup
  destroy(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }
    this.listeners.clear();
  }
}