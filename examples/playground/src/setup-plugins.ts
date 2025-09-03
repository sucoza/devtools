// Setup file for initializing all DevTools plugins
import { logger } from '@sucoza/logger-devtools-plugin';

// Initialize Logger DevTools with console capture
if (typeof window !== 'undefined') {
  // Enable console capture for the logger plugin
  logger.enableConsoleCapture({
    preserveOriginal: true,  // Keep original console output
    includeTrace: true       // Include stack traces for better debugging
  });

  // Set up logger configuration
  logger.setLevel('debug');
  logger.setEnabled(true);

  // Create specialized loggers for different parts of the app
  const apiLogger = logger.child({
    category: 'API',
    context: { service: 'playground' }
  });

  const wsLogger = logger.child({
    category: 'WebSocket',
    tags: ['realtime', 'connection']
  });

  // Export specialized loggers for use in components
  (window as any).__apiLogger = apiLogger;
  (window as any).__wsLogger = wsLogger;

  console.log('[DevTools] Logger plugin initialized with console capture');
}

export {};