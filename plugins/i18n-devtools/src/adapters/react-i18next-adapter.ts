/**
 * React-i18next adapter for I18n DevTools
 * Integrates with react-i18next to capture translation usage and state
 */

import { i18n as I18nextInstance, TFunction } from 'i18next';
import { useTranslation, Trans as _Trans, withTranslation as _withTranslation, WithTranslation as _WithTranslation } from 'react-i18next';
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

export class ReactI18nextAdapter {
  private i18n: I18nextInstance;
  private originalT: TFunction;
  private originalUseTranslation: typeof useTranslation;
  private usageTracker: Map<string, TranslationUsage> = new Map();
  private performanceMetrics: I18nPerformanceMetrics;
  private isInitialized: boolean = false;
  private eventClientUnsubscribers: (() => void)[] = [];
  private currentLanguage: string = '';
  private boundOnResourcesLoaded = this.onResourcesLoaded.bind(this);
  private boundOnFailedLoading = this.onResourcesFailedLoading.bind(this);
  private boundOnLanguageChanged = this.onLanguageChanged.bind(this);
  private boundOnMissingKey = this.onMissingKey.bind(this);
  private boundOnResourceAdded = this.onResourceAdded.bind(this);
  private boundOnResourceRemoved = this.onResourceRemoved.bind(this);

  constructor(i18nInstance: I18nextInstance) {
    this.i18n = i18nInstance;
    this.originalT = i18nInstance.t.bind(i18nInstance);
    this.originalUseTranslation = useTranslation;

    this.performanceMetrics = {
      initTime: 0,
      translationTime: 0,
      bundleLoadTime: {},
      memoryUsage: 0,
      cacheHitRate: 0,
      missedTranslationsCount: 0,
      averageKeyLookupTime: 0,
    };

    this.initialize();
  }

  private initialize(): void {
    if (this.isInitialized) return;

    const startTime = performance.now();

    // Hook into i18next events
    this.i18n.on('loaded', this.boundOnResourcesLoaded);
    this.i18n.on('failedLoading', this.boundOnFailedLoading);
    this.i18n.on('languageChanged', this.boundOnLanguageChanged);
    this.i18n.on('missingKey', this.boundOnMissingKey);
    this.i18n.on('added', this.boundOnResourceAdded);
    this.i18n.on('removed', this.boundOnResourceRemoved);

    // Wrap the translation function
    this.wrapTranslationFunction();

    // Subscribe to DevTools commands
    this.subscribeToDevToolsEvents();

    // Send initial state
    this.sendStateUpdate();

    this.performanceMetrics.initTime = performance.now() - startTime;
    this.isInitialized = true;
    this.currentLanguage = this.i18n.language || '';

    // console.log('[I18n DevTools] React-i18next adapter initialized');
  }

  private wrapTranslationFunction(): void {
    // Wrap the main translation function
    (this.i18n.t as any) = (key: string, options: any = {}) => {
      const startTime = performance.now();
      
      try {
        const result = this.originalT(key, options);
        const endTime = performance.now();
        
        // Track usage
        this.trackTranslationUsage(key, options, 't');
        
        // Update performance metrics
        this.performanceMetrics.translationTime += endTime - startTime;
        
        return result;
      } catch (error) {
        i18nEventClient.emit('i18n-error', {
          type: 'translation',
          message: `Translation failed for key: ${key}`,
          details: { key, options, error },
        });
        throw error;
      }
    };
  }

  private trackTranslationUsage(
    key: string, 
    options: any = {}, 
    type: 'useTranslation' | 'Trans' | 't' | 'withTranslation'
  ): void {
    const namespace = options.ns || this.i18n.options.defaultNS || 'common';
    const componentPath = this.getCurrentComponentPath();
    
    const usage: TranslationUsage = {
      key,
      namespace: Array.isArray(namespace) ? namespace[0] : namespace,
      componentPath,
      usage: {
        type,
        line: this.getLineNumber(),
        column: this.getColumnNumber(),
      },
      interpolationValues: options.replace || options,
      count: options.count,
      context: options.context,
      timestamp: Date.now(),
    };

    this.usageTracker.set(`${namespace}:${key}`, usage);
    
    i18nEventClient.emit('i18n-translation-used', { usage });
  }

