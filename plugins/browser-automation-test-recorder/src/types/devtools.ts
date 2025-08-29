/**
 * Browser Automation Test Recorder DevTools Types
 * Following TanStack DevTools plugin architecture
 */

import type { ReactNode } from 'react';

/**
 * Action types for browser automation test recorder
 */
export type BrowserAutomationAction =
  // Recording actions
  | { type: 'recording/start' }
  | { type: 'recording/stop' }
  | { type: 'recording/pause' }
  | { type: 'recording/resume' }
  | { type: 'recording/clear' }
  | { type: 'recording/event/add'; payload: RecordedEvent }
  | { type: 'recording/event/remove'; payload: string }
  | { type: 'recording/event/update'; payload: { id: string; event: Partial<RecordedEvent> } }
  
  // Playback actions
  | { type: 'playback/start' }
  | { type: 'playback/stop' }
  | { type: 'playback/pause' }
  | { type: 'playback/resume' }
  | { type: 'playback/step'; payload: string }
  | { type: 'playback/speed/set'; payload: number }
  | { type: 'playback/status/update'; payload: PlaybackStatus }
  
  // Test generation actions
  | { type: 'test/generate'; payload: TestGenerationOptions }
  | { type: 'test/export'; payload: ExportOptions }
  | { type: 'test/import'; payload: TestCase }
  | { type: 'test/validate'; payload: string }
  
  // Selector actions
  | { type: 'selector/mode/set'; payload: SelectorMode }
  | { type: 'selector/strategy/set'; payload: SelectorStrategy }
  | { type: 'selector/custom/add'; payload: CustomSelector }
  | { type: 'selector/highlight'; payload: string | null }
  
  // UI actions
  | { type: 'ui/tab/select'; payload: DevToolsTab }
  | { type: 'ui/panel/toggle'; payload: string }
  | { type: 'ui/theme/set'; payload: 'light' | 'dark' | 'auto' }
  | { type: 'ui/compact/toggle' }
  | { type: 'ui/event/select'; payload: string | null }
  | { type: 'ui/filter/update'; payload: Partial<EventFilters> }
  
  // Settings actions
  | { type: 'settings/update'; payload: Partial<RecorderSettings> }
  | { type: 'settings/reset' }
  | { type: 'settings/import'; payload: RecorderSettings }
  | { type: 'settings/export' }
  
  // Collaboration actions
  | { type: 'collaboration/share/create'; payload: SharingSettings }
  | { type: 'collaboration/share/update'; payload: { id: string; settings: Partial<SharingSettings> } }
  | { type: 'collaboration/share/delete'; payload: string }
  | { type: 'collaboration/share/show'; payload: any }
  | { type: 'collaboration/share/hide' }
  | { type: 'collaboration/comment/add'; payload: TestComment }
  | { type: 'collaboration/comment/update'; payload: { id: string; content: string } }
  | { type: 'collaboration/comment/delete'; payload: string }
  | { type: 'collaboration/review/request'; payload: { testId: string; reviewers: string[] } }
  | { type: 'collaboration/review/complete'; payload: { reviewId: string; status: ReviewStatus; comments?: string } }
  | { type: 'collaboration/team/join'; payload: string }
  | { type: 'collaboration/team/leave'; payload: string }
  | { type: 'collaboration/team/set'; payload: any }
  | { type: 'collaboration/user/set'; payload: any }
  | { type: 'collaboration/panel/set'; payload: string }
  | { type: 'collaboration/library/sync' }
  | { type: 'collaboration/library/search'; payload: string }
  | { type: 'collaboration/library/filter'; payload: any }
  | { type: 'collaboration/library/sort'; payload: { sortBy: string; sortOrder: 'asc' | 'desc' } }
  | { type: 'collaboration/library/view'; payload: 'grid' | 'list' }
  | { type: 'collaboration/notification/add'; payload: any }
  | { type: 'collaboration/notification/read'; payload: string }
  | { type: 'collaboration/notification/mark-read'; payload: string };

/**
 * Event types for browser automation test recorder
 */
export interface BrowserAutomationEvents {
  'recorder:state': BrowserAutomationState;
  'recorder:action': BrowserAutomationAction;
  'recorder:event-added': RecordedEvent;
  'recorder:playback-update': PlaybackStatus;
  'recorder:test-generated': GeneratedTest;
  'recorder:selector-highlight': { selector: string | null };
  'recorder:error': { message: string; stack?: string };
}

/**
 * DevTools tabs
 */
export type DevToolsTab = 
  | 'recorder'
  | 'playback' 
  | 'events'
  | 'selectors'
  | 'test-generator'
  | 'advanced-features'
  | 'collaboration'
  | 'settings';

