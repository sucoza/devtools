import { loggingEventClient, LogLevel, LogEntry, LoggerConfig, LogMetrics, StructuredFields } from './loggingEventClient';

const LOG_LEVELS: Record<LogLevel, number> = {
  trace: 0,
  debug: 1,
  info: 2,
  warn: 3,
  error: 4,
  fatal: 5,
};

export interface LoggerOptions {
  category?: string;
  context?: Record<string, any>;
  tags?: string[];
  // Structured logging fields
  fields?: StructuredFields;
}

/**
 * LoggerContext provides a fluent API for building log calls with structured data
 */
class LoggerContext {
  constructor(
    private parent: DevToolsLogger,
    private options: LoggerOptions = {}
  ) {}

  /**
   * Add structured fields to this log context
   */
  withFields(fields: StructuredFields): LoggerContext {
    return new LoggerContext(this.parent, {
      ...this.options,
      fields: { ...this.options.fields, ...fields }
    });
  }

  /**
   * Set the category for logs in this context
   */
  withCategory(category: string): LoggerContext {
    return new LoggerContext(this.parent, {
      ...this.options,
      category
    });
  }

  /**
   * Add tags to logs in this context
   */
  withTags(...tags: string[]): LoggerContext {
    return new LoggerContext(this.parent, {
      ...this.options,
      tags: [...(this.options.tags || []), ...tags]
    });
  }

  /**
   * Add context metadata to logs
   */
  withContext(context: Record<string, any>): LoggerContext {
    return new LoggerContext(this.parent, {
      ...this.options,
      context: { ...this.options.context, ...context }
    });
  }

  // Logging methods with variadic arguments (like console.log)
  trace(message: string, ...args: any[]): void {
    this.parent['_log']('trace', message, args.length > 0 ? args : undefined, this.options);
  }

  debug(message: string, ...args: any[]): void {
    this.parent['_log']('debug', message, args.length > 0 ? args : undefined, this.options);
  }

  info(message: string, ...args: any[]): void {
    this.parent['_log']('info', message, args.length > 0 ? args : undefined, this.options);
  }

  warn(message: string, ...args: any[]): void {
    this.parent['_log']('warn', message, args.length > 0 ? args : undefined, this.options);
  }

  error(message: string, ...args: any[]): void {
    this.parent['_log']('error', message, args.length > 0 ? args : undefined, this.options);
  }

  fatal(message: string, ...args: any[]): void {
    this.parent['_log']('fatal', message, args.length > 0 ? args : undefined, this.options);
  }
}

