/**
 * Base Generator Interface
 * Common interface and utilities for all framework-specific generators
 */

import type {
  RecordedEvent,
  TestFormat as _TestFormat,
  EventType as _EventType,
  MouseEventData as _MouseEventData,
  KeyboardEventData as _KeyboardEventData,
  FormEventData,
  NavigationEventData,
  ScrollEventData as _ScrollEventData,
  WaitEventData,
  AssertionEventData,
} from '../../types';

import type { CodeGenerationConfig, EventGroup } from '../code-generator';

export interface BaseGeneratorOptions {
  language: 'javascript' | 'typescript' | 'python' | 'csharp';
  includeComments: boolean;
  includeAssertions: boolean;
  includeSetup: boolean;
  pageObjectModel: boolean;
  timeout: number;
  viewport: { width: number; height: number };
  headless: boolean;
}

export interface GeneratedTestFile {
  filename: string;
  content: string;
  type: 'test' | 'page-object' | 'helper' | 'config';
}

export interface SelectorOptimization {
  original: string;
  optimized: string;
  strategy: 'id' | 'class' | 'attribute' | 'text' | 'xpath' | 'css';
  reliability: number;
}

/**
 * Abstract base class for framework-specific generators
 */
export abstract class BaseGenerator {
  protected config: CodeGenerationConfig;
  protected options: BaseGeneratorOptions;
  
  constructor(config: CodeGenerationConfig, options: BaseGeneratorOptions) {
    this.config = config;
    this.options = options;
  }

  /**
   * Generate complete test file(s) from event groups
   */
  abstract generateTestFiles(groups: EventGroup[]): Promise<GeneratedTestFile[]>;

  /**
   * Generate code for a single event
   */
  abstract generateEventCode(event: RecordedEvent): string;

  /**
   * Generate assertions for verification
   */
  abstract generateAssertions(events: RecordedEvent[]): string[];

  /**
   * Generate setup/teardown code
   */
  abstract generateSetupCode(): string;
  abstract generateTeardownCode(): string;

  /**
   * Generate imports and dependencies
   */
  abstract generateImports(): string[];
  abstract getDependencies(): string[];

  /**
   * Framework-specific selector optimization
   */
  abstract optimizeSelector(selector: string, element?: any): SelectorOptimization;

  /**
   * Generate wait conditions
   */
  abstract generateWaitCondition(event: RecordedEvent): string;

  // Common utility methods

  /**
   * Clean and optimize a CSS selector
   */
  protected cleanSelector(selector: string): string {
    return selector
      .replace(/\s+/g, ' ')
      .replace(/>\s+/g, '>')
      .replace(/\s+~/g, '~')
      .replace(/\s*\+\s*/g, '+')
      .trim();
  }

  /**
   * Convert selector to framework-specific format
   */
  protected formatSelector(selector: string): string {
    // Remove any framework-specific prefixes and normalize
    return this.cleanSelector(selector);
  }

  /**
   * Generate a meaningful variable name from element attributes
   */
  protected generateVariableName(event: RecordedEvent): string {
    const target = event.target;
    
    // Try to use meaningful names from element properties
    if (target.name) return this.toCamelCase(target.name);
    if (target.id) return this.toCamelCase(target.id);
    if (target.textContent && target.textContent.length < 20) {
      return this.toCamelCase(target.textContent);
    }
    
    // Fall back to tag name and type
    const baseName = target.tagName.toLowerCase();
    if (target.type) {
      return `${baseName}${this.capitalize(target.type)}`;
    }
    
    return baseName;
  }

  /**
   * Convert string to camelCase
   */
  protected toCamelCase(str: string): string {
    return str
      .replace(/[^a-zA-Z0-9]+(.)/g, (_, char) => char.toUpperCase())
      .replace(/^./, char => char.toLowerCase())
      .replace(/[^a-zA-Z0-9]/g, '');
  }

