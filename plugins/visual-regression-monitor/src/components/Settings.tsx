import React from 'react';
import { Settings as SettingsIcon, Monitor, Zap, Database, Download, Upload } from 'lucide-react';
import { useSyncExternalStore } from 'use-sync-external-store/shim';
import { createVisualRegressionDevToolsClient } from '../core/devtools-client';
import { useResponsiveTesting } from '../hooks/useResponsiveTesting';

/**
 * Settings and configuration panel
 */
export function Settings() {
  const client = createVisualRegressionDevToolsClient();
  const { actions: responsiveActions } = useResponsiveTesting();
  
  // Subscribe to store state
  const state = useSyncExternalStore(
    client.subscribe,
    client.getState,
    client.getState
  );

  const settings = state.settings;

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <SettingsIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Settings
          </h2>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Configure visual regression testing preferences
        </p>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <div className="max-w-2xl space-y-6">
          {/* Capture Settings */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Capture Settings
            </h3>
            
            <div className="space-y-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-900 dark:text-white">
                    Full Page Screenshots
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Capture entire page height instead of viewport only
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.captureSettings.fullPage}
                  onChange={(e) => client.updateSettings({
                    captureSettings: {
                      ...settings.captureSettings,
                      fullPage: e.target.checked
                    }
                  })}
                  className="h-4 w-4 text-blue-600 rounded"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-900 dark:text-white">
                    Hide Scrollbars
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Remove scrollbars from screenshots
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.captureSettings.hideScrollbars}
                  onChange={(e) => client.updateSettings({
                    captureSettings: {
                      ...settings.captureSettings,
                      hideScrollbars: e.target.checked
                    }
                  })}
                  className="h-4 w-4 text-blue-600 rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Image Quality
                </label>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={settings.captureSettings.quality}
                  onChange={(e) => client.updateSettings({
                    captureSettings: {
                      ...settings.captureSettings,
                      quality: parseInt(e.target.value)
                    }
                  })}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                />
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                  <span>Low</span>
                  <span>{settings.captureSettings.quality}%</span>
                  <span>High</span>
                </div>
              </div>
            </div>
          </div>

          {/* Responsive Breakpoints */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Monitor className="w-5 h-5" />
              Responsive Breakpoints
            </h3>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <div className="space-y-3">
                {settings.responsiveBreakpoints.map((breakpoint, index) => (
                  <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-700 rounded">
                    <div className="flex-1">
                      <div className="font-medium text-sm text-gray-900 dark:text-white">
                        {breakpoint.name}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {breakpoint.width}×{breakpoint.height} • {breakpoint.isMobile ? 'Mobile' : 'Desktop'}
                      </div>
                    </div>
                    <button
                      onClick={() => responsiveActions.removeBreakpoint(index)}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => responsiveActions.applyBreakpointPreset('mobile')}
                  className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Mobile
                </button>
                <button
                  onClick={() => responsiveActions.applyBreakpointPreset('tablet')}
                  className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600"
                >
                  Tablet
                </button>
                <button
                  onClick={() => responsiveActions.applyBreakpointPreset('desktop')}
                  className="px-3 py-1 text-sm bg-purple-500 text-white rounded hover:bg-purple-600"
                >
                  Desktop
                </button>
                <button
                  onClick={() => responsiveActions.applyBreakpointPreset('all')}
                  className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600"
                >
                  All
                </button>
              </div>
            </div>
          </div>

          {/* Comparison Settings */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Comparison Settings
            </h3>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Diff Threshold
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={settings.diffThreshold}
                  onChange={(e) => client.updateSettings({
                    diffThreshold: parseFloat(e.target.value)
                  })}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                />
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                  <span>Strict</span>
                  <span>{(settings.diffThreshold * 100).toFixed(0)}%</span>
                  <span>Lenient</span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Lower values detect smaller differences but may produce more false positives
                </p>
              </div>
            </div>
          </div>

          {/* Storage Settings */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Database className="w-5 h-5" />
              Storage Settings
            </h3>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-medium text-gray-900 dark:text-white">
                    Storage Usage
                  </label>
                  <button
                    onClick={client.cleanupStorage}
                    className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400"
                  >
                    Clean up
                  </button>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ width: '45%' }}
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {(state.stats.storageUsed / (1024 * 1024)).toFixed(1)}MB used
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const data = client.exportConfiguration();
                    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    try {
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `visual-regression-config-${Date.now()}.json`;
                      a.click();
                    } finally {
                      URL.revokeObjectURL(url);
                    }
                  }}
                  className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-500 text-white rounded hover:bg-gray-600"
                >
                  <Download className="w-4 h-4" />
                  Export
                </button>
                <button
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = '.json';
                    input.onchange = (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (e) => {
                          try {
                            const data = JSON.parse(e.target?.result as string);
                            client.importConfiguration(data);
                          } catch (error) {
                            console.error('Failed to import configuration:', error);
                          }
                        };
                        reader.readAsText(file);
                      }
                    };
                    input.click();
                  }}
                  className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  <Upload className="w-4 h-4" />
                  Import
                </button>
              </div>
            </div>
          </div>

          {/* Reset Settings */}
          <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => {
                if (confirm('Are you sure you want to reset all settings to defaults?')) {
                  client.resetSettings();
                }
              }}
              className="px-4 py-2 text-sm text-red-600 border border-red-200 dark:border-red-800 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              Reset to Defaults
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}