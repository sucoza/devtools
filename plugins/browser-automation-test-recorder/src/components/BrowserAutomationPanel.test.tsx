/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserAutomationPanel } from './BrowserAutomationPanel';

// Mock the event client
vi.mock('../core', () => ({
  createBrowserAutomationEventClient: vi.fn(() => ({
    subscribe: vi.fn(() => vi.fn()),
    getState: vi.fn(() => ({
      recording: {
        isRecording: false,
        isPaused: false,
        startTime: null,
        duration: 0,
        eventCount: 0,
        activeSession: null,
        mode: 'standard',
        target: { type: 'page' },
      },
      playback: {
        isPlaying: false,
        isPaused: false,
        currentEventId: null,
        speed: 1.0,
        status: { currentStep: 0, totalSteps: 0, elapsed: 0, estimated: 0 },
        errors: [],
        mode: 'normal',
      },
      events: [],
      testCases: [],
      selectorEngine: {
        mode: 'auto',
        strategy: {
          priority: ['data-testid', 'id', 'aria-label', 'text', 'css'],
          fallback: true,
          optimize: true,
          includePosition: false,
        },
        customSelectors: [],
        highlightedElement: null,
        selectorStats: {
          totalGenerated: 0,
          uniqueSelectors: 0,
          averageLength: 0,
          reliabilityScore: 0,
          strategyBreakdown: {},
        },
      },
      ui: {
        activeTab: 'recorder',
        selectedEventId: null,
        panelsExpanded: { events: true, selectors: false, settings: false },
        theme: 'auto',
        compact: false,
        filters: {
          eventTypes: new Set(['click', 'input', 'navigation', 'change', 'submit']),
          search: '',
          showOnlyErrors: false,
          hideSystem: false,
          groupBy: 'none',
        },
        splitView: false,
        sidebarWidth: 300,
      },
      settings: {
        recordingOptions: {
          captureScreenshots: true,
          captureConsole: true,
          captureNetwork: false,
          capturePerformance: false,
          ignoredEvents: ['mousemove', 'scroll', 'resize'],
          debounceMs: 100,
          maxEvents: 1000,
        },
        selectorOptions: {
          mode: 'auto',
          strategy: {
            priority: ['data-testid', 'id', 'aria-label', 'text', 'css'],
            fallback: true,
            optimize: true,
            includePosition: false,
          },
          timeout: 5000,
          retries: 3,
        },
        playbackOptions: {
          defaultSpeed: 1.0,
          waitTimeout: 5000,
          screenshotOnError: true,
          continueOnError: false,
        },
        exportOptions: {
          format: 'playwright',
          includeComments: true,
          includeAssertions: true,
          includeSetup: true,
        },
        uiOptions: {
          theme: 'auto',
          showMinimap: true,
          showTimeline: true,
          autoScroll: true,
        },
      },
      stats: {
        totalSessions: 0,
        totalEvents: 0,
        averageSessionDuration: 0,
        mostUsedEvents: [],
        successRate: 0,
        lastActivity: Date.now(),
        generatedTests: 0,
      },
    })),
    dispatch: vi.fn(),
    selectTab: vi.fn(),
    startRecording: vi.fn(),
    stopRecording: vi.fn(),
    pauseRecording: vi.fn(),
    resumeRecording: vi.fn(),
    clearRecording: vi.fn(),
  })),
  getBrowserAutomationEventClient: vi.fn(),
}));

describe('BrowserAutomationPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the main DevTools panel', () => {
    render(<BrowserAutomationPanel />);
    
    expect(screen.getByTestId('browser-automation-devtools')).toBeInTheDocument();
    expect(screen.getByText('Browser Automation Test Recorder')).toBeInTheDocument();
  });

  it('displays all tab buttons', () => {
    render(<BrowserAutomationPanel />);
    
    expect(screen.getByTitle('Recorder')).toBeInTheDocument();
    expect(screen.getByTitle('Playback')).toBeInTheDocument();
    expect(screen.getByTitle('Events')).toBeInTheDocument();
    expect(screen.getByTitle('Selectors')).toBeInTheDocument();
    expect(screen.getByTitle('Tests')).toBeInTheDocument();
    expect(screen.getByTitle('Settings')).toBeInTheDocument();
  });

  it('displays recording controls in quick actions', () => {
    render(<BrowserAutomationPanel />);
    
    expect(screen.getByTitle('Start Recording')).toBeInTheDocument();
    expect(screen.getByTitle('Stop Recording')).toBeInTheDocument();
    expect(screen.getByTitle('Clear Events')).toBeInTheDocument();
  });

  it('displays status information', () => {
    render(<BrowserAutomationPanel />);
    
    expect(screen.getByText('Events:')).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument(); // Event count
  });

  it('renders with custom props', () => {
    render(
      <BrowserAutomationPanel
        theme="dark"
        compact={true}
        defaultTab="events"
        className="custom-class"
      />
    );
    
    const panel = screen.getByTestId('browser-automation-devtools');
    expect(panel).toHaveClass('custom-class', 'theme-dark', 'compact');
  });

  it('calls onTabChange when tab is clicked', async () => {
    const user = userEvent.setup();
    const onTabChange = vi.fn();
    
    render(<BrowserAutomationPanel onTabChange={onTabChange} />);
    
    const eventsTab = screen.getByTitle('Events');
    await user.click(eventsTab);
    
    expect(onTabChange).toHaveBeenCalledWith('events');
  });

  it('calls onEvent when actions are performed', async () => {
    const user = userEvent.setup();
    const onEvent = vi.fn();
    
    render(<BrowserAutomationPanel onEvent={onEvent} />);
    
    const startButton = screen.getByTitle('Start Recording');
    await user.click(startButton);
    
    expect(onEvent).toHaveBeenCalled();
  });
});