/**
 * Sucoza I18n adapter for I18n DevTools
 * Integrates with @sucoza/i18n utility to capture translation usage and state
 */

import type { I18nInstance, I18nEvents as SucozaI18nEvents } from '@sucoza/i18n';
import { i18nEventClient } from '../core/i18n-event-client';
import {
  I18nState,
  TranslationKey,
  Translation,
  LanguageInfo,
  NamespaceInfo,
  TranslationUsage,
  I18nPerformanceMetrics
} from '../types/i18n';

export class SucozaI18nAdapter {
  private i18n: I18nInstance;
  private isInitialized: boolean = false;
  private unsubscribers: Array<() => void> = [];

  constructor(i18nInstance: I18nInstance) {
    this.i18n = i18nInstance;
    this.initialize();
  }

  /**
   * Initialize adapter and set up event listeners
   */
  private initialize(): void {
    if (this.isInitialized) return;

    // Listen to locale changes
    const localeUnsubscribe = this.i18n.on('locale:change', (event) => {
      i18nEventClient.emit('i18n:language-change', {
        from: event.from,
        to: event.to,
        timestamp: event.timestamp
      });

      // Emit updated state
      this.emitState();
    });

    // Listen to translation access
    const accessUnsubscribe = this.i18n.on('translation:access', (event) => {
      const translationKey: TranslationKey = {
        key: event.key,
        namespace: event.namespace || 'common',
        defaultValue: '',
        interpolation: event.interpolation || {},
        usedAt: ['component'], // This would be enhanced with actual component tracking
        lastUsed: event.timestamp
      };

      i18nEventClient.emit('i18n:key-usage', {
        key: translationKey,
        component: 'unknown' // Would be enhanced with actual component detection
      });
    });

    // Listen to missing translations
    const missingUnsubscribe = this.i18n.on('translation:missing', (event) => {
      const translationKey: TranslationKey = {
        key: event.key,
        namespace: event.namespace || 'common',
        defaultValue: event.fallbackValue || '',
        usedAt: ['component'],
        lastUsed: event.timestamp
      };

      i18nEventClient.emit('i18n:missing-key', {
        key: translationKey,
        component: 'unknown'
      });
    });

    // Listen to translations loaded
    const loadedUnsubscribe = this.i18n.on('translations:loaded', (event) => {
      i18nEventClient.emit('i18n:bundle-loaded', {
        namespace: event.namespace || 'common',
        size: event.count * 50, // Rough estimate of bundle size
        loadTime: 0 // Would need to be measured separately
      });

      // Emit updated state
      this.emitState();
    });

    // Listen to translation updates
    const updateUnsubscribe = this.i18n.on('translation:updated', (event) => {
      i18nEventClient.emit('i18n:translation-updated', {
        namespace: event.namespace || 'common',
        key: event.key,
        value: event.newValue
      });

      // Emit updated state
      this.emitState();
    });

    this.unsubscribers.push(
      localeUnsubscribe,
      accessUnsubscribe,
      missingUnsubscribe,
      loadedUnsubscribe,
      updateUnsubscribe
    );

    this.isInitialized = true;

    // Emit initial state
    this.emitState();
  }

  /**
   * Emit current i18n state to DevTools
   */
  private emitState(): void {
    const state = this.getCurrentState();
    i18nEventClient.emit('i18n:state', state);
  }

