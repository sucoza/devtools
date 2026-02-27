import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BundleImpactAnalyzerPanel } from './BundleImpactAnalyzerPanel';

// Mock the core module
const mockEventClient = {
  subscribe: vi.fn((callback: () => void) => {
    return () => {};
  }),
  getState: vi.fn(() => mockState),
  startAnalysis: vi.fn(),
  stopAnalysis: vi.fn(),
  startTreeShakingAnalysis: vi.fn(),
  startCDNAnalysis: vi.fn(),
  generateSampleData: vi.fn(),
  updateFilters: vi.fn(),
  getFilteredModules: vi.fn(() => []),
  getFilteredChunks: vi.fn(() => []),
};

const mockState = {
  modules: [
    { id: '1', name: 'react', size: 100000, gzipSize: 30000, type: 'npm' },
  ],
  chunks: [{ id: 'c1', name: 'main', size: 200000 }],
  recommendations: [{ id: 'r1', type: 'split', priority: 'high' }],
  cdnAnalysis: [],
  stats: {
    totalSize: 500000,
    totalGzipSize: 150000,
    moduleCount: 10,
    chunkCount: 3,
    treeShakingEfficiency: 0.75,
    duplicateModules: 1,
    unusedExports: 2,
  },
  filters: {
    searchQuery: '',
    showOnlyLargeModules: false,
    showOnlyUnusedCode: false,
    showOnlyDuplicates: false,
  },
  isAnalyzing: false,
  jobs: [],
};

vi.mock('../core', () => ({
  createBundleAnalyzerEventClient: vi.fn(() => mockEventClient),
  getBundleAnalyzerEventClient: vi.fn(() => mockEventClient),
  startBundleInterception: vi.fn(),
}));

// Mock useSyncExternalStore to return mock state
vi.mock('use-sync-external-store/shim', () => ({
  useSyncExternalStore: (subscribe: any, getSnapshot: any) => {
    return getSnapshot();
  },
}));

describe('BundleImpactAnalyzerPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockEventClient.getState.mockReturnValue(mockState);
  });

  it('renders the main panel', () => {
    render(<BundleImpactAnalyzerPanel />);

    expect(screen.getByText('Bundle Impact Analyzer')).toBeInTheDocument();
  });

  it('displays bundle statistics', () => {
    render(<BundleImpactAnalyzerPanel />);

    expect(screen.getByText('Total Size:')).toBeInTheDocument();
    expect(screen.getByText('Gzipped:')).toBeInTheDocument();
    expect(screen.getByText('Modules:')).toBeInTheDocument();
  });

  it('shows tab labels', () => {
    render(<BundleImpactAnalyzerPanel />);

    expect(screen.getByText('Overview')).toBeInTheDocument();
    // "Modules" appears in both tabs and stats bar, so check for at least one
    expect(screen.getAllByText('Modules').length).toBeGreaterThan(0);
    expect(screen.getByText('Recommendations')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('can switch between tabs', () => {
    const onTabChange = vi.fn();
    render(<BundleImpactAnalyzerPanel onTabChange={onTabChange} />);

    // Find and click the Modules tab button via data-tab-id
    const modulesTab = document.querySelector('[data-tab-id="modules"]');
    expect(modulesTab).toBeTruthy();

    if (modulesTab) {
      fireEvent.click(modulesTab);
      expect(onTabChange).toHaveBeenCalledWith('modules');
    }
  });

  it('shows filter controls when modules exist', () => {
    render(<BundleImpactAnalyzerPanel />);

    // Should show filter bar since modules exist in mock state
    expect(screen.getByPlaceholderText('Search modules...')).toBeInTheDocument();
    expect(screen.getByText('Large Modules Only')).toBeInTheDocument();
  });

  it('renders without crashing with default props', () => {
    const { container } = render(<BundleImpactAnalyzerPanel />);
    expect(container.firstChild).toBeTruthy();
  });
});
