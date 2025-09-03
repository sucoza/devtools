/**
 * Factory function for creating I18n instances
 */

import { I18n } from './i18n';
import type { I18nConfig, I18nInstance } from '../types';

/**
 * Create a new I18n instance with custom configuration
 * 
 * @param config - Configuration options
 * @returns New I18n instance
 * 
 * @example
 * ```typescript
 * const myI18n = createI18n({
 *   locale: 'es',
 *   fallbackLocale: 'en',
 *   devtools: true,
 *   debug: true
 * });
 * 
 * myI18n.addTranslations('es', {
 *   greeting: '¡Hola {{name}}!'
 * });
 * 
 * console.log(myI18n.t('greeting', { interpolation: { name: 'Mundo' } }));
 * // "¡Hola Mundo!"
 * ```
 */
export function createI18n(config: Partial<I18nConfig> = {}): I18nInstance {
  return new I18n(config);
}

/**
 * Create an I18n instance specifically configured for browser usage
 * 
 * @param config - Configuration options
 * @returns Browser-optimized I18n instance
 */
export function createBrowserI18n(config: Partial<I18nConfig> = {}): I18nInstance {
  const browserConfig: Partial<I18nConfig> = {
    locale: navigator.language.split('-')[0] || 'en',
    devtools: process.env.NODE_ENV === 'development',
    debug: process.env.NODE_ENV === 'development',
    ...config
  };

  return new I18n(browserConfig);
}

/**
 * Create an I18n instance specifically configured for Node.js usage
 * 
 * @param config - Configuration options
 * @returns Node.js-optimized I18n instance
 */
export function createNodeI18n(config: Partial<I18nConfig> = {}): I18nInstance {
  const nodeConfig: Partial<I18nConfig> = {
    locale: process.env.LANG?.split('.')[0]?.split('_')[0] || 'en',
    devtools: false, // Usually disabled in Node.js
    debug: process.env.NODE_ENV === 'development',
    ...config
  };

  return new I18n(nodeConfig);
}

/**
 * Create multiple I18n instances for different domains/contexts
 * 
 * @param configs - Object mapping instance names to configurations
 * @returns Object with named I18n instances
 * 
 * @example
 * ```typescript
 * const instances = createMultipleI18n({
 *   auth: { locale: 'en', defaultNamespace: 'auth' },
 *   common: { locale: 'en', defaultNamespace: 'common' },
 *   admin: { locale: 'en', defaultNamespace: 'admin' }
 * });
 * 
 * instances.auth.t('login'); // Uses 'auth' namespace
 * instances.common.t('save'); // Uses 'common' namespace
 * ```
 */
export function createMultipleI18n<T extends Record<string, Partial<I18nConfig>>>(
  configs: T
): Record<keyof T, I18nInstance> {
  const instances = {} as Record<keyof T, I18nInstance>;
  
  for (const [name, config] of Object.entries(configs)) {
    instances[name as keyof T] = createI18n(config);
  }
  
  return instances;
}