  private getCurrentComponentPath(): string {
    // Try to extract component path from stack trace
    const stack = new Error().stack;
    if (stack) {
      const lines = stack.split('\n');
      for (const line of lines) {
        if (line.includes('.tsx') || line.includes('.jsx')) {
          const match = line.match(/\/([^/]+\.tsx?)/);  
          return match ? match[1] : 'unknown';
        }
      }
    }
    return 'unknown';
  }

  private getLineNumber(): number | undefined {
    const stack = new Error().stack;
    if (stack) {
      const lines = stack.split('\n');
      for (const line of lines) {
        const match = line.match(/:(\d+):\d+/);
        if (match) {
          return parseInt(match[1]);
        }
      }
    }
    return undefined;
  }

  private getColumnNumber(): number | undefined {
    const stack = new Error().stack;
    if (stack) {
      const lines = stack.split('\n');
      for (const line of lines) {
        const match = line.match(/:(\d+):(\d+)/);
        if (match) {
          return parseInt(match[2]);
        }
      }
    }
    return undefined;
  }

  private onResourcesLoaded(loaded: any): void {
    Object.keys(loaded).forEach(language => {
      Object.keys(loaded[language]).forEach(namespace => {
        i18nEventClient.emit('i18n-namespace-loaded', {
          namespace,
          language,
          keys: Object.keys(loaded[language][namespace]).length,
          loadTime: performance.now(),
        });
      });
    });

    this.sendStateUpdate();
  }

  private onResourcesFailedLoading(language: string, namespace: string, msg: string): void {
    i18nEventClient.emit('i18n-error', {
      type: 'network',
      message: `Failed to load resources: ${namespace} for ${language}`,
      details: { language, namespace, originalMessage: msg },
    });
  }

  private onLanguageChanged(language: string): void {
    const previousLanguage = this.currentLanguage;
    this.currentLanguage = language;
    
    i18nEventClient.emit('i18n-language-changed', {
      from: previousLanguage,
      to: language,
      timestamp: Date.now(),
    });

    this.sendStateUpdate();
  }

  private onMissingKey(
    languages: string[], 
    namespace: string, 
    key: string, 
    fallbackValue: string
  ): void {
    const currentLanguage = this.i18n.language;
    
    i18nEventClient.emit('i18n-missing-key', {
      key,
      namespace,
      language: currentLanguage,
      componentPath: this.getCurrentComponentPath(),
      fallbackUsed: fallbackValue,
    });

    this.performanceMetrics.missedTranslationsCount++;
  }

  private onResourceAdded(language: string, namespace: string): void {
    i18nEventClient.emit('i18n-key-added', {
      key: 'bulk',
      namespace,
      value: 'multiple keys added',
      language,
    });

    this.sendStateUpdate();
  }

  private onResourceRemoved(_language: string, _namespace: string): void {
    this.sendStateUpdate();
  }

  private subscribeToDevToolsEvents(): void {
    // Language change request
    this.eventClientUnsubscribers.push(
      i18nEventClient.on('i18n-language-change-request', (event) => {
        this.i18n.changeLanguage(event.payload.language);
      })
    );

    // Translation editing
    this.eventClientUnsubscribers.push(
      i18nEventClient.on('i18n-edit-translation', (event) => {
        const { key, namespace, language, value } = event.payload;
        this.i18n.addResource(language, namespace, key, value);
      })
    );

    // Add new translation
    this.eventClientUnsubscribers.push(
      i18nEventClient.on('i18n-add-translation', (event) => {
        const { key, namespace, languages } = event.payload;
        Object.entries(languages).forEach(([lang, value]) => {
          this.i18n.addResource(lang, namespace, key, value);
        });
      })
    );

    // Delete translation
    this.eventClientUnsubscribers.push(
      i18nEventClient.on('i18n-delete-translation', (event) => {
        const { key, namespace, languages } = event.payload;
        const langsToDelete = languages || Object.keys(this.i18n.options.resources || {});

        langsToDelete.forEach(lang => {
          this.i18n.removeResourceBundle(lang, namespace);
          // Re-add without the deleted key
          const resources = this.i18n.getResourceBundle(lang, namespace) || {};
          delete resources[key];
          this.i18n.addResourceBundle(lang, namespace, resources, true, true);
        });
      })
    );

    // State request
    this.eventClientUnsubscribers.push(
      i18nEventClient.on('i18n-state-request', () => {
        this.sendStateUpdate();
      })
    );

    // Performance metrics request
    this.eventClientUnsubscribers.push(
      i18nEventClient.on('i18n-performance-metrics', () => {
        this.updatePerformanceMetrics();
      })
    );
  }

