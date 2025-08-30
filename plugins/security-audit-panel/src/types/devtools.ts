import type {
  SecurityVulnerability,
  SecurityScanResult,
  SecurityAuditConfig,
  SecurityMetrics,
  VulnerabilityCategory,
  SeverityLevel
} from './security';

export interface DevToolsState {
  // Core scanning state
  isScanning: boolean;
  scanResults: Record<string, SecurityScanResult>;
  vulnerabilities: Record<string, SecurityVulnerability>;
  
  // Configuration
  config: SecurityAuditConfig;
  
  // Metrics and analytics
  metrics: SecurityMetrics;
  
  // UI state
  ui: {
    activeTab: 'dashboard' | 'vulnerabilities' | 'scanners' | 'reports' | 'settings';
    selectedVulnerabilityId?: string;
    selectedScannerId?: string;
    showSeverityFilter: boolean;
    severityFilter: SeverityLevel[];
    categoryFilter: VulnerabilityCategory[];
    searchQuery: string;
    sortBy: 'severity' | 'category' | 'detected' | 'title';
    sortOrder: 'asc' | 'desc';
    expandedCategories: Set<VulnerabilityCategory>;
    theme: 'light' | 'dark' | 'auto';
  };
  
  // Scan history
  scanHistory: Array<{
    id: string;
    timestamp: number;
    duration: number;
    vulnerabilityCount: number;
    highestSeverity: SeverityLevel;
    scanners: string[];
  }>;
  
  // Export/import
  lastExportTime?: number;
  lastImportTime?: number;
}

export type DevToolsAction =
  // Scanning actions
  | { type: 'scan/start'; payload?: { scannerIds?: string[] } }
  | { type: 'scan/complete'; payload: { scanResults: SecurityScanResult[] } }
  | { type: 'scan/error'; payload: { scannerId: string; error: string } }
  | { type: 'scan/cancel' }
  | { type: 'scan/result/add'; payload: SecurityScanResult }
  | { type: 'scan/result/update'; payload: { id: string; updates: Partial<SecurityScanResult> } }
  
  // Vulnerability actions
  | { type: 'vulnerability/add'; payload: SecurityVulnerability }
  | { type: 'vulnerability/remove'; payload: string }
  | { type: 'vulnerability/update'; payload: { id: string; updates: Partial<SecurityVulnerability> } }
  | { type: 'vulnerabilities/clear' }
  | { type: 'vulnerability/dismiss'; payload: string }
  | { type: 'vulnerability/restore'; payload: string }
  
  // Configuration actions
  | { type: 'config/update'; payload: Partial<SecurityAuditConfig> }
  | { type: 'config/scanner/enable'; payload: string }
  | { type: 'config/scanner/disable'; payload: string }
  | { type: 'config/scanner/configure'; payload: { scannerId: string; config: Record<string, unknown> } }
  | { type: 'config/reset' }
  
  // Metrics actions
  | { type: 'metrics/update'; payload: Partial<SecurityMetrics> }
  | { type: 'metrics/recalculate' }
  
  // UI actions
  | { type: 'ui/tab/select'; payload: DevToolsState['ui']['activeTab'] }
  | { type: 'ui/vulnerability/select'; payload: string | undefined }
  | { type: 'ui/scanner/select'; payload: string | undefined }
  | { type: 'ui/filter/severity/toggle'; payload: SeverityLevel }
  | { type: 'ui/filter/category/toggle'; payload: VulnerabilityCategory }
  | { type: 'ui/filter/search'; payload: string }
  | { type: 'ui/sort/set'; payload: { sortBy: DevToolsState['ui']['sortBy']; sortOrder: DevToolsState['ui']['sortOrder'] } }
  | { type: 'ui/category/expand'; payload: VulnerabilityCategory }
  | { type: 'ui/category/collapse'; payload: VulnerabilityCategory }
  | { type: 'ui/theme/set'; payload: DevToolsState['ui']['theme'] }
  | { type: 'ui/filter/severity/show' }
  | { type: 'ui/filter/severity/hide' }
  
  // History actions
  | { type: 'history/add'; payload: DevToolsState['scanHistory'][0] }
  | { type: 'history/clear' }
  
  // Export/Import actions
  | { type: 'export/start' }
  | { type: 'export/complete' }
  | { type: 'import/start' }
  | { type: 'import/complete' };

export const initialDevToolsState: DevToolsState = {
  isScanning: false,
  scanResults: {},
  vulnerabilities: {},
  
  config: {
    scanners: {
      'xss-scanner': { enabled: true, autoScan: false },
      'csrf-validator': { enabled: true, autoScan: false },
      'csp-analyzer': { enabled: true, autoScan: true },
      'dependency-checker': { enabled: true, autoScan: false },
      'secret-detector': { enabled: true, autoScan: true },
      'tls-analyzer': { enabled: true, autoScan: false },
    },
    autoScanOnPageLoad: false,
    autoScanOnDomChange: false,
    severityThreshold: 'low',
    showInConsole: true,
    exportFormat: 'json',
  },
  
  metrics: {
    totalVulnerabilities: 0,
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
    lastScanTime: 0,
    avgScanDuration: 0,
    securityScore: 100,
  },
  
  ui: {
    activeTab: 'dashboard',
    selectedVulnerabilityId: undefined,
    selectedScannerId: undefined,
    showSeverityFilter: false,
    severityFilter: ['low', 'medium', 'high', 'critical'],
    categoryFilter: ['xss', 'csrf', 'csp', 'dependency', 'secret', 'tls', 'authentication', 'authorization', 'injection', 'security-headers', 'configuration'],
    searchQuery: '',
    sortBy: 'severity',
    sortOrder: 'desc',
    expandedCategories: new Set(),
    theme: 'auto',
  },
  
  scanHistory: [],
};