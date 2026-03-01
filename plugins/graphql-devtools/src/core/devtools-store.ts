import { useSyncExternalStore } from 'use-sync-external-store/shim';
import type { 
  GraphQLDevToolsState,
  GraphQLDevToolsAction,
  GraphQLOperation,
  QueryBuilderState,
  PerformanceMetrics,
  ValidationError
} from '../types';
import { SchemaManager } from './schema-manager';
import { GraphQLInterceptor } from './graphql-interceptor';
import { validateGraphQLQuery, generateQueryFromBuilder } from '../utils/graphql-parser';

/**
 * Initial state for the DevTools
 */
const initialState: GraphQLDevToolsState = {
  schema: {
    schema: null,
    types: [],
    queries: [],
    mutations: [],
    subscriptions: [],
    introspectionQuery: '',
    lastUpdated: 0
  },
  isLoadingSchema: false,
  operations: [],
  maxOperations: 1000,
  queryBuilder: {
    operationType: 'query',
    selectedFields: [],
    variables: [],
    generatedQuery: '',
    validationErrors: [],
    isValid: true
  },
  performance: {
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    averageExecutionTime: 0,
    slowestOperation: null,
    fastestOperation: null,
    operationsByType: {
      queries: 0,
      mutations: 0,
      subscriptions: 0
    },
    errorsByType: {},
    timeRangeMs: 24 * 60 * 60 * 1000 // 24 hours
  },
  ui: {
    activeTab: 'operations',
    isRecording: true,
    filters: {},
    showFilters: false,
    theme: 'auto'
  },
  settings: {
    autoIntrospect: true,
    recordingEnabled: true,
    maxHistorySize: 1000,
    performanceTrackingEnabled: true,
    validationEnabled: true,
    prettifyQueries: true
  }
};

/**
 * DevTools store implementation
 */
export class GraphQLDevToolsStore {
  private state: GraphQLDevToolsState = initialState;
  private listeners: Set<() => void> = new Set();
  private schemaManager: SchemaManager;
  private interceptor: GraphQLInterceptor;
  private subscriptionCleanups: (() => void)[] = [];

  constructor() {
    // Initialize schema manager
    this.schemaManager = new SchemaManager({
      endpoints: [],
      autoIntrospect: this.state.settings.autoIntrospect,
      cacheTimeout: 5 * 60 * 1000 // 5 minutes
    });

    // Initialize interceptor
    this.interceptor = new GraphQLInterceptor({
      enabled: this.state.settings.recordingEnabled,
      endpoints: [],
      autoDetectEndpoints: true,
      maxOperationHistory: this.state.settings.maxHistorySize
    });

    this.setupSubscriptions();
  }

  /**
   * Setup subscriptions to schema manager and interceptor
   */
  private setupSubscriptions(): void {
    // Subscribe to schema changes
    this.subscriptionCleanups.push(
      this.schemaManager.subscribe((schemaInfo) => {
        if (schemaInfo) {
          this.dispatch({ type: 'schema/load/success', payload: schemaInfo });
        }
      })
    );

    // Subscribe to intercepted operations
    this.subscriptionCleanups.push(
      this.interceptor.subscribe((operation) => {
        this.dispatch({ type: 'operations/add', payload: operation });
      })
    );
  }

  /**
   * Subscribe to state changes
   */
  subscribe = (callback: () => void): (() => void) => {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  };

  /**
   * Get current state snapshot
   */
  getSnapshot = (): GraphQLDevToolsState => {
    return this.state;
  };

  /**
   * Dispatch an action to update state
   */
  dispatch = (action: GraphQLDevToolsAction): void => {
    this.state = this.reducer(this.state, action);
    this.notifyListeners();
  };

  /**
   * Notify all listeners of state changes
   */
  private notifyListeners(): void {
    this.listeners.forEach(callback => callback());
  }

