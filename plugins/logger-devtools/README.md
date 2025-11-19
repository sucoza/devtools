# Logger DevTools Plugin

A comprehensive logging plugin for TanStack DevTools that provides advanced logging capabilities, real-time metrics monitoring, and powerful debugging features.

## Features

### 🎯 Core Logging
- **Multiple Log Levels**: `trace`, `debug`, `info`, `warn`, `error`, `fatal`
- **Structured Logging**: Full support for structured fields with standard naming (OpenTelemetry/ECS compatible)
- **Correlation & Tracing**: Built-in support for correlation IDs and distributed tracing
- **Global Context**: Set application-wide structured fields
- **Category-based Filtering**: Organize logs by categories
- **Child Loggers**: Create specialized loggers with preset context and fields

### 📊 Metrics & Monitoring
- **Real-time Metrics**: Logs per second, error rate, warning rate
- **Performance Tracking**: Peak logs/second, average log size
- **Category Statistics**: Track logs by category and level
- **Live Updates**: Auto-updating metrics dashboard

### 🔧 DevTools Panel
- **Advanced Filtering**: Filter by level, category, search text
- **Log Details View**: Inspect full log data, stack traces, source info
- **Export Options**: Export logs as JSON, CSV, or TXT
- **Runtime Configuration**: Enable/disable logging, change levels on the fly
- **Auto-scroll**: Automatically follow new logs
- **Console Interception**: Capture and display all console.* calls

### 📟 Console Interception
- **Automatic Capture**: Hook into console.log, console.error, etc.
- **Preserve Original**: Optionally keep original console output
- **Source Tracking**: Track exact file/line where console calls originate
- **Visual Indicators**: Intercepted logs marked with special icons

### ⚡ Performance
- **Batched Transmission**: Efficient batching of log entries
- **Configurable Buffer**: Control max logs and batch sizes
- **Automatic Cleanup**: Prevents memory leaks with log rotation
- **Source Tracking**: Automatic capture of file/line/function info

## Installation

```bash
npm install @sucoza/logger-devtools-plugin
```

## Basic Usage

### 1. Import and Use the Logger

The logger supports variadic arguments just like `console.log`:

```typescript
import { logger } from '@sucoza/logger-devtools-plugin';

// Simple logging with variadic arguments (like console.log)
logger.info('Application started');
logger.warn('Low memory', 'Available:', '100MB');
logger.error('Failed to connect', new Error('Network error'));

// Multiple arguments
logger.debug('User action', { action: 'button_click', userId: 123 }, Date.now());

// Any number of arguments
logger.info('Processing', item, 'with config', config, 'at', timestamp);
```

### 2. Add to TanStack DevTools

```tsx
import { TanStackDevtools } from '@tanstack/react-devtools';
import { LoggerDevToolsPanel } from '@sucoza/logger-devtools-plugin';

function App() {
  return (
    <>
      {/* Your app */}
      
      <TanStackDevtools
        plugins={[
          {
            name: 'Logger',
            render: () => <LoggerDevToolsPanel />,
          },
        ]}
      />
    </>
  );
}
```

## Advanced Usage

### Structured Logging

The logger supports proper structured logging with well-defined fields for better queryability and standardization. Structured fields are separate from arbitrary data and follow common patterns (OpenTelemetry, ECS compatible).

#### Using Structured Fields - Builder Pattern

Use the fluent API with `withFields()` for the cleanest syntax:

```typescript
import { logger } from '@sucoza/logger-devtools-plugin';

// Builder pattern - chain withFields() before logging
logger.withFields({
  userId: 'user-123',
  sessionId: 'sess-456',
  action: 'login',
  duration: 145,
  environment: 'production'
}).info('User login successful');

// You can still pass additional arguments
logger.withFields({
  requestId: 'req-abc',
  userId: 'user-123'
}).info('Processing request', request, response);

// Chain multiple builders
logger
  .withFields({ userId: 'user-123' })
  .withCategory('API')
  .withTags('important', 'audit')
  .info('User action completed', result);

// Structured fields are displayed prominently in the DevTools UI
// and are fully searchable
```

#### Correlation and Tracing

Track related logs across operations with correlation and trace IDs:

```typescript
// Start a correlation context
const correlationId = logger.startCorrelation();

logger.withFields({ action: 'start', resource: 'order' }).info('Processing order');

// All logs in this context will include the correlation ID
await processOrder();

logger.endCorrelation();

// Or use the helper method
await logger.withCorrelationAsync(async () => {
  logger.info('Step 1');
  await doWork();
  logger.info('Step 2');
}); // All logs will share the same correlation ID
```

#### Distributed Tracing

Support for OpenTelemetry-compatible trace and span IDs:

```typescript
// Start a trace
const traceId = logger.startTrace();

logger.withFields({
  traceId,
  spanId: logger.newSpanId(),
  action: 'http_request',
  resource: 'api/users'
}).info('API request received');

// Process with child span
const childSpanId = logger.newSpanId();
logger.withFields({
  traceId,
  spanId: childSpanId,
  parentSpanId: logger.newSpanId(),
  resource: 'database'
}).info('Database query');

logger.endTrace();
```

