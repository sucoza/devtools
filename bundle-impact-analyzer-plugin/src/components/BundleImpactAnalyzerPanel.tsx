import React, { useMemo, useEffect } from 'react';
import { useSyncExternalStore } from 'use-sync-external-store/shim';
import { clsx } from 'clsx';
import {
  Package,
  Activity,
  BarChart3,
  TreePine,
  Search,
  Settings,
  Play,
  Square,
  Zap,
  Globe,
  FileText,
  TrendingUp,
  Filter,
} from 'lucide-react';

import type { BundleAnalyzerState } from '../types';
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
  onEvent?: (event: any) => void;
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

/**
 * Main Bundle Impact Analyzer DevTools Panel
 */
export function BundleImpactAnalyzerPanel({
  className,
  style,
  theme = 'auto',
  compact = false,
  defaultTab = 'overview',
  onTabChange,
  onEvent,
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

  // Handle events
  const handleEvent = (action: any) => {
    onEvent?.(action);
  };

  // Tab configuration
  const tabs: Array<{
    id: BundleAnalyzerTab;
    label: string;
    icon: React.ComponentType<any>;
    component: React.ComponentType<{ state: BundleAnalyzerState; eventClient: any }>;
    badge?: string | number;
  }> = [
    {
      id: 'overview',
      label: 'Overview',
      icon: BarChart3,
      component: OverviewTab,
      badge: state.isAnalyzing ? '...' : undefined,
    },
    {
      id: 'modules',
      label: 'Modules',
      icon: Package,
      component: ModulesTab,
      badge: state.modules.length,
    },
    {
      id: 'chunks',
      label: 'Chunks',
      icon: FileText,
      component: ChunksTab,
      badge: state.chunks.length,
    },
    {
      id: 'tree-shaking',
      label: 'Tree Shaking',
      icon: TreePine,
      component: TreeShakingTab,
      badge: state.stats.treeShakingEfficiency > 0 
        ? `${(state.stats.treeShakingEfficiency * 100).toFixed(0)}%`
        : undefined,
    },
    {
      id: 'recommendations',
      label: 'Recommendations',
      icon: TrendingUp,
      component: RecommendationsTab,
      badge: state.recommendations.length || undefined,
    },
    {
      id: 'cdn-analysis',
      label: 'CDN',
      icon: Globe,
      component: CDNAnalysisTab,
      badge: state.cdnAnalysis.length || undefined,
    },
    {
      id: 'visualization',
      label: 'Visualization',
      icon: Activity,
      component: VisualizationTab,
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      component: SettingsTab,
    },
  ];

  const ActiveTabComponent = tabs.find(tab => tab.id === activeTab)?.component || OverviewTab;

  // Format file size
  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div
      className={clsx(
        'bundle-impact-analyzer-devtools',
        `theme-${theme}`,
        { 'compact': compact },
        className
      )}
      style={style}
      data-testid="bundle-impact-analyzer-devtools"
    >
      {/* Header */}
      <div className="devtools-header">
        <div className="devtools-title">
          <Package size={16} />
          <span>Bundle Impact Analyzer</span>
        </div>
        
        {/* Quick Stats */}
        <div className="quick-stats">
          <div className="stat">
            <span className="stat-label">Total Size:</span>
            <span className="stat-value">{formatSize(state.stats.totalSize)}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Gzipped:</span>
            <span className="stat-value">{formatSize(state.stats.totalGzipSize)}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Modules:</span>
            <span className="stat-value">{state.stats.moduleCount}</span>
          </div>
        </div>
        
        {/* Quick Actions */}
        <div className="quick-actions">
          <button
            onClick={() => {
              if (state.isAnalyzing) {
                eventClient.stopAnalysis();
              } else {
                eventClient.startAnalysis();
              }
            }}
            className={clsx('quick-action-btn', {
              'analyzing': state.isAnalyzing,
            })}
            title={state.isAnalyzing ? 'Stop Analysis' : 'Start Analysis'}
          >
            {state.isAnalyzing ? (
              <Square size={14} />
            ) : (
              <Play size={14} />
            )}
          </button>

          <button
            onClick={() => eventClient.startTreeShakingAnalysis()}
            className="quick-action-btn"
            title="Analyze Tree Shaking"
          >
            <TreePine size={14} />
          </button>

          <button
            onClick={() => eventClient.startCDNAnalysis()}
            className="quick-action-btn"
            title="Analyze CDN Opportunities"
          >
            <Globe size={14} />
          </button>

          <button
            onClick={() => eventClient.generateSampleData()}
            className="quick-action-btn"
            title="Generate Sample Data (Dev)"
          >
            <Zap size={14} />
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      {state.modules.length > 0 && (
        <div className="filter-bar">
          <div className="filter-group">
            <Filter size={14} />
            <label>
              <input
                type="checkbox"
                checked={state.filters.showOnlyLargeModules}
                onChange={(e) =>
                  eventClient.updateFilters({ showOnlyLargeModules: e.target.checked })
                }
              />
              Large Modules Only
            </label>
            <label>
              <input
                type="checkbox"
                checked={state.filters.showOnlyUnusedCode}
                onChange={(e) =>
                  eventClient.updateFilters({ showOnlyUnusedCode: e.target.checked })
                }
              />
              Unused Code Only
            </label>
            <label>
              <input
                type="checkbox"
                checked={state.filters.showOnlyDuplicates}
                onChange={(e) =>
                  eventClient.updateFilters({ showOnlyDuplicates: e.target.checked })
                }
              />
              Duplicates Only
            </label>
          </div>
          
          <div className="search-group">
            <Search size={14} />
            <input
              type="text"
              placeholder="Search modules..."
              value={state.filters.searchQuery}
              onChange={(e) =>
                eventClient.updateFilters({ searchQuery: e.target.value })
              }
              className="search-input"
            />
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="tab-navigation">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={clsx('tab-button', {
              active: activeTab === tab.id,
            })}
            title={tab.label}
          >
            <tab.icon size={14} />
            <span className="tab-label">{tab.label}</span>
            {tab.badge && (
              <span className="tab-badge">{tab.badge}</span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        <ActiveTabComponent 
          state={state} 
          eventClient={eventClient}
        />
      </div>

      {/* Analysis Progress */}
      {state.isAnalyzing && (
        <div className="analysis-progress">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ 
                width: `${state.jobs.find(j => j.status === 'running')?.progress || 0}%` 
              }}
            />
          </div>
          <span className="progress-text">
            Analyzing bundle... {state.jobs.find(j => j.status === 'running')?.progress || 0}%
          </span>
        </div>
      )}

      {/* Custom children */}
      {children}

      <style jsx>{`
        .bundle-impact-analyzer-devtools {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: var(--bg-primary);
          border: 1px solid var(--border-primary);
          border-radius: 8px;
          overflow: hidden;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          font-size: 12px;
        }

        .devtools-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 12px;
          background: var(--bg-secondary);
          border-bottom: 1px solid var(--border-primary);
        }

        .devtools-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 600;
          color: var(--text-primary);
        }

        .quick-stats {
          display: flex;
          gap: 16px;
        }

        .stat {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
        }

        .stat-label {
          font-size: 10px;
          color: var(--text-secondary);
        }

        .stat-value {
          font-weight: 600;
          color: var(--text-primary);
        }

        .quick-actions {
          display: flex;
          gap: 4px;
        }

        .quick-action-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          border: 1px solid var(--border-primary);
          background: var(--bg-primary);
          border-radius: 4px;
          cursor: pointer;
          color: var(--text-primary);
        }

        .quick-action-btn:hover {
          background: var(--bg-hover);
        }

        .quick-action-btn.analyzing {
          background: var(--accent-primary);
          color: white;
        }

        .filter-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 12px;
          background: var(--bg-tertiary);
          border-bottom: 1px solid var(--border-primary);
        }

        .filter-group {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .filter-group label {
          display: flex;
          align-items: center;
          gap: 4px;
          cursor: pointer;
          color: var(--text-secondary);
        }

        .search-group {
          display: flex;
          align-items: center;
          gap: 6px;
          color: var(--text-secondary);
        }

        .search-input {
          padding: 4px 8px;
          border: 1px solid var(--border-primary);
          border-radius: 4px;
          background: var(--bg-primary);
          color: var(--text-primary);
          font-size: 11px;
        }

        .tab-navigation {
          display: flex;
          background: var(--bg-secondary);
          border-bottom: 1px solid var(--border-primary);
          overflow-x: auto;
        }

        .tab-button {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 12px;
          border: none;
          background: transparent;
          border-bottom: 2px solid transparent;
          cursor: pointer;
          color: var(--text-secondary);
          white-space: nowrap;
        }

        .tab-button:hover {
          color: var(--text-primary);
          background: var(--bg-hover);
        }

        .tab-button.active {
          color: var(--accent-primary);
          border-bottom-color: var(--accent-primary);
        }

        .tab-label {
          font-size: 11px;
        }

        .tab-badge {
          background: var(--accent-secondary);
          color: white;
          padding: 2px 6px;
          border-radius: 10px;
          font-size: 9px;
          font-weight: 600;
        }

        .tab-content {
          flex: 1;
          overflow: auto;
        }

        .analysis-progress {
          padding: 8px 12px;
          background: var(--bg-secondary);
          border-top: 1px solid var(--border-primary);
        }

        .progress-bar {
          height: 4px;
          background: var(--bg-tertiary);
          border-radius: 2px;
          overflow: hidden;
          margin-bottom: 4px;
        }

        .progress-fill {
          height: 100%;
          background: var(--accent-primary);
          transition: width 0.3s ease;
        }

        .progress-text {
          font-size: 10px;
          color: var(--text-secondary);
        }

        /* Theme variables */
        .theme-light {
          --bg-primary: #ffffff;
          --bg-secondary: #f8f9fa;
          --bg-tertiary: #e9ecef;
          --bg-hover: #f1f3f4;
          --text-primary: #202124;
          --text-secondary: #5f6368;
          --border-primary: #dadce0;
          --accent-primary: #1a73e8;
          --accent-secondary: #34a853;
        }

        .theme-dark {
          --bg-primary: #202124;
          --bg-secondary: #292a2d;
          --bg-tertiary: #35363a;
          --bg-hover: #3c4043;
          --text-primary: #e8eaed;
          --text-secondary: #9aa0a6;
          --border-primary: #3c4043;
          --accent-primary: #8ab4f8;
          --accent-secondary: #81c995;
        }

        .theme-auto {
          --bg-primary: #ffffff;
          --bg-secondary: #f8f9fa;
          --bg-tertiary: #e9ecef;
          --bg-hover: #f1f3f4;
          --text-primary: #202124;
          --text-secondary: #5f6368;
          --border-primary: #dadce0;
          --accent-primary: #1a73e8;
          --accent-secondary: #34a853;
        }

        @media (prefers-color-scheme: dark) {
          .theme-auto {
            --bg-primary: #202124;
            --bg-secondary: #292a2d;
            --bg-tertiary: #35363a;
            --bg-hover: #3c4043;
            --text-primary: #e8eaed;
            --text-secondary: #9aa0a6;
            --border-primary: #3c4043;
            --accent-primary: #8ab4f8;
            --accent-secondary: #81c995;
          }
        }

        .compact {
          font-size: 11px;
        }

        .compact .devtools-header {
          padding: 6px 10px;
        }

        .compact .tab-button {
          padding: 6px 10px;
        }

        .compact .filter-bar {
          padding: 6px 10px;
        }
      `}</style>
    </div>
  );
}