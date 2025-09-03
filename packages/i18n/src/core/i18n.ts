/**
 * Core I18n implementation
 */

import type {
  I18nConfig,
  I18nInstance,
  Translation,
  Translations,
  TranslationValue,
  LanguageInfo,
  TranslationUsage,
  I18nEvents,
  EventListener
} from '../types';
import { interpolateString, resolvePath, pluralize } from '../utils';

/** Default configuration */
const DEFAULT_CONFIG: I18nConfig = {
  locale: 'en',
  fallbackLocale: 'en',
  devtools: process.env.NODE_ENV === 'development',
  interpolation: {
    prefix: '{{',
    suffix: '}}'
  },
  defaultNamespace: 'common',
  pluralization: {
    enabled: true
  },
  debug: process.env.NODE_ENV === 'development'
};

/** I18n class implementation */
export class I18n implements I18nInstance {
  private _config: I18nConfig;
  private _translations: Translations = {};
  private _localeInfo: Map<string, LanguageInfo> = new Map();
  private _usage: Map<string, TranslationUsage> = new Map();
  private _missing: Set<string> = new Set();
  private _listeners: Map<string, Set<EventListener>> = new Map();

  constructor(config: Partial<I18nConfig> = {}) {
    this._config = { ...DEFAULT_CONFIG, ...config };
    this.initializeDefaults();
  }

  /** Initialize default locale info */
  private initializeDefaults(): void {
    this.addLocale(this._config.locale, {
      code: this._config.locale,
      name: this._config.locale.toUpperCase(),
      nativeName: this._config.locale.toUpperCase(),
      direction: 'ltr'
    });

    if (this._config.fallbackLocale !== this._config.locale) {
      this.addLocale(this._config.fallbackLocale, {
        code: this._config.fallbackLocale,
        name: this._config.fallbackLocale.toUpperCase(),
        nativeName: this._config.fallbackLocale.toUpperCase(),
        direction: 'ltr'
      });
    }
  }

  /** Get current configuration */
  get config(): I18nConfig {
    return { ...this._config };
  }

  /** Get current locale */
  get locale(): string {
    return this._config.locale;
  }

  /** Get available locales */
  get locales(): string[] {
    return Array.from(this._localeInfo.keys());
  }

  /** Get translation */
  t(key: string, options: {
    interpolation?: Record<string, TranslationValue>;
    count?: number;
    context?: string;
    defaultValue?: string;
    namespace?: string;
  } = {}): string {
    const namespace = options.namespace || this._config.defaultNamespace;
    const fullKey = namespace ? `${namespace}:${key}` : key;
    const locale = this._config.locale;

    // Track usage
    this.trackUsage(fullKey, namespace);

    // Emit access event
    this.emit('translation:access', {
      key: fullKey,
      namespace,
      locale,
      value: '',
      interpolation: options.interpolation,
      timestamp: Date.now()
    });

    // Try to get translation
    let translation = this.getTranslationValue(key, locale, namespace);

    // Handle pluralization
    if (translation && typeof options.count === 'number' && this._config.pluralization?.enabled) {
      translation = pluralize(translation, options.count, locale);
    }

    // Handle contextual translations
    if (translation && options.context) {
      const contextKey = `${key}_${options.context}`;
      const contextTranslation = this.getTranslationValue(contextKey, locale, namespace);
      if (contextTranslation) {
        translation = contextTranslation;
      }
    }

    // Fallback to fallback locale
    if (!translation && locale !== this._config.fallbackLocale) {
      translation = this.getTranslationValue(key, this._config.fallbackLocale, namespace);
    }

    // Use default value or missing key handler
    if (!translation) {
      const missingKey = fullKey;
      this._missing.add(missingKey);
      
      this.emit('translation:missing', {
        key: fullKey,
        namespace,
        locale,
        fallbackValue: options.defaultValue,
        timestamp: Date.now()
      });

      if (this._config.missingKeyHandler) {
        translation = this._config.missingKeyHandler(key, locale, namespace);
      } else {
        translation = options.defaultValue || key;
      }

      if (this._config.debug) {
        console.warn(`[I18n] Missing translation: ${missingKey}`);
      }
    }

    // Handle interpolation
    if (translation && options.interpolation) {
      translation = interpolateString(
        translation,
        options.interpolation,
        this._config.interpolation?.prefix || '{{',
        this._config.interpolation?.suffix || '}}'
      );
    }

    return translation || key;
  }