  /**
   * Capitalize first letter
   */
  protected capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /**
   * Generate meaningful comment for an event
   */
  protected generateComment(event: RecordedEvent): string {
    const target = event.target;
    
    switch (event.type) {
      case 'click':
        return `Click on ${this.getElementDescription(target)}`;
      case 'input':
      case 'change': {
        const formData = event.data as FormEventData;
        return `Enter "${formData.value || ''}" in ${this.getElementDescription(target)}`;
      }
      case 'navigation': {
        const navData = event.data as NavigationEventData;
        return `Navigate to ${navData.url}`;
      }
      case 'wait': {
        const waitData = event.data as WaitEventData;
        return `Wait ${waitData.duration}ms for ${waitData.reason}`;
      }
      case 'assertion': {
        const assertData = event.data as AssertionEventData;
        return `Verify ${assertData.message}`;
      }
      default:
        return `Perform ${event.type} on ${this.getElementDescription(target)}`;
    }
  }

  /**
   * Get human-readable element description
   */
  protected getElementDescription(target: any): string {
    if (target.textContent && target.textContent.length < 30) {
      return `"${target.textContent.trim()}"`;
    }
    if (target.id) {
      return `element with id "${target.id}"`;
    }
    if (target.name) {
      return `${target.tagName.toLowerCase()} named "${target.name}"`;
    }
    return `${target.tagName.toLowerCase()} element`;
  }

