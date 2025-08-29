import { GraphQLSchema } from 'graphql';
import type { SchemaInfo, GraphQLDevToolsConfig } from '../types';
import {
  buildSchemaFromIntrospection,
  getSchemaIntrospectionQuery,
  extractSchemaInfo
} from '../utils/graphql-parser';

export interface SchemaManagerOptions {
  endpoints: string[];
  autoIntrospect: boolean;
  cacheTimeout: number;
}

export class SchemaManager {
  private schema: GraphQLSchema | null = null;
  private schemaInfo: SchemaInfo | null = null;
  private lastIntrospection: number = 0;
  private options: SchemaManagerOptions;
  private listeners: Set<(schemaInfo: SchemaInfo | null) => void> = new Set();

  constructor(options: SchemaManagerOptions) {
    this.options = options;
  }

  /**
   * Subscribe to schema changes
   */
  subscribe(callback: (schemaInfo: SchemaInfo | null) => void): () => void {
    this.listeners.add(callback);
    
    // Send current schema immediately
    callback(this.schemaInfo);
    
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Notify all listeners of schema changes
   */
  private notifyListeners(): void {
    this.listeners.forEach(callback => callback(this.schemaInfo));
  }

  /**
   * Load schema from introspection result
   */
  async loadSchemaFromIntrospection(introspectionResult: any): Promise<SchemaInfo> {
    try {
      this.schema = buildSchemaFromIntrospection(introspectionResult);
      this.schemaInfo = extractSchemaInfo(this.schema);
      this.lastIntrospection = Date.now();
      
      this.notifyListeners();
      return this.schemaInfo;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to load schema: ${errorMessage}`);
    }
  }

  /**
   * Perform schema introspection on a GraphQL endpoint
   */
  async introspectEndpoint(endpoint: string, headers?: Record<string, string>): Promise<SchemaInfo> {
    const introspectionQuery = getSchemaIntrospectionQuery();
    
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers
        },
        body: JSON.stringify({
          query: introspectionQuery,
          operationName: 'IntrospectionQuery'
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.errors && result.errors.length > 0) {
        throw new Error(`GraphQL errors: ${result.errors.map((e: any) => e.message).join(', ')}`);
      }

      return await this.loadSchemaFromIntrospection(result);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to introspect endpoint ${endpoint}: ${errorMessage}`);
    }
  }

  /**
   * Auto-introspect all configured endpoints
   */
  async autoIntrospect(headers?: Record<string, string>): Promise<SchemaInfo | null> {
    if (!this.options.autoIntrospect || this.options.endpoints.length === 0) {
      return null;
    }

    // Skip if recently introspected (within cache timeout)
    if (this.lastIntrospection && (Date.now() - this.lastIntrospection < this.options.cacheTimeout)) {
      return this.schemaInfo;
    }

    // Try each endpoint until one succeeds
    for (const endpoint of this.options.endpoints) {
      try {
        return await this.introspectEndpoint(endpoint, headers);
      } catch (error) {
        console.warn(`Failed to introspect ${endpoint}:`, error);
        continue;
      }
    }

    return null;
  }

  /**
   * Get current schema info
   */
  getSchemaInfo(): SchemaInfo | null {
    return this.schemaInfo;
  }

  /**
   * Get current GraphQL schema
   */
  getSchema(): GraphQLSchema | null {
    return this.schema;
  }

  /**
   * Check if schema is loaded
   */
  hasSchema(): boolean {
    return this.schema !== null;
  }

  /**
   * Clear current schema
   */
  clearSchema(): void {
    this.schema = null;
    this.schemaInfo = null;
    this.lastIntrospection = 0;
    this.notifyListeners();
  }

  /**
   * Update options
   */
  updateOptions(options: Partial<SchemaManagerOptions>): void {
    this.options = { ...this.options, ...options };
  }

  /**
   * Get introspection query string
   */
  getIntrospectionQuery(): string {
    return getSchemaIntrospectionQuery();
  }

