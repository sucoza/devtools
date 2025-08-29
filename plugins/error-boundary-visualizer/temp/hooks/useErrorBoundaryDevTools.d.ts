import type { ComponentTreeNode, ErrorBoundaryInfo, ErrorInfo } from '../types';
interface UseErrorBoundaryDevToolsOptions {
    enabled?: boolean;
    autoDetectBoundaries?: boolean;
    enhanceStackTraces?: boolean;
    trackComponentTree?: boolean;
    throttleMs?: number;
}
export declare function useErrorBoundaryDevToolsHook(options?: UseErrorBoundaryDevToolsOptions): {
    errors: ErrorInfo[];
    errorBoundaries: Map<string, ErrorBoundaryInfo>;
    componentTree: ComponentTreeNode | null;
    metrics: import("../types").ErrorMetrics;
    config: import("../types").DevToolsConfig;
    reportError: (error: Error | string, metadata?: Record<string, unknown>) => void;
    registerBoundary: (boundary: ErrorBoundaryInfo) => void;
    clearErrors: () => void;
    updateConfig: (config: Partial<import("../types").DevToolsConfig>) => void;
    isEnabled: boolean;
    fiberRoot: any;
};
export { useErrorBoundaryDevToolsHook as useErrorBoundaryDevTools };
//# sourceMappingURL=useErrorBoundaryDevTools.d.ts.map