#### Timed Operations

Automatically track operation duration:

```typescript
// Wraps an async operation with timing and structured logging
const result = await logger.timedOperation(
  'fetchUserData',
  async () => {
    return await api.getUser(userId);
  },
  {
    userId: 'user-123',
    service: 'user-service',
    environment: 'production'
  }
);

// Automatically logs:
// - Start: "Starting operation: fetchUserData" with action=start
// - Success: "Completed operation: fetchUserData" with action=complete, duration=123ms
// - Error: "Failed operation: fetchUserData" with action=error, duration=45ms
```

#### Global Structured Context

Set global fields that apply to all logs:

```typescript
// Set at application startup
logger.setGlobalFields({
  service: 'my-app',
  version: '1.2.3',
  environment: 'production',
  hostname: window.location.hostname
});

// All subsequent logs will include these fields
logger.info('User action'); // Includes service, version, environment, hostname

// Add more fields (merge with existing)
logger.setGlobalFields({
  userId: currentUser.id,
  sessionId: currentSession.id
}, true);

// Clear global fields
logger.clearGlobalFields();
```

#### Standard Structured Fields

The logger supports these standard fields (following OpenTelemetry/ECS patterns):

**Correlation & Tracing:**
- `correlationId` - Link related logs across operations
- `traceId` - Distributed tracing ID (OpenTelemetry compatible)
- `spanId` - Current span ID
- `parentSpanId` - Parent span ID

**User & Session Context:**
- `userId` - User identifier
- `sessionId` - Session identifier
- `requestId` - Request identifier

**Application Context:**
- `service` - Service name
- `version` - Application version
- `environment` - Environment (dev/staging/prod)
- `hostname` - Host identifier

**Performance & Timing:**
- `duration` - Operation duration in ms
- `latency` - Latency in ms

**Business Context:**
- `resource` - Resource being accessed (e.g., "user", "order")
- `action` - Action being performed (e.g., "create", "update")
- `entityId` - ID of the entity being operated on

**Custom Fields:**
Any other key-value pairs you need

#### Structured Logging with Child Loggers

Child loggers inherit and merge structured fields:

```typescript
// Create a child logger with preset structured fields
const apiLogger = logger.child({
  category: 'API',
  fields: {
    service: 'api-gateway',
    version: '2.0.0'
  }
});

// These fields are automatically included in all logs
apiLogger.withFields({
  action: 'http_request',
  resource: 'users',
  requestId: 'req-123'
}).info('Request received', requestData);
// Result includes: service, version, action, resource, requestId

// Or just use the child logger directly with variadic args
apiLogger.info('Request received', requestData, responseTime);
// Includes: service, version from parent
```

#### Configuration

Enable/configure structured logging:

```typescript
logger.updateConfig({
  structured: {
    enabled: true,              // Enable structured logging
    autoTracing: true,          // Auto-include active trace/correlation IDs
    includeHostname: true,      // Auto-include hostname
    includeTimestamp: true,     // High-precision timestamps
    globalFields: {             // Default fields for all logs
      service: 'my-service',
      environment: 'production'
    }
  }
});
```

### Child Loggers with Context

Create specialized loggers for different parts of your application:

```typescript
// Create category-specific loggers with structured fields
const apiLogger = logger.child({
  category: 'API',
  fields: {
    service: 'backend',
    version: '1.0.0'
  }
});

const dbLogger = logger.child({
  category: 'Database',
  tags: ['postgres', 'queries']
});

// All logs from these will include the preset context
apiLogger.info('Request received', { endpoint: '/users' });
dbLogger.debug('Query executed', { query: 'SELECT * FROM users' });

// Child loggers also support the fluent API
apiLogger.withFields({ requestId: 'req-123' }).info('Processing', data);
```

### Console Interception

Automatically capture all console.* calls in your application:

```typescript
// Enable console interception (preserves original console output)
logger.enableConsoleCapture();

// Enable with options
logger.enableConsoleCapture({
  preserveOriginal: false, // Don't output to browser console
  includeTrace: true       // Include stack traces for better source tracking
});

// Disable console interception
logger.disableConsoleCapture();

// Check if console capture is enabled
const isEnabled = logger.isConsoleCaptureEnabled();
```

Once enabled, all console calls will appear in the DevTools logger:
```javascript
console.log('This will be captured');        // → Info level
console.warn('This is a warning');           // → Warn level  
console.error('This is an error');           // → Error level
console.debug('Debug information');          // → Debug level
```

### Runtime Configuration

Control logging behavior dynamically:

```typescript
// Enable/disable logging globally
logger.setEnabled(false);

// Change global log level
logger.setLevel('error'); // Only error and fatal logs

// Configure specific categories
logger.setCategoryConfig('API', {
  enabled: true,
  level: 'debug'  // Different level for API logs
});

// Get current configuration
const config = logger.getConfig();

// Get current metrics
const metrics = logger.getMetrics();
```

### Structured Error Logging

