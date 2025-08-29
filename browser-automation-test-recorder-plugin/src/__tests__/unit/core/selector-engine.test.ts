/**
 * Unit tests for Selector Engine
 * Tests the smart selector generation and element highlighting functionality
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { SelectorEngine } from '../../../core/selector-engine';
import type { SelectorOptions } from '../../../types';

describe('SelectorEngine', () => {
  let selectorEngine: SelectorEngine;
  let mockElement: HTMLElement;
  let mockDocument: Document;

  beforeEach(() => {
    selectorEngine = new SelectorEngine();
    
    // Create mock DOM environment
    mockDocument = document;
    
    // Create a test element with various attributes
    mockElement = document.createElement('button');
    mockElement.id = 'test-button';
    mockElement.className = 'btn btn-primary';
    mockElement.setAttribute('data-testid', 'submit-btn');
    mockElement.setAttribute('data-test', 'submit');
    mockElement.setAttribute('aria-label', 'Submit form');
    mockElement.setAttribute('name', 'submit');
    mockElement.textContent = 'Submit';
    mockElement.type = 'button';
    
    // Mock getBoundingClientRect
    mockElement.getBoundingClientRect = vi.fn(() => ({
      x: 100,
      y: 100,
      width: 120,
      height: 40,
      top: 100,
      left: 100,
      right: 220,
      bottom: 140,
      toJSON: vi.fn(),
    }));

    // Add to document
    document.body.appendChild(mockElement);

    // Mock querySelector methods
    document.querySelector = vi.fn();
    document.querySelectorAll = vi.fn();
  });

  afterEach(() => {
    // Clean up DOM
    if (mockElement.parentNode) {
      mockElement.parentNode.removeChild(mockElement);
    }
    vi.clearAllMocks();
  });

  describe('Constructor', () => {
    it('should initialize with default configuration', () => {
      expect(selectorEngine).toBeDefined();
      expect(selectorEngine).toBeInstanceOf(SelectorEngine);
    });
  });

  describe('generateSelector', () => {
    const defaultOptions: SelectorOptions = {
      includeId: true,
      includeClass: true,
      includeAttributes: true,
      includeText: true,
      includePosition: false,
      optimize: true,
      unique: true,
      stable: true,
      generateAlternatives: false,
      maxAlternatives: 3,
      customAttributes: ['data-testid'],
      ignoreAttributes: ['style'],
      ariaLabelFallback: true,
    };

    it('should generate ID selector for element with ID', async () => {
      // Mock querySelector to return the element for uniqueness check
      document.querySelector = vi.fn().mockReturnValue(mockElement);

      const selector = await selectorEngine.generateSelector(mockElement, defaultOptions);
      
      expect(selector).toBe('#test-button');
    });

    it('should generate data-testid selector when prioritized', async () => {
      // Mock querySelector to return the element for uniqueness check
      document.querySelector = vi.fn().mockReturnValue(mockElement);
      
      const options = {
        ...defaultOptions,
        priority: ['data-testid', 'id', 'css'],
      };

      const selector = await selectorEngine.generateSelector(mockElement, options);
      
      expect(selector).toBe('[data-testid="submit-btn"]');
    });

    it('should fallback to CSS selector when no unique attribute available', async () => {
      // Create element without unique identifiers
      const genericElement = document.createElement('span');
      genericElement.className = 'text-content';
      genericElement.textContent = 'Some text';
      document.body.appendChild(genericElement);

      // Mock querySelector to return null (not unique) then the element
      document.querySelector = vi.fn()
        .mockReturnValueOnce(null) // ID selector not found
        .mockReturnValueOnce(null) // data-testid not found
        .mockReturnValue(genericElement); // CSS selector found

      const selector = await selectorEngine.generateSelector(genericElement, defaultOptions);
      
      expect(selector).toContain('span');
      
      // Clean up
      document.body.removeChild(genericElement);
    });

    it('should throw error for invalid element', async () => {
      await expect(selectorEngine.generateSelector(null as any, defaultOptions))
        .rejects.toThrow('Invalid element provided');
    });

    it('should include text selector when enabled', async () => {
      const textElement = document.createElement('button');
      textElement.textContent = 'Click me';
      document.body.appendChild(textElement);

      // Mock querySelector for uniqueness checks
      document.querySelector = vi.fn()
        .mockReturnValueOnce(null) // No ID
        .mockReturnValueOnce(null) // No data-testid
        .mockReturnValue(textElement); // Text selector found

      const options = {
        ...defaultOptions,
        includeText: true,
        unique: false, // Allow non-unique for this test
      };

      const selector = await selectorEngine.generateSelector(textElement, options);
      
      expect(selector).toContain('Click me');
      
      // Clean up
      document.body.removeChild(textElement);
    });

    it('should respect custom attributes configuration', async () => {
      const customElement = document.createElement('div');
      customElement.setAttribute('data-custom', 'unique-value');
      document.body.appendChild(customElement);

      // Mock querySelector for uniqueness checks
      document.querySelector = vi.fn().mockReturnValue(customElement);

      const options = {
        ...defaultOptions,
        customAttributes: ['data-custom'],
        priority: ['data-custom', 'id', 'css'],
      };

      const selector = await selectorEngine.generateSelector(customElement, options);
      
      expect(selector).toBe('[data-custom="unique-value"]');
      
      // Clean up
      document.body.removeChild(customElement);
    });

    it('should ignore specified attributes', async () => {
      const styledElement = document.createElement('div');
      styledElement.setAttribute('style', 'color: red;');
      styledElement.setAttribute('data-stable', 'value');
      document.body.appendChild(styledElement);

      // Mock querySelector for uniqueness checks
      document.querySelector = vi.fn().mockReturnValue(styledElement);

      const options = {
        ...defaultOptions,
        ignoreAttributes: ['style'],
        customAttributes: ['data-stable'],
      };

      const selector = await selectorEngine.generateSelector(styledElement, options);
      
      expect(selector).not.toContain('style');
      expect(selector).toBe('[data-stable="value"]');
      
      // Clean up
      document.body.removeChild(styledElement);
    });
  });

  describe('generateAlternativeSelectors', () => {
    it('should generate multiple alternative selectors', async () => {
      // Mock querySelector for uniqueness checks
      document.querySelector = vi.fn().mockReturnValue(mockElement);

      const alternatives = await selectorEngine.generateAlternativeSelectors(mockElement, 3);
      
      expect(alternatives).toHaveLength(3);
      expect(alternatives).toContain('#test-button');
      expect(alternatives.some(sel => sel.includes('data-testid'))).toBe(true);
      expect(alternatives.some(sel => sel.includes('btn'))).toBe(true);
    });

    it('should return diverse selector types', async () => {
      // Mock querySelector for uniqueness checks
      document.querySelector = vi.fn().mockReturnValue(mockElement);

      const alternatives = await selectorEngine.generateAlternativeSelectors(mockElement, 5);
      
      // Should have different types of selectors
      const hasId = alternatives.some(sel => sel.startsWith('#'));
      const hasAttribute = alternatives.some(sel => sel.includes('['));
      const hasClass = alternatives.some(sel => sel.includes('.'));
      
      expect(hasId || hasAttribute || hasClass).toBe(true);
    });

    it('should limit alternatives to requested count', async () => {
      document.querySelector = vi.fn().mockReturnValue(mockElement);

      const alternatives = await selectorEngine.generateAlternativeSelectors(mockElement, 2);
      
      expect(alternatives.length).toBeLessThanOrEqual(2);
    });
  });

  describe('validateSelector', () => {
    it('should validate unique selectors', async () => {
      document.querySelectorAll = vi.fn().mockReturnValue([mockElement]); // Only one element

      const isValid = await selectorEngine.validateSelector('#test-button');
      
      expect(isValid.isUnique).toBe(true);
      expect(isValid.elementCount).toBe(1);
      expect(isValid.isValid).toBe(true);
    });

    it('should detect non-unique selectors', async () => {
      const secondButton = document.createElement('button');
      secondButton.className = 'btn btn-primary';
      document.body.appendChild(secondButton);

      document.querySelectorAll = vi.fn().mockReturnValue([mockElement, secondButton]);

      const isValid = await selectorEngine.validateSelector('.btn');
      
      expect(isValid.isUnique).toBe(false);
      expect(isValid.elementCount).toBe(2);
      expect(isValid.isValid).toBe(true); // Still valid, just not unique
      
      // Clean up
      document.body.removeChild(secondButton);
    });

    it('should detect invalid selectors', async () => {
      document.querySelectorAll = vi.fn().mockImplementation(() => {
        throw new Error('Invalid selector syntax');
      });

      const isValid = await selectorEngine.validateSelector('invalid>>>selector');
      
      expect(isValid.isValid).toBe(false);
      expect(isValid.error).toBeDefined();
    });

    it('should handle non-existent selectors', async () => {
      document.querySelectorAll = vi.fn().mockReturnValue([]);

      const isValid = await selectorEngine.validateSelector('#non-existent');
      
      expect(isValid.isUnique).toBe(false);
      expect(isValid.elementCount).toBe(0);
      expect(isValid.isValid).toBe(true); // Syntactically valid
    });
  });

  describe('highlightElement', () => {
    it('should highlight element with valid selector', async () => {
      document.querySelector = vi.fn().mockReturnValue(mockElement);
      
      // Mock createElement for overlay
      const mockOverlay = document.createElement('div');
      const originalCreateElement = document.createElement;
      document.createElement = vi.fn().mockReturnValue(mockOverlay);

      const result = await selectorEngine.highlightElement('#test-button');
      
      expect(result).toBe(true);
      expect(document.querySelector).toHaveBeenCalledWith('#test-button');
      
      // Restore createElement
      document.createElement = originalCreateElement;
    });

    it('should return false for invalid selector', async () => {
      document.querySelector = vi.fn().mockReturnValue(null);

      const result = await selectorEngine.highlightElement('#non-existent');
      
      expect(result).toBe(false);
    });

    it('should handle highlighting errors gracefully', async () => {
      document.querySelector = vi.fn().mockImplementation(() => {
        throw new Error('DOM error');
      });

      const result = await selectorEngine.highlightElement('#test-button');
      
      expect(result).toBe(false);
    });
  });

  describe('removeHighlight', () => {
    it('should remove existing highlight', async () => {
      document.querySelector = vi.fn().mockReturnValue(mockElement);
      
      // Mock createElement for overlay
      const mockOverlay = document.createElement('div');
      mockOverlay.remove = vi.fn();
      const originalCreateElement = document.createElement;
      document.createElement = vi.fn().mockReturnValue(mockOverlay);

      // First highlight an element
      await selectorEngine.highlightElement('#test-button');
      
      // Then remove highlight
      selectorEngine.removeHighlight();
      
      expect(mockOverlay.remove).toHaveBeenCalled();
      
      // Restore createElement
      document.createElement = originalCreateElement;
    });

    it('should handle removing non-existent highlight', () => {
      expect(() => selectorEngine.removeHighlight()).not.toThrow();
    });
  });

  describe('optimizeSelector', () => {
    it('should simplify complex selectors', () => {
      const complexSelector = 'html > body > div.container > div.row > div.col > button.btn.btn-primary';
      
      const optimized = selectorEngine.optimizeSelector(complexSelector);
      
      expect(optimized.length).toBeLessThan(complexSelector.length);
      expect(optimized).toContain('button');
    });

    it('should preserve important parts of selector', () => {
      const selector = 'div[data-testid="important"] button.submit';
      
      const optimized = selectorEngine.optimizeSelector(selector);
      
      expect(optimized).toContain('data-testid');
      expect(optimized).toContain('submit');
    });

    it('should handle already simple selectors', () => {
      const simpleSelector = '#unique-id';
      
      const optimized = selectorEngine.optimizeSelector(simpleSelector);
      
      expect(optimized).toBe(simpleSelector);
    });
  });

  describe('getSelectorScore', () => {
    it('should give high score to ID selectors', () => {
      const score = selectorEngine.getSelectorScore('#test-button', mockElement);
      
      expect(score).toBeGreaterThan(8); // ID selectors should score highly
    });

    it('should give medium score to attribute selectors', () => {
      const score = selectorEngine.getSelectorScore('[data-testid="submit-btn"]', mockElement);
      
      expect(score).toBeGreaterThan(6);
      expect(score).toBeLessThan(10);
    });

    it('should give low score to position-based selectors', () => {
      const score = selectorEngine.getSelectorScore('body > div:nth-child(3)', mockElement);
      
      expect(score).toBeLessThan(4);
    });

    it('should penalize complex selectors', () => {
      const simpleScore = selectorEngine.getSelectorScore('#test-button', mockElement);
      const complexScore = selectorEngine.getSelectorScore('html > body > div > div > button#test-button', mockElement);
      
      expect(simpleScore).toBeGreaterThan(complexScore);
    });
  });

  describe('isStableSelector', () => {
    it('should identify stable selectors', () => {
      expect(selectorEngine.isStableSelector('#unique-id')).toBe(true);
      expect(selectorEngine.isStableSelector('[data-testid="submit"]')).toBe(true);
      expect(selectorEngine.isStableSelector('[aria-label="Submit"]')).toBe(true);
    });

    it('should identify unstable selectors', () => {
      expect(selectorEngine.isStableSelector('.dynamic-class-123')).toBe(false);
      expect(selectorEngine.isStableSelector('div:nth-child(3)')).toBe(false);
      expect(selectorEngine.isStableSelector('[style="color: red;"]')).toBe(false);
    });

    it('should consider text selectors as moderately stable', () => {
      expect(selectorEngine.isStableSelector('button:contains("Submit")')).toBe(true);
      expect(selectorEngine.isStableSelector('*[text()="Click me"]')).toBe(true);
    });
  });

  describe('getCandidatesFromStrategy', () => {
    it('should generate candidates based on priority order', async () => {
      const strategy = {
        priority: ['data-testid', 'id', 'css'],
        fallback: true,
        optimize: true,
        includePosition: false,
      };

      const candidates = await selectorEngine.getCandidatesFromStrategy(mockElement, strategy);
      
      expect(candidates.length).toBeGreaterThan(0);
      expect(candidates[0].type).toBe('data-testid');
      expect(candidates.some(c => c.type === 'id')).toBe(true);
    });

    it('should respect fallback settings', async () => {
      const strategy = {
        priority: ['non-existent'],
        fallback: true,
        optimize: true,
        includePosition: false,
      };

      const candidates = await selectorEngine.getCandidatesFromStrategy(mockElement, strategy);
      
      // Should fallback to available selector types
      expect(candidates.length).toBeGreaterThan(0);
    });

    it('should exclude position selectors when disabled', async () => {
      const strategy = {
        priority: ['css', 'position'],
        fallback: true,
        optimize: true,
        includePosition: false,
      };

      const candidates = await selectorEngine.getCandidatesFromStrategy(mockElement, strategy);
      
      expect(candidates.every(c => c.type !== 'position')).toBe(true);
    });
  });

  describe('getElementStability', () => {
    it('should return high stability for elements with stable attributes', async () => {
      const stability = await selectorEngine.getElementStability(mockElement);
      
      expect(stability.score).toBeGreaterThan(0.7); // Has ID, data-testid, etc.
      expect(stability.hasStableId).toBe(true);
      expect(stability.hasTestId).toBe(true);
    });

    it('should return low stability for elements without stable attributes', async () => {
      const unstableElement = document.createElement('div');
      unstableElement.className = 'generated-class-' + Date.now();
      document.body.appendChild(unstableElement);

      const stability = await selectorEngine.getElementStability(unstableElement);
      
      expect(stability.score).toBeLessThan(0.5);
      expect(stability.hasStableId).toBe(false);
      expect(stability.hasTestId).toBe(false);
      
      // Clean up
      document.body.removeChild(unstableElement);
    });
  });

  describe('Edge Cases', () => {
    it('should handle elements with special characters in attributes', async () => {
      const specialElement = document.createElement('button');
      specialElement.id = 'test-button-with-"quotes"-and-[brackets]';
      specialElement.setAttribute('data-testid', 'special*chars');
      document.body.appendChild(specialElement);

      document.querySelector = vi.fn().mockReturnValue(specialElement);

      const selector = await selectorEngine.generateSelector(specialElement, {
        includeId: true,
        includeClass: false,
        includeAttributes: true,
        includeText: false,
        includePosition: false,
        optimize: true,
        unique: true,
        stable: true,
        generateAlternatives: false,
        maxAlternatives: 3,
        customAttributes: ['data-testid'],
        ignoreAttributes: [],
        ariaLabelFallback: true,
      });
      
      expect(selector).toBeDefined();
      expect(typeof selector).toBe('string');
      
      // Clean up
      document.body.removeChild(specialElement);
    });

    it('should handle deeply nested elements', async () => {
      const container = document.createElement('div');
      const nested = document.createElement('button');
      nested.textContent = 'Deeply nested';
      
      // Create deep nesting
      let current = container;
      for (let i = 0; i < 10; i++) {
        const div = document.createElement('div');
        current.appendChild(div);
        current = div;
      }
      current.appendChild(nested);
      document.body.appendChild(container);

      document.querySelector = vi.fn().mockReturnValue(nested);

      const selector = await selectorEngine.generateSelector(nested, {
        includeId: false,
        includeClass: false,
        includeAttributes: false,
        includeText: true,
        includePosition: false,
        optimize: true,
        unique: true,
        stable: false,
        generateAlternatives: false,
        maxAlternatives: 3,
        customAttributes: [],
        ignoreAttributes: [],
        ariaLabelFallback: true,
      });
      
      expect(selector).toBeDefined();
      expect(selector).toContain('Deeply nested');
      
      // Clean up
      document.body.removeChild(container);
    });

    it('should handle SVG elements', async () => {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('data-testid', 'svg-circle');
      svg.appendChild(circle);
      document.body.appendChild(svg);

      document.querySelector = vi.fn().mockReturnValue(circle);

      const selector = await selectorEngine.generateSelector(circle, {
        includeId: false,
        includeClass: false,
        includeAttributes: true,
        includeText: false,
        includePosition: false,
        optimize: true,
        unique: true,
        stable: true,
        generateAlternatives: false,
        maxAlternatives: 3,
        customAttributes: ['data-testid'],
        ignoreAttributes: [],
        ariaLabelFallback: true,
      });
      
      expect(selector).toBeDefined();
      expect(selector).toContain('data-testid');
      
      // Clean up
      document.body.removeChild(svg);
    });
  });
});