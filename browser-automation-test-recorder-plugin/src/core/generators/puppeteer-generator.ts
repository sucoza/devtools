/**
 * Puppeteer Test Generator
 * Generates Puppeteer test code from recorded browser events
 */

import { BaseGenerator, type BaseGeneratorOptions, type GeneratedTestFile, type SelectorOptimization } from './base-generator';
import type {
  RecordedEvent,
  MouseEventData,
  KeyboardEventData,
  FormEventData,
  NavigationEventData,
  ScrollEventData,
  WaitEventData,
  AssertionEventData,
} from '../../types';
import type { EventGroup, CodeGenerationConfig } from '../code-generator';

export class PuppeteerGenerator extends BaseGenerator {
  constructor(config: CodeGenerationConfig, options: BaseGeneratorOptions) {
    super(config, options);
  }

  /**
   * Generate complete Puppeteer test files
   */
  async generateTestFiles(groups: EventGroup[]): Promise<GeneratedTestFile[]> {
    const files: GeneratedTestFile[] = [];
    
    // Generate main test file
    const mainTest = await this.generateMainTestFile(groups);
    files.push(mainTest);
    
    // Generate support files
    const supportFiles = await this.generateSupportFiles(groups);
    files.push(...supportFiles);
    
    // Generate configuration file
    const configFile = this.generateConfigFile();
    files.push(configFile);
    
    return files;
  }

  /**
   * Generate main test file
   */
  private async generateMainTestFile(groups: EventGroup[]): Promise<GeneratedTestFile> {
    const imports = this.generateImports();
    const testSetup = this.generateSetupCode();
    const testBody = await this.generateTestBody(groups);
    const testTeardown = this.generateTeardownCode();
    
    const content = [
      ...imports,
      '',
      testSetup,
      '',
      testBody,
      '',
      testTeardown
    ].filter(Boolean).join('\n');

    return {
      filename: `test.spec.${this.options.language === 'typescript' ? 'ts' : 'js'}`,
      content,
      type: 'test'
    };
  }

  /**
   * Generate test body with grouped events
   */
  private async generateTestBody(groups: EventGroup[]): Promise<string> {
    const testName = this.generateTestName(groups);
    const testCode = await this.generateTestCode(groups);
    
    return `describe('Generated Test Suite', () => {
  it('${testName}', async () => {
${this.indent(testCode)}
  });
});`;
  }

  /**
   * Generate test code from event groups
   */
  private async generateTestCode(groups: EventGroup[]): Promise<string> {
    const codeBlocks: string[] = [];
    
    for (let i = 0; i < groups.length; i++) {
      const group = groups[i];
      const groupCode = await this.generateGroupCode(group);
      
      if (this.options.includeComments) {
        codeBlocks.push(`// ${group.name}`);
        if (group.description) {
          codeBlocks.push(`// ${group.description}`);
        }
      }
      
      codeBlocks.push(groupCode);
      
      // Add spacing between groups
      if (i < groups.length - 1) {
        codeBlocks.push('');
      }
    }
    
    return codeBlocks.join('\n');
  }

  /**
   * Generate code for an event group
   */
  private async generateGroupCode(group: EventGroup): Promise<string> {
    const lines: string[] = [];
    
    for (let i = 0; i < group.events.length; i++) {
      const event = group.events[i];
      const eventCode = this.generateEventCode(event);
      
      if (eventCode) {
        lines.push(eventCode);
      }
      
      // Add smart waits between events
      const nextEvent = group.events[i + 1];
      const smartWait = this.generateSmartWait(event, nextEvent);
      if (smartWait) {
        lines.push(smartWait);
      }
    }
    
    // Add group-level assertions
    const assertions = this.generateGroupAssertions(group);
    lines.push(...assertions);
    
    return lines.join('\n');
  }

