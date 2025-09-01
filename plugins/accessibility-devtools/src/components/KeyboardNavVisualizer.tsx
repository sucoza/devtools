import React, { useState, useEffect, useCallback } from 'react';
import { clsx } from 'clsx';
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
      border: 2px solid #3b82f6;
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
      background: #3b82f6;
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
      ? <XCircle className="w-4 h-4 text-red-500" />
      : <AlertTriangle className="w-4 h-4 text-yellow-500" />;
  };

  const getIssueColor = (severity: 'error' | 'warning') => {
    return severity === 'error'
      ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20'
      : 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20';
  };

  const stats = {
    total: focusableElements.length,
    errors: issues.filter(i => i.severity === 'error').length,
    warnings: issues.filter(i => i.severity === 'warning').length,
    focusable: focusableElements.filter(el => el.getAttribute('tabindex') !== '-1').length,
  };

  return (
    <div className={clsx('flex flex-col h-full', className)}>
      {/* Header */}
      <div className="p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Keyboard className="w-5 h-5 text-green-500" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Keyboard Navigation
            </h2>
          </div>
          
          <div className="flex items-center gap-2">
            {!isVisualizing ? (
              <button
                onClick={startVisualization}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
              >
                <Play className="w-4 h-4" />
                Start Visualization
              </button>
            ) : (
              <>
                <button
                  onClick={simulateTabPress}
                  disabled={focusableElements.length === 0}
                  className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <SkipForward className="w-4 h-4" />
                  Tab ({currentFocusIndex + 1}/{focusableElements.length})
                </button>
                <button
                  onClick={stopVisualization}
                  className="flex items-center gap-2 px-3 py-2 text-sm bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                >
                  <Square className="w-4 h-4" />
                  Stop
                </button>
              </>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.total}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Elements</div>
          </div>
          <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {stats.focusable}
            </div>
            <div className="text-sm text-blue-700 dark:text-blue-300">Focusable</div>
          </div>
          <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {stats.errors}
            </div>
            <div className="text-sm text-red-700 dark:text-red-300">Errors</div>
          </div>
          <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
              {stats.warnings}
            </div>
            <div className="text-sm text-yellow-700 dark:text-yellow-300">Warnings</div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Tab Order List */}
        <div className="w-1/2 border-r border-gray-200 dark:border-gray-700 overflow-auto">
          <div className="p-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-medium text-gray-900 dark:text-white">Tab Order</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Click any element to focus it
            </p>
          </div>

          {focusableElements.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
              <div className="text-center">
                <Keyboard className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                <p className="font-medium">No Focusable Elements</p>
                <p className="text-sm">Start visualization to analyze keyboard navigation</p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {focusableElements.map((element, index) => (
                <div
                  key={index}
                  className={clsx(
                    'p-3 cursor-pointer transition-colors',
                    currentFocusIndex === index
                      ? 'bg-blue-100 dark:bg-blue-900/30 border-l-4 border-blue-500'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                  )}
                  onClick={() => jumpToElement(index)}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded text-xs font-bold flex items-center justify-center">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {element.tagName.toLowerCase()}
                        {element.id && <span className="text-blue-600 dark:text-blue-400">#{element.id}</span>}
                        {element.className && (
                          <span className="text-green-600 dark:text-green-400">
                            .{element.className.split(' ')[0]}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {element.getAttribute('aria-label') || 
                         element.textContent?.trim().substring(0, 50) || 
                         'No text content'}
                      </div>
                      {element.getAttribute('tabindex') && (
                        <div className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                          tabindex: {element.getAttribute('tabindex')}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        highlightElement(element, index + 1);
                      }}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
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

        {/* Issues List */}
        <div className="w-1/2 overflow-auto">
          <div className="p-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-medium text-gray-900 dark:text-white">Keyboard Issues</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {issues.length} issues found
            </p>
          </div>

          {issues.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
              <div className="text-center">
                <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
                <p className="font-medium">No Issues Found</p>
                <p className="text-sm">Keyboard navigation looks good!</p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {issues.map((issue, index) => (
                <div
                  key={index}
                  className={clsx(
                    'p-4 border-l-4',
                    getIssueColor(issue.severity)
                  )}
                >
                  <div className="flex items-start gap-3">
                    {getIssueIcon(issue.severity)}
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                        {issue.description}
                      </h4>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        Issue: {issue.issue}
                      </p>
                      <code className="text-xs text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 px-1 rounded mt-2 block">
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
                      className="text-blue-500 hover:text-blue-700 dark:hover:text-blue-400 transition-colors"
                      title="Focus element"
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
    </div>
  );
}