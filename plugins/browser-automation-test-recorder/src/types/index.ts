/**
 * Browser Automation Test Recorder Types
 * Export all type definitions for the plugin
 */

// DevTools-specific types (excluding duplicates that come from core)
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
  PlaybackStatus,
  TestFormat,
  TestFramework,
  ScreenshotMode,
  PerformanceTracker,
  CDPClientStatus,
  CollaborationState,
  DataValidation,
  TestGenerationOptions,
  ExportOptions,
  // Keep unique devtools types only
  AssertionResult as DevToolsAssertionResult,
  EventExecutionResult as DevToolsEventExecutionResult,
  GeneratedTest as DevToolsGeneratedTest,
  RecordingSession as DevToolsRecordingSession,
  TestAssertion as DevToolsTestAssertion,
  TestCase as DevToolsTestCase,
  BrowserAutomationDevToolsPanelProps,
  TabComponentProps,
  PlaybackError,
  CollaborationPanel,
} from './devtools';

// Browser automation core types
export * from './automation';