import { describe, test, expect } from 'vitest';
import * as ApiMockInterceptor from '../index';

describe('API Mock Interceptor Plugin Exports', () => {
  test('should export main components and functions', () => {
    expect(ApiMockInterceptor).toBeDefined();
    expect(typeof ApiMockInterceptor).toBe('object');
  });

  test('should have required exports', () => {
    const keys = Object.keys(ApiMockInterceptor);
    expect(keys.length).toBeGreaterThan(0);
    
    // Check for common plugin exports
    expect(ApiMockInterceptor).toHaveProperty('default');
    expect(typeof ApiMockInterceptor.default).toBe('function');
  });
});