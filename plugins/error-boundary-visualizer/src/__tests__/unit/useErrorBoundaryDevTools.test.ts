import { describe, it, expect, beforeEach, afterEach, vi, Mock } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useErrorBoundaryDevToolsHook } from '../../hooks/useErrorBoundaryDevTools';
import { useErrorBoundaryDevTools } from '../../core/store';

// Mock the store
vi.mock('../../core/store', () => ({
  useErrorBoundaryDevTools: vi.fn(() => ({
    errors: [],
    errorBoundaries: new Map(),
    componentTree: null,
    metrics: { totalErrors: 0, errorRate: 0 },
    config: {
      enabled: true,
      shortcuts: {},
      performance: { throttleMs: 100 },
    },
    addError: vi.fn(),
    registerErrorBoundary: vi.fn(),
    updateComponentTree: vi.fn(),
    updateMetrics: vi.fn(),
    clearErrors: vi.fn(),
    updateConfig: vi.fn(),
    exportState: vi.fn(() => JSON.stringify({})),
  })),
}));

// Mock DOM APIs
const mockAddEventListener = vi.fn();
const mockRemoveEventListener = vi.fn();

// Mock console methods
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

describe('useErrorBoundaryDevTools Hook', () => {
  let mockStore: any;

  beforeEach(() => {
    mockStore = {
      errors: [],
      errorBoundaries: new Map(),
      componentTree: null,
      metrics: { totalErrors: 0, errorRate: 0 },
      config: {
        enabled: true,
        shortcuts: {},
        performance: { throttleMs: 100 },
      },
      addError: vi.fn(),
      registerErrorBoundary: vi.fn(),
      updateComponentTree: vi.fn(),
      updateMetrics: vi.fn(),
      clearErrors: vi.fn(),
      updateConfig: vi.fn(),
      exportState: vi.fn(() => JSON.stringify({})),
    };

    (useErrorBoundaryDevTools as Mock).mockReturnValue(mockStore);
    
    // Mock window event listeners
    vi.spyOn(window, 'addEventListener').mockImplementation(mockAddEventListener);
    vi.spyOn(window, 'removeEventListener').mockImplementation(mockRemoveEventListener);
    
    mockAddEventListener.mockClear();
    mockRemoveEventListener.mockClear();
    console.error = vi.fn();
    console.warn = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    console.error = originalConsoleError;
    console.warn = originalConsoleWarn;
  });

  describe('Hook Initialization', () => {
    it('should return hook interface with default options', () => {
      const { result } = renderHook(() => useErrorBoundaryDevToolsHook());

      expect(result.current).toMatchObject({
        errors: [],
        errorBoundaries: expect.any(Map),
        componentTree: null,
        metrics: expect.objectContaining({
          totalErrors: 0,
          errorRate: 0,
        }),
        config: expect.objectContaining({
          enabled: true,
        }),
        reportError: expect.any(Function),
        registerBoundary: expect.any(Function),
        clearErrors: expect.any(Function),
        updateConfig: expect.any(Function),
        isEnabled: true,
        fiberRoot: null,
      });
    });

    it('should respect provided options', () => {
      const options = {
        enabled: false,
        autoDetectBoundaries: false,
        enhanceStackTraces: false,
        trackComponentTree: false,
        throttleMs: 200,
      };

      const { result } = renderHook(() => useErrorBoundaryDevToolsHook(options));

      expect(result.current.isEnabled).toBe(false);
    });
  });

  describe('Global Error Handling', () => {
    it('should set up global error listeners when enabled', () => {
      renderHook(() => useErrorBoundaryDevToolsHook({ enabled: true }));

      expect(mockAddEventListener).toHaveBeenCalledWith('error', expect.any(Function));
      expect(mockAddEventListener).toHaveBeenCalledWith('unhandledrejection', expect.any(Function));
    });

    it('should not set up listeners when disabled', () => {
      renderHook(() => useErrorBoundaryDevToolsHook({ enabled: false }));

      expect(mockAddEventListener).not.toHaveBeenCalled();
    });

    it('should clean up event listeners on unmount', () => {
      const { unmount } = renderHook(() => useErrorBoundaryDevToolsHook({ enabled: true }));

      unmount();

      expect(mockRemoveEventListener).toHaveBeenCalledWith('error', expect.any(Function));
      expect(mockRemoveEventListener).toHaveBeenCalledWith('unhandledrejection', expect.any(Function));
    });

    it('should handle global error events', () => {
      renderHook(() => useErrorBoundaryDevToolsHook({ enabled: true }));

      // Get the error handler that was registered
      const errorHandler = mockAddEventListener.mock.calls.find(
        call => call[0] === 'error'
      )?.[1];

      expect(errorHandler).toBeDefined();

      // Simulate an error event
      const errorEvent = {
        message: 'Global error',
        error: {
          stack: 'Error: Global error\n    at test',
        },
      };

      act(() => {
        errorHandler(errorEvent);
      });

      expect(mockStore.addError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Global error',
          stack: 'Error: Global error\n    at test',
        })
      );
      expect(mockStore.updateMetrics).toHaveBeenCalled();
    });

    it('should handle unhandled promise rejections', () => {
      renderHook(() => useErrorBoundaryDevToolsHook({ enabled: true }));

      // Get the unhandledrejection handler
      const rejectionHandler = mockAddEventListener.mock.calls.find(
        call => call[0] === 'unhandledrejection'
      )?.[1];

      expect(rejectionHandler).toBeDefined();

      // Simulate an unhandled rejection
      const rejectionEvent = {
        reason: {
          message: 'Promise rejection',
          stack: 'Error: Promise rejection\n    at async',
        },
      };

      act(() => {
        rejectionHandler(rejectionEvent);
      });

      expect(mockStore.addError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Promise rejection',
          stack: 'Error: Promise rejection\n    at async',
        })
      );
    });

    it('should handle rejections without error objects', () => {
      renderHook(() => useErrorBoundaryDevToolsHook({ enabled: true }));

      const rejectionHandler = mockAddEventListener.mock.calls.find(
        call => call[0] === 'unhandledrejection'
      )?.[1];

      const rejectionEvent = {
        reason: 'String rejection',
      };

      act(() => {
        rejectionHandler(rejectionEvent);
      });

      expect(mockStore.addError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Unhandled Promise Rejection',
        })
      );
    });
  });

  describe('React DevTools Integration', () => {
    it('should warn when React DevTools not available', () => {
      // Make sure React DevTools hook is not available
      delete (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__;

      renderHook(() => useErrorBoundaryDevToolsHook({ 
        enabled: true, 
        trackComponentTree: true 
      }));

      expect(console.warn).toHaveBeenCalledWith(
        'React DevTools not detected. Component tree tracking may be limited.'
      );
    });

    it('should integrate with React DevTools when available', () => {
      const mockOnCommitFiberRoot = vi.fn();
      const mockDevToolsHook = {
        onCommitFiberRoot: mockOnCommitFiberRoot,
        renderers: new Map(),
      };

      (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__ = mockDevToolsHook;

      renderHook(() => useErrorBoundaryDevToolsHook({ 
        enabled: true, 
        trackComponentTree: true 
      }));

      // Should have replaced the onCommitFiberRoot function
      expect(mockDevToolsHook.onCommitFiberRoot).not.toBe(mockOnCommitFiberRoot);
    });

    it('should restore original onCommitFiberRoot on cleanup', () => {
      const originalOnCommitFiberRoot = vi.fn();
      const mockDevToolsHook = {
        onCommitFiberRoot: originalOnCommitFiberRoot,
        renderers: new Map(),
      };

      (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__ = mockDevToolsHook;

      const { unmount } = renderHook(() => useErrorBoundaryDevToolsHook({ 
        enabled: true, 
        trackComponentTree: true 
      }));

      unmount();

      expect(mockDevToolsHook.onCommitFiberRoot).toBe(originalOnCommitFiberRoot);
    });

    it('should not track component tree when disabled', () => {
      renderHook(() => useErrorBoundaryDevToolsHook({ 
        enabled: true, 
        trackComponentTree: false 
      }));

      expect(console.warn).not.toHaveBeenCalled();
    });
  });

  describe('Console Error Patching', () => {
    it('should patch console.error to capture React errors', () => {
      const originalConsoleError = console.error;
      
      renderHook(() => useErrorBoundaryDevToolsHook({ enabled: true }));

      expect(console.error).not.toBe(originalConsoleError);
    });

    it('should restore original console.error on cleanup', () => {
      const originalConsoleError = console.error;
      
      const { unmount } = renderHook(() => useErrorBoundaryDevToolsHook({ enabled: true }));
      
      unmount();

      expect(console.error).toBe(originalConsoleError);
    });

    it('should capture React-related console errors', () => {
      renderHook(() => useErrorBoundaryDevToolsHook({ enabled: true }));

      // Call console.error with a React-related message
      act(() => {
        console.error('React error occurred in component');
      });

      expect(mockStore.addError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'React error occurred in component',
        })
      );
    });

    it('should not capture non-React console errors', () => {
      renderHook(() => useErrorBoundaryDevToolsHook({ enabled: true }));

      act(() => {
        console.error('Non-React error');
      });

      expect(mockStore.addError).not.toHaveBeenCalled();
    });
  });

  describe('Keyboard Shortcuts', () => {
    it('should set up keyboard event listener', () => {
      renderHook(() => useErrorBoundaryDevToolsHook({ enabled: true }));

      expect(mockAddEventListener).toHaveBeenCalledWith('keydown', expect.any(Function));
    });

    it('should handle toggle shortcut (Ctrl+Shift+E)', () => {
      renderHook(() => useErrorBoundaryDevToolsHook({ enabled: true }));

      const keydownHandler = mockAddEventListener.mock.calls.find(
        call => call[0] === 'keydown'
      )?.[1];

      const mockEvent = {
        ctrlKey: true,
        shiftKey: true,
        key: 'E',
        preventDefault: vi.fn(),
      };

      act(() => {
        keydownHandler(mockEvent);
      });

      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(mockStore.updateConfig).toHaveBeenCalledWith({ enabled: false });
    });

    it('should handle clear shortcut (Ctrl+Shift+C)', () => {
      renderHook(() => useErrorBoundaryDevToolsHook({ enabled: true }));

      const keydownHandler = mockAddEventListener.mock.calls.find(
        call => call[0] === 'keydown'
      )?.[1];

      const mockEvent = {
        ctrlKey: true,
        shiftKey: true,
        key: 'C',
        preventDefault: vi.fn(),
      };

      act(() => {
        keydownHandler(mockEvent);
      });

      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(mockStore.clearErrors).toHaveBeenCalled();
    });

    it('should handle export shortcut (Ctrl+Shift+X)', () => {
      renderHook(() => useErrorBoundaryDevToolsHook({ enabled: true }));

      const keydownHandler = mockAddEventListener.mock.calls.find(
        call => call[0] === 'keydown'
      )?.[1];

      const mockEvent = {
        ctrlKey: true,
        shiftKey: true,
        key: 'X',
        preventDefault: vi.fn(),
      };

      act(() => {
        keydownHandler(mockEvent);
      });

      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(mockStore.exportState).toHaveBeenCalled();
    });

    it('should clean up keyboard listener on unmount', () => {
      const { unmount } = renderHook(() => useErrorBoundaryDevToolsHook({ enabled: true }));

      unmount();

      expect(mockRemoveEventListener).toHaveBeenCalledWith('keydown', expect.any(Function));
    });
  });

  describe('Manual Error Reporting', () => {
    it('should provide reportError function', () => {
      const { result } = renderHook(() => useErrorBoundaryDevToolsHook());

      expect(typeof result.current.reportError).toBe('function');
    });

    it('should report string errors', () => {
      const { result } = renderHook(() => useErrorBoundaryDevToolsHook());

      act(() => {
        result.current.reportError('Manual error message');
      });

      expect(mockStore.addError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Manual error message',
          stack: undefined,
        })
      );
      expect(mockStore.updateMetrics).toHaveBeenCalled();
    });

    it('should report Error objects', () => {
      const { result } = renderHook(() => useErrorBoundaryDevToolsHook());

      const error = new Error('Manual Error object');

      act(() => {
        result.current.reportError(error);
      });

      expect(mockStore.addError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Manual Error object',
          stack: error.stack,
        })
      );
    });

    it('should include metadata in manual error reports', () => {
      const { result } = renderHook(() => useErrorBoundaryDevToolsHook());

      const metadata = { component: 'TestComponent', action: 'click' };

      act(() => {
        result.current.reportError('Error with metadata', metadata);
      });

      expect(mockStore.addError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Error with metadata',
          metadata,
        })
      );
    });
  });

  describe('Manual Boundary Registration', () => {
    it('should provide registerBoundary function', () => {
      const { result } = renderHook(() => useErrorBoundaryDevToolsHook());

      expect(typeof result.current.registerBoundary).toBe('function');
    });

    it('should register boundary manually', () => {
      const { result } = renderHook(() => useErrorBoundaryDevToolsHook());

      const boundary = {
        id: 'manual-boundary',
        componentName: 'ManualBoundary',
        componentStack: 'App > ManualBoundary',
        hasError: false,
        errorCount: 0,
        children: [],
        coverage: 100,
        depth: 1,
        path: ['App', 'ManualBoundary'],
        isActive: true,
      };

      act(() => {
        result.current.registerBoundary(boundary);
      });

      expect(mockStore.registerErrorBoundary).toHaveBeenCalledWith(boundary);
    });
  });

  describe('Throttling', () => {
    it('should throttle updates based on throttleMs option', async () => {
      vi.useFakeTimers();
      
      const { result } = renderHook(() => 
        useErrorBoundaryDevToolsHook({ enabled: true, throttleMs: 100 })
      );

      const errorHandler = mockAddEventListener.mock.calls.find(
        call => call[0] === 'error'
      )?.[1];

      // Fire multiple errors quickly
      act(() => {
        errorHandler({ message: 'Error 1', error: { stack: 'stack1' } });
        errorHandler({ message: 'Error 2', error: { stack: 'stack2' } });
        errorHandler({ message: 'Error 3', error: { stack: 'stack3' } });
      });

      // Should only process the first error immediately
      expect(mockStore.addError).toHaveBeenCalledTimes(1);

      // Advance time beyond throttle period
      act(() => {
        vi.advanceTimersByTime(150);
      });

      // Fire another error
      act(() => {
        errorHandler({ message: 'Error 4', error: { stack: 'stack4' } });
      });

      // Should now process the new error
      expect(mockStore.addError).toHaveBeenCalledTimes(2);

      vi.useRealTimers();
    });
  });

  describe('Configuration Updates', () => {
    it('should update configuration through hook', () => {
      const { result } = renderHook(() => useErrorBoundaryDevToolsHook());

      act(() => {
        result.current.updateConfig({ theme: 'dark' });
      });

      expect(mockStore.updateConfig).toHaveBeenCalledWith({ theme: 'dark' });
    });
  });

  describe('State Access', () => {
    it('should provide access to store state', () => {
      const mockErrors = [{ id: 'test', message: 'test error' }];
      const mockBoundaries = new Map([['test', { id: 'test', componentName: 'Test' }]]);
      
      mockStore.errors = mockErrors;
      mockStore.errorBoundaries = mockBoundaries;

      const { result } = renderHook(() => useErrorBoundaryDevToolsHook());

      expect(result.current.errors).toBe(mockErrors);
      expect(result.current.errorBoundaries).toBe(mockBoundaries);
    });
  });

  describe('Fiber Tree Operations', () => {
    it('should provide fiberRoot reference', () => {
      const { result } = renderHook(() => useErrorBoundaryDevToolsHook());

      expect(result.current.fiberRoot).toBeNull(); // Initial state
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed error events gracefully', () => {
      renderHook(() => useErrorBoundaryDevToolsHook({ enabled: true }));

      const errorHandler = mockAddEventListener.mock.calls.find(
        call => call[0] === 'error'
      )?.[1];

      // Malformed error event
      act(() => {
        errorHandler({});
      });

      // Should not throw and should still attempt to add error
      expect(mockStore.addError).toHaveBeenCalled();
    });

    it('should handle missing DevTools hook gracefully', () => {
      delete (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__;

      expect(() => {
        renderHook(() => useErrorBoundaryDevToolsHook({ 
          enabled: true, 
          trackComponentTree: true 
        }));
      }).not.toThrow();
    });
  });
});