  /**
   * Detect GraphQL endpoints from network traffic
   */
  detectEndpoint(url: string, responseBody?: string): boolean {
    // Check if URL looks like a GraphQL endpoint
    const isGraphQLUrl = url.includes('/graphql') || url.includes('/graph');
    
    if (!isGraphQLUrl) {
      return false;
    }

    // If we have a response body, check if it looks like GraphQL
    if (responseBody) {
      try {
        const parsed = JSON.parse(responseBody);
        const hasGraphQLStructure = parsed.data !== undefined || parsed.errors !== undefined;
        
        if (hasGraphQLStructure && !this.options.endpoints.includes(url)) {
          this.options.endpoints.push(url);
          return true;
        }
      } catch {
        // Not JSON, probably not GraphQL
        return false;
      }
    }

    return isGraphQLUrl;
  }

  /**
   * Get endpoint suggestions based on detected patterns
   */
  getEndpointSuggestions(): string[] {
    return this.options.endpoints.filter(endpoint => endpoint !== '');
  }

  /**
   * Validate schema health
   */
  validateSchemaHealth(): {
    isValid: boolean;
    issues: string[];
    suggestions: string[];
  } {
    const issues: string[] = [];
    const suggestions: string[] = [];

    if (!this.schema) {
      issues.push('No schema loaded');
      suggestions.push('Run schema introspection or load schema manually');
      return { isValid: false, issues, suggestions };
    }

    const queryType = this.schema.getQueryType();
    const mutationType = this.schema.getMutationType();
    const subscriptionType = this.schema.getSubscriptionType();

    if (!queryType) {
      issues.push('Schema has no Query type');
    }

    if (!mutationType) {
      suggestions.push('Consider adding mutations for data modification');
    }

    if (!subscriptionType) {
      suggestions.push('Consider adding subscriptions for real-time features');
    }

    // Check for common issues
    const typeMap = this.schema.getTypeMap();
    const customTypes = Object.values(typeMap).filter(type => !type.name.startsWith('__'));
    
    if (customTypes.length === 0) {
      issues.push('Schema has no custom types');
    }

    if (customTypes.length < 5) {
      suggestions.push('Schema might be very simple - consider if this is expected');
    }

    return {
      isValid: issues.length === 0,
      issues,
      suggestions
    };
  }

  /**
   * Export schema as SDL (Schema Definition Language)
   */
  exportSchemaSDL(): string | null {
    if (!this.schema) {
      return null;
    }

    // This would require additional GraphQL utilities to print schema
    // For now, return a placeholder
    return '# Schema SDL export would go here';
  }

  /**
   * Get schema statistics
   */
  getSchemaStats(): {
    totalTypes: number;
    objectTypes: number;
    scalarTypes: number;
    enumTypes: number;
    interfaceTypes: number;
    unionTypes: number;
    inputTypes: number;
    totalFields: number;
    totalMutations: number;
    totalSubscriptions: number;
  } | null {
    if (!this.schemaInfo) {
      return null;
    }

    const stats = {
      totalTypes: this.schemaInfo.types.length,
      objectTypes: 0,
      scalarTypes: 0,
      enumTypes: 0,
      interfaceTypes: 0,
      unionTypes: 0,
      inputTypes: 0,
      totalFields: this.schemaInfo.queries.length,
      totalMutations: this.schemaInfo.mutations.length,
      totalSubscriptions: this.schemaInfo.subscriptions.length
    };

    for (const type of this.schemaInfo.types) {
      if (type.kind.includes('OBJECT')) stats.objectTypes++;
      else if (type.kind.includes('SCALAR')) stats.scalarTypes++;
      else if (type.kind.includes('ENUM')) stats.enumTypes++;
      else if (type.kind.includes('INTERFACE')) stats.interfaceTypes++;
      else if (type.kind.includes('UNION')) stats.unionTypes++;
      else if (type.kind.includes('INPUT')) stats.inputTypes++;
    }

    return stats;
  }
}