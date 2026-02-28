import type { 
  SecurityScanResult, 
  SecurityVulnerability, 
  VulnerabilityCategory,
  SecurityAuditConfig
} from '../types';
import { getTimestamp } from '../utils';

export interface SecurityScanner {
  id: string;
  name: string;
  category: VulnerabilityCategory;
  description: string;
  scan(): Promise<SecurityVulnerability[]>;
  configure?(config: Record<string, unknown>): void;
}

export class SecurityScanEngine {
  private scanners: Map<string, SecurityScanner> = new Map();
  private config: SecurityAuditConfig;
  private domChangeObserver: MutationObserver | null = null;
  private domChangeTimeout: ReturnType<typeof setTimeout> | null = null;
  private initialScanTimeout: ReturnType<typeof setTimeout> | null = null;
  private domContentLoadedHandler: (() => void) | null = null;

  constructor(config: SecurityAuditConfig) {
    this.config = config;
  }

  /**
   * Register a security scanner
   */
  registerScanner(scanner: SecurityScanner): void {
    this.scanners.set(scanner.id, scanner);
  }

  /**
   * Unregister a security scanner
   */
  unregisterScanner(scannerId: string): void {
    this.scanners.delete(scannerId);
  }

  /**
   * Get all registered scanners
   */
  getScanners(): SecurityScanner[] {
    return Array.from(this.scanners.values());
  }

  /**
   * Get enabled scanners
   */
  getEnabledScanners(): SecurityScanner[] {
    return Array.from(this.scanners.values()).filter(scanner => 
      this.config.scanners[scanner.id]?.enabled
    );
  }

