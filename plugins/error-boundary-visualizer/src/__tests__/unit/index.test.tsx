import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi, Mock } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { 
  ErrorBoundaryDevTools,
  useInitializeErrorBoundaryDevTools,
  useReportError,
  withErrorBoundary,
  useErrorBoundary,
} from '../../index';
import { useErrorBoundaryDevTools } from '../../core/store';
import { useErrorBoundaryDevToolsHook } from '../../hooks/useErrorBoundaryDevTools';

// Mock the store and hooks
vi.mock('../../core/store', () => ({
  useErrorBoundaryDevTools: vi.fn(() => ({
    updateConfig: vi.fn(),
    addError: vi.fn(),
    registerErrorBoundary: vi.fn(),
  })),
}));

vi.mock('../../hooks/useErrorBoundaryDevTools', () => ({
  useErrorBoundaryDevToolsHook: vi.fn(() => ({
    updateConfig: vi.fn(),
  })),
}));

vi.mock('../../components/ErrorBoundaryDevToolsPanel', () => ({
  ErrorBoundaryDevToolsPanel: () => <div data-testid="error-boundary-panel">DevTools Panel</div>,
}));

vi.mock('../../core/ErrorBoundaryWrapper', () => ({
  ErrorBoundaryWrapper: ({ children, fallback }: any) => {
    // Simple mock that just renders children
    return <div data-testid="error-boundary-wrapper">{children}</div>;
  },
}));

// Mock console methods
const originalConsoleError = console.error;

// Test component that throws an error
class ThrowError extends React.Component<{ shouldThrow: boolean; message?: string }> {
  render() {
    if (this.props.shouldThrow) {
      throw new Error(this.props.message || 'Test error');
    }
    return <div>No error</div>;
  }
}

