import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import type {
  RenderWasteDetectorState,
  RenderWasteDetectorAction,
  RecordingSession,
  RenderEvent,
  RenderMetrics,
  OptimizationSuggestion,
  HeatMapData,
  RenderTree,
  ComponentInfo,
  RenderFilters,
  ViewOptions,
  RecordingSettings,
  RenderStats,
  DevToolsTab,
} from "../types";

/**
 * Initial state for render waste detector DevTools
 */
const initialState: RenderWasteDetectorState = {
  // Recording state
  recording: {
    isRecording: false,
    isPaused: false,
    startTime: null,
    duration: 0,
    activeSession: null,
    sessions: [],
  },

  // Component tracking
  components: new Map(),
  renderEvents: [],
  metrics: new Map(),

  // Analysis data
  suggestions: [],
  heatMapData: [],
  renderTree: null,
  vdomDiffs: [],

  // UI state
  ui: {
    activeTab: "overview",
    selectedComponentId: null,
    selectedRenderEventId: null,
    hoveredComponentId: null,
    expandedComponents: new Set(),
    filters: {
      componentNameFilter: "",
      showOnlyWasteful: false,
      showOnlyRecent: true,
      minRenderCount: 1,
      minWastePercentage: 0,
      timeRange: {
        start: Date.now() - 60000, // Last minute
        end: Date.now(),
      },
      severityFilter: new Set(["low", "medium", "high", "critical"]),
      suggestionTypeFilter: new Set([
        "use-memo",
        "use-callback",
        "react-memo",
        "split-component",
        "move-state-down",
      ]),
    },
    viewOptions: {
      heatMapMode: "waste",
      treeViewExpanded: true,
      showMetrics: true,
      showSuggestions: true,
      showVDomDiff: false,
      timelineZoom: 1.0,
      groupBy: "component",
      sortBy: "waste",
      sortOrder: "desc",
    },
    theme: "auto",
    sidebarWidth: 300,
    panelHeight: 400,
    splitView: false,
  },

  // Settings
  settings: {
    trackAllComponents: true,
    trackOnlyProblematic: false,
    minRenderThreshold: 3,
    maxRecordingTime: 300000, // 5 minutes
    maxEvents: 10000,
    enableHeatMap: true,
    enableSuggestions: true,
    enableVDomDiff: false,
    debounceMs: 100,
    excludePatterns: ["react-devtools", "react-refresh", "react-error-overlay"],
    includePatterns: [],
  },

  // Statistics
  stats: {
    totalComponents: 0,
    totalRenders: 0,
    unnecessaryRenders: 0,
    wastePercentage: 0,
    avgComponentRenders: 0,
    mostWastefulComponents: [],
    rendersByPhase: {
      mount: 0,
      update: 0,
      unmount: 0,
    },
    rendersByReason: new Map(),
    timeDistribution: {
      fastRenders: 0,
      normalRenders: 0,
      slowRenders: 0,
      verySlowRenders: 0,
    },
    performanceImpact: {
      totalTime: 0,
      wastedTime: 0,
      avgRenderTime: 0,
      maxRenderTime: 0,
    },
  },

  // Performance state
  performance: {
    isAnalyzing: false,
    lastAnalysisTime: 0,
    analysisProgress: 0,
    memoryUsage: 0,
    cpuUsage: 0,
  },
};

/**
 * Render waste detector DevTools store interface
 */
interface RenderWasteDetectorStore extends RenderWasteDetectorState {
  // Core action dispatcher
  dispatch: (action: RenderWasteDetectorAction) => void;

  // Recording methods
  startRecording: (settings?: Partial<RecordingSettings>) => void;
  stopRecording: () => void;
  pauseRecording: () => void;
  resumeRecording: () => void;
  clearRecording: () => void;
  createSession: (name?: string) => RecordingSession;
  selectSession: (sessionId: string) => void;
  deleteSession: (sessionId: string) => void;

  // Component tracking methods
  registerComponent: (component: ComponentInfo) => void;
  unregisterComponent: (componentId: string) => void;
  updateComponent: (
    componentId: string,
    updates: Partial<ComponentInfo>,
  ) => void;

  // Render event methods
  addRenderEvent: (event: RenderEvent) => void;
  addRenderEventBatch: (events: RenderEvent[]) => void;
  clearRenderEvents: () => void;
  updateMetrics: (componentId: string, metrics: RenderMetrics) => void;

