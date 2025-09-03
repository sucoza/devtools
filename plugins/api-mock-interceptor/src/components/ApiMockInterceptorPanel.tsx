import React from 'react';
import { Play, Pause, RotateCcw, Settings, Network, Database, List } from 'lucide-react';
import {
  PluginPanel,
  StatusIndicator,
  Badge
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

  const pluginActions = [
    {
      id: 'toggle-recording',
      label: state.isRecording ? 'Stop Recording' : 'Start Recording',
      icon: state.isRecording ? Pause : Play,
      onClick: actions.toggleRecording,
      variant: state.isRecording ? 'danger' as const : 'default' as const,
      tooltip: state.isRecording ? 'Stop Recording' : 'Start Recording'
    },
    {
      id: 'clear-calls',
      label: 'Clear',
      icon: RotateCcw,
      onClick: handleClearCalls,
      variant: 'default' as const,
      tooltip: 'Clear All API Calls'
    },
    {
      id: 'toggle-interception',
      label: state.isInterceptionEnabled ? 'Disable' : 'Enable',
      onClick: state.isInterceptionEnabled ? actions.disableInterception : actions.enableInterception,
      variant: 'primary' as const
    }
  ];

  const pluginMetrics = [
    { label: 'Total', value: state.stats.totalCalls },
    { label: 'Mocked', value: state.stats.mockedCalls },
    { label: 'Errors', value: state.stats.errorCount },
    ...(state.stats.averageResponseTime > 0 ? [{ label: 'Avg Response', value: `${state.stats.averageResponseTime}ms` }] : [])
  ];

  return (
    <PluginPanel
      className={className}
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
      actions={pluginActions}
      metrics={pluginMetrics}
      showMetrics={true}
    />
  );
}

export default ApiMockInterceptorPanel;