  private sendStateUpdate(): void {
    const state = this.buildI18nState();
    i18nEventClient.emit('i18n-state-update', { state });
  }

  private buildI18nState(): I18nState {
    const resources = this.i18n.options.resources || {};
    const languages = Object.keys(resources);
    const currentLanguage = this.i18n.language;
    const fallbackLanguage = this.i18n.options.fallbackLng as string;

    // Build language info
    const availableLanguages: LanguageInfo[] = languages.map(lang => {
      const totalKeys = this.getTotalKeysForLanguage(lang);
      const translatedKeys = this.getTranslatedKeysForLanguage(lang);
      const missingKeys = this.getMissingKeysForLanguage(lang);

      return {
        code: lang,
        name: this.getLanguageName(lang),
        nativeName: this.getNativeLanguageName(lang),
        isRTL: this.isRTLLanguage(lang),
        completeness: totalKeys > 0 ? (translatedKeys / totalKeys) * 100 : 0,
        totalKeys,
        translatedKeys,
        missingKeys: missingKeys.map(key => key.key),
        isDefault: lang === fallbackLanguage,
        isActive: lang === currentLanguage,
      };
    });

    // Build namespace info
    const namespaces: NamespaceInfo[] = this.getNamespaces().map(ns => ({
      name: ns,
      languages,
      totalKeys: this.getTotalKeysForNamespace(ns),
      translationCoverage: this.getTranslationCoverageForNamespace(ns),
      keyUsage: this.getKeyUsageForNamespace(ns),
      lastModified: Date.now(),
      fileSource: `${ns}.json`,
      bundleSize: this.getBundleSizeForNamespace(ns),
    }));

    // Build translations list
    const translations: Translation[] = [];
    const translationKeys: TranslationKey[] = [];
    const missingKeys: TranslationKey[] = [];

    languages.forEach(lang => {
      this.getNamespaces().forEach(ns => {
        const bundle = this.i18n.getResourceBundle(lang, ns) || {};
        this.flattenTranslations(bundle, ns, lang, '', translations, translationKeys, missingKeys);
      });
    });

    return {
      currentLanguage,
      fallbackLanguage,
      availableLanguages,
      namespaces,
      translations,
      translationKeys,
      missingKeys,
      isLoading: false,
      lastUpdated: Date.now(),
    };
  }

  private getTotalKeysForLanguage(language: string): number {
    let total = 0;
    this.getNamespaces().forEach(ns => {
      const bundle = this.i18n.getResourceBundle(language, ns) || {};
      total += this.countKeys(bundle);
    });
    return total;
  }

  private getTranslatedKeysForLanguage(language: string): number {
    let translated = 0;
    this.getNamespaces().forEach(ns => {
      const bundle = this.i18n.getResourceBundle(language, ns) || {};
      translated += this.countTranslatedKeys(bundle);
    });
    return translated;
  }

