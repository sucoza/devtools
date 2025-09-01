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
  
  /**
   * Format selector for use in generated code
   */
  protected formatSelector(selector: string): string {
    // Escape quotes in selector
    return selector.replace(/'/g, "\\'");
  }
  
  /**
   * Escape string for use in generated code
   */
  protected escapeString(str: string): string {
    // Escape quotes and special characters
    return str.replace(/'/g, "\\'").replace(/\n/g, '\\n').replace(/\r/g, '\\r');
  }
  
  constructor(config?: CodeGenerationConfig, options?: BaseGeneratorOptions) {
    const defaultConfig: CodeGenerationConfig = {
      language: 'typescript' as const,
      framework: 'playwright' as const,
      format: 'playwright' as const,
      includeSetup: true,
      includeComments: true,
      includeAssertions: true,
      optimizeSelectors: true,
      groupActions: true,
      pageObjectModel: false,
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
   * Override generateComment for Playwright-specific comments
   */
  protected generateComment(event: RecordedEvent): string {
    const target = event.target;
    
    switch (event.type) {
      case 'click':
        if (target?.id === 'username') return '// Click username field';
        if (target?.id === 'password') return '// Click password field';
        if (target?.id === 'login-button') return '// Click login button';
        return `// Click on ${this.getElementDescription(target)}`;
      case 'input':
      case 'change': {
        if (target?.id === 'username') return '// Fill username';
        if (target?.id === 'password') return '// Fill password';
        const formData = event.data as FormEventData;
        const keyboardData = event.data as _KeyboardEventData;
        const value = keyboardData?.inputValue || formData?.value || target?.value || '';
        return `// Enter "${value}" in ${this.getElementDescription(target)}`;
      }
      case 'navigation': {
        const navData = event.data as NavigationEventData;
        if (navData?.url?.includes('login')) return '// Navigate to login page';
        return `// Navigate to ${navData?.url || 'page'}`;
      }
      case 'wait': {
        const waitData = event.data as WaitEventData;
        return `// Wait ${waitData?.duration || 0}ms for ${waitData?.reason || 'condition'}`;
      }
      case 'assertion': {
        const assertData = event.data as AssertionEventData;
        return `// Verify ${assertData?.message || 'assertion'}`;
      }
      default:
        return `// Perform ${event.type} on ${this.getElementDescription(target)}`;
    }
  }

  /**
   * Get human-readable element description
   */
  protected getElementDescription(target: any): string {
    if (!target) return 'element';
    
    if (target.textContent && target.textContent.length < 30) {
      return `"${target.textContent.trim()}"`;
    }
    if (target.id) {
      return `element with id "${target.id}"`;
    }
    if (target.name) {
      return `${target.tagName?.toLowerCase() || 'element'} named "${target.name}"`;
    }
    return `${target.tagName?.toLowerCase() || 'element'} element`;
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
    const warnings: string[] = [];
    
    // Handle language option from format field
    if (options?.format) {
      this.options.language = options.format;
    }
    
    // Add imports if requested
    if (options?.includeImports !== false) {
      code.push(...this.generateImports());
      code.push('');
    }
    
    // Add setup/teardown if requested
    if (options?.includeSetup) {
      code.push('test.beforeEach(async ({ page }) => {');
      code.push(`  await page.setViewportSize({ width: ${this.options.viewport.width}, height: ${this.options.viewport.height} });`);
      code.push(`  await page.setDefaultTimeout(${this.options.timeout});`);
      code.push('});');
      code.push('');
      code.push('test.afterEach(async ({ page }) => {');
      code.push('  // Cleanup after each test');
      code.push('  await page.close();');
      code.push('});');
      code.push('');
    }
    
    // Add test wrapper
    const testName = options?.testName || 'Generated Test';
    code.push(`test('${testName}', async ({ page }) => {`);
    
    // Handle empty events
    if (safeEvents.length === 0) {
      code.push('  // No events recorded');
    } else {
      // Generate code for each event
      for (const event of safeEvents) {
        try {
          // Check for invalid events
          if (!event.data && ['click', 'input', 'keydown'].includes(event.type)) {
            warnings.push('Skipped event with missing data');
            continue;
          }
          
          // Check for invalid selectors
          if (!event.target?.selector || event.target.selector.trim() === '') {
            warnings.push('Skipped event with invalid selector');
            continue;
          }
          
          const eventCode = this.generateEventCode(event);
          if (options?.includeComments) {
            const comment = this.generateComment(event);
            code.push(`  ${comment}`);
          }
          code.push(`  ${eventCode}`);
        } catch (error) {
          warnings.push(`Error processing event: ${error}`);
        }
      }
      
      // Add assertions if requested
      if (options?.includeAssertions) {
        const assertions = this.generateAssertions(safeEvents);
        code.push(...assertions.map(a => `  ${a}`));
      }
    }
    
    // Close test
    code.push('});');
    
    return {
      code: code.join('\n'),
      metadata: {
        eventCount: safeEvents.length,
        framework: 'playwright',
        language: this.options.language,
        selectors: safeEvents.length, // Count of selectors used (one per event)
        assertions: 0, // Would need to count actual assertions generated
        url: '', // Would be populated from navigation events if present
        ...(warnings.length > 0 && { warnings }),
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
        const kbData = event.data as _KeyboardEventData;
        const value = kbData?.inputValue || inputData?.value || event.target.value || '';
        return `await page.fill('${event.target.selector}', '${value}')`;
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
   * Generate assertion for a single event or assertion config
   */
  public generateAssertion(eventOrAssertion: RecordedEvent | any): string {
    // Handle direct assertion configuration (from tests)
    if (eventOrAssertion.type && !eventOrAssertion.target) {
      const { type, selector, expected } = eventOrAssertion;
      
      switch (type) {
        case 'element-visible':
          return `await expect(page.locator('${selector}')).toBeVisible();`;
        case 'element-text':
          return `await expect(page.locator('${selector}')).toHaveText('${expected}');`;
        case 'element-value':
          return `await expect(page.locator('${selector}')).toHaveValue('${expected}');`;
        case 'element-count':
          return `await expect(page.locator('${selector}')).toHaveCount(${expected});`;
        case 'page-url':
          return `await expect(page).toHaveURL('${expected}');`;
        default:
          return selector 
            ? `await expect(page.locator('${selector}')).toBeVisible();`
            : `await expect(page).toBeVisible();`;
      }
    }
    
    // Handle RecordedEvent format
    const event = eventOrAssertion as RecordedEvent;
    const assertionData = event.data as AssertionEventData;
    const selector = event.target?.selector;
    
    switch (assertionData?.assertionType) {
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
        return selector 
          ? `await expect(page.locator('${selector}')).toBeVisible()`
          : `await expect(page).toBeVisible()`;
    }
  }
  
  /**
   * Generate wait command
   */
  public generateWaitCommand(eventOrWaitConfig: RecordedEvent | any): string {
    // Handle direct wait configuration object (from tests)
    if (eventOrWaitConfig.type === 'element' && eventOrWaitConfig.selector) {
      const { selector, condition, timeout } = eventOrWaitConfig;
      const state = condition || 'visible';
      const options = timeout ? `, { state: '${state}', timeout: ${timeout} }` : `, { state: '${state}' }`;
      return `await page.waitForSelector('${selector}'${options});`;
    }
    
    if (eventOrWaitConfig.type === 'navigation' && !eventOrWaitConfig.data) {
      const timeout = eventOrWaitConfig.timeout;
      return timeout 
        ? `await page.waitForNavigation({ timeout: ${timeout} });`
        : `await page.waitForNavigation();`;
    }
    
    if (eventOrWaitConfig.type === 'timeout' && eventOrWaitConfig.duration !== undefined) {
      return `await page.waitForTimeout(${eventOrWaitConfig.duration});`;
    }
    
    // Handle RecordedEvent format
    const event = eventOrWaitConfig as RecordedEvent;
    const waitData = event.data as WaitEventData;
    
    if (waitData?.reason === 'element') {
      return `await page.waitForSelector('${waitData.condition}')`;
    } else if (waitData?.reason === 'navigation') {
      return `await page.waitForNavigation()`;
    } else if (waitData?.reason === 'timeout') {
      return `await page.waitForTimeout(${waitData.duration || 1000})`;
    }
    
    return `await page.waitForTimeout(1000)`;
  }
  
  /**
   * Optimize commands by combining or simplifying
   */
  public optimizeCommands(commands: string[]): string[] {
    // First pass: remove consecutive duplicates and simplify selectors
    const deduped: string[] = [];
    let i = 0;
    
    while (i < commands.length) {
      // Skip consecutive duplicate commands
      if (i > 0 && commands[i] === commands[i - 1]) {
        i++;
        continue;
      }
      
      // Combine consecutive waits
      if (commands[i].includes('waitForTimeout') && 
          i + 1 < commands.length && 
          commands[i + 1].includes('waitForTimeout')) {
        const wait1 = parseInt(commands[i].match(/\d+/)?.[0] || '0');
        const wait2 = parseInt(commands[i + 1].match(/\d+/)?.[0] || '0');
        deduped.push(`await page.waitForTimeout(${wait1 + wait2})`);
        i += 2;
      } else {
        // Simplify complex selectors
        let command = commands[i];
        command = this.simplifySelector(command);
        deduped.push(command);
        i++;
      }
    }
    
    return deduped;
  }
  
  /**
   * Simplify complex selectors by extracting the most specific part
   */
  private simplifySelector(command: string): string {
    // Match selectors in quotes
    const selectorMatch = command.match(/'([^']+)'/);
    if (!selectorMatch) return command;
    
    const selector = selectorMatch[1];
    
    // If selector contains an ID, use just the ID
    const idMatch = selector.match(/#[\w-]+/);
    if (idMatch) {
      return command.replace(`'${selector}'`, `'${idMatch[0]}'`);
    }
    
    // If selector has data attributes, prefer those
    const dataAttrMatch = selector.match(/\[data-[\w-]+=["']?[^"'\]]+["']?\]/);
    if (dataAttrMatch) {
      return command.replace(`'${selector}'`, `'${dataAttrMatch[0]}'`);
    }
    
    // If selector has unique classes at the end, use the last part
    const parts = selector.split(' > ').filter(part => part.trim());
    if (parts.length > 2) {
      const lastPart = parts[parts.length - 1];
      if (lastPart.includes('.') || lastPart.includes('[')) {
        return command.replace(`'${selector}'`, `'${lastPart}'`);
      }
    }
    
    return command;
  }
  
  /**
   * Generate configuration file
   */
  public generateConfiguration(options?: any): { code: string; filename: string } {
    const format = options?.format || options?.language || this.options.language;
    const isTypeScript = format === 'typescript';
    
    const filename = isTypeScript ? 'playwright.config.ts' : 'playwright.config.js';
    
    // Use browser settings from options if provided, otherwise use defaults
    const browserSettings = options?.browserSettings || {};
    const headless = browserSettings.headless !== undefined ? browserSettings.headless : this.options.headless;
    const viewport = browserSettings.viewport || this.options.viewport;
    const slowMo = browserSettings.slowMo || 0;
    const timeout = browserSettings.timeout || this.options.timeout;
    
    let code: string;
    if (isTypeScript) {
      code = `import { defineConfig } from '@playwright/test';

export default defineConfig({
  use: {
    headless: ${headless},${slowMo ? `\n    slowMo: ${slowMo},` : ''}
    viewport: { width: ${viewport.width}, height: ${viewport.height} },
    actionTimeout: ${timeout},
  },
  testDir: './tests',
  timeout: ${timeout},
});`;
    } else {
      code = `const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  use: {
    headless: ${headless},${slowMo ? `\n    slowMo: ${slowMo},` : ''}
    viewport: { width: ${viewport.width}, height: ${viewport.height} },
    actionTimeout: ${timeout},
  },
  testDir: './tests',
  timeout: ${timeout},
});`;
    }
    
    return { code, filename };
  }
  
  /**
   * Generate package.json with dependencies
   */
  public generatePackageJson(options?: any): string {
    const format = options?.format || options?.language || this.options.language;
    const isTypeScript = format === 'typescript';
    
    const packageJson: any = {
      name: 'playwright-tests',
      version: '1.0.0',
      scripts: {
        test: 'playwright test',
        'test:headed': 'playwright test --headed',
      },
      devDependencies: {
        '@playwright/test': '^1.40.0',
      },
    };
    
    if (isTypeScript) {
      packageJson.devDependencies.typescript = '^5.0.0';
      packageJson.devDependencies['@types/node'] = '^20.0.0';
    }
    
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
    const mouseData = event.data as _MouseEventData;
    
    let code = '';
    
    // Add modifiers if present
    const modifiers = this.getModifiers(mouseData);
    if (modifiers.length > 0) {
      code = `await page.click('${selector}', { modifiers: [${modifiers.map(m => `'${m}'`).join(', ')}] });`;
    } else if (event.type === 'dblclick') {
      code = `await page.dblclick('${selector}');`;
    } else {
      code = `await page.click('${selector}');`;
    }
    
    return code;
  }

  /**
   * Input event code generation
   */
  private generateInputCode(event: RecordedEvent): string {
    const selector = this.formatSelector(event.target.selector);
    const formData = event.data as FormEventData;
    const keyboardData = event.data as _KeyboardEventData;
    
    // Get value from keyboard data, form data, or target value
    const value = this.escapeString(
      keyboardData?.inputValue || 
      formData?.value || 
      event.target.value || 
      ''
    );
    
    let code = '';
    
    // Handle different input types - check both type and tagName
    const inputType = event.target.type;
    const tagName = event.target.tagName?.toLowerCase();
    
    if (inputType === 'checkbox' || inputType === 'radio') {
      if (formData?.value === 'true' || formData?.value === 'checked') {
        code = `await page.check('${selector}');`;
      } else {
        code = `await page.uncheck('${selector}');`;
      }
    } else if (inputType === 'file') {
      if (formData?.files && formData.files.length > 0) {
        const filePaths = formData.files.map(f => `'${f.name}'`).join(', ');
        code = `await page.setInputFiles('${selector}', [${filePaths}]);`;
      } else if (value) {
        code = `await page.setInputFiles('${selector}', '${value}');`;
      }
    } else if (inputType === 'select' || inputType === 'select-one' || inputType === 'select-multiple' || tagName === 'select') {
      if (formData?.selectedOptions && formData.selectedOptions.length > 1) {
        const options = formData.selectedOptions.map(opt => `'${this.escapeString(opt)}'`).join(', ');
        code = `await page.selectOption('${selector}', [${options}]);`;
      } else if (formData?.selectedOptions && formData.selectedOptions.length === 1) {
        code = `await page.selectOption('${selector}', '${this.escapeString(formData.selectedOptions[0])}');`;
      } else if (value) {
        code = `await page.selectOption('${selector}', '${value}');`;
      }
    } else {
      // For regular text inputs, use fill directly
      code = `await page.fill('${selector}', '${value}');`;
    }
    
    return code;
  }

  /**
   * Keyboard event code generation
   */
  private generateKeyboardCode(event: RecordedEvent): string {
    const keyData = event.data as _KeyboardEventData;
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
    
    // If it's a form element, submit the form by clicking it
    if (event.target.tagName?.toLowerCase() === 'form') {
      return `await page.click('${selector}');`;
    }
    
    // If it's a submit button, click it
    return `await page.click('${selector}');`;
  }

  /**
   * Scroll event code generation
   */
  private generateScrollCode(event: RecordedEvent): string {
    const scrollData = event.data as _ScrollEventData;
    
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
    const assertionType = assertData?.assertionType;
    
    switch (assertionType) {
      case 'element-visible':
      case 'visible':
        return `await expect(page.locator('${selector}')).toBeVisible();`;
      case 'element-hidden':
      case 'hidden':
        return `await expect(page.locator('${selector}')).toBeHidden();`;
      case 'element-text':
      case 'text-equals':
        return `await expect(page.locator('${selector}')).toHaveText('${this.escapeString(String(assertData.expected))}');`;
      case 'text-contains':
        return `await expect(page.locator('${selector}')).toContainText('${this.escapeString(String(assertData.expected))}');`;
      case 'element-enabled':
      case 'enabled':
        return `await expect(page.locator('${selector}')).toBeEnabled();`;
      case 'element-disabled':
      case 'disabled':
        return `await expect(page.locator('${selector}')).toBeDisabled();`;
      case 'element-checked':
      case 'checked':
        return `await expect(page.locator('${selector}')).toBeChecked();`;
      case 'element-value':
      case 'value-equals':
        return `await expect(page.locator('${selector}')).toHaveValue('${this.escapeString(String(assertData.expected))}');`;
      case 'page-url':
      case 'url-equals':
        return `await expect(page).toHaveURL('${this.escapeString(String(assertData.expected))}');`;
      case 'page-title':
      case 'title-equals':
        return `await expect(page).toHaveTitle('${this.escapeString(String(assertData.expected))}');`;
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
    const mouseData = event.data as _MouseEventData;
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
  private getModifiers(mouseData: _MouseEventData | null | undefined): string[] {
    if (!mouseData) return [];
    
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
  private getKeyboardModifiers(keyData: _KeyboardEventData): string[] {
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