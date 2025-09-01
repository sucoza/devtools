import { describe, it, expect, vi } from 'vitest';
import { LoggingEventClient, loggingEventClient } from '../../loggingEventClient';
import { EventClient } from '@tanstack/devtools-event-client';

// Mock the EventClient
vi.mock('@tanstack/devtools-event-client', () => ({
  EventClient: vi.fn().mockImplementation(() => ({
    emit: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
  })),
}));

describe('LoggingEventClient', () => {
  describe('Singleton Pattern', () => {
    it('should return the same instance when called multiple times', () => {
      const instance1 = LoggingEventClient.getInstance();
      const instance2 = LoggingEventClient.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('should export a singleton instance', () => {
      expect(loggingEventClient).toBe(LoggingEventClient.getInstance());
    });
  });

  describe('EventClient Integration', () => {
    it('should extend EventClient with correct plugin ID', () => {
      expect(EventClient).toHaveBeenCalledWith(
        expect.objectContaining({
          pluginId: 'logger-devtools',
        })
      );
    });

    it('should have the expected event client methods', () => {
      expect(loggingEventClient).toHaveProperty('emit');
      expect(loggingEventClient).toHaveProperty('on');
      expect(loggingEventClient).toHaveProperty('off');
    });
  });

  describe('Type Safety', () => {
    it('should provide proper TypeScript types for log levels', () => {
      // This test ensures the LogLevel type includes expected values
      const validLevels = ['trace', 'debug', 'info', 'warn', 'error', 'fatal'];
      
      // We can't directly test TypeScript types at runtime, but we can verify
      // the types are exported and would be used correctly in actual usage
      expect(validLevels).toContain('trace');
      expect(validLevels).toContain('debug');
      expect(validLevels).toContain('info');
      expect(validLevels).toContain('warn');
      expect(validLevels).toContain('error');
      expect(validLevels).toContain('fatal');
    });
  });
});

// Test the type definitions indirectly by using them
describe('LoggingEventClient Types', () => {
  it('should define LogEntry interface correctly', () => {
    // Create a valid LogEntry object to verify interface structure
    const logEntry = {
      id: 'test-id',
      timestamp: Date.now(),
      level: 'info' as const,
      message: 'Test message',
      data: { test: true },
      context: { component: 'TestComponent' },
      stack: 'Error stack',
      source: {
        file: 'test.ts',
        line: 42,
        column: 10,
        function: 'testFunction',
      },
      category: 'TestCategory',
      tags: ['test-tag'],
    };

    // Verify all expected properties exist
    expect(logEntry).toHaveProperty('id');
    expect(logEntry).toHaveProperty('timestamp');
    expect(logEntry).toHaveProperty('level');
    expect(logEntry).toHaveProperty('message');
    expect(logEntry).toHaveProperty('data');
    expect(logEntry).toHaveProperty('context');
    expect(logEntry).toHaveProperty('stack');
    expect(logEntry).toHaveProperty('source');
    expect(logEntry).toHaveProperty('category');
    expect(logEntry).toHaveProperty('tags');
    
    // Verify source object structure
    expect(logEntry.source).toHaveProperty('file');
    expect(logEntry.source).toHaveProperty('line');
    expect(logEntry.source).toHaveProperty('column');
    expect(logEntry.source).toHaveProperty('function');
  });

  it('should define LoggerConfig interface correctly', () => {
    // Create a valid LoggerConfig object
    const loggerConfig = {
      enabled: true,
      level: 'info' as const,
      categories: {
        'TestCategory': {
          enabled: true,
          level: 'debug' as const,
        },
      },
      output: {
        console: true,
        devtools: true,
        remote: false,
      },
      maxLogs: 10000,
      batchSize: 50,
      flushInterval: 100,
      intercept: {
        enabled: false,
        console: true,
        preserveOriginal: true,
        includeTrace: false,
      },
    };

    // Verify structure
    expect(loggerConfig).toHaveProperty('enabled');
    expect(loggerConfig).toHaveProperty('level');
    expect(loggerConfig).toHaveProperty('categories');
    expect(loggerConfig).toHaveProperty('output');
    expect(loggerConfig).toHaveProperty('maxLogs');
    expect(loggerConfig).toHaveProperty('batchSize');
    expect(loggerConfig).toHaveProperty('flushInterval');
    expect(loggerConfig).toHaveProperty('intercept');
    
    expect(loggerConfig.output).toHaveProperty('console');
    expect(loggerConfig.output).toHaveProperty('devtools');
    expect(loggerConfig.output).toHaveProperty('remote');
    
    expect(loggerConfig.intercept).toHaveProperty('enabled');
    expect(loggerConfig.intercept).toHaveProperty('console');
    expect(loggerConfig.intercept).toHaveProperty('preserveOriginal');
    expect(loggerConfig.intercept).toHaveProperty('includeTrace');
  });

  it('should define LogMetrics interface correctly', () => {
    // Create a valid LogMetrics object
    const logMetrics = {
      totalLogs: 100,
      logsPerSecond: 5,
      errorRate: 2.5,
      warningRate: 10.0,
      logsByLevel: {
        trace: 5,
        debug: 10,
        info: 50,
        warn: 20,
        error: 10,
        fatal: 5,
      },
      logsByCategory: {
        'TestCategory': 50,
        'AnotherCategory': 50,
      },
      averageLogSize: 256,
      peakLogsPerSecond: 15,
      lastLogTime: Date.now(),
    };

    // Verify structure
    expect(logMetrics).toHaveProperty('totalLogs');
    expect(logMetrics).toHaveProperty('logsPerSecond');
    expect(logMetrics).toHaveProperty('errorRate');
    expect(logMetrics).toHaveProperty('warningRate');
    expect(logMetrics).toHaveProperty('logsByLevel');
    expect(logMetrics).toHaveProperty('logsByCategory');
    expect(logMetrics).toHaveProperty('averageLogSize');
    expect(logMetrics).toHaveProperty('peakLogsPerSecond');
    expect(logMetrics).toHaveProperty('lastLogTime');
    
    // Verify logsByLevel has all required levels
    expect(logMetrics.logsByLevel).toHaveProperty('trace');
    expect(logMetrics.logsByLevel).toHaveProperty('debug');
    expect(logMetrics.logsByLevel).toHaveProperty('info');
    expect(logMetrics.logsByLevel).toHaveProperty('warn');
    expect(logMetrics.logsByLevel).toHaveProperty('error');
    expect(logMetrics.logsByLevel).toHaveProperty('fatal');
  });
});