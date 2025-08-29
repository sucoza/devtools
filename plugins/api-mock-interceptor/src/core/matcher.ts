import type { ApiRequest, RequestMatcher, HttpMethod } from '../types';
import { matchUrl } from '../utils';

/**
 * Request matching system for mock rules
 */
export class RequestMatcherEngine {
  /**
   * Check if a request matches a given matcher configuration
   */
  matches(request: ApiRequest, matcher: RequestMatcher): boolean {
    // URL matching
    if (matcher.url && request.url !== matcher.url) {
      return false;
    }

    if (matcher.urlPattern && !matchUrl(request.url, matcher.urlPattern)) {
      return false;
    }

    // Method matching
    if (matcher.method) {
      if (Array.isArray(matcher.method)) {
        if (!matcher.method.includes(request.method)) {
          return false;
        }
      } else {
        if (request.method !== matcher.method) {
          return false;
        }
      }
    }

    // Headers matching
    if (matcher.headers) {
      for (const [key, value] of Object.entries(matcher.headers)) {
        const requestHeaderValue = request.headers[key.toLowerCase()] || request.headers[key];
        
        if (!requestHeaderValue) {
          return false;
        }

        // Support wildcard matching in header values
        if (value.includes('*')) {
          const regexPattern = value.replace(/\*/g, '.*');
          const regex = new RegExp(`^${regexPattern}$`, 'i');
          if (!regex.test(requestHeaderValue)) {
            return false;
          }
        } else if (requestHeaderValue.toLowerCase() !== value.toLowerCase()) {
          return false;
        }
      }
    }

    // Body matching (basic implementation)
    if (matcher.body !== undefined) {
      if (typeof matcher.body === 'string' && typeof request.body === 'string') {
        return request.body.includes(matcher.body);
      }
      
      if (typeof matcher.body === 'object' && typeof request.body === 'object') {
        return this.deepMatch(request.body, matcher.body);
      }
      
      // Exact match for other types
      if (request.body !== matcher.body) {
        return false;
      }
    }

    return true;
  }

  /**
   * Find all matching rules for a request, sorted by priority
   */
  findMatches(request: ApiRequest, matchers: Array<{ id: string; matcher: RequestMatcher; priority: number; enabled: boolean }>): string[] {
    return matchers
      .filter(({ enabled }) => enabled)
      .filter(({ matcher }) => this.matches(request, matcher))
      .sort((a, b) => b.priority - a.priority) // Higher priority first
      .map(({ id }) => id);
  }

  /**
   * Deep matching for object comparison (simplified)
   */
  private deepMatch(requestObj: any, matcherObj: any): boolean {
    if (requestObj === matcherObj) {
      return true;
    }

    if (typeof requestObj !== 'object' || typeof matcherObj !== 'object') {
      return false;
    }

    if (requestObj === null || matcherObj === null) {
      return requestObj === matcherObj;
    }

    // Check if all matcher properties exist in request
    for (const key in matcherObj) {
      if (!(key in requestObj)) {
        return false;
      }

      if (!this.deepMatch(requestObj[key], matcherObj[key])) {
        return false;
      }
    }

    return true;
  }

  /**
   * Create a matcher from a request (for quick rule creation)
   */
  createMatcherFromRequest(request: ApiRequest, options?: {
    includeHeaders?: string[];
    includeBody?: boolean;
    useUrlPattern?: boolean;
  }): RequestMatcher {
    const matcher: RequestMatcher = {
      method: request.method,
    };

    if (options?.useUrlPattern) {
      // Convert URL to a pattern (replace dynamic segments)
      matcher.urlPattern = this.urlToPattern(request.url);
    } else {
      matcher.url = request.url;
    }

    // Include specific headers
    if (options?.includeHeaders?.length) {
      matcher.headers = {};
      options.includeHeaders.forEach(headerName => {
        const value = request.headers[headerName.toLowerCase()] || request.headers[headerName];
        if (value) {
          matcher.headers![headerName] = value;
        }
      });
    }

    // Include body
    if (options?.includeBody && request.body !== undefined) {
      matcher.body = request.body;
    }

    return matcher;
  }

  /**
   * Convert a URL to a pattern by replacing potential dynamic segments
   */
  private urlToPattern(url: string): string {
    try {
      const urlObj = new URL(url);
      let pathname = urlObj.pathname;

      // Replace common ID patterns
      pathname = pathname.replace(/\/\d+/g, '/\\d+'); // Replace /123 with /\d+
      pathname = pathname.replace(/\/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/gi, '/[a-f0-9-]+'); // UUIDs
      pathname = pathname.replace(/\/[a-f0-9]{24}/g, '/[a-f0-9]{24}'); // MongoDB ObjectIds

      urlObj.pathname = pathname;
      return urlObj.toString();
    } catch {
      return url;
    }
  }
}

// Singleton instance
let matcherInstance: RequestMatcherEngine | null = null;

export function getRequestMatcher(): RequestMatcherEngine {
  if (!matcherInstance) {
    matcherInstance = new RequestMatcherEngine();
  }
  return matcherInstance;
}