import React, { useState, useEffect, useCallback } from 'react';
import { COLORS, COMPONENT_STYLES, SPACING, TYPOGRAPHY, RADIUS, mergeStyles, ScrollableContainer, Badge } from '@sucoza/shared-components';
import { 
  Palette, 
  Eye, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  RotateCw,
  Download
} from 'lucide-react';
import { useAccessibilityDevToolsStore } from '../core/devtools-store';
import { 
  analyzeColorContrast, 
  formatContrastRatio,
  getContrastLevelDescription
} from '../utils/color-utils';
import type { ColorContrastResult } from '../types';

export interface ColorContrastAnalyzerProps {
  className?: string;
}

/**
 * Component for analyzing color contrast compliance
 */
export function ColorContrastAnalyzer({ className: _className }: ColorContrastAnalyzerProps) {
  const store = useAccessibilityDevToolsStore();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [sortBy, setSortBy] = useState<'ratio' | 'compliance'>('ratio');
  const [filterBy, setFilterBy] = useState<'all' | 'fail' | 'pass'>('all');

  const colorContrastResults = store.colorContrastResults;

  const runAnalysis = useCallback(async () => {
    setIsAnalyzing(true);
    try {
      // Run color contrast analysis
      const results = analyzeColorContrast();
      store.dispatch({ type: 'color-contrast/update', payload: results });
    } catch (error) {
      console.error('Color contrast analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [store]);

  // Run analysis on mount
  useEffect(() => {
    if (colorContrastResults.length === 0) {
      runAnalysis();
    }
  }, [colorContrastResults.length, runAnalysis]);

  const filteredResults = colorContrastResults.filter(result => {
    switch (filterBy) {
      case 'fail':
        return !result.wcagAA;
      case 'pass':
        return result.wcagAA;
      default:
        return true;
    }
  });

  const sortedResults = [...filteredResults].sort((a, b) => {
    if (sortBy === 'ratio') {
      return a.contrastRatio - b.contrastRatio;
    } else {
      // Sort by compliance (fails first)
      const aScore = (a.wcagAAA ? 3 : a.wcagAA ? 2 : a.largeTextAA ? 1 : 0);
      const bScore = (b.wcagAAA ? 3 : b.wcagAA ? 2 : b.largeTextAA ? 1 : 0);
      return aScore - bScore;
    }
  });

  const stats = {
    total: colorContrastResults.length,
    passing: colorContrastResults.filter(r => r.wcagAA).length,
    failing: colorContrastResults.filter(r => !r.wcagAA).length,
    aaa: colorContrastResults.filter(r => r.wcagAAA).length,
  };

  const exportResults = () => {
    const data = colorContrastResults.map(result => ({
      selector: result.selector,
      foregroundColor: result.foregroundColor,
      backgroundColor: result.backgroundColor,
      contrastRatio: result.contrastRatio,
      wcagAA: result.wcagAA,
      wcagAAA: result.wcagAAA,
      largeTextAA: result.largeTextAA,
      largeTextAAA: result.largeTextAAA,
    }));

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'color-contrast-analysis.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div style={mergeStyles(COMPONENT_STYLES.container.base)}>
      {/* Header */}
      <div style={mergeStyles(COMPONENT_STYLES.header.base, { borderBottom: `1px solid ${COLORS.border.primary}` })}>
        <div style={mergeStyles(
          { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
          { marginBottom: SPACING['3xl'] }
        )}>
          <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.lg }}>
            <Palette style={{ width: '20px', height: '20px', color: COLORS.status.info }} />
            <h2 style={COMPONENT_STYLES.header.title}>
              Color Contrast Analysis
            </h2>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.lg }}>
            <button
              onClick={runAnalysis}
              disabled={isAnalyzing}
              style={mergeStyles(
                COMPONENT_STYLES.button.base,
                COMPONENT_STYLES.button.primary,
                isAnalyzing ? COMPONENT_STYLES.button.disabled : {}
              )}
              onMouseEnter={(e) => !isAnalyzing && Object.assign(e.currentTarget.style, COMPONENT_STYLES.button.hover)}
              onMouseLeave={(e) => !isAnalyzing && Object.assign(e.currentTarget.style, COMPONENT_STYLES.button.primary)}
            >
              <RotateCw style={{
                width: '16px',
                height: '16px',
                animation: isAnalyzing ? 'spin 1s linear infinite' : 'none'
              }} />
              {isAnalyzing ? 'Analyzing...' : 'Analyze'}
            </button>
            
            {colorContrastResults.length > 0 && (
              <button
                onClick={exportResults}
                style={COMPONENT_STYLES.button.base}
                onMouseEnter={(e) => Object.assign(e.currentTarget.style, COMPONENT_STYLES.button.hover)}
                onMouseLeave={(e) => Object.assign(e.currentTarget.style, COMPONENT_STYLES.button.base)}
              >
                <Download style={{ width: '16px', height: '16px' }} />
                Export
              </button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
          gap: SPACING['3xl']
        }}>
          <div style={{
            textAlign: 'center',
            padding: SPACING['2xl'],
            background: COLORS.background.secondary,
            borderRadius: RADIUS.lg,
            border: `1px solid ${COLORS.border.primary}`
          }}>
            <div style={{
              fontSize: TYPOGRAPHY.fontSize.xl,
              fontWeight: TYPOGRAPHY.fontWeight.bold,
              color: COLORS.text.primary
            }}>
              {stats.total}
            </div>
            <div style={{
              fontSize: TYPOGRAPHY.fontSize.sm,
              color: COLORS.text.secondary
            }}>Total</div>
          </div>
          <div style={{
            textAlign: 'center',
            padding: SPACING['2xl'],
            background: 'rgba(78, 201, 176, 0.1)',
            borderRadius: RADIUS.lg,
            border: `1px solid ${COLORS.status.success}`
          }}>
            <div style={{
              fontSize: TYPOGRAPHY.fontSize.xl,
              fontWeight: TYPOGRAPHY.fontWeight.bold,
              color: COLORS.status.success
            }}>
              {stats.passing}
            </div>
            <div style={{
              fontSize: TYPOGRAPHY.fontSize.sm,
              color: COLORS.status.success
            }}>Passing AA</div>
          </div>
          <div style={{
            textAlign: 'center',
            padding: SPACING['2xl'],
            background: 'rgba(231, 76, 60, 0.1)',
            borderRadius: RADIUS.lg,
            border: `1px solid ${COLORS.status.error}`
          }}>
            <div style={{
              fontSize: TYPOGRAPHY.fontSize.xl,
              fontWeight: TYPOGRAPHY.fontWeight.bold,
              color: COLORS.status.error
            }}>
              {stats.failing}
            </div>
            <div style={{
              fontSize: TYPOGRAPHY.fontSize.sm,
              color: COLORS.status.error
            }}>Failing AA</div>
          </div>
          <div style={{
            textAlign: 'center',
            padding: SPACING['2xl'],
            background: 'rgba(52, 152, 219, 0.1)',
            borderRadius: RADIUS.lg,
            border: `1px solid ${COLORS.status.info}`
          }}>
            <div style={{
              fontSize: TYPOGRAPHY.fontSize.xl,
              fontWeight: TYPOGRAPHY.fontWeight.bold,
              color: COLORS.status.info
            }}>
              {stats.aaa}
            </div>
            <div style={{
              fontSize: TYPOGRAPHY.fontSize.sm,
              color: COLORS.status.info
            }}>AAA Level</div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div style={{
        padding: SPACING['2xl'],
        background: COLORS.background.secondary,
        borderBottom: `1px solid ${COLORS.border.primary}`
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: SPACING['4xl'] }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.lg }}>
              <label style={{
                fontSize: TYPOGRAPHY.fontSize.base,
                fontWeight: TYPOGRAPHY.fontWeight.medium,
                color: COLORS.text.secondary
              }}>
                Filter:
              </label>
              <select
                value={filterBy}
                onChange={(e) => setFilterBy(e.target.value as typeof filterBy)}
                style={COMPONENT_STYLES.input.base}
              >
                <option value="all">All Results</option>
                <option value="fail">Failing Only</option>
                <option value="pass">Passing Only</option>
              </select>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.lg }}>
              <label style={{
                fontSize: TYPOGRAPHY.fontSize.base,
                fontWeight: TYPOGRAPHY.fontWeight.medium,
                color: COLORS.text.secondary
              }}>
                Sort by:
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                style={COMPONENT_STYLES.input.base}
              >
                <option value="ratio">Contrast Ratio</option>
                <option value="compliance">Compliance Level</option>
              </select>
            </div>
          </div>

          <div style={{
            fontSize: TYPOGRAPHY.fontSize.base,
            color: COLORS.text.secondary
          }}>
            {filteredResults.length} of {colorContrastResults.length} results
          </div>
        </div>
      </div>

      {/* Results */}
      <ScrollableContainer>
        {isAnalyzing ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%'
          }}>
            <div style={{ textAlign: 'center' }}>
              <RotateCw style={{
                width: '32px',
                height: '32px',
                margin: `0 auto ${SPACING.lg}`,
                animation: 'spin 1s linear infinite',
                color: COLORS.status.info
              }} />
              <p style={{
                color: COLORS.text.secondary,
                fontSize: TYPOGRAPHY.fontSize.base
              }}>Analyzing color contrast...</p>
            </div>
          </div>
        ) : sortedResults.length === 0 ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: COLORS.text.muted
          }}>
            <div style={{ textAlign: 'center' }}>
              <Palette style={{
                width: '48px',
                height: '48px',
                margin: `0 auto ${SPACING['4xl']}`,
                color: COLORS.text.muted
              }} />
              <p style={{
                fontSize: TYPOGRAPHY.fontSize.lg,
                fontWeight: TYPOGRAPHY.fontWeight.medium,
                marginBottom: SPACING.lg,
                color: COLORS.text.primary
              }}>
                {colorContrastResults.length === 0 ? 'No Analysis Results' : 'No Results Match Filter'}
              </p>
              <p style={{
                fontSize: TYPOGRAPHY.fontSize.base,
                color: COLORS.text.secondary
              }}>
                {colorContrastResults.length === 0 
                  ? 'Click "Analyze" to check color contrast compliance'
                  : 'Try adjusting your filter settings'
                }
              </p>
            </div>
          </div>
        ) : (
          <div>
            {sortedResults.map((result, index) => (
              <ContrastResultItem
                key={`${result.selector}-${index}`}
                result={result}
                onHighlight={() => {
                  // Would implement element highlighting
                  // TODO: Implement element highlighting
                }}
              />
            ))}
          </div>
        )}
      </ScrollableContainer>
    </div>
  );
}

