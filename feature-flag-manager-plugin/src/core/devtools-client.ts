import { 
  FeatureFlag, 
  FlagOverride, 
  UserSegment, 
  Experiment, 
  EvaluationContext, 
  FlagEvaluation,
  FlagEvent,
  FeatureFlagDevToolsState,
  FeatureFlagDevToolsClient,
  ProviderSettings,
  FlagValue
} from '../types';
import { FeatureFlagDevToolsStore } from './devtools-store';
import { FlagEvaluator } from './flag-evaluator';
import { ProviderManager } from './provider-manager';
import { generateId } from '../utils/id-generator';

export class FeatureFlagDevToolsClientImpl implements FeatureFlagDevToolsClient {
  private store: FeatureFlagDevToolsStore;
  private evaluator: FlagEvaluator;
  private providerManager: ProviderManager;
  private subscribers: Map<string, (state: FeatureFlagDevToolsState) => void> = new Map();

  constructor() {
    this.store = new FeatureFlagDevToolsStore();
    this.evaluator = new FlagEvaluator(this.store);
    this.providerManager = new ProviderManager(this.store);

    // Set up store event listeners
    this.store.on('state-changed', (state) => {
      this.notifySubscribers(state);
    });

    // Initialize with sample data for demo
    this.initializeSampleData();
  }

  private initializeSampleData(): void {
    const sampleFlags: FeatureFlag[] = [
      {
        id: 'new-header-design',
        name: 'New Header Design',
        description: 'Enable the new header design with improved navigation',
        enabled: true,
        type: 'boolean',
        value: true,
        environment: 'development',
        tags: ['ui', 'header', 'navigation'],
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-20'),
        rollout: {
          percentage: 50,
          stickiness: 'userId'
        }
      },
      {
        id: 'payment-methods',
        name: 'New Payment Methods',
        description: 'Enable support for additional payment methods (Apple Pay, Google Pay)',
        enabled: false,
        type: 'multivariate',
        value: 'disabled',
        environment: 'development',
        tags: ['payment', 'checkout', 'mobile'],
        createdAt: new Date('2024-01-10'),
        updatedAt: new Date('2024-01-18'),
        variants: [
          { id: 'control', name: 'Control (Credit Card Only)', value: 'control', weight: 50 },
          { id: 'apple-pay', name: 'Apple Pay Enabled', value: 'apple-pay', weight: 25 },
          { id: 'all-methods', name: 'All Payment Methods', value: 'all-methods', weight: 25 }
        ]
      },
      {
        id: 'dark-mode',
        name: 'Dark Mode',
        description: 'Enable dark mode theme option',
        enabled: true,
        type: 'boolean',
        value: true,
        environment: 'development',
        tags: ['theme', 'ui', 'accessibility'],
        createdAt: new Date('2024-01-12'),
        updatedAt: new Date('2024-01-19'),
        targeting: {
          userSegments: ['beta-users', 'premium-users']
        }
      },
      {
        id: 'api-rate-limit',
        name: 'API Rate Limit',
        description: 'Set API rate limit per user',
        enabled: true,
        type: 'number',
        value: 1000,
        environment: 'development',
        tags: ['api', 'performance', 'backend'],
        createdAt: new Date('2024-01-08'),
        updatedAt: new Date('2024-01-22'),
        dependencies: [
          { flagId: 'premium-features', condition: 'enabled' }
        ]
      },
      {
        id: 'premium-features',
        name: 'Premium Features',
        description: 'Enable premium features for paying customers',
        enabled: true,
        type: 'boolean',
        value: true,
        environment: 'development',
        tags: ['premium', 'monetization'],
        createdAt: new Date('2024-01-05'),
        updatedAt: new Date('2024-01-21'),
        targeting: {
          userSegments: ['premium-users']
        }
      },
      {
        id: 'experimental-search',
        name: 'Experimental Search',
        description: 'New search algorithm with AI-powered suggestions',
        enabled: false,
        type: 'string',
        value: 'disabled',
        environment: 'development',
        tags: ['search', 'ai', 'experimental'],
        createdAt: new Date('2024-01-25'),
        updatedAt: new Date('2024-01-25'),
        rollout: {
          percentage: 10,
          stickiness: 'sessionId'
        }
      }
    ];

    this.store.setFlags(sampleFlags);

    // Add sample experiments
    const sampleExperiments: Experiment[] = [
      {
        id: 'header-redesign-test',
        name: 'Header Redesign A/B Test',
        description: 'Testing new header design impact on user engagement',
        flagId: 'new-header-design',
        status: 'running',
        startDate: new Date('2024-01-20'),
        variants: [
          { id: 'control', name: 'Original Header', allocation: 50, conversions: 120, exposures: 1000 },
          { id: 'treatment', name: 'New Header', allocation: 50, conversions: 145, exposures: 980 }
        ],
        metrics: [
          { id: 'click-through-rate', name: 'Click Through Rate', type: 'conversion', value: 0.142, significance: 0.85 },
          { id: 'bounce-rate', name: 'Bounce Rate', type: 'engagement', value: 0.23, variance: 0.05 }
        ]
      }
    ];

    this.store.setExperiments(sampleExperiments);
  }

