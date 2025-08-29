import type { 
  FeatureFlag, 
  FlagOverride, 
  UserSegment, 
  Experiment, 
  EvaluationContext, 
  FlagEvaluation,
  FlagEvent 
} from './feature-flags';

// DevTools-specific types
export interface FeatureFlagDevToolsState {
  // Flag management
  flags: Map<string, FeatureFlag>;
  overrides: Map<string, FlagOverride>;
  
  // User simulation
  currentContext: EvaluationContext;
  userSegments: UserSegment[];
  
  // Experiments
  experiments: Experiment[];
  
  // History and monitoring
  evaluationHistory: FlagEvaluation[];
  events: FlagEvent[];
  
  // UI state
  selectedFlag: string | null;
  filterText: string;
  showOnlyOverrides: boolean;
  selectedEnvironment: string;
  
  // Settings
  settings: DevToolsSettings;
}

export interface DevToolsSettings {
  autoRefresh: boolean;
  refreshInterval: number; // ms
  maxHistorySize: number;
  persistOverrides: boolean;
  showNotifications: boolean;
  theme: 'light' | 'dark' | 'auto';
  providers: ProviderSettings[];
}

export interface ProviderSettings {
  name: string;
  type: 'launchdarkly' | 'splitio' | 'optimizely' | 'custom';
  enabled: boolean;
  config: Record<string, any>;
}

// DevTools client interface
export interface FeatureFlagDevToolsClient {
  // Core flag operations
  getFlags(): Promise<FeatureFlag[]>;
  getFlag(id: string): Promise<FeatureFlag | null>;
  evaluateFlag(id: string, context?: EvaluationContext): Promise<FlagEvaluation>;
  
  // Override management
  setOverride(override: FlagOverride): Promise<void>;
  removeOverride(flagId: string): Promise<void>;
  clearAllOverrides(): Promise<void>;
  
  // Context management
  setEvaluationContext(context: EvaluationContext): Promise<void>;
  
  // History and events
  getEvaluationHistory(): Promise<FlagEvaluation[]>;
  getEvents(limit?: number): Promise<FlagEvent[]>;
  
  // Subscriptions
  subscribe(callback: (state: FeatureFlagDevToolsState) => void): () => void;
  
  // Provider integration
  addProvider(provider: ProviderSettings): Promise<void>;
  removeProvider(name: string): Promise<void>;
}

// Event types for DevTools communication
export interface DevToolsMessage {
  type: DevToolsMessageType;
  payload: any;
  timestamp: number;
  id: string;
}

export type DevToolsMessageType =
  | 'GET_FLAGS'
  | 'SET_OVERRIDE'
  | 'REMOVE_OVERRIDE'
  | 'SET_CONTEXT'
  | 'EVALUATE_FLAG'
  | 'SUBSCRIBE'
  | 'UNSUBSCRIBE'
  | 'STATE_UPDATE'
  | 'PROVIDER_ADD'
  | 'PROVIDER_REMOVE';

// Panel tab types
export type PanelTab = 
  | 'dashboard'
  | 'flags'
  | 'overrides' 
  | 'experiments'
  | 'segments'
  | 'history'
  | 'settings';

// Filter and sort options
export interface FilterOptions {
  text: string;
  environment: string;
  status: 'all' | 'enabled' | 'disabled' | 'overridden';
  tags: string[];
  flagType: 'all' | 'boolean' | 'string' | 'number' | 'json' | 'multivariate';
}

export interface SortOptions {
  field: 'name' | 'updatedAt' | 'type' | 'environment';
  direction: 'asc' | 'desc';
}

// Component props types
export interface FeatureFlagManagerProps {
  client: FeatureFlagDevToolsClient;
  theme?: 'light' | 'dark' | 'auto';
  defaultTab?: PanelTab;
  height?: number;
}

export interface FlagListItemProps {
  flag: FeatureFlag;
  override?: FlagOverride;
  evaluation?: FlagEvaluation;
  onToggle: (flagId: string, enabled: boolean) => void;
  onOverride: (override: FlagOverride) => void;
  onRemoveOverride: (flagId: string) => void;
  onSelect: (flagId: string) => void;
  isSelected: boolean;
}

export interface OverrideControlProps {
  flag: FeatureFlag;
  override?: FlagOverride;
  onApply: (override: FlagOverride) => void;
  onRemove: (flagId: string) => void;
}

export interface UserContextProps {
  context: EvaluationContext;
  segments: UserSegment[];
  onChange: (context: EvaluationContext) => void;
}

export interface ExperimentViewProps {
  experiments: Experiment[];
  onStartExperiment: (experimentId: string) => void;
  onStopExperiment: (experimentId: string) => void;
  onViewMetrics: (experimentId: string) => void;
}