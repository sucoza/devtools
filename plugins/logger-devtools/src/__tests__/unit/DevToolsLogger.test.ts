import { describe, it, expect, beforeEach, afterEach, vi, Mock } from 'vitest';
import { DevToolsLogger, logger, ChildLogger } from '../../DevToolsLogger';
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

  describe('Logging Methods', () => {
    it('should have trace method', () => {
      expect(typeof logger.trace).toBe('function');
      
      // Test that method calls don't throw
      expect(() => logger.trace('Test trace message')).not.toThrow();
    });

    it('should have debug method', () => {
      expect(typeof logger.debug).toBe('function');
      
      // Test that method calls don't throw
      expect(() => logger.debug('Test debug message')).not.toThrow();
    });

    it('should have info method', () => {
      expect(typeof logger.info).toBe('function');
      
      // Test that method calls don't throw
      expect(() => logger.info('Test info message')).not.toThrow();
    });

    it('should have warn method', () => {
      expect(typeof logger.warn).toBe('function');
      
      // Test that method calls don't throw
      expect(() => logger.warn('Test warning message')).not.toThrow();
    });

    it('should have error method', () => {
      expect(typeof logger.error).toBe('function');
      
      // Test that method calls don't throw
      expect(() => logger.error('Test error message')).not.toThrow();
    });

    it('should have fatal method', () => {
      expect(typeof logger.fatal).toBe('function');
      
      // Test that method calls don't throw
      expect(() => logger.fatal('Test fatal message')).not.toThrow();
    });
  });

  describe('Category Logging', () => {
    it('should support category overload syntax', () => {
      expect(() => {
        logger.info('UserAuth', 'User logged in successfully');
      }).not.toThrow();
    });

    it('should support options with category', () => {
      expect(() => {
        logger.info('Test message', { user: 'john' }, { category: 'UserAuth' });
      }).not.toThrow();
    });
  });

  describe('Data Logging', () => {
    it('should accept data in log entries', () => {
      const testData = { userId: 123, action: 'login' };
      
      expect(() => {
        logger.info('User action', testData);
      }).not.toThrow();
    });

    it('should handle function data', () => {
      const testData = {
        fn: () => 'test',
        value: 42,
      };
      
      expect(() => {
        logger.info('Test with function', testData);
      }).not.toThrow();
    });

    it('should handle Error objects', () => {
      const error = new Error('Test error');
      
      expect(() => {
        logger.error('An error occurred', error);
      }).not.toThrow();
    });
  });

  describe('Log Level Filtering', () => {
    it('should have setLevel method', () => {
      expect(typeof logger.setLevel).toBe('function');
      
      expect(() => {
        logger.setLevel('warn');
        logger.trace('Should be filtered');
        logger.debug('Should be filtered'); 
        logger.info('Should be filtered');
        logger.warn('Should not be filtered');
        logger.error('Should not be filtered');
      }).not.toThrow();
    });

    it('should have setEnabled method', () => {
      expect(typeof logger.setEnabled).toBe('function');
      
      expect(() => {
        logger.setEnabled(false);
        logger.error('Should not be logged');
        logger.setEnabled(true);
      }).not.toThrow();
    });
  });

  describe('Category Configuration', () => {
    it('should have setCategoryConfig method', () => {
      expect(typeof logger.setCategoryConfig).toBe('function');
      
      expect(() => {
        logger.setCategoryConfig('UserAuth', { enabled: false });
        logger.info('General', 'This should log');
        logger.info('UserAuth', 'This should not log');
      }).not.toThrow();
    });

    it('should support category-specific log levels', () => {
      expect(() => {
        logger.setCategoryConfig('UserAuth', { enabled: true, level: 'error' });
        logger.info('UserAuth', 'Should be filtered');
        logger.error('UserAuth', 'Should not be filtered');
      }).not.toThrow();
    });
  });

  describe('Batch Logging', () => {
    it('should handle batch logging configuration', () => {
      const config = logger.getConfig();
      expect(config.batchSize).toBeGreaterThan(0);
      
      expect(() => {
        // Log multiple messages
        for (let i = 0; i < 10; i++) {
          logger.info(`Batch message ${i}`);
        }
      }).not.toThrow();
    });
  });

  describe('Metrics', () => {
    it('should provide metrics through getMetrics method', () => {
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
        })
      );
    });
  });

  describe('Force Flush', () => {
    it('should have forceFlush method', () => {
      expect(typeof logger.forceFlush).toBe('function');
      
      expect(() => {
        logger.info('Test message for flush');
        logger.forceFlush();
      }).not.toThrow();
    });
  });
});

describe('ChildLogger', () => {
  let parentLogger: DevToolsLogger;
  let childLogger: ChildLogger;

  beforeEach(() => {
    parentLogger = DevToolsLogger.getInstance();
    childLogger = parentLogger.child({
      category: 'ChildCategory',
      context: { component: 'TestComponent' },
      tags: ['child-tag'],
    });
  });

  it('should create child logger with preset options', () => {
    expect(childLogger).toBeInstanceOf(ChildLogger);
    
    expect(() => {
      childLogger.info('Child log message');
    }).not.toThrow();
  });

  it('should support additional options', () => {
    expect(() => {
      childLogger.info('Child log', { data: 'test' }, { 
        context: { additional: 'context' },
        tags: ['additional-tag'],
      });
    }).not.toThrow();
  });

  it('should support category overload', () => {
    expect(() => {
      childLogger.info('OverrideCategory', 'Override message');
    }).not.toThrow();
  });

  it('should create nested child loggers', () => {
    expect(() => {
      const nestedChild = childLogger.child({
        category: 'NestedCategory',
        context: { nested: true },
        tags: ['nested-tag'],
      });
      
      nestedChild.info('Nested log message');
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
});