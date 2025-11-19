import React, { useState, useEffect, useCallback } from 'react';
import { COLORS, COMPONENT_STYLES, SPACING, TYPOGRAPHY, RADIUS, mergeStyles, ScrollableContainer, Badge, EmptyState } from '@sucoza/shared-components';

import { 
  Keyboard, 
  Eye, 
  Play, 
  Square,
  SkipForward,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';

export interface KeyboardNavVisualizerProps {
  className?: string;
}

/**
 * Component for visualizing keyboard navigation and focus flow
 */
export function KeyboardNavVisualizer({ className }: KeyboardNavVisualizerProps) {
  const [isVisualizing, setIsVisualizing] = useState(false);
  const [focusableElements, setFocusableElements] = useState<Element[]>([]);
  const [currentFocusIndex, setCurrentFocusIndex] = useState(-1);
  const [issues, setIssues] = useState<{
    element: Element;
    issue: string;
    severity: 'error' | 'warning';
    description: string;
  }[]>([]);

  const analyzeFocusableElements = useCallback(() => {
    // Find all focusable elements
    const focusableSelectors = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]',
      'audio[controls]',
      'video[controls]',
      'details summary'
    ].join(', ');

    const elements = Array.from(document.querySelectorAll(focusableSelectors))
      .filter(el => {
        const computed = window.getComputedStyle(el);
        return computed.display !== 'none' && 
               computed.visibility !== 'hidden' &&
               !el.hasAttribute('hidden');
      });

    setFocusableElements(elements);

    // Analyze for issues
    const detectedIssues: typeof issues = [];

    elements.forEach((element, index) => {
      // Check for missing focus indicators
      const computed = window.getComputedStyle(element);
      const focusStyles = window.getComputedStyle(element, ':focus');
      
      if (focusStyles.outline === 'none' && 
          focusStyles.boxShadow === 'none' && 
          focusStyles.backgroundColor === computed.backgroundColor) {
        detectedIssues.push({
          element,
          issue: 'no-focus-indicator',
          severity: 'error',
          description: 'Element lacks visible focus indicator'
        });
      }

      // Check tabindex values
      const tabIndex = element.getAttribute('tabindex');
      if (tabIndex && parseInt(tabIndex) > 0) {
        detectedIssues.push({
          element,
          issue: 'positive-tabindex',
          severity: 'warning',
          description: 'Positive tabindex disrupts natural tab order'
        });
      }

      // Check for skip links
      if (index === 0 && element.tagName.toLowerCase() !== 'a') {
        detectedIssues.push({
          element,
          issue: 'missing-skip-link',
          severity: 'warning',
          description: 'Consider adding skip links for better navigation'
        });
      }

      // Check for focus traps in modals
      const modal = element.closest('[role="dialog"], [role="alertdialog"], .modal');
      if (modal) {
        const modalFocusableElements = modal.querySelectorAll(focusableSelectors);
        if (modalFocusableElements.length === 0) {
          detectedIssues.push({
            element: modal,
            issue: 'modal-no-focusable',
            severity: 'error',
            description: 'Modal contains no focusable elements'
          });
        }
      }
    });

    setIssues(detectedIssues);
  }, []);

  useEffect(() => {
    if (isVisualizing) {
      analyzeFocusableElements();
      const interval = setInterval(analyzeFocusableElements, 2000);
      return () => clearInterval(interval);
    }
    return undefined;
  }, [isVisualizing, analyzeFocusableElements]);

  const startVisualization = () => {
    setIsVisualizing(true);
    setCurrentFocusIndex(-1);
  };

  const stopVisualization = () => {
    setIsVisualizing(false);
    setCurrentFocusIndex(-1);
    // Remove any focus overlays
    document.querySelectorAll('.keyboard-nav-overlay').forEach(el => el.remove());
  };

  const simulateTabPress = () => {
    if (focusableElements.length === 0) return;
    
    const nextIndex = (currentFocusIndex + 1) % focusableElements.length;
    const element = focusableElements[nextIndex];
    
    if (element && element instanceof HTMLElement) {
      element.focus();
      setCurrentFocusIndex(nextIndex);
      highlightElement(element, nextIndex + 1);
    }
  };

  const highlightElement = (element: Element, order: number) => {
    // Remove previous overlay
    document.querySelectorAll('.keyboard-nav-overlay').forEach(el => el.remove());

    if (!element || !isVisualizing) return;

    const rect = element.getBoundingClientRect();
    const overlay = document.createElement('div');
    overlay.className = 'keyboard-nav-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: ${rect.top - 2}px;
      left: ${rect.left - 2}px;
      width: ${rect.width + 4}px;
      height: ${rect.height + 4}px;
      border: 2px solid var(--dt-border-focus);
      background: rgba(59, 130, 246, 0.1);
      pointer-events: none;
      z-index: 10000;
      border-radius: 4px;
    `;

    // Add order indicator
    const orderIndicator = document.createElement('div');
    orderIndicator.style.cssText = `
      position: absolute;
      top: -10px;
      left: -2px;
      background: var(--dt-border-focus);
      color: white;
      padding: 2px 6px;
      font-size: 12px;
      font-weight: bold;
      border-radius: 4px;
      line-height: 1;
    `;
    orderIndicator.textContent = order.toString();
    overlay.appendChild(orderIndicator);

    document.body.appendChild(overlay);

    // Auto-remove after delay
    setTimeout(() => {
      if (overlay.parentNode) {
        overlay.remove();
      }
    }, 2000);
  };

  const jumpToElement = (index: number) => {
    const element = focusableElements[index];
    if (element && element instanceof HTMLElement) {
      element.focus();
      setCurrentFocusIndex(index);
      highlightElement(element, index + 1);
      
      // Scroll into view
      element.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
    }
  };

  const getIssueIcon = (severity: 'error' | 'warning') => {
    return severity === 'error' 
      ? <XCircle style={{ width: '16px', height: '16px', color: COLORS.status.error }} />
      : <AlertTriangle style={{ width: '16px', height: '16px', color: COLORS.status.warning }} />;
  };

  const getIssueColor = (severity: 'error' | 'warning') => {
    return severity === 'error' ? COLORS.status.error : COLORS.status.warning;
  };

  const stats = {
    total: focusableElements.length,
    errors: issues.filter(i => i.severity === 'error').length,
    warnings: issues.filter(i => i.severity === 'warning').length,
    focusable: focusableElements.filter(el => el.getAttribute('tabindex') !== '-1').length,
  };

  return (
    <div style={mergeStyles(COMPONENT_STYLES.container.base, className ? {} : {})}>
      {/* Header */}
      <div style={mergeStyles(COMPONENT_STYLES.header.base, { borderBottom: `1px solid ${COLORS.border.primary}` })}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: SPACING['3xl']
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.lg }}>
            <Keyboard style={{ width: '20px', height: '20px', color: COLORS.status.success }} />
            <h2 style={COMPONENT_STYLES.header.title}>
              Keyboard Navigation
            </h2>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.lg }}>
            {!isVisualizing ? (
              <button
                onClick={startVisualization}
                style={mergeStyles(
                  COMPONENT_STYLES.button.base,
                  COMPONENT_STYLES.button.success
                )}
                onMouseEnter={(e) => Object.assign(e.currentTarget.style, COMPONENT_STYLES.button.hover)}
                onMouseLeave={(e) => Object.assign(e.currentTarget.style, COMPONENT_STYLES.button.success)}
              >
                <Play style={{ width: '16px', height: '16px' }} />
                Start Visualization
              </button>
            ) : (
              <>
                <button
                  onClick={simulateTabPress}
                  disabled={focusableElements.length === 0}
                  style={mergeStyles(
                    COMPONENT_STYLES.button.base,
                    COMPONENT_STYLES.button.primary,
                    focusableElements.length === 0 ? COMPONENT_STYLES.button.disabled : {}
                  )}
                  onMouseEnter={(e) => focusableElements.length > 0 && Object.assign(e.currentTarget.style, COMPONENT_STYLES.button.hover)}
                  onMouseLeave={(e) => focusableElements.length > 0 && Object.assign(e.currentTarget.style, COMPONENT_STYLES.button.primary)}
                >
                  <SkipForward style={{ width: '16px', height: '16px' }} />
                  Tab ({currentFocusIndex + 1}/{focusableElements.length})
                </button>
                <button
                  onClick={stopVisualization}
                  style={mergeStyles(
                    COMPONENT_STYLES.button.base,
                    COMPONENT_STYLES.button.danger
                  )}
                  onMouseEnter={(e) => Object.assign(e.currentTarget.style, COMPONENT_STYLES.button.hover)}
                  onMouseLeave={(e) => Object.assign(e.currentTarget.style, COMPONENT_STYLES.button.danger)}
                >
                  <Square style={{ width: '16px', height: '16px' }} />
                  Stop
                </button>
              </>
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
            }}>Total Elements</div>
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
              {stats.focusable}
            </div>
            <div style={{
              fontSize: TYPOGRAPHY.fontSize.sm,
              color: COLORS.status.info
            }}>Focusable</div>
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
              {stats.errors}
            </div>
            <div style={{
              fontSize: TYPOGRAPHY.fontSize.sm,
              color: COLORS.status.error
            }}>Errors</div>
          </div>
          <div style={{
            textAlign: 'center',
            padding: SPACING['2xl'],
            background: 'rgba(243, 156, 18, 0.1)',
            borderRadius: RADIUS.lg,
            border: `1px solid ${COLORS.status.warning}`
          }}>
            <div style={{
              fontSize: TYPOGRAPHY.fontSize.xl,
              fontWeight: TYPOGRAPHY.fontWeight.bold,
              color: COLORS.status.warning
            }}>
              {stats.warnings}
            </div>
            <div style={{
              fontSize: TYPOGRAPHY.fontSize.sm,
              color: COLORS.status.warning
            }}>Warnings</div>
          </div>
        </div>
      </div>

      <div style={{
        flex: 1,
        display: 'flex',
        overflow: 'hidden'
      }}>
        {/* Tab Order List */}
        <div style={{
          width: '50%',
          borderRight: `1px solid ${COLORS.border.primary}`,
          overflow: 'auto'
        }}>
          <div style={{
            padding: SPACING['2xl'],
            background: COLORS.background.secondary,
            borderBottom: `1px solid ${COLORS.border.primary}`
          }}>
            <h3 style={{
              fontWeight: TYPOGRAPHY.fontWeight.medium,
              color: COLORS.text.primary,
              margin: 0,
              marginBottom: SPACING.xs
            }}>Tab Order</h3>
            <p style={{
              fontSize: TYPOGRAPHY.fontSize.base,
              color: COLORS.text.secondary,
              margin: 0
            }}>
              Click any element to focus it
            </p>
          </div>

          {focusableElements.length === 0 ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: COLORS.text.muted
            }}>
              <div style={{ textAlign: 'center' }}>
                <Keyboard style={{
                  width: '48px',
                  height: '48px',
                  margin: `0 auto ${SPACING['4xl']}`,
                  color: COLORS.text.muted
                }} />
                <p style={{
                  fontWeight: TYPOGRAPHY.fontWeight.medium,
                  color: COLORS.text.primary,
                  marginBottom: SPACING.lg
                }}>No Focusable Elements</p>
                <p style={{
                  fontSize: TYPOGRAPHY.fontSize.base,
                  color: COLORS.text.secondary
                }}>Start visualization to analyze keyboard navigation</p>
              </div>
            </div>
          ) : (
            <div>
              {focusableElements.map((element, index) => (
                <div
                  key={index}
                  style={{
                    padding: SPACING['2xl'],
                    cursor: 'pointer',
                    transition: 'background-color 0.15s ease',
                    borderBottom: `1px solid ${COLORS.border.primary}`,
                    ...(currentFocusIndex === index ? {
                      background: COLORS.background.selected,
                      borderLeft: `4px solid ${COLORS.border.focus}`
                    } : {})
                  }}
                  onClick={() => jumpToElement(index)}
                  onMouseEnter={(e) => {
                    if (currentFocusIndex !== index) {
                      e.currentTarget.style.backgroundColor = COLORS.background.hover;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (currentFocusIndex !== index) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: SPACING['2xl'] }}>
                    <div style={{
                      flexShrink: 0,
                      width: '24px',
                      height: '24px',
                      background: COLORS.background.tertiary,
                      color: COLORS.text.secondary,
                      borderRadius: RADIUS.md,
                      fontSize: TYPOGRAPHY.fontSize.sm,
                      fontWeight: TYPOGRAPHY.fontWeight.bold,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {index + 1}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: TYPOGRAPHY.fontSize.base,
                        fontWeight: TYPOGRAPHY.fontWeight.medium,
                        color: COLORS.text.primary,
                        marginBottom: SPACING.xs
                      }}>
                        {element.tagName.toLowerCase()}
                        {element.id && <span style={{ color: COLORS.text.accent }}>#{element.id}</span>}
                        {element.className && (
                          <span style={{ color: COLORS.status.success }}>
                            .{element.className.split(' ')[0]}
                          </span>
                        )}
                      </div>
                      <div style={{
                        fontSize: TYPOGRAPHY.fontSize.sm,
                        color: COLORS.text.muted,
                        marginBottom: SPACING.xs
                      }}>
                        {element.getAttribute('aria-label') || 
                         element.textContent?.trim().substring(0, 50) || 
                         'No text content'}
                      </div>
                      {element.getAttribute('tabindex') && (
                        <div style={{
                          fontSize: TYPOGRAPHY.fontSize.sm,
                          color: COLORS.severity.moderate,
                          marginTop: SPACING.xs
                        }}>
                          tabindex: {element.getAttribute('tabindex')}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        highlightElement(element, index + 1);
                      }}
                      style={{
                        color: COLORS.text.muted,
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        padding: SPACING.sm,
                        borderRadius: RADIUS.md,
                        transition: 'color 0.15s ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.color = COLORS.text.secondary}
                      onMouseLeave={(e) => e.currentTarget.style.color = COLORS.text.muted}
                      title="Highlight element"
                    >
                      <Eye style={{ width: '16px', height: '16px' }} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Issues List */}
        <div style={{
          width: '50%',
          overflow: 'auto'
        }}>
          <div style={{
            padding: SPACING['2xl'],
            background: COLORS.background.secondary,
            borderBottom: `1px solid ${COLORS.border.primary}`
          }}>
            <h3 style={{
              fontWeight: TYPOGRAPHY.fontWeight.medium,
              color: COLORS.text.primary,
              margin: 0,
              marginBottom: SPACING.xs
            }}>Keyboard Issues</h3>
            <p style={{
              fontSize: TYPOGRAPHY.fontSize.base,
              color: COLORS.text.secondary,
              margin: 0
            }}>
              {issues.length} issues found
            </p>
          </div>

          {issues.length === 0 ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: COLORS.text.muted
            }}>
              <div style={{ textAlign: 'center' }}>
                <CheckCircle style={{
                  width: '48px',
                  height: '48px',
                  margin: `0 auto ${SPACING['4xl']}`,
                  color: COLORS.status.success
                }} />
                <p style={{
                  fontWeight: TYPOGRAPHY.fontWeight.medium,
                  color: COLORS.text.primary,
                  marginBottom: SPACING.lg
                }}>No Issues Found</p>
                <p style={{
                  fontSize: TYPOGRAPHY.fontSize.base,
                  color: COLORS.text.secondary
                }}>Keyboard navigation looks good!</p>
              </div>
            </div>
          ) : (
            <div>
              {issues.map((issue, index) => (
                <div
                  key={index}
                  style={{
                    padding: SPACING['4xl'],
                    borderBottom: `1px solid ${COLORS.border.primary}`,
                    borderLeft: `4px solid ${issue.severity === 'error' ? COLORS.status.error : COLORS.status.warning}`
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: SPACING['2xl'] }}>
                    {getIssueIcon(issue.severity)}
                    <div style={{ flex: 1 }}>
                      <h4 style={{
                        fontWeight: TYPOGRAPHY.fontWeight.medium,
                        color: COLORS.text.primary,
                        fontSize: TYPOGRAPHY.fontSize.base,
                        marginBottom: SPACING.xs
                      }}>
                        {issue.description}
                      </h4>
                      <p style={{
                        fontSize: TYPOGRAPHY.fontSize.sm,
                        color: COLORS.text.secondary,
                        marginBottom: SPACING.lg
                      }}>
                        Issue: {issue.issue}
                      </p>
                      <code style={{
                        fontSize: TYPOGRAPHY.fontSize.sm,
                        color: COLORS.text.primary,
                        background: COLORS.background.tertiary,
                        padding: `${SPACING.xs} ${SPACING.sm}`,
                        borderRadius: RADIUS.sm,
                        display: 'block',
                        fontFamily: TYPOGRAPHY.fontFamily.mono
                      }}>
                        {issue.element.tagName.toLowerCase()}
                        {issue.element.id && `#${issue.element.id}`}
                        {issue.element.className && `.${issue.element.className.split(' ')[0]}`}
                      </code>
                    </div>
                    <button
                      onClick={() => {
                        const elementIndex = focusableElements.indexOf(issue.element);
                        if (elementIndex >= 0) {
                          jumpToElement(elementIndex);
                        } else {
                          highlightElement(issue.element, 0);
                        }
                      }}
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
                      title="Focus element"
                    >
                      <Eye style={{ width: '16px', height: '16px' }} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}