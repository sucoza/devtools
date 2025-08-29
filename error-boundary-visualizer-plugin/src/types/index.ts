export interface ErrorBoundaryInfo {
  id: string
  componentName: string
  componentStack: string
  hasError: boolean
  errorCount: number
  lastError?: ErrorInfo
  children: ErrorBoundaryInfo[]
  coverage: number
  depth: number
  path: string[]
  fallbackComponent?: string
  isActive: boolean
}

export interface ErrorInfo {
  id: string
  timestamp: number
  message: string
  stack?: string
  componentStack?: string
  errorBoundaryId?: string
  category: ErrorCategory
  severity: ErrorSeverity
  metadata?: Record<string, unknown>
  groupId?: string
  occurrences: number
  firstSeen: number
  lastSeen: number
}

export enum ErrorCategory {
  RENDER = 'render',
  ASYNC = 'async',
  EVENT_HANDLER = 'event_handler',
  LIFECYCLE = 'lifecycle',
  NETWORK = 'network',
  UNKNOWN = 'unknown'
}

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface ComponentTreeNode {
  id: string
  name: string
  type: 'error-boundary' | 'component' | 'fragment'
  hasErrorBoundary: boolean
  errorBoundaryId?: string
  children: ComponentTreeNode[]
  props?: Record<string, unknown>
  state?: Record<string, unknown>
  errors: ErrorInfo[]
  depth: number
  path: string
}

export interface ErrorRecoveryStrategy {
  id: string
  name: string
  description: string
  fallbackComponent?: React.ComponentType<{ error: Error; resetErrorBoundary: () => void }>
  retryDelay?: number
  maxRetries?: number
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
  onReset?: () => void
}

export interface ErrorSimulation {
  id: string
  name: string
  description: string
  targetComponent?: string
  errorType: ErrorCategory
  errorMessage: string
  triggerCondition: 'immediate' | 'delayed' | 'conditional'
  delay?: number
  condition?: () => boolean
}

export interface SourceMapInfo {
  url: string
  content?: string
  loaded: boolean
  error?: string
}

export interface EnhancedStackFrame {
  functionName?: string
  fileName?: string
  lineNumber?: number
  columnNumber?: number
  source?: string
  sourceLine?: string
  sourceContext?: string[]
  isNative: boolean
  isEval: boolean
  isConstructor: boolean
}

export interface ErrorGroup {
  id: string
  signature: string
  message: string
  count: number
  errors: ErrorInfo[]
  firstSeen: number
  lastSeen: number
  category: ErrorCategory
  severity: ErrorSeverity
  affectedComponents: string[]
}

export interface ErrorMetrics {
  totalErrors: number
  errorRate: number
  errorsByCategory: Record<ErrorCategory, number>
  errorsBySeverity: Record<ErrorSeverity, number>
  errorsByComponent: Record<string, number>
  errorTrend: Array<{ timestamp: number; count: number }>
  mttr: number // Mean Time To Recovery
  coverage: number // Percentage of components with error boundaries
}

export interface ExternalServiceConfig {
  type: 'sentry' | 'bugsnag' | 'rollbar' | 'custom'
  enabled: boolean
  apiKey?: string
  endpoint?: string
  projectId?: string
  environment?: string
  release?: string
  beforeSend?: (event: ErrorInfo) => ErrorInfo | null
}

export interface DevToolsConfig {
  enabled: boolean
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  defaultOpen: boolean
  theme: 'light' | 'dark' | 'auto'
  shortcuts: {
    toggle: string
    clear: string
    export: string
  }
  features: {
    componentTree: boolean
    errorHeatmap: boolean
    stackTraceEnhancement: boolean
    errorSimulation: boolean
    externalIntegration: boolean
    errorRecording: boolean
    analytics: boolean
  }
  performance: {
    maxErrors: number
    maxStackFrames: number
    throttleMs: number
    enableProfiling: boolean
  }
}

export interface ErrorBoundaryDevToolsState {
  errors: ErrorInfo[]
  errorGroups: ErrorGroup[]
  errorBoundaries: Map<string, ErrorBoundaryInfo>
  componentTree: ComponentTreeNode | null
  metrics: ErrorMetrics
  config: DevToolsConfig
  selectedError: ErrorInfo | null
  selectedBoundary: ErrorBoundaryInfo | null
  recoveryStrategies: Map<string, ErrorRecoveryStrategy>
  simulations: ErrorSimulation[]
  sourceMaps: Map<string, SourceMapInfo>
  isRecording: boolean
  recordedSessions: Array<{
    id: string
    timestamp: number
    duration: number
    errors: ErrorInfo[]
    events: unknown[]
  }>
}