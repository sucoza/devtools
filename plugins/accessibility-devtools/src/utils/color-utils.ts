import Color from 'colorjs.io';
import type { ColorContrastResult } from '../types';

/**
 * Calculate color contrast ratio using WCAG formula
 */
export function calculateContrastRatio(foreground: string, background: string): number {
  try {
    const fgColor = new Color(foreground);
    const bgColor = new Color(background);
    
    const fgLuminance = fgColor.luminance;
    const bgLuminance = bgColor.luminance;
    
    const lighter = Math.max(fgLuminance, bgLuminance);
    const darker = Math.min(fgLuminance, bgLuminance);
    
    return (lighter + 0.05) / (darker + 0.05);
  } catch {
    console.warn('Error calculating contrast ratio:', error);
    return 0;
  }
}

/**
 * Check WCAG contrast compliance
 */
export function checkWCAGCompliance(
  contrastRatio: number,
  fontSize: number,
  fontWeight: string | number = 'normal'
): {
  wcagAA: boolean;
  wcagAAA: boolean;
  largeTextAA: boolean;
  largeTextAAA: boolean;
} {
  const isLargeText = fontSize >= 18 || (fontSize >= 14 && isBoldWeight(fontWeight));
  
  const normalAA = contrastRatio >= 4.5;
  const normalAAA = contrastRatio >= 7;
  const largeAA = contrastRatio >= 3;
  const largeAAA = contrastRatio >= 4.5;
  
  return {
    wcagAA: isLargeText ? largeAA : normalAA,
    wcagAAA: isLargeText ? largeAAA : normalAAA,
    largeTextAA: largeAA,
    largeTextAAA: largeAAA,
  };
}

/**
 * Check if font weight is bold
 */
function isBoldWeight(fontWeight: string | number): boolean {
  if (typeof fontWeight === 'number') {
    return fontWeight >= 700;
  }
  return fontWeight === 'bold' || fontWeight === 'bolder' || parseInt(fontWeight) >= 700;
}

/**
 * Extract computed colors from element
 */
export function getElementColors(element: Element): {
  foreground: string;
  background: string;
} | null {
  try {
    const computed = window.getComputedStyle(element);
    const foreground = computed.color;
    let background = computed.backgroundColor;
    
    // If background is transparent, walk up the DOM tree
    if (background === 'rgba(0, 0, 0, 0)' || background === 'transparent') {
      background = getBackgroundColor(element);
    }
    
    return { foreground, background };
  } catch {
    console.warn('Error extracting colors:', error);
    return null;
  }
}

/**
 * Walk up DOM tree to find effective background color
 */
function getBackgroundColor(element: Element): string {
  let current = element.parentElement;
  
  while (current && current !== document.body) {
    const computed = window.getComputedStyle(current);
    const bgColor = computed.backgroundColor;
    
    if (bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent') {
      return bgColor;
    }
    
    current = current.parentElement;
  }
  
  // Default to white if no background found
  return '#ffffff';
}

/**
 * Get font size in pixels from computed style
 */
export function getFontSize(element: Element): number {
  const computed = window.getComputedStyle(element);
  return parseFloat(computed.fontSize);
}

/**
 * Get font weight from computed style
 */
export function getFontWeight(element: Element): string {
  const computed = window.getComputedStyle(element);
  return computed.fontWeight;
}

/**
 * Convert color to hex format
 */
export function toHex(color: string): string {
  try {
    const colorObj = new Color(color);
    return colorObj.toString({ format: 'hex' });
  } catch {
    return color;
  }
}

/**
 * Convert color to rgb format
 */
export function toRgb(color: string): string {
  try {
    const colorObj = new Color(color);
    return colorObj.toString({ format: 'rgb' });
  } catch {
    return color;
  }
}

/**
 * Generate accessible color suggestions
 */
