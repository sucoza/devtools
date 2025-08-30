/**
 * Utility functions for i18n DevTools
 */

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): T {
  let timeout: NodeJS.Timeout;
  return ((...args: any[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  }) as T;
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): T {
  let inThrottle: boolean;
  return ((...args: any[]) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  }) as T;
}

export function formatKeyPath(namespace: string, key: string): string {
  return `${namespace}:${key}`;
}

export function parseKeyPath(keyPath: string): { namespace: string; key: string } {
  const [namespace, ...keyParts] = keyPath.split(':');
  return {
    namespace: namespace || 'common',
    key: keyParts.join(':')
  };
}

export function deepMerge(target: any, source: any): any {
  const output = { ...target };
  
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach(key => {
      if (isObject(source[key])) {
        if (!(key in target)) {
          Object.assign(output, { [key]: source[key] });
        } else {
          output[key] = deepMerge(target[key], source[key]);
        }
      } else {
        Object.assign(output, { [key]: source[key] });
      }
    });
  }
  
  return output;
}

export function isObject(item: any): boolean {
  return item && typeof item === 'object' && !Array.isArray(item);
}

export function flattenObject(obj: any, prefix = ''): Record<string, any> {
  const flattened: Record<string, any> = {};
  
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const newKey = prefix ? `${prefix}.${key}` : key;
      
      if (isObject(obj[key])) {
        Object.assign(flattened, flattenObject(obj[key], newKey));
      } else {
        flattened[newKey] = obj[key];
      }
    }
  }
  
  return flattened;
}

export function unflattenObject(obj: Record<string, any>): any {
  const result: any = {};
  
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const keys = key.split('.');
      let current = result;
      
      for (let i = 0; i < keys.length - 1; i++) {
        const k = keys[i];
        if (!(k in current) || !isObject(current[k])) {
          current[k] = {};
        }
        current = current[k];
      }
      
      current[keys[keys.length - 1]] = obj[key];
    }
  }
  
  return result;
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

export function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function highlightText(text: string, query: string): string {
  if (!query.trim()) return text;
  
  const escapedQuery = escapeRegExp(query);
  const regex = new RegExp(`(${escapedQuery})`, 'gi');
  
  return text.replace(regex, '<mark>$1</mark>');
}

export function calculateTextWidth(text: string, fontSize: number = 12, _fontFamily: string = 'monospace'): number {
  // Rough estimation - in a real implementation you'd use canvas.measureText()
  const avgCharWidth = fontSize * 0.6;
  return text.length * avgCharWidth;
}

export function truncateText(text: string, maxLength: number, suffix: string = '...'): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - suffix.length) + suffix;
}

export function isRTLLanguage(languageCode: string): boolean {
  const rtlLanguages = [
    'ar', 'he', 'fa', 'ur', 'ps', 'sd', 'ug', 'yi', 
    'ji', 'iw', 'ku', 'ckb', 'dv', 'arc'
  ];
  return rtlLanguages.includes(languageCode.toLowerCase());
}

export function getLanguageDirection(languageCode: string): 'ltr' | 'rtl' {
  return isRTLLanguage(languageCode) ? 'rtl' : 'ltr';
}

export function sortByProperty<T>(array: T[], property: keyof T, direction: 'asc' | 'desc' = 'asc'): T[] {
  return array.sort((a, b) => {
    const aVal = a[property];
    const bVal = b[property];
    
    if (aVal < bVal) return direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return direction === 'asc' ? 1 : -1;
    return 0;
  });
}

export function groupBy<T>(array: T[], keyFn: (item: T) => string): Record<string, T[]> {
  return array.reduce((groups, item) => {
    const key = keyFn(item);
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(item);
    return groups;
  }, {} as Record<string, T[]>);
}

export function unique<T>(array: T[], keyFn?: (item: T) => any): T[] {
  if (!keyFn) {
    return [...new Set(array)];
  }
  
  const seen = new Set();
  return array.filter(item => {
    const key = keyFn(item);
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}