  /** Get translation value from translations object */
  private getTranslationValue(key: string, locale: string, namespace?: string): string | null {
    const translations = this._translations[locale];
    if (!translations) return null;

    let target = translations;
    
    // Navigate to namespace if provided
    if (namespace && target[namespace]) {
      target = target[namespace] as Translation;
    }

    // Get nested value
    const value = resolvePath(target, key);
    return typeof value === 'string' ? value : null;
  }

  /** Check if translation exists */
  exists(key: string, options: { namespace?: string; locale?: string } = {}): boolean {
    const locale = options.locale || this._config.locale;
    const namespace = options.namespace || this._config.defaultNamespace;
    return this.getTranslationValue(key, locale, namespace) !== null;
  }

  /** Set current locale */
  async setLocale(locale: string): Promise<void> {
    const oldLocale = this._config.locale;
    if (oldLocale === locale) return;

    // Add locale if it doesn't exist
    if (!this._localeInfo.has(locale)) {
      this.addLocale(locale, {
        code: locale,
        name: locale.toUpperCase(),
        nativeName: locale.toUpperCase(),
        direction: 'ltr'
      });
    }

    this._config.locale = locale;

    this.emit('locale:change', {
      from: oldLocale,
      to: locale,
      timestamp: Date.now()
    });

    if (this._config.debug) {
      console.log(`[I18n] Locale changed from ${oldLocale} to ${locale}`);
    }
  }

  /** Add translations for a locale */
  addTranslations(locale: string, translations: Translation, namespace?: string): void {
    if (!this._translations[locale]) {
      this._translations[locale] = {};
    }

    const target = this._translations[locale];
    let keyCount = 0;

    if (namespace) {
      if (!target[namespace]) {
        target[namespace] = {};
      }
      Object.assign(target[namespace] as Translation, translations);
      keyCount = Object.keys(translations).length;
    } else {
      Object.assign(target, translations);
      keyCount = Object.keys(translations).length;
    }

    // Update locale info
    this.updateLocaleStats(locale);

    this.emit('translations:loaded', {
      locale,
      namespace,
      count: keyCount,
      timestamp: Date.now()
    });

    if (this._config.debug) {
      console.log(`[I18n] Added ${keyCount} translations for ${locale}${namespace ? ` (${namespace})` : ''}`);
    }
  }

  /** Remove translations */
  removeTranslations(locale: string, namespace?: string): void {
    if (!this._translations[locale]) return;

    if (namespace) {
      delete this._translations[locale][namespace];
    } else {
      delete this._translations[locale];
    }

    this.updateLocaleStats(locale);
  }

  /** Get all translations for a locale */
  getTranslations(locale?: string, namespace?: string): Translation {
    const targetLocale = locale || this._config.locale;
    const translations = this._translations[targetLocale] || {};

    if (namespace && translations[namespace]) {
      return translations[namespace] as Translation;
    }

    return translations;
  }

  /** Add a new locale */
  addLocale(locale: string, info?: Partial<LanguageInfo>): void {
    const localeInfo: LanguageInfo = {
      code: locale,
      name: locale.toUpperCase(),
      nativeName: locale.toUpperCase(),
      direction: 'ltr',
      completeness: 0,
      totalKeys: 0,
      translatedKeys: 0,
      missingKeys: [],
      ...info
    };

    this._localeInfo.set(locale, localeInfo);
    this.updateLocaleStats(locale);
  }

