// Core Visual Regression Types
export interface Screenshot {
  id: string;
  name: string;
  url: string;
  selector?: string;
  viewport: Viewport;
  browserEngine: BrowserEngine;
  timestamp: number;
  dataUrl: string;
  metadata: ScreenshotMetadata;
  tags?: string[];
}

export interface Viewport {
  width: number;
  height: number;
  deviceScaleFactor: number;
  isMobile: boolean;
}

export interface ScreenshotMetadata {
  userAgent: string;
  pixelRatio: number;
  colorDepth: number;
  fileSize: number;
  dimensions: {
    width: number;
    height: number;
  };
  hash: string;
}

export type BrowserEngine = 'chromium' | 'firefox' | 'webkit';

export interface VisualDiff {
  id: string;
  baselineId: string;
  comparisonId: string;
  timestamp: number;
  status: DiffStatus;
  differences: DiffRegion[];
  metrics: DiffMetrics;
  threshold: number;
}

export type DiffStatus = 'passed' | 'failed' | 'pending' | 'error' | 'warning';

export interface DiffRegion {
  x: number;
  y: number;
  width: number;
  height: number;
  severity: 'low' | 'medium' | 'high';
  type: 'addition' | 'deletion' | 'modification';
}

export interface DiffMetrics {
  totalPixels: number;
  changedPixels: number;
  percentageChanged: number;
  meanColorDelta: number;
  maxColorDelta: number;
  regions: number;
}

export interface TestSuite {
  id: string;
  name: string;
  description?: string;
  screenshots: string[];
  createdAt: number;
  updatedAt: number;
  baselineScreenshotIds: string[];
}

export interface ResponsiveBreakpoint {
  name: string;
  width: number;
  height: number;
  deviceScaleFactor: number;
  isMobile: boolean;
  userAgent?: string;
}

export interface AnimationFrame {
  timestamp: number;
  screenshotId: string;
  frameNumber: number;
}

export interface AnimationSequence {
  id: string;
  name: string;
  frames: AnimationFrame[];
  duration: number;
  selector?: string;
  fps: number;
}

// DevTools State Management
export interface DevToolsState {
  // Core data
  screenshots: Record<string, Screenshot>;
  visualDiffs: Record<string, VisualDiff>;
  testSuites: Record<string, TestSuite>;
  animationSequences: Record<string, AnimationSequence>;

  // Settings
  settings: VisualRegressionSettings;

  // UI State
  ui: UIState;

  // Stats
  stats: VisualRegressionStats;

  // Status
  isCapturing: boolean;
  isAnalyzing: boolean;
  isPlaywrightConnected: boolean;
}

export interface VisualRegressionSettings {
  defaultViewport: Viewport;
  responsiveBreakpoints: ResponsiveBreakpoint[];
  diffThreshold: number;
  captureSettings: CaptureSettings;
  browserEngines: BrowserEngine[];
  autoCapture: boolean;
  animationSettings: AnimationSettings;
  storageSettings: StorageSettings;
}

export interface CaptureSettings {
  fullPage: boolean;
  hideScrollbars: boolean;
  disableAnimations: boolean;
  waitForFonts: boolean;
  waitForImages: boolean;
  delay: number;
  quality: number;
  format: 'png' | 'jpeg';
}

export interface AnimationSettings {
  defaultFps: number;
  maxDuration: number;
  captureTransitions: boolean;
  captureHovers: boolean;
}

export interface StorageSettings {
  maxScreenshots: number;
  maxDiffs: number;
  compressionEnabled: boolean;
  autoCleanup: boolean;
  retentionDays: number;
}

export interface UIState {
  activeTab: 'screenshots' | 'comparisons' | 'timeline' | 'animations' | 'settings';
  selectedScreenshotId?: string;
  selectedDiffId?: string;
  selectedSuiteId?: string;
  viewMode: 'grid' | 'list' | 'timeline';
  showDiffOverlay: boolean;
  showMetadata: boolean;
  filterSettings: FilterSettings;
  sidebarOpen: boolean;
  zoomLevel: number;
}

export interface FilterSettings {
  searchQuery: string;
  browserEngine?: BrowserEngine;
  status?: DiffStatus;
  dateRange?: {
    start: number;
    end: number;
  };
  tags?: string[];
  viewport?: string;
}

export interface VisualRegressionStats {
  totalScreenshots: number;
  totalDiffs: number;
  passedTests: number;
  failedTests: number;
  averageDiffTime: number;
  storageUsed: number;
  lastCaptureTime?: number;
  recentActivity: ActivityItem[];
}

export interface ActivityItem {
  id: string;
  type: 'screenshot' | 'diff' | 'suite_created' | 'baseline_updated';
  title: string;
  description?: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

// DevTools Actions
export type DevToolsAction =
  // Screenshot actions
  | { type: 'screenshot/add'; payload: Screenshot }
  | { type: 'screenshot/update'; payload: { id: string; updates: Partial<Screenshot> } }
  | { type: 'screenshot/remove'; payload: string }
  | { type: 'screenshot/clear' }
  | { type: 'screenshot/set_baseline'; payload: { screenshotId: string; suiteId: string } }

