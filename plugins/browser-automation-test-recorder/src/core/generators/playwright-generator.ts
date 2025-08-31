/**
 * Playwright Test Generator
 * Generates Playwright test code from recorded browser events
 */

import { BaseGenerator, type BaseGeneratorOptions, type GeneratedTestFile, type SelectorOptimization } from './base-generator';
import type {
  RecordedEvent,
  MouseEventData as _MouseEventData,
  KeyboardEventData as _KeyboardEventData,
  FormEventData,
  NavigationEventData,
  ScrollEventData as _ScrollEventData,
  WaitEventData,
  AssertionEventData,
  RecordedEventTarget as _RecordedEventTarget,
} from '../../types';
import type { EventGroup, CodeGenerationConfig } from '../code-generator';

export class PlaywrightGenerator extends BaseGenerator {
  public readonly name = 'playwright';
  public readonly version = '1.40.0';
  public readonly description = 'Generate Playwright test code from recorded browser events';
  
  constructor(config?: CodeGenerationConfig, options?: BaseGeneratorOptions) {
    const defaultConfig: CodeGenerationConfig = {
      language: 'typescript',
      framework: 'playwright',
      includeImports: true,
      includeSetup: true,
      includeTeardown: true,
      includeComments: true,
      includeAssertions: true,
      optimizeSelectors: true,
      groupRelatedEvents: true,
      generatePageObjects: false,
      testName: 'Generated Test',
      timeout: 30000,
      baseUrl: '',
    };
    
    const defaultOptions: BaseGeneratorOptions = {
      language: 'typescript',
      includeComments: true,
      includeAssertions: true,
      includeSetup: true,
      pageObjectModel: false,
      timeout: 30000,
      viewport: { width: 1280, height: 720 },
      headless: true,
    };
    
    super(config || defaultConfig, options || defaultOptions);
  }
  
  /**
   * Get current configuration
   */
  public getConfiguration() {
    return {
      language: this.options.language,
      testFramework: '@playwright/test',
      ...this.config,
      ...this.options,
    };
  }

  /**
   * Generate test code from recorded events
   */
  async generateTestCode(events: RecordedEvent[], options?: any): Promise<{ code: string; metadata?: any }> {
    const code: string[] = [];
    const safeEvents = events || [];
    
    // Add imports if requested
    if (options?.includeImports !== false) {
      code.push(...this.generateImports());
      code.push('');
    }
    
    // Add test wrapper
    const testName = options?.testName || 'Generated Test';
    code.push(`test('${testName}', async ({ page }) => {`);
    
    // Add setup if requested
    if (options?.includeSetup) {
      code.push(this.generateSetupCode());
    }
    
    // Generate code for each event
    for (const event of safeEvents) {
      const eventCode = this.generateEventCode(event);
      if (options?.includeComments) {
        code.push(`  // ${event.type} event`);
      }
      code.push(`  ${eventCode}`);
    }
    
    // Add assertions if requested
    if (options?.includeAssertions && safeEvents.length > 0) {
      const assertions = this.generateAssertions(safeEvents);
      code.push(...assertions.map(a => `  ${a}`));
    }
    
    // Close test
    code.push('});');
    
    return {
      code: code.join('\n'),
      metadata: {
        eventCount: safeEvents.length,
        framework: 'playwright',
        language: this.options.language,
      }
    };
  }
  
  /**
   * Generate selector command for a single event
   */
  public generateSelectorCommand(event: RecordedEvent): string {
    switch (event.type) {
      case 'click':
        return `await page.click('${event.target.selector}')`;
      case 'input':
        const inputData = event.data as FormEventData;
        return `await page.fill('${event.target.selector}', '${inputData?.value || ''}')`;
      case 'navigation':
        const navData = event.data as NavigationEventData;
        return `await page.goto('${navData?.url || ''}')`;
      case 'keydown':
      case 'keyup':
      case 'keypress':
        const keyData = event.data as _KeyboardEventData;
        return `await page.press('${event.target.selector}', '${keyData?.key || ''}')`;
      case 'scroll':
        return `await page.evaluate(() => window.scrollTo(0, ${(event.data as any)?.scrollY || 0}))`;
      default:
        return `// Unhandled event type: ${event.type}`;
    }
  }
  
