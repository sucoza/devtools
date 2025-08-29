/**
 * Built-in Templates for Code Generation
 * Comprehensive collection of templates for different frameworks and patterns
 */

import type { CodeTemplate } from './template-engine';

export const builtInTemplates: CodeTemplate[] = [
  // ================================
  // PLAYWRIGHT TEMPLATES
  // ================================
  {
    id: 'playwright-js-basic',
    name: 'Playwright JavaScript Basic Test',
    description: 'Basic Playwright test with JavaScript',
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
  },

  {
    id: 'playwright-ts-advanced',
    name: 'Playwright TypeScript Advanced Test',
    description: 'Advanced Playwright test with fixtures and custom hooks',
    framework: 'playwright',
    language: 'typescript',
    category: 'test',
    template: `import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

// Custom fixture type
type TestFixtures = {
  authenticatedPage: Page;
};

const authTest = test.extend<TestFixtures>({
  authenticatedPage: async ({ page }, use) => {
    // Login logic here
    {{#if loginSetup}}
    {{loginSetup}}
    {{/if}}
    await use(page);
  },
});

authTest.describe('{{testSuite}}', () => {
  authTest.beforeEach(async ({ page }) => {
    {{#if beforeEach}}
    {{beforeEach}}
    {{/if}}
  });

  authTest('{{testName}}', async ({ authenticatedPage: page }) => {
    {{testBody}}

    {{#if assertions}}
    // Assertions
    {{#each assertions as assertion}}
    {{assertion}}
    {{/each}}
    {{/if}}
  });

  authTest.afterEach(async ({ page }) => {
    {{#if afterEach}}
    {{afterEach}}
    {{/if}}
  });
});`,
    placeholders: [
      {
        key: 'testSuite',
        name: 'Test Suite Name',
        description: 'Name of the test suite',
        type: 'string',
        required: true
      },
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
  },

  // ================================
  // CYPRESS TEMPLATES
  // ================================
  {
    id: 'cypress-js-e2e',
    name: 'Cypress E2E JavaScript Test',
    description: 'End-to-end Cypress test with JavaScript',
    framework: 'cypress',
    language: 'javascript',
    category: 'test',
    template: `describe('{{testSuite}}', () => {
  beforeEach(() => {
    {{#if setup}}
    {{setup}}
    {{/if}}
    cy.viewport({{viewport.width}}, {{viewport.height}});
  });

  it('{{testName}}', () => {
    {{testBody}}
    
    {{#if assertions}}
    // Verify results
    {{#each assertions as assertion}}
    {{assertion}}
    {{/each}}
    {{/if}}
  });

  afterEach(() => {
    {{#if teardown}}
    {{teardown}}
    {{/if}}
  });
});`,
    placeholders: [
      {
        key: 'testSuite',
        name: 'Test Suite Name',
        description: 'Name of the test suite',
        type: 'string',
        required: true
      },
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
    dependencies: ['cypress'],
    imports: []
  },

  {
    id: 'cypress-ts-api',
    name: 'Cypress API Test TypeScript',
    description: 'API testing template for Cypress with TypeScript',
    framework: 'cypress',
    language: 'typescript',
    category: 'test',
    template: `/// <reference types="cypress" />

interface ApiResponse {
  {{#each apiTypes as type}}
  {{type.name}}: {{type.type}};
  {{/each}}
}

describe('{{testSuite}} API Tests', () => {
  beforeEach(() => {
    {{#if apiSetup}}
    {{apiSetup}}
    {{/if}}
  });

  it('{{testName}}', () => {
    cy.request<ApiResponse>({
      method: '{{httpMethod}}',
      url: '{{apiEndpoint}}',
      {{#if requestBody}}
      body: {{requestBody}},
      {{/if}}
      headers: {
        'Content-Type': 'application/json',
        {{#if authHeader}}
        'Authorization': '{{authHeader}}',
        {{/if}}
      }
    }).then((response) => {
      expect(response.status).to.eq({{expectedStatus}});
      {{#if responseAssertions}}
      {{#each responseAssertions as assertion}}
      {{assertion}}
      {{/each}}
      {{/if}}
    });
  });
});`,
    placeholders: [
      {
        key: 'testSuite',
        name: 'Test Suite Name',
        description: 'Name of the API test suite',
        type: 'string',
        required: true
      },
      {
        key: 'testName',
        name: 'Test Name',
        description: 'Name of the test case',
        type: 'string',
        required: true
      },
      {
        key: 'httpMethod',
        name: 'HTTP Method',
        description: 'HTTP method for the API call',
        type: 'string',
        required: true,
        options: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
      },
      {
        key: 'apiEndpoint',
        name: 'API Endpoint',
        description: 'URL of the API endpoint',
        type: 'string',
        required: true
      },
      {
        key: 'expectedStatus',
        name: 'Expected Status Code',
        description: 'Expected HTTP status code',
        type: 'number',
        required: true,
        defaultValue: 200
      }
    ],
    dependencies: ['cypress', 'typescript'],
    imports: ['/// <reference types="cypress" />']
  },

  // ================================
  // SELENIUM TEMPLATES
  // ================================
  {
    id: 'selenium-python-unittest',
    name: 'Selenium Python unittest',
    description: 'Selenium WebDriver test using Python unittest',
    framework: 'selenium',
    language: 'python',
    category: 'test',
    template: `import unittest
import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.support.ui import WebDriverWait, Select
from selenium.webdriver.support import expected_conditions as EC

class {{className}}(unittest.TestCase):
    def setUp(self):
        self.driver = webdriver.{{browser}}()
        self.driver.implicitly_wait({{timeout}})
        {{#if setup}}
        {{setup}}
        {{/if}}
    
    def test_{{testMethodName}}(self):
        """{{testDescription}}"""
        {{testBody}}
        
        {{#if assertions}}
        # Assertions
        {{#each assertions as assertion}}
        {{assertion}}
        {{/each}}
        {{/if}}
    
    def tearDown(self):
        {{#if teardown}}
        {{teardown}}
        {{/if}}
        self.driver.quit()

if __name__ == "__main__":
    unittest.main()`,
    placeholders: [
      {
        key: 'className',
        name: 'Test Class Name',
        description: 'Name of the test class',
        type: 'string',
        required: true
      },
      {
        key: 'testMethodName',
        name: 'Test Method Name',
        description: 'Name of the test method',
        type: 'string',
        required: true
      },
      {
        key: 'testDescription',
        name: 'Test Description',
        description: 'Description of what the test does',
        type: 'string',
        required: true
      },
      {
        key: 'browser',
        name: 'Browser',
        description: 'WebDriver browser to use',
        type: 'string',
        required: true,
        defaultValue: 'Chrome',
        options: ['Chrome', 'Firefox', 'Edge', 'Safari']
      },
      {
        key: 'timeout',
        name: 'Timeout',
        description: 'Implicit wait timeout in seconds',
        type: 'number',
        required: true,
        defaultValue: 10
      },
      {
        key: 'testBody',
        name: 'Test Body',
        description: 'Main test logic',
        type: 'string',
        required: true
      }
    ],
    dependencies: ['selenium'],
    imports: []
  },

  {
    id: 'selenium-csharp-nunit',
    name: 'Selenium C# NUnit Test',
    description: 'Selenium WebDriver test using C# and NUnit',
    framework: 'selenium',
    language: 'csharp',
    category: 'test',
    template: `using System;
using NUnit.Framework;
using OpenQA.Selenium;
using OpenQA.Selenium.Chrome;
using OpenQA.Selenium.Support.UI;
using OpenQA.Selenium.Interactions;

namespace {{namespace}}
{
    [TestFixture]
    public class {{className}}
    {
        private IWebDriver driver;
        private WebDriverWait wait;

        [SetUp]
        public void SetUp()
        {
            driver = new ChromeDriver();
            driver.Manage().Timeouts().ImplicitWait = TimeSpan.FromSeconds({{timeout}});
            wait = new WebDriverWait(driver, TimeSpan.FromSeconds({{timeout}});
            {{#if setup}}
            {{setup}}
            {{/if}}
        }

        [Test]
        public void {{testMethodName}}()
        {
            // {{testDescription}}
            {{testBody}}
            
            {{#if assertions}}
            // Assertions
            {{#each assertions as assertion}}
            {{assertion}}
            {{/each}}
            {{/if}}
        }

        [TearDown]
        public void TearDown()
        {
            {{#if teardown}}
            {{teardown}}
            {{/if}}
            driver?.Quit();
        }
    }
}`,
    placeholders: [
      {
        key: 'namespace',
        name: 'Namespace',
        description: 'C# namespace for the test class',
        type: 'string',
        required: true,
        defaultValue: 'SeleniumTests'
      },
      {
        key: 'className',
        name: 'Test Class Name',
        description: 'Name of the test class',
        type: 'string',
        required: true
      },
      {
        key: 'testMethodName',
        name: 'Test Method Name',
        description: 'Name of the test method',
        type: 'string',
        required: true
      },
      {
        key: 'testDescription',
        name: 'Test Description',
        description: 'Description of what the test does',
        type: 'string',
        required: true
      },
      {
        key: 'timeout',
        name: 'Timeout',
        description: 'Wait timeout in seconds',
        type: 'number',
        required: true,
        defaultValue: 10
      },
      {
        key: 'testBody',
        name: 'Test Body',
        description: 'Main test logic',
        type: 'string',
        required: true
      }
    ],
    dependencies: ['Selenium.WebDriver', 'NUnit', 'Selenium.Support'],
    imports: []
  },

  // ================================
  // PUPPETEER TEMPLATES
  // ================================
  {
    id: 'puppeteer-jest-basic',
    name: 'Puppeteer Jest Basic Test',
    description: 'Basic Puppeteer test with Jest framework',
    framework: 'puppeteer',
    language: 'javascript',
    category: 'test',
    template: `const puppeteer = require('puppeteer');

describe('{{testSuite}}', () => {
  let browser;
  let page;

  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: {{headless}},
      defaultViewport: { width: {{viewport.width}}, height: {{viewport.height}} }
    });
  });

  beforeEach(async () => {
    page = await browser.newPage();
    {{#if setup}}
    {{setup}}
    {{/if}}
  });

  afterEach(async () => {
    if (page) {
      await page.close();
    }
  });

  afterAll(async () => {
    if (browser) {
      await browser.close();
    }
  });

  test('{{testName}}', async () => {
    {{testBody}}

    {{#if assertions}}
    // Assertions
    {{#each assertions as assertion}}
    {{assertion}}
    {{/each}}
    {{/if}}
  });
});`,
    placeholders: [
      {
        key: 'testSuite',
        name: 'Test Suite Name',
        description: 'Name of the test suite',
        type: 'string',
        required: true
      },
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
      },
      {
        key: 'headless',
        name: 'Headless Mode',
        description: 'Run browser in headless mode',
        type: 'boolean',
        required: true,
        defaultValue: true
      }
    ],
    dependencies: ['puppeteer', 'jest'],
    imports: []
  },

  // ================================
  // PAGE OBJECT MODEL TEMPLATES
  // ================================
  {
    id: 'playwright-page-object-ts',
    name: 'Playwright Page Object TypeScript',
    description: 'Page Object Model class for Playwright with TypeScript',
    framework: 'playwright',
    language: 'typescript',
    category: 'page-object',
    template: `import { Page, Locator } from '@playwright/test';

export class {{className}} {
  readonly page: Page;
  
  // Selectors
  {{#each selectors as selector}}
  readonly {{selector.name}}: Locator;
  {{/each}}

  constructor(page: Page) {
    this.page = page;
    {{#each selectors as selector}}
    this.{{selector.name}} = page.locator('{{selector.value}}');
    {{/each}}
  }

  // Navigation methods
  async navigateTo(): Promise<void> {
    await this.page.goto('{{pageUrl}}');
  }

  {{#each methods as method}}
  async {{method.name}}({{method.params}}): Promise<{{method.returnType}}> {
    {{method.body}}
    {{#if method.returnsSelf}}
    return this;
    {{/if}}
  }

  {{/each}}

  // Utility methods
  async waitForPageLoad(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
  }

  async takeScreenshot(name: string): Promise<void> {
    await this.page.screenshot({ path: \`screenshots/\${name}.png\` });
  }
}`,
    placeholders: [
      {
        key: 'className',
        name: 'Page Object Class Name',
        description: 'Name of the page object class',
        type: 'string',
        required: true
      },
      {
        key: 'pageUrl',
        name: 'Page URL',
        description: 'URL of the page this object represents',
        type: 'string',
        required: true
      }
    ],
    dependencies: ['@playwright/test'],
    imports: ['import { Page, Locator } from \'@playwright/test\';']
  },

  {
    id: 'cypress-page-object-js',
    name: 'Cypress Page Object JavaScript',
    description: 'Page Object Model class for Cypress with JavaScript',
    framework: 'cypress',
    language: 'javascript',
    category: 'page-object',
    template: `class {{className}} {
  constructor() {
    // Selectors
    {{#each selectors as selector}}
    this.{{selector.name}} = '{{selector.value}}';
    {{/each}}
  }

  // Element getters
  {{#each selectors as selector}}
  get{{selector.capitalizedName}}() {
    return cy.get(this.{{selector.name}});
  }

  {{/each}}

  // Navigation methods
  visit() {
    cy.visit('{{pageUrl}}');
    return this;
  }

  {{#each methods as method}}
  {{method.name}}({{method.params}}) {
    {{method.body}}
    return this;
  }

  {{/each}}

  // Utility methods
  waitForLoad() {
    cy.url().should('include', '{{urlPattern}}');
    return this;
  }

  takeScreenshot(name) {
    cy.screenshot(name);
    return this;
  }
}

export default new {{className}}();`,
    placeholders: [
      {
        key: 'className',
        name: 'Page Object Class Name',
        description: 'Name of the page object class',
        type: 'string',
        required: true
      },
      {
        key: 'pageUrl',
        name: 'Page URL',
        description: 'URL of the page this object represents',
        type: 'string',
        required: true
      },
      {
        key: 'urlPattern',
        name: 'URL Pattern',
        description: 'Pattern to match in URL for page load verification',
        type: 'string',
        required: true
      }
    ],
    dependencies: ['cypress'],
    imports: []
  },

  // ================================
  // CONFIGURATION TEMPLATES
  // ================================
  {
    id: 'playwright-config-ts',
    name: 'Playwright Configuration TypeScript',
    description: 'Playwright configuration file with TypeScript',
    framework: 'playwright',
    language: 'typescript',
    category: 'config',
    template: `import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './{{testDir}}',
  fullyParallel: {{fullyParallel}},
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? {{retriesCI}} : {{retriesLocal}},
  workers: process.env.CI ? {{workersCI}} : {{workersLocal}},
  reporter: [
    {{#each reporters as reporter}}
    ['{{reporter.type}}'{{#if reporter.options}}, {{reporter.options}}{{/if}}],
    {{/each}}
  ],
  use: {
    baseURL: '{{baseURL}}',
    trace: '{{traceMode}}',
    screenshot: '{{screenshotMode}}',
    video: '{{videoMode}}',
    actionTimeout: {{actionTimeout}},
    navigationTimeout: {{navigationTimeout}},
  },

  projects: [
    {{#each browsers as browser}}
    {
      name: '{{browser.name}}',
      use: { ...devices['{{browser.device}}'] },
      {{#if browser.testDir}}
      testDir: '{{browser.testDir}}',
      {{/if}}
    },
    {{/each}}
  ],

  {{#if webServer}}
  webServer: {
    command: '{{webServer.command}}',
    port: {{webServer.port}},
    reuseExistingServer: !process.env.CI,
  },
  {{/if}}
});`,
    placeholders: [
      {
        key: 'testDir',
        name: 'Test Directory',
        description: 'Directory containing test files',
        type: 'string',
        required: true,
        defaultValue: 'tests'
      },
      {
        key: 'baseURL',
        name: 'Base URL',
        description: 'Base URL for the application under test',
        type: 'string',
        required: true
      },
      {
        key: 'fullyParallel',
        name: 'Fully Parallel',
        description: 'Run tests in parallel',
        type: 'boolean',
        required: true,
        defaultValue: true
      },
      {
        key: 'actionTimeout',
        name: 'Action Timeout',
        description: 'Timeout for actions in milliseconds',
        type: 'number',
        required: true,
        defaultValue: 30000
      }
    ],
    dependencies: ['@playwright/test'],
    imports: []
  },

  // ================================
  // HELPER TEMPLATES
  // ================================
  {
    id: 'test-data-helper',
    name: 'Test Data Helper',
    description: 'Utility class for managing test data',
    framework: 'playwright',
    language: 'typescript',
    category: 'helper',
    template: `export interface {{interfaceName}} {
  {{#each dataFields as field}}
  {{field.name}}: {{field.type}};
  {{/each}}
}

export class {{className}} {
  private static instance: {{className}};
  private testData: Map<string, any> = new Map();

  static getInstance(): {{className}} {
    if (!{{className}}.instance) {
      {{className}}.instance = new {{className}}();
    }
    return {{className}}.instance;
  }

  // Data generation methods
  {{#each generators as generator}}
  generate{{generator.name}}(): {{generator.returnType}} {
    {{generator.body}}
  }

  {{/each}}

  // Data storage methods
  store(key: string, value: any): void {
    this.testData.set(key, value);
  }

  retrieve<T>(key: string): T | undefined {
    return this.testData.get(key) as T;
  }

  clear(): void {
    this.testData.clear();
  }

  // Utility methods
  randomString(length: number = 10): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  randomEmail(): string {
    return \`test\${this.randomString(5)}@example.com\`;
  }

  randomNumber(min: number = 1, max: number = 100): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}

export const TestData = {{className}}.getInstance();`,
    placeholders: [
      {
        key: 'className',
        name: 'Class Name',
        description: 'Name of the test data helper class',
        type: 'string',
        required: true
      },
      {
        key: 'interfaceName',
        name: 'Interface Name',
        description: 'Name of the test data interface',
        type: 'string',
        required: true
      }
    ],
    dependencies: [],
    imports: []
  }
];

export default builtInTemplates;