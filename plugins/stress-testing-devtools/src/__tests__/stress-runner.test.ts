import { describe, test, expect, beforeEach, vi } from 'vitest';
import { StressTestRunner } from '../stress-runner';

describe('StressTestRunner', () => {
  describe('XSRF cookie parsing', () => {
    beforeEach(() => {
      // Clear cookies and localStorage
      Object.defineProperty(document, 'cookie', {
        writable: true,
        value: '',
      });
      vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(null);
    });

    test('should parse simple XSRF cookie value', () => {
      Object.defineProperty(document, 'cookie', {
        writable: true,
        value: 'XSRF-TOKEN-WEBAPI=abc123',
      });

      const runner = new StressTestRunner(vi.fn());
      const authContext = (runner as any).authContext;
      expect(authContext.xsrfToken).toBe('abc123');
    });

    test('should preserve equals signs in base64 cookie value', () => {
      Object.defineProperty(document, 'cookie', {
        writable: true,
        value: 'XSRF-TOKEN-WEBAPI=dGVzdA==',
      });

      const runner = new StressTestRunner(vi.fn());
      const authContext = (runner as any).authContext;
      // Previously would have returned just "dGVzdA" (truncated at first =)
      expect(authContext.xsrfToken).toBe('dGVzdA==');
    });

    test('should handle cookie value with multiple equals signs', () => {
      Object.defineProperty(document, 'cookie', {
        writable: true,
        value: 'other=x; XSRF-TOKEN-WEBAPI=key=value=extra; session=y',
      });

      const runner = new StressTestRunner(vi.fn());
      const authContext = (runner as any).authContext;
      expect(authContext.xsrfToken).toBe('key=value=extra');
    });

    test('should handle missing XSRF cookie', () => {
      Object.defineProperty(document, 'cookie', {
        writable: true,
        value: 'other=value; session=abc',
      });

      const runner = new StressTestRunner(vi.fn());
      const authContext = (runner as any).authContext;
      expect(authContext.xsrfToken).toBeNull();
    });

    test('should handle empty cookie value', () => {
      Object.defineProperty(document, 'cookie', {
        writable: true,
        value: 'XSRF-TOKEN-WEBAPI=',
      });

      const runner = new StressTestRunner(vi.fn());
      const authContext = (runner as any).authContext;
      expect(authContext.xsrfToken).toBe('');
    });
  });
});
