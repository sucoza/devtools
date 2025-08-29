/**
 * Core i18n types for the DevTools plugin
 */

export interface TranslationKey {
  key: string;
  namespace: string;
  defaultValue?: string;
  interpolation?: Record<string, any>;
  count?: number;
  context?: string;
  usedAt: string[]; // Component paths where this key is used
  lastUsed: number; // Timestamp
}

export interface Translation {
  key: string;
  namespace: string;
  language: string;
  value: string | object;
  isPlural?: boolean;
  isMissing?: boolean;
  isPartiallyTranslated?: boolean;
  lastModified?: number;
  fileSource?: string;
}

export interface LanguageInfo {
  code: string;
  name: string;
  nativeName: string;
  isRTL: boolean;
  completeness: number; // Percentage 0-100
  totalKeys: number;
  translatedKeys: number;
  missingKeys: string[];
  isDefault?: boolean;
  isActive?: boolean;
}

export interface NamespaceInfo {
  name: string;
  languages: string[];
  totalKeys: number;
  translationCoverage: Record<string, number>; // language -> percentage
  keyUsage: Record<string, number>; // key -> usage count
  lastModified?: number;
  fileSource?: string;
  bundleSize?: number; // Size in bytes
}

export interface I18nState {
  currentLanguage: string;
  fallbackLanguage: string;
  availableLanguages: LanguageInfo[];
  namespaces: NamespaceInfo[];
  translations: Translation[];
  translationKeys: TranslationKey[];
  missingKeys: TranslationKey[];
  isLoading: boolean;
  lastUpdated: number;
}

export interface TranslationUsage {
  key: string;
  namespace: string;
  componentPath: string;
  usage: {
    type: 'useTranslation' | 'Trans' | 't' | 'withTranslation';
    line?: number;
    column?: number;
  };
  interpolationValues?: Record<string, any>;
  count?: number;
  context?: string;
  timestamp: number;
}

export interface FormattingExample {
  type: 'date' | 'number' | 'currency' | 'plural' | 'ordinal';
  input: any;
  output: string;
  locale: string;
  options?: Record<string, any>;
}

export interface BundleAnalysis {
  namespace: string;
  language: string;
  size: number; // bytes
  keys: number;
  duplicates?: string[];
  unusedKeys?: string[];
  sizeByKey: Record<string, number>;
}

export interface LayoutTestResult {
  language: string;
  direction: 'ltr' | 'rtl';
  issues: Array<{
    type: 'overflow' | 'truncation' | 'alignment' | 'spacing';
    element: string;
    description: string;
    severity: 'low' | 'medium' | 'high';
  }>;
  screenshots?: {
    before: string;
    after: string;
  };
}

export interface I18nPerformanceMetrics {
  initTime: number;
  translationTime: number;
  bundleLoadTime: Record<string, number>; // namespace -> time
  memoryUsage: number;
  cacheHitRate: number;
  missedTranslationsCount: number;
  averageKeyLookupTime: number;
}