import type { ErrorBoundaryDevToolsState, ErrorInfo, ErrorBoundaryInfo, ComponentTreeNode, ErrorRecoveryStrategy, ErrorSimulation, DevToolsConfig } from '../types';
interface ErrorBoundaryDevToolsActions {
    addError: (error: ErrorInfo) => void;
    clearErrors: () => void;
    selectError: (error: ErrorInfo | null) => void;
    groupErrors: () => void;
    registerErrorBoundary: (boundary: ErrorBoundaryInfo) => void;
    unregisterErrorBoundary: (boundaryId: string) => void;
    updateErrorBoundary: (boundaryId: string, updates: Partial<ErrorBoundaryInfo>) => void;
    selectBoundary: (boundary: ErrorBoundaryInfo | null) => void;
    updateComponentTree: (tree: ComponentTreeNode) => void;
    calculateCoverage: () => number;
    addRecoveryStrategy: (strategy: ErrorRecoveryStrategy) => void;
    removeRecoveryStrategy: (strategyId: string) => void;
    applyRecoveryStrategy: (boundaryId: string, strategyId: string) => void;
    addSimulation: (simulation: ErrorSimulation) => void;
    removeSimulation: (simulationId: string) => void;
    runSimulation: (simulationId: string) => void;
    updateConfig: (config: Partial<DevToolsConfig>) => void;
    toggleFeature: (feature: keyof DevToolsConfig['features']) => void;
    startRecording: () => void;
    stopRecording: () => void;
    clearRecordings: () => void;
    updateMetrics: () => void;
    exportState: () => string;
    importState: (stateJson: string) => void;
}
export declare const useErrorBoundaryDevTools: import("zustand").UseBoundStore<Omit<Omit<import("zustand").StoreApi<ErrorBoundaryDevToolsState & ErrorBoundaryDevToolsActions>, "setState" | "devtools"> & {
    setState(partial: (ErrorBoundaryDevToolsState & ErrorBoundaryDevToolsActions) | Partial<ErrorBoundaryDevToolsState & ErrorBoundaryDevToolsActions> | ((state: ErrorBoundaryDevToolsState & ErrorBoundaryDevToolsActions) => (ErrorBoundaryDevToolsState & ErrorBoundaryDevToolsActions) | Partial<ErrorBoundaryDevToolsState & ErrorBoundaryDevToolsActions>), replace?: false | undefined, action?: (string | {
        [x: string]: unknown;
        [x: number]: unknown;
        [x: symbol]: unknown;
        type: string;
    }) | undefined): void;
    setState(state: (ErrorBoundaryDevToolsState & ErrorBoundaryDevToolsActions) | ((state: ErrorBoundaryDevToolsState & ErrorBoundaryDevToolsActions) => ErrorBoundaryDevToolsState & ErrorBoundaryDevToolsActions), replace: true, action?: (string | {
        [x: string]: unknown;
        [x: number]: unknown;
        [x: symbol]: unknown;
        type: string;
    }) | undefined): void;
    devtools: {
        cleanup: () => void;
    };
}, "subscribe"> & {
    subscribe: {
        (listener: (selectedState: ErrorBoundaryDevToolsState & ErrorBoundaryDevToolsActions, previousSelectedState: ErrorBoundaryDevToolsState & ErrorBoundaryDevToolsActions) => void): () => void;
        <U>(selector: (state: ErrorBoundaryDevToolsState & ErrorBoundaryDevToolsActions) => U, listener: (selectedState: U, previousSelectedState: U) => void, options?: {
            equalityFn?: ((a: U, b: U) => boolean) | undefined;
            fireImmediately?: boolean;
        } | undefined): () => void;
    };
}>;
export {};
//# sourceMappingURL=store.d.ts.map