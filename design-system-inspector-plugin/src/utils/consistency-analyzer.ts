import type { 
  ConsistencyIssue,
  ConsistencyOccurrence,
  ConsistencyIssueType,
  DesignToken,
  ColorPalette,
  TypographyScale,
  SpacingAnalysis,
  ColorUsageStats
} from '../types';
import { generateId } from './id-generator';

/**
 * Detect consistency issues in design system usage
 */
export function detectConsistencyIssues(
  element: Element | null,
  computedStyle: CSSStyleDeclaration | null,
  context: {
    shallow?: boolean;
    type?: string;
    tokens?: DesignToken[];
    colorPalette?: ColorPalette;
    typographyScale?: TypographyScale;
    spacingAnalysis?: SpacingAnalysis;
    elements?: Element[];
  }
): ConsistencyIssue[] {
  const issues: ConsistencyIssue[] = [];

  if (element && computedStyle) {
    // Single element analysis
    issues.push(...analyzeColorConsistency(element, computedStyle, context));
    issues.push(...analyzeTypographyConsistency(element, computedStyle, context));
    issues.push(...analyzeSpacingConsistency(element, computedStyle, context));
    issues.push(...analyzeBorderConsistency(element, computedStyle, context));
  } else if (context.elements) {
    // Batch analysis
    issues.push(...analyzeBatchConsistency(context));
  }

  return issues;
}

/**
 * Analyze color consistency issues
 */
function analyzeColorConsistency(
  element: Element,
  computedStyle: CSSStyleDeclaration,
  context: any
): ConsistencyIssue[] {
  const issues: ConsistencyIssue[] = [];
  const colorProperties = ['color', 'background-color', 'border-color'];

  for (const property of colorProperties) {
    const value = computedStyle.getPropertyValue(property);
    if (!value || value === 'rgba(0, 0, 0, 0)' || value === 'transparent') continue;

    // Check if color is tokenized
    if (!isTokenizedValue(value, context.tokens)) {
      issues.push(createConsistencyIssue({
        type: 'missing-design-tokens',
        severity: 'warning',
        title: 'Non-tokenized color',
        description: `Color value "${value}" for ${property} is not using a design token`,
        element: element as HTMLElement,
        selector: generateSelector(element),
        recommendation: 'Consider using a design token for this color value',
        fixable: true,
        occurrences: [{
          element: element as HTMLElement,
          computedStyle,
          actualValue: value,
          selector: generateSelector(element),
        }],
      }));
    }

    // Check for color accessibility
    if (property === 'color' && !hasGoodContrast(element, computedStyle)) {
      issues.push(createConsistencyIssue({
        type: 'accessibility-violation',
        severity: 'error',
        title: 'Poor color contrast',
        description: `Text color may not have sufficient contrast with background`,
        element: element as HTMLElement,
        selector: generateSelector(element),
        recommendation: 'Use colors that meet WCAG contrast requirements',
        fixable: false,
        occurrences: [{
          element: element as HTMLElement,
          computedStyle,
          actualValue: value,
          selector: generateSelector(element),
        }],
      }));
    }

    // Check for deprecated colors
    if (isDeprecatedColor(value)) {
      issues.push(createConsistencyIssue({
        type: 'deprecated-values',
        severity: 'warning',
        title: 'Deprecated color value',
        description: `Color "${value}" is marked as deprecated`,
        element: element as HTMLElement,
        selector: generateSelector(element),
        recommendation: 'Replace with current design token',
        fixable: true,
        occurrences: [{
          element: element as HTMLElement,
          computedStyle,
          actualValue: value,
          selector: generateSelector(element),
        }],
      }));
    }
  }

  return issues;
}

/**
 * Analyze typography consistency issues
 */
