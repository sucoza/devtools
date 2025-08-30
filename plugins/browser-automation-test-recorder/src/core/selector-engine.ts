/**
 * Smart Selector Engine
 * Generates reliable, maintainable selectors for browser automation
 */

import type { SelectorOptions } from '../types';

/**
 * Selector generation strategies with reliability scoring
 */
export interface SelectorCandidate {
  selector: string;
  type: SelectorType;
  score: number;
  unique: boolean;
  stable: boolean;
  description: string;
}

export type SelectorType = 
  | 'id'
  | 'data-testid' 
  | 'data-test'
  | 'aria-label'
  | 'name'
  | 'placeholder' 
  | 'text'
  | 'css'
  | 'xpath'
  | 'position';

/**
 * Element highlighting overlay for visual selector feedback
 */
export interface ElementHighlight {
  element: Element;
  selector: string;
  bounds: DOMRect;
  overlay?: HTMLElement;
}

/**
 * Advanced selector engine with multiple strategies and auto-healing
 */
export class SelectorEngine {
  private currentHighlight: ElementHighlight | null = null;
  private selectorCache = new Map<string, SelectorCandidate>();
  private stabilityScores = new Map<string, number>();
  
  // Selector strategy configuration
  private readonly strategyWeights: Record<SelectorType, number> = {
    'id': 10,
    'data-testid': 9,
    'data-test': 8,
    'aria-label': 7,
    'name': 6,
    'placeholder': 5,
    'text': 4,
    'css': 3,
    'xpath': 2,
    'position': 1,
  };

  // Common unstable attributes to avoid
  private readonly unstableAttributes = new Set([
    'style',
    'class',
    'data-reactid',
    'data-react-checksum',
    'data-v-',
    'ng-',
  ]);

  /**
   * Generate the best selector for an element using configured strategy
   */
  async generateSelector(element: Element, options: SelectorOptions): Promise<string> {
    if (!element || !element.tagName) {
      throw new Error('Invalid element provided');
    }

    // Generate all possible selector candidates
    const candidates = await this.generateAllCandidates(element, options);
    
    // Filter by requirements
    let viableCandidates = candidates.filter(candidate => {
      if (options.unique && !candidate.unique) return false;
      if (options.stable && !candidate.stable) return false;
      return true;
    });

    // If no viable candidates with strict requirements, fallback
    if (viableCandidates.length === 0) {
      // console.warn('SelectorEngine: No viable candidates with strict requirements, using fallback');
      viableCandidates = candidates.slice(0, 3); // Take top 3 candidates
    }

    // Sort by priority and score
    viableCandidates.sort((a, b) => {
      const priorityDiff = this.getPriorityIndex(a.type, options.priority) - 
                          this.getPriorityIndex(b.type, options.priority);
      if (priorityDiff !== 0) return priorityDiff;
      return b.score - a.score; // Higher score is better
    });

    const bestCandidate = viableCandidates[0];
    
    if (!bestCandidate) {
      throw new Error('No valid selector could be generated');
    }

    // Cache the result for stability tracking
    this.selectorCache.set(this.getElementKey(element), bestCandidate);
    
    return bestCandidate.selector;
  }

  /**
   * Generate multiple alternative selectors for resilience
   */
  async generateAlternativeSelectors(element: Element, maxAlternatives: number = 3): Promise<string[]> {
    const candidates = await this.generateAllCandidates(element, {
      includeId: true,
      includeClass: true,
      includeAttributes: true,
      includeText: true,
      includePosition: true,
      optimize: true,
      unique: false, // Allow non-unique for alternatives
      stable: false, // Allow less stable for alternatives
      generateAlternatives: true,
      maxAlternatives,
      customAttributes: ['data-testid', 'data-test'],
      ignoreAttributes: ['style'],
      ariaLabelFallback: true,
    });

    // Return diverse set of alternatives
    const alternatives: string[] = [];
    const usedTypes = new Set<SelectorType>();
    
    for (const candidate of candidates.slice(0, maxAlternatives * 2)) {
      if (alternatives.length >= maxAlternatives) break;
      
      // Prefer different types for diversity
      if (!usedTypes.has(candidate.type)) {
        alternatives.push(candidate.selector);
        usedTypes.add(candidate.type);
      }
    }

    // Fill remaining slots with best available
    for (const candidate of candidates) {
      if (alternatives.length >= maxAlternatives) break;
      if (!alternatives.includes(candidate.selector)) {
        alternatives.push(candidate.selector);
      }
    }

    return alternatives;
  }

