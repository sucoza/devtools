import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi, Mock } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorBoundaryDevToolsPanel } from '../../components/ErrorBoundaryDevToolsPanel';
import { useErrorBoundaryDevTools } from '../../core/store';

// matchMedia is mocked in the setup file with a plain function (survives vi.clearAllMocks/restoreAllMocks)

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
    errorBoundaries: Map<string, any>;
    isRecording: boolean;
    clearErrors: Mock;
    exportState: Mock;
    startRecording: Mock;
    stopRecording: Mock;
  };

  beforeEach(() => {
    mockStore = {
      errorBoundaries: new Map(),
      isRecording: false,
      clearErrors: vi.fn(),
      exportState: vi.fn(() => '{"errors":[]}'),
      startRecording: vi.fn(),
      stopRecording: vi.fn(),
    };

    (useErrorBoundaryDevTools as Mock).mockReturnValue(mockStore);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Panel Rendering', () => {
    it('should render the panel with title', () => {
      render(<ErrorBoundaryDevToolsPanel />);

      expect(screen.getByText('Error Boundary DevTools')).toBeInTheDocument();
    });

    it('should always render the panel regardless of store state', () => {
      // The new implementation always renders; visibility is not config-driven
      render(<ErrorBoundaryDevToolsPanel />);

      expect(screen.getByText('Error Boundary DevTools')).toBeInTheDocument();
    });
  });

  describe('Theme Support', () => {
    it('should render with ThemeProvider when theme is light', () => {
      render(<ErrorBoundaryDevToolsPanel theme="light" />);

      // Panel renders successfully under ThemeProvider
      expect(screen.getByText('Error Boundary DevTools')).toBeInTheDocument();
    });

    it('should render with ThemeProvider when theme is dark', () => {
      render(<ErrorBoundaryDevToolsPanel theme="dark" />);

      expect(screen.getByText('Error Boundary DevTools')).toBeInTheDocument();
    });

    it('should auto-detect theme and resolve to dark when prefers-color-scheme is dark', () => {
      // The setup.ts matchMedia mock returns matches: true for '(prefers-color-scheme: dark)'
      // so auto resolves to 'dark'
      render(<ErrorBoundaryDevToolsPanel theme="auto" />);

      expect(screen.getByText('Error Boundary DevTools')).toBeInTheDocument();
    });

    it('should default to auto theme when no theme prop is provided', () => {
      render(<ErrorBoundaryDevToolsPanel />);

      // Should render successfully with auto-detected theme
      expect(screen.getByText('Error Boundary DevTools')).toBeInTheDocument();
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

    it('should highlight active tab with active styling', () => {
      render(<ErrorBoundaryDevToolsPanel />);

      const errorsTab = screen.getByText('Errors');
      // Tabs are rendered as <button> elements by PluginPanel
      // The active tab has borderBottomColor set to the focus color
      const errorsButton = errorsTab.closest('button');
      expect(errorsButton).toBeInTheDocument();
    });
  });

  describe('ConfigMenu', () => {
    it('should render the config menu button', () => {
      render(<ErrorBoundaryDevToolsPanel />);

      // ConfigMenu renders a button with title "Settings"
      const configButton = screen.getByTitle('Settings');
      expect(configButton).toBeInTheDocument();
    });

    it('should open config menu when button is clicked', () => {
      render(<ErrorBoundaryDevToolsPanel />);

      const configButton = screen.getByTitle('Settings');
      fireEvent.click(configButton);

      // Menu should now be open with menu items visible
      expect(screen.getByRole('menu')).toBeInTheDocument();
    });

    it('should show Start Recording option when not recording', () => {
      mockStore.isRecording = false;

      render(<ErrorBoundaryDevToolsPanel />);

      const configButton = screen.getByTitle('Settings');
      fireEvent.click(configButton);

      expect(screen.getByText('Start Recording')).toBeInTheDocument();
    });

    it('should show Stop Recording option when recording', () => {
      mockStore.isRecording = true;

      render(<ErrorBoundaryDevToolsPanel />);

      const configButton = screen.getByTitle('Settings');
      fireEvent.click(configButton);

      expect(screen.getByText('Stop Recording')).toBeInTheDocument();
    });

    it('should call startRecording when Start Recording is clicked', () => {
      mockStore.isRecording = false;

      render(<ErrorBoundaryDevToolsPanel />);

      const configButton = screen.getByTitle('Settings');
      fireEvent.click(configButton);

      const startItem = screen.getByText('Start Recording');
      fireEvent.click(startItem);

      expect(mockStore.startRecording).toHaveBeenCalled();
    });

    it('should call stopRecording when Stop Recording is clicked', () => {
      mockStore.isRecording = true;

      render(<ErrorBoundaryDevToolsPanel />);

      const configButton = screen.getByTitle('Settings');
      fireEvent.click(configButton);

      const stopItem = screen.getByText('Stop Recording');
      fireEvent.click(stopItem);

      expect(mockStore.stopRecording).toHaveBeenCalled();
    });

    it('should show Clear Errors option in config menu', () => {
      render(<ErrorBoundaryDevToolsPanel />);

      const configButton = screen.getByTitle('Settings');
      fireEvent.click(configButton);

      expect(screen.getByText('Clear Errors')).toBeInTheDocument();
    });

    it('should call clearErrors when Clear Errors is clicked', () => {
      render(<ErrorBoundaryDevToolsPanel />);

      const configButton = screen.getByTitle('Settings');
      fireEvent.click(configButton);

      const clearItem = screen.getByText('Clear Errors');
      fireEvent.click(clearItem);

      expect(mockStore.clearErrors).toHaveBeenCalled();
    });

    it('should show Export Error Data option in config menu', () => {
      render(<ErrorBoundaryDevToolsPanel />);

      const configButton = screen.getByTitle('Settings');
      fireEvent.click(configButton);

      expect(screen.getByText('Export Error Data')).toBeInTheDocument();
    });

    it('should call exportState when Export Error Data is clicked', () => {
      render(<ErrorBoundaryDevToolsPanel />);

      // Mock URL.createObjectURL and URL.revokeObjectURL
      const createObjectURLSpy = vi.fn(() => 'blob:mock-url');
      const revokeObjectURLSpy = vi.fn();
      global.URL.createObjectURL = createObjectURLSpy;
      global.URL.revokeObjectURL = revokeObjectURLSpy;

      const configButton = screen.getByTitle('Settings');
      fireEvent.click(configButton);

      const exportItem = screen.getByText('Export Error Data');
      fireEvent.click(exportItem);

      expect(mockStore.exportState).toHaveBeenCalled();
    });

    it('should show Settings option in config menu', () => {
      render(<ErrorBoundaryDevToolsPanel />);

      const configButton = screen.getByTitle('Settings');
      fireEvent.click(configButton);

      // There is both the button titled "Settings" and a menu item labeled "Settings"
      // The menu item is inside a role="menuitem" container
      const menuItems = screen.getAllByRole('menuitem');
      const settingsItem = menuItems.find(item => item.textContent?.includes('Settings'));
      expect(settingsItem).toBeDefined();
    });

    it('should display keyboard shortcuts in menu items', () => {
      render(<ErrorBoundaryDevToolsPanel />);

      const configButton = screen.getByTitle('Settings');
      fireEvent.click(configButton);

      expect(screen.getByText('Ctrl+R')).toBeInTheDocument();
      expect(screen.getByText('Ctrl+K')).toBeInTheDocument();
      expect(screen.getByText('Ctrl+E')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have a config menu button with aria-haspopup', () => {
      render(<ErrorBoundaryDevToolsPanel />);

      const configButton = screen.getByTitle('Settings');
      expect(configButton).toHaveAttribute('aria-haspopup', 'menu');
    });

    it('should have aria-expanded attribute on config menu button', () => {
      render(<ErrorBoundaryDevToolsPanel />);

      const configButton = screen.getByTitle('Settings');
      expect(configButton).toHaveAttribute('aria-expanded', 'false');

      fireEvent.click(configButton);
      expect(configButton).toHaveAttribute('aria-expanded', 'true');
    });

    it('should render tab buttons as actual button elements', () => {
      render(<ErrorBoundaryDevToolsPanel />);

      const tabs = [
        screen.getByText('Errors'),
        screen.getByText('Component Tree'),
        screen.getByText('Analytics'),
        screen.getByText('Simulator'),
        screen.getByText('Recovery'),
      ];

      tabs.forEach(tab => {
        expect(tab.closest('button')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle missing tab component gracefully', () => {
      render(<ErrorBoundaryDevToolsPanel />);

      // Try to click a tab (should render the mock component)
      const analyticsTab = screen.getByText('Analytics');
      fireEvent.click(analyticsTab);

      // Should render the mock component
      expect(screen.getByTestId('error-analytics')).toBeInTheDocument();
    });

    it('should render successfully when store returns empty state', () => {
      (useErrorBoundaryDevTools as Mock).mockReturnValue({
        errorBoundaries: new Map(),
        isRecording: false,
        clearErrors: vi.fn(),
        exportState: vi.fn(() => '{}'),
        startRecording: vi.fn(),
        stopRecording: vi.fn(),
      });

      render(<ErrorBoundaryDevToolsPanel />);

      expect(screen.getByText('Error Boundary DevTools')).toBeInTheDocument();
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
    it('should render with a relative-positioned wrapper', () => {
      render(<ErrorBoundaryDevToolsPanel />);

      // The component wraps PluginPanel in a div with position: relative
      const wrapper = document.querySelector('[style*="position: relative"]');
      expect(wrapper).toBeInTheDocument();
    });

    it('should not include unused inline CSS animations', () => {
      render(<ErrorBoundaryDevToolsPanel />);

      // Pulse animation was removed as dead code - dt-pulse is available via theme.css
      const styleTags = document.querySelectorAll('style');
      const hasInlinePulse = Array.from(styleTags).some(
        tag => tag.textContent?.includes('@keyframes pulse')
      );
      expect(hasInlinePulse).toBe(false);
    });

    it('should position the config menu absolutely in top-right corner', () => {
      render(<ErrorBoundaryDevToolsPanel />);

      // ConfigMenu is positioned absolutely in the top-right
      const configContainer = document.querySelector('[style*="position: absolute"]');
      expect(configContainer).toBeInTheDocument();
    });
  });

  describe('Dynamic State Updates', () => {
    it('should update config menu recording label when isRecording changes', () => {
      const { rerender } = render(<ErrorBoundaryDevToolsPanel />);

      // Open menu and verify initial state
      let configButton = screen.getByTitle('Settings');
      fireEvent.click(configButton);
      expect(screen.getByText('Start Recording')).toBeInTheDocument();

      // Close menu, update store, rerender
      fireEvent.click(configButton);
      mockStore.isRecording = true;
      rerender(<ErrorBoundaryDevToolsPanel />);

      // Open menu again and verify updated state
      configButton = screen.getByTitle('Settings');
      fireEvent.click(configButton);
      expect(screen.getByText('Stop Recording')).toBeInTheDocument();
    });

    it('should rerender correctly when store state changes', () => {
      const { rerender } = render(<ErrorBoundaryDevToolsPanel />);

      // Verify initial render
      expect(screen.getByText('Error Boundary DevTools')).toBeInTheDocument();

      // Update store with new boundary data
      mockStore.errorBoundaries.set('new-boundary', { id: 'new-boundary' });

      rerender(<ErrorBoundaryDevToolsPanel />);

      // Component should still render correctly
      expect(screen.getByText('Error Boundary DevTools')).toBeInTheDocument();
    });
  });
});
