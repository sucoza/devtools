import type { ApiRequest, MockResponse, NetworkConditions } from '../types';

/**
 * Mock response generator and network condition simulator
 */
export class MockResponseEngine {
  /**
   * Create a mock Response object from MockResponse configuration
   */
  async createMockResponse(request: ApiRequest, mockResponse: MockResponse, networkConditions?: NetworkConditions): Promise<Response> {
    // Apply network conditions
    if (networkConditions) {
      await this.applyNetworkConditions(networkConditions);
    }

    // Apply delay if specified
    if (mockResponse.delay && mockResponse.delay > 0) {
      await this.delay(mockResponse.delay);
    }

    // Prepare response body
    let body: BodyInit | null = null;
    const headers = new Headers(mockResponse.headers || {});

    if (mockResponse.body !== undefined) {
      if (typeof mockResponse.body === 'string') {
        body = mockResponse.body;
      } else if (mockResponse.body instanceof ArrayBuffer) {
        body = mockResponse.body;
      } else {
        // Convert object to JSON
        body = JSON.stringify(mockResponse.body);
        if (!headers.has('content-type')) {
          headers.set('content-type', 'application/json');
        }
      }
    }

    // Set content-length if not already set
    if (body && !headers.has('content-length')) {
      const contentLength = typeof body === 'string' 
        ? new TextEncoder().encode(body).length 
        : body instanceof ArrayBuffer ? body.byteLength : 0;
      headers.set('content-length', contentLength.toString());
    }

    // Create Response object
    const response = new Response(body, {
      status: mockResponse.status,
      statusText: mockResponse.statusText || this.getDefaultStatusText(mockResponse.status),
      headers,
    });

    return response;
  }

  /**
   * Create a mock XMLHttpRequest response
   */
  createMockXHRResponse(xhr: XMLHttpRequest, request: ApiRequest, mockResponse: MockResponse, networkConditions?: NetworkConditions): void {
    const applyMock = async () => {
      try {
        // Apply network conditions
        if (networkConditions) {
          await this.applyNetworkConditions(networkConditions);
        }

        // Apply delay if specified
        if (mockResponse.delay && mockResponse.delay > 0) {
          await this.delay(mockResponse.delay);
        }

        // Set response properties
        Object.defineProperty(xhr, 'status', { value: mockResponse.status, writable: false });
        Object.defineProperty(xhr, 'statusText', { value: mockResponse.statusText || this.getDefaultStatusText(mockResponse.status), writable: false });
        Object.defineProperty(xhr, 'readyState', { value: 4, writable: false });

        // Prepare response text
        let responseText = '';
        if (mockResponse.body !== undefined) {
          if (typeof mockResponse.body === 'string') {
            responseText = mockResponse.body;
          } else {
            responseText = JSON.stringify(mockResponse.body);
          }
        }
        
        Object.defineProperty(xhr, 'responseText', { value: responseText, writable: false });
        Object.defineProperty(xhr, 'response', { value: responseText, writable: false });

        // Mock getAllResponseHeaders
        const _originalGetAllResponseHeaders = xhr.getAllResponseHeaders;
        xhr.getAllResponseHeaders = () => {
          const headers = mockResponse.headers || {};
          return Object.entries(headers)
            .map(([key, value]) => `${key}: ${value}`)
            .join('\r\n');
        };

        // Mock getResponseHeader
        const _originalGetResponseHeader = xhr.getResponseHeader;
        xhr.getResponseHeader = (name: string) => {
          const headers = mockResponse.headers || {};
          const headerName = Object.keys(headers).find(key => key.toLowerCase() === name.toLowerCase());
          return headerName ? headers[headerName] : null;
        };

        // Trigger readystatechange event
        if (xhr.onreadystatechange) {
          xhr.onreadystatechange(new Event('readystatechange'));
        }

        // Trigger load event
        if (xhr.onload) {
          xhr.onload({} as ProgressEvent);
        }
      } catch {
        // Trigger error event
        Object.defineProperty(xhr, 'readyState', { value: 4, writable: false });
        
        if (xhr.onerror) {
          xhr.onerror({} as ProgressEvent);
        }
      }
    };

    // Start async mock response
    setTimeout(applyMock, 0);
  }