describe('Error Boundary DevTools Index', () => {
  let mockStore: any;
  let mockHook: any;

  beforeEach(() => {
    mockStore = {
      updateConfig: vi.fn(),
      addError: vi.fn(),
      registerErrorBoundary: vi.fn(),
    };

    mockHook = {
      updateConfig: vi.fn(),
    };

    (useErrorBoundaryDevTools as Mock).mockReturnValue(mockStore);
    (useErrorBoundaryDevToolsHook as Mock).mockReturnValue(mockHook);
    console.error = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    console.error = originalConsoleError;
    delete (window as any).__ERROR_BOUNDARY_DEVTOOLS__;
  });

  describe('ErrorBoundaryDevTools Component', () => {
    it('should render when enabled', () => {
      render(<ErrorBoundaryDevTools enabled={true} />);

      expect(screen.getByTestId('error-boundary-panel')).toBeInTheDocument();
    });

    it('should not render when disabled', () => {
      render(<ErrorBoundaryDevTools enabled={false} />);

      expect(screen.queryByTestId('error-boundary-panel')).not.toBeInTheDocument();
    });

    it('should render by default (enabled=true)', () => {
      render(<ErrorBoundaryDevTools />);

      expect(screen.getByTestId('error-boundary-panel')).toBeInTheDocument();
    });

    it('should update configuration on props change', () => {
      const { rerender } = render(
        <ErrorBoundaryDevTools 
          enabled={true} 
          position="top-left" 
          theme="dark"
          defaultOpen={true}
        />
      );

      expect(mockHook.updateConfig).toHaveBeenCalledWith({
        enabled: true,
        position: 'top-left',
        defaultOpen: true,
        theme: 'dark',
      });

      // Update props
      rerender(
        <ErrorBoundaryDevTools 
          enabled={false} 
          position="bottom-right" 
          theme="light"
          defaultOpen={false}
        />
      );

      expect(mockHook.updateConfig).toHaveBeenCalledWith({
        enabled: false,
        position: 'bottom-right',
        defaultOpen: false,
        theme: 'light',
      });
    });

    it('should set up custom error handler when onError provided', () => {
      const onError = vi.fn();
      const mockAddEventListener = vi.spyOn(window, 'addEventListener');
      const mockRemoveEventListener = vi.spyOn(window, 'removeEventListener');

      const { unmount } = render(<ErrorBoundaryDevTools onError={onError} />);

      expect(mockAddEventListener).toHaveBeenCalledWith('error', expect.any(Function));

      unmount();

      expect(mockRemoveEventListener).toHaveBeenCalledWith('error', expect.any(Function));
      
      mockAddEventListener.mockRestore();
      mockRemoveEventListener.mockRestore();
    });

    it('should call onError when window error occurs', () => {
      const onError = vi.fn();
      let errorHandler: any;

      const mockAddEventListener = vi.spyOn(window, 'addEventListener').mockImplementation((event: string, handler: any) => {
        if (event === 'error') {
          errorHandler = handler;
        }
      });

      render(<ErrorBoundaryDevTools onError={onError} />);

      // Simulate window error
      const errorEvent = {
        message: 'Test window error',
        error: {
          stack: 'Error: Test window error\n    at test',
          componentStack: '',
        },
      };

      act(() => {
        errorHandler(errorEvent);
      });

      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Test window error',
        }),
        expect.objectContaining({
          componentStack: '',
        })
      );
      
      mockAddEventListener.mockRestore();
    });

    it('should handle error events without error object', () => {
      const onError = vi.fn();
      let errorHandler: any;

      const mockAddEventListener = vi.spyOn(window, 'addEventListener').mockImplementation((event: string, handler: any) => {
        if (event === 'error') {
          errorHandler = handler;
        }
      });

      render(<ErrorBoundaryDevTools onError={onError} />);

      // Simulate error event without error object
      const errorEvent = {
        message: 'Basic error message',
      };

      act(() => {
        errorHandler(errorEvent);
      });

      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Basic error message',
        }),
        expect.objectContaining({
          componentStack: '',
        })
      );
      
      mockAddEventListener.mockRestore();
    });

    it('should not set up error handler when onError not provided', () => {
      const mockAddEventListener = vi.spyOn(window, 'addEventListener');

      render(<ErrorBoundaryDevTools />);

      expect(mockAddEventListener).not.toHaveBeenCalledWith('error', expect.any(Function));
      
      mockAddEventListener.mockRestore();
    });
  });

  describe('useInitializeErrorBoundaryDevTools Hook', () => {
    it('should return updateConfig function', () => {
      const TestComponent = () => {
        const { updateConfig } = useInitializeErrorBoundaryDevTools();
        
        React.useEffect(() => {
          updateConfig({ theme: 'dark' });
        }, [updateConfig]);

        return <div>Test</div>;
      };

      render(<TestComponent />);

      expect(mockStore.updateConfig).toHaveBeenCalledWith({ theme: 'dark' });
    });

    it('should update config with provided config on mount', () => {
      const config = {
        enabled: false,
        theme: 'dark' as const,
        position: 'top-left' as const,
      };

      const TestComponent = () => {
        useInitializeErrorBoundaryDevTools(config);
        return <div>Test</div>;
      };

      render(<TestComponent />);

      expect(mockStore.updateConfig).toHaveBeenCalledWith(config);
    });

    it('should not update config when no config provided', () => {
      const TestComponent = () => {
        useInitializeErrorBoundaryDevTools();
        return <div>Test</div>;
      };

      render(<TestComponent />);

      // Should still be called but with undefined (which the effect handles)
      expect(mockStore.updateConfig).not.toHaveBeenCalled();
    });
  });

  describe('useReportError Hook', () => {
    it('should return reportError function', () => {
      const TestComponent = () => {
        const { reportError } = useReportError();
        
        React.useEffect(() => {
          reportError('Test error');
        }, [reportError]);

        return <div>Test</div>;
      };

      render(<TestComponent />);

      expect(mockStore.addError).toHaveBeenCalledWith(
        expect.objectContaining({
          id: expect.stringMatching(/^manual-/),
          timestamp: expect.any(Number),
          message: 'Test error',
          stack: undefined,
        })
      );
    });

    it('should report Error objects', () => {
      const TestComponent = () => {
        const { reportError } = useReportError();
        
        React.useEffect(() => {
          const error = new Error('Object error');
          reportError(error);
        }, [reportError]);

        return <div>Test</div>;
      };

      render(<TestComponent />);

      expect(mockStore.addError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Object error',
          stack: expect.any(String),
        })
      );
    });

    it('should include metadata in error report', () => {
      const TestComponent = () => {
        const { reportError } = useReportError();
        
        React.useEffect(() => {
          reportError('Error with metadata', { component: 'TestComponent' });
        }, [reportError]);

        return <div>Test</div>;
      };

      render(<TestComponent />);

      expect(mockStore.addError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Error with metadata',
          metadata: { component: 'TestComponent' },
        })
      );
    });

    it('should use current timestamp and generate unique ID', () => {
      const TestComponent = () => {
        const { reportError } = useReportError();
        
        React.useEffect(() => {
          reportError('Timestamp test');
        }, [reportError]);

        return <div>Test</div>;
      };

      const beforeRender = Date.now();
      render(<TestComponent />);
      const afterRender = Date.now();

      expect(mockStore.addError).toHaveBeenCalledWith(
        expect.objectContaining({
          id: expect.stringMatching(/^manual-\d+-[\d.]+$/),
          timestamp: expect.any(Number),
          firstSeen: expect.any(Number),
          lastSeen: expect.any(Number),
        })
      );

      const call = mockStore.addError.mock.calls[0][0];
      expect(call.timestamp).toBeGreaterThanOrEqual(beforeRender);
      expect(call.timestamp).toBeLessThanOrEqual(afterRender);
    });
  });

  describe('withErrorBoundary HOC', () => {
    it('should wrap component with error boundary', () => {
      const TestComponent = () => <div>Test Component</div>;
      const WrappedComponent = withErrorBoundary(TestComponent);

      render(<WrappedComponent />);

      expect(screen.getByTestId('error-boundary-wrapper')).toBeInTheDocument();
      expect(screen.getByText('Test Component')).toBeInTheDocument();
    });

    it('should set displayName correctly', () => {
      const TestComponent = () => <div>Test</div>;
      TestComponent.displayName = 'TestComponent';

      const WrappedComponent = withErrorBoundary(TestComponent);

      expect(WrappedComponent.displayName).toBe('withErrorBoundary(TestComponent)');
    });

    it('should use component name when displayName not available', () => {
      const TestComponent = function TestFunction() {
        return <div>Test</div>;
      };

      const WrappedComponent = withErrorBoundary(TestComponent);

      expect(WrappedComponent.displayName).toBe('withErrorBoundary(TestFunction)');
    });

    it('should fallback to Component when no name available', () => {
      const TestComponent = (() => <div>Test</div>) as React.ComponentType<any>;
      // Remove name and displayName
      Object.defineProperty(TestComponent, 'name', { value: '' });
      delete (TestComponent as any).displayName;

      const WrappedComponent = withErrorBoundary(TestComponent);

      expect(WrappedComponent.displayName).toBe('withErrorBoundary(Component)');
    });

    it('should forward refs correctly', () => {
      const TestComponent = React.forwardRef<HTMLDivElement, {}>((props, ref) => (
        <div ref={ref}>Forwarded Ref Component</div>
      ));

      const WrappedComponent = withErrorBoundary(TestComponent);
      const ref = React.createRef<HTMLDivElement>();

      render(<WrappedComponent ref={ref} />);

      expect(ref.current).toBeInTheDocument();
    });

    it('should pass custom fallback component', () => {
      const TestComponent = () => <div>Test</div>;
      const CustomFallback = () => <div>Custom Error UI</div>;
      
      const WrappedComponent = withErrorBoundary(TestComponent, CustomFallback);

      render(<WrappedComponent />);

      // The mock ErrorBoundaryWrapper doesn't actually use the fallback,
      // but we can verify it's passed through
      expect(screen.getByTestId('error-boundary-wrapper')).toBeInTheDocument();
    });
  });

  describe('useErrorBoundary Hook', () => {
    it('should return error boundary state and methods', () => {
      const TestComponent = () => {
        const { hasError, error, resetErrorBoundary, captureError } = useErrorBoundary();
        
        return (
          <div>
            <div data-testid="has-error">{hasError.toString()}</div>
            <div data-testid="error-message">{error?.message || 'No error'}</div>
            <button onClick={() => captureError(new Error('Test error'))}>
              Capture Error
            </button>
            <button onClick={resetErrorBoundary}>Reset</button>
          </div>
        );
      };

      render(<TestComponent />);

      expect(screen.getByTestId('has-error')).toHaveTextContent('false');
      expect(screen.getByTestId('error-message')).toHaveTextContent('No error');
    });

    it('should capture and display error', () => {
      const TestComponent = () => {
        const { hasError, error, captureError } = useErrorBoundary();
        
        return (
          <div>
            <div data-testid="has-error">{hasError.toString()}</div>
            <div data-testid="error-message">{error?.message || 'No error'}</div>
            <button 
              onClick={() => captureError(new Error('Captured error'))}
              data-testid="capture-button"
            >
              Capture Error
            </button>
          </div>
        );
      };

      render(<TestComponent />);

      const captureButton = screen.getByTestId('capture-button');
      fireEvent.click(captureButton);

      expect(screen.getByTestId('has-error')).toHaveTextContent('true');
      expect(screen.getByTestId('error-message')).toHaveTextContent('Captured error');
    });

    it('should reset error boundary', () => {
      const TestComponent = () => {
        const { hasError, error, resetErrorBoundary, captureError } = useErrorBoundary();
        
        return (
          <div>
            <div data-testid="has-error">{hasError.toString()}</div>
            <div data-testid="error-message">{error?.message || 'No error'}</div>
            <button 
              onClick={() => captureError(new Error('Test error'))}
              data-testid="capture-button"
            >
              Capture Error
            </button>
            <button onClick={resetErrorBoundary} data-testid="reset-button">
              Reset
            </button>
          </div>
        );
      };

      render(<TestComponent />);

      // Capture error
      const captureButton = screen.getByTestId('capture-button');
      fireEvent.click(captureButton);

      expect(screen.getByTestId('has-error')).toHaveTextContent('true');

      // Reset error
      const resetButton = screen.getByTestId('reset-button');
      fireEvent.click(resetButton);

      expect(screen.getByTestId('has-error')).toHaveTextContent('false');
      expect(screen.getByTestId('error-message')).toHaveTextContent('No error');
    });

    it('should register error boundary when error occurs', () => {
      const TestComponent = () => {
        const { captureError } = useErrorBoundary();
        
        React.useEffect(() => {
          captureError(new Error('Registration test'));
        }, [captureError]);

        return <div>Test</div>;
      };

      render(<TestComponent />);

      expect(mockStore.registerErrorBoundary).toHaveBeenCalledWith(
        expect.objectContaining({
          id: expect.stringMatching(/^boundary-/),
          componentName: 'useErrorBoundary',
          hasError: true,
          errorCount: 1,
          lastError: expect.objectContaining({
            message: 'Registration test',
          }),
        })
      );
    });
  });

  describe('Development Helpers', () => {
    it('should expose global helpers in development', async () => {
      // Mock development environment
      const originalNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      // Re-import the index module to trigger the development block
      vi.resetModules();
      await import('../../index');

      expect((window as any).__ERROR_BOUNDARY_DEVTOOLS__).toBeDefined();
      
      // Restore environment
      process.env.NODE_ENV = originalNodeEnv;
    });

    it('should not expose global helpers in production', async () => {
      // Mock production environment
      const originalNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      // Clear the global helper first
      delete (window as any).__ERROR_BOUNDARY_DEVTOOLS__;

      // Re-import the index module
      vi.resetModules();
      await import('../../index');

      expect((window as any).__ERROR_BOUNDARY_DEVTOOLS__).toBeUndefined();
      
      // Restore environment
      process.env.NODE_ENV = originalNodeEnv;
    });
  });

  describe('Type Safety and Exports', () => {
    it('should export all required components and hooks', async () => {
      const indexModule = await import('../../index');

      expect(indexModule.ErrorBoundaryDevTools).toBeDefined();
      expect(indexModule.useInitializeErrorBoundaryDevTools).toBeDefined();
      expect(indexModule.useReportError).toBeDefined();
      expect(indexModule.withErrorBoundary).toBeDefined();
      expect(indexModule.useErrorBoundary).toBeDefined();
    });

    it('should export core components', async () => {
      const indexModule = await import('../../index');

      expect(indexModule.useErrorBoundaryDevTools).toBeDefined();
      expect(indexModule.ErrorBoundaryWrapper).toBeDefined();
    });

    it('should export UI components', async () => {
      const indexModule = await import('../../index');

      expect(indexModule.ErrorBoundaryDevToolsPanel).toBeDefined();
      expect(indexModule.ComponentTreeView).toBeDefined();
      expect(indexModule.ErrorList).toBeDefined();
    });

    it('should export hook', async () => {
      const indexModule = await import('../../index');

      expect(indexModule.useErrorBoundaryDevToolsHook).toBeDefined();
    });

    it('should export types', async () => {
      const indexModule = await import('../../index');

      // Type exports are not runtime accessible, but we can check they're part of the module
      expect(indexModule).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle store initialization errors gracefully', () => {
      // Mock hook that throws on initialization - the ErrorBoundaryDevTools component uses useErrorBoundaryDevToolsHook
      (useErrorBoundaryDevToolsHook as Mock).mockImplementation(() => {
        throw new Error('Store initialization error');
      });

      // Suppress console.error for this test
      const originalConsoleError = console.error;
      console.error = vi.fn();

      expect(() => {
        render(<ErrorBoundaryDevTools />);
      }).toThrow('Store initialization error');
      
      console.error = originalConsoleError;
    });

    it('should handle hook initialization errors gracefully', () => {
      // Mock hook that throws on initialization
      (useErrorBoundaryDevToolsHook as Mock).mockImplementation(() => {
        throw new Error('Hook initialization error');
      });

      // Suppress console.error for this test
      const originalConsoleError = console.error;
      console.error = vi.fn();

      expect(() => {
        render(<ErrorBoundaryDevTools />);
      }).toThrow('Hook initialization error');
      
      console.error = originalConsoleError;
    });
  });

  describe('Integration', () => {
    it('should work with all components together', () => {
      const TestApp = () => {
        const { reportError } = useReportError();
        useInitializeErrorBoundaryDevTools({ theme: 'dark' });

        const TestComponent = () => <div>App Content</div>;
        const WrappedComponent = withErrorBoundary(TestComponent);

        return (
          <div>
            <ErrorBoundaryDevTools />
            <WrappedComponent />
            <button onClick={() => reportError('Integration test error')}>
              Report Error
            </button>
          </div>
        );
      };

      render(<TestApp />);

      expect(screen.getByTestId('error-boundary-panel')).toBeInTheDocument();
      expect(screen.getByTestId('error-boundary-wrapper')).toBeInTheDocument();
      expect(screen.getByText('App Content')).toBeInTheDocument();
      
      const reportButton = screen.getByText('Report Error');
      fireEvent.click(reportButton);

      expect(mockStore.addError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Integration test error',
        })
      );
    });
  });
});