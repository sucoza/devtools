import { describe, test, expect } from 'vitest';
import {
  formatBytes,
  formatBytesPerSecond,
  calculateMemoryUtilization,
  calculateGrowthRate,
  generateMemoryStats,
} from '../utils/memory-utils';

describe('formatBytes', () => {
  test('returns "0 B" for zero', () => {
    expect(formatBytes(0)).toBe('0 B');
  });

  test('formats bytes correctly', () => {
    expect(formatBytes(500)).toBe('500 B');
    expect(formatBytes(1024)).toBe('1 KB');
    expect(formatBytes(1048576)).toBe('1 MB');
    expect(formatBytes(1073741824)).toBe('1 GB');
  });

  test('handles fractional byte values (< 1) without crashing', () => {
    // Previously, Math.log(0.5)/Math.log(1024) produced a negative index
    // causing sizes[i] to be undefined and returning "NaN undefined"
    const result = formatBytes(0.5);
    expect(result).toContain('B');
    expect(result).not.toContain('undefined');
    expect(result).not.toContain('NaN');
  });

  test('handles very small fractional values', () => {
    const result = formatBytes(0.001);
    expect(result).toContain('B');
    expect(result).not.toContain('undefined');
  });

  test('handles very large values beyond TB', () => {
    // 2 PB - should clamp to TB (last in sizes array)
    const result = formatBytes(2 * 1024 * 1024 * 1024 * 1024 * 1024);
    expect(result).toContain('TB');
    expect(result).not.toContain('undefined');
  });

  test('respects decimals parameter', () => {
    expect(formatBytes(1536, 0)).toBe('2 KB');
    expect(formatBytes(1536, 1)).toBe('1.5 KB');
    expect(formatBytes(1536, 3)).toBe('1.5 KB');
  });
});

describe('formatBytesPerSecond', () => {
  test('returns "0 B/s" for zero', () => {
    expect(formatBytesPerSecond(0)).toBe('0 B/s');
  });

  test('formats positive rates correctly', () => {
    expect(formatBytesPerSecond(1024)).toBe('1 KB/s');
    expect(formatBytesPerSecond(1048576)).toBe('1 MB/s');
  });

  test('handles negative rates', () => {
    const result = formatBytesPerSecond(-1024);
    expect(result).toBe('-1 KB/s');
  });

  test('handles very small absolute values (< 1) without crashing', () => {
    // Previously produced negative index causing "NaN undefined"
    const result = formatBytesPerSecond(0.5);
    expect(result).toContain('B/s');
    expect(result).not.toContain('undefined');
    expect(result).not.toContain('NaN');
  });

  test('handles very small negative values without crashing', () => {
    const result = formatBytesPerSecond(-0.001);
    expect(result).toContain('B/s');
    expect(result).not.toContain('undefined');
  });

  test('handles very large values beyond GB', () => {
    const result = formatBytesPerSecond(2 * 1024 * 1024 * 1024 * 1024);
    expect(result).toContain('GB/s');
    expect(result).not.toContain('undefined');
  });
});

describe('calculateMemoryUtilization', () => {
  test('returns 0 when limit is 0', () => {
    expect(calculateMemoryUtilization(100, 0)).toBe(0);
  });

  test('caps at 1 when used exceeds limit', () => {
    expect(calculateMemoryUtilization(200, 100)).toBe(1);
  });

  test('calculates ratio correctly', () => {
    expect(calculateMemoryUtilization(50, 100)).toBe(0.5);
  });
});

describe('calculateGrowthRate', () => {
  test('returns 0 for empty timeline', () => {
    expect(calculateGrowthRate([])).toBe(0);
  });

  test('returns 0 for single-point timeline', () => {
    expect(calculateGrowthRate([{ timestamp: 1000, usedMemory: 100 }])).toBe(0);
  });

  test('calculates positive growth rate', () => {
    const timeline = [
      { timestamp: 0, usedMemory: 1000 },
      { timestamp: 1000, usedMemory: 2000 },
    ];
    expect(calculateGrowthRate(timeline)).toBe(1000); // 1000 bytes per second
  });

  test('returns 0 when timestamps are identical', () => {
    const timeline = [
      { timestamp: 1000, usedMemory: 100 },
      { timestamp: 1000, usedMemory: 200 },
    ];
    expect(calculateGrowthRate(timeline)).toBe(0);
  });
});

describe('generateMemoryStats', () => {
  test('returns zeros for empty timeline', () => {
    const stats = generateMemoryStats([]);
    expect(stats.current).toBe(0);
    expect(stats.min).toBe(0);
    expect(stats.max).toBe(0);
    expect(stats.average).toBe(0);
    expect(stats.median).toBe(0);
    expect(stats.standardDeviation).toBe(0);
    expect(stats.duration).toBe(0);
  });

  test('calculates median for odd-length timeline', () => {
    const timeline = [
      { timestamp: 0, usedMemory: 100 },
      { timestamp: 1000, usedMemory: 200 },
      { timestamp: 2000, usedMemory: 300 },
    ];
    const stats = generateMemoryStats(timeline);
    expect(stats.median).toBe(200);
  });

  test('calculates median for even-length timeline', () => {
    const timeline = [
      { timestamp: 0, usedMemory: 100 },
      { timestamp: 1000, usedMemory: 200 },
      { timestamp: 2000, usedMemory: 300 },
      { timestamp: 3000, usedMemory: 400 },
    ];
    const stats = generateMemoryStats(timeline);
    expect(stats.median).toBe(250);
  });
});
