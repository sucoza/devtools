import { EventClient } from '@tanstack/devtools-event-client'
import type { GraphQLDevToolsEvents, GraphQLDevToolsState, GraphQLDevToolsAction } from '../types';
import { getGraphQLDevToolsStore, GraphQLDevToolsStore } from './devtools-store';

/**
 * GraphQL DevTools client for TanStack DevTools integration
 */
export class GraphQLDevToolsClient extends EventClient<GraphQLDevToolsEvents> {
  private unsubscribe?: () => void;
  private store: GraphQLDevToolsStore;

  constructor() {
    super({
      pluginId: 'graphql-devtools'
    })
    this.store = getGraphQLDevToolsStore();
  }

  /**
   * Subscribe to DevTools events
   */
  subscribe = (
    callback: (
      events: GraphQLDevToolsEvents[keyof GraphQLDevToolsEvents], 
      type: keyof GraphQLDevToolsEvents
    ) => void
  ) => {
    // Subscribe to store changes and emit state updates
    this.unsubscribe = this.store.subscribe(() => {
      const state = this.store.getSnapshot();
      callback(state, 'graphql-devtools:state');
    });

    // Send initial state
    const initialState = this.store.getSnapshot();
    callback(initialState, 'graphql-devtools:state');

    return () => {
      this.unsubscribe?.();
      this.store.cleanup();
    };
  };

  /**
   * Handle incoming actions from DevTools
   */
  handleAction = (action: GraphQLDevToolsAction): void => {
    this.store.dispatch(action);
  };

  /**
   * Get current state
   */
  getState = (): GraphQLDevToolsState => {
    return this.store.getSnapshot();
  };

  // Control methods for DevTools UI

  /**
   * Trigger schema introspection
   */
  introspectSchema = async (endpoint?: string, headers?: Record<string, string>) => {
    if (endpoint) {
      try {
        const schemaManager = this.store.getSchemaManager();
        await schemaManager.introspectEndpoint(endpoint, headers);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        this.store.dispatch({ type: 'schema/load/error', payload: errorMessage });
      }
    } else {
      this.store.dispatch({ type: 'schema/introspect' });
    }
  };

  /**
   * Clear all operations
   */
  clearOperations = (): void => {
    this.store.dispatch({ type: 'operations/clear' });
  };

  /**
   * Toggle recording state
   */
  toggleRecording = (): void => {
    this.store.dispatch({ type: 'ui/recording/toggle' });
  };

  /**
   * Select active tab
   */
  selectTab = (tab: GraphQLDevToolsState['ui']['activeTab']): void => {
    this.store.dispatch({ type: 'ui/tab/select', payload: tab });
  };

  /**
   * Select operation for detailed view
   */
  selectOperation = (id: string | undefined): void => {
    this.store.dispatch({ type: 'ui/operation/select', payload: id });
  };

  /**
   * Select type for schema exploration
   */
  selectType = (typeName: string | undefined): void => {
    this.store.dispatch({ type: 'ui/type/select', payload: typeName });
  };

  /**
   * Toggle filters visibility
   */
  toggleFilters = (): void => {
    this.store.dispatch({ type: 'ui/filters/toggle' });
  };

  /**
   * Update filters
   */
  updateFilters = (filters: Partial<GraphQLDevToolsState['ui']['filters']>): void => {
    this.store.dispatch({ type: 'ui/filters/update', payload: filters });
  };

  /**
   * Set theme
   */
  setTheme = (theme: 'light' | 'dark' | 'auto'): void => {
    this.store.dispatch({ type: 'ui/theme/set', payload: theme });
  };

  /**
   * Update settings
   */
  updateSettings = (settings: Partial<GraphQLDevToolsState['settings']>): void => {
    this.store.dispatch({ type: 'settings/update', payload: settings });
  };

  // Query Builder methods

  /**
   * Set query builder operation type
   */
  setQueryBuilderOperationType = (operationType: 'query' | 'mutation' | 'subscription'): void => {
    this.store.dispatch({ type: 'query-builder/set-operation-type', payload: operationType });
  };

  /**
   * Add field to query builder
   */
  addQueryBuilderField = (field: import('../types').SelectedField): void => {
    this.store.dispatch({ type: 'query-builder/add-field', payload: field });
  };

  /**
   * Remove field from query builder
   */
  removeQueryBuilderField = (fieldName: string): void => {
    this.store.dispatch({ type: 'query-builder/remove-field', payload: fieldName });
  };

  /**
   * Add variable to query builder
   */
  addQueryBuilderVariable = (variable: import('../types').QueryVariable): void => {
    this.store.dispatch({ type: 'query-builder/add-variable', payload: variable });
  };

