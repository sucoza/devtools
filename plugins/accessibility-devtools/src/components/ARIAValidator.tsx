import React, { useState, useEffect, useCallback } from 'react';
import { COLORS, COMPONENT_STYLES, SPACING, TYPOGRAPHY, RADIUS, mergeStyles, ScrollableContainer, Badge, EmptyState } from '@sucoza/shared-components';

import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Eye, 
  RotateCw,
  Info
} from 'lucide-react';
import type { ARIAValidationIssue } from '../types';

export interface ARIAValidatorProps {
  className?: string;
}

/**
 * Component for validating ARIA attributes and roles
 */
export function ARIAValidator({ className }: ARIAValidatorProps) {
  const [issues, setIssues] = useState<ARIAValidationIssue[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [filterBy, setFilterBy] = useState<'all' | 'critical' | 'serious' | 'moderate' | 'minor'>('all');

  const validateARIA = useCallback(async (): Promise<ARIAValidationIssue[]> => {
    const issues: ARIAValidationIssue[] = [];
    
    // Get all elements with ARIA attributes or roles
    const elementsWithAria = document.querySelectorAll('[role], [aria-label], [aria-labelledby], [aria-describedby], [aria-expanded], [aria-checked], [aria-selected], [aria-hidden], [aria-live], [aria-atomic], [aria-relevant], [aria-busy], [aria-controls], [aria-owns], [aria-flowto], [aria-activedescendant], [aria-current], [aria-details], [aria-errormessage], [aria-haspopup], [aria-invalid], [aria-keyshortcuts], [aria-orientation], [aria-placeholder], [aria-pressed], [aria-readonly], [aria-required], [aria-roledescription], [aria-sort], [aria-valuemax], [aria-valuemin], [aria-valuenow], [aria-valuetext]');

    const validRoles = new Set([
      'alert', 'alertdialog', 'application', 'article', 'banner', 'button', 'cell', 'checkbox',
      'columnheader', 'combobox', 'complementary', 'contentinfo', 'definition', 'dialog',
      'directory', 'document', 'feed', 'figure', 'form', 'grid', 'gridcell', 'group',
      'heading', 'img', 'link', 'list', 'listbox', 'listitem', 'log', 'main', 'marquee',
      'math', 'menu', 'menubar', 'menuitem', 'menuitemcheckbox', 'menuitemradio', 'navigation',
      'none', 'note', 'option', 'presentation', 'progressbar', 'radio', 'radiogroup',
      'region', 'row', 'rowgroup', 'rowheader', 'scrollbar', 'search', 'searchbox',
      'separator', 'slider', 'spinbutton', 'status', 'switch', 'tab', 'table', 'tablist',
      'tabpanel', 'term', 'textbox', 'timer', 'toolbar', 'tooltip', 'tree', 'treegrid',
      'treeitem'
    ]);

    elementsWithAria.forEach((element) => {
      const selector = generateSelector(element);
      
      // Validate role attribute
      const role = element.getAttribute('role');
      if (role) {
        const roles = role.split(' ');
        roles.forEach(r => {
          if (!validRoles.has(r.toLowerCase())) {
            issues.push({
              element,
              selector,
              rule: 'invalid-role',
              message: `Invalid ARIA role: "${r}"`,
              severity: 'serious',
              attribute: 'role',
              actualValue: r,
            });
          }
        });

        // Check for redundant roles
        if (isRedundantRole(element, role)) {
          issues.push({
            element,
            selector,
            rule: 'redundant-role',
            message: `Redundant ARIA role: "${role}" is implicit for this element`,
            severity: 'minor',
            attribute: 'role',
            actualValue: role,
          });
        }
      }

      // Validate aria-labelledby references
      const labelledby = element.getAttribute('aria-labelledby');
      if (labelledby) {
        const ids = labelledby.split(/\s+/);
        ids.forEach(id => {
          if (id && !document.getElementById(id)) {
            issues.push({
              element,
              selector,
              rule: 'invalid-aria-labelledby',
              message: `aria-labelledby references non-existent element: "${id}"`,
              severity: 'serious',
              attribute: 'aria-labelledby',
              actualValue: id,
            });
          }
        });
      }

      // Validate aria-describedby references
      const describedby = element.getAttribute('aria-describedby');
      if (describedby) {
        const ids = describedby.split(/\s+/);
        ids.forEach(id => {
          if (id && !document.getElementById(id)) {
            issues.push({
              element,
              selector,
              rule: 'invalid-aria-describedby',
              message: `aria-describedby references non-existent element: "${id}"`,
              severity: 'serious',
              attribute: 'aria-describedby',
              actualValue: id,
            });
          }
        });
      }

      // Validate aria-controls references
      const controls = element.getAttribute('aria-controls');
      if (controls) {
        const ids = controls.split(/\s+/);
        ids.forEach(id => {
          if (id && !document.getElementById(id)) {
            issues.push({
              element,
              selector,
              rule: 'invalid-aria-controls',
              message: `aria-controls references non-existent element: "${id}"`,
              severity: 'moderate',
              attribute: 'aria-controls',
              actualValue: id,
            });
          }
        });
      }

      // Validate boolean attributes
      const booleanAttributes = ['aria-expanded', 'aria-checked', 'aria-selected', 'aria-hidden', 'aria-atomic', 'aria-busy', 'aria-pressed', 'aria-readonly', 'aria-required'];
      booleanAttributes.forEach(attr => {
        const value = element.getAttribute(attr);
        if (value !== null && !['true', 'false'].includes(value.toLowerCase())) {
          issues.push({
            element,
            selector,
            rule: 'invalid-boolean-value',
            message: `${attr} must be "true" or "false", got "${value}"`,
            severity: 'moderate',
            attribute: attr,
            actualValue: value,
            expectedValue: 'true or false',
          });
        }
      });

      // Validate aria-current values
      const ariaCurrent = element.getAttribute('aria-current');
      if (ariaCurrent !== null) {
        const validCurrentValues = ['page', 'step', 'location', 'date', 'time', 'true', 'false'];
        if (!validCurrentValues.includes(ariaCurrent.toLowerCase())) {
          issues.push({
            element,
            selector,
            rule: 'invalid-aria-current',
            message: `Invalid aria-current value: "${ariaCurrent}"`,
            severity: 'moderate',
            attribute: 'aria-current',
            actualValue: ariaCurrent,
            expectedValue: validCurrentValues.join(', '),
          });
        }
      }

      // Validate aria-haspopup values
      const hasPopup = element.getAttribute('aria-haspopup');
      if (hasPopup !== null) {
        const validPopupValues = ['false', 'true', 'menu', 'listbox', 'tree', 'grid', 'dialog'];
        if (!validPopupValues.includes(hasPopup.toLowerCase())) {
          issues.push({
            element,
            selector,
            rule: 'invalid-aria-haspopup',
            message: `Invalid aria-haspopup value: "${hasPopup}"`,
            severity: 'moderate',
            attribute: 'aria-haspopup',
            actualValue: hasPopup,
            expectedValue: validPopupValues.join(', '),
          });
        }
      }

      // Validate aria-invalid values
      const invalid = element.getAttribute('aria-invalid');
      if (invalid !== null) {
        const validInvalidValues = ['false', 'true', 'grammar', 'spelling'];
        if (!validInvalidValues.includes(invalid.toLowerCase())) {
          issues.push({
            element,
            selector,
            rule: 'invalid-aria-invalid',
            message: `Invalid aria-invalid value: "${invalid}"`,
            severity: 'moderate',
            attribute: 'aria-invalid',
            actualValue: invalid,
            expectedValue: validInvalidValues.join(', '),
          });
        }
      }

      // Check for missing accessible names
      if (requiresAccessibleName(element) && !hasAccessibleName(element)) {
        issues.push({
          element,
          selector,
          rule: 'missing-accessible-name',
          message: 'Element requires an accessible name',
          severity: 'critical',
          attribute: 'aria-label',
        });
      }

      // Check for aria-hidden on focusable elements
      const ariaHidden = element.getAttribute('aria-hidden');
      if (ariaHidden === 'true' && isFocusable(element)) {
        issues.push({
          element,
          selector,
          rule: 'aria-hidden-focusable',
          message: 'Focusable element should not have aria-hidden="true"',
          severity: 'serious',
          attribute: 'aria-hidden',
          actualValue: 'true',
        });
      }
    });

    // Check for missing landmark roles
    const landmarks = document.querySelectorAll('main, nav, aside, header, footer, section, article');
    if (landmarks.length === 0) {
      issues.push({
        element: document.body,
        selector: 'body',
        rule: 'missing-landmarks',
        message: 'Page should have landmark roles for better navigation',
        severity: 'moderate',
        attribute: 'role',
      });
    }

    return issues;
  }, []);

  const runAnalysis = useCallback(async () => {
    setIsAnalyzing(true);
    try {
      const detectedIssues = await validateARIA();
      setIssues(detectedIssues);
    } catch (error) {
      console.error('ARIA validation failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [validateARIA]);

  useEffect(() => {
    runAnalysis();
  }, [runAnalysis]);

  const isRedundantRole = (element: Element, role: string): boolean => {
    const tagName = element.tagName.toLowerCase();
    const implicitRoles: Record<string, string> = {
      'button': 'button',
      'a': element.hasAttribute('href') ? 'link' : '',
      'input[type="button"]': 'button',
      'input[type="submit"]': 'button',
      'input[type="reset"]': 'button',
      'input[type="checkbox"]': 'checkbox',
      'input[type="radio"]': 'radio',
      'select': 'combobox',
      'textarea': 'textbox',
      'h1': 'heading',
      'h2': 'heading',
      'h3': 'heading',
      'h4': 'heading',
      'h5': 'heading',
      'h6': 'heading',
      'main': 'main',
      'nav': 'navigation',
      'aside': 'complementary',
      'article': 'article',
      'section': 'region',
      'header': 'banner',
      'footer': 'contentinfo',
    };

    const inputType = element.getAttribute('type');
    const key = inputType ? `${tagName}[type="${inputType}"]` : tagName;
    
    return implicitRoles[key] === role;
  };

  const requiresAccessibleName = (element: Element): boolean => {
    const role = element.getAttribute('role');
    const tagName = element.tagName.toLowerCase();
    
    const requiresName = [
      'button', 'link', 'menuitem', 'tab', 'option', 'checkbox', 'radio',
      'textbox', 'searchbox', 'combobox', 'slider', 'spinbutton'
    ];
    
    return requiresName.includes(role || '') || 
           ['button', 'a', 'input', 'select', 'textarea'].includes(tagName);
  };

  const hasAccessibleName = (element: Element): boolean => {
    // Check for aria-label
    if (element.getAttribute('aria-label')) return true;
    
    // Check for aria-labelledby
    const labelledby = element.getAttribute('aria-labelledby');
    if (labelledby) {
      const ids = labelledby.split(/\s+/);
      return ids.some(id => document.getElementById(id)?.textContent?.trim());
    }
    
    // Check for associated label
    if (element.tagName.toLowerCase() === 'input') {
      const id = element.getAttribute('id');
      if (id) {
        const label = document.querySelector(`label[for="${id}"]`);
        if (label?.textContent?.trim()) return true;
      }
      
      const parentLabel = element.closest('label');
      if (parentLabel?.textContent?.trim()) return true;
    }
    
    // Check for text content
    if (element.textContent?.trim()) return true;
    
    // Check for alt text on images
    if (element.tagName.toLowerCase() === 'img' && element.getAttribute('alt')) return true;
    
    // Check for title attribute (not recommended but valid)
    if (element.getAttribute('title')) return true;
    
    return false;
  };

  const isFocusable = (element: Element): boolean => {
    const tabIndex = element.getAttribute('tabindex');
    if (tabIndex && parseInt(tabIndex) >= 0) return true;
    
    const focusableElements = ['a', 'button', 'input', 'select', 'textarea'];
    const tagName = element.tagName.toLowerCase();
    
    if (focusableElements.includes(tagName)) {
      return !element.hasAttribute('disabled');
    }
    
    return false;
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
    
    // Add temporary highlight
    if (element instanceof HTMLElement) {
      element.style.outline = '3px solid #ef4444';
      element.style.outlineOffset = '2px';
      
      setTimeout(() => {
        element.style.outline = '';
        element.style.outlineOffset = '';
      }, 2000);
    }
  };

  const filteredIssues = issues.filter(issue => {
    if (filterBy === 'all') return true;
    return issue.severity === filterBy;
  });

  const stats = {
    total: issues.length,
    critical: issues.filter(i => i.severity === 'critical').length,
    serious: issues.filter(i => i.severity === 'serious').length,
    moderate: issues.filter(i => i.severity === 'moderate').length,
    minor: issues.filter(i => i.severity === 'minor').length,
  };

  const getSeverityIcon = (severity: ARIAValidationIssue['severity']) => {
    switch (severity) {
      case 'critical':
        return <XCircle style={{ width: '16px', height: '16px', color: COLORS.severity.critical }} />;
      case 'serious':
        return <AlertTriangle style={{ width: '16px', height: '16px', color: COLORS.status.error }} />;
      case 'moderate':
        return <AlertTriangle style={{ width: '16px', height: '16px', color: COLORS.severity.moderate }} />;
      case 'minor':
        return <Info style={{ width: '16px', height: '16px', color: COLORS.severity.minor }} />;
    }
  };

  const getSeverityColor = (severity: ARIAValidationIssue['severity']) => {
    switch (severity) {
      case 'critical':
        return COLORS.severity.critical;
      case 'serious':
        return COLORS.status.error;
      case 'moderate':
        return COLORS.severity.moderate;
      case 'minor':
        return COLORS.severity.minor;
    }
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
            <Shield style={{ width: '20px', height: '20px', color: COLORS.severity.moderate }} />
            <h2 style={COMPONENT_STYLES.header.title}>
              ARIA Validator
            </h2>
          </div>
          
          <button
            onClick={runAnalysis}
            disabled={isAnalyzing}
            style={mergeStyles(
              COMPONENT_STYLES.button.base,
              { backgroundColor: COLORS.severity.moderate, borderColor: COLORS.severity.moderate, color: '#ffffff' },
              isAnalyzing ? COMPONENT_STYLES.button.disabled : {}
            )}
            onMouseEnter={(e) => !isAnalyzing && Object.assign(e.currentTarget.style, COMPONENT_STYLES.button.hover)}
            onMouseLeave={(e) => !isAnalyzing && Object.assign(e.currentTarget.style, { backgroundColor: COLORS.severity.moderate })}
          >
            <RotateCw style={{
              width: '16px',
              height: '16px',
              animation: isAnalyzing ? 'spin 1s linear infinite' : 'none'
            }} />
            {isAnalyzing ? 'Validating...' : 'Validate'}
          </button>
        </div>

        {/* Stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
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
            background: 'rgba(231, 76, 60, 0.1)',
            borderRadius: RADIUS.lg,
            border: `1px solid ${COLORS.severity.critical}`
          }}>
            <div style={{
              fontSize: TYPOGRAPHY.fontSize.xl,
              fontWeight: TYPOGRAPHY.fontWeight.bold,
              color: COLORS.severity.critical
            }}>
              {stats.critical}
            </div>
            <div style={{
              fontSize: TYPOGRAPHY.fontSize.sm,
              color: COLORS.severity.critical
            }}>Critical</div>
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
            border: `1px solid ${COLORS.severity.moderate}`
          }}>
            <div style={{
              fontSize: TYPOGRAPHY.fontSize.xl,
              fontWeight: TYPOGRAPHY.fontWeight.bold,
              color: COLORS.severity.moderate
            }}>
              {stats.moderate}
            </div>
            <div style={{
              fontSize: TYPOGRAPHY.fontSize.sm,
              color: COLORS.severity.moderate
            }}>Moderate</div>
          </div>
          <div style={{
            textAlign: 'center',
            padding: SPACING['2xl'],
            background: 'rgba(52, 152, 219, 0.1)',
            borderRadius: RADIUS.lg,
            border: `1px solid ${COLORS.severity.minor}`
          }}>
            <div style={{
              fontSize: TYPOGRAPHY.fontSize.xl,
              fontWeight: TYPOGRAPHY.fontWeight.bold,
              color: COLORS.severity.minor
            }}>
              {stats.minor}
            </div>
            <div style={{
              fontSize: TYPOGRAPHY.fontSize.sm,
              color: COLORS.severity.minor
            }}>Minor</div>
          </div>
        </div>
      </div>

      {/* Filter Controls */}
      <div style={{
        padding: SPACING['2xl'],
        background: COLORS.background.secondary,
        borderBottom: `1px solid ${COLORS.border.primary}`
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.lg }}>
            <label style={{
              fontSize: TYPOGRAPHY.fontSize.base,
              fontWeight: TYPOGRAPHY.fontWeight.medium,
              color: COLORS.text.secondary
            }}>
              Filter by severity:
            </label>
            <select
              value={filterBy}
              onChange={(e) => setFilterBy(e.target.value as typeof filterBy)}
              style={COMPONENT_STYLES.input.base}
            >
              <option value="all">All Issues</option>
              <option value="critical">Critical Only</option>
              <option value="serious">Serious Only</option>
              <option value="moderate">Moderate Only</option>
              <option value="minor">Minor Only</option>
            </select>
          </div>

          <div style={{
            fontSize: TYPOGRAPHY.fontSize.base,
            color: COLORS.text.secondary
          }}>
            {filteredIssues.length} of {issues.length} issues
          </div>
        </div>
      </div>

      {/* Issues List */}
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
                color: COLORS.severity.moderate
              }} />
              <p style={{
                color: COLORS.text.secondary,
                fontSize: TYPOGRAPHY.fontSize.base
              }}>Validating ARIA attributes...</p>
            </div>
          </div>
        ) : filteredIssues.length === 0 ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: COLORS.text.muted
          }}>
            <div style={{ textAlign: 'center' }}>
              {issues.length === 0 ? (
                <>
                  <CheckCircle style={{
                    width: '48px',
                    height: '48px',
                    margin: `0 auto ${SPACING['4xl']}`,
                    color: COLORS.status.success
                  }} />
                  <p style={{
                    fontSize: TYPOGRAPHY.fontSize.lg,
                    fontWeight: TYPOGRAPHY.fontWeight.medium,
                    marginBottom: SPACING.lg,
                    color: COLORS.text.primary
                  }}>No ARIA Issues Found</p>
                  <p style={{
                    fontSize: TYPOGRAPHY.fontSize.base,
                    color: COLORS.text.secondary
                  }}>Great job! Your ARIA usage looks good.</p>
                </>
              ) : (
                <>
                  <Shield style={{
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
                  }}>No Issues Match Filter</p>
                  <p style={{
                    fontSize: TYPOGRAPHY.fontSize.base,
                    color: COLORS.text.secondary
                  }}>Try adjusting your filter settings.</p>
                </>
              )}
            </div>
          </div>
        ) : (
          <div>
            {filteredIssues.map((issue, index) => (
              <div
                key={index}
                style={{
                  padding: SPACING['4xl'],
                  borderBottom: `1px solid ${COLORS.border.primary}`,
                  borderLeft: `4px solid ${getSeverityColor(issue.severity)}`
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: SPACING['2xl'] }}>
                  {getSeverityIcon(issue.severity)}
                  <div style={{ flex: 1 }}>
                    <h4 style={{
                      fontWeight: TYPOGRAPHY.fontWeight.medium,
                      color: COLORS.text.primary,
                      fontSize: TYPOGRAPHY.fontSize.base,
                      marginBottom: SPACING.xs
                    }}>
                      {issue.message}
                    </h4>
                    <p style={{
                      fontSize: TYPOGRAPHY.fontSize.sm,
                      color: COLORS.text.secondary,
                      marginBottom: SPACING.xs
                    }}>
                      Rule: {issue.rule} • Attribute: {issue.attribute}
                    </p>
                    {issue.actualValue && (
                      <p style={{
                        fontSize: TYPOGRAPHY.fontSize.sm,
                        color: COLORS.text.secondary,
                        marginBottom: SPACING.xs
                      }}>
                        Current value: <code style={{
                          background: COLORS.background.tertiary,
                          padding: `${SPACING.xs} ${SPACING.sm}`,
                          borderRadius: RADIUS.sm,
                          fontFamily: TYPOGRAPHY.fontFamily.mono
                        }}>{issue.actualValue}</code>
                        {issue.expectedValue && (
                          <> • Expected: <code style={{
                            background: COLORS.background.tertiary,
                            padding: `${SPACING.xs} ${SPACING.sm}`,
                            borderRadius: RADIUS.sm,
                            fontFamily: TYPOGRAPHY.fontFamily.mono
                          }}>{issue.expectedValue}</code></>
                        )}
                      </p>
                    )}
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
                    onClick={() => highlightElement(issue.element)}
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
            ))}
          </div>
        )}
      </ScrollableContainer>
    </div>
  );
}