  /**
   * Generate code for a single event
   */
  generateEventCode(event: RecordedEvent): string {
    switch (event.type) {
      case 'navigation':
        return this.generateNavigationCode(event);
      case 'click':
      case 'dblclick':
        return this.generateClickCode(event);
      case 'input':
      case 'change':
        return this.generateInputCode(event);
      case 'keydown':
      case 'keyup':
      case 'keypress':
        return this.generateKeyboardCode(event);
      case 'submit':
        return this.generateSubmitCode(event);
      case 'scroll':
        return this.generateScrollCode(event);
      case 'wait':
        return this.generateWaitEventCode(event);
      case 'assertion':
        return this.generateAssertionCode(event);
      case 'focus':
        return this.generateFocusCode(event);
      case 'blur':
        return this.generateBlurCode(event);
      case 'select':
        return this.generateSelectCode(event);
      case 'contextmenu':
        return this.generateContextMenuCode(event);
      case 'wheel':
        return this.generateWheelCode(event);
      default:
        return this.generateCustomEventCode(event);
    }
  }

  /**
   * Navigation event code generation
   */
  private generateNavigationCode(event: RecordedEvent): string {
    const navData = event.data as NavigationEventData;
    const url = this.escapeString(navData.url);
    
    let code = `await page.goto('${url}');`;
    
    // Add wait for page load if configured
    if (this.options.includeSetup) {
      code += '\nawait page.waitForLoadState(\'networkidle\');';
    }
    
    return code;
  }

  /**
   * Click event code generation
   */
  private generateClickCode(event: RecordedEvent): string {
    const selector = this.formatSelector(event.target.selector);
    const mouseData = event.data as MouseEventData;
    
    let code = `await page.click('${selector}'`;
    
    // Add options for special clicks
    const options: string[] = [];
    
    if (event.type === 'dblclick') {
      options.push('clickCount: 2');
    }
    
    // Add modifiers if present
    const modifiers = this.getModifiers(mouseData);
    if (modifiers.length > 0) {
      options.push(`modifiers: [${modifiers.map(m => `'${m}'`).join(', ')}]`);
    }
    
    // Add button if not left click
    if (mouseData.button !== 0) {
      const buttonName = mouseData.button === 1 ? 'middle' : 'right';
      options.push(`button: '${buttonName}'`);
    }
    
    if (options.length > 0) {
      code += `, { ${options.join(', ')} }`;
    }
    
    code += ');';
    
    // Add comment if configured
    if (this.options.includeComments) {
      code = `// ${this.generateComment(event)}\n${code}`;
    }
    
    return code;
  }

  /**
   * Input event code generation
   */
  private generateInputCode(event: RecordedEvent): string {
    const selector = this.formatSelector(event.target.selector);
    const formData = event.data as FormEventData;
    const value = this.escapeString(formData.value || '');
    
    let code = '';
    
    // Handle different input types
    switch (event.target.type) {
      case 'checkbox':
      case 'radio':
        if (formData.value === 'true' || formData.value === 'checked') {
          code = `await page.check('${selector}');`;
        } else {
          code = `await page.uncheck('${selector}');`;
        }
        break;
      case 'file':
        if (formData.files && formData.files.length > 0) {
          const filePaths = formData.files.map(f => `'${f.name}'`).join(', ');
          code = `await page.setInputFiles('${selector}', [${filePaths}]);`;
        }
        break;
      case 'select-one':
      case 'select-multiple':
        if (formData.selectedOptions) {
          const options = formData.selectedOptions.map(opt => `'${this.escapeString(opt)}'`).join(', ');
          code = `await page.selectOption('${selector}', [${options}]);`;
        }
        break;
      default:
        // Clear and fill for text inputs
        code = `await page.fill('${selector}', '${value}');`;
    }
    
    // Add comment if configured
    if (this.options.includeComments) {
      code = `// ${this.generateComment(event)}\n${code}`;
    }
    
    return code;
  }

