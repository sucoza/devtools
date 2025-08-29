import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Settings } from '../Settings';

// Mock the devtools client
const mockDevToolsClient = {
  subscribe: vi.fn(),
  getState: vi.fn(),
};

vi.mock('../core/devtools-client', () => ({
  createVisualRegressionDevToolsClient: () => mockDevToolsClient,
}));

// Mock the responsive testing hook
const mockResponsiveActions = {
  testViewports: vi.fn(),
  captureResponsive: vi.fn(),
};

vi.mock('../hooks/useResponsiveTesting', () => ({
  useResponsiveTesting: () => ({
    actions: mockResponsiveActions,
  }),
}));

// Mock useSyncExternalStore
vi.mock('use-sync-external-store/shim', () => ({
  useSyncExternalStore: (subscribe: any, getState: any) => getState(),
}));

describe('Settings', () => {
  const mockState = {
    settings: {
      threshold: 0.1,
      ignoreAntialiasing: true,
      ignoreColors: false,
      autoCapture: false,
      captureDelay: 500,
      retryCount: 3,
      concurrentComparisons: 2,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockDevToolsClient.getState.mockReturnValue(mockState);
  });

  it('should render settings panel', () => {
    render(<Settings />);
    
    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(screen.getByText('Configure visual regression testing preferences')).toBeInTheDocument();
  });
});
