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

// Mock the store hook
vi.mock('../../core/devtools-store', () => ({
  useDevToolsStore: () => ({
    websocket: {
      connections: new Map(),
      messages: [],
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
      connections: new Map(),
      messages: [],
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
  }),
}));

// Mock all the child components to focus on testing the main panel
vi.mock('../TabNavigation', () => ({
  TabNavigation: () => <div data-testid="tab-navigation">Tab Navigation</div>,
}));

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
    
    expect(screen.getByTestId('tab-navigation')).toBeInTheDocument();
    expect(screen.getByTestId('websocket-panel')).toBeInTheDocument();
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

  it('should have toggle filters button', () => {
    render(<WebSocketSignalRDevToolsPanel />);
    
    const toggleButton = screen.getByTitle('Toggle Filters');
    expect(toggleButton).toBeInTheDocument();
    expect(toggleButton).toHaveTextContent('🔍');
  });

  it('should have clear data button', () => {
    render(<WebSocketSignalRDevToolsPanel />);
    
    const clearButton = screen.getByTitle('Clear Data');
    expect(clearButton).toBeInTheDocument();
    expect(clearButton).toHaveTextContent('🗑️');
  });

  it('should have toggle recording button', () => {
    render(<WebSocketSignalRDevToolsPanel />);
    
    const recordButton = screen.getByTitle('Toggle Recording');
    expect(recordButton).toBeInTheDocument();
    // Should show pause icon when recording (default state)
    expect(recordButton).toHaveTextContent('⏸️');
  });

  it('should not show filters panel by default', () => {
    render(<WebSocketSignalRDevToolsPanel />);
    
    expect(screen.queryByTestId('filter-panel')).not.toBeInTheDocument();
  });

  it('should not show connection details by default', () => {
    render(<WebSocketSignalRDevToolsPanel />);
    
    expect(screen.queryByTestId('connection-details')).not.toBeInTheDocument();
  });

  it('should not show message details by default', () => {
    render(<WebSocketSignalRDevToolsPanel />);
    
    expect(screen.queryByTestId('message-details')).not.toBeInTheDocument();
  });

  it('should apply theme class', () => {
    const { container } = render(<WebSocketSignalRDevToolsPanel theme="dark" />);
    
    const panel = container.firstChild as HTMLElement;
    expect(panel).toHaveClass('theme-auto'); // Note: theme is managed by store state, not props directly
  });
});