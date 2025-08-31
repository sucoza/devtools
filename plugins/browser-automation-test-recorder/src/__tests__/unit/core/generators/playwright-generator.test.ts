/**
 * Unit tests for Playwright Code Generator
 * Tests the generation of Playwright test code from recorded events
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PlaywrightGenerator } from '../../../../core/generators/playwright-generator';
import { 
  createMockRecordedEvent, 
  createMockLoginFlow, 
  createMockUserFlow,
  resetCounters 
} from '../../../__mocks__/test-data-factory';
import type { TestGenerationOptions, RecordedEvent } from '../../../../types';

describe('PlaywrightGenerator', () => {
  let generator: PlaywrightGenerator;
  let mockEvents: RecordedEvent[];
  
  // Define defaultOptions at the describe level so it's accessible everywhere
  const defaultOptions: TestGenerationOptions = {
    format: 'typescript',
    framework: 'playwright',
    includeComments: true,
    includeAssertions: true,
    includeSetup: true,
    testName: 'Generated Login Test',
    outputPath: './tests/generated/',
    optimization: {
        combineSelectors: true,
        removeRedundantWaits: true,
        optimizeAssertions: true,
      },
    };

  beforeEach(() => {
    resetCounters();
    generator = new PlaywrightGenerator();
    mockEvents = createMockLoginFlow();
  });

  describe('Constructor', () => {
    it('should initialize with correct framework info', () => {
      expect(generator.name).toBe('playwright');
      expect(generator.version).toBeDefined();
      expect(generator.description).toContain('Playwright');
    });

    it('should have default configuration', () => {
      const config = generator.getConfiguration();
      expect(config).toBeDefined();
      expect(config.language).toBe('typescript');
      expect(config.testFramework).toBe('@playwright/test');
    });
  });

  describe('generateTestCode', () => {
    it('should generate basic test structure', async () => {
      const result = await generator.generateTestCode(mockEvents, defaultOptions);

      expect(result.code).toBeDefined();
      expect(result.code).toContain("import { test, expect } from '@playwright/test'");
      expect(result.code).toContain("test('Generated Login Test'");
      expect(result.code).toContain('async ({ page }) => {');
      expect(result.code).toContain('});');
    });

    it('should generate navigation commands', async () => {
      const result = await generator.generateTestCode(mockEvents, defaultOptions);

      expect(result.code).toContain("await page.goto('https://example.com/login')");
    });

    it('should generate click commands', async () => {
      const result = await generator.generateTestCode(mockEvents, defaultOptions);

      expect(result.code).toContain("await page.click('#username')");
      expect(result.code).toContain("await page.click('#password')");
      expect(result.code).toContain("await page.click('#login-button')");
    });

    it('should generate input commands', async () => {
      const result = await generator.generateTestCode(mockEvents, defaultOptions);

      expect(result.code).toContain("await page.fill('#username', 'testuser')");
      expect(result.code).toContain("await page.fill('#password', 'password123')");
    });

    it('should include imports when requested', async () => {
      const result = await generator.generateTestCode(mockEvents, defaultOptions);

      expect(result.code).toContain("import { test, expect } from '@playwright/test'");
    });

    it('should include setup code when requested', async () => {
      const result = await generator.generateTestCode(mockEvents, defaultOptions);

      expect(result.code).toContain('test.beforeEach');
      expect(result.code).toContain('test.afterEach');
    });

    it('should include comments when requested', async () => {
      const result = await generator.generateTestCode(mockEvents, defaultOptions);

      expect(result.code).toContain('// Navigate to login page');
      expect(result.code).toContain('// Click username field');
      expect(result.code).toContain('// Fill username');
    });

    it('should exclude comments when not requested', async () => {
      const optionsWithoutComments = {
        ...defaultOptions,
        includeComments: false,
      };

      const result = await generator.generateTestCode(mockEvents, optionsWithoutComments);

      expect(result.code).not.toContain('// Navigate to');
      expect(result.code).not.toContain('// Click');
      expect(result.code).not.toContain('// Fill');
    });

    it('should generate JavaScript code when specified', async () => {
      const jsOptions: TestGenerationOptions = {
        ...defaultOptions,
        format: 'javascript',
      };

      const result = await generator.generateTestCode(mockEvents, jsOptions);

      expect(result.code).toContain("const { test, expect } = require('@playwright/test')");
      expect(result.code).not.toContain(': Page');
      expect(result.code).not.toContain('async ({ page }): Promise<void>');
    });

    it('should handle custom test names', async () => {
      const customOptions = {
        ...defaultOptions,
        testName: 'Custom Login Flow Test',
      };

      const result = await generator.generateTestCode(mockEvents, customOptions);

      expect(result.code).toContain("test('Custom Login Flow Test'");
    });

    it('should generate assertions when requested', async () => {
      const eventsWithAssertion = [
        ...mockEvents,
        createMockRecordedEvent('assertion', {
          data: {
            type: 'assertion',
            assertionType: 'element-visible',
            expected: true,
            message: 'Login success message should be visible',
          },
          target: {
            ...createMockRecordedEvent().target,
            selector: '#success-message',
          },
        }),
      ];

      const result = await generator.generateTestCode(eventsWithAssertion, defaultOptions);

      expect(result.code).toContain("await expect(page.locator('#success-message')).toBeVisible()");
    });
  });

  describe('generateSelectorCommand', () => {
    it('should generate click commands', () => {
      const clickEvent = createMockRecordedEvent('click');
      const command = generator.generateSelectorCommand(clickEvent);

      expect(command).toContain("await page.click('#test-button')");
    });

    it('should generate fill commands for input events', () => {
      const inputEvent = createMockRecordedEvent('input', {
        data: {
          type: 'keyboard',
          key: 'a',
          code: 'KeyA',
          keyCode: 65,
          charCode: 97,
          ctrlKey: false,
          shiftKey: false,
          altKey: false,
          metaKey: false,
          repeat: false,
          inputValue: 'test value',
        },
        target: {
          ...createMockRecordedEvent().target,
          selector: '#input-field',
          tagName: 'INPUT',
          value: 'test value',
        },
      });

      const command = generator.generateSelectorCommand(inputEvent);

      expect(command).toContain("await page.fill('#input-field', 'test value')");
    });

    it('should generate navigation commands', () => {
      const navEvent = createMockRecordedEvent('navigation', {
        data: {
          type: 'navigation',
          url: 'https://example.com/page',
          title: 'Test Page',
          referrer: 'https://example.com/',
          method: 'GET',
          headers: {},
          timestamp: Date.now(),
        },
      });

      const command = generator.generateSelectorCommand(navEvent);

      expect(command).toContain("await page.goto('https://example.com/page')");
    });

    it('should handle keyboard events', () => {
      const keyEvent = createMockRecordedEvent('keydown', {
        data: {
          type: 'keyboard',
          key: 'Enter',
          code: 'Enter',
          keyCode: 13,
          charCode: 0,
          ctrlKey: false,
          shiftKey: false,
          altKey: false,
          metaKey: false,
          repeat: false,
        },
      });

      const command = generator.generateSelectorCommand(keyEvent);

      expect(command).toContain("await page.press('#test-button', 'Enter')");
    });

    it('should handle scroll events', () => {
      const scrollEvent = createMockRecordedEvent('scroll', {
        data: {
          type: 'scroll',
          scrollX: 0,
          scrollY: 100,
          scrollTop: 100,
          scrollLeft: 0,
          element: 'window',
        },
      });

      const command = generator.generateSelectorCommand(scrollEvent);

      expect(command).toContain('await page.evaluate(() => window.scrollTo(0, 100))');
    });

    it('should escape special characters in selectors', () => {
      const eventWithSpecialChars = createMockRecordedEvent('click', {
        target: {
          ...createMockRecordedEvent().target,
          selector: '[data-test="input[with]brackets"]',
        },
      });

      const command = generator.generateSelectorCommand(eventWithSpecialChars);

      expect(command).toBeDefined();
      expect(command).toContain("await page.click(");
    });
  });

  describe('generateAssertions', () => {
    it('should generate visibility assertions', () => {
      const assertion = generator.generateAssertion({
        type: 'element-visible',
        selector: '#success-message',
        expected: true,
        description: 'Success message should be visible',
      });

      expect(assertion).toBe("await expect(page.locator('#success-message')).toBeVisible();");
    });

    it('should generate text assertions', () => {
      const assertion = generator.generateAssertion({
        type: 'element-text',
        selector: '#message',
        expected: 'Welcome!',
        description: 'Message should contain welcome text',
      });

      expect(assertion).toBe("await expect(page.locator('#message')).toHaveText('Welcome!');");
    });

    it('should generate value assertions', () => {
      const assertion = generator.generateAssertion({
        type: 'element-value',
        selector: '#input-field',
        expected: 'test value',
        description: 'Input should have correct value',
      });

      expect(assertion).toBe("await expect(page.locator('#input-field')).toHaveValue('test value');");
    });

    it('should generate count assertions', () => {
      const assertion = generator.generateAssertion({
        type: 'element-count',
        selector: '.list-item',
        expected: 5,
        description: 'Should have 5 list items',
      });

      expect(assertion).toBe("await expect(page.locator('.list-item')).toHaveCount(5);");
    });

    it('should generate URL assertions', () => {
      const assertion = generator.generateAssertion({
        type: 'page-url',
        selector: '',
        expected: 'https://example.com/dashboard',
        description: 'Should navigate to dashboard',
      });

      expect(assertion).toBe("await expect(page).toHaveURL('https://example.com/dashboard');");
    });
  });

  describe('generateWaitCommands', () => {
    it('should generate wait for selector commands', () => {
      const wait = generator.generateWaitCommand({
        type: 'element',
        selector: '#loading-spinner',
        condition: 'visible',
        timeout: 5000,
      });

      expect(wait).toBe("await page.waitForSelector('#loading-spinner', { state: 'visible', timeout: 5000 });");
    });

    it('should generate wait for navigation commands', () => {
      const wait = generator.generateWaitCommand({
        type: 'navigation',
        timeout: 10000,
      });

      expect(wait).toBe('await page.waitForNavigation({ timeout: 10000 });');
    });

    it('should generate timeout waits', () => {
      const wait = generator.generateWaitCommand({
        type: 'timeout',
        duration: 2000,
      });

      expect(wait).toBe('await page.waitForTimeout(2000);');
    });
  });

  describe('optimizeCode', () => {
    it('should combine consecutive waits', () => {
      const commands = [
        "await page.click('#button1')",
        "await page.waitForTimeout(1000)",
        "await page.waitForTimeout(500)",
        "await page.click('#button2')",
      ];

      const optimized = generator.optimizeCommands(commands);

      expect(optimized).toHaveLength(3);
      expect(optimized[1]).toBe('await page.waitForTimeout(1500)');
    });

    it('should remove redundant selectors', () => {
      const commands = [
        "await page.click('#button')",
        "await page.click('#button')",
        "await page.fill('#input', 'value')",
      ];

      const optimized = generator.optimizeCommands(commands);

      expect(optimized).toHaveLength(2);
      expect(optimized[0]).toBe("await page.click('#button')");
      expect(optimized[1]).toBe("await page.fill('#input', 'value')");
    });

    it('should simplify complex selectors', () => {
      const commands = [
        "await page.click('html > body > div.container > div.row > div.col > button#submit')",
      ];

      const optimized = generator.optimizeCommands(commands);

      expect(optimized[0]).toContain('#submit');
      expect(optimized[0].length).toBeLessThan(commands[0].length);
    });
  });

  describe('generateTestConfiguration', () => {
    it('should generate basic test configuration', () => {
      const config = generator.generateConfiguration({
        format: 'typescript',
        framework: 'playwright',
        includeSetup: true,
      });

      expect(config.code).toContain("import { defineConfig } from '@playwright/test'");
      expect(config.code).toContain('export default defineConfig');
      expect(config.filename).toBe('playwright.config.ts');
    });

    it('should include custom browser settings', () => {
      const config = generator.generateConfiguration({
        format: 'typescript',
        framework: 'playwright',
        includeSetup: true,
        browserSettings: {
          headless: false,
          slowMo: 1000,
          viewport: { width: 1280, height: 720 },
        },
      });

      expect(config.code).toContain('headless: false');
      expect(config.code).toContain('slowMo: 1000');
    });

    it('should generate JavaScript configuration', () => {
      const config = generator.generateConfiguration({
        format: 'javascript',
        framework: 'playwright',
        includeSetup: true,
      });

      expect(config.code).toContain("const { defineConfig } = require('@playwright/test')");
      expect(config.code).toContain('module.exports = defineConfig');
      expect(config.filename).toBe('playwright.config.js');
    });
  });

  describe('generatePackageJson', () => {
    it('should generate package.json with Playwright dependencies', () => {
      const packageJson = generator.generatePackageJson({
        format: 'typescript',
        framework: 'playwright',
      });

      const parsed = JSON.parse(packageJson);
      expect(parsed.devDependencies).toHaveProperty('@playwright/test');
      expect(parsed.scripts).toHaveProperty('test');
      expect(parsed.scripts.test).toContain('playwright test');
    });

    it('should include TypeScript dependencies for TS projects', () => {
      const packageJson = generator.generatePackageJson({
        format: 'typescript',
        framework: 'playwright',
      });

      const parsed = JSON.parse(packageJson);
      expect(parsed.devDependencies).toHaveProperty('typescript');
      expect(parsed.devDependencies).toHaveProperty('@types/node');
    });

    it('should not include TypeScript for JS projects', () => {
      const packageJson = generator.generatePackageJson({
        format: 'javascript',
        framework: 'playwright',
      });

      const parsed = JSON.parse(packageJson);
      expect(parsed.devDependencies).not.toHaveProperty('typescript');
    });
  });

  describe('Complex Scenarios', () => {
    it('should handle form submission flows', async () => {
      const formEvents = [
        createMockRecordedEvent('navigation'),
        createMockRecordedEvent('click', {
          target: { ...createMockRecordedEvent().target, selector: '#name' },
        }),
        createMockRecordedEvent('input', {
          target: { ...createMockRecordedEvent().target, selector: '#name', value: 'John Doe' },
          data: { type: 'keyboard', inputValue: 'John Doe' } as any,
        }),
        createMockRecordedEvent('click', {
          target: { ...createMockRecordedEvent().target, selector: '#email' },
        }),
        createMockRecordedEvent('input', {
          target: { ...createMockRecordedEvent().target, selector: '#email', value: 'john@example.com' },
          data: { type: 'keyboard', inputValue: 'john@example.com' } as any,
        }),
        createMockRecordedEvent('submit', {
          target: { ...createMockRecordedEvent().target, selector: '#form' },
        }),
      ];

      const result = await generator.generateTestCode(formEvents, defaultOptions);

      expect(result.code).toContain("await page.fill('#name', 'John Doe')");
      expect(result.code).toContain("await page.fill('#email', 'john@example.com')");
      expect(result.code).toContain("await page.click('#form')");
    });

    it('should handle multi-page navigation', async () => {
      const multiPageEvents = [
        createMockRecordedEvent('navigation', {
          data: { type: 'navigation', url: 'https://example.com/page1' } as any,
        }),
        createMockRecordedEvent('click'),
        createMockRecordedEvent('navigation', {
          data: { type: 'navigation', url: 'https://example.com/page2' } as any,
        }),
        createMockRecordedEvent('click'),
      ];

      const result = await generator.generateTestCode(multiPageEvents, defaultOptions);

      expect(result.code).toContain("await page.goto('https://example.com/page1')");
      expect(result.code).toContain("await page.goto('https://example.com/page2')");
    });

    it('should handle dropdown and select interactions', async () => {
      const selectEvent = createMockRecordedEvent('change', {
        target: {
          ...createMockRecordedEvent().target,
          selector: '#country-select',
          tagName: 'SELECT',
        },
        data: {
          type: 'form',
          eventType: 'change',
          value: 'USA',
          selectedOptions: ['USA'],
        } as any,
      });

      const result = await generator.generateTestCode([selectEvent], defaultOptions);

      expect(result.code).toContain("await page.selectOption('#country-select', 'USA')");
    });
  });

  describe('Error Handling', () => {
    it('should handle empty event arrays', async () => {
      const result = await generator.generateTestCode([], defaultOptions);

      expect(result.code).toContain("test('Generated Login Test'");
      expect(result.code).toContain('// No events recorded');
    });

    it('should handle events with missing data', async () => {
      const invalidEvent = {
        ...createMockRecordedEvent('click'),
        data: null as any,
      };

      const result = await generator.generateTestCode([invalidEvent], defaultOptions);

      expect(result.code).toBeDefined();
      expect(result.metadata.warnings).toContain('Skipped event with missing data');
    });

    it('should handle invalid selectors gracefully', async () => {
      const eventWithBadSelector = createMockRecordedEvent('click', {
        target: {
          ...createMockRecordedEvent().target,
          selector: '',
        },
      });

      const result = await generator.generateTestCode([eventWithBadSelector], defaultOptions);

      expect(result.code).toBeDefined();
      expect(result.metadata.warnings?.length).toBeGreaterThan(0);
    });
  });
});