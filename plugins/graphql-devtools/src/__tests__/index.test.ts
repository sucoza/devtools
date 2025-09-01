import { describe, test, expect } from 'vitest';
import * as GraphqlDevtools from '../index';

describe('Graphql Devtools Plugin Exports', () => {
  test('should export main components and functions', () => {
    expect(GraphqlDevtools).toBeDefined();
    expect(typeof GraphqlDevtools).toBe('object');
  });

  test('should have required exports', () => {
    const keys = Object.keys(GraphqlDevtools);
    expect(keys.length).toBeGreaterThan(0);
    
    // Check for common plugin exports
    expect(GraphqlDevtools).toHaveProperty('default');
    expect(typeof GraphqlDevtools.default).toBe('function');
  });
});