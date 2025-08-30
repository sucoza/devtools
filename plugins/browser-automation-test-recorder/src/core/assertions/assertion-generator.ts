/**
 * Smart Assertion Generator
 * Automatically generates meaningful assertions from recorded events and page state
 */

import type { 
  RecordedEvent, 
  NavigationEventData, 
  FormEventData, 
  TestFormat 
} from '../../types';

export interface GeneratedAssertion {
  id: string;
  type: AssertionType;
  selector: string;
  expected: any;
  actual?: any;
  description: string;
  confidence: number; // 0-1, how confident we are this assertion is useful
  framework: TestFormat;
  code: string;
  category: 'functional' | 'visual' | 'performance' | 'accessibility';
  priority: 'high' | 'medium' | 'low';
}

export type AssertionType = 
  | 'element-visible'
  | 'element-hidden'
  | 'element-enabled'
  | 'element-disabled'
  | 'element-checked'
  | 'element-unchecked'
  | 'text-equals'
  | 'text-contains'
  | 'text-matches'
  | 'value-equals'
  | 'value-contains'
  | 'attribute-equals'
  | 'attribute-contains'
  | 'count-equals'
  | 'count-greater-than'
  | 'url-equals'
  | 'url-contains'
  | 'title-equals'
  | 'title-contains'
  | 'class-contains'
  | 'class-not-contains'
  | 'style-equals'
  | 'page-load-time'
  | 'network-response'
  | 'console-no-errors'
  | 'accessibility-compliant';

export interface AssertionContext {
  previousEvents: RecordedEvent[];
  currentEvent: RecordedEvent;
  nextEvents: RecordedEvent[];
  pageState?: PageState;
  userIntent?: string;
}

export interface PageState {
  url: string;
  title: string;
  elements: ElementState[];
  performance?: PerformanceState;
  console?: ConsoleState;
  network?: NetworkState;
}

export interface ElementState {
  selector: string;
  visible: boolean;
  enabled: boolean;
  text?: string;
  value?: string;
  attributes: Record<string, string>;
  classes: string[];
  styles: Record<string, string>;
}

export interface PerformanceState {
  loadTime: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  cumulativeLayoutShift: number;
}

export interface ConsoleState {
  errors: string[];
  warnings: string[];
  logs: string[];
}

export interface NetworkState {
  requests: NetworkRequest[];
  responses: NetworkResponse[];
  failedRequests: number;
}

export interface NetworkRequest {
  url: string;
  method: string;
  status: number;
  duration: number;
}

export interface NetworkResponse {
  url: string;
  status: number;
  headers: Record<string, string>;
  body?: string;
}

/**
 * Smart assertion generator that analyzes events and generates meaningful test assertions
 */
export class AssertionGenerator {
  private framework: TestFormat;
  private assertionTemplates: Map<string, string> = new Map();

  constructor(framework: TestFormat = 'playwright') {
    this.framework = framework;
    this.initializeAssertionTemplates();
  }

  /**
   * Generate assertions for a sequence of events
   */
  generateAssertions(events: RecordedEvent[], pageState?: PageState): GeneratedAssertion[] {
    const assertions: GeneratedAssertion[] = [];

    for (let i = 0; i < events.length; i++) {
      const currentEvent = events[i];
      const context: AssertionContext = {
        previousEvents: events.slice(0, i),
        currentEvent,
        nextEvents: events.slice(i + 1),
        pageState,
        userIntent: this.inferUserIntent(currentEvent, events)
      };

      const eventAssertions = this.generateAssertionsForEvent(context);
      assertions.push(...eventAssertions);
    }

    // Add page-level assertions
    if (pageState) {
      assertions.push(...this.generatePageLevelAssertions(pageState, events));
    }

    // Filter and rank assertions
    return this.filterAndRankAssertions(assertions);
  }

