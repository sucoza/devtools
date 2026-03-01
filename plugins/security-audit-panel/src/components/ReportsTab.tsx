import React, { useState } from 'react';
import { clsx } from 'clsx';
import { Download, FileText, Calendar, BarChart } from 'lucide-react';
import { useSecurityAudit } from '../hooks';
import { formatTimestamp } from '../utils';

export function ReportsTab() {
  const { state, actions } = useSecurityAudit();
  const [selectedFormat, setSelectedFormat] = useState<'json' | 'csv' | 'html'>('json');

  const handleExport = (format: 'json' | 'csv' | 'html') => {
    try {
      const data = actions.exportResults(format);
      const filename = `security-audit-${Date.now()}.${format}`;
      
      // Create and trigger download
      const mimeType = format === 'json' ? 'application/json' : 
                      format === 'csv' ? 'text/csv' : 'text/html';
      const blob = new Blob([data], { type: mimeType });
      const url = URL.createObjectURL(blob);
      try {
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } finally {
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  return (
    <div className="flex-1 overflow-auto p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Security Reports
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Export security audit results and analyze scan history
          </p>
        </div>

        {/* Export Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Download className="w-5 h-5" />
            Export Reports
          </h3>

          <div className="grid md:grid-cols-3 gap-4 mb-6">
            {[
              {
                format: 'json' as const,
                title: 'JSON Report',
                description: 'Machine-readable format with complete vulnerability data',
                icon: <FileText className="w-6 h-6" />,
              },
              {
                format: 'csv' as const,
                title: 'CSV Report',
                description: 'Spreadsheet format for data analysis',
                icon: <BarChart className="w-6 h-6" />,
              },
              {
                format: 'html' as const,
                title: 'HTML Report',
                description: 'Human-readable report for sharing',
                icon: <FileText className="w-6 h-6" />,
              },
            ].map(({ format, title, description, icon }) => (
              <button
                key={format}
                onClick={() => setSelectedFormat(format)}
                className={clsx(
                  'p-4 text-left border rounded-lg transition-colors',
                  selectedFormat === format
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                )}
              >
                <div className="flex items-center gap-3 mb-2">
                  {icon}
                  <span className="font-medium text-gray-900 dark:text-white">
                    {title}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {description}
                </p>
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {state.metrics.totalVulnerabilities} vulnerabilities ready for export
            </div>
            <button
              onClick={() => handleExport(selectedFormat)}
              disabled={state.metrics.totalVulnerabilities === 0}
              className={clsx(
                'flex items-center gap-2 px-4 py-2 font-medium rounded-lg',
                state.metrics.totalVulnerabilities === 0
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              )}
            >
              <Download className="w-4 h-4" />
              Export {selectedFormat.toUpperCase()}
            </button>
          </div>
        </div>

        {/* Scan History */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Scan History
          </h3>

          {state.scanHistory.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <div className="text-lg font-medium mb-2">No scan history</div>
              <div className="text-sm">Run security scans to build history</div>
            </div>
          ) : (
            <div className="space-y-3">
              {state.scanHistory.map((scan) => (
                <div
                  key={scan.id}
                  className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className={clsx(
                      'w-3 h-3 rounded-full',
                      scan.highestSeverity === 'critical' ? 'bg-red-500' :
                      scan.highestSeverity === 'high' ? 'bg-orange-500' :
                      scan.highestSeverity === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                    )}></div>
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {formatTimestamp(scan.timestamp)}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {scan.scanners.length} scanners • {scan.duration}ms duration
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-gray-900 dark:text-white">
                      {scan.vulnerabilityCount} vulnerabilities
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                      Highest: {scan.highestSeverity}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Summary Statistics */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Security Metrics
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Security Score</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {state.metrics.securityScore}/100
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Total Vulnerabilities</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {state.metrics.totalVulnerabilities}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Critical Issues</span>
                <span className="text-sm font-medium text-red-600">
                  {state.metrics.vulnerabilitiesBySeverity.critical}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Total Scans</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {state.scanHistory.length}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Recent Activity
            </h3>
            <div className="space-y-3">
              {state.metrics.lastScanTime ? (
                <>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Last Scan</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {formatTimestamp(state.metrics.lastScanTime)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Avg Scan Duration</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {state.metrics.avgScanDuration}ms
                    </span>
                  </div>
                </>
              ) : (
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  No scans performed yet
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}