  /**
   * Generate assertion for a single event
   */
  public generateAssertion(event: RecordedEvent): string {
    const assertionData = event.data as AssertionEventData;
    const selector = event.target.selector;
    
    switch (assertionData?.type) {
      case 'visible':
        return `await expect(page.locator('${selector}')).toBeVisible()`;
      case 'text':
        return `await expect(page.locator('${selector}')).toContainText('${assertionData.expected}')`;
      case 'value':
        return `await expect(page.locator('${selector}')).toHaveValue('${assertionData.expected}')`;
      case 'count':
        return `await expect(page.locator('${selector}')).toHaveCount(${assertionData.expected})`;
      case 'url':
        return `await expect(page).toHaveURL('${assertionData.expected}')`;
      default:
        return `await expect(page.locator('${selector}')).toBeVisible()`;
    }
  }
  
  /**
   * Generate wait command
   */
  public generateWaitCommand(event: RecordedEvent): string {
    const waitData = event.data as WaitEventData;
    
    if (waitData?.type === 'selector') {
      return `await page.waitForSelector('${waitData.selector}')`;
    } else if (waitData?.type === 'navigation') {
      return `await page.waitForNavigation()`;
    } else if (waitData?.type === 'timeout') {
      return `await page.waitForTimeout(${waitData.duration || 1000})`;
    }
    
    return `await page.waitForTimeout(1000)`;
  }
  
  /**
   * Optimize commands by combining or simplifying
   */
  public optimizeCommands(commands: string[]): string[] {
    // Simple optimization: combine consecutive waits
    const optimized: string[] = [];
    let i = 0;
    
    while (i < commands.length) {
      if (commands[i].includes('waitForTimeout') && 
          i + 1 < commands.length && 
          commands[i + 1].includes('waitForTimeout')) {
        // Combine waits
        const wait1 = parseInt(commands[i].match(/\d+/)?.[0] || '0');
        const wait2 = parseInt(commands[i + 1].match(/\d+/)?.[0] || '0');
        optimized.push(`await page.waitForTimeout(${wait1 + wait2})`);
        i += 2;
      } else {
        optimized.push(commands[i]);
        i++;
      }
    }
    
    return optimized;
  }
  
  /**
   * Generate configuration file
   */
  public generateConfiguration(options?: any): string {
    const lang = options?.language || this.options.language;
    
    if (lang === 'javascript') {
      return `// playwright.config.js
module.exports = {
  use: {
    headless: ${this.options.headless},
    viewport: { width: ${this.options.viewport.width}, height: ${this.options.viewport.height} },
    actionTimeout: ${this.options.timeout},
  },
  testDir: './tests',
  timeout: ${this.options.timeout},
};`;
    } else {
      return `// playwright.config.ts
import { PlaywrightTestConfig } from '@playwright/test';

const config: PlaywrightTestConfig = {
  use: {
    headless: ${this.options.headless},
    viewport: { width: ${this.options.viewport.width}, height: ${this.options.viewport.height} },
    actionTimeout: ${this.options.timeout},
  },
  testDir: './tests',
  timeout: ${this.options.timeout},
};

export default config;`;
    }
  }
  
  /**
   * Generate package.json with dependencies
   */
  public generatePackageJson(options?: any): string {
    const isTypeScript = (options?.language || this.options.language) === 'typescript';
    
    const packageJson = {
      name: 'playwright-tests',
      version: '1.0.0',
      scripts: {
        test: 'playwright test',
        'test:headed': 'playwright test --headed',
      },
      devDependencies: {
        '@playwright/test': '^1.40.0',
        ...(isTypeScript && {
          typescript: '^5.0.0',
          '@types/node': '^20.0.0',
        }),
      },
    };
    
    return JSON.stringify(packageJson, null, 2);
  }
  
