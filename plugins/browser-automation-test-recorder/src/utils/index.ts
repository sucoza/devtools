/**
 * Utility functions for browser automation test recorder
 */

import type { RecordedEvent, EventType, SelectorOptions } from '../types';

/**
 * Generate unique ID with timestamp and random component
 */
export function generateId(prefix: string = 'id'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Debounce function calls
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  immediate: boolean = false
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };
    
    const callNow = immediate && !timeout;
    
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    
    if (callNow) func(...args);
  };
}

/**
 * Throttle function calls
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false;
  
  return function executedFunction(this: any, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Escape CSS selector special characters
 */
export function escapeCSSSelector(str: string): string {
  return str.replace(/[!"#$%&'()*+,.\/:;<=>?@[\\\]^`{|}~]/g, '\\$&');
}

/**
 * Get element's position relative to document
 */
export function getElementPosition(element: Element): { x: number; y: number } {
  const rect = element.getBoundingClientRect();
  return {
    x: rect.left + window.scrollX,
    y: rect.top + window.scrollY,
  };
}

/**
 * Get element's computed style property
 */
export function getComputedStyleProperty(element: Element, property: string): string {
  return window.getComputedStyle(element).getPropertyValue(property);
}

/**
 * Check if element is visible
 */
export function isElementVisible(element: Element): boolean {
  const rect = element.getBoundingClientRect();
  const style = window.getComputedStyle(element);
  
  return (
    rect.width > 0 &&
    rect.height > 0 &&
    style.visibility !== 'hidden' &&
    style.display !== 'none' &&
    parseFloat(style.opacity) > 0
  );
}

/**
 * Get element's text content, trimmed and normalized
 */
export function getElementText(element: Element): string {
  const textContent = element.textContent;
  return textContent ? textContent.trim().replace(/\s+/g, ' ') : '';
}

/**
 * Check if element is in viewport
 */
export function isElementInViewport(element: Element): boolean {
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

/**
 * Get element's parent form if exists
 */
export function getParentForm(element: Element): HTMLFormElement | null {
  return element.closest('form');
}

/**
 * Get all form elements within a form
 */
export function getFormElements(form: HTMLFormElement): HTMLElement[] {
  return Array.from(form.elements) as HTMLElement[];
}

/**
 * Check if element is form control
 */
export function isFormControl(element: Element): boolean {
  const formTags = ['input', 'textarea', 'select', 'button'];
  return formTags.includes(element.tagName.toLowerCase());
}

/**
 * Get element's ARIA role
 */
export function getAriaRole(element: Element): string | null {
  return element.getAttribute('role') || getImplicitAriaRole(element);
}

/**
 * Get implicit ARIA role based on element tag
 */
export function getImplicitAriaRole(element: Element): string | null {
  const tagName = element.tagName.toLowerCase();
  const roleMap: Record<string, string> = {
    'button': 'button',
    'a': element.hasAttribute('href') ? 'link' : null,
    'img': 'img',
    'input': getInputRole(element as HTMLInputElement),
    'textarea': 'textbox',
    'select': element.hasAttribute('multiple') ? 'listbox' : 'combobox',
    'nav': 'navigation',
    'main': 'main',
    'header': 'banner',
    'footer': 'contentinfo',
    'aside': 'complementary',
    'section': 'region',
    'article': 'article',
    'h1': 'heading',
    'h2': 'heading',
    'h3': 'heading',
    'h4': 'heading',
    'h5': 'heading',
    'h6': 'heading',
  };
  
  return roleMap[tagName] || null;
}

/**
 * Get input element's implicit role
 */
function getInputRole(input: HTMLInputElement): string {
  const type = input.type.toLowerCase();
  const roleMap: Record<string, string> = {
    'button': 'button',
    'submit': 'button',
    'reset': 'button',
    'checkbox': 'checkbox',
    'radio': 'radio',
    'range': 'slider',
    'search': 'searchbox',
    'email': 'textbox',
    'tel': 'textbox',
    'url': 'textbox',
    'password': 'textbox',
    'text': 'textbox',
  };
  
  return roleMap[type] || 'textbox';
}

/**
 * Format duration in human-readable format
 */
export function formatDuration(milliseconds: number): string {
  if (milliseconds < 1000) {
    return `${milliseconds}ms`;
  }
  
  const seconds = Math.floor(milliseconds / 1000);
  if (seconds < 60) {
    return `${seconds}s`;
  }
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  if (minutes < 60) {
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  return `${hours}h ${remainingMinutes}m`;
}

/**
 * Format file size in human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

/**
 * Sanitize filename for safe file system usage
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[<>:"/\\|?*]/g, '_')
    .replace(/\s+/g, '_')
    .toLowerCase();
}

/**
 * Check if current environment supports required APIs
 */
export function checkBrowserSupport(): {
  supported: boolean;
  missing: string[];
} {
  const requiredAPIs = [
    'MutationObserver',
    'PerformanceObserver',
    'IntersectionObserver',
    'querySelector',
    'getBoundingClientRect',
  ];
  
  const missing: string[] = [];
  
  for (const api of requiredAPIs) {
    if (!(api in window) && !(api in document)) {
      missing.push(api);
    }
  }
  
  return {
    supported: missing.length === 0,
    missing,
  };
}

/**
 * Get browser information
 */
export function getBrowserInfo(): {
  name: string;
  version: string;
  userAgent: string;
} {
  const ua = navigator.userAgent;
  
  let name = 'Unknown';
  let version = 'Unknown';
  
  if (ua.includes('Chrome')) {
    name = 'Chrome';
    const match = ua.match(/Chrome\/(\d+\.\d+)/);
    if (match) version = match[1];
  } else if (ua.includes('Firefox')) {
    name = 'Firefox';
    const match = ua.match(/Firefox\/(\d+\.\d+)/);
    if (match) version = match[1];
  } else if (ua.includes('Safari') && !ua.includes('Chrome')) {
    name = 'Safari';
    const match = ua.match(/Version\/(\d+\.\d+)/);
    if (match) version = match[1];
  } else if (ua.includes('Edge')) {
    name = 'Edge';
    const match = ua.match(/Edge\/(\d+\.\d+)/);
    if (match) version = match[1];
  }
  
  return {
    name,
    version,
    userAgent: ua,
  };
}

/**
 * Deep clone object (for simple objects without functions)
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  if (obj instanceof Date) {
    return new Date(obj.getTime()) as any;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => deepClone(item)) as any;
  }
  
  const cloned: any = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      cloned[key] = deepClone(obj[key]);
    }
  }
  
  return cloned;
}

/**
 * Create CSS selector string from parts
 */
export function createCSSSelector(parts: Array<{
  tag?: string;
  id?: string;
  classes?: string[];
  attributes?: Record<string, string>;
  pseudoSelectors?: string[];
}>): string {
  return parts.map(part => {
    let selector = part.tag || '';
    
    if (part.id) {
      selector += `#${escapeCSSSelector(part.id)}`;
    }
    
    if (part.classes && part.classes.length > 0) {
      selector += part.classes
        .map(cls => `.${escapeCSSSelector(cls)}`)
        .join('');
    }
    
    if (part.attributes) {
      selector += Object.entries(part.attributes)
        .map(([key, value]) => `[${key}="${escapeCSSSelector(value)}"]`)
        .join('');
    }
    
    if (part.pseudoSelectors && part.pseudoSelectors.length > 0) {
      selector += part.pseudoSelectors.join('');
    }
    
    return selector;
  }).join(' > ');
}

/**
 * Validate event data structure
 */
export function validateEvent(event: Partial<RecordedEvent>): string[] {
  const errors: string[] = [];
  
  if (!event.id) {
    errors.push('Event must have an id');
  }
  
  if (!event.type) {
    errors.push('Event must have a type');
  }
  
  if (typeof event.timestamp !== 'number') {
    errors.push('Event must have a valid timestamp');
  }
  
  if (!event.target || !event.target.selector) {
    errors.push('Event must have a target with selector');
  }
  
  if (!event.data) {
    errors.push('Event must have data');
  }
  
  return errors;
}

/**
 * Convert event to test step description
 */
export function eventToTestStep(event: RecordedEvent): string {
  switch (event.type) {
    case 'click':
      return `Click on ${getElementDescription(event.target)}`;
    
    case 'input':
      const inputData = event.data as any;
      return `Type "${inputData.inputValue}" into ${getElementDescription(event.target)}`;
    
    case 'change':
      const changeData = event.data as any;
      return `Change ${getElementDescription(event.target)} to "${changeData.value}"`;
    
    case 'navigation':
      const navData = event.data as any;
      return `Navigate to ${navData.url}`;
    
    case 'wait':
      const waitData = event.data as any;
      return `Wait ${waitData.duration}ms for ${waitData.condition}`;
    
    default:
      return `${event.type} on ${getElementDescription(event.target)}`;
  }
}

/**
 * Get human-readable element description
 */
function getElementDescription(target: any): string {
  if (target.textContent) {
    return `"${target.textContent.substring(0, 30)}${target.textContent.length > 30 ? '...' : ''}"`;
  }
  
  if (target.id) {
    return `element with id "${target.id}"`;
  }
  
  if (target.name) {
    return `element with name "${target.name}"`;
  }
  
  return `${target.tagName} element`;
}