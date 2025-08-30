import type { 
  GraphQLSchema, 
  GraphQLField, 
  ValidationRule
} from 'graphql';

// Core GraphQL operation types
export interface GraphQLOperation {
  id: string;
  operationType: 'query' | 'mutation' | 'subscription';
  operationName?: string;
  query: string;
  variables?: Record<string, any>;
  timestamp: number;
  executionTime?: number;
  status: 'pending' | 'success' | 'error';
  response?: any;
  error?: string;
  networkInfo?: NetworkInfo;
}

export interface NetworkInfo {
  url: string;
  method: string;
  headers: Record<string, string>;
  requestSize: number;
  responseSize: number;
}

// Schema introspection types
export interface SchemaInfo {
  schema: GraphQLSchema | null;
  types: GraphQLTypeInfo[];
  queries: GraphQLField<any, any, any>[];
  mutations: GraphQLField<any, any, any>[];
  subscriptions: GraphQLField<any, any, any>[];
  introspectionQuery: string;
  lastUpdated: number;
}

export interface GraphQLTypeInfo {
  name: string;
  kind: string;
  description?: string;
  fields?: GraphQLFieldInfo[];
  enumValues?: GraphQLEnumValue[];
  inputFields?: GraphQLInputField[];
  possibleTypes?: GraphQLTypeInfo[];
  interfaces?: GraphQLTypeInfo[];
}

export interface GraphQLFieldInfo {
  name: string;
  description?: string;
  type: string;
  args: GraphQLArgument[];
  isDeprecated: boolean;
  deprecationReason?: string;
}

export interface GraphQLArgument {
  name: string;
  description?: string;
  type: string;
  defaultValue?: any;
}

export interface GraphQLEnumValue {
  name: string;
  description?: string;
  isDeprecated: boolean;
  deprecationReason?: string;
}

export interface GraphQLInputField {
  name: string;
  description?: string;
  type: string;
  defaultValue?: any;
}

// Query builder types
export interface QueryBuilderState {
  operationType: 'query' | 'mutation' | 'subscription';
  selectedFields: SelectedField[];
  variables: QueryVariable[];
  operationName?: string;
  generatedQuery: string;
  validationErrors: ValidationError[];
  isValid: boolean;
}

export interface SelectedField {
  fieldName: string;
  alias?: string;
  arguments: FieldArgument[];
  subFields: SelectedField[];
  parentType: string;
}

export interface FieldArgument {
  name: string;
  value: any;
  type: string;
  variableName?: string;
}

export interface QueryVariable {
  name: string;
  type: string;
  defaultValue?: any;
  required: boolean;
}

export interface ValidationError {
  message: string;
  line?: number;
  column?: number;
  severity: 'error' | 'warning';
}

// Performance monitoring types
export interface PerformanceMetrics {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  averageExecutionTime: number;
  slowestOperation: GraphQLOperation | null;
  fastestOperation: GraphQLOperation | null;
  operationsByType: {
    queries: number;
    mutations: number;
    subscriptions: number;
  };
  errorsByType: Record<string, number>;
  timeRangeMs: number;
}

// DevTools state management
export interface GraphQLDevToolsState {
  // Schema management
  schema: SchemaInfo;
  isLoadingSchema: boolean;
  schemaError?: string;
  
  // Operations tracking
  operations: GraphQLOperation[];
  maxOperations: number;
  
  // Query builder
  queryBuilder: QueryBuilderState;
  
  // Performance monitoring
  performance: PerformanceMetrics;
  
  // UI state
  ui: {
    activeTab: 'operations' | 'schema' | 'query-builder' | 'performance';
    selectedOperation?: string;
    selectedType?: string;
    isRecording: boolean;
    filters: {
      operationType?: 'query' | 'mutation' | 'subscription';
      status?: 'pending' | 'success' | 'error';
      timeRange?: number;
      searchTerm?: string;
    };
    showFilters: boolean;
    theme: 'light' | 'dark' | 'auto';
  };
  
  // Settings
  settings: {
    autoIntrospect: boolean;
    recordingEnabled: boolean;
    maxHistorySize: number;
    performanceTrackingEnabled: boolean;
    validationEnabled: boolean;
    prettifyQueries: boolean;
  };
}

// Actions for state management
export type GraphQLDevToolsAction =
  | { type: 'schema/load/start' }
  | { type: 'schema/load/success'; payload: SchemaInfo }
  | { type: 'schema/load/error'; payload: string }
  | { type: 'schema/introspect' }
  | { type: 'operations/add'; payload: GraphQLOperation }
  | { type: 'operations/update'; payload: { id: string; updates: Partial<GraphQLOperation> } }
  | { type: 'operations/clear' }
  | { type: 'operations/remove'; payload: string }
  | { type: 'query-builder/set-operation-type'; payload: 'query' | 'mutation' | 'subscription' }
  | { type: 'query-builder/add-field'; payload: SelectedField }
  | { type: 'query-builder/remove-field'; payload: string }
  | { type: 'query-builder/add-variable'; payload: QueryVariable }
  | { type: 'query-builder/remove-variable'; payload: string }
  | { type: 'query-builder/set-operation-name'; payload: string }
  | { type: 'query-builder/validate' }
  | { type: 'query-builder/generate-query' }
  | { type: 'query-builder/reset' }
  | { type: 'performance/update'; payload: Partial<PerformanceMetrics> }
  | { type: 'ui/tab/select'; payload: GraphQLDevToolsState['ui']['activeTab'] }
  | { type: 'ui/operation/select'; payload: string | undefined }
  | { type: 'ui/type/select'; payload: string | undefined }
  | { type: 'ui/recording/toggle' }
  | { type: 'ui/filters/toggle' }
  | { type: 'ui/filters/update'; payload: Partial<GraphQLDevToolsState['ui']['filters']> }
  | { type: 'ui/theme/set'; payload: 'light' | 'dark' | 'auto' }
  | { type: 'settings/update'; payload: Partial<GraphQLDevToolsState['settings']> };

// DevTools event types
export interface GraphQLDevToolsEvents {
  'graphql-devtools:state': GraphQLDevToolsState;
  'graphql-devtools:action': GraphQLDevToolsAction;
  'graphql-devtools:operation': GraphQLOperation;
  'graphql-devtools:schema-updated': SchemaInfo;
}

// Network interception types
export interface GraphQLRequest {
  url: string;
  method: string;
  headers: Record<string, string>;
  body: string;
  timestamp: number;
}

export interface GraphQLResponse {
  status: number;
  headers: Record<string, string>;
  body: string;
  timestamp: number;
}

// Configuration types
export interface GraphQLDevToolsConfig {
  endpoints: string[];
  autoDetectEndpoints: boolean;
  schemaIntrospectionEnabled: boolean;
  performanceTrackingEnabled: boolean;
  maxOperationHistory: number;
  validationRules: ValidationRule[];
  customScalars: Record<string, string>;
}