```typescript
try {
  await riskyOperation();
} catch (error) {
  logger
    .withCategory('Operations')
    .withFields({
      userId: currentUser.id,
      operation: 'data_sync',
      attempt: retryCount
    })
    .withTags('critical', 'retry-failed')
    .error('Operation failed', error);
}
```

### Performance Monitoring

```typescript
const perfLogger = logger.child({ category: 'Performance' });

const startTime = performance.now();
await expensiveOperation();
const duration = performance.now() - startTime;

perfLogger.withFields({
  duration,
  threshold: 1000,
  exceeded: duration > 1000
}).info('Operation completed');
```

### Fluent API (Builder Pattern)

The logger supports a fluent/builder pattern for clean, readable logging:

```typescript
// Chain multiple context builders
logger
  .withFields({ userId: '123', sessionId: 'abc' })
  .withCategory('Auth')
  .withTags('security', 'audit')
  .withContext({ ip: request.ip })
  .info('User logged in', userData);

// Use individual builders
logger.withCategory('API').info('Request received', req);
logger.withTags('performance').warn('Slow query detected', queryStats);

// Combine with variadic arguments
logger
  .withFields({ requestId: 'req-123' })
  .info('Processing', item1, item2, item3, result);
```

## Configuration Options

```typescript
interface LoggerConfig {
  enabled: boolean;          // Global enable/disable
  level: LogLevel;          // Minimum log level
  categories: {             // Category-specific settings
    [key: string]: {
      enabled: boolean;
      level?: LogLevel;
    }
  };
  output: {
    console: boolean;      // Log to browser console
    devtools: boolean;     // Send to DevTools panel
  };
  maxLogs: number;          // Maximum logs to keep (default: 10000)
  batchSize: number;        // Batch size for transmission (default: 50)
  flushInterval: number;    // Auto-flush interval in ms (default: 100)
}
```

## DevTools Panel Features

### Filtering & Search
- Filter by log level (trace through fatal)
- Filter by category
- Full-text search across messages and data
- Combine multiple filters

### Log Details
Click any log entry to see:
- Full timestamp
- Complete data payload
- Context information
- Source location (file:line:column)
- Stack traces for errors
- Associated tags

### Metrics Dashboard
Real-time metrics including:
- Total logs count
- Current logs per second
- Peak logs per second
- Error rate percentage
- Warning rate percentage
- Distribution by level
- Distribution by category

### Export Options
Export filtered logs in multiple formats:
- **JSON**: Full structured data
- **CSV**: Spreadsheet-compatible format
- **TXT**: Plain text for sharing

## Performance Considerations

- Logs are batched for efficient transmission
- Automatic cleanup prevents memory issues
- Source tracking can be disabled for performance
- Console output can be disabled when not needed

## API Reference

### Main Logger Methods

All logging methods support variadic arguments (like `console.log`):

- `trace(message, ...args)` - Detailed trace information
- `debug(message, ...args)` - Debug-level messages
- `info(message, ...args)` - Informational messages
- `warn(message, ...args)` - Warning messages
- `error(message, ...args)` - Error messages
- `fatal(message, ...args)` - Fatal error messages
- `child(options)` - Create a child logger with preset options

### Fluent API Methods

Build logging context before calling log methods:

- `withFields(fields)` - Add structured fields to the log
- `withCategory(category)` - Set the category
- `withTags(...tags)` - Add tags to the log
- `withContext(context)` - Add context metadata

All builder methods return a `LoggerContext` that supports chaining and has all logging methods (trace, debug, info, warn, error, fatal).

### Configuration Methods

- `setEnabled(enabled)` - Enable/disable logging
- `setLevel(level)` - Set minimum log level
- `setCategoryConfig(category, config)` - Configure a category
- `getConfig()` - Get current configuration
- `getMetrics()` - Get current metrics
- `forceFlush()` - Force flush pending logs
- `exportLogs(format)` - Export logs in specified format

### Structured Logging Methods

- `setGlobalFields(fields, merge?)` - Set global structured fields for all logs
- `getGlobalFields()` - Get current global structured fields
- `clearGlobalFields()` - Clear all global structured fields
- `startCorrelation(id?)` - Start a correlation context (returns correlation ID)
- `endCorrelation()` - End the current correlation context
- `getCorrelationId()` - Get the current correlation ID
- `withCorrelation(fn, id?)` - Execute function within correlation context
- `withCorrelationAsync(fn, id?)` - Execute async function within correlation context
- `startTrace(id?)` - Start a trace context (returns OpenTelemetry-compatible trace ID)
- `endTrace()` - End the current trace context
- `getTraceId()` - Get the current trace ID
- `withTrace(fn, id?)` - Execute function within trace context
- `withTraceAsync(fn, id?)` - Execute async function within trace context
- `newSpanId()` - Generate a new OpenTelemetry-compatible span ID
- `structured(level, message, fields, data?)` - Log with structured fields (convenience method)
- `timedOperation(operation, fn, fields?)` - Execute and time an async operation with logging

## License

MIT

---

Part of the @sucoza TanStack DevTools ecosystem.