import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Logger, ChildLogger, logger } from '../index';
import type {
  LogLevel,
  LogEntry,
  LoggerConfig,
  LogMetrics,
  LoggerOptions,
  ExportFormat,
} from '../index';

describe('logger exports', () => {
  it('exports Logger class', () => {
    expect(Logger).toBeTypeOf('function');
  });

  it('exports ChildLogger class', () => {
    expect(ChildLogger).toBeTypeOf('function');
  });

  it('exports singleton logger instance', () => {
    expect(logger).toBeDefined();
    expect(logger).toBeInstanceOf(Logger);
  });
});

describe('Logger', () => {
  let loggerInstance: Logger;

  beforeEach(() => {
    loggerInstance = Logger.getInstance();
    // Suppress console output during tests
    loggerInstance.updateConfig({ output: { console: false } });
    loggerInstance.clearLogs();
    loggerInstance.clearMetrics();
  });

  afterEach(() => {
    loggerInstance.disableConsoleCapture();
    loggerInstance.destroy();
    // Reset singleton so next getInstance creates fresh
    (Logger as any).instance = null;
  });

  it('returns the same instance via getInstance', () => {
    const instance1 = Logger.getInstance();
    const instance2 = Logger.getInstance();
    expect(instance1).toBe(instance2);
  });

  it('has all log level methods', () => {
    expect(loggerInstance.trace).toBeTypeOf('function');
    expect(loggerInstance.debug).toBeTypeOf('function');
    expect(loggerInstance.info).toBeTypeOf('function');
    expect(loggerInstance.warn).toBeTypeOf('function');
    expect(loggerInstance.error).toBeTypeOf('function');
    expect(loggerInstance.fatal).toBeTypeOf('function');
  });

  it('logs messages and retrieves them', () => {
    loggerInstance.info('test message');
    loggerInstance.forceFlush();
    const logs = loggerInstance.getLogs();
    expect(logs.length).toBeGreaterThanOrEqual(1);
    const testLog = logs.find(l => l.message === 'test message');
    expect(testLog).toBeDefined();
    expect(testLog!.level).toBe('info');
  });

  it('respects log level filtering', () => {
    loggerInstance.setLevel('warn');
    loggerInstance.info('should be filtered');
    loggerInstance.warn('should appear');
    loggerInstance.forceFlush();
    const logs = loggerInstance.getLogs();
    expect(logs.find(l => l.message === 'should be filtered')).toBeUndefined();
    expect(logs.find(l => l.message === 'should appear')).toBeDefined();
  });

  it('can be disabled', () => {
    loggerInstance.setEnabled(false);
    loggerInstance.info('should not be logged');
    loggerInstance.forceFlush();
    const logs = loggerInstance.getLogs();
    expect(logs.find(l => l.message === 'should not be logged')).toBeUndefined();
  });

  it('provides configuration', () => {
    const config = loggerInstance.getConfig();
    expect(config).toHaveProperty('enabled');
    expect(config).toHaveProperty('level');
    expect(config).toHaveProperty('categories');
  });

  it('provides metrics', () => {
    const metrics = loggerInstance.getMetrics();
    expect(metrics).toHaveProperty('totalLogs');
    expect(metrics).toHaveProperty('logsPerSecond');
    expect(metrics).toHaveProperty('logsByLevel');
  });

  it('exports logs as JSON', () => {
    loggerInstance.info('export test');
    loggerInstance.forceFlush();
    const exported = loggerInstance.exportLogs('json');
    expect(() => JSON.parse(exported)).not.toThrow();
  });

  it('exports logs as CSV', () => {
    loggerInstance.info('csv test');
    loggerInstance.forceFlush();
    const exported = loggerInstance.exportLogs('csv');
    expect(exported).toContain('timestamp');
    expect(exported).toContain('level');
  });

  it('exports logs as text', () => {
    loggerInstance.info('txt test');
    loggerInstance.forceFlush();
    const exported = loggerInstance.exportLogs('txt');
    expect(exported).toContain('txt test');
  });

  it('clears logs', () => {
    loggerInstance.info('will be cleared');
    loggerInstance.forceFlush();
    loggerInstance.clearLogs();
    const logs = loggerInstance.getLogs();
    expect(logs).toHaveLength(0);
  });

  it('supports event listeners', () => {
    let receivedData: any = null;
    loggerInstance.on('log-entry', (data) => {
      receivedData = data;
    });
    loggerInstance.info('event test');
    loggerInstance.forceFlush();
    expect(receivedData).toBeDefined();
    expect(receivedData.message).toBe('event test');
  });

  it('creates child loggers', () => {
    const child = loggerInstance.child({ category: 'TestCategory' });
    expect(child).toBeInstanceOf(ChildLogger);
    child.info('child message');
    loggerInstance.forceFlush();
    const logs = loggerInstance.getLogs();
    const childLog = logs.find(l => l.message === 'child message');
    expect(childLog).toBeDefined();
    expect(childLog!.category).toBe('TestCategory');
  });
});
