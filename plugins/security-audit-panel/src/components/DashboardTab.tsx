import React from 'react';
import { clsx } from 'clsx';
import { Shield, AlertTriangle, Clock, TrendingUp } from 'lucide-react';
import { useSecurityAudit, useSecurityMetrics } from '../hooks';
import { formatTimestamp, getCategoryDisplayName } from '../utils';
import type { DevToolsState } from '../types';

export function DashboardTab() {
  const { state } = useSecurityAudit();
  const metrics = useSecurityMetrics();

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-100';
    if (score >= 70) return 'text-yellow-600 bg-yellow-100';
    if (score >= 50) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="flex-1 overflow-auto p-4 space-y-6">
      {/* Security Score Card */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Security Overview
          </h2>
          {state.isScanning && (
            <div className="flex items-center gap-2 text-sm text-blue-600">
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              Scanning...
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Security Score */}
          <div className="text-center">
            <div className={clsx(
              'inline-flex items-center justify-center w-20 h-20 rounded-full text-2xl font-bold',
              getScoreColor(metrics.securityScore)
            )}>
              {metrics.securityScore}
            </div>
            <div className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
              Security Score
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              out of 100
            </div>
          </div>

          {/* Total Vulnerabilities */}
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {metrics.totalVulnerabilities}
            </div>
            <div className="text-sm font-medium text-gray-900 dark:text-white">
              Total Vulnerabilities
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              detected issues
            </div>
          </div>

          {/* Last Scan */}
          <div className="text-center">
            <div className="text-sm text-gray-900 dark:text-white">
              {metrics.lastScanTime ? (
                <>
                  <div className="text-lg font-bold">
                    <Clock className="w-4 h-4 inline mr-1" />
                    {formatTimestamp(metrics.lastScanTime)}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    last scan
                  </div>
                </>
              ) : (
                <div className="text-gray-500 dark:text-gray-400">
                  No scans yet
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Severity Breakdown */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          Vulnerability Breakdown
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(metrics.vulnerabilitiesBySeverity).map(([severity, count]) => (
            <div key={severity} className="text-center p-4 rounded-lg bg-gray-50 dark:bg-gray-700">
              <div className={clsx('w-8 h-8 rounded-full mx-auto mb-2', getSeverityColor(severity))}></div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {count as number}
              </div>
              <div className="text-sm capitalize text-gray-600 dark:text-gray-400">
                {severity}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Categories
        </h3>

        <div className="space-y-3">
          {Object.entries(metrics.vulnerabilitiesByCategory)
            .filter(([, count]) => (count as number) > 0)
            .sort(([, a], [, b]) => (b as number) - (a as number))
            .slice(0, 8)
            .map(([category, count]) => (
              <div key={category} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded"></div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {getCategoryDisplayName(category)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="bg-gray-200 dark:bg-gray-600 h-2 w-20 rounded-full overflow-hidden">
                    <div
                      className="bg-blue-500 h-full rounded-full"
                      style={{ 
                        width: `${Math.min(100, ((count as number) / Math.max(1, metrics.totalVulnerabilities)) * 100)}%` 
                      }}
                    ></div>
                  </div>
                  <span className="text-sm font-bold text-gray-900 dark:text-white w-8 text-right">
                    {count as number}
                  </span>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Recent Scans */}
      {state.scanHistory.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Recent Scans
          </h3>
          
          <div className="space-y-3">
            {state.scanHistory.slice(0, 5).map((scan: DevToolsState['scanHistory'][0]) => (
              <div key={scan.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded">
                <div className="flex items-center gap-3">
                  <div className={clsx(
                    'w-3 h-3 rounded-full',
                    getSeverityColor(scan.highestSeverity)
                  )}></div>
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {formatTimestamp(scan.timestamp)}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {scan.scanners.length} scanners, {scan.duration}ms
                    </div>
                  </div>
                </div>
                <div className="text-sm font-bold text-gray-900 dark:text-white">
                  {scan.vulnerabilityCount} issues
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Quick Actions
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => window.open('https://owasp.org/www-project-top-ten/', '_blank')}
            className="p-4 text-left rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
          >
            <div className="text-sm font-medium text-blue-900 dark:text-blue-100">
              OWASP Top 10
            </div>
            <div className="text-xs text-blue-600 dark:text-blue-400">
              Learn about common security risks
            </div>
          </button>
          
          <button
            onClick={() => window.open('https://cheatsheetseries.owasp.org/', '_blank')}
            className="p-4 text-left rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
          >
            <div className="text-sm font-medium text-green-900 dark:text-green-100">
              Security Cheatsheets
            </div>
            <div className="text-xs text-green-600 dark:text-green-400">
              Quick security implementation guides
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}