  /**
   * Keyboard event code generation
   */
  private generateKeyboardCode(event: RecordedEvent): string {
    const keyData = event.data as KeyboardEventData;
    const key = this.mapPuppeteerKey(keyData.key);
    
    // Handle modifiers
    const modifiers = this.getKeyboardModifiers(keyData);
    let code = '';
    
    if (modifiers.length > 0) {
      const modifierString = modifiers.join('+');
      code = `await page.keyboard.press('${modifierString}+${key}');`;
    } else {
      code = `await page.keyboard.press('${key}');`;
    }
    
    return code;
  }

  /**
   * Submit event code generation
   */
  private generateSubmitCode(event: RecordedEvent): string {
    const selector = this.formatSelector(event.target.selector);
    
    // If it's a form element, use form submission
    if (event.target.tagName.toLowerCase() === 'form') {
      return `await page.$eval('${selector}', form => form.submit());`;
    }
    
    // If it's a submit button, click it
    return `await page.click('${selector}');`;
  }

  /**
   * Scroll event code generation
   */
  private generateScrollCode(event: RecordedEvent): string {
    const scrollData = event.data as ScrollEventData;
    
    if (scrollData.element === 'window') {
      return `await page.evaluate(() => window.scrollTo(${scrollData.scrollX}, ${scrollData.scrollY}));`;
    } else {
      const selector = this.formatSelector(event.target.selector);
      return `await page.locator('${selector}').scrollIntoViewIfNeeded();`;
    }
  }

  /**
   * Wait event code generation
   */
  private generateWaitEventCode(event: RecordedEvent): string {
    const waitData = event.data as WaitEventData;
    
    switch (waitData.reason) {
      case 'element':
        if (waitData.condition) {
          return `await page.waitForSelector('${waitData.condition}');`;
        }
        break;
      case 'navigation':
        return `await page.waitForLoadState('networkidle');`;
      case 'network':
        return `await page.waitForResponse(response => response.status() === 200);`;
      case 'timeout':
      default:
        return `await page.waitForTimeout(${waitData.duration});`;
    }
    
    return `await page.waitForTimeout(${waitData.duration});`;
  }

  /**
   * Assertion event code generation
   */
  private generateAssertionCode(event: RecordedEvent): string {
    const assertData = event.data as AssertionEventData;
    const selector = event.target?.selector;
    
    switch (assertData.assertionType) {
      case 'text-equals':
        return `await expect(page.locator('${selector}')).toHaveText('${this.escapeString(assertData.expected)}');`;
      case 'text-contains':
        return `await expect(page.locator('${selector}')).toContainText('${this.escapeString(assertData.expected)}');`;
      case 'visible':
        return `await expect(page.locator('${selector}')).toBeVisible();`;
      case 'hidden':
        return `await expect(page.locator('${selector}')).toBeHidden();`;
      case 'enabled':
        return `await expect(page.locator('${selector}')).toBeEnabled();`;
      case 'disabled':
        return `await expect(page.locator('${selector}')).toBeDisabled();`;
      case 'checked':
        return `await expect(page.locator('${selector}')).toBeChecked();`;
      case 'value-equals':
        return `await expect(page.locator('${selector}')).toHaveValue('${this.escapeString(assertData.expected)}');`;
      case 'url-equals':
        return `expect(page.url()).toBe('${this.escapeString(assertData.expected)}');`;
      case 'title-equals':
        return `expect(await page.title()).toBe('${this.escapeString(assertData.expected)}');`;
      default:
        return `// Custom assertion: ${assertData.message}`;
    }
  }

  /**
   * Focus event code generation
   */
  private generateFocusCode(event: RecordedEvent): string {
    const selector = this.formatSelector(event.target.selector);
    return `await page.focus('${selector}');`;
  }

  /**
   * Blur event code generation
   */
  private generateBlurCode(event: RecordedEvent): string {
    const selector = this.formatSelector(event.target.selector);
    return `await page.locator('${selector}').blur();`;
  }

  /**
   * Select event code generation
   */
  generateSelectCode(event: RecordedEvent): string {
    const selector = this.formatSelector(event.target.selector);
    return `await page.locator('${selector}').selectText();`;
  }

