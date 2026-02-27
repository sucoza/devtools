/**
 * Utility functions for I18n
 */

import type { TranslationValue } from '../types';

/**
 * Interpolate variables in a string template
 * 
 * @param template - String template with placeholders
 * @param variables - Variables to interpolate
 * @param prefix - Placeholder prefix (default: '{{')
 * @param suffix - Placeholder suffix (default: '}}')
 * @returns Interpolated string
 * 
 * @example
 * ```typescript
 * interpolateString('Hello {{name}}!', { name: 'World' });
 * // "Hello World!"
 * 
 * interpolateString('Hello {name}!', { name: 'World' }, '{', '}');
 * // "Hello World!"
 * ```
 */
export function interpolateString(
  template: string,
  variables: Record<string, TranslationValue>,
  prefix = '{{',
  suffix = '}}'
): string {
  return template.replace(
    new RegExp(`${escapeRegExp(prefix)}\\s*([^${escapeRegExp(suffix)}]+)\\s*${escapeRegExp(suffix)}`, 'g'),
    (match, key) => {
      const trimmedKey = key.trim();
      const value = variables[trimmedKey];
      return value !== undefined ? String(value) : match;
    }
  );
}

/**
 * Escape special regex characters in a string
 */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Resolve nested object path
 * 
 * @param obj - Object to navigate
 * @param path - Dot-separated path
 * @returns Value at path or undefined
 * 
 * @example
 * ```typescript
 * const obj = { user: { profile: { name: 'John' } } };
 * resolvePath(obj, 'user.profile.name'); // "John"
 * resolvePath(obj, 'user.invalid.path'); // undefined
 * ```
 */
export function resolvePath(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => {
    return current && typeof current === 'object' ? current[key] : undefined;
  }, obj);
}

/**
 * Set nested object path
 * 
 * @param obj - Object to modify
 * @param path - Dot-separated path
 * @param value - Value to set
 * 
 * @example
 * ```typescript
 * const obj = {};
 * setPath(obj, 'user.profile.name', 'John');
 * // obj is now { user: { profile: { name: 'John' } } }
 * ```
 */
export function setPath(obj: any, path: string, value: any): void {
  const keys = path.split('.');
  const lastKey = keys.pop()!;
  
  let current = obj;
  for (const key of keys) {
    if (!(key in current) || typeof current[key] !== 'object' || current[key] === null) {
      current[key] = {};
    }
    current = current[key];
  }
  
  current[lastKey] = value;
}

/**
 * Pluralization rules for common languages
 */
const PLURALIZATION_RULES: Record<string, (n: number) => string> = {
  // English and most languages: 0/1 = singular, >1 = plural
  en: (n) => n === 1 ? '' : '_plural',
  
  // Russian, Ukrainian, etc.
  ru: (n) => {
    if (n % 10 === 1 && n % 100 !== 11) return '';
    if (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20)) return '_plural';
    return '_plural_many';
  },
  
  // Polish
  pl: (n) => {
    if (n === 1) return '';
    if (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20)) return '_plural';
    return '_plural_many';
  },
  
  // Arabic
  ar: (n) => {
    if (n === 0) return '_zero';
    if (n === 1) return '';
    if (n === 2) return '_two';
    if (n % 100 >= 3 && n % 100 <= 10) return '_few';
    if (n % 100 >= 11) return '_many';
    return '_plural';
  },
  
  // Japanese, Korean, Chinese, etc. - no pluralization
  ja: () => '',
  ko: () => '',
  zh: () => '',
  
  // French
  fr: (n) => n <= 1 ? '' : '_plural',
  
  // German
  de: (n) => n === 1 ? '' : '_plural',
  
  // Spanish
  es: (n) => n === 1 ? '' : '_plural'
};

/**
 * Handle pluralization for translation strings
 * 
 * @param translation - Base translation string
 * @param count - Number for pluralization
 * @param locale - Locale code
 * @returns Pluralized translation key suffix
 * 
 * @example
 * ```typescript
 * pluralize('item', 0, 'en'); // "item_plural"
 * pluralize('item', 1, 'en'); // "item"
 * pluralize('item', 5, 'en'); // "item_plural"
 * ```
 */
export function pluralize(translation: string, count: number, locale: string): string {
  const rule = PLURALIZATION_RULES[locale] || PLURALIZATION_RULES.en;
  const suffix = rule(count);
  
  // If there's a suffix, it means we need a pluralized version
  if (suffix) {
    return `${translation}${suffix}`;
  }
  
  return translation;
}

/**
 * Format numbers according to locale
 * 
 * @param num - Number to format
 * @param locale - Locale code
 * @param options - Intl.NumberFormat options
 * @returns Formatted number string
 * 
 * @example
 * ```typescript
 * formatNumber(1234.56, 'en-US'); // "1,234.56"
 * formatNumber(1234.56, 'de-DE'); // "1.234,56"
 * formatNumber(1234.56, 'en-US', { style: 'currency', currency: 'USD' }); // "$1,234.56"
 * ```
 */
