/**
 * Accessibility Auditor
 * Integrates with axe-core for comprehensive accessibility testing during automation
 */

export interface AccessibilityRule {
  id: string;
  impact: 'minor' | 'moderate' | 'serious' | 'critical';
  tags: string[];
  description: string;
  help: string;
  helpUrl: string;
  enabled: boolean;
}

export interface AccessibilityViolation {
  id: string;
  ruleId: string;
  impact: 'minor' | 'moderate' | 'serious' | 'critical';
  description: string;
  help: string;
  helpUrl: string;
  nodes: ViolationNode[];
  tags: string[];
  timestamp: number;
  url: string;
}

export interface ViolationNode {
  target: string[]; // CSS selectors
  html: string;
  impact: 'minor' | 'moderate' | 'serious' | 'critical';
  message: string;
  data?: any;
  relatedNodes?: RelatedNode[];
  xpath?: string;
  ancestry?: string[];
}

export interface RelatedNode {
  target: string[];
  html: string;
  text?: string;
}

export interface AccessibilityAssertion {
  id: string;
  name: string;
  type: 'rule' | 'custom' | 'wcag' | 'section508' | 'bestPractice';
  ruleIds: string[];
  severity: 'error' | 'warning' | 'info';
  enabled: boolean;
  description?: string;
  customCheck?: AccessibilityCheck;
}

export interface AccessibilityCheck {
  name: string;
  code: string; // JavaScript code to execute
  metadata?: Record<string, any>;
}

export interface AccessibilityAuditResult {
  passed: boolean;
  violations: AccessibilityViolation[];
  incomplete: AccessibilityViolation[];
  passes: AccessibilityPass[];
  inapplicable: AccessibilityRule[];
  summary: AuditSummary;
  timestamp: number;
  url: string;
  testRunner: TestRunnerInfo;
}

export interface AccessibilityPass {
  id: string;
  ruleId: string;
  description: string;
  help: string;
  helpUrl: string;
  impact: null;
  tags: string[];
  nodes: PassNode[];
}

export interface PassNode {
  target: string[];
  html: string;
}

export interface AuditSummary {
  totalRules: number;
  passedRules: number;
  violatedRules: number;
  incompleteRules: number;
  inapplicableRules: number;
  criticalViolations: number;
  seriousViolations: number;
  moderateViolations: number;
  minorViolations: number;
  wcagLevel: WCAGLevel;
  complianceScore: number; // 0-100
}

export interface WCAGLevel {
  'wcag2a': ComplianceStatus;
  'wcag2aa': ComplianceStatus;
  'wcag2aaa': ComplianceStatus;
  'wcag21a': ComplianceStatus;
  'wcag21aa': ComplianceStatus;
  'wcag22aa': ComplianceStatus;
}

export interface ComplianceStatus {
  passed: number;
  failed: number;
  total: number;
  percentage: number;
}

export interface TestRunnerInfo {
  name: string;
  version: string;
  environment?: string;
  viewport: { width: number; height: number };
  userAgent: string;
}

export interface AccessibilityOptions {
  rules?: Record<string, boolean | RuleOptions>;
  tags?: string[];
  include?: string[][];
  exclude?: string[][];
  runOnly?: RunOnlyOptions;
  reporter?: 'v1' | 'v2' | 'no-passes';
  resultTypes?: ('violations' | 'incomplete' | 'passes' | 'inapplicable')[];
  elementRef?: boolean;
  selectors?: boolean;
  ancestry?: boolean;
  xpath?: boolean;
  absolutePaths?: boolean;
}

export interface RuleOptions {
  enabled: boolean;
  options?: any;
}

export interface RunOnlyOptions {
  type: 'rule' | 'tag';
  values: string[];
}

export interface AccessibilityProfile {
  id: string;
  name: string;
  description?: string;
  standard: 'wcag2a' | 'wcag2aa' | 'wcag2aaa' | 'wcag21aa' | 'wcag22aa' | 'section508' | 'best-practice' | 'custom';
  rules: AccessibilityRule[];
  assertions: AccessibilityAssertion[];
  options: AccessibilityOptions;
  reportingLevel: 'all' | 'violations-only' | 'critical-only';
}

export interface KeyboardNavigationTest {
  id: string;
  name: string;
  sequence: KeyboardAction[];
  assertions: KeyboardAssertion[];
  enabled: boolean;
}

