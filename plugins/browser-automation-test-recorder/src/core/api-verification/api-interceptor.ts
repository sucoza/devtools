/**
 * API Verification Interceptor
 * Captures and validates HTTP requests/responses during recording and playback
 */

export interface APIRequest {
  id: string;
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: any;
  timestamp: number;
  source: 'xhr' | 'fetch' | 'navigation';
  metadata: RequestMetadata;
}

export interface APIResponse {
  id: string;
  requestId: string;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body?: any;
  size: number;
  duration: number;
  timestamp: number;
  metadata: ResponseMetadata;
}

export interface RequestMetadata {
  eventId?: string; // Associated recorded event
  userAction?: string; // What user action triggered this
  retryCount: number;
  isBackground: boolean;
  priority: 'high' | 'medium' | 'low';
  tags: string[];
}

export interface ResponseMetadata {
  cached: boolean;
  fromServiceWorker: boolean;
  timing: NetworkTiming;
  security?: SecurityInfo;
  encoding?: string;
  mimeType?: string;
}

export interface NetworkTiming {
  requestStart: number;
  responseStart: number;
  responseEnd: number;
  dnsLookup?: number;
  tcpConnect?: number;
  tlsHandshake?: number;
  firstByte?: number;
  download?: number;
}

export interface SecurityInfo {
  protocol?: string;
  cipher?: string;
  keyExchange?: string;
  certificateValid: boolean;
  issuer?: string;
  subjectName?: string;
  validFrom?: number;
  validTo?: number;
}

export interface APIAssertion {
  id: string;
  name: string;
  type: 'status' | 'header' | 'body' | 'timing' | 'schema';
  target: 'request' | 'response';
  condition: AssertionCondition;
  message: string;
  enabled: boolean;
  createdAt: number;
}

export interface AssertionCondition {
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'matches' | 'not_matches' | 'exists' | 'not_exists' | 'greater_than' | 'less_than' | 'between';
  path?: string; // JSONPath or header name
  value?: any;
  pattern?: string; // Regex pattern
  schema?: any; // JSON Schema
  options?: AssertionOptions;
}

export interface AssertionOptions {
  ignoreCase?: boolean;
  ignoreOrder?: boolean;
  ignoreExtraFields?: boolean;
  timeout?: number;
  retries?: number;
}

export interface APIContract {
  id: string;
  name: string;
  description?: string;
  baseUrl?: string;
  endpoints: EndpointContract[];
  globalHeaders?: Record<string, string>;
  authentication?: AuthConfig;
  version: string;
  createdAt: number;
  updatedAt: number;
}

export interface EndpointContract {
  id: string;
  method: string;
  path: string;
  name?: string;
  description?: string;
  requestSchema?: any; // JSON Schema
  responseSchemas: Record<number, any>; // Status code -> JSON Schema
  headers?: HeaderContract[];
  queryParams?: ParamContract[];
  pathParams?: ParamContract[];
  assertions?: APIAssertion[];
  examples?: APIExample[];
}

export interface HeaderContract {
  name: string;
  required: boolean;
  type: string;
  description?: string;
  example?: string;
}

export interface ParamContract {
  name: string;
  required: boolean;
  type: string;
  description?: string;
  example?: any;
  enum?: any[];
}

export interface APIExample {
  id: string;
  name: string;
  description?: string;
  request: {
    headers?: Record<string, string>;
    body?: any;
    queryParams?: Record<string, any>;
  };
  response: {
    status: number;
    headers?: Record<string, string>;
    body?: any;
  };
}

export interface AuthConfig {
  type: 'none' | 'basic' | 'bearer' | 'oauth' | 'api_key' | 'custom';
  config: Record<string, any>;
}

export interface ValidationResult {
  passed: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  metrics: ValidationMetrics;
  requestId: string;
  contractId?: string;
  timestamp: number;
}

export interface ValidationError {
  type: 'schema' | 'status' | 'header' | 'timing' | 'assertion';
  message: string;
  path?: string;
  expected?: any;
  actual?: any;
  severity: 'error' | 'warning';
}

export interface ValidationWarning {
  type: string;
  message: string;
  suggestion?: string;
}

export interface ValidationMetrics {
  totalAssertions: number;
  passedAssertions: number;
  failedAssertions: number;
  validationTime: number;
  requestDuration: number;
  responseSize: number;
}

export class APIInterceptor {
  private requests = new Map<string, APIRequest>();
  private responses = new Map<string, APIResponse>();
  private contracts = new Map<string, APIContract>();
  private assertions = new Map<string, APIAssertion[]>();
  private validationResults = new Map<string, ValidationResult>();
  
