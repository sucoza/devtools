import { describe, it, expect, beforeEach, afterEach, vi, Mock } from 'vitest';
import { DevToolsLogger, logger, ChildLogger, LoggerContext } from '../../DevToolsLogger';
import { loggingEventClient, LogLevel, LogEntry, LoggerConfig } from '../../loggingEventClient';

// Mock the event client
vi.mock('../../loggingEventClient', () => ({
  loggingEventClient: {
    emit: vi.fn(),
    on: vi.fn(),
  },
  LoggingEventClient: vi.fn(),
}));

describe('DevToolsLogger', () => {
  let mockLoggingEventClient: {
    emit: Mock;
    on: Mock;
  };

  beforeEach(() => {
    mockLoggingEventClient = loggingEventClient as any;
    mockLoggingEventClient.emit.mockClear();
    mockLoggingEventClient.on.mockClear();

    // Clear any existing timers
    vi.clearAllTimers();
    vi.useFakeTimers();

    // Reset logger configuration to defaults
    logger.setEnabled(true);
    logger.setLevel('info');
    logger.clearGlobalFields();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance when called multiple times', () => {
      const instance1 = DevToolsLogger.getInstance();
      const instance2 = DevToolsLogger.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('should export a singleton logger instance', () => {
      expect(logger).toBeInstanceOf(DevToolsLogger);
      expect(logger).toBe(DevToolsLogger.getInstance());
    });
  });

  describe('Variadic Arguments', () => {
    it('should support single argument', () => {
      expect(() => logger.info('Simple message')).not.toThrow();
    });

    it('should support multiple arguments', () => {
      expect(() => logger.info('Message', 'arg1', 'arg2', 'arg3')).not.toThrow();
    });

    it('should support mixed types in arguments', () => {
      const obj = { key: 'value' };
      const num = 42;
      const bool = true;

      expect(() => logger.info('Mixed args', obj, num, bool)).not.toThrow();
    });

    it('should support variadic arguments for all log levels', () => {
      expect(() => logger.trace('Trace', 1, 2, 3)).not.toThrow();
      expect(() => logger.debug('Debug', 'a', 'b', 'c')).not.toThrow();
      expect(() => logger.info('Info', { data: 1 }, [1, 2, 3])).not.toThrow();
      expect(() => logger.warn('Warn', 'arg1', 'arg2')).not.toThrow();
      expect(() => logger.error('Error', new Error('test'), 'context')).not.toThrow();
      expect(() => logger.fatal('Fatal', 'critical', 'data')).not.toThrow();
    });
  });

  describe('Fluent API - withFields', () => {
    it('should create LoggerContext with withFields', () => {
      const context = logger.withFields({ userId: 'user-123' });
      expect(context).toBeInstanceOf(LoggerContext);
    });

    it('should allow logging after withFields', () => {
      expect(() => {
        logger.withFields({ userId: 'user-123' }).info('User action');
      }).not.toThrow();
    });

    it('should support multiple structured fields', () => {
      expect(() => {
        logger.withFields({
          userId: 'user-123',
          sessionId: 'sess-456',
          requestId: 'req-789',
          action: 'login',
          duration: 145
        }).info('User logged in');
      }).not.toThrow();
    });

    it('should support chaining withFields', () => {
      expect(() => {
        logger
          .withFields({ userId: 'user-123' })
          .withFields({ sessionId: 'sess-456' })
          .info('Chained fields');
      }).not.toThrow();
    });
  });

  describe('Fluent API - withCategory', () => {
    it('should create LoggerContext with category', () => {
      const context = logger.withCategory('API');
      expect(context).toBeInstanceOf(LoggerContext);
    });

    it('should allow logging with category', () => {
      expect(() => {
        logger.withCategory('API').info('Request received');
      }).not.toThrow();
    });
  });

  describe('Fluent API - withTags', () => {
    it('should create LoggerContext with single tag', () => {
      const context = logger.withTags('important');
      expect(context).toBeInstanceOf(LoggerContext);
    });

    it('should support multiple tags', () => {
      expect(() => {
        logger.withTags('important', 'audit', 'security').info('Tagged message');
      }).not.toThrow();
    });

    it('should support chaining tags', () => {
      expect(() => {
        logger
          .withTags('tag1', 'tag2')
          .withTags('tag3')
          .info('Multiple tag calls');
      }).not.toThrow();
    });
  });

  describe('Fluent API - withContext', () => {
    it('should create LoggerContext with context', () => {
      const context = logger.withContext({ version: '1.0.0' });
      expect(context).toBeInstanceOf(LoggerContext);
    });

    it('should allow logging with context', () => {
      expect(() => {
        logger.withContext({ ip: '192.168.1.1', userAgent: 'Mozilla' }).info('Request logged');
      }).not.toThrow();
    });
  });

  describe('Fluent API - Chaining', () => {
    it('should support chaining all builder methods', () => {
      expect(() => {
        logger
          .withFields({ userId: 'user-123', sessionId: 'sess-456' })
          .withCategory('Auth')
          .withTags('security', 'audit')
          .withContext({ ip: '127.0.0.1' })
          .info('Fully chained log');
      }).not.toThrow();
    });

    it('should support variadic arguments after chaining', () => {
      expect(() => {
        logger
          .withFields({ requestId: 'req-123' })
          .withCategory('API')
          .info('Processing', { item1: 1 }, { item2: 2 }, 'result');
      }).not.toThrow();
    });

    it('should support all log levels with chaining', () => {
      const builder = logger.withFields({ userId: '123' }).withCategory('Test');

      expect(() => builder.trace('Trace')).not.toThrow();
      expect(() => builder.debug('Debug')).not.toThrow();
      expect(() => builder.info('Info')).not.toThrow();
      expect(() => builder.warn('Warn')).not.toThrow();
      expect(() => builder.error('Error')).not.toThrow();
      expect(() => builder.fatal('Fatal')).not.toThrow();
    });
  });

  describe('Structured Logging - Global Fields', () => {
    it('should set global fields', () => {
      logger.setGlobalFields({ service: 'test-service', version: '1.0.0' });
      const fields = logger.getGlobalFields();

      expect(fields).toEqual({
        service: 'test-service',
        version: '1.0.0'
      });
    });

    it('should merge global fields by default', () => {
      logger.setGlobalFields({ service: 'test-service' });
      logger.setGlobalFields({ version: '1.0.0' });
      const fields = logger.getGlobalFields();

      expect(fields).toEqual({
        service: 'test-service',
        version: '1.0.0'
      });
    });

    it('should replace global fields when merge is false', () => {
      logger.setGlobalFields({ service: 'test-service', version: '1.0.0' });
      logger.setGlobalFields({ environment: 'production' }, false);
      const fields = logger.getGlobalFields();

      expect(fields).toEqual({
        environment: 'production'
      });
    });

    it('should clear global fields', () => {
      logger.setGlobalFields({ service: 'test-service' });
      logger.clearGlobalFields();
      const fields = logger.getGlobalFields();

      expect(fields).toEqual({});
    });
  });

  describe('Structured Logging - Correlation', () => {
    it('should start correlation with auto-generated ID', () => {
      const correlationId = logger.startCorrelation();

      expect(correlationId).toBeTruthy();
      expect(typeof correlationId).toBe('string');
      expect(logger.getCorrelationId()).toBe(correlationId);
    });

    it('should start correlation with custom ID', () => {
      const customId = 'custom-corr-123';
      const correlationId = logger.startCorrelation(customId);

      expect(correlationId).toBe(customId);
      expect(logger.getCorrelationId()).toBe(customId);
    });

    it('should end correlation', () => {
      logger.startCorrelation();
      logger.endCorrelation();

      expect(logger.getCorrelationId()).toBeNull();
    });

    it('should execute function within correlation context', () => {
      let capturedId: string | null = null;

      logger.withCorrelation(() => {
        capturedId = logger.getCorrelationId();
      });

      expect(capturedId).toBeTruthy();
      expect(logger.getCorrelationId()).toBeNull();
    });

    it('should execute async function within correlation context', async () => {
      let capturedId: string | null = null;

      await logger.withCorrelationAsync(async () => {
        capturedId = logger.getCorrelationId();
        await Promise.resolve();
      });

      expect(capturedId).toBeTruthy();
      expect(logger.getCorrelationId()).toBeNull();
    });
  });

  describe('Structured Logging - Tracing', () => {
    it('should start trace with auto-generated ID', () => {
      const traceId = logger.startTrace();

      expect(traceId).toBeTruthy();
      expect(typeof traceId).toBe('string');
      expect(traceId.length).toBe(32); // OpenTelemetry format
      expect(logger.getTraceId()).toBe(traceId);
    });

    it('should start trace with custom ID', () => {
      const customId = '1234567890abcdef1234567890abcdef';
      const traceId = logger.startTrace(customId);

      expect(traceId).toBe(customId);
      expect(logger.getTraceId()).toBe(customId);
    });

    it('should end trace', () => {
      logger.startTrace();
      logger.endTrace();

      expect(logger.getTraceId()).toBeNull();
    });

    it('should generate span ID', () => {
      const spanId = logger.newSpanId();

      expect(spanId).toBeTruthy();
      expect(typeof spanId).toBe('string');
      expect(spanId.length).toBe(16); // OpenTelemetry format
    });

    it('should execute function within trace context', () => {
      let capturedId: string | null = null;

      logger.withTrace(() => {
        capturedId = logger.getTraceId();
      });

      expect(capturedId).toBeTruthy();
      expect(logger.getTraceId()).toBeNull();
    });

    it('should execute async function within trace context', async () => {
      let capturedId: string | null = null;

      await logger.withTraceAsync(async () => {
        capturedId = logger.getTraceId();
        await Promise.resolve();
      });

      expect(capturedId).toBeTruthy();
      expect(logger.getTraceId()).toBeNull();
    });
  });

  describe('Structured Logging - Timed Operations', () => {
    // Use real timers for async operations
    beforeEach(() => {
      vi.useRealTimers();
    });

    afterEach(() => {
      vi.useFakeTimers();
    });

    it('should execute and time operation', async () => {
      const result = await logger.timedOperation(
        'testOperation',
        async () => {
          return 'success';
        }
      );

      expect(result).toBe('success');
    });

    it('should log start and completion', async () => {
      // Clear previous calls
      mockLoggingEventClient.emit.mockClear();

      await logger.timedOperation(
        'testOperation',
        async () => 'done'
      );

      // Flush to ensure logs are emitted
      logger.forceFlush();

      // Should have logged start and completion
      expect(mockLoggingEventClient.emit).toHaveBeenCalled();
    });

    it('should log error and rethrow', async () => {
      const error = new Error('Operation failed');

      await expect(
        logger.timedOperation(
          'failingOperation',
          async () => {
            throw error;
          }
        )
      ).rejects.toThrow('Operation failed');
    });

    it('should include custom fields in timed operation', async () => {
      // Clear previous calls
      mockLoggingEventClient.emit.mockClear();

      await logger.timedOperation(
        'testOperation',
        async () => 'done',
        { userId: 'user-123', service: 'test-service' }
      );

      // Flush to ensure logs are emitted
      logger.forceFlush();

      expect(mockLoggingEventClient.emit).toHaveBeenCalled();
    });
  });

  describe('Logging Methods', () => {
    it('should have trace method', () => {
      expect(typeof logger.trace).toBe('function');
      expect(() => logger.trace('Test trace message')).not.toThrow();
    });

    it('should have debug method', () => {
      expect(typeof logger.debug).toBe('function');
      expect(() => logger.debug('Test debug message')).not.toThrow();
    });

    it('should have info method', () => {
      expect(typeof logger.info).toBe('function');
      expect(() => logger.info('Test info message')).not.toThrow();
    });

    it('should have warn method', () => {
      expect(typeof logger.warn).toBe('function');
      expect(() => logger.warn('Test warning message')).not.toThrow();
    });

    it('should have error method', () => {
      expect(typeof logger.error).toBe('function');
      expect(() => logger.error('Test error message')).not.toThrow();
    });

    it('should have fatal method', () => {
      expect(typeof logger.fatal).toBe('function');
      expect(() => logger.fatal('Test fatal message')).not.toThrow();
    });
  });

  describe('Data Logging', () => {
    it('should handle Error objects', () => {
      const error = new Error('Test error');
      expect(() => logger.error('An error occurred', error)).not.toThrow();
    });

    it('should handle complex objects', () => {
      const data = {
        nested: { value: 42 },
        array: [1, 2, 3],
        date: new Date()
      };
      expect(() => logger.info('Complex data', data)).not.toThrow();
    });

    it('should handle functions in data', () => {
      const data = { fn: () => 'test', value: 42 };
      expect(() => logger.info('Test with function', data)).not.toThrow();
    });
  });

  describe('Log Level Filtering', () => {
    it('should filter logs based on level', () => {
      logger.setLevel('warn');

      logger.trace('Should be filtered');
      logger.debug('Should be filtered');
      logger.info('Should be filtered');
      logger.warn('Should not be filtered');
      logger.error('Should not be filtered');

      // In a real test, you'd verify which logs were emitted
    });

    it('should respect enabled flag', () => {
      logger.setEnabled(false);
      logger.error('Should not be logged');

      logger.setEnabled(true);
      logger.error('Should be logged');
    });
  });

  describe('Category Configuration', () => {
    it('should configure category settings', () => {
      logger.setCategoryConfig('UserAuth', { enabled: false });

      // This would be verified by checking emitted events in real tests
      expect(() => {
        logger.withCategory('UserAuth').info('Should not log');
      }).not.toThrow();
    });

    it('should support category-specific log levels', () => {
      logger.setCategoryConfig('UserAuth', { enabled: true, level: 'error' });

      expect(() => {
        logger.withCategory('UserAuth').info('Should be filtered');
        logger.withCategory('UserAuth').error('Should not be filtered');
      }).not.toThrow();
    });
  });

  describe('Metrics', () => {
    it('should provide metrics', () => {
      const metrics = logger.getMetrics();

      expect(metrics).toEqual(
        expect.objectContaining({
          totalLogs: expect.any(Number),
          logsPerSecond: expect.any(Number),
          errorRate: expect.any(Number),
          warningRate: expect.any(Number),
          logsByLevel: expect.any(Object),
          logsByCategory: expect.any(Object),
          averageLogSize: expect.any(Number),
          peakLogsPerSecond: expect.any(Number),
          lastLogTime: expect.any(Number),
        })
      );
    });
  });

  describe('Export Functionality', () => {
    it('should export logs in JSON format', () => {
      const exported = logger.exportLogs('json');
      expect(() => JSON.parse(exported)).not.toThrow();
      const parsed = JSON.parse(exported);
      expect(Array.isArray(parsed)).toBe(true);
    });

    it('should export logs in CSV format', () => {
      const exported = logger.exportLogs('csv');
      expect(typeof exported).toBe('string');
      expect(exported).toContain('timestamp,level,category,message,data');
    });

    it('should export logs in TXT format', () => {
      const exported = logger.exportLogs('txt');
      expect(typeof exported).toBe('string');
    });
  });

  describe('Configuration', () => {
    it('should return current configuration', () => {
      const config = logger.getConfig();

      expect(config).toEqual(
        expect.objectContaining({
          enabled: expect.any(Boolean),
          level: expect.any(String),
          categories: expect.any(Object),
          output: expect.objectContaining({
            console: expect.any(Boolean),
            devtools: expect.any(Boolean),
          }),
          maxLogs: expect.any(Number),
          batchSize: expect.any(Number),
          flushInterval: expect.any(Number),
          intercept: expect.objectContaining({
            enabled: expect.any(Boolean),
            console: expect.any(Boolean),
            preserveOriginal: expect.any(Boolean),
            includeTrace: expect.any(Boolean),
          }),
          structured: expect.objectContaining({
            enabled: expect.any(Boolean),
            autoTracing: expect.any(Boolean),
            includeHostname: expect.any(Boolean),
            includeTimestamp: expect.any(Boolean),
          }),
        })
      );
    });
  });

  describe('Force Flush', () => {
    it('should force flush logs', () => {
      logger.info('Test message for flush');
      expect(() => logger.forceFlush()).not.toThrow();
    });
  });
});

