import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi, Mock } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { ErrorBoundaryDevToolsPanel } from '../../components/ErrorBoundaryDevToolsPanel';
import { useErrorBoundaryDevTools } from '../../core/store';

// Setup matchMedia mock before any imports
const mockMatchMedia = vi.fn().mockImplementation((query: string) => ({
  matches: query === '(prefers-color-scheme: dark)',
  media: query,
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
}));

// Ensure matchMedia is globally available
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  configurable: true,
  value: mockMatchMedia,
});

// Mock the store
vi.mock('../../core/store', () => ({
  useErrorBoundaryDevTools: vi.fn(),
}));

// Mock child components that might not exist or might be complex
vi.mock('../../components/ComponentTreeView', () => ({
  ComponentTreeView: () => <div data-testid="component-tree-view">Component Tree View</div>,
}));

vi.mock('../../components/ErrorList', () => ({
  ErrorList: () => <div data-testid="error-list">Error List</div>,
}));

vi.mock('../../components/ErrorAnalytics', () => ({
  ErrorAnalytics: () => <div data-testid="error-analytics">Error Analytics</div>,
}));

vi.mock('../../components/ErrorSimulator', () => ({
  ErrorSimulator: () => <div data-testid="error-simulator">Error Simulator</div>,
}));

vi.mock('../../components/RecoveryStrategyEditor', () => ({
  RecoveryStrategyEditor: () => <div data-testid="recovery-strategy-editor">Recovery Strategy Editor</div>,
}));

// Mock window.matchMedia is now in setup file