class DevToolsLogger {
  private static instance: DevToolsLogger | null = null;
  private config: LoggerConfig = {
    enabled: true,
    level: 'info',
    categories: {},
    output: {
      console: true,
      devtools: true,
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
    structured: {
      enabled: true,
      autoTracing: false,
      includeHostname: false,
      includeTimestamp: true,
    },
  };

  private logBuffer: LogEntry[] = [];
  private logHistory: LogEntry[] = []; // Keep history for DevTools panel
  private logIdCounter: number = 0;

  // Structured logging context management
  private globalContext: StructuredFields = {};
  private scopedContext: Map<string, StructuredFields> = new Map();
  private currentCorrelationId: string | null = null;
  private currentTraceId: string | null = null;
  private hostname: string | null = null;

  private generateUniqueId(): string {
    // Include counter and random component to ensure uniqueness
    return `${Date.now()}-${++this.logIdCounter}-${Math.random().toString(36).substring(2, 11)}`;
  }

  private generateCorrelationId(): string {
    return `corr-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }

  private generateTraceId(): string {
    // OpenTelemetry compatible format (16 bytes hex)
    return Array.from({ length: 32 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
  }

  private generateSpanId(): string {
    // OpenTelemetry compatible format (8 bytes hex)
    return Array.from({ length: 16 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
  }

  private getHostname(): string {
    if (this.hostname) return this.hostname;

    // Try to get hostname from various sources
    if (typeof window !== 'undefined') {
      this.hostname = window.location?.hostname || 'browser';
    } else if (typeof globalThis !== 'undefined' && globalThis.process?.env?.HOSTNAME) {
      this.hostname = globalThis.process.env.HOSTNAME;
    } else {
      this.hostname = 'unknown';
    }

    return this.hostname;
  }

  private metrics: LogMetrics = {
    totalLogs: 0,
    logsPerSecond: 0,
    errorRate: 0,
    warningRate: 0,
    logsByLevel: {
      trace: 0,
      debug: 0,
      info: 0,
      warn: 0,
      error: 0,
      fatal: 0,
    },
    logsByCategory: {},
    averageLogSize: 0,
    peakLogsPerSecond: 0,
    lastLogTime: Date.now(),
  };

  private flushTimer: any = null;
  private metricsTimer: any = null;
  private recentLogs: { timestamp: number }[] = [];
  private totalLogSize = 0;
  private originalConsole: {
    log: typeof console.log;
    debug: typeof console.debug;
    info: typeof console.info;
    warn: typeof console.warn;
    error: typeof console.error;
    trace: typeof console.trace;
  } | null = null;
  private consoleIntercepted = false;
  private interceptingConsole = false; // Flag to prevent recursion
  private consoleCallCount = 0; // Track console calls to detect runaway situations
  private consoleCallResetTimer: ReturnType<typeof setTimeout> | null = null;
  private eventClientUnsubscribers: (() => void)[] = [];

  private constructor() {
    this.startFlushTimer();
    this.startMetricsTimer();
    this.setupConfigListener();
    this.setupConsoleIntercept();
    
    // Emit initial state after a small delay to ensure event client is connected
    setTimeout(() => {
      const logsMap = new Map<string, LogEntry>();
      this.logHistory.forEach(log => logsMap.set(log.id, log));
      this.logBuffer.forEach(log => logsMap.set(log.id, log));
      const allLogs = Array.from(logsMap.values());
      loggingEventClient.emit('logs-response', allLogs);
    }, 50);
  }

  static getInstance(): DevToolsLogger {
    if (!DevToolsLogger.instance) {
      DevToolsLogger.instance = new DevToolsLogger();
    }
    return DevToolsLogger.instance;
  }

  private setupConfigListener() {
    this.eventClientUnsubscribers.push(
      loggingEventClient.on('config-update', (event: any) => {
        this.updateConfig(event.payload);
      })
    );

    this.eventClientUnsubscribers.push(
      loggingEventClient.on('config-request', () => {
        loggingEventClient.emit('config-response', this.config);
      })
    );

    this.eventClientUnsubscribers.push(
      loggingEventClient.on('logs-request', () => {
        // Combine history and buffer, removing duplicates
        const logsMap = new Map<string, LogEntry>();

        // Add history logs first
        this.logHistory.forEach(log => logsMap.set(log.id, log));

        // Add buffer logs (will overwrite if duplicate ID exists)
        this.logBuffer.forEach(log => logsMap.set(log.id, log));

        const allLogs = Array.from(logsMap.values());
        loggingEventClient.emit('logs-response', allLogs);
      })
    );

    this.eventClientUnsubscribers.push(
      loggingEventClient.on('clear-logs', () => {
        this.clearLogs();
      })
    );
  }

  private updateConfig(updates: Partial<LoggerConfig>) {
    const oldInterceptConfig = this.config.intercept;
    this.config = { ...this.config, ...updates };
    
    if (updates.flushInterval !== undefined) {
      this.startFlushTimer();
    }
    
    // Handle console interception changes
    if (updates.intercept && 
        (oldInterceptConfig.enabled !== this.config.intercept.enabled ||
         oldInterceptConfig.console !== this.config.intercept.console)) {
      this.setupConsoleIntercept();
    }
  }

  private setupConsoleIntercept() {
    if (this.config.intercept.enabled && this.config.intercept.console) {
      this.enableConsoleIntercept();
    } else {
      this.disableConsoleIntercept();
    }
  }

  private enableConsoleIntercept() {
    if (this.consoleIntercepted || typeof console === 'undefined') return;

    // Store original console methods
    this.originalConsole = {
      log: console.log.bind(console),
      debug: console.debug.bind(console),
      info: console.info.bind(console),
      warn: console.warn.bind(console),
      error: console.error.bind(console),
      trace: console.trace.bind(console),
    };

    // Override console methods
    if (this.originalConsole) {
      console.log = (...args) => this.interceptConsoleCall('info', args, this.originalConsole.log);
      console.debug = (...args) => this.interceptConsoleCall('debug', args, this.originalConsole.debug);
      console.info = (...args) => this.interceptConsoleCall('info', args, this.originalConsole.info);
      console.warn = (...args) => this.interceptConsoleCall('warn', args, this.originalConsole.warn);
      console.error = (...args) => this.interceptConsoleCall('error', args, this.originalConsole.error);
      console.trace = (...args) => this.interceptConsoleCall('trace', args, this.originalConsole.trace);
    }

    this.consoleIntercepted = true;
  }

  private disableConsoleIntercept() {
    if (!this.consoleIntercepted || !this.originalConsole) return;

    // Restore original console methods
    console.log = this.originalConsole.log;
    console.debug = this.originalConsole.debug;
    console.info = this.originalConsole.info;
    console.warn = this.originalConsole.warn;
    console.error = this.originalConsole.error;
    console.trace = this.originalConsole.trace;

    this.consoleIntercepted = false;
  }

  private interceptConsoleCall(
    level: LogLevel, 
    args: any[], 
    originalMethod: (...args: any[]) => void
  ) {
    // Prevent recursion - if we're already processing a console call, just pass through
    if (this.interceptingConsole) {
      originalMethod(...args);
      return;
    }

    // Safety check: if we're getting too many console calls rapidly, disable interception
    this.consoleCallCount++;
    if (this.consoleCallCount > 100) {
      // Reset counter every second (only one timer at a time)
      if (!this.consoleCallResetTimer) {
        this.consoleCallResetTimer = setTimeout(() => {
          this.consoleCallCount = 0;
          this.consoleCallResetTimer = null;
        }, 1000);
      }

      if (this.consoleCallCount > 500) {
        // Disable console interception if we hit too many calls
        this.disableConsoleIntercept();
        originalMethod(...args);
        return;
      }
    }

    this.interceptingConsole = true;

    try {
      // Call original method if preserveOriginal is enabled
      if (this.config.intercept.preserveOriginal) {
        // Temporarily disable interception to prevent loops
        const wasIntercepted = this.consoleIntercepted;
        this.disableConsoleIntercept();
        originalMethod(...args);
        if (wasIntercepted) {
          this.enableConsoleIntercept();
        }
      }

      // Skip logging if the console call is from our own logger to prevent infinite loops
      const stack = new Error().stack || '';
      if (stack.includes('DevToolsLogger') || 
          stack.includes('logToConsole') || 
          stack.includes('loggingEventClient') ||
          stack.includes('tanstack') ||
          stack.includes('devtools')) {
        return;
      }

      // Format message and data from console arguments
      let message = '';
      let data: any = undefined;

      if (args.length === 0) {
        message = '';
      } else if (args.length === 1) {
        if (typeof args[0] === 'string') {
          message = args[0];
        } else {
          message = '[Object]';
          data = args[0];
        }
      } else {
        // Multiple arguments - first as message, rest as data
        message = typeof args[0] === 'string' ? args[0] : '[Object]';
        data = args.length > 1 ? args.slice(1) : args[0];
      }

      // Extract stack trace for source info (more accurate than our default method)
      let sourceInfo: LogEntry['source'] = undefined;
      if (this.config.intercept.includeTrace) {
        const lines = stack.split('\n');
        
        // Skip the first few lines which are from our interception
        for (let i = 3; i < lines.length; i++) {
          const line = lines[i];
          if (!line.includes('DevToolsLogger') && 
              !line.includes('interceptConsoleCall') &&
              !line.includes('logToConsole') &&
              !line.includes('node_modules') &&
              !line.includes('tanstack') &&
              !line.includes('devtools')) {
            const match = line.match(/at\s+(.+?)\s+\((.+?):(\d+):(\d+)\)/) ||
                         line.match(/at\s+(.+?):(\d+):(\d+)/);
            if (match) {
              sourceInfo = {
                function: match[1]?.trim() || 'anonymous',
                file: match[2] || match[1],
                line: parseInt(match[match.length - 2], 10),
                column: parseInt(match[match.length - 1], 10),
              };
              break;
            }
          }
        }
      }

      // Create log entry directly without going through our normal log method
      // to avoid any potential console output from the logging process
      const entry: LogEntry = {
        id: this.generateUniqueId(),
        timestamp: Date.now(),
        level,
        message,
        data: data !== undefined ? this.cleanData(data) : undefined,
        context: { intercepted: true },
        category: 'Console',
        tags: ['console-intercept'],
        source: sourceInfo,
      };

      // Update metrics
      this.metrics.totalLogs++;
      this.metrics.logsByLevel[level]++;
      this.metrics.lastLogTime = entry.timestamp;
      this.metrics.logsByCategory['Console'] = (this.metrics.logsByCategory['Console'] || 0) + 1;
      this.recentLogs.push({ timestamp: entry.timestamp });
      this.totalLogSize += JSON.stringify(entry).length;

      // Add to buffer for DevTools (bypass normal logging to prevent console output)
      if (this.config.output.devtools) {
        this.logBuffer.push(entry);
        
        // Trim buffer if it exceeds max size
        if (this.logBuffer.length > this.config.maxLogs) {
          this.logBuffer = this.logBuffer.slice(-this.config.maxLogs);
        }
      }
    } catch {
      // If anything goes wrong, silently fail to prevent console spam
    } finally {
      this.interceptingConsole = false;
    }
  }

  private startFlushTimer() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    this.flushTimer = setInterval(() => this.flush(), this.config.flushInterval);
  }

  private startMetricsTimer() {
    if (this.metricsTimer) {
      clearInterval(this.metricsTimer);
    }
    this.metricsTimer = setInterval(() => this.updateMetrics(), 1000);
  }

  private updateMetrics() {
    const now = Date.now();
    const oneSecondAgo = now - 1000;
    
    // Calculate logs per second
    this.recentLogs = this.recentLogs.filter(log => log.timestamp > oneSecondAgo);
    const logsPerSecond = this.recentLogs.length;
    
    this.metrics.logsPerSecond = logsPerSecond;
    this.metrics.peakLogsPerSecond = Math.max(this.metrics.peakLogsPerSecond, logsPerSecond);
    
    // Calculate error and warning rates
    const totalRecent = this.recentLogs.length || 1;
    const recentErrors = this.recentLogs.filter((_, i) => {
      const level = this.logBuffer[i]?.level;
      return level === 'error' || level === 'fatal';
    }).length;
    const recentWarnings = this.recentLogs.filter((_, i) => {
      return this.logBuffer[i]?.level === 'warn';
    }).length;
    
    this.metrics.errorRate = (recentErrors / totalRecent) * 100;
    this.metrics.warningRate = (recentWarnings / totalRecent) * 100;
    this.metrics.averageLogSize = this.metrics.totalLogs > 0 
      ? this.totalLogSize / this.metrics.totalLogs 
      : 0;

    loggingEventClient.emit('metrics-update', this.metrics);
  }

  private clearLogs() {
    // Clear both buffer and history, but don't reset metrics
    this.logBuffer = [];
    this.logHistory = [];
  }

  private clearMetrics() {
    this.metrics = {
      totalLogs: 0,
      logsPerSecond: 0,
      errorRate: 0,
      warningRate: 0,
      logsByLevel: {
        trace: 0,
        debug: 0,
        info: 0,
        warn: 0,
        error: 0,
        fatal: 0,
      },
      logsByCategory: {},
      averageLogSize: 0,
      peakLogsPerSecond: 0,
      lastLogTime: Date.now(),
    };
    this.recentLogs = [];
    this.logBuffer = [];
    this.logHistory = [];
    this.totalLogSize = 0;
    loggingEventClient.emit('metrics-update', this.metrics);
  }

  private shouldLog(level: LogLevel, category?: string): boolean {
    if (!this.config.enabled) return false;
    
    // Check category-specific settings
    if (category && this.config.categories[category]) {
      const catConfig = this.config.categories[category];
      if (!catConfig.enabled) return false;
      if (catConfig.level) {
        return LOG_LEVELS[level] >= LOG_LEVELS[catConfig.level];
      }
    }
    
    return LOG_LEVELS[level] >= LOG_LEVELS[this.config.level];
  }

  private extractSourceInfo(): LogEntry['source'] {
    const error = new Error();
    const stack = error.stack || '';
    const lines = stack.split('\n');
    
    // Try to find the first line that's not from this logger
    for (let i = 2; i < lines.length; i++) {
      const line = lines[i];
      if (!line.includes('DevToolsLogger') && !line.includes('loggingEventClient')) {
        const match = line.match(/at\s+(.+?)\s+\((.+?):(\d+):(\d+)\)/);
        if (match) {
          return {
            function: match[1],
            file: match[2],
            line: parseInt(match[3], 10),
            column: parseInt(match[4], 10),
          };
        }
      }
    }
    return undefined;
  }

  private mergeStructuredFields(options?: LoggerOptions): StructuredFields | undefined {
    if (!this.config.structured.enabled) {
      return options?.fields;
    }

    const fields: StructuredFields = {};

    // 1. Global config fields (lowest priority)
    if (this.config.structured.globalFields) {
      Object.assign(fields, this.config.structured.globalFields);
    }

    // 2. Global context fields
    Object.assign(fields, this.globalContext);

    // 3. Auto-generated fields
    if (this.config.structured.autoTracing) {
      if (!fields.correlationId && this.currentCorrelationId) {
        fields.correlationId = this.currentCorrelationId;
      }
      if (!fields.traceId && this.currentTraceId) {
        fields.traceId = this.currentTraceId;
      }
    }

    // 4. Hostname if enabled
    if (this.config.structured.includeHostname && !fields.hostname) {
      fields.hostname = this.getHostname();
    }

    // 5. Options fields (highest priority)
    if (options?.fields) {
      Object.assign(fields, options.fields);
    }

    return Object.keys(fields).length > 0 ? fields : undefined;
  }

  // Internal logging method (renamed from log to _log)
  private _log(level: LogLevel, message: string, data?: any, options?: LoggerOptions, sourceOverride?: LogEntry['source']) {
    const category = options?.category;

    if (!this.shouldLog(level, category)) {
      return;
    }

    // Merge structured fields from all sources
    const structuredFields = this.mergeStructuredFields(options);

    const entry: LogEntry = {
      id: this.generateUniqueId(),
      timestamp: Date.now(),
      level,
      message,
      data: data !== undefined ? this.cleanData(data) : undefined,
      fields: structuredFields,
      context: options?.context,
      category,
      tags: options?.tags,
      source: sourceOverride || this.extractSourceInfo(),
    };

    // Add stack trace for errors
    if (data instanceof Error) {
      entry.stack = data.stack;
    }

    // Update metrics
    this.metrics.totalLogs++;
    this.metrics.logsByLevel[level]++;
    this.metrics.lastLogTime = entry.timestamp;
    if (category) {
      this.metrics.logsByCategory[category] = (this.metrics.logsByCategory[category] || 0) + 1;
    }
    this.recentLogs.push({ timestamp: entry.timestamp });
    this.totalLogSize += JSON.stringify(entry).length;

    // Output to console if enabled
    if (this.config.output.console) {
      this.logToConsole(entry);
    }

    // Add to buffer for DevTools
    if (this.config.output.devtools) {
      this.logBuffer.push(entry);

      // Trim buffer if it exceeds max size
      if (this.logBuffer.length > this.config.maxLogs) {
        this.logBuffer = this.logBuffer.slice(-this.config.maxLogs);
      }

      // Auto-flush if buffer is full
      if (this.logBuffer.length >= this.config.batchSize) {
        this.flush();
      }
    }
  }

  private cleanData(data: any): any {
    if (data === null || data === undefined) return data;
    if (typeof data === 'function') return '[Function]';
    if (typeof data === 'symbol') return '[Symbol]';
    if (data instanceof Promise) return '[Promise]';
    if (data instanceof Error) {
      return {
        name: data.name,
        message: data.message,
        stack: data.stack,
      };
    }
    
    if (Array.isArray(data)) {
      return data.map(item => this.cleanData(item));
    }
    
    if (typeof data === 'object') {
      const cleaned: any = {};
      for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
          cleaned[key] = this.cleanData(data[key]);
        }
      }
      return cleaned;
    }
    
    return data;
  }

  private logToConsole(entry: LogEntry) {
    // Don't output to console if we're currently intercepting to prevent loops
    if (this.interceptingConsole) {
      return;
    }

    // Don't output intercepted console messages back to console
    if (entry.category === 'Console' && entry.context?.intercepted) {
      return;
    }

    const timestamp = new Date(entry.timestamp).toISOString();
    const prefix = `[${timestamp}] [${entry.level.toUpperCase()}]`;
    const categoryPrefix = entry.category ? `[${entry.category}]` : '';
    const message = `${prefix}${categoryPrefix} ${entry.message}`;
    
    const args = [message];
    if (entry.data !== undefined) {
      args.push(entry.data);
    }

    // If console is intercepted, use original methods to avoid recursion
    if (this.consoleIntercepted && this.originalConsole) {
      switch (entry.level) {
        case 'trace':
        case 'debug':
          this.originalConsole.debug(...args);
          break;
        case 'info':
          this.originalConsole.info(...args);
          break;
        case 'warn':
          this.originalConsole.warn(...args);
          break;
        case 'error':
        case 'fatal':
          this.originalConsole.error(...args);
          break;
      }
    } else {
      switch (entry.level) {
        case 'trace':
        case 'debug':
          // console.debug(...args);
          break;
        case 'info':
          // console.info(...args);
          break;
        case 'warn':
          // console.warn(...args);
          break;
        case 'error':
        case 'fatal':
          // console.error(...args);
          break;
      }
    }
  }

  private flush() {
    if (this.logBuffer.length === 0) return;
    
    // Add to history before flushing, avoiding duplicates
    const existingIds = new Set(this.logHistory.map(log => log.id));
    const newLogs = this.logBuffer.filter(log => !existingIds.has(log.id));
    this.logHistory = [...this.logHistory, ...newLogs].slice(-10000);
    
    if (this.logBuffer.length === 1) {
      loggingEventClient.emit('log-entry', this.logBuffer[0]);
    } else {
      loggingEventClient.emit('log-batch', [...this.logBuffer]);
    }
    
    this.logBuffer = [];
  }

  // ============================================================================
  // Public Logging API - Variadic arguments like console.log
  // ============================================================================

  /**
   * Log at trace level with variadic arguments
   * @param message - Log message
   * @param args - Additional arguments (data, objects, etc.)
   */
  trace(message: string, ...args: any[]): void {
    this._log('trace', message, args.length > 0 ? args : undefined);
  }

  /**
   * Log at debug level with variadic arguments
   * @param message - Log message
   * @param args - Additional arguments (data, objects, etc.)
   */
  debug(message: string, ...args: any[]): void {
    this._log('debug', message, args.length > 0 ? args : undefined);
  }

  /**
   * Log at info level with variadic arguments
   * @param message - Log message
   * @param args - Additional arguments (data, objects, etc.)
   */
  info(message: string, ...args: any[]): void {
    this._log('info', message, args.length > 0 ? args : undefined);
  }

  /**
   * Log at warn level with variadic arguments
   * @param message - Log message
   * @param args - Additional arguments (data, objects, etc.)
   */
  warn(message: string, ...args: any[]): void {
    this._log('warn', message, args.length > 0 ? args : undefined);
  }

  /**
   * Log at error level with variadic arguments
   * @param message - Log message
   * @param args - Additional arguments (data, objects, etc.)
   */
  error(message: string, ...args: any[]): void {
    this._log('error', message, args.length > 0 ? args : undefined);
  }

  /**
   * Log at fatal level with variadic arguments
   * @param message - Log message
   * @param args - Additional arguments (data, objects, etc.)
   */
  fatal(message: string, ...args: any[]): void {
    this._log('fatal', message, args.length > 0 ? args : undefined);
  }

  // ============================================================================
  // Fluent API - Builder pattern for structured logging
  // ============================================================================

  /**
   * Create a logging context with structured fields
   * @param fields - Structured fields to include in logs
   * @returns LoggerContext for chaining
   * @example
   * logger.withFields({ userId: '123', requestId: 'abc' }).info('User logged in')
   */
  withFields(fields: StructuredFields): LoggerContext {
    return new LoggerContext(this, { fields });
  }

  /**
   * Create a logging context with a category
   * @param category - Category for logs
   * @returns LoggerContext for chaining
   * @example
   * logger.withCategory('API').info('Request received')
   */
  withCategory(category: string): LoggerContext {
    return new LoggerContext(this, { category });
  }

  /**
   * Create a logging context with tags
   * @param tags - Tags to attach to logs
   * @returns LoggerContext for chaining
   * @example
   * logger.withTags('performance', 'critical').warn('High latency detected')
   */
  withTags(...tags: string[]): LoggerContext {
    return new LoggerContext(this, { tags });
  }

  /**
   * Create a logging context with metadata
   * @param context - Context metadata
   * @returns LoggerContext for chaining
   * @example
   * logger.withContext({ version: '1.0' }).info('App started')
   */
  withContext(context: Record<string, any>): LoggerContext {
    return new LoggerContext(this, { context });
  }

  // ============================================================================
  // Structured Logging API
  // ============================================================================

  /**
   * Set global structured fields that will be included in all logs
   * @param fields - Structured fields to set globally
   * @param merge - If true, merge with existing fields; if false, replace
   */
  setGlobalFields(fields: StructuredFields, merge: boolean = true): void {
    if (merge) {
      this.globalContext = { ...this.globalContext, ...fields };
    } else {
      this.globalContext = { ...fields };
    }
  }

  /**
   * Get current global structured fields
   */
  getGlobalFields(): StructuredFields {
    return { ...this.globalContext };
  }

  /**
   * Clear all global structured fields
   */
  clearGlobalFields(): void {
    this.globalContext = {};
  }

  /**
   * Start a new correlation context - all logs will include this correlation ID
   * @param correlationId - Optional correlation ID; generates one if not provided
   * @returns The correlation ID being used
   */
  startCorrelation(correlationId?: string): string {
    this.currentCorrelationId = correlationId || this.generateCorrelationId();
    return this.currentCorrelationId;
  }

  /**
   * End the current correlation context
   */
  endCorrelation(): void {
    this.currentCorrelationId = null;
  }

  /**
   * Get the current correlation ID
   */
  getCorrelationId(): string | null {
    return this.currentCorrelationId;
  }

  /**
   * Start a new trace context - all logs will include this trace ID
   * @param traceId - Optional trace ID; generates OpenTelemetry-compatible one if not provided
   * @returns The trace ID being used
   */
  startTrace(traceId?: string): string {
    this.currentTraceId = traceId || this.generateTraceId();
    return this.currentTraceId;
  }

  /**
   * End the current trace context
   */
  endTrace(): void {
    this.currentTraceId = null;
  }

  /**
   * Get the current trace ID
   */
  getTraceId(): string | null {
    return this.currentTraceId;
  }

  /**
   * Execute a function within a correlation context
   * @param fn - Function to execute
   * @param correlationId - Optional correlation ID
   */
  withCorrelation<T>(fn: () => T, correlationId?: string): T {
    const _id = this.startCorrelation(correlationId);
    try {
      return fn();
    } finally {
      this.endCorrelation();
    }
  }

  /**
   * Execute an async function within a correlation context
   * @param fn - Async function to execute
   * @param correlationId - Optional correlation ID
   */
  async withCorrelationAsync<T>(fn: () => Promise<T>, correlationId?: string): Promise<T> {
    const _id = this.startCorrelation(correlationId);
    try {
      return await fn();
    } finally {
      this.endCorrelation();
    }
  }

  /**
   * Execute a function within a trace context
   * @param fn - Function to execute
   * @param traceId - Optional trace ID
   */
  withTrace<T>(fn: () => T, traceId?: string): T {
    const _id = this.startTrace(traceId);
    try {
      return fn();
    } finally {
      this.endTrace();
    }
  }

  /**
   * Execute an async function within a trace context
   * @param fn - Async function to execute
   * @param traceId - Optional trace ID
   */
  async withTraceAsync<T>(fn: () => Promise<T>, traceId?: string): Promise<T> {
    const _id = this.startTrace(traceId);
    try {
      return await fn();
    } finally {
      this.endTrace();
    }
  }

  /**
   * Generate a new span ID for distributed tracing
   */
  newSpanId(): string {
    return this.generateSpanId();
  }

  /**
   * Log with structured fields (convenience method)
   * @param level - Log level
   * @param message - Log message
   * @param fields - Structured fields
   * @param data - Additional unstructured data
   */
  structured(level: LogLevel, message: string, fields: StructuredFields, data?: any): void {
    this._log(level, message, data, { fields });
  }

  /**
   * Log a structured operation with timing
   * @param operation - Operation name
   * @param fn - Function to execute and time
   * @param fields - Additional structured fields
   */
  async timedOperation<T>(
    operation: string,
    fn: () => Promise<T>,
    fields?: StructuredFields
  ): Promise<T> {
    const startTime = Date.now();
    const spanId = this.generateSpanId();

    this.info(`Starting operation: ${operation}`, undefined, {
      fields: {
        ...fields,
        action: 'start',
        operation,
        spanId,
      },
    });

    try {
      const result = await fn();
      const duration = Date.now() - startTime;

      this.info(`Completed operation: ${operation}`, undefined, {
        fields: {
          ...fields,
          action: 'complete',
          operation,
          spanId,
          duration,
        },
      });

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;

      this.error(`Failed operation: ${operation}`, error, {
        fields: {
          ...fields,
          action: 'error',
          operation,
          spanId,
          duration,
        },
      });

      throw error;
    }
  }

  // Create a child logger with preset options
  child(options: LoggerOptions): ChildLogger {
    return new ChildLogger(this, options);
  }

  // Configuration methods
  setEnabled(enabled: boolean) {
    this.updateConfig({ enabled });
  }

  setLevel(level: LogLevel) {
    this.updateConfig({ level });
  }

  setCategoryConfig(category: string, config: { enabled: boolean; level?: LogLevel }) {
    this.updateConfig({
      categories: {
        ...this.config.categories,
        [category]: config,
      },
    });
  }

  getConfig(): LoggerConfig {
    return { ...this.config };
  }

  getMetrics(): LogMetrics {
    return { ...this.metrics };
  }

  // Force flush all pending logs
  forceFlush() {
    this.flush();
  }

  // Clean up all resources
  destroy() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    if (this.metricsTimer) {
      clearInterval(this.metricsTimer);
      this.metricsTimer = null;
    }
    if (this.consoleCallResetTimer) {
      clearTimeout(this.consoleCallResetTimer);
      this.consoleCallResetTimer = null;
    }
    this.disableConsoleIntercept();
    this.eventClientUnsubscribers.forEach(unsub => unsub());
    this.eventClientUnsubscribers = [];
    this.flush();
    DevToolsLogger.instance = null;
  }

  // Console interception methods
  enableConsoleCapture(options?: {
    preserveOriginal?: boolean;
    includeTrace?: boolean;
  }) {
    this.updateConfig({
      intercept: {
        ...this.config.intercept,
        enabled: true,
        console: true,
        preserveOriginal: options?.preserveOriginal ?? true,
        includeTrace: options?.includeTrace ?? false,
      },
    });
  }

  disableConsoleCapture() {
    this.updateConfig({
      intercept: {
        ...this.config.intercept,
        enabled: false,
      },
    });
  }

  isConsoleCaptureEnabled(): boolean {
    return this.config.intercept.enabled && this.config.intercept.console;
  }

  // Export logs
  exportLogs(format: 'json' | 'csv' | 'txt' = 'json'): string {
    const logs = [...this.logBuffer];
    
    switch (format) {
      case 'json':
        return JSON.stringify(logs, null, 2);
      
      case 'csv': {
        const headers = ['timestamp', 'level', 'category', 'message', 'data'];
        const rows = logs.map(log => [
          new Date(log.timestamp).toISOString(),
          log.level,
          log.category || '',
          log.message,
          JSON.stringify(log.data || ''),
        ]);
        return [headers, ...rows].map(row => row.join(',')).join('\n');
      }
      
      case 'txt':
        return logs.map(log => {
          const time = new Date(log.timestamp).toISOString();
          const cat = log.category ? `[${log.category}]` : '';
          return `[${time}] [${log.level}]${cat} ${log.message} ${log.data ? JSON.stringify(log.data) : ''}`;
        }).join('\n');
      
      default:
        return '';
    }
  }
}

// Child logger with preset options
class ChildLogger {
  constructor(
    private parent: DevToolsLogger,
    private options: LoggerOptions
  ) {}

  // Logging methods with variadic arguments
  trace(message: string, ...args: any[]): void {
    this.parent['_log']('trace', message, args.length > 0 ? args : undefined, this.options);
  }

  debug(message: string, ...args: any[]): void {
    this.parent['_log']('debug', message, args.length > 0 ? args : undefined, this.options);
  }

  info(message: string, ...args: any[]): void {
    this.parent['_log']('info', message, args.length > 0 ? args : undefined, this.options);
  }

  warn(message: string, ...args: any[]): void {
    this.parent['_log']('warn', message, args.length > 0 ? args : undefined, this.options);
  }

  error(message: string, ...args: any[]): void {
    this.parent['_log']('error', message, args.length > 0 ? args : undefined, this.options);
  }

  fatal(message: string, ...args: any[]): void {
    this.parent['_log']('fatal', message, args.length > 0 ? args : undefined, this.options);
  }

  // Fluent API methods for child logger
  withFields(fields: StructuredFields): LoggerContext {
    return new LoggerContext(this.parent, {
      ...this.options,
      fields: { ...this.options.fields, ...fields }
    });
  }

  withCategory(category: string): LoggerContext {
    return new LoggerContext(this.parent, {
      ...this.options,
      category
    });
  }

  withTags(...tags: string[]): LoggerContext {
    return new LoggerContext(this.parent, {
      ...this.options,
      tags: [...(this.options.tags || []), ...tags]
    });
  }

  withContext(context: Record<string, any>): LoggerContext {
    return new LoggerContext(this.parent, {
      ...this.options,
      context: { ...this.options.context, ...context }
    });
  }

  // Create another child logger with merged options
  child(options: LoggerOptions): ChildLogger {
    return new ChildLogger(this.parent, {
      category: options.category || this.options.category,
      context: { ...this.options.context, ...options.context },
      tags: [...(this.options.tags || []), ...(options.tags || [])],
      fields: { ...this.options.fields, ...options.fields },
    });
  }
}

// Export singleton instance
export const logger = DevToolsLogger.getInstance();

// Export for custom instances if needed
export { DevToolsLogger, ChildLogger, LoggerContext };