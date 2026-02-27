/**
 * Core Code Generation Engine
 * Converts recorded browser events into test code for multiple frameworks and languages
 */

import type {
  RecordedEvent,
  TestGenerationOptions,
  GeneratedTest,
  TestCase as _TestCase,
  TestCaseMetadata,
  TestFormat,
  TestFramework,
  EventType as _EventType,
  MouseEventData as _MouseEventData,
  KeyboardEventData,
  FormEventData,
  NavigationEventData,
  AssertionEventData,
} from '../types';

import { TemplateEngine, type CodeTemplate as EngineCodeTemplate } from './templates/template-engine';
import { builtInTemplates } from './templates/builtin-templates';
import { PlaywrightGenerator } from './generators/playwright-generator';
import { CypressGenerator } from './generators/cypress-generator';
import { SeleniumGenerator } from './generators/selenium-generator';
import { PuppeteerGenerator } from './generators/puppeteer-generator';

export interface CodeGenerationConfig {
  format: TestFormat;
  framework: TestFramework;
  language: 'javascript' | 'typescript' | 'python' | 'csharp';
  includeAssertions: boolean;
  includeComments: boolean;
  includeSetup: boolean;
  optimizeSelectors: boolean;
  groupActions: boolean;
  pageObjectModel: boolean;
  customPatterns?: Record<string, string>;
}

export interface GeneratedCode {
  mainFile: string;
  supportFiles?: Record<string, string>;
  dependencies?: string[];
  instructions?: string[];
}

export interface EventGroup {
  id: string;
  name: string;
  description: string;
  events: RecordedEvent[];
  actionType: 'navigation' | 'form_interaction' | 'assertion' | 'wait' | 'custom';
}

export interface CodeTemplate {
  id: string;
  name: string;
  description: string;
  format: TestFormat;
  language: string;
  template: string;
  placeholders: Record<string, string>;
  imports?: string[];
  dependencies?: string[];
}

export interface OptimizationRule {
  id: string;
  name: string;
  description: string;
  condition: (events: RecordedEvent[]) => boolean;
  transform: (events: RecordedEvent[]) => RecordedEvent[];
}

/**
 * Main code generation engine
 */
export class CodeGenerator {
  private config: CodeGenerationConfig;
  private templates: Map<string, CodeTemplate> = new Map();
  private optimizationRules: OptimizationRule[] = [];

  constructor(config: CodeGenerationConfig) {
    this.config = config;
    this.initializeTemplates();
    this.initializeOptimizationRules();
  }

  /**
   * Generate test code from recorded events
   */
  async generateTest(events: RecordedEvent[], options: TestGenerationOptions): Promise<GeneratedTest> {
    // Validate inputs
    if (!events.length) {
      throw new Error('No events provided for test generation');
    }

    // Update config with options
    this.updateConfig(options);

    // Preprocess events
    const processedEvents = await this.preprocessEvents(events);

    // Group events logically
    const eventGroups = this.groupEvents(processedEvents);

    // Optimize event sequences
    const optimizedGroups = this.optimizeEventGroups(eventGroups);

    // Generate code
    const generatedCode = await this.generateCodeFromGroups(optimizedGroups);

    // Post-process and format
    const finalCode = generatedCode;

    // Create metadata
    const metadata = this.createTestMetadata(events, eventGroups);

    return {
      id: this.generateId(),
      name: this.generateTestName(events),
      format: this.config.format,
      framework: this.config.framework,
      code: finalCode.mainFile,
      metadata: metadata as unknown as TestCaseMetadata,
      createdAt: Date.now(),
    };
  }

  /**
   * Generate multiple test variants
   */
  async generateTestVariants(events: RecordedEvent[]): Promise<GeneratedTest[]> {
    const variants: GeneratedTest[] = [];
    const formats: TestFormat[] = ['playwright', 'cypress', 'selenium', 'puppeteer'];
    const languages = ['javascript', 'typescript'];

    for (const format of formats) {
      for (const language of languages) {
        const config = { ...this.config, format, language: language as any };
        const generator = new CodeGenerator(config);
        
        try {
          const test = await generator.generateTest(events, {
            format,
            framework: this.config.framework,
            includeAssertions: this.config.includeAssertions,
            groupActions: this.config.groupActions,
            addComments: this.config.includeComments,
            optimizeSelectors: this.config.optimizeSelectors,
          });
          
          variants.push(test);
        } catch {
          // silently ignore
        }
      }
    }

    return variants;
  }