  /**
   * Context menu event code generation
   */
  private generateContextMenuCode(event: RecordedEvent): string {
    const selector = this.formatSelector(event.target.selector);
    return `await page.click('${selector}', { button: 'right' });`;
  }

  /**
   * Wheel event code generation
   */
  private generateWheelCode(event: RecordedEvent): string {
    const mouseData = event.data as MouseEventData;
    return `await page.mouse.wheel(${mouseData.clientX}, ${mouseData.clientY});`;
  }

  /**
   * Custom event code generation
   */
  private generateCustomEventCode(event: RecordedEvent): string {
    return `// Custom event: ${event.type}`;
  }

  /**
   * Generate assertions for events
   */
  generateAssertions(events: RecordedEvent[]): string[] {
    const assertions: string[] = [];
    
    events.forEach(event => {
      switch (event.type) {
        case 'navigation':
          const navData = event.data as NavigationEventData;
          assertions.push(`expect(page.url()).toBe('${navData.url}');`);
          break;
        case 'input':
        case 'change':
          if (event.target.type !== 'password') { // Don't assert password values
            const formData = event.data as FormEventData;
            if (formData.value) {
              assertions.push(`await expect(page.locator('${event.target.selector}')).toHaveValue('${this.escapeString(formData.value)}');`);
            }
          }
          break;
      }
    });
    
    return assertions;
  }

  /**
   * Generate group-level assertions
   */
  private generateGroupAssertions(group: EventGroup): string[] {
    if (!this.options.includeAssertions) return [];
    
    const assertions: string[] = [];
    
    // Add assertions based on group type
    switch (group.actionType) {
      case 'navigation':
        const navEvent = group.events.find(e => e.type === 'navigation');
        if (navEvent) {
          const navData = navEvent.data as NavigationEventData;
          assertions.push(`expect(page.url()).toBe('${navData.url}');`);
        }
        break;
        
      case 'form_interaction':
        // Add form field assertions
        group.events
          .filter(e => e.type === 'input' || e.type === 'change')
          .forEach(event => {
            if (event.target.type !== 'password') {
              const formData = event.data as FormEventData;
              if (formData.value) {
                assertions.push(`await expect(page.locator('${event.target.selector}')).toHaveValue('${this.escapeString(formData.value)}');`);
              }
            }
          });
        break;
    }
    
    return assertions;
  }

  /**
   * Generate setup code
   */
  generateSetupCode(): string {
    if (!this.options.includeSetup) return '';
    
    const lines: string[] = [
      'let browser;',
      'let page;',
      '',
      'beforeAll(async () => {',
      '  browser = await puppeteer.launch({',
      `    headless: ${this.options.headless ? 'true' : 'false'},`,
      `    defaultViewport: { width: ${this.options.viewport?.width || 1280}, height: ${this.options.viewport?.height || 720} },`,
      '  });',
      '});',
      '',
      'beforeEach(async () => {',
      '  page = await browser.newPage();'
    ];
    
    // Set timeout
    if (this.options.timeout) {
      lines.push(`  page.setDefaultTimeout(${this.options.timeout});`);
    }
    
    lines.push('});');
    
    return lines.join('\n');
  }

  /**
   * Generate teardown code
   */
  generateTeardownCode(): string {
    if (!this.options.includeSetup) return '';
    
    return `afterEach(async () => {
  if (page) {
    await page.close();
  }
});

afterAll(async () => {
  if (browser) {
    await browser.close();
  }
});`;
  }

  /**
   * Generate imports
   */
  generateImports(): string[] {
    const imports: string[] = [];
    
    if (this.options.language === 'typescript') {
      imports.push("import puppeteer from 'puppeteer';");
      imports.push("import { expect } from '@jest/globals';");
    } else {
      imports.push("const puppeteer = require('puppeteer');");
      imports.push("const { expect } = require('@jest/globals');");
    }
    
    return imports;
  }

  /**
   * Get required dependencies
   */
  getDependencies(): string[] {
    return [
      'puppeteer',
      'jest',
      ...(this.options.language === 'typescript' ? ['typescript', '@types/jest', '@types/puppeteer'] : [])
    ];
  }

