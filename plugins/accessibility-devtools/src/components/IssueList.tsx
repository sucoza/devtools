import React, { useState } from 'react';
import { clsx } from 'clsx';
import { 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  ExternalLink, 
  Search, 
  Filter, 
  Eye,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { useAccessibilityAudit } from '../hooks/useAccessibilityAudit';
import type { AccessibilityIssue, SeverityLevel } from '../types';

export interface IssueListProps {
  showOverview?: boolean;
  className?: string;
}

/**
 * Component for displaying accessibility issues
 */
export function IssueList({ showOverview = false, className }: IssueListProps) {
  const {
    currentAudit,
    filteredIssues,
    selectedIssue,
    filters,
    selectIssue,
    highlightElement,
    toggleSeverityFilter,
    toggleRuleFilter,
    updateSearchFilter,
    resetFilters,
    getIssueStats,
    getFilteredStats,
    getUniqueRuleIds,
    getUniqueTags,
  } = useAccessibilityAudit();

  const [expandedIssues, setExpandedIssues] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);

  const stats = getIssueStats();
  const filteredStats = getFilteredStats();
  const uniqueRuleIds = getUniqueRuleIds();
  const uniqueTags = getUniqueTags();

  const toggleIssueExpansion = (issueId: string) => {
    const newExpanded = new Set(expandedIssues);
    if (newExpanded.has(issueId)) {
      newExpanded.delete(issueId);
    } else {
      newExpanded.add(issueId);
    }
    setExpandedIssues(newExpanded);
  };

  const handleIssueSelect = (issue: AccessibilityIssue) => {
    selectIssue(issue);
    if (issue.nodes.length > 0) {
      const firstTarget = issue.nodes[0].target[0];
      highlightElement(firstTarget);
    }
  };

  const getSeverityIcon = (severity: SeverityLevel) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'serious':
        return <AlertCircle className="w-4 h-4 text-orange-500" />;
      case 'moderate':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'minor':
        return <Info className="w-4 h-4 text-blue-500" />;
      default:
        return <Info className="w-4 h-4 text-gray-500" />;
    }
  };

  const getSeverityColor = (severity: SeverityLevel) => {
    switch (severity) {
      case 'critical':
        return 'text-red-700 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-900/20 dark:border-red-800';
      case 'serious':
        return 'text-orange-700 bg-orange-50 border-orange-200 dark:text-orange-400 dark:bg-orange-900/20 dark:border-orange-800';
      case 'moderate':
        return 'text-yellow-700 bg-yellow-50 border-yellow-200 dark:text-yellow-400 dark:bg-yellow-900/20 dark:border-yellow-800';
      case 'minor':
        return 'text-blue-700 bg-blue-50 border-blue-200 dark:text-blue-400 dark:bg-blue-900/20 dark:border-blue-800';
      default:
        return 'text-gray-700 bg-gray-50 border-gray-200 dark:text-gray-400 dark:bg-gray-900/20 dark:border-gray-800';
    }
  };

  if (!currentAudit) {
    return (
      <div className={clsx('flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400', className)}>
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
          <p className="text-lg font-medium mb-2">No Audit Results</p>
          <p className="text-sm">Start a scan to analyze accessibility issues</p>
        </div>
      </div>
    );
  }

  return (
    <div className={clsx('flex flex-col h-full', className)}>
      {/* Overview Section */}
      {showOverview && (
        <div className="p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Accessibility Overview
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                {stats.critical}
              </div>
              <div className="text-sm text-red-700 dark:text-red-300">Critical</div>
            </div>
            <div className="text-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {stats.serious}
              </div>
              <div className="text-sm text-orange-700 dark:text-orange-300">Serious</div>
            </div>
            <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {stats.moderate}
              </div>
              <div className="text-sm text-yellow-700 dark:text-yellow-300">Moderate</div>
            </div>
            <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {stats.minor}
              </div>
              <div className="text-sm text-blue-700 dark:text-blue-300">Minor</div>
            </div>
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="p-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 mb-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search issues..."
              value={filters.searchQuery}
              onChange={(e) => updateSearchFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={clsx(
              'flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors',
              showFilters
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            )}
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>
          {(filters.searchQuery || filters.severity.size < 4 || filters.ruleIds.size > 0) && (
            <button
              onClick={resetFilters}
              className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            >
              Clear
            </button>
          )}
        </div>

        {/* Filter Options */}
        {showFilters && (
          <div className="space-y-3">
            {/* Severity Filters */}
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                Severity
              </label>
              <div className="flex flex-wrap gap-2">
                {(['critical', 'serious', 'moderate', 'minor'] as const).map(severity => (
                  <button
                    key={severity}
                    onClick={() => toggleSeverityFilter(severity)}
                    className={clsx(
                      'px-3 py-1 text-xs rounded-full border transition-colors',
                      filters.severity.has(severity)
                        ? getSeverityColor(severity)
                        : 'text-gray-600 bg-gray-100 border-gray-300 hover:bg-gray-200 dark:text-gray-400 dark:bg-gray-700 dark:border-gray-600 dark:hover:bg-gray-600'
                    )}
                  >
                    {severity}
                  </button>
                ))}
              </div>
            </div>

            {/* Rule Filters */}
            {uniqueRuleIds.length > 0 && (
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                  Rules (showing top 10)
                </label>
                <div className="flex flex-wrap gap-2">
                  {uniqueRuleIds.slice(0, 10).map(ruleId => (
                    <button
                      key={ruleId}
                      onClick={() => toggleRuleFilter(ruleId)}
                      className={clsx(
                        'px-2 py-1 text-xs rounded border transition-colors',
                        filters.ruleIds.has(ruleId)
                          ? 'text-blue-700 bg-blue-100 border-blue-300 dark:text-blue-400 dark:bg-blue-900/30 dark:border-blue-600'
                          : 'text-gray-600 bg-gray-100 border-gray-300 hover:bg-gray-200 dark:text-gray-400 dark:bg-gray-700 dark:border-gray-600 dark:hover:bg-gray-600'
                      )}
                    >
                      {ruleId}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Results Summary */}
      {filteredStats.total !== stats.total && (
        <div className="px-3 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-sm">
          Showing {filteredStats.total} of {stats.total} issues
        </div>
      )}

      {/* Issues List */}
      <div className="flex-1 overflow-auto">
        {filteredIssues.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
            <div className="text-center">
              <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
              <p className="font-medium">No issues found</p>
              <p className="text-sm">
                {filters.searchQuery || filters.severity.size < 4 
                  ? 'Try adjusting your filters'
                  : 'Great job! No accessibility issues detected'
                }
              </p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredIssues.map((issue) => (
              <IssueItem
                key={issue.id}
                issue={issue}
                isSelected={selectedIssue?.id === issue.id}
                isExpanded={expandedIssues.has(issue.id)}
                onSelect={() => handleIssueSelect(issue)}
                onToggleExpansion={() => toggleIssueExpansion(issue.id)}
                getSeverityIcon={getSeverityIcon}
                getSeverityColor={getSeverityColor}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface IssueItemProps {
  issue: AccessibilityIssue;
  isSelected: boolean;
  isExpanded: boolean;
  onSelect: () => void;
  onToggleExpansion: () => void;
  getSeverityIcon: (severity: SeverityLevel) => React.ReactNode;
  getSeverityColor: (severity: SeverityLevel) => string;
}

function IssueItem({
  issue,
  isSelected,
  isExpanded,
  onSelect,
  onToggleExpansion,
  getSeverityIcon,
  getSeverityColor,
}: IssueItemProps) {
  return (
    <div
      className={clsx(
        'border-l-4 transition-all duration-200',
        isSelected 
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
          : 'border-transparent hover:bg-gray-50 dark:hover:bg-gray-800/50'
      )}
    >
      <div
        className="flex items-start gap-3 p-4 cursor-pointer"
        onClick={onSelect}
      >
        <div className="flex-shrink-0 mt-0.5">
          {getSeverityIcon(issue.impact)}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white text-sm leading-tight">
                {issue.description}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <span className={clsx(
                  'inline-block px-2 py-0.5 text-xs font-medium rounded-full',
                  getSeverityColor(issue.impact)
                )}>
                  {issue.impact}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {issue.rule}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {issue.nodes.length} element{issue.nodes.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              <a
                href={issue.helpUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                onClick={(e) => e.stopPropagation()}
                title="View help documentation"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleExpansion();
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                title={isExpanded ? 'Collapse details' : 'Expand details'}
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <div className="mt-3 space-y-3">
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Help
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {issue.help}
              </p>
            </div>

            {issue.nodes.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Affected Elements
                </h4>
                <div className="space-y-2">
                  {issue.nodes.slice(0, 5).map((node, index) => (
                    <div
                      key={index}
                      className="p-2 bg-white dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <code className="text-xs text-gray-800 dark:text-gray-200 break-all">
                          {node.target[0]}
                        </code>
                        <button
                          className="flex-shrink-0 text-blue-500 hover:text-blue-700 dark:hover:text-blue-400 transition-colors"
                          title="Highlight element"
                          onClick={() => {
                            // Would implement element highlighting
                            console.log('Highlight element:', node.target[0]);
                          }}
                        >
                          <Eye className="w-3 h-3" />
                        </button>
                      </div>
                      {node.failureSummary && (
                        <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                          {node.failureSummary}
                        </p>
                      )}
                    </div>
                  ))}
                  {issue.nodes.length > 5 && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      ... and {issue.nodes.length - 5} more elements
                    </p>
                  )}
                </div>
              </div>
            )}

            {issue.tags.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tags
                </h4>
                <div className="flex flex-wrap gap-1">
                  {issue.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}