/**
 * Design System Inspector Types
 */

// Design Token Types
export interface DesignToken {
  id: string;
  name: string;
  value: string;
  type: DesignTokenType;
  category: string;
  description?: string;
  usageCount: number;
  isValid: boolean;
  violations?: string[];
}

export type DesignTokenType = 'color' | 'spacing' | 'typography' | 'shadow' | 'border' | 'size';

export interface ColorToken extends DesignToken {
  type: 'color';
  hex: string;
  rgb: string;
  hsl: string;
  contrastRatio?: number;
  isAccessible?: boolean;
}

export interface TypographyToken extends DesignToken {
  type: 'typography';
  fontSize: string;
  fontWeight: string;
  lineHeight: string;
  fontFamily: string;
  letterSpacing?: string;
}

export interface SpacingToken extends DesignToken {
  type: 'spacing';
  pixels: number;
  rem: number;
  scale?: number;
}

// Component Usage Types
export interface ComponentUsage {
  id: string;
  name: string;
  displayName: string;
  filePath: string;
  usageCount: number;
  props: PropUsage[];
  variants: ComponentVariant[];
  firstSeen: number;
  lastSeen: number;
}

export interface PropUsage {
  name: string;
  type: string;
  usageCount: number;
  values: PropValueUsage[];
  isRequired: boolean;
}

export interface PropValueUsage {
  value: string;
  count: number;
  percentage: number;
}

export interface ComponentVariant {
  props: Record<string, any>;
  count: number;
  percentage: number;
}

// Consistency Analysis Types
export interface ConsistencyIssue {
  id: string;
  type: ConsistencyIssueType;
  severity: 'error' | 'warning' | 'info';
  title: string;
  description: string;
  element?: HTMLElement;
  selector?: string;
  recommendation?: string;
  fixable?: boolean;
  occurrences: ConsistencyOccurrence[];
}

export type ConsistencyIssueType = 
  | 'inconsistent-spacing'
  | 'inconsistent-colors'
  | 'inconsistent-typography'
  | 'missing-design-tokens'
  | 'deprecated-values'
  | 'accessibility-violation'
  | 'typography-violation'
  | 'spacing-violation';

export interface ConsistencyOccurrence {
  element: HTMLElement;
  computedStyle: CSSStyleDeclaration;
  expectedValue?: string;
  actualValue: string;
  selector: string;
}

// Color Analysis Types
export interface ColorPalette {
  primary: ColorToken[];
  secondary: ColorToken[];
  neutral: ColorToken[];
  semantic: ColorToken[];
  custom: ColorToken[];
}

export interface ColorUsageStats {
  totalColors: number;
  tokenizedColors: number;
  customColors: number;
  accessibilityIssues: number;
  mostUsedColors: ColorUsageItem[];
}

export interface ColorUsageItem {
  color: string;
  count: number;
  elements: HTMLElement[];
  isToken: boolean;
  tokenName?: string;
}

// Typography Analysis Types
export interface TypographyScale {
  scales: TypographyToken[];
  violations: TypographyViolation[];
  coverage: number;
}

export interface TypographyViolation {
  element: HTMLElement;
  computedStyle: CSSStyleDeclaration;
  issue: 'non-scale-font-size' | 'inconsistent-line-height' | 'missing-font-weight';
  expected?: string;
  actual: string;
}

// Spacing Analysis Types
export interface SpacingAnalysis {
  scale: SpacingToken[];
  violations: SpacingViolation[];
  consistency: number;
}

export interface SpacingViolation {
  element: HTMLElement;
  property: 'margin' | 'padding' | 'gap';
  direction?: 'top' | 'right' | 'bottom' | 'left';
  expected?: string;
  actual: string;
  suggestion: string;
}

// DevTools State Types
export interface DesignSystemState {
  // Analysis Results
  tokens: DesignToken[];
  componentUsage: ComponentUsage[];
  consistencyIssues: ConsistencyIssue[];
  colorPalette: ColorPalette;
  colorUsage: ColorUsageStats;
  typographyScale: TypographyScale;
  spacingAnalysis: SpacingAnalysis;
  
