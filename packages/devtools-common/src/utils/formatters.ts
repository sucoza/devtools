/**
 * Common formatting utilities for all TanStack DevTools plugins
 */

/**
 * Format bytes to human readable string
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Format milliseconds to human readable duration
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${ms}ms`;
  }
  
  if (ms < 60000) {
    return `${(ms / 1000).toFixed(1)}s`;
  }
  
  const minutes = Math.floor(ms / 60000);
  const seconds = ((ms % 60000) / 1000).toFixed(0);
  
  return `${minutes}m ${seconds}s`;
}

/**
 * Format timestamp to human readable time
 */
export function formatTimestamp(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString();
}

/**
 * Format timestamp to full date and time
 */
export function formatDateTime(timestamp: number): string {
  return new Date(timestamp).toLocaleString();
}

/**
 * Format timestamp to relative time (e.g., "2 minutes ago")
 */
export function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  
  if (diff < 1000) {
    return 'just now';
  }
  
  if (diff < 60000) {
    const seconds = Math.floor(diff / 1000);
    return `${seconds}s ago`;
  }
  
  if (diff < 3600000) {
    const minutes = Math.floor(diff / 60000);
    return `${minutes}m ago`;
  }
  
  if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000);
    return `${hours}h ago`;
  }
  
  const days = Math.floor(diff / 86400000);
  return `${days}d ago`;
}

/**
 * Format number with thousands separator
 */
export function formatNumber(num: number): string {
  return num.toLocaleString();
}

/**
 * Format percentage
 */
export function formatPercentage(value: number, total: number, decimals: number = 1): string {
  if (total === 0) return '0%';
  return `${((value / total) * 100).toFixed(decimals)}%`;
}

/**
 * Truncate string with ellipsis
 */
export function truncateString(str: string, maxLength: number): string {
  if (str.length <= maxLength) {
    return str;
  }
  
  return str.slice(0, maxLength - 3) + '...';
}

/**
 * Format URL for display (remove protocol, truncate)
 */
export function formatUrl(url: string, maxLength: number = 50): string {
  let formatted = url.replace(/^https?:\/\//, '');
  return truncateString(formatted, maxLength);
}

/**
 * Format JSON for display with syntax highlighting classes
 */
export function formatJson(obj: any, indent: number = 2): string {
  try {
    return JSON.stringify(obj, null, indent);
  } catch (error) {
    return String(obj);
  }
}

/**
 * Format error message for display
 */
export function formatError(error: Error | string): string {
  if (typeof error === 'string') {
    return error;
  }
  
  return error.message || 'Unknown error';
}

/**
 * Format stack trace for display
 */
export function formatStackTrace(stack?: string): string[] {
  if (!stack) return [];
  
  return stack
    .split('\n')
    .filter(line => line.trim().length > 0)
    .map(line => line.trim());
}

/**
 * Format HTTP status code with description
 */
export function formatHttpStatus(status: number): string {
  const statusTexts: Record<number, string> = {
    200: 'OK',
    201: 'Created',
    204: 'No Content',
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    409: 'Conflict',
    422: 'Unprocessable Entity',
    429: 'Too Many Requests',
    500: 'Internal Server Error',
    502: 'Bad Gateway',
    503: 'Service Unavailable',
    504: 'Gateway Timeout'
  };
  
  const text = statusTexts[status] || 'Unknown';
  return `${status} ${text}`;
}

/**
 * ID Generation utilities
 */

let counter = 0;

/**
 * Generate a unique ID with timestamp and counter
 */
export function generateId(): string {
  return `${Date.now()}-${++counter}`;
}

/**
 * Generate a UUID v4 string
 */
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Generate a short random ID
 */
export function generateShortId(): string {
  return Math.random().toString(36).substring(2, 9);
}

/**
 * Generate a timestamp-based ID with random suffix
 */
export function generateTimestampId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get current timestamp
 */
export function getTimestamp(): number {
  return Date.now();
}