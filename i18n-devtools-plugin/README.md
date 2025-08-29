# I18n DevTools Plugin

A comprehensive internationalization (i18n) inspector plugin for TanStack DevTools, providing advanced translation management, missing key detection, and performance optimization tools.

## Features

### 🔑 Translation Key Explorer
- **Real-time key tracking** - Monitor translation usage across your application
- **Search and filtering** - Find keys by name, namespace, or content
- **Usage analytics** - See which keys are used most frequently
- **Missing key detection** - Identify and prioritize untranslated content

### 🌍 Language Management
- **Language switcher** - Test your app in different languages instantly
- **Coverage visualization** - Heat maps and charts showing translation completeness
- **RTL/LTR support** - Automatic detection and testing for right-to-left languages
- **Completeness metrics** - Track translation progress across all languages

### ✏️ Inline Translation Editor
- **Live editing** - Edit translations directly in DevTools
- **Multi-language support** - Edit multiple languages simultaneously
- **Preview mode** - See how interpolation and formatting will look
- **Batch operations** - Add, edit, or delete multiple translations at once

### 📊 Advanced Analytics
- **Bundle size analysis** - Optimize translation bundle sizes per locale
- **Performance metrics** - Monitor i18n initialization and lookup times
- **Coverage reports** - Detailed breakdowns by namespace and language
- **Usage patterns** - Identify unused or duplicate translations

### 🧪 Layout Testing
- **RTL layout testing** - Verify right-to-left language compatibility
- **Text overflow detection** - Find UI elements that break with longer translations
- **Responsive testing** - Check layouts across different screen sizes
- **Visual comparisons** - Before/after screenshots of layout changes

### 🎨 Format Preview
- **Date formatting** - Preview how dates appear in different locales
- **Number formatting** - Test currency, percentages, and decimal formats
- **Pluralization rules** - Verify plural forms across languages
- **Custom formatting** - Test interpolation and variable substitution

## Installation

```bash
npm install @tanstack/i18n-devtools-plugin
```

## Quick Start

### With react-i18next

```tsx
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { createReactI18nextAdapter } from '@tanstack/i18n-devtools-plugin';

// Initialize i18next
i18n
  .use(initReactI18next)
  .init({
    // your i18next configuration
  });

// Create and initialize the DevTools adapter
const adapter = createReactI18nextAdapter(i18n);

// In your DevTools setup
import { I18nDevToolsPanel } from '@tanstack/i18n-devtools-plugin';

function DevToolsWrapper() {
  return (
    <TanStackDevtools>
      <I18nDevToolsPanel />
    </TanStackDevtools>
  );
}
```

### Manual Setup

```tsx
import { I18nEventClient, I18nDevToolsPanel } from '@tanstack/i18n-devtools-plugin';

// Create event client
const eventClient = new I18nEventClient({
  pluginId: 'i18n-devtools',
  enabled: true,
  trackUsage: true,
  debugMode: false
});

// Use in your DevTools
function MyDevTools() {
  return <I18nDevToolsPanel />;
}
```

## API Reference

### Event Client

```typescript
class I18nEventClient {
  constructor(config?: Partial<I18nDevToolsConfig>)
  emit<T extends I18nEventType>(type: T, payload: I18nEventPayload<T>): void
  on<T extends I18nEventType>(type: T, callback: EventCallback<T>): () => void
  setEnabled(enabled: boolean): void
  setDebugMode(enabled: boolean): void
  destroy(): void
}
```

### React i18next Adapter

```typescript
class ReactI18nextAdapter {
  constructor(i18nInstance: i18n)
  destroy(): void
}

function createReactI18nextAdapter(i18nInstance: i18n): ReactI18nextAdapter
```

### DevTools Panel Props

```typescript
interface I18nDevToolsPanelProps {
  // All props are optional - the panel manages its own state
}
```

## Configuration

### DevTools Config

```typescript
interface I18nDevToolsConfig {
  pluginId: string;              // Unique plugin identifier
  enabled: boolean;              // Enable/disable the plugin
  trackUsage: boolean;           // Track translation key usage
  trackPerformance: boolean;     // Monitor performance metrics
  debugMode: boolean;            // Enable debug logging
  autoDetectMissing: boolean;    // Automatically detect missing keys
  supportedFormats: string[];    // Export/import formats
  maxHistorySize: number;        // Maximum history entries to keep
  refreshInterval: number;       // Auto-refresh interval in ms
}
```

