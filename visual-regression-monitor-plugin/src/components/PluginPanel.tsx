import React from 'react';
import { clsx } from 'clsx';
import { 
  Camera, 
  GitCompare, 
  Timeline, 
  Play, 
  Settings, 
  Zap,
  AlertCircle,
  CheckCircle,
  Activity
} from 'lucide-react';
import { useSyncExternalStore } from 'use-sync-external-store/shim';
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

  const renderActiveTab = () => {
    switch (state.ui.activeTab) {
      case 'screenshots':
        return <ScreenshotCapture />;
      case 'comparisons':
        return <VisualDiff />;
      case 'timeline':
        return <TimelineView />;
      case 'animations':
        return <ComparisonView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <ScreenshotCapture />;
    }
  };

  const getStatusColor = () => {
    if (!state.isPlaywrightConnected) return 'text-red-500';
    if (state.isCapturing || state.isAnalyzing) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getStatusText = () => {
    if (!state.isPlaywrightConnected) return 'Disconnected';
    if (state.isCapturing) return 'Capturing';
    if (state.isAnalyzing) return 'Analyzing';
    return 'Ready';
  };

  const getConnectionDot = () => {
    if (!state.isPlaywrightConnected) return 'bg-red-400';
    if (state.isCapturing || state.isAnalyzing) return 'bg-yellow-400 animate-pulse';
    return 'bg-green-400';
  };

  return (
    <div className={clsx('flex flex-col h-full bg-gray-50 dark:bg-gray-900', className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <Camera className="w-5 h-5 text-blue-500" />
          <span className="font-semibold text-gray-900 dark:text-white">
            Visual Regression Monitor
          </span>
          <div className="flex items-center gap-1 ml-2">
            <div className={clsx('w-2 h-2 rounded-full', getConnectionDot())} />
            <span className={clsx('text-xs font-medium', getStatusColor())}>
              {getStatusText()}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Playwright Connection Status */}
          {!state.isPlaywrightConnected && (
            <button
              onClick={client.connectPlaywright}
              className="flex items-center gap-1 px-2 py-1 text-xs rounded bg-blue-500 text-white hover:bg-blue-600 transition-colors"
              title="Connect to Playwright"
            >
              <Zap className="w-3 h-3" />
              Connect
            </button>
          )}

          {/* Quick Actions */}
          <button
            onClick={() => client.selectTab('screenshots')}
            className={clsx(
              'flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors',
              state.ui.activeTab === 'screenshots'
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
            )}
            disabled={state.isCapturing}
            title="Capture Screenshot"
          >
            <Camera className="w-3 h-3" />
            Capture
          </button>

          <button
            onClick={() => client.selectTab('comparisons')}
            className={clsx(
              'flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors',
              state.ui.activeTab === 'comparisons'
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
            )}
            disabled={state.isAnalyzing}
            title="Compare Screenshots"
          >
            <GitCompare className="w-3 h-3" />
            Compare
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="flex items-center justify-between px-3 py-2 bg-gray-100 dark:bg-gray-800 text-xs text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <Camera className="w-3 h-3" />
            <span>Screenshots: {state.stats.totalScreenshots}</span>
          </div>
          <div className="flex items-center gap-1">
            <GitCompare className="w-3 h-3" />
            <span>Comparisons: {state.stats.totalDiffs}</span>
          </div>
          <div className="flex items-center gap-1">
            <CheckCircle className="w-3 h-3 text-green-500" />
            <span>Passed: {state.stats.passedTests}</span>
          </div>
          <div className="flex items-center gap-1">
            <AlertCircle className="w-3 h-3 text-red-500" />
            <span>Failed: {state.stats.failedTests}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs">
          {state.stats.storageUsed > 0 && (
            <span>
              Storage: {(state.stats.storageUsed / (1024 * 1024)).toFixed(1)}MB
            </span>
          )}
          {state.stats.lastCaptureTime && (
            <span>
              Last: {new Date(state.stats.lastCaptureTime).toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => client.selectTab('screenshots')}
          className={clsx(
            'flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors',
            state.ui.activeTab === 'screenshots'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          )}
        >
          <Camera className="w-4 h-4" />
          Screenshots ({state.stats.totalScreenshots})
        </button>
        
        <button
          onClick={() => client.selectTab('comparisons')}
          className={clsx(
            'flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors',
            state.ui.activeTab === 'comparisons'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          )}
        >
          <GitCompare className="w-4 h-4" />
          Comparisons ({state.stats.totalDiffs})
        </button>
        
        <button
          onClick={() => client.selectTab('timeline')}
          className={clsx(
            'flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors',
            state.ui.activeTab === 'timeline'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          )}
        >
          <Timeline className="w-4 h-4" />
          Timeline
        </button>
        
        <button
          onClick={() => client.selectTab('animations')}
          className={clsx(
            'flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors',
            state.ui.activeTab === 'animations'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          )}
        >
          <Play className="w-4 h-4" />
          Animations ({Object.keys(state.animationSequences).length})
        </button>
        
        <button
          onClick={() => client.selectTab('settings')}
          className={clsx(
            'flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors',
            state.ui.activeTab === 'settings'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          )}
        >
          <Settings className="w-4 h-4" />
          Settings
        </button>
      </div>

      {/* Activity Indicator */}
      {(state.isCapturing || state.isAnalyzing) && (
        <div className="px-3 py-2 bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800">
          <div className="flex items-center gap-2 text-sm text-yellow-800 dark:text-yellow-200">
            <Activity className="w-4 h-4 animate-spin" />
            {state.isCapturing && 'Capturing screenshots...'}
            {state.isAnalyzing && 'Analyzing visual differences...'}
          </div>
        </div>
      )}

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        {renderActiveTab()}
      </div>
    </div>
  );
}

export default PluginPanel;