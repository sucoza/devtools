# Getting Started Guide

Welcome to the Browser Automation Test Recorder Plugin! This comprehensive guide will help you get up and running with recording, analyzing, and generating browser automation tests in minutes.

## Table of Contents

1. [Installation](#installation)
2. [Setup and Configuration](#setup-and-configuration)
3. [Your First Recording](#your-first-recording)
4. [Understanding the Interface](#understanding-the-interface)
5. [Basic Workflows](#basic-workflows)
6. [Next Steps](#next-steps)

## Installation

### Prerequisites

Before installing, ensure you have:

- **Node.js** 16+ installed
- A modern browser (Chrome, Firefox, Safari, or Edge)
- A React application with TanStack DevTools integration

### Package Installation

Install the plugin using npm or yarn:

```bash
# Using npm
npm install @tanstack/browser-automation-test-recorder

# Using yarn
yarn add @tanstack/browser-automation-test-recorder

# Using pnpm
pnpm add @tanstack/browser-automation-test-recorder
```

### Browser Extension (Optional)

For enhanced recording capabilities, install our browser extension:

- **Chrome**: [Chrome Web Store Link]
- **Firefox**: [Firefox Add-ons Link]
- **Safari**: [Safari Extensions Link]
- **Edge**: [Microsoft Edge Add-ons Link]

## Setup and Configuration

### Basic Integration

Add the plugin to your existing TanStack DevTools setup:

```typescript
// DevTools.tsx
import React from 'react';
import { BrowserAutomationPanel } from '@tanstack/browser-automation-test-recorder';

function DevTools() {
  return (
    <div className="devtools-container">
      {/* Your existing DevTools panels */}
      <BrowserAutomationPanel />
    </div>
  );
}

export default DevTools;
```

### Advanced Configuration

For production applications, use advanced configuration:

```typescript
import { 
  BrowserAutomationPanel,
  createBrowserAutomationEventClient,
  SelectorEngine 
} from '@tanstack/browser-automation-test-recorder';

// Configure selector engine
const selectorEngine = new SelectorEngine({
  preferredAttributes: ['data-testid', 'data-cy', 'id'],
  enableHealing: true,
  confidenceThreshold: 0.8
});

// Create event client with custom configuration
const eventClient = createBrowserAutomationEventClient({
  enableNetworkCapture: true,
  enablePerformanceTracking: true
});

function DevTools() {
  return (
    <BrowserAutomationPanel
      theme="auto"
      defaultTab="recorder"
      compact={false}
      onEvent={(event) => console.log('DevTools event:', event)}
    />
  );
}
```

### Environment Configuration

Set up environment-specific configurations:

```typescript
// config/browser-automation.ts
const config = {
  development: {
    recording: {
      captureScreenshots: true,
      captureConsole: true,
      captureNetwork: true,
      debounceDelay: 100
    },
    selectors: {
      enableHealing: true,
      confidenceThreshold: 0.7
    }
  },
  production: {
    recording: {
      captureScreenshots: false,
      captureConsole: false,
      captureNetwork: false,
      debounceDelay: 300
    },
    selectors: {
      enableHealing: true,
      confidenceThreshold: 0.9
    }
  }
};

export default config[process.env.NODE_ENV || 'development'];
```

## Your First Recording

Let's record your first browser automation test! This example shows recording a simple login flow.

### Step 1: Open DevTools

1. Open your React application in the browser
2. Open browser developer tools (F12 or right-click → Inspect)
3. Navigate to the "Browser Automation" tab in DevTools
4. You should see the plugin interface with multiple tabs

### Step 2: Start Recording

1. Click the **"Start Recording"** button (🔴 icon) in the Recorder tab
2. You'll see a notification that recording has started
3. The interface will show real-time event capture

```typescript
// Recording will automatically capture:
// - Mouse clicks and interactions
// - Keyboard input and key presses
// - Form submissions and changes
// - Navigation events
// - Screenshots at key moments
```

### Step 3: Perform Your Workflow

Navigate through your application as a user would:

```typescript
// Example: Login workflow
// 1. Navigate to login page
window.location.href = '/login';

// 2. Fill in email (this will be recorded)
// User types in email field

// 3. Fill in password (this will be recorded with masking)
// User types in password field

// 4. Click submit button (this will be recorded)
// User clicks the login button

// 5. Verify redirect (this will be recorded)
// User is redirected to dashboard
```

### Step 4: Stop Recording

1. Click the **"Stop Recording"** button (⏹️ icon)
2. Your recorded events will appear in the Events tab
3. A summary will show the number of events captured

### Step 5: Review Recorded Events

Switch to the **Events** tab to review what was captured:

```typescript
// Example recorded events:
[
  {
    type: 'navigation',
    target: { url: '/login' },
    timestamp: 1634567890000
  },
  {
    type: 'click',
    target: { selector: '[data-testid="email-input"]' },
    data: { value: 'user@example.com' }
  },
  {
    type: 'input',
    target: { selector: '[data-testid="password-input"]' },
    data: { value: '***masked***' }
  },
  {
    type: 'click',
    target: { selector: '[data-testid="login-button"]' }
  },
  {
    type: 'navigation',
    target: { url: '/dashboard' }
  }
]
```

## Understanding the Interface

The Browser Automation Plugin interface consists of several tabs, each serving a specific purpose:

### Recorder Tab

**Primary Controls:**
- **🔴 Start Recording**: Begin capturing user interactions
- **⏸️ Pause/Resume**: Temporarily pause recording without losing session
- **⏹️ Stop Recording**: End recording session and process events
- **🗑️ Clear**: Clear current events without stopping recording

**Recording Options:**
- **Screenshots**: Capture screenshots during interactions
- **Console**: Record console messages and errors
- **Network**: Track network requests and responses
- **Performance**: Monitor page performance metrics

**Event Filtering:**
- **Smart Filtering**: Automatically ignore non-meaningful events
- **Event Types**: Choose which event types to record
- **Debounce**: Set delay to merge rapid successive events

### Events Tab

**Event List:**
- **Chronological View**: Events displayed in order of occurrence
- **Event Details**: Click any event to see detailed information
- **Filtering**: Filter events by type, element, or time range
- **Search**: Find specific events using search functionality

**Event Information:**
- **Type & Target**: Event type and target element
- **Selector**: Generated CSS selector and alternatives
- **Timestamp**: Exact time of event occurrence
- **Context**: Page URL, viewport size, and other context data
- **Screenshots**: Visual snapshots if enabled

### Selectors Tab

**Selector Quality:**
- **Confidence Score**: Reliability rating (0-100%)
- **Healing Status**: Whether auto-healing is enabled
- **Fallback Options**: Alternative selectors if primary fails
- **Validation**: Real-time validation of selector effectiveness

**Selector Management:**
- **Edit Selectors**: Manually modify generated selectors
- **Test Selectors**: Validate selectors against current DOM
- **Optimization**: Improve selector performance and reliability

### Test Generator Tab

**Code Generation:**
- **Framework Selection**: Choose from Playwright, Cypress, Selenium, etc.
- **Template Options**: Select code style and structure preferences
- **Test Configuration**: Set test name, base URL, and other settings
- **Export Options**: Download or copy generated test code

### Playback Tab

**Playback Controls:**
- **▶️ Play**: Execute recorded events step by step
- **⏸️ Pause**: Pause playback at current step
- **⏭️ Step**: Execute single event and pause
- **⏪ Reset**: Return to beginning of recording

**Playback Settings:**
- **Speed Control**: Adjust playback speed (0.5x to 5x)
- **Breakpoints**: Set breakpoints at specific events
- **Error Handling**: Configure behavior on playback errors

### Settings Tab

**Recording Preferences:**
- **Default Options**: Set default recording configuration
- **Performance Settings**: Optimize for speed vs. detail
- **Privacy Settings**: Configure sensitive data handling

**Selector Preferences:**
- **Preferred Attributes**: Order of selector attribute preferences
- **Healing Configuration**: Auto-healing strategies and thresholds
- **Fallback Settings**: Number and type of fallback selectors

### Advanced Features Tab

**Visual Regression:**
- **Baseline Management**: Create and manage visual baselines
- **Comparison Tools**: Compare screenshots and highlight differences
- **Threshold Settings**: Configure visual difference sensitivity

**API Verification:**
- **Request Monitoring**: Track API calls during recording
- **Response Validation**: Verify API responses match expectations
- **Mock Integration**: Create and use API mocks for testing

## Basic Workflows

### Workflow 1: Simple Page Interaction

Record a basic page interaction like clicking buttons and filling forms:

```typescript
// 1. Start recording
// 2. Navigate to page
// 3. Fill form fields
// 4. Click submit
// 5. Verify result
// 6. Stop recording
// 7. Generate test code
```

**Generated Playwright Test:**
```typescript
import { test, expect } from '@playwright/test';

test('form submission workflow', async ({ page }) => {
  await page.goto('/contact');
  
  await page.fill('[data-testid="name-input"]', 'John Doe');
  await page.fill('[data-testid="email-input"]', 'john@example.com');
  await page.fill('[data-testid="message-textarea"]', 'Hello world');
  
  await page.click('[data-testid="submit-button"]');
  
  await expect(page.locator('.success-message')).toBeVisible();
});
```

### Workflow 2: Multi-Page Navigation

Record a workflow that spans multiple pages:

```typescript
// 1. Start on homepage
// 2. Navigate to product listing
// 3. Click on specific product
// 4. Add to cart
// 5. Go to checkout
// 6. Complete purchase
```

**Generated Cypress Test:**
```typescript
describe('E-commerce Purchase Flow', () => {
  it('should complete purchase successfully', () => {
    cy.visit('/');
    
    cy.get('[data-testid="products-link"]').click();
    cy.url().should('include', '/products');
    
    cy.get('[data-testid="product-item"]').first().click();
    cy.get('[data-testid="add-to-cart"]').click();
    
    cy.get('[data-testid="cart-link"]').click();
    cy.get('[data-testid="checkout-button"]').click();
    
    // Fill checkout form
    cy.get('[data-testid="checkout-form"]').should('be.visible');
  });
});
```

### Workflow 3: Error Scenarios

Record and test error handling:

```typescript
// 1. Trigger validation errors
// 2. Test network failure scenarios
// 3. Test timeout situations
// 4. Verify error messages
```

## Common Use Cases

### Use Case 1: Regression Testing

Perfect for ensuring UI changes don't break existing functionality:

```typescript
// Record critical user journeys once
// Generate tests for multiple frameworks
// Run tests in CI/CD pipeline
// Get alerted to regressions immediately
```

### Use Case 2: Feature Development

Test new features as you develop them:

```typescript
// Record expected behavior during development
// Generate tests alongside feature code
// Ensure feature works across browsers
// Document user workflows automatically
```

### Use Case 3: Bug Reproduction

Capture exact steps that cause bugs:

```typescript
// Record the bug reproduction steps
// Share recording with team members
// Generate test to prevent regression
// Verify fix works correctly
```

### Use Case 4: User Acceptance Testing

Create tests based on actual user workflows:

```typescript
// Record real user sessions
// Convert to automated tests
// Validate against acceptance criteria
// Ensure user experience quality
```

## Troubleshooting Common Issues

### Recording Not Starting

**Problem**: Click record button but nothing happens

**Solutions:**
1. **Check DevTools Console**: Look for error messages
2. **Verify Installation**: Ensure plugin is properly installed
3. **Browser Compatibility**: Try a different browser
4. **Clear Cache**: Clear browser cache and reload page

```typescript
// Debug recording issues
console.log('Event client:', getBrowserAutomationEventClient());
console.log('Recorder state:', recorder.isRecording);
```

### Selectors Not Working

**Problem**: Generated selectors don't find elements during playback

**Solutions:**
1. **Enable Healing**: Turn on automatic selector healing
2. **Adjust Preferences**: Configure preferred attributes
3. **Lower Threshold**: Reduce confidence threshold temporarily
4. **Manual Review**: Review and edit problematic selectors

```typescript
// Configure selector healing
const selectorEngine = new SelectorEngine({
  enableHealing: true,
  healingStrategies: ['text', 'attributes', 'position'],
  confidenceThreshold: 0.7
});
```

### Performance Issues

**Problem**: Recording is slow or causes browser lag

**Solutions:**
1. **Reduce Capture Options**: Disable screenshots and network capture
2. **Increase Debounce**: Use higher debounce delays
3. **Filter Events**: Ignore non-essential event types
4. **Limit Buffer Size**: Reduce maximum event buffer

```typescript
// Performance-optimized configuration
const optimizedConfig = {
  captureScreenshots: false,
  captureNetwork: false,
  debounceDelay: 500,
  maxEventBuffer: 500,
  ignoredEvents: ['mousemove', 'scroll', 'resize']
};
```

### Code Generation Issues

**Problem**: Generated test code doesn't work correctly

**Solutions:**
1. **Check Framework Version**: Ensure compatible framework version
2. **Review Template**: Try different code templates
3. **Validate Selectors**: Test selectors before code generation
4. **Manual Adjustments**: Modify generated code as needed

## Next Steps

Now that you have the basics down, here are recommended next steps:

### Explore Advanced Features

1. **[Visual Regression Testing](./visual-regression.md)**: Learn to capture and compare screenshots
2. **[API Verification](./api-verification.md)**: Monitor and validate API calls
3. **[Team Collaboration](./team-collaboration.md)**: Share recordings and collaborate with team members
4. **[Performance Monitoring](./performance-monitoring.md)**: Track performance metrics during tests

### Integrate with Your Workflow

1. **[CI/CD Integration](../integrations/ci-cd.md)**: Automate testing in your build pipeline
2. **[Framework Integration](../integrations/frameworks.md)**: Integrate with React, Vue, Angular
3. **[Custom Extensions](../development/plugin-development.md)**: Extend plugin functionality

### Best Practices

1. **[Recording Best Practices](./best-practices.md)**: Learn effective recording techniques
2. **[Selector Strategies](./selector-strategies.md)**: Master reliable selector generation
3. **[Test Organization](./test-organization.md)**: Structure and organize your tests effectively

### Advanced Usage

1. **[Custom Code Templates](../examples/custom-templates.md)**: Create custom code generation templates
2. **[Plugin Extensions](../development/extending-plugin.md)**: Build custom plugin extensions
3. **[Performance Optimization](../examples/performance-optimization.md)**: Optimize for large-scale usage

## Getting Help

If you need assistance:

1. **Documentation**: Browse the complete documentation
2. **Examples**: Check out practical examples and tutorials
3. **Community**: Join our Discord server for community support
4. **Issues**: Report bugs or request features on GitHub
5. **Professional Support**: Contact us for enterprise support options

### Useful Resources

- **[API Reference](../api/README.md)**: Complete API documentation
- **[Examples Repository](https://github.com/tanstack/browser-automation-examples)**: Sample projects and patterns
- **[Video Tutorials](https://youtube.com/tanstack)**: Step-by-step video guides
- **[Blog Posts](https://tanstack.com/blog)**: Tips, tricks, and best practices

## Summary

You've now learned how to:

✅ Install and configure the Browser Automation Test Recorder Plugin  
✅ Record your first browser automation test  
✅ Understand the plugin interface and features  
✅ Generate test code for multiple frameworks  
✅ Troubleshoot common issues  
✅ Plan your next steps for advanced usage  

The plugin is designed to grow with your needs, from simple recordings to enterprise-scale test automation. Start with basic recording and gradually explore advanced features as you become more comfortable with the tool.

Happy testing! 🚀

---

*Need more help? Check out our [FAQ](./faq.md) or reach out to the community on [Discord](https://discord.gg/tanstack).*