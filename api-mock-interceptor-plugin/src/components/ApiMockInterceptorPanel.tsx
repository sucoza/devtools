import React from 'react';
import { clsx } from 'clsx';
import { Play, Pause, RotateCcw, Settings, Network, Database, List } from 'lucide-react';
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

  const renderActiveTab = () => {
    switch (state.ui.activeTab) {
      case 'calls':
        return <ApiCallsTab />;
      case 'mocks':
        return <MockRulesTab />;
      case 'scenarios':
        return <ScenariosTab />;
      case 'settings':
        return <SettingsTab />;
      default:
        return <ApiCallsTab />;
    }
  };

  return (
    <div className={clsx('flex flex-col h-full bg-gray-50 dark:bg-gray-900', className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <Network className="w-5 h-5 text-blue-500" />
          <span className="font-semibold text-gray-900 dark:text-white">
            API Mock Interceptor
          </span>
          <div className="flex items-center gap-1 ml-2">
            <div
              className={clsx(
                'w-2 h-2 rounded-full',
                state.isInterceptionEnabled ? 'bg-green-400' : 'bg-gray-400'
              )}
            />
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {state.isInterceptionEnabled ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Recording Toggle */}
          <button
            onClick={actions.toggleRecording}
            className={clsx(
              'flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors',
              state.isRecording
                ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            )}
            title={state.isRecording ? 'Stop Recording' : 'Start Recording'}
          >
            {state.isRecording ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            {state.isRecording ? 'Recording' : 'Record'}
          </button>

          {/* Clear Button */}
          <button
            onClick={handleClearCalls}
            className="flex items-center gap-1 px-2 py-1 text-xs rounded bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 transition-colors"
            title="Clear All API Calls"
          >
            <RotateCcw className="w-3 h-3" />
            Clear
          </button>

          {/* Interception Toggle */}
          <button
            onClick={state.isInterceptionEnabled ? actions.disableInterception : actions.enableInterception}
            className={clsx(
              'px-3 py-1 text-xs rounded font-medium transition-colors',
              state.isInterceptionEnabled
                ? 'bg-green-500 text-white hover:bg-green-600'
                : 'bg-blue-500 text-white hover:bg-blue-600'
            )}
          >
            {state.isInterceptionEnabled ? 'Disable' : 'Enable'}
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="flex items-center justify-between px-3 py-2 bg-gray-100 dark:bg-gray-800 text-xs text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-4">
          <span>Total: {state.stats.totalCalls}</span>
          <span>Mocked: {state.stats.mockedCalls}</span>
          <span>Errors: {state.stats.errorCount}</span>
          {state.stats.averageResponseTime > 0 && (
            <span>Avg: {state.stats.averageResponseTime}ms</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {state.activeMockScenario && (
            <span className="px-2 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded">
              Scenario: {state.mockScenarios[state.activeMockScenario]?.name || 'Unknown'}
            </span>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => actions.selectTab('calls')}
          className={clsx(
            'flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors',
            state.ui.activeTab === 'calls'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          )}
        >
          <List className="w-4 h-4" />
          API Calls ({Object.keys(state.apiCalls).length})
        </button>
        
        <button
          onClick={() => actions.selectTab('mocks')}
          className={clsx(
            'flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors',
            state.ui.activeTab === 'mocks'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          )}
        >
          <Database className="w-4 h-4" />
          Mock Rules ({Object.keys(state.mockRules).length})
        </button>
        
        <button
          onClick={() => actions.selectTab('scenarios')}
          className={clsx(
            'flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors',
            state.ui.activeTab === 'scenarios'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          )}
        >
          <Network className="w-4 h-4" />
          Scenarios ({Object.keys(state.mockScenarios).length})
        </button>
        
        <button
          onClick={() => actions.selectTab('settings')}
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

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        {renderActiveTab()}
      </div>
    </div>
  );
}

export default ApiMockInterceptorPanel;