import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type {
  BrowserAutomationState,
  BrowserAutomationAction,
  RecordedEvent,
  TestCase,
  GeneratedTest,
  RecordingSession,
  TestGenerationOptions,
  ExportOptions,
  EventFilters,
  RecorderSettings,
  SelectorMode,
  SelectorStrategy,
  DevToolsTab,
  RecordingMode,
  PlaybackMode,
  EventType,
} from '../types';

/**
 * Initial state for browser automation test recorder DevTools
 */
const initialState: BrowserAutomationState = {
  // Recording state
  recording: {
    isRecording: false,
    isPaused: false,
    startTime: null,
    duration: 0,
    eventCount: 0,
    activeSession: null,
    mode: 'standard',
    target: {
      type: 'page',
    },
  },

  // Playback state
  playback: {
    isPlaying: false,
    isPaused: false,
    currentEventId: null,
    speed: 1.0,
    status: {
      currentStep: 0,
      totalSteps: 0,
      elapsed: 0,
      estimated: 0,
    },
    errors: [],
    mode: 'normal',
  },

  // Events and test data
  events: [],
  testCases: [],

  // Selector engine
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

  // UI state
  ui: {
    activeTab: 'recorder',
    selectedEventId: null,
    panelsExpanded: {
      events: true,
      selectors: false,
      settings: false,
    },
    theme: 'auto',
    compact: false,
    filters: {
      eventTypes: new Set([
        'click',
        'input',
        'navigation',
        'change',
        'submit',
      ]),
      search: '',
      showOnlyErrors: false,
      hideSystem: false,
      groupBy: 'none',
    },
    splitView: false,
    sidebarWidth: 300,
  },

  // Settings
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

  // Statistics
  stats: {
    totalSessions: 0,
    totalEvents: 0,
    averageSessionDuration: 0,
    mostUsedEvents: [],
    successRate: 0,
    lastActivity: Date.now(),
    generatedTests: 0,
  },

  // Collaboration
  collaboration: {
    currentUser: null,
    team: null,
    sync: false,
    currentTeam: null,
    notifications: [],
    sharedTests: [],
    library: {
      tests: [],
      categories: [],
      templates: [],
      searchQuery: '',
      filters: {
        category: null,
        author: null,
        tags: [],
        qualityRating: null,
        createdAfter: null,
        createdBefore: null,
        lastModifiedAfter: null,
        lastModifiedBefore: null,
      },
      sortBy: 'lastModified',
      sortOrder: 'desc',
      viewMode: 'grid',
      stats: {
        totalTests: 0,
        sharedTests: 0,
        reviewsPending: 0,
      },
    },
    comments: [],
    reviews: [],
    activeShareDialog: null,
    collaborationPanel: 'library',
  },
};

/**
 * Browser automation DevTools store interface
 */
interface BrowserAutomationStore extends BrowserAutomationState {
  // Core action dispatcher
  dispatch: (action: BrowserAutomationAction) => void;

  // Recording methods
  startRecording: (mode?: RecordingMode) => void;
  stopRecording: () => void;
  pauseRecording: () => void;
  resumeRecording: () => void;
  clearRecording: () => void;
  addEvent: (event: RecordedEvent) => void;
  removeEvent: (eventId: string) => void;
  updateEvent: (eventId: string, updates: Partial<RecordedEvent>) => void;

  // Playback methods
  startPlayback: (mode?: PlaybackMode) => void;
  stopPlayback: () => void;
  pausePlayback: () => void;
  resumePlayback: () => void;
  stepPlayback: (eventId: string) => void;
  setPlaybackSpeed: (speed: number) => void;

  // Test generation methods
  generateTest: (options: TestGenerationOptions) => Promise<GeneratedTest>;
  exportData: (options: ExportOptions) => Promise<void>;
  importTestCase: (testCase: TestCase) => void;

  // Selector methods
  setSelectorMode: (mode: SelectorMode) => void;
  updateSelectorStrategy: (strategy: Partial<SelectorStrategy>) => void;
  highlightElement: (selector: string | null) => void;

