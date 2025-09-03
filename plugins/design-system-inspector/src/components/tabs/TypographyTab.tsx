import React from 'react';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import { COLORS, COMPONENT_STYLES, SPACING, TYPOGRAPHY, RADIUS, mergeStyles } from '@sucoza/shared-components';
import { useDesignSystemInspector } from '../../hooks';

export function TypographyTab() {
  const { state } = useDesignSystemInspector();
  const { typographyScale } = state;

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
          Typography Scale
        </h2>
        <p style={{
          color: COLORS.text.secondary,
          margin: 0
        }}>
          Analyze font sizes, weights, and consistency across your design system.
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
            {typographyScale.scales.length}
          </div>
          <div style={{
            fontSize: TYPOGRAPHY.fontSize.sm,
            color: COLORS.text.secondary
          }}>Typography Tokens</div>
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
            {Math.round(typographyScale.coverage)}%
          </div>
          <div style={{
            fontSize: TYPOGRAPHY.fontSize.sm,
            color: COLORS.text.secondary
          }}>Coverage</div>
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
            {typographyScale.violations.length}
          </div>
          <div style={{
            fontSize: TYPOGRAPHY.fontSize.sm,
            color: COLORS.text.secondary
          }}>Violations</div>
        </div>
      </div>

      {/* Typography Scale */}
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
          Font Scale
        </h3>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: SPACING.xl
        }}>
          {typographyScale.scales.map((token: any, index: number) => (
            <div key={index} style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: SPACING.xl,
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
                    fontSize: token.fontSize,
                    fontWeight: token.fontWeight,
                    fontFamily: token.fontFamily,
                    lineHeight: token.lineHeight,
                    color: COLORS.text.primary
                  }}
                >
                  The quick brown fox
                </div>
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: SPACING['2xl'],
                fontSize: TYPOGRAPHY.fontSize.sm,
                color: COLORS.text.secondary
              }}>
                <span style={{
                  fontFamily: TYPOGRAPHY.fontFamily.mono
                }}>{token.fontSize}</span>
                <span>•</span>
                <span>{token.fontWeight}</span>
                <span>•</span>
                <span>{token.usageCount}x</span>
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
      {typographyScale.violations.length > 0 && (
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
            Typography Issues ({typographyScale.violations.length})
          </h3>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: SPACING['2xl']
          }}>
            {typographyScale.violations.slice(0, 10).map((violation: any, index: number) => (
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
                    {violation.issue}
                  </div>
                  <div style={{
                    color: COLORS.status.error,
                    fontSize: TYPOGRAPHY.fontSize.xs,
                    marginTop: SPACING.sm,
                    opacity: 0.8
                  }}>
                    Expected: {violation.expected} | Actual: {violation.actual}
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