  /**
   * Generate complete Playwright test files
   */
  async generateTestFiles(groups: EventGroup[]): Promise<GeneratedTestFile[]> {
    const files: GeneratedTestFile[] = [];
    
    // Generate main test file
    const mainTest = await this.generateMainTestFile(groups);
    files.push(mainTest);
    
    // Generate page object files if configured
    if (this.options.pageObjectModel) {
      const pageObjects = await this.generatePageObjectFiles(groups);
      files.push(...pageObjects);
    }
    
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
    const testCode = await this.generateTestCodeFromGroups(groups);
    
    return `test('${testName}', async ({ page }) => {
${this.indent(testCode)}
});`;
  }

  /**
   * Generate test code from event groups
   */
  private async generateTestCodeFromGroups(groups: EventGroup[]): Promise<string> {
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
      case 'dragstart':
      case 'drop':
        return this.generateDragDropCode(event);
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
    
    // Add wait for load state if configured
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
    const mouseData = event.data as MouseEventData as _MouseEventData;
    
    let code = `await page.locator('${selector}')`;
    
    // Add modifiers if present
    const modifiers = this.getModifiers(mouseData);
    if (modifiers.length > 0) {
      code += `.click({ modifiers: [${modifiers.map(m => `'${m}'`).join(', ')}] })`;
    } else if (event.type === 'dblclick') {
      code += `.dblclick()`;
    } else {
      code += `.click()`;
    }
    
    code += ';';
    
    // Add comment if configured
    if (this.options.includeComments) {
      code = `${this.generateComment(event)}\n${code}`;
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
          code = `await page.locator('${selector}').check();`;
        } else {
          code = `await page.locator('${selector}').uncheck();`;
        }
        break;
      case 'file':
        if (formData.files && formData.files.length > 0) {
          const filePaths = formData.files.map(f => `'${f.name}'`).join(', ');
          code = `await page.locator('${selector}').setInputFiles([${filePaths}]);`;
        }
        break;
      case 'select-one':
      case 'select-multiple':
        if (formData.selectedOptions) {
          const options = formData.selectedOptions.map(opt => `'${this.escapeString(opt)}'`).join(', ');
          code = `await page.locator('${selector}').selectOption([${options}]);`;
        }
        break;
      default:
        // Clear field first for better reliability
        code = `await page.locator('${selector}').clear();\n`;
        code += `await page.locator('${selector}').fill('${value}');`;
    }
    
    // Add comment if configured
    if (this.options.includeComments) {
      code = `${this.generateComment(event)}\n${code}`;
    }
    
