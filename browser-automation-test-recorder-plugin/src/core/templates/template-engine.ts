/**
 * Template Engine for Code Generation
 * Manages customizable code templates for different frameworks and patterns
 */

import type { TestFormat, TestFramework } from '../../types';

export interface CodeTemplate {
  id: string;
  name: string;
  description: string;
  framework: TestFormat;
  language: 'javascript' | 'typescript' | 'python' | 'csharp';
  category: 'test' | 'page-object' | 'helper' | 'config' | 'setup';
  template: string;
  placeholders: TemplatePlaceholder[];
  dependencies: string[];
  imports: string[];
  examples?: string[];
}

export interface TemplatePlaceholder {
  key: string;
  name: string;
  description: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  required: boolean;
  defaultValue?: any;
  validation?: RegExp;
  options?: string[]; // For enum-like values
}

export interface TemplateContext {
  testName: string;
  testDescription?: string;
  imports: string[];
  setup: string;
  teardown: string;
  testBody: string;
  selectors: string[];
  methods: string[];
  assertions: string[];
  variables: Record<string, any>;
  metadata: {
    framework: TestFormat;
    language: string;
    timestamp: number;
    generatedBy: string;
  };
}

/**
 * Template Engine for processing code templates
 */
export class TemplateEngine {
  private templates = new Map<string, CodeTemplate>();
  private customTemplates = new Map<string, CodeTemplate>();

  constructor() {
    this.loadBuiltInTemplates();
  }

  /**
   * Register a new template
   */
  registerTemplate(template: CodeTemplate): void {
    this.customTemplates.set(template.id, template);
  }

  /**
   * Get template by ID
   */
  getTemplate(id: string): CodeTemplate | null {
    return this.customTemplates.get(id) || this.templates.get(id) || null;
  }

  /**
   * Get all templates for a framework
   */
  getTemplatesForFramework(framework: TestFormat, language?: string): CodeTemplate[] {
    const allTemplates = [
      ...Array.from(this.templates.values()),
      ...Array.from(this.customTemplates.values())
    ];

    return allTemplates.filter(template => {
      const frameworkMatch = template.framework === framework;
      const languageMatch = !language || template.language === language;
      return frameworkMatch && languageMatch;
    });
  }

  /**
   * Render template with context
   */
  render(templateId: string, context: TemplateContext): string {
    const template = this.getTemplate(templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    return this.processTemplate(template.template, context);
  }

  /**
   * Process template string with placeholders
   */
  private processTemplate(templateStr: string, context: TemplateContext): string {
    let result = templateStr;

    // Replace simple placeholders
    result = result.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return this.getContextValue(context, key) || match;
    });

    // Process conditional blocks
    result = this.processConditionals(result, context);

    // Process loops
    result = this.processLoops(result, context);

    // Process includes
    result = this.processIncludes(result, context);

