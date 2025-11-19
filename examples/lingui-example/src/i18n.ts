/**
 * LinguiJS i18n configuration and setup
 *
 * This file demonstrates how to set up LinguiJS in your application.
 */

import { i18n } from '@lingui/core';
import { detect, fromNavigator, fromStorage, fromUrl } from '@lingui/detect-locale';

/**
 * Available locales in the application
 */
export const LOCALES = {
  en: 'English',
  es: 'Español',
  fr: 'Français',
  de: 'Deutsch',
  ja: '日本語',
  zh: '中文',
} as const;

export type Locale = keyof typeof LOCALES;

/**
 * Default locale
 */
export const DEFAULT_LOCALE: Locale = 'en';

/**
 * Detect user's preferred locale from various sources
 */
export function detectLocale(): Locale {
  const detected = detect(
    // 1. Try to get locale from URL (?lang=en)
    fromUrl('lang'),
    // 2. Try to get locale from localStorage
    fromStorage('locale'),
    // 3. Try to get locale from browser settings
    fromNavigator(),
    // 4. Fallback to default
    DEFAULT_LOCALE
  );

  // Ensure the detected locale is supported
  return (detected && detected in LOCALES ? detected : DEFAULT_LOCALE) as Locale;
}

/**
 * Dynamically load locale catalog
 */
export async function loadCatalog(locale: Locale) {
  const { messages } = await import(
    `../../../locales/${locale}/messages.po`
  );

  i18n.load(locale, messages);
  i18n.activate(locale);
}

/**
 * Initialize i18n with the detected locale
 */
export async function initI18n() {
  const locale = detectLocale();
  await loadCatalog(locale);
  return locale;
}

/**
 * Change the current locale
 */
export async function setLocale(locale: Locale) {
  // Save to localStorage for persistence
  localStorage.setItem('locale', locale);

  // Load and activate the catalog
  await loadCatalog(locale);

  return locale;
}

/**
 * Get the current active locale
 */
export function getCurrentLocale(): Locale {
  return (i18n.locale || DEFAULT_LOCALE) as Locale;
}

// Export the i18n instance for use in components
export { i18n };