  /**
   * Generate Page Object Model structure
   */
  async generatePageObjectModel(events: RecordedEvent[]): Promise<{ pages: Record<string, string>; test: string }> {
    const pages: Record<string, string> = {};
    const pageEvents = this.groupEventsByPage(events);

    // Generate page objects
    for (const [url, pageEventList] of Array.from(pageEvents.entries())) {
      const pageName = this.generatePageName(url);
      const pageObject = await this.generatePageObject(pageName, pageEventList);
      pages[`${pageName}.${this.getFileExtension()}`] = pageObject;
    }

    // Generate main test file using page objects
    const testCode = await this.generatePageObjectTest(events, Object.keys(pages));
    
    return { pages, test: testCode };
  }

  /**
   * Preprocess events for optimization
   */
  private async preprocessEvents(events: RecordedEvent[]): Promise<RecordedEvent[]> {
    let processed = [...events];

    // Sort by timestamp and sequence
    processed.sort((a, b) => a.timestamp - b.timestamp || a.sequence - b.sequence);

    // Remove duplicate events
    processed = this.removeDuplicateEvents(processed);

    // Merge related events
    processed = this.mergeRelatedEvents(processed);

    // Add implicit waits
    if (this.config.groupActions) {
      processed = this.addImplicitWaits(processed);
    }

    // Optimize selectors
    if (this.config.optimizeSelectors) {
      processed = await this.optimizeSelectors(processed);
    }

    return processed;
  }

  /**
   * Group events into logical actions
   */
  private groupEvents(events: RecordedEvent[]): EventGroup[] {
    const groups: EventGroup[] = [];
    let currentGroup: EventGroup | null = null;
    
    for (const event of events) {
      const actionType = this.determineActionType(event);
      
      // Start new group if action type changes or for navigation events
      if (!currentGroup || currentGroup.actionType !== actionType || actionType === 'navigation') {
        if (currentGroup && currentGroup.events.length > 0) {
          groups.push(currentGroup);
        }
        
        currentGroup = {
          id: this.generateId(),
          name: this.generateGroupName(actionType, event),
          description: this.generateGroupDescription(actionType, event),
          actionType,
          events: []
        };
      }
      
      currentGroup.events.push(event);
    }

    if (currentGroup && currentGroup.events.length > 0) {
      groups.push(currentGroup);
    }

    return groups;
  }

  /**
   * Optimize event groups using rules
   */
  private optimizeEventGroups(groups: EventGroup[]): EventGroup[] {
    return groups.map(group => {
      let optimizedEvents = group.events;
      
      for (const rule of this.optimizationRules) {
        if (rule.condition(optimizedEvents)) {
          optimizedEvents = rule.transform(optimizedEvents);
        }
      }
      
      return { ...group, events: optimizedEvents };
    });
  }

  /**
   * Generate code from event groups
   */
  private async generateCodeFromGroups(groups: EventGroup[]): Promise<GeneratedCode> {
    const templateKey = `${this.config.format}-${this.config.language}`;
    const template = this.templates.get(templateKey);
    
    if (!template) {
      throw new Error(`No template found for ${templateKey}`);
    }

    // Generate imports and setup
    const imports = this.generateImports(template);
    const setup = this.generateSetup(groups);
    const teardown = this.generateTeardown();

    // Generate test body
    const testMethods = await Promise.all(
      groups.map(group => this.generateGroupCode(group))
    );

    // Combine all parts
    const mainFile = this.assembleMainFile({
      imports,
      setup,
      testMethods,
      teardown,
      template
    });

    // Generate support files if needed
    const supportFiles = this.config.pageObjectModel 
      ? await this.generateSupportFiles(groups)
      : undefined;

    return {
      mainFile,
      supportFiles,
      dependencies: template.dependencies,
      instructions: this.generateInstructions()
    };
  }

