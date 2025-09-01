// Core exports
export { useErrorBoundaryDevTools } from './core/store'
export { ErrorBoundaryWrapper } from './core/ErrorBoundaryWrapper'
import { ErrorCategory, ErrorSeverity } from './types'

// Component exports
export { ErrorBoundaryDevToolsPanel } from './components/ErrorBoundaryDevToolsPanel'
export { ComponentTreeView } from './components/ComponentTreeView'
export { ErrorList } from './components/ErrorList'
export { StackTraceViewer } from './components/StackTraceViewer'
export { ErrorAnalytics } from './components/ErrorAnalytics'
export { ErrorSimulator } from './components/ErrorSimulator'
export { RecoveryStrategyEditor } from './components/RecoveryStrategyEditor'

// Hook exports
export { useErrorBoundaryDevToolsHook } from './hooks/useErrorBoundaryDevTools'

// Type exports
export type {
  ErrorBoundaryInfo,
  ErrorInfo,
  ErrorCategory,
  ErrorSeverity,
  ComponentTreeNode,
  ErrorRecoveryStrategy,
  ErrorSimulation,
  SourceMapInfo,
  EnhancedStackFrame,
  ErrorGroup,
  ErrorMetrics,
  ExternalServiceConfig,
  DevToolsConfig,
  ErrorBoundaryDevToolsState,
} from './types'

// Main DevTools component for easy integration
import React from 'react'
import { ErrorBoundaryDevToolsPanel } from './components/ErrorBoundaryDevToolsPanel'
import { useErrorBoundaryDevToolsHook } from './hooks/useErrorBoundaryDevTools'
import { ErrorBoundaryWrapper } from './core/ErrorBoundaryWrapper'
import { useErrorBoundaryDevTools } from './core/store'
import type { DevToolsConfig } from './types'

interface ErrorBoundaryDevToolsProps {
  enabled?: boolean
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  defaultOpen?: boolean
  theme?: 'light' | 'dark' | 'auto'
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

export const ErrorBoundaryDevTools: React.FC<ErrorBoundaryDevToolsProps> = ({
  enabled = true,
  position = 'bottom-right',
  defaultOpen = false,
  theme = 'auto',
  onError,
}) => {
  const { updateConfig } = useErrorBoundaryDevToolsHook({
    enabled,
    autoDetectBoundaries: true,
    enhanceStackTraces: true,
    trackComponentTree: true,
  })

  React.useEffect(() => {
    updateConfig({
      enabled,
      position,
      defaultOpen,
      theme,
    })
  }, [enabled, position, defaultOpen, theme, updateConfig])

  React.useEffect(() => {
    if (onError) {
      // Set up custom error handler
      const handleError = (event: ErrorEvent) => {
        const error = new Error(event.message)
        error.stack = event.error?.stack
        onError(error, {
          componentStack: event.error?.componentStack || '',
        } as React.ErrorInfo)
      }

      window.addEventListener('error', handleError)
      return () => window.removeEventListener('error', handleError)
    }
    return undefined
  }, [onError])

  if (!enabled) return null

  return <ErrorBoundaryDevToolsPanel />
}

// Utility functions for manual integration

/**
 * Initialize Error Boundary DevTools with configuration
 * This should be used inside a React component
 */
export function useInitializeErrorBoundaryDevTools(config?: Partial<DevToolsConfig>) {
  const { updateConfig } = useErrorBoundaryDevTools()
  
  React.useEffect(() => {
    if (config) {
      updateConfig(config)
    }
  }, [config, updateConfig])
  
  return { updateConfig }
}

/**
 * Hook to manually report an error to the DevTools
 * This should be used inside a React component
 */
export function useReportError() {
  const { addError } = useErrorBoundaryDevTools()
  
  const reportError = React.useCallback((error: Error | string, metadata?: Record<string, unknown>) => {
    const errorInfo = {
      id: `manual-${Date.now()}-${Math.random()}`,
      timestamp: Date.now(),
      message: typeof error === 'string' ? error : error.message,
      stack: typeof error === 'object' ? error.stack : undefined,
      category: ErrorCategory.UNKNOWN,
      severity: ErrorSeverity.MEDIUM,
      occurrences: 1,
      firstSeen: Date.now(),
      lastSeen: Date.now(),
      metadata,
    }
    
    addError(errorInfo)
  }, [addError])
  
  return { reportError }
}

/**
 * Create a higher-order component that wraps components with error boundary
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallbackComponent?: React.ComponentType<{ error: Error; resetErrorBoundary: () => void }>
) {
  const WrappedComponent = React.forwardRef<any, P>((props, ref) => (
    <ErrorBoundaryWrapper fallback={fallbackComponent}>
      <Component {...(props as P)} ref={ref} />
    </ErrorBoundaryWrapper>
  ))

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name || 'Component'})`

  return WrappedComponent
}

/**
 * Hook for components to register themselves as error boundaries
 */
export function useErrorBoundary() {
  const { registerErrorBoundary } = useErrorBoundaryDevTools()
  const [hasError, setHasError] = React.useState(false)
  const [error, setError] = React.useState<Error | null>(null)

  const resetErrorBoundary = React.useCallback(() => {
    setHasError(false)
    setError(null)
  }, [])

  React.useEffect(() => {
    if (hasError && error) {
      // Register this component as an error boundary
      const boundaryInfo = {
        id: `boundary-${Date.now()}-${Math.random()}`,
        componentName: 'useErrorBoundary',
        componentStack: error.stack || '',
        hasError: true,
        errorCount: 1,
        lastError: {
          id: `error-${Date.now()}`,
          timestamp: Date.now(),
          message: error.message,
          stack: error.stack,
          category: ErrorCategory.RENDER,
          severity: ErrorSeverity.HIGH,
          occurrences: 1,
          firstSeen: Date.now(),
          lastSeen: Date.now(),
        },
        children: [],
        coverage: 100,
        depth: 0,
        path: ['useErrorBoundary'],
        isActive: true,
      }

      registerErrorBoundary(boundaryInfo)
    }
  }, [hasError, error, registerErrorBoundary])

  const captureError = React.useCallback((error: Error) => {
    setHasError(true)
    setError(error)
  }, [])

  return {
    hasError,
    error,
    resetErrorBoundary,
    captureError,
  }
}

// Development helper functions (non-hook versions for global access)
const createGlobalReportError = () => (error: Error | string, metadata?: Record<string, unknown>) => {
  // This is a simplified version for development use
  console.warn('Error reported via global helper:', error, metadata)
  // In a real implementation, this would integrate with the store
  // but for global access, we just log it
}

const createGlobalInitialize = () => (config?: Partial<DevToolsConfig>) => {
  // This is a simplified version for development use
  console.warn('DevTools configuration updated via global helper:', config)
  // In a real implementation, this would integrate with the store
  return { updateConfig: () => {} }
}

// Development helpers
if (process.env.NODE_ENV === 'development') {
  // Add global helpers for development
  (window as any).__ERROR_BOUNDARY_DEVTOOLS__ = {
    reportError: createGlobalReportError(),
    initializeErrorBoundaryDevTools: createGlobalInitialize(),
  }
}