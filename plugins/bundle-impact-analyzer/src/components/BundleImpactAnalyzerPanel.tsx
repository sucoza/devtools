import React, { useMemo, useEffect } from 'react';
import { useSyncExternalStore } from 'use-sync-external-store/shim';
import {
  Package,
  Activity,
  BarChart3,
  TreePine,
  Settings,
  Globe,
  FileText,
  TrendingUp,
} from 'lucide-react';
import {
  PluginPanel,
  ScrollableContainer,
  Tabs,
  StatusIndicator,
  SearchInput,
  ConfigMenu,
  type ConfigMenuItem,
  COLORS,
  SPACING,
  TYPOGRAPHY,
} from '@sucoza/shared-components';

import {
  createBundleAnalyzerEventClient,
  getBundleAnalyzerEventClient,
  startBundleInterception,
} from '../core';

// Tab components (we'll create these as placeholders for now)
import { OverviewTab } from './tabs/OverviewTab';
import { ModulesTab } from './tabs/ModulesTab';
import { ChunksTab } from './tabs/ChunksTab';
import { TreeShakingTab } from './tabs/TreeShakingTab';
import { RecommendationsTab } from './tabs/RecommendationsTab';
import { CDNAnalysisTab } from './tabs/CDNAnalysisTab';
import { VisualizationTab } from './tabs/VisualizationTab';
import { SettingsTab } from './tabs/SettingsTab';

export interface BundleImpactAnalyzerPanelProps {
  className?: string;
  style?: React.CSSProperties;
  theme?: 'light' | 'dark' | 'auto';
  compact?: boolean;
  defaultTab?: BundleAnalyzerTab;
  onTabChange?: (tab: BundleAnalyzerTab) => void;
  onEvent?: (event: unknown) => void;
  children?: React.ReactNode;
}

export type BundleAnalyzerTab = 
  | 'overview'
  | 'modules'
  | 'chunks'
  | 'tree-shaking'
  | 'recommendations'
  | 'cdn-analysis'
  | 'visualization'
  | 'settings';

const formatSize = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

/**
 * Main Bundle Impact Analyzer DevTools Panel
 */
