# i18n DevTools Plugin

A comprehensive internationalization debugging plugin for TanStack DevTools that provides real-time translation key tracking, missing key detection, language coverage analysis, formatting preview, bundle size optimization, and layout testing for multilingual React applications.

## Features

### 🌐 **Translation Key Management**
- Real-time translation key usage tracking and monitoring
- Missing translation key detection with component source mapping
- Translation key coverage analysis across languages and namespaces
- Dynamic key generation and interpolation value tracking

### 🔍 **Translation Coverage Analysis**
- Comprehensive language coverage reporting and statistics
- Namespace-level translation completeness tracking
- Translation quality assessment and consistency analysis
- Dead key detection and cleanup recommendations

### 📝 **Interactive Translation Editor**
- In-browser translation editing with real-time preview
- Context-aware translation suggestions and validation
- Pluralization and interpolation testing interface
- Translation import/export functionality

### 🎨 **Format & Layout Testing**
- Live formatting preview for dates, numbers, and currencies
- RTL (Right-to-Left) layout testing and validation
- Text expansion testing for different languages
- UI component overflow and truncation detection

### 📦 **Bundle Size Analysis**
- Translation bundle size analysis and optimization
- Namespace-based bundle splitting recommendations
- Unused translation detection and cleanup suggestions
- Lazy loading impact analysis and recommendations

### ⚡ **Performance Monitoring**
- Translation loading performance metrics and analysis
- Cache hit rate monitoring and optimization
- Translation lookup performance profiling
- Memory usage analysis for large translation sets

### 🔧 **Framework Integration**
- react-i18next integration with hook usage tracking
- i18next configuration analysis and optimization
- Custom i18n framework adapter support
- Translation provider performance monitoring

## Installation

```bash
npm install @sucoza/i18n-devtools-plugin
```

## Usage

### Basic Setup

```tsx
import React from 'react';
import { I18nDevToolsPanel } from '@sucoza/i18n-devtools-plugin';

function App() {
  return (
    <div>
      {/* Your app content */}
      
      {/* i18n DevTools Panel */}
      <I18nDevToolsPanel />
    </div>
  );
}
```

### With Event Client Integration

```tsx
import React, { useEffect } from 'react';
import { 
  I18nDevToolsPanel,
  createI18nEventClient 
} from '@sucoza/i18n-devtools-plugin';

function App() {
  useEffect(() => {
    // Initialize the i18n event client
    const client = createI18nEventClient();
    
    // Optional: Listen for i18n events
    const unsubscribe = client.subscribe((event, type) => {
      if (type === 'i18n:missing-key') {
        console.log('Missing translation key detected:', event);
      }
      if (type === 'i18n:language-change') {
        console.log('Language changed:', event);
      }
      if (type === 'i18n:translation-updated') {
        console.log('Translation updated:', event);
      }
    });
    
    return unsubscribe;
  }, []);

  return (
    <div>
      <I18nDevToolsPanel />
    </div>
  );
}
```

### React-i18next Integration

```tsx
import React from 'react';
import { I18nDevToolsPanel, ReactI18nextAdapter } from '@sucoza/i18n-devtools-plugin';
import { useTranslation } from 'react-i18next';

function App() {
  const { i18n } = useTranslation();

  return (
    <div>
      <I18nDevToolsPanel 
        adapter={new ReactI18nextAdapter(i18n)}
      />
    </div>
  );
}
```

### Using the Hook

```tsx
import React from 'react';
import { useI18nDevTools } from '@sucoza/i18n-devtools-plugin';

function MyComponent() {
  const {
    currentLanguage,
    availableLanguages,
    missingKeys,
    translationKeys,
    performanceMetrics,
    changeLanguage,
    updateTranslation,
    addTranslationKey,
    analyzeBundle,
    testLayout
  } = useI18nDevTools();
  
  return (
    <div>
      <div>
        <h3>i18n Status</h3>
        <p>Current Language: {currentLanguage}</p>
        <p>Available Languages: {availableLanguages.length}</p>
        <p>Missing Keys: {missingKeys.length}</p>
        <p>Cache Hit Rate: {(performanceMetrics.cacheHitRate * 100).toFixed(1)}%</p>
      </div>
      
      <div>
        <h3>Language Switcher</h3>
        {availableLanguages.map(lang => (
          <button 
            key={lang.code}
            onClick={() => changeLanguage(lang.code)}
            className={lang.code === currentLanguage ? 'active' : ''}
          >
            {lang.name} ({lang.completeness}%)
          </button>
        ))}
      </div>
      
      {missingKeys.length > 0 && (
        <div>
          <h3>Missing Translation Keys</h3>
          {missingKeys.slice(0, 10).map(key => (
            <div key={key.key}>
              <p><strong>{key.namespace}:{key.key}</strong></p>
              <p>Used in: {key.usedAt.join(', ')}</p>
              <button onClick={() => updateTranslation(key.namespace, key.key, 'TODO: Add translation')}>
                Add Translation
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

## Configuration

### Framework Adapter Setup

```tsx
import { ReactI18nextAdapter } from '@sucoza/i18n-devtools-plugin';
import i18n from './i18n'; // Your i18next configuration

