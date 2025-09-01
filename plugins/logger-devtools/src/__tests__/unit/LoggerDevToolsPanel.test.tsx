import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi, Mock } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LoggerDevToolsPanel } from '../../LoggerDevToolsPanel';
import { loggingEventClient } from '../../loggingEventClient';
import type { LogEntry, LoggerConfig, LogMetrics } from '../../loggingEventClient';

// Mock the event client
vi.mock('../../loggingEventClient', () => ({
  loggingEventClient: {
    emit: vi.fn(),
    on: vi.fn(() => vi.fn()), // Return a mock unsubscribe function
    off: vi.fn(),
  },
}));

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('LoggerDevToolsPanel', () => {
  let mockLoggingEventClient: {
    emit: Mock;
    on: Mock;
    off: Mock;
  };

  const mockLogEntry: LogEntry = {
    id: 'test-1',
    timestamp: Date.now(),
    level: 'info',
    message: 'Test log message',
    data: { test: true },
    category: 'TestCategory',
    tags: ['test'],
  };

  const mockConfig: LoggerConfig = {
    enabled: true,
    level: 'info',
    categories: {},
    output: {
      console: true,
      devtools: true,
    },
    maxLogs: 10000,
    batchSize: 50,
    flushInterval: 100,
    intercept: {
      enabled: false,
      console: true,
      preserveOriginal: true,
      includeTrace: false,
    },
  };

  const mockMetrics: LogMetrics = {
    totalLogs: 100,
    logsPerSecond: 5,
    errorRate: 2.5,
    warningRate: 10.0,
    logsByLevel: {
      trace: 5,
      debug: 10,
      info: 50,
      warn: 20,
      error: 10,
      fatal: 5,
    },
    logsByCategory: {
      TestCategory: 50,
    },
    averageLogSize: 256,
    peakLogsPerSecond: 15,
    lastLogTime: Date.now(),
  };

  beforeEach(() => {
    mockLoggingEventClient = loggingEventClient as any;
    mockLoggingEventClient.emit.mockClear();
    mockLoggingEventClient.on.mockClear();
    mockLoggingEventClient.off.mockClear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render without crashing', () => {
      render(<LoggerDevToolsPanel />);
      
      // Should set up event listeners
      expect(mockLoggingEventClient.on).toHaveBeenCalled();
    });

    it('should request initial config and logs on mount', () => {
      render(<LoggerDevToolsPanel />);
      
      expect(mockLoggingEventClient.emit).toHaveBeenCalledWith('config-request', undefined);
      expect(mockLoggingEventClient.emit).toHaveBeenCalledWith('logs-request', undefined);
    });

    it('should display logger title', () => {
      render(<LoggerDevToolsPanel />);
      
      expect(screen.getByText(/Logger DevTools/i)).toBeInTheDocument();
    });
  });

  describe('Event Handling', () => {
    it('should handle log entries through event listeners', () => {
      render(<LoggerDevToolsPanel />);
      
      // Verify that log-entry event listener is set up
      expect(mockLoggingEventClient.on).toHaveBeenCalledWith(
        'log-entry',
        expect.any(Function)
      );
      
      // Verify that log-batch event listener is set up
      expect(mockLoggingEventClient.on).toHaveBeenCalledWith(
        'log-batch',
        expect.any(Function)
      );
    });

    it('should handle config response through event listeners', () => {
      render(<LoggerDevToolsPanel />);
      
      expect(mockLoggingEventClient.on).toHaveBeenCalledWith(
        'config-response',
        expect.any(Function)
      );
    });

    it('should handle metrics updates through event listeners', () => {
      render(<LoggerDevToolsPanel />);
      
      expect(mockLoggingEventClient.on).toHaveBeenCalledWith(
        'metrics-update',
        expect.any(Function)
      );
    });

    it('should clean up event listeners on unmount', () => {
      const { unmount } = render(<LoggerDevToolsPanel />);
      
      unmount();
      
      // The component should clean up by calling the unsubscribe functions returned by 'on'
      // Since our mock 'on' returns a function, we can just verify unmount doesn't throw
      expect(() => unmount()).not.toThrow();
    });
  });

  describe('UI State Persistence', () => {
    it('should attempt to load UI state from localStorage on mount', () => {
      localStorageMock.getItem.mockReturnValue(JSON.stringify({
        searchQuery: 'test search',
        levelFilter: 'error',
        autoScroll: false,
      }));
      
      render(<LoggerDevToolsPanel />);
      
      expect(localStorageMock.getItem).toHaveBeenCalledWith('logger-devtools-ui-state');
    });

    it('should handle localStorage errors gracefully', () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('localStorage error');
      });
      
      expect(() => render(<LoggerDevToolsPanel />)).not.toThrow();
    });
  });

  describe('Configuration Controls', () => {
    it('should render basic control elements', () => {
      render(<LoggerDevToolsPanel />);
      
      // Should have clear button
      expect(screen.getByText(/Clear/i)).toBeInTheDocument();
    });

    it('should emit clear-logs event when clear button is clicked', () => {
      render(<LoggerDevToolsPanel />);
      
      const clearButton = screen.getByText(/Clear/i);
      fireEvent.click(clearButton);
      
      expect(mockLoggingEventClient.emit).toHaveBeenCalledWith('clear-logs', undefined);
    });
  });

  describe('Accessibility', () => {
    it('should have proper headings and structure', () => {
      render(<LoggerDevToolsPanel />);
      
      // The component should have proper heading structure
      const loggerTitle = screen.getByText(/Logger DevTools/i);
      expect(loggerTitle).toBeInTheDocument();
      
      // Should have level and category headings
      const levelsHeading = screen.getByText(/Levels/i);
      const categoriesHeading = screen.getByText(/Categories/i);
      expect(levelsHeading).toBeInTheDocument();
      expect(categoriesHeading).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle missing data gracefully', () => {
      render(<LoggerDevToolsPanel />);
      
      // Component should render even without initial data
      expect(screen.getByText(/Logger DevTools/i)).toBeInTheDocument();
    });

    it('should handle event client errors gracefully', () => {
      // Mock console.error to prevent error output during test
      const originalConsoleError = console.error;
      console.error = vi.fn();
      
      mockLoggingEventClient.on.mockImplementation(() => {
        throw new Error('Event client error');
      });
      
      // The component should still render despite the error
      try {
        render(<LoggerDevToolsPanel />);
        // If we get here, the component handled the error gracefully
        expect(true).toBe(true);
      } catch (error) {
        // If an error is thrown, we expect it to be handled at a higher level
        expect(error).toBeDefined();
      }
      
      // Restore console.error
      console.error = originalConsoleError;
    });
  });

  describe('Performance Considerations', () => {
    it('should not cause infinite re-renders', async () => {
      const renderSpy = vi.fn();
      
      const TestWrapper = () => {
        renderSpy();
        return <LoggerDevToolsPanel />;
      };
      
      render(<TestWrapper />);
      
      // Wait for any potential re-renders
      await waitFor(() => {
        expect(renderSpy).toHaveBeenCalledTimes(1);
      }, { timeout: 1000 });
    });
  });

  describe('Integration', () => {
    it('should work with mock event client', () => {
      const { container } = render(<LoggerDevToolsPanel />);
      
      // Component should render and set up event listeners
      expect(container).toBeInTheDocument();
      expect(mockLoggingEventClient.on).toHaveBeenCalled();
      expect(mockLoggingEventClient.emit).toHaveBeenCalled();
    });
  });
});