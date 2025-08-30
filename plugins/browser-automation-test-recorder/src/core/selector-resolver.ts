/**
 * Selector Resolution and Auto-Healing System
 * Handles dynamic selector resolution and healing when DOM changes
 */

import type {
  RecordedEventTarget,
  SelectorStrategy,
  SelectorOptions,
  ElementPathNode,
  CDPRemoteObject,
  CDPDOMNode,
  ReliabilityMetrics,
} from '../types';

import { CDPClient } from './cdp-client';
import { SelectorEngine } from './selector-engine';

/**
 * Selector resolution result
 */
export interface SelectorResolutionResult {
  selector: string;
  element: CDPRemoteObject | null;
  confidence: number;
  strategy: string;
  alternatives: string[];
  metadata: {
    attempts: number;
    healingApplied: boolean;
    fallbackUsed: boolean;
    timeTaken: number;
  };
}

/**
 * Element matching criteria for auto-healing
 */
export interface ElementMatchingCriteria {
  textContent?: string;
  attributes: Record<string, string>;
  position: { x: number; y: number };
  size: { width: number; height: number };
  tagName: string;
  className?: string;
  id?: string;
  path: ElementPathNode[];
}

/**
 * Healing strategy configuration
 */
export interface HealingStrategy {
  name: string;
  priority: number;
  enabled: boolean;
  config: Record<string, any>;
}

/**
 * Advanced selector resolver with auto-healing capabilities
 */
export class SelectorResolver {
  private cdpClient: CDPClient;
  private selectorEngine: SelectorEngine;
  private healingStrategies: Map<string, HealingStrategy>;
  private selectorCache: Map<string, SelectorResolutionResult>;
  private healingHistory: Map<string, string[]>;
  
  // Performance metrics
  private stats = {
    totalResolutions: 0,
    successfulResolutions: 0,
    healingAttempts: 0,
    healingSuccesses: 0,
    avgResolutionTime: 0,
  };

  constructor(cdpClient: CDPClient, selectorEngine: SelectorEngine) {
    this.cdpClient = cdpClient;
    this.selectorEngine = selectorEngine;
    this.healingStrategies = new Map();
    this.selectorCache = new Map();
    this.healingHistory = new Map();
    
    this.setupDefaultHealingStrategies();
  }

