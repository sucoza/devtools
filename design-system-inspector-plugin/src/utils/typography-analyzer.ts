import type { TypographyToken } from '../types';
import { generateId } from './id-generator';

/**
 * Analyze typography scale in design system
 */
export function analyzeTypographyScale(element: Element, computedStyle: CSSStyleDeclaration): TypographyToken[] {
  const tokens: TypographyToken[] = [];
  
  // Only analyze text elements
  if (!isTextElement(element)) {
    return tokens;
  }

  const fontSize = computedStyle.fontSize;
  const fontWeight = computedStyle.fontWeight;
  const lineHeight = computedStyle.lineHeight;
  const fontFamily = computedStyle.fontFamily;
  const letterSpacing = computedStyle.letterSpacing;

  if (fontSize && fontSize !== 'inherit') {
    const token = createTypographyToken({
      fontSize,
      fontWeight,
      lineHeight,
      fontFamily,
      letterSpacing,
    });
    
    if (token) {
      tokens.push(token);
    }
  }

  return tokens;
}

/**
 * Check if element is a text element
 */
function isTextElement(element: Element): boolean {
  const textElements = new Set([
    'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'span', 'a', 'strong', 'em', 
    'b', 'i', 'u', 'small', 'mark', 'del', 'ins', 'sub', 'sup', 'code',
    'pre', 'kbd', 'samp', 'var', 'time', 'abbr', 'dfn', 'q', 'cite',
    'blockquote', 'address', 'label', 'legend', 'caption', 'figcaption',
    'dd', 'dt', 'li', 'th', 'td', 'button', 'input', 'textarea', 'select'
  ]);

  const tagName = element.tagName.toLowerCase();
  
  // Check if it's a known text element
  if (textElements.has(tagName)) {
    return true;
  }

  // Check if element contains text content
  const textContent = element.textContent?.trim();
  if (textContent && textContent.length > 0) {
    // Make sure it's not just whitespace or contains mostly text
    const textRatio = textContent.length / element.innerHTML.length;
    return textRatio > 0.5;
  }

  return false;
}

/**
 * Create typography token from style properties
 */
function createTypographyToken(props: {
  fontSize: string;
  fontWeight: string;
  lineHeight: string;
  fontFamily: string;
  letterSpacing: string;
}): TypographyToken | null {
  const { fontSize, fontWeight, lineHeight, fontFamily, letterSpacing } = props;
  
  if (!fontSize || fontSize === 'inherit') return null;

  const category = inferTypographyCategory(fontSize, fontWeight);
  const scale = calculateTypographyScale(fontSize);
  const isValid = validateTypographyValues(props);
  const violations = getTypographyViolations(props);

  return {
    id: generateId(),
    name: `typography-${scale}`,
    value: `${fontSize}/${lineHeight} ${fontFamily}`,
    type: 'typography',
    category,
    description: `Typography scale ${scale}`,
    usageCount: 1,
    isValid,
    violations,
    fontSize,
    fontWeight: normalizeStyleFontWeight(fontWeight),
    lineHeight: normalizeLineHeight(lineHeight, fontSize),
    fontFamily: cleanFontFamily(fontFamily),
    letterSpacing: letterSpacing !== 'normal' ? letterSpacing : undefined,
  };
}

/**
 * Infer typography category based on size and weight
 */
function inferTypographyCategory(fontSize: string, fontWeight: string): string {
  const pixels = parsePixelValue(fontSize);
  const weight = parseInt(fontWeight) || 400;
  
  if (!pixels) return 'custom';
  
  // Heading categories
  if (pixels >= 32) return 'heading-large';
  if (pixels >= 24) return 'heading-medium';
  if (pixels >= 20) return 'heading-small';
  
  // Body categories
  if (pixels >= 16) {
    if (weight >= 600) return 'body-strong';
    return 'body-large';
  }
  
  if (pixels >= 14) {
    if (weight >= 600) return 'body-strong';
    return 'body-medium';
  }
  
  if (pixels >= 12) return 'body-small';
  
  return 'caption';
}

/**
 * Calculate typography scale level
 */
function calculateTypographyScale(fontSize: string): number {
  const pixels = parsePixelValue(fontSize);
  if (!pixels) return 0;
  
  // Common scale: 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 64
  const scale = [12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 64];
  
  for (let i = 0; i < scale.length; i++) {
    if (pixels <= scale[i]) {
      return i + 1;
    }
  }
  
  return Math.ceil(pixels / 8); // Fallback calculation
}

/**
 * Validate typography values
 */
