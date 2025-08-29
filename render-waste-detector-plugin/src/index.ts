// Export main plugin components
export { default as RenderWasteDetectorPanel } from "./components/PluginPanel";

// Export core functionality
export {
  useRenderWasteDetectorStore,
  getRenderWasteDetectorStore,
  createRenderWasteDetectorEventClient,
  getRenderWasteDetectorEventClient,
  resetRenderWasteDetectorEventClient,
  getProfilerIntegration,
  startRenderProfiling,
  stopRenderProfiling,
  OptimizationEngine,
} from "./core";

// Export types
export type {
  // Main types
  RenderWasteDetectorState,
  RenderWasteDetectorAction,
  RenderWasteDetectorEvents,
  RenderWasteDetectorPanelProps,

  // Component types
  ComponentInfo,
  RenderEvent,
  RenderMetrics,
  OptimizationSuggestion,
  HeatMapData,
  RenderTree,
  RenderTreeNode,

  // Analysis types
  PropChange,
  StateChange,
  ContextChange,
  VDomDiff,
  VDomChange,

  // Configuration types
  RecordingSession,
  RecordingSettings,
  RenderFilters,
  ViewOptions,
  RenderStats,
  DevToolsTab,

  // Hook types
  UseRenderWasteDetectorOptions,
  UseRenderWasteDetectorResult,

  // Utility types
  RenderReason,
  SuggestionType,
} from "./types";

// Export hooks
export { useRenderWasteDetector } from "./hooks";

// Default export
export { default } from "./components/PluginPanel";
