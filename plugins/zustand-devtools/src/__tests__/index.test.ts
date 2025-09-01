import { describe, test, expect } from 'vitest';
import * as ZustandDevtools from '../index';

describe('Zustand Devtools Plugin Exports', () => {
  test('should export main components and functions', () => {
    expect(ZustandDevtools).toBeDefined();
    expect(typeof ZustandDevtools).toBe('object');
  });

  test('should have required exports', () => {
    const keys = Object.keys(ZustandDevtools);
    expect(keys.length).toBeGreaterThan(0);
    
    // Check for common plugin exports
    expect(ZustandDevtools).toHaveProperty('default');
    expect(typeof ZustandDevtools.default).toBe('function');
  });
});