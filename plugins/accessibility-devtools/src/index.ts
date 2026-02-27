// Main exports following TanStack DevTools plugin patterns
export { AccessibilityDevToolsPanel } from './components/AccessibilityDevToolsPanel';
export {
  createAccessibilityDevToolsEventClient,
  getAccessibilityDevToolsEventClient,
  resetAccessibilityDevToolsEventClient,
  AccessibilityDevToolsClient,
  AccessibilityDevToolsClient as AccessibilityDevToolsEventClient,
} from './core/accessibility-event-client';

// Component exports
export * from './components';

// Core exports
export * from './core';

// Type exports
export * from './types';

// Utility exports
export * from './utils';

// Hook exports
export { useAccessibilityAudit } from './hooks/useAccessibilityAudit';

// Store export
export { useAccessibilityDevToolsStore, getAccessibilityDevToolsStore } from './core/devtools-store';

// Default export - main panel component
export { AccessibilityDevToolsPanel as default } from './components/AccessibilityDevToolsPanel';