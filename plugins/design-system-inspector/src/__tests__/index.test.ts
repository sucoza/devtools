import { describe, test, expect } from 'vitest';
import * as DesignSystemInspector from '../index';

describe('Design System Inspector Plugin Exports', () => {
  test('should export main components and functions', () => {
    expect(DesignSystemInspector).toBeDefined();
    expect(typeof DesignSystemInspector).toBe('object');
  });

  test('should have required exports', () => {
    const keys = Object.keys(DesignSystemInspector);
    expect(keys.length).toBeGreaterThan(0);
    
    // Check for common plugin exports
    expect(DesignSystemInspector).toHaveProperty('default');
    expect(typeof DesignSystemInspector.default).toBe('function');
  });
});