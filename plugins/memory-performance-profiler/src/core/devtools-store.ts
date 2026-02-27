import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { 
  MemoryProfilerState, 
  MemoryMeasurement, 
  ComponentMemoryInfo, 
  HookMemoryInfo, 
  MemoryLeak, 
  PerformanceMetrics, 
  GarbageCollectionInfo, 
  MemoryOptimizationSuggestion, 
  MemoryBudget, 
  MemoryProfilerSnapshot,
  MemoryProfilerConfig
} from '../types';

const defaultConfig: MemoryProfilerConfig = {
  enabled: true,
  samplingInterval: 1000,
  trackComponents: true,
  trackHooks: true,
  detectLeaks: true,
  monitorPerformance: true,
  budgets: [],
  alertThresholds: {
    memoryLimitMB: 100,
    growthRatePercent: 20,
    leakSeverity: 'medium'
  }
};

/** Maximum number of timeline events to retain */
const MAX_TIMELINE_EVENTS = 500;

const initialState: MemoryProfilerState = {
  isRunning: false,
  config: defaultConfig,
  currentMemory: null,
  timeline: null,
  components: [],
  hooks: [],
  leaks: [],
  performance: null,
  gcEvents: [],
  snapshots: [],
  suggestions: [],
  budgets: [],
  alerts: []
};

// Extended initial state for the store
const extendedInitialState = {
  ...initialState,
  // Additional properties needed by the hook
  isRecording: false,
  isPaused: false,
  activeTab: 'overview',
  currentSnapshot: null,
  warnings: [],
  recommendations: [],
  leakPatterns: [],
  componentTree: [],
  componentStats: [],
  activeSession: null,
  sessions: [],
  selectedComponent: null,
  selectedSession: null,
  filters: {},
  exportData: null,
  importStatus: null,
};

export interface MemoryProfilerStore extends MemoryProfilerState {
  // Additional state properties that the hook expects
  isRecording: boolean;
  isPaused: boolean;
  activeTab: string;
  currentSnapshot: any | null;
  warnings: any[];
  recommendations: any[];
  leakPatterns: any[];
  componentTree: any[];
  componentStats: any[];
  activeSession: any | null;
  sessions: any[];
  selectedComponent: any | null;
  selectedSession: any | null;
  filters: any;
  exportData: any | null;
  importStatus: any | null;

  // Actions
  startProfiling: () => void;
  stopProfiling: () => void;
  pauseProfiling: () => void;
  resumeProfiling: () => void;
  clearSession: () => void;
  deleteSession: (id: string) => void;
  loadSession: (id: string) => void;
  takeSnapshot: (name?: string) => void;
  clearSnapshots: () => void;
  selectComponent: (componentId: string) => void;
  analyzeComponent: (componentId: string) => void;
  trackComponent: (componentId: string) => void;
  untrackComponent: (componentId: string) => void;
  updateConfig: (config: Partial<MemoryProfilerConfig>) => void;
  resetConfig: () => void;
  dismissWarning: (warningId: string) => void;
  markRecommendationCompleted: (recommendationId: string) => void;
  generateRecommendations: () => void;
  updateFilters: (filters: any) => void;
  clearFilters: () => void;
  setActiveTab: (tab: string) => void;
  exportSession: () => void;
  importSession: (data: any) => void;
  triggerGC: () => void;
  simulateMemoryPressure: () => void;
  enableDebugMode: () => void;
  disableDebugMode: () => void;
  logMemorySnapshot: () => void;

  // Original actions
  addMemoryMeasurement: (measurement: MemoryMeasurement) => void;
  updateComponents: (components: ComponentMemoryInfo[]) => void;
  updateHooks: (hooks: HookMemoryInfo[]) => void;
  addLeak: (leak: MemoryLeak) => void;
  removeLeak: (leakId: string) => void;
  updatePerformance: (metrics: PerformanceMetrics) => void;
  addGCEvent: (event: GarbageCollectionInfo) => void;
  createSnapshot: (name: string) => void;
  deleteSnapshot: (id: string) => void;
  addSuggestion: (suggestion: MemoryOptimizationSuggestion) => void;
  dismissSuggestion: (id: string) => void;
  updateBudgets: (budgets: MemoryBudget[]) => void;
  addAlert: (alert: MemoryProfilerState['alerts'][0]) => void;
  dismissAlert: (id: string) => void;
  clearAlerts: () => void;
  reset: () => void;
  
