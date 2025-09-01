/**
 * Core types for render waste detection and analysis
 */

// Component information
export interface ComponentInfo {
  id: string;
  name: string;
  displayName?: string;
  fiber: any; // React Fiber node
  props: Record<string, any>;
  state?: Record<string, any>;
  context?: Record<string, any>;
  location: {
    file: string;
    line?: number;
    column?: number;
  };
  parentId?: string;
  children: string[];
}

// Render event tracking
export interface RenderEvent {
  id: string;
  componentId: string;
  componentName: string;
  timestamp: number;
  duration: number;
  phase: "mount" | "update" | "unmount";
  reason: RenderReason;
  propsChanges: _PropChange[];
  stateChanges: _StateChange[];
  contextChanges: ContextChange[];
  renderCount: number;
  actualDuration: number;
  baseDuration: number;
  startTime: number;
  commitTime: number;
  interactions: Set<any>;
}

// Render reasons
export type RenderReason =
  | "props-change"
  | "state-change"
  | "context-change"
  | "parent-render"
  | "force-update"
  | "hook-change"
  | "ref-change"
  | "initial-mount"
  | "unknown";

// Prop, state, and context changes
export interface _PropChange {
  key: string;
  oldValue: any;
  newValue: any;
  isShallowEqual: boolean;
  isDeepEqual: boolean;
  changeType: "added" | "removed" | "modified";
  path: string[];
}

export interface _StateChange {
  key: string;
  oldValue: any;
  newValue: any;
  setter: string; // Hook or setState caller
  changeType: "added" | "removed" | "modified";
}

export interface ContextChange {
  contextName: string;
  oldValue: any;
  newValue: any;
  changeType: "added" | "removed" | "modified";
}

// Performance metrics
export interface RenderMetrics {
  componentId: string;
  componentName: string;
  totalRenders: number;
  unnecessaryRenders: number;
  wastePercentage: number;
  avgRenderTime: number;
  maxRenderTime: number;
  minRenderTime: number;
  totalRenderTime: number;
  lastRenderTime: number;
  renderFrequency: number; // renders per second
  impactScore: number; // 0-100 performance impact
  hotness: number; // 0-100 heat map intensity
}

// Optimization suggestions
export interface OptimizationSuggestion {
  id: string;
  componentId: string;
  componentName: string;
  type: _SuggestionType;
  severity: "low" | "medium" | "high" | "critical";
  title: string;
  description: string;
  solution: string;
  codeExample?: string;
  impact: {
    renderReduction: number; // estimated % reduction
    performanceGain: number; // 0-100 score
    complexity: "low" | "medium" | "high";
  };
  relatedProps?: string[];
  relatedHooks?: string[];
}

export type _SuggestionType =
  | "use-memo"
  | "use-callback"
  | "react-memo"
  | "split-component"
  | "move-state-down"
  | "use-context-selector"
  | "virtual-list"
  | "debounce-prop"
  | "stable-reference"
  | "avoid-object-literal"
  | "avoid-array-literal"
  | "avoid-inline-function";

// Heat map data
export interface HeatMapData {
  componentId: string;
  componentName: string;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  intensity: number; // 0-100
  renderCount: number;
  wasteLevel: number; // 0-100
  color: string;
  tooltip: string;
}

// Virtual DOM diff information
export interface VDomDiff {
  componentId: string;
  renderId: string;
  changes: VDomChange[];
  summary: {
    totalChanges: number;
    addedNodes: number;
    removedNodes: number;
    modifiedNodes: number;
    movedNodes: number;
  };
}

export interface VDomChange {
  type: "add" | "remove" | "modify" | "move";
  path: string[];
  oldValue?: any;
  newValue?: any;
  nodeType: string;
  props?: Record<string, any>;
}

// Render tree structure
export interface RenderTree {
  rootId: string;
  nodes: Map<string, RenderTreeNode>;
  lastUpdated: number;
}

export interface RenderTreeNode {
  id: string;
  componentName: string;
  parentId?: string;
  children: string[];
  depth: number;
  renderCount: number;
  isExpanded: boolean;
  isHighlighted: boolean;
  metrics: RenderMetrics;
}

// Filter and view options
export interface RenderFilters {
  componentNameFilter: string;
  showOnlyWasteful: boolean;
  showOnlyRecent: boolean;
  minRenderCount: number;
  minWastePercentage: number;
  timeRange: {
    start: number;
    end: number;
  };
  severityFilter: Set<"low" | "medium" | "high" | "critical">;
  suggestionTypeFilter: Set<_SuggestionType>;
}

export interface ViewOptions {
  heatMapMode: "renders" | "waste" | "time" | "impact";
  treeViewExpanded: boolean;
  showMetrics: boolean;
  showSuggestions: boolean;
  showVDomDiff: boolean;
  timelineZoom: number;
  groupBy: "component" | "file" | "none";
  sortBy: "name" | "renders" | "waste" | "impact" | "time";
  sortOrder: "asc" | "desc";
}

// Recording session
export interface RecordingSession {
  id: string;
  name: string;
  startTime: number;
  endTime?: number;
  isRecording: boolean;
  isPaused: boolean;
  components: Map<string, ComponentInfo>;
  renderEvents: RenderEvent[];
  metrics: Map<string, RenderMetrics>;
  suggestions: OptimizationSuggestion[];
  heatMapData: HeatMapData[];
  renderTree: RenderTree;
  settings: RecordingSettings;
}

export interface RecordingSettings {
  trackAllComponents: boolean;
  trackOnlyProblematic: boolean;
  minRenderThreshold: number;
  maxRecordingTime: number; // milliseconds
  maxEvents: number;
  enableHeatMap: boolean;
  enableSuggestions: boolean;
  enableVDomDiff: boolean;
  debounceMs: number;
  excludePatterns: string[];
  includePatterns: string[];
}

// Statistics
export interface RenderStats {
  totalComponents: number;
  totalRenders: number;
  unnecessaryRenders: number;
  wastePercentage: number;
  avgComponentRenders: number;
  mostWastefulComponents: Array<{
    componentName: string;
    wastePercentage: number;
    renderCount: number;
  }>;
  rendersByPhase: {
    mount: number;
    update: number;
    unmount: number;
  };
  rendersByReason: Map<RenderReason, number>;
  timeDistribution: {
    fastRenders: number; // < 1ms
    normalRenders: number; // 1-5ms
    slowRenders: number; // 5-16ms
    verySlowRenders: number; // > 16ms
  };
  performanceImpact: {
    totalTime: number;
    wastedTime: number;
    avgRenderTime: number;
    maxRenderTime: number;
  };
}
