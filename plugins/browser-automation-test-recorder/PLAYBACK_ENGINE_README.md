# Playback Engine Implementation

## Overview

This implementation provides a comprehensive playback engine for the browser-automation-test-recorder-plugin with professional-grade features including event execution, selector auto-healing, real-time monitoring, and advanced error recovery.

## Architecture

### Core Components

1. **PlaybackEngine** (`src/core/playback-engine.ts`)
   - Main execution engine for recorded events
   - Variable speed playback (0.5x to 5x)
   - Step-by-step debugging support
   - Retry logic with exponential backoff
   - Screenshot capture at each step

2. **SelectorResolver** (`src/core/selector-resolver.ts`)
   - Dynamic selector resolution during playback
   - Auto-healing when DOM changes occur
   - Multiple healing strategies (text, attributes, position, hierarchy)
   - Fuzzy matching and DOM analysis
   - Caching and performance optimization

3. **PlaybackMonitor** (`src/core/playback-monitor.ts`)
   - Real-time execution monitoring
   - Performance metrics collection
   - Error recovery strategies
   - Screenshot and network request tracking
   - Comprehensive reporting

4. **Enhanced PlaybackTab** (`src/components/tabs/PlaybackTab.tsx`)
   - Professional UI with real-time controls
   - Step-by-step execution mode
   - Breakpoint management
   - Live performance metrics
   - Error display with screenshots

## Key Features

### Event Execution

The playback engine handles all major browser events:

- **Mouse Events**: Click, double-click, hover, context menu, drag & drop
- **Keyboard Events**: Key presses, input typing with realistic delays
- **Form Events**: Form submission, input changes, focus/blur
- **Navigation Events**: Page navigation, reload, browser history
- **Scroll Events**: Window and element scrolling
- **Special Events**: Waits, assertions, screenshots

Each event type has dedicated execution handlers that:
- Find target elements with timeout and retry logic
- Simulate realistic user interactions
- Handle modifiers (Ctrl, Shift, Alt, Meta)
- Provide visual feedback during execution

### Selector Auto-Healing

When selectors fail during playback, the system employs multiple healing strategies:

1. **Text Content Matching**: Find elements by visible text
2. **Attribute Matching**: Use ID, data-testid, name, aria-label, class
3. **Position-Based**: Find elements near original coordinates
4. **Hierarchy Matching**: Rebuild selectors using DOM path
5. **Fuzzy Matching**: Generate selector variations
6. **DOM Analysis**: Score similarity of candidate elements

### Real-Time Monitoring

The monitoring system provides:

- **Performance Metrics**: Success rate, execution times, memory usage
- **Error Tracking**: Categorized errors with recovery attempts
- **Screenshot Capture**: Automatic screenshots on errors and key steps
- **Network Monitoring**: Request tracking during playback
- **Recovery Analytics**: Success rates of different healing strategies

### Professional UI Features

The enhanced PlaybackTab includes:

- **Dual Mode Support**: Continuous playback or step-by-step debugging
- **Variable Speed Control**: 0.5x to 5x playback speed with live adjustment
- **Breakpoint System**: Set/remove breakpoints on specific events
- **Real-Time Progress**: Live progress tracking with time estimation
- **Current Event Display**: Shows currently executing event with status
- **Performance Dashboard**: Live metrics with visual indicators
- **Error Console**: Recent errors with timestamps and screenshots
- **Event List**: Scrollable list of events with breakpoint indicators

## Usage Examples

### Basic Playback

```typescript
import { PlaybackEngine, CDPClient, SelectorEngine } from '../core';

const cdpClient = new CDPClient();
const selectorEngine = new SelectorEngine(cdpClient);
const playbackEngine = new PlaybackEngine(cdpClient, selectorEngine);

// Execute recorded events
const events = getRecordedEvents();
const status = await playbackEngine.playEvents(events, {
  speed: 1.0,
  continueOnError: false,
  screenshotOnError: true,
  highlightElements: true,
});
```

### Advanced Configuration

```typescript
const playbackOptions = {
  speed: 2.0,
  timeout: 10000,
  continueOnError: true,
  screenshotOnError: true,
  highlightElements: true,
  stepMode: false,
  captureScreenshots: true,
  screenshotInterval: 2000,
  maxRetries: 5,
  retryDelay: 1000,
  elementTimeout: 8000,
  selectorFallback: true,
  autoHeal: true,
  healingStrategies: ['textContent', 'attributes', 'hierarchy'],
  logLevel: 'info',
};

await playbackEngine.playEvents(events, playbackOptions);
```

### Monitoring Integration

```typescript
import { PlaybackMonitor } from '../core';

const monitor = new PlaybackMonitor({
  collectPerformance: true,
  collectScreenshots: true,
  screenshotOnError: true,
  logLevel: 'debug',
});

// Start monitoring
monitor.startMonitoring(events.length);

// Listen for events
monitor.addEventListener('event-error', (error) => {
  console.error('Playback error:', error);
});

monitor.addEventListener('recovery-success', (recovery) => {
  console.log('Recovery successful:', recovery);
});

// Get final report
const report = monitor.exportReport();
```

### Step-by-Step Debugging

```typescript
// Enable step mode in UI
setIsStepMode(true);

// Execute single event
const event = events[currentIndex];
const result = await playbackEngine.stepEvent(event, {
  highlightElements: true,
  screenshotOnError: true,
  logLevel: 'debug',
});
```

## Error Recovery Strategies

The system includes multiple recovery strategies that are applied automatically:

1. **Element Not Found**: Wait for element to appear with timeout
2. **Selector Healing**: Try alternative selectors and smart matching
3. **Network Timeout**: Retry with longer timeout after network delay
4. **Page Load Issues**: Wait for page load completion and retry

Each strategy has configurable parameters:
- Maximum retry attempts
- Delay between retries
- Priority order
- Success conditions

## Performance Considerations

- **Caching**: Selector resolution results are cached for performance
- **Lazy Loading**: Screenshots and heavy operations are performed only when needed
- **Memory Management**: Automatic cleanup of resources and event listeners
- **Batch Processing**: UI updates are batched to prevent performance impact

## Integration Points

The playback system integrates with existing components:

- **DevTools Store**: State management for playback status and settings
- **Event Client**: Communication with TanStack DevTools event system
- **CDP Client**: Low-level browser automation via Chrome DevTools Protocol
- **Selector Engine**: Smart selector generation and optimization

## Configuration Options

All components support extensive configuration:

- **Playback speeds**: 0.5x to 5x with dynamic adjustment
- **Timeout settings**: Element, network, and page load timeouts
- **Screenshot options**: Format, quality, full-page, error capture
- **Healing strategies**: Enable/disable specific auto-healing approaches
- **Monitoring levels**: Control data collection granularity
- **UI preferences**: Compact mode, theme, panel visibility

## Testing & Validation

The implementation includes comprehensive error handling and validation:

- **Input validation**: All parameters are validated before execution
- **Error boundaries**: Graceful handling of unexpected failures
- **Fallback mechanisms**: Multiple levels of fallback for critical operations
- **Performance monitoring**: Built-in performance tracking and optimization

This playback engine provides a professional-grade solution for browser automation testing with advanced features typically found in commercial tools, while maintaining the flexibility and extensibility of the TanStack DevTools ecosystem.