  private getMissingKeysForLanguage(language: string): TranslationKey[] {
    const missing: TranslationKey[] = [];
    const fallbackLang = this.i18n.options.fallbackLng as string;
    
    if (language === fallbackLang) return missing;

    this.getNamespaces().forEach(ns => {
      const bundle = this.i18n.getResourceBundle(language, ns) || {};
      const fallbackBundle = this.i18n.getResourceBundle(fallbackLang, ns) || {};
      
      this.findMissingKeys(bundle, fallbackBundle, ns, '', missing);
    });

    return missing;
  }

  private findMissingKeys(
    bundle: any, 
    fallbackBundle: any, 
    namespace: string, 
    prefix: string, 
    missing: TranslationKey[]
  ): void {
    Object.keys(fallbackBundle).forEach(key => {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      
      if (typeof fallbackBundle[key] === 'object' && fallbackBundle[key] !== null) {
        this.findMissingKeys(
          bundle[key] || {}, 
          fallbackBundle[key], 
          namespace, 
          fullKey, 
          missing
        );
      } else if (!(key in bundle) || !bundle[key]) {
        missing.push({
          key: fullKey,
          namespace,
          defaultValue: fallbackBundle[key],
          usedAt: [],
          lastUsed: 0,
        });
      }
    });
  }

  private getNamespaces(): string[] {
    const resources = this.i18n.options.resources || {};
    const namespaces = new Set<string>();
    
    Object.values(resources).forEach((langResources: any) => {
      Object.keys(langResources).forEach(ns => namespaces.add(ns));
    });
    
    return Array.from(namespaces);
  }

  private getTotalKeysForNamespace(namespace: string): number {
    const languages = Object.keys(this.i18n.options.resources || {});
    let maxKeys = 0;
    
    languages.forEach(lang => {
      const bundle = this.i18n.getResourceBundle(lang, namespace) || {};
      const keyCount = this.countKeys(bundle);
      maxKeys = Math.max(maxKeys, keyCount);
    });
    
    return maxKeys;
  }

  private getTranslationCoverageForNamespace(namespace: string): Record<string, number> {
    const coverage: Record<string, number> = {};
    const languages = Object.keys(this.i18n.options.resources || {});
    const totalKeys = this.getTotalKeysForNamespace(namespace);
    
    languages.forEach(lang => {
      const bundle = this.i18n.getResourceBundle(lang, namespace) || {};
      const translatedKeys = this.countTranslatedKeys(bundle);
      coverage[lang] = totalKeys > 0 ? (translatedKeys / totalKeys) * 100 : 0;
    });
    
    return coverage;
  }

  private getKeyUsageForNamespace(namespace: string): Record<string, number> {
    const usage: Record<string, number> = {};
    
    this.usageTracker.forEach((translationUsage, key) => {
      if (translationUsage.namespace === namespace) {
        const shortKey = key.replace(`${namespace}:`, '');
        usage[shortKey] = (usage[shortKey] || 0) + 1;
      }
    });
    
    return usage;
  }

  private getBundleSizeForNamespace(namespace: string): number {
    const languages = Object.keys(this.i18n.options.resources || {});
    let totalSize = 0;
    
    languages.forEach(lang => {
      const bundle = this.i18n.getResourceBundle(lang, namespace) || {};
      totalSize += JSON.stringify(bundle).length;
    });
    
    return totalSize;
  }

  private flattenTranslations(
    obj: any,
    namespace: string,
    language: string,
    prefix: string,
    translations: Translation[],
    translationKeys: TranslationKey[],
    missingKeys: TranslationKey[]
  ): void {
    Object.keys(obj).forEach(key => {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      const value = obj[key];
      
      if (typeof value === 'object' && value !== null) {
        this.flattenTranslations(value, namespace, language, fullKey, translations, translationKeys, missingKeys);
      } else {
        const isMissing = !value || value === fullKey;
        
        const translation: Translation = {
          key: fullKey,
          namespace,
          language,
          value,
          isMissing,
          lastModified: Date.now(),
        };
        
        translations.push(translation);
        
        if (isMissing) {
          const missingKey: TranslationKey = {
            key: fullKey,
            namespace,
            defaultValue: value,
            usedAt: [],
            lastUsed: 0,
          };
          missingKeys.push(missingKey);
        }
        
        const usage = this.usageTracker.get(`${namespace}:${fullKey}`);
        if (usage) {
          const translationKey: TranslationKey = {
            key: fullKey,
            namespace,
            defaultValue: value,
            usedAt: [usage.componentPath],
            lastUsed: usage.timestamp,
            interpolation: usage.interpolationValues,
            count: usage.count,
            context: usage.context,
          };
          translationKeys.push(translationKey);
        }
      }
    });
  }