  private isRecording = false;
  private isValidating = false;
  private requestIdCounter = 0;

  private originalFetch: typeof fetch;
  private originalXHROpen: typeof XMLHttpRequest.prototype.open;
  private originalXHRSend: typeof XMLHttpRequest.prototype.send;

  constructor() {
    this.originalFetch = window.fetch;
    this.originalXHROpen = XMLHttpRequest.prototype.open;
    this.originalXHRSend = XMLHttpRequest.prototype.send;
    
    this.setupInterception();
  }

  /**
   * Start API interception and recording
   */
  startRecording(): void {
    this.isRecording = true;
    this.requests.clear();
    this.responses.clear();
    this.validationResults.clear();
  }

  /**
   * Restore original fetch and XHR methods
   */
  destroy(): void {
    this.isRecording = false;
    this.isValidating = false;
    window.fetch = this.originalFetch;
    XMLHttpRequest.prototype.open = this.originalXHROpen;
    XMLHttpRequest.prototype.send = this.originalXHRSend;
  }

  /**
   * Stop API recording
   */
  stopRecording(): void {
    this.isRecording = false;
  }

  /**
   * Enable API validation during playback
   */
  enableValidation(): void {
    this.isValidating = true;
  }

  /**
   * Disable API validation
   */
  disableValidation(): void {
    this.isValidating = false;
  }

  /**
   * Add API contract for validation
   */
  addContract(contract: APIContract): void {
    this.contracts.set(contract.id, contract);
  }

  /**
   * Remove API contract
   */
  removeContract(contractId: string): void {
    this.contracts.delete(contractId);
  }

  /**
   * Add assertions for specific endpoints
   */
  addAssertions(requestPattern: string, assertions: APIAssertion[]): void {
    this.assertions.set(requestPattern, assertions);
  }

  /**
   * Get all recorded requests
   */
  getRequests(): APIRequest[] {
    return Array.from(this.requests.values());
  }

  /**
   * Get all recorded responses
   */
  getResponses(): APIResponse[] {
    return Array.from(this.responses.values());
  }

  /**
   * Get validation results
   */
  getValidationResults(): ValidationResult[] {
    return Array.from(this.validationResults.values());
  }

  /**
   * Generate API assertions based on recorded traffic
   */
  generateAssertions(): APIAssertion[] {
    const assertions: APIAssertion[] = [];
    const responses = this.getResponses();

    responses.forEach(response => {
      const request = this.requests.get(response.requestId);
      if (!request) return;

      // Generate status assertion
      assertions.push({
        id: `status_${response.id}`,
        name: `Status code should be ${response.status}`,
        type: 'status',
        target: 'response',
        condition: {
          operator: 'equals',
          value: response.status,
        },
        message: `Expected status ${response.status}`,
        enabled: true,
        createdAt: Date.now(),
      });

      // Generate header assertions for important headers
      const importantHeaders = ['content-type', 'cache-control', 'etag'];
      importantHeaders.forEach(headerName => {
        const headerValue = response.headers[headerName.toLowerCase()];
        if (headerValue) {
          assertions.push({
            id: `header_${response.id}_${headerName}`,
            name: `${headerName} should be present`,
            type: 'header',
            target: 'response',
            condition: {
              operator: 'exists',
              path: headerName,
            },
            message: `Expected header ${headerName} to exist`,
            enabled: true,
            createdAt: Date.now(),
          });
        }
      });

      // Generate timing assertions
      if (response.duration > 0) {
        assertions.push({
          id: `timing_${response.id}`,
          name: `Response time should be reasonable`,
          type: 'timing',
          target: 'response',
          condition: {
            operator: 'less_than',
            value: Math.max(response.duration * 2, 5000), // 2x observed time or 5s max
          },
          message: `Response time should be under ${Math.max(response.duration * 2, 5000)}ms`,
          enabled: true,
          createdAt: Date.now(),
        });
      }
    });

    return assertions;
  }

  /**
   * Setup fetch and XHR interception
   */
  private setupInterception(): void {
    // Intercept fetch
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const request = await this.createRequestFromFetch(input, init);
      
      if (this.isRecording || this.isValidating) {
        this.requests.set(request.id, request);
      }

      const startTime = performance.now();
      const response = await this.originalFetch(input, init);
      const endTime = performance.now();

      const apiResponse = await this.createResponseFromFetch(
        request.id,
        response.clone(),
        endTime - startTime
      );

      if (this.isRecording || this.isValidating) {
        this.responses.set(apiResponse.id, apiResponse);
        
        if (this.isValidating) {
          const validationResult = await this.validateAPICall(request, apiResponse);
          this.validationResults.set(request.id, validationResult);
        }
      }

      return response;
    };