export interface KeyboardAction {
  type: 'keydown' | 'keyup' | 'keypress';
  key: string;
  code: string;
  modifiers?: KeyboardModifiers;
  delay?: number;
  target?: string; // CSS selector
}

export interface KeyboardModifiers {
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
}

export interface KeyboardAssertion {
  type: 'focus' | 'visible' | 'accessible' | 'interactive';
  selector: string;
  expected: boolean;
  message: string;
}

export interface ScreenReaderTest {
  id: string;
  name: string;
  virtualCursor: boolean;
  announcements: ExpectedAnnouncement[];
  enabled: boolean;
}

export interface ExpectedAnnouncement {
  action: string;
  target: string;
  expectedText: string;
  role?: string;
  state?: string;
  properties?: Record<string, string>;
}

export interface ColorContrastResult {
  foreground: string;
  background: string;
  ratio: number;
  level: 'AA' | 'AAA' | 'fail';
  passed: boolean;
  element: string;
  fontSize: number;
  fontWeight: string;
}

export class AccessibilityAuditor {
  private axeCore?: any;
  private profiles = new Map<string, AccessibilityProfile>();
  private currentProfile?: AccessibilityProfile;
  private lastAuditResult?: AccessibilityAuditResult;
  
  constructor() {
    this.initializeAxe();
    this.createDefaultProfiles();
  }

  /**
   * Initialize axe-core library
   */
  private async initializeAxe(): Promise<void> {
    try {
      // In a real implementation, this would import axe-core
      // For now, we'll mock the interface
      this.axeCore = {
        run: this.mockAxeRun.bind(this),
        configure: this.mockAxeConfigure.bind(this),
        getRules: this.mockAxeGetRules.bind(this),
      };
    } catch (error) {
      console.warn('Failed to initialize axe-core:', error);
    }
  }

  /**
   * Run accessibility audit on current page or specific element
   */
  async runAudit(
    context?: string | Element,
    options?: AccessibilityOptions
  ): Promise<AccessibilityAuditResult> {
    if (!this.axeCore) {
      throw new Error('axe-core not initialized');
    }

    const auditOptions = {
      ...this.getDefaultOptions(),
      ...options,
      ...this.currentProfile?.options,
    };

    const axeResult = await this.axeCore.run(context || document, auditOptions);
    
    const result = this.processAxeResult(axeResult);
    this.lastAuditResult = result;
    
    return result;
  }

  /**
   * Run accessibility audit during test execution
   */
  async auditDuringTest(
    stepId: string,
    context?: string | Element
  ): Promise<AccessibilityViolation[]> {
    const result = await this.runAudit(context);
    
    // Filter violations based on current profile
    const filteredViolations = this.filterViolationsBySeverity(
      result.violations,
      this.currentProfile?.reportingLevel || 'all'
    );

    // Add step context to violations
    filteredViolations.forEach(violation => {
      violation.id = `${stepId}_${violation.id}`;
    });

    return filteredViolations;
  }

  /**
   * Generate accessibility assertions based on WCAG guidelines
   */
  generateAccessibilityAssertions(
    standard: 'wcag2a' | 'wcag2aa' | 'wcag2aaa' = 'wcag2aa'
  ): AccessibilityAssertion[] {
    const assertions: AccessibilityAssertion[] = [];
    const rules = this.getWCAGRules(standard);

    // Critical accessibility rules
    const criticalRules = rules.filter(rule => rule.impact === 'critical');
    if (criticalRules.length > 0) {
      assertions.push({
        id: 'critical_violations',
        name: 'No critical accessibility violations',
        type: 'rule',
        ruleIds: criticalRules.map(r => r.id),
        severity: 'error',
        enabled: true,
        description: 'Ensures no critical accessibility violations are present',
      });
    }

    // Keyboard navigation
    assertions.push({
      id: 'keyboard_navigation',
      name: 'Keyboard navigation support',
      type: 'custom',
      ruleIds: ['keyboard', 'focus-order-semantics', 'tabindex'],
      severity: 'error',
      enabled: true,
      description: 'Ensures all interactive elements are keyboard accessible',
      customCheck: {
        name: 'checkKeyboardNavigation',
        code: this.generateKeyboardNavigationCheck(),
      },
    });

    // Screen reader support
    assertions.push({
      id: 'screen_reader_support',
      name: 'Screen reader support',
      type: 'wcag',
      ruleIds: ['label', 'aria-*', 'heading-order'],
      severity: 'error',
      enabled: true,
      description: 'Ensures content is accessible to screen readers',
    });

    // Color contrast
    assertions.push({
      id: 'color_contrast',
      name: 'Adequate color contrast',
      type: 'wcag',
      ruleIds: ['color-contrast'],
      severity: 'error',
      enabled: true,
      description: 'Ensures text has sufficient contrast ratio',
    });

    return assertions;
  }

