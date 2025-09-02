import React from 'react';
import { 
  Eye, 
  EyeOff, 
  Play, 
  Pause, 
  Square, 
  Shield, 
  AlertTriangle, 
  Palette, 
  Keyboard, 
  Focus,
  MapPin,
  BarChart3
} from 'lucide-react';
import { PluginPanel, PluginTab, PluginAction, PluginMetric, FilterSection, COLORS, COMPONENT_STYLES } from '@sucoza/shared-components';
import { useAccessibilityAudit } from '../hooks/useAccessibilityAudit';
import { IssueList } from './IssueList';
import { ColorContrastAnalyzer } from './ColorContrastAnalyzer';
import { KeyboardNavVisualizer } from './KeyboardNavVisualizer';
import { ARIAValidator } from './ARIAValidator';
import { LandmarkMapper } from './LandmarkMapper';
import { FocusDebugger } from './FocusDebugger';

export interface AccessibilityDevToolsPanelProps {
  className?: string;
}

/**
 * Main Accessibility DevTools Panel
 */
export function AccessibilityDevToolsPanel({ className }: AccessibilityDevToolsPanelProps) {
  const {
    currentAudit,
    scanState,
    scanOptions: _scanOptions,
    ui,
    selectedIssue: _selectedIssue,
    filters,
    settings,
    startScan,
    stopScan,
    pauseScan,
    resumeScan,
    updateSettings,
    selectTab,
    getIssueStats,
    getFilteredStats,
    toggleSeverityFilter,
    toggleRuleFilter,
    updateSearchFilter,
    getUniqueRuleIds,
  } = useAccessibilityAudit();

  const stats = getIssueStats();
  const filteredStats = getFilteredStats();

  // Convert the severity filter into actions
  const actions: PluginAction[] = [
    {
      id: 'scan-toggle',
      label: scanState.isScanning 
        ? (scanState.isPaused ? 'Resume' : 'Pause')
        : 'Scan',
      icon: scanState.isScanning 
        ? (scanState.isPaused ? Play : Pause)
        : Play,
      onClick: () => {
        if (scanState.isScanning) {
          if (scanState.isPaused) {
            resumeScan();
          } else {
            pauseScan();
          }
        } else {
          startScan();
        }
      },
      variant: scanState.isScanning 
        ? 'warning'
        : 'success',
      tooltip: scanState.isScanning
        ? (scanState.isPaused ? 'Resume Scan' : 'Pause Scan')
        : 'Start Scan'
    },
    ...(scanState.isScanning ? [{
      id: 'stop',
      label: 'Stop',
      icon: Square,
      onClick: stopScan,
      variant: 'danger' as const,
      tooltip: 'Stop Scan'
    }] : []),
    {
      id: 'overlay-toggle',
      label: 'Overlay',
      icon: settings.enableOverlay ? Eye : EyeOff,
      onClick: () => updateSettings({ enableOverlay: !settings.enableOverlay }),
      variant: settings.enableOverlay ? 'primary' : 'default',
      tooltip: settings.enableOverlay ? 'Hide Overlay' : 'Show Overlay'
    }
  ];

  // Configure tabs
  const tabs: PluginTab[] = [
    {
      id: 'overview',
      label: 'Overview',
      icon: BarChart3,
      badge: { count: stats.total },
      content: <IssueList showOverview={true} />
    },
    {
      id: 'violations',
      label: 'Violations',
      icon: AlertTriangle,
      badge: { 
        count: stats.total,
        variant: stats.critical > 0 ? 'critical' : stats.serious > 0 ? 'serious' : 'default'
      },
      content: <IssueList />
    },
    {
      id: 'color-contrast',
      label: 'Color Contrast',
      icon: Palette,
      content: <ColorContrastAnalyzer />
    },
    {
      id: 'keyboard',
      label: 'Keyboard Nav',
      icon: Keyboard,
      content: <KeyboardNavVisualizer />
    },
    {
      id: 'aria',
      label: 'ARIA',
      icon: Shield,
      content: <ARIAValidator />
    },
    {
      id: 'landmarks',
      label: 'Landmarks',
      icon: MapPin,
      content: <LandmarkMapper />
    },
    {
      id: 'focus',
      label: 'Focus',
      icon: Focus,
      content: <FocusDebugger />
    }
  ];

  // Configure metrics
  const metrics: PluginMetric[] = [
    { label: 'Total Issues', value: stats.total },
    { label: 'Critical', value: stats.critical, color: COLORS.severity.critical },
    { label: 'Serious', value: stats.serious, color: COLORS.severity.serious },
    { label: 'Moderate', value: stats.moderate, color: COLORS.severity.moderate },
    { label: 'Minor', value: stats.minor, color: COLORS.severity.minor },
    ...(currentAudit ? [{
      label: 'WCAG Level', 
      value: settings.wcagLevel
    }, {
      label: 'Engine', 
      value: `${currentAudit.testEngine.name} v${currentAudit.testEngine.version}`
    }] : [])
  ];

  // Configure filter sections
  const uniqueRuleIds = getUniqueRuleIds();
  const filterSections: FilterSection[] = [
    {
      title: 'Severity',
      icon: AlertTriangle,
      items: [
        {
          id: 'critical',
          label: 'Critical',
          count: stats.critical,
          isActive: filters.severity.has('critical'),
          onClick: () => toggleSeverityFilter('critical')
        },
        {
          id: 'serious',
          label: 'Serious',
          count: stats.serious,
          isActive: filters.severity.has('serious'),
          onClick: () => toggleSeverityFilter('serious')
        },
        {
          id: 'moderate',
          label: 'Moderate',
          count: stats.moderate,
          isActive: filters.severity.has('moderate'),
          onClick: () => toggleSeverityFilter('moderate')
        },
        {
          id: 'minor',
          label: 'Minor',
          count: stats.minor,
          isActive: filters.severity.has('minor'),
          onClick: () => toggleSeverityFilter('minor')
        }
      ]
    },
    {
      title: 'Rules',
      icon: Shield,
      items: uniqueRuleIds.map(ruleId => ({
        id: ruleId,
        label: ruleId,
        isActive: filters.ruleIds.has(ruleId),
        onClick: () => toggleRuleFilter(ruleId)
      }))
    }
  ];

  return (
    <PluginPanel
      title="Accessibility Auditor"
      icon={Shield}
      className={className}
      tabs={tabs}
      activeTabId={ui.activeTab}
      onTabChange={selectTab}
      actions={actions}
      metrics={metrics}
      showMetrics={true}
      filterSections={filterSections}
      showFilters={true}
      searchValue={filters.searchQuery || ''}
      onSearchChange={updateSearchFilter}
      searchPlaceholder="Search issues..."
      status={{
        isActive: scanState.isScanning,
        label: scanState.isScanning 
          ? (scanState.isPaused ? 'Paused' : 'Scanning')
          : 'Idle',
        color: scanState.isScanning ? COLORS.status.success : COLORS.text.muted
      }}
    />
  );
}


export default AccessibilityDevToolsPanel;