  /**
   * Generate dynamic mock responses using templates
   */
  generateDynamicResponse(template: any, request: ApiRequest): any {
    if (typeof template !== 'object' || template === null) {
      return template;
    }

    if (Array.isArray(template)) {
      return template.map(item => this.generateDynamicResponse(item, request));
    }

    const result: any = {};
    for (const [key, value] of Object.entries(template)) {
      if (typeof value === 'string' && value.startsWith('{{') && value.endsWith('}}')) {
        // Template variable
        const variable = value.slice(2, -2).trim();
        result[key] = this.evaluateTemplate(variable, request);
      } else if (typeof value === 'object') {
        result[key] = this.generateDynamicResponse(value, request);
      } else {
        result[key] = value;
      }
    }

    return result;
  }

  /**
   * Apply network conditions (latency, failures, etc.)
   */
  private async applyNetworkConditions(conditions: NetworkConditions): Promise<void> {
    // Simulate offline condition
    if (conditions.offline) {
      throw new Error('Network is offline');
    }

    // Simulate random failures
    if (conditions.failureRate && Math.random() < conditions.failureRate) {
      throw new Error('Network request failed');
    }

    // Apply latency
    if (conditions.latency && conditions.latency > 0) {
      await this.delay(conditions.latency);
    }

    // Throttling would be implemented here in a real scenario
    // For now, we'll just apply additional delay based on throughput
    if (conditions.throttling) {
      const additionalDelay = Math.max(
        100, // minimum delay
        Math.min(conditions.throttling.downloadThroughput, conditions.throttling.uploadThroughput) / 1000
      );
      await this.delay(additionalDelay);
    }
  }

  /**
   * Simple delay utility
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get default status text for HTTP status codes
   */
  private getDefaultStatusText(status: number): string {
    const statusTexts: Record<number, string> = {
      200: 'OK',
      201: 'Created',
      202: 'Accepted',
      204: 'No Content',
      400: 'Bad Request',
      401: 'Unauthorized',
      403: 'Forbidden',
      404: 'Not Found',
      405: 'Method Not Allowed',
      409: 'Conflict',
      422: 'Unprocessable Entity',
      429: 'Too Many Requests',
      500: 'Internal Server Error',
      501: 'Not Implemented',
      502: 'Bad Gateway',
      503: 'Service Unavailable',
      504: 'Gateway Timeout',
    };

    return statusTexts[status] || 'Unknown';
  }

  /**
   * Evaluate template variables
   */
  private evaluateTemplate(variable: string, request: ApiRequest): any {
    switch (variable.toLowerCase()) {
      case 'timestamp':
        return Date.now();
      case 'iso_date':
        return new Date().toISOString();
      case 'request_method':
        return request.method;
      case 'request_url':
        return request.url;
      case 'random_id':
        return Math.random().toString(36).substr(2, 9);
      case 'random_uuid':
        return this.generateUUID();
      case 'random_number':
        return Math.floor(Math.random() * 1000);
      case 'random_string':
        return Math.random().toString(36).substr(2, 10);
      default:
        // Try to extract from request data
        if (variable.startsWith('request.')) {
          const path = variable.substring(8);
          return this.getNestedValue(request, path);
        }
        return `{{${variable}}}`;
    }
  }

  /**
   * Get nested value from object using dot notation
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  /**
   * Generate a UUID v4
   */
  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
}

// Singleton instance
let mockerInstance: MockResponseEngine | null = null;

export function getMockResponseEngine(): MockResponseEngine {
  if (!mockerInstance) {
    mockerInstance = new MockResponseEngine();
  }
  return mockerInstance;
}