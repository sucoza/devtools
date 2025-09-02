import React, { useState, useEffect, useCallback } from 'react';
import { clsx } from 'clsx';
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
      border: 3px solid #f59e0b;
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
        outline: 2px solid #f59e0b !important;
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
        return <Eye className="w-4 h-4 text-red-500" />;
      case 'no-focus-indicator':
        return <Target className="w-4 h-4 text-red-500" />;
      case 'poor-contrast':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'focus-trap-broken':
        return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getIssueColor = (severity: FocusIssue['severity']) => {
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

  const stats = {
    total: focusIssues.length,
    serious: focusIssues.filter(i => i.severity === 'serious').length,
    moderate: focusIssues.filter(i => i.severity === 'moderate').length,
    currentFocused: currentFocusedElement?.tagName.toLowerCase() || 'none',
  };

  return (
    <div className={clsx('flex flex-col h-full', className)}>
      {/* Header */}
      <div className="p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Focus className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Focus Debugger
            </h2>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsDebugging(!isDebugging)}
              className={clsx(
                'flex items-center gap-2 px-3 py-2 text-sm rounded transition-colors',
                isDebugging
                  ? 'bg-red-500 text-white hover:bg-red-600'
                  : 'bg-green-500 text-white hover:bg-green-600'
              )}
            >
              {isDebugging ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              {isDebugging ? 'Stop Debugging' : 'Start Debugging'}
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.total}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Issues Found</div>
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
            <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
              {stats.currentFocused}
            </div>
            <div className="text-sm text-blue-700 dark:text-blue-300">Focused</div>
          </div>
        </div>

        {/* Current Focus Info */}
        {isDebugging && currentFocusedElement && (
          <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <h4 className="text-sm font-medium text-amber-800 dark:text-amber-300 mb-2">
              Currently Focused Element
            </h4>
            <div className="space-y-1">
              <p className="text-sm text-amber-700 dark:text-amber-400">
                <strong>Tag:</strong> {currentFocusedElement.tagName.toLowerCase()}
              </p>
              {currentFocusedElement.id && (
                <p className="text-sm text-amber-700 dark:text-amber-400">
                  <strong>ID:</strong> {currentFocusedElement.id}
                </p>
              )}
              <code className="text-xs text-amber-800 dark:text-amber-200 bg-amber-100 dark:bg-amber-900/40 px-1 rounded block">
                {generateSelector(currentFocusedElement)}
              </code>
            </div>
          </div>
        )}
      </div>

      {/* Settings */}
      <div className="p-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 mb-2">
          <Settings className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Settings</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <input
              type="checkbox"
              checked={settings.highlightFocusRings}
              onChange={(e) => setSettings(s => ({ ...s, highlightFocusRings: e.target.checked }))}
              className="rounded"
            />
            Highlight Focus Rings
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <input
              type="checkbox"
              checked={settings.trackFocusHistory}
              onChange={(e) => setSettings(s => ({ ...s, trackFocusHistory: e.target.checked }))}
              className="rounded"
            />
            Track Focus History
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <input
              type="checkbox"
              checked={settings.detectInvisibleFocus}
              onChange={(e) => setSettings(s => ({ ...s, detectInvisibleFocus: e.target.checked }))}
              className="rounded"
            />
            Detect Invisible Focus
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <input
              type="checkbox"
              checked={settings.detectPoorContrast}
              onChange={(e) => setSettings(s => ({ ...s, detectPoorContrast: e.target.checked }))}
              className="rounded"
            />
            Detect Poor Contrast
          </label>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Focus Issues */}
        <div className="w-1/2 border-r border-gray-200 dark:border-gray-700 overflow-auto">
          <div className="p-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-medium text-gray-900 dark:text-white">Focus Issues</h3>
          </div>

          {focusIssues.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
              <div className="text-center">
                <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
                <p className="font-medium">No Focus Issues</p>
                <p className="text-sm">Focus management looks good!</p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {focusIssues.map((issue, index) => (
                <div
                  key={index}
                  className={clsx(
                    'p-4 border-l-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors',
                    getIssueColor(issue.severity)
                  )}
                  onClick={() => highlightElement(issue.element)}
                >
                  <div className="flex items-start gap-3">
                    {getIssueIcon(issue.issue)}
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                        {issue.description}
                      </h4>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        Issue: {issue.issue} • Severity: {issue.severity}
                      </p>
                      <code className="text-xs text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 px-1 rounded mt-2 block">
                        {issue.selector}
                      </code>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        highlightElement(issue.element);
                      }}
                      className="text-amber-500 hover:text-amber-700 dark:hover:text-amber-400 transition-colors"
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

        {/* Focus History */}
        <div className="w-1/2 overflow-auto">
          <div className="p-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-medium text-gray-900 dark:text-white">Focus History</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {focusHistory.length} focus events tracked
            </p>
          </div>

          {focusHistory.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
              <div className="text-center">
                <Focus className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                <p className="font-medium">No Focus History</p>
                <p className="text-sm">Start debugging to track focus events</p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {focusHistory.slice().reverse().map((entry, index) => (
                <div
                  key={index}
                  className="p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  onClick={() => highlightElement(entry.element)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {entry.element.tagName.toLowerCase()}
                        {entry.element.id && (
                          <span className="text-blue-600 dark:text-blue-400">#{entry.element.id}</span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(entry.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        highlightElement(entry.element);
                      }}
                      className="text-amber-500 hover:text-amber-700 dark:hover:text-amber-400 transition-colors"
                      title="Focus element"
                    >
                      <Target className="w-3 h-3" />
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