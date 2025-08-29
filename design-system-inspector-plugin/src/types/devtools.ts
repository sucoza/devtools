import type { DesignSystemState, DesignSystemAction } from './design-system';

/**
 * DevTools Integration Types
 */

// Event types for TanStack DevTools integration
export interface DesignSystemEvents {
  'design-system:state': DesignSystemState;
  'design-system:action': DesignSystemAction;
  'design-system:component-detected': {
    component: import('./design-system').ComponentUsage;
    timestamp: number;
  };
  'design-system:token-used': {
    token: import('./design-system').DesignToken;
    element: HTMLElement;
    timestamp: number;
  };
  'design-system:issue-detected': {
    issue: import('./design-system').ConsistencyIssue;
    timestamp: number;
  };
}

// DevTools client configuration
export interface DesignSystemDevToolsConfig {
  enableRealTimeAnalysis: boolean;
  analysisInterval: number;
  maxComponentHistory: number;
  maxIssueHistory: number;
  debugMode: boolean;
}

// Initial state for the design system inspector
export const initialDesignSystemState: DesignSystemState = {
  tokens: [],
  componentUsage: [],
  consistencyIssues: [],
  colorPalette: {
    primary: [],
    secondary: [],
    neutral: [],
    semantic: [],
    custom: [],
  },
  colorUsage: {
    totalColors: 0,
    tokenizedColors: 0,
    customColors: 0,
    accessibilityIssues: 0,
    mostUsedColors: [],
  },
  typographyScale: {
    scales: [],
    violations: [],
    coverage: 0,
  },
  spacingAnalysis: {
    scale: [],
    violations: [],
    consistency: 0,
  },
  isAnalysisEnabled: true,
  isRealTimeMode: false,
  analysisDepth: 'medium',
  includeThirdParty: false,
  ui: {
    activeTab: 'dashboard',
    showOnlyIssues: false,
    searchQuery: '',
    filters: {
      severity: ['error', 'warning', 'info'],
      issueTypes: [],
      tokenTypes: [],
    },
  },
  stats: {
    totalComponents: 0,
    totalTokens: 0,
    totalIssues: 0,
    tokensUtilization: 0,
    consistencyScore: 100,
    accessibilityScore: 100,
    lastAnalysis: 0,
    analysisTime: 0,
  },
};

// Store subscription callback type
export type StateChangeCallback = (state: DesignSystemState) => void;

// DevTools store interface
export interface DesignSystemDevToolsStore {
  getSnapshot(): DesignSystemState;
  subscribe(callback: StateChangeCallback): () => void;
  dispatch(action: DesignSystemAction): void;
  startAnalysis(options?: Partial<import('./design-system').AnalysisOptions>): Promise<void>;
  stopAnalysis(): void;
  enableRealTime(): void;
  disableRealTime(): void;
}

// Observer patterns for different analysis types
export interface ComponentObserver {
  observe(): void;
  disconnect(): void;
  onComponentMount(callback: (component: import('./design-system').ComponentUsage) => void): void;
  onComponentUnmount(callback: (componentId: string) => void): void;
}

export interface TokenObserver {
  observe(): void;
  disconnect(): void;
  onTokenUsage(callback: (token: import('./design-system').DesignToken, element: HTMLElement) => void): void;
}

export interface ConsistencyObserver {
  observe(): void;
  disconnect(): void;
  onIssueDetected(callback: (issue: import('./design-system').ConsistencyIssue) => void): void;
}

// Analysis result type is defined in design-system.ts