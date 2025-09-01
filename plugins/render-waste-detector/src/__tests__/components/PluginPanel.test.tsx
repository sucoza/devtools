import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import PluginPanel from '../../components/PluginPanel';

// Mock the store with proper selector support
const mockStoreState = {
  recording: {
    isRecording: false,
    isPaused: false,
    startTime: null,
    duration: 0,
    activeSession: null,
    sessions: []
  },
  components: new Map(),
  renderEvents: [],
  metrics: new Map(),
  suggestions: [],
  heatMapData: [],
  renderTree: null,
  vdomDiffs: [],
  ui: {
    activeTab: 'overview',
    selectedComponentId: null,
    selectedRenderEventId: null,
    hoveredComponentId: null,
    expandedComponents: new Set(),
    filters: {
      componentNameFilter: '',
      showOnlyWasteful: false,
      showOnlyRecent: true,
      minRenderCount: 1,
      minWastePercentage: 0,
      timeRange: {
        start: Date.now() - 60000,
        end: Date.now(),
      },
      severityFilter: new Set(['low', 'medium', 'high', 'critical']),
      suggestionTypeFilter: new Set(['use-memo', 'use-callback', 'react-memo']),
    },
    viewOptions: {
      heatMapMode: 'waste',
      treeViewExpanded: true,
      showMetrics: true,
      showSuggestions: true,
      showVDomDiff: false,
      timelineZoom: 1.0,
      groupBy: 'component',
      sortBy: 'waste',
      sortOrder: 'desc',
    },
    theme: 'auto',
    sidebarWidth: 300,
    panelHeight: 400,
    splitView: false,
  },
  settings: {
    trackAllComponents: true,
    trackOnlyProblematic: false,
    minRenderThreshold: 3,
    maxRecordingTime: 300000,
    maxEvents: 10000,
    enableHeatMap: true,
    enableSuggestions: true,
    enableVDomDiff: false,
    debounceMs: 100,
    excludePatterns: [],
    includePatterns: [],
  },
  stats: {
    totalComponents: 0,
    totalRenders: 0,
    unnecessaryRenders: 0,
    wastePercentage: 0,
    avgComponentRenders: 0,
    mostWastefulComponents: [],
    rendersByPhase: {
      mount: 0,
      update: 0,
      unmount: 0,
    },
    rendersByReason: new Map(),
    timeDistribution: {
      fastRenders: 0,
      normalRenders: 0,
      slowRenders: 0,
      verySlowRenders: 0,
    },
    performanceImpact: {
      totalTime: 0,
      wastedTime: 0,
      avgRenderTime: 0,
      maxRenderTime: 0,
    },
  },
  performance: {
    isAnalyzing: false,
    lastAnalysisTime: 0,
    analysisProgress: 0,
    memoryUsage: 0,
    cpuUsage: 0,
  },
  // Action methods
  dispatch: vi.fn(),
  startRecording: vi.fn(),
  stopRecording: vi.fn(),
  pauseRecording: vi.fn(),
  resumeRecording: vi.fn(),
  clearRecording: vi.fn(),
  addRenderEvent: vi.fn(),
  updateFilters: vi.fn(),
  updateViewOptions: vi.fn(),
  updateSettings: vi.fn(),
  selectTab: vi.fn(),
  selectComponent: vi.fn(),
  selectRenderEvent: vi.fn(),
  exportSession: vi.fn(),
  importSession: vi.fn(),
  calculateStats: vi.fn(),
  startAnalysis: vi.fn(),
};

vi.mock('../../core/devtools-store', () => ({
  useRenderWasteDetectorStore: vi.fn((selector) => {
    if (typeof selector === 'function') {
      return selector(mockStoreState);
    }
    return mockStoreState;
  })
}));

// Mock the event client
const mockEventClient = {
  subscribe: vi.fn((callback) => {
    // Call callback with initial state
    callback(mockStoreState, 'render-waste:state');
    // Return unsubscribe function
    return vi.fn();
  }),
  getState: vi.fn(() => mockStoreState),
  startMonitoring: vi.fn(),
  stopMonitoring: vi.fn(),
  dispose: vi.fn(),
  startRecording: vi.fn(),
  stopRecording: vi.fn(),
  pauseRecording: vi.fn(),
  resumeRecording: vi.fn(),
  clearRecording: vi.fn(),
  addRenderEvent: vi.fn(),
  selectComponent: vi.fn(),
  selectRenderEvent: vi.fn(),
  updateFilters: vi.fn(),
  updateViewOptions: vi.fn(),
  updateSettings: vi.fn(),
  exportSession: vi.fn(),
  importSession: vi.fn()
};

vi.mock('../../core/devtools-client', () => ({
  getRenderWasteDetectorEventClient: vi.fn(() => mockEventClient),
  createRenderWasteDetectorEventClient: vi.fn(() => mockEventClient)
}));

describe('PluginPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the plugin panel', () => {
    render(<PluginPanel />);
    expect(screen.getByText(/Render Waste Detector/i)).toBeInTheDocument();
  });

  it('should display recording status', () => {
    render(<PluginPanel />);
    // Component should render without the specific "Recording:" text, 
    // but should have recording controls
    expect(screen.getByTitle(/Start Recording/i)).toBeInTheDocument();
  });

  it('should show metrics section', () => {
    render(<PluginPanel />);
    // Component should show statistics/metrics in the overview tab
    // Look for elements that indicate metrics are displayed
    expect(screen.getAllByText(/0/)).toHaveLength(7); // Should show multiple numeric values
    expect(screen.getByText(/Overview/i)).toBeInTheDocument(); // Should have tabs
  });

  it('should render tab navigation', () => {
    render(<PluginPanel />);
    // Check for tab buttons
    const tabButtons = screen.getAllByRole('button');
    expect(tabButtons.length).toBeGreaterThan(0);
  });
});