  private notifySubscribers(state: FeatureFlagDevToolsState): void {
    this.subscribers.forEach(callback => {
      try {
        callback(state);
      } catch (error) {
        console.error('Error notifying subscriber:', error);
      }
    });
  }

  // Core flag operations
  async getFlags(): Promise<FeatureFlag[]> {
    // In a real implementation, this might fetch from a remote service
    return this.store.getFlags();
  }

  async getFlag(id: string): Promise<FeatureFlag | null> {
    return this.store.getFlag(id);
  }

  async evaluateFlag(id: string, context?: EvaluationContext): Promise<FlagEvaluation> {
    const evaluationContext = context || this.store.getCurrentContext();
    const evaluation = await this.evaluator.evaluate(id, evaluationContext);
    
    // Record the evaluation
    this.store.addEvaluation(evaluation);
    
    return evaluation;
  }

  // Override management
  async setOverride(override: FlagOverride): Promise<void> {
    this.store.setOverride(override);
  }

  async removeOverride(flagId: string): Promise<void> {
    this.store.removeOverride(flagId);
  }

  async clearAllOverrides(): Promise<void> {
    this.store.clearAllOverrides();
  }

  // Context management
  async setEvaluationContext(context: EvaluationContext): Promise<void> {
    this.store.setEvaluationContext(context);
  }

  // History and events
  async getEvaluationHistory(): Promise<FlagEvaluation[]> {
    return this.store.getEvaluationHistory();
  }

  async getEvents(limit?: number): Promise<FlagEvent[]> {
    const events = this.store.getState().events;
    return limit ? events.slice(0, limit) : events;
  }

  // Subscriptions
  subscribe(callback: (state: FeatureFlagDevToolsState) => void): () => void {
    const id = generateId();
    this.subscribers.set(id, callback);
    
    // Call immediately with current state
    callback(this.store.getState());
    
    // Return unsubscribe function
    return () => {
      this.subscribers.delete(id);
    };
  }

  // Provider integration
  async addProvider(provider: ProviderSettings): Promise<void> {
    return this.providerManager.addProvider(provider);
  }

  async removeProvider(name: string): Promise<void> {
    return this.providerManager.removeProvider(name);
  }

  // Additional utility methods
  getState(): FeatureFlagDevToolsState {
    return this.store.getState();
  }

  async refreshFlags(): Promise<void> {
    // In a real implementation, this would refresh from providers
    await this.providerManager.refreshAllProviders();
  }

  async toggleFlag(flagId: string): Promise<void> {
    const flag = this.store.getFlag(flagId);
    if (flag && flag.type === 'boolean') {
      const override: FlagOverride = {
        flagId,
        value: !flag.enabled,
        reason: 'Manual toggle from DevTools',
        userId: this.store.getCurrentContext().userId
      };
      await this.setOverride(override);
    }
  }

  async setFlagVariant(flagId: string, variantId: string): Promise<void> {
    const flag = this.store.getFlag(flagId);
    if (flag && flag.variants) {
      const variant = flag.variants.find(v => v.id === variantId);
      if (variant) {
        const override: FlagOverride = {
          flagId,
          value: variant.value,
          variant: variantId,
          reason: 'Variant override from DevTools',
          userId: this.store.getCurrentContext().userId
        };
        await this.setOverride(override);
      }
    }
  }

  // Cleanup
  cleanup(): void {
    this.subscribers.clear();
    this.store.cleanup();
    this.providerManager.cleanup();
  }
}

// Factory function for creating client instances
export function createFeatureFlagDevToolsClient(): FeatureFlagDevToolsClient {
  return new FeatureFlagDevToolsClientImpl();
}