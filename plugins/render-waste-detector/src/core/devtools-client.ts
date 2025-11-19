import type {
  RenderWasteDetectorState,
  ComponentInfo,
  OptimizationSuggestion,
  RenderFilters,
  ViewOptions,
  RecordingSettings,
  DevToolsTab,
  HeatMapData,
  RenderTree,
  RenderEvent,
  RecordingSession,
} from "../types";
import { useRenderWasteDetectorStore } from "./devtools-store";

/**
 * DevTools event client interface following TanStack patterns
 */
export interface DevToolsEventClient<TEvents extends Record<string, any>> {
  subscribe: (callback: (event: TEvents[keyof TEvents], type: keyof TEvents) => void) => () => void;
  getState: () => RenderWasteDetectorState;
}

export interface RenderWasteDetectorEvents {
  'render-waste:state': RenderWasteDetectorState;
  'render-waste:error': { message: string; stack?: string };
}

/**
 * Render Waste Detector DevTools event client
 * Follows the simplified TanStack DevTools pattern (like error-boundary-visualizer)
 */
export class RenderWasteDetectorDevToolsClient implements DevToolsEventClient<RenderWasteDetectorEvents> {
  private unsubscribeStore?: () => void;

  /**
   * Subscribe to store changes
   */
  subscribe = (
    callback: (
      event: RenderWasteDetectorEvents[keyof RenderWasteDetectorEvents],
      type: keyof RenderWasteDetectorEvents
    ) => void
  ) => {
    // Subscribe to Zustand store changes
    this.unsubscribeStore = useRenderWasteDetectorStore.subscribe((state) => {
      callback(state, 'render-waste:state');
    });

    // Send initial state
    const initialState = useRenderWasteDetectorStore.getState();
    callback(initialState, 'render-waste:state');

    return () => {
      this.unsubscribeStore?.();
    };
  };

  /**
   * Get current state
   */
  getState = (): RenderWasteDetectorState => {
    return useRenderWasteDetectorStore.getState();
  };

  // Recording control methods
  startRecording = (settings?: Partial<RecordingSettings>) => {
    useRenderWasteDetectorStore.getState().startRecording(settings);
  };

  stopRecording = () => {
    useRenderWasteDetectorStore.getState().stopRecording();
  };

  pauseRecording = () => {
    useRenderWasteDetectorStore.getState().pauseRecording();
  };

  resumeRecording = () => {
    useRenderWasteDetectorStore.getState().resumeRecording();
  };

  clearRecording = () => {
    useRenderWasteDetectorStore.getState().clearRecording();
  };

  // Component tracking methods
  registerComponent = (component: ComponentInfo) => {
    useRenderWasteDetectorStore.getState().registerComponent(component);
  };

  unregisterComponent = (componentId: string) => {
    useRenderWasteDetectorStore.getState().unregisterComponent(componentId);
  };

  updateComponent = (componentId: string, updates: Partial<ComponentInfo>) => {
    useRenderWasteDetectorStore.getState().updateComponent(componentId, updates);
  };

  // Render event methods
  addRenderEvent = (event: RenderEvent) => {
    useRenderWasteDetectorStore.getState().addRenderEvent(event);
  };

  addRenderEventBatch = (events: RenderEvent[]) => {
    useRenderWasteDetectorStore.getState().addRenderEventBatch(events);
  };

  clearRenderEvents = () => {
    useRenderWasteDetectorStore.getState().clearRenderEvents();
  };

  // Analysis methods
  startAnalysis = async (): Promise<void> => {
    await useRenderWasteDetectorStore.getState().startAnalysis();
  };

  dismissSuggestion = (suggestionId: string) => {
    useRenderWasteDetectorStore.getState().dismissSuggestion(suggestionId);
  };

  applySuggestion = (suggestionId: string) => {
    useRenderWasteDetectorStore.getState().applySuggestion(suggestionId);
  };

  // Heat map methods
  updateHeatMap = (data: HeatMapData[]) => {
    useRenderWasteDetectorStore.getState().updateHeatMap(data);
  };

  setHeatMapMode = (mode: ViewOptions["heatMapMode"]) => {
    useRenderWasteDetectorStore.getState().setHeatMapMode(mode);
  };

