/**
 * Type definitions for @sucoza/i18n
 */

/** Configuration options for i18n instance */
export interface I18nConfig {
  /** Current locale (e.g., 'en', 'es', 'fr') */
  locale: string;
  /** Fallback locale when translation is missing */
  fallbackLocale: string;
  /** Enable DevTools integration */
  devtools?: boolean;
  /** Custom interpolation delimiter (default: '{{}}') */
  interpolation?: {
    prefix?: string;
    suffix?: string;
  };
  /** Default namespace for translations */
  defaultNamespace?: string;
  /** Pluralization rules */
  pluralization?: {
    enabled: boolean;
    rules?: Record<string, (n: number) => string>;
  };
  /** Missing translation handler */
  missingKeyHandler?: (key: string, locale: string, namespace?: string) => string;
  /** Debug mode for development */
  debug?: boolean;
}

/** Translation value types */
export type TranslationValue = string | number | boolean | null;

/** Translation object with nested support */
export interface Translation {
  [key: string]: TranslationValue | Translation | TranslationValue[];
}

/** Translations organized by locale */
export interface Translations {
  [locale: string]: Translation;
}

/** Translation key with namespace support */
export interface TranslationKey {
  /** Full key path (e.g., 'common:greeting' or 'greeting') */
  key: string;
  /** Namespace (e.g., 'common', 'auth') */
  namespace?: string;
  /** Default value if translation is missing */
  defaultValue?: string;
  /** Interpolation variables */
  interpolation?: Record<string, TranslationValue>;
  /** Count for pluralization */
  count?: number;
  /** Context for contextual translations */
  context?: string;
}

/** Language information */
export interface LanguageInfo {
  /** Language code (e.g., 'en', 'es') */
  code: string;
  /** Display name (e.g., 'English', 'Español') */
  name: string;
  /** Native name (e.g., 'English', 'Español') */
  nativeName: string;
  /** Text direction */
  direction: 'ltr' | 'rtl';
  /** Completion percentage */
  completeness?: number;
  /** Total translation keys */
  totalKeys?: number;
  /** Number of translated keys */
  translatedKeys?: number;
  /** Missing translation keys */
  missingKeys?: string[];
}

/** Translation usage tracking */
export interface TranslationUsage {
  /** Translation key */
  key: string;
  /** Namespace */
  namespace?: string;
  /** Component or module that used it */
  usedBy: string[];
  /** Usage count */
  count: number;
  /** Last used timestamp */
  lastUsed: number;
  /** First used timestamp */
  firstUsed: number;
}

/** I18n event types for DevTools integration */
export interface I18nEvents {
  /** Locale changed */
  'locale:change': {
    from: string;
    to: string;
    timestamp: number;
  };
  /** Translation key accessed */
  'translation:access': {
    key: string;
    namespace?: string;
    locale: string;
    value: string;
    interpolation?: Record<string, TranslationValue>;
    timestamp: number;
  };
  /** Missing translation key */
  'translation:missing': {
    key: string;
    namespace?: string;
    locale: string;
    fallbackValue?: string;
    timestamp: number;
  };
  /** Translations loaded */
  'translations:loaded': {
    locale: string;
    namespace?: string;
    count: number;
    timestamp: number;
  };
  /** Translation updated */
  'translation:updated': {
    key: string;
    namespace?: string;
    locale: string;
    oldValue?: string;
    newValue: string;
    timestamp: number;
  };
}

/** Event listener callback */
export type EventListener<T = any> = (data: T) => void;

/** I18n instance interface */
export interface I18nInstance {
  /** Current configuration */
  readonly config: I18nConfig;
  
  /** Current locale */
  readonly locale: string;
  
  /** Available locales */
  readonly locales: string[];
  
  /** Get translation */
  t(key: string, options?: {
    interpolation?: Record<string, TranslationValue>;
    count?: number;
    context?: string;
    defaultValue?: string;
    namespace?: string;
  }): string;
  
  /** Check if translation exists */
  exists(key: string, options?: { namespace?: string; locale?: string }): boolean;
  
  /** Set current locale */
  setLocale(locale: string): Promise<void>;
  
  /** Add translations for a locale */
  addTranslations(locale: string, translations: Translation, namespace?: string): void;
  
  /** Remove translations */
  removeTranslations(locale: string, namespace?: string): void;
  
  /** Get all translations for a locale */
  getTranslations(locale?: string, namespace?: string): Translation;
  
  /** Add a new locale */
  addLocale(locale: string, info?: Partial<LanguageInfo>): void;
  
  /** Remove a locale */
  removeLocale(locale: string): void;
  
  /** Get locale information */
  getLocaleInfo(locale?: string): LanguageInfo | undefined;
  
  /** Get all locale information */
  getAllLocales(): LanguageInfo[];
  
  /** Get missing translation keys */
  getMissingKeys(locale?: string): string[];
  
  /** Get translation usage statistics */
  getUsageStats(): TranslationUsage[];
  
  /** Add event listener */
  on<K extends keyof I18nEvents>(event: K, listener: EventListener<I18nEvents[K]>): () => void;
  
  /** Remove event listener */
  off<K extends keyof I18nEvents>(event: K, listener: EventListener<I18nEvents[K]>): void;
  
  /** Emit event */
  emit<K extends keyof I18nEvents>(event: K, data: I18nEvents[K]): void;
  
  /** Clear all translations */
  clear(): void;
  
  /** Get current state for debugging */
  getState(): {
    config: I18nConfig;
    locale: string;
    translations: Translations;
    usage: TranslationUsage[];
    missing: string[];
  };
}