interface ContrastResultItemProps {
  result: ColorContrastResult;
  onHighlight: () => void;
}

function ContrastResultItem({ result, onHighlight }: ContrastResultItemProps) {
  const getComplianceIcon = () => {
    if (result.wcagAAA) {
      return <CheckCircle style={{ width: '20px', height: '20px', color: COLORS.status.success }} />;
    } else if (result.wcagAA) {
      return <CheckCircle style={{ width: '20px', height: '20px', color: COLORS.status.warning }} />;
    } else if (result.largeTextAA) {
      return <AlertTriangle style={{ width: '20px', height: '20px', color: "var(--dt-status-warning)" }} />;
    } else {
      return <XCircle style={{ width: '20px', height: '20px', color: COLORS.status.error }} />;
    }
  };

  const getComplianceText = () => {
    if (result.wcagAAA) return 'AAA';
    if (result.wcagAA) return 'AA';
    if (result.largeTextAA) return 'Large Text AA';
    return 'Fail';
  };

  const getComplianceStyle = () => {
    if (result.wcagAAA) return COMPONENT_STYLES.tag.success;
    if (result.wcagAA) return COMPONENT_STYLES.tag.warning;
    if (result.largeTextAA) return { ...COMPONENT_STYLES.tag.base, backgroundColor: "var(--dt-status-warning-bg)", color: "var(--dt-status-warning)" };
    return COMPONENT_STYLES.tag.error;
  };

  return (
    <div style={{
      padding: SPACING['4xl'],
      borderBottom: `1px solid ${COLORS.border.primary}`,
      transition: 'background-color 0.15s ease'
    }}
    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = COLORS.background.hover}
    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
    >
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: SPACING['4xl']
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: SPACING.lg,
            marginBottom: SPACING.lg
          }}>
            {getComplianceIcon()}
            <Badge style={mergeStyles(COMPONENT_STYLES.tag.base, getComplianceStyle())}>
              {getComplianceText()}
            </Badge>
            <span style={{
              fontSize: TYPOGRAPHY.fontSize.base,
              fontFamily: TYPOGRAPHY.fontFamily.mono,
              color: COLORS.text.secondary
            }}>
              {formatContrastRatio(result.contrastRatio)}
            </span>
            <span style={{
              fontSize: TYPOGRAPHY.fontSize.sm,
              color: COLORS.text.muted
            }}>
              {getContrastLevelDescription(result.contrastRatio)}
            </span>
          </div>
          
          <code style={{
            fontSize: TYPOGRAPHY.fontSize.base,
            color: COLORS.text.primary,
            wordBreak: 'break-all',
            fontFamily: TYPOGRAPHY.fontFamily.mono
          }}>
            {result.selector}
          </code>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: SPACING['2xl'] }}>
          {/* Color Swatches */}
          <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.lg }}>
            <div style={{
              fontSize: TYPOGRAPHY.fontSize.sm,
              color: COLORS.text.muted
            }}>Colors:</div>
            <div 
              style={{
                width: '24px',
                height: '24px',
                borderRadius: RADIUS.md,
                border: `1px solid ${COLORS.border.primary}`,
                backgroundColor: result.foregroundColor
              }}
              title={`Foreground: ${result.foregroundColor}`}
            />
            <div style={{
              fontSize: TYPOGRAPHY.fontSize.sm,
              color: COLORS.text.muted
            }}>on</div>
            <div 
              style={{
                width: '24px',
                height: '24px',
                borderRadius: RADIUS.md,
                border: `1px solid ${COLORS.border.primary}`,
                backgroundColor: result.backgroundColor
              }}
              title={`Background: ${result.backgroundColor}`}
            />
          </div>

          <button
            onClick={onHighlight}
            style={{
              color: COLORS.status.info,
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: SPACING.sm,
              borderRadius: RADIUS.md,
              transition: 'color 0.15s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = COLORS.text.accent}
            onMouseLeave={(e) => e.currentTarget.style.color = COLORS.status.info}
            title="Highlight element"
          >
            <Eye style={{ width: '16px', height: '16px' }} />
          </button>
        </div>
      </div>

      {/* Compliance Details */}
      <div style={{
        marginTop: SPACING['2xl'],
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))',
        gap: SPACING['2xl'],
        fontSize: TYPOGRAPHY.fontSize.sm
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: SPACING.xs,
          color: result.wcagAA ? COLORS.status.success : COLORS.status.error
        }}>
          {result.wcagAA ? 
            <CheckCircle style={{ width: '12px', height: '12px' }} /> : 
            <XCircle style={{ width: '12px', height: '12px' }} />
          }
          WCAG AA
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: SPACING.xs,
          color: result.wcagAAA ? COLORS.status.success : COLORS.status.error
        }}>
          {result.wcagAAA ? 
            <CheckCircle style={{ width: '12px', height: '12px' }} /> : 
            <XCircle style={{ width: '12px', height: '12px' }} />
          }
          WCAG AAA
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: SPACING.xs,
          color: result.largeTextAA ? COLORS.status.success : COLORS.status.error
        }}>
          {result.largeTextAA ? 
            <CheckCircle style={{ width: '12px', height: '12px' }} /> : 
            <XCircle style={{ width: '12px', height: '12px' }} />
          }
          Large AA
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: SPACING.xs,
          color: result.largeTextAAA ? COLORS.status.success : COLORS.status.error
        }}>
          {result.largeTextAAA ? 
            <CheckCircle style={{ width: '12px', height: '12px' }} /> : 
            <XCircle style={{ width: '12px', height: '12px' }} />
          }
          Large AAA
        </div>
      </div>
    </div>
  );
}