function analyzeTypographyConsistency(
  element: Element,
  computedStyle: CSSStyleDeclaration,
  context: any
): ConsistencyIssue[] {
  const issues: ConsistencyIssue[] = [];
  const fontSize = computedStyle.fontSize;
  const fontWeight = computedStyle.fontWeight;
  const lineHeight = computedStyle.lineHeight;

  // Check font size scale compliance
  if (!isScaleCompliant(fontSize, context.typographyScale)) {
    issues.push(createConsistencyIssue({
      type: 'inconsistent-typography',
      severity: 'warning',
      title: 'Off-scale font size',
      description: `Font size ${fontSize} does not follow the typography scale`,
      element: element as HTMLElement,
      selector: generateSelector(element),
      recommendation: 'Use a font size from the established typography scale',
      expectedValue: findNearestScaleValue(fontSize, context.typographyScale),
      fixable: true,
      occurrences: [{
        element: element as HTMLElement,
        computedStyle,
        actualValue: fontSize,
        selector: generateSelector(element),
      }],
    }));
  }

  // Check line height consistency
  if (!isConsistentLineHeight(fontSize, lineHeight)) {
    issues.push(createConsistencyIssue({
      type: 'inconsistent-typography',
      severity: 'info',
      title: 'Inconsistent line height',
      description: `Line height ${lineHeight} may not be optimal for font size ${fontSize}`,
      element: element as HTMLElement,
      selector: generateSelector(element),
      recommendation: 'Consider using a line height that follows the design system guidelines',
      fixable: true,
      occurrences: [{
        element: element as HTMLElement,
        computedStyle,
        actualValue: lineHeight,
        selector: generateSelector(element),
      }],
    }));
  }

  return issues;
}

/**
 * Analyze spacing consistency issues
 */
function analyzeSpacingConsistency(
  element: Element,
  computedStyle: CSSStyleDeclaration,
  context: any
): ConsistencyIssue[] {
  const issues: ConsistencyIssue[] = [];
  const spacingProperties = ['margin', 'padding', 'gap'];

  for (const property of spacingProperties) {
    const value = computedStyle.getPropertyValue(property);
    if (!value || value === '0px') continue;

    // Parse individual values (e.g., "8px 16px 24px 16px")
    const values = parseSpacingValues(value);
    
    for (const spacing of values) {
      if (!isSpacingTokenized(spacing, context.tokens)) {
        issues.push(createConsistencyIssue({
          type: 'inconsistent-spacing',
          severity: 'warning',
          title: 'Non-tokenized spacing',
          description: `Spacing value "${spacing}" for ${property} is not using a design token`,
          element: element as HTMLElement,
          selector: generateSelector(element),
          recommendation: 'Use spacing tokens for consistent spacing',
          expectedValue: findNearestSpacingToken(spacing, context.spacingAnalysis),
          fixable: true,
          occurrences: [{
            element: element as HTMLElement,
            computedStyle,
            actualValue: spacing,
            selector: generateSelector(element),
          }],
        }));
      }

      if (!isSpacingScaleCompliant(spacing)) {
        issues.push(createConsistencyIssue({
          type: 'inconsistent-spacing',
          severity: 'info',
          title: 'Off-scale spacing',
          description: `Spacing value "${spacing}" does not follow the spacing scale`,
          element: element as HTMLElement,
          selector: generateSelector(element),
          recommendation: 'Use spacing values that are multiples of the base unit (typically 4px or 8px)',
          expectedValue: roundToNearestScale(spacing),
          fixable: true,
          occurrences: [{
            element: element as HTMLElement,
            computedStyle,
            actualValue: spacing,
            selector: generateSelector(element),
          }],
        }));
      }
    }
  }

  return issues;
}

/**
 * Analyze border consistency issues
 */
function analyzeBorderConsistency(
  element: Element,
  computedStyle: CSSStyleDeclaration,
  context: any
): ConsistencyIssue[] {
  const issues: ConsistencyIssue[] = [];
  const borderWidth = computedStyle.borderWidth;
  const borderRadius = computedStyle.borderRadius;

  // Check border width
  if (borderWidth && borderWidth !== '0px' && !isBorderWidthTokenized(borderWidth, context.tokens)) {
    issues.push(createConsistencyIssue({
      type: 'missing-design-tokens',
      severity: 'info',
      title: 'Non-tokenized border width',
      description: `Border width "${borderWidth}" could use a design token`,
      element: element as HTMLElement,
      selector: generateSelector(element),
      recommendation: 'Consider using a border width token',
      fixable: true,
      occurrences: [{
        element: element as HTMLElement,
        computedStyle,
        actualValue: borderWidth,
        selector: generateSelector(element),
      }],
    }));
  }

  // Check border radius
  if (borderRadius && borderRadius !== '0px' && !isBorderRadiusTokenized(borderRadius, context.tokens)) {
    issues.push(createConsistencyIssue({
      type: 'missing-design-tokens',
      severity: 'info',
      title: 'Non-tokenized border radius',
      description: `Border radius "${borderRadius}" could use a design token`,
      element: element as HTMLElement,
      selector: generateSelector(element),
      recommendation: 'Consider using a border radius token',
      fixable: true,
      occurrences: [{
        element: element as HTMLElement,
        computedStyle,
        actualValue: borderRadius,
        selector: generateSelector(element),
      }],
    }));
  }

  return issues;
}

/**
 * Analyze batch consistency across multiple elements
 */
