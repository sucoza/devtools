import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PluginPanel } from '../PluginPanel';
import type { DevToolsState } from '../../types';

// Mock the devtools client
const mockDevToolsClient = {
  subscribe: vi.fn(),
  getState: vi.fn(),
  connectPlaywright: vi.fn(),
  selectTab: vi.fn(),
};

vi.mock('../core/devtools-client', () => ({
  createVisualRegressionDevToolsClient: () => mockDevToolsClient,
}));
// Mock child components
vi.mock('../ScreenshotCapture', () => ({
  ScreenshotCapture: () => <div data-testid="screenshot-capture">Screenshot Capture</div>,
}));

vi.mock('../VisualDiff', () => ({
  VisualDiff: () => <div data-testid="visual-diff">Visual Diff</div>,
}));

vi.mock('../Timeline', () => ({
  Timeline: () => <div data-testid="timeline">Timeline</div>,
}));

vi.mock('../ComparisonView', () => ({
  ComparisonView: () => <div data-testid="comparison-view">Comparison View</div>,
}));

vi.mock('../Settings', () => ({
  Settings: () => <div data-testid="settings">Settings</div>,
}));

// Mock useSyncExternalStore
vi.mock('use-sync-external-store/shim', () => ({
  useSyncExternalStore: (subscribe: any, getState: any) => getState(),
}));

// Helper function to create mock state
function createMockState(overrides: Partial<DevToolsState> = {}): DevToolsState {
  return {
    screenshots: {},
    visualDiffs: {},
    testSuites: {},
    animationSequences: {},
    isCapturing: false,
    isAnalyzing: false,
    isPlaywrightConnected: true,
    ui: {
      activeTab: 'screenshots',
      selectedScreenshotId: undefined,
      selectedDiffId: undefined,
      selectedSuiteId: undefined,
      viewMode: 'grid',
      showDiffOverlay: false,
      showMetadata: false,
      sidebarOpen: true,
      zoomLevel: 1,
      filterSettings: {
        showPassed: true,
        showFailed: true,
        showPending: true,
        tagFilter: '',
        dateRange: 'all',
      },
    },
    settings: {
      threshold: 0.1,
      ignoreAntialiasing: true,
      ignoreColors: false,
      ignoreDifferences: false,
      autoCapture: false,
      captureDelay: 0,
      retryCount: 3,
      concurrentComparisons: 2,
    },
    stats: {
      totalScreenshots: 5,
      totalDiffs: 3,
      passedTests: 2,
      failedTests: 1,
      averageDiffTime: 150,
      storageUsed: 1024 * 1024 * 5, // 5MB
      lastCaptureTime: Date.now() - 1000 * 60 * 5, // 5 minutes ago
      recentActivity: [],
    },
    ...overrides,
  };
}

describe('PluginPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDevToolsClient.getState.mockReturnValue(createMockState());
  });

  describe('Rendering', () => {
    it('should render with default props', () => {
      render(<PluginPanel />);
      
      expect(screen.getByText('Visual Regression Monitor')).toBeInTheDocument();
      expect(screen.getByText('Ready')).toBeInTheDocument();
      expect(screen.getByTestId('screenshot-capture')).toBeInTheDocument();
    });

    it('should display correct stats in header', () => {
      const state = createMockState({
        stats: {
          totalScreenshots: 10,
          totalDiffs: 6,
          passedTests: 4,
          failedTests: 2,
          averageDiffTime: 200,
          storageUsed: 1024 * 1024 * 10, // 10MB
          lastCaptureTime: Date.now(),
          recentActivity: [],
        },
      });
      
      mockDevToolsClient.getState.mockReturnValue(state);
      
      render(<PluginPanel />);
      
      expect(screen.getByText('Screenshots: 10')).toBeInTheDocument();
      expect(screen.getByText('Comparisons: 6')).toBeInTheDocument();
      expect(screen.getByText('Passed: 4')).toBeInTheDocument();
      expect(screen.getByText('Failed: 2')).toBeInTheDocument();
    });
  });

  describe('Connection Status', () => {
    it('should show ready status when Playwright is connected', () => {
      const state = createMockState({ isPlaywrightConnected: true });
      mockDevToolsClient.getState.mockReturnValue(state);
      
      render(<PluginPanel />);
      
      expect(screen.getByText('Ready')).toBeInTheDocument();
      expect(screen.queryByText('Connect')).not.toBeInTheDocument();
    });

    it('should show disconnected status when Playwright is not connected', () => {
      const state = createMockState({ isPlaywrightConnected: false });
      mockDevToolsClient.getState.mockReturnValue(state);
      
      render(<PluginPanel />);
      
      expect(screen.getByText('Disconnected')).toBeInTheDocument();
      expect(screen.getByText('Connect')).toBeInTheDocument();
    });
  });
});
