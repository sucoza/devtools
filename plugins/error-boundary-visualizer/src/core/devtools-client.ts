import type { ErrorBoundaryDevToolsState, ErrorInfo, ErrorBoundaryInfo, ErrorRecoveryStrategy, ErrorSimulation } from '../types';
import { useErrorBoundaryDevTools } from './store';

// DevTools event client interface
export interface DevToolsEventClient<TEvents extends Record<string, any>> {
  subscribe: (callback: (event: TEvents[keyof TEvents], type: keyof TEvents) => void) => () => void;
}

export interface ErrorBoundaryDevToolsEvents {
  'error-boundary:state': ErrorBoundaryDevToolsState;
  'error-boundary:error': ErrorInfo;
  'error-boundary:boundary-registered': ErrorBoundaryInfo;
  'error-boundary:boundary-updated': ErrorBoundaryInfo;
}

export class ErrorBoundaryDevToolsClient implements DevToolsEventClient<ErrorBoundaryDevToolsEvents> {
  private unsubscribeStore?: () => void;

  subscribe = (
    callback: (
      event: ErrorBoundaryDevToolsEvents[keyof ErrorBoundaryDevToolsEvents],
      type: keyof ErrorBoundaryDevToolsEvents
    ) => void
  ) => {
    // Subscribe to Zustand store changes
    this.unsubscribeStore = useErrorBoundaryDevTools.subscribe((state) => {
      callback(state, 'error-boundary:state');
    });

    // Send initial state
    const initialState = useErrorBoundaryDevTools.getState();
    callback(initialState, 'error-boundary:state');

    return () => {
      this.unsubscribeStore?.();
    };
  };

  // Get current state
  getState = (): ErrorBoundaryDevToolsState => {
    return useErrorBoundaryDevTools.getState();
  };

  // Error management methods
  addError = (error: ErrorInfo) => {
    useErrorBoundaryDevTools.getState().addError(error);
  };

  clearErrors = () => {
    useErrorBoundaryDevTools.getState().clearErrors();
  };

  selectError = (error: ErrorInfo | null) => {
    useErrorBoundaryDevTools.getState().selectError(error);
  };

  groupErrors = () => {
    useErrorBoundaryDevTools.getState().groupErrors();
  };

  // Error boundary management methods
  registerErrorBoundary = (boundary: ErrorBoundaryInfo) => {
    useErrorBoundaryDevTools.getState().registerErrorBoundary(boundary);
  };

  unregisterErrorBoundary = (boundaryId: string) => {
    useErrorBoundaryDevTools.getState().unregisterErrorBoundary(boundaryId);
  };

  updateErrorBoundary = (boundaryId: string, updates: Partial<ErrorBoundaryInfo>) => {
    useErrorBoundaryDevTools.getState().updateErrorBoundary(boundaryId, updates);
  };

  selectBoundary = (boundary: ErrorBoundaryInfo | null) => {
    useErrorBoundaryDevTools.getState().selectBoundary(boundary);
  };

  // Component tree methods
  updateComponentTree = (tree: import('../types').ComponentTreeNode | null) => {
    useErrorBoundaryDevTools.getState().updateComponentTree(tree);
  };

  calculateCoverage = (): number => {
    return useErrorBoundaryDevTools.getState().calculateCoverage();
  };

  // Recovery strategy methods
  addRecoveryStrategy = (strategy: ErrorRecoveryStrategy) => {
    useErrorBoundaryDevTools.getState().addRecoveryStrategy(strategy);
  };

  removeRecoveryStrategy = (strategyId: string) => {
    useErrorBoundaryDevTools.getState().removeRecoveryStrategy(strategyId);
  };

  applyRecoveryStrategy = (boundaryId: string, strategyId: string) => {
    useErrorBoundaryDevTools.getState().applyRecoveryStrategy(boundaryId, strategyId);
  };

  // Error simulation methods
  addSimulation = (simulation: ErrorSimulation) => {
    useErrorBoundaryDevTools.getState().addSimulation(simulation);
  };

  removeSimulation = (simulationId: string) => {
    useErrorBoundaryDevTools.getState().removeSimulation(simulationId);
  };

  runSimulation = (simulationId: string) => {
    useErrorBoundaryDevTools.getState().runSimulation(simulationId);
  };

  // Configuration methods
  updateConfig = (config: Partial<import('../types').DevToolsConfig>) => {
    useErrorBoundaryDevTools.getState().updateConfig(config);
  };

  toggleFeature = (feature: keyof import('../types').DevToolsConfig['features']) => {
    useErrorBoundaryDevTools.getState().toggleFeature(feature);
  };

  // Recording methods
  startRecording = () => {
    useErrorBoundaryDevTools.getState().startRecording();
  };

  stopRecording = () => {
    useErrorBoundaryDevTools.getState().stopRecording();
  };

  clearRecordings = () => {
    useErrorBoundaryDevTools.getState().clearRecordings();
  };

  // Metrics methods
  updateMetrics = () => {
    useErrorBoundaryDevTools.getState().updateMetrics();
  };

  // Export/Import methods
  exportState = (): string => {
    return useErrorBoundaryDevTools.getState().exportState();
  };

  importState = (stateJson: string) => {
    useErrorBoundaryDevTools.getState().importState(stateJson);
  };
}

// Singleton instance
let clientInstance: ErrorBoundaryDevToolsClient | null = null;

export function createErrorBoundaryDevToolsClient(): ErrorBoundaryDevToolsClient {
  if (!clientInstance) {
    clientInstance = new ErrorBoundaryDevToolsClient();
  }
  return clientInstance;
}

export function getErrorBoundaryDevToolsClient(): ErrorBoundaryDevToolsClient | null {
  return clientInstance;
}