  /**
   * Resolve selector with auto-healing and fallbacks
   */
  async resolveSelector(
    originalSelector: string,
    targetInfo: RecordedEventTarget,
    options: SelectorOptions = {} as SelectorOptions,
    maxRetries: number = 3
  ): Promise<SelectorResolutionResult> {
    const startTime = Date.now();
    this.stats.totalResolutions++;

    // Check cache first
    const cacheKey = `${originalSelector}:${JSON.stringify(options)}`;
    if (this.selectorCache.has(cacheKey)) {
      const cached = this.selectorCache.get(cacheKey)!;
      // Verify cached result is still valid
      const element = await this.cdpClient.findElement(cached.selector);
      if (element) {
        return {
          ...cached,
          element,
          metadata: {
            ...cached.metadata,
            timeTaken: Date.now() - startTime,
          },
        };
      } else {
        // Cache is stale, remove it
        this.selectorCache.delete(cacheKey);
      }
    }

    let lastResult: SelectorResolutionResult | null = null;
    let attempts = 0;

    // Try original selector first
    attempts++;
    let element = await this.findElementWithWait(originalSelector, 2000);
    
    if (element) {
      const result: SelectorResolutionResult = {
        selector: originalSelector,
        element,
        confidence: 1.0,
        strategy: 'original',
        alternatives: targetInfo.alternativeSelectors || [],
        metadata: {
          attempts,
          healingApplied: false,
          fallbackUsed: false,
          timeTaken: Date.now() - startTime,
        },
      };
      
      this.stats.successfulResolutions++;
      this.selectorCache.set(cacheKey, result);
      return result;
    }

    // Try alternative selectors
    if (targetInfo.alternativeSelectors?.length > 0) {
      for (const altSelector of targetInfo.alternativeSelectors) {
        attempts++;
        element = await this.findElementWithWait(altSelector, 1000);
        
        if (element) {
          const result: SelectorResolutionResult = {
            selector: altSelector,
            element,
            confidence: 0.8,
            strategy: 'alternative',
            alternatives: targetInfo.alternativeSelectors.filter(s => s !== altSelector),
            metadata: {
              attempts,
              healingApplied: false,
              fallbackUsed: true,
              timeTaken: Date.now() - startTime,
            },
          };
          
          this.stats.successfulResolutions++;
          this.selectorCache.set(cacheKey, result);
          return result;
        }
      }
    }

    // Apply healing strategies
    for (let retry = 0; retry < maxRetries; retry++) {
      this.stats.healingAttempts++;
      
      const healedResult = await this.attemptHealing(originalSelector, targetInfo, options);
      
      if (healedResult) {
        healedResult.metadata.attempts = attempts + retry + 1;
        healedResult.metadata.timeTaken = Date.now() - startTime;
        
        this.stats.healingSuccesses++;
        this.stats.successfulResolutions++;
        this.selectorCache.set(cacheKey, healedResult);
        
        // Store healing history
        const history = this.healingHistory.get(originalSelector) || [];
        history.push(healedResult.selector);
        this.healingHistory.set(originalSelector, history);
        
        return healedResult;
      }

      // Wait before next retry
      if (retry < maxRetries - 1) {
        await this.sleep(1000 * (retry + 1));
      }
    }

    // All attempts failed
    const failedResult: SelectorResolutionResult = {
      selector: originalSelector,
      element: null,
      confidence: 0,
      strategy: 'failed',
      alternatives: [],
      metadata: {
        attempts: attempts + maxRetries,
        healingApplied: true,
        fallbackUsed: true,
        timeTaken: Date.now() - startTime,
      },
    };

    // Update average resolution time
    this.stats.avgResolutionTime = 
      (this.stats.avgResolutionTime * (this.stats.totalResolutions - 1) + (Date.now() - startTime)) / 
      this.stats.totalResolutions;

    return failedResult;
  }

  /**
   * Attempt healing using various strategies
   */
  private async attemptHealing(
    originalSelector: string,
    targetInfo: RecordedEventTarget,
    options: SelectorOptions
  ): Promise<SelectorResolutionResult | null> {
    const criteria = this.buildMatchingCriteria(targetInfo);
    
    // Sort strategies by priority
    const strategies = Array.from(this.healingStrategies.values())
      .filter(strategy => strategy.enabled)
      .sort((a, b) => b.priority - a.priority);

    for (const strategy of strategies) {
      try {
        const result = await this.applyHealingStrategy(
          strategy,
          originalSelector,
          criteria,
          options
        );
        
        if (result) {
          return result;
        }
      } catch (error) {
        console.warn(`Healing strategy ${strategy.name} failed:`, error);
      }
    }

    return null;
  }

  /**
   * Apply specific healing strategy
   */
  private async applyHealingStrategy(
    strategy: HealingStrategy,
    originalSelector: string,
    criteria: ElementMatchingCriteria,
    options: SelectorOptions
  ): Promise<SelectorResolutionResult | null> {
    switch (strategy.name) {
      case 'textContent':
        return this.healByTextContent(criteria, options);
        
      case 'attributes':
        return this.healByAttributes(criteria, options);
        
      case 'position':
        return this.healByPosition(criteria, options);
        
      case 'hierarchy':
        return this.healByHierarchy(criteria, options);
        
      case 'fuzzyMatch':
        return this.healByFuzzyMatch(originalSelector, criteria, options);
        
      case 'domAnalysis':
        return this.healByDomAnalysis(criteria, options);
        
      default:
        return null;
    }
  }

