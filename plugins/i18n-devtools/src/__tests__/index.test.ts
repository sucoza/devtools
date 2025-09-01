import { describe, test, expect } from 'vitest';
import * as I18nDevtools from '../index';

describe('I18n Devtools Plugin Exports', () => {
  test('should export main components and functions', () => {
    expect(I18nDevtools).toBeDefined();
    expect(typeof I18nDevtools).toBe('object');
  });

  test('should have required exports', () => {
    const keys = Object.keys(I18nDevtools);
    expect(keys.length).toBeGreaterThan(0);
    
    // Check for common plugin exports
    expect(I18nDevtools).toHaveProperty('default');
    expect(typeof I18nDevtools.default).toBe('function');
  });
});