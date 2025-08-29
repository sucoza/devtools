// Core exports
export { FeatureFlagManager } from './manager';
export { FlagEvaluator } from './evaluator';
export { LocalStorageAdapter, MemoryStorageAdapter } from './storage';

// Type exports
export type {
  // Flag types
  FeatureFlag,
  FlagType,
  FlagValue,
  FlagVariant,
  FlagDependency,
  FlagOverride,
  
  // Evaluation types
  EvaluationContext,
  FlagEvaluation,
  EvaluationReason,
  
  // Targeting types
  TargetingConfig,
  TargetingRule,
  UserSegment,
  SegmentRule,
  
  // Rollout types
  RolloutConfig,
  
  // Experiment types
  Experiment,
  ExperimentVariant,
  
  // Environment types
  Environment
} from './types';

// Storage interface
export type { StorageAdapter } from './storage';

// Manager options
export type { FeatureFlagManagerOptions } from './manager';
export type { EvaluatorOptions } from './evaluator';