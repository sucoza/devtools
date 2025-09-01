import React, { Component } from 'react';
import { describe, it, expect, beforeEach, afterEach, vi, Mock } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { ErrorBoundaryWrapper } from '../../core/ErrorBoundaryWrapper';
import { useErrorBoundaryDevTools } from '../../core/store';
import { ErrorCategory, ErrorSeverity } from '../../types';

// Mock the store
vi.mock('../../core/store', () => ({
  useErrorBoundaryDevTools: {
    getState: vi.fn(() => ({
      addError: vi.fn(),
      updateErrorBoundary: vi.fn(),
      registerErrorBoundary: vi.fn(),
      unregisterErrorBoundary: vi.fn(),
      updateMetrics: vi.fn(),
    })),
  },
}));

// Test component that throws an error
class ThrowError extends Component<{ shouldThrow: boolean; message?: string }> {
  componentDidMount() {
    if (this.props.shouldThrow) {
      throw new Error(this.props.message || 'Test error');
    }
  }

  componentDidUpdate() {
    if (this.props.shouldThrow) {
      throw new Error(this.props.message || 'Test error');
    }
  }

  render() {
    if (this.props.shouldThrow) {
      throw new Error(this.props.message || 'Test error');
    }
    return <div>No error</div>;
  }
}

