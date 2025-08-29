# @sucoza/logger

A powerful, lightweight logging library with console interception, metrics collection, and flexible export capabilities.

## Features

- 📝 **Multiple Log Levels** - Trace, debug, info, warn, error, and fatal
- 🎯 **Category-based Filtering** - Organize logs by categories with individual settings
- 📊 **Real-time Metrics** - Track log rates, error rates, and performance metrics
- 🎣 **Console Interception** - Automatically capture all console output
- 👶 **Child Loggers** - Create scoped loggers with inherited settings
- 💾 **Export Formats** - Export logs as JSON, CSV, or plain text
- 🔄 **Event System** - Subscribe to log events and metrics updates
- 📦 **Zero Dependencies** - Lightweight, framework-agnostic library
- 📝 **TypeScript First** - Full type safety and IntelliSense support

## Installation

```bash
npm install @sucoza/logger
# or
yarn add @sucoza/logger
# or
pnpm add @sucoza/logger
```

## Quick Start

```typescript
import { logger } from '@sucoza/logger';

// Basic logging
logger.info('Application started');
logger.warn('Low memory', { available: '256MB' });
logger.error('Failed to connect', new Error('Connection timeout'));

// Enable console capture
logger.enableConsoleCapture();
console.log('This will be captured!'); // Automatically logged

// Create a child logger
const dbLogger = logger.child({ 
  category: 'Database',
  context: { module: 'postgres' }
});
dbLogger.info('Connected to database');
```

## Core Concepts

### Log Levels

```typescript
logger.trace('Detailed trace information');
logger.debug('Debug information');
logger.info('Informational message');
logger.warn('Warning message');
logger.error('Error message');
logger.fatal('Fatal error message');
```

### Categories and Filtering

```typescript
// Configure categories
logger.setCategoryConfig('API', {
  enabled: true,
  level: 'debug'
});

logger.setCategoryConfig('Database', {
  enabled: true,
  level: 'error' // Only log errors and above
});

// Use categories
logger.info('API request', { endpoint: '/users' }, { category: 'API' });
logger.debug('Query executed', { sql: 'SELECT * FROM users' }, { category: 'Database' });
```

### Child Loggers

```typescript
// Create scoped loggers with preset options
const apiLogger = logger.child({
  category: 'API',
  context: { service: 'user-service' },
  tags: ['backend', 'rest']
});

const dbLogger = logger.child({
  category: 'Database',
  context: { database: 'postgres' }
});

// All logs from child loggers include their context
apiLogger.info('Request received'); // Includes category: 'API', service: 'user-service'
dbLogger.error('Connection failed'); // Includes category: 'Database', database: 'postgres'

// Child loggers can create their own children
const authLogger = apiLogger.child({
  context: { module: 'authentication' }
});
```

### Console Interception

```typescript
// Enable console capture with options
logger.enableConsoleCapture({
  preserveOriginal: true,  // Still output to console
  includeTrace: true       // Include stack traces
});

// All console methods are intercepted
console.log('Regular log');      // Captured as 'info'
console.debug('Debug message');  // Captured as 'debug'
console.warn('Warning');         // Captured as 'warn'
console.error('Error occurred'); // Captured as 'error'

// Disable when needed
logger.disableConsoleCapture();
```

### Real-time Metrics

```typescript
// Get current metrics
const metrics = logger.getMetrics();
console.log(metrics);
/*
{
  totalLogs: 1523,
  logsPerSecond: 12,
  errorRate: 2.5,        // Percentage
  warningRate: 5.3,      // Percentage
  logsByLevel: {
    trace: 100,
    debug: 423,
    info: 750,
    warn: 200,
    error: 45,
    fatal: 5
  },
  logsByCategory: {
    'API': 523,
    'Database': 234,
    'Auth': 766
  },
  averageLogSize: 256,   // Bytes
  peakLogsPerSecond: 45,
  lastLogTime: 1699564234567
}
*/

// Subscribe to metrics updates
logger.on('metrics-updated', (metrics) => {
  console.log('Current log rate:', metrics.logsPerSecond);
});
```

## API Reference

### Logger Class

#### Configuration Methods

| Method | Description |
|--------|-------------|
| `setEnabled(enabled: boolean)` | Enable/disable logging globally |
| `setLevel(level: LogLevel)` | Set global minimum log level |
| `setCategoryConfig(category, config)` | Configure category-specific settings |
| `updateConfig(config: Partial<LoggerConfig>)` | Update logger configuration |
| `getConfig()` | Get current configuration |

#### Logging Methods

| Method | Description |
|--------|-------------|
| `trace(message, data?, options?)` | Log trace level message |
| `debug(message, data?, options?)` | Log debug level message |
| `info(message, data?, options?)` | Log info level message |
| `warn(message, data?, options?)` | Log warning level message |
| `error(message, data?, options?)` | Log error level message |
| `fatal(message, data?, options?)` | Log fatal level message |
| `child(options: LoggerOptions)` | Create child logger with preset options |

#### Console Capture

| Method | Description |
|--------|-------------|
| `enableConsoleCapture(options?)` | Enable console interception |
| `disableConsoleCapture()` | Disable console interception |
| `isConsoleCaptureEnabled()` | Check if console capture is active |