  // Analysis methods
  startAnalysis: () => Promise<void>;
  dismissSuggestion: (suggestionId: string) => void;
  applySuggestion: (suggestionId: string) => void;

  // Heat map methods
  updateHeatMap: (data: HeatMapData[]) => void;
  setHeatMapMode: (mode: ViewOptions["heatMapMode"]) => void;

  // Tree methods
  updateRenderTree: (tree: RenderTree) => void;
  expandComponent: (componentId: string) => void;
  collapseComponent: (componentId: string) => void;
  expandAllComponents: () => void;
  collapseAllComponents: () => void;

  // UI methods
  selectTab: (tab: DevToolsTab) => void;
  selectComponent: (componentId: string | null) => void;
  hoverComponent: (componentId: string | null) => void;
  selectRenderEvent: (eventId: string | null) => void;
  updateFilters: (filters: Partial<RenderFilters>) => void;
  updateViewOptions: (options: Partial<ViewOptions>) => void;
  setTheme: (theme: "light" | "dark" | "auto") => void;
  resizeSidebar: (width: number) => void;
  resizePanel: (height: number) => void;
  toggleSplitView: () => void;

  // Settings methods
  updateSettings: (settings: Partial<RecordingSettings>) => void;
  resetSettings: () => void;
  importSettings: (settings: RecordingSettings) => void;
  exportSettings: () => RecordingSettings;

  // Statistics methods
  calculateStats: () => void;
  updateStats: (stats: Partial<RenderStats>) => void;

  // Performance monitoring methods
  startPerformanceMonitoring: () => void;
  stopPerformanceMonitoring: () => void;
  updatePerformanceMetrics: (metrics: {
    memoryUsage: number;
    cpuUsage: number;
  }) => void;

  // Utility methods
  getFilteredComponents: () => ComponentInfo[];
  getFilteredRenderEvents: () => RenderEvent[];
  getFilteredSuggestions: () => OptimizationSuggestion[];
  getComponentMetrics: (componentId: string) => RenderMetrics | null;
  exportSession: (sessionId?: string) => RecordingSession | null;
  importSession: (session: RecordingSession) => void;
}

/**
 * Create render waste detector DevTools store
 */
