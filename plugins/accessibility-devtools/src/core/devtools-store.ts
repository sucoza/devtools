import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type {
  AccessibilityDevToolsState,
  AccessibilityDevToolsAction,
  AccessibilityAuditResult,
  AccessibilityIssue,
  ScanPerformanceMetrics,
  KeyboardNavigationIssue,
  ARIAValidationIssue,
  LandmarkInfo,
  FocusIssue,
} from '../types';
import { AccessibilityScanner } from './accessibility-scanner';
import { analyzeColorContrast } from '../utils/color-utils';

/**
 * Initial state for accessibility DevTools
 */
const initialState: AccessibilityDevToolsState = {
  // Core audit data
  currentAudit: null,
  auditHistory: [],
  
  // Real-time scanning
  scanState: {
    isScanning: false,
    isPaused: false,
    totalIssues: 0,
    criticalIssues: 0,
    seriousIssues: 0,
    moderateIssues: 0,
    minorIssues: 0,
  },
  scanOptions: {
    continuous: false,
    debounceMs: 1000,
    includeColorContrast: true,
    includeKeyboardNav: true,
    includeARIA: true,
    includeFocus: true,
    config: {
      wcagLevel: 'AA',
      includeExperimental: false,
    },
  },
  
  // Individual analysis results
  colorContrastResults: [],
  keyboardNavigationIssues: [],
  ariaValidationIssues: [],
  landmarks: [],
  focusIssues: [],
  
  // Visual overlay
  overlayState: {
    enabled: false,
    showViolations: true,
    showLandmarks: false,
    showFocusOrder: false,
    showColorContrast: false,
    overlayOpacity: 0.8,
  },
  
  // Performance tracking
  performanceMetrics: [],
  
  // UI state
  ui: {
    activeTab: 'overview',
    selectedIssue: null,
    selectedElement: null,
    filtersExpanded: false,
    overlayVisible: false,
    theme: 'auto',
    compactMode: false,
  },
  
  // Filtering and search
  filters: {
    severity: new Set(['critical', 'serious', 'moderate', 'minor']),
    ruleIds: new Set(),
    tags: new Set(),
    searchQuery: '',
    showOnlyNew: false,
    hideFixed: false,
  },
  
  // Settings
  settings: {
    autoScan: true,
    scanDelay: 1000,
    maxHistoryEntries: 50,
    enableOverlay: true,
    enableSounds: false,
    enableNotifications: true,
    wcagLevel: 'AA',
    includeExperimental: false,
  },
  
  // Statistics
  stats: {
    totalScans: 0,
    totalIssuesFound: 0,
    issuesFixed: 0,
    averageScanTime: 0,
    mostFrequentRules: [],
    improvementTrend: [],
  },
};

/**
 * Accessibility DevTools Zustand store
 */
interface AccessibilityDevToolsStore extends AccessibilityDevToolsState {
  // Actions
  dispatch: (action: AccessibilityDevToolsAction) => void;

  // Scanner methods
  startScanning: (elementSelector?: string) => Promise<void>;
  stopScanning: () => void;
  pauseScanning: () => void;
  resumeScanning: () => void;

  // Convenience methods (used by event client)
  toggleScanning: () => void;
  runAudit: () => void;
  selectAuditResult: (id: string | null) => void;
  dismissViolation: (id: string) => void;
  updateFilters: (filters: Partial<AccessibilityDevToolsState['filters']>) => void;
  updateSettings: (settings: Partial<AccessibilityDevToolsState['settings']>) => void;
  selectTab: (tab: AccessibilityDevToolsState['ui']['activeTab']) => void;
  setTheme: (theme: 'light' | 'dark' | 'auto') => void;
  toggleCompactMode: () => void;

  // Analysis methods
  runColorContrastAnalysis: () => void;
  runKeyboardNavAnalysis: () => void;
  runARIAValidation: () => void;
  runLandmarksAnalysis: () => void;
  runFocusAnalysis: () => void;

  // Utility methods
  updateStats: (audit: AccessibilityAuditResult, metrics: ScanPerformanceMetrics) => void;
  addToHistory: (audit: AccessibilityAuditResult) => void;
  getFilteredIssues: () => AccessibilityIssue[];
}

/**
 * Create accessibility DevTools store
 */
