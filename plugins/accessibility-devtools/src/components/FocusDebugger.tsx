import React, { useState, useEffect, useCallback } from 'react';
import { COLORS, COMPONENT_STYLES, SPACING, TYPOGRAPHY, RADIUS, mergeStyles, ScrollableContainer, Badge } from '@sucoza/shared-components';

import { 
  Focus, 
  Eye, 
  Play, 
  Square,
  Target,
  AlertTriangle,
  CheckCircle,
  Settings
} from 'lucide-react';
import type { FocusIssue } from '../types';

export interface FocusDebuggerProps {
  className?: string;
}

/**
 * Component for debugging focus management and focus indicators
 */
export function FocusDebugger({ className }: FocusDebuggerProps) {
  const [focusIssues, setFocusIssues] = useState<FocusIssue[]>([]);
  const [isDebugging, setIsDebugging] = useState(false);
  const [currentFocusedElement, setCurrentFocusedElement] = useState<Element | null>(null);
  const [focusHistory, setFocusHistory] = useState<{element: Element, timestamp: number}[]>([]);
  const [_currentFocusChain, setCurrentFocusChain] = useState<Element[]>([]);
  const [settings, setSettings] = useState({
    highlightFocusRings: true,
    trackFocusHistory: true,
    detectInvisibleFocus: true,
    detectPoorContrast: true,
  });

  const startFocusDebugging = useCallback(() => {
    analyzeFocusIssues();
    attachFocusListeners();
    if (settings.highlightFocusRings) {
      injectFocusStyles();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.highlightFocusRings]);

  const stopFocusDebugging = useCallback(() => {
    detachFocusListeners();
    removeFocusStyles();
    setCurrentFocusChain([]);
    setFocusHistory([]);
    removeHighlights();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isDebugging) {
      startFocusDebugging();
    } else {
      stopFocusDebugging();
    }

    return () => stopFocusDebugging();
  }, [isDebugging, startFocusDebugging, stopFocusDebugging]);

  const analyzeFocusIssues = () => {
    const issues: FocusIssue[] = [];
    const focusableElements = document.querySelectorAll(
      'a, button, input, select, textarea, [tabindex], [contenteditable="true"]'
    );

    focusableElements.forEach(element => {
      const selector = generateSelector(element);
      const computed = window.getComputedStyle(element);
      
      // Check for invisible focus indicators
      if (settings.detectInvisibleFocus) {
        const focusStyles = getFocusStyles(element);
        if (hasInvisibleFocus(element, focusStyles)) {
          issues.push({
            element,
            selector,
            issue: 'invisible-focus',
            description: 'Element has no visible focus indicator',
            severity: 'serious',
            currentStyle: computed,
          });
        }
      }

      // Check for poor contrast focus indicators
      if (settings.detectPoorContrast) {
        const focusStyles = getFocusStyles(element);
        if (hasPoorContrastFocus(element, focusStyles)) {
          issues.push({
            element,
            selector,
            issue: 'poor-contrast',
            description: 'Focus indicator has poor contrast',
            severity: 'moderate',
            currentStyle: computed,
          });
        }
      }

      // Check if element is visually hidden but focusable
      if (computed.display === 'none' || computed.visibility === 'hidden' ||
          computed.opacity === '0' || computed.width === '0px' || computed.height === '0px') {
        const tabIndex = element.getAttribute('tabindex');
        if (!tabIndex || parseInt(tabIndex) >= 0) {
          issues.push({
            element,
            selector,
            issue: 'focus-trap-broken',
            description: 'Hidden element is still focusable',
            severity: 'moderate',
            currentStyle: computed,
          });
        }
      }

      // Check for missing focus indicators on custom elements
      if (element.getAttribute('tabindex') === '0' && !hasNativeFocusStyles(element)) {
        const focusStyles = getFocusStyles(element);
        if (!hasFocusIndicator(focusStyles)) {
          issues.push({
            element,
            selector,
            issue: 'no-focus-indicator',
            description: 'Custom focusable element lacks focus indicator',
            severity: 'serious',
            currentStyle: computed,
          });
        }
      }
    });

    setFocusIssues(issues);
  };

  const getFocusStyles = (element: Element): CSSStyleDeclaration => {
    // We can't directly get :focus styles, so we simulate by focusing
    // In a real implementation, we might use different techniques
    const clone = element.cloneNode(true) as Element;
    clone.className += ' __focus-debug-focus';
    
    // Add temporary styles to get focus appearance
    const style = document.createElement('style');
    style.textContent = '.__focus-debug-focus:focus { visibility: visible !important; }';
    document.head.appendChild(style);
    
    const computed = window.getComputedStyle(clone, ':focus');
    document.head.removeChild(style);
    
    return computed;
  };

  const hasInvisibleFocus = (element: Element, focusStyles: CSSStyleDeclaration): boolean => {
    const normalStyles = window.getComputedStyle(element);
    
    // Check if focus styles are the same as normal styles
    return (
      focusStyles.outline === normalStyles.outline &&
      focusStyles.outlineColor === normalStyles.outlineColor &&
      focusStyles.outlineWidth === normalStyles.outlineWidth &&
      focusStyles.boxShadow === normalStyles.boxShadow &&
      focusStyles.backgroundColor === normalStyles.backgroundColor &&
      focusStyles.borderColor === normalStyles.borderColor
    );
  };

  const hasPoorContrastFocus = (element: Element, focusStyles: CSSStyleDeclaration): boolean => {
    // This would need a proper contrast calculation
    // For demo purposes, we'll check for common poor contrast patterns
    const outline = focusStyles.outline;
    const outlineColor = focusStyles.outlineColor;
    
    return outline === 'none' || 
           outlineColor === 'transparent' ||
           outlineColor === focusStyles.backgroundColor;
  };

  const hasNativeFocusStyles = (element: Element): boolean => {
    const nativeFocusableElements = ['input', 'button', 'select', 'textarea', 'a'];
    return nativeFocusableElements.includes(element.tagName.toLowerCase());
  };

  const hasFocusIndicator = (focusStyles: CSSStyleDeclaration): boolean => {
    return focusStyles.outline !== 'none' ||
           focusStyles.boxShadow !== 'none' ||
           focusStyles.borderColor !== focusStyles.backgroundColor;
  };

  const attachFocusListeners = () => {
    document.addEventListener('focusin', handleFocusIn);
    document.addEventListener('focusout', handleFocusOut);
  };

  const detachFocusListeners = () => {
    document.removeEventListener('focusin', handleFocusIn);
    document.removeEventListener('focusout', handleFocusOut);
  };

  const handleFocusIn = (event: FocusEvent) => {
    const element = event.target as Element;
    setCurrentFocusedElement(element);
    
    if (settings.trackFocusHistory) {
      setFocusHistory(prev => [
        ...prev.slice(-19), // Keep last 20 items
        { element, timestamp: Date.now() }
      ]);
    }
    
    highlightFocusedElement(element);
  };

  const handleFocusOut = (_event: FocusEvent) => {
    removeHighlights();
  };

  const highlightFocusedElement = (element: Element) => {
    removeHighlights();
    
    if (!settings.highlightFocusRings) return;
    
    const rect = element.getBoundingClientRect();
    const highlight = document.createElement('div');
    highlight.className = 'focus-debug-highlight';
    highlight.style.cssText = `
      position: fixed;
      top: ${rect.top - 3}px;
      left: ${rect.left - 3}px;
      width: ${rect.width + 6}px;
      height: ${rect.height + 6}px;
      border: 3px solid var(--dt-status-warning);
      background: rgba(245, 158, 11, 0.1);
      pointer-events: none;
      z-index: 10000;
      border-radius: 4px;
      animation: focusDebugPulse 2s infinite;
    `;
    
    document.body.appendChild(highlight);
  };

  const removeHighlights = () => {
    document.querySelectorAll('.focus-debug-highlight').forEach(el => el.remove());
  };

  const injectFocusStyles = () => {
    const style = document.createElement('style');
    style.id = 'focus-debug-styles';
    style.textContent = `
      @keyframes focusDebugPulse {
        0%, 100% { opacity: 0.3; }
        50% { opacity: 0.7; }
      }
      
      *:focus {
        outline: 2px solid var(--dt-status-warning) !important;
        outline-offset: 2px !important;
      }
    `;
    document.head.appendChild(style);
  };

  const removeFocusStyles = () => {
    const style = document.getElementById('focus-debug-styles');
    if (style) style.remove();
  };

  const generateSelector = (element: Element): string => {
    if (element.id) return `#${element.id}`;
    
    if (element.className) {
      const classes = element.className.trim().split(/\s+/).slice(0, 2);
      return `.${classes.join('.')}`;
    }
    
    const tagName = element.tagName.toLowerCase();
    const parent = element.parentElement;
    if (!parent) return tagName;
    
    const siblings = Array.from(parent.children).filter(el => el.tagName === element.tagName);
    if (siblings.length > 1) {
      const index = siblings.indexOf(element) + 1;
      return `${tagName}:nth-child(${index})`;
    }
    
    return tagName;
  };

  const highlightElement = (element: Element) => {
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    // Focus the element if possible
    if (element instanceof HTMLElement) {
      element.focus();
    }
  };

  const getIssueIcon = (issue: FocusIssue['issue']) => {
    switch (issue) {
      case 'invisible-focus':
        return <Eye style={{ width: '16px', height: '16px', color: COLORS.status.error }} />;
      case 'no-focus-indicator':
        return <Target style={{ width: '16px', height: '16px', color: COLORS.status.error }} />;
      case 'poor-contrast':
        return <AlertTriangle style={{ width: '16px', height: '16px', color: COLORS.status.warning }} />;
      case 'focus-trap-broken':
        return <AlertTriangle style={{ width: '16px', height: '16px', color: "var(--dt-status-warning)" }} />;
      default:
        return <AlertTriangle style={{ width: '16px', height: '16px', color: COLORS.text.muted }} />;
    }
  };

  const getIssueColor = (severity: FocusIssue['severity']) => {
    switch (severity) {
      case 'critical':
        return COLORS.status.error;
      case 'serious':
        return COLORS.status.error;
      case 'moderate':
        return COLORS.status.warning;
      case 'minor':
        return COLORS.status.info;
    }
  };

  const stats = {
    total: focusIssues.length,
    serious: focusIssues.filter(i => i.severity === 'serious').length,
    moderate: focusIssues.filter(i => i.severity === 'moderate').length,
    currentFocused: currentFocusedElement?.tagName.toLowerCase() || 'none',
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
            <Focus style={{ width: '20px', height: '20px', color: "var(--dt-status-warning)" }} />
            <h2 style={COMPONENT_STYLES.header.title}>
              Focus Debugger
            </h2>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.lg }}>
            <button
              onClick={() => setIsDebugging(!isDebugging)}
              style={mergeStyles(
                COMPONENT_STYLES.button.base,
                isDebugging
                  ? COMPONENT_STYLES.button.danger
                  : COMPONENT_STYLES.button.success
              )}
              onMouseEnter={(e) => Object.assign(e.currentTarget.style, COMPONENT_STYLES.button.hover)}
              onMouseLeave={(e) => Object.assign(e.currentTarget.style, isDebugging ? COMPONENT_STYLES.button.danger : COMPONENT_STYLES.button.success)}
            >
              {isDebugging ? <Square style={{ width: '16px', height: '16px' }} /> : <Play style={{ width: '16px', height: '16px' }} />}
              {isDebugging ? 'Stop Debugging' : 'Start Debugging'}
            </button>
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
            }}>Issues Found</div>
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
              {stats.serious}
            </div>
            <div style={{
              fontSize: TYPOGRAPHY.fontSize.sm,
              color: COLORS.status.error
            }}>Serious</div>
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
              {stats.moderate}
            </div>
            <div style={{
              fontSize: TYPOGRAPHY.fontSize.sm,
              color: COLORS.status.warning
            }}>Moderate</div>
          </div>
          <div style={{
            textAlign: 'center',
            padding: SPACING['2xl'],
            background: 'rgba(52, 152, 219, 0.1)',
            borderRadius: RADIUS.lg,
            border: `1px solid ${COLORS.status.info}`
          }}>
            <div style={{
              fontSize: TYPOGRAPHY.fontSize.lg,
              fontWeight: TYPOGRAPHY.fontWeight.bold,
              color: COLORS.status.info
            }}>
              {stats.currentFocused}
            </div>
            <div style={{
              fontSize: TYPOGRAPHY.fontSize.sm,
              color: COLORS.status.info
            }}>Focused</div>
          </div>
        </div>

        {/* Current Focus Info */}
        {isDebugging && currentFocusedElement && (
          <div style={{
            marginTop: SPACING['4xl'],
            padding: SPACING['2xl'],
            backgroundColor: 'rgba(245, 158, 11, 0.1)',
            border: "1px solid var(--dt-border-primary)",
            borderRadius: RADIUS.lg
          }}>
            <h4 style={{
              fontSize: TYPOGRAPHY.fontSize.base,
              fontWeight: TYPOGRAPHY.fontWeight.medium,
              color: "var(--dt-status-warning)",
              marginBottom: SPACING.lg
            }}>
              Currently Focused Element
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING.xs }}>
              <p style={{
                fontSize: TYPOGRAPHY.fontSize.base,
                color: "var(--dt-status-warning)"
              }}>
                <strong>Tag:</strong> {currentFocusedElement.tagName.toLowerCase()}
              </p>
              {currentFocusedElement.id && (
                <p style={{
                  fontSize: TYPOGRAPHY.fontSize.base,
                  color: "var(--dt-status-warning)"
                }}>
                  <strong>ID:</strong> {currentFocusedElement.id}
                </p>
              )}
              <code style={{
                fontSize: TYPOGRAPHY.fontSize.sm,
                color: "var(--dt-status-warning)",
                backgroundColor: 'rgba(245, 158, 11, 0.2)',
                padding: `${SPACING.xs} ${SPACING.sm}`,
                borderRadius: RADIUS.sm,
                display: 'block',
                fontFamily: TYPOGRAPHY.fontFamily.mono
              }}>
                {generateSelector(currentFocusedElement)}
              </code>
            </div>
          </div>
        )}
      </div>

      {/* Settings */}
      <div style={{
        padding: SPACING['2xl'],
        background: COLORS.background.secondary,
        borderBottom: `1px solid ${COLORS.border.primary}`
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: SPACING.lg,
          marginBottom: SPACING.lg
        }}>
          <Settings style={{
            width: '16px',
            height: '16px',
            color: COLORS.text.secondary
          }} />
          <span style={{
            fontSize: TYPOGRAPHY.fontSize.base,
            fontWeight: TYPOGRAPHY.fontWeight.medium,
            color: COLORS.text.secondary
          }}>Settings</span>
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: SPACING['2xl']
        }}>
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: SPACING.lg,
            fontSize: TYPOGRAPHY.fontSize.base,
            color: COLORS.text.secondary,
            cursor: 'pointer'
          }}>
            <input
              type="checkbox"
              checked={settings.highlightFocusRings}
              onChange={(e) => setSettings(s => ({ ...s, highlightFocusRings: e.target.checked }))}
              style={{
                borderRadius: RADIUS.sm,
                cursor: 'pointer'
              }}
            />
            Highlight Focus Rings
          </label>
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: SPACING.lg,
            fontSize: TYPOGRAPHY.fontSize.base,
            color: COLORS.text.secondary,
            cursor: 'pointer'
          }}>
            <input
              type="checkbox"
              checked={settings.trackFocusHistory}
              onChange={(e) => setSettings(s => ({ ...s, trackFocusHistory: e.target.checked }))}
              style={{
                borderRadius: RADIUS.sm,
                cursor: 'pointer'
              }}
            />
            Track Focus History
          </label>
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: SPACING.lg,
            fontSize: TYPOGRAPHY.fontSize.base,
            color: COLORS.text.secondary,
            cursor: 'pointer'
          }}>
            <input
              type="checkbox"
              checked={settings.detectInvisibleFocus}
              onChange={(e) => setSettings(s => ({ ...s, detectInvisibleFocus: e.target.checked }))}
              style={{
                borderRadius: RADIUS.sm,
                cursor: 'pointer'
              }}
            />
            Detect Invisible Focus
          </label>
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: SPACING.lg,
            fontSize: TYPOGRAPHY.fontSize.base,
            color: COLORS.text.secondary,
            cursor: 'pointer'
          }}>
            <input
              type="checkbox"
              checked={settings.detectPoorContrast}
              onChange={(e) => setSettings(s => ({ ...s, detectPoorContrast: e.target.checked }))}
              style={{
                borderRadius: RADIUS.sm,
                cursor: 'pointer'
              }}
            />
            Detect Poor Contrast
          </label>
        </div>
      </div>

      <div style={{
        flex: 1,
        display: 'flex',
        overflow: 'hidden'
      }}>
        {/* Focus Issues */}
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
              margin: 0
            }}>Focus Issues</h3>
          </div>

          {focusIssues.length === 0 ? (
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
                }}>No Focus Issues</p>
                <p style={{
                  fontSize: TYPOGRAPHY.fontSize.base,
                  color: COLORS.text.secondary
                }}>Focus management looks good!</p>
              </div>
            </div>
          ) : (
            <div>
              {focusIssues.map((issue, index) => (
                <div
                  key={index}
                  style={{
                    padding: SPACING['4xl'],
                    borderLeft: `4px solid ${getIssueColor(issue.severity)}`,
                    borderBottom: `1px solid ${COLORS.border.primary}`,
                    cursor: 'pointer',
                    transition: 'background-color 0.15s ease'
                  }}
                  onClick={() => highlightElement(issue.element)}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = COLORS.background.hover}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: SPACING['2xl'] }}>
                    {getIssueIcon(issue.issue)}
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
                        Issue: {issue.issue} • Severity: {issue.severity}
                      </p>
                      <code style={{
                        fontSize: TYPOGRAPHY.fontSize.sm,
                        color: COLORS.text.primary,
                        background: COLORS.background.tertiary,
                        padding: `${SPACING.xs} ${SPACING.sm}`,
                        borderRadius: RADIUS.sm,
                        marginTop: SPACING.lg,
                        display: 'block',
                        fontFamily: TYPOGRAPHY.fontFamily.mono
                      }}>
                        {issue.selector}
                      </code>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        highlightElement(issue.element);
                      }}
                      style={{
                        color: "var(--dt-status-warning)",
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        padding: SPACING.sm,
                        borderRadius: RADIUS.md,
                        transition: 'color 0.15s ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.color = COLORS.text.accent}
                      onMouseLeave={(e) => e.currentTarget.style.color = "var(--dt-status-warning)"}
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

        {/* Focus History */}
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
            }}>Focus History</h3>
            <p style={{
              fontSize: TYPOGRAPHY.fontSize.base,
              color: COLORS.text.secondary,
              margin: 0
            }}>
              {focusHistory.length} focus events tracked
            </p>
          </div>

          {focusHistory.length === 0 ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: COLORS.text.muted
            }}>
              <div style={{ textAlign: 'center' }}>
                <Focus style={{
                  width: '48px',
                  height: '48px',
                  margin: `0 auto ${SPACING['4xl']}`,
                  color: COLORS.text.muted
                }} />
                <p style={{
                  fontWeight: TYPOGRAPHY.fontWeight.medium,
                  color: COLORS.text.primary,
                  marginBottom: SPACING.lg
                }}>No Focus History</p>
                <p style={{
                  fontSize: TYPOGRAPHY.fontSize.base,
                  color: COLORS.text.secondary
                }}>Start debugging to track focus events</p>
              </div>
            </div>
          ) : (
            <div>
              {focusHistory.slice().reverse().map((entry, index) => (
                <div
                  key={index}
                  style={{
                    padding: SPACING['2xl'],
                    cursor: 'pointer',
                    borderBottom: `1px solid ${COLORS.border.primary}`,
                    transition: 'background-color 0.15s ease'
                  }}
                  onClick={() => highlightElement(entry.element)}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = COLORS.background.hover}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <div>
                      <div style={{
                        fontSize: TYPOGRAPHY.fontSize.base,
                        fontWeight: TYPOGRAPHY.fontWeight.medium,
                        color: COLORS.text.primary,
                        marginBottom: SPACING.xs
                      }}>
                        {entry.element.tagName.toLowerCase()}
                        {entry.element.id && (
                          <span style={{ color: COLORS.text.accent }}>#{entry.element.id}</span>
                        )}
                      </div>
                      <div style={{
                        fontSize: TYPOGRAPHY.fontSize.sm,
                        color: COLORS.text.muted
                      }}>
                        {new Date(entry.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        highlightElement(entry.element);
                      }}
                      style={{
                        color: "var(--dt-status-warning)",
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        padding: SPACING.sm,
                        borderRadius: RADIUS.md,
                        transition: 'color 0.15s ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.color = COLORS.text.accent}
                      onMouseLeave={(e) => e.currentTarget.style.color = "var(--dt-status-warning)"}
                      title="Focus element"
                    >
                      <Target style={{ width: '12px', height: '12px' }} />
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