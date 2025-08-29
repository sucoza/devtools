export type SeverityLevel = 'low' | 'medium' | 'high' | 'critical';

export type VulnerabilityCategory = 
  | 'xss'
  | 'csrf'
  | 'csp'
  | 'dependency'
  | 'secret'
  | 'tls'
  | 'authentication'
  | 'authorization'
  | 'injection'
  | 'security-headers'
  | 'configuration';

export interface SecurityVulnerability {
  id: string;
  category: VulnerabilityCategory;
  title: string;
  description: string;
  severity: SeverityLevel;
  impact: string;
  recommendation: string;
  remediation: string;
  cweId?: string; // Common Weakness Enumeration ID
  owaspCategory?: string;
  element?: HTMLElement | string; // DOM element or selector
  location?: {
    url?: string;
    file?: string;
    line?: number;
    column?: number;
  };
  evidence?: string; // Code snippet or URL
  detectedAt: number; // timestamp
  scannerName: string;
  confidence: number; // 0-100
  references?: string[]; // URLs to documentation
  tags?: string[];
}

export interface SecurityScanResult {
  scannerId: string;
  scannerName: string;
  category: VulnerabilityCategory;
  vulnerabilities: SecurityVulnerability[];
  scannedAt: number;
  duration: number; // ms
  status: 'running' | 'completed' | 'error' | 'cancelled';
  error?: string;
  metadata?: Record<string, any>;
}

export interface SecurityScannerConfig {
  enabled: boolean;
  autoScan: boolean;
  scanInterval?: number; // ms
  options?: Record<string, any>;
}

export interface SecurityAuditConfig {
  scanners: Record<string, SecurityScannerConfig>;
  autoScanOnPageLoad: boolean;
  autoScanOnDomChange: boolean;
  severityThreshold: SeverityLevel;
  showInConsole: boolean;
  exportFormat: 'json' | 'csv' | 'html';
}

export interface SecurityMetrics {
  totalVulnerabilities: number;
  vulnerabilitiesBySeverity: Record<SeverityLevel, number>;
  vulnerabilitiesByCategory: Record<VulnerabilityCategory, number>;
  lastScanTime: number;
  avgScanDuration: number;
  securityScore: number; // 0-100
}

export interface DependencyVulnerability {
  packageName: string;
  currentVersion: string;
  vulnerableVersions: string[];
  fixedVersion?: string;
  severity: SeverityLevel;
  cve?: string;
  advisoryUrl?: string;
  title: string;
  description: string;
}

export interface XSSFinding {
  type: 'reflected' | 'stored' | 'dom' | 'potential';
  source: string;
  sink: string;
  payload: string;
  confidence: number;
}

export interface CSPViolation {
  directive: string;
  violatedDirective: string;
  blockedURI: string;
  sourceFile?: string;
  lineNumber?: number;
  columnNumber?: number;
}

export interface TLSFindings {
  protocol: string;
  cipherSuite: string;
  keyExchange: string;
  certificate?: {
    subject: string;
    issuer: string;
    validFrom: string;
    validTo: string;
    serialNumber: string;
    fingerprint: string;
  };
  weaknesses: string[];
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
}

export interface SecretPattern {
  id: string;
  name: string;
  pattern: RegExp;
  category: 'api-key' | 'password' | 'token' | 'certificate' | 'database';
  confidence: number;
}

export interface SecurityScanner {
  id: string;
  name: string;
  category: VulnerabilityCategory;
  description: string;
  configure?(config: any): void;
  scan(): Promise<SecurityVulnerability[]>;
}

export interface SecurityReportExport {
  version: string;
  generatedAt: number;
  url: string;
  userAgent: string;
  summary: SecurityMetrics;
  vulnerabilities: SecurityVulnerability[];
  scanResults: SecurityScanResult[];
  configuration: SecurityAuditConfig;
}