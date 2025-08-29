export type FlagType = 'boolean' | 'string' | 'number' | 'json' | 'multivariate';
export type FlagValue = boolean | string | number | Record<string, any> | null;
export type Environment = 'development' | 'staging' | 'production' | 'test' | string;

export interface FeatureFlag {
  id: string;
  name: string;
  description?: string;
  type: FlagType;
  value: FlagValue;
  enabled: boolean;
  tags?: string[];
  environments?: Environment[];
  dependencies?: FlagDependency[];
  targeting?: TargetingConfig;
  rollout?: RolloutConfig;
  variants?: FlagVariant[];
  metadata?: Record<string, any>;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface FlagDependency {
  flagId: string;
  condition: 'enabled' | 'disabled' | 'equals';
  value?: FlagValue;
}

export interface TargetingConfig {
  userSegments?: string[];
  rules?: TargetingRule[];
}

export interface TargetingRule {
  id: string;
  attribute: string;
  operator: 'equals' | 'not_equals' | 'in' | 'not_in' | 'greater_than' | 'less_than' | 'contains';
  values: (string | number)[];
  enabled: boolean;
}

export interface RolloutConfig {
  percentage: number;
  stickiness?: 'userId' | 'sessionId' | 'random';
  startDate?: Date;
  endDate?: Date;
}

export interface FlagVariant {
  id: string;
  name: string;
  value: FlagValue;
  weight: number;
  description?: string;
}

export interface EvaluationContext {
  userId?: string;
  sessionId?: string;
  userSegment?: string;
  environment?: Environment;
  attributes?: Record<string, any>;
  [key: string]: any;
}

export interface FlagEvaluation {
  flagId: string;
  value: FlagValue;
  variant?: FlagVariant;
  reason: EvaluationReason;
  metadata?: Record<string, any>;
}

export type EvaluationReason = 
  | 'default'
  | 'override'
  | 'targeting'
  | 'rollout'
  | 'dependency'
  | 'variant'
  | 'error';

export interface FlagOverride {
  flagId: string;
  value: FlagValue;
  variant?: string;
  userId?: string;
  reason?: string;
  expiresAt?: Date;
}

export interface UserSegment {
  id: string;
  name: string;
  description?: string;
  rules: SegmentRule[];
}

export interface SegmentRule {
  attribute: string;
  operator: string;
  values: any[];
}

export interface Experiment {
  id: string;
  name: string;
  description?: string;
  flagId: string;
  status: 'draft' | 'running' | 'paused' | 'completed';
  startDate?: Date;
  endDate?: Date;
  variants: ExperimentVariant[];
  metrics?: string[];
  allocation?: number;
}

export interface ExperimentVariant {
  id: string;
  name: string;
  flagVariantId: string;
  weight: number;
  isControl?: boolean;
}