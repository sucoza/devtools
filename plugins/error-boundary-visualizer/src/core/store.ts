import { create } from 'zustand'
import { devtools, subscribeWithSelector } from 'zustand/middleware'
import type {
  ErrorBoundaryDevToolsState,
  ErrorInfo,
  ErrorBoundaryInfo,
  ComponentTreeNode,
  ErrorGroup,
  ErrorRecoveryStrategy,
  ErrorSimulation,
  DevToolsConfig,
  ErrorMetrics,
} from '../types'
import { ErrorCategory, ErrorSeverity } from '../types'

const defaultConfig: DevToolsConfig = {
  enabled: true,
  position: 'bottom-right',
  defaultOpen: false,
  theme: 'auto',
  shortcuts: {
    toggle: 'ctrl+shift+e',
    clear: 'ctrl+shift+c',
    export: 'ctrl+shift+x',
  },
  features: {
    componentTree: true,
    errorHeatmap: true,
    stackTraceEnhancement: true,
    errorSimulation: true,
    externalIntegration: true,
    errorRecording: true,
    analytics: true,
  },
  performance: {
    maxErrors: 1000,
    maxStackFrames: 50,
    throttleMs: 100,
    enableProfiling: false,
  },
}

const initialMetrics: ErrorMetrics = {
  totalErrors: 0,
  errorRate: 0,
  errorsByCategory: Object.values(ErrorCategory).reduce(
    (acc, cat) => ({ ...acc, [cat]: 0 }),
    {} as Record<ErrorCategory, number>
  ),
  errorsBySeverity: Object.values(ErrorSeverity).reduce(
    (acc, sev) => ({ ...acc, [sev]: 0 }),
    {} as Record<ErrorSeverity, number>
  ),
  errorsByComponent: {},
  errorTrend: [],
  mttr: 0,
  coverage: 0,
}

interface ErrorBoundaryDevToolsActions {
  // Error management
  addError: (error: ErrorInfo) => void
  clearErrors: () => void
  selectError: (error: ErrorInfo | null) => void
  groupErrors: () => void
  
  // Error boundary management
  registerErrorBoundary: (boundary: ErrorBoundaryInfo) => void
  unregisterErrorBoundary: (boundaryId: string) => void
  updateErrorBoundary: (boundaryId: string, updates: Partial<ErrorBoundaryInfo>) => void
  selectBoundary: (boundary: ErrorBoundaryInfo | null) => void
  
  // Component tree management
  updateComponentTree: (tree: ComponentTreeNode) => void
  calculateCoverage: () => number
  
  // Recovery strategies
  addRecoveryStrategy: (strategy: ErrorRecoveryStrategy) => void
  removeRecoveryStrategy: (strategyId: string) => void
  applyRecoveryStrategy: (boundaryId: string, strategyId: string) => void
  
  // Error simulation
  addSimulation: (simulation: ErrorSimulation) => void
  removeSimulation: (simulationId: string) => void
  runSimulation: (simulationId: string) => void
  
  // Configuration
  updateConfig: (config: Partial<DevToolsConfig>) => void
  toggleFeature: (feature: keyof DevToolsConfig['features']) => void
  
  // Recording
  startRecording: () => void
  stopRecording: () => void
  clearRecordings: () => void
  
  // Metrics
  updateMetrics: () => void
  
  // Export/Import
  exportState: () => string
  importState: (stateJson: string) => void
}

export const useErrorBoundaryDevTools = create<
  ErrorBoundaryDevToolsState & ErrorBoundaryDevToolsActions