  // Settings
  isAnalysisEnabled: boolean;
  isRealTimeMode: boolean;
  analysisDepth: 'shallow' | 'medium' | 'deep';
  includeThirdParty: boolean;
  
  // UI State
  ui: {
    activeTab: 'dashboard' | 'components' | 'tokens' | 'colors' | 'typography' | 'spacing' | 'issues';
    selectedComponent?: string;
    selectedToken?: string;
    selectedIssue?: string;
    showOnlyIssues: boolean;
    searchQuery: string;
    filters: {
      severity: ('error' | 'warning' | 'info')[];
      issueTypes: ConsistencyIssueType[];
      tokenTypes: DesignTokenType[];
    };
  };
  
  // Stats
  stats: DesignSystemStats;
}

export interface DesignSystemStats {
  totalComponents: number;
  totalTokens: number;
  totalIssues: number;
  tokensUtilization: number;
  consistencyScore: number;
  accessibilityScore: number;
  lastAnalysis: number;
  analysisTime: number;
}

// Action Types
export type DesignSystemAction =
  | { type: 'analysis/start' }
  | { type: 'analysis/complete'; payload: Partial<DesignSystemState> }
  | { type: 'analysis/error'; payload: string }
  | { type: 'analysis/toggle' }
  | { type: 'realtime/toggle' }
  | { type: 'settings/update'; payload: Partial<Pick<DesignSystemState, 'analysisDepth' | 'includeThirdParty'>> }
  | { type: 'component/track'; payload: ComponentUsage }
  | { type: 'token/add'; payload: DesignToken }
  | { type: 'token/update'; payload: { id: string; updates: Partial<DesignToken> } }
  | { type: 'issue/add'; payload: ConsistencyIssue }
  | { type: 'issue/resolve'; payload: string }
  | { type: 'ui/tab/select'; payload: DesignSystemState['ui']['activeTab'] }
  | { type: 'ui/component/select'; payload: string | undefined }
  | { type: 'ui/token/select'; payload: string | undefined }
  | { type: 'ui/issue/select'; payload: string | undefined }
  | { type: 'ui/search'; payload: string }
  | { type: 'ui/filter/severity'; payload: ('error' | 'warning' | 'info')[] }
  | { type: 'ui/filter/issueTypes'; payload: ConsistencyIssueType[] }
  | { type: 'ui/filter/tokenTypes'; payload: DesignTokenType[] }
  | { type: 'ui/showOnlyIssues/toggle' };

// Analysis Options
export interface AnalysisOptions {
  includeComponents: boolean;
  includeTokens: boolean;
  includeColors: boolean;
  includeTypography: boolean;
  includeSpacing: boolean;
  includeBorders: boolean;
  includeShadows: boolean;
  depth: 'shallow' | 'medium' | 'deep';
  includeThirdParty: boolean;
  customSelectors?: string[];
}

// Analysis Result
export interface AnalysisResult {
  tokens: DesignToken[];
  componentUsage: ComponentUsage[];
  consistencyIssues: ConsistencyIssue[];
  colorPalette: ColorPalette;
  colorUsage: ColorUsageStats;
  typographyScale: TypographyScale;
  spacingAnalysis: SpacingAnalysis;
  stats: DesignSystemStats;
  analysisTime: number;
}

// CSS Parsing Types
export interface ParsedCSS {
  selector: string;
  properties: CSSProperty[];
  element: HTMLElement;
}

export interface CSSProperty {
  name: string;
  value: string;
  computed: string;
  isCustomProperty: boolean;
  isImportant: boolean;
}

// React Component Detection Types
export interface ReactComponentInfo {
  name: string;
  displayName: string;
  props: Record<string, any>;
  fiber: any; // React Fiber node
  source?: {
    fileName?: string;
    lineNumber?: number;
    columnNumber?: number;
  };
}