function analyzeBatchConsistency(context: any): ConsistencyIssue[] {
  const issues: ConsistencyIssue[] = [];

  if (!context.elements || context.elements.length === 0) return issues;

  // Find repeated values that should be tokenized
  const valueOccurrences = new Map<string, { elements: HTMLElement[], property: string }>();

  for (const element of context.elements) {
    const computedStyle = window.getComputedStyle(element);
    const properties = ['color', 'background-color', 'font-size', 'margin', 'padding'];

    for (const property of properties) {
      const value = computedStyle.getPropertyValue(property);
      if (value) {
        const key = `${property}:${value}`;
        if (!valueOccurrences.has(key)) {
          valueOccurrences.set(key, { elements: [], property });
        }
        valueOccurrences.get(key)!.elements.push(element as HTMLElement);
      }
    }
  }

  // Create issues for repeated values that aren't tokenized
  for (const [key, data] of valueOccurrences) {
    if (data.elements.length >= 3) { // Appears 3 or more times
      const [property, value] = key.split(':');
      
      if (!isTokenizedValue(value, context.tokens)) {
        issues.push(createConsistencyIssue({
          type: 'missing-design-tokens',
          severity: 'warning',
          title: 'Repeated value should be tokenized',
          description: `Value "${value}" for ${property} is used ${data.elements.length} times but is not tokenized`,
          recommendation: 'Create a design token for this commonly used value',
          fixable: true,
          occurrences: data.elements.map(element => ({
            element,
            computedStyle: window.getComputedStyle(element),
            actualValue: value,
            selector: generateSelector(element),
          })),
        }));
      }
    }
  }

  return issues;
}

/**
 * Create a consistency issue object
 */
function createConsistencyIssue(params: {
  type: ConsistencyIssueType;
  severity: 'error' | 'warning' | 'info';
  title: string;
  description: string;
  element?: HTMLElement;
  selector?: string;
  recommendation?: string;
  expectedValue?: string;
  fixable?: boolean;
  occurrences: ConsistencyOccurrence[];
}): ConsistencyIssue {
  return {
    id: generateId(),
    ...params,
  };
}

/**
 * Generate CSS selector for an element
 */
function generateSelector(element: Element): string {
  if (element.id) {
    return `#${element.id}`;
  }

  if (element.className) {
    const classes = element.className.split(' ').filter(c => c);
    if (classes.length > 0) {
      return `.${classes[0]}`;
    }
  }

  // Generate path-based selector
  const path: string[] = [];
  let current = element;

  while (current && current !== document.body) {
    let selector = current.tagName.toLowerCase();
    
    if (current.id) {
      selector += `#${current.id}`;
      path.unshift(selector);
      break;
    }

    if (current.className) {
      const classes = current.className.split(' ').filter(c => c);
      if (classes.length > 0) {
        selector += `.${classes[0]}`;
      }
    }

    path.unshift(selector);
    const parent = current.parentElement;
    if (!parent) break;
    current = parent;
  }

  return path.join(' > ');
}

/**
 * Check if a value is tokenized
 */
function isTokenizedValue(value: string, tokens?: DesignToken[]): boolean {
  if (!tokens) return false;
  return tokens.some(token => token.value === value || value.includes(`var(${token.name})`));
}

/**
 * Check color contrast
 */
function hasGoodContrast(element: Element, computedStyle: CSSStyleDeclaration): boolean {
  // Simplified contrast check - in reality, would need proper WCAG calculation
  const color = computedStyle.color;
  const backgroundColor = computedStyle.backgroundColor;
  
  // Skip if no background color is set
  if (!backgroundColor || backgroundColor === 'rgba(0, 0, 0, 0)' || backgroundColor === 'transparent') {
    return true; // Can't determine, assume OK
  }
  
  // Simplified check - would need proper luminance calculation
  return true;
}

/**
 * Check if color is deprecated
 */
function isDeprecatedColor(value: string): boolean {
  const deprecatedColors = [
    'red',
    'green',
    'blue',
    'yellow',
    'cyan',
    'magenta',
    'orange',
    'purple',
    'brown',
    'pink',
  ];
  
  return deprecatedColors.includes(value.toLowerCase());
}

/**
 * Check if font size complies with typography scale
 */
function isScaleCompliant(fontSize: string, typographyScale?: TypographyScale): boolean {
  if (!typographyScale) return true;
  
  return typographyScale.scales.some(scale => scale.fontSize === fontSize);
}

/**
 * Find nearest scale value
 */
