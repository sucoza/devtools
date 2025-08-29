# EventRecorder API

The `EventRecorder` class is the core engine for capturing and processing browser interactions. It provides intelligent event recording with advanced filtering, optimization, and real-time processing capabilities.

## Class Definition

```typescript
export class EventRecorder {
  constructor(
    selectorEngine: SelectorEngine,
    devToolsClient: BrowserAutomationEventClient,
    options?: Partial<RecordingOptions>
  );
}
```

## Constructor Parameters

### selectorEngine: `SelectorEngine`
The selector engine instance used for generating element selectors during recording.

### devToolsClient: `BrowserAutomationEventClient`
The DevTools event client for communicating with the plugin panel.

### options: `Partial<RecordingOptions>`
Optional configuration object for customizing recording behavior.

```typescript
interface RecordingOptions {
  captureScreenshots: boolean;      // Capture screenshots during recording
  captureConsole: boolean;          // Capture console messages
  captureNetwork: boolean;          // Capture network requests
  capturePerformance: boolean;      // Capture performance metrics
  ignoredEvents: EventType[];       // Event types to ignore
  debounceDelay: number;           // Debounce delay in milliseconds
  maxEventBuffer: number;          // Maximum events in buffer
  enableSmartFiltering: boolean;    // Enable intelligent event filtering
  elementHighlighting: boolean;     // Highlight elements during recording
}
```

## Methods

### start(options?: RecordingSessionOptions): Promise<string>

Starts event recording with optional session-specific configuration.

**Parameters:**
- `options`: Optional session configuration overrides

**Returns:** Promise<string> - Session ID for the recording session

**Example:**
```typescript
const sessionId = await recorder.start({
  captureScreenshots: true,
  enableSmartFiltering: true
});
console.log(`Recording started with session ID: ${sessionId}`);
```

**Throws:**
- `RecordingError` - If recording is already in progress or initialization fails

---

### stop(): Promise<RecordedEvent[]>

Stops the current recording session and returns all captured events.

**Returns:** Promise<RecordedEvent[]> - Array of recorded events in sequence

**Example:**
```typescript
const events = await recorder.stop();
console.log(`Recording stopped. Captured ${events.length} events`);

events.forEach(event => {
  console.log(`${event.type} on ${event.target.selector} at ${event.timestamp}`);
});
```

**Throws:**
- `RecordingError` - If no recording session is active

---

### pause(): void

Pauses the current recording session without stopping it.

**Example:**
```typescript
recorder.pause();
console.log('Recording paused');

// Resume later
recorder.resume();
```

---

### resume(): void

Resumes a paused recording session.

**Example:**
```typescript
if (recorder.isPaused()) {
  recorder.resume();
  console.log('Recording resumed');
}
```

---

### clear(): void

Clears all recorded events from the current session without stopping recording.

**Example:**
```typescript
recorder.clear();
console.log('Event buffer cleared');
```

---

### getRecordedEvents(): RecordedEvent[]

Returns all events recorded in the current session.

**Returns:** RecordedEvent[] - Array of recorded events

**Example:**
```typescript
const events = recorder.getRecordedEvents();
console.log(`Current session has ${events.length} events`);
```

---

### getSessionInfo(): RecordingSessionInfo

Returns information about the current recording session.

**Returns:** RecordingSessionInfo - Session metadata and statistics

```typescript
interface RecordingSessionInfo {
  sessionId: string;
  startTime: number;
  duration: number;
  eventCount: number;
  isRecording: boolean;
  isPaused: boolean;
  screenshotCount: number;
  networkRequestCount: number;
  errorCount: number;
}
```

**Example:**
```typescript
const info = recorder.getSessionInfo();
console.log(`Session: ${info.sessionId}`);
console.log(`Duration: ${info.duration}ms`);
console.log(`Events: ${info.eventCount}`);
```

---

### addCustomEvent(event: Partial<RecordedEvent>): void

Manually adds a custom event to the recording session.

**Parameters:**
- `event`: Partial event object (required fields will be auto-generated)

**Example:**
```typescript
// Add a custom wait event
recorder.addCustomEvent({
  type: 'wait',
  data: {
    duration: 3000,
    reason: 'Wait for animation to complete'
  }
});

// Add a custom assertion
recorder.addCustomEvent({
  type: 'assertion',
  data: {
    assertion: 'expect(page.title).toBe("Dashboard")',
    expected: 'Dashboard',
    actual: document.title
  }
});
```

---

### setEventFilter(filter: EventFilter): void

Sets a custom event filter function to control which events are recorded.

**Parameters:**
- `filter`: Function that returns true if event should be recorded

```typescript
type EventFilter = (event: Event, element: Element) => boolean;
```

**Example:**
```typescript
// Only record events on elements with data-testid
recorder.setEventFilter((event, element) => {
  return element.hasAttribute('data-testid');
});

// Only record click and input events
recorder.setEventFilter((event) => {
  return ['click', 'input', 'change'].includes(event.type);
});
```

---

### exportEvents(format: ExportFormat): string

Exports recorded events in the specified format.

**Parameters:**
- `format`: Export format ('json', 'csv', 'har')

**Returns:** string - Serialized events in the specified format

**Example:**
```typescript
// Export as JSON
const jsonEvents = recorder.exportEvents('json');
console.log(JSON.parse(jsonEvents));

// Export as CSV for analysis
const csvData = recorder.exportEvents('csv');
console.log(csvData);
```