export const useAccessibilityDevToolsStore = create<AccessibilityDevToolsStore>()(
  subscribeWithSelector((set, get) => {
    let scanner: AccessibilityScanner | null = null;
    
    const getScanner = () => {
      if (!scanner) {
        const state = get();
        scanner = new AccessibilityScanner(state.scanOptions.config);
      }
      return scanner;
    };
    
    return {
      ...initialState,
      
      /**
       * Dispatch actions to update state
       */
      dispatch: (action: AccessibilityDevToolsAction) => {
        const _state = get();
        
        switch (action.type) {
          case 'scan/start':
            set(state => ({
              scanState: { ...state.scanState, isScanning: true, isPaused: false },
            }));
            break;
            
          case 'scan/complete': {
            const audit = action.payload;
            const violations = audit.violations.length;
            const critical = audit.violations.filter(v => v.impact === 'critical').length;
            const serious = audit.violations.filter(v => v.impact === 'serious').length;
            const moderate = audit.violations.filter(v => v.impact === 'moderate').length;
            const minor = audit.violations.filter(v => v.impact === 'minor').length;
            
            set(state => ({
              currentAudit: audit,
              scanState: {
                ...state.scanState,
                isScanning: false,
                lastScanTime: Date.now(),
                totalIssues: violations,
                criticalIssues: critical,
                seriousIssues: serious,
                moderateIssues: moderate,
                minorIssues: minor,
              },
              stats: {
                ...state.stats,
                totalScans: state.stats.totalScans + 1,
                totalIssuesFound: state.stats.totalIssuesFound + violations,
              },
            }));
            
            // Add to history
            get().addToHistory(audit);
            break;
          }
            
          case 'scan/pause':
            set(state => ({
              scanState: { ...state.scanState, isPaused: true },
            }));
            break;
            
          case 'scan/resume':
            set(state => ({
              scanState: { ...state.scanState, isPaused: false },
            }));
            break;
            
          case 'scan/stop':
            set(state => ({
              scanState: { ...state.scanState, isScanning: false, isPaused: false },
            }));
            break;
            
          case 'scan/error':
            set(state => ({
              scanState: {
                ...state.scanState,
                isScanning: false,
                errors: [...(state.scanState.errors || []), action.payload],
              },
            }));
            break;
            
          case 'options/update':
            set(state => ({
              scanOptions: { ...state.scanOptions, ...action.payload },
            }));
            // Update scanner config
            if (scanner && action.payload.config) {
              scanner.updateConfig(action.payload.config);
            }
            break;
            
          case 'settings/update':
            set(state => ({
              settings: { ...state.settings, ...action.payload },
            }));
            break;
            
          case 'ui/tab/select':
            set(state => ({
              ui: { ...state.ui, activeTab: action.payload },
            }));
            break;
            
          case 'ui/issue/select':
            set(state => ({
              ui: { ...state.ui, selectedIssue: action.payload },
            }));
            break;
            
          case 'ui/element/select':
          case 'ui/element/highlight':
            set(state => ({
              ui: { ...state.ui, selectedElement: action.payload },
            }));
            break;
            
          case 'ui/filters/toggle':
            set(state => ({
              ui: { ...state.ui, filtersExpanded: !state.ui.filtersExpanded },
            }));
            break;
            
          case 'ui/overlay/toggle':
            set(state => ({
              ui: { ...state.ui, overlayVisible: !state.ui.overlayVisible },
              overlayState: { ...state.overlayState, enabled: !state.overlayState.enabled },
            }));
            break;
            
          case 'ui/theme/set':
            set(state => ({
              ui: { ...state.ui, theme: action.payload },
            }));
            break;
            
          case 'ui/compact-mode/toggle':
            set(state => ({
              ui: { ...state.ui, compactMode: !state.ui.compactMode },
            }));
            break;
            
          case 'filters/severity/toggle':
            set(state => {
              const newSeverity = new Set(state.filters.severity);
              if (newSeverity.has(action.payload)) {
                newSeverity.delete(action.payload);
              } else {
                newSeverity.add(action.payload);
              }
              return {
                filters: { ...state.filters, severity: newSeverity },
              };
            });
            break;
            
          case 'filters/rule/toggle':
            set(state => {
              const newRuleIds = new Set(state.filters.ruleIds);
              if (newRuleIds.has(action.payload)) {
                newRuleIds.delete(action.payload);
              } else {
                newRuleIds.add(action.payload);
              }
              return {
                filters: { ...state.filters, ruleIds: newRuleIds },
              };
            });
            break;
            
          case 'filters/tag/toggle':
            set(state => {
              const newTags = new Set(state.filters.tags);
              if (newTags.has(action.payload)) {
                newTags.delete(action.payload);
              } else {
                newTags.add(action.payload);
              }
              return {
                filters: { ...state.filters, tags: newTags },
              };
            });
            break;
            
          case 'filters/search/update':
            set(state => ({
              filters: { ...state.filters, searchQuery: action.payload },
            }));
            break;
            
          case 'filters/reset':
            set(_state => ({
              filters: {
                ...initialState.filters,
                severity: new Set(['critical', 'serious', 'moderate', 'minor']),
                ruleIds: new Set(),
                tags: new Set(),
              },
            }));
            break;
            
          case 'overlay/toggle':
            set(state => ({
              overlayState: { ...state.overlayState, ...action.payload },
            }));
            break;
            
          case 'overlay/highlight':
            set(state => ({
              overlayState: { ...state.overlayState, highlightElement: action.payload },
            }));
            break;
            
          case 'overlay/opacity/set':
            set(state => ({
              overlayState: { ...state.overlayState, overlayOpacity: action.payload },
            }));
            break;
            
          case 'history/clear':
            set(_state => ({ auditHistory: [] }));
            break;
            
          case 'history/remove':
            set(state => ({
              auditHistory: state.auditHistory.filter((_, index) => index !== action.payload),
            }));
            break;
            
          case 'history/import':
            set(state => ({
              auditHistory: [...state.auditHistory, ...action.payload],
            }));
            break;
            
          case 'performance/record':
            set(state => ({
              performanceMetrics: [...state.performanceMetrics, action.payload].slice(-100),
            }));
            break;
            
          case 'performance/clear':
            set(_state => ({ performanceMetrics: [] }));
            break;
            
          case 'color-contrast/update':
            set(_state => ({ colorContrastResults: action.payload }));
            break;
            
          case 'keyboard-nav/update':
            set(_state => ({ keyboardNavigationIssues: action.payload }));
            break;
            
          case 'aria-validation/update':
            set(_state => ({ ariaValidationIssues: action.payload }));
            break;
            
          case 'landmarks/update':
            set(_state => ({ landmarks: action.payload }));
            break;
            
          case 'focus-issues/update':
            set(_state => ({ focusIssues: action.payload }));
            break;
        }
      },
      
      /**
       * Start accessibility scanning
       */
      startScanning: async (elementSelector?: string) => {
        const state = get();
        const scannerInstance = getScanner();
        
        try {
          get().dispatch({ type: 'scan/start', payload: { elementSelector } });
          
          // Run the scan
          const element = elementSelector 
            ? document.querySelector(elementSelector) || document 
            : document;
            
          const result = await scannerInstance.scan(element, state.scanOptions);
          
          // Record performance metrics
          const metrics: ScanPerformanceMetrics = {
            scanDuration: 0, // Would be measured in scanner
            rulesRun: 0,
            elementsScanned: document.querySelectorAll('*').length,
            timestamp: Date.now(),
          };
          
          get().dispatch({ type: 'performance/record', payload: metrics });
          get().dispatch({ type: 'scan/complete', payload: result });
          get().updateStats(result, metrics);
          
          // Run additional analyses if enabled
          if (state.scanOptions.includeColorContrast) {
            get().runColorContrastAnalysis();
          }
          
        } catch (error) {
          get().dispatch({ type: 'scan/error', payload: String(error) });
        }
      },
      
      /**
       * Stop scanning
       */
      stopScanning: () => {
        const scannerInstance = getScanner();
        scannerInstance.stopContinuousScanning();
        get().dispatch({ type: 'scan/stop' });
      },
      
      /**
       * Pause scanning
       */
      pauseScanning: () => {
        get().dispatch({ type: 'scan/pause' });
      },

      /**
       * Resume scanning
       */
      resumeScanning: () => {
        get().dispatch({ type: 'scan/resume' });
      },

      /**
       * Toggle scanning on/off
       */
      toggleScanning: () => {
        const state = get();
        if (state.scanState.isScanning) {
          get().stopScanning();
        } else {
          get().startScanning();
        }
      },

      /**
       * Run a full accessibility audit
       */
      runAudit: () => {
        get().startScanning();
      },

      /**
       * Select an audit result by ID
       */
      selectAuditResult: (id: string | null) => {
        const state = get();
        const issue = id && state.currentAudit
          ? state.currentAudit.violations.find(v => v.id === id) ?? null
          : null;
        get().dispatch({ type: 'ui/issue/select', payload: issue });
      },

      /**
       * Dismiss a violation by ID
       */
      dismissViolation: (id: string) => {
        set(state => {
          if (!state.currentAudit) return state;
          return {
            currentAudit: {
              ...state.currentAudit,
              violations: state.currentAudit.violations.filter(v => v.id !== id),
            },
          };
        });
      },

      /**
       * Update filter settings
       */
      updateFilters: (filters: Partial<AccessibilityDevToolsState['filters']>) => {
        set(state => ({
          filters: { ...state.filters, ...filters },
        }));
      },

      /**
       * Update settings
       */
      updateSettings: (settings: Partial<AccessibilityDevToolsState['settings']>) => {
        get().dispatch({ type: 'settings/update', payload: settings });
      },

      /**
       * Select a tab
       */
      selectTab: (tab: AccessibilityDevToolsState['ui']['activeTab']) => {
        get().dispatch({ type: 'ui/tab/select', payload: tab });
      },

      /**
       * Set theme
       */
      setTheme: (theme: 'light' | 'dark' | 'auto') => {
        get().dispatch({ type: 'ui/theme/set', payload: theme });
      },

      /**
       * Toggle compact mode
       */
      toggleCompactMode: () => {
        get().dispatch({ type: 'ui/compact-mode/toggle' });
      },
      
      /**
       * Run color contrast analysis
       */
      runColorContrastAnalysis: () => {
        const results = analyzeColorContrast();
        get().dispatch({ type: 'color-contrast/update', payload: results });
      },
      
      /**
       * Run keyboard navigation analysis
       */
      runKeyboardNavAnalysis: () => {
        // Implementation would analyze keyboard navigation
        const issues: KeyboardNavigationIssue[] = [];
        get().dispatch({ type: 'keyboard-nav/update', payload: issues });
      },
      
      /**
       * Run ARIA validation
       */
      runARIAValidation: () => {
        // Implementation would validate ARIA attributes
        const issues: ARIAValidationIssue[] = [];
        get().dispatch({ type: 'aria-validation/update', payload: issues });
      },
      
      /**
       * Run landmarks analysis
       */
      runLandmarksAnalysis: () => {
        // Implementation would analyze page structure
        const landmarks: LandmarkInfo[] = [];
        get().dispatch({ type: 'landmarks/update', payload: landmarks });
      },
      
      /**
       * Run focus analysis
       */
      runFocusAnalysis: () => {
        // Implementation would analyze focus issues
        const issues: FocusIssue[] = [];
        get().dispatch({ type: 'focus-issues/update', payload: issues });
      },
      
      /**
       * Update statistics
       */
      updateStats: (audit: AccessibilityAuditResult, metrics: ScanPerformanceMetrics) => {
        set(state => {
          // totalScans was already incremented by 'scan/complete' dispatch, so use it directly
          const currentTotalScans = state.stats.totalScans;
          const newAverageScanTime = currentTotalScans > 0
            ? (state.stats.averageScanTime * (currentTotalScans - 1) + metrics.scanDuration) / currentTotalScans
            : metrics.scanDuration;
          
          // Update rule frequency
          const ruleFrequency = new Map(state.stats.mostFrequentRules.map(r => [r.rule, r.count]));
          audit.violations.forEach(violation => {
            ruleFrequency.set(violation.rule, (ruleFrequency.get(violation.rule) || 0) + 1);
          });
          
          const mostFrequentRules = Array.from(ruleFrequency.entries())
            .map(([rule, count]) => ({ rule, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);
          
          // Add to improvement trend
          const newTrendPoint = {
            timestamp: audit.timestamp,
            issueCount: audit.violations.length,
          };
          
          const improvementTrend = [...state.stats.improvementTrend, newTrendPoint]
            .slice(-50); // Keep last 50 data points
          
          return {
            stats: {
              ...state.stats,
              averageScanTime: newAverageScanTime,
              mostFrequentRules,
              improvementTrend,
            },
          };
        });
      },
      
      /**
       * Add audit to history
       */
      addToHistory: (audit: AccessibilityAuditResult) => {
        set(state => {
          const maxEntries = state.settings.maxHistoryEntries;
          const newHistory = [audit, ...state.auditHistory].slice(0, maxEntries);
          return { auditHistory: newHistory };
        });
      },
      
      /**
       * Get filtered accessibility issues
       */
      getFilteredIssues: (): AccessibilityIssue[] => {
        const state = get();
        if (!state.currentAudit) return [];
        
        let issues = state.currentAudit.violations;
        
        // Filter by severity
        if (state.filters.severity.size > 0 && state.filters.severity.size < 4) {
          issues = issues.filter(issue => state.filters.severity.has(issue.impact));
        }
        
        // Filter by rule IDs
        if (state.filters.ruleIds.size > 0) {
          issues = issues.filter(issue => state.filters.ruleIds.has(issue.rule));
        }
        
        // Filter by tags
        if (state.filters.tags.size > 0) {
          issues = issues.filter(issue => 
            issue.tags.some(tag => state.filters.tags.has(tag))
          );
        }
        
        // Filter by search query
        if (state.filters.searchQuery) {
          const query = state.filters.searchQuery.toLowerCase();
          issues = issues.filter(issue =>
            issue.description.toLowerCase().includes(query) ||
            issue.help.toLowerCase().includes(query) ||
            issue.rule.toLowerCase().includes(query)
          );
        }
        
        return issues;
      },
    };
  })
);

/**
 * Get accessibility DevTools store instance
 */
export function getAccessibilityDevToolsStore() {
  return useAccessibilityDevToolsStore.getState();
}