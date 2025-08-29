import type { SpacingToken } from '../types';
import { generateId } from './id-generator';

/**
 * Analyze spacing consistency in design system
 */
export function analyzeSpacingConsistency(element: Element, computedStyle: CSSStyleDeclaration): SpacingToken[] {
  const tokens: SpacingToken[] = [];
  const spacingProperties = [
    'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
    'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
    'gap', 'row-gap', 'column-gap',
    'top', 'right', 'bottom', 'left', // For positioned elements
  ];

  for (const property of spacingProperties) {
    const value = computedStyle.getPropertyValue(property);
    if (value && isValidSpacingValue(value)) {
      const token = createSpacingToken(property, value);
      if (token) {
        tokens.push(token);
      }
    }
  }

  return tokens;
}

/**
 * Create spacing token from CSS property and value
 */
function createSpacingToken(property: string, value: string): SpacingToken | null {
  if (!isValidSpacingValue(value)) return null;

  const pixels = parseSpacingValue(value);
  if (pixels === null) return null;

  const rem = pixels / 16; // Assuming 16px = 1rem
  const scale = calculateSpacingScale(pixels);
  const category = inferSpacingCategory(property, pixels);
  const isValid = validateSpacingValue(pixels);
  const violations = getSpacingViolations(pixels, property);

  return {
    id: generateId(),
    name: `${property}-spacing`,
    value,
    type: 'spacing',
    category,
    description: `Spacing value for ${property}`,
    usageCount: 1,
    isValid,
    violations,
    pixels,
    rem,
    scale,
  };
}

/**
 * Check if value is valid spacing
 */
function isValidSpacingValue(value: string): boolean {
  if (!value || value === 'auto' || value === 'inherit' || value === 'initial') {
    return false;
  }

  return (
    /^\d+(\.\d+)?px$/.test(value) ||
    /^\d+(\.\d+)?rem$/.test(value) ||
    /^\d+(\.\d+)?em$/.test(value) ||
    /^\d+(\.\d+)?%$/.test(value) ||
    value.startsWith('var(--')
  );
}

/**
 * Parse spacing value to pixels
 */
function parseSpacingValue(value: string): number | null {
  // Handle CSS variables
  if (value.startsWith('var(--')) {
    // For CSS variables, we'd need to resolve them
    // For now, return null to skip
    return null;
  }

  // Handle px values
  const pxMatch = value.match(/^(\d+(?:\.\d+)?)px$/);
  if (pxMatch) return parseFloat(pxMatch[1]);

  // Handle rem values (assume 16px base)
  const remMatch = value.match(/^(\d+(?:\.\d+)?)rem$/);
  if (remMatch) return parseFloat(remMatch[1]) * 16;

  // Handle em values (assume 16px base - simplified)
  const emMatch = value.match(/^(\d+(?:\.\d+)?)em$/);
  if (emMatch) return parseFloat(emMatch[1]) * 16;

  // Handle percentage (can't convert to pixels without context)
  const percentMatch = value.match(/^(\d+(?:\.\d+)?)%$/);
  if (percentMatch) return null; // Skip percentages

  return null;
}

/**
 * Calculate spacing scale level
 */
function calculateSpacingScale(pixels: number): number {
  if (pixels === 0) return 0;

  // Common 4px-based scale: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96
  const scale4px = [0, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96, 128];
  
  // Common 8px-based scale: 8, 16, 24, 32, 40, 48, 64, 80, 96
  const scale8px = [0, 8, 16, 24, 32, 40, 48, 64, 80, 96, 112, 128];

  // Find closest match in 4px scale
  for (let i = 0; i < scale4px.length; i++) {
    if (pixels <= scale4px[i]) {
      return i;
    }
  }

  // If larger than predefined scale, calculate based on 8px increments
  return Math.ceil(pixels / 8) + scale4px.length;
}

/**
 * Infer spacing category
 */
function inferSpacingCategory(property: string, pixels: number): string {
  // Micro spacing (0-8px)
  if (pixels <= 8) return 'micro';
  
  // Small spacing (12-16px)
  if (pixels <= 16) return 'small';
  
  // Medium spacing (20-32px)
  if (pixels <= 32) return 'medium';
  
  // Large spacing (40-64px)
  if (pixels <= 64) return 'large';
  
  // Extra large spacing (80px+)
  return 'xlarge';
}