function findNearestScaleValue(fontSize: string, typographyScale?: TypographyScale): string {
  if (!typographyScale || typographyScale.scales.length === 0) return fontSize;
  
  const pixels = parseFloat(fontSize.replace('px', ''));
  let nearest = typographyScale.scales[0];
  let nearestDiff = Math.abs(parseFloat(nearest.fontSize.replace('px', '')) - pixels);
  
  for (const scale of typographyScale.scales) {
    const scalePixels = parseFloat(scale.fontSize.replace('px', ''));
    const diff = Math.abs(scalePixels - pixels);
    if (diff < nearestDiff) {
      nearest = scale;
      nearestDiff = diff;
    }
  }
  
  return nearest.fontSize;
}

/**
 * Check if line height is consistent
 */
function isConsistentLineHeight(fontSize: string, lineHeight: string): boolean {
  // Simple heuristic - line height should be 1.2-1.8x font size
  const fontPixels = parseFloat(fontSize.replace('px', ''));
  const linePixels = parseFloat(lineHeight.replace('px', ''));
  const ratio = linePixels / fontPixels;
  
  return ratio >= 1.2 && ratio <= 1.8;
}

/**
 * Parse spacing values from CSS value
 */
function parseSpacingValues(value: string): string[] {
  return value.split(' ').filter(v => v && v !== '0px');
}

/**
 * Check if spacing is tokenized
 */
function isSpacingTokenized(spacing: string, tokens?: DesignToken[]): boolean {
  if (!tokens) return false;
  return tokens.some(token => 
    token.type === 'spacing' && (token.value === spacing || spacing.includes(`var(${token.name})`))
  );
}

/**
 * Check if spacing follows scale
 */
function isSpacingScaleCompliant(spacing: string): boolean {
  const pixels = parseFloat(spacing.replace('px', ''));
  
  // Common scales: 4px base or 8px base
  return pixels % 4 === 0;
}

/**
 * Find nearest spacing token
 */
function findNearestSpacingToken(spacing: string, spacingAnalysis?: SpacingAnalysis): string {
  if (!spacingAnalysis) return spacing;
  
  const pixels = parseFloat(spacing.replace('px', ''));
  let nearest = spacingAnalysis.scale[0];
  let nearestDiff = Math.abs(nearest.pixels - pixels);
  
  for (const token of spacingAnalysis.scale) {
    const diff = Math.abs(token.pixels - pixels);
    if (diff < nearestDiff) {
      nearest = token;
      nearestDiff = diff;
    }
  }
  
  return nearest.value;
}

/**
 * Round spacing to nearest scale value
 */
function roundToNearestScale(spacing: string): string {
  const pixels = parseFloat(spacing.replace('px', ''));
  const baseUnit = 4; // 4px base scale
  
  const rounded = Math.round(pixels / baseUnit) * baseUnit;
  return `${rounded}px`;
}

/**
 * Check if border width is tokenized
 */
function isBorderWidthTokenized(borderWidth: string, tokens?: DesignToken[]): boolean {
  if (!tokens) return false;
  return tokens.some(token => 
    token.type === 'border' && token.value === borderWidth
  );
}

/**
 * Check if border radius is tokenized
 */
function isBorderRadiusTokenized(borderRadius: string, tokens?: DesignToken[]): boolean {
  if (!tokens) return false;
  return tokens.some(token => 
    token.type === 'border' && token.value === borderRadius
  );
}

/**
 * Calculate overall consistency score
 */
export function calculateConsistencyScore(data: {
  issues: ConsistencyIssue[];
  totalElements: number;
  colorUsage: ColorUsageStats;
  typographyScale: TypographyScale;
  spacingAnalysis: SpacingAnalysis;
}): number {
  const { issues, totalElements, colorUsage, typographyScale, spacingAnalysis } = data;
  
  if (totalElements === 0) return 100;
  
  // Weight different types of issues
  const weights = {
    error: 10,
    warning: 5,
    info: 2,
  };
  
  const totalDeductions = issues.reduce((sum, issue) => sum + weights[issue.severity], 0);
  const maxPossibleDeductions = totalElements * 10; // Assuming worst case
  
  const baseScore = Math.max(0, 100 - (totalDeductions / maxPossibleDeductions) * 100);
  
  // Bonus points for good practices
  let bonus = 0;
  
  // Bonus for high token usage
  if (colorUsage.tokenizedColors / colorUsage.totalColors > 0.8) bonus += 5;
  if (typographyScale.coverage > 80) bonus += 5;
  if (spacingAnalysis.consistency > 80) bonus += 5;
  
  return Math.min(100, baseScore + bonus);
}