/**
 * Cypress Test Generator
 * Generates Cypress test code from recorded browser events
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
} from '../../types';
import type { EventGroup, CodeGenerationConfig } from '../code-generator';

export class CypressGenerator extends BaseGenerator {
  constructor(config: CodeGenerationConfig, options: BaseGeneratorOptions) {
    super(config, options);
  }

  /**
   * Generate complete Cypress test files
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
    
    // Generate commands file for custom commands
    const commandsFile = this.generateCommandsFile(groups);
    files.push(commandsFile);
    
    // Generate configuration file
    const configFile = this.generateConfigFile();
    files.push(configFile);
    
    return files;
  }

  /**
   * Generate main test file
   */
  private async generateMainTestFile(groups: EventGroup[]): Promise<GeneratedTestFile> {
    const testSetup = this.generateSetupCode();
    const testBody = await this.generateTestBody(groups);
    const testTeardown = this.generateTeardownCode();
    
    const content = [
      testSetup,
      '',
      testBody,
      '',
      testTeardown
    ].filter(Boolean).join('\n');

    return {
      filename: `cypress/e2e/test.cy.${this.options.language === 'typescript' ? 'ts' : 'js'}`,
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
  it('${testName}', () => {
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
    
    return `cy.visit('${url}');`;
  }

  /**
   * Click event code generation
   */
  private generateClickCode(event: RecordedEvent): string {
    const selector = this.formatSelectorForCypress(event.target.selector);
    const mouseData = event.data as MouseEventData as _MouseEventData;
    
    let code = `cy.get('${selector}')`;
    
    // Add wait for element to be visible
    code += '.should(\'be.visible\')';
    
    // Handle double click
    if (event.type === 'dblclick') {
      code += '.dblclick()';
    } else {
      // Add modifiers if present
      const options: string[] = [];
      
      if (mouseData.ctrlKey) options.push('ctrlKey: true');
      if (mouseData.shiftKey) options.push('shiftKey: true');
      if (mouseData.altKey) options.push('altKey: true');
      if (mouseData.metaKey) options.push('metaKey: true');
      
      if (options.length > 0) {
        code += `.click({ ${options.join(', ')} })`;
      } else {
        code += '.click()';
      }
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
    const selector = this.formatSelectorForCypress(event.target.selector);
    const formData = event.data as FormEventData;
    const value = this.escapeString(formData.value || '');
    
    let code = '';
    
    // Handle different input types
    switch (event.target.type) {
      case 'checkbox':
        if (formData.value === 'true' || formData.value === 'checked') {
          code = `cy.get('${selector}').check();`;
        } else {
          code = `cy.get('${selector}').uncheck();`;
        }
        break;
      case 'radio':
        code = `cy.get('${selector}').check();`;
        break;
      case 'file':
        if (formData.files && formData.files.length > 0) {
          const filePaths = formData.files.map(f => `'${f.name}'`).join(', ');
          code = `cy.get('${selector}').selectFile([${filePaths}]);`;
        }
        break;
      case 'select-one':
      case 'select-multiple':
        if (formData.selectedOptions && formData.selectedOptions.length > 0) {
          const options = formData.selectedOptions.map(opt => `'${this.escapeString(opt)}'`);
          if (options.length === 1) {
            code = `cy.get('${selector}').select(${options[0]});`;
          } else {
            code = `cy.get('${selector}').select([${options.join(', ')}]);`;
          }
        }
        break;
      default:
        // Clear field first and then type
        code = `cy.get('${selector}').clear().type('${value}');`;
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
    const key = this.mapCypressKey(keyData.key);
    
    // Build modifier string
    const modifiers: string[] = [];
    if (keyData.ctrlKey) modifiers.push('ctrl');
    if (keyData.shiftKey) modifiers.push('shift');
    if (keyData.altKey) modifiers.push('alt');
    if (keyData.metaKey) modifiers.push('cmd');
    
    let keySequence = '';
    if (modifiers.length > 0) {
      keySequence = `{${modifiers.join('+')}+${key}}`;
    } else {
      keySequence = `{${key}}`;
    }
    
    // If we have an input value, type it directly
    if (keyData.inputValue) {
      return `cy.focused().type('${this.escapeString(keyData.inputValue)}');`;
    }
    
    return `cy.focused().type('${keySequence}');`;
  }

  /**
   * Submit event code generation
   */
  private generateSubmitCode(event: RecordedEvent): string {
    const selector = this.formatSelectorForCypress(event.target.selector);
    
    // If it's a form element, submit the form
    if (event.target.tagName.toLowerCase() === 'form') {
      return `cy.get('${selector}').submit();`;
    }
    
    // If it's a submit button, click it
    return `cy.get('${selector}').click();`;
  }

  /**
   * Scroll event code generation
   */
  private generateScrollCode(event: RecordedEvent): string {
    const scrollData = event.data as ScrollEventData as _ScrollEventData;
    
    if (scrollData.element === 'window') {
      return `cy.scrollTo(${scrollData.scrollX}, ${scrollData.scrollY});`;
    } else {
      const selector = this.formatSelectorForCypress(event.target.selector);
      return `cy.get('${selector}').scrollIntoView();`;
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
          return `cy.get('${this.formatSelectorForCypress(waitData.condition)}').should('be.visible');`;
        }
        break;
      case 'navigation':
        return `cy.url().should('not.contain', 'about:blank');`;
      case 'network':
        return `cy.intercept('GET', '**').as('apiCall');\ncy.wait('@apiCall');`;
      case 'timeout':
      default:
        return `cy.wait(${waitData.duration});`;
    }
    
    return `cy.wait(${waitData.duration});`;
  }

  /**
   * Generate wait condition based on event
   */
  generateWaitCondition(event: RecordedEvent): string {
    const selector = event.target?.selector;
    
    switch (event.type) {
      case 'click':
        return `cy.get('${this.formatSelectorForCypress(selector)}').should('be.visible');`;
      case 'input':
        return `cy.get('${this.formatSelectorForCypress(selector)}').should('be.enabled');`;
      case 'navigation':
        return `cy.url().should('contain', 'http');`;
      default:
        return `cy.get('${this.formatSelectorForCypress(selector)}').should('exist');`;
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
        return `cy.get('${this.formatSelectorForCypress(selector)}').should('have.text', '${this.escapeString(assertData.expected)}');`;
      case 'text-contains':
        return `cy.get('${this.formatSelectorForCypress(selector)}').should('contain.text', '${this.escapeString(assertData.expected)}');`;
      case 'visible':
        return `cy.get('${this.formatSelectorForCypress(selector)}').should('be.visible');`;
      case 'hidden':
        return `cy.get('${this.formatSelectorForCypress(selector)}').should('not.be.visible');`;
      case 'enabled':
        return `cy.get('${this.formatSelectorForCypress(selector)}').should('be.enabled');`;
      case 'disabled':
        return `cy.get('${this.formatSelectorForCypress(selector)}').should('be.disabled');`;
      case 'checked':
        return `cy.get('${this.formatSelectorForCypress(selector)}').should('be.checked');`;
      case 'value-equals':
        return `cy.get('${this.formatSelectorForCypress(selector)}').should('have.value', '${this.escapeString(assertData.expected)}');`;
      case 'url-equals':
        return `cy.url().should('eq', '${this.escapeString(assertData.expected)}');`;
      case 'title-equals':
        return `cy.title().should('eq', '${this.escapeString(assertData.expected)}');`;
      default:
        return `// Custom assertion: ${assertData.message}`;
    }
  }

  /**
   * Focus event code generation
   */
  private generateFocusCode(event: RecordedEvent): string {
    const selector = this.formatSelectorForCypress(event.target.selector);
    return `cy.get('${selector}').focus();`;
  }

  /**
   * Blur event code generation
   */
  private generateBlurCode(event: RecordedEvent): string {
    const selector = this.formatSelectorForCypress(event.target.selector);
    return `cy.get('${selector}').blur();`;
  }

  /**
   * Select event code generation
   */
  private generateSelectCode(event: RecordedEvent): string {
    const selector = this.formatSelectorForCypress(event.target.selector);
    return `cy.get('${selector}').select();`;
  }

  /**
   * Context menu event code generation
   */
  private generateContextMenuCode(event: RecordedEvent): string {
    const selector = this.formatSelectorForCypress(event.target.selector);
    return `cy.get('${selector}').rightclick();`;
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
          assertions.push(`cy.url().should('eq', '${navData.url}');`);
          break;
        }
        case 'input':
        case 'change': {
          if (event.target.type !== 'password') { // Don't assert password values
            const formData = event.data as FormEventData;
            if (formData.value) {
              assertions.push(`cy.get('${this.formatSelectorForCypress(event.target.selector)}').should('have.value', '${this.escapeString(formData.value)}');`);
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
      case 'navigation':
        {
        const navEvent = group.events.find(e => e.type === 'navigation');
        if (navEvent) {
          const navData = navEvent.data as NavigationEventData;
          assertions.push(`cy.url().should('eq', '${navData.url}');`);
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
                assertions.push(`cy.get('${this.formatSelectorForCypress(event.target.selector)}').should('have.value', '${this.escapeString(formData.value)}');`);
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
    
    const lines: string[] = [];
    
    if (this.options.viewport) {
      lines.push(`beforeEach(() => {`);
      lines.push(`  cy.viewport(${this.options.viewport.width}, ${this.options.viewport.height});`);
      lines.push(`});`);
    }
    
    return lines.join('\n');
  }

  /**
   * Generate teardown code
   */
  generateTeardownCode(): string {
    if (!this.options.includeSetup) return '';
    
    return `afterEach(() => {
  // Cleanup code can be added here
});`;
  }

  /**
   * Generate imports (Cypress doesn't need explicit imports)
   */
  generateImports(): string[] {
    return [];
  }

  /**
   * Get required dependencies
   */
  getDependencies(): string[] {
    return [
      'cypress',
      ...(this.options.language === 'typescript' ? ['typescript'] : [])
    ];
  }

  /**
   * Optimize selector for Cypress
   */
  optimizeSelector(selector: string, element?: any): SelectorOptimization {
    const original = selector;
    let optimized = selector;
    let strategy: SelectorOptimization['strategy'] = 'css';
    let reliability = this.assessSelectorReliability(selector);
    
    // Prefer data-cy attributes (Cypress best practice)
    if (element?.getAttribute && element.getAttribute('data-cy')) {
      optimized = `[data-cy="${element.getAttribute('data-cy')}"]`;
      strategy = 'attribute';
      reliability = 0.95;
    }
    // Prefer data-testid attributes
    else if (element?.getAttribute && element.getAttribute('data-testid')) {
      optimized = `[data-testid="${element.getAttribute('data-testid')}"]`;
      strategy = 'attribute';
      reliability = 0.9;
    }
    // Use text content for buttons and links
    else if ((element?.tagName === 'A' || element?.tagName === 'BUTTON') && element.textContent?.trim()) {
      optimized = `:contains("${element.textContent.trim()}")`;
      strategy = 'text';
      reliability = 0.7;
    }
    
    return {
      original,
      optimized: this.formatSelectorForCypress(optimized),
      strategy,
      reliability
    };
  }

  /**
   * Format selector for Cypress compatibility
   */
  private formatSelectorForCypress(selector: string): string {
    // Cypress has some specific selector requirements
    return this.cleanSelector(selector)
      .replace(/"/g, "'"); // Prefer single quotes
  }

  /**
   * Map keyboard keys to Cypress format
   */
  private mapCypressKey(key: string): string {
    const keyMap: Record<string, string> = {
      'Enter': 'enter',
      'Tab': 'tab',
      'Escape': 'esc',
      'Backspace': 'backspace',
      'Delete': 'del',
      'ArrowUp': 'upArrow',
      'ArrowDown': 'downArrow',
      'ArrowLeft': 'leftArrow',
      'ArrowRight': 'rightArrow',
      'Home': 'home',
      'End': 'end',
      'PageUp': 'pageUp',
      'PageDown': 'pageDown',
      ' ': 'space'
    };
    
    return keyMap[key] || key.toLowerCase();
  }

  /**
   * Generate Cypress commands file
   */
  private generateCommandsFile(groups: EventGroup[]): GeneratedTestFile {
    const customCommands = this.generateCustomCommands(groups);
    
    const content = `// Custom Cypress commands
/// <reference types="cypress" />

${customCommands.join('\n\n')}

// TypeScript support
declare global {
  namespace Cypress {
    interface Chainable {
      ${this.generateCommandTypeDeclarations(customCommands).join('\n      ')}
    }
  }
}`;

    return {
      filename: 'cypress/support/commands.js',
      content,
      type: 'helper'
    };
  }

  /**
   * Generate custom Cypress commands
   */
  private generateCustomCommands(groups: EventGroup[]): string[] {
    const commands: string[] = [];
    
    // Generate form filling command if there are multiple form interactions
    const formGroups = groups.filter(g => g.actionType === 'form_interaction');
    if (formGroups.length > 1) {
      commands.push(`Cypress.Commands.add('fillForm', (formData) => {
  Object.entries(formData).forEach(([selector, value]) => {
    cy.get(selector).clear().type(value);
  });
});`);
    }
    
    // Generate navigation command with wait
    const navGroups = groups.filter(g => g.actionType === 'navigation');
    if (navGroups.length > 1) {
      commands.push(`Cypress.Commands.add('visitAndWait', (url) => {
  cy.visit(url);
  cy.get('body').should('be.visible');
});`);
    }
    
    return commands;
  }

  /**
   * Generate TypeScript command declarations
   */
  private generateCommandTypeDeclarations(commands: string[]): string[] {
    const declarations: string[] = [];
    
    commands.forEach(command => {
      if (command.includes('fillForm')) {
        declarations.push('fillForm(formData: Record<string, string>): Chainable<void>');
      }
      if (command.includes('visitAndWait')) {
        declarations.push('visitAndWait(url: string): Chainable<void>');
      }
    });
    
    return declarations;
  }

  /**
   * Generate Cypress configuration file
   */
  private generateConfigFile(): GeneratedTestFile {
    const config = `import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    viewportWidth: ${this.options.viewport?.width || 1280},
    viewportHeight: ${this.options.viewport?.height || 720},
    defaultCommandTimeout: ${this.options.timeout || 10000},
    requestTimeout: 10000,
    responseTimeout: 30000,
    video: true,
    screenshotOnRunFailure: true,
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
});`;

    return {
      filename: 'cypress.config.ts',
      content: config,
      type: 'config'
    };
  }

  /**
   * Generate page object files for Cypress
   */
  private async generatePageObjectFiles(groups: EventGroup[]): Promise<GeneratedTestFile[]> {
    const pageObjects: GeneratedTestFile[] = [];
    const pageUrls = this.extractPageUrls(groups);
    
    for (const url of pageUrls) {
      const pageName = this.generatePageNameFromUrl(url);
      const pageEvents = this.getEventsForPage(groups, url);
      const pageObjectCode = this.generateCypressPageObjectCode(pageName, pageEvents);
      
      pageObjects.push({
        filename: `cypress/support/pages/${pageName}.page.${this.options.language === 'typescript' ? 'ts' : 'js'}`,
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
   * Generate Cypress page object class code
   */
  private generateCypressPageObjectCode(pageName: string, events: RecordedEvent[]): string {
    const selectors = this.extractUniqueSelectors(events);
    const methods = this.generateCypressPageObjectMethods(events);
    
    const classDefinition = `class ${pageName} {
${selectors.map(selector => 
  `  get ${this.generateVariableName({ target: { selector } } as any)}() {
    return cy.get('${this.formatSelectorForCypress(selector)}');
  }`
).join('\n\n')}

${methods.join('\n\n')}
}

export default new ${pageName}();`;

    return classDefinition;
  }

  /**
   * Generate Cypress page object methods
   */
  private generateCypressPageObjectMethods(events: RecordedEvent[]): string[] {
    const methods: string[] = [];
    const actionGroups = this.groupRelatedEvents(events);
    
    actionGroups.forEach((group) => {
      const methodName = this.generateMethodName(group);
      const methodCode = this.generateCypressPageObjectMethod(methodName, group);
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
   * Generate Cypress page object method code
   */
  private generateCypressPageObjectMethod(methodName: string, events: RecordedEvent[]): string {
    const methodBody = events.map(event => {
      return this.generateEventCode(event);
    }).join('\n    ');
    
    return `  ${methodName}() {
    ${methodBody}
    return this;
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
   * Override wait code generation for Cypress
   */
  protected generateWaitCode(duration: number): string {
    return `cy.wait(${duration});`;
  }
}

export default CypressGenerator;