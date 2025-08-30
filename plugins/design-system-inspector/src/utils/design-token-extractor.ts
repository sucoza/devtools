import type { 
  DesignToken, 
  ColorToken, 
  TypographyToken, 
  SpacingToken,
  DesignTokenType 
} from '../types';
import { generateId } from './id-generator';

/**
 * Extract design tokens from CSS custom properties and computed styles
 */
export function extractDesignTokens(element: Element, computedStyle: CSSStyleDeclaration): DesignToken[] {
  const tokens: DesignToken[] = [];

  // Extract CSS custom properties (CSS variables)
  const customProps = extractCustomProperties(element);
  
  // Extract tokens from custom properties
  for (const [name, value] of customProps) {
    const token = createTokenFromCustomProperty(name, value);
    if (token) {
      tokens.push(token);
    }
  }

  // Extract implicit tokens from computed styles
  const implicitTokens = extractImplicitTokens(computedStyle);
  tokens.push(...implicitTokens);

  return tokens;
}

/**
 * Extract CSS custom properties from element and its ancestors
 */
function extractCustomProperties(element: Element): Map<string, string> {
  const customProps = new Map<string, string>();
  let currentElement: Element | null = element;

  while (currentElement) {
    const computedStyle = window.getComputedStyle(currentElement);
    
    // Get all CSS properties
    for (let i = 0; i < computedStyle.length; i++) {
      const property = computedStyle[i];
      if (property.startsWith('--')) {
        const value = computedStyle.getPropertyValue(property).trim();
        if (value && !customProps.has(property)) {
          customProps.set(property, value);
        }
      }
    }

    currentElement = currentElement.parentElement;
  }

  return customProps;
}

/**
 * Create a design token from a CSS custom property
 */
function createTokenFromCustomProperty(name: string, value: string): DesignToken | null {
  const tokenType = inferTokenType(name, value);
  if (!tokenType) return null;

  const baseToken = {
    id: generateId(),
    name,
    value,
    type: tokenType,
    category: inferTokenCategory(name),
    usageCount: 1,
    isValid: validateTokenValue(value, tokenType),
    violations: validateToken(name, value, tokenType),
  };

  switch (tokenType) {
    case 'color':
      return createColorToken(baseToken, value);
    case 'typography':
      return createTypographyToken(baseToken, value);
    case 'spacing':
      return createSpacingToken(baseToken, value);
    default:
      return baseToken;
  }
}

/**
 * Extract implicit tokens from computed styles (values that should be tokens)
 */
function extractImplicitTokens(computedStyle: CSSStyleDeclaration): DesignToken[] {
  const tokens: DesignToken[] = [];

  // Color tokens
  const colorProperties = ['color', 'background-color', 'border-color', 'fill', 'stroke'];
  for (const prop of colorProperties) {
    const value = computedStyle.getPropertyValue(prop);
    if (value && isTokenizableColor(value)) {
      tokens.push(createImplicitColorToken(prop, value));
    }
  }

  // Typography tokens
  const fontSize = computedStyle.fontSize;
  const fontWeight = computedStyle.fontWeight;
  const lineHeight = computedStyle.lineHeight;
  const fontFamily = computedStyle.fontFamily;

  if (fontSize && isTokenizableFontSize(fontSize)) {
    tokens.push(createImplicitTypographyToken(fontSize, fontWeight, lineHeight, fontFamily));
  }

  // Spacing tokens
  const spacingProperties = ['margin', 'padding', 'gap'];
  for (const prop of spacingProperties) {
    const value = computedStyle.getPropertyValue(prop);
    if (value && isTokenizableSpacing(value)) {
      tokens.push(createImplicitSpacingToken(prop, value));
    }
  }

  return tokens;
}

/**
 * Infer token type from name and value
 */
