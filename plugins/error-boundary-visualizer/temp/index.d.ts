export { useErrorBoundaryDevTools } from './core/store';
export { ErrorBoundaryWrapper } from './core/ErrorBoundaryWrapper';
export { ErrorBoundaryDevToolsPanel } from './components/ErrorBoundaryDevToolsPanel';
export { ComponentTreeView } from './components/ComponentTreeView';
export { ErrorList } from './components/ErrorList';
export { StackTraceViewer } from './components/StackTraceViewer';
export { ErrorAnalytics } from './components/ErrorAnalytics';
export { ErrorSimulator } from './components/ErrorSimulator';
export { RecoveryStrategyEditor } from './components/RecoveryStrategyEditor';
export { useErrorBoundaryDevToolsHook } from './hooks/useErrorBoundaryDevTools';
export type { ErrorBoundaryInfo, ErrorInfo, ErrorCategory, ErrorSeverity, ComponentTreeNode, ErrorRecoveryStrategy, ErrorSimulation, SourceMapInfo, EnhancedStackFrame, ErrorGroup, ErrorMetrics, ExternalServiceConfig, DevToolsConfig, ErrorBoundaryDevToolsState, } from './types';
import React from 'react';
import type { DevToolsConfig } from './types';
interface ErrorBoundaryDevToolsProps {
    enabled?: boolean;
    position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
    defaultOpen?: boolean;
    theme?: 'light' | 'dark' | 'auto';
    onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}
export declare const ErrorBoundaryDevTools: React.FC<ErrorBoundaryDevToolsProps>;
/**
 * Initialize Error Boundary DevTools with configuration
 */
export declare function initializeErrorBoundaryDevTools(config?: Partial<DevToolsConfig>): void;
/**
 * Manually report an error to the DevTools
 */
export declare function reportError(error: Error | string, metadata?: Record<string, unknown>): void;
/**
 * Create a higher-order component that wraps components with error boundary
 */
export declare function withErrorBoundary<P extends object>(Component: React.ComponentType<P>, fallbackComponent?: React.ComponentType<{
    error: Error;
    resetErrorBoundary: () => void;
}>): React.ForwardRefExoticComponent<React.PropsWithoutRef<P> & React.RefAttributes<any>>;
/**
 * Hook for components to register themselves as error boundaries
 */
export declare function useErrorBoundary(): {
    hasError: boolean;
    error: Error | null;
    resetErrorBoundary: () => void;
    captureError: (error: Error) => void;
};
//# sourceMappingURL=index.d.ts.map