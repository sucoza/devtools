/**
 * @sucoza/i18n - Lightweight, framework-agnostic internationalization utility
 * 
 * A simple yet powerful i18n solution that works with any JavaScript/TypeScript project.
 * Features built-in DevTools integration, pluralization, interpolation, and namespace support.
 * 
 * @example
 * ```typescript
 * import { i18n, createI18n } from '@sucoza/i18n';
 * 
 * // Using default instance
 * i18n.setLocale('en');
 * i18n.addTranslations('en', { greeting: 'Hello {{name}}!' });
 * console.log(i18n.t('greeting', { name: 'World' })); // "Hello World!"
 * 
 * // Creating custom instance
 * const myI18n = createI18n({
 *   locale: 'en',
 *   fallbackLocale: 'en',
 *   devtools: true
 * });
 * ```
 */

export * from './core/i18n';
export * from './types';
export * from './utils';

// Default instance for convenience
export { i18n } from './core/i18n';

// Factory function for creating custom instances
export { createI18n } from './core/factory';