import React from 'react';
import { clsx } from 'clsx';
import { AlertTriangle, ChevronRight, ExternalLink } from 'lucide-react';
import { useSecurityAudit, useFilteredVulnerabilities } from '../hooks';
import { getSeverityColor, getCategoryDisplayName, formatTimestamp } from '../utils';

export function VulnerabilitiesTab() {
  const { state, actions } = useSecurityAudit();
  const vulnerabilities = useFilteredVulnerabilities();

  const handleSelectVulnerability = (id: string) => {
    const isCurrentlySelected = state.ui.selectedVulnerabilityId === id;
    actions.selectVulnerability(isCurrentlySelected ? undefined : id);
  };

  const selectedVulnerability = state.ui.selectedVulnerabilityId 
    ? state.vulnerabilities[state.ui.selectedVulnerabilityId] 
    : null;

  return (
    <div className="flex h-full">
      {/* Vulnerability List */}
      <div className="flex-1 min-w-0 border-r border-gray-200 dark:border-gray-700">
        {/* Search and Filters */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <input
            type="text"
            placeholder="Search vulnerabilities..."
            value={state.ui.searchQuery}
            onChange={(e) => actions.updateSearchQuery(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
          />
          
          <div className="flex items-center gap-2 mt-3">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Severity:
            </span>
            {['critical', 'high', 'medium', 'low'].map((severity) => (
              <button
                key={severity}
                onClick={() => actions.toggleSeverityFilter(severity as 'critical' | 'high' | 'medium' | 'low')}
                className={clsx(
                  'px-2 py-1 text-xs rounded capitalize',
                  state.ui.severityFilter.includes(severity as 'critical' | 'high' | 'medium' | 'low')
                    ? getSeverityColor(severity)
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-600 dark:text-gray-400'
                )}
              >
                {severity}
              </button>
            ))}
          </div>
        </div>

        {/* Vulnerability List */}
        <div className="flex-1 overflow-auto">
          {vulnerabilities.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              <AlertTriangle className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <div className="text-lg font-medium mb-2">No vulnerabilities found</div>
              <div className="text-sm">
                {state.metrics.totalVulnerabilities === 0 
                  ? "Run a security scan to detect vulnerabilities"
                  : "Try adjusting your filters"
                }
              </div>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {vulnerabilities.map((vuln) => (
                <div
                  key={vuln.id}
                  onClick={() => handleSelectVulnerability(vuln.id)}
                  className={clsx(
                    'p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors',
                    state.ui.selectedVulnerabilityId === vuln.id && 'bg-blue-50 dark:bg-blue-900/20'
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={clsx(
                          'inline-block w-2 h-2 rounded-full',
                          vuln.severity === 'critical' ? 'bg-red-500' :
                          vuln.severity === 'high' ? 'bg-orange-500' :
                          vuln.severity === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                        )}></span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {vuln.title}
                        </span>
                        <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded">
                          {getCategoryDisplayName(vuln.category)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                        {vuln.description}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                        <span>Scanner: {vuln.scannerName}</span>
                        <span>Confidence: {vuln.confidence}%</span>
                        <span>{formatTimestamp(vuln.detectedAt)}</span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400 ml-2" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Vulnerability Details */}
      {selectedVulnerability ? (
        <div className="w-1/2 bg-white dark:bg-gray-800 overflow-auto">
          <div className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {selectedVulnerability.title}
                </h2>
                <div className="flex items-center gap-2 mb-4">
                  <span className={clsx(
                    'px-2 py-1 text-xs font-medium rounded capitalize',
                    getSeverityColor(selectedVulnerability.severity)
                  )}>
                    {selectedVulnerability.severity} severity
                  </span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {getCategoryDisplayName(selectedVulnerability.category)}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Description</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedVulnerability.description}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Impact</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedVulnerability.impact}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Recommendation</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedVulnerability.recommendation}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Remediation</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedVulnerability.remediation}
                </p>
              </div>

              {selectedVulnerability.evidence && (
                <div>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Evidence</h3>
                  <pre className="text-xs bg-gray-100 dark:bg-gray-700 p-3 rounded overflow-auto">
                    {selectedVulnerability.evidence}
                  </pre>
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  <div>Scanner: {selectedVulnerability.scannerName}</div>
                  <div>Confidence: {selectedVulnerability.confidence}%</div>
                  {selectedVulnerability.cweId && (
                    <div>CWE: {selectedVulnerability.cweId}</div>
                  )}
                </div>
              </div>

              {selectedVulnerability.references && (
                <div>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">References</h3>
                  <div className="space-y-1">
                    {selectedVulnerability.references.map((ref: string, index: number) => (
                      <a
                        key={index}
                        href={ref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        <ExternalLink className="w-3 h-3" />
                        {ref}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="w-1/2 bg-gray-50 dark:bg-gray-800 flex items-center justify-center">
          <div className="text-center text-gray-500 dark:text-gray-400">
            <AlertTriangle className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <div className="text-lg font-medium">Select a vulnerability</div>
            <div className="text-sm">Choose a vulnerability from the list to view details</div>
          </div>
        </div>
      )}
    </div>
  );
}