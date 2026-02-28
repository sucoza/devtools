import type { 
  DevToolsState, 
  DevToolsAction, 
  SecurityVulnerability, 
  SecurityScanResult,
  SecurityMetrics,
  SeverityLevel
} from '../types';
import { initialDevToolsState } from '../types/devtools';
import { generateId, getTimestamp } from '../utils';

/**
 * DevTools store for managing security audit state
 */
class SecurityAuditDevToolsStore {
  private state: DevToolsState = { ...initialDevToolsState };
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.loadPersistedState();
  }

  /**
   * Get current state snapshot
   */
  getSnapshot(): DevToolsState {
    return this.state;
  }

  /**
   * Subscribe to state changes
   */
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Dispatch action to update state
   */
  dispatch(action: DevToolsAction): void {
    this.state = this.reduce(this.state, action);
    this.notifyListeners();
    this.persistState();
  }

  /**
   * Start security scan
   */
  startScan(scannerIds?: string[]): void {
    this.dispatch({ type: 'scan/start', payload: { scannerIds } });
  }

  /**
   * Complete security scan
   */
  completeScan(scanResults: SecurityScanResult[]): void {
    this.dispatch({ type: 'scan/complete', payload: { scanResults } });
  }

  /**
   * Add vulnerability
   */
  addVulnerability(vulnerability: SecurityVulnerability): void {
    this.dispatch({ type: 'vulnerability/add', payload: vulnerability });
  }

  /**
   * Remove vulnerability
   */
  removeVulnerability(id: string): void {
    this.dispatch({ type: 'vulnerability/remove', payload: id });
  }

  /**
   * Clear all vulnerabilities
   */
  clearVulnerabilities(): void {
    this.dispatch({ type: 'vulnerabilities/clear' });
  }

  /**
   * Update scanner configuration
   */
  updateScannerConfig(scannerId: string, config: Record<string, unknown>): void {
    this.dispatch({ type: 'config/scanner/configure', payload: { scannerId, config } });
  }

  /**
   * Enable scanner
   */
  enableScanner(scannerId: string): void {
    this.dispatch({ type: 'config/scanner/enable', payload: scannerId });
  }

  /**
   * Disable scanner
   */
  disableScanner(scannerId: string): void {
    this.dispatch({ type: 'config/scanner/disable', payload: scannerId });
  }

  /**
   * State reducer
   */
  private reduce(state: DevToolsState, action: DevToolsAction): DevToolsState {
    switch (action.type) {
      // Scanning actions
      case 'scan/start':
        return {
          ...state,
          isScanning: true,
        };

      case 'scan/complete': {
        const newScanResults = action.payload.scanResults.reduce((acc, result) => {
          acc[result.scannerId] = result;
          return acc;
        }, {} as Record<string, SecurityScanResult>);

        const newVulnerabilities = action.payload.scanResults.reduce((acc, result) => {
          result.vulnerabilities.forEach(vuln => {
            acc[vuln.id] = vuln;
          });
          return acc;
        }, {} as Record<string, SecurityVulnerability>);

        const scanDuration = action.payload.scanResults.reduce((total, result) => total + result.duration, 0);
        const historyEntry = {
          id: generateId(),
          timestamp: getTimestamp(),
          duration: scanDuration,
          vulnerabilityCount: Object.keys(newVulnerabilities).length,
          highestSeverity: this.calculateHighestSeverity(Object.values(newVulnerabilities)),
          scanners: action.payload.scanResults.map(r => r.scannerId),
        };

        return {
          ...state,
          isScanning: false,
          scanResults: {
            ...state.scanResults,
            ...newScanResults,
          },
          vulnerabilities: {
            ...state.vulnerabilities,
            ...newVulnerabilities,
          },
          metrics: this.recalculateMetrics({
            ...state.vulnerabilities,
            ...newVulnerabilities,
          }),
          scanHistory: [historyEntry, ...state.scanHistory.slice(0, 49)], // Keep last 50
        };
      }

      case 'scan/error':
        return {
          ...state,
          isScanning: false,
          scanResults: {
            ...state.scanResults,
            [action.payload.scannerId]: {
              ...state.scanResults[action.payload.scannerId],
              status: 'error',
              error: action.payload.error,
            },
          },
        };

      case 'scan/cancel':
        return {
          ...state,
          isScanning: false,
        };

      case 'scan/result/add':
        return {
          ...state,
          scanResults: {
            ...state.scanResults,
            [action.payload.scannerId]: action.payload,
          },
        };

      // Vulnerability actions
      case 'vulnerability/add': {
        const updatedVulns = {
          ...state.vulnerabilities,
          [action.payload.id]: action.payload,
        };
        return {
          ...state,
          vulnerabilities: updatedVulns,
          metrics: this.recalculateMetrics(updatedVulns),
        };
      }

      case 'vulnerability/remove': {
        const { [action.payload]: _removed, ...remainingVulns } = state.vulnerabilities;
        return {
          ...state,
          vulnerabilities: remainingVulns,
          metrics: this.recalculateMetrics(remainingVulns),
          ui: {
            ...state.ui,
            selectedVulnerabilityId: state.ui.selectedVulnerabilityId === action.payload 
              ? undefined 
              : state.ui.selectedVulnerabilityId,
          },
        };
      }

      case 'vulnerabilities/clear':
        return {
          ...state,
          vulnerabilities: {},
          scanResults: {},
          metrics: this.recalculateMetrics({}),
          ui: {
            ...state.ui,
            selectedVulnerabilityId: undefined,
          },
        };

      // Configuration actions
      case 'config/update':
        return {
          ...state,
          config: {
            ...state.config,
            ...action.payload,
          },
        };

      case 'config/scanner/enable':
        return {
          ...state,
          config: {
            ...state.config,
            scanners: {
              ...state.config.scanners,
              [action.payload]: {
                ...state.config.scanners[action.payload],
                enabled: true,
              },
            },
          },
        };

      case 'config/scanner/disable':
        return {
          ...state,
          config: {
            ...state.config,
            scanners: {
              ...state.config.scanners,
              [action.payload]: {
                ...state.config.scanners[action.payload],
                enabled: false,
              },
            },
          },
        };

      case 'config/scanner/configure':
        return {
          ...state,
          config: {
            ...state.config,
            scanners: {
              ...state.config.scanners,
              [action.payload.scannerId]: {
                ...state.config.scanners[action.payload.scannerId],
                options: action.payload.config,
              },
            },
          },
        };

      case 'config/reset':
        return {
          ...state,
          config: initialDevToolsState.config,
        };

      // UI actions
      case 'ui/tab/select':
        return {
          ...state,
          ui: {
            ...state.ui,
            activeTab: action.payload,
          },
        };

      case 'ui/vulnerability/select':
        return {
          ...state,
          ui: {
            ...state.ui,
            selectedVulnerabilityId: action.payload,
          },
        };

      case 'ui/scanner/select':
        return {
          ...state,
          ui: {
            ...state.ui,
            selectedScannerId: action.payload,
          },
        };

      case 'ui/filter/severity/toggle': {
        const severityFilter = state.ui.severityFilter.includes(action.payload)
          ? state.ui.severityFilter.filter(s => s !== action.payload)
          : [...state.ui.severityFilter, action.payload];
        
        return {
          ...state,
          ui: {
            ...state.ui,
            severityFilter,
          },
        };
      }

      case 'ui/filter/category/toggle': {
        const categoryFilter = state.ui.categoryFilter.includes(action.payload)
          ? state.ui.categoryFilter.filter(c => c !== action.payload)
          : [...state.ui.categoryFilter, action.payload];
        
        return {
          ...state,
          ui: {
            ...state.ui,
            categoryFilter,
          },
        };
      }

      case 'ui/filter/search':
        return {
          ...state,
          ui: {
            ...state.ui,
            searchQuery: action.payload,
          },
        };

      case 'ui/sort/set':
        return {
          ...state,
          ui: {
            ...state.ui,
            sortBy: action.payload.sortBy,
            sortOrder: action.payload.sortOrder,
          },
        };

      case 'ui/category/expand':
        return {
          ...state,
          ui: {
            ...state.ui,
            expandedCategories: new Set([...state.ui.expandedCategories, action.payload]),
          },
        };

      case 'ui/category/collapse': {
        const newExpandedCategories = new Set(state.ui.expandedCategories);
        newExpandedCategories.delete(action.payload);
        return {
          ...state,
          ui: {
            ...state.ui,
            expandedCategories: newExpandedCategories,
          },
        };
      }

      case 'ui/theme/set':
        return {
          ...state,
          ui: {
            ...state.ui,
            theme: action.payload,
          },
        };

      case 'ui/filter/severity/show':
        return {
          ...state,
          ui: {
            ...state.ui,
            showSeverityFilter: true,
          },
        };

      case 'ui/filter/severity/hide':
        return {
          ...state,
          ui: {
            ...state.ui,
            showSeverityFilter: false,
          },
        };

      // History actions
      case 'history/add':
        return {
          ...state,
          scanHistory: [action.payload, ...state.scanHistory.slice(0, 49)],
        };

      case 'history/clear':
        return {
          ...state,
          scanHistory: [],
        };

      // Metrics actions
      case 'metrics/recalculate':
        return {
          ...state,
          metrics: this.recalculateMetrics(state.vulnerabilities),
        };

      default:
        return state;
    }
  }

  /**
   * Calculate highest severity from vulnerabilities
   */
  private calculateHighestSeverity(vulnerabilities: SecurityVulnerability[]): SeverityLevel {
    const severityOrder: SeverityLevel[] = ['critical', 'high', 'medium', 'low'];
    
    for (const severity of severityOrder) {
      if (vulnerabilities.some(v => v.severity === severity)) {
        return severity;
      }
    }
    
    return 'low';
  }

  /**
   * Recalculate metrics from vulnerabilities
   */
  private recalculateMetrics(vulnerabilities: Record<string, SecurityVulnerability>): SecurityMetrics {
    const vulnArray = Object.values(vulnerabilities);
    
    const metrics: SecurityMetrics = {
      totalVulnerabilities: vulnArray.length,
      vulnerabilitiesBySeverity: {
        low: 0,
        medium: 0,
        high: 0,
        critical: 0,
      },
      vulnerabilitiesByCategory: {
        xss: 0,
        csrf: 0,
        csp: 0,
        dependency: 0,
        secret: 0,
        tls: 0,
        authentication: 0,
        authorization: 0,
        injection: 0,
        'security-headers': 0,
        configuration: 0,
      },
      lastScanTime: this.state.metrics.lastScanTime,
      avgScanDuration: this.state.metrics.avgScanDuration,
      securityScore: 100,
    };

    // Count by severity and category
    vulnArray.forEach(vuln => {
      metrics.vulnerabilitiesBySeverity[vuln.severity]++;
      metrics.vulnerabilitiesByCategory[vuln.category]++;
    });

    // Calculate security score (simplified algorithm)
    const criticalWeight = 25;
    const highWeight = 10;
    const mediumWeight = 3;
    const lowWeight = 1;

    const totalDeductions = 
      metrics.vulnerabilitiesBySeverity.critical * criticalWeight +
      metrics.vulnerabilitiesBySeverity.high * highWeight +
      metrics.vulnerabilitiesBySeverity.medium * mediumWeight +
      metrics.vulnerabilitiesBySeverity.low * lowWeight;

    metrics.securityScore = Math.max(0, 100 - totalDeductions);

    return metrics;
  }

  /**
   * Destroy the store and release all resources
   */
  destroy(): void {
    this.listeners.clear();
    storeInstance = null;
  }

  /**
   * Load persisted state from storage
   */
  private loadPersistedState(): void {
    try {
      const stored = localStorage.getItem('security-audit-devtools-state');
      if (stored) {
        const parsedState = JSON.parse(stored);
        this.state = {
          ...this.state,
          config: parsedState.config || this.state.config,
          ui: {
            ...this.state.ui,
            theme: parsedState.ui?.theme || this.state.ui.theme,
          },
        };
      }
    } catch (error) {
      console.error('Failed to load persisted state:', error);
    }
  }

  /**
   * Persist state to storage
   */
  private persistState(): void {
    try {
      const stateToPersist = {
        config: this.state.config,
        ui: {
          theme: this.state.ui.theme,
        },
      };
      localStorage.setItem('security-audit-devtools-state', JSON.stringify(stateToPersist));
    } catch (error) {
      console.error('Failed to persist state:', error);
    }
  }

  /**
   * Notify all listeners of state changes
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener();
      } catch (error) {
        console.error('Error in SecurityAuditDevTools store listener:', error);
      }
    });
  }
}

// Singleton instance
let storeInstance: SecurityAuditDevToolsStore | null = null;

export function getSecurityAuditDevToolsStore(): SecurityAuditDevToolsStore {
  if (!storeInstance) {
    storeInstance = new SecurityAuditDevToolsStore();
  }
  return storeInstance;
}

export { SecurityAuditDevToolsStore };