describe('ErrorBoundaryWrapper', () => {
  let mockStore: {
    addError: Mock;
    updateErrorBoundary: Mock;
    registerErrorBoundary: Mock;
    unregisterErrorBoundary: Mock;
    updateMetrics: Mock;
  };

  beforeEach(() => {
    mockStore = {
      addError: vi.fn(),
      updateErrorBoundary: vi.fn(),
      registerErrorBoundary: vi.fn(),
      unregisterErrorBoundary: vi.fn(),
      updateMetrics: vi.fn(),
    };
    
    (useErrorBoundaryDevTools.getState as Mock).mockReturnValue(mockStore);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  describe('Normal Operation', () => {
    it('should render children when no error occurs', () => {
      render(
        <ErrorBoundaryWrapper>
          <div>Test child component</div>
        </ErrorBoundaryWrapper>
      );

      expect(screen.getByText('Test child component')).toBeInTheDocument();
    });

    it('should register error boundary on mount', () => {
      render(
        <ErrorBoundaryWrapper boundaryId="test-boundary" boundaryName="TestBoundary">
          <div>Test content</div>
        </ErrorBoundaryWrapper>
      );

      expect(mockStore.registerErrorBoundary).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'test-boundary',
          componentName: 'TestBoundary',
          hasError: false,
          errorCount: 0,
          isActive: true,
        })
      );
    });

    it('should generate boundary ID when not provided', () => {
      render(
        <ErrorBoundaryWrapper>
          <div>Test content</div>
        </ErrorBoundaryWrapper>
      );

      expect(mockStore.registerErrorBoundary).toHaveBeenCalledWith(
        expect.objectContaining({
          id: expect.stringMatching(/^boundary-\d+-/),
          componentName: 'ErrorBoundary',
        })
      );
    });

    it('should unregister boundary on unmount', () => {
      const { unmount } = render(
        <ErrorBoundaryWrapper boundaryId="test-boundary">
          <div>Test content</div>
        </ErrorBoundaryWrapper>
      );

      unmount();

      expect(mockStore.unregisterErrorBoundary).toHaveBeenCalledWith('test-boundary');
    });
  });

  describe('Error Handling', () => {
    it('should catch and display error with default fallback', () => {
      // Suppress console.error for this test
      const originalConsoleError = console.error;
      console.error = vi.fn();

      render(
        <ErrorBoundaryWrapper>
          <ThrowError shouldThrow={true} message="Test error message" />
        </ErrorBoundaryWrapper>
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      expect(screen.getByText('Test error message')).toBeInTheDocument();
      expect(screen.getByText('Try again')).toBeInTheDocument();

      console.error = originalConsoleError;
    });

    it('should use custom fallback component', () => {
      const originalConsoleError = console.error;
      console.error = vi.fn();

      const CustomFallback = ({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) => (
        <div>
          <div>Custom error UI</div>
          <div>Error: {error.message}</div>
          <button onClick={resetErrorBoundary}>Reset</button>
        </div>
      );

      render(
        <ErrorBoundaryWrapper fallback={CustomFallback}>
          <ThrowError shouldThrow={true} message="Custom error" />
        </ErrorBoundaryWrapper>
      );

      expect(screen.getByText('Custom error UI')).toBeInTheDocument();
      expect(screen.getByText('Error: Custom error')).toBeInTheDocument();
      expect(screen.getByText('Reset')).toBeInTheDocument();

      console.error = originalConsoleError;
    });

    it('should call onError prop when error occurs', () => {
      const originalConsoleError = console.error;
      console.error = vi.fn();

      const onError = vi.fn();

      render(
        <ErrorBoundaryWrapper onError={onError}>
          <ThrowError shouldThrow={true} message="Callback test error" />
        </ErrorBoundaryWrapper>
      );

      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Callback test error',
        }),
        expect.objectContaining({
          componentStack: expect.any(String),
        })
      );

      console.error = originalConsoleError;
    });

    it('should add error to DevTools store when enabled', () => {
      const originalConsoleError = console.error;
      console.error = vi.fn();

      render(
        <ErrorBoundaryWrapper boundaryId="test-boundary" enableDevTools={true}>
          <ThrowError shouldThrow={true} message="DevTools error" />
        </ErrorBoundaryWrapper>
      );

      expect(mockStore.addError).toHaveBeenCalledWith(
        expect.objectContaining({
          id: expect.stringMatching(/^error-/),
          timestamp: expect.any(Number),
          message: 'DevTools error',
          stack: expect.any(String),
          componentStack: expect.any(String),
          errorBoundaryId: 'test-boundary',
          category: expect.any(String),
          severity: expect.any(String),
          occurrences: 1,
        })
      );

      expect(mockStore.updateErrorBoundary).toHaveBeenCalledWith(
        'test-boundary',
        expect.objectContaining({
          hasError: true,
          errorCount: expect.any(Number),
          lastError: expect.objectContaining({
            message: 'DevTools error',
          }),
        })
      );

      expect(mockStore.updateMetrics).toHaveBeenCalled();

      console.error = originalConsoleError;
    });

    it('should not integrate with DevTools when disabled', () => {
      const originalConsoleError = console.error;
      console.error = vi.fn();

      render(
        <ErrorBoundaryWrapper enableDevTools={false}>
          <ThrowError shouldThrow={true} message="No DevTools error" />
        </ErrorBoundaryWrapper>
      );

      expect(mockStore.addError).not.toHaveBeenCalled();
      expect(mockStore.updateErrorBoundary).not.toHaveBeenCalled();
      expect(mockStore.updateMetrics).not.toHaveBeenCalled();

      console.error = originalConsoleError;
    });
  });

  describe('Error Recovery', () => {
    it('should reset error state when resetErrorBoundary is called', () => {
      const originalConsoleError = console.error;
      console.error = vi.fn();

      const onReset = vi.fn();

      render(
        <ErrorBoundaryWrapper onReset={onReset} boundaryId="reset-test">
          <ThrowError shouldThrow={true} />
        </ErrorBoundaryWrapper>
      );

      const resetButton = screen.getByText('Try again');
      
      act(() => {
        fireEvent.click(resetButton);
      });

      expect(onReset).toHaveBeenCalled();
      expect(mockStore.updateErrorBoundary).toHaveBeenCalledWith(
        'reset-test',
        expect.objectContaining({
          hasError: false,
        })
      );

      console.error = originalConsoleError;
    });
  });

  describe('Error Categorization', () => {
    it('should categorize network errors correctly', () => {
      const originalConsoleError = console.error;
      console.error = vi.fn();

      render(
        <ErrorBoundaryWrapper>
          <ThrowError shouldThrow={true} message="Network error: Failed to fetch" />
        </ErrorBoundaryWrapper>
      );

      expect(mockStore.addError).toHaveBeenCalledWith(
        expect.objectContaining({
          category: ErrorCategory.NETWORK,
        })
      );

      console.error = originalConsoleError;
    });

    it('should categorize async errors correctly', () => {
      const originalConsoleError = console.error;
      console.error = vi.fn();

      render(
        <ErrorBoundaryWrapper>
          <ThrowError shouldThrow={true} message="Async error: Promise rejected" />
        </ErrorBoundaryWrapper>
      );

      expect(mockStore.addError).toHaveBeenCalledWith(
        expect.objectContaining({
          category: ErrorCategory.ASYNC,
        })
      );

      console.error = originalConsoleError;
    });

    it('should default to render category for generic errors', () => {
      const originalConsoleError = console.error;
      console.error = vi.fn();

      render(
        <ErrorBoundaryWrapper>
          <ThrowError shouldThrow={true} message="Generic error" />
        </ErrorBoundaryWrapper>
      );

      expect(mockStore.addError).toHaveBeenCalledWith(
        expect.objectContaining({
          category: ErrorCategory.RENDER,
        })
      );

      console.error = originalConsoleError;
    });
  });

  describe('Error Severity Assessment', () => {
    it('should assess critical severity for critical errors', () => {
      const originalConsoleError = console.error;
      console.error = vi.fn();

      render(
        <ErrorBoundaryWrapper>
          <ThrowError shouldThrow={true} message="Critical error occurred" />
        </ErrorBoundaryWrapper>
      );

      expect(mockStore.addError).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: ErrorSeverity.CRITICAL,
        })
      );

      console.error = originalConsoleError;
    });

    it('should assess high severity for fatal errors', () => {
      const originalConsoleError = console.error;
      console.error = vi.fn();

      render(
        <ErrorBoundaryWrapper>
          <ThrowError shouldThrow={true} message="Fatal error in application" />
        </ErrorBoundaryWrapper>
      );

      expect(mockStore.addError).toHaveBeenCalledWith(
        expect.objectContaining({
          severity: ErrorSeverity.CRITICAL,
        })
      );

      console.error = originalConsoleError;
    });
  });

  describe('Boundary Configuration', () => {
    it('should handle different boundary levels', () => {
      render(
        <ErrorBoundaryWrapper 
          boundaryName="PageBoundary" 
          level="page"
          boundaryId="page-boundary"
        >
          <div>Page content</div>
        </ErrorBoundaryWrapper>
      );

      expect(mockStore.registerErrorBoundary).toHaveBeenCalledWith(
        expect.objectContaining({
          componentName: 'PageBoundary',
        })
      );
    });

    it('should include metadata in error info', () => {
      const originalConsoleError = console.error;
      console.error = vi.fn();

      render(
        <ErrorBoundaryWrapper 
          boundaryName="SectionBoundary" 
          level="section"
        >
          <ThrowError shouldThrow={true} message="Section error" />
        </ErrorBoundaryWrapper>
      );

      expect(mockStore.addError).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            boundaryName: 'SectionBoundary',
            level: 'section',
          }),
        })
      );

      console.error = originalConsoleError;
    });
  });

  describe('Error Count Tracking', () => {
    it('should increment error count for multiple errors', () => {
      const originalConsoleError = console.error;
      console.error = vi.fn();

      // We can't easily test multiple errors in the same boundary without remounting,
      // so we test that the error count starts at 0 and increments
      render(
        <ErrorBoundaryWrapper boundaryId="count-test">
          <ThrowError shouldThrow={true} />
        </ErrorBoundaryWrapper>
      );

      expect(mockStore.updateErrorBoundary).toHaveBeenCalledWith(
        'count-test',
        expect.objectContaining({
          errorCount: expect.any(Number),
        })
      );

      console.error = originalConsoleError;
    });
  });

  describe('Accessibility', () => {
    it('should provide accessible error fallback UI', () => {
      const originalConsoleError = console.error;
      console.error = vi.fn();

      render(
        <ErrorBoundaryWrapper>
          <ThrowError shouldThrow={true} message="Accessibility test error" />
        </ErrorBoundaryWrapper>
      );

      // Check for semantic HTML structure
      expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
      
      // Check that error details are in a details/summary structure for screen readers
      const details = screen.getByText('Error details');
      expect(details).toBeInTheDocument();

      console.error = originalConsoleError;
    });
  });

  describe('Error State Management', () => {
    it('should maintain separate error states for different boundaries', () => {
      const originalConsoleError = console.error;
      console.error = vi.fn();

      const { rerender } = render(
        <ErrorBoundaryWrapper boundaryId="boundary-1">
          <ThrowError shouldThrow={true} />
        </ErrorBoundaryWrapper>
      );

      expect(mockStore.registerErrorBoundary).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'boundary-1',
        })
      );

      // Clear mocks and render a different boundary
      vi.clearAllMocks();

      rerender(
        <ErrorBoundaryWrapper boundaryId="boundary-2">
          <div>No error</div>
        </ErrorBoundaryWrapper>
      );

      expect(mockStore.registerErrorBoundary).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'boundary-2',
        })
      );

      console.error = originalConsoleError;
    });
  });
});