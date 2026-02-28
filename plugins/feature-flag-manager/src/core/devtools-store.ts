import { 
  FeatureFlag, 
  FlagOverride, 
  UserSegment, 
  Experiment, 
  EvaluationContext, 
  FlagEvaluation,
  FlagEvent,
  FeatureFlagDevToolsState,
  DevToolsSettings,
  Environment
} from '../types';
import { EventEmitter } from './event-emitter';
import { generateId } from '../utils/id-generator';
import { StorageManager } from './storage';

export class FeatureFlagDevToolsStore extends EventEmitter {
  private state: FeatureFlagDevToolsState;
  private storage: StorageManager;

  constructor() {
    super();
    this.storage = new StorageManager('feature-flag-devtools');
    
    // Initialize state
    this.state = {
      flags: new Map(),
      overrides: new Map(),
      currentContext: this.getDefaultContext(),
      userSegments: this.getDefaultSegments(),
      experiments: [],
      evaluationHistory: [],
      events: [],
      selectedFlag: null,
      filterText: '',
      showOnlyOverrides: false,
      selectedEnvironment: 'development',
      settings: this.getDefaultSettings()
    };

    // Load persisted data
    this.loadPersistedState();
  }

  private getDefaultContext(): EvaluationContext {
    return {
      userId: 'dev-user-' + Math.random().toString(36).substring(2, 11),
      sessionId: 'session-' + Math.random().toString(36).substring(2, 11),
      userSegment: 'developer',
      attributes: {
        plan: 'free',
        region: 'us-east-1',
        betaUser: true
      },
      environment: 'development' as Environment
    };
  }

  private getDefaultSegments(): UserSegment[] {
    return [
      {
        id: 'developer',
        name: 'Developer',
        description: 'Development environment users',
        rules: [
          {
            attribute: 'environment',
            operator: 'equals',
            values: ['development']
          }
        ]
      },
      {
        id: 'beta-users',
        name: 'Beta Users',
        description: 'Users enrolled in beta program',
        rules: [
          {
            attribute: 'betaUser',
            operator: 'equals',
            values: [true]
          }
        ]
      },
      {
        id: 'premium-users',
        name: 'Premium Users',
        description: 'Users with premium subscription',
        rules: [
          {
            attribute: 'plan',
            operator: 'in',
            values: ['premium', 'enterprise']
          }
        ]
      },
      {
        id: 'us-users',
        name: 'US Users',
        description: 'Users in United States',
        rules: [
          {
            attribute: 'region',
            operator: 'in',
            values: ['us-east-1', 'us-west-1', 'us-west-2']
          }
        ]
      }
    ];
  }

  private getDefaultSettings(): DevToolsSettings {
    return {
      autoRefresh: true,
      refreshInterval: 5000,
      maxHistorySize: 100,
      persistOverrides: true,
      showNotifications: true,
      theme: 'auto',
      providers: []
    };
  }

  private loadPersistedState(): void {
    try {
      // Load overrides
      const persistedOverrides = this.storage.getItem('overrides');
      if (persistedOverrides && this.state.settings.persistOverrides) {
        persistedOverrides.forEach((override: FlagOverride) => {
          if (!override.expiresAt || new Date(override.expiresAt) > new Date()) {
            this.state.overrides.set(override.flagId, override);
          }
        });
      }

      // Load evaluation context
      const persistedContext = this.storage.getItem('evaluationContext');
      if (persistedContext) {
        this.state.currentContext = { ...this.state.currentContext, ...persistedContext };
      }

      // Load settings
      const persistedSettings = this.storage.getItem('settings');
      if (persistedSettings) {
        this.state.settings = { ...this.state.settings, ...persistedSettings };
      }

      // Load evaluation history
      const persistedHistory = this.storage.getItem('evaluationHistory');
      if (persistedHistory) {
        this.state.evaluationHistory = persistedHistory.slice(-this.state.settings.maxHistorySize);
      }

    } catch (error) {
      console.warn('Failed to load persisted feature flag state:', error);
    }
  }

  private persistState(): void {
    try {
      if (this.state.settings.persistOverrides) {
        this.storage.setItem('overrides', Array.from(this.state.overrides.values()));
      }
      this.storage.setItem('evaluationContext', this.state.currentContext);
      this.storage.setItem('settings', this.state.settings);
      this.storage.setItem('evaluationHistory', 
        this.state.evaluationHistory.slice(-this.state.settings.maxHistorySize)
      );
    } catch (error) {
      console.warn('Failed to persist feature flag state:', error);
    }
  }

  // State getters
  getState(): FeatureFlagDevToolsState {
    return this.state;
  }

  getFlags(): FeatureFlag[] {
    return Array.from(this.state.flags.values());
  }

  getFlag(id: string): FeatureFlag | null {
    return this.state.flags.get(id) || null;
  }

  getOverrides(): FlagOverride[] {
    return Array.from(this.state.overrides.values());
  }