  // Visual diff actions
  | { type: 'diff/add'; payload: VisualDiff }
  | { type: 'diff/update'; payload: { id: string; updates: Partial<VisualDiff> } }
  | { type: 'diff/remove'; payload: string }
  | { type: 'diff/clear' }

  // Test suite actions
  | { type: 'suite/add'; payload: TestSuite }
  | { type: 'suite/update'; payload: { id: string; updates: Partial<TestSuite> } }
  | { type: 'suite/remove'; payload: string }

  // Animation actions
  | { type: 'animation/add'; payload: AnimationSequence }
  | { type: 'animation/update'; payload: { id: string; updates: Partial<AnimationSequence> } }
  | { type: 'animation/remove'; payload: string }

  // Settings actions
  | { type: 'settings/update'; payload: Partial<VisualRegressionSettings> }
  | { type: 'settings/reset' }

  // Control actions
  | { type: 'capture/start' }
  | { type: 'capture/stop' }
  | { type: 'analysis/start' }
  | { type: 'analysis/stop' }
  | { type: 'playwright/connect' }
  | { type: 'playwright/disconnect' }

  // UI actions
  | { type: 'ui/tab/select'; payload: 'screenshots' | 'comparisons' | 'timeline' | 'animations' | 'settings' }
  | { type: 'ui/screenshot/select'; payload: string | undefined }
  | { type: 'ui/diff/select'; payload: string | undefined }
  | { type: 'ui/suite/select'; payload: string | undefined }
  | { type: 'ui/view_mode/set'; payload: 'grid' | 'list' | 'timeline' }
  | { type: 'ui/diff_overlay/toggle' }
  | { type: 'ui/metadata/toggle' }
  | { type: 'ui/sidebar/toggle' }
  | { type: 'ui/zoom/set'; payload: number }
  | { type: 'ui/filter/update'; payload: Partial<FilterSettings> }

  // Stats actions
  | { type: 'stats/update'; payload: Partial<VisualRegressionStats> }
  | { type: 'stats/reset' }
  | { type: 'activity/add'; payload: ActivityItem };

// Plugin Events
export interface VisualRegressionEvents {
  'visual-regression:state': DevToolsState;
  'visual-regression:action': DevToolsAction;
  'visual-regression:screenshot': Screenshot;
  'visual-regression:diff': VisualDiff;
}

// Export/Import Types
export interface ExportData {
  version: string;
  timestamp: number;
  screenshots: Screenshot[];
  diffs: VisualDiff[];
  suites: TestSuite[];
  settings: VisualRegressionSettings;
}

// Error Types
export interface VisualRegressionError {
  code: string;
  message: string;
  details?: Record<string, any>;
  timestamp: number;
}

// Playwright Integration Types
export interface PlaywrightConfig {
  browserType: BrowserEngine;
  launchOptions: Record<string, any>;
  contextOptions: Record<string, any>;
}

export interface CaptureRequest {
  url: string;
  selector?: string;
  viewport?: Viewport;
  options?: Partial<CaptureSettings>;
  browserEngine?: BrowserEngine;
  name?: string;
  tags?: string[];
}

export interface CaptureResult {
  success: boolean;
  screenshot?: Screenshot;
  error?: VisualRegressionError;
}

export interface DiffRequest {
  baselineId: string;
  comparisonId: string;
  threshold?: number;
  options?: DiffOptions;
}

export interface DiffOptions {
  ignoreAntialiasing: boolean;
  ignoreColors: boolean;
  ignoreDifferences: boolean;
  threshold: number;
  regions?: Array<{ x: number; y: number; width: number; height: number }>;
  ignoreRegions?: boolean;
}

export interface DiffResult {
  success: boolean;
  diff?: VisualDiff;
  diffImageUrl?: string;
  error?: VisualRegressionError;
}

// Initial State
export const initialDevToolsState: DevToolsState = {
  screenshots: {},
  visualDiffs: {},
  testSuites: {},
  animationSequences: {},
  settings: {
    defaultViewport: {
      width: 1920,
      height: 1080,
      deviceScaleFactor: 1,
      isMobile: false,
    },
    responsiveBreakpoints: [
      { name: 'Mobile', width: 375, height: 667, deviceScaleFactor: 2, isMobile: true },
      { name: 'Tablet', width: 768, height: 1024, deviceScaleFactor: 1, isMobile: false },
      { name: 'Desktop', width: 1920, height: 1080, deviceScaleFactor: 1, isMobile: false },
    ],
    diffThreshold: 0.2,
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
  ui: {
    activeTab: 'screenshots',
    viewMode: 'grid',
    showDiffOverlay: true,
    showMetadata: false,
    filterSettings: {
      searchQuery: '',
    },
    sidebarOpen: true,
    zoomLevel: 1,
  },
  stats: {
    totalScreenshots: 0,
    totalDiffs: 0,
    passedTests: 0,
    failedTests: 0,
    averageDiffTime: 0,
    storageUsed: 0,
    recentActivity: [],
  },
  isCapturing: false,
  isAnalyzing: false,
  isPlaywrightConnected: false,
};