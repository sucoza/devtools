import {
  FeatureFlag,
  EvaluationContext,
  FlagEvaluation,
  FlagValue,
  FlagVariant,
  TargetingRule,
  UserSegment,
  FlagOverride
} from './types';

export interface EvaluatorOptions {
  getFlag: (id: string) => FeatureFlag | null;
  getOverride?: (flagId: string) => FlagOverride | null;
  getUserSegments?: () => UserSegment[];
}

export class FlagEvaluator {
  constructor(private options: EvaluatorOptions) {}

  async evaluate(flagId: string, context: EvaluationContext): Promise<FlagEvaluation> {
    const flag = this.options.getFlag(flagId);
    if (!flag) {
      return {
        flagId,
        value: null,
        reason: 'error',
        metadata: { error: 'Flag not found' }
      };
    }

    // Check for override first
    if (this.options.getOverride) {
      const override = this.options.getOverride(flagId);
      if (override) {
        return {
          flagId,
          value: override.value,
          variant: override.variant ? this.findVariant(flag, override.variant) : undefined,
          reason: 'override',
          metadata: { override }
        };
      }
    }

    // Check dependencies
    if (flag.dependencies && flag.dependencies.length > 0) {
      const dependencyResult = await this.evaluateDependencies(flag, context);
      if (!dependencyResult.satisfied) {
        return {
          flagId,
          value: this.getDefaultValue(flag),
          reason: 'dependency',
          metadata: { failedDependency: dependencyResult.failedDependency }
        };
      }
    }

    // Check targeting rules
    if (flag.targeting) {
      const targetingResult = this.evaluateTargeting(flag, context);
      if (!targetingResult.matched) {
        return {
          flagId,
          value: this.getDefaultValue(flag),
          reason: 'targeting',
          metadata: { targeting: 'not matched' }
        };
      }
    }

    // Check rollout percentage
    if (flag.rollout && flag.rollout.percentage < 100) {
      const rolloutResult = this.evaluateRollout(flag, context);
      if (!rolloutResult.included) {
        return {
          flagId,
          value: this.getDefaultValue(flag),
          reason: 'rollout',
          metadata: { rollout: rolloutResult }
        };
      }
    }

    // Evaluate variants for multivariate flags
    if (flag.variants && flag.variants.length > 0) {
      const variant = this.selectVariant(flag, context);
      return {
        flagId,
        value: variant.value,
        variant,
        reason: 'variant',
        metadata: { selectedVariant: variant.id }
      };
    }

    // Return the flag's default value
    return {
      flagId,
      value: flag.enabled ? flag.value : this.getDefaultValue(flag),
      reason: 'default',
      metadata: { enabled: flag.enabled }
    };
  }

  private async evaluateDependencies(
    flag: FeatureFlag, 
    context: EvaluationContext
  ): Promise<{ satisfied: boolean; failedDependency?: string }> {
    if (!flag.dependencies) return { satisfied: true };

    for (const dependency of flag.dependencies) {
      const dependentFlag = this.options.getFlag(dependency.flagId);
      if (!dependentFlag) {
        return { satisfied: false, failedDependency: dependency.flagId };
      }

      const dependentEvaluation = await this.evaluate(dependency.flagId, context);
      
      switch (dependency.condition) {
        case 'enabled':
          if (!dependentFlag.enabled) {
            return { satisfied: false, failedDependency: dependency.flagId };
          }
          break;
        case 'disabled':
          if (dependentFlag.enabled) {
            return { satisfied: false, failedDependency: dependency.flagId };
          }
          break;
        case 'equals':
          if (dependentEvaluation.value !== dependency.value) {
            return { satisfied: false, failedDependency: dependency.flagId };
          }
          break;
      }
    }

    return { satisfied: true };
  }

  private evaluateTargeting(
    flag: FeatureFlag, 
    context: EvaluationContext
  ): { matched: boolean; reason?: string } {
    if (!flag.targeting) return { matched: true };

    // Check user segments
    if (flag.targeting.userSegments && flag.targeting.userSegments.length > 0) {
      const userSegments = this.options.getUserSegments ? this.options.getUserSegments() : [];
      const userSegment = context.userSegment;
      
      if (!userSegment || !flag.targeting.userSegments.includes(userSegment)) {
        // Check if user matches any segment rules
        const matchedSegment = userSegments.find(segment => 
          flag.targeting!.userSegments!.includes(segment.id) &&
          this.matchesSegmentRules(segment, context)
        );
        
        if (!matchedSegment) {
          return { matched: false, reason: 'user segment not matched' };
        }
      }
    }

    // Check targeting rules
    if (flag.targeting.rules && flag.targeting.rules.length > 0) {
      const matchedRule = flag.targeting.rules.find(rule => 
        rule.enabled && this.matchesTargetingRule(rule, context)
      );
      
      if (!matchedRule) {
        return { matched: false, reason: 'targeting rules not matched' };
      }
    }

    return { matched: true };
  }