export const useRenderWasteDetectorStore = create<RenderWasteDetectorStore>()(
  subscribeWithSelector((set, get) => ({
    ...initialState,

    /**
     * Main action dispatcher following TanStack DevTools patterns
     */
    dispatch: (action: RenderWasteDetectorAction) => {
      const state = get();

      switch (action.type) {
        case "recording/start": {
          const settings = { ...state.settings, ...action.payload };
          const newSession = get().createSession();

          set((state) => ({
            recording: {
              ...state.recording,
              isRecording: true,
              isPaused: false,
              startTime: Date.now(),
              activeSession: newSession,
            },
            settings,
          }));
          break;
        }

        case "recording/stop":
          set((state) => ({
            recording: {
              ...state.recording,
              isRecording: false,
              isPaused: false,
              duration: state.recording.startTime
                ? Date.now() - state.recording.startTime
                : 0,
            },
          }));
          get().calculateStats();
          break;

        case "recording/pause":
          set((state) => ({
            recording: { ...state.recording, isPaused: true },
          }));
          break;

        case "recording/resume":
          set((state) => ({
            recording: { ...state.recording, isPaused: false },
          }));
          break;

        case "recording/clear": {
          set((_state) => ({
            recording: {
              ...initialState.recording,
            },
            components: new Map(),
            renderEvents: [],
            metrics: new Map(),
            suggestions: [],
            heatMapData: [],
            renderTree: null,
            vdomDiffs: [],
          }));
          break;
        }

        case "recording/session/create": {
          const sessionToCreate = action.payload;
          set((state) => ({
            recording: {
              ...state.recording,
              sessions: [...state.recording.sessions, sessionToCreate],
            },
          }));
          break;
        }

        case "recording/session/select": {
          const sessionId = action.payload;
          const session = state.recording.sessions.find(
            (s) => s.id === sessionId,
          );
          if (session) {
            set((state) => ({
              recording: {
                ...state.recording,
                activeSession: session,
              },
              components: session.components,
              renderEvents: session.renderEvents,
              metrics: session.metrics,
              suggestions: session.suggestions,
              heatMapData: session.heatMapData,
              renderTree: session.renderTree,
            }));
          }
          break;
        }

        case "recording/session/delete": {
          const sessionIdToDelete = action.payload;
          set((state) => ({
            recording: {
              ...state.recording,
              sessions: state.recording.sessions.filter(
                (s) => s.id !== sessionIdToDelete,
              ),
            },
          }));
          break;
        }

        case "component/register": {
          const component = action.payload;
          set((state) => ({
            components: new Map(state.components.set(component.id, component)),
          }));
          break;
        }

        case "component/unregister": {
          const componentIdToRemove = action.payload;
          const newComponents = new Map(state.components);
          newComponents.delete(componentIdToRemove);
          set({ components: newComponents });
          break;
        }

        case "component/update": {
          const { id, updates } = action.payload;
          const existingComponent = state.components.get(id);
          if (existingComponent) {
            set((state) => ({
              components: new Map(
                state.components.set(id, { ...existingComponent, ...updates }),
              ),
            }));
          }
          break;
        }

        case "render/event/add": {
          const renderEvent = action.payload;
          set((state) => ({
            renderEvents: [...state.renderEvents, renderEvent],
          }));
          break;
        }

        case "render/event/batch": {
          const renderEvents = action.payload;
          set((state) => ({
            renderEvents: [...state.renderEvents, ...renderEvents],
          }));
          break;
        }

        case "render/events/clear":
          set({ renderEvents: [] });
          break;

        case "render/metrics/update": {
          const { componentId, metrics } = action.payload;
          set((state) => ({
            metrics: new Map(state.metrics.set(componentId, metrics)),
          }));
          break;
        }

        case "analysis/start":
          set((state) => ({
            performance: {
              ...state.performance,
              isAnalyzing: true,
              analysisProgress: 0,
            },
          }));
          break;

        case "analysis/complete": {
          const { suggestions, heatMapData } = action.payload;
          set((state) => ({
            suggestions,
            heatMapData,
            performance: {
              ...state.performance,
              isAnalyzing: false,
              lastAnalysisTime: Date.now(),
              analysisProgress: 100,
            },
          }));
          break;
        }

        case "analysis/progress": {
          const progress = action.payload;
          set((state) => ({
            performance: {
              ...state.performance,
              analysisProgress: progress,
            },
          }));
          break;
        }

        case "suggestions/dismiss": {
          const suggestionIdToDismiss = action.payload;
          set((state) => ({
            suggestions: state.suggestions.filter(
              (s) => s.id !== suggestionIdToDismiss,
            ),
          }));
          break;
        }

        case "suggestions/apply":
          // Implementation would depend on how suggestions are applied
          // console.log("Applying suggestion:", action.payload);
          break;

        case "heatmap/update": {
          const heatMapDataUpdate = action.payload;
          set({ heatMapData: heatMapDataUpdate });
          break;
        }

        case "heatmap/mode/set": {
          const heatMapMode = action.payload;
          set((state) => ({
            ui: {
              ...state.ui,
              viewOptions: {
                ...state.ui.viewOptions,
                heatMapMode,
              },
            },
          }));
          break;
        }

        case "tree/update": {
          const renderTree = action.payload;
          set({ renderTree });
          break;
        }

        case "tree/expand": {
          const componentIdToExpand = action.payload;
          set((state) => ({
            ui: {
              ...state.ui,
              expandedComponents: new Set(
                state.ui.expandedComponents.add(componentIdToExpand),
              ),
            },
          }));
          break;
        }

        case "tree/collapse": {
          const componentIdToCollapse = action.payload;
          const expandedComponents = new Set(state.ui.expandedComponents);
          expandedComponents.delete(componentIdToCollapse);
          set((state) => ({
            ui: {
              ...state.ui,
              expandedComponents,
            },
          }));
          break;
        }

        case "tree/expand-all": {
          const allComponentIds = new Set(Array.from(state.components.keys()));
          set((state) => ({
            ui: {
              ...state.ui,
              expandedComponents: allComponentIds,
            },
          }));
          break;
        }

        case "tree/collapse-all":
          set((state) => ({
            ui: {
              ...state.ui,
              expandedComponents: new Set(),
            },
          }));
          break;

        case "ui/tab/select": {
          const activeTab = action.payload;
          set((state) => ({
            ui: { ...state.ui, activeTab },
          }));
          break;
        }

        case "ui/component/select": {
          const selectedComponentId = action.payload;
          set((state) => ({
            ui: { ...state.ui, selectedComponentId },
          }));
          break;
        }

        case "ui/component/hover": {
          const hoveredComponentId = action.payload;
          set((state) => ({
            ui: { ...state.ui, hoveredComponentId },
          }));
          break;
        }

        case "ui/render-event/select": {
          const selectedRenderEventId = action.payload;
          set((state) => ({
            ui: { ...state.ui, selectedRenderEventId },
          }));
          break;
        }

        case "ui/filters/update": {
          const filterUpdates = action.payload;
          set((state) => ({
            ui: {
              ...state.ui,
              filters: { ...state.ui.filters, ...filterUpdates },
            },
          }));
          break;
        }

        case "ui/view-options/update": {
          const viewOptionUpdates = action.payload;
          set((state) => ({
            ui: {
              ...state.ui,
              viewOptions: { ...state.ui.viewOptions, ...viewOptionUpdates },
            },
          }));
          break;
        }

        case "ui/theme/set": {
          const theme = action.payload;
          set((state) => ({
            ui: { ...state.ui, theme },
          }));
          break;
        }

        case "ui/sidebar/resize": {
          const sidebarWidth = action.payload;
          set((state) => ({
            ui: { ...state.ui, sidebarWidth },
          }));
          break;
        }

        case "ui/panel/resize": {
          const panelHeight = action.payload;
          set((state) => ({
            ui: { ...state.ui, panelHeight },
          }));
          break;
        }

        case "ui/split-view/toggle":
          set((state) => ({
            ui: { ...state.ui, splitView: !state.ui.splitView },
          }));
          break;

        case "settings/update": {
          const settingUpdates = action.payload;
          set((state) => ({
            settings: { ...state.settings, ...settingUpdates },
          }));
          break;
        }

        case "settings/reset":
          set({ settings: initialState.settings });
          break;

        case "settings/import": {
          const importedSettings = action.payload;
          set({ settings: importedSettings });
          break;
        }

        case "settings/export":
          // Export will be handled by the exportSettings method
          break;

        case "stats/calculate":
          get().calculateStats();
          break;

        case "stats/update": {
          const statsUpdate = action.payload;
          set((state) => ({
            stats: { ...state.stats, ...statsUpdate },
          }));
          break;
        }

        case "performance/monitor/start":
          get().startPerformanceMonitoring();
          break;

        case "performance/monitor/stop":
          get().stopPerformanceMonitoring();
          break;

        case "performance/update": {
          const performanceMetrics = action.payload;
          set((state) => ({
            performance: {
              ...state.performance,
              ...performanceMetrics,
            },
          }));
          break;
        }
      }
    },

    /**
     * Recording methods
     */
    startRecording: (settings?: Partial<RecordingSettings>) => {
      get().dispatch({ type: "recording/start", payload: settings });

      // Start profiler integration if in browser environment
      if (typeof window !== 'undefined') {
        // Import dynamically to avoid circular dependencies
        Promise.all([
          import('./profiler-integration'),
          import('./devtools-client')
        ]).then(([profiler, client]) => {
          const eventClient = client.getRenderWasteDetectorDevToolsClient();
          if (eventClient) {
            profiler.startRenderProfiling(eventClient);
          }
        }).catch((error) => {
          console.warn('Failed to start profiler integration:', error);
        });
      }
    },

    stopRecording: () => {
      // Stop profiler integration if in browser environment
      if (typeof window !== 'undefined') {
        // Import dynamically to avoid circular dependencies
        Promise.all([
          import('./profiler-integration'),
          import('./devtools-client')
        ]).then(([profiler, client]) => {
          const eventClient = client.getRenderWasteDetectorDevToolsClient();
          if (eventClient) {
            profiler.stopRenderProfiling(eventClient);
          }
        }).catch((error) => {
          console.warn('Failed to stop profiler integration:', error);
        });
      }

      get().dispatch({ type: "recording/stop" });
    },

    pauseRecording: () => {
      get().dispatch({ type: "recording/pause" });
    },

    resumeRecording: () => {
      get().dispatch({ type: "recording/resume" });
    },

    clearRecording: () => {
      get().dispatch({ type: "recording/clear" });
    },

    createSession: (name?: string): RecordingSession => {
      const session: RecordingSession = {
        id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: name || `Session ${new Date().toLocaleTimeString()}`,
        startTime: Date.now(),
        isRecording: true,
        isPaused: false,
        components: new Map(),
        renderEvents: [],
        metrics: new Map(),
        suggestions: [],
        heatMapData: [],
        renderTree: {
          rootId: "root",
          nodes: new Map(),
          lastUpdated: Date.now(),
        },
        settings: get().settings,
      };

      get().dispatch({ type: "recording/session/create", payload: session });
      return session;
    },

    selectSession: (sessionId: string) => {
      get().dispatch({ type: "recording/session/select", payload: sessionId });
    },

    deleteSession: (sessionId: string) => {
      get().dispatch({ type: "recording/session/delete", payload: sessionId });
    },

    /**
     * Component tracking methods
     */
    registerComponent: (component: ComponentInfo) => {
      get().dispatch({ type: "component/register", payload: component });
    },

    unregisterComponent: (componentId: string) => {
      get().dispatch({ type: "component/unregister", payload: componentId });
    },

    updateComponent: (componentId: string, updates: Partial<ComponentInfo>) => {
      get().dispatch({
        type: "component/update",
        payload: { id: componentId, updates },
      });
    },

    /**
     * Render event methods
     */
    addRenderEvent: (event: RenderEvent) => {
      get().dispatch({ type: "render/event/add", payload: event });
    },

    addRenderEventBatch: (events: RenderEvent[]) => {
      get().dispatch({ type: "render/event/batch", payload: events });
    },

    clearRenderEvents: () => {
      get().dispatch({ type: "render/events/clear" });
    },

    updateMetrics: (componentId: string, metrics: RenderMetrics) => {
      get().dispatch({
        type: "render/metrics/update",
        payload: { componentId, metrics },
      });
    },

    /**
     * Analysis methods
     */
    startAnalysis: async () => {
      try {
        get().dispatch({ type: "analysis/start" });

        // Simulate analysis process
        // In a real implementation, this would perform actual analysis
        const state = get();
        const components = Array.from(state.components.values());
        const _renderEvents = state.renderEvents;

        // Mock analysis with progress updates
        for (let i = 0; i <= 100; i += 10) {
          await new Promise((resolve) => setTimeout(resolve, 50));
          get().dispatch({ type: "analysis/progress", payload: i });
        }

        // Generate mock suggestions and heat map data
        const suggestions: OptimizationSuggestion[] = components
          .filter((_comp) => Math.random() > 0.7) // Mock filtering
          .map((comp) => ({
          id: `suggestion_${comp.id}_${Date.now()}`,
          componentId: comp.id,
          componentName: comp.name,
          type: "use-memo" as const,
          severity: "medium" as const,
          title: `Consider using useMemo for ${comp.name}`,
          description: `This component re-renders frequently. Consider memoizing expensive calculations.`,
          solution: `Wrap expensive calculations in useMemo hook to prevent unnecessary recalculations.`,
          codeExample: `const expensiveValue = useMemo(() => calculateExpensiveValue(props), [props.dependency]);`,
          impact: {
            renderReduction: 30,
            performanceGain: 25,
            complexity: "low" as const,
          },
        }));

      const heatMapData: HeatMapData[] = components.map((comp) => ({
        componentId: comp.id,
        componentName: comp.name,
        position: {
          x: Math.random() * 800,
          y: Math.random() * 600,
          width: 100 + Math.random() * 200,
          height: 50 + Math.random() * 100,
        },
        intensity: Math.random() * 100,
        renderCount: Math.floor(Math.random() * 50),
        wasteLevel: Math.random() * 100,
        color: `hsl(${Math.random() * 60}, 70%, 50%)`,
        tooltip: `${comp.name}: ${Math.floor(Math.random() * 50)} renders`,
      }));

        get().dispatch({
          type: "analysis/complete",
          payload: { suggestions, heatMapData },
        });
      } catch (error) {
        console.error("Analysis failed:", error);
        get().dispatch({
          type: "analysis/complete",
          payload: { suggestions: [], heatMapData: [] },
        });
      }
    },

    dismissSuggestion: (suggestionId: string) => {
      get().dispatch({ type: "suggestions/dismiss", payload: suggestionId });
    },

    applySuggestion: (suggestionId: string) => {
      get().dispatch({ type: "suggestions/apply", payload: suggestionId });
    },

    /**
     * Heat map methods
     */
    updateHeatMap: (data: HeatMapData[]) => {
      get().dispatch({ type: "heatmap/update", payload: data });
    },

    setHeatMapMode: (mode: ViewOptions["heatMapMode"]) => {
      get().dispatch({ type: "heatmap/mode/set", payload: mode });
    },

    /**
     * Tree methods
     */
    updateRenderTree: (tree: RenderTree) => {
      get().dispatch({ type: "tree/update", payload: tree });
    },

    expandComponent: (componentId: string) => {
      get().dispatch({ type: "tree/expand", payload: componentId });
    },

    collapseComponent: (componentId: string) => {
      get().dispatch({ type: "tree/collapse", payload: componentId });
    },

    expandAllComponents: () => {
      get().dispatch({ type: "tree/expand-all" });
    },

    collapseAllComponents: () => {
      get().dispatch({ type: "tree/collapse-all" });
    },

    /**
     * UI methods
     */
    selectTab: (tab: DevToolsTab) => {
      get().dispatch({ type: "ui/tab/select", payload: tab });
    },

    selectComponent: (componentId: string | null) => {
      get().dispatch({ type: "ui/component/select", payload: componentId });
    },

    hoverComponent: (componentId: string | null) => {
      get().dispatch({ type: "ui/component/hover", payload: componentId });
    },

    selectRenderEvent: (eventId: string | null) => {
      get().dispatch({ type: "ui/render-event/select", payload: eventId });
    },

    updateFilters: (filters: Partial<RenderFilters>) => {
      get().dispatch({ type: "ui/filters/update", payload: filters });
    },

    updateViewOptions: (options: Partial<ViewOptions>) => {
      get().dispatch({ type: "ui/view-options/update", payload: options });
    },

    setTheme: (theme: "light" | "dark" | "auto") => {
      get().dispatch({ type: "ui/theme/set", payload: theme });
    },

    resizeSidebar: (width: number) => {
      get().dispatch({ type: "ui/sidebar/resize", payload: width });
    },

    resizePanel: (height: number) => {
      get().dispatch({ type: "ui/panel/resize", payload: height });
    },

    toggleSplitView: () => {
      get().dispatch({ type: "ui/split-view/toggle" });
    },

    /**
     * Settings methods
     */
    updateSettings: (settings: Partial<RecordingSettings>) => {
      get().dispatch({ type: "settings/update", payload: settings });
    },

    resetSettings: () => {
      get().dispatch({ type: "settings/reset" });
    },

    importSettings: (settings: RecordingSettings) => {
      get().dispatch({ type: "settings/import", payload: settings });
    },

    exportSettings: (): RecordingSettings => {
      return get().settings;
    },

    /**
     * Statistics methods
     */
    calculateStats: () => {
      const state = get();
      const { components, renderEvents, metrics } = state;

      const totalComponents = components.size;
      const totalRenders = renderEvents.length;

      // Calculate waste percentage
      const unnecessaryRenders = renderEvents.filter(
        (event) =>
          event.reason === "parent-render" &&
          event.propsChanges.length === 0 &&
          event.stateChanges.length === 0,
      ).length;

      const wastePercentage =
        totalRenders > 0 ? (unnecessaryRenders / totalRenders) * 100 : 0;

      // Calculate render distribution
      const rendersByPhase = renderEvents.reduce(
        (acc, event) => {
          acc[event.phase]++;
          return acc;
        },
        { mount: 0, update: 0, unmount: 0 },
      );

      // Calculate most wasteful components
      const componentWasteMap = new Map<
        string,
        { wastePercentage: number; renderCount: number; componentName: string }
      >();

      Array.from(metrics.entries()).forEach(([componentId, metric]) => {
        componentWasteMap.set(componentId, {
          wastePercentage: metric.wastePercentage,
          renderCount: metric.totalRenders,
          componentName: metric.componentName,
        });
      });

      const mostWastefulComponents = Array.from(componentWasteMap.values())
        .sort((a, b) => b.wastePercentage - a.wastePercentage)
        .slice(0, 10);

      // Calculate time distribution
      const timeDistribution = renderEvents.reduce(
        (acc, event) => {
          if (event.duration < 1) acc.fastRenders++;
          else if (event.duration < 5) acc.normalRenders++;
          else if (event.duration < 16) acc.slowRenders++;
          else acc.verySlowRenders++;
          return acc;
        },
        {
          fastRenders: 0,
          normalRenders: 0,
          slowRenders: 0,
          verySlowRenders: 0,
        },
      );

      // Calculate performance impact
      const totalTime = renderEvents.reduce(
        (acc, event) => acc + event.duration,
        0,
      );
      const wastedTime = renderEvents
        .filter(
          (event) =>
            event.reason === "parent-render" &&
            event.propsChanges.length === 0 &&
            event.stateChanges.length === 0,
        )
        .reduce((acc, event) => acc + event.duration, 0);

      const avgRenderTime = totalRenders > 0 ? totalTime / totalRenders : 0;
      const maxRenderTime =
        renderEvents.length > 0
          ? Math.max(...renderEvents.map((e) => e.duration))
          : 0;

      const updatedStats: RenderStats = {
        totalComponents,
        totalRenders,
        unnecessaryRenders,
        wastePercentage,
        avgComponentRenders:
          totalComponents > 0 ? totalRenders / totalComponents : 0,
        mostWastefulComponents,
        rendersByPhase,
        rendersByReason: new Map(), // Would be calculated from actual render reasons
        timeDistribution,
        performanceImpact: {
          totalTime,
          wastedTime,
          avgRenderTime,
          maxRenderTime,
        },
      };

      get().dispatch({ type: "stats/update", payload: updatedStats });
    },

    updateStats: (stats: Partial<RenderStats>) => {
      get().dispatch({ type: "stats/update", payload: stats });
    },

    /**
     * Performance monitoring methods
     */
    startPerformanceMonitoring: () => {
      // Implementation would start performance monitoring
      // console.log("Starting performance monitoring");
    },

    stopPerformanceMonitoring: () => {
      // Implementation would stop performance monitoring
      // console.log("Stopping performance monitoring");
    },

    updatePerformanceMetrics: (metrics: {
      memoryUsage: number;
      cpuUsage: number;
    }) => {
      get().dispatch({ type: "performance/update", payload: metrics });
    },

    /**
     * Utility methods
     */
    getFilteredComponents: (): ComponentInfo[] => {
      const state = get();
      const { components } = state;
      const { filters } = state.ui;

      return Array.from(components.values()).filter((component) => {
        if (
          filters.componentNameFilter &&
          !component.name
            .toLowerCase()
            .includes(filters.componentNameFilter.toLowerCase())
        ) {
          return false;
        }

        return true;
      });
    },

    getFilteredRenderEvents: (): RenderEvent[] => {
      const state = get();
      const { renderEvents } = state;
      const { filters } = state.ui;

      return renderEvents.filter((event) => {
        if (filters.showOnlyRecent) {
          return (
            event.timestamp >= filters.timeRange.start &&
            event.timestamp <= filters.timeRange.end
          );
        }

        return true;
      });
    },

    getFilteredSuggestions: (): OptimizationSuggestion[] => {
      const state = get();
      const { suggestions } = state;
      const { filters } = state.ui;

      return suggestions.filter((suggestion) => {
        if (!filters.severityFilter.has(suggestion.severity)) {
          return false;
        }

        if (!filters.suggestionTypeFilter.has(suggestion.type)) {
          return false;
        }

        return true;
      });
    },

    getComponentMetrics: (componentId: string): RenderMetrics | null => {
      return get().metrics.get(componentId) || null;
    },

    exportSession: (sessionId?: string): RecordingSession | null => {
      const state = get();
      if (sessionId) {
        return state.recording.sessions.find((s) => s.id === sessionId) || null;
      }
      return state.recording.activeSession;
    },

    importSession: (session: RecordingSession) => {
      get().dispatch({ type: "recording/session/create", payload: session });
    },
  })),
);

/**
 * Get render waste detector store instance
 */
export function getRenderWasteDetectorStore() {
  return useRenderWasteDetectorStore.getState();
}
