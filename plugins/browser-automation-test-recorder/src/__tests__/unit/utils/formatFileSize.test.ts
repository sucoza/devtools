import { describe, test, expect } from 'vitest';
import { formatFileSize } from '../../../utils/index';

describe('formatFileSize', () => {
  test('returns "0 B" for zero', () => {
    expect(formatFileSize(0)).toBe('0 B');
  });

  test('formats byte values correctly', () => {
    expect(formatFileSize(500)).toBe('500 B');
    expect(formatFileSize(1024)).toBe('1 KB');
    expect(formatFileSize(1048576)).toBe('1 MB');
  });

  test('handles fractional byte values (< 1) without crashing', () => {
    const result = formatFileSize(0.5);
    expect(result).toContain('B');
    expect(result).not.toContain('undefined');
    expect(result).not.toContain('NaN');
  });

  test('handles very large values beyond GB', () => {
    const result = formatFileSize(2 * 1024 * 1024 * 1024 * 1024);
    expect(result).toContain('GB');
    expect(result).not.toContain('undefined');
  });
});
