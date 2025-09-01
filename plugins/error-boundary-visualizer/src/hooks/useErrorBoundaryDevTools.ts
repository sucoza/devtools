import { useEffect, useRef, useCallback } from 'react'
import { useErrorBoundaryDevTools } from '../core/store'
import type { ComponentTreeNode, ErrorBoundaryInfo, ErrorInfo } from '../types'
import { ErrorCategory, ErrorSeverity } from '../types'

interface UseErrorBoundaryDevToolsOptions {
  enabled?: boolean
  autoDetectBoundaries?: boolean
  enhanceStackTraces?: boolean
  trackComponentTree?: boolean
  throttleMs?: number
}

interface ReactFiberNode {
  type: any
  elementType: any
  stateNode: any
  child: ReactFiberNode | null
  sibling: ReactFiberNode | null
  return: ReactFiberNode | null
  memoizedProps: any
  memoizedState: any
  key: string | null
  index: number
  ref: any
  pendingProps: any
  effectTag: number
  alternate: ReactFiberNode | null
  actualDuration?: number
  actualStartTime?: number
  childExpirationTime: number
  expirationTime: number
  mode: number
  [key: string]: any
}

interface ReactDevToolsGlobal {
  __REACT_DEVTOOLS_GLOBAL_HOOK__?: {
    renderers: Map<number, any>
    onCommitFiberRoot?: (id: number, root: any) => void
    onCommitFiberUnmount?: (id: number, fiber: any) => void
  }
}

let _globalErrorHandler: ((error: ErrorEvent) => void) | null = null
let _reactErrorHandler: ((error: Error, errorInfo: any) => void) | null = null