  /**
   * Remove variable from query builder
   */
  removeQueryBuilderVariable = (variableName: string): void => {
    this.store.dispatch({ type: 'query-builder/remove-variable', payload: variableName });
  };

  /**
   * Set query builder operation name
   */
  setQueryBuilderOperationName = (name: string): void => {
    this.store.dispatch({ type: 'query-builder/set-operation-name', payload: name });
  };

  /**
   * Generate query from builder state
   */
  generateQuery = (): void => {
    this.store.dispatch({ type: 'query-builder/generate-query' });
  };

  /**
   * Validate query builder
   */
  validateQueryBuilder = (): void => {
    this.store.dispatch({ type: 'query-builder/validate' });
  };

  /**
   * Reset query builder
   */
  resetQueryBuilder = (): void => {
    this.store.dispatch({ type: 'query-builder/reset' });
  };

  /**
   * Execute query from builder
   */
  executeQuery = async (endpoint: string, headers?: Record<string, string>) => {
    const state = this.store.getSnapshot();
    const { generatedQuery, variables } = state.queryBuilder;
    
    if (!generatedQuery) {
      throw new Error('No query to execute');
    }

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers
        },
        body: JSON.stringify({
          query: generatedQuery,
          variables: variables.reduce((acc, variable) => {
            acc[variable.name] = variable.defaultValue;
            return acc;
          }, {} as Record<string, any>)
        })
      });

      const result = await response.json();
      
      // This will be intercepted by the GraphQL interceptor
      return result;
    } catch (error) {
      throw new Error(`Query execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Utility methods

  /**
   * Get filtered operations
   */
  getFilteredOperations = () => {
    return this.store.getFilteredOperations();
  };

  /**
   * Export operations data
   */
  exportOperations = (): string => {
    return this.store.exportOperations();
  };

  /**
   * Import operations data
   */
  importOperations = (data: string): void => {
    try {
      const parsed = JSON.parse(data);
      
      if (parsed.operations && Array.isArray(parsed.operations)) {
        // Clear existing operations and add imported ones
        this.store.dispatch({ type: 'operations/clear' });
        
        parsed.operations.forEach((operation: import('../types').GraphQLOperation) => {
          this.store.dispatch({ type: 'operations/add', payload: operation });
        });
      }

      if (parsed.schema) {
        this.store.dispatch({ type: 'schema/load/success', payload: parsed.schema });
      }
    } catch (error) {
      throw new Error(`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  /**
   * Get schema manager for advanced operations
   */
  getSchemaManager = () => {
    return this.store.getSchemaManager();
  };

  /**
   * Get interceptor for advanced operations
   */
  getInterceptor = () => {
    return this.store.getInterceptor();
  };

  /**
   * Get operation statistics
   */
  getOperationStats = () => {
    const state = this.store.getSnapshot();
    const operations = state.operations;
    const now = Date.now();
    const last24h = now - (24 * 60 * 60 * 1000);
    
    const recent = operations.filter(op => op.timestamp > last24h);
    
    return {
      total: operations.length,
      recent: recent.length,
      byType: {
        queries: operations.filter(op => op.operationType === 'query').length,
        mutations: operations.filter(op => op.operationType === 'mutation').length,
        subscriptions: operations.filter(op => op.operationType === 'subscription').length
      },
      byStatus: {
        pending: operations.filter(op => op.status === 'pending').length,
        success: operations.filter(op => op.status === 'success').length,
        error: operations.filter(op => op.status === 'error').length
      },
      performance: {
        averageExecutionTime: recent.reduce((sum, op) => sum + (op.executionTime || 0), 0) / recent.length || 0,
        slowestOperation: recent.sort((a, b) => (b.executionTime || 0) - (a.executionTime || 0))[0] || null,
        fastestOperation: recent.sort((a, b) => (a.executionTime || Infinity) - (b.executionTime || Infinity))[0] || null
      }
    };
  };

  /**
   * Search operations
   */
  searchOperations = (query: string) => {
    const state = this.store.getSnapshot();
    const searchTerm = query.toLowerCase();
    
    return state.operations.filter(operation =>
      (operation.operationName && operation.operationName.toLowerCase().includes(searchTerm)) ||
      operation.query.toLowerCase().includes(searchTerm) ||
      (operation.error && operation.error.toLowerCase().includes(searchTerm))
    );
  };
}

// Singleton instance
let clientInstance: GraphQLDevToolsClient | null = null;

/**
 * Create GraphQL DevTools client instance
 */
export function createGraphQLDevToolsClient(): GraphQLDevToolsClient {
  if (!clientInstance) {
    clientInstance = new GraphQLDevToolsClient();
  }
  return clientInstance;
}

/**
 * Get existing GraphQL DevTools client instance
 */
export function getGraphQLDevToolsClient(): GraphQLDevToolsClient | null {
  return clientInstance;
}