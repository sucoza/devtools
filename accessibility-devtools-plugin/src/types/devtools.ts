import type {
  AccessibilityAuditResult,
  AccessibilityIssue,
  ScanState,
  OverlayState,
  ScanOptions,
  ScanPerformanceMetrics,
  ColorContrastResult,
  KeyboardNavigationIssue,
  ARIAValidationIssue,
  LandmarkInfo,
  FocusIssue,
} from './accessibility';

// DevTools state management
export interface AccessibilityDevToolsState {
  // Core audit data
  currentAudit: AccessibilityAuditResult | null;
  auditHistory: AccessibilityAuditResult[];
  
  // Real-time scanning
  scanState: ScanState;
  scanOptions: ScanOptions;
  
  // Individual analysis results
  colorContrastResults: ColorContrastResult[];
  keyboardNavigationIssues: KeyboardNavigationIssue[];
  ariaValidationIssues: ARIAValidationIssue[];
  landmarks: LandmarkInfo[];
  focusIssues: FocusIssue[];
  
  // Visual overlay
  overlayState: OverlayState;
  
  // Performance tracking
  performanceMetrics: ScanPerformanceMetrics[];
  
  // UI state
  ui: {
    activeTab: 'overview' | 'violations' | 'color-contrast' | 'keyboard' | 'aria' | 'landmarks' | 'focus';
    selectedIssue: AccessibilityIssue | null;
    selectedElement: string | null;
    filtersExpanded: boolean;
    overlayVisible: boolean;
    theme: 'light' | 'dark' | 'auto';
    compactMode: boolean;
  };
  
  // Filtering and search
  filters: {
    severity: Set<'critical' | 'serious' | 'moderate' | 'minor'>;
    ruleIds: Set<string>;
    tags: Set<string>;
    searchQuery: string;
    showOnlyNew: boolean;
    hideFixed: boolean;
  };
  
  // Settings
  settings: {
    autoScan: boolean;
    scanDelay: number;
    maxHistoryEntries: number;
    enableOverlay: boolean;
    enableSounds: boolean;
    enableNotifications: boolean;
    wcagLevel: 'A' | 'AA' | 'AAA';
    includeExperimental: boolean;
  };
  
  // Statistics
  stats: {
    totalScans: number;
    totalIssuesFound: number;
    issuesFixed: number;
    averageScanTime: number;
    mostFrequentRules: Array<{ rule: string; count: number }>;
    improvementTrend: Array<{ timestamp: number; issueCount: number }>;
  };
}

// DevTools actions
export type AccessibilityDevToolsAction =
  // Scanning actions
  | { type: 'scan/start'; payload?: { elementSelector?: string } }
  | { type: 'scan/complete'; payload: AccessibilityAuditResult }
  | { type: 'scan/pause' }
  | { type: 'scan/resume' }
  | { type: 'scan/stop' }
  | { type: 'scan/error'; payload: string }
  
  // Options actions
  | { type: 'options/update'; payload: Partial<ScanOptions> }
  | { type: 'settings/update'; payload: Partial<AccessibilityDevToolsState['settings']> }
  
  // UI actions
  | { type: 'ui/tab/select'; payload: AccessibilityDevToolsState['ui']['activeTab'] }
  | { type: 'ui/issue/select'; payload: AccessibilityIssue | null }
  | { type: 'ui/element/select'; payload: string | null }
  | { type: 'ui/element/highlight'; payload: string | null }
  | { type: 'ui/filters/toggle' }
  | { type: 'ui/overlay/toggle' }
  | { type: 'ui/theme/set'; payload: 'light' | 'dark' | 'auto' }
  | { type: 'ui/compact-mode/toggle' }
  
  // Filter actions
  | { type: 'filters/severity/toggle'; payload: 'critical' | 'serious' | 'moderate' | 'minor' }
  | { type: 'filters/rule/toggle'; payload: string }
  | { type: 'filters/tag/toggle'; payload: string }
  | { type: 'filters/search/update'; payload: string }
  | { type: 'filters/reset' }
  
  // Overlay actions
  | { type: 'overlay/toggle'; payload?: Partial<OverlayState> }
  | { type: 'overlay/highlight'; payload: string | null }
  | { type: 'overlay/opacity/set'; payload: number }
  
  // History actions
  | { type: 'history/clear' }
  | { type: 'history/remove'; payload: number }
  | { type: 'history/export' }
  | { type: 'history/import'; payload: AccessibilityAuditResult[] }
  
  // Performance actions
  | { type: 'performance/record'; payload: ScanPerformanceMetrics }
  | { type: 'performance/clear' }
  
  // Individual analysis results
  | { type: 'color-contrast/update'; payload: ColorContrastResult[] }
  | { type: 'keyboard-nav/update'; payload: KeyboardNavigationIssue[] }
  | { type: 'aria-validation/update'; payload: ARIAValidationIssue[] }
  | { type: 'landmarks/update'; payload: LandmarkInfo[] }
  | { type: 'focus-issues/update'; payload: FocusIssue[] };

// Event client events
export interface AccessibilityDevToolsEvents {
  'accessibility:state': AccessibilityDevToolsState;
  'accessibility:action': AccessibilityDevToolsAction;
  'accessibility:audit-started': { timestamp: number; elementSelector?: string };
  'accessibility:audit-complete': { audit: AccessibilityAuditResult; metrics: ScanPerformanceMetrics };
  'accessibility:issue-found': { issue: AccessibilityIssue; isNew: boolean };
  'accessibility:overlay-toggle': { enabled: boolean; state: OverlayState };
  'accessibility:element-highlight': { selector: string | null };
}

// Plugin configuration
export interface AccessibilityDevToolsConfig {
  autoStart: boolean;
  persistState: boolean;
  storageKey: string;
  maxHistorySize: number;
  enableOverlay: boolean;
  defaultScanOptions: Partial<ScanOptions>;
  onAuditComplete?: (audit: AccessibilityAuditResult) => void;
  onIssueFound?: (issue: AccessibilityIssue) => void;
}