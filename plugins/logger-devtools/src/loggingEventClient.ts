import { EventClient } from '@tanstack/devtools-event-client';

export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export interface LogEntry {
  id: string;
  timestamp: number;
  level: LogLevel;
  message: string;
  data?: any;
  context?: Record<string, any>;
  stack?: string;
  source?: {
    file?: string;
    line?: number;
    column?: number;
    function?: string;
  };
  category?: string;
  tags?: string[];
}

export interface LoggerConfig {
  enabled: boolean;
  level: LogLevel;
  categories: Record<string, {
    enabled: boolean;
    level?: LogLevel;
  }>;
  output: {
    console: boolean;
    devtools: boolean;
    remote?: boolean;
  };
  maxLogs: number;
  batchSize: number;
  flushInterval: number;
  intercept: {
    enabled: boolean;
    console: boolean;
    preserveOriginal: boolean;
    includeTrace: boolean;
  };
}

export interface LogMetrics {
  totalLogs: number;
  logsPerSecond: number;
  errorRate: number;
  warningRate: number;
  logsByLevel: Record<LogLevel, number>;
  logsByCategory: Record<string, number>;
  averageLogSize: number;
  peakLogsPerSecond: number;
  lastLogTime: number;
}

export type LoggingEventMap = {
  'log-entry': LogEntry;
  'log-batch': LogEntry[];
  'config-update': Partial<LoggerConfig>;
  'config-request': void;
  'config-response': LoggerConfig;
  'logs-request': void;
  'logs-response': LogEntry[];
  'metrics-update': LogMetrics;
  'clear-logs': void;
  'export-logs': { format: 'json' | 'csv' | 'txt' };
};

export class LoggingEventClient extends EventClient<LoggingEventMap> {
  private static instance: LoggingEventClient | null = null;

  private constructor() {
    super({
      pluginId: 'logger-devtools',
    } as any);
  }

  static getInstance(): LoggingEventClient {
    if (!LoggingEventClient.instance) {
      LoggingEventClient.instance = new LoggingEventClient();
    }
    return LoggingEventClient.instance;
  }
}

export const loggingEventClient = LoggingEventClient.getInstance() as any;