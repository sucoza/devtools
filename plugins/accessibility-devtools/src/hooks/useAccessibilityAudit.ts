import { useEffect, useCallback } from 'react';
import { useAccessibilityDevToolsStore } from '../core/devtools-store';
import type {
  AccessibilityIssue,
  ScanOptions,
  AccessibilityDevToolsState,
} from '../types';

/**
 * Hook for managing accessibility audits
 */
export function useAccessibilityAudit() {
  const store = useAccessibilityDevToolsStore();
  
  // Extract relevant state
  const currentAudit = store.currentAudit;
  const auditHistory = store.auditHistory;
  const scanState = store.scanState;
  const scanOptions = store.scanOptions;
  const ui = store.ui;
  const selectedIssue = store.ui.selectedIssue;
  const filters = store.filters;
  const settings = store.settings;
  
  // Get filtered issues
  const filteredIssues = store.getFilteredIssues();
  
  // Scan control methods
  const startScan = useCallback(
    (elementSelector?: string) => {
      return store.startScanning(elementSelector);
    },
    [store]
  );
  
  const stopScan = useCallback(() => {
    store.stopScanning();
  }, [store]);
  
  const pauseScan = useCallback(() => {
    store.pauseScanning();
  }, [store]);
  
  const resumeScan = useCallback(() => {
    store.resumeScanning();
  }, [store]);
  
  // Options and settings
  const updateScanOptions = useCallback(
    (options: Partial<ScanOptions>) => {
      store.dispatch({ type: 'options/update', payload: options });
    },
    [store]
  );
  
  const updateSettings = useCallback(
    (newSettings: Partial<AccessibilityDevToolsState['settings']>) => {
      store.dispatch({ type: 'settings/update', payload: newSettings });
    },
    [store]
  );

  const selectTab = useCallback(
    (tab: AccessibilityDevToolsState['ui']['activeTab']) => {
      store.dispatch({ type: 'ui/tab/select', payload: tab });
    },
    [store]
  );
  
  // Issue selection and navigation
  const selectIssue = useCallback(
    (issue: AccessibilityIssue | null) => {
      store.dispatch({ type: 'ui/issue/select', payload: issue });
    },
    [store]
  );
  
  const selectNextIssue = useCallback(() => {
    if (!selectedIssue || filteredIssues.length === 0) return;
    
    const currentIndex = filteredIssues.findIndex(issue => issue.id === selectedIssue.id);
    const nextIndex = (currentIndex + 1) % filteredIssues.length;
    selectIssue(filteredIssues[nextIndex]);
  }, [selectedIssue, filteredIssues, selectIssue]);
  
  const selectPreviousIssue = useCallback(() => {
    if (!selectedIssue || filteredIssues.length === 0) return;
    
    const currentIndex = filteredIssues.findIndex(issue => issue.id === selectedIssue.id);
    const previousIndex = currentIndex === 0 ? filteredIssues.length - 1 : currentIndex - 1;
    selectIssue(filteredIssues[previousIndex]);
  }, [selectedIssue, filteredIssues, selectIssue]);
  
  // Element highlighting
  const highlightElement = useCallback(
    (selector: string | null) => {
      store.dispatch({ type: 'ui/element/highlight', payload: selector });
    },
    [store]
  );
  
  // Filtering
  const toggleSeverityFilter = useCallback(
    (severity: 'critical' | 'serious' | 'moderate' | 'minor') => {
      store.dispatch({ type: 'filters/severity/toggle', payload: severity });
    },
    [store]
  );
  
  const toggleRuleFilter = useCallback(
    (ruleId: string) => {
      store.dispatch({ type: 'filters/rule/toggle', payload: ruleId });
    },
    [store]
  );
  
  const toggleTagFilter = useCallback(
    (tag: string) => {
      store.dispatch({ type: 'filters/tag/toggle', payload: tag });
    },
    [store]
  );
  
  const updateSearchFilter = useCallback(
    (query: string) => {
      store.dispatch({ type: 'filters/search/update', payload: query });
    },
    [store]
  );
  
  const resetFilters = useCallback(() => {
    store.dispatch({ type: 'filters/reset' });
  }, [store]);
  
  // History management
  const clearHistory = useCallback(() => {
    store.dispatch({ type: 'history/clear' });
  }, [store]);
  
  const removeHistoryEntry = useCallback(
    (index: number) => {
      store.dispatch({ type: 'history/remove', payload: index });
    },
    [store]
  );
  
  // Statistics
  const getIssueStats = useCallback(() => {
    if (!currentAudit) {
      return {
        total: 0,
        critical: 0,
        serious: 0,
        moderate: 0,
        minor: 0,
      };
    }
    
    const violations = currentAudit.violations;
    return {
      total: violations.length,
      critical: violations.filter(v => v.impact === 'critical').length,
      serious: violations.filter(v => v.impact === 'serious').length,
      moderate: violations.filter(v => v.impact === 'moderate').length,
      minor: violations.filter(v => v.impact === 'minor').length,
    };
  }, [currentAudit]);
  
  const getFilteredStats = useCallback(() => {
    return {
      total: filteredIssues.length,
      critical: filteredIssues.filter(i => i.impact === 'critical').length,
      serious: filteredIssues.filter(i => i.impact === 'serious').length,
      moderate: filteredIssues.filter(i => i.impact === 'moderate').length,
      minor: filteredIssues.filter(i => i.impact === 'minor').length,
    };
  }, [filteredIssues]);
  
  // Get unique rule IDs for filtering
  const getUniqueRuleIds = useCallback(() => {
    if (!currentAudit) return [];
    return Array.from(new Set(currentAudit.violations.map(v => v.rule))).sort();
  }, [currentAudit]);
  
  // Get unique tags for filtering
  const getUniqueTags = useCallback(() => {
    if (!currentAudit) return [];
    const allTags = currentAudit.violations.flatMap(v => v.tags);
    return Array.from(new Set(allTags)).sort();
  }, [currentAudit]);
  
  // Auto-start scanning if enabled
  useEffect(() => {
    if (settings.autoScan && !scanState.isScanning) {
      const timer = setTimeout(() => {
        startScan();
      }, settings.scanDelay);
      
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [settings.autoScan, settings.scanDelay, scanState.isScanning, startScan]);
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle shortcuts when DevTools has focus
      if (!document.hasFocus()) return;
      
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case 'k':
            event.preventDefault();
            startScan();
            break;
          case 'p':
            event.preventDefault();
            if (scanState.isScanning) {
              if (scanState.isPaused) {
                resumeScan();
              } else {
                pauseScan();
              }
            }
            break;
          case 's':
            event.preventDefault();
            stopScan();
            break;
        }
      } else {
        switch (event.key) {
          case 'ArrowDown':
            event.preventDefault();
            selectNextIssue();
            break;
          case 'ArrowUp':
            event.preventDefault();
            selectPreviousIssue();
            break;
          case 'Escape':
            event.preventDefault();
            selectIssue(null);
            highlightElement(null);
            break;
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    startScan, pauseScan, resumeScan, stopScan,
    selectNextIssue, selectPreviousIssue, selectIssue, highlightElement,
    scanState.isScanning, scanState.isPaused
  ]);
  
  return {
    // State
    currentAudit,
    auditHistory,
    scanState,
    scanOptions,
    ui,
    selectedIssue,
    filteredIssues,
    filters,
    settings,
    
    // Actions
    startScan,
    stopScan,
    pauseScan,
    resumeScan,
    updateScanOptions,
    updateSettings,
    selectTab,
    
    // Issue management
    selectIssue,
    selectNextIssue,
    selectPreviousIssue,
    highlightElement,
    
    // Filtering
    toggleSeverityFilter,
    toggleRuleFilter,
    toggleTagFilter,
    updateSearchFilter,
    resetFilters,
    
    // History
    clearHistory,
    removeHistoryEntry,
    
    // Statistics
    getIssueStats,
    getFilteredStats,
    getUniqueRuleIds,
    getUniqueTags,
  };
}