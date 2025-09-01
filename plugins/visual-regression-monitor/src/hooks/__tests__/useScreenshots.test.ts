import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useScreenshots } from '../useScreenshots';

// Mock the devtools client
const mockDevToolsClient = {
  subscribe: vi.fn().mockReturnValue(() => {}), // Return unsubscribe function
  getState: vi.fn(),
  addScreenshot: vi.fn(),
  selectScreenshot: vi.fn(),
  removeScreenshot: vi.fn(),
};

vi.mock('../../core/devtools-client', () => ({
  createVisualRegressionDevToolsClient: () => mockDevToolsClient,
}));

// Mock the screenshot engine
const mockScreenshotEngine = {
  captureScreenshot: vi.fn(),
  captureResponsiveScreenshots: vi.fn(),
};

vi.mock('../../core/screenshot-engine', () => ({
  getScreenshotEngine: () => mockScreenshotEngine,
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

describe('useScreenshots', () => {
  const mockState = {
    screenshots: {
      'screenshot-1': {
        id: 'screenshot-1',
        name: 'Test Screenshot',
        url: 'https://example.com',
      },
    },
    ui: {
      selectedScreenshotId: 'screenshot-1',
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockDevToolsClient.getState.mockReturnValue(mockState);
  });

  it('should return screenshots array', () => {
    const { result } = renderHook(() => useScreenshots());
    
    expect(result.current.screenshots).toHaveLength(1);
    expect(result.current.screenshots[0].id).toBe('screenshot-1');
  });

  it('should return selected screenshot', () => {
    const { result } = renderHook(() => useScreenshots());
    
    expect(result.current.selectedScreenshot).toBeDefined();
    expect(result.current.selectedScreenshot?.id).toBe('screenshot-1');
  });

  it('should provide action methods', () => {
    const { result } = renderHook(() => useScreenshots());
    
    expect(typeof result.current.actions.captureScreenshot).toBe('function');
    expect(typeof result.current.actions.selectScreenshot).toBe('function');
    expect(typeof result.current.actions.removeScreenshot).toBe('function');
  });
});
