import { describe, it, expect } from 'vitest';
import { formatBytes } from './formatters';

describe('formatBytes', () => {
  it('returns "0 B" for zero bytes', () => {
    expect(formatBytes(0)).toBe('0 B');
  });

  it('formats bytes below 1 KB correctly', () => {
    expect(formatBytes(500)).toBe('500 B');
  });

  it('formats exactly 1 KB', () => {
    expect(formatBytes(1024)).toBe('1 KB');
  });

  it('formats exactly 1 MB', () => {
    expect(formatBytes(1048576)).toBe('1 MB');
  });

  it('formats with custom decimal precision', () => {
    expect(formatBytes(1536, 1)).toBe('1.5 KB');
  });

  it('handles negative byte values (the fix)', () => {
    expect(formatBytes(-1024)).toBe('-1 KB');
  });

  it('handles negative megabyte values', () => {
    expect(formatBytes(-1048576)).toBe('-1 MB');
  });

  it('handles negative byte values below 1 KB', () => {
    expect(formatBytes(-500)).toBe('-500 B');
  });

  it('handles large values in GB range', () => {
    expect(formatBytes(1073741824)).toBe('1 GB');
  });

  it('formats with zero decimals', () => {
    expect(formatBytes(1536, 0)).toBe('2 KB');
  });

  it('treats negative decimals as zero', () => {
    expect(formatBytes(1536, -1)).toBe('2 KB');
  });
});