#### Data Management

| Method | Description |
|--------|-------------|
| `getLogs()` | Get all logged entries |
| `clearLogs()` | Clear log buffer and history |
| `clearMetrics()` | Reset all metrics |
| `getMetrics()` | Get current metrics |
| `exportLogs(format)` | Export logs in specified format |
| `forceFlush()` | Force flush buffered logs |

#### Event System

| Method | Description |
|--------|-------------|
| `on(event, listener)` | Subscribe to logger events |
| `off(event, listener)` | Unsubscribe from events |
| `destroy()` | Clean up all resources |

### Configuration Options

```typescript
interface LoggerConfig {
  enabled: boolean;              // Global enable/disable
  level: LogLevel;              // Minimum log level
  categories: Record<string, {  // Category configurations
    enabled: boolean;
    level?: LogLevel;
  }>;
  output: {
    console: boolean;           // Output to console
    custom?: (entry: LogEntry) => void; // Custom output handler
  };
  maxLogs: number;              // Maximum logs in buffer
  batchSize: number;            // Batch size for flushing
  flushInterval: number;        // Auto-flush interval (ms)
  intercept: {
    enabled: boolean;           // Enable interception
    console: boolean;           // Intercept console
    preserveOriginal: boolean;  // Keep original console output
    includeTrace: boolean;      // Include stack traces
  };
}
```

### Events

```typescript
// Subscribe to events
logger.on('log-entry', (entry: LogEntry) => {
  console.log('New log:', entry);
});

logger.on('log-batch', (entries: LogEntry[]) => {
  console.log('Batch of logs:', entries.length);
});

logger.on('metrics-updated', (metrics: LogMetrics) => {
  console.log('Metrics:', metrics);
});

logger.on('config-updated', (config: LoggerConfig) => {
  console.log('Config changed:', config);
});
```

Available events:
- `log-entry` - Single log entry added
- `log-batch` - Batch of logs flushed
- `metrics-updated` - Metrics updated (every second)
- `metrics-cleared` - Metrics reset
- `logs-cleared` - Logs cleared
- `config-updated` - Configuration changed

### Log Entry Structure

```typescript
interface LogEntry {
  id: string;                    // Unique identifier
  timestamp: number;              // Unix timestamp
  level: LogLevel;               // Log level
  message: string;               // Log message
  data?: any;                    // Additional data
  context?: Record<string, any>; // Contextual information
  category?: string;             // Log category
  tags?: string[];               // Tags for filtering
  source?: {                     // Source location
    function?: string;
    file?: string;
    line?: number;
    column?: number;
  };
  stack?: string;                // Stack trace for errors
}
```

## Export Formats

### JSON Export

```typescript
const jsonLogs = logger.exportLogs('json');
// Returns formatted JSON string with all log entries
```

### CSV Export

```typescript
const csvLogs = logger.exportLogs('csv');
// Returns CSV with columns: timestamp, level, category, message, data
```

### Plain Text Export

```typescript
const textLogs = logger.exportLogs('txt');
// Returns human-readable text format
```

## Advanced Usage

### Custom Output Handler

```typescript
logger.updateConfig({
  output: {
    console: false, // Disable console output
    custom: (entry: LogEntry) => {
      // Send to remote logging service
      fetch('/api/logs', {
        method: 'POST',
        body: JSON.stringify(entry)
      });
    }
  }
});
```

### Structured Logging

```typescript
// Log with structured data
logger.info('User action', {
  action: 'login',
  userId: '123',
  timestamp: Date.now(),
  metadata: {
    ip: '192.168.1.1',
    userAgent: 'Mozilla/5.0...'
  }
}, {
  category: 'Auth',
  tags: ['security', 'audit']
});
```

### Performance Monitoring

```typescript
// Monitor log performance
logger.on('metrics-updated', (metrics) => {
  if (metrics.logsPerSecond > 100) {
    logger.warn('High log rate detected', {
      rate: metrics.logsPerSecond
    });
  }
  
  if (metrics.errorRate > 10) {
    logger.fatal('High error rate', {
      errorRate: `${metrics.errorRate}%`
    });
  }
});
```

### Singleton Instance

```typescript
import { Logger, logger } from '@sucoza/logger';

// Use the singleton instance
logger.info('Using singleton');

// Or create your own instance
const customLogger = Logger.getInstance();
customLogger.info('Same singleton instance');
```

## TypeScript Support

The library is written in TypeScript and provides comprehensive type definitions:

```typescript
import type {
  LogLevel,
  LogEntry,
  LoggerConfig,
  LogMetrics,
  LoggerOptions,
  ExportFormat
} from '@sucoza/logger';
```

## Best Practices

1. **Use Categories** - Organize logs by functional areas
2. **Add Context** - Include relevant context in child loggers
3. **Set Appropriate Levels** - Use trace/debug for development, info+ for production
4. **Monitor Metrics** - Watch error rates and log volume
5. **Export Regularly** - Export and archive logs periodically
6. **Clean Up** - Call `destroy()` when shutting down

## License

MIT © tyevco

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

For issues and feature requests, please use the [GitHub issues page](https://github.com/sucoza/logger/issues).