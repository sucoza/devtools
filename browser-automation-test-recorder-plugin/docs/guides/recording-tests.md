# Recording Tests Guide

Master the art of recording high-quality browser automation tests with intelligent event capture, smart filtering, and optimal selector generation.

## Table of Contents

1. [Recording Fundamentals](#recording-fundamentals)
2. [Recording Strategies](#recording-strategies)
3. [Event Management](#event-management)
4. [Selector Optimization](#selector-optimization)
5. [Advanced Recording Features](#advanced-recording-features)
6. [Best Practices](#best-practices)
7. [Troubleshooting](#troubleshooting)

## Recording Fundamentals

### Understanding Event Recording

The Browser Automation Test Recorder captures user interactions as structured events that can be replayed and converted to test code. Each recorded event contains:

```typescript
interface RecordedEvent {
  id: string;                    // Unique event identifier
  type: EventType;               // Type of interaction (click, input, etc.)
  timestamp: number;             // When the event occurred
  sequence: number;              // Order in the recording session
  target: EventTarget;           // Element that was interacted with
  data: EventData;               // Event-specific data (values, coordinates, etc.)
  context: EventContext;         // Page context (URL, viewport, etc.)
  metadata: EventMetadata;       // Additional metadata (screenshots, performance, etc.)
}
```

### Event Types Captured

The recorder automatically captures various types of user interactions:

**Mouse Events:**
```typescript
'click'        // Single click
'dblclick'     // Double click
'mousedown'    // Mouse button press
'mouseup'      // Mouse button release
'contextmenu'  // Right-click context menu
'drag'         // Drag and drop operations
'wheel'        // Mouse wheel scrolling
```

**Keyboard Events:**
```typescript
'keydown'      // Key press
'keyup'        // Key release
'input'        // Text input
'keypress'     // Character input
```

**Form Events:**
```typescript
'change'       // Form field changes
'submit'       // Form submission
'focus'        // Element focus
'blur'         // Element blur
'select'       // Text selection
```

**Navigation Events:**
```typescript
'navigation'   // Page navigation
'reload'       // Page reload
'back'         // Browser back button
'forward'      // Browser forward button
'load'         // Page load completion
```

## Recording Strategies

### Strategy 1: User Journey Recording

Record complete user workflows from start to finish:

```typescript
// Example: E-commerce checkout flow
async function recordCheckoutFlow() {
  const recorder = new EventRecorder(selectorEngine, eventClient);
  
  // Start recording
  await recorder.start({
    captureScreenshots: true,
    captureConsole: true,
    sessionName: 'checkout-flow'
  });
  
  // User performs workflow:
  // 1. Browse products
  // 2. Add items to cart
  // 3. Proceed to checkout
  // 4. Fill shipping information
  // 5. Complete payment
  // 6. Verify confirmation
  
  const events = await recorder.stop();
  return events;
}
```

**Benefits:**
- Captures real user behavior
- Includes all necessary steps
- Provides complete test coverage
- Documents user workflows

### Strategy 2: Feature-Focused Recording

Record specific features or components in isolation:

```typescript
// Example: Login component testing
async function recordLoginComponent() {
  await recorder.start({
    captureScreenshots: true,
    ignoredEvents: ['scroll', 'resize'], // Focus on interactions
    debounceDelay: 100 // Quick response for component testing
  });
  
  // Focus on login-specific interactions:
  // 1. Fill username
  // 2. Fill password
  // 3. Toggle remember me
  // 4. Click login
  // 5. Handle validation errors
  
  const events = await recorder.stop();
  return events.filter(event => 
    event.target.selector?.includes('login') ||
    event.type === 'navigation'
  );
}
```

**Benefits:**
- Focused test scope
- Faster recording sessions
- Easier maintenance
- Component-level testing

### Strategy 3: Error Scenario Recording

Deliberately record error conditions and edge cases:

```typescript
// Example: Form validation recording
async function recordValidationErrors() {
  await recorder.start({
    captureConsole: true, // Capture error messages
    captureNetwork: true  // Capture failed requests
  });
  
  // Trigger various error scenarios:
  // 1. Submit empty form
  // 2. Enter invalid email
  // 3. Use weak password
  // 4. Test network timeouts
  
  const events = await recorder.stop();
  return events;
}
```

**Benefits:**
- Tests error handling
- Validates user feedback
- Ensures robust applications
- Documents edge cases

## Event Management

### Smart Event Filtering

Configure intelligent filtering to capture only meaningful interactions:

```typescript
const recorder = new EventRecorder(selectorEngine, eventClient, {
  enableSmartFiltering: true,
  
  // Events to automatically ignore
  ignoredEvents: [
    'mousemove',    // Too frequent, rarely meaningful
    'mouseout',     // Usually not needed for testing
    'mouseover',    // Focus on actual interactions
    'scroll',       // Unless specifically testing scroll behavior
    'resize',       // Window resizing rarely part of user flows
    'focus',        // Usually implicit in other interactions
    'blur'          // Usually implicit in other interactions
  ],
  
  // Merge rapid successive events
  debounceDelay: 300,
  
  // Prevent memory issues with long sessions
  maxEventBuffer: 1000
});
```

### Custom Event Filtering

Create custom filters for specific use cases:

```typescript
// Only record events on elements with test attributes
recorder.setEventFilter((event, element) => {
  return element.hasAttribute('data-testid') || 
         element.hasAttribute('data-cy') ||
         element.hasAttribute('data-test');
});

// Only record interactions with form elements
recorder.setEventFilter((event, element) => {
  const formElements = ['INPUT', 'SELECT', 'TEXTAREA', 'BUTTON'];
  return formElements.includes(element.tagName) ||
         element.type === 'submit' ||
         element.role === 'button';
});

// Filter by event importance
recorder.setEventFilter((event, element) => {
  const importantEvents = ['click', 'input', 'submit', 'navigation'];
  return importantEvents.includes(event.type);
});
```

### Event Post-Processing

Clean and optimize recorded events after recording:

```typescript
async function cleanRecordedEvents(events: RecordedEvent[]): Promise<RecordedEvent[]> {
  return events
    // Remove duplicate navigation events
    .filter((event, index, array) => {
      if (event.type !== 'navigation') return true;
      const prevEvent = array[index - 1];
      return !prevEvent || 
             prevEvent.type !== 'navigation' || 
             prevEvent.target.url !== event.target.url;
    })
    
    // Merge rapid input events
    .reduce((acc, event) => {
      if (event.type === 'input') {
        const lastEvent = acc[acc.length - 1];
        if (lastEvent?.type === 'input' && 
            lastEvent.target.selector === event.target.selector &&
            event.timestamp - lastEvent.timestamp < 100) {
          // Merge input events
          lastEvent.data.value = event.data.value;
          lastEvent.timestamp = event.timestamp;
          return acc;
        }
      }
      acc.push(event);
      return acc;
    }, [] as RecordedEvent[])
    
    // Add meaningful waits between actions
    .map((event, index, array) => {
      const nextEvent = array[index + 1];
      if (nextEvent && nextEvent.timestamp - event.timestamp > 2000) {
        // Add wait event for long pauses
        return [
          event,
          {
            ...event,
            id: generateId(),
            type: 'wait',
            timestamp: event.timestamp + 100,
            sequence: event.sequence + 0.5,
            data: { duration: nextEvent.timestamp - event.timestamp }
          }
        ];
      }
      return [event];
    })
    .flat();
}
```

## Selector Optimization

### Selector Generation Strategy

Configure the selector engine for optimal results:

```typescript
const selectorEngine = new SelectorEngine({
  // Prioritize test-specific attributes
  preferredAttributes: [
    'data-testid',      // Primary test identifier
    'data-cy',          // Cypress test identifier
    'data-test',        // Generic test identifier
    'id',               // Stable ID attributes
    'name',             // Form element names
    'aria-label',       // Accessibility labels
    'title',            // Element titles
    'alt',              // Image alt text
    'placeholder'       // Input placeholders
  ],
  
  // Enable intelligent selector healing
  enableHealing: true,
  healingStrategies: [
    'text',             // Match by text content
    'attributes',       // Match by similar attributes
    'position',         // Match by DOM position
    'hierarchy'         // Match by parent structure
  ],
  
  // Quality thresholds
  confidenceThreshold: 0.8,   // Minimum selector confidence
  maxDepth: 8,               // Maximum DOM traversal depth
  fallbackCount: 3           // Number of backup selectors
});
```

### Selector Validation During Recording

Validate selectors in real-time during recording:

```typescript
class ValidatingRecorder extends EventRecorder {
  async processEvent(event: Event, element: Element): Promise<RecordedEvent> {
    // Generate initial selector
    const selector = await this.selectorEngine.generateSelector(element);
    
    // Validate selector immediately
    const validation = await this.selectorEngine.validateSelector(
      selector.primary, 
      element
    );
    
    if (!validation.isValid || !validation.isUnique) {
      console.warn(`Weak selector generated: ${selector.primary}`);
      
      // Try to improve selector
      const improved = await this.selectorEngine.optimizeSelector(selector.primary);
      selector.primary = improved;
      
      // Re-validate improved selector
      const revalidation = await this.selectorEngine.validateSelector(improved);
      if (!revalidation.isValid) {
        console.error(`Could not generate reliable selector for element:`, element);
      }
    }
    
    return super.processEvent(event, element);
  }
}
```

### Manual Selector Refinement

Review and improve selectors after recording:

```typescript
async function refineSelectors(events: RecordedEvent[]): Promise<RecordedEvent[]> {
  for (const event of events) {
    if (event.target.selector) {
      // Validate existing selector
      const validation = await selectorEngine.validateSelector(event.target.selector);
      
      if (validation.confidence < 0.8) {
        console.log(`Improving selector: ${event.target.selector}`);
        
        // Try to find the element and regenerate selector
        const elements = document.querySelectorAll(event.target.selector);
        if (elements.length === 1) {
          const improved = await selectorEngine.generateSelector(elements[0]);
          event.target.selector = improved.primary;
          event.target.fallbackSelectors = improved.fallbacks;
        }
      }
    }
  }
  
  return events;
}
```

## Advanced Recording Features

### Screenshot Integration

Capture visual context during recording:

```typescript
const recorder = new EventRecorder(selectorEngine, eventClient, {
  captureScreenshots: true,
  screenshotOptions: {
    quality: 'high',           // Screenshot quality
    captureViewport: true,     // Capture visible area
    captureFullPage: false,    // Don't capture entire page (performance)
    highlightElement: true,    // Highlight interacted element
    annotations: true          // Add annotations to screenshots
  }
});

// Access screenshots from recorded events
events.forEach(event => {
  if (event.metadata.screenshot) {
    console.log(`Screenshot for ${event.type}: ${event.metadata.screenshot.url}`);
  }
});
```

### Network Request Monitoring

Monitor API calls during recording:

```typescript
const recorder = new EventRecorder(selectorEngine, eventClient, {
  captureNetwork: true,
  networkOptions: {
    includeRequests: ['xhr', 'fetch', 'websocket'],
    excludePatterns: [
      '/analytics',      // Ignore analytics calls
      '/tracking',       // Ignore tracking requests
      '.css',           // Ignore stylesheet requests
      '.js',            // Ignore script requests
      '.png', '.jpg'    // Ignore image requests
    ],
    captureHeaders: true,
    captureBody: true,
    maxBodySize: 1024 * 10  // Limit body capture size
  }
});

// Access network data from events
events.forEach(event => {
  if (event.context.network) {
    console.log(`Network requests during ${event.type}:`, event.context.network);
  }
});
```

### Console Message Capture

Capture console output during recording:

```typescript
const recorder = new EventRecorder(selectorEngine, eventClient, {
  captureConsole: true,
  consoleOptions: {
    levels: ['log', 'warn', 'error'],  // Which console levels to capture
    maxMessages: 100,                  // Limit message count per event
    includeStackTraces: true,          // Include error stack traces
    filterPatterns: [
      /React DevTools/,                // Ignore DevTools messages
      /Download the React DevTools/    // Ignore React warnings
    ]
  }
});

// Access console messages from events
events.forEach(event => {
  if (event.context.console?.length > 0) {
    console.log(`Console messages during ${event.type}:`, event.context.console);
  }
});
```

### Performance Monitoring

Track performance metrics during recording:

```typescript
const recorder = new EventRecorder(selectorEngine, eventClient, {
  capturePerformance: true,
  performanceOptions: {
    markInteractions: true,      // Mark interaction points
    measureDuration: true,       // Measure event duration
    captureMetrics: [
      'navigation',              // Navigation timing
      'paint',                   // Paint timing
      'layout',                  // Layout shift metrics
      'memory'                   // Memory usage
    ],
    sampleRate: 1.0             // Sample all events
  }
});

// Access performance data from events
events.forEach(event => {
  if (event.context.performance) {
    const perf = event.context.performance;
    console.log(`${event.type} took ${perf.duration}ms`);
    
    if (perf.memoryUsage) {
      console.log(`Memory usage: ${perf.memoryUsage.usedJSHeapSize / 1024 / 1024}MB`);
    }
  }
});
```

## Best Practices

### 1. Plan Your Recording Session

Before starting recording:

```typescript
// Define the scope and goals
const recordingPlan = {
  objective: 'Test user registration flow',
  startCondition: 'User on homepage, logged out',
  endCondition: 'User successfully registered and logged in',
  criticalPaths: [
    'Navigate to registration',
    'Fill registration form',
    'Submit form',
    'Verify success message',
    'Check email verification'
  ],
  errorScenarios: [
    'Invalid email format',
    'Password too weak',
    'Username already taken'
  ]
};
```

### 2. Use Consistent Test Data

Prepare test data before recording:

```typescript
const testData = {
  users: {
    valid: {
      username: 'testuser123',
      email: 'test@example.com',
      password: 'SecurePass123!'
    },
    invalid: {
      username: 'a', // Too short
      email: 'invalid-email',
      password: '123' // Too weak
    }
  },
  products: {
    available: { id: 'prod-123', name: 'Test Product' },
    outOfStock: { id: 'prod-456', name: 'Sold Out Product' }
  }
};

// Use consistent data during recording
async function fillUserRegistration(userData) {
  // Recording will capture these exact values
  await page.fill('[data-testid="username"]', userData.username);
  await page.fill('[data-testid="email"]', userData.email);
  await page.fill('[data-testid="password"]', userData.password);
}
```

### 3. Include Verification Steps

Always include verification in your recordings:

```typescript
// Bad: Only record actions
await page.click('[data-testid="submit-button"]');

// Good: Record actions and verifications
await page.click('[data-testid="submit-button"]');

// Add manual assertion event
recorder.addCustomEvent({
  type: 'assertion',
  target: { selector: '.success-message' },
  data: {
    assertion: 'expect(successMessage).toBeVisible()',
    expected: true,
    actual: document.querySelector('.success-message')?.style.display !== 'none'
  }
});
```

### 4. Handle Dynamic Content

Account for dynamic content during recording:

```typescript
// Wait for dynamic content to load
recorder.addCustomEvent({
  type: 'wait',
  data: {
    condition: 'networkIdle',
    timeout: 5000,
    description: 'Wait for product list to load'
  }
});

// Or wait for specific elements
recorder.addCustomEvent({
  type: 'wait',
  data: {
    condition: 'element',
    selector: '[data-testid="product-list"] .product-item',
    timeout: 10000,
    description: 'Wait for products to appear'
  }
});
```

### 5. Organize Recording Sessions

Structure your recordings for maintainability:

```typescript
class RecordingSession {
  constructor(name: string, description: string) {
    this.name = name;
    this.description = description;
    this.events = [];
    this.metadata = {
      recordedAt: new Date().toISOString(),
      browserInfo: navigator.userAgent,
      viewportSize: `${window.innerWidth}x${window.innerHeight}`,
      baseUrl: window.location.origin
    };
  }
  
  async start() {
    this.recorder = new EventRecorder(selectorEngine, eventClient, {
      sessionName: this.name,
      captureScreenshots: true
    });
    
    await this.recorder.start();
    console.log(`Started recording session: ${this.name}`);
  }
  
  async stop() {
    this.events = await this.recorder.stop();
    console.log(`Completed recording session: ${this.name} (${this.events.length} events)`);
    return this;
  }
  
  export(format = 'json') {
    return {
      session: {
        name: this.name,
        description: this.description,
        metadata: this.metadata
      },
      events: this.events
    };
  }
}

// Usage
const session = new RecordingSession(
  'user-registration-happy-path',
  'Complete user registration flow with valid data'
);

await session.start();
// Perform user interactions
await session.stop();

const exported = session.export();
```

### 6. Review and Clean Recordings

Always review recordings before converting to tests:

```typescript
async function reviewRecording(events: RecordedEvent[]): Promise<RecordingReview> {
  const review: RecordingReview = {
    totalEvents: events.length,
    eventTypes: {},
    issues: [],
    recommendations: []
  };
  
  // Analyze event distribution
  events.forEach(event => {
    review.eventTypes[event.type] = (review.eventTypes[event.type] || 0) + 1;
  });
  
  // Check for common issues
  const navigationEvents = events.filter(e => e.type === 'navigation');
  if (navigationEvents.length > 5) {
    review.issues.push({
      type: 'excessive-navigation',
      message: 'Too many navigation events - consider breaking into smaller tests'
    });
  }
  
  // Check selector quality
  const weakSelectors = events.filter(e => 
    e.target.selector && !e.target.selector.includes('data-testid')
  );
  
  if (weakSelectors.length > events.length * 0.3) {
    review.issues.push({
      type: 'weak-selectors',
      message: 'Many selectors lack test-specific attributes'
    });
    
    review.recommendations.push({
      type: 'improve-selectors',
      message: 'Add data-testid attributes to improve selector reliability'
    });
  }
  
  return review;
}
```

## Troubleshooting

### Common Recording Issues

#### Issue: Events Not Being Captured

**Symptoms:**
- Interactions don't appear in event list
- Recording seems inactive despite being started

**Solutions:**
```typescript
// 1. Verify recording is actually started
if (!recorder.isRecording) {
  console.error('Recording not started');
  await recorder.start();
}

// 2. Check event filters
recorder.setEventFilter((event, element) => {
  console.log('Event filter called:', event.type, element);
  return true; // Temporarily allow all events
});

// 3. Enable debug logging
localStorage.setItem('browser-automation-debug', 'true');

// 4. Check for JavaScript errors
window.addEventListener('error', (error) => {
  console.error('JavaScript error during recording:', error);
});
```

#### Issue: Poor Quality Selectors

**Symptoms:**
- Generated selectors are too generic
- Selectors break when DOM changes
- Low confidence scores

**Solutions:**
```typescript
// 1. Add test attributes to your HTML
<button data-testid="submit-button" className="btn btn-primary">
  Submit
</button>

// 2. Configure selector preferences
const selectorEngine = new SelectorEngine({
  preferredAttributes: ['data-testid', 'data-cy', 'id'],
  confidenceThreshold: 0.9,
  enableHealing: true
});

// 3. Use custom validation
recorder.setEventFilter(async (event, element) => {
  const selector = await selectorEngine.generateSelector(element);
  if (selector.confidence < 0.8) {
    console.warn('Low quality selector:', selector.primary);
  }
  return true;
});
```

#### Issue: Recording Performance Problems

**Symptoms:**
- Browser becomes slow during recording
- High memory usage
- UI becomes unresponsive

**Solutions:**
```typescript
// 1. Optimize recording settings
const optimizedRecorder = new EventRecorder(selectorEngine, eventClient, {
  captureScreenshots: false,    // Disable if not needed
  captureNetwork: false,        // Disable if not needed
  debounceDelay: 500,          // Increase debounce
  maxEventBuffer: 500,         // Limit buffer size
  ignoredEvents: [
    'mousemove', 'scroll', 'resize', 'focus', 'blur'
  ]
});

// 2. Clear events periodically during long sessions
setInterval(() => {
  if (recorder.eventCount > 1000) {
    const events = recorder.getRecordedEvents();
    // Process or save events
    recorder.clear();
  }
}, 30000); // Every 30 seconds

// 3. Monitor memory usage
setInterval(() => {
  if (performance.memory?.usedJSHeapSize > 100 * 1024 * 1024) { // 100MB
    console.warn('High memory usage detected');
    // Consider stopping recording or clearing buffer
  }
}, 10000);
```

#### Issue: Missing Context Information

**Symptoms:**
- Generated tests lack proper setup
- Tests fail in different environments
- Missing wait conditions

**Solutions:**
```typescript
// 1. Capture comprehensive context
const recorder = new EventRecorder(selectorEngine, eventClient, {
  captureNetwork: true,         // Track API dependencies
  capturePerformance: true,     // Monitor loading times
  captureConsole: true          // Catch errors
});

// 2. Add manual context events
recorder.addCustomEvent({
  type: 'context',
  data: {
    userAgent: navigator.userAgent,
    viewport: `${window.innerWidth}x${window.innerHeight}`,
    timestamp: new Date().toISOString(),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: navigator.language
  }
});

// 3. Include setup steps in recording
// Start recording before navigating to the page
await recorder.start();
await page.goto('/login'); // This navigation will be recorded
// Continue with interactions
```

## Summary

Effective test recording requires:

1. **Clear objectives** - Know what you're testing before you start
2. **Proper configuration** - Set up recording options for your use case
3. **Quality selectors** - Use test-specific attributes and validate selectors
4. **Comprehensive capture** - Include setup, actions, and verifications
5. **Performance awareness** - Optimize settings for smooth recording
6. **Post-processing** - Review and clean recordings before generating tests

With these techniques, you'll create high-quality, maintainable test recordings that serve as the foundation for robust automated testing.

---

*Continue to [Playback & Debugging Guide](./playback-debugging.md) to learn about test execution and troubleshooting.*