import type { DevToolsState, DevToolsAction, SecurityScanResult } from '../types';
import { getSecurityAuditDevToolsStore } from './devtools-store';
import { getSecurityScanEngine, initializeSecurityScanEngine } from './security-scanner';

// Basic event client interface (simplified from @tanstack/devtools)
export interface DevToolsEventClient<TEvents extends Record<string, unknown>> {
  subscribe: (callback: (event: TEvents[keyof TEvents], type: keyof TEvents) => void) => () => void;
}

export interface SecurityAuditEvents extends Record<string, unknown> {
  'security-audit:state': DevToolsState;
  'security-audit:action': DevToolsAction;
  'security-audit:scan-complete': SecurityScanResult[];
}

export class SecurityAuditDevToolsClient implements DevToolsEventClient<SecurityAuditEvents> {
  private unsubscribe?: () => void;
  private store = getSecurityAuditDevToolsStore();
  private scanEngine?: ReturnType<typeof getSecurityScanEngine>;

  constructor() {
    // Initialize scan engine with current config
    const state = this.store.getSnapshot();
    this.scanEngine = initializeSecurityScanEngine(state.config);
    
    // Setup auto-scan
    this.setupAutoScan();
    
    // Register built-in scanners
    this.registerBuiltInScanners();
  }

  subscribe = (callback: (events: SecurityAuditEvents[keyof SecurityAuditEvents], type: keyof SecurityAuditEvents) => void) => {
    // Subscribe to store changes and emit state updates
    this.unsubscribe = this.store.subscribe(() => {
      const state = this.store.getSnapshot();
      callback(state, 'security-audit:state');
    });

    // Send initial state
    const initialState = this.store.getSnapshot();
    callback(initialState, 'security-audit:state');

    return () => {
      this.unsubscribe?.();
    };
  };

  // Handle incoming actions from DevTools
  handleAction = (action: DevToolsAction) => {
    this.store.dispatch(action);
    
    // Update scan engine config if needed
    if (action.type.startsWith('config/')) {
      const state = this.store.getSnapshot();
      this.scanEngine?.updateConfig(state.config);
    }
  };

  // Get current state
  getState = (): DevToolsState => {
    return this.store.getSnapshot();
  };

  // Control methods
  startScan = async (scannerIds?: string[]): Promise<SecurityScanResult[] | undefined> => {
    if (!this.scanEngine) return undefined;
    
    this.store.startScan(scannerIds);
    
    try {
      const results = await this.scanEngine.runScan(scannerIds);
      this.store.completeScan(results);
      return results;
    } catch (error) {
      this.store.dispatch({ 
        type: 'scan/error', 
        payload: { 
          scannerId: 'general', 
          error: error instanceof Error ? error.message : 'Unknown error' 
        } 
      });
      return undefined;
    }
  };

  cancelScan = () => {
    this.store.dispatch({ type: 'scan/cancel' });
  };

  clearVulnerabilities = () => {
    this.store.clearVulnerabilities();
  };

  enableScanner = (scannerId: string) => {
    this.store.enableScanner(scannerId);
  };

  disableScanner = (scannerId: string) => {
    this.store.disableScanner(scannerId);
  };

  configureScanners = (scannerId: string, config: Record<string, unknown>) => {
    this.store.updateScannerConfig(scannerId, config);
  };

  exportResults = (format: 'json' | 'csv' | 'html' = 'json'): string => {
    const state = this.store.getSnapshot();
    const scanResults = Object.values(state.scanResults);
    return this.scanEngine?.exportResults(scanResults, format) || '';
  };

  quickScan = async (): Promise<SecurityScanResult[] | undefined> => {
    // Quick scan runs only critical scanners
    const criticalScanners = ['xss-scanner', 'csrf-validator', 'secret-detector'];
    return this.startScan(criticalScanners);
  };

