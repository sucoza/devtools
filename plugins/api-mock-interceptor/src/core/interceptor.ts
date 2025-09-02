import type { ApiCall, ApiRequest, ApiResponse, HttpMethod } from '../types';
import { generateId, getTimestamp } from '../utils';

/**
 * Core API interceptor for fetch and XMLHttpRequest
 */
export class ApiInterceptor {
  private originalFetch: typeof fetch;
  private originalXMLHttpRequest: typeof XMLHttpRequest;
  private isInterceptingFetch = false;
  private isInterceptingXHR = false;
  private listeners: Set<(apiCall: ApiCall) => void> = new Set();

  constructor() {
    this.originalFetch = window.fetch;
    this.originalXMLHttpRequest = window.XMLHttpRequest;
  }

  /**
   * Enable fetch interception
   */
  enableFetchInterception(): void {
    if (this.isInterceptingFetch) {
      return;
    }

    this.isInterceptingFetch = true;
    
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const requestId = generateId();
      const startTime = getTimestamp();

      try {
        // Parse request details
        const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
        const method = (init?.method || 'GET').toUpperCase() as HttpMethod;
        
        // Build headers object
        const headers: Record<string, string> = {};
        if (init?.headers) {
          if (init.headers instanceof Headers) {
            init.headers.forEach((value, key) => {
              headers[key] = value;
            });
          } else if (Array.isArray(init.headers)) {
            init.headers.forEach(([key, value]) => {
              headers[key] = value;
            });
          } else {
            Object.entries(init.headers).forEach(([key, value]) => {
              headers[key] = value;
            });
          }
        }

        // Parse body
        let body: any = undefined;
        if (init?.body) {
          try {
            if (typeof init.body === 'string') {
              // Try to parse as JSON if it looks like JSON
              if (headers['content-type']?.includes('application/json')) {
                body = JSON.parse(init.body);
              } else {
                body = init.body;
              }
            } else if (init.body instanceof FormData) {
              const formDataObj: Record<string, any> = {};
              init.body.forEach((value, key) => {
                formDataObj[key] = value;
              });
              body = formDataObj;
            } else {
              body = init.body;
            }
          } catch {
            body = init.body;
          }
        }

        const request: ApiRequest = {
          id: requestId,
          url,
          method,
          headers,
          body,
          timestamp: startTime,
        };

        // Make the actual request
        const response = await this.originalFetch(input, init);
        const endTime = getTimestamp();
        const duration = endTime - startTime;

        // Clone response to read body without consuming it
        const responseClone = response.clone();
        
        // Parse response headers
        const responseHeaders: Record<string, string> = {};
        response.headers.forEach((value, key) => {
          responseHeaders[key] = value;
        });

        // Parse response body
        let responseBody: any = undefined;
        try {
          const contentType = response.headers.get('content-type');
          if (contentType?.includes('application/json')) {
            responseBody = await responseClone.json();
          } else if (contentType?.includes('text/')) {
            responseBody = await responseClone.text();
          }
        } catch {
          // If we can't parse the body, leave it undefined
        }

        const apiResponse: ApiResponse = {
          status: response.status,
          statusText: response.statusText,
          headers: responseHeaders,
          body: responseBody,
          timestamp: endTime,
        };

        const apiCall: ApiCall = {
          id: requestId,
          request: {
            ...request,
            duration,
          },
          response: apiResponse,
          isMocked: false,
          duration,
          timestamp: startTime,
        };

        // Notify listeners
        this.notifyListeners(apiCall);

        return response;
      } catch (error) {
        const endTime = getTimestamp();
        const duration = endTime - startTime;

        const apiCall: ApiCall = {
          id: requestId,
          request: {
            id: requestId,
            url: typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url,
            method: (init?.method || 'GET').toUpperCase() as HttpMethod,
            headers: {},
            timestamp: startTime,
            duration,
          },
          error: error instanceof Error ? error.message : 'Unknown error',
          isMocked: false,
          duration,
          timestamp: startTime,
        };

        this.notifyListeners(apiCall);
        throw error;
      }
    };
  }

  /**
   * Enable XMLHttpRequest interception
   */
  enableXHRInterception(): void {
    if (this.isInterceptingXHR) {
      return;
    }

    this.isInterceptingXHR = true;
    // Store reference to interceptor for closure

    const OriginalXHR = this.originalXMLHttpRequest;
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    (window as any).XMLHttpRequest = function(this: XMLHttpRequest) {
      const xhr = new OriginalXHR();
      const requestId = generateId();
      let startTime: number;
      const request: Partial<ApiRequest> = { id: requestId };

      // Override open method
      const originalOpen = xhr.open;
      xhr.open = function(method: string, url: string | URL, async?: boolean, user?: string | null, password?: string | null) {
        request.method = method.toUpperCase() as HttpMethod;
        request.url = typeof url === 'string' ? url : url.toString();
        request.headers = {};
        startTime = getTimestamp();
        request.timestamp = startTime;
        
        return originalOpen.call(this, method, url, async ?? true, user, password);
      };

      // Override setRequestHeader method
      const originalSetRequestHeader = xhr.setRequestHeader;
      xhr.setRequestHeader = function(name: string, value: string) {
        if (!request.headers) {
          request.headers = {};
        }
        request.headers[name] = value;
        return originalSetRequestHeader.call(this, name, value);
      };

      // Override send method
      const originalSend = xhr.send;
      xhr.send = function(body?: Document | XMLHttpRequestBodyInit | null) {
        if (body) {
          try {
            if (typeof body === 'string') {
              // Try to parse as JSON if it looks like JSON
              if (request.headers?.['content-type']?.includes('application/json')) {
                request.body = JSON.parse(body);
              } else {
                request.body = body;
              }
            } else if (body instanceof FormData) {
              const formDataObj: Record<string, any> = {};
              body.forEach((value, key) => {
                formDataObj[key] = value;
              });
              request.body = formDataObj;
            } else {
              request.body = body;
            }
          } catch {
            request.body = body;
          }
        }

        // Handle response
        const originalOnReadyStateChange = xhr.onreadystatechange;
        xhr.onreadystatechange = function() {
          if (xhr.readyState === 4) {
            const endTime = getTimestamp();
            const duration = endTime - startTime;

            // Parse response headers
            const responseHeaders: Record<string, string> = {};
            try {
              const headerStr = xhr.getAllResponseHeaders();
              if (headerStr) {
                headerStr.split('\r\n').forEach(line => {
                  const parts = line.split(': ');
                  if (parts.length === 2) {
                    responseHeaders[parts[0].toLowerCase()] = parts[1];
                  }
                });
              }
            } catch {
              // Ignore header parsing errors
            }

            // Parse response body
            let responseBody: any = undefined;
            try {
              const contentType = responseHeaders['content-type'];
              if (contentType?.includes('application/json')) {
                responseBody = JSON.parse(xhr.responseText);
              } else {
                responseBody = xhr.responseText;
              }
            } catch {
              responseBody = xhr.responseText;
            }

            const apiCall: ApiCall = {
              id: requestId,
              request: {
                ...request as ApiRequest,
                duration,
              },
              response: {
                status: xhr.status,
                statusText: xhr.statusText,
                headers: responseHeaders,
                body: responseBody,
                timestamp: endTime,
              },
              isMocked: false,
              duration,
              timestamp: startTime,
            };

            self.notifyListeners(apiCall);
          }

          if (originalOnReadyStateChange) {
            return originalOnReadyStateChange.call(this, new Event('readystatechange'));
          }
        };

        return originalSend.call(this, body);
      };

      return xhr;
    };

    // Copy static properties
    Object.setPrototypeOf(window.XMLHttpRequest, this.originalXMLHttpRequest);
    Object.setPrototypeOf(window.XMLHttpRequest.prototype, this.originalXMLHttpRequest.prototype);
  }

  /**
   * Disable fetch interception
   */
  disableFetchInterception(): void {
    if (this.isInterceptingFetch) {
      window.fetch = this.originalFetch;
      this.isInterceptingFetch = false;
    }
  }

  /**
   * Disable XMLHttpRequest interception
   */
  disableXHRInterception(): void {
    if (this.isInterceptingXHR) {
      window.XMLHttpRequest = this.originalXMLHttpRequest;
      this.isInterceptingXHR = false;
    }
  }

  /**
   * Enable all interception
   */
  enableInterception(): void {
    this.enableFetchInterception();
    this.enableXHRInterception();
  }

  /**
   * Disable all interception
   */
  disableInterception(): void {
    this.disableFetchInterception();
    this.disableXHRInterception();
  }

  /**
   * Add listener for API calls
   */
  addListener(listener: (apiCall: ApiCall) => void): void {
    this.listeners.add(listener);
  }

  /**
   * Remove listener for API calls
   */
  removeListener(listener: (apiCall: ApiCall) => void): void {
    this.listeners.delete(listener);
  }

  /**
   * Remove all listeners
   */
  clearListeners(): void {
    this.listeners.clear();
  }

  /**
   * Check if interception is active
   */
  get isIntercepting(): boolean {
    return this.isInterceptingFetch || this.isInterceptingXHR;
  }

  private notifyListeners(apiCall: ApiCall): void {
    this.listeners.forEach(listener => {
      try {
        listener(apiCall);
      } catch (error) {
        console.error('Error in API interceptor listener:', error);
      }
    });
  }
}

// Singleton instance
let interceptorInstance: ApiInterceptor | null = null;

export function getApiInterceptor(): ApiInterceptor {
  if (!interceptorInstance) {
    interceptorInstance = new ApiInterceptor();
  }
  return interceptorInstance;
}