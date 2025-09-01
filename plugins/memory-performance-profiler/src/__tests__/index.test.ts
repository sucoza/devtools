import { describe, test, expect } from 'vitest';
import * as MemoryPerformanceProfiler from '../index';

describe('Memory Performance Profiler Plugin Exports', () => {
  test('should export main components and functions', () => {
    expect(MemoryPerformanceProfiler).toBeDefined();
    expect(typeof MemoryPerformanceProfiler).toBe('object');
  });

  test('should have required exports', () => {
    const keys = Object.keys(MemoryPerformanceProfiler);
    expect(keys.length).toBeGreaterThan(0);
    
    // Check for common plugin exports
    expect(MemoryPerformanceProfiler).toHaveProperty('default');
    expect(typeof MemoryPerformanceProfiler.default).toBe('function');
  });
});