/**
 * Main browser automation DevTools state
 */
export interface BrowserAutomationState {
  // Recording state
  recording: RecordingState;
  
  // Playback state
  playback: PlaybackState;
  
  // Events and test data
  events: RecordedEvent[];
  testCases: TestCase[];
  
  // Selector management
  selectorEngine: SelectorEngineState;
  
  // UI state
  ui: UIState;
  
  // Settings
  settings: RecorderSettings;
  
  // Statistics and metrics
  stats: RecorderStats;
  
  // Collaboration state
  collaboration: CollaborationState;
}

/**
 * Recording state
 */
export interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  startTime: number | null;
  duration: number;
  eventCount: number;
  activeSession: RecordingSession | null;
  mode: RecordingMode;
  target: RecordingTarget;
}

/**
 * Recording session
 */
export interface RecordingSession {
  id: string;
  name: string;
  startTime: number;
  url: string;
  viewport: { width: number; height: number };
  userAgent: string;
  events: string[]; // Event IDs
  metadata: Record<string, any>;
}

/**
 * Recording modes
 */
export type RecordingMode = 
  | 'standard'    // Standard click/type/navigate recording
  | 'smart'       // AI-enhanced with action grouping
  | 'assertions'  // Include automatic assertions
  | 'performance' // Include performance metrics
  | 'accessibility'; // Include accessibility checks

/**
 * Recording target
 */
export interface RecordingTarget {
  type: 'page' | 'element' | 'iframe';
  selector?: string;
  description?: string;
}

/**
 * Playback state
 */
export interface PlaybackState {
  isPlaying: boolean;
  isPaused: boolean;
  currentEventId: string | null;
  speed: number;
  status: PlaybackStatus;
  errors: PlaybackError[];
  mode: PlaybackMode;
}

/**
 * Playback status
 */
export interface PlaybackStatus {
  currentStep: number;
  totalSteps: number;
  elapsed: number;
  estimated: number;
  lastEventResult?: EventExecutionResult;
}

/**
 * Playback modes
 */
export type PlaybackMode = 
  | 'normal'     // Standard playback
  | 'debug'      // Step-by-step with pauses
  | 'headless'   // Fast headless execution
  | 'visual'     // With visual highlights
  | 'verify';    // With assertions enabled

/**
 * Playback error
 */
export interface PlaybackError {
  id: string;
  eventId: string;
  message: string;
  stack?: string;
  screenshot?: string;
  timestamp: number;
}

/**
 * Event execution result
 */
export interface EventExecutionResult {
  success: boolean;
  duration: number;
  error?: string;
  screenshot?: string;
  assertions?: AssertionResult[];
}

/**
 * Assertion result
 */
export interface AssertionResult {
  type: string;
  expected: any;
  actual: any;
  passed: boolean;
  message: string;
}

/**
 * Selector engine state
 */
export interface SelectorEngineState {
  mode: SelectorMode;
  strategy: SelectorStrategy;
  customSelectors: CustomSelector[];
  highlightedElement: string | null;
  selectorStats: SelectorStats;
}

/**
 * Selector modes
 */
export type SelectorMode = 
  | 'auto'       // Automatic best selector
  | 'css'        // CSS selectors only
  | 'xpath'      // XPath selectors only
  | 'text'       // Text-based selectors
  | 'data-testid' // Test ID attributes
  | 'custom';    // Custom strategy

/**
 * Selector strategies
 */
export interface SelectorStrategy {
  priority: ('id' | 'data-testid' | 'aria-label' | 'text' | 'css' | 'xpath')[];
  fallback: boolean;
  optimize: boolean;
  includePosition: boolean;
}

/**
 * Custom selector
 */
export interface CustomSelector {
  id: string;
  name: string;
  pattern: string;
  description: string;
  examples: string[];
  priority: number;
}

/**
 * Selector statistics
 */
export interface SelectorStats {
  totalGenerated: number;
  uniqueSelectors: number;
  averageLength: number;
  reliabilityScore: number;
  strategyBreakdown: Record<string, number>;
}

/**
 * UI state
 */
export interface UIState {
  activeTab: DevToolsTab;
  selectedEventId: string | null;
  panelsExpanded: Record<string, boolean>;
  theme: 'light' | 'dark' | 'auto';
  compact: boolean;
  filters: EventFilters;
  splitView: boolean;
  sidebarWidth: number;
}

/**
 * Event filters
 */