  private countKeys(obj: any): number {
    let count = 0;
    Object.keys(obj).forEach(key => {
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        count += this.countKeys(obj[key]);
      } else {
        count++;
      }
    });
    return count;
  }

  private countTranslatedKeys(obj: any): number {
    let count = 0;
    Object.keys(obj).forEach(key => {
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        count += this.countTranslatedKeys(obj[key]);
      } else if (obj[key] && obj[key] !== key) {
        count++;
      }
    });
    return count;
  }

  private getLanguageName(code: string): string {
    // Simple language name mapping - could be enhanced with a more complete list
    const names: Record<string, string> = {
      en: 'English',
      es: 'Spanish',
      fr: 'French',
      de: 'German',
      it: 'Italian',
      pt: 'Portuguese',
      ru: 'Russian',
      ja: 'Japanese',
      ko: 'Korean',
      zh: 'Chinese',
      ar: 'Arabic',
      hi: 'Hindi',
    };
    return names[code] || code.toUpperCase();
  }

  private getNativeLanguageName(code: string): string {
    const names: Record<string, string> = {
      en: 'English',
      es: 'Español',
      fr: 'Français',
      de: 'Deutsch',
      it: 'Italiano',
      pt: 'Português',
      ru: 'Русский',
      ja: '日本語',
      ko: '한국어',
      zh: '中文',
      ar: 'العربية',
      hi: 'हिन्दी',
    };
    return names[code] || code.toUpperCase();
  }

  private isRTLLanguage(code: string): boolean {
    const rtlLanguages = ['ar', 'he', 'fa', 'ur', 'ps', 'sd'];
    return rtlLanguages.includes(code);
  }

  private updatePerformanceMetrics(): void {
    this.performanceMetrics.memoryUsage = (performance as any).memory?.usedJSHeapSize || 0;
    this.performanceMetrics.cacheHitRate = this.calculateCacheHitRate();
    this.performanceMetrics.averageKeyLookupTime = this.calculateAverageKeyLookupTime();
    
    i18nEventClient.emit('i18n-performance-metrics', {
      metrics: this.performanceMetrics,
    });
  }

  private calculateCacheHitRate(): number {
    // Simplified calculation - in a real implementation, you'd track cache hits/misses
    return Math.random() * 100; // Placeholder
  }

  private calculateAverageKeyLookupTime(): number {
    // Simplified calculation based on tracked translation times
    return this.performanceMetrics.translationTime / Math.max(this.usageTracker.size, 1);
  }

  /**
   * Destroy the adapter and clean up
   */
  destroy(): void {
    // Remove event listeners
    this.i18n.off('loaded', this.boundOnResourcesLoaded);
    this.i18n.off('failedLoading', this.boundOnFailedLoading);
    this.i18n.off('languageChanged', this.boundOnLanguageChanged);
    this.i18n.off('missingKey', this.boundOnMissingKey);
    this.i18n.off('added', this.boundOnResourceAdded);
    this.i18n.off('removed', this.boundOnResourceRemoved);

    // Unsubscribe from event client events
    this.eventClientUnsubscribers.forEach(unsub => unsub());
    this.eventClientUnsubscribers = [];

    // Restore original functions
    this.i18n.t = this.originalT;

    // Clear tracking data
    this.usageTracker.clear();

    this.isInitialized = false;
  }
}

// Factory function to create and initialize the adapter
export function createReactI18nextAdapter(i18nInstance: I18nextInstance): ReactI18nextAdapter {
  return new ReactI18nextAdapter(i18nInstance);
}