  /**
   * Heal selector by text content
   */
  private async healByTextContent(
    criteria: ElementMatchingCriteria,
    options: SelectorOptions
  ): Promise<SelectorResolutionResult | null> {
    if (!criteria.textContent) return null;

    const textContent = criteria.textContent.trim();
    if (textContent.length === 0) return null;

    // Try exact text match first
    let selector = `*:contains("${textContent}")`;
    let element = await this.findElementWithWait(selector, 1000);
    
    if (!element) {
      // Try partial text match
      const words = textContent.split(/\s+/).filter(word => word.length > 2);
      if (words.length > 0) {
        selector = words.map(word => `*:contains("${word}")`).join('');
        element = await this.findElementWithWait(selector, 1000);
      }
    }

    if (!element) {
      // Try with XPath text search
      selector = `//*[contains(text(), "${textContent}")]`;
      element = await this.findElementByXPath(selector);
    }

    if (element) {
      // Verify element matches other criteria
      const matches = await this.verifyElementMatch(element, criteria);
      if (matches) {
        return {
          selector,
          element,
          confidence: 0.7,
          strategy: 'textContent',
          alternatives: [],
          metadata: {
            attempts: 1,
            healingApplied: true,
            fallbackUsed: false,
            timeTaken: 0,
          },
        };
      }
    }

    return null;
  }

  /**
   * Heal selector by attributes
   */
  private async healByAttributes(
    criteria: ElementMatchingCriteria,
    options: SelectorOptions
  ): Promise<SelectorResolutionResult | null> {
    const importantAttrs = ['id', 'data-testid', 'name', 'class', 'aria-label'];
    
    for (const attr of importantAttrs) {
      const value = criteria.attributes[attr];
      if (!value) continue;

      let selector: string;
      
      if (attr === 'class') {
        // Try individual class names
        const classNames = value.split(/\s+/);
        for (const className of classNames) {
          selector = `.${className}`;
          const element = await this.findElementWithWait(selector, 1000);
          if (element) {
            const matches = await this.verifyElementMatch(element, criteria);
            if (matches) {
              return {
                selector,
                element,
                confidence: 0.6,
                strategy: 'attributes',
                alternatives: [],
                metadata: {
                  attempts: 1,
                  healingApplied: true,
                  fallbackUsed: false,
                  timeTaken: 0,
                },
              };
            }
          }
        }
      } else {
        selector = `[${attr}="${value}"]`;
        const element = await this.findElementWithWait(selector, 1000);
        if (element) {
          const matches = await this.verifyElementMatch(element, criteria);
          if (matches) {
            return {
              selector,
              element,
              confidence: attr === 'id' ? 0.9 : 0.7,
              strategy: 'attributes',
              alternatives: [],
              metadata: {
                attempts: 1,
                healingApplied: true,
                fallbackUsed: false,
                timeTaken: 0,
              },
            };
          }
        }
      }
    }

    return null;
  }

  /**
   * Heal selector by position
   */
  private async healByPosition(
    criteria: ElementMatchingCriteria,
    options: SelectorOptions
  ): Promise<SelectorResolutionResult | null> {
    const { position, size, tagName } = criteria;
    
    // Find elements near the original position
    const script = `
      (function() {
        const targetX = ${position.x};
        const targetY = ${position.y};
        const targetWidth = ${size.width};
        const targetHeight = ${size.height};
        const tolerance = 50; // pixels
        
        const allElements = document.querySelectorAll('${tagName.toLowerCase()}');
        const candidates = [];
        
        for (const element of allElements) {
          const rect = element.getBoundingClientRect();
          const deltaX = Math.abs(rect.left - targetX);
          const deltaY = Math.abs(rect.top - targetY);
          const deltaWidth = Math.abs(rect.width - targetWidth);
          const deltaHeight = Math.abs(rect.height - targetHeight);
          
          if (deltaX <= tolerance && deltaY <= tolerance && 
              deltaWidth <= tolerance && deltaHeight <= tolerance) {
            candidates.push({
              element: element,
              score: deltaX + deltaY + deltaWidth + deltaHeight,
              rect: { x: rect.left, y: rect.top, width: rect.width, height: rect.height }
            });
          }
        }
        
        candidates.sort((a, b) => a.score - b.score);
        return candidates.map(c => c.rect);
      })()
    `;

    try {
      const candidates = await this.cdpClient.executeScript(script);
      
      if (candidates && candidates.length > 0) {
        // Generate selector for best candidate
        const bestCandidate = candidates[0];
        const selector = await this.generateSelectorByPosition(bestCandidate);
        
        if (selector) {
          const element = await this.findElementWithWait(selector, 1000);
          if (element) {
            return {
              selector,
              element,
              confidence: 0.5,
              strategy: 'position',
              alternatives: [],
              metadata: {
                attempts: 1,
                healingApplied: true,
                fallbackUsed: false,
                timeTaken: 0,
              },
            };
          }
        }
      }
    } catch (error) {
      console.warn('Position healing failed:', error);
    }

    return null;
  }

