export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export interface LogEntry {
  id: string;
  timestamp: number;
  level: LogLevel;
  message: string;
  data?: any;
  context?: Record<string, any>;
  category?: string;
  tags?: string[];
  source?: {
    function?: string;
    file?: string;
    line?: number;
    column?: number;
  };
  stack?: string;
}

export interface LoggerConfig {
  enabled: boolean;
  level: LogLevel;
  categories: Record<string, CategoryConfig>;
  output: {
    console: boolean;
    custom?: (entry: LogEntry) => void;
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

export interface CategoryConfig {
  enabled: boolean;
  level?: LogLevel;
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

export interface LoggerOptions {
  category?: string;
  context?: Record<string, any>;
  tags?: string[];
}

export type ExportFormat = 'json' | 'csv' | 'txt';

export interface ExportOptions {
  format: ExportFormat;
  pretty?: boolean;
  includeMetadata?: boolean;
}