  /**
   * Get current i18n state
   */
  getCurrentState(): I18nState {
    const locales = this.i18n.getAllLocales();
    const currentLocale = this.i18n.locale;
    const translations = this.i18n.getTranslations();
    const usage = this.i18n.getUsageStats();
    const missing = this.i18n.getMissingKeys();

    // Convert usage stats to translation keys
    const translationKeys: TranslationKey[] = usage.map(u => ({
      key: u.key,
      namespace: u.namespace || 'common',
      defaultValue: '',
      interpolation: {},
      usedAt: u.usedBy,
      lastUsed: u.lastUsed,
      count: u.count
    }));

    // Convert missing keys to translation keys
    const missingKeys: TranslationKey[] = missing.map(key => ({
      key,
      namespace: key.includes(':') ? key.split(':')[0] : 'common',
      defaultValue: '',
      interpolation: {},
      usedAt: [],
      lastUsed: Date.now()
    }));

    // Convert locale info
    const availableLanguages: LanguageInfo[] = locales.map(locale => ({
      code: locale.code,
      name: locale.name,
      nativeName: locale.nativeName,
      isRTL: locale.direction === 'rtl',
      completeness: locale.completeness || 0,
      totalKeys: locale.totalKeys || 0,
      translatedKeys: locale.translatedKeys || 0,
      missingKeys: locale.missingKeys || [],
      isDefault: locale.code === this.i18n.config.fallbackLocale,
      isActive: locale.code === currentLocale
    }));

    // Extract namespaces
    const namespaceSet = new Set<string>();
    translationKeys.forEach(key => {
      if (key.namespace) namespaceSet.add(key.namespace);
    });

    const namespaces: NamespaceInfo[] = Array.from(namespaceSet).map(name => ({
      name,
      keyCount: translationKeys.filter(k => k.namespace === name).length,
      completeness: 100, // Would need proper calculation
      lastUpdated: Date.now()
    }));

    // Convert translations
    const translationObjects: Translation[] = Object.entries(translations).map(([key, value]) => ({
      namespace: 'common', // Would need proper namespace detection
      key,
      value: String(value),
      interpolation: {},
      lastUpdated: Date.now(),
      locale: currentLocale
    }));

    return {
      currentLanguage: currentLocale,
      fallbackLanguage: this.i18n.config.fallbackLocale,
      availableLanguages,
      namespaces,
      translations: translationObjects,
      translationKeys,
      missingKeys,
      isLoading: false,
      lastUpdated: Date.now()
    };
  }

  /**
   * Change current language
   */
  async changeLanguage(language: string): Promise<void> {
    await this.i18n.setLocale(language);
  }

  /**
   * Update a translation
   */
  updateTranslation(namespace: string, key: string, value: string): void {
    const currentTranslations = this.i18n.getTranslations(this.i18n.locale, namespace);
    this.i18n.addTranslations(this.i18n.locale, {
      ...currentTranslations,
      [key]: value
    }, namespace);
  }

  /**
   * Add a translation key
   */
  addTranslationKey(
    namespace: string,
    key: string,
    value: string,
    interpolation?: Record<string, any>
  ): void {
    this.i18n.addTranslations(this.i18n.locale, {
      [key]: value
    }, namespace);
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): I18nPerformanceMetrics {
    // This would need to be enhanced with actual performance tracking
    return {
      initTime: 0,
      translationTime: 0,
      bundleLoadTime: {},
      memoryUsage: 0,
      cacheHitRate: 0.95, // Mock data
      missedTranslationsCount: this.i18n.getMissingKeys().length,
      averageKeyLookupTime: 0.1
    };
  }

  /**
   * Test layout with different languages
   */
  testLayout(languages: string[]): void {
    // This would trigger layout testing functionality
    languages.forEach(async (lang) => {
      await this.changeLanguage(lang);
      
      i18nEventClient.emit('i18n:layout-test', {
        language: lang,
        results: [] // Would be populated with actual test results
      });
    });
  }

  /**
   * Cleanup adapter
   */
  destroy(): void {
    this.unsubscribers.forEach(unsubscribe => unsubscribe());
    this.unsubscribers = [];
    this.isInitialized = false;
  }
}

/**
 * Create a Sucoza I18n adapter
 */
export function createSucozaI18nAdapter(i18nInstance: I18nInstance): SucozaI18nAdapter {
  return new SucozaI18nAdapter(i18nInstance);
}