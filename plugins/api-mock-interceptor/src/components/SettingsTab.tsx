import React, { useState } from 'react';
import { clsx } from 'clsx';
import { Download, Upload, Trash2, Wifi, WifiOff, Clock, Zap } from 'lucide-react';
import { useInterceptor } from '../hooks/useInterceptor';
import { getStorageEngine } from '../core/storage';

/**
 * Settings tab component
 */
export function SettingsTab() {
  const { state, actions } = useInterceptor();
  const [importData, setImportData] = useState('');
  const [showImportDialog, setShowImportDialog] = useState(false);
  const storageEngine = getStorageEngine();

  const handleExport = () => {
    const data = storageEngine.exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `api-mock-interceptor-config-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    try {
      const data = JSON.parse(importData);
      const result = storageEngine.importData(data);
      
      if (result.success) {
        alert(`Import successful! Imported ${result.imported.rules} rules and ${result.imported.scenarios} scenarios.`);
        setImportData('');
        setShowImportDialog(false);
        // Refresh the state
        window.location.reload();
      } else {
        alert(`Import failed: ${result.error}`);
      }
    } catch {
      alert('Invalid JSON format');
    }
  };

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setImportData(content);
        setShowImportDialog(true);
      };
      reader.readAsText(file);
    }
  };

  const clearAllData = () => {
    if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
      storageEngine.clearAllData();
      window.location.reload();
    }
  };

  const storageInfo = storageEngine.getStorageInfo();
  const storageUsagePercent = Math.round((storageInfo.used / storageInfo.total) * 100);

  return (
    <div className="h-full overflow-auto p-4 space-y-6">
      {/* General Settings */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">General Settings</h3>
        
        <div className="space-y-4">
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={state.isInterceptionEnabled}
                onChange={() => state.isInterceptionEnabled ? actions.disableInterception() : actions.enableInterception()}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Enable API interception</span>
            </label>
          </div>
          
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={state.isRecording}
                onChange={actions.toggleRecording}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Record API calls</span>
            </label>
          </div>
        </div>
      </div>

      {/* Network Conditions */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Wifi className="w-5 h-5" />
          Network Conditions
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              <Clock className="w-4 h-4 inline mr-1" />
              Latency (ms)
            </label>
            <input
              type="number"
              value={state.networkConditions.latency || 0}
              onChange={(e) => actions.setNetworkConditions({ ...state.networkConditions, latency: parseInt(e.target.value) || 0 })}
              min="0"
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Failure Rate (0-1)
            </label>
            <input
              type="number"
              value={state.networkConditions.failureRate || 0}
              onChange={(e) => actions.setNetworkConditions({ ...state.networkConditions, failureRate: parseFloat(e.target.value) || 0 })}
              min="0"
              max="1"
              step="0.1"
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={state.networkConditions.offline || false}
                onChange={(e) => actions.setNetworkConditions({ ...state.networkConditions, offline: e.target.checked })}
                className="w-4 h-4 text-red-600 bg-gray-100 border-gray-300 rounded focus:ring-red-500 dark:focus:ring-red-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-1">
                <WifiOff className="w-4 h-4" />
                Simulate offline mode
              </span>
            </label>
          </div>
          
          {state.networkConditions.throttling && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <Zap className="w-4 h-4 inline mr-1" />
                  Download (bytes/sec)
                </label>
                <input
                  type="number"
                  value={state.networkConditions.throttling.downloadThroughput || 0}
                  onChange={(e) => actions.setNetworkConditions({
                    ...state.networkConditions,
                    throttling: {
                      ...state.networkConditions.throttling,
                      downloadThroughput: parseInt(e.target.value) || 0
                    }
                  })}
                  min="0"
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Upload (bytes/sec)
                </label>
                <input
                  type="number"
                  value={state.networkConditions.throttling.uploadThroughput || 0}
                  onChange={(e) => actions.setNetworkConditions({
                    ...state.networkConditions,
                    throttling: {
                      ...state.networkConditions.throttling,
                      uploadThroughput: parseInt(e.target.value) || 0
                    }
                  })}
                  min="0"
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Data Management */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Data Management</h3>
        
        <div className="space-y-4">
          {/* Storage Usage */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-700 dark:text-gray-300">Storage Usage</span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {(storageInfo.used / 1024).toFixed(1)}KB / {(storageInfo.total / 1024).toFixed(1)}KB
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
              <div
                className={clsx(
                  'h-2 rounded-full transition-all',
                  storageUsagePercent > 80 ? 'bg-red-500' : storageUsagePercent > 60 ? 'bg-yellow-500' : 'bg-green-500'
                )}
                style={{ width: `${Math.min(storageUsagePercent, 100)}%` }}
              />
            </div>
          </div>
          
          {/* Export/Import */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export Configuration
            </button>
            
            <div className="relative">
              <input
                type="file"
                accept=".json"
                onChange={handleFileImport}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <button className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors">
                <Upload className="w-4 h-4" />
                Import Configuration
              </button>
            </div>
            
            <button
              onClick={clearAllData}
              className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Clear All Data
            </button>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Statistics</h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{state.stats.totalCalls}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Total Calls</div>
          </div>
          
          <div>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{state.stats.mockedCalls}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Mocked</div>
          </div>
          
          <div>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">{state.stats.errorCount}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Errors</div>
          </div>
          
          <div>
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {state.stats.averageResponseTime}ms
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Avg Response</div>
          </div>
        </div>
      </div>

      {/* Import Dialog */}
      {showImportDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-auto">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Import Configuration</h3>
            
            <textarea
              value={importData}
              onChange={(e) => setImportData(e.target.value)}
              rows={20}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Paste your configuration JSON here..."
            />
            
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setShowImportDialog(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleImport}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Import
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SettingsTab;