/**
 * Validate spacing value
 */
function validateSpacingValue(pixels: number): boolean {
  // Check reasonable bounds
  if (pixels < 0 || pixels > 400) return false;
  
  // Check if it follows common scales
  return isScaleCompliant(pixels);
}

/**
 * Check if spacing follows common scales
 */
function isScaleCompliant(pixels: number): boolean {
  // Check 4px scale compliance
  if (pixels % 4 === 0) return true;
  
  // Check 8px scale compliance  
  if (pixels % 8 === 0) return true;
  
  // Check for common irregular values that are acceptable
  const acceptableValues = [1, 2, 3, 6, 10, 14, 18, 22, 28, 36, 44, 52, 60, 72, 88, 104];
  if (acceptableValues.includes(pixels)) return true;
  
  return false;
}

/**
 * Get spacing violations
 */
function getSpacingViolations(pixels: number, property: string): string[] {
  const violations: string[] = [];
  
  // Check scale compliance
  if (!isScaleCompliant(pixels)) {
    const nearestScale = findNearestScaleValue(pixels);
    violations.push(`Value ${pixels}px doesn't follow spacing scale. Consider using ${nearestScale}px`);
  }
  
  // Check for excessive spacing
  if (pixels > 200) {
    violations.push(`Very large spacing value (${pixels}px) may indicate layout issues`);
  }
  
  // Check for odd values that might be accidental
  if (pixels > 1 && pixels % 2 !== 0 && !isIntentionalOddValue(pixels)) {
    violations.push(`Odd spacing value (${pixels}px) may be unintentional`);
  }
  
  // Property-specific checks
  if (property.includes('gap') && pixels === 0) {
    violations.push('Gap of 0 may indicate missing spacing between elements');
  }
  
  return violations;
}

/**
 * Find nearest scale value
 */
function findNearestScaleValue(pixels: number): number {
  const scale = [0, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96, 128];
  
  let nearest = scale[0];
  let nearestDiff = Math.abs(scale[0] - pixels);
  
  for (const value of scale) {
    const diff = Math.abs(value - pixels);
    if (diff < nearestDiff) {
      nearest = value;
      nearestDiff = diff;
    }
  }
  
  return nearest;
}

/**
 * Check if odd value is intentional
 */
function isIntentionalOddValue(pixels: number): boolean {
  // Some odd values are commonly used intentionally
  const intentionalOddValues = [1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23];
  return intentionalOddValues.includes(pixels);
}

/**
 * Analyze spacing patterns in layout
 */
export function analyzeSpacingPatterns(elements: Element[]): {
  commonPatterns: { pattern: string; count: number; elements: Element[] }[];
  inconsistencies: { property: string; values: string[]; recommendation: string }[];
  recommendations: string[];
} {
  const patterns = new Map<string, { count: number; elements: Element[] }>();
  const propertyValues = new Map<string, Set<string>>();
  
  for (const element of elements) {
    const computedStyle = window.getComputedStyle(element);
    const spacingProps = ['margin', 'padding', 'gap'];
    
    for (const prop of spacingProps) {
      const value = computedStyle.getPropertyValue(prop);
      if (value && value !== '0px' && value !== 'normal') {
        // Track patterns
        const pattern = `${prop}:${value}`;
        if (!patterns.has(pattern)) {
          patterns.set(pattern, { count: 0, elements: [] });
        }
        const patternData = patterns.get(pattern)!;
        patternData.count++;
        patternData.elements.push(element);
        
        // Track property values
        if (!propertyValues.has(prop)) {
          propertyValues.set(prop, new Set());
        }
        propertyValues.get(prop)!.add(value);
      }
    }
  }
  
  // Find common patterns
  const commonPatterns = Array.from(patterns.entries())
    .filter(([, data]) => data.count >= 3)
    .map(([pattern, data]) => ({ pattern, ...data }))
    .sort((a, b) => b.count - a.count);
  
  // Find inconsistencies
  const inconsistencies: { property: string; values: string[]; recommendation: string }[] = [];
  for (const [property, values] of propertyValues) {
    if (values.size > 6) { // Too many different values
      const valuesArray = Array.from(values);
      const recommendation = generateSpacingRecommendation(valuesArray);
      inconsistencies.push({
        property,
        values: valuesArray,
        recommendation,
      });
    }
  }
  
  // Generate general recommendations
  const recommendations = generateSpacingRecommendations(patterns, inconsistencies);
  
  return {
    commonPatterns,
    inconsistencies,
    recommendations,
  };
}