export function BundleImpactAnalyzerPanel({
  className,
  style: _style,
  theme: _theme = 'auto',
  compact: _compact = false,
  defaultTab = 'overview',
  onTabChange,
  onEvent: _onEvent,
  children,
}: BundleImpactAnalyzerPanelProps) {
  // Create or get event client
  const eventClient = useMemo(() => {
    return getBundleAnalyzerEventClient() || createBundleAnalyzerEventClient();
  }, []);

  // Subscribe to state changes
  const state = useSyncExternalStore(
    eventClient.subscribe,
    eventClient.getState,
    eventClient.getState
  );

  // Initialize bundle interception on mount
  useEffect(() => {
    startBundleInterception();
    
    // Generate sample data for development
    if (state.modules.length === 0) {
      eventClient.generateSampleData();
    }
  }, [eventClient, state.modules.length]);

  // Current active tab (stored in visualization state for now)
  const [activeTab, setActiveTab] = React.useState<BundleAnalyzerTab>(defaultTab);

  // Handle tab changes
  const handleTabChange = (tab: BundleAnalyzerTab) => {
    setActiveTab(tab);
    onTabChange?.(tab);
  };

  // Tab configuration
  const tabs = [
    {
      id: 'overview',
      label: 'Overview',
      icon: BarChart3,
      badge: state.isAnalyzing ? '...' : undefined,
    },
    {
      id: 'modules',
      label: 'Modules',
      icon: Package,
      badge: state.modules.length,
    },
    {
      id: 'chunks',
      label: 'Chunks',
      icon: FileText,
      badge: state.chunks.length,
    },
    {
      id: 'tree-shaking',
      label: 'Tree Shaking',
      icon: TreePine,
      badge: state.stats.treeShakingEfficiency > 0 
        ? `${(state.stats.treeShakingEfficiency * 100).toFixed(0)}%`
        : undefined,
    },
    {
      id: 'recommendations',
      label: 'Recommendations',
      icon: TrendingUp,
      badge: state.recommendations.length || undefined,
    },
    {
      id: 'cdn-analysis',
      label: 'CDN',
      icon: Globe,
      badge: state.cdnAnalysis.length || undefined,
    },
    {
      id: 'visualization',
      label: 'Visualization',
      icon: Activity,
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
    },
  ];

  // Prepare config menu items
  const configMenuItems: ConfigMenuItem[] = [
    {
      id: 'toggle-analysis',
      label: state.isAnalyzing ? 'Stop Analysis' : 'Start Analysis',
      icon: state.isAnalyzing ? '⏹️' : '▶️',
      onClick: () => {
        if (state.isAnalyzing) {
          eventClient.stopAnalysis();
        } else {
          eventClient.startAnalysis();
        }
      },
      shortcut: 'Ctrl+R'
    },
    {
      id: 'tree-shaking',
      label: 'Analyze Tree Shaking',
      icon: '🌲',
      onClick: () => eventClient.startTreeShakingAnalysis(),
      disabled: state.isAnalyzing,
      shortcut: 'Ctrl+T'
    },
    {
      id: 'cdn-analysis',
      label: 'Analyze CDN Opportunities',
      icon: '🌐',
      onClick: () => eventClient.startCDNAnalysis(),
      disabled: state.isAnalyzing,
      separator: true
    },
    {
      id: 'export-analysis',
      label: 'Export Analysis',
      icon: '💾',
      onClick: () => {
        // TODO: Implement export functionality
        console.log('Export analysis functionality to be implemented');
      },
      disabled: state.modules.length === 0,
      shortcut: 'Ctrl+E'
    },
    {
      id: 'sample-data',
      label: 'Generate Sample Data (Dev)',
      icon: '⚡',
      onClick: () => eventClient.generateSampleData(),
      separator: true
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: '⚙️',
      onClick: () => handleTabChange('settings')
    }
  ];

  // Prepare filter configs
  const filterConfigs = [
    {
      key: 'showOnlyLargeModules',
      label: 'Large Modules Only',
      type: 'checkbox' as const,
      checked: state.filters.showOnlyLargeModules,
      onChange: (checked: boolean) => eventClient.updateFilters({ showOnlyLargeModules: checked }),
    },
    {
      key: 'showOnlyUnusedCode', 
      label: 'Unused Code Only',
      type: 'checkbox' as const,
      checked: state.filters.showOnlyUnusedCode,
      onChange: (checked: boolean) => eventClient.updateFilters({ showOnlyUnusedCode: checked }),
    },
    {
      key: 'showOnlyDuplicates',
      label: 'Duplicates Only', 
      type: 'checkbox' as const,
      checked: state.filters.showOnlyDuplicates,
      onChange: (checked: boolean) => eventClient.updateFilters({ showOnlyDuplicates: checked }),
    },
  ];

  // Footer stats
  const footerStats = [
    { label: 'Total Size', value: formatSize(state.stats.totalSize) },
    { label: 'Gzipped', value: formatSize(state.stats.totalGzipSize) },
    { label: 'Modules', value: state.stats.moduleCount.toString() },
  ];

  return (
    <div className={className} style={{ position: 'relative' }}>
      <PluginPanel
        title="Bundle Impact Analyzer"
        icon={Package}
      >
        {/* Stats Bar */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: SPACING.sm,
          backgroundColor: COLORS.background.secondary,
          borderBottom: `1px solid ${COLORS.border.primary}`,
        }}>
          <div style={{ display: 'flex', gap: SPACING.lg, alignItems: 'center' }}>
            {footerStats.map(stat => (
              <div key={stat.label} style={{
                display: 'flex',
                alignItems: 'center',
                gap: SPACING.xs,
              }}>
                <span style={{
                  fontSize: TYPOGRAPHY.fontSize.sm,
                  color: COLORS.text.secondary,
                }}>
                  {stat.label}:
                </span>
                <span style={{ 
                  fontWeight: 600,
                  color: COLORS.text.primary,
                  fontSize: TYPOGRAPHY.fontSize.sm,
                }}>
                  {stat.value}
                </span>
              </div>
            ))}
          </div>
          
          {state.isAnalyzing && (
            <StatusIndicator
              status="loading"
              label={`Analyzing... ${state.jobs.find(j => j.status === 'running')?.progress || 0}%`}
              size="sm"
            />
          )}
        </div>

      {/* Filter Bar */}
      {state.modules.length > 0 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: SPACING.sm,
          backgroundColor: COLORS.background.tertiary,
          borderBottom: `1px solid ${COLORS.border.primary}`,
          gap: SPACING.md,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.sm }}>
            {filterConfigs.map(config => (
              <label key={config.key} style={{
                display: 'flex',
                alignItems: 'center',
                gap: SPACING.xs,
                cursor: 'pointer',
                color: COLORS.text.secondary,
                fontSize: TYPOGRAPHY.fontSize.sm,
              }}>
                <input
                  type="checkbox"
                  checked={config.checked}
                  onChange={(e) => config.onChange(e.target.checked)}
                />
                {config.label}
              </label>
            ))}
          </div>
          
          <SearchInput
            value={state.filters.searchQuery}
            onChange={(value) => eventClient.updateFilters({ searchQuery: value })}
            placeholder="Search modules..."
            size="sm"
          />
        </div>
      )}

      <div>
        <Tabs
          activeTab={activeTab}
          onTabChange={(tabId) => handleTabChange(tabId as BundleAnalyzerTab)}
          tabs={tabs.map(tab => ({
            id: tab.id,
            label: tab.label,
            icon: React.createElement(tab.icon),
            badge: tab.badge,
          }))}
        />
        <ScrollableContainer>
          {activeTab === 'overview' && <OverviewTab state={state} eventClient={eventClient} />}
          {activeTab === 'modules' && <ModulesTab state={state} eventClient={eventClient} />}
          {activeTab === 'chunks' && <ChunksTab state={state} eventClient={eventClient} />}
          {activeTab === 'tree-shaking' && <TreeShakingTab state={state} eventClient={eventClient} />}
          {activeTab === 'recommendations' && <RecommendationsTab state={state} eventClient={eventClient} />}
          {activeTab === 'cdn-analysis' && <CDNAnalysisTab state={state} eventClient={eventClient} />}
          {activeTab === 'visualization' && <VisualizationTab state={state} eventClient={eventClient} />}
          {activeTab === 'settings' && <SettingsTab state={state} eventClient={eventClient} />}
        </ScrollableContainer>
      </div>

      {/* Custom children */}
      {children}

      </PluginPanel>

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