  /**
   * Generate code for a specific event group
   */
  private async generateGroupCode(group: EventGroup): Promise<string> {
    const lines: string[] = [];
    
    // Add group comment
    if (this.config.includeComments) {
      lines.push(`// ${group.name}`);
      if (group.description) {
        lines.push(`// ${group.description}`);
      }
      lines.push('');
    }

    // Generate code for each event
    for (const event of group.events) {
      const eventCode = await this.generateEventCode(event);
      if (eventCode) {
        lines.push(eventCode);
      }
    }

    // Add assertions if configured
    if (this.config.includeAssertions) {
      const assertions = this.generateAssertions(group);
      lines.push(...assertions);
    }

    return lines.join('\n');
  }

  /**
   * Generate code for a specific event
   */
  private async generateEventCode(event: RecordedEvent): Promise<string> {
    const { format, language } = this.config;
    const generator = this.getEventGenerator(format, language);
    
    return generator.generateEvent(event);
  }

  /**
   * Generate assertions for a group
   */
  private generateAssertions(group: EventGroup): string[] {
    const assertions: string[] = [];
    
    // Generate assertions based on action type and events
    switch (group.actionType) {
      case 'navigation':
        assertions.push(this.generateNavigationAssertion(group.events));
        break;
      case 'form_interaction':
        assertions.push(...this.generateFormAssertions(group.events));
        break;
      case 'assertion':
        assertions.push(...this.generateExplicitAssertions(group.events));
        break;
    }
    
    return assertions.filter(Boolean);
  }

  /**
   * Initialize code templates
   */
  private initializeTemplates(): void {
    // Load built-in templates from template engine
    const templateEngine = new TemplateEngine();
    
    // Register all built-in templates
    builtInTemplates.forEach((template) => {
      templateEngine.registerTemplate(template as EngineCodeTemplate);
      this.templates.set(`${template.framework}-${template.language}`, {
        id: template.id,
        name: template.name,
        description: template.description,
        format: template.framework,
        language: template.language,
        template: template.template,
        placeholders: template.placeholders.reduce((acc: Record<string, string>, p) => {
          acc[p.key] = (p.defaultValue as string) || '';
          return acc;
        }, {}),
        imports: template.imports,
        dependencies: template.dependencies
      });
    });

    // Add framework-specific mappings
    const frameworkMappings = [
      { format: 'playwright', language: 'javascript', templateId: 'playwright-js-basic' },
      { format: 'playwright', language: 'typescript', templateId: 'playwright-ts-advanced' },
      { format: 'cypress', language: 'javascript', templateId: 'cypress-js-e2e' },
      { format: 'cypress', language: 'typescript', templateId: 'cypress-ts-api' },
      { format: 'selenium', language: 'python', templateId: 'selenium-python-unittest' },
      { format: 'selenium', language: 'csharp', templateId: 'selenium-csharp-nunit' },
      { format: 'puppeteer', language: 'javascript', templateId: 'puppeteer-jest-basic' }
    ];

    frameworkMappings.forEach(mapping => {
      const template = builtInTemplates.find((t) => t.id === mapping.templateId);
      if (template) {
        this.templates.set(`${mapping.format}-${mapping.language}`, {
          id: template.id,
          name: template.name,
          description: template.description,
          format: mapping.format as TestFormat,
          language: mapping.language,
          template: template.template,
          placeholders: template.placeholders.reduce((acc: Record<string, string>, p) => {
            acc[p.key] = (p.defaultValue as string) || '';
            return acc;
          }, {}),
          imports: template.imports || [],
          dependencies: template.dependencies || []
        });
      }
    });
  }