export interface EventFilters {
  eventTypes: Set<EventType>;
  search: string;
  timeRange?: [number, number];
  showOnlyErrors: boolean;
  hideSystem: boolean;
  groupBy: 'none' | 'type' | 'page' | 'element';
}

/**
 * Recorder settings
 */
export interface RecorderSettings {
  // Recording settings
  recordingOptions: {
    captureScreenshots: boolean;
    captureConsole: boolean;
    captureNetwork: boolean;
    capturePerformance: boolean;
    ignoredEvents: EventType[];
    debounceMs: number;
    maxEvents: number;
  };
  
  // Selector settings
  selectorOptions: {
    mode: SelectorMode;
    strategy: SelectorStrategy;
    timeout: number;
    retries: number;
  };
  
  // Playback settings
  playbackOptions: {
    defaultSpeed: number;
    waitTimeout: number;
    screenshotOnError: boolean;
    continueOnError: boolean;
  };
  
  // Export settings
  exportOptions: {
    format: TestFormat;
    includeComments: boolean;
    includeAssertions: boolean;
    includeSetup: boolean;
  };
  
  // UI settings
  uiOptions: {
    theme: 'light' | 'dark' | 'auto';
    showMinimap: boolean;
    showTimeline: boolean;
    autoScroll: boolean;
  };
}

/**
 * Recorder statistics
 */
export interface RecorderStats {
  totalSessions: number;
  totalEvents: number;
  averageSessionDuration: number;
  mostUsedEvents: { type: EventType; count: number }[];
  successRate: number;
  lastActivity: number;
  generatedTests: number;
}

/**
 * Test generation options
 */
export interface TestGenerationOptions {
  format: TestFormat;
  framework: TestFramework;
  includeAssertions: boolean;
  groupActions: boolean;
  addComments: boolean;
  optimizeSelectors: boolean;
}

/**
 * Test formats
 */
export type TestFormat = 
  | 'playwright'
  | 'puppeteer'
  | 'selenium'
  | 'cypress'
  | 'testcafe'
  | 'webdriver'
  | 'custom';

/**
 * Test frameworks
 */
export type TestFramework = 
  | 'jest'
  | 'mocha'
  | 'jasmine'
  | 'qunit'
  | 'vitest'
  | 'custom';

/**
 * Export options
 */
export interface ExportOptions {
  format: 'json' | 'har' | 'csv' | 'html';
  includeMetadata: boolean;
  includeScreenshots: boolean;
  compress: boolean;
}

/**
 * Generated test
 */
export interface GeneratedTest {
  id: string;
  name: string;
  format: TestFormat;
  framework: TestFramework;
  code: string;
  metadata: TestMetadata;
  createdAt: number;
}

/**
 * Test metadata
 */
export interface TestMetadata {
  sessionId: string;
  eventCount: number;
  duration: number;
  url: string;
  viewport: { width: number; height: number };
  assertions: number;
  selectors: number;
}

/**
 * Test case
 */
export interface TestCase {
  id: string;
  name: string;
  description: string;
  events: string[]; // Event IDs
  assertions: TestAssertion[];
  metadata: TestMetadata;
  createdAt: number;
  updatedAt: number;
}

/**
 * Test assertion
 */
export interface TestAssertion {
  id: string;
  type: AssertionType;
  selector: string;
  expected: any;
  description: string;
}

/**
 * Playback performance metrics
 */
export interface PlaybackMetrics {
  // Execution metrics
  totalEvents: number;
  completedEvents: number;
  failedEvents: number;
  skippedEvents: number;
  
  // Timing metrics
  totalExecutionTime: number;
  averageEventTime: number;
  minEventTime: number;
  maxEventTime: number;
  
  // Error metrics
  errorRate: number;
  recoveryRate: number;
  criticalErrors: number;
  
  // Performance metrics
  memoryUsage: number;
  cpuUsage: number;
  networkLatency: number;
  
  // Reliability metrics
  selectorSuccessRate: number;
  healingSuccessRate: number;
  retryCount: number;
}

/**
 * Assertion types
 */
export type AssertionType = 
  | 'text-equals'
  | 'text-contains'
  | 'text-matches'
  | 'value-equals'
  | 'attribute-equals'
  | 'visible'
  | 'hidden'
  | 'enabled'
  | 'disabled'
  | 'count-equals'
  | 'exists'
  | 'url-equals'
  | 'url-contains'
  | 'title-equals'
  | 'custom';

/**
 * Component props for DevTools panel
 */
