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
    expandedNodes: new Set(),
    timeRange: null,
    zoom: 1
  },
  filters: {
    minRenderTime: 0,
    showOnlyWasted: false,
    componentName: '',
    severityFilter: 'all'
  },
  viewOptions: {
    showTree: true,
    showTimeline: true,
    showHeatMap: true,
    showStats: true
  },
  recordingSettings: {
    captureStackTraces: true,
    profileRenderPhases: true,
    trackPropChanges: true,
    trackStateChanges: true,
    trackHooks: true,
    trackContext: true,
    maxEvents: 1000,
    samplingRate: 1
  },
  startRecording: vi.fn(),
  stopRecording: vi.fn(),
  pauseRecording: vi.fn(),
  resumeRecording: vi.fn(),
  clearRecording: vi.fn(),
  addRenderEvent: vi.fn(),
  setFilters: vi.fn(),
  setViewOptions: vi.fn(),
  setRecordingSettings: vi.fn(),
  setActiveTab: vi.fn(),
  selectComponent: vi.fn(),
  selectRenderEvent: vi.fn(),
  exportData: vi.fn(),
  importData: vi.fn(),
  resetStore: vi.fn()
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
vi.mock('../../core/devtools-client', () => ({
  getRenderWasteDetectorEventClient: vi.fn(() => ({
    startMonitoring: vi.fn(),
    stopMonitoring: vi.fn(),
    dispose: vi.fn()
  }))
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
    expect(screen.getByText(/Recording:/i)).toBeInTheDocument();
  });

  it('should show metrics section', () => {
    render(<PluginPanel />);
    expect(screen.getByText(/Total Renders/i)).toBeInTheDocument();
    expect(screen.getByText(/Wasted Renders/i)).toBeInTheDocument();
  });

  it('should render tab navigation', () => {
    render(<PluginPanel />);
    // Check for tab buttons
    const tabButtons = screen.getAllByRole('button');
    expect(tabButtons.length).toBeGreaterThan(0);
  });
});