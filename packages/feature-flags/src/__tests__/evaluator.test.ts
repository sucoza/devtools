import { describe, it, expect, beforeEach } from 'vitest';
import { FlagEvaluator } from '../evaluator';
import type { FeatureFlag, FlagOverride, UserSegment, EvaluationContext } from '../types';

describe('FlagEvaluator', () => {
  let flags: Map<string, FeatureFlag>;
  let overrides: Map<string, FlagOverride>;
  let userSegments: UserSegment[];
  let evaluator: FlagEvaluator;
  let context: EvaluationContext;

  beforeEach(() => {
    flags = new Map();
    overrides = new Map();
    userSegments = [];

    evaluator = new FlagEvaluator({
      getFlag: (id) => flags.get(id) || null,
      getOverride: (flagId) => overrides.get(flagId) || null,
      getUserSegments: () => userSegments
    });

    context = {
      userId: 'user-123',
      sessionId: 'session-456',
      environment: 'test',
      attributes: {}
    };
  });

  describe('Basic Evaluation', () => {
    it('should return error when flag does not exist', async () => {
      const result = await evaluator.evaluate('non-existent', context);

      expect(result.value).toBeNull();
      expect(result.reason).toBe('error');
      expect(result.metadata?.error).toBe('Flag not found');
    });

    it('should return flag value when enabled', async () => {
      flags.set('test-flag', {
        id: 'test-flag',
        name: 'Test Flag',
        description: 'Test description',
        type: 'boolean',
        value: true,
        enabled: true,
        environment: 'test',
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const result = await evaluator.evaluate('test-flag', context);

      expect(result.value).toBe(true);
      expect(result.reason).toBe('default');
      expect(result.metadata?.enabled).toBe(true);
    });

    it('should return default value when flag is disabled', async () => {
      flags.set('disabled-flag', {
        id: 'disabled-flag',
        name: 'Disabled Flag',
        description: 'Disabled',
        type: 'boolean',
        value: true,
        enabled: false,
        environment: 'test',
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const result = await evaluator.evaluate('disabled-flag', context);

      expect(result.value).toBe(false);
      expect(result.reason).toBe('default');
    });
  });

  describe('Override Evaluation', () => {
    it('should prioritize override over flag value', async () => {
      flags.set('test-flag', {
        id: 'test-flag',
        name: 'Test Flag',
        description: 'Test',
        type: 'boolean',
        value: true,
        enabled: true,
        environment: 'test',
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date()
      });

      overrides.set('test-flag', {
        flagId: 'test-flag',
        value: false,
        reason: 'Testing override',
        userId: 'user-123'
      });

      const result = await evaluator.evaluate('test-flag', context);

      expect(result.value).toBe(false);
      expect(result.reason).toBe('override');
    });

    it('should use variant from override', async () => {
      flags.set('multi-flag', {
        id: 'multi-flag',
        name: 'Multi Flag',
        description: 'Multi variant',
        type: 'multivariate',
        enabled: true,
        environment: 'test',
        tags: [],
        variants: [
          { id: 'control', name: 'Control', value: 'A', weight: 50 },
          { id: 'treatment', name: 'Treatment', value: 'B', weight: 50 }
        ],
        createdAt: new Date(),
        updatedAt: new Date()
      });

      overrides.set('multi-flag', {
        flagId: 'multi-flag',
        value: 'B',
        variant: 'treatment',
        reason: 'Testing variant override',
        userId: 'user-123'
      });

      const result = await evaluator.evaluate('multi-flag', context);

      expect(result.value).toBe('B');
      expect(result.variant?.id).toBe('treatment');
      expect(result.reason).toBe('override');
    });
  });

  describe('Rollout Evaluation', () => {
    it('should respect percentage rollout with userId stickiness', async () => {
      flags.set('rollout-flag', {
        id: 'rollout-flag',
        name: 'Rollout Flag',
        description: 'Rollout test',
        type: 'boolean',
        value: true,
        enabled: true,
        environment: 'test',
        tags: [],
        rollout: {
          percentage: 100, // 100% should always include
          stickiness: 'userId'
        },
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const result = await evaluator.evaluate('rollout-flag', context);
      expect(result.reason).toBe('default'); // Passed rollout check
    });

    it('should exclude user when rollout percentage is 0', async () => {
      flags.set('rollout-flag', {
        id: 'rollout-flag',
        name: 'Rollout Flag',
        description: 'Rollout test',
        type: 'boolean',
        value: true,
        enabled: true,
        environment: 'test',
        tags: [],
        rollout: {
          percentage: 0,
          stickiness: 'userId'
        },
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const result = await evaluator.evaluate('rollout-flag', context);
      expect(result.reason).toBe('rollout');
      expect(result.value).toBe(false); // Default value for disabled
    });

    it('should use sessionId for stickiness when specified', async () => {
      flags.set('session-rollout', {
        id: 'session-rollout',
        name: 'Session Rollout',
        description: 'Session based rollout',
        type: 'boolean',
        value: true,
        enabled: true,
        environment: 'test',
        tags: [],
        rollout: {
          percentage: 100,
          stickiness: 'sessionId'
        },
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const result = await evaluator.evaluate('session-rollout', context);
      expect(result.reason).toBe('default');
    });
  });

  describe('Targeting Evaluation', () => {
    it('should match user segment', async () => {
      userSegments.push({
        id: 'premium-users',
        name: 'Premium Users',
        rules: [
          {
            attribute: 'attributes.plan',
            operator: 'equals',
            values: ['premium']
          }
        ]
      });

      flags.set('premium-flag', {
        id: 'premium-flag',
        name: 'Premium Flag',
        description: 'Premium only',
        type: 'boolean',
        value: true,
        enabled: true,
        environment: 'test',
        tags: [],
        targeting: {
          userSegments: ['premium-users']
        },
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const premiumContext = {
        ...context,
        attributes: { plan: 'premium' }
      };

      const result = await evaluator.evaluate('premium-flag', premiumContext);
      expect(result.value).toBe(true);
      expect(result.reason).toBe('default');
    });

    it('should reject user not in segment', async () => {
      userSegments.push({
        id: 'premium-users',
        name: 'Premium Users',
        rules: [
          {
            attribute: 'attributes.plan',
            operator: 'equals',
            values: ['premium']
          }
        ]
      });

      flags.set('premium-flag', {
        id: 'premium-flag',
        name: 'Premium Flag',
        description: 'Premium only',
        type: 'boolean',
        value: true,
        enabled: true,
        environment: 'test',
        tags: [],
        targeting: {
          userSegments: ['premium-users']
        },
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const freeContext = {
        ...context,
        attributes: { plan: 'free' }
      };

      const result = await evaluator.evaluate('premium-flag', freeContext);
      expect(result.reason).toBe('targeting');
      expect(result.value).toBe(false);
    });

    it('should evaluate targeting rules with operators', async () => {
      flags.set('region-flag', {
        id: 'region-flag',
        name: 'Region Flag',
        description: 'Region targeting',
        type: 'boolean',
        value: true,
        enabled: true,
        environment: 'test',
        tags: [],
        targeting: {
          rules: [
            {
              id: 'region-rule',
              attribute: 'attributes.region',
              operator: 'in',
              values: ['us-east', 'us-west'],
              enabled: true
            }
          ]
        },
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const usContext = {
        ...context,
        attributes: { region: 'us-east' }
      };

      const result = await evaluator.evaluate('region-flag', usContext);
      expect(result.value).toBe(true);
    });
  });

  describe('Dependency Evaluation', () => {
    it('should evaluate flag dependencies', async () => {
      flags.set('parent-flag', {
        id: 'parent-flag',
        name: 'Parent Flag',
        description: 'Parent',
        type: 'boolean',
        value: true,
        enabled: true,
        environment: 'test',
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date()
      });

      flags.set('child-flag', {
        id: 'child-flag',
        name: 'Child Flag',
        description: 'Depends on parent',
        type: 'boolean',
        value: true,
        enabled: true,
        environment: 'test',
        tags: [],
        dependencies: [
          {
            flagId: 'parent-flag',
            condition: 'enabled'
          }
        ],
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const result = await evaluator.evaluate('child-flag', context);
      expect(result.value).toBe(true);
    });

    it('should fail when dependency is not satisfied', async () => {
      flags.set('parent-flag', {
        id: 'parent-flag',
        name: 'Parent Flag',
        description: 'Parent',
        type: 'boolean',
        value: false,
        enabled: false,
        environment: 'test',
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date()
      });

      flags.set('child-flag', {
        id: 'child-flag',
        name: 'Child Flag',
        description: 'Depends on parent',
        type: 'boolean',
        value: true,
        enabled: true,
        environment: 'test',
        tags: [],
        dependencies: [
          {
            flagId: 'parent-flag',
            condition: 'enabled'
          }
        ],
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const result = await evaluator.evaluate('child-flag', context);
      expect(result.reason).toBe('dependency');
      expect(result.value).toBe(false);
      expect(result.metadata?.failedDependency).toBe('parent-flag');
    });
  });

  describe('Multivariate Flags', () => {
    it('should select variant based on weight distribution', async () => {
      flags.set('ab-test', {
        id: 'ab-test',
        name: 'AB Test',
        description: 'AB test',
        type: 'multivariate',
        enabled: true,
        environment: 'test',
        tags: [],
        variants: [
          { id: 'control', name: 'Control', value: 'A', weight: 50 },
          { id: 'treatment', name: 'Treatment', value: 'B', weight: 50 }
        ],
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const result = await evaluator.evaluate('ab-test', context);

      expect(result.variant).toBeDefined();
      expect(['A', 'B']).toContain(result.value);
      expect(result.reason).toBe('variant');
    });

    it('should maintain consistent variant selection for same user', async () => {
      flags.set('ab-test', {
        id: 'ab-test',
        name: 'AB Test',
        description: 'AB test',
        type: 'multivariate',
        enabled: true,
        environment: 'test',
        tags: [],
        variants: [
          { id: 'control', name: 'Control', value: 'A', weight: 50 },
          { id: 'treatment', name: 'Treatment', value: 'B', weight: 50 }
        ],
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const result1 = await evaluator.evaluate('ab-test', context);
      const result2 = await evaluator.evaluate('ab-test', context);

      expect(result1.variant?.id).toBe(result2.variant?.id);
      expect(result1.value).toBe(result2.value);
    });
  });
});
