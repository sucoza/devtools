import React from 'react';
import { clsx } from 'clsx';
import { Settings, Palette, Shield } from 'lucide-react';
import { useSecurityAudit } from '../hooks';

export function SettingsTab() {
  const { state, actions } = useSecurityAudit();

  const handleConfigUpdate = (key: string, value: any) => {
    // Update config through direct action (simplified approach)
    // In a full implementation, this would dispatch to the client
    console.warn('Config update not implemented:', key, value);
  };

  return (
    <div className="flex-1 overflow-auto p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Settings
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Configure security audit behavior and appearance
          </p>
        </div>

        {/* Scanning Configuration */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Scanning Configuration
          </h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-900 dark:text-white">
                  Auto-scan on page load
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Automatically run security scans when the page loads
                </p>
              </div>
              <input
                type="checkbox"
                checked={state.config.autoScanOnPageLoad}
                onChange={(e) => handleConfigUpdate('autoScanOnPageLoad', e.target.checked)}
                className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-900 dark:text-white">
                  Auto-scan on DOM changes
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Run scans when the page DOM is modified
                </p>
              </div>
              <input
                type="checkbox"
                checked={state.config.autoScanOnDomChange}
                onChange={(e) => handleConfigUpdate('autoScanOnDomChange', e.target.checked)}
                className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-900 dark:text-white">
                  Show in console
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Log vulnerability findings to browser console
                </p>
              </div>
              <input
                type="checkbox"
                checked={state.config.showInConsole}
                onChange={(e) => handleConfigUpdate('showInConsole', e.target.checked)}
                className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-900 dark:text-white block mb-2">
                Severity threshold
              </label>
              <select
                value={state.config.severityThreshold}
                onChange={(e) => handleConfigUpdate('severityThreshold', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="low">Low and above</option>
                <option value="medium">Medium and above</option>
                <option value="high">High and above</option>
                <option value="critical">Critical only</option>
              </select>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Only show vulnerabilities at or above this severity level
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-900 dark:text-white block mb-2">
                Export format
              </label>
              <select
                value={state.config.exportFormat}
                onChange={(e) => handleConfigUpdate('exportFormat', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="json">JSON</option>
                <option value="csv">CSV</option>
                <option value="html">HTML</option>
              </select>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Default format for exporting security reports
              </p>
            </div>
          </div>
        </div>

        {/* Appearance */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Palette className="w-5 h-5" />
            Appearance
          </h3>

          <div>
            <label className="text-sm font-medium text-gray-900 dark:text-white block mb-2">
              Theme
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { key: 'light', label: 'Light' },
                { key: 'dark', label: 'Dark' },
                { key: 'auto', label: 'System' },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => actions.setTheme(key as any)}
                  className={clsx(
                    'px-3 py-2 text-sm font-medium rounded-md border',
                    state.ui.theme === key
                      ? 'bg-blue-100 border-blue-300 text-blue-700 dark:bg-blue-900/50 dark:border-blue-600 dark:text-blue-200'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600'
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Scanner Configuration */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Scanner Settings
          </h3>

          <div className="space-y-4">
            {Object.entries(state.config.scanners).map(([scannerId, config]) => (
              <div key={scannerId} className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                    {scannerId.replace('-', ' ')}
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {(config as any).enabled ? 'Enabled' : 'Disabled'}
                    {(config as any).autoScan && ' • Auto-scan enabled'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={(config as any).autoScan || false}
                    onChange={(e) => {
                      console.warn('Scanner config update not implemented:', scannerId, 'autoScan', e.target.checked);
                    }}
                    className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    title="Auto-scan"
                  />
                  <input
                    type="checkbox"
                    checked={(config as any).enabled || false}
                    onChange={(e) => e.target.checked ? actions.enableScanner(scannerId) : actions.disableScanner(scannerId)}
                    className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    title="Enabled"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Reset Settings */}
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
          <h3 className="text-lg font-medium text-red-900 dark:text-red-100 mb-2">
            Reset Settings
          </h3>
          <p className="text-sm text-red-700 dark:text-red-200 mb-4">
            Reset all settings to their default values. This cannot be undone.
          </p>
          <button
            onClick={() => {
              if (confirm('Are you sure you want to reset all settings? This cannot be undone.')) {
                console.warn('Config reset not implemented');
              }
            }}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
          >
            Reset to Defaults
          </button>
        </div>
      </div>
    </div>
  );
}