  /**
   * Run security scan with specific scanners
   */
  async runScan(scannerIds?: string[]): Promise<SecurityScanResult[]> {
    const scannersToRun = scannerIds 
      ? scannerIds.map(id => this.scanners.get(id)).filter(Boolean) as SecurityScanner[]
      : this.getEnabledScanners();

    const results = await Promise.allSettled(
      scannersToRun.map(scanner => this.runSingleScanner(scanner))
    );

    return results.map((result, index) => {
      const scanner = scannersToRun[index];
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          scannerId: scanner.id,
          scannerName: scanner.name,
          category: scanner.category,
          vulnerabilities: [],
          scannedAt: getTimestamp(),
          duration: 0,
          status: 'error' as const,
          error: result.reason?.message || 'Unknown error',
        };
      }
    });
  }

  /**
   * Run a single scanner
   */
  private async runSingleScanner(scanner: SecurityScanner): Promise<SecurityScanResult> {
    const startTime = Date.now();
    
    try {
      // Configure scanner if needed
      const scannerConfig = this.config.scanners[scanner.id];
      if (scannerConfig?.options && scanner.configure) {
        scanner.configure(scannerConfig.options);
      }

      const vulnerabilities = await scanner.scan();
      const duration = Date.now() - startTime;

      return {
        scannerId: scanner.id,
        scannerName: scanner.name,
        category: scanner.category,
        vulnerabilities,
        scannedAt: getTimestamp(),
        duration,
        status: 'completed',
      };
    } catch (error) {
      return {
        scannerId: scanner.id,
        scannerName: scanner.name,
        category: scanner.category,
        vulnerabilities: [],
        scannedAt: getTimestamp(),
        duration: Date.now() - startTime,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Update configuration
   */
  updateConfig(config: SecurityAuditConfig): void {
    this.config = config;
  }

  /**
   * Get scanner configuration
   */
  getScannerConfig(scannerId: string): Record<string, unknown> | undefined {
    return this.config.scanners[scannerId];
  }

  /**
   * Enable auto-scan if configured
   */
  setupAutoScan(callback: (results: SecurityScanResult[]) => void): void {
    // Clean up any previous auto-scan to prevent duplicate observers
    this.stopAutoScan();

    const scanAndCallback = () => {
      this.runScan()
        .then(results => callback(results))
        .catch(error => console.error('[SecurityScanner] Auto-scan failed:', error));
    };

    if (this.config.autoScanOnPageLoad) {
      if (document.readyState === 'loading') {
        this.domContentLoadedHandler = () => {
          this.initialScanTimeout = setTimeout(scanAndCallback, 1000);
        };
        document.addEventListener('DOMContentLoaded', this.domContentLoadedHandler);
      } else {
        this.initialScanTimeout = setTimeout(scanAndCallback, 1000);
      }
    }

    if (this.config.autoScanOnDomChange) {
      this.domChangeObserver = new MutationObserver(() => {
        if (this.domChangeTimeout !== null) {
          clearTimeout(this.domChangeTimeout);
        }
        this.domChangeTimeout = setTimeout(scanAndCallback, 2000);
      });

      this.domChangeObserver.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
      });
    }
  }

  /**
   * Cleanup auto-scan resources
   */
  stopAutoScan(): void {
    if (this.domContentLoadedHandler) {
      document.removeEventListener('DOMContentLoaded', this.domContentLoadedHandler);
      this.domContentLoadedHandler = null;
    }
    if (this.initialScanTimeout !== null) {
      clearTimeout(this.initialScanTimeout);
      this.initialScanTimeout = null;
    }
    if (this.domChangeObserver) {
      this.domChangeObserver.disconnect();
      this.domChangeObserver = null;
    }
    if (this.domChangeTimeout !== null) {
      clearTimeout(this.domChangeTimeout);
      this.domChangeTimeout = null;
    }
  }

  /**
   * Export scan results
   */
  exportResults(scanResults: SecurityScanResult[], format: 'json' | 'csv' | 'html'): string {
    const allVulnerabilities = scanResults.flatMap(result => result.vulnerabilities);

    switch (format) {
      case 'json':
        return JSON.stringify({
          version: '1.0',
          generatedAt: getTimestamp(),
          url: window.location.href,
          userAgent: navigator.userAgent,
          summary: {
            totalScans: scanResults.length,
            totalVulnerabilities: allVulnerabilities.length,
            vulnerabilitiesBySeverity: this.groupBySeverity(allVulnerabilities),
          },
          scanResults,
        }, null, 2);

      case 'csv':
        return this.exportToCsv(allVulnerabilities);

      case 'html':
        return this.exportToHtml(scanResults, allVulnerabilities);

      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  private groupBySeverity(vulnerabilities: SecurityVulnerability[]) {
    return vulnerabilities.reduce((acc, vuln) => {
      acc[vuln.severity] = (acc[vuln.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  private exportToCsv(vulnerabilities: SecurityVulnerability[]): string {
    const headers = ['ID', 'Category', 'Title', 'Severity', 'CWE ID', 'Scanner', 'Detected At'];
    const rows = vulnerabilities.map(vuln => [
      vuln.id,
      vuln.category,
      vuln.title,
      vuln.severity,
      vuln.cweId || '',
      vuln.scannerName,
      new Date(vuln.detectedAt).toISOString(),
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  private exportToHtml(scanResults: SecurityScanResult[], vulnerabilities: SecurityVulnerability[]): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <title>Security Audit Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    .header { background: #f5f5f5; padding: 20px; margin-bottom: 20px; }
    .summary { display: flex; gap: 20px; margin-bottom: 20px; }
    .metric { background: white; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
    .vulnerability { background: white; margin: 10px 0; padding: 15px; border-left: 4px solid; }
    .critical { border-color: #dc3545; }
    .high { border-color: #fd7e14; }
    .medium { border-color: #ffc107; }
    .low { border-color: #28a745; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Security Audit Report</h1>
    <p>Generated: ${new Date().toLocaleString()}</p>
    <p>URL: ${window.location.href}</p>
  </div>
  
  <div class="summary">
    <div class="metric">
      <h3>Total Vulnerabilities</h3>
      <div>${vulnerabilities.length}</div>
    </div>
    <div class="metric">
      <h3>Scanners Run</h3>
      <div>${scanResults.length}</div>
    </div>
  </div>
  
  <h2>Vulnerabilities</h2>
  ${vulnerabilities.map(vuln => `
    <div class="vulnerability ${vuln.severity}">
      <h3>${vuln.title}</h3>
      <p><strong>Category:</strong> ${vuln.category}</p>
      <p><strong>Severity:</strong> ${vuln.severity}</p>
      <p><strong>Description:</strong> ${vuln.description}</p>
      <p><strong>Recommendation:</strong> ${vuln.recommendation}</p>
    </div>
  `).join('')}
</body>
</html>`;
  }
}

// Global scanner engine instance
let scannerEngine: SecurityScanEngine | null = null;

export function getSecurityScanEngine(config?: SecurityAuditConfig): SecurityScanEngine {
  if (!scannerEngine && config) {
    scannerEngine = new SecurityScanEngine(config);
  } else if (!scannerEngine) {
    throw new Error('SecurityScanEngine must be initialized with config first');
  }
  return scannerEngine;
}

export function initializeSecurityScanEngine(config: SecurityAuditConfig): SecurityScanEngine {
  scannerEngine = new SecurityScanEngine(config);
  return scannerEngine;
}