  /**
   * Initialize optimization rules
   */
  private initializeOptimizationRules(): void {
    this.optimizationRules = [
      // Remove consecutive duplicate clicks
      {
        id: 'remove-duplicate-clicks',
        name: 'Remove Duplicate Clicks',
        description: 'Removes consecutive clicks on the same element',
        condition: (events: RecordedEvent[]) => this.hasConsecutiveDuplicateClicks(events),
        transform: (events: RecordedEvent[]) => this.removeConsecutiveDuplicateClicks(events)
      },
      
      // Merge rapid input events
      {
        id: 'merge-input-events',
        name: 'Merge Input Events',
        description: 'Merges rapid input events into single type action',
        condition: (events: RecordedEvent[]) => this.hasRapidInputEvents(events),
        transform: (events: RecordedEvent[]) => this.mergeRapidInputEvents(events)
      },
      
      // Add smart waits
      {
        id: 'add-smart-waits',
        name: 'Add Smart Waits',
        description: 'Adds waits based on timing patterns',
        condition: () => true,
        transform: (events: RecordedEvent[]) => this.addSmartWaits(events)
      }
    ];
  }

  // Helper methods for event processing
  private removeDuplicateEvents(events: RecordedEvent[]): RecordedEvent[] {
    const seen = new Set<string>();
    return events.filter(event => {
      const key = `${event.type}-${event.target.selector}-${event.timestamp}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private mergeRelatedEvents(events: RecordedEvent[]): RecordedEvent[] {
    // Implementation for merging related events (e.g., keydown + input + keyup)
    return events; // Placeholder
  }

  private addImplicitWaits(events: RecordedEvent[]): RecordedEvent[] {
    // Add waits between events where timing suggests they're needed
    const result: RecordedEvent[] = [];
    
    for (let i = 0; i < events.length; i++) {
      const current = events[i];
      const next = events[i + 1];
      
      result.push(current);
      
      // Add wait if there's a significant delay between events
      if (next && (next.timestamp - current.timestamp) > 1000) {
        result.push(this.createWaitEvent(next.timestamp - current.timestamp));
      }
    }
    
    return result;
  }

  private async optimizeSelectors(events: RecordedEvent[]): Promise<RecordedEvent[]> {
    // Optimize selectors for reliability and readability
    return events.map(event => ({
      ...event,
      target: {
        ...event.target,
        selector: this.optimizeSelector(event.target.selector)
      }
    }));
  }

  private optimizeSelector(selector: string): string {
    // Implement selector optimization logic
    return selector; // Placeholder
  }

  private determineActionType(event: RecordedEvent): EventGroup['actionType'] {
    switch (event.type) {
      case 'navigation':
      case 'reload':
      case 'back':
      case 'forward':
        return 'navigation';
      case 'input':
      case 'change':
      case 'submit':
      case 'focus':
      case 'blur':
        return 'form_interaction';
      case 'assertion':
        return 'assertion';
      case 'wait':
        return 'wait';
      default:
        return 'custom';
    }
  }

  private generateGroupName(actionType: EventGroup['actionType'], event: RecordedEvent): string {
    switch (actionType) {
      case 'navigation': {
        const navData = event.data as NavigationEventData;
        return `Navigate to ${new URL(navData.url).hostname}`;
      }
      case 'form_interaction':
        return `Fill form field`;
      case 'assertion':
        return `Verify element state`;
      case 'wait':
        return `Wait for condition`;
      default:
        return `Perform ${event.type} action`;
    }
  }

  private generateGroupDescription(actionType: EventGroup['actionType'], event: RecordedEvent): string {
    return `${actionType} action starting with ${event.type} event`;
  }

  // Additional helper methods for code generation...
  private generateImports(template: CodeTemplate): string[] {
    return template.imports || [];
  }

  private generateSetup(_groups: EventGroup[]): string {
    return this.config.includeSetup ? this.getSetupCode() : '';
  }

  private generateTeardown(): string {
    return this.config.includeSetup ? this.getTeardownCode() : '';
  }

  private getSetupCode(): string {
    return '// Test setup code will be generated here';
  }

  private getTeardownCode(): string {
    return '// Test teardown code will be generated here';
  }

  private assembleMainFile(parts: {
    imports: string[];
    setup: string;
    testMethods: string[];
    teardown: string;
    template: CodeTemplate;
  }): string {
    const lines: string[] = [];
    
    // Add imports
    lines.push(...parts.imports);
    lines.push('');
    
    // Add main test structure
    lines.push('test(\'Generated test\', async ({ page }) => {');
    
    // Add setup
    if (parts.setup) {
      lines.push(`  ${parts.setup}`);
    }
    
    // Add test methods
    parts.testMethods.forEach(method => {
      lines.push(`  ${method.replace(/\n/g, '\n  ')}`);
    });
    
    // Add teardown
    if (parts.teardown) {
      lines.push(`  ${parts.teardown}`);
    }
    
    lines.push('});');
    
    return lines.join('\n');
  }

  private async generateSupportFiles(_groups: EventGroup[]): Promise<Record<string, string>> {
    return {}; // Placeholder for support files
  }

  private generateInstructions(): string[] {
    return [
      '1. Install the required dependencies',
      '2. Run the test using your test runner',
      '3. Check the test results'
    ];
  }

  // Utility methods
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private generateTestName(events: RecordedEvent[]): string {
    const firstNav = events.find(e => e.type === 'navigation');
    if (firstNav) {
      const navData = firstNav.data as NavigationEventData;
      return `Test ${new URL(navData.url).hostname}`;
    }
    return `Generated Test ${new Date().toISOString()}`;
  }

  private createTestMetadata(events: RecordedEvent[], groups: EventGroup[]): Record<string, unknown> {
    return {
      sessionId: events[0]?.metadata?.sessionId || '',
      eventCount: events.length,
      duration: events.length > 0 ? events[events.length - 1].timestamp - events[0].timestamp : 0,
      url: events.find(e => e.type === 'navigation')?.context?.url || '',
      viewport: events[0]?.context?.viewport || { width: 1920, height: 1080 },
      assertions: groups.filter(g => g.actionType === 'assertion').length,
      selectors: new Set(events.map(e => e.target.selector)).size
    };
  }

  private updateConfig(options: TestGenerationOptions): void {
    this.config = {
      ...this.config,
      format: options.format,
      framework: options.framework,
      includeAssertions: options.includeAssertions,
      groupActions: options.groupActions,
      includeComments: options.addComments,
      optimizeSelectors: options.optimizeSelectors
    };
  }

  private getEventGenerator(format: TestFormat, language: string): any { 
    // Generators are now imported at the top of the file

    const options = {
      language: language as 'javascript' | 'typescript' | 'python' | 'csharp',
      includeComments: this.config.includeComments,
      includeAssertions: this.config.includeAssertions,
      includeSetup: this.config.includeSetup,
      pageObjectModel: this.config.pageObjectModel,
      timeout: 30000,
      viewport: { width: 1280, height: 720 },
      headless: true
    };

    switch (format) {
      case 'playwright':
        return new PlaywrightGenerator(this.config, options);
      case 'cypress':
        return new CypressGenerator(this.config, options);
      case 'selenium':
        return new SeleniumGenerator(this.config, options);
      case 'puppeteer':
        return new PuppeteerGenerator(this.config, options);
      default:
        // Fallback generator
        return {
          generateEvent: (event: RecordedEvent) => {
            return `// Generated code for ${event.type} event`;
          },
          generateSetup: () => {
            return '// Setup code';
          },
          generateTeardown: () => {
            return '// Teardown code';
          }
        };
    }
  }

  private groupEventsByPage(events: RecordedEvent[]): Map<string, RecordedEvent[]> {
    const pageGroups = new Map<string, RecordedEvent[]>();
    
    events.forEach(event => {
      const url = event.context.url;
      if (!pageGroups.has(url)) {
        pageGroups.set(url, []);
      }
      pageGroups.get(url)!.push(event);
    });
    
    return pageGroups;
  }

  private generatePageName(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace(/[^a-zA-Z0-9]/g, '') + 'Page';
    } catch {
      return 'BasePage';
    }
  }

  private async generatePageObject(pageName: string, _events: RecordedEvent[]): Promise<string> {
    return `// Page Object for ${pageName}`;
  }

  private async generatePageObjectTest(_events: RecordedEvent[], _pageFiles: string[]): Promise<string> {
    return `// Test using Page Objects`;
  }

  private getFileExtension(): string {
    return this.config.language === 'typescript' ? 'ts' : 'js';
  }

  // Optimization rule helpers
  private hasConsecutiveDuplicateClicks(events: RecordedEvent[]): boolean {
    for (let i = 1; i < events.length; i++) {
      const current = events[i];
      const previous = events[i - 1];
      
      if (
        current.type === 'click' && 
        previous.type === 'click' &&
        current.target.selector === previous.target.selector &&
        (current.timestamp - previous.timestamp) < 500
      ) {
        return true;
      }
    }
    return false;
  }

  private removeConsecutiveDuplicateClicks(events: RecordedEvent[]): RecordedEvent[] {
    const result: RecordedEvent[] = [];
    let lastClick: RecordedEvent | null = null;
    
    for (const event of events) {
      if (event.type === 'click') {
        if (
          !lastClick || 
          event.target.selector !== lastClick.target.selector ||
          (event.timestamp - lastClick.timestamp) >= 500
        ) {
          result.push(event);
          lastClick = event;
        }
      } else {
        result.push(event);
        lastClick = null;
      }
    }
    
    return result;
  }

  private hasRapidInputEvents(events: RecordedEvent[]): boolean {
    const inputEvents = events.filter(e => e.type === 'input');
    return inputEvents.length > 3; // Simple heuristic
  }

  private mergeRapidInputEvents(events: RecordedEvent[]): RecordedEvent[] {
    const result: RecordedEvent[] = [];
    const inputGroups = new Map<string, RecordedEvent[]>();
    
    for (const event of events) {
      if (event.type === 'input') {
        const key = event.target.selector;
        if (!inputGroups.has(key)) {
          inputGroups.set(key, []);
        }
        inputGroups.get(key)!.push(event);
      } else {
        // Process accumulated input groups
        inputGroups.forEach((group, _selector) => {
          if (group.length > 0) {
            result.push(this.createMergedInputEvent(group));
          }
        });
        inputGroups.clear();
        
        result.push(event);
      }
    }
    
    // Process any remaining input groups
    inputGroups.forEach((group) => {
      if (group.length > 0) {
        result.push(this.createMergedInputEvent(group));
      }
    });
    
    return result;
  }

  private addSmartWaits(events: RecordedEvent[]): RecordedEvent[] {
    // Add intelligent waits based on event patterns
    return events; // Placeholder implementation
  }

  private createWaitEvent(duration: number): RecordedEvent {
    return {
      id: this.generateId(),
      type: 'wait',
      timestamp: Date.now(),
      sequence: 0,
      target: {
        selector: '',
        tagName: '',
        boundingRect: {} as DOMRect,
        path: [],
        alternativeSelectors: []
      },
      data: {
        type: 'wait',
        duration: Math.min(duration, 5000), // Cap at 5 seconds
        reason: 'timeout'
      },
      context: {} as any,
      metadata: {} as any
    };
  }

  private createMergedInputEvent(inputEvents: RecordedEvent[]): RecordedEvent {
    const lastEvent = inputEvents[inputEvents.length - 1];
    const allInputs = inputEvents
      .map(e => (e.data as KeyboardEventData).inputValue)
      .filter(Boolean)
      .join('');
    
    const lastEventData = lastEvent.data as KeyboardEventData;
    return {
      ...lastEvent,
      data: {
        ...lastEventData,
        inputValue: allInputs
      } as KeyboardEventData
    };
  }

  private generateNavigationAssertion(events: RecordedEvent[]): string {
    const navEvent = events.find(e => e.type === 'navigation');
    if (navEvent) {
      const navData = navEvent.data as NavigationEventData;
      return `expect(page.url()).toBe('${navData.url}');`;
    }
    return '';
  }

  private generateFormAssertions(events: RecordedEvent[]): string[] {
    const assertions: string[] = [];
    
    events.forEach(event => {
      if (event.type === 'input' || event.type === 'change') {
        const formData = event.data as FormEventData;
        if (formData.value) {
          assertions.push(`expect(await page.inputValue('${event.target.selector}')).toBe('${formData.value}');`);
        }
      }
    });
    
    return assertions;
  }

  private generateExplicitAssertions(events: RecordedEvent[]): string[] {
    return events
      .filter(event => event.type === 'assertion')
      .map(event => {
        const assertionData = event.data as AssertionEventData;
        return `expect(${assertionData.message}).toBe(${JSON.stringify(assertionData.expected)});`;
      });
  }
}

export default CodeGenerator;