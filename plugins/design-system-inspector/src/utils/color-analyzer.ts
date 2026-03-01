import type { ColorToken, ColorUsageItem } from '../types';
import { generateId } from './id-generator';

/**
 * Analyze color usage in design system
 */
export function analyzeColorUsage(element: Element, computedStyle: CSSStyleDeclaration): ColorToken[] {
  const colors: ColorToken[] = [];
  const colorProperties = [
    'color',
    'background-color',
    'border-color',
    'border-top-color',
    'border-right-color', 
    'border-bottom-color',
    'border-left-color',
    'outline-color',
    'text-decoration-color',
    'fill',
    'stroke',
  ];

  for (const property of colorProperties) {
    const value = computedStyle.getPropertyValue(property);
    if (value && isValidColor(value)) {
      const colorToken = createColorToken(property, value);
      if (colorToken) {
        colors.push(colorToken);
      }
    }
  }

  return colors;
}

/**
 * Create a color token from CSS property and value
 */
function createColorToken(property: string, value: string): ColorToken | null {
  if (!isValidColor(value)) return null;

  const normalizedColor = normalizeColor(value);
  const { hex, rgb, hsl } = convertColorFormats(normalizedColor);
  const category = inferColorCategory(property, value);
  
  return {
    id: generateId(),
    name: `${property}-color`,
    value: normalizedColor,
    type: 'color',
    category,
    description: `Color used for ${property}`,
    usageCount: 1,
    isValid: true,
    violations: [],
    hex,
    rgb,
    hsl,
    contrastRatio: calculateContrastRatio(normalizedColor),
    isAccessible: isAccessibleColor(normalizedColor),
  };
}

/**
 * Check if a value is a valid color
 */
function isValidColor(value: string): boolean {
  if (!value || value === 'transparent' || value === 'rgba(0, 0, 0, 0)') {
    return false;
  }

  // Check common color formats
  return (
    isHexColor(value) ||
    isRgbColor(value) ||
    isHslColor(value) ||
    isNamedColor(value) ||
    isCSSVariable(value)
  );
}

/**
 * Check if value is hex color
 */
function isHexColor(value: string): boolean {
  return /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/.test(value);
}

/**
 * Check if value is RGB/RGBA color
 */
function isRgbColor(value: string): boolean {
  return /^rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+(\s*,\s*[\d.]+)?\s*\)$/.test(value);
}

/**
 * Check if value is HSL/HSLA color
 */
function isHslColor(value: string): boolean {
  return /^hsla?\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%(\s*,\s*[\d.]+)?\s*\)$/.test(value);
}

/**
 * Check if value is named color
 */
function isNamedColor(value: string): boolean {
  const namedColors = [
    'black', 'white', 'red', 'green', 'blue', 'yellow', 'cyan', 'magenta',
    'gray', 'grey', 'orange', 'purple', 'brown', 'pink', 'lime', 'indigo',
    'violet', 'navy', 'teal', 'olive', 'maroon', 'silver', 'gold', 'beige',
    'tan', 'coral', 'salmon', 'crimson', 'azure', 'ivory', 'khaki', 'lavender',
    'plum', 'orchid', 'thistle', 'turquoise', 'wheat', 'snow', 'linen', 'ivory'
  ];
  
  return namedColors.includes(value.toLowerCase());
}

/**
 * Check if value is CSS variable
 */
function isCSSVariable(value: string): boolean {
  return value.startsWith('var(--') && value.endsWith(')');
}

/**
 * Normalize color value for comparison
 */
function normalizeColor(value: string): string {
  // If it's already a CSS variable, keep it as is
  if (isCSSVariable(value)) {
    return value;
  }

  // Use browser to normalize the color
  const div = document.createElement('div');
  div.style.color = value;
  document.body.appendChild(div);
  try {
    const computed = window.getComputedStyle(div).color;
    return computed || value;
  } finally {
    document.body.removeChild(div);
  }
}

/**
 * Convert color to different formats
 */
function convertColorFormats(value: string): { hex: string; rgb: string; hsl: string } {
  if (isCSSVariable(value)) {
    return { hex: value, rgb: value, hsl: value };
  }

  // Use canvas to convert color to RGB
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  const ctx = canvas.getContext('2d')!;
  
  ctx.fillStyle = value;
  ctx.fillRect(0, 0, 1, 1);
  
  const imageData = ctx.getImageData(0, 0, 1, 1);
  const [r, g, b, a] = imageData.data;
  
  const rgb = a < 255 ? `rgba(${r}, ${g}, ${b}, ${a/255})` : `rgb(${r}, ${g}, ${b})`;
  const hex = rgbToHex(r, g, b);
  const hsl = rgbToHsl(r, g, b);
  
  return { hex, rgb, hsl };
}

/**
 * Convert RGB to hex
 */
