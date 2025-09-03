import React from 'react';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import { COLORS, COMPONENT_STYLES, SPACING, TYPOGRAPHY, RADIUS, mergeStyles } from '@sucoza/shared-components';
import { useDesignSystemInspector } from '../../hooks';
import type { ColorToken } from '../../types';

export function ColorsTab() {
  const { state } = useDesignSystemInspector();
  const { colorPalette, colorUsage } = state;


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
          Color Palette
        </h2>
        <p style={{
          color: COLORS.text.secondary,
          margin: 0
        }}>
          Analyze color usage, accessibility, and consistency across your design system.
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
            {colorUsage.totalColors}
          </div>
          <div style={{
            fontSize: TYPOGRAPHY.fontSize.sm,
            color: COLORS.text.secondary
          }}>Total Colors</div>
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
            {colorUsage.tokenizedColors}
          </div>
          <div style={{
            fontSize: TYPOGRAPHY.fontSize.sm,
            color: COLORS.text.secondary
          }}>Tokenized</div>
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
            color: COLORS.status.warning,
            margin: 0
          }}>
            {colorUsage.customColors}
          </div>
          <div style={{
            fontSize: TYPOGRAPHY.fontSize.sm,
            color: COLORS.text.secondary
          }}>Custom</div>
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
            {colorUsage.accessibilityIssues}
          </div>
          <div style={{
            fontSize: TYPOGRAPHY.fontSize.sm,
            color: COLORS.text.secondary
          }}>A11Y Issues</div>
        </div>
      </div>

      {/* Color Categories */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
        gap: SPACING['5xl']
      }}>
        {Object.entries(colorPalette).map(([category, colors]) => (
          <ColorCategory key={category} title={category} colors={colors} />
        ))}
      </div>

      {/* Most Used Colors */}
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
          Most Used Colors
        </h3>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: SPACING['2xl']
        }}>
          {colorUsage.mostUsedColors.slice(0, 10).map((colorItem: any, index: number) => (
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
                gap: SPACING['2xl']
              }}>
                <div 
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: RADIUS.sm,
                    border: `1px solid ${COLORS.border.primary}`,
                    backgroundColor: colorItem.color
                  }}
                />
                <div>
                  <div style={{
                    fontFamily: TYPOGRAPHY.fontFamily.mono,
                    fontSize: TYPOGRAPHY.fontSize.sm,
                    color: COLORS.text.primary
                  }}>
                    {colorItem.color}
                  </div>
                  {colorItem.isToken && colorItem.tokenName && (
                    <div style={{
                      fontSize: TYPOGRAPHY.fontSize.xs,
                      color: COLORS.text.secondary
                    }}>
                      {colorItem.tokenName}
                    </div>
                  )}
                </div>
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: SPACING.lg
              }}>
                <span style={{
                  fontSize: TYPOGRAPHY.fontSize.sm,
                  color: COLORS.text.secondary
                }}>
                  {colorItem.count} uses
                </span>
                {colorItem.isToken ? (
                  <CheckCircle style={{
                    width: '16px',
                    height: '16px',
                    color: COLORS.status.success
                  }} />
                ) : (
                  <AlertTriangle style={{
                    width: '16px',
                    height: '16px',
                    color: COLORS.status.warning
                  }} />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ColorCategory({ 
  title, 
  colors 
}: { 
  title: string; 
  colors: ColorToken[] 
}) {
  if (colors.length === 0) return null;

  return (
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
        marginBottom: SPACING.xl,
        textTransform: 'capitalize'
      }}>
        {title} Colors ({colors.length})
      </h3>
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr',
        gap: SPACING['2xl']
      }}>
        {colors.slice(0, 8).map((color, index) => (
          <div key={index} style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: SPACING['2xl'],
            borderRadius: RADIUS.lg,
            backgroundColor: COLORS.background.tertiary
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: SPACING['2xl']
            }}>
              <div 
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: RADIUS.sm,
                  border: `1px solid ${COLORS.border.primary}`,
                  backgroundColor: color.value
                }}
              />
              <div>
                <div style={{
                  fontWeight: TYPOGRAPHY.fontWeight.medium,
                  color: COLORS.text.primary
                }}>
                  {color.name}
                </div>
                <div style={{
                  fontFamily: TYPOGRAPHY.fontFamily.mono,
                  fontSize: TYPOGRAPHY.fontSize.sm,
                  color: COLORS.text.secondary
                }}>
                  {color.hex}
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
                {color.usageCount}x
              </span>
              {color.isAccessible ? (
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
        {colors.length > 8 && (
          <div style={{
            textAlign: 'center',
            fontSize: TYPOGRAPHY.fontSize.sm,
            color: COLORS.text.secondary,
            marginTop: SPACING.lg
          }}>
            +{colors.length - 8} more colors
          </div>
        )}
      </div>
    </div>
  );
}