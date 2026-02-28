import type { 
  GraphQLOperation, 
  GraphQLRequest, 
  GraphQLResponse,
  NetworkInfo 
} from '../types';
import { 
  isGraphQLRequest, 
  extractGraphQLFromRequest
} from '../utils/graphql-parser';

export interface GraphQLInterceptorOptions {
  enabled: boolean;
  endpoints: string[];
  autoDetectEndpoints: boolean;
  maxOperationHistory: number;
}

export interface InterceptedOperation extends GraphQLOperation {
  request: GraphQLRequest;
  response?: GraphQLResponse;
  networkInfo: NetworkInfo;
}

export class GraphQLInterceptor {
  private options: GraphQLInterceptorOptions;
  private operations: Map<string, InterceptedOperation> = new Map();
  private listeners: Set<(operation: InterceptedOperation) => void> = new Set();
  private originalFetch: typeof fetch;
  private originalXHROpen: typeof XMLHttpRequest.prototype.open;
  private originalXHRSend: typeof XMLHttpRequest.prototype.send;
  private isInstalled = false;

  constructor(options: GraphQLInterceptorOptions) {
    this.options = options;
    this.originalFetch = window.fetch;
    this.originalXHROpen = XMLHttpRequest.prototype.open;
    this.originalXHRSend = XMLHttpRequest.prototype.send;

    if (options.enabled) {
      this.install();
    }
  }