function MyComponent() {
  const adapter = new ReactI18nextAdapter(i18n, {
    trackUsage: true,
    detectMissingKeys: true,
    enablePerformanceMonitoring: true,
    enableBundleAnalysis: true,
  });

  return (
    <I18nDevToolsPanel adapter={adapter} />
  );
}
```

### Analysis Options

```tsx
import { useI18nDevTools } from '@sucoza/i18n-devtools-plugin';

function MyComponent() {
  const { updateAnalysisOptions } = useI18nDevTools();
  
  // Configure analysis behavior
  updateAnalysisOptions({
    trackKeyUsage: true,
    detectMissingKeys: true,
    analyzeBundleSize: true,
    enablePerformanceMetrics: true,
    enableLayoutTesting: true,
    maxKeysToTrack: 1000,
    bundleAnalysisInterval: 30000, // 30 seconds
  });
}
```

### Testing Configuration

```tsx
import { useI18nDevTools } from '@sucoza/i18n-devtools-plugin';

function MyComponent() {
  const { updateTestingOptions } = useI18nDevTools();
  
  // Configure layout testing
  updateTestingOptions({
    testLanguages: ['en', 'ar', 'de', 'ja'], // Languages to test
    enableRTLTesting: true,
    enableOverflowDetection: true,
    enableTruncationDetection: true,
    captureScreenshots: true,
    testViewports: ['mobile', 'tablet', 'desktop'],
  });
}
```

## Components

### I18nDevToolsPanel
The main panel component that provides the complete i18n debugging interface with multiple tabs.

### Individual Components
You can also use individual components for specific functionality:

- `KeyExplorer` - Translation key browser and search interface
- `LanguageSwitcher` - Language selection and switching controls
- `MissingKeysPanel` - Missing translation detection and management
- `TranslationEditor` - In-browser translation editing interface
- `CoverageVisualization` - Translation coverage charts and statistics
- `FormatPreview` - Date, number, and currency formatting preview
- `BundleAnalyzer` - Translation bundle size analysis
- `LayoutTester` - Cross-language layout testing interface
- `PerformanceMetrics` - i18n performance monitoring dashboard

## API Reference

### Types

```typescript
interface TranslationKey {
  key: string;
  namespace: string;
  defaultValue?: string;
  interpolation?: Record<string, any>;
  count?: number;
  context?: string;
  usedAt: string[];
  lastUsed: number;
}

interface LanguageInfo {
  code: string;
  name: string;
  nativeName: string;
  isRTL: boolean;
  completeness: number;
  totalKeys: number;
  translatedKeys: number;
  missingKeys: string[];
  isDefault?: boolean;
  isActive?: boolean;
}

interface I18nState {
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

interface I18nPerformanceMetrics {
  initTime: number;
  translationTime: number;
  bundleLoadTime: Record<string, number>;
  memoryUsage: number;
  cacheHitRate: number;
  missedTranslationsCount: number;
  averageKeyLookupTime: number;
}
```

### Event Client

```typescript
interface I18nEvents {
  'i18n:state': I18nState;
  'i18n:language-change': { from: string; to: string; timestamp: number };
  'i18n:missing-key': { key: TranslationKey; component: string };
  'i18n:translation-updated': { namespace: string; key: string; value: string };
  'i18n:key-usage': { key: TranslationKey; component: string };
  'i18n:bundle-loaded': { namespace: string; size: number; loadTime: number };
  'i18n:performance-metrics': I18nPerformanceMetrics;
  'i18n:layout-test': { language: string; results: LayoutTestResult[] };
}
```

### Framework Adapters

```typescript
interface I18nAdapter {
  getCurrentLanguage(): string;
  getAvailableLanguages(): LanguageInfo[];
  changeLanguage(language: string): Promise<void>;
  getTranslation(namespace: string, key: string): string | undefined;
  updateTranslation(namespace: string, key: string, value: string): void;
  getNamespaces(): NamespaceInfo[];
  trackKeyUsage(key: TranslationKey, component: string): void;
  getPerformanceMetrics(): I18nPerformanceMetrics;
}

class ReactI18nextAdapter implements I18nAdapter {
  constructor(i18nInstance: i18n, options?: AdapterOptions);
  // Implementation methods...
}
```

## Examples

Check out the `example/` directory for a complete demonstration of the plugin with various i18n configurations and testing scenarios.

To run the example:

```bash
cd example
npm install
npm run dev
```

The example includes:
- react-i18next integration with multiple languages
- Missing translation key scenarios
- Layout testing with RTL languages
- Translation bundle analysis examples
- Performance monitoring demonstrations
- Interactive translation editing examples

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT

---

Part of the @sucoza TanStack DevTools ecosystem.

## Powered By

- [react-i18next](https://react.i18next.com/) - React internationalization framework
- [i18next](https://www.i18next.com/) - Internationalization framework
- [TanStack DevTools](https://tanstack.com/devtools) - Development tools framework
- [Zustand](https://github.com/pmndrs/zustand) - State management
- [Intl](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl) - Native internationalization APIs