  // UI methods
  selectTab: (tab: DevToolsTab) => void;
  selectEvent: (eventId: string | null) => void;
  togglePanel: (panelId: string) => void;
  updateFilters: (filters: Partial<EventFilters>) => void;
  setTheme: (theme: 'light' | 'dark' | 'auto') => void;

  // Settings methods
  updateSettings: (settings: Partial<RecorderSettings>) => void;
  resetSettings: () => void;

  // Collaboration methods
  setCollaborationPanel: (panel: string) => void;
  showShareDialog: (payload: any) => void;
  hideShareDialog: () => void;
  addNotification: (notification: any) => void;
  markNotificationRead: (id: string) => void;
  updateLibrarySearch: (query: string) => void;
  updateLibraryFilters: (filters: any) => void;
  updateLibrarySort: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
  updateLibraryView: (viewMode: 'grid' | 'list') => void;

  // Utility methods
  getFilteredEvents: () => RecordedEvent[];
  getSelectedEvent: () => RecordedEvent | null;
  getActiveSession: () => RecordingSession | null;
  updateStats: () => void;
}

/**
 * Create browser automation DevTools store
 */
export const useBrowserAutomationStore = create<BrowserAutomationStore>()(
  subscribeWithSelector((set, get) => ({
    ...initialState,

    /**
     * Main action dispatcher following TanStack DevTools patterns
     */
    dispatch: (action: BrowserAutomationAction) => {
      const _state = get();

      switch (action.type) {
        case 'recording/start': {
          const session: RecordingSession = {
            id: `session_${Date.now()}`,
            name: `Session ${new Date().toLocaleTimeString()}`,
            startTime: Date.now(),
            url: window.location.href,
            viewport: {
              width: window.innerWidth,
              height: window.innerHeight,
              devicePixelRatio: window.devicePixelRatio || 1,
              isLandscape: window.innerWidth > window.innerHeight,
              isMobile: window.innerWidth < 768,
            },
            userAgent: navigator.userAgent,
            events: [],
            metadata: {},
          };

          set(state => ({
            recording: {
              ...state.recording,
              isRecording: true,
              isPaused: false,
              startTime: Date.now(),
              activeSession: session,
            },
            stats: {
              ...state.stats,
              totalSessions: state.stats.totalSessions + 1,
              lastActivity: Date.now(),
            },
          }));
          break;
        }

        case 'recording/stop':
          set(state => ({
            recording: {
              ...state.recording,
              isRecording: false,
              isPaused: false,
              duration: state.recording.startTime
                ? Date.now() - state.recording.startTime
                : 0,
            },
          }));
          get().updateStats();
          break;

        case 'recording/pause':
          set(state => ({
            recording: { ...state.recording, isPaused: true },
          }));
          break;

        case 'recording/resume':
          set(state => ({
            recording: { ...state.recording, isPaused: false },
          }));
          break;

        case 'recording/clear':
          set(_state => ({
            recording: {
              ...initialState.recording,
            },
            events: [],
          }));
          break;

        case 'recording/event/add': {
          const newEvent = action.payload;
          set(state => ({
            events: [...state.events, newEvent],
            recording: {
              ...state.recording,
              eventCount: state.events.length + 1,
            },
            stats: {
              ...state.stats,
              totalEvents: state.stats.totalEvents + 1,
              lastActivity: Date.now(),
            },
          }));
          break;
        }

        case 'recording/event/remove': {
          const eventIdToRemove = action.payload;
          set(state => ({
            events: state.events.filter(event => event.id !== eventIdToRemove),
            recording: {
              ...state.recording,
              eventCount: state.events.filter(e => e.id !== eventIdToRemove).length,
            },
          }));
          break;
        }

        case 'recording/event/update': {
          const { id, event: eventUpdates } = action.payload;
          set(state => ({
            events: state.events.map(event =>
              event.id === id ? { ...event, ...eventUpdates } : event
            ),
          }));
          break;
        }

        case 'playback/start':
          set(state => ({
            playback: {
              ...state.playback,
              isPlaying: true,
              isPaused: false,
              status: {
                currentStep: 0,
                totalSteps: state.events.length,
                elapsed: 0,
                estimated: 0,
              },
            },
          }));
          break;

        case 'playback/stop':
          set(state => ({
            playback: {
              ...state.playback,
              isPlaying: false,
              isPaused: false,
              currentEventId: null,
            },
          }));
          break;

        case 'playback/pause':
          set(state => ({
            playback: { ...state.playback, isPaused: true },
          }));
          break;

        case 'playback/resume':
          set(state => ({
            playback: { ...state.playback, isPaused: false },
          }));
          break;

        case 'playback/step': {
          const stepEventId = action.payload;
          set(state => ({
            playback: {
              ...state.playback,
              currentEventId: stepEventId,
            },
          }));
          break;
        }

        case 'playback/speed/set': {
          const speed = action.payload;
          set(state => ({
            playback: { ...state.playback, speed },
          }));
          break;
        }

        case 'playback/status/update': {
          const status = action.payload;
          set(state => ({
            playback: { ...state.playback, status },
          }));
          break;
        }

        case 'test/generate':
          // Test generation will be handled by the generateTest method
          break;

        case 'test/export':
          // Export will be handled by the exportData method
          break;

        case 'test/import': {
          const testCase = action.payload;
          set(state => ({
            testCases: [...state.testCases, testCase],
          }));
          break;
        }

        case 'selector/mode/set': {
          const selectorMode = action.payload;
          set(state => ({
            selectorEngine: {
              ...state.selectorEngine,
              mode: selectorMode,
            },
            settings: {
              ...state.settings,
              selectorOptions: {
                ...state.settings.selectorOptions,
                mode: selectorMode,
              },
            },
          }));
          break;
        }

        case 'selector/strategy/set': {
          const strategy = action.payload;
          set(state => ({
            selectorEngine: {
              ...state.selectorEngine,
              strategy,
            },
            settings: {
              ...state.settings,
              selectorOptions: {
                ...state.settings.selectorOptions,
                strategy,
              },
            },
          }));
          break;
        }

        case 'selector/highlight': {
          const highlightSelector = action.payload;
          set(state => ({
            selectorEngine: {
              ...state.selectorEngine,
              highlightedElement: highlightSelector,
            },
          }));
          break;
        }

        case 'ui/tab/select': {
          const activeTab = action.payload;
          set(state => ({
            ui: { ...state.ui, activeTab },
          }));
          break;
        }

        case 'ui/panel/toggle': {
          const panelId = action.payload;
          set(state => ({
            ui: {
              ...state.ui,
              panelsExpanded: {
                ...state.ui.panelsExpanded,
                [panelId]: !state.ui.panelsExpanded[panelId],
              },
            },
          }));
          break;
        }

        case 'ui/theme/set': {
          const theme = action.payload;
          set(state => ({
            ui: { ...state.ui, theme },
            settings: {
              ...state.settings,
              uiOptions: { ...state.settings.uiOptions, theme },
            },
          }));
          break;
        }

        case 'ui/compact/toggle':
          set(state => ({
            ui: { ...state.ui, compact: !state.ui.compact },
          }));
          break;

        case 'ui/event/select': {
          const selectedEventId = action.payload;
          set(state => ({
            ui: { ...state.ui, selectedEventId },
          }));
          break;
        }

        case 'ui/filter/update': {
          const filterUpdates = action.payload;
          set(state => ({
            ui: {
              ...state.ui,
              filters: { ...state.ui.filters, ...filterUpdates },
            },
          }));
          break;
        }

        case 'settings/update': {
          const settingUpdates = action.payload;
          set(state => ({
            settings: { ...state.settings, ...settingUpdates },
          }));
          break;
        }

        case 'settings/reset':
          set(_state => ({
            settings: { ...initialState.settings },
          }));
          break;

        case 'settings/import': {
          const importedSettings = action.payload;
          set(_state => ({
            settings: importedSettings,
          }));
          break;
        }

        case 'settings/export':
          // Export will be handled separately
          break;

        // Collaboration actions
        case 'collaboration/user/set': {
          const user = action.payload;
          set(state => ({
            collaboration: {
              ...state.collaboration,
              currentUser: user,
            },
          }));
          break;
        }

        case 'collaboration/team/set': {
          const team = action.payload;
          set(state => ({
            collaboration: {
              ...state.collaboration,
              team,
            },
          }));
          break;
        }

        case 'collaboration/panel/set': {
          const panel = action.payload;
          set(state => ({
            collaboration: {
              ...state.collaboration,
              collaborationPanel: panel,
            },
          }));
          break;
        }

        case 'collaboration/share/show': {
          const sharePayload = action.payload;
          set(state => ({
            collaboration: {
              ...state.collaboration,
              activeShareDialog: sharePayload,
            },
          }));
          break;
        }

        case 'collaboration/share/hide':
          set(state => ({
            collaboration: {
              ...state.collaboration,
              activeShareDialog: null,
            },
          }));
          break;

        case 'collaboration/notification/add': {
          const notification = action.payload;
          set(state => ({
            collaboration: {
              ...state.collaboration,
              notifications: [notification, ...state.collaboration.notifications],
            },
          }));
          break;
        }

        case 'collaboration/notification/read': {
          const notificationId = action.payload;
          set(state => ({
            collaboration: {
              ...state.collaboration,
              notifications: state.collaboration.notifications.map(n =>
                n.id === notificationId ? { ...n, read: true } : n
              ),
            },
          }));
          break;
        }

        case 'collaboration/library/search': {
          const searchQuery = action.payload;
          set(state => ({
            collaboration: {
              ...state.collaboration,
              library: {
                ...state.collaboration.library,
                searchQuery,
              },
            },
          }));
          break;
        }

        case 'collaboration/library/filter': {
          const libraryFilterUpdates = action.payload;
          set(state => ({
            collaboration: {
              ...state.collaboration,
              library: {
                ...state.collaboration.library,
                filters: { ...state.collaboration.library.filters, ...libraryFilterUpdates },
              },
            },
          }));
          break;
        }

        case 'collaboration/library/sort': {
          const { sortBy, sortOrder } = action.payload;
          set(state => ({
            collaboration: {
              ...state.collaboration,
              library: {
                ...state.collaboration.library,
                sortBy,
                sortOrder,
              },
            },
          }));
          break;
        }

        case 'collaboration/library/view': {
          const viewMode = action.payload;
          set(state => ({
            collaboration: {
              ...state.collaboration,
              library: {
                ...state.collaboration.library,
                viewMode,
              },
            },
          }));
          break;
        }
      }
    },

    /**
     * Recording methods
     */
    startRecording: (_mode: RecordingMode = 'standard') => {
      get().dispatch({ type: 'recording/start' });
    },

    stopRecording: () => {
      get().dispatch({ type: 'recording/stop' });
    },

    pauseRecording: () => {
      get().dispatch({ type: 'recording/pause' });
    },

    resumeRecording: () => {
      get().dispatch({ type: 'recording/resume' });
    },

    clearRecording: () => {
      get().dispatch({ type: 'recording/clear' });
    },

    addEvent: (event: RecordedEvent) => {
      get().dispatch({ type: 'recording/event/add', payload: event });
    },

    removeEvent: (eventId: string) => {
      get().dispatch({ type: 'recording/event/remove', payload: eventId });
    },

    updateEvent: (eventId: string, updates: Partial<RecordedEvent>) => {
      get().dispatch({
        type: 'recording/event/update',
        payload: { id: eventId, event: updates },
      });
    },

    /**
     * Playback methods
     */
    startPlayback: (mode: PlaybackMode = 'normal') => {
      set(state => ({
        playback: { ...state.playback, mode },
      }));
      get().dispatch({ type: 'playback/start' });
    },

    stopPlayback: () => {
      get().dispatch({ type: 'playback/stop' });
    },

    pausePlayback: () => {
      get().dispatch({ type: 'playback/pause' });
    },

    resumePlayback: () => {
      get().dispatch({ type: 'playback/resume' });
    },

    stepPlayback: (eventId: string) => {
      get().dispatch({ type: 'playback/step', payload: eventId });
    },

    setPlaybackSpeed: (speed: number) => {
      get().dispatch({ type: 'playback/speed/set', payload: speed });
    },

    /**
     * Test generation methods
     */
    generateTest: async (options: TestGenerationOptions): Promise<GeneratedTest> => {
      const state = get();
      const events = state.events;

      // This would integrate with actual test generation logic
      const generatedTest: GeneratedTest = {
        id: `test_${Date.now()}`,
        name: `Generated Test ${new Date().toLocaleTimeString()}`,
        format: options.format,
        framework: options.framework,
        code: `// Generated test code would go here
// Based on ${events.length} recorded events`,
        metadata: {
          sessionId: state.recording.activeSession?.id || 'unknown',
          eventCount: events.length,
          duration: state.recording.duration,
          url: window.location.href,
          viewport: {
            width: window.innerWidth,
            height: window.innerHeight,
            devicePixelRatio: window.devicePixelRatio || 1,
            isLandscape: window.innerWidth > window.innerHeight,
            isMobile: window.innerWidth < 768,
          },
          assertions: 0,
          selectors: events.length,
        },
        createdAt: Date.now(),
      };

      set(state => ({
        stats: {
          ...state.stats,
          generatedTests: state.stats.generatedTests + 1,
        },
      }));

      return generatedTest;
    },

    exportData: async (_options: ExportOptions): Promise<void> => {
      const _state = get();
      // This would implement actual export logic
      // console.log('Exporting data with options:', options);
      // console.log('State to export:', state);
    },

    importTestCase: (testCase: TestCase) => {
      get().dispatch({ type: 'test/import', payload: testCase });
    },

    /**
     * Selector methods
     */
    setSelectorMode: (mode: SelectorMode) => {
      get().dispatch({ type: 'selector/mode/set', payload: mode });
    },

    updateSelectorStrategy: (strategy: Partial<SelectorStrategy>) => {
      const currentStrategy = get().selectorEngine.strategy;
      const updatedStrategy = { ...currentStrategy, ...strategy };
      get().dispatch({ type: 'selector/strategy/set', payload: updatedStrategy });
    },

    highlightElement: (selector: string | null) => {
      get().dispatch({ type: 'selector/highlight', payload: selector });
    },

    /**
     * UI methods
     */
    selectTab: (tab: DevToolsTab) => {
      get().dispatch({ type: 'ui/tab/select', payload: tab });
    },

    selectEvent: (eventId: string | null) => {
      get().dispatch({ type: 'ui/event/select', payload: eventId });
    },

    togglePanel: (panelId: string) => {
      get().dispatch({ type: 'ui/panel/toggle', payload: panelId });
    },

    updateFilters: (filters: Partial<EventFilters>) => {
      get().dispatch({ type: 'ui/filter/update', payload: filters });
    },

    setTheme: (theme: 'light' | 'dark' | 'auto') => {
      get().dispatch({ type: 'ui/theme/set', payload: theme });
    },

    /**
     * Settings methods
     */
    updateSettings: (settings: Partial<RecorderSettings>) => {
      get().dispatch({ type: 'settings/update', payload: settings });
    },

    resetSettings: () => {
      get().dispatch({ type: 'settings/reset' });
    },

    /**
     * Collaboration methods
     */
    setCollaborationPanel: (panel: string) => {
      get().dispatch({ type: 'collaboration/panel/set', payload: panel });
    },

    showShareDialog: (payload: any) => {
      get().dispatch({ type: 'collaboration/share/show', payload });
    },

    hideShareDialog: () => {
      get().dispatch({ type: 'collaboration/share/hide' });
    },

    addNotification: (notification: any) => {
      get().dispatch({ type: 'collaboration/notification/add', payload: notification });
    },

    markNotificationRead: (id: string) => {
      get().dispatch({ type: 'collaboration/notification/read', payload: id });
    },

    updateLibrarySearch: (query: string) => {
      get().dispatch({ type: 'collaboration/library/search', payload: query });
    },

    updateLibraryFilters: (filters: any) => {
      get().dispatch({ type: 'collaboration/library/filter', payload: filters });
    },

    updateLibrarySort: (sortBy: string, sortOrder: 'asc' | 'desc') => {
      get().dispatch({ type: 'collaboration/library/sort', payload: { sortBy, sortOrder } });
    },

    updateLibraryView: (viewMode: 'grid' | 'list') => {
      get().dispatch({ type: 'collaboration/library/view', payload: viewMode });
    },

    /**
     * Utility methods
     */
    getFilteredEvents: (): RecordedEvent[] => {
      const state = get();
      const { events } = state;
      const { filters } = state.ui;

      let filteredEvents = events;

      // Filter by event types
      if (filters.eventTypes.size > 0) {
        filteredEvents = filteredEvents.filter(event =>
          filters.eventTypes.has(event.type)
        );
      }

      // Filter by search query
      if (filters.search) {
        const query = filters.search.toLowerCase();
        filteredEvents = filteredEvents.filter(event =>
          event.type.toLowerCase().includes(query) ||
          event.target.selector.toLowerCase().includes(query) ||
          event.target.textContent?.toLowerCase().includes(query)
        );
      }

      // Filter errors only
      if (filters.showOnlyErrors) {
        // This would need to be implemented based on event error states
        // filteredEvents = filteredEvents.filter(event => event.hasError);
      }

      // Hide system events
      if (filters.hideSystem) {
        const systemEvents: EventType[] = ['scroll', 'mousemove', 'resize'];
        filteredEvents = filteredEvents.filter(event =>
          !systemEvents.includes(event.type)
        );
      }

      return filteredEvents;
    },

    getSelectedEvent: (): RecordedEvent | null => {
      const state = get();
      const { selectedEventId } = state.ui;
      if (!selectedEventId) return null;

      return state.events.find(event => event.id === selectedEventId) || null;
    },

    getActiveSession: (): RecordingSession | null => {
      return get().recording.activeSession;
    },

    updateStats: () => {
      const state = get();
      const { events, recording } = state;

      // Calculate event type frequencies
      const eventTypeCounts = new Map<EventType, number>();
      events.forEach(event => {
        const count = eventTypeCounts.get(event.type) || 0;
        eventTypeCounts.set(event.type, count + 1);
      });

      const mostUsedEvents = Array.from(eventTypeCounts.entries())
        .map(([type, count]) => ({ type, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Calculate average session duration
      const totalSessions = state.stats.totalSessions;
      const currentDuration = recording.startTime
        ? Date.now() - recording.startTime
        : 0;
      const averageSessionDuration =
        totalSessions > 0
          ? (state.stats.averageSessionDuration * (totalSessions - 1) + currentDuration) / totalSessions
          : currentDuration;

      set(state => ({
        stats: {
          ...state.stats,
          totalEvents: events.length,
          averageSessionDuration,
          mostUsedEvents,
          successRate: 100, // This would be calculated based on actual playback results
          lastActivity: Date.now(),
        },
      }));
    },
  }))
);

/**
 * Get browser automation store instance
 */
export function getBrowserAutomationStore() {
  return useBrowserAutomationStore.getState();
}

/**
 * Get browser automation store API (for subscribe/getState access)
 */
// Store instance for direct API access
const browserAutomationStore = useBrowserAutomationStore;

export function getBrowserAutomationStoreApi() {
  return browserAutomationStore;
}