  /**
   * Optimize selector for Puppeteer
   */
  optimizeSelector(selector: string, element?: any): SelectorOptimization {
    const original = selector;
    let optimized = selector;
    let strategy: SelectorOptimization['strategy'] = 'css';
    let reliability = this.assessSelectorReliability(selector);
    
    // Prefer data-testid attributes
    if (element?.getAttribute && element.getAttribute('data-testid')) {
      optimized = `[data-testid="${element.getAttribute('data-testid')}"]`;
      strategy = 'attribute';
      reliability = 0.9;
    }
    // Prefer ID selectors
    else if (element?.getAttribute && element.getAttribute('id')) {
      optimized = `#${element.getAttribute('id')}`;
      strategy = 'id';
      reliability = 0.85;
    }
    // Use text content for links and buttons
    else if ((element?.tagName === 'A' || element?.tagName === 'BUTTON') && element.textContent?.trim()) {
      optimized = `text="${element.textContent.trim()}"`;
      strategy = 'text';
      reliability = 0.7;
    }
    
    return {
      original,
      optimized: this.formatSelector(optimized),
      strategy,
      reliability
    };
  }

  /**
   * Generate Puppeteer configuration file
   */
  private generateConfigFile(): GeneratedTestFile {
    const config = {
      preset: 'jest-puppeteer',
      testEnvironment: 'jsdom',
      setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
      testMatch: ['**/__tests__/**/*.(js|ts)', '**/*.(test|spec).(js|ts)'],
      collectCoverage: true,
      coverageDirectory: 'coverage',
      coverageReporters: ['text', 'lcov', 'html'],
    };

    const setupFileContent = `const { toHaveText, toHaveValue, toBeVisible } = require('jest-extended');

expect.extend({
  toHaveText,
  toHaveValue,
  toBeVisible
});

// Global test timeout
jest.setTimeout(30000);`;

    return {
      filename: 'jest.config.js',
      content: `module.exports = ${JSON.stringify(config, null, 2)};

// jest.setup.js
${setupFileContent}`,
      type: 'config'
    };
  }

  /**
   * Generate support files
   */
  private async generateSupportFiles(groups: EventGroup[]): Promise<GeneratedTestFile[]> {
    const files: GeneratedTestFile[] = [];
    
    // Generate page objects if configured
    if (this.options.pageObjectModel) {
      const pageObjects = await this.generatePageObjectFiles(groups);
      files.push(...pageObjects);
    }
    
    // Generate helper utilities
    const utilsFile = this.generateUtilsFile();
    files.push(utilsFile);
    
    return files;
  }

  /**
   * Generate utilities file
   */
  private generateUtilsFile(): GeneratedTestFile {
    const content = `/**
 * Puppeteer Test Utilities
 */

class PuppeteerUtils {
  static async smartFill(page, selector, value) {
    const element = await page.$(selector);
    if (!element) throw new Error(\`Element not found: \${selector}\`);
    
    const tagName = await element.evaluate(el => el.tagName.toLowerCase());
    const type = await element.evaluate(el => el.type);
    
    if (type === 'checkbox' || type === 'radio') {
      const isChecked = await element.evaluate(el => el.checked);
      if ((value && !isChecked) || (!value && isChecked)) {
        await element.click();
      }
    } else if (tagName === 'select') {
      await page.selectOption(selector, value);
    } else {
      await page.fill(selector, value);
    }
  }
  
  static async waitForStableNetwork(page, timeout = 5000) {
    let requestCount = 0;
    const startTime = Date.now();
    
    const onRequest = () => requestCount++;
    const onResponse = () => requestCount--;
    
    page.on('request', onRequest);
    page.on('response', onResponse);
    
    while (Date.now() - startTime < timeout) {
      if (requestCount === 0) {
        await page.waitForTimeout(500);
        if (requestCount === 0) break;
      }
      await page.waitForTimeout(100);
    }
    
    page.off('request', onRequest);
    page.off('response', onResponse);
  }
  
  static async captureNetworkRequests(page) {
    const requests = [];
    
    page.on('request', request => {
      requests.push({
        url: request.url(),
        method: request.method(),
        headers: request.headers(),
        postData: request.postData()
      });
    });
    
    return requests;
  }
}

module.exports = { PuppeteerUtils };`;

    return {
      filename: 'utils/puppeteer-utils.js',
      content,
      type: 'helper'
    };
  }