  /**
   * Generate assertions for a specific event
   */
  private generateAssertionsForEvent(context: AssertionContext): GeneratedAssertion[] {
    const { currentEvent } = context;
    const assertions: GeneratedAssertion[] = [];

    switch (currentEvent.type) {
      case 'navigation':
        assertions.push(...this.generateNavigationAssertions(context));
        break;
      case 'click':
        assertions.push(...this.generateClickAssertions(context));
        break;
      case 'input':
      case 'change':
        assertions.push(...this.generateInputAssertions(context));
        break;
      case 'submit':
        assertions.push(...this.generateSubmitAssertions(context));
        break;
      case 'focus':
      case 'blur':
        assertions.push(...this.generateFocusAssertions(context));
        break;
      default:
        assertions.push(...this.generateGenericAssertions(context));
    }

    return assertions;
  }

  /**
   * Generate navigation-specific assertions
   */
  private generateNavigationAssertions(context: AssertionContext): GeneratedAssertion[] {
    const { currentEvent } = context;
    const navData = currentEvent.data as NavigationEventData;
    const assertions: GeneratedAssertion[] = [];

    // URL assertion
    assertions.push({
      id: this.generateId(),
      type: 'url-equals',
      selector: '',
      expected: navData.url,
      description: `Page navigated to ${navData.url}`,
      confidence: 0.9,
      framework: this.framework,
      code: this.generateAssertionCode('url-equals', '', navData.url),
      category: 'functional',
      priority: 'high'
    });

    // Title assertion if available
    if (navData.title) {
      assertions.push({
        id: this.generateId(),
        type: 'title-equals',
        selector: '',
        expected: navData.title,
        description: `Page title is "${navData.title}"`,
        confidence: 0.8,
        framework: this.framework,
        code: this.generateAssertionCode('title-equals', '', navData.title),
        category: 'functional',
        priority: 'medium'
      });
    }

    // Page load performance assertion
    if (context.pageState?.performance) {
      const loadTime = context.pageState.performance.loadTime;
      if (loadTime > 0) {
        assertions.push({
          id: this.generateId(),
          type: 'page-load-time',
          selector: '',
          expected: 5000, // 5 second threshold
          actual: loadTime,
          description: `Page loads within 5 seconds (actual: ${loadTime}ms)`,
          confidence: 0.7,
          framework: this.framework,
          code: this.generateAssertionCode('page-load-time', '', 5000),
          category: 'performance',
          priority: 'medium'
        });
      }
    }

    return assertions;
  }

  /**
   * Generate click-specific assertions
   */
  private generateClickAssertions(context: AssertionContext): GeneratedAssertion[] {
    const { currentEvent, nextEvents } = context;
    const assertions: GeneratedAssertion[] = [];

    // Element visibility assertion
    assertions.push({
      id: this.generateId(),
      type: 'element-visible',
      selector: currentEvent.target.selector,
      expected: true,
      description: `Element ${this.getElementDescription(currentEvent.target)} is visible before click`,
      confidence: 0.8,
      framework: this.framework,
      code: this.generateAssertionCode('element-visible', currentEvent.target.selector, true),
      category: 'functional',
      priority: 'medium'
    });

    // Element enabled assertion
    if (currentEvent.target.tagName.toLowerCase() === 'button' || 
        (currentEvent.target.tagName.toLowerCase() === 'input' && currentEvent.target.type === 'button')) {
      assertions.push({
        id: this.generateId(),
        type: 'element-enabled',
        selector: currentEvent.target.selector,
        expected: true,
        description: `Button ${this.getElementDescription(currentEvent.target)} is enabled`,
        confidence: 0.9,
        framework: this.framework,
        code: this.generateAssertionCode('element-enabled', currentEvent.target.selector, true),
        category: 'functional',
        priority: 'high'
      });
    }

    // Result of click - check if navigation or form submission occurred
    const nextNavigation = nextEvents.find(e => e.type === 'navigation');
    if (nextNavigation) {
      const navData = nextNavigation.data as NavigationEventData;
      assertions.push({
        id: this.generateId(),
        type: 'url-equals',
        selector: '',
        expected: navData.url,
        description: `Click navigates to ${navData.url}`,
        confidence: 0.8,
        framework: this.framework,
        code: this.generateAssertionCode('url-equals', '', navData.url),
        category: 'functional',
        priority: 'high'
      });
    }

    return assertions;
  }