    return code;
  }

  /**
   * Keyboard event code generation
   */
  private generateKeyboardCode(event: RecordedEvent): string {
    const keyData = event.data as KeyboardEventData as _KeyboardEventData;
    const key = keyData.key;
    
    // Handle special keys
    let keyCommand = '';
    if (key === 'Enter') {
      keyCommand = 'Enter';
    } else if (key === 'Tab') {
      keyCommand = 'Tab';
    } else if (key === 'Escape') {
      keyCommand = 'Escape';
    } else if (key.startsWith('Arrow')) {
      keyCommand = key;
    } else if (key.length === 1) {
      // Single character
      keyCommand = key;
    } else {
      keyCommand = key;
    }
    
    const modifiers = this.getKeyboardModifiers(keyData);
    let code = '';
    
    if (modifiers.length > 0) {
      const modifierString = modifiers.join('+');
      code = `await page.keyboard.press('${modifierString}+${keyCommand}');`;
    } else {
      code = `await page.keyboard.press('${keyCommand}');`;
    }
    
    return code;
  }

  /**
   * Submit event code generation
   */
  private generateSubmitCode(event: RecordedEvent): string {
    const selector = this.formatSelector(event.target.selector);
    
    // If it's a form element, submit the form
    if (event.target.tagName.toLowerCase() === 'form') {
      return `await page.locator('${selector}').evaluate(form => form.submit());`;
    }
    
    // If it's a submit button, click it
    return `await page.locator('${selector}').click();`;
  }

  /**
   * Scroll event code generation
   */
  private generateScrollCode(event: RecordedEvent): string {
    const scrollData = event.data as ScrollEventData as _ScrollEventData;
    
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
          return `await page.locator('${waitData.condition}').waitFor();`;
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
   * Generate wait condition based on event
   */
  generateWaitCondition(event: RecordedEvent): string {
    const selector = event.target?.selector;
    
    switch (event.type) {
      case 'click':
        return `await page.locator('${selector}').waitFor({ state: 'visible' });`;
      case 'input':
        return `await page.locator('${selector}').waitFor({ state: 'attached' });`;
      case 'navigation':
        return `await page.waitForLoadState('domcontentloaded');`;
      default:
        return `await page.locator('${selector}').waitFor();`;
    }
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
        return `await expect(page).toHaveURL('${this.escapeString(assertData.expected)}');`;
      case 'title-equals':
        return `await expect(page).toHaveTitle('${this.escapeString(assertData.expected)}');`;
      default:
        return `// Custom assertion: ${assertData.message}`;
    }
  }

  /**
   * Focus event code generation
   */
  private generateFocusCode(event: RecordedEvent): string {
    const selector = this.formatSelector(event.target.selector);
    return `await page.locator('${selector}').focus();`;
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
  private generateSelectCode(event: RecordedEvent): string {
    const selector = this.formatSelector(event.target.selector);
    return `await page.locator('${selector}').selectText();`;
  }

  /**
   * Drag and drop event code generation
   */
  private generateDragDropCode(event: RecordedEvent): string {
    // This would need to be enhanced to track drag source and drop target
    const selector = this.formatSelector(event.target.selector);
    
    if (event.type === 'dragstart') {
      return `// Drag started from ${selector}`;
    } else if (event.type === 'drop') {
      return `// Dropped on ${selector}`;
    }
    
    return `// Drag and drop operation`;
  }

  /**
   * Context menu event code generation
   */
  private generateContextMenuCode(event: RecordedEvent): string {
    const selector = this.formatSelector(event.target.selector);
    return `await page.locator('${selector}').click({ button: 'right' });`;
  }

  /**
   * Wheel event code generation
   */
  private generateWheelCode(event: RecordedEvent): string {
    const mouseData = event.data as MouseEventData as _MouseEventData;
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
    
    // Generate assertions based on event types and context
    events.forEach(event => {
      switch (event.type) {
        case 'navigation': {
          const navData = event.data as NavigationEventData;
          assertions.push(`await expect(page).toHaveURL('${navData.url}');`);
          break;
        }
        case 'input':
        case 'change': {
          if (event.target.type !== 'password') { // Don't assert password values
            const formData = event.data as FormEventData;
            if (formData.value) {
              assertions.push(`await expect(page.locator('${event.target.selector}')).toHaveValue('${this.escapeString(formData.value)}');`);
            }
          }
          break;
        }
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
      case 'navigation': {
        const navEvent = group.events.find(e => e.type === 'navigation');
        if (navEvent) {
          const navData = navEvent.data as NavigationEventData;
          assertions.push(`await expect(page).toHaveURL('${navData.url}');`);
        }
        break;
      }
        
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
      'test.beforeEach(async ({ page }) => {',
    ];
    
    // Set viewport if specified
    if (this.options.viewport) {
      lines.push(`  await page.setViewportSize({ width: ${this.options.viewport.width}, height: ${this.options.viewport.height} });`);
    }
    
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
    
    return `test.afterEach(async ({ page }) => {
  // Cleanup code can be added here
});`;
  }

  /**
   * Generate imports
   */
  generateImports(): string[] {
    const imports: string[] = [];
    
    if (this.options.language === 'typescript') {
      imports.push("import { test, expect } from '@playwright/test';");
    } else {
      imports.push("const { test, expect } = require('@playwright/test');");
    }
    
    return imports;
  }

  /**
   * Get required dependencies
   */
  getDependencies(): string[] {
    return [
      '@playwright/test',
      ...(this.options.language === 'typescript' ? ['typescript', '@types/node'] : [])
    ];
  }

  /**
   * Optimize selector for Playwright
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
    // Prefer aria-label
    else if (element?.getAttribute && element.getAttribute('aria-label')) {
      optimized = `[aria-label="${element.getAttribute('aria-label')}"]`;
      strategy = 'attribute';
      reliability = 0.8;
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
   * Generate Playwright configuration file
   */
  private generateConfigFile(): GeneratedTestFile {
    const config = `import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
});`;

    return {
      filename: 'playwright.config.ts',
      content: config,
      type: 'config'
    };
  }

  /**
   * Generate page object files
   */
  private async generatePageObjectFiles(groups: EventGroup[]): Promise<GeneratedTestFile[]> {
    const pageObjects: GeneratedTestFile[] = [];
    const pageUrls = this.extractPageUrls(groups);
    
    for (const url of pageUrls) {
      const pageName = this.generatePageNameFromUrl(url);
      const pageEvents = this.getEventsForPage(groups, url);
      const pageObjectCode = this.generatePageObjectCode(pageName, pageEvents);
      
      pageObjects.push({
        filename: `pages/${pageName}.page.${this.options.language === 'typescript' ? 'ts' : 'js'}`,
        content: pageObjectCode,
        type: 'page-object'
      });
    }
    
    return pageObjects;
  }

  /**
   * Extract unique page URLs from event groups
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
   * Generate page object class code
   */
  private generatePageObjectCode(pageName: string, events: RecordedEvent[]): string {
    const selectors = this.extractUniqueSelectors(events);
    const methods = this.generatePageObjectMethods(events);
    
    const imports = this.options.language === 'typescript' 
      ? "import { Page, Locator } from '@playwright/test';"
      : "const { Page } = require('@playwright/test');";
    
    const classDefinition = this.options.language === 'typescript'
      ? `export class ${pageName} {
  readonly page: Page;
${selectors.map(selector => 
  `  readonly ${this.generateVariableName({ target: { selector } } as any)}: Locator;`
).join('\n')}

  constructor(page: Page) {
    this.page = page;
${selectors.map(selector => 
  `    this.${this.generateVariableName({ target: { selector } } as any)} = page.locator('${selector}');`
).join('\n')}
  }

${methods.join('\n\n')}
}`
      : `class ${pageName} {
  constructor(page) {
    this.page = page;
${selectors.map(selector => 
  `    this.${this.generateVariableName({ target: { selector } } as any)} = page.locator('${selector}');`
).join('\n')}
  }

${methods.join('\n\n')}
}

module.exports = { ${pageName} };`;

    return [imports, '', classDefinition].join('\n');
  }

  /**
   * Generate page object methods
   */
  private generatePageObjectMethods(events: RecordedEvent[]): string[] {
    const methods: string[] = [];
    const actionGroups = this.groupRelatedEvents(events);
    
    actionGroups.forEach((group, _index) => {
      const methodName = this.generateMethodName(group);
      const methodCode = this.generatePageObjectMethod(methodName, group);
      methods.push(methodCode);
    });
    
    return methods;
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
   * Generate page object method code
   */
  private generatePageObjectMethod(methodName: string, events: RecordedEvent[]): string {
    const methodBody = events.map(event => {
      const code = this.generateEventCode(event);
      return code.replace(/page\./g, 'this.page.').replace(/await page\./g, 'await this.page.');
    }).join('\n  ');
    
    const signature = this.options.language === 'typescript'
      ? `async ${methodName}(): Promise<void>`
      : `async ${methodName}()`;
    
    return `  ${signature} {
    ${methodBody}
  }`;
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
   * Generate page name from URL
   */
  private generatePageNameFromUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname.replace(/[^a-zA-Z0-9]/g, '');
      return `${hostname}Page`;
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
   * Get keyboard event modifiers
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
   * Override wait code generation for Playwright
   */
  protected generateWaitCode(duration: number): string {
    return `await page.waitForTimeout(${duration});`;
  }
}

export default PlaywrightGenerator;