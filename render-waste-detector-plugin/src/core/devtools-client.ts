import type {
  RenderWasteDetectorState,
  RenderWasteDetectorAction,
  RenderWasteDetectorEvents,
  RenderEvent,
  ComponentInfo,
  OptimizationSuggestion,
  RenderFilters,
  ViewOptions,
  RecordingSettings,
  DevToolsTab,
  HeatMapData,
  RenderTree,
} from "../types";
import { useRenderWasteDetectorStore } from "./devtools-store";
import { getProfilerIntegration, startRenderProfiling, stopRenderProfiling } from "./profiler-integration";

/**
 * Event client interface following TanStack DevTools patterns
 */
export interface RenderWasteDetectorEventClient {
  // Core methods
  subscribe: (
    callback: (
      event: RenderWasteDetectorEvents[keyof RenderWasteDetectorEvents],
      type: keyof RenderWasteDetectorEvents,
    ) => void,
  ) => () => void;
  emit: <TEventType extends keyof RenderWasteDetectorEvents>(
    type: TEventType,
    event: RenderWasteDetectorEvents[TEventType],
  ) => void;
  getState: () => RenderWasteDetectorState;
  dispatch: (action: RenderWasteDetectorAction) => void;

  // Recording control methods
  startRecording: (settings?: Partial<RecordingSettings>) => void;
  stopRecording: () => void;
  pauseRecording: () => void;
  resumeRecording: () => void;
  clearRecording: () => void;

  // Component tracking methods
  registerComponent: (component: ComponentInfo) => void;
  unregisterComponent: (componentId: string) => void;
  updateComponent: (componentId: string, updates: Partial<ComponentInfo>) => void;

  // Render event methods
  addRenderEvent: (event: RenderEvent) => void;
  addRenderEventBatch: (events: RenderEvent[]) => void;
  clearRenderEvents: () => void;

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

  // UI control methods
  selectTab: (tab: DevToolsTab) => void;
  selectComponent: (componentId: string | null) => void;
  hoverComponent: (componentId: string | null) => void;
  selectRenderEvent: (eventId: string | null) => void;
  updateFilters: (filters: Partial<RenderFilters>) => void;
  updateViewOptions: (options: Partial<ViewOptions>) => void;
  setTheme: (theme: "light" | "dark" | "auto") => void;
  toggleSplitView: () => void;

  // Settings methods
  updateSettings: (settings: Partial<RecordingSettings>) => void;
  resetSettings: () => void;
  importSettings: (settings: RecordingSettings) => void;
  exportSettings: () => RecordingSettings;

  // Session management methods
  exportSession: (sessionId?: string) => any;
  importSession: (sessionData: any) => void;

  // Statistics methods
  calculateStats: () => void;

  // Performance monitoring methods
  startPerformanceMonitoring: () => void;
  stopPerformanceMonitoring: () => void;

  // Utility methods
  getFilteredComponents: () => ComponentInfo[];
  getFilteredRenderEvents: () => RenderEvent[];
  getFilteredSuggestions: () => OptimizationSuggestion[];

  // Cleanup
  destroy: () => void;
}

/**
 * Render Waste Detector DevTools event client implementation
 */