  /**
   * State reducer
   */
  private reducer(state: GraphQLDevToolsState, action: GraphQLDevToolsAction): GraphQLDevToolsState {
    switch (action.type) {
      case 'schema/load/start':
        return {
          ...state,
          isLoadingSchema: true,
          schemaError: undefined
        };

      case 'schema/load/success':
        return {
          ...state,
          isLoadingSchema: false,
          schema: action.payload,
          schemaError: undefined
        };

      case 'schema/load/error':
        return {
          ...state,
          isLoadingSchema: false,
          schemaError: action.payload
        };

      case 'schema/introspect':
        this.performSchemaIntrospection();
        return state;

      case 'operations/add': {
        const newOperations = [action.payload, ...state.operations]
          .slice(0, state.maxOperations);
        
        return {
          ...state,
          operations: newOperations,
          performance: this.updatePerformanceMetrics(state.performance, action.payload)
        };
      }

      case 'operations/update':
        return {
          ...state,
          operations: state.operations.map(op =>
            op.id === action.payload.id
              ? { ...op, ...action.payload.updates }
              : op
          )
        };

      case 'operations/clear':
        return {
          ...state,
          operations: [],
          performance: {
            ...state.performance,
            totalOperations: 0,
            successfulOperations: 0,
            failedOperations: 0,
            slowestOperation: null,
            fastestOperation: null
          }
        };

      case 'operations/remove':
        return {
          ...state,
          operations: state.operations.filter(op => op.id !== action.payload)
        };

      case 'query-builder/set-operation-type':
        return {
          ...state,
          queryBuilder: {
            ...state.queryBuilder,
            operationType: action.payload,
            selectedFields: [], // Reset fields when changing operation type
            generatedQuery: ''
          }
        };

      case 'query-builder/add-field':
        return {
          ...state,
          queryBuilder: {
            ...state.queryBuilder,
            selectedFields: [...state.queryBuilder.selectedFields, action.payload]
          }
        };

      case 'query-builder/remove-field':
        return {
          ...state,
          queryBuilder: {
            ...state.queryBuilder,
            selectedFields: state.queryBuilder.selectedFields.filter(
              field => field.fieldName !== action.payload
            )
          }
        };

      case 'query-builder/add-variable':
        return {
          ...state,
          queryBuilder: {
            ...state.queryBuilder,
            variables: [...state.queryBuilder.variables, action.payload]
          }
        };

      case 'query-builder/remove-variable':
        return {
          ...state,
          queryBuilder: {
            ...state.queryBuilder,
            variables: state.queryBuilder.variables.filter(v => v.name !== action.payload)
          }
        };

      case 'query-builder/set-operation-name':
        return {
          ...state,
          queryBuilder: {
            ...state.queryBuilder,
            operationName: action.payload
          }
        };

      case 'query-builder/generate-query': {
        const generatedQuery = generateQueryFromBuilder(state.queryBuilder);
        return {
          ...state,
          queryBuilder: {
            ...state.queryBuilder,
            generatedQuery
          }
        };
      }

      case 'query-builder/validate': {
        const validationErrors = this.validateQueryBuilder(state.queryBuilder);
        return {
          ...state,
          queryBuilder: {
            ...state.queryBuilder,
            validationErrors,
            isValid: validationErrors.length === 0
          }
        };
      }

      case 'query-builder/reset':
        return {
          ...state,
          queryBuilder: initialState.queryBuilder
        };

      case 'performance/update':
        return {
          ...state,
          performance: {
            ...state.performance,
            ...action.payload
          }
        };

      case 'ui/tab/select':
        return {
          ...state,
          ui: {
            ...state.ui,
            activeTab: action.payload
          }
        };

      case 'ui/operation/select':
        return {
          ...state,
          ui: {
            ...state.ui,
            selectedOperation: action.payload
          }
        };

      case 'ui/type/select':
        return {
          ...state,
          ui: {
            ...state.ui,
            selectedType: action.payload
          }
        };

      case 'ui/recording/toggle': {
        const newRecordingState = !state.ui.isRecording;
        this.interceptor.updateOptions({ enabled: newRecordingState });
        return {
          ...state,
          ui: {
            ...state.ui,
            isRecording: newRecordingState
          }
        };
      }

      case 'ui/filters/toggle':
        return {
          ...state,
          ui: {
            ...state.ui,
            showFilters: !state.ui.showFilters
          }
        };

      case 'ui/filters/update':
        return {
          ...state,
          ui: {
            ...state.ui,
            filters: {
              ...state.ui.filters,
              ...action.payload
            }
          }
        };

      case 'ui/theme/set':
        return {
          ...state,
          ui: {
            ...state.ui,
            theme: action.payload
          }
        };

      case 'settings/update': {
        const newSettings = {
          ...state.settings,
          ...action.payload
        };
        
        // Update interceptor options if recording setting changed
        if (action.payload.recordingEnabled !== undefined) {
          this.interceptor.updateOptions({ enabled: action.payload.recordingEnabled });
        }

        // Update schema manager options if auto-introspect changed
        if (action.payload.autoIntrospect !== undefined) {
          this.schemaManager.updateOptions({ autoIntrospect: action.payload.autoIntrospect });
        }

        return {
          ...state,
          settings: newSettings
        };
      }

      default:
        return state;
    }
  }

