import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Settings } from '../Settings';

// Mock the devtools client
const mockDevToolsClient = {
  subscribe: vi.fn().mockReturnValue(() => {}), // Return unsubscribe function
  getState: vi.fn(),
};

vi.mock('../../core/devtools-client', () => ({
  createVisualRegressionDevToolsClient: () => mockDevToolsClient,
}));

// Mock the responsive testing hook
const mockResponsiveActions = {
  testViewports: vi.fn(),
  captureResponsive: vi.fn(),
};

vi.mock('../../hooks/useResponsiveTesting', () => ({
  useResponsiveTesting: () => ({
    actions: mockResponsiveActions,
  }),
}));

// Mock useSyncExternalStore
vi.mock('use-sync-external-store/shim', () => ({
  useSyncExternalStore: (subscribe: any, getState: any, getServerSnapshot?: any) => {
    // Call subscribe to ensure it's tested
    const unsubscribe = subscribe(() => {});
    // Cleanup immediately in test environment
    unsubscribe();
    return getState();
  },
}));

describe('Settings', () => {
  const mockState = {
    settings: {
      defaultViewport: {
        width: 1920,
        height: 1080,
        deviceScaleFactor: 1,
        isMobile: false,
      },
      responsiveBreakpoints: [],
      diffThreshold: 0.1,
      captureSettings: {
        fullPage: false,
        hideScrollbars: true,
        disableAnimations: false,
        waitForFonts: true,
        waitForImages: true,
        delay: 0,
        quality: 90,
        format: 'png',
      },
      browserEngines: ['chromium'],
      autoCapture: false,
      animationSettings: {
        defaultFps: 30,
        maxDuration: 10000,
        captureTransitions: true,
        captureHovers: false,
      },
      storageSettings: {
        maxScreenshots: 1000,
        maxDiffs: 500,
        compressionEnabled: true,
        autoCleanup: true,
        retentionDays: 30,
      },
    },
    stats: {
      totalScreenshots: 5,
      totalDiffs: 3,
      passedTests: 2,
      failedTests: 1,
      averageDiffTime: 150,
      storageUsed: 1024 * 1024 * 5, // 5MB
      lastCaptureTime: Date.now(),
      recentActivity: [],
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
