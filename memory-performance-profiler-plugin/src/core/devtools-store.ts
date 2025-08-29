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

export interface MemoryProfilerStore extends MemoryProfilerState {
  // Actions
  startProfiling: () => void;
  stopProfiling: () => void;
  updateConfig: (config: Partial<MemoryProfilerConfig>) => void;
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
}

export const useMemoryProfilerStore = create<MemoryProfilerStore>()(
  subscribeWithSelector((set, get) => ({
    ...initialState,

    // Core profiler controls
    startProfiling: () => {
      set({ isRunning: true });
    },

    stopProfiling: () => {
      set({ isRunning: false });
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
          updatedTimeline = {
            ...updatedTimeline,
            events: [...updatedTimeline.events, {
              timestamp: event.timestamp,
              type: 'gc',
              description: `Garbage Collection (${event.type}, ${event.duration.toFixed(2)}ms)`,
              memoryImpact: event.memoryReclaimed
            }]
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
    }
  }))
);