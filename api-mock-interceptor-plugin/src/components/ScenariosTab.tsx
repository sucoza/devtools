import React, { useState } from 'react';
import { clsx } from 'clsx';
import { Plus, Play, Pause, Edit, Trash2 } from 'lucide-react';
import { useInterceptor } from '../hooks/useInterceptor';
import { generateId, getTimestamp } from '../utils';
import type { MockScenario } from '../types';

/**
 * Mock Scenarios tab component
 */
export function ScenariosTab() {
  const { state, actions } = useInterceptor();
  const scenarios = Object.values(state.mockScenarios);
  const activeScenario = state.activeMockScenario ? state.mockScenarios[state.activeMockScenario] : null;

  const createScenario = () => {
    const newScenario: MockScenario = {
      id: generateId(),
      name: 'New Scenario',
      description: '',
      rules: [],
      enabled: true,
      createdAt: getTimestamp(),
      updatedAt: getTimestamp(),
    };
    
    actions.addScenario(newScenario);
  };

  const handleDelete = (scenarioId: string) => {
    if (confirm('Are you sure you want to delete this scenario?')) {
      actions.removeScenario(scenarioId);
    }
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Mock Scenarios ({scenarios.length})
          </h2>
          {activeScenario && (
            <div className="flex items-center gap-2 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              Active: {activeScenario.name}
            </div>
          )}
        </div>
        <button
          onClick={createScenario}
          className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Scenario
        </button>
      </div>

      {/* Scenarios List */}
      <div className="flex-1 overflow-auto">
        {scenarios.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
            <div className="text-center">
              <div className="text-lg font-medium mb-2">No scenarios found</div>
              <div className="text-sm mb-4">Create scenarios to group and manage multiple mock rules</div>
              <button
                onClick={createScenario}
                className="flex items-center gap-2 mx-auto px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Create Scenario
              </button>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {scenarios.map((scenario) => {
              const isActive = state.activeMockScenario === scenario.id;
              return (
                <div
                  key={scenario.id}
                  className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div
                        className={clsx(
                          'w-3 h-3 rounded-full',
                          isActive ? 'bg-green-400' : scenario.enabled ? 'bg-blue-400' : 'bg-gray-400'
                        )}
                      />
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {scenario.name}
                      </h3>
                      {isActive && (
                        <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded">
                          ACTIVE
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {isActive ? (
                        <button
                          onClick={() => actions.deactivateScenario()}
                          className="p-1 text-red-600 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/30 rounded transition-colors"
                          title="Deactivate scenario"
                        >
                          <Pause className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => actions.activateScenario(scenario.id)}
                          className="p-1 text-green-600 hover:bg-green-100 dark:text-green-400 dark:hover:bg-green-900/30 rounded transition-colors"
                          title="Activate scenario"
                        >
                          <Play className="w-4 h-4" />
                        </button>
                      )}
                      
                      <button
                        onClick={() => {
                          const name = prompt('Enter new name:', scenario.name);
                          if (name && name !== scenario.name) {
                            actions.updateScenario(scenario.id, { name });
                          }
                        }}
                        className="p-1 text-blue-600 hover:bg-blue-100 dark:text-blue-400 dark:hover:bg-blue-900/30 rounded transition-colors"
                        title="Edit scenario"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      
                      <button
                        onClick={() => handleDelete(scenario.id)}
                        className="p-1 text-red-600 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/30 rounded transition-colors"
                        title="Delete scenario"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    {scenario.description && (
                      <div>{scenario.description}</div>
                    )}
                    <div>
                      <strong>Rules:</strong> {scenario.rules.length}
                      {scenario.rules.length > 0 && (
                        <span className="ml-2">
                          ({scenario.rules.filter(r => r.enabled).length} enabled)
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-500">
                      Created: {formatTimestamp(scenario.createdAt)}
                      {scenario.updatedAt !== scenario.createdAt && 
                        ` • Updated: ${formatTimestamp(scenario.updatedAt)}`
                      }
                    </div>
                  </div>
                  
                  {scenario.rules.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                      <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Rules in this scenario:
                      </div>
                      <div className="space-y-1">
                        {scenario.rules.map((rule) => (
                          <div
                            key={rule.id}
                            className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded text-sm"
                          >
                            <div className="flex items-center gap-2">
                              <div
                                className={clsx(
                                  'w-2 h-2 rounded-full',
                                  rule.enabled ? 'bg-green-400' : 'bg-gray-400'
                                )}
                              />
                              <span className="text-gray-900 dark:text-white">{rule.name}</span>
                            </div>
                            <span className="text-gray-500 dark:text-gray-400">
                              {rule.matcher.method || 'ANY'} • {rule.mockResponse.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default ScenariosTab;