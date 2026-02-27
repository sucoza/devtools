import React from 'react';
import { 
  TrendingUp, 
  AlertCircle, 
  CheckCircle, 
  Palette,
  Type,
  Ruler,
  Zap
} from 'lucide-react';
import { COLORS, COMPONENT_STYLES, SPACING, TYPOGRAPHY, RADIUS, mergeStyles, ScrollableContainer } from '@sucoza/shared-components';
import { useDesignSystemInspector } from '../../hooks';

export function DashboardTab() {
  const { state } = useDesignSystemInspector();
  const { stats } = state;
  
  const consistencyScore = Math.round(stats.consistencyScore);
  const accessibilityScore = Math.round(stats.accessibilityScore);
  const tokensUtilization = Math.round(stats.tokensUtilization);
  
  const getScoreColor = (score: number) => {
    if (score >= 80) return COLORS.status.success;
    if (score >= 60) return COLORS.status.warning;
    return COLORS.status.error;
  };
  
  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'rgba(78, 201, 176, 0.1)';
    if (score >= 60) return 'rgba(243, 156, 18, 0.1)';
    return 'rgba(231, 76, 60, 0.1)';
  };

  const overviewCards = [
    {
      title: 'Consistency Score',
      value: `${consistencyScore}%`,
      icon: TrendingUp,
      color: getScoreColor(consistencyScore),
      bgColor: getScoreBgColor(consistencyScore),
      description: 'Overall design system consistency',
    },
    {
      title: 'Accessibility Score',
      value: `${accessibilityScore}%`,
      icon: CheckCircle,
      color: getScoreColor(accessibilityScore),
      bgColor: getScoreBgColor(accessibilityScore),
      description: 'WCAG compliance rating',
    },
    {
      title: 'Token Utilization',
      value: `${tokensUtilization}%`,
      icon: Zap,
      color: getScoreColor(tokensUtilization),
      bgColor: getScoreBgColor(tokensUtilization),
      description: 'Design tokens being used',
    },
    {
      title: 'Issues Found',
      value: stats.totalIssues,
      icon: AlertCircle,
      color: stats.totalIssues > 0 ? COLORS.status.error : COLORS.status.success,
      bgColor: stats.totalIssues > 0 ? 'rgba(231, 76, 60, 0.1)' : 'rgba(78, 201, 176, 0.1)',
      description: 'Design inconsistencies detected',
    },
  ];

  const detailCards = [
    {
      title: 'Components',
      value: stats.totalComponents,
      icon: '🧩',
      description: 'React components analyzed',
    },
    {
      title: 'Design Tokens',
      value: stats.totalTokens,
      icon: '🎨',
      description: 'Tokens discovered in codebase',
    },
    {
      title: 'Last Analysis',
      value: stats.lastAnalysis ? formatTime(stats.lastAnalysis) : 'Never',
      icon: '🕒',
      description: 'Most recent scan completed',
    },
    {
      title: 'Analysis Time',
      value: `${Math.round(stats.analysisTime)}ms`,
      icon: '⚡',
      description: 'Time to complete last scan',
    },
  ];

  return (
    <ScrollableContainer
      showShadows={true}
      shadowIntensity="medium"
      smoothScroll={true}
      scrollbarWidth="thin"
      autoHideScrollbar={true}
      style={{ height: '100%' }}
    >
      <div style={{
        padding: SPACING['5xl'],
        display: 'flex',
        flexDirection: 'column',
        gap: SPACING['5xl']
      }}>
      <div>
        <h2 style={{
          fontSize: TYPOGRAPHY.fontSize.xl,
          fontWeight: TYPOGRAPHY.fontWeight.bold,
          color: COLORS.text.heading,
          margin: `0 0 ${SPACING.lg} 0`
        }}>
          Design System Overview
        </h2>
        <p style={{
          color: COLORS.text.secondary,
          margin: 0
        }}>
          Monitor your design system&apos;s health and consistency across your application.
        </p>
      </div>

      {/* Key Metrics */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: SPACING.xl
      }}>
        {overviewCards.map((card) => (
          <div
            key={card.title}
            style={mergeStyles(
              COMPONENT_STYLES.container.panel,
              {
                padding: SPACING['5xl']
              }
            )}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center'
            }}>
              <div style={{
                padding: SPACING.lg,
                borderRadius: RADIUS.lg,
                backgroundColor: card.bgColor
              }}>
                <card.icon style={{
                  width: '20px',
                  height: '20px',
                  color: card.color
                }} />
              </div>
              <div style={{
                marginLeft: SPACING.xl,
                flex: 1
              }}>
                <p style={{
                  fontSize: TYPOGRAPHY.fontSize.sm,
                  fontWeight: TYPOGRAPHY.fontWeight.medium,
                  color: COLORS.text.secondary,
                  margin: 0
                }}>
                  {card.title}
                </p>
                <p style={{
                  fontSize: TYPOGRAPHY.fontSize.xl,
                  fontWeight: TYPOGRAPHY.fontWeight.bold,
                  color: card.color,
                  margin: 0
                }}>
                  {card.value}
                </p>
              </div>
            </div>
            <p style={{
              fontSize: TYPOGRAPHY.fontSize.xs,
              color: COLORS.text.muted,
              marginTop: SPACING.lg,
              margin: `${SPACING.lg} 0 0 0`
            }}>
              {card.description}
            </p>
          </div>
        ))}
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
        gap: SPACING['5xl']
      }}>
        {/* Consistency Breakdown */}
        <div style={mergeStyles(
          COMPONENT_STYLES.container.panel,
          {
            padding: SPACING['5xl']
          }
        )}>
          <h3 style={{
            fontSize: TYPOGRAPHY.fontSize.lg,
            fontWeight: TYPOGRAPHY.fontWeight.semibold,
            color: COLORS.text.heading,
            margin: `0 0 ${SPACING.xl} 0`
          }}>
            Consistency Breakdown
          </h3>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: SPACING['2xl']
          }}>
            <ConsistencyItem
              icon={<Palette style={{ width: '16px', height: '16px' }} />}
              label="Colors"
              score={85}
              description="Color token usage and accessibility"
            />
            <ConsistencyItem
              icon={<Type style={{ width: '16px', height: '16px' }} />}
              label="Typography"
              score={92}
              description="Font scale and text consistency"
            />
            <ConsistencyItem
              icon={<Ruler style={{ width: '16px', height: '16px' }} />}
              label="Spacing"
              score={78}
              description="Margin, padding, and layout spacing"
            />
          </div>
        </div>

        {/* Recent Activity */}
        <div style={mergeStyles(
          COMPONENT_STYLES.container.panel,
          {
            padding: SPACING['5xl']
          }
        )}>
          <h3 style={{
            fontSize: TYPOGRAPHY.fontSize.lg,
            fontWeight: TYPOGRAPHY.fontWeight.semibold,
            color: COLORS.text.heading,
            margin: `0 0 ${SPACING.xl} 0`
          }}>
            System Details
          </h3>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: SPACING['2xl']
          }}>
            {detailCards.map((card) => (
              <div key={card.title} style={{
                display: 'flex',
                alignItems: 'center'
              }}>
                <span style={{
                  fontSize: TYPOGRAPHY.fontSize.lg,
                  marginRight: SPACING['2xl']
                }}>{card.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <span style={{
                      fontSize: TYPOGRAPHY.fontSize.sm,
                      fontWeight: TYPOGRAPHY.fontWeight.medium,
                      color: COLORS.text.primary
                    }}>
                      {card.title}
                    </span>
                    <span style={{
                      fontSize: TYPOGRAPHY.fontSize.sm,
                      fontWeight: TYPOGRAPHY.fontWeight.semibold,
                      color: COLORS.text.heading
                    }}>
                      {card.value}
                    </span>
                  </div>
                  <p style={{
                    fontSize: TYPOGRAPHY.fontSize.xs,
                    color: COLORS.text.muted,
                    margin: 0
                  }}>
                    {card.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div style={mergeStyles(
        COMPONENT_STYLES.container.panel,
        {
          padding: SPACING['5xl']
        }
      )}>
        <h3 style={{
          fontSize: TYPOGRAPHY.fontSize.lg,
          fontWeight: TYPOGRAPHY.fontWeight.semibold,
          color: COLORS.text.heading,
          margin: `0 0 ${SPACING.xl} 0`
        }}>
          Recommendations
        </h3>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: SPACING['2xl']
        }}>
          {stats.totalIssues > 0 && (
            <RecommendationItem
              type="warning"
              title="Address Consistency Issues"
              description={`You have ${stats.totalIssues} design inconsistencies that could be resolved.`}
              action="View Issues"
            />
          )}
          {tokensUtilization < 80 && (
            <RecommendationItem
              type="info"
              title="Improve Token Adoption"
              description="Consider creating more design tokens for commonly used values."
              action="View Tokens"
            />
          )}
          {stats.totalComponents < 10 && (
            <RecommendationItem
              type="info"
              title="Component Documentation"
              description="Document your components to improve design system adoption."
              action="View Components"
            />
          )}
        </div>
      </div>
    </div>
    </ScrollableContainer>
  );
}

function ConsistencyItem({ 
  icon, 
  label, 
  score 
}: { 
  icon: React.ReactNode; 
  label: string; 
  score: number; 
  description: string; 
}) {
  const scoreColor = score >= 80 ? COLORS.status.success : score >= 60 ? COLORS.status.warning : COLORS.status.error;
  const barColor = score >= 80 ? COLORS.status.success : score >= 60 ? COLORS.status.warning : COLORS.status.error;
  
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        color: COLORS.text.secondary
      }}>
        {icon}
        <span style={{
          marginLeft: SPACING.lg,
          fontSize: TYPOGRAPHY.fontSize.sm,
          fontWeight: TYPOGRAPHY.fontWeight.medium
        }}>{label}</span>
      </div>
      <div style={{
        marginLeft: 'auto',
        display: 'flex',
        alignItems: 'center'
      }}>
        <div style={{
          width: '80px',
          backgroundColor: COLORS.background.tertiary,
          borderRadius: RADIUS.full,
          height: '8px',
          marginRight: SPACING['2xl']
        }}>
          <div
            style={{
              height: '8px',
              borderRadius: RADIUS.full,
              backgroundColor: barColor,
              width: `${score}%`,
              transition: 'width 0.3s ease'
            }}
          />
        </div>
        <span style={{
          fontSize: TYPOGRAPHY.fontSize.sm,
          fontWeight: TYPOGRAPHY.fontWeight.semibold,
          color: scoreColor
        }}>
          {score}%
        </span>
      </div>
    </div>
  );
}