## Properties

### isRecording: boolean (readonly)

Indicates if recording is currently active.

**Example:**
```typescript
if (recorder.isRecording) {
  console.log('Recording in progress');
}
```

### isPaused: boolean (readonly)

Indicates if recording is currently paused.

**Example:**
```typescript
if (recorder.isPaused) {
  console.log('Recording is paused');
}
```

### eventCount: number (readonly)

Returns the number of events recorded in the current session.

**Example:**
```typescript
console.log(`Recorded ${recorder.eventCount} events so far`);
```

### sessionId: string (readonly)

Returns the current session ID, or empty string if not recording.

**Example:**
```typescript
if (recorder.sessionId) {
  console.log(`Current session: ${recorder.sessionId}`);
}
```

## Events

The EventRecorder emits events through the DevTools event client:

### 'recording-started'

Emitted when recording starts.

```typescript
eventClient.on('recording-started', (sessionInfo: RecordingSessionInfo) => {
  console.log('Recording started:', sessionInfo);
});
```

### 'recording-stopped'

Emitted when recording stops.

```typescript
eventClient.on('recording-stopped', (events: RecordedEvent[]) => {
  console.log(`Recording stopped with ${events.length} events`);
});
```

### 'event-recorded'

Emitted when a new event is recorded.

```typescript
eventClient.on('event-recorded', (event: RecordedEvent) => {
  console.log('New event recorded:', event.type);
});
```

### 'recording-paused'

Emitted when recording is paused.

```typescript
eventClient.on('recording-paused', () => {
  console.log('Recording paused');
});
```

### 'recording-resumed'

Emitted when recording is resumed.

```typescript
eventClient.on('recording-resumed', () => {
  console.log('Recording resumed');
});
```

### 'recording-error'

Emitted when an error occurs during recording.

```typescript
eventClient.on('recording-error', (error: RecordingError) => {
  console.error('Recording error:', error.message);
});
```

## Advanced Usage

### Smart Event Filtering

Enable intelligent filtering to automatically ignore non-meaningful events:

```typescript
const recorder = new EventRecorder(selectorEngine, eventClient, {
  enableSmartFiltering: true,
  debounceDelay: 300,  // Merge events within 300ms
  ignoredEvents: ['mousemove', 'scroll', 'resize']
});
```

### Performance Monitoring

Enable performance capture during recording:

```typescript
await recorder.start({
  capturePerformance: true,
  captureNetwork: true
});

// Events will include performance and network data
const events = await recorder.stop();
events.forEach(event => {
  if (event.context.performance) {
    console.log('Performance metrics:', event.context.performance);
  }
});
```

### Custom Event Processing

Process events in real-time during recording:

```typescript
recorder.setEventFilter((event, element) => {
  // Log high-priority events immediately
  if (element.hasAttribute('data-critical')) {
    console.log('Critical element interaction:', event.type);
  }
  
  return true; // Record all events
});
```

### Session Management

Handle multiple recording sessions:

```typescript
class SessionManager {
  private sessions = new Map<string, RecordedEvent[]>();
  
  async startNewSession(): Promise<string> {
    const sessionId = await recorder.start();
    this.sessions.set(sessionId, []);
    return sessionId;
  }
  
  async endSession(): Promise<RecordedEvent[]> {
    const events = await recorder.stop();
    const sessionId = recorder.sessionId;
    this.sessions.set(sessionId, events);
    return events;
  }
  
  getSession(sessionId: string): RecordedEvent[] | undefined {
    return this.sessions.get(sessionId);
  }
}
```

## Error Handling

Handle different types of recording errors:

```typescript
try {
  await recorder.start();
} catch (error) {
  if (error instanceof RecordingError) {
    switch (error.code) {
      case 'ALREADY_RECORDING':
        console.warn('Recording already in progress');
        break;
      case 'INITIALIZATION_FAILED':
        console.error('Failed to initialize recording');
        break;
      case 'PERMISSION_DENIED':
        console.error('Browser permission denied');
        break;
      default:
        console.error('Unknown recording error:', error.message);
    }
  }
}
```

## Performance Optimization

Optimize recording performance for large applications:

```typescript
const optimizedRecorder = new EventRecorder(selectorEngine, eventClient, {
  // Limit event buffer to prevent memory issues
  maxEventBuffer: 1000,
  
  // Increase debounce delay for rapid events
  debounceDelay: 500,
  
  // Disable expensive features if not needed
  captureScreenshots: false,
  captureNetwork: false,
  
  // Focus on meaningful events
  ignoredEvents: [
    'mousemove', 'mouseout', 'mouseover',
    'scroll', 'resize', 'focus', 'blur'
  ]
});
```

## Browser Compatibility

The EventRecorder works across all major browsers with some feature differences:

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| Basic Recording | ✅ | ✅ | ✅ | ✅ |
| Screenshot Capture | ✅ | ✅ | ⚠️ | ✅ |
| Network Capture | ✅ | ✅ | ❌ | ✅ |
| Performance Metrics | ✅ | ✅ | ⚠️ | ✅ |
| Touch Events | ✅ | ✅ | ✅ | ✅ |

**Legend:**
- ✅ Full support
- ⚠️ Limited support
- ❌ Not supported

---

*For more examples and advanced usage patterns, see the [Recording Guide](../../guides/recording-tests.md) and [Examples](../../examples/workflows.md).*