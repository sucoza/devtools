import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { WebSocketSignalRDevToolsPanel } from '../WebSocketSignalRDevToolsPanel';

// Mock the client creation
vi.mock('../../core/devtools-client', () => ({
  createWebSocketSignalRDevToolsClient: () => ({
    setTheme: vi.fn(),
    toggleFilters: vi.fn(),
    clearWebSocketData: vi.fn(),
    clearSignalRData: vi.fn(),
    toggleWebSocketRecording: vi.fn(),
    toggleSignalRRecording: vi.fn(),
    selectTab: vi.fn(),
    selectConnection: vi.fn(),
    selectMessage: vi.fn(),
  }),
}));

// Mock store state
const mockStoreState = {
  websocket: {
    connections: {},
    messages: {},
    metrics: {
      totalConnections: 0,
      activeConnections: 0,
      totalMessages: 0,
      totalBytes: 0,
      averageLatency: 0,
      errorRate: 0,
    },
    filter: {},
    isRecording: true,
    maxMessages: 1000,
  },
  signalr: {
    connections: {},
    messages: {},
    metrics: {
      totalConnections: 0,
      activeConnections: 0,
      totalInvocations: 0,
      totalMessages: 0,
      averageLatency: 0,
      reconnectionRate: 0,
      errorRate: 0,
      hubMethodStats: [],
    },
    filter: {},
    isRecording: true,
    maxMessages: 1000,
  },
  ui: {
    selectedTab: 'websocket',
    showFilters: false,
    theme: 'auto',
  },
  simulation: {
    isActive: false,
    connections: [],
    messageTemplates: [],
  },
};

// Mock the store hooks
vi.mock('../../core/devtools-store', () => ({
  useDevToolsStore: () => mockStoreState,
  useDevToolsSelector: (selector: (state: typeof mockStoreState) => any) => selector(mockStoreState),
}));

// Mock all the child components to focus on testing the main panel
vi.mock('../WebSocketPanel', () => ({
  WebSocketPanel: () => <div data-testid="websocket-panel">WebSocket Panel</div>,
}));

vi.mock('../SignalRPanel', () => ({
  SignalRPanel: () => <div data-testid="signalr-panel">SignalR Panel</div>,
}));

vi.mock('../PerformancePanel', () => ({
  PerformancePanel: () => <div data-testid="performance-panel">Performance Panel</div>,
}));

vi.mock('../FilterPanel', () => ({
  FilterPanel: () => <div data-testid="filter-panel">Filter Panel</div>,
}));

vi.mock('../ConnectionDetails', () => ({
  ConnectionDetails: () => <div data-testid="connection-details">Connection Details</div>,
}));

vi.mock('../MessageDetails', () => ({
  MessageDetails: () => <div data-testid="message-details">Message Details</div>,
}));

describe('WebSocketSignalRDevToolsPanel', () => {
  it('should render with default props', () => {
    render(<WebSocketSignalRDevToolsPanel />);

    // Should render tab labels and the default websocket panel content
    expect(screen.getByText('WebSocket')).toBeInTheDocument();
    // WebSocket panel may appear multiple times (in tab definition and content area)
    const panels = screen.getAllByTestId('websocket-panel');
    expect(panels.length).toBeGreaterThan(0);
  });

  it('should apply custom height', () => {
    const { container } = render(<WebSocketSignalRDevToolsPanel height={800} />);

    const panel = container.firstChild as HTMLElement;
    expect(panel.style.height).toBe('800px');
  });

  it('should apply custom className', () => {
    const { container } = render(<WebSocketSignalRDevToolsPanel className="custom-class" />);

    const panel = container.firstChild as HTMLElement;
    expect(panel).toHaveClass('custom-class');
  });

  it('should render tab labels for all sections', () => {
    render(<WebSocketSignalRDevToolsPanel />);

    expect(screen.getByText('WebSocket')).toBeInTheDocument();
    expect(screen.getByText('SignalR')).toBeInTheDocument();
    expect(screen.getByText('Performance')).toBeInTheDocument();
  });

  it('should render recording status indicator', () => {
    render(<WebSocketSignalRDevToolsPanel />);

    // When recording is true, should show recording status
    expect(screen.getByText('Recording WebSocket')).toBeInTheDocument();
  });

  it('should not show filters panel by default', () => {
    render(<WebSocketSignalRDevToolsPanel />);

    // showFilters is false in mock state
    expect(screen.queryByTestId('filter-panel')).not.toBeInTheDocument();
  });

  it('should not show connection details by default', () => {
    render(<WebSocketSignalRDevToolsPanel />);

    // No connection is selected in mock state
    expect(screen.queryByTestId('connection-details')).not.toBeInTheDocument();
  });

  it('should not show message details by default', () => {
    render(<WebSocketSignalRDevToolsPanel />);

    // No message is selected in mock state
    expect(screen.queryByTestId('message-details')).not.toBeInTheDocument();
  });

  it('should render footer with stats', () => {
    render(<WebSocketSignalRDevToolsPanel />);

    // Footer renders labels with a colon suffix: "Connections:" and "Messages:"
    expect(screen.getByText('Connections:')).toBeInTheDocument();
    expect(screen.getByText('Messages:')).toBeInTheDocument();
  });

  it('should render without crashing', () => {
    const { container } = render(<WebSocketSignalRDevToolsPanel />);
    expect(container.firstChild).toBeTruthy();
  });
});