  /**
   * Generate XPath selector for element
   */
  generateXPath(element: Element): string {
    if (!element || element === document.documentElement) {
      return '/html';
    }

    // Try ID-based XPath first
    if (element.id) {
      const idXPath = `//*[@id="${element.id}"]`;
      if (this.isUniqueSelector(idXPath)) {
        return idXPath;
      }
    }

    // Build hierarchical XPath
    const parts: string[] = [];
    let current: Element | null = element;

    while (current && current !== document.documentElement) {
      const tagName = current.tagName.toLowerCase();
      let selector = tagName;

      // Add position predicate if needed
      const siblings = Array.from(current.parentElement?.children || [])
        .filter(child => child.tagName.toLowerCase() === tagName);
      
      if (siblings.length > 1) {
        const index = siblings.indexOf(current) + 1;
        selector += `[${index}]`;
      }

      parts.unshift(selector);
      current = current.parentElement;
    }

    return '/html/body/' + parts.join('/');
  }

  /**
   * Generate simple CSS selector for single element (used internally)
   */
  generateSelectorForElement(element: Element): string {
    if (element.id) {
      return `#${CSS.escape(element.id)}`;
    }
    
    const tagName = element.tagName.toLowerCase();
    const classes = element.className.split(' ').filter(Boolean);
    
    if (classes.length > 0) {
      return `${tagName}.${classes.map(cls => CSS.escape(cls)).join('.')}`;
    }
    
    return tagName;
  }

  /**
   * Evaluate selector stability for reliability scoring
   */
  async evaluateSelectorStability(selector: string, element: Element): Promise<number> {
    // Check if we have cached stability score
    const cached = this.stabilityScores.get(selector);
    if (cached !== undefined) {
      return cached;
    }

    let score = 0;

    try {
      // Test selector uniqueness
      const elements = document.querySelectorAll(selector);
      if (elements.length === 1) {
        score += 0.3;
      } else if (elements.length > 1) {
        score -= 0.2; // Penalize ambiguous selectors
      }

      // Analyze selector composition
      if (selector.includes('#')) score += 0.3; // ID selectors are stable
      if (selector.includes('[data-testid')) score += 0.25; // Test IDs are stable
      if (selector.includes('[data-test')) score += 0.2; // Test attributes are stable
      if (selector.includes('[aria-')) score += 0.15; // ARIA attributes are stable
      if (selector.includes('[name=')) score += 0.1; // Name attributes are stable
      
      // Penalize brittle patterns
      if (selector.includes(':nth-child')) score -= 0.2;
      if (selector.includes('.') && selector.split('.').length > 3) score -= 0.1;
      if (selector.length > 100) score -= 0.1; // Very long selectors are fragile
      
      // Check element stability factors
      const stability = this.analyzeElementStability(element);
      score += stability * 0.2;

    } catch (error) {
      // console.error('SelectorEngine: Error evaluating stability');
      score = 0.1; // Minimum score for failed evaluation
    }

    // Normalize score to 0-1 range
    score = Math.max(0, Math.min(1, score));
    
    // Cache the result
    this.stabilityScores.set(selector, score);
    
    return score;
  }

