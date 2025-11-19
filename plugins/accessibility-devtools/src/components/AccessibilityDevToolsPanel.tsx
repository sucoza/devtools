import React, { useMemo } from 'react';
import { Trans } from '@lingui/macro';
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
import { PluginPanel, PluginTab, PluginAction, PluginMetric, FilterSection, COLORS, COMPONENT_STYLES, ConfigMenu, ThemeProvider, type ConfigMenuItem } from '@sucoza/shared-components';
import '@sucoza/shared-components/dist/styles/theme.css';
import { useAccessibilityAudit } from '../hooks/useAccessibilityAudit';
import { IssueList } from './IssueList';
import { ColorContrastAnalyzer } from './ColorContrastAnalyzer';
import { KeyboardNavVisualizer } from './KeyboardNavVisualizer';
import { ARIAValidator } from './ARIAValidator';
import { LandmarkMapper } from './LandmarkMapper';
import { FocusDebugger } from './FocusDebugger';

export interface AccessibilityDevToolsPanelProps {
  className?: string;
  theme?: 'light' | 'dark' | 'auto';
}

/**
 * Main Accessibility DevTools Panel
 */
function AccessibilityDevToolsPanelInner({ className }: { className?: string }) {
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

  // Convert actions into config menu items
  const configMenuItems: ConfigMenuItem[] = [
    {
      id: 'scan-toggle',
      label: scanState.isScanning
        ? (scanState.isPaused ? <Trans>Resume Scan</Trans> : <Trans>Pause Scan</Trans>)
        : <Trans>Start Scan</Trans>,
      icon: scanState.isScanning
        ? (scanState.isPaused ? '▶️' : '⏸️')
        : '▶️',
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
      shortcut: 'Ctrl+R'
    },
    ...(scanState.isScanning ? [{
      id: 'stop',
      label: <Trans>Stop Scan</Trans>,
      icon: '⏹️',
      onClick: stopScan,
      shortcut: 'Ctrl+S'
    }] : []),
    {
      id: 'overlay-toggle',
      label: settings.enableOverlay ? <Trans>Hide Overlay</Trans> : <Trans>Show Overlay</Trans>,
      icon: settings.enableOverlay ? '👁️' : '👁️‍🗨️',
      onClick: () => updateSettings({ enableOverlay: !settings.enableOverlay }),
      separator: true,
      shortcut: 'Ctrl+O'
    },
    {
      id: 'export-report',
      label: <Trans>Export Report</Trans>,
      icon: '💾',
      onClick: () => {
        // TODO: Implement export functionality
        console.log('Export report functionality to be implemented');
      },
      shortcut: 'Ctrl+E'
    },
    {
      id: 'settings',
      label: <Trans>Settings</Trans>,
      icon: '⚙️',
      onClick: () => {
        // TODO: Implement settings functionality
        console.log('Settings functionality to be implemented');
      },
      separator: true
    }
  ];

  // Configure tabs
  const tabs: PluginTab[] = [
    {
      id: 'overview',
      label: <Trans>Overview</Trans>,
      icon: BarChart3,
      badge: { count: stats.total },
      content: <IssueList showOverview={true} />
    },
    {
      id: 'violations',
      label: <Trans>Violations</Trans>,
      icon: AlertTriangle,
      badge: {
        count: stats.total,
        variant: stats.critical > 0 ? 'critical' : stats.serious > 0 ? 'serious' : 'default'
      },
      content: <IssueList />
    },
    {
      id: 'color-contrast',
      label: <Trans>Color Contrast</Trans>,
      icon: Palette,
      content: <ColorContrastAnalyzer />
    },
    {
      id: 'keyboard',
      label: <Trans>Keyboard Nav</Trans>,
      icon: Keyboard,
      content: <KeyboardNavVisualizer />
    },
    {
      id: 'aria',
      label: <Trans>ARIA</Trans>,
      icon: Shield,
      content: <ARIAValidator />
    },
    {
      id: 'landmarks',
      label: <Trans>Landmarks</Trans>,
      icon: MapPin,
      content: <LandmarkMapper />
    },
    {
      id: 'focus',
      label: <Trans>Focus</Trans>,
      icon: Focus,
      content: <FocusDebugger />
    }
  ];

  // Configure metrics
  const metrics: PluginMetric[] = [
    { label: <Trans>Total Issues</Trans>, value: stats.total },
    { label: <Trans>Critical</Trans>, value: stats.critical, color: COLORS.severity.critical },
    { label: <Trans>Serious</Trans>, value: stats.serious, color: COLORS.severity.serious },
    { label: <Trans>Moderate</Trans>, value: stats.moderate, color: COLORS.severity.moderate },
    { label: <Trans>Minor</Trans>, value: stats.minor, color: COLORS.severity.minor },
    ...(currentAudit ? [{
      label: <Trans>WCAG Level</Trans>,
      value: settings.wcagLevel
    }, {
      label: <Trans>Engine</Trans>,
      value: `${currentAudit.testEngine.name} v${currentAudit.testEngine.version}`
    }] : [])
  ];

  // Configure filter sections
  const uniqueRuleIds = getUniqueRuleIds();
  const filterSections: FilterSection[] = [
    {
      title: <Trans>Severity</Trans>,
      icon: AlertTriangle,
      items: [
        {
          id: 'critical',
          label: <Trans>Critical</Trans>,
          count: stats.critical,
          isActive: filters.severity.has('critical'),
          onClick: () => toggleSeverityFilter('critical')
        },
        {
          id: 'serious',
          label: <Trans>Serious</Trans>,
          count: stats.serious,
          isActive: filters.severity.has('serious'),
          onClick: () => toggleSeverityFilter('serious')
        },
        {
          id: 'moderate',
          label: <Trans>Moderate</Trans>,
          count: stats.moderate,
          isActive: filters.severity.has('moderate'),
          onClick: () => toggleSeverityFilter('moderate')
        },
        {
          id: 'minor',
          label: <Trans>Minor</Trans>,
          count: stats.minor,
          isActive: filters.severity.has('minor'),
          onClick: () => toggleSeverityFilter('minor')
        }
      ]
    },
    {
      title: <Trans>Rules</Trans>,
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
    <div className={className} style={{ position: 'relative' }}>
      <PluginPanel
        title={<Trans>Accessibility Auditor</Trans>}
        icon={Shield}
        tabs={tabs}
        activeTabId={ui.activeTab}
        onTabChange={selectTab}
        metrics={metrics}
        showMetrics={true}
        filterSections={filterSections}
        showFilters={true}
        searchValue={filters.searchQuery || ''}
        onSearchChange={updateSearchFilter}
        searchPlaceholder={<Trans>Search issues...</Trans>}
        status={{
          isActive: scanState.isScanning,
          label: scanState.isScanning
            ? (scanState.isPaused ? <Trans>Paused</Trans> : <Trans>Scanning</Trans>)
            : <Trans>Idle</Trans>,
          color: scanState.isScanning ? COLORS.status.success : COLORS.text.muted
        }}
      />
      
      {/* Custom ConfigMenu overlay */}
      <div style={{
        position: 'absolute',
        top: '12px',
        right: '12px',
        zIndex: 10
      }}>
        <ConfigMenu items={configMenuItems} size="sm" />
      </div>
    </div>
  );
}

export function AccessibilityDevToolsPanel(props: AccessibilityDevToolsPanelProps = {}) {
  const { theme = 'auto', ...rest } = props;

  const resolvedTheme = useMemo(() => {
    if (theme === 'auto') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return theme;
  }, [theme]);

  return (
    <ThemeProvider defaultTheme={resolvedTheme}>
      <AccessibilityDevToolsPanelInner {...rest} />
    </ThemeProvider>
  );
}

export default AccessibilityDevToolsPanel;