export interface BrowserAutomationDevToolsPanelProps {
  className?: string;
  style?: React.CSSProperties;
  theme?: 'light' | 'dark' | 'auto';
  compact?: boolean;
  defaultTab?: DevToolsTab;
  onTabChange?: (tab: DevToolsTab) => void;
  onEvent?: (event: BrowserAutomationAction) => void;
  children?: ReactNode;
}

/**
 * Component props for individual tabs
 */
export interface TabComponentProps {
  state: BrowserAutomationState;
  dispatch: (action: BrowserAutomationAction) => void;
  compact?: boolean;
}

/**
 * Hook return types
 */
export interface UseBrowserAutomationResult {
  state: BrowserAutomationState;
  actions: {
    // Recording actions
    startRecording: () => void;
    stopRecording: () => void;
    pauseRecording: () => void;
    resumeRecording: () => void;
    clearRecording: () => void;
    
    // Playback actions
    startPlayback: () => void;
    stopPlayback: () => void;
    pausePlayback: () => void;
    resumePlayback: () => void;
    stepPlayback: (eventId: string) => void;
    setPlaybackSpeed: (speed: number) => void;
    
    // Test generation
    generateTest: (options: TestGenerationOptions) => Promise<GeneratedTest>;
    exportTest: (options: ExportOptions) => Promise<void>;
    
    // Selector management
    setSelectorMode: (mode: SelectorMode) => void;
    highlightElement: (selector: string | null) => void;
    
    // UI actions
    selectTab: (tab: DevToolsTab) => void;
    selectEvent: (eventId: string | null) => void;
    updateFilters: (filters: Partial<EventFilters>) => void;
    
    // Settings
    updateSettings: (settings: Partial<RecorderSettings>) => void;
  };
}

/**
 * Collaboration state for team features
 */
export interface CollaborationState {
  // Current user and team
  currentUser: CollaborationUser | null;
  team: CollaborationTeam | null;
  
  // Notifications and shared data
  notifications: CollaborationNotification[];
  sharedTests: SharedTestRecording[];
  
  // Library state
  library: {
    tests: any[];
    categories: any[];
    templates: any[];
    searchQuery: string;
    filters: {
      category: string | null;
      author: string | null;
      tags: string[];
      qualityRating: number | null;
      createdAfter: number | null;
      createdBefore: number | null;
      lastModifiedAfter: number | null;
      lastModifiedBefore: number | null;
    };
    sortBy: string;
    sortOrder: 'asc' | 'desc';
    viewMode: 'grid' | 'list';
  };
  
  // Comments and reviews
  comments: TestComment[];
  reviews: TestReview[];
  
  // UI state
  activeShareDialog: any | null;
  collaborationPanel: string;
}

/**
 * Collaboration UI state
 */
export interface CollaborationUIState {
  activePanel: CollaborationPanel;
  selectedTestId: string | null;
  selectedCommentId: string | null;
  showNotifications: boolean;
  showActivity: boolean;
  filters: CollaborationFilters;
  shareDialog: ShareDialogState;
  reviewDialog: ReviewDialogState;
}

/**
 * Collaboration panels
 */
export type CollaborationPanel = 
  | 'library'
  | 'shared'
  | 'comments'
  | 'reviews'
  | 'team'
  | 'activity';

/**
 * Collaboration filters
 */
export interface CollaborationFilters {
  testStatus: LibraryTestStatus[];
  categories: string[];
  authors: string[];
  tags: string[];
  dateRange: [number, number] | null;
  search: string;
}

/**
 * Share dialog state
 */
export interface ShareDialogState {
  open: boolean;
  testId: string | null;
  settings: SharingSettings | null;
  loading: boolean;
  error: string | null;
}

/**
 * Review dialog state
 */
export interface ReviewDialogState {
  open: boolean;
  testId: string | null;
  reviewers: CollaborationUser[];
  criteria: ReviewCriteria | null;
  loading: boolean;
  error: string | null;
}

/**
 * Collaboration conflict for sync resolution
 */
export interface CollaborationConflict {
  id: string;
  type: 'test' | 'comment' | 'review';
  entityId: string;
  localVersion: any;
  remoteVersion: any;
  timestamp: number;
}

// Re-export collaboration types from automation.ts
export type {
  CollaborationUser,
  UserRole,
  UserPermissions,
  CollaborationTeam,
  TeamSettings,
  SharedTestRecording,
  SharingSettings,
  TestComment,
  TestReview,
  ReviewStatus,
  ReviewCriteria,
  TestLibrary,
  LibraryTest,
  LibraryTestStatus,
  ActivityFeedItem,
  CollaborationNotification,
  EventType,
  RecordedEvent,
  TestCase,
  GeneratedTest,
  RecordingSession
} from './automation';