  /**
   * Heal selector by DOM hierarchy
   */
  private async healByHierarchy(
    criteria: ElementMatchingCriteria,
    options: SelectorOptions
  ): Promise<SelectorResolutionResult | null> {
    const path = criteria.path;
    if (path.length === 0) return null;

    // Try to rebuild selector using path information
    const selectorParts = [];
    
    for (let i = 0; i < path.length; i++) {
      const node = path[i];
      let part = node.tagName.toLowerCase();
      
      if (node.id) {
        part = `#${node.id}`;
      } else if (node.className) {
        const classes = node.className.split(/\s+/).filter(c => c.length > 0);
        if (classes.length > 0) {
          part += `.${classes.join('.')}`;
        }
      } else if (node.attributes) {
        // Use most distinctive attribute
        const attrs = Object.entries(node.attributes);
        for (const [key, value] of attrs) {
          if (['data-testid', 'name', 'role'].includes(key)) {
            part += `[${key}="${value}"]`;
            break;
          }
        }
      }
      
      selectorParts.push(part);
    }

    // Try different combinations of the path
    for (let depth = Math.min(3, selectorParts.length); depth >= 1; depth--) {
      const selector = selectorParts.slice(-depth).join(' > ');
      const element = await this.findElementWithWait(selector, 1000);
      
      if (element) {
        const matches = await this.verifyElementMatch(element, criteria);
        if (matches) {
          return {
            selector,
            element,
            confidence: 0.6 + (depth * 0.1),
            strategy: 'hierarchy',
            alternatives: [],
            metadata: {
              attempts: 1,
              healingApplied: true,
              fallbackUsed: false,
              timeTaken: 0,
            },
          };
        }
      }
    }

    return null;
  }

  /**
   * Heal selector using fuzzy matching
   */
  private async healByFuzzyMatch(
    originalSelector: string,
    criteria: ElementMatchingCriteria,
    options: SelectorOptions
  ): Promise<SelectorResolutionResult | null> {
    // Extract selector components
    const components = this.parseSelector(originalSelector);
    
    // Try variations of the original selector
    const variations = this.generateSelectorVariations(components);
    
    for (const variation of variations) {
      const element = await this.findElementWithWait(variation, 1000);
      if (element) {
        const matches = await this.verifyElementMatch(element, criteria);
        if (matches) {
          return {
            selector: variation,
            element,
            confidence: 0.4,
            strategy: 'fuzzyMatch',
            alternatives: [],
            metadata: {
              attempts: 1,
              healingApplied: true,
              fallbackUsed: false,
              timeTaken: 0,
            },
          };
        }
      }
    }

    return null;
  }

