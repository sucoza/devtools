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
    
    // Check for actual plugin exports
    expect(MemoryPerformanceProfiler).toHaveProperty('MemoryProfilerPanel');
    expect(typeof MemoryPerformanceProfiler.MemoryProfilerPanel).toBe('function');
    
    expect(MemoryPerformanceProfiler).toHaveProperty('MemoryProfiler');
    expect(MemoryPerformanceProfiler).toHaveProperty('useMemoryProfilerStore');
    expect(MemoryPerformanceProfiler).toHaveProperty('memoryProfilerClient');
    expect(MemoryPerformanceProfiler).toHaveProperty('useMemoryProfilerDevTools');
  });
});