  // Tree methods
  updateRenderTree = (tree: RenderTree) => {
    useRenderWasteDetectorStore.getState().updateRenderTree(tree);
  };

  expandComponent = (componentId: string) => {
    useRenderWasteDetectorStore.getState().expandComponent(componentId);
  };

  collapseComponent = (componentId: string) => {
    useRenderWasteDetectorStore.getState().collapseComponent(componentId);
  };

  expandAllComponents = () => {
    useRenderWasteDetectorStore.getState().expandAllComponents();
  };

  collapseAllComponents = () => {
    useRenderWasteDetectorStore.getState().collapseAllComponents();
  };

  // UI control methods
  selectTab = (tab: DevToolsTab) => {
    useRenderWasteDetectorStore.getState().selectTab(tab);
  };

  selectComponent = (componentId: string | null) => {
    useRenderWasteDetectorStore.getState().selectComponent(componentId);
  };

  hoverComponent = (componentId: string | null) => {
    useRenderWasteDetectorStore.getState().hoverComponent(componentId);
  };

  selectRenderEvent = (eventId: string | null) => {
    useRenderWasteDetectorStore.getState().selectRenderEvent(eventId);
  };

  updateFilters = (filters: Partial<RenderFilters>) => {
    useRenderWasteDetectorStore.getState().updateFilters(filters);
  };

  updateViewOptions = (options: Partial<ViewOptions>) => {
    useRenderWasteDetectorStore.getState().updateViewOptions(options);
  };

  setTheme = (theme: "light" | "dark" | "auto") => {
    useRenderWasteDetectorStore.getState().setTheme(theme);
  };

  toggleSplitView = () => {
    useRenderWasteDetectorStore.getState().toggleSplitView();
  };

  // Settings methods
  updateSettings = (settings: Partial<RecordingSettings>) => {
    useRenderWasteDetectorStore.getState().updateSettings(settings);
  };

  resetSettings = () => {
    useRenderWasteDetectorStore.getState().resetSettings();
  };

  importSettings = (settings: RecordingSettings) => {
    useRenderWasteDetectorStore.getState().importSettings(settings);
  };

  exportSettings = (): RecordingSettings => {
    return useRenderWasteDetectorStore.getState().exportSettings();
  };

  // Session management methods
  exportSession = (sessionId?: string): RecordingSession | null => {
    return useRenderWasteDetectorStore.getState().exportSession(sessionId);
  };

  importSession = (session: RecordingSession) => {
    useRenderWasteDetectorStore.getState().importSession(session);
  };

  // Statistics methods
  calculateStats = () => {
    useRenderWasteDetectorStore.getState().calculateStats();
  };

  // Performance monitoring methods
  startPerformanceMonitoring = () => {
    useRenderWasteDetectorStore.getState().startPerformanceMonitoring();
  };

  stopPerformanceMonitoring = () => {
    useRenderWasteDetectorStore.getState().stopPerformanceMonitoring();
  };

  // Utility methods
  getFilteredComponents = (): ComponentInfo[] => {
    return useRenderWasteDetectorStore.getState().getFilteredComponents();
  };

  getFilteredRenderEvents = (): RenderEvent[] => {
    return useRenderWasteDetectorStore.getState().getFilteredRenderEvents();
  };

  getFilteredSuggestions = (): OptimizationSuggestion[] => {
    return useRenderWasteDetectorStore.getState().getFilteredSuggestions();
  };
}

// Singleton instance
let clientInstance: RenderWasteDetectorDevToolsClient | null = null;

/**
 * Create or get render waste detector DevTools event client
 */
export function createRenderWasteDetectorDevToolsClient(): RenderWasteDetectorDevToolsClient {
  if (!clientInstance) {
    clientInstance = new RenderWasteDetectorDevToolsClient();
  }
  return clientInstance;
}

/**
 * Get existing render waste detector DevTools event client
 */
export function getRenderWasteDetectorDevToolsClient(): RenderWasteDetectorDevToolsClient | null {
  return clientInstance;
}

/**
 * Reset event client instance (useful for testing)
 */
export function resetRenderWasteDetectorDevToolsClient(): void {
  clientInstance = null;
}