  /**
   * Highlight element on page for visual feedback
   */
  highlightElement(selector: string | Element | null): void {
    // Clear existing highlight
    this.clearHighlight();

    if (!selector) return;

    try {
      let element: Element | null;
      
      if (typeof selector === 'string') {
        element = document.querySelector(selector);
      } else {
        element = selector;
      }

      if (!element) {
        // console.warn('SelectorEngine: Element not found for highlighting:', selector);
        return;
      }

      // Create highlight overlay
      const overlay = this.createHighlightOverlay(element);
      document.body.appendChild(overlay);

      // Store current highlight
      this.currentHighlight = {
        element,
        selector: typeof selector === 'string' ? selector : this.generateSelectorForElement(element),
        bounds: element.getBoundingClientRect(),
        overlay,
      };

      // Auto-remove highlight after 5 seconds
      setTimeout(() => {
        if (this.currentHighlight?.overlay === overlay) {
          this.clearHighlight();
        }
      }, 5000);

    } catch (error) {
      // console.error('SelectorEngine: Error highlighting element');
    }
  }

  /**
   * Clear current element highlight
   */
  clearHighlight(): void {
    if (this.currentHighlight?.overlay) {
      this.currentHighlight.overlay.remove();
    }
    this.currentHighlight = null;
  }

  /**
   * Get current highlighted element
   */
  getCurrentHighlight(): ElementHighlight | null {
    return this.currentHighlight;
  }

  /**
   * Generate all possible selector candidates for an element
   */
  private async generateAllCandidates(element: Element, options: SelectorOptions): Promise<SelectorCandidate[]> {
    const candidates: SelectorCandidate[] = [];

    // ID selector
    if (options.includeId && element.id) {
      const selector = `#${CSS.escape(element.id)}`;
      candidates.push({
        selector,
        type: 'id',
        score: await this.scoreSelectorCandidate(selector, element, 'id'),
        unique: this.isUniqueSelector(selector),
        stable: true,
        description: `ID selector: ${element.id}`,
      });
    }

    // Data attribute selectors
    if (options.includeAttributes) {
      for (const attr of options.customAttributes || []) {
        const value = element.getAttribute(attr);
        if (value) {
          const selector = `[${attr}="${value}"]`;
          candidates.push({
            selector,
            type: attr.includes('testid') ? 'data-testid' : 'data-test',
            score: await this.scoreSelectorCandidate(selector, element, 'data-testid'),
            unique: this.isUniqueSelector(selector),
            stable: true,
            description: `${attr} attribute: ${value}`,
          });
        }
      }

      // ARIA label selector
      if (options.ariaLabelFallback && element.getAttribute('aria-label')) {
        const ariaLabel = element.getAttribute('aria-label')!;
        const selector = `[aria-label="${ariaLabel}"]`;
        candidates.push({
          selector,
          type: 'aria-label',
          score: await this.scoreSelectorCandidate(selector, element, 'aria-label'),
          unique: this.isUniqueSelector(selector),
          stable: true,
          description: `ARIA label: ${ariaLabel}`,
        });
      }

      // Name attribute
      const name = element.getAttribute('name');
      if (name) {
        const selector = `[name="${name}"]`;
        candidates.push({
          selector,
          type: 'name',
          score: await this.scoreSelectorCandidate(selector, element, 'name'),
          unique: this.isUniqueSelector(selector),
          stable: true,
          description: `Name attribute: ${name}`,
        });
      }

      // Placeholder attribute
      const placeholder = element.getAttribute('placeholder');
      if (placeholder) {
        const selector = `[placeholder="${placeholder}"]`;
        candidates.push({
          selector,
          type: 'placeholder',
          score: await this.scoreSelectorCandidate(selector, element, 'placeholder'),
          unique: this.isUniqueSelector(selector),
          stable: false,
          description: `Placeholder: ${placeholder}`,
        });
      }
    }

    // Text-based selector
    if (options.includeText && element.textContent) {
      const text = element.textContent.trim().substring(0, 50);
      if (text && text.length > 2) {
        const selector = this.generateTextSelector(element, text);
        candidates.push({
          selector,
          type: 'text',
          score: await this.scoreSelectorCandidate(selector, element, 'text'),
          unique: this.isUniqueSelector(selector),
          stable: false,
          description: `Text content: ${text}`,
        });
      }
    }

    // CSS class selector
    if (options.includeClass && element.className) {
      const cssSelector = this.generateCssSelector(element);
      if (cssSelector) {
        candidates.push({
          selector: cssSelector,
          type: 'css',
          score: await this.scoreSelectorCandidate(cssSelector, element, 'css'),
          unique: this.isUniqueSelector(cssSelector),
          stable: this.isStableCssSelector(cssSelector),
          description: `CSS selector: ${cssSelector}`,
        });
      }
    }

    // XPath selector
    const xpathSelector = this.generateXPath(element);
    candidates.push({
      selector: xpathSelector,
      type: 'xpath',
      score: await this.scoreSelectorCandidate(xpathSelector, element, 'xpath'),
      unique: true, // XPath is generally unique
      stable: false, // But not stable against DOM changes
      description: `XPath: ${xpathSelector}`,
    });

    // Position-based selector (last resort)
    if (options.includePosition) {
      const positionSelector = this.generatePositionSelector(element);
      candidates.push({
        selector: positionSelector,
        type: 'position',
        score: await this.scoreSelectorCandidate(positionSelector, element, 'position'),
        unique: true,
        stable: false,
        description: `Position-based: ${positionSelector}`,
      });
    }

    // Sort by score
    candidates.sort((a, b) => b.score - a.score);

    return candidates;
  }