function RecommendationItem({
  type,
  title,
  description,
  action
}: {
  type: 'info' | 'warning' | 'error';
  title: string;
  description: string;
  action: string;
}) {
  const typeStyles = {
    info: {
      backgroundColor: 'rgba(52, 152, 219, 0.1)',
      borderColor: COLORS.status.info
    },
    warning: {
      backgroundColor: 'rgba(243, 156, 18, 0.1)',
      borderColor: COLORS.status.warning
    },
    error: {
      backgroundColor: 'rgba(231, 76, 60, 0.1)',
      borderColor: COLORS.status.error
    },
  };

  return (
    <div style={mergeStyles(
      {
        padding: SPACING.xl,
        borderRadius: RADIUS.lg,
        border: `1px solid ${typeStyles[type].borderColor}`,
        backgroundColor: typeStyles[type].backgroundColor
      }
    )}>
      <h4 style={{
        fontSize: TYPOGRAPHY.fontSize.sm,
        fontWeight: TYPOGRAPHY.fontWeight.medium,
        color: COLORS.text.primary,
        margin: 0
      }}>
        {title}
      </h4>
      <p style={{
        fontSize: TYPOGRAPHY.fontSize.sm,
        color: COLORS.text.secondary,
        margin: `${SPACING.sm} 0 0 0`
      }}>
        {description}
      </p>
      <button style={{
        fontSize: TYPOGRAPHY.fontSize.sm,
        color: COLORS.text.link,
        fontWeight: TYPOGRAPHY.fontWeight.medium,
        marginTop: SPACING.lg,
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: 0
      }}>
        {action} →
      </button>
    </div>
  );
}

function formatTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'Just now';
}