import { useSyncExternalStore } from 'react';
import { useMemo } from 'react';
import { 
  useMemoryProfilerStore,
  createMemoryProfilerEventClient
} from '../core';
import type { 
  MemoryProfilerEvents
} from '../types';

/**
 * Main hook for accessing memory profiler functionality
 */
export function useMemoryProfiler() {
  // Get the store state using useSyncExternalStore for React 18 compatibility
  const state = useSyncExternalStore(
    useMemoryProfilerStore.subscribe,
    useMemoryProfilerStore.getState,
    useMemoryProfilerStore.getState
  );

  // Get store actions
  const actions = useMemoryProfilerStore.getState();

  // Create event client for external integrations
  const eventClient = useMemo(() => createMemoryProfilerEventClient(), []);

  return {
    // State
    isRecording: state.isRecording,
    isPaused: state.isPaused,
    activeTab: state.activeTab,
    currentSnapshot: state.currentSnapshot,
    timeline: state.timeline,
    warnings: state.warnings,
    recommendations: state.recommendations,
    leakPatterns: state.leakPatterns,
    componentTree: state.componentTree,
    componentStats: state.componentStats,
    config: state.config,
    activeSession: state.activeSession,
    sessions: state.sessions,
    selectedComponent: state.selectedComponent,
    selectedSession: state.selectedSession,
    filters: state.filters,
    exportData: state.exportData,
    importStatus: state.importStatus,

    // Actions
    startProfiling: actions.startProfiling,
    stopProfiling: actions.stopProfiling,
    pauseProfiling: actions.pauseProfiling,
    resumeProfiling: actions.resumeProfiling,
    clearSession: actions.clearSession,
    deleteSession: actions.deleteSession,
    loadSession: actions.loadSession,
    takeSnapshot: actions.takeSnapshot,
    clearSnapshots: actions.clearSnapshots,
    selectComponent: actions.selectComponent,
    analyzeComponent: actions.analyzeComponent,
    trackComponent: actions.trackComponent,
    untrackComponent: actions.untrackComponent,
    updateConfig: actions.updateConfig,
    resetConfig: actions.resetConfig,
    dismissWarning: actions.dismissWarning,
    markRecommendationCompleted: actions.markRecommendationCompleted,
    generateRecommendations: actions.generateRecommendations,
    updateFilters: actions.updateFilters,
    clearFilters: actions.clearFilters,
    setActiveTab: actions.setActiveTab,
    exportSession: actions.exportSession,
    importSession: actions.importSession,
    triggerGC: actions.triggerGC,
    simulateMemoryPressure: actions.simulateMemoryPressure,
    enableDebugMode: actions.enableDebugMode,
    disableDebugMode: actions.disableDebugMode,
    logMemorySnapshot: actions.logMemorySnapshot,

    // Computed values
    getFilteredWarnings: actions.getFilteredWarnings,
    getFilteredComponents: actions.getFilteredComponents,
    getCurrentMemoryUsage: actions.getCurrentMemoryUsage,
    getMemoryUtilization: actions.getMemoryUtilization,

    // Event client for external integrations
    eventClient,
  };
}

/**
 * Hook for subscribing to memory profiler events
 */
export function useMemoryProfilerEvents() {
  const eventClient = useMemo(() => createMemoryProfilerEventClient(), []);

  const subscribe = useMemo(() => {
    return <K extends keyof MemoryProfilerEvents>(
      event: K,
      callback: (data: MemoryProfilerEvents[K]) => void
    ) => {
      return eventClient.subscribe(event, callback);
    };
  }, [eventClient]);

  const emit = useMemo(() => {
    return <K extends keyof MemoryProfilerEvents>(
      event: K,
      data: MemoryProfilerEvents[K]
    ) => {
      return eventClient.emit(event, data);
    };
  }, [eventClient]);

  return { subscribe, emit, eventClient };
}

/**
 * Hook for accessing current memory statistics
 */
