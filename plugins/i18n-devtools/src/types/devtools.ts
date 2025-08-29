/**
 * DevTools event types and interfaces
 */

import {
  I18nState,
  TranslationKey,
  Translation,
  LanguageInfo,
  NamespaceInfo,
  TranslationUsage,
  FormattingExample,
  BundleAnalysis,
  LayoutTestResult,
  I18nPerformanceMetrics
} from './i18n';

export interface I18nDevToolsEvents {
  // State updates
  'i18n-state-update': {
    state: I18nState;
  };
  
  'i18n-state-request': void;
  
  'i18n-state-response': {
    state: I18nState;
  };

  // Translation events
  'i18n-translation-used': {
    usage: TranslationUsage;
  };

  'i18n-missing-key': {
    key: string;
    namespace: string;
    language: string;
    componentPath?: string;
    fallbackUsed?: string;
  };

  'i18n-key-added': {
    key: string;
    namespace: string;
    value: string;
    language: string;
  };

  'i18n-translation-updated': {
    key: string;
    namespace: string;
    language: string;
    oldValue: string;
    newValue: string;
  };

  // Language switching
  'i18n-language-changed': {
    from: string;
    to: string;
    timestamp: number;
  };

  'i18n-language-change-request': {
    language: string;
  };

  // Namespace events
  'i18n-namespace-loaded': {
    namespace: string;
    language: string;
    keys: number;
    loadTime: number;
  };

  'i18n-namespace-unloaded': {
    namespace: string;
    language: string;
  };

  // Editor commands
  'i18n-edit-translation': {
    key: string;
    namespace: string;
    language: string;
    value: string;
  };

  'i18n-add-translation': {
    key: string;
    namespace: string;
    languages: Record<string, string>;
  };

  'i18n-delete-translation': {
    key: string;
    namespace: string;
    languages?: string[];
  };

  // Export/Import
  'i18n-export-request': {
    format: 'json' | 'csv' | 'xlsx';
    languages?: string[];
    namespaces?: string[];
    onlyMissing?: boolean;
  };

  'i18n-export-response': {
    data: string | ArrayBuffer;
    filename: string;
    mimeType: string;
  };

  'i18n-import-request': {
    data: string | ArrayBuffer;
    format: 'json' | 'csv' | 'xlsx';
    overwrite?: boolean;
  };

  'i18n-import-response': {
    success: boolean;
    message: string;
    imported: number;
    errors?: string[];
  };

  // Analysis and metrics
  'i18n-performance-metrics': {
    metrics: I18nPerformanceMetrics;
  };

  'i18n-bundle-analysis-request': {
    namespaces?: string[];
    languages?: string[];
  };

  'i18n-bundle-analysis-response': {
    analysis: BundleAnalysis[];
  };

  'i18n-layout-test-request': {
    language: string;
    selector?: string;
  };

  'i18n-layout-test-response': {
    result: LayoutTestResult;
  };

  // Formatting and preview
  'i18n-format-preview-request': {
    type: 'date' | 'number' | 'currency' | 'plural' | 'ordinal';
    value: any;
    languages: string[];
    options?: Record<string, any>;
  };

  'i18n-format-preview-response': {
    examples: FormattingExample[];
  };

  // Search and filtering
  'i18n-search-keys': {
    query: string;
    namespace?: string;
    language?: string;
    onlyMissing?: boolean;
    onlyUnused?: boolean;
  };

  'i18n-search-results': {
    keys: TranslationKey[];
    total: number;
    query: string;
  };

  // Real-time updates
  'i18n-realtime-toggle': {
    enabled: boolean;
  };

  'i18n-debug-mode-toggle': {
    enabled: boolean;
  };

  // Error handling
  'i18n-error': {
    type: 'translation' | 'network' | 'parsing' | 'validation';
    message: string;
    details?: Record<string, any>;
    stack?: string;
  };
}

export type I18nEventType = keyof I18nDevToolsEvents;

export type I18nEventPayload<T extends I18nEventType> = I18nDevToolsEvents[T];

export interface I18nDevToolsConfig {
  pluginId: string;
  enabled: boolean;
  trackUsage: boolean;
  trackPerformance: boolean;
  debugMode: boolean;
  autoDetectMissing: boolean;
  supportedFormats: ('json' | 'csv' | 'xlsx')[];
  maxHistorySize: number;
  refreshInterval: number;
}