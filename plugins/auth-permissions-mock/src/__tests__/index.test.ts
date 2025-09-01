import { describe, test, expect } from 'vitest';
import * as AuthPermissionsMock from '../index';

describe('Auth Permissions Mock Plugin Exports', () => {
  test('should export main components and functions', () => {
    expect(AuthPermissionsMock).toBeDefined();
    expect(typeof AuthPermissionsMock).toBe('object');
  });

  test('should have required exports', () => {
    const keys = Object.keys(AuthPermissionsMock);
    expect(keys.length).toBeGreaterThan(0);
    
    // Check for any functional exports
    const hasFunction = keys.some(key => typeof (AuthPermissionsMock as any)[key] === 'function');
    expect(hasFunction).toBe(true);
  });
});