export function formatNumber(
  num: number,
  locale: string,
  options?: Intl.NumberFormatOptions
): string {
  try {
    return new Intl.NumberFormat(locale, options).format(num);
  } catch {
    // Fallback to English if locale is not supported
    return new Intl.NumberFormat('en', options).format(num);
  }
}

/**
 * Format dates according to locale
 * 
 * @param date - Date to format
 * @param locale - Locale code
 * @param options - Intl.DateTimeFormat options
 * @returns Formatted date string
 * 
 * @example
 * ```typescript
 * const date = new Date('2023-12-25');
 * formatDate(date, 'en-US'); // "12/25/2023"
 * formatDate(date, 'de-DE'); // "25.12.2023"
 * formatDate(date, 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
 * // "Monday, December 25, 2023"
 * ```
 */
export function formatDate(
  date: Date,
  locale: string,
  options?: Intl.DateTimeFormatOptions
): string {
  try {
    return new Intl.DateTimeFormat(locale, options).format(date);
  } catch {
    // Fallback to English if locale is not supported
    return new Intl.DateTimeFormat('en', options).format(date);
  }
}

/**
 * Get relative time formatting
 * 
 * @param date - Target date
 * @param locale - Locale code
 * @param baseDate - Base date to compare against (defaults to now)
 * @returns Formatted relative time string
 * 
 * @example
 * ```typescript
 * const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
 * formatRelativeTime(yesterday, 'en'); // "1 day ago"
 * formatRelativeTime(yesterday, 'es'); // "hace 1 día"
 * ```
 */
export function formatRelativeTime(
  date: Date,
  locale: string,
  baseDate: Date = new Date()
): string {
  try {
    const formatter = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
    const diffInSeconds = Math.floor((date.getTime() - baseDate.getTime()) / 1000);
    
    const intervals = [
      { unit: 'year' as const, seconds: 31536000 },
      { unit: 'month' as const, seconds: 2592000 },
      { unit: 'day' as const, seconds: 86400 },
      { unit: 'hour' as const, seconds: 3600 },
      { unit: 'minute' as const, seconds: 60 },
      { unit: 'second' as const, seconds: 1 }
    ];
    
    for (const interval of intervals) {
      const count = Math.floor(Math.abs(diffInSeconds) / interval.seconds);
      if (count >= 1) {
        return formatter.format(diffInSeconds < 0 ? -count : count, interval.unit);
      }
    }
    
    return formatter.format(0, 'second');
  } catch {
    // Fallback for unsupported locales
    const diffInSeconds = Math.floor((date.getTime() - baseDate.getTime()) / 1000);
    const absDiff = Math.abs(diffInSeconds);
    
    if (absDiff < 60) return diffInSeconds < 0 ? `${absDiff} seconds ago` : `in ${absDiff} seconds`;
    if (absDiff < 3600) {
      const minutes = Math.floor(absDiff / 60);
      return diffInSeconds < 0 ? `${minutes} minutes ago` : `in ${minutes} minutes`;
    }
    if (absDiff < 86400) {
      const hours = Math.floor(absDiff / 3600);
      return diffInSeconds < 0 ? `${hours} hours ago` : `in ${hours} hours`;
    }
    
    const days = Math.floor(absDiff / 86400);
    return diffInSeconds < 0 ? `${days} days ago` : `in ${days} days`;
  }
}

/**
 * Detect if a locale uses RTL (Right-to-Left) text direction
 * 
 * @param locale - Locale code
 * @returns True if RTL, false if LTR
 */
export function isRTL(locale: string): boolean {
  const rtlLocales = [
    'ar', 'arc', 'dv', 'fa', 'ha', 'he', 'khw', 'ks', 'ku', 'ps', 'ur', 'yi'
  ];
  
  const lang = locale.split('-')[0].toLowerCase();
  return rtlLocales.includes(lang);
}

/**
 * Validate locale code format
 * 
 * @param locale - Locale code to validate
 * @returns True if valid locale format
 * 
 * @example
 * ```typescript
 * isValidLocale('en'); // true
 * isValidLocale('en-US'); // true
 * isValidLocale('zh-Hans-CN'); // true
 * isValidLocale('invalid'); // false (depends on system support)
 * ```
 */
export function isValidLocale(locale: string): boolean {
  try {
    new Intl.NumberFormat(locale);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get browser's preferred locales
 * 
 * @returns Array of locale codes in order of preference
 */
export function getBrowserLocales(): string[] {
  if (typeof navigator === 'undefined') return ['en'];
  
  const languages = navigator.languages || [navigator.language];
  return Array.from(new Set(languages.map(lang => lang.split('-')[0])));
}