  // Computed getters
  getMemoryTrend: () => 'up' | 'down' | 'stable';
  getTotalMemoryUsage: () => number;
  getComponentsByMemoryUsage: () => ComponentMemoryInfo[];
  getActiveLeakCount: () => number;
  getBudgetViolations: () => MemoryBudget[];
  getMemoryPressureLevel: () => 'low' | 'medium' | 'high';
  getCurrentMemoryUsageMB: () => number;
  getFilteredWarnings: () => any[];
  getFilteredComponents: () => any[];
  getCurrentMemoryUsage: () => number;
  getMemoryUtilization: () => number;
}

export const useMemoryProfilerStore = create<MemoryProfilerStore>()(
  subscribeWithSelector((set, get) => ({
    ...extendedInitialState,

    // Core profiler controls
    startProfiling: () => {
      set({ isRunning: true, isRecording: true });
    },

    stopProfiling: () => {
      set({ isRunning: false, isRecording: false });
    },

    // Additional action implementations
    pauseProfiling: () => {
      set({ isPaused: true });
    },

    resumeProfiling: () => {
      set({ isPaused: false });
    },

    clearSession: () => {
      set({ 
        timeline: null,
        components: [],
        hooks: [],
        warnings: [],
        componentTree: [],
      });
    },

    deleteSession: (id: string) => {
      set((state) => ({
        sessions: state.sessions.filter((session: any) => session.id !== id)
      }));
    },

    loadSession: (id: string) => {
      set((state) => ({
        selectedSession: state.sessions.find((session: any) => session.id === id) || null
      }));
    },

    takeSnapshot: (name?: string) => {
      get().createSnapshot(name || `Snapshot ${Date.now()}`);
    },

    clearSnapshots: () => {
      set({ snapshots: [] });
    },

    selectComponent: (componentId: string) => {
      set({ selectedComponent: componentId });
    },

    analyzeComponent: (componentId: string) => {
      // Implementation would perform component analysis
      console.log('Analyzing component:', componentId);
    },

    trackComponent: (componentId: string) => {
      // Implementation would start tracking a component
      console.log('Tracking component:', componentId);
    },

    untrackComponent: (componentId: string) => {
      // Implementation would stop tracking a component
      console.log('Untracking component:', componentId);
    },

    resetConfig: () => {
      set({ config: defaultConfig });
    },

    dismissWarning: (warningId: string) => {
      set((state) => ({
        warnings: state.warnings.filter((warning: any) => warning.id !== warningId)
      }));
    },

    markRecommendationCompleted: (recommendationId: string) => {
      set((state) => ({
        recommendations: state.recommendations.map((rec: any) => 
          rec.id === recommendationId ? { ...rec, completed: true } : rec
        )
      }));
    },

    generateRecommendations: () => {
      // Implementation would analyze current state and generate recommendations
      console.log('Generating recommendations...');
    },

    updateFilters: (filters: any) => {
      set({ filters });
    },

    clearFilters: () => {
      set({ filters: {} });
    },

    setActiveTab: (tab: string) => {
      set({ activeTab: tab });
    },

    exportSession: () => {
      const state = get();
      const exportData = {
        config: state.config,
        timeline: state.timeline,
        components: state.components,
        snapshots: state.snapshots,
        timestamp: Date.now()
      };
      set({ exportData });
    },

    importSession: (data: any) => {
      set({ importStatus: 'importing' });
      try {
        if (data.config) get().updateConfig(data.config);
        if (data.components) set({ components: data.components });
        if (data.timeline) set({ timeline: data.timeline });
        if (data.snapshots) set({ snapshots: data.snapshots });
        set({ importStatus: 'success' });
      } catch {
        set({ importStatus: 'error' });
      }
    },

    triggerGC: () => {
      if ((window as any).gc) {
        (window as any).gc();
        console.log('Garbage collection triggered');
      }
    },

    simulateMemoryPressure: () => {
      // Implementation would simulate memory pressure for testing
      console.log('Simulating memory pressure...');
    },

    enableDebugMode: () => {
      set((state) => ({
        config: { ...state.config, debugMode: true }
      }));
    },

    disableDebugMode: () => {
      set((state) => ({
        config: { ...state.config, debugMode: false }
      }));
    },

    logMemorySnapshot: () => {
      const state = get();
      console.log('Memory Snapshot:', {
        currentMemory: state.currentMemory,
        components: state.components.length,
        warnings: state.warnings.length,
        timestamp: Date.now()
      });
    },

    updateConfig: (configUpdate: Partial<MemoryProfilerConfig>) => {
      set((state) => ({
        config: { ...state.config, ...configUpdate }
      }));
    },

    // Memory measurements
    addMemoryMeasurement: (measurement: MemoryMeasurement) => {
      set((state) => {
        // Update current memory
        const newState = { currentMemory: measurement };

        // Update timeline
        if (state.timeline) {
          const updatedMeasurements = [...state.timeline.measurements, measurement];
          // Keep only last 1000 measurements to prevent memory issues
          if (updatedMeasurements.length > 1000) {
            updatedMeasurements.shift();
          }
          
          (newState as any).timeline = {
            ...state.timeline,
            measurements: updatedMeasurements,
            endTime: measurement.timestamp
          };
        } else {
          // Create initial timeline
          (newState as any).timeline = {
            startTime: measurement.timestamp,
            endTime: measurement.timestamp,
            measurements: [measurement],
            events: []
          };
        }

        // Check for budget violations
        const violations = get().getBudgetViolations();
        if (violations.length > 0) {
          violations.forEach(budget => {
            const alertId = `budget-violation-${budget.component || budget.route}-${Date.now()}`;
            const existingAlert = state.alerts.find(a => a.id.includes('budget-violation') && 
              a.message.includes(budget.component || budget.route || ''));
            
            if (!existingAlert) {
              get().addAlert({
                id: alertId,
                type: 'budget-exceeded',
                message: `Memory budget exceeded for ${budget.component || budget.route}: ${budget.currentUsageMB.toFixed(1)}MB / ${budget.budgetMB}MB`,
                severity: 'warning',
                timestamp: Date.now()
              });
            }
          });
        }

        return newState;
      });
    },

    // Component and hook updates
    updateComponents: (components: ComponentMemoryInfo[]) => {
      set({ components });
    },

    updateHooks: (hooks: HookMemoryInfo[]) => {
      set({ hooks });
    },

    // Memory leak management
    addLeak: (leak: MemoryLeak) => {
      set((state) => {
        const existingIndex = state.leaks.findIndex(l => l.id === leak.id);
        if (existingIndex >= 0) {
          // Update existing leak
          const updatedLeaks = [...state.leaks];
          updatedLeaks[existingIndex] = leak;
          return { leaks: updatedLeaks };
        } else {
          // Add new leak
          const newLeaks = [...state.leaks, leak];
          
          // Create alert for high severity leaks
          if (leak.severity === 'high' || leak.severity === 'critical') {
            get().addAlert({
              id: `leak-${leak.id}`,
              type: 'leak-detected',
              message: `Memory leak detected in ${leak.component}: ${leak.description}`,
              severity: leak.severity === 'critical' ? 'error' : 'warning',
              timestamp: Date.now()
            });
          }
          
          return { leaks: newLeaks };
        }
      });
    },

    removeLeak: (leakId: string) => {
      set((state) => ({
        leaks: state.leaks.filter(l => l.id !== leakId)
      }));
    },

    // Performance metrics
    updatePerformance: (metrics: PerformanceMetrics) => {
      set({ performance: metrics });
    },

    // Garbage collection events
    addGCEvent: (event: GarbageCollectionInfo) => {
      set((state) => {
        const newEvents = [...state.gcEvents, event];
        // Keep only last 100 GC events
        if (newEvents.length > 100) {
          newEvents.shift();
        }

        // Add timeline event
        let updatedTimeline = state.timeline;
        if (updatedTimeline) {
          const newEvents = [...updatedTimeline.events, {
            timestamp: event.timestamp,
            type: 'gc' as const,
            description: `Garbage Collection (${event.type}, ${event.duration.toFixed(2)}ms)`,
            memoryImpact: event.memoryReclaimed
          }];
          // Trim timeline events to prevent unbounded growth
          if (newEvents.length > MAX_TIMELINE_EVENTS) {
            newEvents.splice(0, newEvents.length - MAX_TIMELINE_EVENTS);
          }
          updatedTimeline = {
            ...updatedTimeline,
            events: newEvents
          };
        }

        return { 
          gcEvents: newEvents,
          timeline: updatedTimeline
        };
      });
    },

    // Snapshot management
    createSnapshot: (name: string) => {
      set((state) => {
        const snapshot: MemoryProfilerSnapshot = {
          id: `snapshot-${Date.now()}`,
          timestamp: Date.now(),
          name,
          memory: state.currentMemory!,
          components: [...state.components],
          hooks: [...state.hooks],
          leaks: [...state.leaks],
          performance: state.performance!,
          gcEvents: [...state.gcEvents.slice(-10)] // Include last 10 GC events
        };

        return {
          snapshots: [...state.snapshots, snapshot]
        };
      });
    },

    deleteSnapshot: (id: string) => {
      set((state) => ({
        snapshots: state.snapshots.filter(s => s.id !== id)
      }));
    },

    // Optimization suggestions
    addSuggestion: (suggestion: MemoryOptimizationSuggestion) => {
      set((state) => {
        const existingIndex = state.suggestions.findIndex(s => s.id === suggestion.id);
        if (existingIndex >= 0) {
          const updatedSuggestions = [...state.suggestions];
          updatedSuggestions[existingIndex] = suggestion;
          return { suggestions: updatedSuggestions };
        } else {
          return { suggestions: [...state.suggestions, suggestion] };
        }
      });
    },

    dismissSuggestion: (id: string) => {
      set((state) => ({
        suggestions: state.suggestions.filter(s => s.id !== id)
      }));
    },

    // Budget management
    updateBudgets: (budgets: MemoryBudget[]) => {
      set({ budgets });
    },

    // Alert management
    addAlert: (alert: MemoryProfilerState['alerts'][0]) => {
      set((state) => {
        // Avoid duplicate alerts
        const existingAlert = state.alerts.find(a => 
          a.type === alert.type && a.message === alert.message
        );
        
        if (existingAlert) return state;

        const newAlerts = [...state.alerts, alert];
        // Keep only last 50 alerts
        if (newAlerts.length > 50) {
          newAlerts.shift();
        }

        return { alerts: newAlerts };
      });
    },

    dismissAlert: (id: string) => {
      set((state) => ({
        alerts: state.alerts.filter(a => a.id !== id)
      }));
    },

    clearAlerts: () => {
      set({ alerts: [] });
    },

    // Reset all data
    reset: () => {
      set({
        ...initialState,
        config: get().config // Preserve config
      });
    },

    // Computed getters
    getMemoryTrend: () => {
      const state = get();
      if (!state.timeline || state.timeline.measurements.length < 2) {
        return 'stable';
      }

      const measurements = state.timeline.measurements;
      const recent = measurements.slice(-10);
      if (recent.length < 2) return 'stable';

      const first = recent[0];
      const last = recent[recent.length - 1];
      
      if (!first.heapUsed || !last.heapUsed) return 'stable';

      const change = (last.heapUsed - first.heapUsed) / first.heapUsed;
      
      if (change > 0.05) return 'up';
      if (change < -0.05) return 'down';
      return 'stable';
    },

    getTotalMemoryUsage: () => {
      const state = get();
      return state.currentMemory?.heapUsed || 0;
    },

    getComponentsByMemoryUsage: () => {
      const state = get();
      return [...state.components].sort((a, b) => b.totalMemory - a.totalMemory);
    },

    getActiveLeakCount: () => {
      const state = get();
      return state.leaks.length;
    },

    getBudgetViolations: () => {
      const state = get();
      const currentUsageMB = state.currentMemory ? state.currentMemory.heapUsed / 1024 / 1024 : 0;
      
      return state.budgets.map(budget => ({
        ...budget,
        currentUsageMB,
        isExceeded: currentUsageMB > budget.budgetMB
      })).filter(budget => budget.isExceeded);
    },

    getMemoryPressureLevel: () => {
      const state = get();
      if (!state.currentMemory || !state.currentMemory.heapLimit) return 'low';
      
      const usageRatio = state.currentMemory.heapUsed / state.currentMemory.heapLimit;
      
      if (usageRatio > 0.8) return 'high';
      if (usageRatio > 0.6) return 'medium';
      return 'low';
    },

    getCurrentMemoryUsageMB: () => {
      const state = get();
      return state.currentMemory ? state.currentMemory.heapUsed / 1024 / 1024 : 0;
    },

    // Additional computed getters
    getFilteredWarnings: () => {
      const state = get();
      return state.warnings || [];
    },

    getFilteredComponents: () => {
      const state = get();
      return state.componentTree || state.components || [];
    },

    getCurrentMemoryUsage: () => {
      const state = get();
      return state.currentMemory?.heapUsed || 0;
    },

    getMemoryUtilization: () => {
      const state = get();
      if (!state.currentMemory || !state.currentMemory.heapLimit) return 0;
      return state.currentMemory.heapUsed / state.currentMemory.heapLimit;
    }
  }))
);