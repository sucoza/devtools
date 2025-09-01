import { describe, test, expect } from 'vitest';
import * as StressTestingDevtools from '../index';

describe('Stress Testing Devtools Plugin Exports', () => {
  test('should export main components and functions', () => {
    expect(StressTestingDevtools).toBeDefined();
    expect(typeof StressTestingDevtools).toBe('object');
  });

  test('should have required exports', () => {
    const keys = Object.keys(StressTestingDevtools);
    expect(keys.length).toBeGreaterThan(0);
    
    // Check for common plugin exports
    expect(StressTestingDevtools).toHaveProperty('default');
    expect(typeof StressTestingDevtools.default).toBe('function');
  });
});