# API Reference

Complete API documentation for the Browser Automation Test Recorder Plugin.

## Overview

The Browser Automation Test Recorder Plugin provides a comprehensive API for recording, analyzing, and generating browser automation tests. All APIs follow TypeScript-first design principles with full type safety and extensive JSDoc documentation.

## Core APIs

### Components
- [BrowserAutomationPanel](./components/BrowserAutomationPanel.md) - Main DevTools panel component
- [RecorderTab](./components/RecorderTab.md) - Recording interface component  
- [PlaybackTab](./components/PlaybackTab.md) - Playback and debugging interface
- [EventsTab](./components/EventsTab.md) - Event inspection and analysis
- [TestGeneratorTab](./components/TestGeneratorTab.md) - Code generation interface

### Core Classes
- [EventRecorder](./core/EventRecorder.md) - Event recording and processing engine
- [SelectorEngine](./core/SelectorEngine.md) - Smart selector generation system
- [PlaybackEngine](./core/PlaybackEngine.md) - Test playback and execution engine
- [CodeGenerator](./core/CodeGenerator.md) - Multi-framework code generation
- [CollaborationManager](./core/CollaborationManager.md) - Team collaboration features

### DevTools Integration
- [BrowserAutomationEventClient](./devtools/EventClient.md) - DevTools event client
- [BrowserAutomationStore](./devtools/Store.md) - Zustand store integration
- [DevTools Events](./devtools/Events.md) - Event system documentation

### Code Generators
- [PlaywrightGenerator](./generators/PlaywrightGenerator.md) - Playwright test generation
- [CypressGenerator](./generators/CypressGenerator.md) - Cypress test generation  
- [SeleniumGenerator](./generators/SeleniumGenerator.md) - Selenium WebDriver generation
- [PuppeteerGenerator](./generators/PuppeteerGenerator.md) - Puppeteer script generation

### Utilities
- [SelectorUtils](./utils/SelectorUtils.md) - Selector manipulation utilities
- [EventUtils](./utils/EventUtils.md) - Event processing utilities
- [StorageUtils](./utils/StorageUtils.md) - Local storage and persistence
- [NetworkUtils](./utils/NetworkUtils.md) - Network request handling

## Quick Reference

### Basic Usage

```typescript
import { 
  BrowserAutomationPanel,
  createBrowserAutomationEventClient,
  EventRecorder,
  SelectorEngine 
} from '@tanstack/browser-automation-test-recorder';

// Initialize the DevTools panel
function MyDevTools() {
  return <BrowserAutomationPanel theme="auto" defaultTab="recorder" />;
}

// Create an event client
const eventClient = createBrowserAutomationEventClient();

// Initialize recorder
const recorder = new EventRecorder(selectorEngine, eventClient);
await recorder.start();
```

### Event Recording

```typescript
// Start recording browser events
await recorder.start({
  captureScreenshots: true,
  captureConsole: true,
  ignoredEvents: ['mousemove', 'scroll']
});

// Stop recording and get events
const events = await recorder.stop();
console.log(`Recorded ${events.length} events`);
```

### Code Generation

```typescript
import { PlaywrightGenerator } from '@tanstack/browser-automation-test-recorder';

const generator = new PlaywrightGenerator({
  template: 'modern-typescript',
  pageObjectModel: true
});

const testCode = await generator.generate(recordedEvents, {
  testName: 'User Login Flow',
  baseUrl: 'https://example.com'
});
```

### Selector Engine

```typescript
import { SelectorEngine } from '@tanstack/browser-automation-test-recorder';

const selectorEngine = new SelectorEngine({
  preferredAttributes: ['data-testid', 'data-cy', 'id'],
  enableHealing: true,
  confidenceThreshold: 0.8
});

const selector = await selectorEngine.generateSelector(element);
// Result: { primary: "[data-testid='button']", fallbacks: [...], confidence: 0.95 }
```

## Type Definitions

### Core Types

```typescript
// Event types
export type EventType = 
  | 'click' | 'dblclick' | 'mousedown' | 'mouseup'
  | 'keydown' | 'keyup' | 'input'
  | 'change' | 'submit' | 'focus' | 'blur'
  | 'navigation' | 'scroll' | 'resize'
  | 'wait' | 'assertion' | 'screenshot';

// Recorded event structure
export interface RecordedEvent {
  id: string;
  type: EventType;
  timestamp: number;
  sequence: number;
  target: EventTarget;
  data: EventData;
  context: EventContext;
  metadata: EventMetadata;
}

// Selector information
export interface GeneratedSelector {
  primary: string;
  fallbacks: string[];
  xpath?: string;
  confidence: number;
  healing: boolean;
  strategy: SelectorStrategy;
}
```

### Configuration Types

```typescript
// Recording configuration
export interface RecordingOptions {
  captureScreenshots: boolean;
  captureConsole: boolean;
  captureNetwork: boolean;
  capturePerformance: boolean;
  ignoredEvents: EventType[];
  debounceDelay: number;
  maxEventBuffer: number;
}

// Code generation options
export interface GenerationOptions {
  framework: 'playwright' | 'cypress' | 'selenium' | 'puppeteer';
  template: string;
  testName: string;
  baseUrl?: string;
  pageObjectModel?: boolean;
  typescript?: boolean;
  includes?: ('assertions' | 'waits' | 'screenshots')[];
}
```