function inferTokenType(name: string, value: string): DesignTokenType | null {
  const lowerName = name.toLowerCase();
  
  if (lowerName.includes('color') || lowerName.includes('bg') || lowerName.includes('border')) {
    if (isColorValue(value)) return 'color';
  }
  
  if (lowerName.includes('font') || lowerName.includes('text') || lowerName.includes('type')) {
    return 'typography';
  }
  
  if (lowerName.includes('space') || lowerName.includes('gap') || lowerName.includes('margin') || lowerName.includes('padding')) {
    if (isSizeValue(value)) return 'spacing';
  }
  
  if (lowerName.includes('size') || lowerName.includes('width') || lowerName.includes('height')) {
    if (isSizeValue(value)) return 'size';
  }
  
  if (lowerName.includes('shadow')) {
    return 'shadow';
  }
  
  if (lowerName.includes('border') && !isColorValue(value)) {
    return 'border';
  }
  
  // Fallback: try to infer from value
  if (isColorValue(value)) return 'color';
  if (isSizeValue(value)) return 'spacing';
  
  return null;
}

/**
 * Infer token category from name
 */
function inferTokenCategory(name: string): string {
  const lowerName = name.toLowerCase();
  
  if (lowerName.includes('primary')) return 'primary';
  if (lowerName.includes('secondary')) return 'secondary';
  if (lowerName.includes('neutral') || lowerName.includes('gray')) return 'neutral';
  if (lowerName.includes('success') || lowerName.includes('error') || lowerName.includes('warning')) return 'semantic';
  
  return 'custom';
}

/**
 * Create color token with color-specific properties
 */
function createColorToken(baseToken: DesignToken, value: string): ColorToken {
  const { hex, rgb, hsl } = convertColor(value);
  
  return {
    ...baseToken,
    type: 'color',
    hex,
    rgb,
    hsl,
  } as ColorToken;
}

/**
 * Create typography token with typography-specific properties
 */
function createTypographyToken(baseToken: DesignToken, value: string): TypographyToken {
  // Parse typography value (could be composite like "16px/1.5 Arial")
  const parsed = parseTypographyValue(value);
  
  return {
    ...baseToken,
    type: 'typography',
    fontSize: parsed.fontSize || '16px',
    fontWeight: parsed.fontWeight || 'normal',
    lineHeight: parsed.lineHeight || 'normal',
    fontFamily: parsed.fontFamily || 'inherit',
    letterSpacing: parsed.letterSpacing,
  } as TypographyToken;
}

/**
 * Create spacing token with spacing-specific properties
 */
function createSpacingToken(baseToken: DesignToken, value: string): SpacingToken {
  const pixels = parsePixelValue(value);
  const rem = pixels ? pixels / 16 : 0; // Assuming 16px = 1rem
  
  return {
    ...baseToken,
    type: 'spacing',
    pixels: pixels || 0,
    rem,
    scale: calculateSpacingScale(pixels || 0),
  } as SpacingToken;
}

/**
 * Create implicit color token from computed style
 */
function createImplicitColorToken(property: string, value: string): ColorToken {
  const { hex, rgb, hsl } = convertColor(value);
  
  return {
    id: generateId(),
    name: `implicit-${property}`,
    value,
    type: 'color',
    category: 'custom',
    usageCount: 1,
    isValid: true,
    hex,
    rgb,
    hsl,
  };
}

/**
 * Create implicit typography token
 */
function createImplicitTypographyToken(
  fontSize: string, 
  fontWeight: string, 
  lineHeight: string, 
  fontFamily: string
): TypographyToken {
  return {
    id: generateId(),
    name: 'implicit-typography',
    value: `${fontSize}/${lineHeight} ${fontFamily}`,
    type: 'typography',
    category: 'custom',
    usageCount: 1,
    isValid: true,
    fontSize,
    fontWeight,
    lineHeight,
    fontFamily,
  };
}

/**
 * Create implicit spacing token
 */
function createImplicitSpacingToken(property: string, value: string): SpacingToken {
  const pixels = parsePixelValue(value);
  const rem = pixels ? pixels / 16 : 0;
  
  return {
    id: generateId(),
    name: `implicit-${property}`,
    value,
    type: 'spacing',
    category: 'custom',
    usageCount: 1,
    isValid: true,
    pixels: pixels || 0,
    rem,
    scale: calculateSpacingScale(pixels || 0),
  };
}

/**
 * Validate token value
 */
function validateTokenValue(value: string, type: DesignTokenType): boolean {
  switch (type) {
    case 'color':
      return isColorValue(value);
    case 'spacing':
    case 'size':
      return isSizeValue(value);
    case 'typography':
      return isTypographyValue(value);
    default:
      return true;
  }
}

/**
 * Validate token and return violations
 */