  /** Remove a locale */
  removeLocale(locale: string): void {
    if (locale === this._config.locale || locale === this._config.fallbackLocale) {
      throw new Error(`Cannot remove active or fallback locale: ${locale}`);
    }

    this._localeInfo.delete(locale);
    delete this._translations[locale];
  }

  /** Get locale information */
  getLocaleInfo(locale?: string): LanguageInfo | undefined {
    const targetLocale = locale || this._config.locale;
    return this._localeInfo.get(targetLocale);
  }

  /** Get all locale information */
  getAllLocales(): LanguageInfo[] {
    return Array.from(this._localeInfo.values());
  }

  /** Update locale statistics */
  private updateLocaleStats(locale: string): void {
    const info = this._localeInfo.get(locale);
    if (!info) return;

    const translations = this._translations[locale] || {};
    const totalKeys = this.countKeys(translations);
    const translatedKeys = totalKeys; // All loaded keys are considered translated
    
    info.totalKeys = totalKeys;
    info.translatedKeys = translatedKeys;
    info.completeness = totalKeys > 0 ? Math.round((translatedKeys / totalKeys) * 100) : 0;
    info.missingKeys = Array.from(this._missing).filter(key => 
      !this.exists(key.split(':').pop() || key, { 
        locale, 
        namespace: key.includes(':') ? key.split(':')[0] : undefined 
      })
    );
  }

  /** Count keys in translation object */
  private countKeys(obj: any, prefix = ''): number {
    let count = 0;
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        count++;
      } else if (typeof value === 'object' && value !== null) {
        count += this.countKeys(value, prefix ? `${prefix}.${key}` : key);
      }
    }
    return count;
  }

  /** Get missing translation keys */
  getMissingKeys(locale?: string): string[] {
    if (locale) {
      const info = this._localeInfo.get(locale);
      return info?.missingKeys || [];
    }
    return Array.from(this._missing);
  }

  /** Track translation usage */
  private trackUsage(key: string, namespace?: string): void {
    const usageKey = namespace ? `${namespace}:${key}` : key;
    const existing = this._usage.get(usageKey);
    const now = Date.now();

    if (existing) {
      existing.count++;
      existing.lastUsed = now;
    } else {
      this._usage.set(usageKey, {
        key,
        namespace,
        usedBy: [],
        count: 1,
        lastUsed: now,
        firstUsed: now
      });
    }
  }

  /** Get translation usage statistics */
  getUsageStats(): TranslationUsage[] {
    return Array.from(this._usage.values());
  }

  /** Add event listener */
  on<K extends keyof I18nEvents>(event: K, listener: EventListener<I18nEvents[K]>): () => void {
    if (!this._listeners.has(event)) {
      this._listeners.set(event, new Set());
    }
    this._listeners.get(event)!.add(listener);

    // Return unsubscribe function
    return () => {
      this.off(event, listener);
    };
  }

  /** Remove event listener */
  off<K extends keyof I18nEvents>(event: K, listener: EventListener<I18nEvents[K]>): void {
    const listeners = this._listeners.get(event);
    if (listeners) {
      listeners.delete(listener);
    }
  }

  /** Emit event */
  emit<K extends keyof I18nEvents>(event: K, data: I18nEvents[K]): void {
    const listeners = this._listeners.get(event);
    if (listeners && this._config.devtools) {
      listeners.forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          console.error(`[I18n] Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  /** Clear all translations */
  clear(): void {
    this._translations = {};
    this._usage.clear();
    this._missing.clear();
    this._localeInfo.clear();
    this.initializeDefaults();
  }

  /** Get current state for debugging */
  getState() {
    return {
      config: this.config,
      locale: this.locale,
      translations: { ...this._translations },
      usage: this.getUsageStats(),
      missing: this.getMissingKeys()
    };
  }
}

/** Default i18n instance */
export const i18n = new I18n();