  getOverride(flagId: string): FlagOverride | null {
    return this.state.overrides.get(flagId) || null;
  }

  getCurrentContext(): EvaluationContext {
    return this.state.currentContext;
  }

  getEvaluationHistory(): FlagEvaluation[] {
    return this.state.evaluationHistory;
  }

  // State mutations
  setFlags(flags: FeatureFlag[]): void {
    this.state.flags.clear();
    flags.forEach(flag => {
      this.state.flags.set(flag.id, flag);
    });
    this.emit('flags-updated', flags);
    this.emit('state-changed', this.state);
  }

  updateFlag(flag: FeatureFlag): void {
    this.state.flags.set(flag.id, flag);
    this.addEvent({
      id: generateId(),
      type: 'flag_updated',
      flagId: flag.id,
      timestamp: new Date(),
      data: { flag }
    });
    this.emit('flag-updated', flag);
    this.emit('state-changed', this.state);
  }

  setOverride(override: FlagOverride): void {
    this.state.overrides.set(override.flagId, override);
    this.addEvent({
      id: generateId(),
      type: 'override_applied',
      flagId: override.flagId,
      userId: override.userId,
      timestamp: new Date(),
      data: { override }
    });
    this.persistState();
    this.emit('override-set', override);
    this.emit('state-changed', this.state);
  }

  removeOverride(flagId: string): void {
    const override = this.state.overrides.get(flagId);
    if (override) {
      this.state.overrides.delete(flagId);
      this.addEvent({
        id: generateId(),
        type: 'override_applied',
        flagId: flagId,
        timestamp: new Date(),
        data: { removed: true }
      });
      this.persistState();
      this.emit('override-removed', flagId);
      this.emit('state-changed', this.state);
    }
  }

  clearAllOverrides(): void {
    const overrideIds = Array.from(this.state.overrides.keys());
    this.state.overrides.clear();
    this.persistState();
    this.emit('all-overrides-cleared', overrideIds);
    this.emit('state-changed', this.state);
  }

  setEvaluationContext(context: EvaluationContext): void {
    this.state.currentContext = { ...this.state.currentContext, ...context };
    this.persistState();
    this.emit('context-changed', this.state.currentContext);
    this.emit('state-changed', this.state);
  }

  addEvaluation(evaluation: FlagEvaluation): void {
    this.state.evaluationHistory.unshift(evaluation);
    
    // Keep only recent evaluations
    if (this.state.evaluationHistory.length > this.state.settings.maxHistorySize) {
      this.state.evaluationHistory = this.state.evaluationHistory.slice(0, this.state.settings.maxHistorySize);
    }

    this.addEvent({
      id: generateId(),
      type: 'flag_evaluated',
      flagId: evaluation.flagId,
      timestamp: new Date(),
      data: { evaluation }
    });

    this.persistState();
    this.emit('evaluation-added', evaluation);
    this.emit('state-changed', this.state);
  }

  private addEvent(event: FlagEvent): void {
    this.state.events.unshift(event);
    
    // Keep only recent events
    if (this.state.events.length > this.state.settings.maxHistorySize * 2) {
      this.state.events = this.state.events.slice(0, this.state.settings.maxHistorySize * 2);
    }
  }

  // UI state mutations
  setSelectedFlag(flagId: string | null): void {
    this.state.selectedFlag = flagId;
    this.emit('state-changed', this.state);
  }

  setFilterText(text: string): void {
    this.state.filterText = text;
    this.emit('state-changed', this.state);
  }

  setShowOnlyOverrides(show: boolean): void {
    this.state.showOnlyOverrides = show;
    this.emit('state-changed', this.state);
  }

  setSelectedEnvironment(environment: string): void {
    this.state.selectedEnvironment = environment;
    this.emit('state-changed', this.state);
  }

  updateSettings(settings: Partial<DevToolsSettings>): void {
    this.state.settings = { ...this.state.settings, ...settings };
    this.persistState();
    this.emit('settings-changed', this.state.settings);
    this.emit('state-changed', this.state);
  }

  // Experiments
  setExperiments(experiments: Experiment[]): void {
    this.state.experiments = experiments;
    this.emit('experiments-updated', experiments);
    this.emit('state-changed', this.state);
  }

  updateExperiment(experiment: Experiment): void {
    const index = this.state.experiments.findIndex(e => e.id === experiment.id);
    if (index >= 0) {
      this.state.experiments[index] = experiment;
    } else {
      this.state.experiments.push(experiment);
    }
    this.emit('experiment-updated', experiment);
    this.emit('state-changed', this.state);
  }

  // User segments
  setUserSegments(segments: UserSegment[]): void {
    this.state.userSegments = segments;
    this.emit('segments-updated', segments);
    this.emit('state-changed', this.state);
  }

  // Cleanup
  cleanup(): void {
    this.removeAllListeners();
  }
}