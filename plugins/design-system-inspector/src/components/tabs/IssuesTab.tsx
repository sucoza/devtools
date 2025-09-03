import React, { useState } from 'react';
import { 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  CheckCircle, 
  X, 
  ExternalLink
} from 'lucide-react';
import { COLORS, COMPONENT_STYLES, SPACING, TYPOGRAPHY, RADIUS, mergeStyles } from '@sucoza/shared-components';
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
    <div style={COMPONENT_STYLES.content.split}>
      {/* Issues List */}
      <div style={mergeStyles(
        COMPONENT_STYLES.sidebar.base,
        {
          width: '320px',
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column'
        }
      )}>
        <div style={{
          padding: SPACING.xl,
          borderBottom: `1px solid ${COLORS.border.primary}`
        }}>
          <h3 style={{
            fontSize: TYPOGRAPHY.fontSize.lg,
            fontWeight: TYPOGRAPHY.fontWeight.semibold,
            color: COLORS.text.heading,
            margin: 0
          }}>
            Issues ({filteredData.issues.length})
          </h3>
          
          {/* Stats */}
          <div style={{
            marginTop: SPACING['2xl'],
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: SPACING.lg
          }}>
            <div style={{
              backgroundColor: 'rgba(231, 76, 60, 0.1)',
              borderRadius: RADIUS.lg,
              padding: SPACING.lg,
              textAlign: 'center'
            }}>
              <div style={{
                fontWeight: TYPOGRAPHY.fontWeight.bold,
                color: COLORS.status.error,
                margin: 0
              }}>
                {issueStats.bySeverity.error || 0}
              </div>
              <div style={{
                color: COLORS.status.error,
                fontSize: TYPOGRAPHY.fontSize.xs
              }}>Errors</div>
            </div>
            <div style={{
              backgroundColor: 'rgba(243, 156, 18, 0.1)',
              borderRadius: RADIUS.lg,
              padding: SPACING.lg,
              textAlign: 'center'
            }}>
              <div style={{
                fontWeight: TYPOGRAPHY.fontWeight.bold,
                color: COLORS.status.warning,
                margin: 0
              }}>
                {issueStats.bySeverity.warning || 0}
              </div>
              <div style={{
                color: COLORS.status.warning,
                fontSize: TYPOGRAPHY.fontSize.xs
              }}>Warnings</div>
            </div>
            <div style={{
              backgroundColor: 'rgba(52, 152, 219, 0.1)',
              borderRadius: RADIUS.lg,
              padding: SPACING.lg,
              textAlign: 'center'
            }}>
              <div style={{
                fontWeight: TYPOGRAPHY.fontWeight.bold,
                color: COLORS.status.info,
                margin: 0
              }}>
                {issueStats.bySeverity.info || 0}
              </div>
              <div style={{
                color: COLORS.status.info,
                fontSize: TYPOGRAPHY.fontSize.xs
              }}>Info</div>
            </div>
          </div>

          {issueStats.fixableIssues > 0 && (
            <div style={{
              marginTop: SPACING['2xl'],
              padding: SPACING.lg,
              backgroundColor: 'rgba(78, 201, 176, 0.1)',
              borderRadius: RADIUS.lg
            }}>
              <div style={{
                fontSize: TYPOGRAPHY.fontSize.xs,
                color: COLORS.status.success
              }}>
                {issueStats.fixableIssues} issues can be auto-fixed
              </div>
            </div>
          )}
        </div>
        
        <div style={{
          overflowY: 'auto',
          flex: 1
        }}>
          {sortedIssues.length === 0 ? (
            <div style={{
              padding: SPACING['6xl'],
              textAlign: 'center',
              color: COLORS.text.muted
            }}>
              <CheckCircle style={{
                width: '48px',
                height: '48px',
                margin: '0 auto',
                marginBottom: SPACING.xl,
                opacity: 0.5,
                color: COLORS.status.success
              }} />
              <p style={{
                fontWeight: TYPOGRAPHY.fontWeight.medium,
                margin: 0,
                marginBottom: SPACING.sm
              }}>No issues found!</p>
              <p style={{
                fontSize: TYPOGRAPHY.fontSize.sm,
                margin: 0
              }}>Your design system looks consistent.</p>
            </div>
          ) : (
            <div style={{
              padding: SPACING.lg
            }}>
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
      <div style={{
        flex: 1,
        overflowY: 'auto'
      }}>
        {selectedIssueData ? (
          <IssueDetails 
            issue={selectedIssueData} 
            onResolve={handleResolveIssue}
          />
        ) : (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: COLORS.text.muted
          }}>
            <div style={{
              textAlign: 'center'
            }}>
              <AlertTriangle style={{
                width: '64px',
                height: '64px',
                margin: '0 auto',
                marginBottom: SPACING.xl,
                opacity: 0.5
              }} />
              <p style={{
                fontSize: TYPOGRAPHY.fontSize.lg,
                fontWeight: TYPOGRAPHY.fontWeight.medium,
                margin: 0,
                marginBottom: SPACING.sm
              }}>Select an issue</p>
              <p style={{
                margin: 0
              }}>Choose an issue from the list to view its details</p>
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
      color: COLORS.status.error,
      bgColor: 'rgba(231, 76, 60, 0.1)'
    },
    warning: { 
      icon: AlertTriangle, 
      color: COLORS.status.warning,
      bgColor: 'rgba(243, 156, 18, 0.1)'
    },
    info: { 
      icon: Info, 
      color: COLORS.status.info,
      bgColor: 'rgba(52, 152, 219, 0.1)'
    }
  };

  const config = severityConfig[issue.severity];
  const Icon = config.icon;

  return (
    <div style={{
      marginBottom: SPACING.lg
    }}>
      <div
        style={mergeStyles(
          COMPONENT_STYLES.list.item.base,
          {
            padding: SPACING['2xl'],
            borderRadius: RADIUS.lg,
            cursor: 'pointer',
            border: `1px solid ${COLORS.border.primary}`,
            backgroundColor: isSelected ? COLORS.background.selected : COLORS.background.secondary,
            borderColor: isSelected ? COLORS.border.focus : COLORS.border.primary
          }
        )}
        onClick={() => onSelect(issue.id)}
        onMouseEnter={(e) => {
          if (!isSelected) {
            e.currentTarget.style.backgroundColor = COLORS.background.hover;
          }
        }}
        onMouseLeave={(e) => {
          if (!isSelected) {
            e.currentTarget.style.backgroundColor = COLORS.background.secondary;
          }
        }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            flex: 1,
            minWidth: 0
          }}>
            <Icon style={{
              width: '16px',
              height: '16px',
              marginRight: SPACING.lg,
              flexShrink: 0,
              marginTop: '2px',
              color: isSelected ? COLORS.text.accent : config.color
            }} />
            <div style={{
              minWidth: 0,
              flex: 1
            }}>
              <div style={{
                fontWeight: TYPOGRAPHY.fontWeight.medium,
                color: COLORS.text.primary,
                fontSize: TYPOGRAPHY.fontSize.sm,
                margin: 0
              }}>
                {issue.title}
              </div>
              <div style={{
                fontSize: TYPOGRAPHY.fontSize.xs,
                color: COLORS.text.secondary,
                marginTop: SPACING.sm,
                lineHeight: TYPOGRAPHY.lineHeight.tight,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical' as const,
                overflow: 'hidden'
              }}>
                {issue.description}
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                marginTop: SPACING.lg,
                gap: SPACING.lg
              }}>
                <span style={{
                  fontSize: TYPOGRAPHY.fontSize.xs,
                  padding: `${SPACING.xs} ${SPACING.lg}`,
                  borderRadius: RADIUS.md,
                  textTransform: 'capitalize',
                  backgroundColor: config.bgColor,
                  color: config.color
                }}>
                  {issue.severity}
                </span>
                <span style={{
                  fontSize: TYPOGRAPHY.fontSize.xs,
                  color: COLORS.text.secondary
                }}>
                  {issue.type.replace('-', ' ')}
                </span>
                {issue.fixable && (
                  <span style={{
                    fontSize: TYPOGRAPHY.fontSize.xs,
                    backgroundColor: 'rgba(78, 201, 176, 0.1)',
                    color: COLORS.status.success,
                    padding: `${SPACING.xs} ${SPACING.lg}`,
                    borderRadius: RADIUS.md
                  }}>
                    Fixable
                  </span>
                )}
              </div>
            </div>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: SPACING.sm,
            marginLeft: SPACING.lg
          }}>
            {issue.occurrences.length > 1 && (
              <span style={{
                fontSize: TYPOGRAPHY.fontSize.xs,
                backgroundColor: COLORS.background.tertiary,
                color: COLORS.text.secondary,
                padding: `${SPACING.xs} ${SPACING.lg}`,
                borderRadius: RADIUS.md
              }}>
                {issue.occurrences.length}
              </span>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onResolve(issue.id);
              }}
              style={{
                padding: SPACING.sm,
                color: COLORS.text.muted,
                background: 'none',
                border: 'none',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = COLORS.text.secondary;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = COLORS.text.muted;
              }}
              title="Mark as resolved"
            >
              <X style={{ width: '12px', height: '12px' }} />
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
      color: COLORS.status.error,
      bgColor: 'rgba(231, 76, 60, 0.1)'
    },
    warning: { 
      icon: AlertTriangle, 
      color: COLORS.status.warning,
      bgColor: 'rgba(243, 156, 18, 0.1)'
    },
    info: { 
      icon: Info, 
      color: COLORS.status.info,
      bgColor: 'rgba(52, 152, 219, 0.1)'
    }
  };

  const config = severityConfig[issue.severity];
  const Icon = config.icon;

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <div style={{
        flexShrink: 0,
        borderBottom: `1px solid ${COLORS.border.primary}`,
        backgroundColor: COLORS.background.secondary,
        padding: SPACING['5xl']
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'flex-start'
          }}>
            <Icon style={{
              width: '24px',
              height: '24px',
              marginRight: SPACING['2xl'],
              marginTop: SPACING.sm,
              flexShrink: 0,
              color: config.color
            }} />
            <div>
              <h2 style={{
                fontSize: TYPOGRAPHY.fontSize.xl,
                fontWeight: TYPOGRAPHY.fontWeight.bold,
                color: COLORS.text.heading,
                margin: 0
              }}>
                {issue.title}
              </h2>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                marginTop: SPACING.lg,
                gap: SPACING['2xl']
              }}>
                <span style={{
                  padding: `${SPACING.sm} ${SPACING['2xl']}`,
                  borderRadius: RADIUS.full,
                  fontSize: TYPOGRAPHY.fontSize.sm,
                  fontWeight: TYPOGRAPHY.fontWeight.medium,
                  textTransform: 'capitalize',
                  backgroundColor: config.bgColor,
                  color: config.color
                }}>
                  {issue.severity}
                </span>
                <span style={{
                  fontSize: TYPOGRAPHY.fontSize.sm,
                  color: COLORS.text.secondary
                }}>
                  {issue.type.replace('-', ' ')}
                </span>
                {issue.fixable && (
                  <span style={{
                    fontSize: TYPOGRAPHY.fontSize.sm,
                    backgroundColor: 'rgba(78, 201, 176, 0.1)',
                    color: COLORS.status.success,
                    padding: `${SPACING.sm} ${SPACING['2xl']}`,
                    borderRadius: RADIUS.full
                  }}>
                    Auto-fixable
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: SPACING.lg
          }}>
            {issue.fixable && (
              <button style={mergeStyles(
                COMPONENT_STYLES.button.base,
                COMPONENT_STYLES.button.success,
                {
                  fontSize: TYPOGRAPHY.fontSize.sm
                }
              )}>
                Auto Fix
              </button>
            )}
            <button
              onClick={() => onResolve(issue.id)}
              style={mergeStyles(
                COMPONENT_STYLES.button.base,
                {
                  fontSize: TYPOGRAPHY.fontSize.sm,
                  backgroundColor: COLORS.background.tertiary,
                  color: COLORS.text.primary
                }
              )}
            >
              Mark Resolved
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: SPACING['5xl'],
        display: 'flex',
        flexDirection: 'column',
        gap: SPACING['5xl']
      }}>
        {/* Description */}
        <div>
          <h3 style={{
            fontSize: TYPOGRAPHY.fontSize.lg,
            fontWeight: TYPOGRAPHY.fontWeight.semibold,
            color: COLORS.text.heading,
            margin: 0,
            marginBottom: SPACING['2xl']
          }}>
            Description
          </h3>
          <p style={{
            color: COLORS.text.secondary,
            margin: 0
          }}>
            {issue.description}
          </p>
        </div>

        {/* Recommendation */}
        {issue.recommendation && (
          <div>
            <h3 style={{
              fontSize: TYPOGRAPHY.fontSize.lg,
              fontWeight: TYPOGRAPHY.fontWeight.semibold,
              color: COLORS.text.heading,
              margin: 0,
              marginBottom: SPACING['2xl']
            }}>
              Recommendation
            </h3>
            <div style={{
              padding: SPACING.xl,
              backgroundColor: 'rgba(52, 152, 219, 0.1)',
              borderRadius: RADIUS.lg,
              border: `1px solid rgba(52, 152, 219, 0.2)`
            }}>
              <p style={{
                color: COLORS.status.info,
                margin: 0
              }}>
                {issue.recommendation}
              </p>
            </div>
          </div>
        )}

        {/* Occurrences */}
        {issue.occurrences && issue.occurrences.length > 0 && (
          <div>
            <h3 style={{
              fontSize: TYPOGRAPHY.fontSize.lg,
              fontWeight: TYPOGRAPHY.fontWeight.semibold,
              color: COLORS.text.heading,
              margin: 0,
              marginBottom: SPACING['2xl']
            }}>
              Occurrences ({issue.occurrences.length})
            </h3>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: SPACING['2xl']
            }}>
              {issue.occurrences.slice(0, 10).map((occurrence, index) => (
                <div key={index} style={{
                  padding: SPACING.xl,
                  backgroundColor: COLORS.background.tertiary,
                  borderRadius: RADIUS.lg,
                  border: `1px solid ${COLORS.border.primary}`
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: SPACING.lg
                  }}>
                    <code style={{
                      fontSize: TYPOGRAPHY.fontSize.sm,
                      fontFamily: TYPOGRAPHY.fontFamily.mono,
                      color: COLORS.text.secondary,
                      backgroundColor: COLORS.background.primary,
                      padding: `${SPACING.xs} ${SPACING.lg}`,
                      borderRadius: RADIUS.sm
                    }}>
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
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        fontSize: TYPOGRAPHY.fontSize.sm,
                        color: COLORS.status.info,
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'color 0.15s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = COLORS.text.accent;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = COLORS.status.info;
                      }}
                    >
                      <ExternalLink style={{
                        width: '16px',
                        height: '16px',
                        marginRight: SPACING.sm
                      }} />
                      Locate
                    </button>
                  </div>
                  <div style={{
                    fontSize: TYPOGRAPHY.fontSize.sm,
                    color: COLORS.text.secondary
                  }}>
                    Current: <code style={{
                      backgroundColor: 'rgba(231, 76, 60, 0.1)',
                      color: COLORS.status.error,
                      padding: `${SPACING.xs} ${SPACING.lg}`,
                      borderRadius: RADIUS.sm
                    }}>
                      {occurrence.actualValue}
                    </code>
                    {occurrence.expectedValue && (
                      <>
                        {' → Expected: '}
                        <code style={{
                          backgroundColor: 'rgba(78, 201, 176, 0.1)',
                          color: COLORS.status.success,
                          padding: `${SPACING.xs} ${SPACING.lg}`,
                          borderRadius: RADIUS.sm
                        }}>
                          {occurrence.expectedValue}
                        </code>
                      </>
                    )}
                  </div>
                </div>
              ))}
              {issue.occurrences.length > 10 && (
                <div style={{
                  textAlign: 'center',
                  fontSize: TYPOGRAPHY.fontSize.sm,
                  color: COLORS.text.secondary
                }}>
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