import React from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  AlertTriangle,
  BarChart3,
  Palette,
  Type,
  Ruler,
  AlertCircle,
  Settings as SettingsIcon
} from 'lucide-react';
import { PluginPanel, PluginTab, PluginAction, PluginMetric } from '@sucoza/shared-components';
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

  // Configure plugin actions
  const pluginActions: PluginAction[] = [
    {
      id: 'toggle-analysis',
      label: isAnalysisEnabled ? 'Stop Analysis' : 'Start Analysis',
      icon: isAnalysisEnabled ? Pause : Play,
      onClick: handleToggleAnalysis,
      variant: isAnalysisEnabled ? 'danger' : 'success'
    },
    {
      id: 'toggle-realtime',
      label: 'Real-time',
      icon: RotateCcw,
      onClick: handleToggleRealTime,
      variant: isRealTimeMode ? 'primary' : 'default',
      disabled: !isAnalysisEnabled,
      tooltip: isRealTimeMode ? 'Disable real-time monitoring' : 'Enable real-time monitoring'
    },
    {
      id: 'issues-only',
      label: 'Issues Only',
      icon: AlertTriangle,
      onClick: actions.toggleShowOnlyIssues,
      variant: showOnlyIssues ? 'warning' : 'default',
      tooltip: 'Toggle to show only items with issues'
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
    <PluginPanel
      title="Design System Inspector"
      icon={Palette}
      subtitle="Monitor your design system's health and consistency"
      tabs={tabs}
      activeTabId={activeTab}
      onTabChange={actions.selectTab}
      actions={pluginActions}
      searchValue={searchQuery}
      onSearchChange={actions.setSearchQuery}
      searchPlaceholder="Search components, tokens, issues..."
      metrics={metrics}
      showMetrics={true}
      status={{
        isActive: isAnalysisEnabled,
        label: isAnalysisEnabled ? (isRealTimeMode ? 'Real-time Active' : 'Analysis Active') : 'Analysis Inactive'
      }}
      showSettings={true}
      onSettingsClick={() => console.log('Settings clicked')}
    />
  );
}