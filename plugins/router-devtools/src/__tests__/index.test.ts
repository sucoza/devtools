import { describe, test, expect } from 'vitest';
import * as RouterDevtools from '../index';

describe('Router Devtools Plugin Exports', () => {
  test('should export main components and functions', () => {
    expect(RouterDevtools).toBeDefined();
    expect(typeof RouterDevtools).toBe('object');
  });

  test('should have required exports', () => {
    const keys = Object.keys(RouterDevtools);
    expect(keys.length).toBeGreaterThan(0);
    
    // Check for common plugin exports
    expect(RouterDevtools).toHaveProperty('default');
    expect(typeof RouterDevtools.default).toBe('function');
  });
});