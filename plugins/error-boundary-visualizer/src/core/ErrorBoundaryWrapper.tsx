import React, { Component, ErrorInfo, ReactNode } from 'react'
import { useErrorBoundaryDevTools } from './store'
import type { ErrorBoundaryInfo, ErrorInfo as DevToolsErrorInfo } from '../types'
import { ErrorCategory, ErrorSeverity } from '../types'

interface Props {
  children: ReactNode
  fallback?: React.ComponentType<{ error: Error; resetErrorBoundary: () => void }>
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  onReset?: () => void
  boundaryId?: string
  boundaryName?: string
  level?: 'page' | 'section' | 'component'
  enableDevTools?: boolean
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  errorCount: number
  retryCount: number
}

function categorizeError(error: Error): ErrorCategory {
  const message = error.message.toLowerCase()
  const stack = error.stack?.toLowerCase() || ''
  
  if (message.includes('network') || message.includes('fetch') || message.includes('axios')) {
    return ErrorCategory.NETWORK
  }
  if (message.includes('async') || message.includes('promise')) {
    return ErrorCategory.ASYNC
  }
  if (stack.includes('handleevent') || stack.includes('onclick') || stack.includes('onchange')) {
    return ErrorCategory.EVENT_HANDLER
  }
  if (stack.includes('componentdidmount') || stack.includes('componentdidupdate') || stack.includes('useeffect')) {
    return ErrorCategory.LIFECYCLE
  }
  if (stack.includes('render')) {
    return ErrorCategory.RENDER
  }
  return ErrorCategory.UNKNOWN
}

function assessSeverity(error: Error, errorInfo: ErrorInfo): ErrorSeverity {
  const message = error.message.toLowerCase()
  
  // Check for critical/fatal keywords first - these should always be CRITICAL
  if (message.includes('critical') || message.includes('fatal')) {
    return ErrorSeverity.CRITICAL
  }
  
  // Then check component stack depth for other errors
  const componentStack = errorInfo.componentStack || ''
  const depth = componentStack.split('\n').length
  
  if (depth < 3) {
    return ErrorSeverity.HIGH
  }
  if (depth < 6) {
    return ErrorSeverity.MEDIUM
  }
  return ErrorSeverity.LOW
}

export class ErrorBoundaryWrapper extends Component<Props, State> {
  private boundaryId: string
  private unregister?: () => void

  constructor(props: Props) {
    super(props)
    
    this.boundaryId = props.boundaryId || `boundary-${Date.now()}-${Math.random()}`
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
      retryCount: 0,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { onError, enableDevTools = true } = this.props
    
    this.setState((prevState) => ({
      errorInfo,
      errorCount: prevState.errorCount + 1,
    }))
    
    if (enableDevTools) {
      const store = useErrorBoundaryDevTools.getState()
      
      // Create DevTools error info
      const devToolsError: DevToolsErrorInfo = {
        id: `error-${Date.now()}-${Math.random()}`,
        timestamp: Date.now(),
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        errorBoundaryId: this.boundaryId,
        category: categorizeError(error),
        severity: assessSeverity(error, errorInfo),
        metadata: {
          name: error.name,
          boundaryName: this.props.boundaryName,
          level: this.props.level,
        },
        occurrences: 1,
        firstSeen: Date.now(),
        lastSeen: Date.now(),
      }
      
      // Add error to store
      store.addError(devToolsError)
      
      // Update boundary info
      store.updateErrorBoundary(this.boundaryId, {
        hasError: true,
        errorCount: this.state.errorCount + 1,
        lastError: devToolsError,
      })
      
      // Update metrics
      store.updateMetrics()
    }
    
    // Call user's error handler
    onError?.(error, errorInfo)
  }

  componentDidMount() {
    const { enableDevTools = true } = this.props
    
    if (enableDevTools) {
      const store = useErrorBoundaryDevTools.getState()
      
      // Register this boundary
      const boundaryInfo: ErrorBoundaryInfo = {
        id: this.boundaryId,
        componentName: this.props.boundaryName || 'ErrorBoundary',
        componentStack: '',
        hasError: false,
        errorCount: 0,
        children: [],
        coverage: 0,
        depth: 0,
        path: [],
        fallbackComponent: this.props.fallback?.name,
        isActive: true,
      }
      
      store.registerErrorBoundary(boundaryInfo)
      
      // Set up unregister function
      this.unregister = () => {
        store.unregisterErrorBoundary(this.boundaryId)
      }
    }
  }

  componentWillUnmount() {
    this.unregister?.()
  }

  resetErrorBoundary = () => {
    const { onReset, enableDevTools = true } = this.props
    
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: this.state.retryCount + 1,
    })
    
    if (enableDevTools) {
      const store = useErrorBoundaryDevTools.getState()
      store.updateErrorBoundary(this.boundaryId, {
        hasError: false,
      })
    }
    
    onReset?.()
  }

  render() {
    const { hasError, error } = this.state
    const { children, fallback: Fallback } = this.props
    
    if (hasError && error) {
      if (Fallback) {
        return (
          <Fallback
            error={error}
            resetErrorBoundary={this.resetErrorBoundary}
          />
        )
      }
      
      // Default fallback UI
      return (
        <div style={{
          padding: '20px',
          background: '#fee',
          border: '1px solid #fcc',
          borderRadius: '4px',
          margin: '10px',
        }}>
          <h2 style={{ color: '#c00', margin: '0 0 10px' }}>Something went wrong</h2>
          <details style={{ whiteSpace: 'pre-wrap' }}>
            <summary>Error details</summary>
            <p>{error.message}</p>
            {error.stack && (
              <pre style={{ fontSize: '12px', overflow: 'auto' }}>{error.stack}</pre>
            )}
          </details>
          <button
            onClick={this.resetErrorBoundary}
            style={{
              marginTop: '10px',
              padding: '5px 10px',
              background: '#c00',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Try again
          </button>
        </div>
      )
    }
    
    return children
  }
}