    // Intercept XMLHttpRequest
    XMLHttpRequest.prototype.open = function(
      method: string,
      url: string | URL,
      async?: boolean,
      user?: string | null,
      password?: string | null
    ): void {
      this._apiInterceptorData = {
        method,
        url: url.toString(),
        startTime: performance.now(),
        requestId: `xhr_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      };
      
      return this.constructor.prototype.open.call(this, method, url, async, user, password);
    };

    XMLHttpRequest.prototype.send = function(body?: Document | XMLHttpRequestBodyInit | null): void {
      // eslint-disable-next-line @typescript-eslint/no-this-alias
      const requestInstance = this;
      const interceptorData = this._apiInterceptorData;
      
      if (!interceptorData) {
        return this.constructor.prototype.send.call(this, body);
      }

      // Create request object
      const apiRequest: APIRequest = {
        id: interceptorData.requestId,
        method: interceptorData.method,
        url: interceptorData.url,
        headers: this.getAllRequestHeaders ? this.getAllRequestHeaders() : {},
        body,
        timestamp: Date.now(),
        source: 'xhr',
        metadata: {
          retryCount: 0,
          isBackground: false,
          priority: 'medium',
          tags: [],
        },
      };

      // Store request if recording/validating
      const apiInterceptor = (window as any).__apiInterceptor as APIInterceptor;
      if (apiInterceptor && (apiInterceptor.isRecording || apiInterceptor.isValidating)) {
        apiInterceptor.requests.set(apiRequest.id, apiRequest);
      }

      // Hook into response
      this.addEventListener('load', async function() {
        const endTime = performance.now();
        const duration = endTime - interceptorData.startTime;

        const apiResponse: APIResponse = {
          id: `response_${interceptorData.requestId}`,
          requestId: interceptorData.requestId,
          status: requestInstance.status,
          statusText: requestInstance.statusText,
          headers: requestInstance.getAllResponseHeaders ? parseHeaders(requestInstance.getAllResponseHeaders()) : {},
          body: requestInstance.responseText,
          size: requestInstance.responseText ? requestInstance.responseText.length : 0,
          duration,
          timestamp: Date.now(),
          metadata: {
            cached: false,
            fromServiceWorker: false,
            timing: {
              requestStart: interceptorData.startTime,
              responseStart: endTime - 10, // Approximation
              responseEnd: endTime,
            },
          },
        };

        if (apiInterceptor && (apiInterceptor.isRecording || apiInterceptor.isValidating)) {
          apiInterceptor.responses.set(apiResponse.id, apiResponse);
          
          if (apiInterceptor.isValidating) {
            const validationResult = await apiInterceptor.validateAPICall(apiRequest, apiResponse);
            apiInterceptor.validationResults.set(apiRequest.id, validationResult);
          }
        }
      });

      return this.constructor.prototype.send.call(this, body);
    };

    // Store interceptor instance globally for XHR access
    (window as any).__apiInterceptor = this;
  }

  /**
   * Create APIRequest from fetch parameters
   */
  private async createRequestFromFetch(
    input: RequestInfo | URL,
    init?: RequestInit
  ): Promise<APIRequest> {
    const url = input instanceof Request ? input.url : input.toString();
    const method = init?.method || (input instanceof Request ? input.method : 'GET');
    
    const headers: Record<string, string> = {};
    if (init?.headers) {
      if (init.headers instanceof Headers) {
        init.headers.forEach((value, key) => {
          headers[key.toLowerCase()] = value;
        });
      } else if (Array.isArray(init.headers)) {
        init.headers.forEach(([key, value]) => {
          headers[key.toLowerCase()] = value;
        });
      } else {
        Object.entries(init.headers).forEach(([key, value]) => {
          headers[key.toLowerCase()] = value;
        });
      }
    }

    return {
      id: `fetch_${++this.requestIdCounter}_${Date.now()}`,
      method: method.toUpperCase(),
      url,
      headers,
      body: init?.body,
      timestamp: Date.now(),
      source: 'fetch',
      metadata: {
        retryCount: 0,
        isBackground: false,
        priority: 'medium',
        tags: [],
      },
    };
  }

  /**
   * Create APIResponse from fetch Response
   */
  private async createResponseFromFetch(
    requestId: string,
    response: Response,
    duration: number
  ): Promise<APIResponse> {
    const headers: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      headers[key.toLowerCase()] = value;
    });

    let body: any;
    try {
      const contentType = headers['content-type'] || '';
      if (contentType.includes('application/json')) {
        body = await response.json();
      } else {
        body = await response.text();
      }
    } catch {
      body = null;
    }

    return {
      id: `response_${requestId}`,
      requestId,
      status: response.status,
      statusText: response.statusText,
      headers,
      body,
      size: body ? JSON.stringify(body).length : 0,
      duration,
      timestamp: Date.now(),
      metadata: {
        cached: false,
        fromServiceWorker: false,
        timing: {
          requestStart: Date.now() - duration,
          responseStart: Date.now() - duration / 2,
          responseEnd: Date.now(),
        },
      },
    };
  }

  /**
   * Validate API call against contracts and assertions
   */
  private async validateAPICall(
    request: APIRequest,
    response: APIResponse
  ): Promise<ValidationResult> {
    const startTime = performance.now();
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Find matching contract
    const contract = this.findMatchingContract(request);
    
    if (contract) {
      const endpoint = this.findMatchingEndpoint(contract, request);
      if (endpoint) {
        // Validate against contract
        const contractValidation = await this.validateAgainstContract(
          request,
          response,
          endpoint
        );
        errors.push(...contractValidation.errors);
        warnings.push(...contractValidation.warnings);
      }
    }

    // Run custom assertions
    const customAssertions = this.findMatchingAssertions(request);
    const assertionResults = await this.runAssertions(customAssertions, request, response);
    errors.push(...assertionResults.errors);
    warnings.push(...assertionResults.warnings);

    const validationTime = performance.now() - startTime;
    const totalAssertions = customAssertions.length + (contract ? 1 : 0);
    const failedAssertions = errors.filter(e => e.severity === 'error').length;

    return {
      passed: errors.length === 0,
      errors,
      warnings,
      metrics: {
        totalAssertions,
        passedAssertions: totalAssertions - failedAssertions,
        failedAssertions,
        validationTime,
        requestDuration: response.duration,
        responseSize: response.size,
      },
      requestId: request.id,
      contractId: contract?.id,
      timestamp: Date.now(),
    };
  }

  /**
   * Find contract matching the request
   */
  private findMatchingContract(request: APIRequest): APIContract | null {
    for (const contract of this.contracts.values()) {
      if (contract.baseUrl && request.url.startsWith(contract.baseUrl)) {
        return contract;
      }
    }
    return null;
  }

  /**
   * Find endpoint matching the request within a contract
   */
  private findMatchingEndpoint(contract: APIContract, request: APIRequest): EndpointContract | null {
    const url = new URL(request.url);
    const pathname = url.pathname;

    return contract.endpoints.find(endpoint => {
      if (endpoint.method.toUpperCase() !== request.method) {
        return false;
      }

      // Simple path matching - would need more sophisticated matching for path params
      return pathname === endpoint.path || pathname.match(new RegExp(endpoint.path.replace(/\{[^}]+\}/g, '[^/]+')));
    }) || null;
  }

  /**
   * Validate request/response against contract endpoint
   */
  private async validateAgainstContract(
    request: APIRequest,
    response: APIResponse,
    endpoint: EndpointContract
  ): Promise<{ errors: ValidationError[]; warnings: ValidationWarning[] }> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Validate response status
    if (!endpoint.responseSchemas[response.status]) {
      warnings.push({
        type: 'status',
        message: `Unexpected status code ${response.status} for ${endpoint.method} ${endpoint.path}`,
        suggestion: `Add schema for status code ${response.status}`,
      });
    }

    // Validate response schema if available
    const responseSchema = endpoint.responseSchemas[response.status];
    if (responseSchema && response.body) {
      try {
        // Would integrate with JSON Schema validation library
        // const validationResult = validateSchema(response.body, responseSchema);
        // if (!validationResult.valid) {
        //   errors.push(...validationResult.errors);
        // }
      } catch (err) {
        errors.push({
          type: 'schema',
          message: `Schema validation failed: ${err}`,
          severity: 'error',
        });
      }
    }

    // Validate required headers
    endpoint.headers?.forEach(headerContract => {
      if (headerContract.required) {
        const headerValue = response.headers[headerContract.name.toLowerCase()];
        if (!headerValue) {
          errors.push({
            type: 'header',
            message: `Required header '${headerContract.name}' is missing`,
            path: headerContract.name,
            severity: 'error',
          });
        }
      }
    });

    return { errors, warnings };
  }

  /**
   * Find assertions matching the request
   */
  private findMatchingAssertions(request: APIRequest): APIAssertion[] {
    const matchingAssertions: APIAssertion[] = [];

    for (const [pattern, assertions] of this.assertions.entries()) {
      try {
        if (request.url.match(new RegExp(pattern))) {
          matchingAssertions.push(...assertions.filter(a => a.enabled));
        }
      } catch {
        // Skip invalid regex patterns
      }
    }

    return matchingAssertions;
  }

  /**
   * Run custom assertions against request/response
   */
  private async runAssertions(
    assertions: APIAssertion[],
    request: APIRequest,
    response: APIResponse
  ): Promise<{ errors: ValidationError[]; warnings: ValidationWarning[] }> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    for (const assertion of assertions) {
      try {
        const result = this.evaluateAssertion(assertion, request, response);
        if (!result.passed) {
          errors.push({
            type: 'assertion',
            message: assertion.message,
            path: assertion.condition.path,
            expected: assertion.condition.value,
            actual: result.actualValue,
            severity: 'error',
          });
        }
      } catch (err) {
        warnings.push({
          type: 'assertion',
          message: `Assertion '${assertion.name}' failed to execute: ${err}`,
        });
      }
    }

    return { errors, warnings };
  }

  /**
   * Evaluate single assertion
   */
  private evaluateAssertion(
    assertion: APIAssertion,
    request: APIRequest,
    response: APIResponse
  ): { passed: boolean; actualValue?: any } {
    const target = assertion.target === 'request' ? request : response;
    const { condition } = assertion;

    let actualValue: any;

    // Extract value based on path
    if (condition.path) {
      if (assertion.type === 'header') {
        actualValue = target.headers[condition.path.toLowerCase()];
      } else if (assertion.type === 'body' && condition.path.startsWith('$.')) {
        // JSONPath evaluation - would need JSONPath library
        actualValue = this.evaluateJSONPath(target.body, condition.path);
      } else {
        actualValue = (target as any)[condition.path];
      }
    } else if (assertion.type === 'status') {
      actualValue = (response as APIResponse).status;
    } else if (assertion.type === 'timing') {
      actualValue = (response as APIResponse).duration;
    }

    // Evaluate condition
    switch (condition.operator) {
      case 'equals':
        return { passed: actualValue === condition.value, actualValue };
      case 'not_equals':
        return { passed: actualValue !== condition.value, actualValue };
      case 'contains':
        return { passed: String(actualValue).includes(condition.value), actualValue };
      case 'not_contains':
        return { passed: !String(actualValue).includes(condition.value), actualValue };
      case 'exists':
        return { passed: actualValue !== undefined && actualValue !== null, actualValue };
      case 'not_exists':
        return { passed: actualValue === undefined || actualValue === null, actualValue };
      case 'greater_than':
        return { passed: Number(actualValue) > Number(condition.value), actualValue };
      case 'less_than':
        return { passed: Number(actualValue) < Number(condition.value), actualValue };
      case 'matches': {
        try {
          const regex = new RegExp(condition.pattern!);
          return { passed: regex.test(String(actualValue)), actualValue };
        } catch {
          return { passed: false, actualValue };
        }
      }
      case 'not_matches': {
        try {
          const notRegex = new RegExp(condition.pattern!);
          return { passed: !notRegex.test(String(actualValue)), actualValue };
        } catch {
          return { passed: false, actualValue };
        }
      }
      default:
        return { passed: false, actualValue };
    }
  }

  /**
   * Simple JSONPath evaluation (placeholder)
   */
  private evaluateJSONPath(obj: any, path: string): any {
    // This would be implemented with a proper JSONPath library
    // For now, handle simple paths like $.data.id
    const parts = path.split('.').slice(1); // Remove '$'
    let current = obj;
    
    for (const part of parts) {
      if (current && typeof current === 'object') {
        current = current[part];
      } else {
        return undefined;
      }
    }
    
    return current;
  }
}

/**
 * Parse header string to object
 */
function parseHeaders(headerString: string): Record<string, string> {
  const headers: Record<string, string> = {};
  if (!headerString) return headers;

  headerString.split('\n').forEach(line => {
    const parts = line.split(': ');
    if (parts.length === 2) {
      headers[parts[0].toLowerCase()] = parts[1];
    }
  });

  return headers;
}

// Extend XMLHttpRequest type
declare global {
  interface XMLHttpRequest {
    _apiInterceptorData?: {
      method: string;
      url: string;
      startTime: number;
      requestId: string;
    };
  }
}