export function useMemoryStats() {
  const {
    currentSnapshot,
    timeline,
    warnings,
    componentTree,
    getCurrentMemoryUsage,
    getMemoryUtilization
  } = useMemoryProfiler();

  const stats = useMemo(() => {
    const currentMemory = getCurrentMemoryUsage();
    const memoryUtilization = getMemoryUtilization();

    const warningsByType = warnings.reduce((acc, warning) => {
      acc[warning.type] = (acc[warning.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const warningsBySeverity = warnings.reduce((acc, warning) => {
      acc[warning.severity] = (acc[warning.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const componentCount = componentTree.length;
    const totalComponentMemory = componentTree.reduce((sum, comp) => sum + comp.memoryUsage, 0);
    const componentsWithWarnings = componentTree.filter(comp => comp.warnings.length > 0).length;

    const timelineStats = timeline && timeline.measurements && timeline.measurements.length > 0 ? {
      duration: timeline.endTime - timeline.startTime,
      memoryGrowth: timeline.measurements.length > 1 
        ? timeline.measurements[timeline.measurements.length - 1]?.heapUsed - timeline.measurements[0]?.heapUsed
        : 0,
      gcEvents: timeline.events?.filter(event => event.type === 'gc').length || 0,
      peakMemory: Math.max(...timeline.measurements.map(measurement => measurement.heapUsed)),
      minMemory: Math.min(...timeline.measurements.map(measurement => measurement.heapUsed))
    } : null;

    return {
      // Current state
      currentMemory,
      memoryUtilization,
      
      // Warning statistics
      totalWarnings: warnings.length,
      warningsByType,
      warningsBySeverity,
      
      // Component statistics
      componentCount,
      totalComponentMemory,
      componentsWithWarnings,
      averageComponentMemory: componentCount > 0 ? totalComponentMemory / componentCount : 0,
      
      // Timeline statistics
      timelineStats,
      
      // Health score (0-100)
      healthScore: calculateHealthScore({
        memoryUtilization,
        warningCount: warnings.length,
        componentCount,
        componentsWithWarnings
      })
    };
  }, [
    currentSnapshot,
    timeline,
    warnings,
    componentTree,
    getCurrentMemoryUsage,
    getMemoryUtilization
  ]);

  return stats;
}

/**
 * Hook for filtering and searching components
 */
export function useComponentFilter(searchQuery: string = '', filterOptions: {
  showOnlyWithWarnings?: boolean;
  sortBy?: 'name' | 'memory' | 'renders';
} = {}) {
  const { componentTree } = useMemoryProfiler();

  const filteredComponents = useMemo(() => {
    let filtered = componentTree;

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(component =>
        component.componentName.toLowerCase().includes(query)
      );
    }

    // Apply warning filter
    if (filterOptions.showOnlyWithWarnings) {
      filtered = filtered.filter(component => component.warnings.length > 0);
    }

    // Apply sorting
    if (filterOptions.sortBy) {
      filtered = [...filtered].sort((a, b) => {
        switch (filterOptions.sortBy) {
          case 'name':
            return a.componentName.localeCompare(b.componentName);
          case 'memory':
            return b.memoryUsage - a.memoryUsage;
          case 'renders':
            return b.renderCount - a.renderCount;
          default:
            return 0;
        }
      });
    }

    return filtered;
  }, [componentTree, searchQuery, filterOptions]);

  return filteredComponents;
}

/**
 * Hook for getting recommendations by category
 */
export function useOptimizationRecommendations(category?: string) {
  const { recommendations } = useMemoryProfiler();

  const categorizedRecommendations = useMemo(() => {
    const filtered = category 
      ? recommendations.filter(rec => rec.type === category)
      : recommendations;

    const byPriority = filtered.reduce((acc, rec) => {
      if (!acc[rec.priority]) acc[rec.priority] = [];
      acc[rec.priority].push(rec);
      return acc;
    }, {} as Record<string, typeof recommendations>);

    const totalSavings = filtered.reduce((acc, rec) => ({
      memory: acc.memory + rec.estimatedSavings.memory,
      performance: Math.max(acc.performance, rec.estimatedSavings.performance)
    }), { memory: 0, performance: 0 });

    return {
      all: filtered,
      byPriority,
      totalSavings,
      count: filtered.length
    };
  }, [recommendations, category]);

  return categorizedRecommendations;
}

/**
 * Hook for monitoring memory trends
 */
export function useMemoryTrends(windowSize: number = 10) {
  const { timeline } = useMemoryProfiler();

  const trends = useMemo(() => {
    if (!timeline || !timeline.measurements || timeline.measurements.length < 2) {
      return {
        memoryTrend: 'stable' as const,
        growthRate: 0,
        trendStrength: 0,
        predictions: null
      };
    }

    // Use last N points for trend analysis
    const recentPoints = timeline.measurements.slice(-windowSize);
    if (recentPoints.length < 2) {
      return {
        memoryTrend: 'stable' as const,
        growthRate: 0,
        trendStrength: 0,
        predictions: null
      };
    }

    // Calculate linear regression for trend analysis
    const n = recentPoints.length;
    const sumX = recentPoints.reduce((sum, _, index) => sum + index, 0);
    const sumY = recentPoints.reduce((sum, measurement) => sum + measurement.heapUsed, 0);
    const sumXY = recentPoints.reduce((sum, measurement, index) => sum + index * measurement.heapUsed, 0);
    const sumXX = recentPoints.reduce((sum, _, index) => sum + index * index, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Calculate R-squared for trend strength
    const meanY = sumY / n;
    const ssRes = recentPoints.reduce((sum, measurement, index) => {
      const predicted = slope * index + intercept;
      return sum + Math.pow(measurement.heapUsed - predicted, 2);
    }, 0);
    const ssTot = recentPoints.reduce((sum, measurement) => {
      return sum + Math.pow(measurement.heapUsed - meanY, 2);
    }, 0);
    const rSquared = ssTot > 0 ? 1 - (ssRes / ssTot) : 0;

    // Determine trend direction
    const growthRate = slope; // bytes per sample
    const trendStrength = Math.abs(rSquared);
    
    let memoryTrend: 'growing' | 'declining' | 'stable' = 'stable';
    if (Math.abs(slope) > 1024 && rSquared > 0.5) { // At least 1KB change with good correlation
      memoryTrend = slope > 0 ? 'growing' : 'declining';
    }

    // Simple prediction for next few points
    const predictions = rSquared > 0.3 ? {
      next1: slope * n + intercept,
      next5: slope * (n + 4) + intercept,
      next10: slope * (n + 9) + intercept
    } : null;

    return {
      memoryTrend,
      growthRate,
      trendStrength,
      predictions
    };
  }, [timeline, windowSize]);

  return trends;
}

// Helper function to calculate overall health score
function calculateHealthScore({
  memoryUtilization,
  warningCount,
  componentCount,
  componentsWithWarnings
}: {
  memoryUtilization: number;
  warningCount: number;
  componentCount: number;
  componentsWithWarnings: number;
}): number {
  let score = 100;

  // Memory utilization penalty (0-40 points)
  if (memoryUtilization > 0.9) score -= 40;
  else if (memoryUtilization > 0.7) score -= 25;
  else if (memoryUtilization > 0.5) score -= 10;

  // Warnings penalty (0-30 points)
  const warningPenalty = Math.min(warningCount * 5, 30);
  score -= warningPenalty;

  // Component health penalty (0-20 points)
  if (componentCount > 0) {
    const componentWarningRatio = componentsWithWarnings / componentCount;
    score -= componentWarningRatio * 20;
  }

  // Ensure score is between 0 and 100
  return Math.max(0, Math.min(100, Math.round(score)));
}