  /**
   * Test keyboard navigation
   */
  async testKeyboardNavigation(test: KeyboardNavigationTest): Promise<KeyboardTestResult> {
    const results: KeyboardActionResult[] = [];
    
    for (const action of test.sequence) {
      const result = await this.executeKeyboardAction(action);
      results.push(result);
      
      if (action.delay) {
        await new Promise(resolve => setTimeout(resolve, action.delay));
      }
    }

    // Validate assertions
    const assertionResults = await this.validateKeyboardAssertions(test.assertions);

    return {
      testId: test.id,
      passed: assertionResults.every(r => r.passed),
      actions: results,
      assertions: assertionResults,
    };
  }

  /**
   * Test color contrast
   */
  async testColorContrast(
    elements?: string[],
    level: 'AA' | 'AAA' = 'AA'
  ): Promise<ColorContrastResult[]> {
    const elementsToTest = elements || ['*']; // All elements if not specified
    const results: ColorContrastResult[] = [];

    for (const selector of elementsToTest) {
      const elementResults = await this.analyzeColorContrast(selector, level);
      results.push(...elementResults);
    }

    return results;
  }

  /**
   * Create accessibility profile
   */
  createProfile(profile: AccessibilityProfile): void {
    this.profiles.set(profile.id, profile);
  }

  /**
   * Apply accessibility profile
   */
  applyProfile(profileId: string): boolean {
    const profile = this.profiles.get(profileId);
    if (!profile) {
      return false;
    }

    this.currentProfile = profile;
    
    // Configure axe with profile rules
    if (this.axeCore) {
      this.axeCore.configure({
        rules: this.convertRulesToAxeConfig(profile.rules),
      });
    }

    return true;
  }

  /**
   * Get available profiles
   */
  getProfiles(): AccessibilityProfile[] {
    return Array.from(this.profiles.values());
  }

  /**
   * Get last audit result
   */
  getLastAuditResult(): AccessibilityAuditResult | undefined {
    return this.lastAuditResult;
  }

