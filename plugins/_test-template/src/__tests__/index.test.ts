import { describe, test, expect } from 'vitest';
import * as PluginExports from '../index';

describe('Plugin Exports', () => {
  test('should have exports', () => {
    expect(PluginExports).toBeDefined();
    expect(typeof PluginExports).toBe('object');
  });

  test('should export main panel component', () => {
    // This test will need to be customized for each plugin
    const keys = Object.keys(PluginExports);
    expect(keys.length).toBeGreaterThan(0);
  });
});