  /**
   * Generate input-specific assertions
   */
  private generateInputAssertions(context: AssertionContext): GeneratedAssertion[] {
    const { currentEvent } = context;
    const formData = currentEvent.data as FormEventData;
    const assertions: GeneratedAssertion[] = [];

    // Don't assert password values for security
    if (currentEvent.target.type === 'password') {
      return assertions;
    }

    // Value assertion
    if (formData.value) {
      assertions.push({
        id: this.generateId(),
        type: 'value-equals',
        selector: currentEvent.target.selector,
        expected: formData.value,
        description: `Input field contains value "${formData.value}"`,
        confidence: 0.9,
        framework: this.framework,
        code: this.generateAssertionCode('value-equals', currentEvent.target.selector, formData.value),
        category: 'functional',
        priority: 'high'
      });
    }

    // Checkbox/radio state assertion
    if (['checkbox', 'radio'].includes(currentEvent.target.type || '')) {
      const isChecked = formData.value === 'true' || formData.value === 'checked';
      assertions.push({
        id: this.generateId(),
        type: isChecked ? 'element-checked' : 'element-unchecked',
        selector: currentEvent.target.selector,
        expected: isChecked,
        description: `${currentEvent.target.type} is ${isChecked ? 'checked' : 'unchecked'}`,
        confidence: 0.9,
        framework: this.framework,
        code: this.generateAssertionCode(isChecked ? 'element-checked' : 'element-unchecked', currentEvent.target.selector, isChecked),
        category: 'functional',
        priority: 'high'
      });
    }

    return assertions;
  }

  /**
   * Generate submit-specific assertions
   */
  private generateSubmitAssertions(context: AssertionContext): GeneratedAssertion[] {
    const { nextEvents, pageState } = context;
    const assertions: GeneratedAssertion[] = [];

    // Check for success indicators after form submission
    const nextNavigation = nextEvents.find(e => e.type === 'navigation');
    if (nextNavigation) {
      const navData = nextNavigation.data as NavigationEventData;
      
      // Check if navigated to success/confirmation page
      if (navData.url.includes('success') || navData.url.includes('confirm') || navData.url.includes('thank-you')) {
        assertions.push({
          id: this.generateId(),
          type: 'url-contains',
          selector: '',
          expected: 'success',
          description: 'Form submission redirects to success page',
          confidence: 0.8,
          framework: this.framework,
          code: this.generateAssertionCode('url-contains', '', 'success'),
          category: 'functional',
          priority: 'high'
        });
      }
    }

    // Check for success messages or indicators
    if (pageState?.elements) {
      const successIndicators = pageState.elements.filter(el => 
        el.text?.toLowerCase().includes('success') ||
        el.text?.toLowerCase().includes('submitted') ||
        el.text?.toLowerCase().includes('thank you') ||
        el.classes.some(cls => cls.includes('success') || cls.includes('alert-success'))
      );

      successIndicators.forEach(indicator => {
        assertions.push({
          id: this.generateId(),
          type: 'element-visible',
          selector: indicator.selector,
          expected: true,
          description: 'Success message is displayed after form submission',
          confidence: 0.7,
          framework: this.framework,
          code: this.generateAssertionCode('element-visible', indicator.selector, true),
          category: 'functional',
          priority: 'high'
        });
      });
    }

    return assertions;
  }

  /**
   * Generate focus-specific assertions
   */
  private generateFocusAssertions(context: AssertionContext): GeneratedAssertion[] {
    const { currentEvent } = context;
    const assertions: GeneratedAssertion[] = [];

    // Element should be visible when focused
    assertions.push({
      id: this.generateId(),
      type: 'element-visible',
      selector: currentEvent.target.selector,
      expected: true,
      description: `Element is visible when focused`,
      confidence: 0.8,
      framework: this.framework,
      code: this.generateAssertionCode('element-visible', currentEvent.target.selector, true),
      category: 'functional',
      priority: 'medium'
    });

    return assertions;
  }

