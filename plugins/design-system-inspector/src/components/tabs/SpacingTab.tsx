import React from 'react';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from '@sucoza/shared-components';
import { useDesignSystemInspector } from '../../hooks';

export function SpacingTab() {
  const { state } = useDesignSystemInspector();
  const { spacingAnalysis } = state;

  return (
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
          margin: 0,
          marginBottom: SPACING.lg
        }}>
          Spacing Analysis
        </h2>
        <p style={{
          color: COLORS.text.secondary,
          margin: 0
        }}>
          Analyze spacing consistency and adherence to your design scale.
        </p>
      </div>

      {/* Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: SPACING.xl
      }}>
        <div style={{
          backgroundColor: COLORS.background.secondary,
          borderRadius: RADIUS.lg,
          border: `1px solid ${COLORS.border.primary}`,
          padding: SPACING.xl
        }}>
          <div style={{
            fontSize: TYPOGRAPHY.fontSize.xl,
            fontWeight: TYPOGRAPHY.fontWeight.bold,
            color: COLORS.text.primary,
            margin: 0
          }}>
            {spacingAnalysis.scale.length}
          </div>
          <div style={{
            fontSize: TYPOGRAPHY.fontSize.sm,
            color: COLORS.text.secondary
          }}>Spacing Tokens</div>
        </div>
        <div style={{
          backgroundColor: COLORS.background.secondary,
          borderRadius: RADIUS.lg,
          border: `1px solid ${COLORS.border.primary}`,
          padding: SPACING.xl
        }}>
          <div style={{
            fontSize: TYPOGRAPHY.fontSize.xl,
            fontWeight: TYPOGRAPHY.fontWeight.bold,
            color: COLORS.status.success,
            margin: 0
          }}>
            {Math.round(spacingAnalysis.consistency)}%
          </div>
          <div style={{
            fontSize: TYPOGRAPHY.fontSize.sm,
            color: COLORS.text.secondary
          }}>Consistency</div>
        </div>
        <div style={{
          backgroundColor: COLORS.background.secondary,
          borderRadius: RADIUS.lg,
          border: `1px solid ${COLORS.border.primary}`,
          padding: SPACING.xl
        }}>
          <div style={{
            fontSize: TYPOGRAPHY.fontSize.xl,
            fontWeight: TYPOGRAPHY.fontWeight.bold,
            color: COLORS.status.error,
            margin: 0
          }}>
            {spacingAnalysis.violations.length}
          </div>
          <div style={{
            fontSize: TYPOGRAPHY.fontSize.sm,
            color: COLORS.text.secondary
          }}>Violations</div>
        </div>
      </div>

      {/* Spacing Scale */}
      <div style={{
        backgroundColor: COLORS.background.secondary,
        borderRadius: RADIUS.lg,
        border: `1px solid ${COLORS.border.primary}`,
        padding: SPACING['5xl']
      }}>
        <h3 style={{
          fontSize: TYPOGRAPHY.fontSize.lg,
          fontWeight: TYPOGRAPHY.fontWeight.semibold,
          color: COLORS.text.heading,
          margin: 0,
          marginBottom: SPACING.xl
        }}>
          Spacing Scale
        </h3>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: SPACING['2xl']
        }}>
          {spacingAnalysis.scale.map((token: any, index: number) => (
            <div key={index} style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: SPACING['2xl'],
              backgroundColor: COLORS.background.tertiary,
              borderRadius: RADIUS.lg
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: SPACING.xl
              }}>
                <div 
                  style={{
                    backgroundColor: 'rgba(52, 152, 219, 0.2)',
                    border: `2px dashed ${COLORS.border.focus}`,
                    width: `${Math.min(token.pixels, 100)}px`,
                    height: '16px'
                  }}
                />
                <div>
                  <div style={{
                    fontWeight: TYPOGRAPHY.fontWeight.medium,
                    color: COLORS.text.primary
                  }}>
                    {token.name}
                  </div>
                  <div style={{
                    fontSize: TYPOGRAPHY.fontSize.sm,
                    color: COLORS.text.secondary
                  }}>
                    {token.pixels}px ({token.rem.toFixed(2)}rem)
                  </div>
                </div>
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: SPACING.lg
              }}>
                <span style={{
                  fontSize: TYPOGRAPHY.fontSize.xs,
                  backgroundColor: COLORS.background.primary,
                  color: COLORS.text.secondary,
                  padding: `${SPACING.xs} ${SPACING.lg}`,
                  borderRadius: RADIUS.sm
                }}>
                  {token.usageCount}x
                </span>
                {token.isValid ? (
                  <CheckCircle style={{
                    width: '16px',
                    height: '16px',
                    color: COLORS.status.success
                  }} />
                ) : (
                  <AlertTriangle style={{
                    width: '16px',
                    height: '16px',
                    color: COLORS.status.error
                  }} />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Violations */}
      {spacingAnalysis.violations.length > 0 && (
        <div style={{
          backgroundColor: COLORS.background.secondary,
          borderRadius: RADIUS.lg,
          border: `1px solid ${COLORS.border.primary}`,
          padding: SPACING['5xl']
        }}>
          <h3 style={{
            fontSize: TYPOGRAPHY.fontSize.lg,
            fontWeight: TYPOGRAPHY.fontWeight.semibold,
            color: COLORS.text.heading,
            margin: 0,
            marginBottom: SPACING.xl
          }}>
            Spacing Issues ({spacingAnalysis.violations.length})
          </h3>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: SPACING['2xl']
          }}>
            {spacingAnalysis.violations.slice(0, 10).map((violation: any, index: number) => (
              <div key={index} style={{
                display: 'flex',
                alignItems: 'flex-start',
                padding: SPACING['2xl'],
                backgroundColor: 'rgba(231, 76, 60, 0.1)',
                borderRadius: RADIUS.lg
              }}>
                <AlertTriangle style={{
                  width: '20px',
                  height: '20px',
                  color: COLORS.status.error,
                  marginRight: SPACING['2xl'],
                  marginTop: '2px',
                  flexShrink: 0
                }} />
                <div style={{
                  flex: 1
                }}>
                  <div style={{
                    color: COLORS.status.error,
                    fontSize: TYPOGRAPHY.fontSize.sm,
                    fontWeight: TYPOGRAPHY.fontWeight.medium
                  }}>
                    Inconsistent {violation.property} spacing
                  </div>
                  <div style={{
                    color: COLORS.status.error,
                    fontSize: TYPOGRAPHY.fontSize.xs,
                    marginTop: SPACING.sm,
                    opacity: 0.8
                  }}>
                    Current: {violation.actual} | Suggested: {violation.suggestion}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}