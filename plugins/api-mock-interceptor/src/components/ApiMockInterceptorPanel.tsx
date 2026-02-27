import React from 'react';
import { Settings, Network, Database, List } from 'lucide-react';
import {
  PluginPanel,
  ConfigMenu,
  type ConfigMenuItem
} from '@sucoza/shared-components';
import { useInterceptor } from '../hooks/useInterceptor';
import { ApiCallsTab } from './ApiCallsTab';
import { MockRulesTab } from './MockRulesTab';
import { ScenariosTab } from './ScenariosTab';
import { SettingsTab } from './SettingsTab';

export interface ApiMockInterceptorPanelProps {
  className?: string;
}

/**
 * Main API Mock Interceptor DevTools Panel
 */
export function ApiMockInterceptorPanel({ className }: ApiMockInterceptorPanelProps) {
  const { state, actions } = useInterceptor();

  const handleClearCalls = () => {
    if (confirm('Are you sure you want to clear all API calls?')) {
      actions.clearApiCalls();
    }
  };

  const tabs = [
    {
      id: 'calls',
      label: 'API Calls',
      icon: List,
      badge: Object.keys(state.apiCalls).length > 0 ? { count: Object.keys(state.apiCalls).length } : undefined,
      content: <ApiCallsTab />
    },
    {
      id: 'mocks',
      label: 'Mock Rules',
      icon: Database,
      badge: Object.keys(state.mockRules).length > 0 ? { count: Object.keys(state.mockRules).length } : undefined,
      content: <MockRulesTab />
    },
    {
      id: 'scenarios',
      label: 'Scenarios',
      icon: Network,
      badge: Object.keys(state.mockScenarios).length > 0 ? { count: Object.keys(state.mockScenarios).length } : undefined,
      content: <ScenariosTab />
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      content: <SettingsTab />
    }
  ];

  const configMenuItems: ConfigMenuItem[] = [
    {
      id: 'toggle-recording',
      label: state.isRecording ? 'Stop Recording' : 'Start Recording',
      icon: state.isRecording ? '⏸️' : '▶️',
      onClick: actions.toggleRecording,
      shortcut: 'Ctrl+R'
    },
    {
      id: 'toggle-interception',
      label: state.isInterceptionEnabled ? 'Disable Interception' : 'Enable Interception',
      icon: state.isInterceptionEnabled ? '🔴' : '🟢',
      onClick: state.isInterceptionEnabled ? actions.disableInterception : actions.enableInterception,
      shortcut: 'Ctrl+I'
    },
    {
      id: 'clear-calls',
      label: 'Clear All API Calls',
      icon: '🗑️',
      onClick: handleClearCalls,
      separator: true,
      shortcut: 'Ctrl+K'
    },
    {
      id: 'export-data',
      label: 'Export Data',
      icon: '💾',
      onClick: () => {
        // TODO: Implement export functionality
        console.log('Export data functionality to be implemented');
      },
      shortcut: 'Ctrl+E'
    },
    {
      id: 'import-scenario',
      label: 'Import Scenario',
      icon: '📁',
      onClick: () => {
        // TODO: Implement import functionality
        console.log('Import scenario functionality to be implemented');
      }
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: '⚙️',
      onClick: () => {
        // Navigate to settings tab or open settings dialog
        actions.selectTab('settings');
      },
      separator: true
    }
  ];

  const pluginMetrics = [
    { label: 'Total', value: state.stats.totalCalls },
    { label: 'Mocked', value: state.stats.mockedCalls },
    { label: 'Errors', value: state.stats.errorCount },
    ...(state.stats.averageResponseTime > 0 ? [{ label: 'Avg Response', value: `${state.stats.averageResponseTime}ms` }] : [])
  ];

  return (
    <div className={className} style={{ position: 'relative' }}>
      <PluginPanel
        title="API Mock Interceptor"
        icon={Network}
        subtitle={
          (state.isInterceptionEnabled ? 'Active' : 'Inactive') +
          (state.activeMockScenario ? ` • Scenario: ${state.mockScenarios[state.activeMockScenario]?.name || 'Unknown'}` : '')
        }
        status={{
          isActive: state.isInterceptionEnabled,
          label: state.isInterceptionEnabled ? 'Active' : 'Inactive'
        }}
        tabs={tabs}
        activeTabId={state.ui.activeTab}
        onTabChange={actions.selectTab}
        metrics={pluginMetrics}
        showMetrics={true}
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

export default ApiMockInterceptorPanel;