  /**
   * Export audit results
   */
  exportAuditResult(format: 'json' | 'html' | 'csv' = 'json'): string {
    if (!this.lastAuditResult) {
      throw new Error('No audit result available');
    }

    switch (format) {
      case 'json':
        return JSON.stringify(this.lastAuditResult, null, 2);
      case 'html':
        return this.generateHtmlReport(this.lastAuditResult);
      case 'csv':
        return this.generateCsvReport(this.lastAuditResult);
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  /**
   * Mock axe-core run method
   */
  private async mockAxeRun(context: any, options: any): Promise<any> {
    // Mock axe result - in real implementation, this would be actual axe-core
    return {
      violations: [
        {
          id: 'color-contrast',
          impact: 'serious',
          tags: ['wcag2aa', 'wcag143'],
          description: 'Elements must have sufficient color contrast',
          help: 'Color contrast must meet WCAG AA standards',
          helpUrl: 'https://dequeuniversity.com/rules/axe/4.4/color-contrast',
          nodes: [
            {
              target: ['.low-contrast-text'],
              html: '<span class="low-contrast-text">Hard to read text</span>',
              impact: 'serious',
              message: 'Element has insufficient color contrast of 2.1:1',
              data: { fgColor: '#999999', bgColor: '#ffffff', contrastRatio: 2.1 },
            },
          ],
        },
        {
          id: 'missing-alt',
          impact: 'critical',
          tags: ['wcag2a', 'wcag111'],
          description: 'Images must have alternative text',
          help: 'All img elements must have an alt attribute',
          helpUrl: 'https://dequeuniversity.com/rules/axe/4.4/image-alt',
          nodes: [
            {
              target: ['img[src="example.jpg"]'],
              html: '<img src="example.jpg">',
              impact: 'critical',
              message: 'Image does not have an alt attribute',
              data: null,
            },
          ],
        },
      ],
      incomplete: [],
      passes: [
        {
          id: 'document-title',
          impact: null,
          tags: ['wcag2a', 'wcag242'],
          description: 'Documents must have a title',
          help: 'Each page must have a descriptive title',
          helpUrl: 'https://dequeuniversity.com/rules/axe/4.4/document-title',
          nodes: [
            {
              target: ['title'],
              html: '<title>Test Page</title>',
            },
          ],
        },
      ],
      inapplicable: [],
      testRunner: {
        name: 'axe-core',
        version: '4.4.0',
      },
      testEnvironment: {
        userAgent: navigator.userAgent,
        windowWidth: window.innerWidth,
        windowHeight: window.innerHeight,
      },
      timestamp: Date.now(),
      url: window.location.href,
    };
  }

  private mockAxeConfigure(config: any): void {
    // Mock configuration
  }

  private mockAxeGetRules(): AccessibilityRule[] {
    return [
      {
        id: 'color-contrast',
        impact: 'serious',
        tags: ['wcag2aa', 'wcag143'],
        description: 'Elements must have sufficient color contrast',
        help: 'Color contrast must meet WCAG AA standards',
        helpUrl: 'https://dequeuniversity.com/rules/axe/4.4/color-contrast',
        enabled: true,
      },
      {
        id: 'image-alt',
        impact: 'critical',
        tags: ['wcag2a', 'wcag111'],
        description: 'Images must have alternative text',
        help: 'All img elements must have an alt attribute',
        helpUrl: 'https://dequeuniversity.com/rules/axe/4.4/image-alt',
        enabled: true,
      },
      {
        id: 'keyboard',
        impact: 'serious',
        tags: ['wcag2a', 'wcag211'],
        description: 'Interactive elements must be keyboard accessible',
        help: 'All interactive elements must be reachable via keyboard',
        helpUrl: 'https://dequeuniversity.com/rules/axe/4.4/keyboard',
        enabled: true,
      },
    ];
  }

  /**
   * Process axe result and create standardized format
   */
  private processAxeResult(axeResult: any): AccessibilityAuditResult {
    const violations = axeResult.violations.map((violation: any) => ({
      id: `violation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ruleId: violation.id,
      impact: violation.impact,
      description: violation.description,
      help: violation.help,
      helpUrl: violation.helpUrl,
      nodes: violation.nodes.map((node: any) => ({
        target: node.target,
        html: node.html,
        impact: node.impact,
        message: node.message,
        data: node.data,
        xpath: this.generateXPath(node.target[0]),
      })),
      tags: violation.tags,
      timestamp: Date.now(),
      url: window.location.href,
    }));

    const passes = axeResult.passes.map((pass: any) => ({
      id: `pass_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ruleId: pass.id,
      description: pass.description,
      help: pass.help,
      helpUrl: pass.helpUrl,
      impact: pass.impact,
      tags: pass.tags,
      nodes: pass.nodes.map((node: any) => ({
        target: node.target,
        html: node.html,
      })),
    }));

    const summary = this.createAuditSummary(violations, passes, axeResult.inapplicable);

    return {
      passed: violations.length === 0,
      violations,
      incomplete: axeResult.incomplete || [],
      passes,
      inapplicable: axeResult.inapplicable || [],
      summary,
      timestamp: Date.now(),
      url: window.location.href,
      testRunner: {
        name: 'axe-core',
        version: '4.4.0',
        viewport: { width: window.innerWidth, height: window.innerHeight },
        userAgent: navigator.userAgent,
      },
    };
  }

  /**
   * Create audit summary
   */
  private createAuditSummary(
    violations: AccessibilityViolation[],
    passes: AccessibilityPass[],
    inapplicable: AccessibilityRule[]
  ): AuditSummary {
    const criticalViolations = violations.filter(v => v.impact === 'critical').length;
    const seriousViolations = violations.filter(v => v.impact === 'serious').length;
    const moderateViolations = violations.filter(v => v.impact === 'moderate').length;
    const minorViolations = violations.filter(v => v.impact === 'minor').length;

    const totalRules = violations.length + passes.length + inapplicable.length;
    const passedRules = passes.length;
    const violatedRules = violations.length;

    const wcagLevel = this.calculateWCAGCompliance(violations, passes);
    const complianceScore = totalRules > 0 ? (passedRules / totalRules) * 100 : 100;

    return {
      totalRules,
      passedRules,
      violatedRules,
      incompleteRules: 0,
      inapplicableRules: inapplicable.length,
      criticalViolations,
      seriousViolations,
      moderateViolations,
      minorViolations,
      wcagLevel,
      complianceScore,
    };
  }

  /**
   * Calculate WCAG compliance levels
   */
  private calculateWCAGCompliance(
    violations: AccessibilityViolation[],
    passes: AccessibilityPass[]
  ): WCAGLevel {
    const levels = ['wcag2a', 'wcag2aa', 'wcag2aaa', 'wcag21a', 'wcag21aa', 'wcag22aa'];
    const compliance: WCAGLevel = {} as WCAGLevel;

    levels.forEach(level => {
      const levelViolations = violations.filter(v => v.tags.includes(level));
      const levelPasses = passes.filter(p => p.tags.includes(level));
      const total = levelViolations.length + levelPasses.length;

      compliance[level as keyof WCAGLevel] = {
        passed: levelPasses.length,
        failed: levelViolations.length,
        total,
        percentage: total > 0 ? (levelPasses.length / total) * 100 : 100,
      };
    });

    return compliance;
  }

  /**
   * Create default accessibility profiles
   */
  private createDefaultProfiles(): void {
    // WCAG 2.1 AA Profile
    const wcag21aaProfile: AccessibilityProfile = {
      id: 'wcag21aa',
      name: 'WCAG 2.1 AA',
      description: 'Web Content Accessibility Guidelines 2.1 Level AA compliance',
      standard: 'wcag21aa',
      rules: this.getWCAGRules('wcag21aa'),
      assertions: this.generateAccessibilityAssertions('wcag2aa'),
      options: {
        tags: ['wcag21aa'],
        runOnly: {
          type: 'tag',
          values: ['wcag21aa'],
        },
      },
      reportingLevel: 'violations-only',
    };

    this.profiles.set(wcag21aaProfile.id, wcag21aaProfile);

    // Best Practices Profile
    const bestPracticesProfile: AccessibilityProfile = {
      id: 'best-practice',
      name: 'Best Practices',
      description: 'Accessibility best practices beyond WCAG compliance',
      standard: 'best-practice',
      rules: this.getBestPracticeRules(),
      assertions: [],
      options: {
        tags: ['best-practice'],
      },
      reportingLevel: 'all',
    };

    this.profiles.set(bestPracticesProfile.id, bestPracticesProfile);
  }

  /**
   * Helper methods
   */
  private getDefaultOptions(): AccessibilityOptions {
    return {
      resultTypes: ['violations', 'incomplete', 'passes'],
      elementRef: true,
      selectors: true,
      ancestry: false,
      xpath: true,
    };
  }

  private getWCAGRules(standard: string): AccessibilityRule[] {
    // Mock WCAG rules - would be loaded from axe-core
    return [
      {
        id: 'color-contrast',
        impact: 'serious',
        tags: ['wcag2aa', 'wcag143'],
        description: 'Elements must have sufficient color contrast',
        help: 'Color contrast must meet WCAG AA standards',
        helpUrl: 'https://dequeuniversity.com/rules/axe/4.4/color-contrast',
        enabled: true,
      },
      {
        id: 'image-alt',
        impact: 'critical',
        tags: ['wcag2a', 'wcag111'],
        description: 'Images must have alternative text',
        help: 'All img elements must have an alt attribute',
        helpUrl: 'https://dequeuniversity.com/rules/axe/4.4/image-alt',
        enabled: true,
      },
    ];
  }

  private getBestPracticeRules(): AccessibilityRule[] {
    return [
      {
        id: 'landmark-banner-is-top-level',
        impact: 'moderate',
        tags: ['best-practice'],
        description: 'Banner landmark should be at top level',
        help: 'Banner landmarks should not be contained by other landmarks',
        helpUrl: 'https://dequeuniversity.com/rules/axe/4.4/landmark-banner-is-top-level',
        enabled: true,
      },
    ];
  }

  private filterViolationsBySeverity(
    violations: AccessibilityViolation[],
    level: string
  ): AccessibilityViolation[] {
    switch (level) {
      case 'critical-only':
        return violations.filter(v => v.impact === 'critical');
      case 'violations-only':
        return violations.filter(v => v.impact === 'critical' || v.impact === 'serious');
      case 'all':
      default:
        return violations;
    }
  }

  private convertRulesToAxeConfig(rules: AccessibilityRule[]): Record<string, any> {
    const config: Record<string, any> = {};
    rules.forEach(rule => {
      config[rule.id] = { enabled: rule.enabled };
    });
    return config;
  }

  private generateXPath(selector: string): string {
    // Simple XPath generation - would use proper library in production
    try {
      const element = document.querySelector(selector);
      if (element) {
        return this.getXPath(element);
      }
    } catch {
      // Fallback for invalid selectors
    }
    return selector;
  }

  private getXPath(element: Element): string {
    if (element.id) {
      return `//*[@id='${element.id}']`;
    }
    
    const path = [];
    let current = element;
    
    while (current && current.nodeType === Node.ELEMENT_NODE) {
      const tagName = current.tagName.toLowerCase();
      const parent = current.parentElement;
      
      if (parent) {
        const siblings = Array.from(parent.children).filter(e => e.tagName === current.tagName);
        const index = siblings.indexOf(current) + 1;
        path.unshift(`${tagName}[${index}]`);
      } else {
        path.unshift(tagName);
      }
      
      current = parent!;
    }
    
    return '/' + path.join('/');
  }

  private generateKeyboardNavigationCheck(): string {
    return `
      function checkKeyboardNavigation() {
        const interactiveElements = document.querySelectorAll('button, a, input, select, textarea, [tabindex]');
        const violations = [];
        
        interactiveElements.forEach((element, index) => {
          // Check if element is focusable
          const tabIndex = element.getAttribute('tabindex');
          const isFocusable = tabIndex !== '-1' && !element.hasAttribute('disabled');
          
          if (!isFocusable && element.tagName !== 'DIV') {
            violations.push({
              element,
              message: 'Interactive element is not keyboard focusable'
            });
          }
        });
        
        return violations;
      }
    `;
  }

  private async executeKeyboardAction(action: KeyboardAction): Promise<KeyboardActionResult> {
    const event = new KeyboardEvent(action.type, {
      key: action.key,
      code: action.code,
      ctrlKey: action.modifiers?.ctrl || false,
      shiftKey: action.modifiers?.shift || false,
      altKey: action.modifiers?.alt || false,
      metaKey: action.modifiers?.meta || false,
    });

    let target = document.activeElement;
    if (action.target) {
      target = document.querySelector(action.target);
    }

    if (target) {
      target.dispatchEvent(event);
    }

    return {
      action,
      executed: true,
      activeElement: document.activeElement?.tagName || 'unknown',
      error: null,
    };
  }

  private async validateKeyboardAssertions(assertions: KeyboardAssertion[]): Promise<KeyboardAssertionResult[]> {
    return assertions.map(assertion => {
      const element = document.querySelector(assertion.selector);
      let actualValue = false;

      switch (assertion.type) {
        case 'focus':
          actualValue = document.activeElement === element;
          break;
        case 'visible':
          actualValue = element ? this.isElementVisible(element) : false;
          break;
        case 'accessible':
          actualValue = element ? this.isElementAccessible(element) : false;
          break;
        case 'interactive':
          actualValue = element ? this.isElementInteractive(element) : false;
          break;
      }

      return {
        assertion,
        passed: actualValue === assertion.expected,
        actualValue,
        message: actualValue === assertion.expected ? 'Passed' : assertion.message,
      };
    });
  }

  private async analyzeColorContrast(selector: string, level: 'AA' | 'AAA'): Promise<ColorContrastResult[]> {
    const elements = document.querySelectorAll(selector);
    const results: ColorContrastResult[] = [];

    elements.forEach(element => {
      const styles = window.getComputedStyle(element);
      const foreground = styles.color;
      const background = styles.backgroundColor;
      
      if (foreground && background && foreground !== 'rgba(0, 0, 0, 0)' && background !== 'rgba(0, 0, 0, 0)') {
        const ratio = this.calculateContrastRatio(foreground, background);
        const fontSize = parseFloat(styles.fontSize);
        const fontWeight = styles.fontWeight;
        
        const threshold = this.getContrastThreshold(fontSize, fontWeight, level);
        
        results.push({
          foreground,
          background,
          ratio,
          level: ratio >= threshold ? level : 'fail',
          passed: ratio >= threshold,
          element: selector,
          fontSize,
          fontWeight,
        });
      }
    });

    return results;
  }

  private isElementVisible(element: Element): boolean {
    const rect = element.getBoundingClientRect();
    const styles = window.getComputedStyle(element);
    
    return rect.width > 0 && 
           rect.height > 0 && 
           styles.visibility !== 'hidden' && 
           styles.display !== 'none' &&
           parseFloat(styles.opacity) > 0;
  }

  private isElementAccessible(element: Element): boolean {
    const tagName = element.tagName.toLowerCase();
    const role = element.getAttribute('role');
    const ariaLabel = element.getAttribute('aria-label');
    const ariaLabelledby = element.getAttribute('aria-labelledby');
    
    // Check if element has accessible name
    if (tagName === 'img') {
      return element.hasAttribute('alt');
    }
    
    if (tagName === 'input') {
      return element.hasAttribute('aria-label') || 
             element.hasAttribute('aria-labelledby') ||
             element.hasAttribute('title') ||
             !!document.querySelector(`label[for="${element.id}"]`);
    }
    
    return !!(ariaLabel || ariaLabelledby || role);
  }

  private isElementInteractive(element: Element): boolean {
    const tagName = element.tagName.toLowerCase();
    const interactiveTags = ['button', 'a', 'input', 'select', 'textarea'];
    const tabIndex = element.getAttribute('tabindex');
    
    return interactiveTags.includes(tagName) || 
           (tabIndex !== null && tabIndex !== '-1') ||
           element.hasAttribute('onclick') ||
           element.hasAttribute('onkeydown');
  }

  private calculateContrastRatio(foreground: string, background: string): number {
    // Simplified contrast ratio calculation
    // In production, would use proper color parsing and luminance calculation
    return 4.5; // Mock value
  }

  private getContrastThreshold(fontSize: number, fontWeight: string, level: 'AA' | 'AAA'): number {
    const isLargeText = fontSize >= 18 || (fontSize >= 14 && (fontWeight === 'bold' || parseInt(fontWeight) >= 700));
    
    if (level === 'AAA') {
      return isLargeText ? 4.5 : 7;
    } else {
      return isLargeText ? 3 : 4.5;
    }
  }

  private generateHtmlReport(result: AccessibilityAuditResult): string {
    // Generate HTML report
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Accessibility Audit Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .summary { background: #f5f5f5; padding: 15px; border-radius: 5px; }
          .violation { border-left: 4px solid #d9534f; padding: 10px; margin: 10px 0; }
          .critical { border-color: #d9534f; }
          .serious { border-color: #f0ad4e; }
          .moderate { border-color: #5bc0de; }
          .minor { border-color: #5cb85c; }
        </style>
      </head>
      <body>
        <h1>Accessibility Audit Report</h1>
        <div class="summary">
          <h2>Summary</h2>
          <p>Total Rules: ${result.summary.totalRules}</p>
          <p>Passed: ${result.summary.passedRules}</p>
          <p>Failed: ${result.summary.violatedRules}</p>
          <p>Compliance Score: ${result.summary.complianceScore.toFixed(1)}%</p>
        </div>
        <h2>Violations</h2>
        ${result.violations.map(v => `
          <div class="violation ${v.impact}">
            <h3>${v.help}</h3>
            <p><strong>Impact:</strong> ${v.impact}</p>
            <p><strong>Description:</strong> ${v.description}</p>
            <p><strong>Help:</strong> <a href="${v.helpUrl}" target="_blank">${v.helpUrl}</a></p>
            <h4>Affected Elements:</h4>
            <ul>
              ${v.nodes.map(n => `<li><code>${n.html}</code> - ${n.message}</li>`).join('')}
            </ul>
          </div>
        `).join('')}
      </body>
      </html>
    `;
  }

  private generateCsvReport(result: AccessibilityAuditResult): string {
    const headers = ['Rule ID', 'Impact', 'Description', 'Help URL', 'Element', 'Message'];
    const rows = result.violations.flatMap(violation =>
      violation.nodes.map(node => [
        violation.ruleId,
        violation.impact,
        violation.description,
        violation.helpUrl,
        node.html,
        node.message,
      ])
    );

    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  }
}

// Additional interfaces for keyboard and screen reader testing
export interface KeyboardTestResult {
  testId: string;
  passed: boolean;
  actions: KeyboardActionResult[];
  assertions: KeyboardAssertionResult[];
}

export interface KeyboardActionResult {
  action: KeyboardAction;
  executed: boolean;
  activeElement: string;
  error: string | null;
}

export interface KeyboardAssertionResult {
  assertion: KeyboardAssertion;
  passed: boolean;
  actualValue: boolean;
  message: string;
}