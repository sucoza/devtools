import React, { useState } from 'react';
import { clsx } from 'clsx';
import { Plus, Edit, Trash2, Play, Pause } from 'lucide-react';
import { useInterceptor } from '../hooks/useInterceptor';
import { MockRuleEditor } from './MockRuleEditor';
import { generateId, getTimestamp } from '../utils';
import type { MockRule } from '../types';

/**
 * Mock Rules tab component
 */
export function MockRulesTab() {
  const { state, actions, selectors } = useInterceptor();
  const [isCreating, setIsCreating] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  
  const mockRules = Object.values(state.mockRules).sort((a, b) => b.priority - a.priority);
  const selectedRule = selectors.getSelectedRule();

  const createNewRule = () => {
    const newRule: MockRule = {
      id: generateId(),
      name: 'New Mock Rule',
      enabled: true,
      priority: 1,
      matcher: {
        urlPattern: '*',
        method: 'GET',
      },
      mockResponse: {
        status: 200,
        statusText: 'OK',
        headers: { 'content-type': 'application/json' },
        body: { message: 'Mock response' },
      },
      createdAt: getTimestamp(),
      updatedAt: getTimestamp(),
    };
    
    actions.addMockRule(newRule);
    setEditingRuleId(newRule.id);
    actions.selectRule(newRule.id);
  };

  const handleDelete = (ruleId: string) => {
    if (confirm('Are you sure you want to delete this mock rule?')) {
      actions.removeMockRule(ruleId);
    }
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };

  if (editingRuleId || isCreating) {
    const rule = editingRuleId ? state.mockRules[editingRuleId] : null;
    return (
      <MockRuleEditor
        rule={rule}
        onSave={(updatedRule) => {
          if (editingRuleId && rule) {
            actions.updateMockRule(editingRuleId, updatedRule);
          } else {
            actions.addMockRule(updatedRule as MockRule);
          }
          setEditingRuleId(null);
          setIsCreating(false);
        }}
        onCancel={() => {
          setEditingRuleId(null);
          setIsCreating(false);
        }}
      />
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Mock Rules ({mockRules.length})
        </h2>
        <button
          onClick={createNewRule}
          className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Rule
        </button>
      </div>

      {/* Rules List */}
      <div className="flex-1 overflow-auto">
        {mockRules.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
            <div className="text-center">
              <div className="text-lg font-medium mb-2">No mock rules found</div>
              <div className="text-sm mb-4">Create your first mock rule to start intercepting API calls</div>
              <button
                onClick={createNewRule}
                className="flex items-center gap-2 mx-auto px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Create Mock Rule
              </button>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {mockRules.map((rule) => (
              <div
                key={rule.id}
                onClick={() => actions.selectRule(rule.id)}
                className={clsx(
                  'p-4 cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50',
                  selectedRule?.id === rule.id && 'bg-blue-50 dark:bg-blue-900/30'
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div
                      className={clsx(
                        'w-3 h-3 rounded-full',
                        rule.enabled ? 'bg-green-400' : 'bg-gray-400'
                      )}
                    />
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      {rule.name}
                    </h3>
                    <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded">
                      Priority: {rule.priority}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        actions.toggleMockRule(rule.id);
                      }}
                      className={clsx(
                        'p-1 rounded transition-colors',
                        rule.enabled
                          ? 'text-green-600 hover:bg-green-100 dark:text-green-400 dark:hover:bg-green-900/30'
                          : 'text-gray-400 hover:bg-gray-100 dark:text-gray-500 dark:hover:bg-gray-700'
                      )}
                      title={rule.enabled ? 'Disable rule' : 'Enable rule'}
                    >
                      {rule.enabled ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingRuleId(rule.id);
                      }}
                      className="p-1 text-blue-600 hover:bg-blue-100 dark:text-blue-400 dark:hover:bg-blue-900/30 rounded transition-colors"
                      title="Edit rule"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(rule.id);
                      }}
                      className="p-1 text-red-600 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/30 rounded transition-colors"
                      title="Delete rule"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <div>
                    <strong>Method:</strong> {Array.isArray(rule.matcher.method) 
                      ? rule.matcher.method.join(', ') 
                      : rule.matcher.method || 'Any'
                    }
                  </div>
                  <div>
                    <strong>URL:</strong> {rule.matcher.url || rule.matcher.urlPattern || 'Any'}
                  </div>
                  <div>
                    <strong>Response:</strong> {rule.mockResponse.status} {rule.mockResponse.statusText}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-500">
                    Created: {formatTimestamp(rule.createdAt)}
                    {rule.updatedAt !== rule.createdAt && 
                      ` • Updated: ${formatTimestamp(rule.updatedAt)}`
                    }
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default MockRulesTab;