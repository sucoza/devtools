import React from 'react';
import { clsx } from 'clsx';
import { Search, Play, CheckCircle, XCircle } from 'lucide-react';
import { useSecurityAudit, useScannerStatus } from '../hooks';
import { getCategoryDisplayName } from '../utils';

export function ScannersTab() {
  const { state, actions } = useSecurityAudit();
  const { availableScanners, enabledScanners, scanResults, isScanning } = useScannerStatus();

  const handleToggleScanner = (scannerId: string) => {
    const isEnabled = state.config.scanners[scannerId]?.enabled;
    if (isEnabled) {
      actions.disableScanner(scannerId);
    } else {
      actions.enableScanner(scannerId);
    }
  };

  const handleRunScanner = async (scannerId: string) => {
    if (!isScanning) {
      await actions.startScan([scannerId]);
    }
  };

  return (
    <div className="flex-1 overflow-auto p-4">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Security Scanners
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Enable and configure individual security scanners. Each scanner focuses on specific vulnerability types.
        </p>
      </div>

      <div className="grid gap-4">
        {availableScanners.map((scanner) => {
          const isEnabled = state.config.scanners[scanner.id]?.enabled ?? false;
          const scanResult = scanResults[scanner.id];
          const hasRun = !!scanResult;

          return (
            <div
              key={scanner.id}
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 pt-1">
                    <Search className="w-5 h-5 text-gray-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      {scanner.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {scanner.description}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded">
                        {getCategoryDisplayName(scanner.category)}
                      </span>
                      {hasRun && (
                        <span className={clsx(
                          'text-xs px-2 py-1 rounded flex items-center gap-1',
                          scanResult.status === 'completed'
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                            : scanResult.status === 'error'
                            ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                            : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400'
                        )}>
                          {scanResult.status === 'completed' && <CheckCircle className="w-3 h-3" />}
                          {scanResult.status === 'error' && <XCircle className="w-3 h-3" />}
                          {scanResult.status === 'completed' 
                            ? `${scanResult.vulnerabilities.length} issues found`
                            : scanResult.status === 'error'
                            ? 'Error during scan'
                            : 'Running...'
                          }
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleRunScanner(scanner.id)}
                    disabled={!isEnabled || isScanning}
                    className={clsx(
                      'flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded',
                      !isEnabled || isScanning
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                    )}
                  >
                    <Play className="w-3 h-3" />
                    Run
                  </button>
                  
                  <button
                    onClick={() => handleToggleScanner(scanner.id)}
                    className={clsx(
                      'flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded',
                      isEnabled
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    )}
                  >
                    {isEnabled ? 'Enabled' : 'Disabled'}
                  </button>
                </div>
              </div>

              {/* Scanner Results */}
              {hasRun && scanResult.status === 'completed' && (
                <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="text-sm text-gray-900 dark:text-white mb-2">
                    Last scan results:
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Vulnerabilities:</span>
                      <span className="ml-2 font-medium text-gray-900 dark:text-white">
                        {scanResult.vulnerabilities.length}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Duration:</span>
                      <span className="ml-2 font-medium text-gray-900 dark:text-white">
                        {scanResult.duration}ms
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Scanned:</span>
                      <span className="ml-2 font-medium text-gray-900 dark:text-white">
                        {new Date(scanResult.scannedAt).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Scanner Error */}
              {hasRun && scanResult.status === 'error' && (
                <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <div className="text-sm text-red-800 dark:text-red-200">
                    <strong>Error:</strong> {scanResult.error}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Scan All Button */}
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-blue-900 dark:text-blue-100">
              Run All Enabled Scanners
            </h3>
            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
              Execute all enabled scanners to perform a comprehensive security audit
            </p>
          </div>
          <button
            onClick={() => actions.startScan()}
            disabled={isScanning || enabledScanners.length === 0}
            className={clsx(
              'flex items-center gap-2 px-4 py-2 font-medium rounded-lg',
              isScanning || enabledScanners.length === 0
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            )}
          >
            <Play className="w-4 h-4" />
            {isScanning ? 'Scanning...' : 'Scan All'}
          </button>
        </div>
      </div>
    </div>
  );
}