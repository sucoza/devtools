// Core feature flag types
export interface FeatureFlag {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  type: FlagType;
  value: FlagValue;
  environment: Environment;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  
  // A/B testing
  variants?: FlagVariant[];
  
  // Rollout settings
  rollout?: RolloutConfig;
  
  // Dependencies
  dependencies?: FlagDependency[];
  
  // User targeting
  targeting?: TargetingRules;
  
  // Provider-specific metadata
  providerMetadata?: Record<string, any>;
}

export type FlagType = 'boolean' | 'string' | 'number' | 'json' | 'multivariate';

export type FlagValue = boolean | string | number | object | null;

export interface FlagVariant {
  id: string;
  name: string;
  value: FlagValue;
  weight: number; // Percentage allocation (0-100)
  description?: string;
}

export interface RolloutConfig {
  percentage: number; // 0-100
  stickiness?: 'userId' | 'sessionId' | 'random';
  attributes?: string[]; // User attributes to consider
}

export interface FlagDependency {
  flagId: string;
  condition: 'enabled' | 'disabled' | 'equals';
  value?: FlagValue;
}

export interface TargetingRules {
  userSegments?: string[];
  rules?: TargetingRule[];
}

export interface TargetingRule {
  id: string;
  attribute: string;
  operator: 'equals' | 'not_equals' | 'in' | 'not_in' | 'greater_than' | 'less_than' | 'contains';
  values: (string | number | boolean)[];
  enabled: boolean;
}

export type Environment = 'development' | 'staging' | 'production' | 'test';

// Flag evaluation context
export interface EvaluationContext {
  userId?: string;
  sessionId?: string;
  userSegment?: string;
  attributes?: Record<string, any>;
  environment?: Environment;
}

// Flag evaluation result
export interface FlagEvaluation {
  flagId: string;
  value: FlagValue;
  variant?: FlagVariant;
  reason: EvaluationReason;
  metadata?: Record<string, any>;
}

export type EvaluationReason = 
  | 'default'
  | 'targeting'
  | 'rollout'
  | 'variant'
  | 'override'
  | 'dependency'
  | 'error';

// Override management
export interface FlagOverride {
  flagId: string;
  value: FlagValue;
  variant?: string;
  reason: string;
  expiresAt?: Date;
  userId?: string;
}

// User segments
export interface UserSegment {
  id: string;
  name: string;
  description: string;
  rules: SegmentRule[];
  userCount?: number;
}

export interface SegmentRule {
  attribute: string;
  operator: 'equals' | 'not_equals' | 'in' | 'not_in' | 'greater_than' | 'less_than' | 'contains';
  values: (string | number | boolean)[];
}

// Experiment tracking
export interface Experiment {
  id: string;
  name: string;
  description: string;
  flagId: string;
  variants: ExperimentVariant[];
  status: 'draft' | 'running' | 'paused' | 'completed';
  startDate?: Date;
  endDate?: Date;
  metrics: ExperimentMetric[];
}

export interface ExperimentVariant {
  id: string;
  name: string;
  allocation: number; // Percentage
  conversions: number;
  exposures: number;
}

export interface ExperimentMetric {
  id: string;
  name: string;
  type: 'conversion' | 'revenue' | 'engagement';
  value: number;
  variance?: number;
  significance?: number;
}

// Provider integration types
export interface FlagProvider {
  name: string;
  type: 'launchdarkly' | 'splitio' | 'optimizely' | 'custom';
  config: ProviderConfig;
  client?: any;
}

export interface ProviderConfig {
  apiKey?: string;
  clientId?: string;
  environmentId?: string;
  baseUrl?: string;
  timeout?: number;
  [key: string]: any;
}

// Event types for tracking changes
export interface FlagEvent {
  id: string;
  type: FlagEventType;
  flagId: string;
  userId?: string;
  timestamp: Date;
  data: Record<string, any>;
}

export type FlagEventType = 
  | 'flag_created'
  | 'flag_updated' 
  | 'flag_deleted'
  | 'flag_evaluated'
  | 'override_applied'
  | 'experiment_started'
  | 'experiment_ended';