  generateReport = (): void => {
    // Generate and download a comprehensive security report
    const data = this.exportResults('html');
    const filename = `security-report-${Date.now()}.html`;

    const blob = new Blob([data], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    try {
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } finally {
      URL.revokeObjectURL(url);
    }
  };

  // UI control methods
  selectTab = (tab: DevToolsState['ui']['activeTab']) => {
    this.store.dispatch({ type: 'ui/tab/select', payload: tab });
  };

  selectVulnerability = (id: string | undefined) => {
    this.store.dispatch({ type: 'ui/vulnerability/select', payload: id });
  };

  selectScanner = (id: string | undefined) => {
    this.store.dispatch({ type: 'ui/scanner/select', payload: id });
  };

  toggleSeverityFilter = (severity: DevToolsState['ui']['severityFilter'][0]) => {
    this.store.dispatch({ type: 'ui/filter/severity/toggle', payload: severity });
  };

  toggleCategoryFilter = (category: DevToolsState['ui']['categoryFilter'][0]) => {
    this.store.dispatch({ type: 'ui/filter/category/toggle', payload: category });
  };

  updateSearchQuery = (query: string) => {
    this.store.dispatch({ type: 'ui/filter/search', payload: query });
  };

  setSort = (sortBy: DevToolsState['ui']['sortBy'], sortOrder: DevToolsState['ui']['sortOrder']) => {
    this.store.dispatch({ type: 'ui/sort/set', payload: { sortBy, sortOrder } });
  };

  setTheme = (theme: DevToolsState['ui']['theme']) => {
    this.store.dispatch({ type: 'ui/theme/set', payload: theme });
  };

  expandCategory = (category: DevToolsState['ui']['categoryFilter'][0]) => {
    this.store.dispatch({ type: 'ui/category/expand', payload: category });
  };

  collapseCategory = (category: DevToolsState['ui']['categoryFilter'][0]) => {
    this.store.dispatch({ type: 'ui/category/collapse', payload: category });
  };

  showSeverityFilter = () => {
    this.store.dispatch({ type: 'ui/filter/severity/show' });
  };

  hideSeverityFilter = () => {
    this.store.dispatch({ type: 'ui/filter/severity/hide' });
  };

  /**
   * Setup auto-scanning
   */
  private setupAutoScan(): void {
    this.scanEngine?.setupAutoScan((results) => {
      this.store.completeScan(results);
    });
  }

  /**
   * Register built-in security scanners
   */
  private async registerBuiltInScanners(): Promise<void> {
    if (!this.scanEngine) return;

    // Dynamic imports to avoid loading all scanners at once
    try {
      const [
        { XSSScanner },
        { CSRFValidator },
        { CSPAnalyzer },
        { DependencyChecker },
        { SecretDetector },
        { TLSAnalyzer },
      ] = await Promise.all([
        import('../scanners/xss-scanner'),
        import('../scanners/csrf-validator'),
        import('../scanners/csp-analyzer'),
        import('../scanners/dependency-checker'),
        import('../scanners/secret-detector'),
        import('../scanners/tls-analyzer'),
      ]);

      // Register each scanner
      this.scanEngine.registerScanner(new XSSScanner());
      this.scanEngine.registerScanner(new CSRFValidator());
      this.scanEngine.registerScanner(new CSPAnalyzer());
      this.scanEngine.registerScanner(new DependencyChecker());
      this.scanEngine.registerScanner(new SecretDetector());
      this.scanEngine.registerScanner(new TLSAnalyzer());
      
    } catch (error) {
      console.error('Failed to register some security scanners:', error);
    }
  }

  /**
   * Get available scanners
   */
  getAvailableScanners(): Array<{ id: string; name: string; description: string; category: string }> {
    return this.scanEngine?.getScanners() || [];
  }

  /**
   * Get enabled scanners
   */
  getEnabledScanners(): Array<{ id: string; name: string; description: string; category: string }> {
    return this.scanEngine?.getEnabledScanners() || [];
  }
}

let clientInstance: SecurityAuditDevToolsClient | null = null;

export function createSecurityAuditDevToolsClient(): SecurityAuditDevToolsClient {
  if (!clientInstance) {
    clientInstance = new SecurityAuditDevToolsClient();
  }
  return clientInstance;
}

export function getSecurityAuditDevToolsClient(): SecurityAuditDevToolsClient | null {
  return clientInstance;
}