  /**
   * Heal selector using DOM analysis
   */
  private async healByDomAnalysis(
    criteria: ElementMatchingCriteria,
    options: SelectorOptions
  ): Promise<SelectorResolutionResult | null> {
    // Analyze current DOM structure to find similar elements
    const script = `
      (function() {
        const targetTag = '${criteria.tagName.toLowerCase()}';
        const elements = document.querySelectorAll(targetTag);
        const candidates = [];
        
        for (const element of elements) {
          const rect = element.getBoundingClientRect();
          const computedStyle = window.getComputedStyle(element);
          
          candidates.push({
            textContent: element.textContent?.trim() || '',
            attributes: Array.from(element.attributes).reduce((acc, attr) => {
              acc[attr.name] = attr.value;
              return acc;
            }, {}),
            position: { x: rect.left, y: rect.top },
            size: { width: rect.width, height: rect.height },
            visibility: computedStyle.display !== 'none' && computedStyle.visibility !== 'hidden',
            index: candidates.length
          });
        }
        
        return candidates.filter(c => c.visibility);
      })()
    `;

    try {
      const candidates = await this.cdpClient.executeScript(script);
      
      // Score candidates based on similarity to criteria
      const scored = candidates.map((candidate: any) => ({
        ...candidate,
        score: this.calculateSimilarityScore(candidate, criteria),
      })).sort((a: any, b: any) => b.score - a.score);

      if (scored.length > 0 && scored[0].score > 0.3) {
        const best = scored[0];
        const selector = `${criteria.tagName.toLowerCase()}:nth-child(${best.index + 1})`;
        const element = await this.findElementWithWait(selector, 1000);
        
        if (element) {
          return {
            selector,
            element,
            confidence: best.score,
            strategy: 'domAnalysis',
            alternatives: [],
            metadata: {
              attempts: 1,
              healingApplied: true,
              fallbackUsed: false,
              timeTaken: 0,
            },
          };
        }
      }
    } catch (error) {
      console.warn('DOM analysis healing failed:', error);
    }

    return null;
  }

  /**
   * Setup default healing strategies
   */
  private setupDefaultHealingStrategies(): void {
    this.healingStrategies.set('textContent', {
      name: 'textContent',
      priority: 90,
      enabled: true,
      config: {},
    });

    this.healingStrategies.set('attributes', {
      name: 'attributes',
      priority: 85,
      enabled: true,
      config: {},
    });

    this.healingStrategies.set('hierarchy', {
      name: 'hierarchy',
      priority: 75,
      enabled: true,
      config: {},
    });

    this.healingStrategies.set('position', {
      name: 'position',
      priority: 60,
      enabled: true,
      config: {},
    });

    this.healingStrategies.set('fuzzyMatch', {
      name: 'fuzzyMatch',
      priority: 50,
      enabled: true,
      config: {},
    });

    this.healingStrategies.set('domAnalysis', {
      name: 'domAnalysis',
      priority: 40,
      enabled: true,
      config: {},
    });
  }

  /**
   * Build matching criteria from event target info
   */
  private buildMatchingCriteria(targetInfo: RecordedEventTarget): ElementMatchingCriteria {
    return {
      textContent: targetInfo.textContent,
      attributes: {
        id: targetInfo.id || '',
        class: targetInfo.className || '',
        name: targetInfo.name || '',
        type: targetInfo.type || '',
        value: targetInfo.value || '',
      },
      position: {
        x: targetInfo.boundingRect.left,
        y: targetInfo.boundingRect.top,
      },
      size: {
        width: targetInfo.boundingRect.width,
        height: targetInfo.boundingRect.height,
      },
      tagName: targetInfo.tagName,
      className: targetInfo.className,
      id: targetInfo.id,
      path: targetInfo.path,
    };
  }