### Adapter Options

```typescript
// React i18next adapter automatically configures itself
// based on your i18next instance configuration
```

## Events

The plugin emits various events that you can listen to:

```typescript
// Translation usage tracking
eventClient.on('i18n-translation-used', (event) => {
  console.log('Translation used:', event.payload.usage);
});

// Missing key detection
eventClient.on('i18n-missing-key', (event) => {
  console.log('Missing key:', event.payload.key);
});

// Language changes
eventClient.on('i18n-language-changed', (event) => {
  console.log('Language changed from', event.payload.from, 'to', event.payload.to);
});

// Performance metrics
eventClient.on('i18n-performance-metrics', (event) => {
  console.log('Performance:', event.payload.metrics);
});
```

## Advanced Usage

### Custom Adapters

Create your own adapter for other i18n libraries:

```typescript
import { i18nEventClient } from '@tanstack/i18n-devtools-plugin';

class MyI18nAdapter {
  constructor(myI18nInstance) {
    this.i18n = myI18nInstance;
    
    // Hook into your i18n library's events
    this.i18n.onTranslation((key, value, language) => {
      i18nEventClient.emit('i18n-translation-used', {
        usage: {
          key,
          namespace: 'default',
          componentPath: 'unknown',
          usage: { type: 't' },
          timestamp: Date.now()
        }
      });
    });
    
    // Send initial state
    this.sendStateUpdate();
  }
  
  sendStateUpdate() {
    const state = this.buildI18nState();
    i18nEventClient.emit('i18n-state-update', { state });
  }
}
```

### Bundle Analysis

The bundle analyzer can help optimize your translation files:

```typescript
// Listen for bundle analysis results
eventClient.on('i18n-bundle-analysis-response', (event) => {
  const analysis = event.payload.analysis;
  
  analysis.forEach(bundle => {
    console.log(`${bundle.namespace} (${bundle.language}): ${bundle.size} bytes`);
    
    if (bundle.duplicates?.length > 0) {
      console.warn('Duplicate keys:', bundle.duplicates);
    }
    
    if (bundle.unusedKeys?.length > 0) {
      console.warn('Unused keys:', bundle.unusedKeys);
    }
  });
});

// Request analysis
eventClient.emit('i18n-bundle-analysis-request', {
  namespaces: ['common', 'auth', 'dashboard'],
  languages: ['en', 'es', 'fr']
});
```

### Performance Monitoring

Monitor your i18n performance:

```typescript
// Listen for performance updates
eventClient.on('i18n-performance-metrics', (event) => {
  const metrics = event.payload.metrics;
  
  if (metrics.initTime > 100) {
    console.warn('Slow i18n initialization:', metrics.initTime + 'ms');
  }
  
  if (metrics.cacheHitRate < 0.8) {
    console.warn('Low cache hit rate:', metrics.cacheHitRate);
  }
  
  if (metrics.missedTranslationsCount > 10) {
    console.warn('High miss rate:', metrics.missedTranslationsCount);
  }
});
```

## TypeScript Support

The plugin is written in TypeScript and provides comprehensive type definitions:

```typescript
import type {
  I18nState,
  TranslationKey,
  Translation,
  LanguageInfo,
  NamespaceInfo,
  I18nEventType,
  I18nEventPayload
} from '@tanstack/i18n-devtools-plugin';
```

## Browser Compatibility

- Chrome 70+
- Firefox 63+
- Safari 12+
- Edge 79+

## Performance

The plugin is designed to have minimal impact on your application:

- **Lazy initialization** - Only loads when DevTools are open
- **Efficient tracking** - Uses debounced updates to prevent performance issues
- **Memory management** - Automatically cleans up old data
- **Production safety** - Can be safely left in production builds

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## License

MIT License - see [LICENSE](LICENSE) for details.

## Related Projects

- [TanStack DevTools](https://github.com/TanStack/react-devtools)
- [react-i18next](https://react.i18next.com/)
- [i18next](https://www.i18next.com/)

## Support

- [Documentation](https://tanstack.com/devtools)
- [Discord Community](https://discord.gg/tanstack)
- [GitHub Issues](https://github.com/TanStack/devtools/issues)