>()(
  devtools(
    subscribeWithSelector((set, get) => ({
      // Initial state
      errors: [],
      errorGroups: [],
      errorBoundaries: new Map(),
      componentTree: null,
      metrics: initialMetrics,
      config: defaultConfig,
      selectedError: null,
      selectedBoundary: null,
      recoveryStrategies: new Map(),
      simulations: [],
      sourceMaps: new Map(),
      isRecording: false,
      recordedSessions: [],

      // Actions
      addError: (error) =>
        set((state) => {
          const errors = [...state.errors, error]
          if (errors.length > state.config.performance.maxErrors) {
            errors.shift()
          }
          return { errors }
        }),

      clearErrors: () =>
        set({
          errors: [],
          errorGroups: [],
          selectedError: null,
        }),

      selectError: (error) => set({ selectedError: error }),

      groupErrors: () =>
        set((state) => {
          const groups = new Map<string, ErrorGroup>()
          
          state.errors.forEach((error) => {
            const signature = `${error.message}-${error.category}`
            const existing = groups.get(signature)
            
            if (existing) {
              existing.count++
              existing.errors.push(error)
              existing.lastSeen = error.timestamp
              if (!existing.affectedComponents.includes(error.componentStack || '')) {
                existing.affectedComponents.push(error.componentStack || '')
              }
            } else {
              groups.set(signature, {
                id: `group-${Date.now()}-${Math.random()}`,
                signature,
                message: error.message,
                count: 1,
                errors: [error],
                firstSeen: error.timestamp,
                lastSeen: error.timestamp,
                category: error.category,
                severity: error.severity,
                affectedComponents: [error.componentStack || ''],
              })
            }
          })
          
          return { errorGroups: Array.from(groups.values()) }
        }),

      registerErrorBoundary: (boundary) =>
        set((state) => {
          const boundaries = new Map(state.errorBoundaries)
          boundaries.set(boundary.id, boundary)
          return { errorBoundaries: boundaries }
        }),

      unregisterErrorBoundary: (boundaryId) =>
        set((state) => {
          const boundaries = new Map(state.errorBoundaries)
          boundaries.delete(boundaryId)
          return { errorBoundaries: boundaries }
        }),

      updateErrorBoundary: (boundaryId, updates) =>
        set((state) => {
          const boundaries = new Map(state.errorBoundaries)
          const existing = boundaries.get(boundaryId)
          if (existing) {
            boundaries.set(boundaryId, { ...existing, ...updates })
          }
          return { errorBoundaries: boundaries }
        }),

      selectBoundary: (boundary) => set({ selectedBoundary: boundary }),

      updateComponentTree: (tree) => set({ componentTree: tree }),

      calculateCoverage: () => {
        const state = get()
        if (!state.componentTree) return 0
        
        let totalComponents = 0
        let coveredComponents = 0
        
        const traverse = (node: ComponentTreeNode) => {
          totalComponents++
          if (node.hasErrorBoundary) {
            coveredComponents++
          }
          node.children.forEach(traverse)
        }
        
        traverse(state.componentTree)
        
        return totalComponents > 0 ? (coveredComponents / totalComponents) * 100 : 0
      },

      addRecoveryStrategy: (strategy) =>
        set((state) => {
          const strategies = new Map(state.recoveryStrategies)
          strategies.set(strategy.id, strategy)
          return { recoveryStrategies: strategies }
        }),

      removeRecoveryStrategy: (strategyId) =>
        set((state) => {
          const strategies = new Map(state.recoveryStrategies)
          strategies.delete(strategyId)
          return { recoveryStrategies: strategies }
        }),

      applyRecoveryStrategy: (boundaryId, strategyId) => {
        const state = get()
        const boundary = state.errorBoundaries.get(boundaryId)
        const strategy = state.recoveryStrategies.get(strategyId)
        
        if (boundary && strategy) {
          // Apply strategy logic here
          // Strategy ${strategyId} applied to boundary ${boundaryId}
        }
      },

      addSimulation: (simulation) =>
        set((state) => ({
          simulations: [...state.simulations, simulation],
        })),

      removeSimulation: (simulationId) =>
        set((state) => ({
          simulations: state.simulations.filter((s) => s.id !== simulationId),
        })),

      runSimulation: (simulationId) => {
        const state = get()
        const simulation = state.simulations.find((s) => s.id === simulationId)
        
        if (simulation) {
          // Trigger the simulated error
          // Running simulation: ${simulation.name}
        }
      },

      updateConfig: (config) =>
        set((state) => ({
          config: { ...state.config, ...config },
        })),

      toggleFeature: (feature) =>
        set((state) => ({
          config: {
            ...state.config,
            features: {
              ...state.config.features,
              [feature]: !state.config.features[feature],
            },
          },
        })),

      startRecording: () => set({ isRecording: true }),

      stopRecording: () =>
        set((state) => {
          if (state.isRecording) {
            // Save current session
            const session = {
              id: `session-${Date.now()}`,
              timestamp: Date.now(),
              duration: 0, // Calculate based on start time
              errors: [...state.errors],
              events: [], // Collected events
            }
            
            return {
              isRecording: false,
              recordedSessions: [...state.recordedSessions, session],
            }
          }
          return { isRecording: false }
        }),

      clearRecordings: () => set({ recordedSessions: [] }),

      updateMetrics: () =>
        set((state) => {
          const metrics: ErrorMetrics = {
            totalErrors: state.errors.length,
            errorRate: state.errors.length / (Date.now() / 1000 / 60), // errors per minute
            errorsByCategory: state.errors.reduce(
              (acc, error) => {
                acc[error.category] = (acc[error.category] || 0) + 1
                return acc
              },
              { ...initialMetrics.errorsByCategory }
            ),
            errorsBySeverity: state.errors.reduce(
              (acc, error) => {
                acc[error.severity] = (acc[error.severity] || 0) + 1
                return acc
              },
              { ...initialMetrics.errorsBySeverity }
            ),
            errorsByComponent: state.errors.reduce(
              (acc, error) => {
                const component = error.componentStack?.split('\n')[0] || 'Unknown'
                acc[component] = (acc[component] || 0) + 1
                return acc
              },
              {} as Record<string, number>
            ),
            errorTrend: [], // Calculate based on time windows
            mttr: 0, // Calculate based on recovery times
            coverage: get().calculateCoverage(),
          }
          
          return { metrics }
        }),

      exportState: () => {
        const state = get()
        return JSON.stringify({
          errors: state.errors,
          errorGroups: state.errorGroups,
          config: state.config,
          recordedSessions: state.recordedSessions,
        })
      },

      importState: (stateJson) => {
        try {
          const imported = JSON.parse(stateJson)
          set({
            errors: imported.errors || [],
            errorGroups: imported.errorGroups || [],
            config: { ...defaultConfig, ...imported.config },
            recordedSessions: imported.recordedSessions || [],
          })
        } catch {
          // Failed to import state
        }
      },
    })),
    {
      name: 'error-boundary-devtools',
    }
  )
)