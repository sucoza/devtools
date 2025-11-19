import { useSyncExternalStore } from 'use-sync-external-store/shim';
import { createSecurityAuditDevToolsClient } from '../core/devtools-client';
import type { SecurityVulnerability } from '../types';

const client = createSecurityAuditDevToolsClient();

export function useSecurityAudit() {
  const state = useSyncExternalStore(
    client.subscribe,
    client.getState,
    client.getState
  );

  const actions = {
    // Scanning actions
    startScan: client.startScan,
    cancelScan: client.cancelScan,
    clearVulnerabilities: client.clearVulnerabilities,
    quickScan: client.quickScan,

    // Scanner management
    enableScanner: client.enableScanner,
    disableScanner: client.disableScanner,
    configureScanners: client.configureScanners,

    // Export/Import
    exportResults: client.exportResults,
    generateReport: client.generateReport,

    // UI actions
    selectTab: client.selectTab,
    selectVulnerability: client.selectVulnerability,
    selectScanner: client.selectScanner,
    toggleSeverityFilter: client.toggleSeverityFilter,
    toggleCategoryFilter: client.toggleCategoryFilter,
    updateSearchQuery: client.updateSearchQuery,
    setSort: client.setSort,
    setTheme: client.setTheme,
    expandCategory: client.expandCategory,
    collapseCategory: client.collapseCategory,
    showSeverityFilter: client.showSeverityFilter,
    hideSeverityFilter: client.hideSeverityFilter,
  };

  return {
    state,
    actions,
  };
}

export function useFilteredVulnerabilities(): SecurityVulnerability[] {
  const { state } = useSecurityAudit();
  
  const vulnerabilities = Object.values(state.vulnerabilities) as SecurityVulnerability[];
  
  // Apply filters
  const filteredVulnerabilities = vulnerabilities.filter((vuln: SecurityVulnerability) => {
    // Severity filter
    if (!state.ui.severityFilter.includes(vuln.severity)) {
      return false;
    }
    
    // Category filter
    if (!state.ui.categoryFilter.includes(vuln.category)) {
      return false;
    }
    
    // Search query filter
    if (state.ui.searchQuery) {
      const query = state.ui.searchQuery.toLowerCase();
      const searchable = [
        vuln.title,
        vuln.description,
        vuln.category,
        vuln.scannerName,
        vuln.cweId,
        vuln.owaspCategory,
      ].filter(Boolean).join(' ').toLowerCase();
      
      if (!searchable.includes(query)) {
        return false;
      }
    }
    
    return true;
  });
  
  // Apply sorting
  const sortedVulnerabilities = filteredVulnerabilities.sort((a: SecurityVulnerability, b: SecurityVulnerability) => {
    let comparison = 0;
    
    switch (state.ui.sortBy) {
      case 'severity': {
        const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        comparison = severityOrder[b.severity] - severityOrder[a.severity];
        break;
      }
        
      case 'category':
        comparison = a.category.localeCompare(b.category);
        break;
        
      case 'detected':
        comparison = b.detectedAt - a.detectedAt;
        break;
        
      case 'title':
        comparison = a.title.localeCompare(b.title);
        break;
        
      default:
        comparison = 0;
    }
    
    return state.ui.sortOrder === 'desc' ? comparison : -comparison;
  });
  
  return sortedVulnerabilities;
}

export function useSecurityMetrics() {
  const { state } = useSecurityAudit();
  return state.metrics;
}

export function useScannerStatus() {
  const { state } = useSecurityAudit();
  const availableScanners = client.getAvailableScanners();
  const enabledScanners = client.getEnabledScanners();
  
  return {
    availableScanners,
    enabledScanners,
    scanResults: state.scanResults,
    isScanning: state.isScanning,
  };
}

export function useSelectedVulnerability(): SecurityVulnerability | null {
  const { state } = useSecurityAudit();
  
  if (!state.ui.selectedVulnerabilityId) {
    return null;
  }
  
  return state.vulnerabilities[state.ui.selectedVulnerabilityId] || null;
}