  /**
   * Perform schema introspection
   */
  private async performSchemaIntrospection(): Promise<void> {
    this.dispatch({ type: 'schema/load/start' });
    
    try {
      const schemaInfo = await this.schemaManager.autoIntrospect();
      if (schemaInfo) {
        this.dispatch({ type: 'schema/load/success', payload: schemaInfo });
      } else {
        this.dispatch({ type: 'schema/load/error', payload: 'No GraphQL endpoints found' });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.dispatch({ type: 'schema/load/error', payload: errorMessage });
    }
  }

  /**
   * Update performance metrics with new operation
   */
  private updatePerformanceMetrics(
    current: PerformanceMetrics, 
    operation: GraphQLOperation
  ): PerformanceMetrics {
    const updated = { ...current };
    
    updated.totalOperations++;
    
    if (operation.status === 'success') {
      updated.successfulOperations++;
    } else if (operation.status === 'error') {
      updated.failedOperations++;
      
      if (operation.error) {
        updated.errorsByType[operation.error] = (updated.errorsByType[operation.error] || 0) + 1;
      }
    }

    // Update operation type counts
    switch (operation.operationType) {
      case 'query':
        updated.operationsByType.queries++;
        break;
      case 'mutation':
        updated.operationsByType.mutations++;
        break;
      case 'subscription':
        updated.operationsByType.subscriptions++;
        break;
    }

    // Update execution time metrics
    if (operation.executionTime !== undefined) {
      // Include the current operation since this.state.operations is the pre-add snapshot
      const allOperations = [...this.state.operations, operation].filter(op => op.executionTime !== undefined);
      const executionTimes = allOperations.map(op => op.executionTime as number);

      updated.averageExecutionTime = executionTimes.length > 0
        ? executionTimes.reduce((sum, time) => sum + time, 0) / executionTimes.length
        : 0;
      
      if (!updated.slowestOperation || operation.executionTime > (updated.slowestOperation.executionTime || 0)) {
        updated.slowestOperation = operation;
      }
      
      if (!updated.fastestOperation || operation.executionTime < (updated.fastestOperation.executionTime || Infinity)) {
        updated.fastestOperation = operation;
      }
    }

    return updated;
  }

  /**
   * Validate query builder state
   */
  private validateQueryBuilder(queryBuilder: QueryBuilderState): ValidationError[] {
    const errors: ValidationError[] = [];

    if (queryBuilder.selectedFields.length === 0) {
      errors.push({
        message: 'At least one field must be selected',
        severity: 'error'
      });
    }

    // Validate against schema if available
    if (this.state.schema.schema && queryBuilder.generatedQuery) {
      const schemaErrors = validateGraphQLQuery(queryBuilder.generatedQuery, this.state.schema.schema);
      errors.push(...schemaErrors);
    }

    // Validate variable names
    for (const variable of queryBuilder.variables) {
      if (!variable.name.match(/^[a-zA-Z_][a-zA-Z0-9_]*$/)) {
        errors.push({
          message: `Invalid variable name: ${variable.name}`,
          severity: 'error'
        });
      }
    }

    return errors;
  }

  /**
   * Get filtered operations based on current filters
   */
  getFilteredOperations(): GraphQLOperation[] {
    const { filters } = this.state.ui;
    let operations = this.state.operations;

    if (filters.operationType) {
      operations = operations.filter(op => op.operationType === filters.operationType);
    }

    if (filters.status) {
      operations = operations.filter(op => op.status === filters.status);
    }

    if (filters.timeRange) {
      const cutoff = Date.now() - filters.timeRange;
      operations = operations.filter(op => op.timestamp > cutoff);
    }

    if (filters.searchTerm) {
      const searchTerm = filters.searchTerm.toLowerCase();
      operations = operations.filter(op =>
        (op.operationName && op.operationName.toLowerCase().includes(searchTerm)) ||
        op.query.toLowerCase().includes(searchTerm)
      );
    }

    return operations;
  }

  /**
   * Export operations data
   */
  exportOperations(): string {
    return JSON.stringify({
      operations: this.state.operations,
      schema: this.state.schema,
      exportedAt: new Date().toISOString()
    }, null, 2);
  }

  /**
   * Get schema manager instance
   */
  getSchemaManager(): SchemaManager {
    return this.schemaManager;
  }

  /**
   * Get interceptor instance
   */
  getInterceptor(): GraphQLInterceptor {
    return this.interceptor;
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    this.subscriptionCleanups.forEach(unsub => unsub());
    this.subscriptionCleanups = [];
    this.interceptor.uninstall();
    this.listeners.clear();
    storeInstance = null;
  }
}

// Singleton instance
let storeInstance: GraphQLDevToolsStore | null = null;

/**
 * Get the DevTools store instance
 */
export function getGraphQLDevToolsStore(): GraphQLDevToolsStore {
  if (!storeInstance) {
    storeInstance = new GraphQLDevToolsStore();
  }
  return storeInstance;
}

/**
 * Hook to use the DevTools store
 */
export function useGraphQLDevToolsStore(): GraphQLDevToolsState {
  const store = getGraphQLDevToolsStore();
  return useSyncExternalStore(store.subscribe, store.getSnapshot);
}