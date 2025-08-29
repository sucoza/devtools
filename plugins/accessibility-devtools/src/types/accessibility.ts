import type { Result as AxeResult, NodeResult } from 'axe-core';

// Core accessibility types
export type SeverityLevel = 'critical' | 'serious' | 'moderate' | 'minor';
export type ViolationType = 'violation' | 'incomplete' | 'inapplicable' | 'passes';
export type WCAGLevel = 'A' | 'AA' | 'AAA';

// Accessibility issue structure
export interface AccessibilityIssue {
  id: string;
  rule: string;
  impact: SeverityLevel;
  description: string;
  help: string;
  helpUrl: string;
  tags: string[];
  nodes: AccessibilityNode[];
  type: ViolationType;
  timestamp: number;
}

export interface AccessibilityNode {
  html: string;
  target: string[];
  failureSummary?: string;
  xpath?: string;
  ancestry?: string[];
  boundingRect?: DOMRect;
}

// Audit results
export interface AccessibilityAuditResult {
  url: string;
  timestamp: number;
  violations: AccessibilityIssue[];
  incomplete: AccessibilityIssue[];
  passes: AccessibilityIssue[];
  inapplicable: AccessibilityIssue[];
  testEngine: {
    name: string;
    version: string;
  };
  testRunner: {
    name: string;
  };
  testEnvironment: {
    userAgent: string;
    windowWidth: number;
    windowHeight: number;
    orientationAngle?: number;
    orientationType?: string;
  };
}

// Color contrast analysis
export interface ColorContrastResult {
  foregroundColor: string;
  backgroundColor: string;
  contrastRatio: number;
  wcagAA: boolean;
  wcagAAA: boolean;
  largeTextAA: boolean;
  largeTextAAA: boolean;
  element: Element;
  selector: string;
}

// Keyboard navigation
export interface KeyboardNavigationIssue {
  element: Element;
  selector: string;
  issue: 'no-focus' | 'focus-trap' | 'skip-link' | 'tab-order' | 'focus-visible';
  description: string;
  severity: SeverityLevel;
}

// ARIA validation
export interface ARIAValidationIssue {
  element: Element;
  selector: string;
  rule: string;
  message: string;
  severity: SeverityLevel;
  attribute?: string;
  expectedValue?: string;
  actualValue?: string;
}

// Landmark structure
export interface LandmarkInfo {
  role: string;
  label?: string;
  element: Element;
  selector: string;
  level: number;
  children: LandmarkInfo[];
}

// Focus debugging
export interface FocusIssue {
  element: Element;
  selector: string;
  issue: 'invisible-focus' | 'no-focus-indicator' | 'poor-contrast' | 'focus-trap-broken';
  description: string;
  severity: SeverityLevel;
  currentStyle?: CSSStyleDeclaration;
}

// Audit configuration
export interface AccessibilityConfig {
  rules?: Record<string, { enabled: boolean; options?: any }>;
  tags?: string[];
  wcagLevel: WCAGLevel;
  includeExperimental: boolean;
  elementRef?: string;
  ancestry?: boolean;
  xpath?: boolean;
  reporter?: 'v1' | 'v2' | 'raw' | 'raw-env' | 'no-passes';
}

// Scanner options
export interface ScanOptions {
  continuous: boolean;
  debounceMs: number;
  includeColorContrast: boolean;
  includeKeyboardNav: boolean;
  includeARIA: boolean;
  includeFocus: boolean;
  elementSelector?: string;
  config: AccessibilityConfig;
}

// Real-time scan state
export interface ScanState {
  isScanning: boolean;
  isPaused: boolean;
  lastScanTime?: number;
  totalIssues: number;
  criticalIssues: number;
  seriousIssues: number;
  moderateIssues: number;
  minorIssues: number;
  errors?: string[];
}

// Overlay state for visual debugging
export interface OverlayState {
  enabled: boolean;
  showViolations: boolean;
  showLandmarks: boolean;
  showFocusOrder: boolean;
  showColorContrast: boolean;
  highlightElement?: string;
  overlayOpacity: number;
}

// Performance metrics
export interface ScanPerformanceMetrics {
  scanDuration: number;
  rulesRun: number;
  elementsScanned: number;
  memoryUsage?: number;
  timestamp: number;
}