  /**
   * Generate page object files for Puppeteer
   */
  private async generatePageObjectFiles(groups: EventGroup[]): Promise<GeneratedTestFile[]> {
    const pageObjects: GeneratedTestFile[] = [];
    const pageUrls = this.extractPageUrls(groups);
    
    for (const url of pageUrls) {
      const pageName = this.generatePageName(url);
      const pageEvents = this.getEventsForPage(groups, url);
      const pageObjectCode = this.generatePuppeteerPageObject(pageName, pageEvents);
      
      pageObjects.push({
        filename: `pages/${pageName}.page.${this.options.language === 'typescript' ? 'ts' : 'js'}`,
        content: pageObjectCode,
        type: 'page-object'
      });
    }
    
    return pageObjects;
  }

  /**
   * Generate Puppeteer page object class
   */
  private generatePuppeteerPageObject(pageName: string, events: RecordedEvent[]): string {
    const selectors = this.extractUniqueSelectors(events);
    const methods = this.generatePuppeteerPageObjectMethods(events);
    
    const imports = this.options.language === 'typescript' 
      ? "import { Page } from 'puppeteer';"
      : "const { Page } = require('puppeteer');";
    
    const classDefinition = this.options.language === 'typescript'
      ? `export class ${pageName} {
  private page: Page;
  
  // Selectors
${selectors.map(selector => 
  `  private ${this.generateVariableName({ target: { selector } } as any)} = '${selector}';`
).join('\n')}

  constructor(page: Page) {
    this.page = page;
  }

${methods.join('\n\n')}
}`
      : `class ${pageName} {
  constructor(page) {
    this.page = page;
    
    // Selectors
${selectors.map(selector => 
  `    this.${this.generateVariableName({ target: { selector } } as any)} = '${selector}';`
).join('\n')}
  }

${methods.join('\n\n')}
}

module.exports = { ${pageName} };`;

    return [imports, '', classDefinition].join('\n');
  }

  /**
   * Generate page object methods for Puppeteer
   */
  private generatePuppeteerPageObjectMethods(events: RecordedEvent[]): string[] {
    const methods: string[] = [];
    const actionGroups = this.groupRelatedEvents(events);
    
    actionGroups.forEach((group) => {
      const methodName = this.generateMethodName(group);
      const methodCode = this.generatePuppeteerPageObjectMethod(methodName, group);
      methods.push(methodCode);
    });
    
    return methods;
  }

  /**
   * Generate Puppeteer page object method
   */
  private generatePuppeteerPageObjectMethod(methodName: string, events: RecordedEvent[]): string {
    const methodBody = events.map(event => {
      const code = this.generateEventCode(event);
      return code.replace(/page\./g, 'this.page.').replace(/await page\./g, 'await this.page.');
    }).join('\n    ');
    
    const signature = this.options.language === 'typescript'
      ? `async ${methodName}(): Promise<void>`
      : `async ${methodName}()`;
    
    return `  ${signature} {
    ${methodBody}
    return this;
  }`;
  }

  /**
   * Extract page URLs from event groups
   */
  private extractPageUrls(groups: EventGroup[]): string[] {
    const urls = new Set<string>();
    
    groups.forEach(group => {
      group.events.forEach(event => {
        if (event.type === 'navigation') {
          const navData = event.data as NavigationEventData;
          urls.add(navData.url);
        } else if (event.context?.url) {
          urls.add(event.context.url);
        }
      });
    });
    
    return Array.from(urls);
  }

