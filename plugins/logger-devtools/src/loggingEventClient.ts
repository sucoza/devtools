import { EventClient } from '@tanstack/devtools-event-client';

export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';

/**
 * Structured logging fields for better queryability and standardization
 */
export interface StructuredFields {
  // Correlation & Tracing
  correlationId?: string;      // Link related logs across operations
  traceId?: string;            // Distributed tracing ID (OpenTelemetry compatible)
  spanId?: string;             // Current span ID
  parentSpanId?: string;       // Parent span ID

  // User & Session Context
  userId?: string;             // User identifier
  sessionId?: string;          // Session identifier
  requestId?: string;          // Request identifier

  // Application Context
  service?: string;            // Service name
  version?: string;            // Application version
  environment?: string;        // Environment (dev/staging/prod)
  hostname?: string;           // Host identifier

  // Performance & Timing
  duration?: number;           // Operation duration in ms
  latency?: number;            // Latency in ms

  // Business Context
  resource?: string;           // Resource being accessed (e.g., "user", "order")
  action?: string;             // Action being performed (e.g., "create", "update")
  entityId?: string;           // ID of the entity being operated on

  // Custom structured fields (key-value pairs)
  [key: string]: string | number | boolean | undefined;
}

export interface LogEntry {
  id: string;
  timestamp: number;
  level: LogLevel;
  message: string;

  // Unstructured data (legacy support)
  data?: any;

  // Structured logging fields for better queryability
  fields?: StructuredFields;

  // Legacy context (now merged with fields)
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
  // Structured logging configuration
  structured: {
    enabled: boolean;                  // Enable structured logging
    globalFields?: StructuredFields;   // Default fields for all logs
    autoTracing?: boolean;             // Auto-generate trace/correlation IDs
    includeHostname?: boolean;         // Auto-include hostname
    includeTimestamp?: boolean;        // Include high-precision timestamps
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