describe('ErrorBoundaryDevToolsPanel', () => {
  let mockStore: {
    config: {
      enabled: boolean;
      theme: string;
    };
    updateConfig: Mock;
    errors: any[];
    errorBoundaries: Map<string, any>;
    isRecording: boolean;
  };

  beforeEach(() => {
    // Reset matchMedia mock
    mockMatchMedia.mockClear();
    
    mockStore = {
      config: {
        enabled: true,
        theme: 'auto',
      },
      updateConfig: vi.fn(),
      errors: [],
      errorBoundaries: new Map(),
      isRecording: false,
    };

    (useErrorBoundaryDevTools as Mock).mockReturnValue(mockStore);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Panel Visibility', () => {
    it('should render when enabled', () => {
      render(<ErrorBoundaryDevToolsPanel />);

      expect(screen.getByText('Error Boundary DevTools')).toBeInTheDocument();
    });

    it('should not render when disabled', () => {
      (useErrorBoundaryDevTools as Mock).mockReturnValue({
        ...mockStore,
        config: {
          ...mockStore.config,
          enabled: false,
        },
      });

      render(<ErrorBoundaryDevToolsPanel />);

      expect(screen.queryByText('Error Boundary DevTools')).not.toBeInTheDocument();
    });
  });

  describe('Theme Support', () => {
    it('should use light theme when theme is light', () => {
      (useErrorBoundaryDevTools as Mock).mockReturnValue({
        ...mockStore,
        config: {
          ...mockStore.config,
          theme: 'light',
        },
      });

      render(<ErrorBoundaryDevToolsPanel />);

      const panel = screen.getByText('Error Boundary DevTools').closest('div');
      expect(panel).toHaveStyle({ backgroundColor: '#ffffff' });
    });

    it('should use dark theme when theme is dark', () => {
      (useErrorBoundaryDevTools as Mock).mockReturnValue({
        ...mockStore,
        config: {
          ...mockStore.config,
          theme: 'dark',
        },
      });

      render(<ErrorBoundaryDevToolsPanel />);

      const panel = screen.getByText('Error Boundary DevTools').closest('div');
      expect(panel).toHaveStyle({ backgroundColor: '#1e1e1e' });
    });

    it('should auto-detect theme when theme is auto', () => {
      (useErrorBoundaryDevTools as Mock).mockReturnValue({
        ...mockStore,
        config: {
          ...mockStore.config,
          theme: 'auto',
        },
      });

      // Mock prefers dark theme
      (window.matchMedia as any).mockImplementation(query => ({
        matches: query === '(prefers-color-scheme: dark)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      render(<ErrorBoundaryDevToolsPanel />);

      const panel = screen.getByText('Error Boundary DevTools').closest('div');
      expect(panel).toHaveStyle({ backgroundColor: '#1e1e1e' });
    });
  });

  describe('Status Display', () => {
    it('should display error count', () => {
      mockStore.errors = [
        { id: '1', message: 'Error 1' },
        { id: '2', message: 'Error 2' },
      ];

      render(<ErrorBoundaryDevToolsPanel />);

      expect(screen.getByText('2 errors')).toBeInTheDocument();
    });

    it('should display boundary count', () => {
      mockStore.errorBoundaries.set('boundary1', { id: 'boundary1', name: 'Boundary 1' });
      mockStore.errorBoundaries.set('boundary2', { id: 'boundary2', name: 'Boundary 2' });

      render(<ErrorBoundaryDevToolsPanel />);

      expect(screen.getByText('2 boundaries')).toBeInTheDocument();
    });

    it('should show recording indicator when recording', () => {
      mockStore.isRecording = true;

      render(<ErrorBoundaryDevToolsPanel />);

      const recordingDot = screen.getByText('Error Boundary DevTools')
        .closest('div')
        ?.querySelector('[style*="backgroundColor: rgb(255, 68, 68)"]');
      
      expect(recordingDot).toBeInTheDocument();
    });

    it('should not show recording indicator when not recording', () => {
      mockStore.isRecording = false;

      render(<ErrorBoundaryDevToolsPanel />);

      const recordingDot = screen.getByText('Error Boundary DevTools')
        .closest('div')
        ?.querySelector('[style*="backgroundColor: rgb(102, 102, 102)"]');
      
      expect(recordingDot).toBeInTheDocument();
    });
  });

  describe('Panel Controls', () => {
    it('should minimize panel when minimize button is clicked', () => {
      render(<ErrorBoundaryDevToolsPanel />);

      const minimizeButton = screen.getByTitle('Minimize');
      fireEvent.click(minimizeButton);

      // When minimized, tabs should not be visible
      expect(screen.queryByText('Errors')).not.toBeInTheDocument();
      expect(screen.queryByText('Component Tree')).not.toBeInTheDocument();
    });

    it('should restore panel when restore button is clicked after minimize', () => {
      render(<ErrorBoundaryDevToolsPanel />);

      const minimizeButton = screen.getByTitle('Minimize');
      fireEvent.click(minimizeButton);

      const restoreButton = screen.getByTitle('Restore');
      fireEvent.click(restoreButton);

      // After restore, tabs should be visible again
      expect(screen.getByText('Errors')).toBeInTheDocument();
      expect(screen.getByText('Component Tree')).toBeInTheDocument();
    });

    it('should close panel when close button is clicked', () => {
      render(<ErrorBoundaryDevToolsPanel />);

      const closeButton = screen.getByTitle('Close');
      fireEvent.click(closeButton);

      expect(mockStore.updateConfig).toHaveBeenCalledWith({ enabled: false });
    });
  });

  describe('Tab Navigation', () => {
    it('should render all tabs', () => {
      render(<ErrorBoundaryDevToolsPanel />);

      expect(screen.getByText('Errors')).toBeInTheDocument();
      expect(screen.getByText('Component Tree')).toBeInTheDocument();
      expect(screen.getByText('Analytics')).toBeInTheDocument();
      expect(screen.getByText('Simulator')).toBeInTheDocument();
      expect(screen.getByText('Recovery')).toBeInTheDocument();
    });

    it('should show error list tab by default', () => {
      render(<ErrorBoundaryDevToolsPanel />);

      expect(screen.getByTestId('error-list')).toBeInTheDocument();
    });

    it('should switch to component tree tab when clicked', () => {
      render(<ErrorBoundaryDevToolsPanel />);

      const treeTab = screen.getByText('Component Tree');
      fireEvent.click(treeTab);

      expect(screen.getByTestId('component-tree-view')).toBeInTheDocument();
      expect(screen.queryByTestId('error-list')).not.toBeInTheDocument();
    });

    it('should switch to analytics tab when clicked', () => {
      render(<ErrorBoundaryDevToolsPanel />);

      const analyticsTab = screen.getByText('Analytics');
      fireEvent.click(analyticsTab);

      expect(screen.getByTestId('error-analytics')).toBeInTheDocument();
    });

    it('should switch to simulator tab when clicked', () => {
      render(<ErrorBoundaryDevToolsPanel />);

      const simulatorTab = screen.getByText('Simulator');
      fireEvent.click(simulatorTab);

      expect(screen.getByTestId('error-simulator')).toBeInTheDocument();
    });

    it('should switch to recovery tab when clicked', () => {
      render(<ErrorBoundaryDevToolsPanel />);

      const recoveryTab = screen.getByText('Recovery');
      fireEvent.click(recoveryTab);

      expect(screen.getByTestId('recovery-strategy-editor')).toBeInTheDocument();
    });

    it('should highlight active tab', () => {
      render(<ErrorBoundaryDevToolsPanel />);

      const errorsTab = screen.getByText('Errors');
      const treeTab = screen.getByText('Component Tree');

      // Errors tab should be active by default (has active styling)
      expect(errorsTab.closest('div')).toHaveStyle({ borderBottom: '2px solid #007acc' });

      // Tree tab should not be active
      expect(treeTab.closest('div')).toHaveStyle({ borderBottom: 'none' });

      // Click tree tab
      fireEvent.click(treeTab);

      // Now tree tab should be active
      expect(treeTab.closest('div')).toHaveStyle({ borderBottom: '2px solid #007acc' });
    });
  });

  describe('Panel Dragging', () => {
    it('should handle mouse down for dragging', () => {
      render(<ErrorBoundaryDevToolsPanel />);

      const header = screen.getByText('Error Boundary DevTools').closest('div');
      
      fireEvent.mouseDown(header!, { clientX: 100, clientY: 100 });

      // Panel should show dragging cursor
      expect(header).toHaveStyle({ cursor: 'grabbing' });
    });

    it('should not start dragging when clicking on tab content', () => {
      render(<ErrorBoundaryDevToolsPanel />);

      const tabContent = screen.getByTestId('error-list');
      const header = screen.getByText('Error Boundary DevTools').closest('div');
      
      fireEvent.mouseDown(tabContent, { clientX: 100, clientY: 100 });

      // Should still show grab cursor, not grabbing
      expect(header).toHaveStyle({ cursor: 'grab' });
    });

    it('should handle mouse move during drag', () => {
      render(<ErrorBoundaryDevToolsPanel />);

      const header = screen.getByText('Error Boundary DevTools').closest('div');
      
      // Start dragging
      fireEvent.mouseDown(header!, { clientX: 100, clientY: 100 });
      
      // Mock mouse move on document
      act(() => {
        const event = new MouseEvent('mousemove', { clientX: 150, clientY: 150 });
        document.dispatchEvent(event);
      });

      // Position should be updated
      const panel = header!.closest('div');
      expect(panel).toHaveStyle({ left: '70px', top: '70px' }); // 150 - 100 + 20 initial
    });

    it('should handle mouse up to stop dragging', () => {
      render(<ErrorBoundaryDevToolsPanel />);

      const header = screen.getByText('Error Boundary DevTools').closest('div');
      
      // Start dragging
      fireEvent.mouseDown(header!, { clientX: 100, clientY: 100 });
      
      // Stop dragging
      act(() => {
        const event = new MouseEvent('mouseup');
        document.dispatchEvent(event);
      });

      // Should show grab cursor again
      expect(header).toHaveStyle({ cursor: 'grab' });
    });
  });

  describe('Panel Resizing', () => {
    it('should handle resize mouse down', () => {
      render(<ErrorBoundaryDevToolsPanel />);

      const resizeHandle = document.querySelector('.resize-handle');
      expect(resizeHandle).toBeInTheDocument();
      
      fireEvent.mouseDown(resizeHandle!, { clientX: 100, clientY: 100 });

      // Should prevent default behavior
      expect(resizeHandle).toHaveStyle({ cursor: 'se-resize' });
    });

    it('should resize panel on mouse move', () => {
      render(<ErrorBoundaryDevToolsPanel />);

      const resizeHandle = document.querySelector('.resize-handle');
      
      // Start resizing
      fireEvent.mouseDown(resizeHandle!, { clientX: 100, clientY: 100 });
      
      // Simulate mouse move
      act(() => {
        const event = new MouseEvent('mousemove', { clientX: 150, clientY: 150 });
        document.dispatchEvent(event);
      });

      const panel = screen.getByText('Error Boundary DevTools').closest('div');
      expect(panel).toHaveStyle({ width: '850px', height: '650px' }); // 800 + 50, 600 + 50
    });

    it('should enforce minimum size during resize', () => {
      render(<ErrorBoundaryDevToolsPanel />);

      const resizeHandle = document.querySelector('.resize-handle');
      
      // Start resizing
      fireEvent.mouseDown(resizeHandle!, { clientX: 100, clientY: 100 });
      
      // Try to resize below minimum
      act(() => {
        const event = new MouseEvent('mousemove', { clientX: -500, clientY: -500 });
        document.dispatchEvent(event);
      });

      const panel = screen.getByText('Error Boundary DevTools').closest('div');
      expect(panel).toHaveStyle({ width: '400px', height: '300px' }); // Minimum sizes
    });
  });

  describe('Accessibility', () => {
    it('should have proper button roles and titles', () => {
      render(<ErrorBoundaryDevToolsPanel />);

      expect(screen.getByTitle('Minimize')).toHaveAttribute('type', 'button');
      expect(screen.getByTitle('Close')).toHaveAttribute('type', 'button');
    });

    it('should have clickable tabs with proper semantics', () => {
      render(<ErrorBoundaryDevToolsPanel />);

      const tabs = [
        screen.getByText('Errors'),
        screen.getByText('Component Tree'),
        screen.getByText('Analytics'),
        screen.getByText('Simulator'),
        screen.getByText('Recovery'),
      ];

      tabs.forEach(tab => {
        expect(tab.closest('div')).toHaveStyle({ cursor: 'pointer' });
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle missing tab component gracefully', () => {
      render(<ErrorBoundaryDevToolsPanel />);

      // Try to click a tab (should default to ErrorList if component is missing)
      const analyticsTab = screen.getByText('Analytics');
      fireEvent.click(analyticsTab);

      // Should render the mock component
      expect(screen.getByTestId('error-analytics')).toBeInTheDocument();
    });

    it('should handle store errors gracefully', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const updateConfigMock = vi.fn(() => { throw new Error('Store error'); });
      
      // Mock store that throws errors
      (useErrorBoundaryDevTools as Mock).mockReturnValue({
        config: { enabled: true, theme: 'light' },
        updateConfig: updateConfigMock,
        errors: [],
        errorBoundaries: new Map(),
        isRecording: false,
      });

      render(<ErrorBoundaryDevToolsPanel />);

      const closeButton = screen.getByTitle('Close');
      
      // The component should still render even if store methods throw
      expect(screen.getByText('Error Boundary DevTools')).toBeInTheDocument();
      
      // Clicking should call the updateConfig function and throw the error
      expect(() => {
        fireEvent.click(closeButton);
      }).toThrow('Store error');
      
      expect(updateConfigMock).toHaveBeenCalledWith({ enabled: false });
      
      consoleErrorSpy.mockRestore();
    });
  });

  describe('Performance', () => {
    it('should not cause infinite re-renders', () => {
      const renderSpy = vi.fn();
      
      const TestWrapper = () => {
        renderSpy();
        return <ErrorBoundaryDevToolsPanel />;
      };

      render(<TestWrapper />);

      // Should only render once initially
      expect(renderSpy).toHaveBeenCalledTimes(1);
    });

    it('should handle rapid tab switching', () => {
      render(<ErrorBoundaryDevToolsPanel />);

      const tabs = [
        screen.getByText('Component Tree'),
        screen.getByText('Analytics'),
        screen.getByText('Simulator'),
        screen.getByText('Recovery'),
        screen.getByText('Errors'),
      ];

      // Rapidly switch between tabs
      tabs.forEach(tab => {
        fireEvent.click(tab);
      });

      // Should end up on the last clicked tab (Errors)
      expect(screen.getByTestId('error-list')).toBeInTheDocument();
    });
  });

  describe('Layout and Styling', () => {
    it('should apply fixed positioning', () => {
      render(<ErrorBoundaryDevToolsPanel />);

      const panel = screen.getByText('Error Boundary DevTools').closest('div');
      expect(panel).toHaveStyle({ position: 'fixed' });
    });

    it('should have proper z-index for overlay', () => {
      render(<ErrorBoundaryDevToolsPanel />);

      const panel = screen.getByText('Error Boundary DevTools').closest('div');
      expect(panel).toHaveStyle({ zIndex: '10000' });
    });

    it('should include CSS animation for recording indicator', () => {
      mockStore.isRecording = true;

      render(<ErrorBoundaryDevToolsPanel />);

      // Check that style tag with animation is rendered
      const styleTag = document.querySelector('style');
      expect(styleTag?.textContent).toContain('@keyframes pulse');
    });
  });

  describe('Dynamic State Updates', () => {
    it('should update error count when errors change', () => {
      const { rerender } = render(<ErrorBoundaryDevToolsPanel />);

      expect(screen.getByText('0 errors')).toBeInTheDocument();

      // Update store with new errors
      mockStore.errors = [{ id: '1', message: 'New error' }];
      
      rerender(<ErrorBoundaryDevToolsPanel />);

      expect(screen.getByText('1 errors')).toBeInTheDocument();
    });

    it('should update boundary count when boundaries change', () => {
      const { rerender } = render(<ErrorBoundaryDevToolsPanel />);

      expect(screen.getByText('0 boundaries')).toBeInTheDocument();

      // Update store with new boundary
      mockStore.errorBoundaries.set('new-boundary', { id: 'new-boundary' });
      
      rerender(<ErrorBoundaryDevToolsPanel />);

      expect(screen.getByText('1 boundaries')).toBeInTheDocument();
    });
  });
});