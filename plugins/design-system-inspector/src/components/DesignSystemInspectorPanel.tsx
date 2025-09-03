import React from 'react';
import { 
  BarChart3,
  Palette,
  Type,
  Ruler,
  AlertCircle
} from 'lucide-react';
import { PluginPanel, PluginTab, PluginMetric, ConfigMenu, ConfigMenuItem } from '@sucoza/shared-components';
import { useDesignSystemInspector } from '../hooks';
import { DashboardTab } from './tabs/DashboardTab';
import { ComponentsTab } from './tabs/ComponentsTab';
import { TokensTab } from './tabs/TokensTab';
import { ColorsTab } from './tabs/ColorsTab';
import { TypographyTab } from './tabs/TypographyTab';
import { SpacingTab } from './tabs/SpacingTab';
import { IssuesTab } from './tabs/IssuesTab';

/**
 * Main Design System Inspector DevTools Panel
 */
export function DesignSystemInspectorPanel() {
  const { state, actions } = useDesignSystemInspector();
  const {
    ui: { activeTab, searchQuery, showOnlyIssues },
    isAnalysisEnabled,
    isRealTimeMode,
    stats,
  } = state;

  const handleToggleAnalysis = () => {
    if (isAnalysisEnabled) {
      actions.stopAnalysis();
    } else {
      actions.startAnalysis();
    }
  };

  const handleToggleRealTime = () => {
    if (isRealTimeMode) {
      actions.disableRealTime();
    } else {
      actions.enableRealTime();
    }
  };

  // Configure plugin tabs
  const tabs: PluginTab[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: BarChart3,
      content: <DashboardTab />
    },
    {
      id: 'components',
      label: 'Components',
      icon: () => React.createElement('span', { style: { fontSize: '16px' } }, '🧩'),
      badge: stats.totalComponents > 0 ? { count: stats.totalComponents } : undefined,
      content: <ComponentsTab />
    },
    {
      id: 'tokens',
      label: 'Tokens',
      icon: Palette,
      badge: stats.totalTokens > 0 ? { count: stats.totalTokens } : undefined,
      content: <TokensTab />
    },
    {
      id: 'colors',
      label: 'Colors',
      icon: () => React.createElement('span', { style: { fontSize: '16px' } }, '🌈'),
      content: <ColorsTab />
    },
    {
      id: 'typography',
      label: 'Typography',
      icon: Type,
      content: <TypographyTab />
    },
    {
      id: 'spacing',
      label: 'Spacing',
      icon: Ruler,
      content: <SpacingTab />
    },
    {
      id: 'issues',
      label: 'Issues',
      icon: AlertCircle,
      badge: stats.totalIssues > 0 ? { count: stats.totalIssues, variant: 'critical' as const } : undefined,
      content: <IssuesTab />
    },
  ];

  // Configure config menu items
  const configMenuItems: ConfigMenuItem[] = [
    {
      id: 'toggle-analysis',
      label: isAnalysisEnabled ? 'Stop Analysis' : 'Start Analysis',
      icon: isAnalysisEnabled ? '⏸️' : '▶️',
      onClick: handleToggleAnalysis,
      shortcut: 'Ctrl+R'
    },
    {
      id: 'toggle-realtime',
      label: isRealTimeMode ? 'Disable Real-time' : 'Enable Real-time',
      icon: '🔄',
      onClick: handleToggleRealTime,
      disabled: !isAnalysisEnabled
    },
    {
      id: 'issues-only',
      label: showOnlyIssues ? 'Show All Items' : 'Show Issues Only',
      icon: '⚠️',
      onClick: actions.toggleShowOnlyIssues
    },
    {
      id: 'export-report',
      label: 'Export Analysis Report',
      icon: '💾',
      onClick: () => console.log('Export report clicked'),
      shortcut: 'Ctrl+E',
      separator: true
    },
    {
      id: 'clear-data',
      label: 'Clear Analysis Data',
      icon: '🗑️',
      onClick: () => console.log('Clear data clicked')
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: '⚙️',
      onClick: () => console.log('Settings clicked'),
      separator: true
    }
  ];

  // Configure metrics
  const metrics: PluginMetric[] = [
    {
      label: 'Total Components',
      value: stats.totalComponents,
      format: 'number'
    },
    {
      label: 'Design Tokens',
      value: stats.totalTokens,
      format: 'number'
    },
    {
      label: 'Issues Found',
      value: stats.totalIssues,
      format: 'number',
      color: stats.totalIssues > 0 ? '#e74c3c' : '#4ec9b0'
    },
    {
      label: 'Consistency Score',
      value: `${Math.round(stats.consistencyScore)}%`,
      color: stats.consistencyScore >= 80 ? '#4ec9b0' : stats.consistencyScore >= 60 ? '#f39c12' : '#e74c3c'
    }
  ];

  return (
    <div style={{ position: 'relative', height: '100%' }}>
      <PluginPanel
        title="Design System Inspector"
        icon={Palette}
        subtitle="Monitor your design system's health and consistency"
        tabs={tabs}
        activeTabId={activeTab}
        onTabChange={actions.selectTab}
        searchValue={searchQuery}
        onSearchChange={actions.setSearchQuery}
        searchPlaceholder="Search components, tokens, issues..."
        metrics={metrics}
        showMetrics={true}
        status={{
          isActive: isAnalysisEnabled,
          label: isAnalysisEnabled ? (isRealTimeMode ? 'Real-time Active' : 'Analysis Active') : 'Analysis Inactive'
        }}
      />
      
      <div style={{ position: 'absolute', top: '12px', right: '12px', zIndex: 10 }}>
        <ConfigMenu items={configMenuItems} size="sm" />
      </div>
    </div>
  );
}