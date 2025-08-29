/**
 * End-to-End Tests for Browser Automation Plugin
 * Real browser automation testing using Playwright
 */

import { test, expect, Page, BrowserContext } from '@playwright/test';

test.describe('Browser Automation DevTools Plugin', () => {
  let context: BrowserContext;
  let page: Page;
  let devToolsPage: Page;

  test.beforeAll(async ({ browser }) => {
    // Create context with DevTools enabled
    context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      hasTouch: false,
    });
  });

  test.beforeEach(async () => {
    // Create main page and devtools page
    page = await context.newPage();
    devToolsPage = await context.newPage();
    
    // Navigate to test application
    await page.goto('/example');
    
    // Navigate devtools page to plugin
    await devToolsPage.goto('/devtools-panel');
    
    // Wait for plugin to load
    await devToolsPage.waitForSelector('[data-testid="browser-automation-panel"]');
  });

  test.afterEach(async () => {
    await page?.close();
    await devToolsPage?.close();
  });

  test.afterAll(async () => {
    await context?.close();
  });

  test.describe('Plugin Loading', () => {
    test('should load the DevTools panel correctly', async () => {
      // Check that the main panel is visible
      await expect(devToolsPage.locator('[data-testid="browser-automation-panel"]')).toBeVisible();
      
      // Check that tab navigation is present
      await expect(devToolsPage.locator('[role="tablist"]')).toBeVisible();
      
      // Check that all main tabs are present
      const expectedTabs = ['Record', 'Playback', 'Events', 'Generate', 'Selectors', 'Advanced', 'Collaborate', 'Settings'];
      for (const tab of expectedTabs) {
        await expect(devToolsPage.locator(`[role="tab"]:has-text("${tab}")`)).toBeVisible();
      }
    });

    test('should show correct initial state', async () => {
      // Should show "Not Recording" status
      await expect(devToolsPage.locator('[data-testid="recording-status"]')).toContainText('Not Recording');
      
      // Should show 0 events
      await expect(devToolsPage.locator('[data-testid="event-counter"]')).toContainText('0');
      
      // Start recording button should be enabled
      await expect(devToolsPage.locator('[data-testid="start-recording"]')).toBeEnabled();
      
      // Stop recording button should be disabled
      await expect(devToolsPage.locator('[data-testid="stop-recording"]')).toBeDisabled();
    });

    test('should handle theme switching', async () => {
      const themeToggle = devToolsPage.locator('[data-testid="theme-toggle"]');
      const panel = devToolsPage.locator('[data-testid="browser-automation-panel"]');
      
      // Toggle to dark theme
      await themeToggle.click();
      await expect(panel).toHaveClass(/dark/);
      
      // Toggle to light theme
      await themeToggle.click();
      await expect(panel).toHaveClass(/light/);
    });
  });

  test.describe('Recording Functionality', () => {
    test('should start and stop recording', async () => {
      const startButton = devToolsPage.locator('[data-testid="start-recording"]');
      const stopButton = devToolsPage.locator('[data-testid="stop-recording"]');
      const status = devToolsPage.locator('[data-testid="recording-status"]');
      
      // Start recording
      await startButton.click();
      
      // Verify recording state
      await expect(status).toContainText('Recording');
      await expect(startButton).toBeDisabled();
      await expect(stopButton).toBeEnabled();
      
      // Stop recording
      await stopButton.click();
      
      // Verify stopped state
      await expect(status).toContainText('Not Recording');
      await expect(startButton).toBeEnabled();
      await expect(stopButton).toBeDisabled();
    });

    test('should record user interactions', async () => {
      // Start recording in DevTools
      await devToolsPage.locator('[data-testid="start-recording"]').click();
      await expect(devToolsPage.locator('[data-testid="recording-status"]')).toContainText('Recording');
      
      // Perform interactions on main page
      await page.locator('#test-button').click();
      await page.locator('#test-input').fill('Hello World');
      await page.locator('#test-checkbox').check();
      await page.locator('#test-select').selectOption('option1');
      
      // Wait for events to be recorded (events are processed asynchronously)
      await page.waitForTimeout(1000);
      
      // Stop recording
      await devToolsPage.locator('[data-testid="stop-recording"]').click();
      
      // Check that events were recorded
      const eventCounter = devToolsPage.locator('[data-testid="event-counter"]');
      await expect(eventCounter).toContainText('4'); // 4 interactions
      
      // Navigate to Events tab to see recorded events
      await devToolsPage.locator('[role="tab"]:has-text("Events")').click();
      
      // Verify events are displayed
      await expect(devToolsPage.locator('[data-testid="event-list"]')).toBeVisible();
      await expect(devToolsPage.locator('[data-event-type="click"]')).toBeVisible();
      await expect(devToolsPage.locator('[data-event-type="input"]')).toBeVisible();
      await expect(devToolsPage.locator('[data-event-type="change"]')).toHaveCount(2); // checkbox and select
    });

    test('should pause and resume recording', async () => {
      const startButton = devToolsPage.locator('[data-testid="start-recording"]');
      const pauseButton = devToolsPage.locator('[data-testid="pause-recording"]');
      const resumeButton = devToolsPage.locator('[data-testid="resume-recording"]');
      const status = devToolsPage.locator('[data-testid="recording-status"]');
      
      // Start recording
      await startButton.click();
      await expect(status).toContainText('Recording');
      
      // Perform an action
      await page.locator('#test-button').click();
      
      // Pause recording
      await pauseButton.click();
      await expect(status).toContainText('Paused');
      
      // Perform action while paused (should not be recorded)
      await page.locator('#test-button').click();
      
      // Resume recording
      await resumeButton.click();
      await expect(status).toContainText('Recording');
      
      // Perform another action
      await page.locator('#test-input').fill('test');
      
      // Stop recording
      await devToolsPage.locator('[data-testid="stop-recording"]').click();
      
      // Should have recorded 2 events (not the one during pause)
      await expect(devToolsPage.locator('[data-testid="event-counter"]')).toContainText('2');
    });

    test('should clear recorded events', async () => {
      // Record some events
      await devToolsPage.locator('[data-testid="start-recording"]').click();
      await page.locator('#test-button').click();
      await page.locator('#test-input').fill('test');
      await devToolsPage.locator('[data-testid="stop-recording"]').click();
      
      // Verify events were recorded
      await expect(devToolsPage.locator('[data-testid="event-counter"]')).toContainText('2');
      
      // Clear events
      await devToolsPage.locator('[data-testid="clear-recording"]').click();
      
      // Confirm clear action in dialog
      await devToolsPage.locator('[data-testid="confirm-clear"]').click();
      
      // Verify events were cleared
      await expect(devToolsPage.locator('[data-testid="event-counter"]')).toContainText('0');
    });
  });

  test.describe('Event Processing', () => {
    test('should generate reliable selectors', async () => {
      // Start recording
      await devToolsPage.locator('[data-testid="start-recording"]').click();
      
      // Click element with multiple selector options
      await page.locator('#test-button').click(); // Has ID, class, and text
      
      // Stop recording
      await devToolsPage.locator('[data-testid="stop-recording"]').click();
      
      // Navigate to Events tab
      await devToolsPage.locator('[role="tab"]:has-text("Events")').click();
      
      // Click on the recorded event to see details
      await devToolsPage.locator('[data-event-type="click"]').first().click();
      
      // Check selector details panel
      await expect(devToolsPage.locator('[data-testid="event-details"]')).toBeVisible();
      await expect(devToolsPage.locator('[data-testid="primary-selector"]')).toContainText('#test-button');
      
      // Check alternative selectors are generated
      await expect(devToolsPage.locator('[data-testid="alternative-selectors"]')).toBeVisible();
      
      // Navigate to Selectors tab for more details
      await devToolsPage.locator('[role="tab"]:has-text("Selectors")').click();
      
      // Verify selector reliability metrics
      await expect(devToolsPage.locator('[data-testid="selector-score"]')).toBeVisible();
      await expect(devToolsPage.locator('[data-testid="reliability-metrics"]')).toBeVisible();
    });

    test('should capture form interactions correctly', async () => {
      await devToolsPage.locator('[data-testid="start-recording"]').click();
      
      // Fill out a form
      await page.locator('#contact-form #name').fill('John Doe');
      await page.locator('#contact-form #email').fill('john@example.com');
      await page.locator('#contact-form #message').fill('Hello world!');
      await page.locator('#contact-form select[name="category"]').selectOption('general');
      await page.locator('#contact-form input[type="checkbox"]').check();
      await page.locator('#contact-form button[type="submit"]').click();
      
      await devToolsPage.locator('[data-testid="stop-recording"]').click();
      
      // Navigate to Events tab
      await devToolsPage.locator('[role="tab"]:has-text("Events")').click();
      
      // Verify form events were captured
      const eventList = devToolsPage.locator('[data-testid="event-list"]');
      await expect(eventList.locator('[data-event-type="input"]')).toHaveCount(3); // name, email, message
      await expect(eventList.locator('[data-event-type="change"]')).toHaveCount(2); // select, checkbox
      await expect(eventList.locator('[data-event-type="click"]')).toHaveCount(1); // submit button
      
      // Check that form values are captured
      await eventList.locator('[data-event-type="input"]').first().click();
      await expect(devToolsPage.locator('[data-testid="event-value"]')).toContainText('John Doe');
    });

    test('should handle navigation events', async () => {
      await devToolsPage.locator('[data-testid="start-recording"]').click();
      
      // Navigate to different pages
      await page.goto('/example/page2');
      await page.waitForLoadState('networkidle');
      
      await page.locator('a[href="/example/page3"]').click();
      await page.waitForLoadState('networkidle');
      
      // Go back
      await page.goBack();
      await page.waitForLoadState('networkidle');
      
      await devToolsPage.locator('[data-testid="stop-recording"]').click();
      
      // Check navigation events
      await devToolsPage.locator('[role="tab"]:has-text("Events")').click();
      
      const navigationEvents = devToolsPage.locator('[data-event-type="navigation"]');
      await expect(navigationEvents).toHaveCount(3); // 2 forward, 1 back
      
      // Check URLs are captured
      await navigationEvents.first().click();
      await expect(devToolsPage.locator('[data-testid="navigation-url"]')).toContainText('/example/page2');
    });
  });

  test.describe('Test Generation', () => {
    test('should generate Playwright test code', async () => {
      // Record a simple interaction
      await devToolsPage.locator('[data-testid="start-recording"]').click();
      await page.locator('#test-button').click();
      await page.locator('#test-input').fill('Hello World');
      await devToolsPage.locator('[data-testid="stop-recording"]').click();
      
      // Navigate to Generate tab
      await devToolsPage.locator('[role="tab"]:has-text("Generate")').click();
      
      // Configure generation options
      await devToolsPage.locator('[data-testid="framework-select"]').selectOption('playwright');
      await devToolsPage.locator('[data-testid="language-select"]').selectOption('typescript');
      await devToolsPage.locator('[data-testid="include-comments"]').check();
      await devToolsPage.locator('[data-testid="include-assertions"]').check();
      
      // Set test name
      await devToolsPage.locator('[data-testid="test-name"]').fill('Generated Login Test');
      
      // Generate test
      await devToolsPage.locator('[data-testid="generate-test"]').click();
      
      // Wait for generation to complete
      await expect(devToolsPage.locator('[data-testid="generated-code"]')).toBeVisible();
      
      // Verify generated code content
      const generatedCode = devToolsPage.locator('[data-testid="generated-code"] code');
      await expect(generatedCode).toContainText("import { test, expect } from '@playwright/test'");
      await expect(generatedCode).toContainText("test('Generated Login Test'");
      await expect(generatedCode).toContainText("await page.click('#test-button')");
      await expect(generatedCode).toContainText("await page.fill('#test-input', 'Hello World')");
      
      // Test copy to clipboard functionality
      await devToolsPage.locator('[data-testid="copy-code"]').click();
      await expect(devToolsPage.locator('[data-testid="copy-success"]')).toBeVisible();
    });

    test('should generate test for different frameworks', async () => {
      // Record interaction
      await devToolsPage.locator('[data-testid="start-recording"]').click();
      await page.locator('#test-button').click();
      await devToolsPage.locator('[data-testid="stop-recording"]').click();
      
      await devToolsPage.locator('[role="tab"]:has-text("Generate")').click();
      
      // Test Cypress generation
      await devToolsPage.locator('[data-testid="framework-select"]').selectOption('cypress');
      await devToolsPage.locator('[data-testid="generate-test"]').click();
      
      await expect(devToolsPage.locator('[data-testid="generated-code"] code')).toContainText("cy.get('#test-button').click()");
      
      // Test Selenium generation
      await devToolsPage.locator('[data-testid="framework-select"]').selectOption('selenium');
      await devToolsPage.locator('[data-testid="generate-test"]').click();
      
      await expect(devToolsPage.locator('[data-testid="generated-code"] code')).toContainText("driver.findElement(By.id('test-button')).click()");
    });

    test('should include assertions in generated tests', async () => {
      // Record interaction that should generate assertion
      await devToolsPage.locator('[data-testid="start-recording"]').click();
      await page.locator('#test-button').click();
      // Wait for success message to appear
      await expect(page.locator('#success-message')).toBeVisible();
      await devToolsPage.locator('[data-testid="stop-recording"]').click();
      
      await devToolsPage.locator('[role="tab"]:has-text("Generate")').click();
      
      // Enable assertions
      await devToolsPage.locator('[data-testid="include-assertions"]').check();
      await devToolsPage.locator('[data-testid="generate-test"]').click();
      
      // Check for generated assertion
      const generatedCode = devToolsPage.locator('[data-testid="generated-code"] code');
      await expect(generatedCode).toContainText("await expect(page.locator('#success-message')).toBeVisible()");
    });
  });

  test.describe('Playback Functionality', () => {
    test('should playback recorded events', async () => {
      // Record some events
      await devToolsPage.locator('[data-testid="start-recording"]').click();
      await page.locator('#test-input').fill('Playback Test');
      await page.locator('#test-button').click();
      await devToolsPage.locator('[data-testid="stop-recording"]').click();
      
      // Clear the form to test playback
      await page.locator('#test-input').fill('');
      
      // Navigate to Playback tab
      await devToolsPage.locator('[role="tab"]:has-text("Playback")').click();
      
      // Start playback
      await devToolsPage.locator('[data-testid="start-playback"]').click();
      
      // Verify playback status
      await expect(devToolsPage.locator('[data-testid="playback-status"]')).toContainText('Playing');
      
      // Wait for playback to complete
      await expect(devToolsPage.locator('[data-testid="playback-status"]')).toContainText('Completed', { timeout: 10000 });
      
      // Verify the form was filled during playback
      await expect(page.locator('#test-input')).toHaveValue('Playback Test');
    });

    test('should handle playback speed controls', async () => {
      // Record events
      await devToolsPage.locator('[data-testid="start-recording"]').click();
      await page.locator('#test-input').fill('Speed Test');
      await page.locator('#test-button').click();
      await devToolsPage.locator('[data-testid="stop-recording"]').click();
      
      await devToolsPage.locator('[role="tab"]:has-text("Playback")').click();
      
      // Set playback speed
      await devToolsPage.locator('[data-testid="playback-speed"]').selectOption('2.0');
      
      // Start playback
      const startTime = Date.now();
      await devToolsPage.locator('[data-testid="start-playback"]').click();
      
      // Wait for completion
      await expect(devToolsPage.locator('[data-testid="playback-status"]')).toContainText('Completed', { timeout: 10000 });
      
      const duration = Date.now() - startTime;
      
      // At 2x speed, should complete faster (approximate check)
      expect(duration).toBeLessThan(5000); // Should be faster than normal speed
    });

    test('should pause and resume playback', async () => {
      // Record multiple events
      await devToolsPage.locator('[data-testid="start-recording"]').click();
      await page.locator('#test-input').fill('Pause Test');
      await page.locator('#test-checkbox').check();
      await page.locator('#test-button').click();
      await devToolsPage.locator('[data-testid="stop-recording"]').click();
      
      await devToolsPage.locator('[role="tab"]:has-text("Playback")').click();
      
      // Start playback
      await devToolsPage.locator('[data-testid="start-playback"]').click();
      
      // Wait a moment then pause
      await page.waitForTimeout(500);
      await devToolsPage.locator('[data-testid="pause-playback"]').click();
      
      // Verify paused state
      await expect(devToolsPage.locator('[data-testid="playback-status"]')).toContainText('Paused');
      
      // Resume playback
      await devToolsPage.locator('[data-testid="resume-playback"]').click();
      
      // Wait for completion
      await expect(devToolsPage.locator('[data-testid="playback-status"]')).toContainText('Completed', { timeout: 10000 });
      
      // Verify all actions were completed
      await expect(page.locator('#test-input')).toHaveValue('Pause Test');
      await expect(page.locator('#test-checkbox')).toBeChecked();
    });
  });

  test.describe('Advanced Features', () => {
    test('should capture and display screenshots', async () => {
      // Start recording with screenshots enabled
      await devToolsPage.locator('[role="tab"]:has-text("Settings")').click();
      await devToolsPage.locator('[data-testid="capture-screenshots"]').check();
      
      await devToolsPage.locator('[role="tab"]:has-text("Record")').click();
      await devToolsPage.locator('[data-testid="start-recording"]').click();
      
      await page.locator('#test-button').click();
      
      await devToolsPage.locator('[data-testid="stop-recording"]').click();
      
      // Navigate to Events tab
      await devToolsPage.locator('[role="tab"]:has-text("Events")').click();
      
      // Click on event to see details
      await devToolsPage.locator('[data-event-type="click"]').click();
      
      // Verify screenshot is displayed
      await expect(devToolsPage.locator('[data-testid="event-screenshot"]')).toBeVisible();
      
      // Screenshot should be an image
      const screenshot = devToolsPage.locator('[data-testid="event-screenshot"] img');
      await expect(screenshot).toHaveAttribute('src', /data:image/);
    });

    test('should handle visual regression testing', async () => {
      await devToolsPage.locator('[role="tab"]:has-text("Advanced")').click();
      
      // Enable visual regression testing
      await devToolsPage.locator('[data-testid="enable-visual-regression"]').check();
      
      // Capture baseline
      await devToolsPage.locator('[data-testid="capture-baseline"]').click();
      await expect(devToolsPage.locator('[data-testid="baseline-captured"]')).toBeVisible();
      
      // Make visual change on the page
      await page.evaluate(() => {
        const button = document.querySelector('#test-button');
        if (button) {
          (button as HTMLElement).style.backgroundColor = 'red';
        }
      });
      
      // Compare against baseline
      await devToolsPage.locator('[data-testid="compare-visual"]').click();
      
      // Should detect visual difference
      await expect(devToolsPage.locator('[data-testid="visual-diff-detected"]')).toBeVisible();
      await expect(devToolsPage.locator('[data-testid="visual-diff-percentage"]')).toBeVisible();
    });

    test('should monitor performance metrics', async () => {
      // Enable performance monitoring
      await devToolsPage.locator('[role="tab"]:has-text("Settings")').click();
      await devToolsPage.locator('[data-testid="capture-performance"]').check();
      
      await devToolsPage.locator('[role="tab"]:has-text("Record")').click();
      await devToolsPage.locator('[data-testid="start-recording"]').click();
      
      // Perform actions that might affect performance
      await page.locator('#load-heavy-content').click();
      await page.waitForLoadState('networkidle');
      
      await devToolsPage.locator('[data-testid="stop-recording"]').click();
      
      // Navigate to Advanced tab
      await devToolsPage.locator('[role="tab"]:has-text("Advanced")').click();
      
      // Check performance metrics are captured
      await expect(devToolsPage.locator('[data-testid="performance-metrics"]')).toBeVisible();
      await expect(devToolsPage.locator('[data-testid="memory-usage"]')).toBeVisible();
      await expect(devToolsPage.locator('[data-testid="load-times"]')).toBeVisible();
      
      // Verify specific metrics
      await expect(devToolsPage.locator('[data-testid="dom-content-loaded"]')).toBeVisible();
      await expect(devToolsPage.locator('[data-testid="largest-contentful-paint"]')).toBeVisible();
    });
  });

  test.describe('Cross-Browser Compatibility', () => {
    test('should work consistently across browsers', async ({ browserName }) => {
      // This test runs across all configured browsers
      
      // Record the same interaction in each browser
      await devToolsPage.locator('[data-testid="start-recording"]').click();
      await page.locator('#test-button').click();
      await page.locator('#test-input').fill(`Test in ${browserName}`);
      await devToolsPage.locator('[data-testid="stop-recording"]').click();
      
      // Generate test code
      await devToolsPage.locator('[role="tab"]:has-text("Generate")').click();
      await devToolsPage.locator('[data-testid="generate-test"]').click();
      
      // Verify code is generated correctly regardless of browser
      const generatedCode = devToolsPage.locator('[data-testid="generated-code"] code');
      await expect(generatedCode).toContainText("await page.click('#test-button')");
      await expect(generatedCode).toContainText(`await page.fill('#test-input', 'Test in ${browserName}')`);
      
      // Selectors should be consistent across browsers
      await devToolsPage.locator('[role="tab"]:has-text("Selectors")').click();
      const primarySelector = devToolsPage.locator('[data-testid="primary-selector"]');
      await expect(primarySelector).toContainText('#test-button');
    });
  });

  test.describe('Mobile Responsiveness', () => {
    test('should adapt UI for mobile devices', async ({ browserName }) => {
      test.skip(browserName === 'webkit', 'Mobile Safari testing with webkit');
      
      // This test runs on mobile configurations
      if (browserName.includes('mobile')) {
        // Check that mobile-optimized UI is shown
        await expect(devToolsPage.locator('[data-testid="mobile-menu"]')).toBeVisible();
        
        // Tab navigation should be collapsible
        await expect(devToolsPage.locator('[data-testid="tab-menu-button"]')).toBeVisible();
        
        // Tap to expand menu
        await devToolsPage.locator('[data-testid="tab-menu-button"]').tap();
        await expect(devToolsPage.locator('[data-testid="mobile-tab-list"]')).toBeVisible();
        
        // Recording controls should be touch-friendly
        const recordButton = devToolsPage.locator('[data-testid="start-recording"]');
        const buttonBox = await recordButton.boundingBox();
        expect(buttonBox?.height).toBeGreaterThan(44); // iOS minimum touch target
      }
    });

    test('should handle touch events on mobile', async ({ browserName }) => {
      test.skip(!browserName.includes('mobile'), 'Mobile-only test');
      
      await devToolsPage.locator('[data-testid="start-recording"]').tap();
      
      // Perform touch interactions on main page
      await page.locator('#test-button').tap();
      await page.locator('#test-input').fill('Touch test');
      
      await devToolsPage.locator('[data-testid="stop-recording"]').tap();
      
      // Check that touch events were recorded
      await devToolsPage.locator('[data-testid="tab-menu-button"]').tap();
      await devToolsPage.locator('[role="tab"]:has-text("Events")').tap();
      
      const eventList = devToolsPage.locator('[data-testid="event-list"]');
      await expect(eventList.locator('[data-event-type="tap"]')).toBeVisible();
    });
  });

  test.describe('Error Handling', () => {
    test('should handle selector failures gracefully', async () => {
      // Record interaction with element that gets removed
      await devToolsPage.locator('[data-testid="start-recording"]').click();
      await page.locator('#dynamic-element').click();
      
      // Remove the element from DOM
      await page.evaluate(() => {
        const element = document.querySelector('#dynamic-element');
        element?.remove();
      });
      
      // Try to interact with removed element
      try {
        await page.locator('#dynamic-element').click({ timeout: 1000 });
      } catch {
        // Expected to fail
      }
      
      await devToolsPage.locator('[data-testid="stop-recording"]').click();
      
      // Plugin should handle the error gracefully
      await expect(devToolsPage.locator('[data-testid="error-notification"]')).toBeVisible();
      await expect(devToolsPage.locator('[data-testid="error-notification"]')).toContainText('Selector not found');
      
      // But other events should still be recorded
      await expect(devToolsPage.locator('[data-testid="event-counter"]')).toContainText('1');
    });

    test('should recover from network issues', async () => {
      // Simulate network failure
      await page.route('**/api/**', route => route.abort());
      
      // Try to perform action that requires network
      await devToolsPage.locator('[data-testid="start-recording"]').click();
      await page.locator('#api-dependent-button').click();
      await devToolsPage.locator('[data-testid="stop-recording"]').click();
      
      // Plugin should show network error but continue working
      await expect(devToolsPage.locator('[data-testid="network-error"]')).toBeVisible();
      
      // Should still be able to generate test code
      await devToolsPage.locator('[role="tab"]:has-text("Generate")').click();
      await devToolsPage.locator('[data-testid="generate-test"]').click();
      
      await expect(devToolsPage.locator('[data-testid="generated-code"]')).toBeVisible();
    });
  });
});

// Helper function for complex interactions
async function performComplexUserFlow(page: Page) {
  // Navigate through a multi-step form
  await page.locator('#step1 input[name="firstName"]').fill('John');
  await page.locator('#step1 input[name="lastName"]').fill('Doe');
  await page.locator('#step1 button[type="button"]:has-text("Next")').click();
  
  await page.locator('#step2 input[name="email"]').fill('john@example.com');
  await page.locator('#step2 input[name="phone"]').fill('555-1234');
  await page.locator('#step2 button[type="button"]:has-text("Next")').click();
  
  await page.locator('#step3 textarea[name="comments"]').fill('This is a test comment');
  await page.locator('#step3 input[type="checkbox"]').check();
  await page.locator('#step3 button[type="submit"]').click();
  
  // Wait for confirmation
  await expect(page.locator('#confirmation')).toBeVisible();
}