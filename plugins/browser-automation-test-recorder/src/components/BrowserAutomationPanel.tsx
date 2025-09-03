import React, { useMemo } from 'react';
import { useSyncExternalStore } from 'use-sync-external-store/shim';
import { clsx } from 'clsx';
import {
  Play,
  Square,
  Pause,
  RotateCcw,
  Settings,
  Code,
  MousePointer,
  Eye,
  Activity,
  Zap,
  Users,
} from 'lucide-react';

import type {
  BrowserAutomationDevToolsPanelProps,
  BrowserAutomationAction,
  DevToolsTab,
  TabComponentProps,
} from '../types';
import {
  createBrowserAutomationEventClient,
  getBrowserAutomationEventClient,
} from '../core';
import { ConfigMenu, type ConfigMenuItem } from '@sucoza/shared-components';

// Tab Components (placeholder implementations)
import RecorderTab from './tabs/RecorderTab';
import PlaybackTab from './tabs/PlaybackTab';
import EventsTab from './tabs/EventsTab';
import SelectorsTab from './tabs/SelectorsTab';
import TestGeneratorTab from './tabs/TestGeneratorTab';
import SettingsTab from './tabs/SettingsTab';
import AdvancedFeaturesTab from './tabs/AdvancedFeaturesTab';
import { CollaborationTab } from './tabs/CollaborationTab';

/**
 * Main Browser Automation Test Recorder DevTools Panel
 */