  /**
   * Score a selector candidate based on multiple factors
   */
  private async scoreSelectorCandidate(selector: string, element: Element, type: SelectorType): Promise<number> {
    let score = this.strategyWeights[type] || 1;

    // Uniqueness bonus
    if (this.isUniqueSelector(selector)) {
      score += 5;
    } else {
      score -= 3;
    }

    // Stability bonus
    if (type === 'id' || type === 'data-testid' || type === 'data-test') {
      score += 3;
    }

    // Length penalty (shorter is better)
    score -= selector.length / 100;

    // Complexity penalty
    const complexity = (selector.match(/[>\s+~]/g) || []).length;
    score -= complexity * 0.5;

    return Math.max(0, score);
  }

  /**
   * Check if selector is unique on the page
   */
  private isUniqueSelector(selector: string): boolean {
    try {
      return document.querySelectorAll(selector).length === 1;
    } catch {
      return false;
    }
  }

  /**
   * Generate text-based selector
   */
  private generateTextSelector(element: Element, text: string): string {
    const tagName = element.tagName.toLowerCase();
    
    // For links and buttons, use exact text match
    if (tagName === 'a' || tagName === 'button') {
      return `${tagName}:has-text("${text}")`;
    }

    // For other elements, use contains
    return `${tagName}:contains("${text}")`;
  }

  /**
   * Generate optimized CSS selector
   */
  private generateCssSelector(element: Element): string {
    const parts: string[] = [];
    let current: Element | null = element;
    
    while (current && current !== document.documentElement) {
      let part = current.tagName.toLowerCase();
      
      // Add ID if available
      if (current.id) {
        part += `#${CSS.escape(current.id)}`;
        parts.unshift(part);
        break; // ID is sufficient
      }

      // Add stable classes
      const stableClasses = this.getStableClasses(current);
      if (stableClasses.length > 0) {
        part += '.' + stableClasses.join('.');
      }

      // Add position if needed
      const siblings = Array.from(current.parentElement?.children || [])
        .filter(child => child.tagName === current!.tagName);
      
      if (siblings.length > 1) {
        const index = siblings.indexOf(current) + 1;
        part += `:nth-of-type(${index})`;
      }

      parts.unshift(part);
      current = current.parentElement;

      // Don't go too deep
      if (parts.length >= 4) break;
    }

    return parts.join(' > ');
  }

  /**
   * Get stable CSS classes (avoid dynamic/temporary classes)
   */
  private getStableClasses(element: Element): string[] {
    if (!element.className) return [];
    
    return element.className
      .split(' ')
      .filter(Boolean)
      .filter(cls => this.isStableClass(cls))
      .slice(0, 3) // Limit to 3 classes
      .map(cls => CSS.escape(cls));
  }