export function useErrorBoundaryDevToolsHook(options: UseErrorBoundaryDevToolsOptions = {}) {
  const {
    enabled = true,
    autoDetectBoundaries = true,
    enhanceStackTraces: _enhanceStackTraces = true,
    trackComponentTree = true,
    throttleMs = 100,
  } = options

  const store = useErrorBoundaryDevTools()
  const lastUpdateRef = useRef(0)
  const fiberRootRef = useRef<any>(null)

  const throttledUpdate = useCallback((fn: () => void) => {
    const now = Date.now()
    if (now - lastUpdateRef.current > throttleMs) {
      fn()
      lastUpdateRef.current = now
    }
  }, [throttleMs])

  // Component tree traversal and analysis
  const traverseFiberTree = useCallback((fiber: ReactFiberNode | null, depth = 0): ComponentTreeNode | null => {
    if (!fiber) return null

    const getComponentName = (fiber: ReactFiberNode): string => {
      if (!fiber.type) return 'Unknown'
      
      if (typeof fiber.type === 'string') {
        return fiber.type // DOM elements
      }
      
      if (typeof fiber.type === 'function') {
        return fiber.type.displayName || fiber.type.name || 'Component'
      }
      
      if (fiber.type && typeof fiber.type === 'object') {
        if (fiber.type.displayName) return fiber.type.displayName
        if (fiber.type.name) return fiber.type.name
        if (fiber.type.render) return fiber.type.render.displayName || fiber.type.render.name || 'Component'
      }
      
      return 'Fragment'
    }

    const isErrorBoundary = (fiber: ReactFiberNode): boolean => {
      const instance = fiber.stateNode
      if (!instance) return false
      
      // Check for componentDidCatch or static getDerivedStateFromError
      return !!(
        (instance.componentDidCatch && typeof instance.componentDidCatch === 'function') ||
        (fiber.type && typeof fiber.type.getDerivedStateFromError === 'function')
      )
    }

    const componentName = getComponentName(fiber)
    const hasErrorBoundary = isErrorBoundary(fiber)
    
    const node: ComponentTreeNode = {
      id: `fiber-${fiber.index}-${depth}-${Date.now()}`,
      name: componentName,
      type: hasErrorBoundary ? 'error-boundary' : 
            (typeof fiber.type === 'string' ? 'component' : 'component'),
      hasErrorBoundary,
      errorBoundaryId: hasErrorBoundary ? `boundary-${fiber.index}-${depth}` : undefined,
      children: [],
      props: fiber.memoizedProps || fiber.pendingProps,
      state: fiber.memoizedState,
      errors: [], // Will be populated by error tracking
      depth,
      path: `${componentName}[${fiber.index}]`,
    }

    // Traverse children
    let child = fiber.child
    while (child) {
      const childNode = traverseFiberTree(child, depth + 1)
      if (childNode) {
        node.children.push(childNode)
      }
      child = child.sibling
    }

    return node
  }, [])

  // Error boundary detection and registration
  const detectAndRegisterErrorBoundaries = useCallback((rootFiber: any) => {
    const boundaries: ErrorBoundaryInfo[] = []

    const traverse = (fiber: ReactFiberNode | null, path: string[] = []) => {
      if (!fiber) return

      const componentName = fiber.type?.displayName || fiber.type?.name || 'Component'
      const currentPath = [...path, componentName]

      // Check if this fiber is an error boundary
      const instance = fiber.stateNode
      if (instance && (
        (instance.componentDidCatch && typeof instance.componentDidCatch === 'function') ||
        (fiber.type && typeof fiber.type.getDerivedStateFromError === 'function')
      )) {
        const boundaryInfo: ErrorBoundaryInfo = {
          id: `boundary-${fiber.index}-${currentPath.join('/')}`,
          componentName,
          componentStack: currentPath.join(' > '),
          hasError: !!(instance.state && instance.state.hasError),
          errorCount: 0, // Will be updated by error tracking
          children: [],
          coverage: 0, // Will be calculated
          depth: currentPath.length - 1,
          path: currentPath,
          isActive: true,
        }

        boundaries.push(boundaryInfo)
      }

      // Continue traversing
      let child = fiber.child
      while (child) {
        traverse(child, currentPath)
        child = child.sibling
      }
    }

    traverse(rootFiber)

    // Register all found boundaries
    boundaries.forEach(boundary => {
      store.registerErrorBoundary(boundary)
    })
  }, [store])

  // Global error handling
  useEffect(() => {
    if (!enabled) return undefined

    const handleGlobalError = (event: ErrorEvent) => {
      const error: ErrorInfo = {
        id: `error-${Date.now()}-${Math.random()}`,
        timestamp: Date.now(),
        message: event.message,
        stack: event.error?.stack,
        category: ErrorCategory.UNKNOWN,
        severity: ErrorSeverity.MEDIUM,
        occurrences: 1,
        firstSeen: Date.now(),
        lastSeen: Date.now(),
      }

      throttledUpdate(() => {
        store.addError(error)
        store.updateMetrics()
      })
    }

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const error: ErrorInfo = {
        id: `error-${Date.now()}-${Math.random()}`,
        timestamp: Date.now(),
        message: event.reason?.message || 'Unhandled Promise Rejection',
        stack: event.reason?.stack,
        category: ErrorCategory.ASYNC,
        severity: ErrorSeverity.HIGH,
        occurrences: 1,
        firstSeen: Date.now(),
        lastSeen: Date.now(),
      }

      throttledUpdate(() => {
        store.addError(error)
        store.updateMetrics()
      })
    }

    _globalErrorHandler = handleGlobalError
    window.addEventListener('error', handleGlobalError)
    window.addEventListener('unhandledrejection', handleUnhandledRejection)

    return () => {
      window.removeEventListener('error', handleGlobalError)
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
      _globalErrorHandler = null
    }
  }, [enabled, store, throttledUpdate])

  // React DevTools hook integration
  useEffect(() => {
    if (!enabled || !trackComponentTree) return undefined

    const global = window as any as ReactDevToolsGlobal
    const devToolsHook = global.__REACT_DEVTOOLS_GLOBAL_HOOK__

    if (!devToolsHook) {
      console.warn('React DevTools not detected. Component tree tracking may be limited.')
      return undefined
    }

    // Hook into React DevTools to get fiber tree updates
    const originalOnCommitFiberRoot = devToolsHook.onCommitFiberRoot

    devToolsHook.onCommitFiberRoot = (id: number, root: any) => {
      if (originalOnCommitFiberRoot) {
        originalOnCommitFiberRoot.call(devToolsHook, id, root)
      }

      // Store the fiber root for tree traversal
      fiberRootRef.current = root

      throttledUpdate(() => {
        if (autoDetectBoundaries) {
          detectAndRegisterErrorBoundaries(root.current)
        }

        // Build and update component tree
        const componentTree = traverseFiberTree(root.current)
        if (componentTree) {
          store.updateComponentTree(componentTree)
        }
      })
    }

    // Cleanup
    return () => {
      if (devToolsHook && originalOnCommitFiberRoot) {
        devToolsHook.onCommitFiberRoot = originalOnCommitFiberRoot
      }
    }
  }, [
    enabled, 
    trackComponentTree, 
    autoDetectBoundaries, 
    store, 
    throttledUpdate, 
    detectAndRegisterErrorBoundaries,
    traverseFiberTree
  ])

  // React Error Boundary integration
  useEffect(() => {
    if (!enabled) return undefined

    // Patch React error boundaries to capture errors
    const originalConsoleError = console.error

    _reactErrorHandler = (error: Error, errorInfo: any) => {
      const errorData: ErrorInfo = {
        id: `react-error-${Date.now()}-${Math.random()}`,
        timestamp: Date.now(),
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        category: ErrorCategory.RENDER,
        severity: ErrorSeverity.HIGH,
        occurrences: 1,
        firstSeen: Date.now(),
        lastSeen: Date.now(),
        metadata: {
          error: error.name,
          errorInfo,
        },
      }

      throttledUpdate(() => {
        store.addError(errorData)
        store.updateMetrics()
      })
    }

    console.error = (...args: any[]) => {
      originalConsoleError.apply(console, args)

      // Check if this looks like a React error
      const firstArg = args[0]
      if (typeof firstArg === 'string') {
        // Look for specific React error patterns, avoid false positives like "Non-React error"
        const isReactError = (
          firstArg.startsWith('React') ||
          firstArg.includes('React error') ||
          firstArg.includes('React warning') ||
          firstArg.includes('Error in') ||
          firstArg.includes('componentDidCatch') ||
          firstArg.includes('getDerivedStateFromError')
        ) && !firstArg.includes('Non-React')
        
        if (isReactError) {
          // This might be a React error, capture it
          const error: ErrorInfo = {
            id: `console-error-${Date.now()}-${Math.random()}`,
            timestamp: Date.now(),
            message: firstArg,
            category: ErrorCategory.RENDER,
            severity: ErrorSeverity.MEDIUM,
            occurrences: 1,
            firstSeen: Date.now(),
            lastSeen: Date.now(),
          }

          throttledUpdate(() => {
            store.addError(error)
          })
        }
      }
    }

    return () => {
      console.error = originalConsoleError
      _reactErrorHandler = null
    }
  }, [enabled, store, throttledUpdate])

  // Keyboard shortcuts
  useEffect(() => {
    if (!enabled) return undefined

    const handleKeyDown = (event: KeyboardEvent) => {
      const { shortcuts: _shortcuts } = store.config

      // Toggle DevTools panel
      if (event.ctrlKey && event.shiftKey && event.key === 'E') {
        event.preventDefault()
        store.updateConfig({ enabled: !store.config.enabled })
      }

      // Clear errors
      if (event.ctrlKey && event.shiftKey && event.key === 'C') {
        event.preventDefault()
        store.clearErrors()
      }

      // Export state
      if (event.ctrlKey && event.shiftKey && event.key === 'X') {
        event.preventDefault()
        const _data = store.exportState()
        // Export Error Boundary DevTools State
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [enabled, store])

  // Provide manual error reporting for testing
  const reportError = useCallback((error: Error | string, metadata?: Record<string, unknown>) => {
    const errorData: ErrorInfo = {
      id: `manual-error-${Date.now()}-${Math.random()}`,
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

    store.addError(errorData)
    store.updateMetrics()
  }, [store])

  // Provide boundary registration for manual setup
  const registerBoundary = useCallback((boundary: ErrorBoundaryInfo) => {
    store.registerErrorBoundary(boundary)
  }, [store])

  return {
    // State
    errors: store.errors,
    errorBoundaries: store.errorBoundaries,
    componentTree: store.componentTree,
    metrics: store.metrics,
    config: store.config,

    // Actions
    reportError,
    registerBoundary,
    clearErrors: store.clearErrors,
    updateConfig: store.updateConfig,

    // Utilities
    isEnabled: enabled,
    fiberRoot: fiberRootRef.current,
  }
}

// Export the hook with a simpler name
export { useErrorBoundaryDevToolsHook as useErrorBoundaryDevTools }