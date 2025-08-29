/**
 * Browser Automation Test Recorder Plugin
 * Main exports following TanStack DevTools plugin patterns
 */

// Main panel component export
export { BrowserAutomationPanel } from './components/BrowserAutomationPanel';

// Event client exports
export { 
  createBrowserAutomationEventClient, 
  getBrowserAutomationEventClient,
  resetBrowserAutomationEventClient,
  BrowserAutomationDevToolsEventClient 
} from './core/devtools-client';

// Component exports
export * from './components';

// Core exports
export * from './core';

// Type exports
export * from './types';

// Store export
export { useBrowserAutomationStore, getBrowserAutomationStore } from './core/devtools-store';

// Hook export (placeholder for future implementation)
// export { useBrowserAutomation } from './hooks/useBrowserAutomation';

// Default export - main panel component
export { BrowserAutomationPanel as default } from './components/BrowserAutomationPanel';