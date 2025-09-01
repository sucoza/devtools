import { describe, test, expect } from 'vitest';
import * as FeatureFlagManager from '../index';

describe('Feature Flag Manager Plugin Exports', () => {
  test('should export main components and functions', () => {
    expect(FeatureFlagManager).toBeDefined();
    expect(typeof FeatureFlagManager).toBe('object');
  });

  test('should have required exports', () => {
    const keys = Object.keys(FeatureFlagManager);
    expect(keys.length).toBeGreaterThan(0);
    
    // Check for common plugin exports
    expect(FeatureFlagManager).toHaveProperty('default');
    expect(typeof FeatureFlagManager.default).toBe('function');
  });
});