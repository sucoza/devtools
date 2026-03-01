import React, { useState } from 'react';
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
import { COLORS, COMPONENT_STYLES, mergeStyles } from '@sucoza/shared-components';
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
  const _uniqueTags: string[] = getUniqueTags();

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
    if (issue.nodes.length > 0 && issue.nodes[0].target.length > 0) {
      const firstTarget = issue.nodes[0].target[0];
      highlightElement(firstTarget);
    }
  };

  const getSeverityIcon = (severity: SeverityLevel) => {
    const iconStyle = { width: '16px', height: '16px' };
    switch (severity) {
      case 'critical':
        return <AlertTriangle style={{ ...iconStyle, color: COLORS.severity.critical }} />;
      case 'serious':
        return <AlertCircle style={{ ...iconStyle, color: COLORS.severity.serious }} />;
      case 'moderate':
        return <AlertCircle style={{ ...iconStyle, color: COLORS.severity.moderate }} />;
      case 'minor':
        return <Info style={{ ...iconStyle, color: COLORS.severity.minor }} />;
      default:
        return <Info style={{ ...iconStyle, color: COLORS.text.muted }} />;
    }
  };

  const getSeverityStyles = (severity: SeverityLevel): React.CSSProperties => {
    const baseStyles = {
      padding: '2px 8px',
      borderRadius: '9999px',
      fontSize: '10px',
      fontWeight: '500',
      display: 'inline-block'
    };
    
    switch (severity) {
      case 'critical':
        return { ...baseStyles, backgroundColor: 'rgba(231, 76, 60, 0.2)', color: COLORS.severity.critical };
      case 'serious':
        return { ...baseStyles, backgroundColor: 'rgba(243, 156, 18, 0.2)', color: COLORS.severity.serious };
      case 'moderate':
        return { ...baseStyles, backgroundColor: 'rgba(241, 196, 15, 0.2)', color: COLORS.severity.moderate };
      case 'minor':
        return { ...baseStyles, backgroundColor: 'rgba(52, 152, 219, 0.2)', color: COLORS.severity.minor };
      default:
        return { ...baseStyles, backgroundColor: COLORS.background.tertiary, color: COLORS.text.secondary };
    }
  };

  if (!currentAudit) {
    return (
      <div style={mergeStyles(COMPONENT_STYLES.empty.container, className ? {} : {})}>
        <div style={{ textAlign: 'center' }}>
          <AlertTriangle style={{ width: '48px', height: '48px', margin: '0 auto 16px auto', color: COLORS.text.muted }} />
          <p style={{ fontSize: '18px', fontWeight: '500', marginBottom: '8px', color: COLORS.text.primary }}>No Audit Results</p>
          <p style={{ fontSize: '14px', color: COLORS.text.secondary }}>Start a scan to analyze accessibility issues</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Overview Section */}
      {showOverview && (
        <div style={{
          padding: '16px',
          background: COLORS.background.secondary,
          borderBottom: `1px solid ${COLORS.border.primary}`
        }}>
          <h2 style={{
            fontSize: '18px',
            fontWeight: '600',
            color: COLORS.text.heading,
            marginBottom: '12px',
            margin: 0
          }}>
            Accessibility Overview
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
            gap: '16px'
          }}>
            <div style={{
              textAlign: 'center',
              padding: '12px',
              backgroundColor: 'rgba(231, 76, 60, 0.2)',
              borderRadius: '8px'
            }}>
              <div style={{
                fontSize: '24px',
                fontWeight: '700',
                color: COLORS.severity.critical
              }}>
                {stats.critical}
              </div>
              <div style={{
                fontSize: '12px',
                color: COLORS.severity.critical,
                marginTop: '4px'
              }}>Critical</div>
            </div>
            <div style={{
              textAlign: 'center',
              padding: '12px',
              backgroundColor: 'rgba(243, 156, 18, 0.2)',
              borderRadius: '8px'
            }}>
              <div style={{
                fontSize: '24px',
                fontWeight: '700',
                color: COLORS.severity.serious
              }}>
                {stats.serious}
              </div>
              <div style={{
                fontSize: '12px',
                color: COLORS.severity.serious,
                marginTop: '4px'
              }}>Serious</div>
            </div>
            <div style={{
              textAlign: 'center',
              padding: '12px',
              backgroundColor: 'rgba(241, 196, 15, 0.2)',
              borderRadius: '8px'
            }}>
              <div style={{
                fontSize: '24px',
                fontWeight: '700',
                color: COLORS.severity.moderate
              }}>
                {stats.moderate}
              </div>
              <div style={{
                fontSize: '12px',
                color: COLORS.severity.moderate,
                marginTop: '4px'
              }}>Moderate</div>
            </div>
            <div style={{
              textAlign: 'center',
              padding: '12px',
              backgroundColor: 'rgba(52, 152, 219, 0.2)',
              borderRadius: '8px'
            }}>
              <div style={{
                fontSize: '24px',
                fontWeight: '700',
                color: COLORS.severity.minor
              }}>
                {stats.minor}
              </div>
              <div style={{
                fontSize: '12px',
                color: COLORS.severity.minor,
                marginTop: '4px'
              }}>Minor</div>
            </div>
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div style={{
        padding: '12px',
        background: COLORS.background.secondary,
        borderBottom: `1px solid ${COLORS.border.primary}`
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '8px'
        }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '16px',
              height: '16px',
              color: COLORS.text.secondary
            }} />
            <input
              type="text"
              placeholder="Search issues..."
              value={filters.searchQuery}
              onChange={(e) => updateSearchFilter(e.target.value)}
              style={mergeStyles(
                COMPONENT_STYLES.input.base,
                { paddingLeft: '40px', width: '100%' }
              )}
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            style={mergeStyles(
              COMPONENT_STYLES.button.base,
              COMPONENT_STYLES.button.small,
              showFilters ? COMPONENT_STYLES.button.active : {}
            )}
          >
            <Filter style={{ width: '16px', height: '16px' }} />
            Filters
          </button>
          {(filters.searchQuery || filters.severity.size < 4 || filters.ruleIds.size > 0) && (
            <button
              onClick={resetFilters}
              style={{
                padding: '8px 12px',
                fontSize: '12px',
                color: COLORS.text.secondary,
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                borderRadius: '3px',
                transition: 'color 0.15s ease'
              }}
            >
              Clear
            </button>
          )}
        </div>

        {/* Filter Options */}
        {showFilters && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Severity Filters */}
            <div>
              <label style={{
                fontSize: '12px',
                fontWeight: '500',
                color: COLORS.text.heading,
                marginBottom: '8px',
                display: 'block'
              }}>
                Severity
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {(['critical', 'serious', 'moderate', 'minor'] as const).map(severity => (
                  <button
                    key={severity}
                    onClick={() => toggleSeverityFilter(severity)}
                    style={mergeStyles(
                      {
                        padding: '4px 12px',
                        fontSize: '10px',
                        borderRadius: '9999px',
                        border: `1px solid ${COLORS.border.primary}`,
                        transition: 'all 0.15s ease',
                        cursor: 'pointer',
                        textTransform: 'capitalize'
                      },
                      filters.severity.has(severity)
                        ? getSeverityStyles(severity)
                        : {
                            color: COLORS.text.secondary,
                            backgroundColor: COLORS.background.tertiary
                          }
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
                <label style={{
                  fontSize: '12px',
                  fontWeight: '500',
                  color: COLORS.text.heading,
                  marginBottom: '8px',
                  display: 'block'
                }}>
                  Rules (showing top 10)
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {uniqueRuleIds.slice(0, 10).map(ruleId => (
                    <button
                      key={ruleId}
                      onClick={() => toggleRuleFilter(ruleId)}
                      style={mergeStyles(
                        {
                          padding: '4px 8px',
                          fontSize: '10px',
                          borderRadius: '3px',
                          border: `1px solid ${COLORS.border.primary}`,
                          transition: 'all 0.15s ease',
                          cursor: 'pointer'
                        },
                        filters.ruleIds.has(ruleId)
                          ? {
                              color: COLORS.text.accent,
                              backgroundColor: 'rgba(0, 122, 204, 0.2)',
                              borderColor: COLORS.border.focus
                            }
                          : {
                              color: COLORS.text.secondary,
                              backgroundColor: COLORS.background.tertiary
                            }
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
        <div style={{
          padding: '8px 12px',
          backgroundColor: 'rgba(52, 152, 219, 0.2)',
          color: COLORS.status.info,
          fontSize: '12px'
        }}>
          Showing {filteredStats.total} of {stats.total} issues
        </div>
      )}

      {/* Issues List */}
      <div style={COMPONENT_STYLES.content.scrollable}>
        {filteredIssues.length === 0 ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: COLORS.text.secondary
          }}>
            <div style={{ textAlign: 'center' }}>
              <AlertTriangle style={{
                width: '32px',
                height: '32px',
                margin: '0 auto 8px auto',
                color: COLORS.text.muted
              }} />
              <p style={{ fontWeight: '500', marginBottom: '4px', color: COLORS.text.primary }}>No issues found</p>
              <p style={{ fontSize: '12px', color: COLORS.text.secondary }}>
                {filters.searchQuery || filters.severity.size < 4 
                  ? 'Try adjusting your filters'
                  : 'Great job! No accessibility issues detected'
                }
              </p>
            </div>
          </div>
        ) : (
          <div>
            {filteredIssues.map((issue) => (
              <IssueItem
                key={issue.id}
                issue={issue}
                isSelected={selectedIssue?.id === issue.id}
                isExpanded={expandedIssues.has(issue.id)}
                onSelect={() => handleIssueSelect(issue)}
                onToggleExpansion={() => toggleIssueExpansion(issue.id)}
                getSeverityIcon={getSeverityIcon}
                getSeverityStyles={getSeverityStyles}
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
  getSeverityStyles: (severity: SeverityLevel) => React.CSSProperties;
}

function IssueItem({
  issue,
  isSelected,
  isExpanded,
  onSelect,
  onToggleExpansion,
  getSeverityIcon,
  getSeverityStyles,
}: IssueItemProps) {
  return (
    <div
      style={{
        borderLeft: `4px solid ${isSelected ? COLORS.border.focus : 'transparent'}`,
        transition: 'all 0.2s ease',
        backgroundColor: isSelected 
          ? COLORS.background.selected 
          : 'transparent'
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px',
          padding: '16px',
          cursor: 'pointer',
          borderBottom: `1px solid ${COLORS.border.secondary}`
        }}
        onClick={onSelect}
      >
        <div style={{ flexShrink: 0, marginTop: '2px' }}>
          {getSeverityIcon(issue.impact)}
        </div>
        
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
            <div style={{ flex: 1 }}>
              <h3 style={{
                fontWeight: '500',
                color: COLORS.text.primary,
                fontSize: '12px',
                lineHeight: '1.4',
                margin: 0,
                marginBottom: '4px'
              }}>
                {issue.description}
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                <span style={getSeverityStyles(issue.impact)}>
                  {issue.impact}
                </span>
                <span style={{ fontSize: '10px', color: COLORS.text.secondary }}>
                  {issue.rule}
                </span>
                <span style={{ fontSize: '10px', color: COLORS.text.secondary }}>
                  {issue.nodes.length} element{issue.nodes.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <a
                href={issue.helpUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: COLORS.text.muted,
                  textDecoration: 'none',
                  transition: 'color 0.15s ease'
                }}
                onClick={(e) => e.stopPropagation()}
                title="View help documentation"
              >
                <ExternalLink style={{ width: '16px', height: '16px' }} />
              </a>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleExpansion();
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: COLORS.text.muted,
                  transition: 'color 0.15s ease',
                  padding: '2px'
                }}
                title={isExpanded ? 'Collapse details' : 'Expand details'}
              >
                {isExpanded ? (
                  <ChevronDown style={{ width: '16px', height: '16px' }} />
                ) : (
                  <ChevronRight style={{ width: '16px', height: '16px' }} />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div style={{
          padding: '0 16px 16px 16px',
          borderTop: `1px solid ${COLORS.border.primary}`,
          backgroundColor: COLORS.background.tertiary
        }}>
          <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <h4 style={{
                fontSize: '12px',
                fontWeight: '500',
                color: COLORS.text.heading,
                marginBottom: '4px',
                margin: 0
              }}>
                Help
              </h4>
              <p style={{
                fontSize: '12px',
                color: COLORS.text.secondary,
                margin: 0,
                lineHeight: '1.4'
              }}>
                {issue.help}
              </p>
            </div>

            {issue.nodes.length > 0 && (
              <div>
                <h4 style={{
                  fontSize: '12px',
                  fontWeight: '500',
                  color: COLORS.text.heading,
                  marginBottom: '8px',
                  margin: 0
                }}>
                  Affected Elements
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {issue.nodes.slice(0, 5).map((node, index) => (
                    <div
                      key={index}
                      style={{
                        padding: '8px',
                        backgroundColor: COLORS.background.primary,
                        borderRadius: '3px',
                        border: `1px solid ${COLORS.border.primary}`
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                        <code style={{
                          fontSize: '10px',
                          color: COLORS.text.primary,
                          wordBreak: 'break-all',
                          fontFamily: 'monospace'
                        }}>
                          {node.target[0] ?? ''}
                        </code>
                        <button
                          style={{
                            flexShrink: 0,
                            color: COLORS.text.accent,
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            transition: 'color 0.15s ease',
                            padding: '2px'
                          }}
                          title="Highlight element"
                          onClick={() => {
                            // Would implement element highlighting
                            // TODO: Implement element highlighting
                          }}
                        >
                          <Eye style={{ width: '12px', height: '12px' }} />
                        </button>
                      </div>
                      {node.failureSummary && (
                        <p style={{
                          fontSize: '10px',
                          color: COLORS.status.error,
                          marginTop: '4px',
                          margin: '4px 0 0 0'
                        }}>
                          {node.failureSummary}
                        </p>
                      )}
                    </div>
                  ))}
                  {issue.nodes.length > 5 && (
                    <p style={{
                      fontSize: '10px',
                      color: COLORS.text.muted,
                      margin: 0
                    }}>
                      ... and {issue.nodes.length - 5} more elements
                    </p>
                  )}
                </div>
              </div>
            )}

            {issue.tags.length > 0 && (
              <div>
                <h4 style={{
                  fontSize: '12px',
                  fontWeight: '500',
                  color: COLORS.text.heading,
                  marginBottom: '4px',
                  margin: 0
                }}>
                  Tags
                </h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {issue.tags.map((tag) => (
                    <span
                      key={tag}
                      style={{
                        padding: '2px 8px',
                        fontSize: '10px',
                        backgroundColor: COLORS.background.tertiary,
                        color: COLORS.text.secondary,
                        borderRadius: '3px'
                      }}
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