function validateTypographyValues(props: {
  fontSize: string;
  fontWeight: string;
  lineHeight: string;
  fontFamily: string;
  letterSpacing: string;
}): boolean {
  const { fontSize, fontWeight, lineHeight, fontFamily } = props;
  
  // Check font size
  if (!isValidFontSize(fontSize)) return false;
  
  // Check font weight
  if (!isValidFontWeight(fontWeight)) return false;
  
  // Check line height
  if (!isValidLineHeight(lineHeight)) return false;
  
  // Check font family
  if (!isValidFontFamily(fontFamily)) return false;
  
  return true;
}

/**
 * Get typography violations
 */
function getTypographyViolations(props: {
  fontSize: string;
  fontWeight: string;
  lineHeight: string;
  fontFamily: string;
  letterSpacing: string;
}): string[] {
  const violations: string[] = [];
  const { fontSize, fontWeight, lineHeight, fontFamily } = props;
  
  // Check font size scale compliance
  if (!isScaleCompliant(fontSize)) {
    violations.push(`Font size ${fontSize} does not follow a consistent scale`);
  }
  
  // Check line height ratio
  const lineHeightRatio = calculateLineHeightRatio(fontSize, lineHeight);
  if (lineHeightRatio < 1.2 || lineHeightRatio > 1.8) {
    violations.push(`Line height ratio ${lineHeightRatio.toFixed(2)} is outside recommended range (1.2-1.8)`);
  }
  
  // Check font weight consistency
  if (!isStandardFontWeight(fontWeight)) {
    violations.push(`Font weight ${fontWeight} is not a standard value`);
  }
  
  // Check font stack
  if (!hasWebSafeFallbacks(fontFamily)) {
    violations.push('Font family should include web-safe fallbacks');
  }
  
  return violations;
}

/**
 * Check if font size is valid
 */
function isValidFontSize(fontSize: string): boolean {
  return /^\d+(\.\d+)?(px|em|rem|%)$/.test(fontSize);
}

/**
 * Check if font weight is valid
 */
function isValidFontWeight(fontWeight: string): boolean {
  const validWeights = ['100', '200', '300', '400', '500', '600', '700', '800', '900', 'normal', 'bold', 'bolder', 'lighter'];
  return validWeights.includes(fontWeight);
}

/**
 * Check if line height is valid
 */
function isValidLineHeight(lineHeight: string): boolean {
  return lineHeight === 'normal' || /^\d+(\.\d+)?(px|em|rem|%)$/.test(lineHeight) || /^\d+(\.\d+)?$/.test(lineHeight);
}

/**
 * Check if font family is valid
 */
function isValidFontFamily(fontFamily: string): boolean {
  return Boolean(fontFamily && fontFamily.length > 0 && fontFamily !== 'inherit');
}

/**
 * Check if font size follows scale
 */
function isScaleCompliant(fontSize: string): boolean {
  const pixels = parsePixelValue(fontSize);
  if (!pixels) return false;
  
  // Check against common scales
  const modularScale = generateModularScale(16, 1.25, 10); // Base 16px, ratio 1.25
  const tolerance = 2; // 2px tolerance
  
  return modularScale.some(scale => Math.abs(scale - pixels) <= tolerance);
}

/**
 * Generate modular scale
 */
function generateModularScale(base: number, ratio: number, steps: number): number[] {
  const scale: number[] = [base];
  
  // Generate larger sizes
  for (let i = 1; i <= steps; i++) {
    scale.push(Math.round(base * Math.pow(ratio, i)));
  }
  
  // Generate smaller sizes
  for (let i = 1; i <= steps; i++) {
    scale.unshift(Math.round(base / Math.pow(ratio, i)));
  }
  
  return scale.filter(size => size >= 10 && size <= 100); // Reasonable bounds
}

/**
 * Calculate line height ratio
 */
function calculateLineHeightRatio(fontSize: string, lineHeight: string): number {
  const fontPixels = parsePixelValue(fontSize);
  if (!fontPixels) return 1.5; // Default
  
  if (lineHeight === 'normal') return 1.5; // Browser default
  
  const linePixels = parsePixelValue(lineHeight);
  if (linePixels) {
    return linePixels / fontPixels;
  }
  
  // If line height is unitless, it's already a ratio
  const ratio = parseFloat(lineHeight);
  if (!isNaN(ratio)) return ratio;
  
  return 1.5; // Fallback
}

/**
 * Check if font weight is standard
 */
function isStandardFontWeight(fontWeight: string): boolean {
  const standardWeights = ['100', '200', '300', '400', '500', '600', '700', '800', '900'];
  return standardWeights.includes(fontWeight) || ['normal', 'bold'].includes(fontWeight);
}