  /**
   * Generate generic assertions for other event types
   */
  private generateGenericAssertions(context: AssertionContext): GeneratedAssertion[] {
    const { currentEvent } = context;
    const assertions: GeneratedAssertion[] = [];

    // Basic visibility assertion for most interactive elements
    if (['button', 'a', 'input', 'select', 'textarea'].includes(currentEvent.target.tagName.toLowerCase())) {
      assertions.push({
        id: this.generateId(),
        type: 'element-visible',
        selector: currentEvent.target.selector,
        expected: true,
        description: `Element ${this.getElementDescription(currentEvent.target)} is visible`,
        confidence: 0.6,
        framework: this.framework,
        code: this.generateAssertionCode('element-visible', currentEvent.target.selector, true),
        category: 'functional',
        priority: 'low'
      });
    }

    return assertions;
  }

  /**
   * Generate page-level assertions
   */
  private generatePageLevelAssertions(pageState: PageState, _events: RecordedEvent[]): GeneratedAssertion[] {
    const assertions: GeneratedAssertion[] = [];

    // Console error assertion
    if (pageState.console && pageState.console.errors.length === 0) {
      assertions.push({
        id: this.generateId(),
        type: 'console-no-errors',
        selector: '',
        expected: 0,
        actual: pageState.console.errors.length,
        description: 'Page has no console errors',
        confidence: 0.9,
        framework: this.framework,
        code: this.generateAssertionCode('console-no-errors', '', 0),
        category: 'functional',
        priority: 'high'
      });
    }

    // Network request success assertion
    if (pageState.network && pageState.network.failedRequests === 0) {
      assertions.push({
        id: this.generateId(),
        type: 'network-response',
        selector: '',
        expected: 'success',
        description: 'All network requests completed successfully',
        confidence: 0.8,
        framework: this.framework,
        code: this.generateAssertionCode('network-response', '', 'success'),
        category: 'functional',
        priority: 'medium'
      });
    }

    return assertions;
  }

  /**
   * Generate assertion code for specific framework
   */
  private generateAssertionCode(type: AssertionType, selector: string, expected: any): string {
    const template = this.assertionTemplates.get(`${this.framework}-${type}`);
    if (!template) {
      return `// TODO: Add ${type} assertion`;
    }

    return template
      .replace('{{selector}}', selector)
      .replace('{{expected}}', typeof expected === 'string' ? `'${expected}'` : String(expected));
  }

  /**
   * Filter and rank assertions by confidence and priority
   */
  private filterAndRankAssertions(assertions: GeneratedAssertion[]): GeneratedAssertion[] {
    // Remove duplicate assertions
    const uniqueAssertions = assertions.filter((assertion, index, array) => 
      array.findIndex(a => 
        a.type === assertion.type && 
        a.selector === assertion.selector && 
        a.expected === assertion.expected
      ) === index
    );

    // Sort by priority and confidence
    return uniqueAssertions.sort((a, b) => {
      const priorityWeight = { high: 3, medium: 2, low: 1 };
      const aPriority = priorityWeight[a.priority];
      const bPriority = priorityWeight[b.priority];
      
      if (aPriority !== bPriority) {
        return bPriority - aPriority;
      }
      
      return b.confidence - a.confidence;
    });
  }

  /**
   * Infer user intent from event and context
   */
  private inferUserIntent(event: RecordedEvent, _allEvents: RecordedEvent[]): string {
    switch (event.type) {
      case 'navigation':
        return 'navigate';
      case 'input':
        return 'fill_form';
      case 'submit':
        return 'submit_form';
      case 'click': {
        const target = event.target.tagName.toLowerCase();
        if (target === 'button' || (target === 'input' && event.target.type === 'button')) {
          return 'click_button';
        } else if (target === 'a') {
          return 'click_link';
        }
        return 'interact';
      }
      default:
        return 'interact';
    }
  }