/**
 * Generate spacing recommendation for inconsistent values
 */
function generateSpacingRecommendation(values: string[]): string {
  const pixelValues = values
    .map(parseSpacingValue)
    .filter(Boolean) as number[];
  
  if (pixelValues.length === 0) {
    return 'Consider using consistent spacing tokens';
  }
  
  // Find if values follow a scale
  const scaleCompliant = pixelValues.filter(isScaleCompliant);
  const nonCompliant = pixelValues.filter(v => !isScaleCompliant(v));
  
  if (nonCompliant.length > scaleCompliant.length) {
    return 'Many values don\'t follow a spacing scale. Consider using 4px or 8px based increments';
  }
  
  if (pixelValues.length > 8) {
    return `Too many different spacing values (${pixelValues.length}). Consider consolidating to 4-6 core spacing tokens`;
  }
  
  return 'Consider creating spacing tokens for these commonly used values';
}

/**
 * Generate general spacing recommendations
 */
function generateSpacingRecommendations(
  patterns: Map<string, { count: number; elements: Element[] }>,
  inconsistencies: { property: string; values: string[]; recommendation: string }[]
): string[] {
  const recommendations: string[] = [];
  
  // Check for tokenization opportunities
  const highUsagePatterns = Array.from(patterns.entries())
    .filter(([, data]) => data.count >= 5);
  
  if (highUsagePatterns.length > 0) {
    recommendations.push(
      `${highUsagePatterns.length} spacing values are used frequently and should be tokenized`
    );
  }
  
  // Check for scale compliance
  const allValues = Array.from(patterns.keys())
    .map(pattern => pattern.split(':')[1])
    .map(parseSpacingValue)
    .filter(Boolean) as number[];
  
  const nonCompliantValues = allValues.filter(v => !isScaleCompliant(v));
  if (nonCompliantValues.length > allValues.length * 0.3) {
    recommendations.push(
      'Consider adopting a consistent spacing scale (4px or 8px based) for better consistency'
    );
  }
  
  // Check for missing common spacing values
  const commonSpacingValues = [8, 16, 24, 32, 48, 64];
  const missingCommon = commonSpacingValues.filter(v => !allValues.includes(v));
  if (missingCommon.length > 0 && allValues.length > 5) {
    recommendations.push(
      `Consider adding these common spacing values: ${missingCommon.map(v => v + 'px').join(', ')}`
    );
  }
  
  return recommendations;
}

/**
 * Calculate spacing consistency score
 */
export function calculateSpacingConsistency(tokens: SpacingToken[]): number {
  if (tokens.length === 0) return 100;
  
  const validTokens = tokens.filter(t => t.isValid).length;
  const baseScore = (validTokens / tokens.length) * 100;
  
  // Bonus for good scale compliance
  const scaleCompliantTokens = tokens.filter(t => isScaleCompliant(t.pixels)).length;
  const scaleBonus = (scaleCompliantTokens / tokens.length) * 10;
  
  // Penalty for too many unique values (indicates inconsistency)
  const uniqueValues = new Set(tokens.map(t => t.pixels)).size;
  const varietyPenalty = Math.max(0, (uniqueValues - 8) * 2); // Penalty if more than 8 unique values
  
  return Math.max(0, Math.min(100, baseScore + scaleBonus - varietyPenalty));
}

/**
 * Generate spacing scale suggestions
 */
export function generateSpacingScale(baseSize = 4): number[] {
  const scale = [0];
  
  // Generate scale based on ratio and base size
  let current = baseSize;
  
  // Linear progression for small values
  for (let i = 1; i <= 6; i++) {
    scale.push(current);
    current += baseSize;
  }
  
  // Slightly accelerated progression for medium values
  const mediumBase = baseSize * 8;
  current = mediumBase;
  for (let i = 0; i < 4; i++) {
    scale.push(current);
    current += baseSize * 2;
  }
  
  // Larger jumps for big values
  current = baseSize * 16;
  for (let i = 0; i < 3; i++) {
    scale.push(current);
    current += baseSize * 4;
  }
  
  return scale.filter((value, index, self) => self.indexOf(value) === index).sort((a, b) => a - b);
}