## Error Handling

All APIs follow consistent error handling patterns:

```typescript
try {
  await recorder.start();
} catch (error) {
  if (error instanceof RecordingError) {
    console.error('Recording failed:', error.message);
    // Handle recording-specific errors
  } else if (error instanceof SelectorError) {
    console.error('Selector generation failed:', error.message);
    // Handle selector-specific errors
  } else {
    console.error('Unexpected error:', error);
  }
}
```

### Error Types

```typescript
export class RecordingError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'RecordingError';
  }
}

export class SelectorError extends Error {
  constructor(message: string, public element?: Element) {
    super(message);
    this.name = 'SelectorError';
  }
}

export class PlaybackError extends Error {
  constructor(message: string, public step?: number) {
    super(message);
    this.name = 'PlaybackError';
  }
}
```

## Events System

The plugin uses a comprehensive event system for real-time communication:

```typescript
// Event client subscription
eventClient.subscribe((state) => {
  console.log('State updated:', state);
});

// Dispatch actions
eventClient.dispatch({
  type: 'START_RECORDING',
  payload: { options: recordingOptions }
});

// Event types
export type BrowserAutomationEvent = 
  | { type: 'START_RECORDING'; payload: { options: RecordingOptions } }
  | { type: 'STOP_RECORDING'; payload: {} }
  | { type: 'ADD_EVENT'; payload: { event: RecordedEvent } }
  | { type: 'GENERATE_CODE'; payload: { options: GenerationOptions } }
  | { type: 'START_PLAYBACK'; payload: { events: RecordedEvent[] } };
```

## Browser Compatibility

API compatibility across different browsers:

| API Feature | Chrome | Firefox | Safari | Edge |
|-------------|--------|---------|--------|------|
| Event Recording | ✅ | ✅ | ✅ | ✅ |
| Selector Generation | ✅ | ✅ | ✅ | ✅ |
| Code Generation | ✅ | ✅ | ✅ | ✅ |
| Playback Engine | ✅ | ✅ | ⚠️ | ✅ |
| Visual Regression | ✅ | ✅ | ⚠️ | ✅ |
| DevTools Integration | ✅ | ✅ | ⚠️ | ✅ |

## Performance Considerations

### Memory Usage

```typescript
// Configure memory-efficient recording
const recorder = new EventRecorder(selectorEngine, eventClient, {
  maxEventBuffer: 1000,        // Limit event buffer size
  debounceDelay: 300,          // Debounce rapid events
  ignoredEvents: ['mousemove', 'scroll', 'resize']
});
```

### Selector Performance

```typescript
// Optimize selector generation
const selectorEngine = new SelectorEngine({
  enableCaching: true,         // Cache generated selectors
  cacheSize: 500,             // Limit cache size
  confidenceThreshold: 0.8,    // Skip low-confidence selectors
  maxDepth: 10                // Limit DOM traversal depth
});
```

## Migration Guide

### From v0.x to v1.x

Breaking changes and migration steps:

```typescript
// v0.x (deprecated)
import { BrowserRecorder } from '@tanstack/browser-automation-test-recorder';
const recorder = new BrowserRecorder();

// v1.x (current)
import { EventRecorder, SelectorEngine, createBrowserAutomationEventClient } from '@tanstack/browser-automation-test-recorder';
const eventClient = createBrowserAutomationEventClient();
const selectorEngine = new SelectorEngine();
const recorder = new EventRecorder(selectorEngine, eventClient);
```

## Best Practices

### Selector Strategy

```typescript
// Recommended selector configuration
const selectorConfig = {
  preferredAttributes: [
    'data-testid',      // Highest priority
    'data-cy',          // Cypress attributes
    'data-test',        // Generic test attributes
    'id',               // Stable IDs
    'name'              // Form elements
  ],
  enableHealing: true,
  healingStrategies: ['text', 'attributes', 'position'],
  confidenceThreshold: 0.8
};
```

### Event Filtering

```typescript
// Optimize recording performance
const recordingConfig = {
  ignoredEvents: [
    'mousemove',        // Too frequent
    'scroll',           // Often not meaningful
    'resize',           // Window events
    'focus',            // Usually implicit
    'blur'              // Usually implicit
  ],
  debounceDelay: 300,   // Merge rapid events
  maxEventBuffer: 1000  // Prevent memory issues
};
```

## Support

For API-specific questions:

- **GitHub Issues**: [Report API bugs](https://github.com/tanstack/browser-automation-test-recorder-plugin/issues)
- **Documentation**: [Full API docs](https://browser-automation-docs.tanstack.com/api)
- **Community**: [Discord discussions](https://discord.gg/tanstack)

---

*This API reference covers all public APIs and interfaces. For internal implementation details, see the [Developer Documentation](../development/README.md).*