export class RenderWasteDetectorDevToolsEventClient
  implements RenderWasteDetectorEventClient
{
  private unsubscribe?: () => void;
  private store = useRenderWasteDetectorStore;
  private subscribers = new Set<
    (
      event: RenderWasteDetectorEvents[keyof RenderWasteDetectorEvents],
      type: keyof RenderWasteDetectorEvents,
    ) => void
  >();
  private profilerCallbacks = new Map<
    string,
    (
      id: string,
      phase: string,
      actualDuration: number,
      baseDuration: number,
      startTime: number,
      commitTime: number,
      interactions: Set<any>,
    ) => void
  >();

  constructor() {
    // Initialize profiler integration status monitoring
    this.setupProfilerIntegration();
  }


  /**
   * Subscribe to store changes and emit events
   */
  subscribe = (
    callback: (
      event: RenderWasteDetectorEvents[keyof RenderWasteDetectorEvents],
      type: keyof RenderWasteDetectorEvents,
    ) => void,
  ) => {
    this.subscribers.add(callback);

    // Subscribe to store changes
    this.unsubscribe = this.store.subscribe((state) => {
      callback(state, "render-waste:state");
    });

    // Send initial state
    const initialState = this.store.getState();
    callback(initialState, "render-waste:state");

    return () => {
      this.subscribers.delete(callback);
      if (this.subscribers.size === 0) {
        this.unsubscribe?.();
        this.cleanup();
      }
    };
  };

  /**
   * Emit event to all subscribers
   */
  emit = <TEventType extends keyof RenderWasteDetectorEvents>(
    type: TEventType,
    event: RenderWasteDetectorEvents[TEventType],
  ): void => {
    this.subscribers.forEach((callback) => {
      callback(event, type);
    });
  };

  /**
   * Get current state from store
   */
  getState = (): RenderWasteDetectorState => {
    return this.store.getState();
  };

  /**
   * Dispatch action to store
   */
  dispatch = (action: RenderWasteDetectorAction): void => {
    this.store.getState().dispatch(action);

    // Emit action event
    this.emit("render-waste:action", action);
  };

  // Convenience methods for common actions

  /**
   * Recording control methods
   */
  startRecording = (settings?: Partial<RecordingSettings>): void => {
    this.store.getState().startRecording(settings);
    this.setupRenderTracking();

    const state = this.store.getState();
    if (state.recording.activeSession) {
      this.emit("render-waste:recording-started", {
        sessionId: state.recording.activeSession.id,
        settings: state.settings,
      });
    }
    this.emit("render-waste:state", state);
  };

  stopRecording = (): void => {
    this.cleanupRenderTracking();
    const sessionId = this.store.getState().recording.activeSession?.id;

    this.store.getState().stopRecording();

    const state = this.store.getState();
    if (sessionId) {
      this.emit("render-waste:recording-stopped", {
        sessionId,
        stats: state.stats,
      });
    }
    this.emit("render-waste:state", state);
  };

  pauseRecording = (): void => {
    this.store.getState().pauseRecording();
    this.emit("render-waste:state", this.store.getState());
  };

  resumeRecording = (): void => {
    this.store.getState().resumeRecording();
    this.emit("render-waste:state", this.store.getState());
  };

  clearRecording = (): void => {
    this.store.getState().clearRecording();
    this.emit("render-waste:state", this.store.getState());
  };

  /**
   * Component tracking methods
   */
  registerComponent = (component: ComponentInfo): void => {
    this.store.getState().registerComponent(component);
    this.emit("render-waste:component-registered", component);
    this.emit("render-waste:state", this.store.getState());
  };

  unregisterComponent = (componentId: string): void => {
    this.store.getState().unregisterComponent(componentId);
    this.emit("render-waste:state", this.store.getState());
  };

  updateComponent = (
    componentId: string,
    updates: Partial<ComponentInfo>,
  ): void => {
    this.store.getState().updateComponent(componentId, updates);
    this.emit("render-waste:state", this.store.getState());
  };

  /**
   * Render event methods
   */
  addRenderEvent = (event: RenderEvent): void => {
    this.store.getState().addRenderEvent(event);
    this.emit("render-waste:render-event", event);
    this.emit("render-waste:state", this.store.getState());
  };

  addRenderEventBatch = (events: RenderEvent[]): void => {
    this.store.getState().addRenderEventBatch(events);
    events.forEach((event) => {
      this.emit("render-waste:render-event", event);
    });
    this.emit("render-waste:state", this.store.getState());
  };

  clearRenderEvents = (): void => {
    this.store.getState().clearRenderEvents();
    this.emit("render-waste:state", this.store.getState());
  };

  /**
   * Analysis methods
   */
  startAnalysis = async (): Promise<void> => {
    try {
      await this.store.getState().startAnalysis();
      const state = this.store.getState();
      this.emit("render-waste:analysis-complete", {
        suggestions: state.suggestions,
        heatMapData: state.heatMapData,
      });
      this.emit("render-waste:state", state);
    } catch (error) {
      this.emit("render-waste:error", {
        message: `Failed to complete analysis: ${error instanceof Error ? error.message : String(error)}`,
        stack: error instanceof Error ? error.stack : undefined,
        context: { operation: "analysis" },
      });
    }
  };

  dismissSuggestion = (suggestionId: string): void => {
    this.store.getState().dismissSuggestion(suggestionId);
    this.emit("render-waste:state", this.store.getState());
  };

  applySuggestion = (suggestionId: string): void => {
    const suggestion = this.store
      .getState()
      .suggestions.find((s: any) => s.id === suggestionId);
    if (suggestion) {
      this.store.getState().applySuggestion(suggestionId);
      this.emit("render-waste:suggestion-applied", {
        suggestionId,
        componentId: suggestion.componentId,
      });
      this.emit("render-waste:state", this.store.getState());
    }
  };

  /**
   * Heat map methods
   */
  updateHeatMap = (data: HeatMapData[]): void => {
    this.store.getState().updateHeatMap(data);
    this.emit("render-waste:state", this.store.getState());
  };

  setHeatMapMode = (mode: ViewOptions["heatMapMode"]): void => {
    this.store.getState().setHeatMapMode(mode);
    this.emit("render-waste:state", this.store.getState());
  };

  /**
   * Tree methods
   */
  updateRenderTree = (tree: RenderTree): void => {
    this.store.getState().updateRenderTree(tree);
    this.emit("render-waste:state", this.store.getState());
  };

  expandComponent = (componentId: string): void => {
    this.store.getState().expandComponent(componentId);
    this.emit("render-waste:state", this.store.getState());
  };

  collapseComponent = (componentId: string): void => {
    this.store.getState().collapseComponent(componentId);
    this.emit("render-waste:state", this.store.getState());
  };

  expandAllComponents = (): void => {
    this.store.getState().expandAllComponents();
    this.emit("render-waste:state", this.store.getState());
  };

  collapseAllComponents = (): void => {
    this.store.getState().collapseAllComponents();
    this.emit("render-waste:state", this.store.getState());
  };

  /**
   * UI control methods
   */
  selectTab = (tab: DevToolsTab): void => {
    this.store.getState().selectTab(tab);
    this.emit("render-waste:state", this.store.getState());
  };

  selectComponent = (componentId: string | null): void => {
    this.store.getState().selectComponent(componentId);
    this.emit("render-waste:state", this.store.getState());
  };

  hoverComponent = (componentId: string | null): void => {
    this.store.getState().hoverComponent(componentId);
    this.emit("render-waste:state", this.store.getState());
  };

  selectRenderEvent = (eventId: string | null): void => {
    this.store.getState().selectRenderEvent(eventId);
    this.emit("render-waste:state", this.store.getState());
  };

  updateFilters = (filters: Partial<RenderFilters>): void => {
    this.store.getState().updateFilters(filters);
    this.emit("render-waste:state", this.store.getState());
  };

  updateViewOptions = (options: Partial<ViewOptions>): void => {
    this.store.getState().updateViewOptions(options);
    this.emit("render-waste:state", this.store.getState());
  };

  setTheme = (theme: "light" | "dark" | "auto"): void => {
    this.store.getState().setTheme(theme);
    this.emit("render-waste:state", this.store.getState());
  };

  toggleSplitView = (): void => {
    this.store.getState().toggleSplitView();
    this.emit("render-waste:state", this.store.getState());
  };

  /**
   * Settings methods
   */
  updateSettings = (settings: Partial<RecordingSettings>): void => {
    this.store.getState().updateSettings(settings);
    this.emit("render-waste:state", this.store.getState());
  };

  resetSettings = (): void => {
    this.store.getState().resetSettings();
    this.emit("render-waste:state", this.store.getState());
  };

  importSettings = (settings: RecordingSettings): void => {
    this.store.getState().importSettings(settings);
    this.emit("render-waste:state", this.store.getState());
  };

  exportSettings = (): RecordingSettings => {
    return this.store.getState().exportSettings();
  };

  /**
   * Session management methods
   */
  exportSession = (sessionId?: string): any => {
    const session = this.store.getState().exportSession(sessionId);
    if (session) {
      return {
        ...session,
        components: Array.from(session.components.entries()),
        metrics: Array.from(session.metrics.entries()),
      };
    }
    return null;
  };

  importSession = (sessionData: any): void => {
    if (sessionData && sessionData.components && sessionData.metrics) {
      const session = {
        ...sessionData,
        components: new Map(sessionData.components),
        metrics: new Map(sessionData.metrics),
      };
      this.store.getState().importSession(session);
      this.emit("render-waste:state", this.store.getState());
    }
  };

  /**
   * Statistics methods
   */
  calculateStats = (): void => {
    this.store.getState().calculateStats();
    this.emit("render-waste:state", this.store.getState());
  };

  /**
   * Performance monitoring methods
   */
  startPerformanceMonitoring = (): void => {
    this.store.getState().startPerformanceMonitoring();
    this.emit("render-waste:state", this.store.getState());
  };

  stopPerformanceMonitoring = (): void => {
    this.store.getState().stopPerformanceMonitoring();
    this.emit("render-waste:state", this.store.getState());
  };

  /**
   * Utility methods
   */
  getFilteredComponents = (): ComponentInfo[] => {
    return this.store.getState().getFilteredComponents();
  };

  getFilteredRenderEvents = (): RenderEvent[] => {
    return this.store.getState().getFilteredRenderEvents();
  };

  getFilteredSuggestions = (): OptimizationSuggestion[] => {
    return this.store.getState().getFilteredSuggestions();
  };

  /**
   * Set up render tracking when recording starts
   */
  private setupRenderTracking = (): void => {
    if (typeof window === "undefined") return;

    const settings = this.store.getState().settings;

    // Start the real React Profiler integration
    startRenderProfiling(this);

    console.log("Render tracking setup complete with settings:", settings);
  };

  /**
   * Set up React Profiler integration status monitoring
   */
  private setupProfilerIntegration(): void {
    // The real profiler integration is handled by the ProfilerIntegration class
    // This method is kept for compatibility and monitoring
    if (
      typeof window !== "undefined" &&
      (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__
    ) {
      console.log("React DevTools Global Hook detected - real profiler integration active");
    } else {
      console.warn("React DevTools not detected - profiling functionality may be limited");
    }
  }





  /**
   * Clean up render tracking when recording stops
   */
  private cleanupRenderTracking = (): void => {
    // Stop the real React Profiler integration
    stopRenderProfiling(this);

    // Clear profiler callbacks
    this.profilerCallbacks.clear();

    console.log("Render tracking cleanup complete");
  };

  /**
   * Cleanup resources
   */
  private cleanup = (): void => {
    this.cleanupRenderTracking();
  };

  /**
   * Destroy event client and cleanup resources
   */
  destroy = (): void => {
    this.unsubscribe?.();
    this.cleanup();
    this.subscribers.clear();
    this.profilerCallbacks.clear();
  };
}

// Singleton instance
let eventClientInstance: RenderWasteDetectorDevToolsEventClient | null = null;

/**
 * Create or get render waste detector DevTools event client
 */
export function createRenderWasteDetectorEventClient(): RenderWasteDetectorDevToolsEventClient {
  if (!eventClientInstance) {
    eventClientInstance = new RenderWasteDetectorDevToolsEventClient();
  }
  return eventClientInstance;
}

/**
 * Get existing render waste detector DevTools event client
 */
export function getRenderWasteDetectorEventClient(): RenderWasteDetectorDevToolsEventClient | null {
  return eventClientInstance;
}

/**
 * Reset event client instance (useful for testing)
 */
export function resetRenderWasteDetectorEventClient(): void {
  if (eventClientInstance) {
    eventClientInstance.destroy();
    eventClientInstance = null;
  }
}
