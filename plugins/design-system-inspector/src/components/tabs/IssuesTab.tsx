import React, { useState } from 'react';
import { clsx } from 'clsx';
import { 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  CheckCircle, 
  X, 
  ExternalLink,
  Filter
} from 'lucide-react';
import { useDesignSystemInspector, useFilteredData, useIssueStats } from '../../hooks';

export function IssuesTab() {
  const { state, actions } = useDesignSystemInspector();
  const filteredData = useFilteredData(state);
  const issueStats = useIssueStats(filteredData.issues);
  const [selectedIssue, setSelectedIssue] = useState<string | undefined>(
    state.ui.selectedIssue
  );

  const handleSelectIssue = (issueId: string | undefined) => {
    setSelectedIssue(issueId);
    actions.selectIssue(issueId);
  };

  const handleResolveIssue = (issueId: string) => {
    actions.resolveIssue(issueId);
    if (selectedIssue === issueId) {
      setSelectedIssue(undefined);
    }
  };

  const selectedIssueData = selectedIssue 
    ? filteredData.issues.find(i => i.id === selectedIssue)
    : null;

  const severityOrder = ['error', 'warning', 'info'] as const;
  const sortedIssues = [...filteredData.issues].sort((a, b) => {
    const aSeverityIndex = severityOrder.indexOf(a.severity);
    const bSeverityIndex = severityOrder.indexOf(b.severity);
    return aSeverityIndex - bSeverityIndex;
  });

  return (
    <div className="flex h-full">
      {/* Issues List */}
      <div className="flex-none w-80 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Issues ({filteredData.issues.length})
          </h3>
          
          {/* Stats */}
          <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
            <div className="bg-red-100 dark:bg-red-900 rounded-lg p-2 text-center">
              <div className="font-bold text-red-800 dark:text-red-200">
                {issueStats.bySeverity.error || 0}
              </div>
              <div className="text-red-600 dark:text-red-400 text-xs">Errors</div>
            </div>
            <div className="bg-yellow-100 dark:bg-yellow-900 rounded-lg p-2 text-center">
              <div className="font-bold text-yellow-800 dark:text-yellow-200">
                {issueStats.bySeverity.warning || 0}
              </div>
              <div className="text-yellow-600 dark:text-yellow-400 text-xs">Warnings</div>
            </div>
            <div className="bg-blue-100 dark:bg-blue-900 rounded-lg p-2 text-center">
              <div className="font-bold text-blue-800 dark:text-blue-200">
                {issueStats.bySeverity.info || 0}
              </div>
              <div className="text-blue-600 dark:text-blue-400 text-xs">Info</div>
            </div>
          </div>

          {issueStats.fixableIssues > 0 && (
            <div className="mt-3 p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <div className="text-xs text-green-800 dark:text-green-200">
                {issueStats.fixableIssues} issues can be auto-fixed
              </div>
            </div>
          )}
        </div>
        
        <div className="overflow-y-auto flex-1">
          {sortedIssues.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              <CheckCircle className="w-12 h-12 mx-auto mb-4 opacity-50 text-green-500" />
              <p className="font-medium">No issues found!</p>
              <p className="text-sm">Your design system looks consistent.</p>
            </div>
          ) : (
            <div className="p-2">
              {sortedIssues.map((issue) => (
                <IssueListItem
                  key={issue.id}
                  issue={issue}
                  isSelected={selectedIssue === issue.id}
                  onSelect={handleSelectIssue}
                  onResolve={handleResolveIssue}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Issue Details */}
      <div className="flex-1 overflow-y-auto">
        {selectedIssueData ? (
          <IssueDetails 
            issue={selectedIssueData} 
            onResolve={handleResolveIssue}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
            <div className="text-center">
              <AlertTriangle className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">Select an issue</p>
              <p>Choose an issue from the list to view its details</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function IssueListItem({
  issue,
  isSelected,
  onSelect,
  onResolve
}: {
  issue: import('../../types').ConsistencyIssue;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onResolve: (id: string) => void;
}) {
  const severityConfig = {
    error: { 
      icon: AlertCircle, 
      color: 'text-red-600 dark:text-red-400',
      bg: 'bg-red-50 dark:bg-red-900/20',
      border: 'border-red-200 dark:border-red-800'
    },
    warning: { 
      icon: AlertTriangle, 
      color: 'text-yellow-600 dark:text-yellow-400',
      bg: 'bg-yellow-50 dark:bg-yellow-900/20',
      border: 'border-yellow-200 dark:border-yellow-800'
    },
    info: { 
      icon: Info, 
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      border: 'border-blue-200 dark:border-blue-800'
    }
  };

  const config = severityConfig[issue.severity];
  const Icon = config.icon;

  return (
    <div className="mb-2">
      <div
        className={clsx(
          'p-3 rounded-lg cursor-pointer transition-colors border',
          isSelected
            ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
            : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
        )}
        onClick={() => onSelect(issue.id)}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start flex-1 min-w-0">
            <Icon className={clsx(
              'w-4 h-4 mr-2 flex-none mt-0.5',
              isSelected ? 'text-blue-600 dark:text-blue-400' : config.color
            )} />
            <div className="min-w-0 flex-1">
              <div className="font-medium text-gray-900 dark:text-white text-sm">
                {issue.title}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                {issue.description}
              </div>
              <div className="flex items-center mt-2 space-x-2">
                <span className={clsx(
                  'text-xs px-2 py-1 rounded capitalize',
                  config.bg, config.color
                )}>
                  {issue.severity}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {issue.type.replace('-', ' ')}
                </span>
                {issue.fixable && (
                  <span className="text-xs bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 px-2 py-1 rounded">
                    Fixable
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-1 ml-2">
            {issue.occurrences.length > 1 && (
              <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-1 rounded">
                {issue.occurrences.length}
              </span>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onResolve(issue.id);
              }}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              title="Mark as resolved"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function IssueDetails({ 
  issue, 
  onResolve 
}: { 
  issue: import('../../types').ConsistencyIssue;
  onResolve: (id: string) => void;
}) {
  const severityConfig = {
    error: { 
      icon: AlertCircle, 
      color: 'text-red-600 dark:text-red-400',
      bg: 'bg-red-50 dark:bg-red-900/20',
      border: 'border-red-200 dark:border-red-800'
    },
    warning: { 
      icon: AlertTriangle, 
      color: 'text-yellow-600 dark:text-yellow-400',
      bg: 'bg-yellow-50 dark:bg-yellow-900/20',
      border: 'border-yellow-200 dark:border-yellow-800'
    },
    info: { 
      icon: Info, 
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      border: 'border-blue-200 dark:border-blue-800'
    }
  };

  const config = severityConfig[issue.severity];
  const Icon = config.icon;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex-none border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start">
            <Icon className={clsx('w-6 h-6 mr-3 mt-1 flex-none', config.color)} />
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {issue.title}
              </h2>
              <div className="flex items-center mt-2 space-x-3">
                <span className={clsx(
                  'px-3 py-1 rounded-full text-sm font-medium capitalize',
                  config.bg, config.color
                )}>
                  {issue.severity}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {issue.type.replace('-', ' ')}
                </span>
                {issue.fixable && (
                  <span className="text-sm bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 px-3 py-1 rounded-full">
                    Auto-fixable
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {issue.fixable && (
              <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm">
                Auto Fix
              </button>
            )}
            <button
              onClick={() => onResolve(issue.id)}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
            >
              Mark Resolved
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Description */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Description
          </h3>
          <p className="text-gray-700 dark:text-gray-300">
            {issue.description}
          </p>
        </div>

        {/* Recommendation */}
        {issue.recommendation && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Recommendation
            </h3>
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-blue-800 dark:text-blue-200">
                {issue.recommendation}
              </p>
            </div>
          </div>
        )}

        {/* Occurrences */}
        {issue.occurrences && issue.occurrences.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Occurrences ({issue.occurrences.length})
            </h3>
            <div className="space-y-3">
              {issue.occurrences.slice(0, 10).map((occurrence, index) => (
                <div key={index} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-2">
                    <code className="text-sm font-mono text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900 px-2 py-1 rounded">
                      {occurrence.selector}
                    </code>
                    <button
                      onClick={() => {
                        // Scroll element into view
                        occurrence.element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        // Highlight element temporarily
                        if (occurrence.element) {
                          occurrence.element.style.outline = '2px solid #3B82F6';
                          setTimeout(() => {
                            occurrence.element.style.outline = '';
                          }, 2000);
                        }
                      }}
                      className="flex items-center text-sm text-blue-600 dark:text-blue-400 hover:text-blue-500"
                    >
                      <ExternalLink className="w-4 h-4 mr-1" />
                      Locate
                    </button>
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Current: <code className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 px-2 py-1 rounded">
                      {occurrence.actualValue}
                    </code>
                    {occurrence.expectedValue && (
                      <>
                        {' → Expected: '}
                        <code className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded">
                          {occurrence.expectedValue}
                        </code>
                      </>
                    )}
                  </div>
                </div>
              ))}
              {issue.occurrences.length > 10 && (
                <div className="text-center text-sm text-gray-500 dark:text-gray-400">
                  +{issue.occurrences.length - 10} more occurrences
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}