  private matchesSegmentRules(segment: UserSegment, context: EvaluationContext): boolean {
    if (!segment.rules || segment.rules.length === 0) return true;

    return segment.rules.every(rule => {
      const contextValue = this.getContextValue(context, rule.attribute);
      return this.evaluateRuleCondition(contextValue, rule.operator, rule.values);
    });
  }

  private matchesTargetingRule(rule: TargetingRule, context: EvaluationContext): boolean {
    const contextValue = this.getContextValue(context, rule.attribute);
    return this.evaluateRuleCondition(contextValue, rule.operator, rule.values);
  }

  private evaluateRuleCondition(
    contextValue: any, 
    operator: string, 
    ruleValues: (string | number)[]
  ): boolean {
    switch (operator) {
      case 'equals':
        return ruleValues.includes(contextValue);
      case 'not_equals':
        return !ruleValues.includes(contextValue);
      case 'in':
        return Array.isArray(contextValue) 
          ? contextValue.some(v => ruleValues.includes(v))
          : ruleValues.includes(contextValue);
      case 'not_in':
        return Array.isArray(contextValue)
          ? !contextValue.some(v => ruleValues.includes(v))
          : !ruleValues.includes(contextValue);
      case 'greater_than':
        return typeof contextValue === 'number' && 
               ruleValues.some(v => typeof v === 'number' && contextValue > v);
      case 'less_than':
        return typeof contextValue === 'number' && 
               ruleValues.some(v => typeof v === 'number' && contextValue < v);
      case 'contains':
        return typeof contextValue === 'string' && 
               ruleValues.some(v => typeof v === 'string' && contextValue.includes(v));
      default:
        return false;
    }
  }

  private getContextValue(context: EvaluationContext, attribute: string): any {
    // Handle nested attributes with dot notation
    const parts = attribute.split('.');
    let value: any = context;
    
    for (const part of parts) {
      if (value && typeof value === 'object') {
        value = value[part];
      } else {
        return undefined;
      }
    }
    
    return value;
  }

  private evaluateRollout(
    flag: FeatureFlag, 
    context: EvaluationContext
  ): { included: boolean; hash?: string; percentage?: number } {
    if (!flag.rollout) return { included: true };

    // Generate a consistent hash based on stickiness
    let stickinessValue: string;
    switch (flag.rollout.stickiness) {
      case 'userId':
        stickinessValue = context.userId || 'anonymous';
        break;
      case 'sessionId':
        stickinessValue = context.sessionId || 'no-session';
        break;
      default:
        stickinessValue = Math.random().toString();
    }

    const hash = this.hashString(flag.id + stickinessValue);
    const percentage = (hash % 100) + 1; // 1-100
    
    return {
      included: percentage <= flag.rollout.percentage,
      hash: hash.toString(),
      percentage
    };
  }

  private selectVariant(flag: FeatureFlag, context: EvaluationContext): FlagVariant {
    if (!flag.variants || flag.variants.length === 0) {
      throw new Error('No variants available for multivariate flag');
    }

    // Generate consistent hash for variant selection
    const stickinessValue = context.userId || context.sessionId || 'anonymous';
    const hash = this.hashString(flag.id + stickinessValue);
    const percentage = hash % 100;
    
    // Select variant based on cumulative weights
    let cumulativeWeight = 0;
    for (const variant of flag.variants) {
      cumulativeWeight += variant.weight;
      if (percentage < cumulativeWeight) {
        return variant;
      }
    }
    
    // Fallback to first variant
    return flag.variants[0];
  }

  private findVariant(flag: FeatureFlag, variantId: string): FlagVariant | undefined {
    return flag.variants?.find(v => v.id === variantId);
  }

  private getDefaultValue(flag: FeatureFlag): FlagValue {
    switch (flag.type) {
      case 'boolean':
        return false;
      case 'string':
        return '';
      case 'number':
        return 0;
      case 'json':
        return {};
      case 'multivariate':
        return flag.variants?.[0]?.value || null;
      default:
        return null;
    }
  }

  private hashString(str: string): number {
    let hash = 0;
    if (str.length === 0) return hash;
    
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return Math.abs(hash);
  }
}