export function suggestAccessibleColors(
  foreground: string,
  background: string,
  targetRatio: number = 4.5
): {
  foregroundSuggestions: string[];
  backgroundSuggestions: string[];
} {
  const suggestions = {
    foregroundSuggestions: [] as string[],
    backgroundSuggestions: [] as string[],
  };
  
  try {
    const fgColor = new Color(foreground);
    const bgColor = new Color(background);
    
    // Generate darker foreground variants
    for (let i = 0; i <= 1; i += 0.1) {
      const darker = fgColor.clone().set('lightness', i);
      const ratio = calculateContrastRatio(darker.toString(), background);
      if (ratio >= targetRatio) {
        suggestions.foregroundSuggestions.push(darker.toString({ format: 'hex' }));
      }
    }
    
    // Generate lighter background variants
    for (let i = 0; i <= 1; i += 0.1) {
      const lighter = bgColor.clone().set('lightness', i);
      const ratio = calculateContrastRatio(foreground, lighter.toString());
      if (ratio >= targetRatio) {
        suggestions.backgroundSuggestions.push(lighter.toString({ format: 'hex' }));
      }
    }
  } catch {
    console.warn('Error generating color suggestions:', error);
  }
  
  return suggestions;
}

/**
 * Analyze color contrast for all text elements in container
 */
export function analyzeColorContrast(container: Element = document.body): ColorContrastResult[] {
  const results: ColorContrastResult[] = [];
  
  // Find all elements with text content
  const textElements = container.querySelectorAll('*');
  
  textElements.forEach(element => {
    const text = element.textContent?.trim();
    if (!text) return;
    
    // Skip elements that are not visible
    const computed = window.getComputedStyle(element);
    if (computed.display === 'none' || computed.visibility === 'hidden') return;
    
    const colors = getElementColors(element);
    if (!colors) return;
    
    const fontSize = getFontSize(element);
    const fontWeight = getFontWeight(element);
    const contrastRatio = calculateContrastRatio(colors.foreground, colors.background);
    const compliance = checkWCAGCompliance(contrastRatio, fontSize, fontWeight);
    
    results.push({
      foregroundColor: colors.foreground,
      backgroundColor: colors.background,
      contrastRatio,
      ...compliance,
      element,
      selector: generateSelector(element),
    });
  });
  
  return results;
}

/**
 * Generate CSS selector for element
 */
function generateSelector(element: Element): string {
  if (element.id) {
    return `#${element.id}`;
  }
  
  if (element.className) {
    const classes = element.className.trim().split(/\s+/);
    return `.${classes.join('.')}`;
  }
  
  const tagName = element.tagName.toLowerCase();
  const parent = element.parentElement;
  
  if (parent) {
    const siblings = Array.from(parent.children).filter(el => el.tagName === element.tagName);
    if (siblings.length > 1) {
      const index = siblings.indexOf(element) + 1;
      return `${generateSelector(parent)} > ${tagName}:nth-child(${index})`;
    }
    return `${generateSelector(parent)} > ${tagName}`;
  }
  
  return tagName;
}

/**
 * Check if color is light or dark
 */
export function isLightColor(color: string): boolean {
  try {
    const colorObj = new Color(color);
    return colorObj.luminance > 0.5;
  } catch {
    return false;
  }
}

/**
 * Get text color recommendation based on background
 */
export function getRecommendedTextColor(backgroundColor: string): string {
  return isLightColor(backgroundColor) ? '#000000' : '#ffffff';
}

/**
 * Format contrast ratio for display
 */
export function formatContrastRatio(ratio: number): string {
  return `${ratio.toFixed(2)}:1`;
}

/**
 * Get contrast level description
 */
export function getContrastLevelDescription(ratio: number): string {
  if (ratio >= 7) return 'AAA (Enhanced)';
  if (ratio >= 4.5) return 'AA (Normal)';
  if (ratio >= 3) return 'AA Large Text';
  return 'Fail';
}