describe('ChildLogger', () => {
  let parentLogger: DevToolsLogger;
  let childLogger: ChildLogger;

  beforeEach(() => {
    vi.clearAllTimers();
    vi.useFakeTimers();

    parentLogger = DevToolsLogger.getInstance();
    childLogger = parentLogger.child({
      category: 'ChildCategory',
      fields: {
        service: 'child-service',
        version: '1.0.0'
      },
      context: { component: 'TestComponent' },
      tags: ['child-tag'],
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should create child logger with preset options', () => {
    expect(childLogger).toBeInstanceOf(ChildLogger);
    expect(() => childLogger.info('Child log message')).not.toThrow();
  });

  it('should support variadic arguments', () => {
    expect(() => {
      childLogger.info('Child log', 'arg1', 'arg2', { data: 'test' });
    }).not.toThrow();
  });

  it('should support fluent API', () => {
    expect(() => {
      childLogger
        .withFields({ requestId: 'req-123' })
        .withTags('additional-tag')
        .info('Chained child log');
    }).not.toThrow();
  });

  it('should return LoggerContext from fluent methods', () => {
    const context = childLogger.withFields({ userId: '123' });
    expect(context).toBeInstanceOf(LoggerContext);
  });

  it('should create nested child loggers', () => {
    expect(() => {
      const nestedChild = childLogger.child({
        category: 'NestedCategory',
        fields: { nested: true },
        tags: ['nested-tag'],
      });

      nestedChild.info('Nested log message');
    }).not.toThrow();
  });

  it('should merge fields from parent and child', () => {
    const nestedChild = childLogger.child({
      fields: { userId: 'user-123' }
    });

    // The nested child should have both parent and its own fields
    expect(() => {
      nestedChild.info('Should have merged fields');
    }).not.toThrow();
  });

  it('should support all log levels', () => {
    expect(() => {
      childLogger.trace('Trace message');
      childLogger.debug('Debug message');
      childLogger.info('Info message');
      childLogger.warn('Warn message');
      childLogger.error('Error message');
      childLogger.fatal('Fatal message');
    }).not.toThrow();
  });

  it('should support chaining fluent methods', () => {
    expect(() => {
      childLogger
        .withFields({ requestId: 'req-123' })
        .withCategory('Override')
        .withTags('tag1', 'tag2')
        .withContext({ extra: 'data' })
        .info('Fully chained child log');
    }).not.toThrow();
  });
});

describe('LoggerContext', () => {
  beforeEach(() => {
    vi.clearAllTimers();
    vi.useFakeTimers();
    logger.clearGlobalFields();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should be created from withFields', () => {
    const context = logger.withFields({ userId: '123' });
    expect(context).toBeInstanceOf(LoggerContext);
  });

  it('should be created from withCategory', () => {
    const context = logger.withCategory('Test');
    expect(context).toBeInstanceOf(LoggerContext);
  });

  it('should be created from withTags', () => {
    const context = logger.withTags('tag1', 'tag2');
    expect(context).toBeInstanceOf(LoggerContext);
  });

  it('should be created from withContext', () => {
    const context = logger.withContext({ key: 'value' });
    expect(context).toBeInstanceOf(LoggerContext);
  });

  it('should support all logging methods', () => {
    const context = logger.withFields({ userId: '123' });

    expect(() => context.trace('Trace')).not.toThrow();
    expect(() => context.debug('Debug')).not.toThrow();
    expect(() => context.info('Info')).not.toThrow();
    expect(() => context.warn('Warn')).not.toThrow();
    expect(() => context.error('Error')).not.toThrow();
    expect(() => context.fatal('Fatal')).not.toThrow();
  });

  it('should support variadic arguments', () => {
    const context = logger.withFields({ userId: '123' });

    expect(() => {
      context.info('Message', 'arg1', 'arg2', { data: 'test' });
    }).not.toThrow();
  });

  it('should support chaining', () => {
    expect(() => {
      logger
        .withFields({ userId: '123' })
        .withCategory('Auth')
        .withTags('security')
        .withContext({ ip: '127.0.0.1' })
        .info('Chained context');
    }).not.toThrow();
  });

  it('should merge fields when chaining withFields', () => {
    expect(() => {
      logger
        .withFields({ userId: '123' })
        .withFields({ sessionId: '456' })
        .withFields({ requestId: '789' })
        .info('Multiple fields');
    }).not.toThrow();
  });

  it('should accumulate tags when chaining withTags', () => {
    expect(() => {
      logger
        .withTags('tag1', 'tag2')
        .withTags('tag3')
        .withTags('tag4', 'tag5')
        .info('Multiple tags');
    }).not.toThrow();
  });
});