  /**
   * Initialize assertion templates for different frameworks
   */
  private initializeAssertionTemplates(): void {
    // Playwright templates
    this.assertionTemplates.set('playwright-element-visible', 'await expect(page.locator(\'{{selector}}\')).toBeVisible();');
    this.assertionTemplates.set('playwright-element-hidden', 'await expect(page.locator(\'{{selector}}\')).toBeHidden();');
    this.assertionTemplates.set('playwright-element-enabled', 'await expect(page.locator(\'{{selector}}\')).toBeEnabled();');
    this.assertionTemplates.set('playwright-element-disabled', 'await expect(page.locator(\'{{selector}}\')).toBeDisabled();');
    this.assertionTemplates.set('playwright-element-checked', 'await expect(page.locator(\'{{selector}}\')).toBeChecked();');
    this.assertionTemplates.set('playwright-element-unchecked', 'await expect(page.locator(\'{{selector}}\')).not.toBeChecked();');
    this.assertionTemplates.set('playwright-text-equals', 'await expect(page.locator(\'{{selector}}\')).toHaveText({{expected}});');
    this.assertionTemplates.set('playwright-text-contains', 'await expect(page.locator(\'{{selector}}\')).toContainText({{expected}});');
    this.assertionTemplates.set('playwright-value-equals', 'await expect(page.locator(\'{{selector}}\')).toHaveValue({{expected}});');
    this.assertionTemplates.set('playwright-url-equals', 'expect(page.url()).toBe({{expected}});');
    this.assertionTemplates.set('playwright-url-contains', 'expect(page.url()).toContain({{expected}});');
    this.assertionTemplates.set('playwright-title-equals', 'expect(await page.title()).toBe({{expected}});');
    this.assertionTemplates.set('playwright-console-no-errors', 'expect(await page.evaluate(() => console.error.calls?.length || 0)).toBe(0);');

    // Cypress templates
    this.assertionTemplates.set('cypress-element-visible', 'cy.get(\'{{selector}}\').should(\'be.visible\');');
    this.assertionTemplates.set('cypress-element-hidden', 'cy.get(\'{{selector}}\').should(\'not.be.visible\');');
    this.assertionTemplates.set('cypress-element-enabled', 'cy.get(\'{{selector}}\').should(\'not.be.disabled\');');
    this.assertionTemplates.set('cypress-element-disabled', 'cy.get(\'{{selector}}\').should(\'be.disabled\');');
    this.assertionTemplates.set('cypress-element-checked', 'cy.get(\'{{selector}}\').should(\'be.checked\');');
    this.assertionTemplates.set('cypress-element-unchecked', 'cy.get(\'{{selector}}\').should(\'not.be.checked\');');
    this.assertionTemplates.set('cypress-text-equals', 'cy.get(\'{{selector}}\').should(\'contain.text\', {{expected}});');
    this.assertionTemplates.set('cypress-text-contains', 'cy.get(\'{{selector}}\').should(\'contain\', {{expected}});');
    this.assertionTemplates.set('cypress-value-equals', 'cy.get(\'{{selector}}\').should(\'have.value\', {{expected}});');
    this.assertionTemplates.set('cypress-url-equals', 'cy.url().should(\'eq\', {{expected}});');
    this.assertionTemplates.set('cypress-url-contains', 'cy.url().should(\'include\', {{expected}});');
    this.assertionTemplates.set('cypress-title-equals', 'cy.title().should(\'eq\', {{expected}});');

    // Add more framework templates as needed...
  }

  /**
   * Get human-readable element description
   */
  private getElementDescription(target: any): string {
    if (target.textContent && target.textContent.length < 30) {
      return `"${target.textContent.trim()}"`;
    }
    if (target.id) {
      return `#${target.id}`;
    }
    if (target.name) {
      return `[name="${target.name}"]`;
    }
    return target.tagName.toLowerCase();
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * Update framework for code generation
   */
  setFramework(framework: TestFormat): void {
    this.framework = framework;
  }

  /**
   * Add custom assertion template
   */
  addAssertionTemplate(key: string, template: string): void {
    this.assertionTemplates.set(key, template);
  }

  /**
   * Get available assertion types for current framework
   */
  getAvailableAssertionTypes(): AssertionType[] {
    const types: AssertionType[] = [];
    
    this.assertionTemplates.forEach((_, key) => {
      if (key.startsWith(this.framework + '-')) {
        const type = key.replace(this.framework + '-', '') as AssertionType;
        if (!types.includes(type)) {
          types.push(type);
        }
      }
    });
    
    return types;
  }
}

export default AssertionGenerator;