  /**
   * Get events for a specific page
   */
  private getEventsForPage(groups: EventGroup[], url: string): RecordedEvent[] {
    const events: RecordedEvent[] = [];
    
    groups.forEach(group => {
      group.events.forEach(event => {
        if (event.context?.url === url || 
            (event.type === 'navigation' && (event.data as NavigationEventData).url === url)) {
          events.push(event);
        }
      });
    });
    
    return events;
  }

  /**
   * Generate test name from groups
   */
  private generateTestName(groups: EventGroup[]): string {
    if (groups.length === 0) return 'Generated test';
    
    const navGroup = groups.find(g => g.actionType === 'navigation');
    if (navGroup) {
      const navEvent = navGroup.events.find(e => e.type === 'navigation');
      if (navEvent) {
        const navData = navEvent.data as NavigationEventData;
        return `Test ${new URL(navData.url).hostname} workflow`;
      }
    }
    
    return `Test ${groups[0].name} workflow`;
  }

  /**
   * Generate method name for event group
   */
  private generateMethodName(events: RecordedEvent[]): string {
    if (events.length === 1) {
      const event = events[0];
      return `${event.type}${this.capitalize(this.generateVariableName(event))}`;
    }
    
    // Generate name based on dominant action type
    const actionTypes = events.map(e => e.type);
    const mostCommon = actionTypes.reduce((a, b, i, arr) =>
      arr.filter(v => v === a).length >= arr.filter(v => v === b).length ? a : b
    );
    
    return `perform${this.capitalize(mostCommon)}Actions`;
  }

  /**
   * Generate page name from URL
   */
  private generatePageName(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace(/[^a-zA-Z0-9]/g, '') + 'Page';
    } catch {
      return 'BasePage';
    }
  }

  /**
   * Get mouse event modifiers
   */
  private getModifiers(mouseData: MouseEventData): string[] {
    const modifiers: string[] = [];
    
    if (mouseData.ctrlKey) modifiers.push('Control');
    if (mouseData.shiftKey) modifiers.push('Shift');
    if (mouseData.altKey) modifiers.push('Alt');
    if (mouseData.metaKey) modifiers.push('Meta');
    
    return modifiers;
  }

  /**
   * Get keyboard event modifiers for Puppeteer
   */
  private getKeyboardModifiers(keyData: KeyboardEventData): string[] {
    const modifiers: string[] = [];
    
    if (keyData.ctrlKey) modifiers.push('Control');
    if (keyData.shiftKey) modifiers.push('Shift');
    if (keyData.altKey) modifiers.push('Alt');
    if (keyData.metaKey) modifiers.push('Meta');
    
    return modifiers;
  }

  /**
   * Map keyboard keys to Puppeteer format
   */
  private mapPuppeteerKey(key: string): string {
    const keyMap: Record<string, string> = {
      ' ': 'Space',
      'ArrowLeft': 'ArrowLeft',
      'ArrowUp': 'ArrowUp',
      'ArrowRight': 'ArrowRight',
      'ArrowDown': 'ArrowDown',
      'End': 'End',
      'Home': 'Home',
      'Insert': 'Insert',
      'Delete': 'Delete',
      'PageDown': 'PageDown',
      'PageUp': 'PageUp',
    };
    
    return keyMap[key] || key;
  }

  /**
   * Override wait code generation for Puppeteer
   */
  protected generateWaitCode(duration: number): string {
    return `await page.waitForTimeout(${duration});`;
  }

  /**
   * Generate wait condition for Puppeteer
   */
  generateWaitCondition(event: RecordedEvent): string {
    const selector = event.target?.selector;
    
    switch (event.type) {
      case 'click':
        return `await page.waitForSelector('${selector}', { visible: true });`;
      case 'input':
        return `await page.waitForSelector('${selector}');`;
      case 'navigation':
        return `await page.waitForLoadState('networkidle');`;
      default:
        return `await page.waitForSelector('${selector}');`;
    }
  }
}

export default PuppeteerGenerator;