function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b].map(x => x.toString(16).padStart(2, '0')).join('')}`;
}

/**
 * Convert RGB to HSL
 */
function rgbToHsl(r: number, g: number, b: number): string {
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
  
  const hDeg = Math.round(h * 360);
  const sPercent = Math.round(s * 100);
  const lPercent = Math.round(l * 100);
  
  return `hsl(${hDeg}, ${sPercent}%, ${lPercent}%)`;
}

/**
 * Infer color category from property and value
 */
function inferColorCategory(property: string, value: string): string {
  const lowerValue = value.toLowerCase();
  
  // Check for semantic colors first
  if (lowerValue.includes('success') || lowerValue.includes('green')) return 'semantic';
  if (lowerValue.includes('error') || lowerValue.includes('danger') || lowerValue.includes('red')) return 'semantic';
  if (lowerValue.includes('warning') || lowerValue.includes('yellow') || lowerValue.includes('orange')) return 'semantic';
  if (lowerValue.includes('info') || lowerValue.includes('blue')) return 'semantic';
  
  // Check for primary colors
  if (lowerValue.includes('primary') || property === 'color' && isHighContrast(value)) return 'primary';
  
  // Check for secondary colors
  if (lowerValue.includes('secondary') || lowerValue.includes('accent')) return 'secondary';
  
  // Check for neutral colors
  if (lowerValue.includes('gray') || lowerValue.includes('grey') || 
      lowerValue.includes('neutral') || lowerValue.includes('background') ||
      isGrayish(value)) return 'neutral';
  
  return 'custom';
}

/**
 * Check if color is high contrast (likely primary text)
 */
function isHighContrast(value: string): boolean {
  const { rgb } = convertColorFormats(value);
  const match = rgb.match(/rgb\((\d+), (\d+), (\d+)\)/);
  
  if (match) {
    const [, r, g, b] = match.map(Number);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance < 0.2 || luminance > 0.8; // Very dark or very light
  }
  
  return false;
}

/**
 * Check if color is grayish
 */
function isGrayish(value: string): boolean {
  const { rgb } = convertColorFormats(value);
  const match = rgb.match(/rgb\((\d+), (\d+), (\d+)\)/);
  
  if (match) {
    const [, r, g, b] = match.map(Number);
    const diff = Math.max(r, g, b) - Math.min(r, g, b);
    return diff < 30; // Low color difference indicates grayish
  }
  
  return false;
}

/**
 * Calculate contrast ratio (simplified)
 */
function calculateContrastRatio(value: string): number {
  // Simplified contrast ratio calculation
  // In reality, this would need proper WCAG contrast calculation
  const { rgb } = convertColorFormats(value);
  const match = rgb.match(/rgb\((\d+), (\d+), (\d+)\)/);
  
  if (match) {
    const [, r, g, b] = match.map(Number);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    
    // Assume white background for simplicity
    const whiteLuminance = 1;
    const contrast = (Math.max(luminance, whiteLuminance) + 0.05) / 
                    (Math.min(luminance, whiteLuminance) + 0.05);
    
    return Math.round(contrast * 100) / 100;
  }
  
  return 1;
}

/**
 * Check if color is accessible
 */
function isAccessibleColor(value: string): boolean {
  const contrastRatio = calculateContrastRatio(value);
  return contrastRatio >= 4.5; // WCAG AA standard for normal text
}

/**
 * Analyze color palette from all colors found
 */
export function analyzeColorPalette(colors: ColorToken[]): {
  primary: ColorToken[];
  secondary: ColorToken[];
  neutral: ColorToken[];
  semantic: ColorToken[];
  custom: ColorToken[];
} {
  return {
    primary: colors.filter(c => c.category === 'primary'),
    secondary: colors.filter(c => c.category === 'secondary'),
    neutral: colors.filter(c => c.category === 'neutral'),
    semantic: colors.filter(c => c.category === 'semantic'),
    custom: colors.filter(c => c.category === 'custom'),
  };
}

/**
 * Get most used colors
 */
export function getMostUsedColors(colors: ColorToken[], limit = 10): ColorUsageItem[] {
  const colorMap = new Map<string, { token: ColorToken; count: number; elements: HTMLElement[] }>();
  
  for (const color of colors) {
    const key = color.value;
    if (colorMap.has(key)) {
      const existing = colorMap.get(key)!;
      existing.count += color.usageCount;
    } else {
      colorMap.set(key, {
        token: color,
        count: color.usageCount,
        elements: [], // Would need to track actual elements
      });
    }
  }
  
  return Array.from(colorMap.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
    .map(item => ({
      color: item.token.value,
      count: item.count,
      elements: item.elements,
      isToken: isCSSVariable(item.token.value),
      tokenName: isCSSVariable(item.token.value) ? extractVariableName(item.token.value) : undefined,
    }));
}

/**
 * Extract variable name from CSS variable
 */
function extractVariableName(value: string): string | undefined {
  const match = value.match(/var\((--[^)]+)\)/);
  return match ? match[1] : undefined;
}

/**
 * Generate color accessibility report
 */
export function generateAccessibilityReport(colors: ColorToken[]): {
  totalColors: number;
  accessibleColors: number;
  inaccessibleColors: ColorToken[];
  recommendations: string[];
} {
  const accessibleColors = colors.filter(c => c.isAccessible);
  const inaccessibleColors = colors.filter(c => !c.isAccessible);
  
  const recommendations: string[] = [];
  
  if (inaccessibleColors.length > 0) {
    recommendations.push(`${inaccessibleColors.length} colors may have accessibility issues`);
    recommendations.push('Consider using colors that meet WCAG AA contrast requirements (4.5:1)');
  }
  
  const lowContrastColors = colors.filter(c => c.contrastRatio && c.contrastRatio < 3);
  if (lowContrastColors.length > 0) {
    recommendations.push(`${lowContrastColors.length} colors have very low contrast ratios`);
  }
  
  return {
    totalColors: colors.length,
    accessibleColors: accessibleColors.length,
    inaccessibleColors,
    recommendations,
  };
}