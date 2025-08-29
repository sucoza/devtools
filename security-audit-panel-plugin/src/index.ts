// Main exports for the Security Audit Panel DevTools Plugin
export { SecurityAuditPanel } from './components/SecurityAuditPanel';
export { useSecurityAudit, useFilteredVulnerabilities, useSecurityMetrics, useScannerStatus, useSelectedVulnerability } from './hooks';
export { 
  createSecurityAuditDevToolsClient, 
  getSecurityAuditDevToolsClient,
  SecurityAuditDevToolsClient 
} from './core/devtools-client';
export { 
  getSecurityAuditDevToolsStore, 
  SecurityAuditDevToolsStore 
} from './core/devtools-store';
export { 
  getSecurityScanEngine, 
  initializeSecurityScanEngine, 
  SecurityScanEngine 
} from './core/security-scanner';

// Export types
export type {
  SecurityVulnerability,
  SecurityScanResult,
  SecurityAuditConfig,
  SecurityMetrics,
  VulnerabilityCategory,
  SeverityLevel,
  DevToolsState,
  DevToolsAction,
} from './types';

// Export individual scanners for advanced usage
export { XSSScanner } from './scanners/xss-scanner';
export { CSRFValidator } from './scanners/csrf-validator';
export { CSPAnalyzer } from './scanners/csp-analyzer';
export { DependencyChecker } from './scanners/dependency-checker';
export { SecretDetector } from './scanners/secret-detector';
export { TLSAnalyzer } from './scanners/tls-analyzer';

// Export utilities
export {
  generateId,
  getTimestamp,
  formatTimestamp,
  capitalize,
  getSeverityColor,
  getCategoryDisplayName,
  formatDuration,
  debounce,
  escapeHtml,
  isElementVisible,
  getElementSelector,
  downloadFile,
} from './utils';

// Default export for easy integration
import { SecurityAuditPanel } from './components/SecurityAuditPanel';
export default SecurityAuditPanel;