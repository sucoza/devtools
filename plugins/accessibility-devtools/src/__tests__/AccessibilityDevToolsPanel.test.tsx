import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AccessibilityDevToolsPanel } from '../components/AccessibilityDevToolsPanel';

// Mock the hook
vi.mock('../hooks/useAccessibilityAudit', () => ({
  useAccessibilityAudit: () => ({
    // State
    currentAudit: null,
    auditHistory: [],
    scanState: { isScanning: false, isPaused: false, status: 'idle' as const },
    scanOptions: {
      enabled: true,
      realTimeScanning: false,
      wcagLevel: 'AA' as const,
      includeIncomplete: false,
      runOnlyRules: null,
      skipRules: null,
    },
    ui: {
      activeTab: 'issues' as const,
      isMinimized: false,
      showSettings: false,
      theme: 'system' as const,
      sidebarOpen: true,
      selectedIssue: null,
    },
    selectedIssue: null,
    filteredIssues: [],
    filters: {
      severity: new Set(['critical', 'serious', 'moderate', 'minor']),
      ruleIds: new Set(),
      tags: new Set(),
      searchQuery: '',
      showOnlyNew: false,
      hideFixed: false,
    },
    settings: {
      realTimeScanning: false,
      wcagLevel: 'AA' as const,
      includeIncomplete: false,
      autoHighlight: true,
      soundEnabled: false,
      autoScan: false,
      scanDelay: 1000,
    },
    // Actions
    startScan: vi.fn(),
    stopScan: vi.fn(),
    pauseScan: vi.fn(),
    resumeScan: vi.fn(),
    updateScanOptions: vi.fn(),
    updateSettings: vi.fn(),
    selectTab: vi.fn(),
    // Issue management
    selectIssue: vi.fn(),
    selectNextIssue: vi.fn(),
    selectPreviousIssue: vi.fn(),
    highlightElement: vi.fn(),
    // Filtering
    toggleSeverityFilter: vi.fn(),
    toggleRuleFilter: vi.fn(),
    toggleTagFilter: vi.fn(),
    updateSearchFilter: vi.fn(),
    resetFilters: vi.fn(),
    // History
    clearHistory: vi.fn(),
    removeHistoryEntry: vi.fn(),
    // Statistics
    getIssueStats: vi.fn().mockReturnValue({
      total: 0,
      critical: 0,
      serious: 0,
      moderate: 0,
      minor: 0,
    }),
    getFilteredStats: vi.fn().mockReturnValue({
      total: 0,
      critical: 0,
      serious: 0,
      moderate: 0,
      minor: 0,
    }),
    getUniqueRuleIds: vi.fn().mockReturnValue([]),
    getUniqueTags: vi.fn().mockReturnValue([]),
  }),
}));

describe('AccessibilityDevToolsPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('should render without crashing', () => {
    render(<AccessibilityDevToolsPanel />);
    expect(screen.getByText('Accessibility Auditor')).toBeInTheDocument();
  });

  test('should accept className prop', () => {
    const { container } = render(<AccessibilityDevToolsPanel className="test-class" />);
    expect(container.firstChild).toHaveClass('test-class');
  });

  test('should display scan controls', () => {
    const { container } = render(<AccessibilityDevToolsPanel />);

    // Scan controls are in a ConfigMenu dropdown - verify the config menu container exists
    const configMenuContainer = container.querySelector('.config-menu-container');
    expect(configMenuContainer).toBeInTheDocument();
  });

  test('should display tabs navigation', () => {
    render(<AccessibilityDevToolsPanel />);
    
    // Check for main tab buttons - look for general tab indicators
    const tabButtons = screen.getAllByRole('button');
    expect(tabButtons.length).toBeGreaterThan(2); // Should have multiple tab buttons
  });

  test('should show issue statistics', () => {
    render(<AccessibilityDevToolsPanel />);
    
    // Should display some form of issue count (even if 0)
    const issueText = screen.getByText(/Total Issues:/);
    expect(issueText).toBeInTheDocument();
  });
});