  /**
   * Subscribe to intercepted operations
   */
  subscribe(callback: (operation: InterceptedOperation) => void): () => void {
    this.listeners.add(callback);
    
    // Send existing operations
    this.operations.forEach(operation => callback(operation));
    
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Notify listeners of new/updated operations
   */
  private notifyListeners(operation: InterceptedOperation): void {
    this.listeners.forEach(callback => callback(operation));
  }

  /**
   * Install network interception
   */
  install(): void {
    if (this.isInstalled) {
      return;
    }

    this.interceptFetch();
    this.interceptXHR();
    this.isInstalled = true;
  }

  /**
   * Uninstall network interception
   */
  uninstall(): void {
    if (!this.isInstalled) {
      return;
    }

    window.fetch = this.originalFetch;
    XMLHttpRequest.prototype.open = this.originalXHROpen;
    XMLHttpRequest.prototype.send = this.originalXHRSend;
    this.isInstalled = false;
  }

  /**
   * Intercept fetch requests
   */
  private interceptFetch(): void {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const interceptor = this;
    
    window.fetch = async function(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
      const url = input instanceof Request ? input.url : input.toString();
      const method = init?.method || (input instanceof Request ? input.method : 'GET');
      const headers = interceptor.extractHeaders(init?.headers || (input instanceof Request ? input.headers : {}));
      const body = init?.body?.toString() || (input instanceof Request ? await input.clone().text() : '');
      
      const startTime = performance.now();
      
      // Check if this is a GraphQL request
      if (interceptor.shouldIntercept(url, method, body)) {
        const requestData: GraphQLRequest = {
          url,
          method,
          headers,
          body,
          timestamp: Date.now()
        };

        try {
          const operation = interceptor.createOperationFromRequest(requestData);
          if (operation) {
            const interceptedOp: InterceptedOperation = {
              ...operation,
              request: requestData,
              networkInfo: {
                url,
                method,
                headers,
                requestSize: body.length,
                responseSize: 0
              }
            };
            
            interceptor.operations.set(operation.id, interceptedOp);
            interceptor.notifyListeners(interceptedOp);
          }
        } catch (error) {
          console.warn('Failed to parse GraphQL request:', error);
        }
      }

      try {
        const response = await interceptor.originalFetch.call(this, input, init);
        const endTime = performance.now();
        const executionTime = endTime - startTime;

        if (interceptor.shouldIntercept(url, method, body)) {
          await interceptor.handleResponse(url, response.clone(), executionTime);
        }

        return response;
      } catch (error) {
        const endTime = performance.now();
        const executionTime = endTime - startTime;
        
        if (interceptor.shouldIntercept(url, method, body)) {
          await interceptor.handleError(url, error as Error, executionTime);
        }
        
        throw error;
      }
    };
  }

  /**
   * Intercept XMLHttpRequest
   */
  private interceptXHR(): void {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const interceptor = this;
    
    XMLHttpRequest.prototype.open = function(
      this: XMLHttpRequest,
      method: string,
      url: string,
      async?: boolean,
      username?: string | null,
      password?: string | null
    ) {
      (this as any).__interceptor__ = { method, url, startTime: 0 };
      return interceptor.originalXHROpen.call(this, method, url, async, username, password);
    };

    XMLHttpRequest.prototype.send = function(this: XMLHttpRequest, body?: Document | XMLHttpRequestBodyInit | null) {
      const interceptorData = (this as any).__interceptor__;
      if (!interceptorData) {
        return interceptor.originalXHRSend.call(this, body);
      }

      const { method, url } = interceptorData;
      const bodyString = body ? body.toString() : '';
      const startTime = performance.now();
      interceptorData.startTime = startTime;

      if (interceptor.shouldIntercept(url, method, bodyString)) {
        const headers = interceptor.extractXHRHeaders(this);
        const requestData: GraphQLRequest = {
          url,
          method,
          headers,
          body: bodyString,
          timestamp: Date.now()
        };

        try {
          const operation = interceptor.createOperationFromRequest(requestData);
          if (operation) {
            const interceptedOp: InterceptedOperation = {
              ...operation,
              request: requestData,
              networkInfo: {
                url,
                method,
                headers,
                requestSize: bodyString.length,
                responseSize: 0
              }
            };
            
            interceptor.operations.set(operation.id, interceptedOp);
            interceptor.notifyListeners(interceptedOp);
          }
        } catch (error) {
          console.warn('Failed to parse GraphQL request:', error);
        }

        const originalOnReadyStateChange = this.onreadystatechange;
        this.onreadystatechange = function(this: XMLHttpRequest) {
          if (this.readyState === XMLHttpRequest.DONE) {
            const endTime = performance.now();
            const executionTime = endTime - startTime;
            
            interceptor.handleXHRResponse(url, this, executionTime);
          }
          
          if (originalOnReadyStateChange) {
            originalOnReadyStateChange.call(this);
          }
        };
      }

      return interceptor.originalXHRSend.call(this, body);
    };
  }

  /**
   * Check if request should be intercepted
   */
  private shouldIntercept(url: string, method: string, body?: string): boolean {
    if (!this.options.enabled) {
      return false;
    }

    return isGraphQLRequest(url, method, body);
  }

  /**
   * Create operation from request data
   */
  private createOperationFromRequest(request: GraphQLRequest): GraphQLOperation | null {
    try {
      const graphqlData = extractGraphQLFromRequest(request.body);
      if (!graphqlData) {
        return null;
      }

      const operationId = this.generateOperationId();
      return {
        id: operationId,
        ...graphqlData,
        timestamp: request.timestamp,
        status: 'pending'
      } as GraphQLOperation;
    } catch (error) {
      console.warn('Failed to create operation from request:', error);
      return null;
    }
  }

  /**
   * Handle fetch response
   */
  private async handleResponse(url: string, response: Response, executionTime: number): Promise<void> {
    try {
      const responseBody = await response.text();
      const responseData: GraphQLResponse = {
        status: response.status,
        headers: this.extractHeaders(response.headers),
        body: responseBody,
        timestamp: Date.now()
      };

      this.updateOperationWithResponse(url, responseData, executionTime);
    } catch (error) {
      console.warn('Failed to handle response:', error);
    }
  }

  /**
   * Handle XHR response
   */
  private handleXHRResponse(url: string, xhr: XMLHttpRequest, executionTime: number): void {
    try {
      const responseData: GraphQLResponse = {
        status: xhr.status,
        headers: this.parseXHRResponseHeaders(xhr.getAllResponseHeaders()),
        body: xhr.responseText,
        timestamp: Date.now()
      };

      this.updateOperationWithResponse(url, responseData, executionTime);
    } catch (error) {
      console.warn('Failed to handle XHR response:', error);
    }
  }

  /**
   * Handle request error
   */
  private async handleError(url: string, error: Error, executionTime: number): Promise<void> {
    const operation = this.findOperationByUrl(url);
    if (operation) {
      operation.status = 'error';
      operation.error = error.message;
      operation.executionTime = executionTime;
      
      this.notifyListeners(operation);
    }
  }

  /**
   * Update operation with response data
   */
  private updateOperationWithResponse(url: string, response: GraphQLResponse, executionTime: number): void {
    const operation = this.findOperationByUrl(url);
    if (!operation) {
      return;
    }

    operation.response = response;
    operation.executionTime = executionTime;
    operation.networkInfo.responseSize = response.body.length;

    try {
      const parsedResponse = JSON.parse(response.body);
      
      if (parsedResponse.errors && parsedResponse.errors.length > 0) {
        operation.status = 'error';
        operation.error = parsedResponse.errors.map((e: any) => e.message).join(', ');
      } else {
        operation.status = 'success';
        operation.response = parsedResponse;
      }
    } catch {
      // Not JSON or malformed
      if (response.status >= 400) {
        operation.status = 'error';
        operation.error = `HTTP ${response.status}`;
      } else {
        operation.status = 'success';
      }
    }

    this.notifyListeners(operation);
    this.cleanupOldOperations();
  }

  /**
   * Find operation by URL (latest matching)
   */
  private findOperationByUrl(url: string): InterceptedOperation | undefined {
    // Find the most recent operation for this URL
    let latestOperation: InterceptedOperation | undefined;
    let latestTimestamp = 0;

    for (const operation of this.operations.values()) {
      if (operation.request.url === url && 
          operation.timestamp > latestTimestamp && 
          operation.status === 'pending') {
        latestOperation = operation;
        latestTimestamp = operation.timestamp;
      }
    }

    return latestOperation;
  }

  /**
   * Generate unique operation ID
   */
  private generateOperationId(): string {
    return `gql_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Extract headers from various sources
   */
  private extractHeaders(headers: any): Record<string, string> {
    const result: Record<string, string> = {};
    
    if (headers instanceof Headers) {
      headers.forEach((value, key) => {
        result[key] = value;
      });
    } else if (typeof headers === 'object' && headers !== null) {
      Object.entries(headers).forEach(([key, value]) => {
        result[key] = String(value);
      });
    }
    
    return result;
  }

  /**
   * Extract headers from XHR
   */
  private extractXHRHeaders(_xhr: XMLHttpRequest): Record<string, string> {
    // XHR doesn't provide easy access to request headers
    // This is a limitation of the XHR API
    return {};
  }

  /**
   * Parse XHR response headers
   */
  private parseXHRResponseHeaders(headerString: string): Record<string, string> {
    const headers: Record<string, string> = {};
    
    if (!headerString) {
      return headers;
    }
    
    headerString.split('\r\n').forEach(line => {
      const parts = line.split(': ');
      if (parts.length === 2) {
        headers[parts[0].toLowerCase()] = parts[1];
      }
    });
    
    return headers;
  }

  /**
   * Clean up old operations to maintain max history size
   */
  private cleanupOldOperations(): void {
    if (this.operations.size <= this.options.maxOperationHistory) {
      return;
    }

    const operations = Array.from(this.operations.values())
      .sort((a, b) => b.timestamp - a.timestamp);
    
    const toKeep = operations.slice(0, this.options.maxOperationHistory);
    const _toRemove = operations.slice(this.options.maxOperationHistory);
    
    this.operations.clear();
    toKeep.forEach(op => this.operations.set(op.id, op));
  }

  /**
   * Get all intercepted operations
   */
  getOperations(): InterceptedOperation[] {
    return Array.from(this.operations.values())
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Get operation by ID
   */
  getOperation(id: string): InterceptedOperation | undefined {
    return this.operations.get(id);
  }

  /**
   * Clear all operations
   */
  clearOperations(): void {
    this.operations.clear();
  }

  /**
   * Update options
   */
  updateOptions(options: Partial<GraphQLInterceptorOptions>): void {
    this.options = { ...this.options, ...options };
    
    if (options.enabled !== undefined) {
      if (options.enabled && !this.isInstalled) {
        this.install();
      } else if (!options.enabled && this.isInstalled) {
        this.uninstall();
      }
    }
  }

  /**
   * Get interceptor statistics
   */
  getStats() {
    const operations = this.getOperations();
    const now = Date.now();
    const last24h = now - (24 * 60 * 60 * 1000);
    
    const recent = operations.filter(op => op.timestamp > last24h);
    const successful = recent.filter(op => op.status === 'success');
    const failed = recent.filter(op => op.status === 'error');
    
    return {
      totalOperations: operations.length,
      recentOperations: recent.length,
      successfulOperations: successful.length,
      failedOperations: failed.length,
      averageExecutionTime: recent.reduce((sum, op) => sum + (op.executionTime || 0), 0) / recent.length || 0,
      isIntercepting: this.isInstalled
    };
  }
}