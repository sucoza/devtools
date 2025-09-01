import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useErrorBoundaryDevTools } from '../../core/store';
import { ErrorCategory, ErrorSeverity } from '../../types';
import type { ErrorInfo, ErrorBoundaryInfo, ErrorRecoveryStrategy, ErrorSimulation } from '../../types';

// Mock Zustand devtools
vi.mock('zustand/middleware', () => ({
  devtools: (fn: any) => fn,
  subscribeWithSelector: (fn: any) => fn,
}));

describe('Error Boundary DevTools Store', () => {
  beforeEach(() => {
    // Reset the store state by calling the store methods
    useErrorBoundaryDevTools.getState().clearErrors();
    useErrorBoundaryDevTools.getState().clearRecordings();
    // Clear boundaries map
    const currentState = useErrorBoundaryDevTools.getState();
    Array.from(currentState.errorBoundaries.keys()).forEach(id => {
      useErrorBoundaryDevTools.getState().unregisterErrorBoundary(id);
    });
    // Clear simulations
    const currentSimulations = [...currentState.simulations];
    currentSimulations.forEach(sim => {
      useErrorBoundaryDevTools.getState().removeSimulation(sim.id);
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initial State', () => {
    it('should initialize with default state', () => {
      const state = useErrorBoundaryDevTools.getState();
      expect(state.errors).toEqual([]);
      expect(state.errorGroups).toEqual([]);
      expect(state.errorBoundaries).toBeInstanceOf(Map);
      expect(state.errorBoundaries.size).toBe(0);
      expect(state.componentTree).toBeNull();
      expect(state.selectedError).toBeNull();
      expect(state.selectedBoundary).toBeNull();
      expect(state.recoveryStrategies).toBeInstanceOf(Map);
      expect(state.simulations).toEqual([]);
      expect(state.sourceMaps).toBeInstanceOf(Map);
      expect(state.isRecording).toBe(false);
      expect(state.recordedSessions).toEqual([]);
    });

    it('should initialize with default config', () => {
      const state = useErrorBoundaryDevTools.getState();
      expect(state.config).toBeDefined();
      expect(state.config.enabled).toBe(true);
      expect(state.config.position).toBe('bottom-right');
      expect(state.config.defaultOpen).toBe(false);
      expect(state.config.theme).toBe('auto');
      expect(state.config.features).toBeDefined();
      expect(state.config.performance).toBeDefined();
    });

    it('should initialize with default metrics', () => {
      const state = useErrorBoundaryDevTools.getState();
      expect(state.metrics).toBeDefined();
      expect(state.metrics.totalErrors).toBe(0);
      expect(state.metrics.errorRate).toBe(0);
      expect(state.metrics.errorsByCategory).toBeDefined();
      expect(state.metrics.errorsBySeverity).toBeDefined();
      expect(state.metrics.errorsByComponent).toEqual({});
      expect(state.metrics.coverage).toBe(0);
    });
  });

  describe('Error Management', () => {
    it('should add error to store', () => {
      const error: ErrorInfo = {
        id: 'test-error-1',
        timestamp: Date.now(),
        message: 'Test error',
        stack: 'Error: Test error\n    at test',
        category: ErrorCategory.RENDER,
        severity: ErrorSeverity.HIGH,
        occurrences: 1,
        firstSeen: Date.now(),
        lastSeen: Date.now(),
      };

      useErrorBoundaryDevTools.getState().addError(error);
      const updatedState = useErrorBoundaryDevTools.getState();

      expect(updatedState.errors).toHaveLength(1);
      expect(updatedState.errors[0]).toEqual(error);
    });

    it('should limit errors to maxErrors config', () => {
      const initialState = useErrorBoundaryDevTools.getState();
      const maxErrors = initialState.config.performance.maxErrors;
      
      // Add more errors than the limit
      for (let i = 0; i < maxErrors + 5; i++) {
        const error: ErrorInfo = {
          id: `test-error-${i}`,
          timestamp: Date.now(),
          message: `Test error ${i}`,
          category: ErrorCategory.RENDER,
          severity: ErrorSeverity.MEDIUM,
          occurrences: 1,
          firstSeen: Date.now(),
          lastSeen: Date.now(),
        };
        useErrorBoundaryDevTools.getState().addError(error);
      }

      const finalState = useErrorBoundaryDevTools.getState();
      expect(finalState.errors).toHaveLength(maxErrors);
      // Should keep the most recent errors (remove from beginning)
      expect(finalState.errors[0].id).toBe(`test-error-5`);
    });

    it('should clear all errors', () => {
      const error: ErrorInfo = {
        id: 'test-error-1',
        timestamp: Date.now(),
        message: 'Test error',
        category: ErrorCategory.RENDER,
        severity: ErrorSeverity.HIGH,
        occurrences: 1,
        firstSeen: Date.now(),
        lastSeen: Date.now(),
      };

      useErrorBoundaryDevTools.getState().addError(error);
      useErrorBoundaryDevTools.getState().selectError(error);
      
      let state = useErrorBoundaryDevTools.getState();
      expect(state.errors).toHaveLength(1);
      expect(state.selectedError).toBe(error);

      useErrorBoundaryDevTools.getState().clearErrors();

      state = useErrorBoundaryDevTools.getState();
      expect(state.errors).toHaveLength(0);
      expect(state.errorGroups).toHaveLength(0);
      expect(state.selectedError).toBeNull();
    });

    it('should select error', () => {
      const error: ErrorInfo = {
        id: 'test-error-1',
        timestamp: Date.now(),
        message: 'Test error',
        category: ErrorCategory.RENDER,
        severity: ErrorSeverity.HIGH,
        occurrences: 1,
        firstSeen: Date.now(),
        lastSeen: Date.now(),
      };

      useErrorBoundaryDevTools.getState().selectError(error);
      expect(useErrorBoundaryDevTools.getState().selectedError).toBe(error);

      useErrorBoundaryDevTools.getState().selectError(null);
      expect(useErrorBoundaryDevTools.getState().selectedError).toBeNull();
    });

    it('should group errors by signature', () => {
      const error1: ErrorInfo = {
        id: 'test-error-1',
        timestamp: Date.now(),
        message: 'Test error',
        category: ErrorCategory.RENDER,
        severity: ErrorSeverity.HIGH,
        occurrences: 1,
        firstSeen: Date.now(),
        lastSeen: Date.now(),
        componentStack: 'ComponentA > ComponentB',
      };

      const error2: ErrorInfo = {
        id: 'test-error-2',
        timestamp: Date.now() + 1000,
        message: 'Test error', // Same message
        category: ErrorCategory.RENDER, // Same category
        severity: ErrorSeverity.HIGH,
        occurrences: 1,
        firstSeen: Date.now() + 1000,
        lastSeen: Date.now() + 1000,
        componentStack: 'ComponentC > ComponentD',
      };

      useErrorBoundaryDevTools.getState().addError(error1);
      useErrorBoundaryDevTools.getState().addError(error2);
      useErrorBoundaryDevTools.getState().groupErrors();

      expect(useErrorBoundaryDevTools.getState().errorGroups).toHaveLength(1);
      const group = useErrorBoundaryDevTools.getState().errorGroups[0];
      expect(group.count).toBe(2);
      expect(group.errors).toHaveLength(2);
      expect(group.message).toBe('Test error');
      expect(group.category).toBe(ErrorCategory.RENDER);
      expect(group.affectedComponents).toHaveLength(2);
    });
  });

  describe('Error Boundary Management', () => {
    it('should register error boundary', () => {
      const boundary: ErrorBoundaryInfo = {
        id: 'test-boundary-1',
        componentName: 'TestBoundary',
        componentStack: 'App > TestBoundary',
        hasError: false,
        errorCount: 0,
        children: [],
        coverage: 100,
        depth: 1,
        path: ['App', 'TestBoundary'],
        isActive: true,
      };

      useErrorBoundaryDevTools.getState().registerErrorBoundary(boundary);

      expect(useErrorBoundaryDevTools.getState().errorBoundaries.size).toBe(1);
      expect(useErrorBoundaryDevTools.getState().errorBoundaries.get('test-boundary-1')).toEqual(boundary);
    });

    it('should unregister error boundary', () => {
      const boundary: ErrorBoundaryInfo = {
        id: 'test-boundary-1',
        componentName: 'TestBoundary',
        componentStack: 'App > TestBoundary',
        hasError: false,
        errorCount: 0,
        children: [],
        coverage: 100,
        depth: 1,
        path: ['App', 'TestBoundary'],
        isActive: true,
      };

      useErrorBoundaryDevTools.getState().registerErrorBoundary(boundary);
      expect(useErrorBoundaryDevTools.getState().errorBoundaries.size).toBe(1);

      useErrorBoundaryDevTools.getState().unregisterErrorBoundary('test-boundary-1');
      expect(useErrorBoundaryDevTools.getState().errorBoundaries.size).toBe(0);
    });

    it('should update error boundary', () => {
      const boundary: ErrorBoundaryInfo = {
        id: 'test-boundary-1',
        componentName: 'TestBoundary',
        componentStack: 'App > TestBoundary',
        hasError: false,
        errorCount: 0,
        children: [],
        coverage: 100,
        depth: 1,
        path: ['App', 'TestBoundary'],
        isActive: true,
      };

      useErrorBoundaryDevTools.getState().registerErrorBoundary(boundary);
      
      const updates = {
        hasError: true,
        errorCount: 1,
      };

      useErrorBoundaryDevTools.getState().updateErrorBoundary('test-boundary-1', updates);

      const updated = useErrorBoundaryDevTools.getState().errorBoundaries.get('test-boundary-1');
      expect(updated?.hasError).toBe(true);
      expect(updated?.errorCount).toBe(1);
      expect(updated?.componentName).toBe('TestBoundary');
    });

    it('should handle updating non-existent boundary gracefully', () => {
      expect(() => {
        useErrorBoundaryDevTools.getState().updateErrorBoundary('non-existent', { hasError: true });
      }).not.toThrow();
    });

    it('should select boundary', () => {
      const boundary: ErrorBoundaryInfo = {
        id: 'test-boundary-1',
        componentName: 'TestBoundary',
        componentStack: 'App > TestBoundary',
        hasError: false,
        errorCount: 0,
        children: [],
        coverage: 100,
        depth: 1,
        path: ['App', 'TestBoundary'],
        isActive: true,
      };

      useErrorBoundaryDevTools.getState().selectBoundary(boundary);
      expect(useErrorBoundaryDevTools.getState().selectedBoundary).toBe(boundary);

      useErrorBoundaryDevTools.getState().selectBoundary(null);
      expect(useErrorBoundaryDevTools.getState().selectedBoundary).toBeNull();
    });
  });

  describe('Component Tree Management', () => {
    it('should update component tree', () => {
      const tree = {
        id: 'root',
        name: 'App',
        type: 'component' as const,
        hasErrorBoundary: false,
        children: [],
        props: {},
        errors: [],
        depth: 0,
        path: 'App',
      };

      useErrorBoundaryDevTools.getState().updateComponentTree(tree);
      expect(useErrorBoundaryDevTools.getState().componentTree).toBe(tree);
    });

    it('should calculate coverage correctly', () => {
      const tree = {
        id: 'root',
        name: 'App',
        type: 'component' as const,
        hasErrorBoundary: true,
        children: [
          {
            id: 'child1',
            name: 'Child1',
            type: 'component' as const,
            hasErrorBoundary: false,
            children: [],
            props: {},
            errors: [],
            depth: 1,
            path: 'App > Child1',
          },
          {
            id: 'child2',
            name: 'Child2',
            type: 'component' as const,
            hasErrorBoundary: true,
            children: [],
            props: {},
            errors: [],
            depth: 1,
            path: 'App > Child2',
          },
        ],
        props: {},
        errors: [],
        depth: 0,
        path: 'App',
      };

      useErrorBoundaryDevTools.getState().updateComponentTree(tree);
      const coverage = useErrorBoundaryDevTools.getState().calculateCoverage();
      
      // 2 out of 3 components have error boundaries (App and Child2)
      expect(coverage).toBeCloseTo(66.67, 1);
    });

    it('should return 0 coverage for empty tree', () => {
      // Ensure tree is cleared
      useErrorBoundaryDevTools.getState().updateComponentTree(null);
      const coverage = useErrorBoundaryDevTools.getState().calculateCoverage();
      expect(coverage).toBe(0);
    });
  });

  describe('Recovery Strategies', () => {
    it('should add recovery strategy', () => {
      const strategy: ErrorRecoveryStrategy = {
        id: 'strategy-1',
        name: 'Retry Strategy',
        description: 'Retry failed operation',
        type: 'retry',
        config: {
          maxRetries: 3,
          delay: 1000,
        },
        isActive: true,
        createdAt: Date.now(),
      };

      useErrorBoundaryDevTools.getState().addRecoveryStrategy(strategy);

      expect(useErrorBoundaryDevTools.getState().recoveryStrategies.size).toBe(1);
      expect(useErrorBoundaryDevTools.getState().recoveryStrategies.get('strategy-1')).toBe(strategy);
    });

    it('should remove recovery strategy', () => {
      const strategy: ErrorRecoveryStrategy = {
        id: 'strategy-1',
        name: 'Retry Strategy',
        description: 'Retry failed operation',
        type: 'retry',
        config: {},
        isActive: true,
        createdAt: Date.now(),
      };

      useErrorBoundaryDevTools.getState().addRecoveryStrategy(strategy);
      expect(useErrorBoundaryDevTools.getState().recoveryStrategies.size).toBe(1);

      useErrorBoundaryDevTools.getState().removeRecoveryStrategy('strategy-1');
      expect(useErrorBoundaryDevTools.getState().recoveryStrategies.size).toBe(0);
    });

    it('should apply recovery strategy', () => {
      const boundary: ErrorBoundaryInfo = {
        id: 'test-boundary-1',
        componentName: 'TestBoundary',
        componentStack: 'App > TestBoundary',
        hasError: false,
        errorCount: 0,
        children: [],
        coverage: 100,
        depth: 1,
        path: ['App', 'TestBoundary'],
        isActive: true,
      };

      const strategy: ErrorRecoveryStrategy = {
        id: 'strategy-1',
        name: 'Retry Strategy',
        description: 'Retry failed operation',
        type: 'retry',
        config: {},
        isActive: true,
        createdAt: Date.now(),
      };

      useErrorBoundaryDevTools.getState().registerErrorBoundary(boundary);
      useErrorBoundaryDevTools.getState().addRecoveryStrategy(strategy);

      expect(() => {
        useErrorBoundaryDevTools.getState().applyRecoveryStrategy('test-boundary-1', 'strategy-1');
      }).not.toThrow();
    });
  });

  describe('Error Simulation', () => {
    it('should add simulation', () => {
      const simulation: ErrorSimulation = {
        id: 'sim-1',
        name: 'Test Simulation',
        description: 'Simulate render error',
        type: 'render-error',
        config: {
          component: 'TestComponent',
          trigger: 'mount',
        },
        isActive: false,
        createdAt: Date.now(),
      };

      useErrorBoundaryDevTools.getState().addSimulation(simulation);

      expect(useErrorBoundaryDevTools.getState().simulations).toHaveLength(1);
      expect(useErrorBoundaryDevTools.getState().simulations[0]).toBe(simulation);
    });

    it('should remove simulation', () => {
      const simulation: ErrorSimulation = {
        id: 'sim-1',
        name: 'Test Simulation',
        description: 'Simulate render error',
        type: 'render-error',
        config: {},
        isActive: false,
        createdAt: Date.now(),
      };

      useErrorBoundaryDevTools.getState().addSimulation(simulation);
      expect(useErrorBoundaryDevTools.getState().simulations).toHaveLength(1);

      useErrorBoundaryDevTools.getState().removeSimulation('sim-1');
      expect(useErrorBoundaryDevTools.getState().simulations).toHaveLength(0);
    });

    it('should run simulation', () => {
      const simulation: ErrorSimulation = {
        id: 'sim-1',
        name: 'Test Simulation',
        description: 'Simulate render error',
        type: 'render-error',
        config: {},
        isActive: false,
        createdAt: Date.now(),
      };

      useErrorBoundaryDevTools.getState().addSimulation(simulation);

      expect(() => {
        useErrorBoundaryDevTools.getState().runSimulation('sim-1');
      }).not.toThrow();
    });

    it('should handle running non-existent simulation', () => {
      expect(() => {
        useErrorBoundaryDevTools.getState().runSimulation('non-existent');
      }).not.toThrow();
    });
  });

  describe('Configuration', () => {
    it('should update config', () => {
      const configUpdate = {
        enabled: false,
        theme: 'dark' as const,
      };

      useErrorBoundaryDevTools.getState().updateConfig(configUpdate);

      expect(useErrorBoundaryDevTools.getState().config.enabled).toBe(false);
      expect(useErrorBoundaryDevTools.getState().config.theme).toBe('dark');
      expect(useErrorBoundaryDevTools.getState().config.position).toBe('bottom-right'); // Should keep existing values
    });

    it('should toggle feature', () => {
      const originalValue = useErrorBoundaryDevTools.getState().config.features.componentTree;
      
      useErrorBoundaryDevTools.getState().toggleFeature('componentTree');
      
      expect(useErrorBoundaryDevTools.getState().config.features.componentTree).toBe(!originalValue);
    });
  });

  describe('Recording', () => {
    it('should start recording', () => {
      useErrorBoundaryDevTools.getState().startRecording();
      expect(useErrorBoundaryDevTools.getState().isRecording).toBe(true);
    });

    it('should stop recording and save session', () => {
      useErrorBoundaryDevTools.getState().startRecording();
      expect(useErrorBoundaryDevTools.getState().isRecording).toBe(true);

      useErrorBoundaryDevTools.getState().stopRecording();
      expect(useErrorBoundaryDevTools.getState().isRecording).toBe(false);
      expect(useErrorBoundaryDevTools.getState().recordedSessions).toHaveLength(1);
      
      const session = useErrorBoundaryDevTools.getState().recordedSessions[0];
      expect(session.id).toMatch(/^session-/);
      expect(session.timestamp).toBeTypeOf('number');
      expect(session.errors).toEqual(useErrorBoundaryDevTools.getState().errors);
    });

    it('should handle stop recording when not recording', () => {
      expect(useErrorBoundaryDevTools.getState().isRecording).toBe(false);
      
      useErrorBoundaryDevTools.getState().stopRecording();
      expect(useErrorBoundaryDevTools.getState().isRecording).toBe(false);
      expect(useErrorBoundaryDevTools.getState().recordedSessions).toHaveLength(0);
    });

    it('should clear recordings', () => {
      useErrorBoundaryDevTools.getState().startRecording();
      useErrorBoundaryDevTools.getState().stopRecording();
      expect(useErrorBoundaryDevTools.getState().recordedSessions).toHaveLength(1);

      useErrorBoundaryDevTools.getState().clearRecordings();
      expect(useErrorBoundaryDevTools.getState().recordedSessions).toHaveLength(0);
    });
  });

  describe('Metrics', () => {
    it('should update metrics based on current errors', () => {
      const errors: ErrorInfo[] = [
        {
          id: 'error-1',
          timestamp: Date.now(),
          message: 'Render error',
          category: ErrorCategory.RENDER,
          severity: ErrorSeverity.HIGH,
          occurrences: 1,
          firstSeen: Date.now(),
          lastSeen: Date.now(),
          componentStack: 'ComponentA\n  at ComponentB',
        },
        {
          id: 'error-2',
          timestamp: Date.now(),
          message: 'Network error',
          category: ErrorCategory.NETWORK,
          severity: ErrorSeverity.MEDIUM,
          occurrences: 1,
          firstSeen: Date.now(),
          lastSeen: Date.now(),
          componentStack: 'ComponentC\n  at ComponentD',
        },
      ];

      errors.forEach(error => useErrorBoundaryDevTools.getState().addError(error));
      useErrorBoundaryDevTools.getState().updateMetrics();

      expect(useErrorBoundaryDevTools.getState().metrics.totalErrors).toBe(2);
      expect(useErrorBoundaryDevTools.getState().metrics.errorsByCategory[ErrorCategory.RENDER]).toBe(1);
      expect(useErrorBoundaryDevTools.getState().metrics.errorsByCategory[ErrorCategory.NETWORK]).toBe(1);
      expect(useErrorBoundaryDevTools.getState().metrics.errorsBySeverity[ErrorSeverity.HIGH]).toBe(1);
      expect(useErrorBoundaryDevTools.getState().metrics.errorsBySeverity[ErrorSeverity.MEDIUM]).toBe(1);
      expect(useErrorBoundaryDevTools.getState().metrics.errorsByComponent.ComponentA).toBe(1);
      expect(useErrorBoundaryDevTools.getState().metrics.errorsByComponent.ComponentC).toBe(1);
    });
  });

  describe('Export/Import', () => {
    it('should export state as JSON', () => {
      const error: ErrorInfo = {
        id: 'test-error-1',
        timestamp: Date.now(),
        message: 'Test error',
        category: ErrorCategory.RENDER,
        severity: ErrorSeverity.HIGH,
        occurrences: 1,
        firstSeen: Date.now(),
        lastSeen: Date.now(),
      };

      useErrorBoundaryDevTools.getState().addError(error);
      useErrorBoundaryDevTools.getState().groupErrors();
      useErrorBoundaryDevTools.getState().startRecording();
      useErrorBoundaryDevTools.getState().stopRecording();

      const exported = useErrorBoundaryDevTools.getState().exportState();
      expect(exported).toBeTypeOf('string');

      const parsed = JSON.parse(exported);
      expect(parsed.errors).toHaveLength(1);
      expect(parsed.errorGroups).toHaveLength(1);
      expect(parsed.config).toBeDefined();
      expect(parsed.recordedSessions).toHaveLength(1);
    });

    it('should import state from JSON', () => {
      const stateToImport = {
        errors: [
          {
            id: 'imported-error',
            timestamp: Date.now(),
            message: 'Imported error',
            category: ErrorCategory.RENDER,
            severity: ErrorSeverity.HIGH,
            occurrences: 1,
            firstSeen: Date.now(),
            lastSeen: Date.now(),
          },
        ],
        errorGroups: [],
        config: {
          enabled: false,
          theme: 'dark',
        },
        recordedSessions: [],
      };

      const stateJson = JSON.stringify(stateToImport);
      useErrorBoundaryDevTools.getState().importState(stateJson);

      expect(useErrorBoundaryDevTools.getState().errors).toHaveLength(1);
      expect(useErrorBoundaryDevTools.getState().errors[0].id).toBe('imported-error');
      expect(useErrorBoundaryDevTools.getState().config.enabled).toBe(false);
      expect(useErrorBoundaryDevTools.getState().config.theme).toBe('dark');
    });

    it('should handle invalid JSON during import', () => {
      const invalidJson = '{ invalid json }';
      
      expect(() => {
        useErrorBoundaryDevTools.getState().importState(invalidJson);
      }).not.toThrow();
      
      // Should not change existing state
      expect(useErrorBoundaryDevTools.getState().errors).toHaveLength(0);
    });
  });
});