import React from 'react';
import { 
  Camera, 
  GitCompare, 
  History, 
  Play, 
  Settings, 
  Zap,
  Activity
} from 'lucide-react';
import { useSyncExternalStore } from 'use-sync-external-store/shim';
import {
  PluginPanel as BasePluginPanel,
  ScrollableContainer,
  Tabs,
  Toolbar,
  Footer,
  Alert,
  ConfigMenu,
  type ConfigMenuItem,
} from '@sucoza/shared-components';
import { createVisualRegressionDevToolsClient } from '../core/devtools-client';
import { ScreenshotCapture } from './ScreenshotCapture';
import { VisualDiff } from './VisualDiff';
import { Timeline as TimelineView } from './Timeline';
import { ComparisonView } from './ComparisonView';
import { Settings as SettingsView } from './Settings';

export interface PluginPanelProps {
  className?: string;
}

/**
 * Main Visual Regression Monitor DevTools Panel
 */
export function PluginPanel({ className }: PluginPanelProps) {
  const client = createVisualRegressionDevToolsClient();
  
  // Subscribe to store state
  const state = useSyncExternalStore(
    client.subscribe,
    client.getState,
    client.getState
  );

  // Tab configuration
  const tabs = [
    {
      id: 'screenshots',
      label: 'Screenshots',
      icon: <Camera size={16} />,
      badge: state.stats.totalScreenshots
    },
    {
      id: 'comparisons',
      label: 'Comparisons',
      icon: <GitCompare size={16} />,
      badge: state.stats.totalDiffs
    },
    { id: 'timeline', label: 'Timeline', icon: <History size={16} /> },
    {
      id: 'animations',
      label: 'Animations',
      icon: <Play size={16} />,
      badge: Object.keys(state.animationSequences).length
    },
    { id: 'settings', label: 'Settings', icon: <Settings size={16} /> },
  ];

  // Toolbar actions
  const toolbarActions = [];

  if (!state.isPlaywrightConnected) {
    toolbarActions.push({
      icon: Zap,
      label: 'Connect',
      onClick: client.connectPlaywright,
      variant: 'primary' as const,
    });
  }

  toolbarActions.push(
    {
      icon: Camera,
      label: 'Capture',
      onClick: () => client.selectTab('screenshots'),
      disabled: state.isCapturing,
    },
    {
      icon: GitCompare,
      label: 'Compare',
      onClick: () => client.selectTab('comparisons'),
      disabled: state.isAnalyzing,
    }
  );

  // Status information
  const getStatus = () => {
    if (!state.isPlaywrightConnected) return { status: 'error' as const, label: 'Disconnected' };
    if (state.isCapturing) return { status: 'loading' as const, label: 'Capturing' };
    if (state.isAnalyzing) return { status: 'loading' as const, label: 'Analyzing' };
    return { status: 'success' as const, label: 'Ready' };
  };

  const { status: _status, label: _label } = getStatus();

  // Footer stats
  const footerStats = [
    { label: 'Screenshots', value: state.stats.totalScreenshots.toString() },
    { label: 'Comparisons', value: state.stats.totalDiffs.toString() },
    { label: 'Passed', value: state.stats.passedTests.toString() },
    { label: 'Failed', value: state.stats.failedTests.toString() },
  ];

  if (state.stats.storageUsed > 0) {
    footerStats.push({
      label: 'Storage',
      value: `${(state.stats.storageUsed / (1024 * 1024)).toFixed(1)}MB`,
    });
  }

  if (state.stats.lastCaptureTime) {
    footerStats.push({
      label: 'Last Capture',
      value: new Date(state.stats.lastCaptureTime).toLocaleTimeString(),
    });
  }

  // Convert actions into config menu items
  const configMenuItems: ConfigMenuItem[] = [
    {
      id: 'capture-baseline',
      label: state.isCapturing ? 'Capturing...' : 'Capture Baseline',
      icon: '📸',
      onClick: () => {
        client.selectTab('screenshots');
        // Trigger baseline capture
        client.startCapture();
      },
      disabled: state.isCapturing || !state.isPlaywrightConnected,
      shortcut: 'Ctrl+C'
    },
    {
      id: 'run-comparison',
      label: state.isAnalyzing ? 'Analyzing...' : 'Run Comparison',
      icon: '🔍',
      onClick: () => {
        client.selectTab('comparisons');
        // Trigger comparison
        client.startAnalysis();
      },
      disabled: state.isAnalyzing || !state.isPlaywrightConnected,
      shortcut: 'Ctrl+R'
    },
    {
      id: 'view-diff-report',
      label: 'View Diff Report',
      icon: '📊',
      onClick: () => client.selectTab('comparisons'),
      disabled: state.stats.totalDiffs === 0,
      shortcut: 'Ctrl+D'
    },
    {
      id: 'export-results',
      label: 'Export Results',
      icon: '💾',
      onClick: () => {
        const data = {
          screenshots: state.screenshots,
          visualDiffs: state.visualDiffs,
          stats: state.stats,
          timestamp: Date.now()
        };

        const dataStr = JSON.stringify(data, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `visual-regression-results-${Date.now()}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      },
      disabled: state.stats.totalScreenshots === 0,
      shortcut: 'Ctrl+E'
    },
    {
      id: 'clear-results',
      label: 'Clear Results',
      icon: '🗑️',
      onClick: () => {
        if (confirm('Are you sure you want to clear all visual regression data?')) {
          client.clearAllData();
        }
      },
      disabled: state.stats.totalScreenshots === 0,
      shortcut: 'Ctrl+K',
      separator: true
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: '⚙️',
      onClick: () => client.selectTab('settings')
    }
  ];

  return (
    <div style={{ position: 'relative', height: '100%' }}>
      <BasePluginPanel
        title="Visual Regression Monitor"
        icon={Camera}
        className={className}
      >
      <Toolbar actions={toolbarActions.map((action, index) => ({
        id: `action-${index}`,
        ...action
      }))} />

      {/* Activity Alert */}
      {(state.isCapturing || state.isAnalyzing) && (
        <Alert
          variant="default"
          icon={<Activity />}
          title={state.isCapturing ? 'Capturing screenshots...' : 'Analyzing visual differences...'}
        />
      )}

      <Tabs
        activeTab={state.ui.activeTab}
        onTabChange={(tabId) => client.selectTab(tabId as typeof state.ui.activeTab)}
        tabs={tabs.map(tab => ({
          ...tab,
          content: (
            <ScrollableContainer>
              {tab.id === 'screenshots' && <ScreenshotCapture />}
              {tab.id === 'comparisons' && <VisualDiff />}
              {tab.id === 'timeline' && <TimelineView />}
              {tab.id === 'animations' && <ComparisonView />}
              {tab.id === 'settings' && <SettingsView />}
            </ScrollableContainer>
          )
        }))}
      />

        <Footer stats={footerStats.map((stat, index) => ({
          id: `stat-${index}`,
          ...stat
        }))} />
      </BasePluginPanel>

      <div style={{ position: 'absolute', top: '12px', right: '12px', zIndex: 10 }}>
        <ConfigMenu items={configMenuItems} size="sm" />
      </div>
    </div>
  );
}

export default PluginPanel;