export function BrowserAutomationPanel({
  className,
  style,
  theme = 'auto',
  compact = false,
  defaultTab: _defaultTab = 'recorder',
  onTabChange,
  onEvent,
  children,
}: BrowserAutomationDevToolsPanelProps) {
  // Create or get event client
  const eventClient = useMemo(() => {
    return getBrowserAutomationEventClient() || createBrowserAutomationEventClient();
  }, []);

  // Subscribe to state changes
  const state = useSyncExternalStore(
    eventClient.subscribe,
    eventClient.getState,
    eventClient.getState
  );

  // Handle tab changes
  const handleTabChange = (tab: DevToolsTab) => {
    eventClient.selectTab(tab);
    onTabChange?.(tab);
  };

  // Handle events
  const handleEvent = (action: BrowserAutomationAction) => {
    eventClient.dispatch(action);
    onEvent?.(action);
  };

  // Config menu items
  const configMenuItems: ConfigMenuItem[] = [
    {
      id: 'toggle-recording',
      label: state.recording.isRecording
        ? state.recording.isPaused
          ? 'Resume Recording'
          : 'Pause Recording'
        : 'Start Recording',
      icon: state.recording.isRecording && !state.recording.isPaused ? '⏸️' : '▶️',
      onClick: () => {
        if (state.recording.isRecording) {
          if (state.recording.isPaused) {
            eventClient.resumeRecording();
          } else {
            eventClient.pauseRecording();
          }
        } else {
          eventClient.startRecording();
        }
      },
      shortcut: 'Ctrl+R'
    },
    {
      id: 'stop-recording',
      label: 'Stop Recording',
      icon: '⏹️',
      onClick: () => eventClient.stopRecording(),
      disabled: !state.recording.isRecording,
      shortcut: 'Ctrl+S'
    },
    {
      id: 'clear-events',
      label: 'Clear Events',
      icon: '🗑️',
      onClick: () => eventClient.clearRecording(),
      disabled: state.events.length === 0,
      separator: true,
      shortcut: 'Ctrl+K'
    },
    {
      id: 'generate-test',
      label: 'Generate Test',
      icon: '🧪',
      onClick: () => {
        handleTabChange('test-generator');
      },
      disabled: state.events.length === 0
    },
    {
      id: 'export-events',
      label: 'Export Events',
      icon: '💾',
      onClick: () => {
        // TODO: Implement export functionality
        console.log('Export events functionality to be implemented');
      },
      disabled: state.events.length === 0,
      shortcut: 'Ctrl+E'
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: '⚙️',
      onClick: () => {
        handleTabChange('settings');
      },
      separator: true
    }
  ];

  // Tab configuration
  const tabs: Array<{
    id: DevToolsTab;
    label: string;
    icon: React.ComponentType<{ size?: number }>;
    component: React.ComponentType<TabComponentProps>;
  }> = [
    {
      id: 'recorder',
      label: 'Recorder',
      icon: Activity,
      component: RecorderTab,
    },
    {
      id: 'playback',
      label: 'Playback',
      icon: Play,
      component: PlaybackTab,
    },
    {
      id: 'events',
      label: 'Events',
      icon: MousePointer,
      component: EventsTab,
    },
    {
      id: 'selectors',
      label: 'Selectors',
      icon: Eye,
      component: SelectorsTab,
    },
    {
      id: 'test-generator',
      label: 'Tests',
      icon: Code,
      component: TestGeneratorTab,
    },
    {
      id: 'advanced-features',
      label: 'Advanced',
      icon: Zap,
      component: AdvancedFeaturesTab,
    },
    {
      id: 'collaboration',
      label: 'Team',
      icon: Users,
      component: CollaborationTab,
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      component: SettingsTab,
    },
  ];

  const activeTab = state.ui.activeTab;
  const ActiveTabComponent = tabs.find(tab => tab.id === activeTab)?.component || RecorderTab;

  return (
    <div
      className={clsx(
        'browser-automation-devtools',
        `theme-${theme}`,
        { 'compact': compact },
        className
      )}
      style={style}
      data-testid="browser-automation-devtools"
    >
      {/* Header */}
      <div className="devtools-header">
        <div className="devtools-title">
          <Activity size={16} />
          <span>Browser Automation Test Recorder</span>
        </div>
        
        {/* Config Menu */}
        <div className="config-menu">
          <ConfigMenu items={configMenuItems} size="sm" />
        </div>
      </div>

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
            <tab.icon size={compact ? 14 : 16} />
            {!compact && <span>{tab.label}</span>}
          </button>
        ))}
      </div>

      {/* Status Bar */}
      <div className="status-bar">
        <div className="status-item">
          <span className="status-label">Events:</span>
          <span className="status-value">{state.events.length}</span>
        </div>
        
        {state.recording.isRecording && (
          <div className="status-item">
            <span className="status-label">Recording:</span>
            <span className={clsx('status-indicator', {
              'active': !state.recording.isPaused,
              'paused': state.recording.isPaused,
            })}>
              {state.recording.isPaused ? 'Paused' : 'Active'}
            </span>
          </div>
        )}

        {state.playback.isPlaying && (
          <div className="status-item">
            <span className="status-label">Playback:</span>
            <span className="status-value">
              {state.playback.status.currentStep}/{state.playback.status.totalSteps}
            </span>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="tab-content">
        <ActiveTabComponent
          state={state}
          dispatch={handleEvent}
          compact={compact}
        />
      </div>

      {children}

      <style>{`
        .browser-automation-devtools {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: var(--bg-primary, #ffffff);
          border: 1px solid var(--border-color, #e1e5e9);
          border-radius: 8px;
          font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;
          font-size: 13px;
        }

        .theme-dark .browser-automation-devtools {
          background: var(--bg-primary, #1a1a1a);
          border-color: var(--border-color, #333);
          color: var(--text-primary, #ffffff);
        }

        .devtools-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 12px;
          background: var(--bg-secondary, #f8f9fa);
          border-bottom: 1px solid var(--border-color, #e1e5e9);
        }

        .theme-dark .devtools-header {
          background: var(--bg-secondary, #2a2a2a);
          border-color: var(--border-color, #333);
        }

        .devtools-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 600;
          color: var(--text-primary, #1a1a1a);
        }

        .theme-dark .devtools-title {
          color: var(--text-primary, #ffffff);
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
          border: none;
          border-radius: 4px;
          background: transparent;
          color: var(--text-secondary, #6c757d);
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .quick-action-btn:hover {
          background: var(--bg-hover, #e9ecef);
          color: var(--text-primary, #1a1a1a);
        }

        .quick-action-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .quick-action-btn.recording {
          background: var(--color-success, #28a745);
          color: white;
        }

        .quick-action-btn.paused {
          background: var(--color-warning, #ffc107);
          color: #1a1a1a;
        }

        .theme-dark .quick-action-btn:hover {
          background: var(--bg-hover, #3a3a3a);
          color: var(--text-primary, #ffffff);
        }

        .tab-navigation {
          display: flex;
          background: var(--bg-secondary, #f8f9fa);
          border-bottom: 1px solid var(--border-color, #e1e5e9);
        }

        .theme-dark .tab-navigation {
          background: var(--bg-secondary, #2a2a2a);
          border-color: var(--border-color, #333);
        }

        .tab-button {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 12px;
          border: none;
          background: transparent;
          color: var(--text-secondary, #6c757d);
          cursor: pointer;
          transition: all 0.2s ease;
          border-bottom: 2px solid transparent;
        }

        .tab-button:hover {
          background: var(--bg-hover, #e9ecef);
          color: var(--text-primary, #1a1a1a);
        }

        .tab-button.active {
          color: var(--color-primary, #007bff);
          border-bottom-color: var(--color-primary, #007bff);
          background: var(--bg-active, #ffffff);
        }

        .theme-dark .tab-button:hover {
          background: var(--bg-hover, #3a3a3a);
          color: var(--text-primary, #ffffff);
        }

        .theme-dark .tab-button.active {
          background: var(--bg-active, #1a1a1a);
        }

        .status-bar {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 6px 12px;
          background: var(--bg-tertiary, #f1f3f4);
          border-bottom: 1px solid var(--border-color, #e1e5e9);
          font-size: 11px;
        }

        .theme-dark .status-bar {
          background: var(--bg-tertiary, #333);
          border-color: var(--border-color, #444);
        }

        .status-item {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .status-label {
          color: var(--text-secondary, #6c757d);
        }

        .status-value {
          font-weight: 500;
          color: var(--text-primary, #1a1a1a);
        }

        .theme-dark .status-value {
          color: var(--text-primary, #ffffff);
        }

        .status-indicator {
          padding: 2px 6px;
          border-radius: 2px;
          font-size: 10px;
          font-weight: 500;
          text-transform: uppercase;
        }

        .status-indicator.active {
          background: var(--color-success, #28a745);
          color: white;
        }

        .status-indicator.paused {
          background: var(--color-warning, #ffc107);
          color: #1a1a1a;
        }

        .tab-content {
          flex: 1;
          padding: 12px;
          overflow-y: auto;
        }

        .compact .tab-content {
          padding: 8px;
        }

        .compact .devtools-header {
          padding: 6px 8px;
        }

        .compact .status-bar {
          padding: 4px 8px;
        }

        .compact .tab-button {
          padding: 6px 8px;
        }
      `}</style>
    </div>
  );
}

export default BrowserAutomationPanel;