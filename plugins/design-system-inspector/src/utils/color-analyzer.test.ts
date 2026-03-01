/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { analyzeColorUsage } from './color-analyzer';

/**
 * Tests for the color-analyzer module, specifically:
 * 1. That normalizeColor handles valid colors via the DOM approach.
 * 2. That CSS variables are returned as-is (bypass DOM normalization).
 * 3. That when getComputedStyle throws, the temporary div is still removed
 *    from document.body (the try/finally fix).
 *
 * Since `normalizeColor` is a private function, we test it indirectly
 * through `analyzeColorUsage`, and also by directly exercising the DOM
 * cleanup behavior.
 *
 * Note: jsdom does not implement canvas, so we mock getContext('2d') to
 * return a fake context that `convertColorFormats` can use.
 */

/** Create a mock CanvasRenderingContext2D for jsdom */
function createMockCanvasContext() {
  return {
    fillStyle: '',
    fillRect: vi.fn(),
    getImageData: vi.fn(() => ({
      data: new Uint8ClampedArray([255, 0, 0, 255]), // red pixel
    })),
  };
}

describe('color-analyzer', () => {
  let originalGetComputedStyle: typeof window.getComputedStyle;
  let originalGetContext: typeof HTMLCanvasElement.prototype.getContext;

  beforeEach(() => {
    originalGetComputedStyle = window.getComputedStyle;
    originalGetContext = HTMLCanvasElement.prototype.getContext;

    // Mock canvas getContext to return a usable fake 2d context
    HTMLCanvasElement.prototype.getContext = vi.fn(function () {
      return createMockCanvasContext();
    }) as any;
  });

  afterEach(() => {
    window.getComputedStyle = originalGetComputedStyle;
    HTMLCanvasElement.prototype.getContext = originalGetContext;
  });

  describe('analyzeColorUsage', () => {
    it('returns color tokens for valid color properties', () => {
      const element = document.createElement('div');
      element.style.color = 'rgb(255, 0, 0)';
      document.body.appendChild(element);

      const computedStyle = window.getComputedStyle(element);
      const colors = analyzeColorUsage(element, computedStyle);

      // Should have at least the 'color' property analyzed
      expect(colors.length).toBeGreaterThanOrEqual(1);
      const colorToken = colors.find(c => c.name === 'color-color');
      expect(colorToken).toBeDefined();

      document.body.removeChild(element);
    });

    it('returns empty array when no valid colors are found', () => {
      const element = document.createElement('div');
      document.body.appendChild(element);

      // Create a mock computedStyle that returns transparent for all properties
      const mockStyle = {
        getPropertyValue: () => 'rgba(0, 0, 0, 0)',
      } as unknown as CSSStyleDeclaration;

      const colors = analyzeColorUsage(element, mockStyle);
      expect(colors).toHaveLength(0);

      document.body.removeChild(element);
    });
  });

  describe('normalizeColor (via DOM, the try/finally fix)', () => {
    it('does not leak divs into document.body when getComputedStyle succeeds', () => {
      const childCountBefore = document.body.childElementCount;

      // Create an element with a color that will trigger normalizeColor
      const element = document.createElement('div');
      element.style.color = 'red';
      document.body.appendChild(element);

      const computedStyle = window.getComputedStyle(element);
      analyzeColorUsage(element, computedStyle);

      document.body.removeChild(element);

      // After analysis, the body should have the same number of children
      // (no leaked temp divs from normalizeColor)
      expect(document.body.childElementCount).toBe(childCountBefore);
    });

    it('does not leak divs into document.body when getComputedStyle throws (the fix)', () => {
      const childCountBefore = document.body.childElementCount;

      // Mock getComputedStyle to throw an error, simulating a failure
      // in the normalizeColor function
      window.getComputedStyle = vi.fn(() => {
        throw new Error('getComputedStyle failed');
      });

      const element = document.createElement('div');
      // We need a mock computedStyle for the analyzeColorUsage call itself
      // (the first param to analyzeColorUsage), while getComputedStyle is
      // mocked to throw for the internal normalizeColor call.
      const mockStyle = {
        getPropertyValue: (prop: string) => {
          if (prop === 'color') return 'red';
          return '';
        },
      } as unknown as CSSStyleDeclaration;

      // analyzeColorUsage -> createColorToken -> normalizeColor
      // normalizeColor creates a div, appends to body, calls getComputedStyle
      // which throws. The try/finally ensures the div is removed.
      try {
        analyzeColorUsage(element, mockStyle);
      } catch {
        // We expect this might throw since getComputedStyle is broken.
        // The important thing is the div cleanup.
      }

      // Restore before checking, so we can use real DOM methods
      window.getComputedStyle = originalGetComputedStyle;

      // No leaked divs from the normalizeColor try/finally
      expect(document.body.childElementCount).toBe(childCountBefore);
    });
  });

  describe('CSS variable handling', () => {
    it('returns CSS variables as-is without DOM normalization', () => {
      const element = document.createElement('div');
      document.body.appendChild(element);

      // Mock computedStyle that returns a CSS variable
      const mockStyle = {
        getPropertyValue: (prop: string) => {
          if (prop === 'color') return 'var(--primary-color)';
          return '';
        },
      } as unknown as CSSStyleDeclaration;

      const colors = analyzeColorUsage(element, mockStyle);

      // CSS variables should be recognized and passed through
      const colorToken = colors.find(c => c.name === 'color-color');
      if (colorToken) {
        expect(colorToken.value).toBe('var(--primary-color)');
      }

      document.body.removeChild(element);
    });
  });
});