  /**
   * Escape string for code generation
   */
  protected escapeString(str: string): string {
    return str
      .replace(/\\/g, '\\\\')
      .replace(/'/g, "\\'")
      .replace(/"/g, '\\"')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/\t/g, '\\t');
  }

  /**
   * Format code with proper indentation
   */
  protected indent(code: string, level: number = 1): string {
    const spaces = '  '.repeat(level);
    return code
      .split('\n')
      .map(line => line.trim() ? spaces + line : '')
      .join('\n');
  }

  /**
   * Generate smart wait based on event timing
   */
  protected generateSmartWait(currentEvent: RecordedEvent, nextEvent?: RecordedEvent): string | null {
    if (!nextEvent) return null;
    
    const timeDiff = nextEvent.timestamp - currentEvent.timestamp;
    
    // Add wait if there's a significant delay (>1s) between events
    if (timeDiff > 1000) {
      const waitTime = Math.min(Math.ceil(timeDiff / 1000), 10); // Cap at 10s
      return this.generateWaitCode(waitTime * 1000);
    }
    
    return null;
  }

  /**
   * Generate wait code for specific duration
   */
  protected generateWaitCode(duration: number): string {
    // Override in subclasses for framework-specific wait syntax
    return `await page.waitForTimeout(${duration});`;
  }

  /**
   * Determine if selector is stable/reliable
   */
  protected assessSelectorReliability(selector: string): number {
    let score = 0.5; // Base score
    
    // ID selectors are very reliable
    if (selector.includes('#')) score += 0.3;
    
    // Data attributes are reliable
    if (selector.includes('[data-')) score += 0.2;
    
    // Aria attributes are reliable
    if (selector.includes('[aria-')) score += 0.2;
    
    // Text selectors can be fragile
    if (selector.includes(':text(')) score -= 0.1;
    
    // Long CSS paths are fragile
    if ((selector.match(/>/g) || []).length > 3) score -= 0.2;
    
    // Classes might be styling-dependent
    if (selector.includes('.') && !selector.includes('[')) score -= 0.1;
    
    return Math.max(0, Math.min(1, score));
  }

  /**
   * Generate error handling code
   */
  protected generateErrorHandling(code: string, event: RecordedEvent): string {
    if (!this.options.includeComments) return code;
    
    return `try {
  ${this.indent(code)}
} catch {
  throw new Error(\`Failed to ${event.type} on ${this.getElementDescription(event.target)}: \${error.message}\`);
}`;
  }

  /**
   * Generate retry logic for flaky operations
   */
  protected generateRetryLogic(code: string, maxRetries: number = 3): string {
    return `for (let attempt = 1; attempt <= ${maxRetries}; attempt++) {
  try {
    ${this.indent(code)}
    
        break;
      }
  } catch {
    if (attempt === ${maxRetries}) throw error;
    await page.waitForTimeout(1000 * attempt);
  }
}`;
  }

  /**
   * Check if event should include a screenshot
   */
  protected shouldIncludeScreenshot(event: RecordedEvent): boolean {
    return event.type === 'assertion' || 
           event.type === 'navigation' || 
           event.metadata?.screenshot !== undefined;
  }

  /**
   * Generate screenshot code
   */
  protected generateScreenshotCode(event: RecordedEvent): string {
    const screenshotName = `screenshot-${event.sequence}-${event.type}`;
    return `await page.screenshot({ path: '${screenshotName}.png' });`;
  }

  /**
   * Group related events for better code organization
   */
  protected groupRelatedEvents(events: RecordedEvent[]): RecordedEvent[][] {
    const groups: RecordedEvent[][] = [];
    let currentGroup: RecordedEvent[] = [];
    
    for (const event of events) {
      // Start new group for navigation events
      if (event.type === 'navigation' && currentGroup.length > 0) {
        groups.push(currentGroup);
        currentGroup = [event];
        continue;
      }
      
      currentGroup.push(event);
    }
    
    if (currentGroup.length > 0) {
      groups.push(currentGroup);
    }
    
    return groups;
  }

  /**
   * Extract unique selectors from events
   */
  protected extractUniqueSelectors(events: RecordedEvent[]): string[] {
    const selectors = new Set<string>();
    
    events.forEach(event => {
      if (event.target?.selector) {
        selectors.add(event.target.selector);
      }
    });
    
    return Array.from(selectors);
  }

  /**
   * Generate helper methods for common patterns
   */
  protected generateHelperMethods(events: RecordedEvent[]): string[] {
    const helpers: string[] = [];
    const patterns = this.analyzeEventPatterns(events);
    
    // Generate form filling helper if needed
    if (patterns.hasFormInteraction) {
      helpers.push(this.generateFormFillingHelper());
    }
    
    // Generate navigation helper if needed
    if (patterns.hasNavigation) {
      helpers.push(this.generateNavigationHelper());
    }
    
    return helpers;
  }

  /**
   * Analyze events for common patterns
   */
  protected analyzeEventPatterns(events: RecordedEvent[]): {
    hasFormInteraction: boolean;
    hasNavigation: boolean;
    hasAsyncOperations: boolean;
    hasRepeatedActions: boolean;
  } {
    const formEvents = events.filter(e => ['input', 'change', 'submit'].includes(e.type));
    const navEvents = events.filter(e => e.type === 'navigation');
    
    return {
      hasFormInteraction: formEvents.length > 2,
      hasNavigation: navEvents.length > 1,
      hasAsyncOperations: events.some(e => e.type === 'wait'),
      hasRepeatedActions: this.hasRepeatedActions(events)
    };
  }

  private hasRepeatedActions(events: RecordedEvent[]): boolean {
    const actionCounts = new Map<string, number>();
    
    events.forEach(event => {
      const key = `${event.type}-${event.target.selector}`;
      actionCounts.set(key, (actionCounts.get(key) || 0) + 1);
    });
    
    return Array.from(actionCounts.values()).some(count => count > 2);
  }

  /**
   * Generate form filling helper method
   */
  protected generateFormFillingHelper(): string {
    return `async fillForm(formData) {
  for (const [selector, value] of Object.entries(formData)) {
    await this.page.fill(selector, value);
  }
}`;
  }

  /**
   * Generate navigation helper method
   */
  protected generateNavigationHelper(): string {
    return `async navigateAndWait(url) {
  await this.page.goto(url);
  await this.page.waitForLoadState('networkidle');
}`;
  }
}

export default BaseGenerator;