function validateToken(name: string, value: string, type: DesignTokenType): string[] {
  const violations: string[] = [];
  
  if (!validateTokenValue(value, type)) {
    violations.push(`Invalid ${type} value: ${value}`);
  }
  
  // Add naming convention checks
  if (!name.startsWith('--')) {
    violations.push('Token name should start with --');
  }
  
  // Add type-specific validations
  switch (type) {
    case 'color':
      if (!isAccessibleColor(value)) {
        violations.push('Color may have accessibility issues');
      }
      break;
    case 'spacing':
      if (!isConsistentSpacing(value)) {
        violations.push('Spacing value does not follow consistent scale');
      }
      break;
  }
  
  return violations;
}

/**
 * Utility functions for value validation
 */
function isColorValue(value: string): boolean {
  return /^(#|rgb|hsl|var\(--)/i.test(value) || CSS.supports('color', value);
}

function isSizeValue(value: string): boolean {
  return /^\d+(\.\d+)?(px|em|rem|%|vh|vw)$/.test(value);
}

function isTypographyValue(value: string): boolean {
  // Simple check - could be more sophisticated
  return /\d+(px|em|rem|pt)/.test(value) || value.includes('font-');
}

function isTokenizableColor(value: string): boolean {
  // Avoid transparent and very common colors that shouldn't be tokenized
  const commonColors = ['transparent', 'inherit', 'currentColor'];
  return !commonColors.includes(value) && isColorValue(value);
}

function isTokenizableFontSize(value: string): boolean {
  const pixels = parsePixelValue(value);
  // Only tokenize reasonable font sizes
  return pixels !== null && pixels >= 8 && pixels <= 72;
}

function isTokenizableSpacing(value: string): boolean {
  const pixels = parsePixelValue(value);
  // Only tokenize reasonable spacing values
  return pixels !== null && pixels >= 0 && pixels <= 200;
}

function isAccessibleColor(_value: string): boolean {
  // Simplified accessibility check - would need proper contrast calculation
  return true;
}

function isConsistentSpacing(value: string): boolean {
  const pixels = parsePixelValue(value);
  if (!pixels) return false;
  
  // Check if it's a multiple of common scale (4px, 8px)
  return pixels % 4 === 0;
}

/**
 * Color conversion utilities
 */
function convertColor(value: string): { hex: string; rgb: string; hsl: string } {
  // Create a temporary element to get computed color
  const tempDiv = document.createElement('div');
  tempDiv.style.color = value;
  document.body.appendChild(tempDiv);
  
  const computed = window.getComputedStyle(tempDiv).color;
  document.body.removeChild(tempDiv);
  
  // Parse RGB and convert to other formats
  const rgbMatch = computed.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (rgbMatch) {
    const [, r, g, b] = rgbMatch.map(Number);
    const hex = `#${[r, g, b].map(x => x.toString(16).padStart(2, '0')).join('')}`;
    const hsl = rgbToHsl(r, g, b);
    return {
      hex,
      rgb: computed,
      hsl: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`,
    };
  }
  
  return { hex: value, rgb: value, hsl: value };
}

/**
 * Parse typography value
 */
function parseTypographyValue(value: string): {
  fontSize?: string;
  fontWeight?: string;
  lineHeight?: string;
  fontFamily?: string;
  letterSpacing?: string;
} {
  // Simple parsing - could be more sophisticated
  const parts = value.split(/\s+/);
  
  return {
    fontSize: parts.find(p => /\d+(px|em|rem|pt)/.test(p)),
    fontFamily: parts.find(p => /[a-zA-Z]/.test(p) && !/\d/.test(p)),
  };
}

/**
 * Parse pixel value from CSS value
 */
function parsePixelValue(value: string): number | null {
  const match = value.match(/^(\d+(?:\.\d+)?)px$/);
  return match ? parseFloat(match[1]) : null;
}

/**
 * Calculate spacing scale position
 */
function calculateSpacingScale(pixels: number): number {
  if (pixels === 0) return 0;
  
  // Common spacing scales: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96
  const scale = [0, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96];
  
  for (let i = 0; i < scale.length; i++) {
    if (pixels <= scale[i]) {
      return i;
    }
  }
  
  return Math.ceil(pixels / 8); // Fallback
}

/**
 * Convert RGB to HSL
 */
function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255;
  g /= 255;
  b /= 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  
  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}