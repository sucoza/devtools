import React, { useState, useEffect, useCallback } from 'react';
import { clsx } from 'clsx';
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
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'serious':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'moderate':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'minor':
        return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  const getSeverityColor = (severity: ARIAValidationIssue['severity']) => {
    switch (severity) {
      case 'critical':
        return 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20';
      case 'serious':
        return 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20';
      case 'moderate':
        return 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20';
      case 'minor':
        return 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20';
    }
  };

  return (
    <div className={clsx('flex flex-col h-full', className)}>
      {/* Header */}
      <div className="p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-purple-500" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              ARIA Validator
            </h2>
          </div>
          
          <button
            onClick={runAnalysis}
            disabled={isAnalyzing}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <RotateCw className={clsx('w-4 h-4', isAnalyzing && 'animate-spin')} />
            {isAnalyzing ? 'Validating...' : 'Validate'}
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.total}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total</div>
          </div>
          <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {stats.critical}
            </div>
            <div className="text-sm text-red-700 dark:text-red-300">Critical</div>
          </div>
          <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {stats.serious}
            </div>
            <div className="text-sm text-red-700 dark:text-red-300">Serious</div>
          </div>
          <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
              {stats.moderate}
            </div>
            <div className="text-sm text-yellow-700 dark:text-yellow-300">Moderate</div>
          </div>
          <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {stats.minor}
            </div>
            <div className="text-sm text-blue-700 dark:text-blue-300">Minor</div>
          </div>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="p-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Filter by severity:
            </label>
            <select
              value={filterBy}
              onChange={(e) => setFilterBy(e.target.value as typeof filterBy)}
              className="text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">All Issues</option>
              <option value="critical">Critical Only</option>
              <option value="serious">Serious Only</option>
              <option value="moderate">Moderate Only</option>
              <option value="minor">Minor Only</option>
            </select>
          </div>

          <div className="text-sm text-gray-600 dark:text-gray-400">
            {filteredIssues.length} of {issues.length} issues
          </div>
        </div>
      </div>

      {/* Issues List */}
      <div className="flex-1 overflow-auto">
        {isAnalyzing ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <RotateCw className="w-8 h-8 mx-auto mb-2 animate-spin text-purple-500" />
              <p className="text-gray-600 dark:text-gray-400">Validating ARIA attributes...</p>
            </div>
          </div>
        ) : filteredIssues.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
            <div className="text-center">
              {issues.length === 0 ? (
                <>
                  <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
                  <p className="text-lg font-medium mb-2">No ARIA Issues Found</p>
                  <p className="text-sm">Great job! Your ARIA usage looks good.</p>
                </>
              ) : (
                <>
                  <Shield className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                  <p className="text-lg font-medium mb-2">No Issues Match Filter</p>
                  <p className="text-sm">Try adjusting your filter settings.</p>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredIssues.map((issue, index) => (
              <div
                key={index}
                className={clsx(
                  'p-4 border-l-4',
                  getSeverityColor(issue.severity)
                )}
              >
                <div className="flex items-start gap-3">
                  {getSeverityIcon(issue.severity)}
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                      {issue.message}
                    </h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      Rule: {issue.rule} • Attribute: {issue.attribute}
                    </p>
                    {issue.actualValue && (
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        Current value: <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">{issue.actualValue}</code>
                        {issue.expectedValue && (
                          <> • Expected: <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">{issue.expectedValue}</code></>
                        )}
                      </p>
                    )}
                    <code className="text-xs text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 px-1 rounded mt-2 block">
                      {issue.selector}
                    </code>
                  </div>
                  <button
                    onClick={() => highlightElement(issue.element)}
                    className="text-blue-500 hover:text-blue-700 dark:hover:text-blue-400 transition-colors"
                    title="Highlight element"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}