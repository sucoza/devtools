/**
 * Common types used across all TanStack DevTools plugins
 */

export interface TimestampedEvent {
  timestamp: number;
  id: string;
}

export interface FilterableItem extends TimestampedEvent {
  [key: string]: any;
}

export interface PluginMetadata {
  name: string;
  version: string;
  description: string;
  author: string;
  homepage?: string;
  repository?: string;
}

export interface PluginConfig {
  enabled: boolean;
  autoStart: boolean;
  maxEvents?: number;
  timeWindowMs?: number;
  [key: string]: any;
}

export interface ExportData<T = any> {
  plugin: string;
  version: string;
  timestamp: number;
  data: T;
  metadata?: Record<string, any>;
}

export interface PerformanceMetrics {
  memoryUsage?: number;
  cpuUsage?: number;
  renderTime?: number;
  bundleSize?: number;
  networkRequests?: number;
  errorCount?: number;
  [key: string]: number | undefined;
}

export interface UITheme {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: {
    primary: string;
    secondary: string;
    disabled: string;
  };
  border: string;
  success: string;
  warning: string;
  error: string;
  info: string;
}

export interface KeyValue<T = any> {
  key: string;
  value: T;
  label?: string;
  metadata?: Record<string, any>;
}

export type SortDirection = 'asc' | 'desc';
export type ViewMode = 'list' | 'grid' | 'tree' | 'timeline';

export interface SortConfig {
  field: string;
  direction: SortDirection;
}

export interface PaginationConfig {
  page: number;
  pageSize: number;
  total: number;
}