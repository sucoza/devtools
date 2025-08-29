import type {
  RecordingSession,
  RenderEvent,
  RenderMetrics,
  OptimizationSuggestion,
  HeatMapData,
  RenderTree,
  RenderFilters,
  ViewOptions,
  RenderStats,
  RecordingSettings,
  ComponentInfo,
  VDomDiff,
} from "./render-waste";

/**
 * DevTools state management types
 */

// Main state interface
export interface RenderWasteDetectorState {
  // Recording state
  recording: {
    isRecording: boolean;
    isPaused: boolean;
    startTime: number | null;
    duration: number;
    activeSession: RecordingSession | null;
    sessions: RecordingSession[];
  };

  // Component tracking
  components: Map<string, ComponentInfo>;
  renderEvents: RenderEvent[];
  metrics: Map<string, RenderMetrics>;

  // Analysis data
  suggestions: OptimizationSuggestion[];
  heatMapData: HeatMapData[];
  renderTree: RenderTree | null;
  vdomDiffs: VDomDiff[];

  // UI state
  ui: {
    activeTab: DevToolsTab;
    selectedComponentId: string | null;
    selectedRenderEventId: string | null;
    hoveredComponentId: string | null;
    expandedComponents: Set<string>;
    filters: RenderFilters;
    viewOptions: ViewOptions;
    theme: "light" | "dark" | "auto";
    sidebarWidth: number;
    panelHeight: number;
    splitView: boolean;
  };

  // Settings
  settings: RecordingSettings;

  // Statistics
  stats: RenderStats;

  // Performance state
  performance: {
    isAnalyzing: boolean;
    lastAnalysisTime: number;
    analysisProgress: number;
    memoryUsage: number;
    cpuUsage: number;
  };
}

// Action types for state updates
export type RenderWasteDetectorAction =
  // Recording actions
  | { type: "recording/start"; payload?: Partial<RecordingSettings> }
  | { type: "recording/stop" }
  | { type: "recording/pause" }
  | { type: "recording/resume" }
  | { type: "recording/clear" }
  | { type: "recording/session/create"; payload: RecordingSession }
  | { type: "recording/session/select"; payload: string }
  | { type: "recording/session/delete"; payload: string }

  // Component tracking actions
  | { type: "component/register"; payload: ComponentInfo }
  | { type: "component/unregister"; payload: string }
  | {
      type: "component/update";
      payload: { id: string; updates: Partial<ComponentInfo> };
    }

  // Render event actions
  | { type: "render/event/add"; payload: RenderEvent }
  | { type: "render/event/batch"; payload: RenderEvent[] }
  | { type: "render/events/clear" }
  | {
      type: "render/metrics/update";
      payload: { componentId: string; metrics: RenderMetrics };
    }

  // Analysis actions
  | { type: "analysis/start" }
  | {
      type: "analysis/complete";
      payload: {
        suggestions: OptimizationSuggestion[];
        heatMapData: HeatMapData[];
      };
    }
  | { type: "analysis/progress"; payload: number }
  | { type: "suggestions/dismiss"; payload: string }
  | { type: "suggestions/apply"; payload: string }

  // Heat map actions
  | { type: "heatmap/update"; payload: HeatMapData[] }
  | { type: "heatmap/mode/set"; payload: ViewOptions["heatMapMode"] }

  // Tree actions
  | { type: "tree/update"; payload: RenderTree }
  | { type: "tree/expand"; payload: string }
  | { type: "tree/collapse"; payload: string }
  | { type: "tree/expand-all" }
  | { type: "tree/collapse-all" }

  // UI actions
  | { type: "ui/tab/select"; payload: DevToolsTab }
  | { type: "ui/component/select"; payload: string | null }
  | { type: "ui/component/hover"; payload: string | null }
  | { type: "ui/render-event/select"; payload: string | null }
  | { type: "ui/filters/update"; payload: Partial<RenderFilters> }
  | { type: "ui/view-options/update"; payload: Partial<ViewOptions> }
  | { type: "ui/theme/set"; payload: "light" | "dark" | "auto" }
  | { type: "ui/sidebar/resize"; payload: number }
  | { type: "ui/panel/resize"; payload: number }
  | { type: "ui/split-view/toggle" }

  // Settings actions
  | { type: "settings/update"; payload: Partial<RecordingSettings> }
  | { type: "settings/reset" }
  | { type: "settings/import"; payload: RecordingSettings }
  | { type: "settings/export" }

  // Stats actions
  | { type: "stats/calculate" }
  | { type: "stats/update"; payload: Partial<RenderStats> }

  // Performance actions
  | { type: "performance/monitor/start" }
  | { type: "performance/monitor/stop" }
  | {
      type: "performance/update";
      payload: { memoryUsage: number; cpuUsage: number };
    };

// Tab definitions
export type DevToolsTab =
  | "overview"
  | "components"
  | "heatmap"
  | "suggestions"
  | "timeline"
  | "settings";

// Event types for DevTools communication
export interface RenderWasteDetectorEvents {
  "render-waste:state": RenderWasteDetectorState;
  "render-waste:action": RenderWasteDetectorAction;
  "render-waste:component-registered": ComponentInfo;
  "render-waste:render-event": RenderEvent;
  "render-waste:analysis-complete": {
    suggestions: OptimizationSuggestion[];
    heatMapData: HeatMapData[];
  };
  "render-waste:suggestion-applied": {
    suggestionId: string;
    componentId: string;
  };
  "render-waste:recording-started": {
    sessionId: string;
    settings: RecordingSettings;
  };
  "render-waste:recording-stopped": {
    sessionId: string;
    stats: RenderStats;
  };
  "render-waste:error": {
    message: string;
    stack?: string;
    context?: Record<string, any>;
  };
}

// Component props interface
export interface RenderWasteDetectorPanelProps {
  className?: string;
  style?: React.CSSProperties;
  theme?: "light" | "dark" | "auto";
  compact?: boolean;
  defaultTab?: DevToolsTab;
  defaultSettings?: Partial<RecordingSettings>;
  onTabChange?: (tab: DevToolsTab) => void;
  onEvent?: (action: RenderWasteDetectorAction) => void;
  onComponentSelect?: (componentId: string | null) => void;
  onSuggestionApply?: (suggestion: OptimizationSuggestion) => void;
  children?: React.ReactNode;
}

// Hook interfaces
export interface UseRenderWasteDetectorOptions {
  autoStart?: boolean;
  settings?: Partial<RecordingSettings>;
  onRenderEvent?: (event: RenderEvent) => void;
  onSuggestion?: (suggestion: OptimizationSuggestion) => void;
}

export interface UseRenderWasteDetectorResult {
  state: RenderWasteDetectorState;
  actions: {
    startRecording: (settings?: Partial<RecordingSettings>) => void;
    stopRecording: () => void;
    pauseRecording: () => void;
    resumeRecording: () => void;
    clearRecording: () => void;
    selectComponent: (componentId: string | null) => void;
    selectRenderEvent: (eventId: string | null) => void;
    updateFilters: (filters: Partial<RenderFilters>) => void;
    updateViewOptions: (options: Partial<ViewOptions>) => void;
    dismissSuggestion: (suggestionId: string) => void;
    applySuggestion: (suggestionId: string) => void;
    exportSession: () => void;
    importSession: (session: RecordingSession) => void;
  };
  isRecording: boolean;
  isAnalyzing: boolean;
  componentCount: number;
  renderEventCount: number;
  suggestionCount: number;
}
