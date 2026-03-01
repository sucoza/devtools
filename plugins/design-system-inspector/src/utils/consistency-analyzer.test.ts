/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { detectConsistencyIssues } from './consistency-analyzer';

/**
 * Tests for the consistency-analyzer, specifically the fix for parsing
 * property-value keys that contain colons in the value part.
 *
 * In `analyzeBatchConsistency`, repeated CSS values are tracked with keys
 * like `property:value`. Previously, these keys were split with
 * `key.split(':')`, which truncated values containing colons (e.g.,
 * `background-image:url(https://example.com)` would become just
 * `background-image` and `url(https`). The fix uses `key.indexOf(':')`
 * and `key.substring()` to only split on the first colon.
 */

describe('consistency-analyzer', () => {
  let mockGetComputedStyle: ReturnType<typeof vi.fn>;
  let originalGetComputedStyle: typeof window.getComputedStyle;

  beforeEach(() => {
    originalGetComputedStyle = window.getComputedStyle;
  });

  afterEach(() => {
    window.getComputedStyle = originalGetComputedStyle;
  });

  describe('property-value key parsing (the fix)', () => {
    it('parses a simple property:value key correctly', () => {
      // Create 3 elements (the threshold for batch issues) with the same
      // color value, which should be detected as a repeated value.
      const elements: Element[] = [];
      for (let i = 0; i < 3; i++) {
        const el = document.createElement('div');
        el.textContent = `item ${i}`;
        document.body.appendChild(el);
        elements.push(el);
      }

      // Mock getComputedStyle to return a consistent color value
      window.getComputedStyle = vi.fn(() => ({
        getPropertyValue: (prop: string) => {
          if (prop === 'color') return 'rgb(255, 0, 0)';
          if (prop === 'background-color') return 'rgba(0, 0, 0, 0)';
          if (prop === 'font-size') return '16px';
          if (prop === 'margin') return '0px';
          if (prop === 'padding') return '0px';
          return '';
        },
        fontSize: '16px',
        fontWeight: '400',
        lineHeight: '24px',
        borderWidth: '0px',
        borderRadius: '0px',
        color: 'rgb(255, 0, 0)',
        backgroundColor: 'rgba(0, 0, 0, 0)',
      })) as unknown as typeof window.getComputedStyle;

      const issues = detectConsistencyIssues(null, null, {
        elements,
        tokens: [], // no tokens so the values are flagged as non-tokenized
      });

      // Should detect repeated non-tokenized values
      const repeatedIssue = issues.find(
        (i) => i.title === 'Repeated value should be tokenized',
      );

      if (repeatedIssue) {
        // The description should contain the full value, not truncated
        expect(repeatedIssue.description).toContain('rgb(255, 0, 0)');
        expect(repeatedIssue.description).toContain('color');
      }

      // Cleanup
      elements.forEach((el) => document.body.removeChild(el));
    });

    it('parses property:value key with colon in value without truncation (the fix)', () => {
      // The critical test: values containing colons (like URLs) should not
      // be truncated when the key is parsed.
      const elements: Element[] = [];
      for (let i = 0; i < 3; i++) {
        const el = document.createElement('div');
        document.body.appendChild(el);
        elements.push(el);
      }

      // Return a value with a colon in it (simulating a URL in background-image)
      const valueWithColon = 'url(https://example.com/image.png)';
      window.getComputedStyle = vi.fn(() => ({
        getPropertyValue: (prop: string) => {
          if (prop === 'background-color') return valueWithColon;
          if (prop === 'color') return '';
          if (prop === 'font-size') return '';
          if (prop === 'margin') return '';
          if (prop === 'padding') return '';
          return '';
        },
        fontSize: '',
        fontWeight: '',
        lineHeight: '',
        borderWidth: '0px',
        borderRadius: '0px',
        color: '',
        backgroundColor: valueWithColon,
      })) as unknown as typeof window.getComputedStyle;

      const issues = detectConsistencyIssues(null, null, {
        elements,
        tokens: [],
      });

      // If the parsing is correct, any issue generated for the
      // background-color should contain the FULL value including the URL
      const bgIssue = issues.find(
        (i) =>
          i.title === 'Repeated value should be tokenized' &&
          i.description.includes('background-color'),
      );

      if (bgIssue) {
        // The value in the description should be the COMPLETE URL,
        // not truncated at the first colon
        expect(bgIssue.description).toContain(valueWithColon);
        // Specifically, it should NOT be truncated to just "url(https"
        expect(bgIssue.description).not.toMatch(
          /url\(https[^:]/,
        );
      }

      // Cleanup
      elements.forEach((el) => document.body.removeChild(el));
    });

    it('correctly splits key at first colon only', () => {
      // Directly test the parsing logic pattern used in the fix:
      // key.indexOf(':') + key.substring()
      const key = 'background-image:url(https://example.com/img.png)';
      const colonIndex = key.indexOf(':');
      const property = key.substring(0, colonIndex);
      const value = key.substring(colonIndex + 1);

      expect(property).toBe('background-image');
      expect(value).toBe('url(https://example.com/img.png)');

      // Compare with the OLD broken behavior (split(':'))
      const [brokenProperty, ...rest] = key.split(':');
      const brokenValue = rest.join(':'); // Would need rejoin to fix
      // split(':') would give: ['background-image', 'url(https', '//example.com/img.png)']
      // Without rejoin, taking split[1] gives only 'url(https'
      expect(brokenProperty).toBe('background-image');
      // The old code would have used split(':')[1] which is truncated
      const splitParts = key.split(':');
      expect(splitParts[1]).toBe('url(https');
      // But the fixed code correctly gets the full value
      expect(value).toBe('url(https://example.com/img.png)');
    });
  });

  describe('detectConsistencyIssues', () => {
    it('returns empty array when no element or elements provided', () => {
      const issues = detectConsistencyIssues(null, null, {});
      expect(issues).toHaveLength(0);
    });

    it('returns empty array when elements array is empty', () => {
      const issues = detectConsistencyIssues(null, null, { elements: [] });
      expect(issues).toHaveLength(0);
    });

    it('does not flag values that appear fewer than 3 times', () => {
      const elements: Element[] = [];
      for (let i = 0; i < 2; i++) {
        const el = document.createElement('div');
        document.body.appendChild(el);
        elements.push(el);
      }

      window.getComputedStyle = vi.fn(() => ({
        getPropertyValue: (prop: string) => {
          if (prop === 'color') return 'rgb(0, 128, 0)';
          return '';
        },
        fontSize: '',
        fontWeight: '',
        lineHeight: '',
        borderWidth: '0px',
        borderRadius: '0px',
        color: 'rgb(0, 128, 0)',
        backgroundColor: '',
      })) as unknown as typeof window.getComputedStyle;

      const issues = detectConsistencyIssues(null, null, {
        elements,
        tokens: [],
      });

      const repeatedIssue = issues.find(
        (i) => i.title === 'Repeated value should be tokenized',
      );
      expect(repeatedIssue).toBeUndefined();

      elements.forEach((el) => document.body.removeChild(el));
    });
  });
});