  /**
   * Find element with timeout
   */
  private async findElementWithWait(
    selector: string,
    timeout: number
  ): Promise<CDPRemoteObject | null> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      const element = await this.cdpClient.findElement(selector);
      if (element) return element;
      await this.sleep(100);
    }
    
    return null;
  }

  /**
   * Find element by XPath
   */
  private async findElementByXPath(xpath: string): Promise<CDPRemoteObject | null> {
    try {
      const result = await this.cdpClient.executeScript(`
        document.evaluate('${xpath}', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue
      `, false);
      
      return result && result.type === 'object' && result.subtype === 'node' ? result : null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Verify element matches criteria
   */
  private async verifyElementMatch(
    element: CDPRemoteObject,
    criteria: ElementMatchingCriteria
  ): Promise<boolean> {
    try {
      const result = await this.cdpClient.executeScript(`
        (function(element) {
          const rect = element.getBoundingClientRect();
          const tagMatch = element.tagName.toLowerCase() === '${criteria.tagName.toLowerCase()}';
          const textMatch = !element.textContent || element.textContent.includes('${criteria.textContent || ''}');
          
          return {
            tagMatch,
            textMatch,
            position: { x: rect.left, y: rect.top },
            size: { width: rect.width, height: rect.height }
          };
        })(arguments[0])
      `, true);

      // Basic verification
      return result.tagMatch && result.textMatch;
    } catch (error) {
      return false;
    }
  }

  /**
   * Parse selector into components
   */
  private parseSelector(selector: string): any {
    // Simple selector parsing - in a full implementation this would be more sophisticated
    return {
      tag: selector.match(/^[a-zA-Z][a-zA-Z0-9]*/)?.[0],
      id: selector.match(/#([a-zA-Z][a-zA-Z0-9_-]*)/)?.[1],
      classes: selector.match(/\.([a-zA-Z][a-zA-Z0-9_-]*)/g)?.map(c => c.slice(1)),
      attributes: selector.match(/\[([^\]]+)\]/g)?.map(attr => attr.slice(1, -1)),
    };
  }

  /**
   * Generate selector variations for fuzzy matching
   */
  private generateSelectorVariations(components: any): string[] {
    const variations: string[] = [];
    
    if (components.tag) {
      variations.push(components.tag);
      
      if (components.classes?.length > 0) {
        for (const cls of components.classes) {
          variations.push(`${components.tag}.${cls}`);
          variations.push(`.${cls}`);
        }
      }
      
      if (components.attributes?.length > 0) {
        for (const attr of components.attributes) {
          variations.push(`${components.tag}[${attr}]`);
        }
      }
    }

    return variations;
  }

  /**
   * Generate selector by position
   */
  private async generateSelectorByPosition(position: any): Promise<string | null> {
    try {
      const result = await this.cdpClient.executeScript(`
        (function() {
          const targetX = ${position.x};
          const targetY = ${position.y};
          const element = document.elementFromPoint(targetX, targetY);
          
          if (!element) return null;
          
          // Generate a simple selector
          let selector = element.tagName.toLowerCase();
          if (element.id) {
            selector = '#' + element.id;
          } else if (element.className) {
            const classes = element.className.trim().split(/\\s+/);
            if (classes.length > 0) {
              selector += '.' + classes.join('.');
            }
          }
          
          return selector;
        })()
      `);

      return result;
    } catch (error) {
      return null;
    }
  }

  /**
   * Calculate similarity score between candidates and criteria
   */
  private calculateSimilarityScore(candidate: any, criteria: ElementMatchingCriteria): number {
    let score = 0;
    
    // Text content similarity
    if (candidate.textContent && criteria.textContent) {
      const similarity = this.calculateStringSimilarity(candidate.textContent, criteria.textContent);
      score += similarity * 0.3;
    }
    
    // Position similarity
    const positionDelta = Math.abs(candidate.position.x - criteria.position.x) + 
                         Math.abs(candidate.position.y - criteria.position.y);
    const positionScore = Math.max(0, 1 - (positionDelta / 1000)); // Normalize to 1000px
    score += positionScore * 0.2;
    
    // Size similarity
    const sizeDelta = Math.abs(candidate.size.width - criteria.size.width) + 
                     Math.abs(candidate.size.height - criteria.size.height);
    const sizeScore = Math.max(0, 1 - (sizeDelta / 1000));
    score += sizeScore * 0.2;
    
    // Attribute matching
    let attributeMatches = 0;
    let totalAttributes = 0;
    
    for (const [key, value] of Object.entries(criteria.attributes)) {
      if (value) {
        totalAttributes++;
        if (candidate.attributes[key] === value) {
          attributeMatches++;
        }
      }
    }
    
    if (totalAttributes > 0) {
      score += (attributeMatches / totalAttributes) * 0.3;
    }
    
    return score;
  }

  /**
   * Calculate string similarity (simple Levenshtein-based)
   */
  private calculateStringSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const distance = this.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }

  /**
   * Calculate Levenshtein distance
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  /**
   * Get healing statistics
   */
  getStats() {
    return { ...this.stats };
  }

  /**
   * Clear caches and reset
   */
  reset(): void {
    this.selectorCache.clear();
    this.healingHistory.clear();
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}