  /**
   * Check if CSS class is stable (not dynamic/temporary)
   */
  private isStableClass(className: string): boolean {
    // Avoid dynamic classes
    const dynamicPatterns = [
      /^css-\w+$/, // CSS-in-JS generated classes
      /^_\w+$/, // Webpack CSS modules
      /^[a-z]+-\d+$/, // Vue scoped CSS
      /^ember\d+$/, // Ember.js classes
      /^js-/, // JavaScript behavior classes
      /^is-/, // State classes
      /^has-/, // State classes
      /active$/,
      /hover$/,
      /focus$/,
      /loading$/,
      /disabled$/,
    ];

    return !dynamicPatterns.some(pattern => pattern.test(className));
  }

  /**
   * Check if CSS selector is stable
   */
  private isStableCssSelector(selector: string): boolean {
    // Avoid selectors with potentially unstable parts
    const unstablePatterns = [
      /:nth-child/,
      /:nth-of-type/,
      /\[style/,
      /\[class.*=.*active/,
      /\[class.*=.*hover/,
      /\[class.*=.*focus/,
    ];

    return !unstablePatterns.some(pattern => pattern.test(selector));
  }

  /**
   * Generate position-based selector (last resort)
   */
  private generatePositionSelector(element: Element): string {
    const parts: string[] = [];
    let current: Element | null = element;

    while (current && current !== document.documentElement) {
      const tagName = current.tagName.toLowerCase();
      const siblings = Array.from(current.parentElement?.children || []);
      const index = siblings.indexOf(current) + 1;
      
      parts.unshift(`${tagName}:nth-child(${index})`);
      current = current.parentElement;

      // Don't go too deep
      if (parts.length >= 5) break;
    }

    return parts.join(' > ');
  }

  /**
   * Get priority index for selector type
   */
  private getPriorityIndex(type: SelectorType, priority: string[]): number {
    const index = priority.indexOf(type);
    return index === -1 ? priority.length : index;
  }

  /**
   * Analyze element stability factors
   */
  private analyzeElementStability(element: Element): number {
    let stability = 0.5; // Base stability

    // Check for stable attributes
    if (element.id) stability += 0.3;
    if (element.getAttribute('data-testid')) stability += 0.3;
    if (element.getAttribute('name')) stability += 0.2;
    if (element.getAttribute('aria-label')) stability += 0.2;

    // Check for unstable attributes
    const classNames = element.className.split(' ').filter(Boolean);
    const unstableClasses = classNames.filter(cls => !this.isStableClass(cls));
    stability -= unstableClasses.length * 0.1;

    // Check position in DOM
    const depth = this.getElementDepth(element);
    if (depth > 10) stability -= 0.1; // Deep elements are less stable

    return Math.max(0, Math.min(1, stability));
  }

  /**
   * Get element depth in DOM tree
   */
  private getElementDepth(element: Element): number {
    let depth = 0;
    let current: Element | null = element;

    while (current && current !== document.documentElement) {
      depth++;
      current = current.parentElement;
    }

    return depth;
  }

  /**
   * Create visual highlight overlay for element
   */
  private createHighlightOverlay(element: Element): HTMLElement {
    const overlay = document.createElement('div');
    const bounds = element.getBoundingClientRect();
    
    overlay.style.cssText = `
      position: fixed;
      top: ${bounds.top}px;
      left: ${bounds.left}px;
      width: ${bounds.width}px;
      height: ${bounds.height}px;
      border: 2px solid #007bff;
      background: rgba(0, 123, 255, 0.1);
      z-index: 10000;
      pointer-events: none;
      box-sizing: border-box;
      border-radius: 3px;
      animation: highlight-pulse 2s ease-in-out infinite;
    `;

    // Add CSS animation
    if (!document.querySelector('#selector-engine-styles')) {
      const style = document.createElement('style');
      style.id = 'selector-engine-styles';
      style.textContent = `
        @keyframes highlight-pulse {
          0%, 100% { opacity: 0.7; }
          50% { opacity: 1; }
        }
      `;
      document.head.appendChild(style);
    }

    return overlay;
  }

  /**
   * Generate unique key for element (for caching)
   */
  private getElementKey(element: Element): string {
    return `${element.tagName}_${element.id || ''}_${Array.from(element.attributes).map(attr => `${attr.name}=${attr.value}`).join('_')}`;
  }
}