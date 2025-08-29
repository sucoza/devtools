import { 
  LogLevel, 
  LogEntry, 
  LoggerConfig, 
  LogMetrics, 
  LoggerOptions,
  ExportFormat 
} from './types';

const LOG_LEVELS: Record<LogLevel, number> = {
  trace: 0,
  debug: 1,
  info: 2,
  warn: 3,
  error: 4,
  fatal: 5,
};

export class Logger {
  private static instance: Logger | null = null;
  private config: LoggerConfig = {
    enabled: true,
    level: 'info',
    categories: {},
    output: {
      console: true,
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

  private logBuffer: LogEntry[] = [];
  private logHistory: LogEntry[] = [];
  private logIdCounter: number = 0;
  private listeners = new Map<string, Set<(data: any) => void>>();
  
  private generateUniqueId(): string {
    return `${Date.now()}-${++this.logIdCounter}-${Math.random().toString(36).substr(2, 9)}`;
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
  private interceptingConsole = false;
  private consoleCallCount = 0;

  private constructor() {
    this.startFlushTimer();
    this.startMetricsTimer();
    this.setupConsoleIntercept();
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  updateConfig(updates: Partial<LoggerConfig>): void {
    const oldInterceptConfig = this.config.intercept;
    this.config = { ...this.config, ...updates };
    
    if (updates.flushInterval !== undefined) {
      this.startFlushTimer();
    }
    
    if (updates.intercept && 
        (oldInterceptConfig.enabled !== this.config.intercept.enabled ||
         oldInterceptConfig.console !== this.config.intercept.console)) {
      this.setupConsoleIntercept();
    }

    this.emit('config-updated', this.config);
  }

  private setupConsoleIntercept(): void {
    if (this.config.intercept.enabled && this.config.intercept.console) {
      this.enableConsoleIntercept();
    } else {
      this.disableConsoleIntercept();
    }
  }

  private enableConsoleIntercept(): void {
    if (this.consoleIntercepted || typeof console === 'undefined') return;

    this.originalConsole = {
      log: console.log.bind(console),
      debug: console.debug.bind(console),
      info: console.info.bind(console),
      warn: console.warn.bind(console),
      error: console.error.bind(console),
      trace: console.trace.bind(console),
    };

    console.log = (...args) => this.interceptConsoleCall('info', args, this.originalConsole!.log);
    console.debug = (...args) => this.interceptConsoleCall('debug', args, this.originalConsole!.debug);
    console.info = (...args) => this.interceptConsoleCall('info', args, this.originalConsole!.info);
    console.warn = (...args) => this.interceptConsoleCall('warn', args, this.originalConsole!.warn);
    console.error = (...args) => this.interceptConsoleCall('error', args, this.originalConsole!.error);
    console.trace = (...args) => this.interceptConsoleCall('trace', args, this.originalConsole!.trace);

    this.consoleIntercepted = true;
  }

  private disableConsoleIntercept(): void {
    if (!this.consoleIntercepted || !this.originalConsole) return;

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
  ): void {
    if (this.interceptingConsole) {
      originalMethod(...args);
      return;
    }

    this.consoleCallCount++;
    if (this.consoleCallCount > 100) {
      setTimeout(() => {
        this.consoleCallCount = Math.max(0, this.consoleCallCount - 50);
      }, 1000);

      if (this.consoleCallCount > 500) {
        console.error('[Logger] Disabling console interception due to excessive calls');
        this.disableConsoleIntercept();
        originalMethod(...args);
        return;
      }
    }

    this.interceptingConsole = true;

    try {
      if (this.config.intercept.preserveOriginal) {
        const wasIntercepted = this.consoleIntercepted;
        this.disableConsoleIntercept();
        originalMethod(...args);
        if (wasIntercepted) {
          this.enableConsoleIntercept();
        }
      }

      const stack = new Error().stack || '';
      if (stack.includes('Logger') || 
          stack.includes('logToConsole')) {
        return;
      }

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
        message = typeof args[0] === 'string' ? args[0] : '[Object]';
        data = args.length > 1 ? args.slice(1) : args[0];
      }

      let sourceInfo: LogEntry['source'] = undefined;
      if (this.config.intercept.includeTrace) {
        const lines = stack.split('\n');
        
        for (let i = 3; i < lines.length; i++) {
          const line = lines[i];
          if (!line.includes('Logger') && 
              !line.includes('interceptConsoleCall') &&
              !line.includes('logToConsole') &&
              !line.includes('node_modules')) {
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

      this.processLogEntry(entry);
    } catch (error) {
      // Silent fail
    } finally {
      this.interceptingConsole = false;
    }
  }

  private startFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    this.flushTimer = setInterval(() => this.flush(), this.config.flushInterval);
  }

  private startMetricsTimer(): void {
    if (this.metricsTimer) {
      clearInterval(this.metricsTimer);
    }
    this.metricsTimer = setInterval(() => this.updateMetrics(), 1000);
  }

  private updateMetrics(): void {
    const now = Date.now();
    const oneSecondAgo = now - 1000;
    
    this.recentLogs = this.recentLogs.filter(log => log.timestamp > oneSecondAgo);
    const logsPerSecond = this.recentLogs.length;
    
    this.metrics.logsPerSecond = logsPerSecond;
    this.metrics.peakLogsPerSecond = Math.max(this.metrics.peakLogsPerSecond, logsPerSecond);
    
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

    this.emit('metrics-updated', this.metrics);
  }

  clearLogs(): void {
    this.logBuffer = [];
    this.logHistory = [];
    this.emit('logs-cleared', null);
  }

  clearMetrics(): void {
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
    this.emit('metrics-cleared', this.metrics);
  }

  private shouldLog(level: LogLevel, category?: string): boolean {
    if (!this.config.enabled) return false;
    
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
    
    for (let i = 2; i < lines.length; i++) {
      const line = lines[i];
      if (!line.includes('Logger')) {
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

  private processLogEntry(entry: LogEntry): void {
    this.metrics.totalLogs++;
    this.metrics.logsByLevel[entry.level]++;
    this.metrics.lastLogTime = entry.timestamp;
    if (entry.category) {
      this.metrics.logsByCategory[entry.category] = 
        (this.metrics.logsByCategory[entry.category] || 0) + 1;
    }
    this.recentLogs.push({ timestamp: entry.timestamp });
    this.totalLogSize += JSON.stringify(entry).length;

    if (this.config.output.console) {
      this.logToConsole(entry);
    }

    if (this.config.output.custom) {
      this.config.output.custom(entry);
    }

    this.logBuffer.push(entry);
    
    if (this.logBuffer.length > this.config.maxLogs) {
      this.logBuffer = this.logBuffer.slice(-this.config.maxLogs);
    }

    if (this.logBuffer.length >= this.config.batchSize) {
      this.flush();
    }
  }

  private log(level: LogLevel, message: string, data?: any, options?: LoggerOptions, sourceOverride?: LogEntry['source']): void {
    const category = options?.category;
    
    if (!this.shouldLog(level, category)) {
      return;
    }

    const entry: LogEntry = {
      id: this.generateUniqueId(),
      timestamp: Date.now(),
      level,
      message,
      data: data !== undefined ? this.cleanData(data) : undefined,
      context: options?.context,
      category,
      tags: options?.tags,
      source: sourceOverride || this.extractSourceInfo(),
    };

    if (data instanceof Error) {
      entry.stack = data.stack;
    }

    this.processLogEntry(entry);
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
        if (data.hasOwnProperty(key)) {
          cleaned[key] = this.cleanData(data[key]);
        }
      }
      return cleaned;
    }
    
    return data;
  }

  private logToConsole(entry: LogEntry): void {
    if (this.interceptingConsole) {
      return;
    }

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
          console.debug(...args);
          break;
        case 'info':
          console.info(...args);
          break;
        case 'warn':
          console.warn(...args);
          break;
        case 'error':
        case 'fatal':
          console.error(...args);
          break;
      }
    }
  }

  private flush(): void {
    if (this.logBuffer.length === 0) return;
    
    const existingIds = new Set(this.logHistory.map(log => log.id));
    const newLogs = this.logBuffer.filter(log => !existingIds.has(log.id));
    this.logHistory = [...this.logHistory, ...newLogs].slice(-10000);
    
    if (this.logBuffer.length === 1) {
      this.emit('log-entry', this.logBuffer[0]);
    } else {
      this.emit('log-batch', [...this.logBuffer]);
    }
    
    this.logBuffer = [];
  }

  // Public API
  trace(message: string, data?: any, options?: LoggerOptions): void {
    this.log('trace', message, data, options);
  }

  debug(message: string, data?: any, options?: LoggerOptions): void {
    this.log('debug', message, data, options);
  }

  info(message: string, data?: any, options?: LoggerOptions): void {
    this.log('info', message, data, options);
  }

  warn(message: string, data?: any, options?: LoggerOptions): void {
    this.log('warn', message, data, options);
  }

  error(message: string, data?: any, options?: LoggerOptions): void {
    this.log('error', message, data, options);
  }

  fatal(message: string, data?: any, options?: LoggerOptions): void {
    this.log('fatal', message, data, options);
  }

  child(options: LoggerOptions): ChildLogger {
    return new ChildLogger(this, options);
  }

  // Configuration methods
  setEnabled(enabled: boolean): void {
    this.updateConfig({ enabled });
  }

  setLevel(level: LogLevel): void {
    this.updateConfig({ level });
  }

  setCategoryConfig(category: string, config: { enabled: boolean; level?: LogLevel }): void {
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

  getLogs(): LogEntry[] {
    return [...this.logHistory, ...this.logBuffer];
  }

  forceFlush(): void {
    this.flush();
  }

  enableConsoleCapture(options?: {
    preserveOriginal?: boolean;
    includeTrace?: boolean;
  }): void {
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

  disableConsoleCapture(): void {
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

  exportLogs(format: ExportFormat = 'json'): string {
    const logs = this.getLogs();
    
    switch (format) {
      case 'json':
        return JSON.stringify(logs, null, 2);
      
      case 'csv':
        const headers = ['timestamp', 'level', 'category', 'message', 'data'];
        const rows = logs.map(log => [
          new Date(log.timestamp).toISOString(),
          log.level,
          log.category || '',
          log.message,
          JSON.stringify(log.data || ''),
        ]);
        return [headers, ...rows].map(row => row.join(',')).join('\n');
      
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

  // Event handling
  on(event: string, listener: (data: any) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);
  }

  off(event: string, listener: (data: any) => void): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.delete(listener);
    }
  }

  private emit(event: string, data: any): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    if (this.metricsTimer) {
      clearInterval(this.metricsTimer);
    }
    this.disableConsoleIntercept();
    this.listeners.clear();
  }
}

// Child logger with preset options
export class ChildLogger {
  constructor(
    private parent: Logger,
    private options: LoggerOptions
  ) {}

  private mergeOptions(additionalOptions?: LoggerOptions): LoggerOptions {
    return {
      category: additionalOptions?.category || this.options.category,
      context: { ...this.options.context, ...additionalOptions?.context },
      tags: [...(this.options.tags || []), ...(additionalOptions?.tags || [])],
    };
  }

  trace(message: string, data?: any, options?: LoggerOptions): void {
    this.parent.trace(message, data, this.mergeOptions(options));
  }

  debug(message: string, data?: any, options?: LoggerOptions): void {
    this.parent.debug(message, data, this.mergeOptions(options));
  }

  info(message: string, data?: any, options?: LoggerOptions): void {
    this.parent.info(message, data, this.mergeOptions(options));
  }

  warn(message: string, data?: any, options?: LoggerOptions): void {
    this.parent.warn(message, data, this.mergeOptions(options));
  }

  error(message: string, data?: any, options?: LoggerOptions): void {
    this.parent.error(message, data, this.mergeOptions(options));
  }

  fatal(message: string, data?: any, options?: LoggerOptions): void {
    this.parent.fatal(message, data, this.mergeOptions(options));
  }

  child(options: LoggerOptions): ChildLogger {
    return new ChildLogger(this.parent, this.mergeOptions(options));
  }
}