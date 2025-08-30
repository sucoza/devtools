// Main exports
export { PluginPanel } from './components/PluginPanel';
export { createVisualRegressionDevToolsClient, VisualRegressionDevToolsClient } from './core/devtools-client';

// Component exports
export {
  ScreenshotCapture,
  VisualDiff as VisualDiffComponent,
  Timeline,
  ComparisonView,
  Settings
} from './components';

// Core exports
export * from './core';

// Type exports
export type {
  Screenshot,
  Viewport,
  ScreenshotMetadata,
  BrowserEngine,
  VisualDiff,
  DiffStatus,
  DiffRegion,
  DiffMetrics,
  TestSuite,
  ResponsiveBreakpoint,
  AnimationFrame,
  AnimationSequence,
  DevToolsState,
  VisualRegressionSettings,
  CaptureSettings,
  AnimationSettings,
  StorageSettings,
  UIState,
  FilterSettings,
  VisualRegressionStats,
  ActivityItem,
  DevToolsAction,
  VisualRegressionEvents,
  ExportData,
  VisualRegressionError,
  PlaywrightConfig,
  CaptureRequest,
  CaptureResult,
  DiffRequest,
  DiffOptions,
  DiffResult
} from './types';

// Value exports
export { initialDevToolsState } from './types';

// Utility exports
export * from './utils';

// Hook exports
export * from './hooks';

// Default export
export { PluginPanel as default } from './components/PluginPanel';