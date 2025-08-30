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

// Type exports (avoiding duplicates by excluding conflicting types)
export type {
  BrowserAutomationAction,
  BrowserAutomationState,
  BrowserAutomationEvents,
  DevToolsTab,
  SelectorMode,
  SelectorStrategy,
  CustomSelector,
  EventFilters,
  RecorderSettings,
  RecordingOptions,
  PlaybackStatus as _PlaybackStatus,
  TestFormat as _TestFormat,
  TestFramework,
  ScreenshotMode,
  PerformanceTracker,
  CDPClientStatus,
  CollaborationState,
  DataValidation,
  EventType as _EventType,
  RecordedEvent,
  ElementInfo,
  ViewportInfo,
  ActionTiming,
  EventMetadata,
  CSSSelector,
  XPathSelector,
  DataTestIdSelector,
  AriaSelector,
  TestGenerationOptions,
  ExportOptions,
} from './types/devtools';

export type {
  EventType as AutomationEventType,
  RecordedEvent as AutomationRecordedEvent,
  ElementInfo as AutomationElementInfo,
  ViewportInfo as AutomationViewportInfo,
  ActionTiming as AutomationActionTiming,
  EventMetadata as AutomationEventMetadata,
  CSSSelector as AutomationCSSSelector,
  XPathSelector as AutomationXPathSelector,
  DataTestIdSelector as AutomationDataTestIdSelector,
  AriaSelector as AutomationAriaSelector,
} from './types/automation';

// Store export
export { useBrowserAutomationStore, getBrowserAutomationStore } from './core/devtools-store';

// Hook export (placeholder for future implementation)
// export { useBrowserAutomation } from './hooks/useBrowserAutomation';

// Default export - main panel component
export { BrowserAutomationPanel as default } from './components/BrowserAutomationPanel';