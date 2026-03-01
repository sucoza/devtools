import React, { useState, useEffect } from 'react';
import { clsx } from 'clsx';
import { 
  Settings, 
  Clock, 
  MemoryStick, 
  AlertTriangle, 
  Eye, 
  Zap,
  Save,
  RotateCcw,
  Info
} from 'lucide-react';
import type { ProfilingConfiguration } from '../types';

export interface ProfilingSettingsProps {
  config: ProfilingConfiguration;
  onUpdateConfig?: (config: Partial<ProfilingConfiguration>) => void;
  onResetConfig?: () => void;
  className?: string;
}

export function ProfilingSettings({ 
  config, 
  onUpdateConfig,
  onResetConfig,
  className 
}: ProfilingSettingsProps) {
  const [localConfig, setLocalConfig] = useState<ProfilingConfiguration>(config);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setLocalConfig(config);
    setHasChanges(false);
  }, [config]);

  const updateLocalConfig = (updates: Partial<ProfilingConfiguration>) => {
    const newConfig = { ...localConfig, ...updates };
    setLocalConfig(newConfig);
    setHasChanges(true);
  };

  const handleSave = () => {
    onUpdateConfig?.(localConfig);
    setHasChanges(false);
  };

  const handleReset = () => {
    onResetConfig?.();
    setHasChanges(false);
  };

  const formatMemory = (bytes: number): string => {
    return `${Math.round(bytes / 1024 / 1024)}MB`;
  };

  return (
    <div className={clsx("space-y-6", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Settings className="h-5 w-5 text-blue-500" />
          <h3 className="text-lg font-semibold">Profiling Configuration</h3>
        </div>
        
        <div className="flex items-center space-x-2">
          {hasChanges && (
            <button
              onClick={handleSave}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            >
              <Save className="h-4 w-4" />
              <span>Save Changes</span>
            </button>
          )}
          
          <button
            onClick={handleReset}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Sampling Configuration */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Clock className="h-5 w-5 text-blue-500" />
          <h4 className="text-base font-semibold">Sampling Configuration</h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Sampling Interval (milliseconds)
            </label>
            <input
              type="number"
              min="100"
              max="10000"
              step="100"
              value={localConfig.samplingInterval}
              onChange={(e) => { const v = parseInt(e.target.value); if (!isNaN(v)) updateLocalConfig({ samplingInterval: v }); }}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              Lower values provide more detail but higher overhead
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Maximum Snapshots
            </label>
            <input
              type="number"
              min="10"
              max="1000"
              step="10"
              value={localConfig.maxSnapshots}
              onChange={(e) => { const v = parseInt(e.target.value); if (!isNaN(v)) updateLocalConfig({ maxSnapshots: v }); }}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              Older snapshots are automatically removed
            </p>
          </div>
        </div>
      </div>

      {/* Feature Configuration */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Eye className="h-5 w-5 text-green-500" />
          <h4 className="text-base font-semibold">Feature Configuration</h4>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Component Tracking
              </label>
              <p className="text-xs text-gray-500">
                Track individual React component memory usage
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={localConfig.enableComponentTracking}
                onChange={(e) => updateLocalConfig({ enableComponentTracking: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Performance Metrics
              </label>
              <p className="text-xs text-gray-500">
                Collect Core Web Vitals and performance data
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={localConfig.enablePerformanceMetrics}
                onChange={(e) => updateLocalConfig({ enablePerformanceMetrics: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Memory Leak Detection
              </label>
              <p className="text-xs text-gray-500">
                Automatically detect potential memory leak patterns
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={localConfig.enableLeakDetection}
                onChange={(e) => updateLocalConfig({ enableLeakDetection: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Auto Optimizations
              </label>
              <p className="text-xs text-gray-500">
                Automatically apply safe performance optimizations
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={localConfig.autoOptimizations}
                onChange={(e) => updateLocalConfig({ autoOptimizations: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Memory Budget Configuration */}
      {localConfig.memoryBudget && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center space-x-2 mb-4">
            <MemoryStick className="h-5 w-5 text-orange-500" />
            <h4 className="text-base font-semibold">Memory Budget</h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Total Memory Budget
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="10"
                  max="1000"
                  value={Math.round(localConfig.memoryBudget.total / 1024 / 1024)}
                  onChange={(e) => { const v = parseInt(e.target.value); if (!isNaN(v)) updateLocalConfig({
                    memoryBudget: {
                      ...localConfig.memoryBudget!,
                      total: v * 1024 * 1024
                    }
                  }); }}
                  className="w-full px-3 py-2 pr-12 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500">
                  MB
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Warning Threshold
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="10"
                  max="1000"
                  value={Math.round(localConfig.memoryBudget.warning / 1024 / 1024)}
                  onChange={(e) => { const v = parseInt(e.target.value); if (!isNaN(v)) updateLocalConfig({
                    memoryBudget: {
                      ...localConfig.memoryBudget!,
                      warning: v * 1024 * 1024
                    }
                  }); }}
                  className="w-full px-3 py-2 pr-12 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500">
                  MB
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Critical Threshold
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="10"
                  max="1000"
                  value={Math.round(localConfig.memoryBudget.critical / 1024 / 1024)}
                  onChange={(e) => { const v = parseInt(e.target.value); if (!isNaN(v)) updateLocalConfig({
                    memoryBudget: {
                      ...localConfig.memoryBudget!,
                      critical: v * 1024 * 1024
                    }
                  }); }}
                  className="w-full px-3 py-2 pr-12 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500">
                  MB
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Excluded Components */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center space-x-2 mb-4">
          <AlertTriangle className="h-5 w-5 text-yellow-500" />
          <h4 className="text-base font-semibold">Excluded Components</h4>
        </div>

        <div className="space-y-3">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Components that should be excluded from memory tracking (one per line):
          </p>
          
          <textarea
            value={localConfig.excludeComponents.join('\n')}
            onChange={(e) => updateLocalConfig({ 
              excludeComponents: e.target.value.split('\n').filter(line => line.trim())
            })}
            placeholder="ComponentName&#10;AnotherComponent&#10;ThirdComponent"
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
          />
          
          <div className="flex items-center space-x-2 text-xs text-gray-500">
            <Info className="h-3 w-3" />
            <span>
              Excluding components can reduce monitoring overhead but may miss memory issues
            </span>
          </div>
        </div>
      </div>

      {/* Configuration Summary */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Zap className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <div>
            <h5 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
              Configuration Impact
            </h5>
            <div className="space-y-1 text-sm text-blue-700 dark:text-blue-300">
              <div>
                <strong>Sampling Rate:</strong> Every {localConfig.samplingInterval}ms
              </div>
              <div>
                <strong>Memory Overhead:</strong> ~{Math.round(localConfig.maxSnapshots * 0.1)}KB estimated
              </div>
              <div>
                <strong>Active Features:</strong> {
                  [
                    localConfig.enableComponentTracking && 'Component Tracking',
                    localConfig.enablePerformanceMetrics && 'Performance Metrics',
                    localConfig.enableLeakDetection && 'Leak Detection',
                    localConfig.autoOptimizations && 'Auto Optimizations'
                  ].filter(Boolean).join(', ') || 'None'
                }
              </div>
              {localConfig.memoryBudget && (
                <div>
                  <strong>Memory Budget:</strong> {formatMemory(localConfig.memoryBudget.total)} 
                  (warn at {formatMemory(localConfig.memoryBudget.warning)})
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}