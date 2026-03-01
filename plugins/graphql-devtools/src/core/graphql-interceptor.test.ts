import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { GraphQLInterceptor } from './graphql-interceptor';

// Mock the graphql-parser utils to prevent actual parsing
vi.mock('../utils/graphql-parser', () => ({
  isGraphQLRequest: vi.fn(() => false),
  extractGraphQLFromRequest: vi.fn(() => null),
}));

describe('GraphQLInterceptor.parseXHRResponseHeaders', () => {
  let interceptor: GraphQLInterceptor;
  let originalFetch: typeof fetch;
  let originalXHROpen: typeof XMLHttpRequest.prototype.open;
  let originalXHRSend: typeof XMLHttpRequest.prototype.send;

  beforeEach(() => {
    // Save originals
    originalFetch = window.fetch;
    originalXHROpen = XMLHttpRequest.prototype.open;
    originalXHRSend = XMLHttpRequest.prototype.send;

    // Create interceptor with enabled: false so it does NOT install hooks
    interceptor = new GraphQLInterceptor({
      enabled: false,
      endpoints: [],
      autoDetectEndpoints: false,
      maxOperationHistory: 100,
    });
  });

  afterEach(() => {
    interceptor.uninstall();
    // Restore originals in case they got overwritten
    window.fetch = originalFetch;
    XMLHttpRequest.prototype.open = originalXHROpen;
    XMLHttpRequest.prototype.send = originalXHRSend;
  });

  function parseHeaders(headerString: string): Record<string, string> {
    return (interceptor as any).parseXHRResponseHeaders(headerString);
  }

  it('parses simple headers correctly', () => {
    const headers = parseHeaders('Content-Type: application/json\r\nX-Request-Id: abc123');
    expect(headers['content-type']).toBe('application/json');
    expect(headers['x-request-id']).toBe('abc123');
  });

  it('parses headers with colons in values (the fix)', () => {
    const headerString = 'Set-Cookie: key=value; expires=Mon, 01 Jan 2024 00:00:00 GMT';
    const headers = parseHeaders(headerString);
    expect(headers['set-cookie']).toBe('key=value; expires=Mon, 01 Jan 2024 00:00:00 GMT');
  });

  it('returns empty object for empty string', () => {
    const headers = parseHeaders('');
    expect(headers).toEqual({});
  });

  it('returns empty object for null', () => {
    const headers = parseHeaders(null as any);
    expect(headers).toEqual({});
  });

  it('returns empty object for undefined', () => {
    const headers = parseHeaders(undefined as any);
    expect(headers).toEqual({});
  });

  it('lowercases header names', () => {
    const headers = parseHeaders('Content-Type: text/html\r\nX-Custom-Header: value');
    expect(headers).toHaveProperty('content-type');
    expect(headers).toHaveProperty('x-custom-header');
    expect(headers).not.toHaveProperty('Content-Type');
    expect(headers).not.toHaveProperty('X-Custom-Header');
  });

  it('parses multiple headers separated by \\r\\n', () => {
    const headerString = [
      'Content-Type: application/json',
      'Cache-Control: no-cache',
      'X-Powered-By: Express',
    ].join('\r\n');

    const headers = parseHeaders(headerString);
    expect(Object.keys(headers)).toHaveLength(3);
    expect(headers['content-type']).toBe('application/json');
    expect(headers['cache-control']).toBe('no-cache');
    expect(headers['x-powered-by']).toBe('Express');
  });

  it('handles trailing \\r\\n without creating empty entries', () => {
    const headers = parseHeaders('Content-Type: text/plain\r\n');
    expect(headers['content-type']).toBe('text/plain');
    expect(Object.keys(headers)).toHaveLength(1);
  });

  it('preserves full value when multiple colons exist (URL in value)', () => {
    const headerString = 'Location: https://example.com:8080/path?q=1';
    const headers = parseHeaders(headerString);
    expect(headers['location']).toBe('https://example.com:8080/path?q=1');
  });
});