/**
 * Check if font family has web-safe fallbacks
 */
function hasWebSafeFallbacks(fontFamily: string): boolean {
  const webSafeFonts = [
    'serif', 'sans-serif', 'monospace', 'cursive', 'fantasy',
    'system-ui', '-apple-system', 'arial', 'helvetica', 'times', 'georgia',
    'verdana', 'tahoma', 'trebuchet ms', 'courier new', 'impact'
  ];
  
  const families = fontFamily.toLowerCase().split(',').map(f => f.trim().replace(/['"]/g, ''));
  return families.some(family => webSafeFonts.includes(family));
}

/**
 * Normalize font weight values
 */
function normalizeStyleFontWeight(fontWeight: string): string {
  const weightMap: Record<string, string> = {
    'normal': '400',
    'bold': '700',
    'bolder': '700',
    'lighter': '300',
  };
  
  return weightMap[fontWeight] || fontWeight;
}

/**
 * Normalize line height values
 */
function normalizeLineHeight(lineHeight: string, fontSize: string): string {
  if (lineHeight === 'normal') return '1.5';
  
  const linePixels = parsePixelValue(lineHeight);
  const fontPixels = parsePixelValue(fontSize);
  
  if (linePixels && fontPixels) {
    return (linePixels / fontPixels).toFixed(2);
  }
  
  return lineHeight;
}

/**
 * Clean font family string
 */
function cleanFontFamily(fontFamily: string): string {
  return fontFamily
    .split(',')
    .map(family => family.trim().replace(/^['"]|['"]$/g, ''))
    .join(', ');
}

/**
 * Parse pixel value from CSS value
 */
function parsePixelValue(value: string): number | null {
  if (!value) return null;
  
  // Handle px values
  const pxMatch = value.match(/^(\d+(?:\.\d+)?)px$/);
  if (pxMatch) return parseFloat(pxMatch[1]);
  
  // Handle rem values (assume 16px base)
  const remMatch = value.match(/^(\d+(?:\.\d+)?)rem$/);
  if (remMatch) return parseFloat(remMatch[1]) * 16;
  
  // Handle em values (more complex, would need parent context)
  const emMatch = value.match(/^(\d+(?:\.\d+)?)em$/);
  if (emMatch) return parseFloat(emMatch[1]) * 16; // Simplified assumption
  
  return null;
}

/**
 * Generate typography scale recommendations
 */
export function generateTypographyRecommendations(tokens: TypographyToken[]): {
  scaleGaps: { missing: number[]; recommendation: string }[];
  inconsistentLineHeights: { fontSize: string; lineHeight: string; recommended: string }[];
  fontStackIssues: { fontFamily: string; issue: string; recommendation: string }[];
} {
  const scaleGaps: { missing: number[]; recommendation: string }[] = [];
  const inconsistentLineHeights: { fontSize: string; lineHeight: string; recommended: string }[] = [];
  const fontStackIssues: { fontFamily: string; issue: string; recommendation: string }[] = [];
  
  // Analyze scale gaps
  const usedSizes = tokens.map(t => parsePixelValue(t.fontSize)).filter(Boolean) as number[];
  const modularScale = generateModularScale(16, 1.25, 8);
  const missingSizes = modularScale.filter(size => !usedSizes.some(used => Math.abs(used - size) <= 2));
  
  if (missingSizes.length > 0) {
    scaleGaps.push({
      missing: missingSizes,
      recommendation: `Consider adding these font sizes to your typography scale: ${missingSizes.map(s => s + 'px').join(', ')}`,
    });
  }
  
  // Analyze line heights
  for (const token of tokens) {
    const ratio = calculateLineHeightRatio(token.fontSize, token.lineHeight);
    if (ratio < 1.2 || ratio > 1.8) {
      const recommended = Math.max(1.2, Math.min(1.8, ratio < 1.2 ? 1.3 : 1.5));
      inconsistentLineHeights.push({
        fontSize: token.fontSize,
        lineHeight: token.lineHeight,
        recommended: recommended.toString(),
      });
    }
  }
  
  // Analyze font stacks
  const uniqueFamilies = [...new Set(tokens.map(t => t.fontFamily))];
  for (const family of uniqueFamilies) {
    if (!hasWebSafeFallbacks(family)) {
      fontStackIssues.push({
        fontFamily: family,
        issue: 'Missing web-safe fallbacks',
        recommendation: 'Add fallback fonts like "sans-serif" or "serif" to ensure consistent rendering',
      });
    }
  }
  
  return {
    scaleGaps,
    inconsistentLineHeights,
    fontStackIssues,
  };
}