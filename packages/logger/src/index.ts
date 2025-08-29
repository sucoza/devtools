// Core exports
export { Logger, ChildLogger } from './logger';

// Type exports  
export type {
  LogLevel,
  LogEntry,
  LoggerConfig,
  CategoryConfig,
  LogMetrics,
  LoggerOptions,
  ExportFormat,
  ExportOptions
} from './types';

// Create and export singleton instance
import { Logger } from './logger';
export const logger = Logger.getInstance();