    return result;
  }

  /**
   * Get value from context
   */
  private getContextValue(context: TemplateContext, key: string): string {
    const keys = key.split('.');
    let value: any = context;

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return '';
      }
    }

    if (Array.isArray(value)) {
      return value.join('\n');
    }

    return String(value || '');
  }

  /**
   * Process conditional blocks
   */
  private processConditionals(template: string, context: TemplateContext): string {
    return template.replace(
      /\{\{#if\s+(.+?)\}\}(.*?)\{\{\/if\}\}/g,
      (match, condition, content) => {
        if (this.evaluateCondition(condition, context)) {
          return this.processTemplate(content, context);
        }
        return '';
      }
    );
  }

  /**
   * Process loop blocks
   */
  private processLoops(template: string, context: TemplateContext): string {
    return template.replace(
      /\{\{#each\s+(\w+)\s+as\s+(\w+)\}\}(.*?)\{\{\/each\}\}/g,
      (match, arrayKey, itemKey, content) => {
        const array = this.getContextValue(context, arrayKey);
        if (!Array.isArray(array)) {
          return '';
        }

        return array.map((item, index) => {
          const itemContext = {
            ...context,
            [itemKey]: item,
            [`${itemKey}_index`]: index,
            [`${itemKey}_first`]: index === 0,
            [`${itemKey}_last`]: index === array.length - 1
          };
          return this.processTemplate(content, itemContext);
        }).join('\n');
      }
    );
  }

  /**
   * Process includes
   */
  private processIncludes(template: string, context: TemplateContext): string {
    return template.replace(
      /\{\{>include\s+(.+?)\}\}/g,
      (match, templateId) => {
        const includedTemplate = this.getTemplate(templateId);
        if (includedTemplate) {
          return this.processTemplate(includedTemplate.template, context);
        }
        return `<!-- Template not found: ${templateId} -->`;
      }
    );
  }

  /**
   * Evaluate condition
   */
  private evaluateCondition(condition: string, context: TemplateContext): boolean {
    // Simple condition evaluation
    const trimmed = condition.trim();
    
    // Check for existence
    if (!trimmed.includes(' ')) {
      const value = this.getContextValue(context, trimmed);
      return Boolean(value && (Array.isArray(value) ? value.length > 0 : true));
    }

    // Handle simple comparisons
    const operators = ['===', '!==', '==', '!=', '>=', '<=', '>', '<'];
    for (const op of operators) {
      if (trimmed.includes(op)) {
        const [left, right] = trimmed.split(op).map(s => s.trim());
        const leftVal = this.getContextValue(context, left) || left.replace(/['"]/g, '');
        const rightVal = this.getContextValue(context, right) || right.replace(/['"]/g, '');
        
        switch (op) {
          case '===': return leftVal === rightVal;
          case '!==': return leftVal !== rightVal;
          case '==': return leftVal == rightVal;
          case '!=': return leftVal != rightVal;
          case '>=': return Number(leftVal) >= Number(rightVal);
          case '<=': return Number(leftVal) <= Number(rightVal);
          case '>': return Number(leftVal) > Number(rightVal);
          case '<': return Number(leftVal) < Number(rightVal);
        }
      }
    }

    return false;
  }

  /**
   * Validate template placeholders
   */
  validateContext(template: CodeTemplate, context: TemplateContext): string[] {
    const errors: string[] = [];

    for (const placeholder of template.placeholders) {
      const value = this.getContextValue(context, placeholder.key);

      if (placeholder.required && !value) {
        errors.push(`Required placeholder missing: ${placeholder.key}`);
      }

      if (value && placeholder.validation && !placeholder.validation.test(String(value))) {
        errors.push(`Invalid value for ${placeholder.key}: ${value}`);
      }

      if (placeholder.options && value && !placeholder.options.includes(String(value))) {
        errors.push(`Invalid option for ${placeholder.key}. Expected one of: ${placeholder.options.join(', ')}`);
      }
    }

    return errors;
  }

  /**
   * Create template from existing code
   */
  createTemplateFromCode(code: string, metadata: Partial<CodeTemplate>): CodeTemplate {
    // Extract placeholders from code
    const placeholders = this.extractPlaceholders(code);

    return {
      id: metadata.id || `custom-${Date.now()}`,
      name: metadata.name || 'Custom Template',
      description: metadata.description || 'Generated from existing code',
      framework: metadata.framework || 'playwright',
      language: metadata.language || 'javascript',
      category: metadata.category || 'test',
      template: code,
      placeholders,
      dependencies: metadata.dependencies || [],
      imports: metadata.imports || [],
    };
  }

  /**
   * Extract placeholders from template code
   */
  private extractPlaceholders(template: string): TemplatePlaceholder[] {
    const placeholders: TemplatePlaceholder[] = [];
    const placeholderRegex = /\{\{(\w+(?:\.\w+)*)\}\}/g;
    const found = new Set<string>();

    let match;
    while ((match = placeholderRegex.exec(template)) !== null) {
      const key = match[1];
      if (!found.has(key)) {
        found.add(key);
        placeholders.push({
          key,
          name: key.replace(/([A-Z])/g, ' $1').trim(),
          description: `Placeholder for ${key}`,
          type: 'string',
          required: true
        });
      }
    }

    return placeholders;
  }

  /**
   * Load built-in templates
   */
  private loadBuiltInTemplates(): void {
    // Playwright templates
    this.templates.set('playwright-js-basic', {
      id: 'playwright-js-basic',
      name: 'Playwright JavaScript Basic Test',
      description: 'Basic Playwright test template',
      framework: 'playwright',
      language: 'javascript',
      category: 'test',
      template: `const { test, expect } = require('@playwright/test');

test('{{testName}}', async ({ page }) => {
  {{#if setup}}
  // Setup
  {{setup}}
  {{/if}}

  {{testBody}}

  {{#if assertions}}
  // Assertions
  {{#each assertions as assertion}}
  {{assertion}}
  {{/each}}
  {{/if}}

  {{#if teardown}}
  // Teardown
  {{teardown}}
  {{/if}}
});`,
      placeholders: [
        {
          key: 'testName',
          name: 'Test Name',
          description: 'Name of the test case',
          type: 'string',
          required: true
        },
        {
          key: 'testBody',
          name: 'Test Body',
          description: 'Main test logic',
          type: 'string',
          required: true
        }
      ],
      dependencies: ['@playwright/test'],
      imports: ['const { test, expect } = require(\'@playwright/test\');']
    });

    this.templates.set('playwright-ts-basic', {
      id: 'playwright-ts-basic',
      name: 'Playwright TypeScript Basic Test',
      description: 'Basic Playwright test template with TypeScript',
      framework: 'playwright',
      language: 'typescript',
      category: 'test',
      template: `import { test, expect } from '@playwright/test';

test('{{testName}}', async ({ page }) => {
  {{#if setup}}
  // Setup
  {{setup}}
  {{/if}}

  {{testBody}}

  {{#if assertions}}
  // Assertions
  {{#each assertions as assertion}}
  {{assertion}}
  {{/each}}
  {{/if}}

  {{#if teardown}}
  // Teardown
  {{teardown}}
  {{/if}}
});`,
      placeholders: [
        {
          key: 'testName',
          name: 'Test Name',
          description: 'Name of the test case',
          type: 'string',
          required: true
        },
        {
          key: 'testBody',
          name: 'Test Body',
          description: 'Main test logic',
          type: 'string',
          required: true
        }
      ],
      dependencies: ['@playwright/test', 'typescript'],
      imports: ['import { test, expect } from \'@playwright/test\';']
    });

    // Cypress templates
    this.templates.set('cypress-js-basic', {
      id: 'cypress-js-basic',
      name: 'Cypress JavaScript Basic Test',
      description: 'Basic Cypress test template',
      framework: 'cypress',
      language: 'javascript',
      category: 'test',
      template: `describe('{{testDescription}}', () => {
  {{#if setup}}
  beforeEach(() => {
    {{setup}}
  });
  {{/if}}

  it('{{testName}}', () => {
    {{testBody}}
    
    {{#if assertions}}
    // Assertions
    {{#each assertions as assertion}}
    {{assertion}}
    {{/each}}
    {{/if}}
  });

  {{#if teardown}}
  afterEach(() => {
    {{teardown}}
  });
  {{/if}}
});`,
      placeholders: [
        {
          key: 'testName',
          name: 'Test Name',
          description: 'Name of the test case',
          type: 'string',
          required: true
        },
        {
          key: 'testDescription',
          name: 'Test Suite Description',
          description: 'Description for the test suite',
          type: 'string',
          required: true
        },
        {
          key: 'testBody',
          name: 'Test Body',
          description: 'Main test logic',
          type: 'string',
          required: true
        }
      ],
      dependencies: ['cypress'],
      imports: []
    });

    // Page Object Model templates
    this.templates.set('playwright-page-object', {
      id: 'playwright-page-object',
      name: 'Playwright Page Object',
      description: 'Page Object Model class for Playwright',
      framework: 'playwright',
      language: 'typescript',
      category: 'page-object',
      template: `import { Page, Locator } from '@playwright/test';

export class {{className}} {
  readonly page: Page;
  {{#each selectors as selector}}
  readonly {{selector.name}}: Locator;
  {{/each}}

  constructor(page: Page) {
    this.page = page;
    {{#each selectors as selector}}
    this.{{selector.name}} = page.locator('{{selector.value}}');
    {{/each}}
  }

  {{#each methods as method}}
  async {{method.name}}({{method.params}}): Promise<void> {
    {{method.body}}
  }

  {{/each}}
}`,
      placeholders: [
        {
          key: 'className',
          name: 'Class Name',
          description: 'Name of the page object class',
          type: 'string',
          required: true
        }
      ],
      dependencies: ['@playwright/test'],
      imports: ['import { Page, Locator } from \'@playwright/test\';']
    });

    // Add more built-in templates for other frameworks...
  }

  /**
   * Export template as JSON
   */
  exportTemplate(templateId: string): string {
    const template = this.getTemplate(templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }
    return JSON.stringify(template, null, 2);
  }

  /**
   * Import template from JSON
   */
  importTemplate(json: string): void {
    try {
      const template = JSON.parse(json) as CodeTemplate;
      this.registerTemplate(template);
    } catch (error) {
      throw new Error('Invalid template JSON');
    }
  }

  /**
   * Clone template with modifications
   */
  cloneTemplate(templateId: string, modifications: Partial<CodeTemplate>): CodeTemplate {
    const original = this.getTemplate(templateId);
    if (!original) {
      throw new Error(`Template not found: ${templateId}`);
    }

    const cloned: CodeTemplate = {
      ...original,
      ...modifications,
      id: modifications.id || `${original.id}-clone-${Date.now()}`,
      placeholders: [...original.placeholders]
    };

    return cloned;
  }
}

export default TemplateEngine;