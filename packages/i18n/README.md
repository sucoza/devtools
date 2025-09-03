# @sucoza/i18n

A lightweight, framework-agnostic internationalization utility with built-in DevTools integration.

## Features

- 🌐 **Framework Agnostic**: Works with any JavaScript/TypeScript project
- 🔧 **DevTools Integration**: Built-in support for TanStack DevTools i18n plugin
- 🎯 **TypeScript Support**: Full type safety and IntelliSense
- 📦 **Lightweight**: Minimal dependencies, small bundle size
- 🔄 **Real-time Updates**: Live translation updates and locale switching
- 📊 **Usage Tracking**: Track translation usage and detect missing keys
- 🌍 **Pluralization**: Built-in pluralization rules for multiple languages
- 🔤 **Interpolation**: String templating with variable substitution
- 🏗️ **Namespace Support**: Organize translations by namespace/domain
- 🕐 **Lazy Loading**: Load translations on demand
- 📱 **RTL Support**: Right-to-left language support detection

## Installation

```bash
npm install @sucoza/i18n
```

## Quick Start

```typescript
import { i18n } from '@sucoza/i18n';

// Set up your locale
i18n.setLocale('en');

// Add translations
i18n.addTranslations('en', {
  greeting: 'Hello {{name}}!',
  items: 'You have {{count}} item',
  items_plural: 'You have {{count}} items'
});

// Use translations
console.log(i18n.t('greeting', { interpolation: { name: 'World' } }));
// Output: "Hello World!"

console.log(i18n.t('items', { count: 1, interpolation: { count: 1 } }));
// Output: "You have 1 item"

console.log(i18n.t('items', { count: 5, interpolation: { count: 5 } }));
// Output: "You have 5 items"
```

## Advanced Usage

### Custom Instance

```typescript
import { createI18n } from '@sucoza/i18n';

const myI18n = createI18n({
  locale: 'es',
  fallbackLocale: 'en',
  devtools: true,
  debug: true,
  defaultNamespace: 'app'
});

myI18n.addTranslations('es', {
  greeting: '¡Hola {{name}}!'
}, 'common');

myI18n.addTranslations('en', {
  greeting: 'Hello {{name}}!'
}, 'common');
```

### Namespaces

```typescript
// Add translations with namespaces
i18n.addTranslations('en', {
  title: 'Authentication',
  login: 'Log In',
  signup: 'Sign Up'
}, 'auth');

i18n.addTranslations('en', {
  save: 'Save',
  cancel: 'Cancel',
  delete: 'Delete'
}, 'common');

// Use translations with namespace
console.log(i18n.t('login', { namespace: 'auth' }));
console.log(i18n.t('save', { namespace: 'common' }));
```

### Browser Detection

```typescript
import { createBrowserI18n } from '@sucoza/i18n';

// Automatically detects browser locale
const i18n = createBrowserI18n({
  fallbackLocale: 'en',
  devtools: true
});
```

### Event Listening

```typescript
// Listen for locale changes
const unsubscribe = i18n.on('locale:change', (event) => {
  console.log(`Locale changed from ${event.from} to ${event.to}`);
});

// Listen for missing translations
i18n.on('translation:missing', (event) => {
  console.warn(`Missing translation: ${event.key} for locale ${event.locale}`);
});

// Clean up
unsubscribe();
```

### Multiple Instances

```typescript
import { createMultipleI18n } from '@sucoza/i18n';

const instances = createMultipleI18n({
  admin: { locale: 'en', defaultNamespace: 'admin' },
  user: { locale: 'en', defaultNamespace: 'user' },
  api: { locale: 'en', defaultNamespace: 'api' }
});

instances.admin.t('dashboard');
instances.user.t('profile');
instances.api.t('error.notFound');
```

## DevTools Integration

This library is designed to work seamlessly with the `@sucoza/i18n-devtools-plugin`:

```typescript
import { i18n } from '@sucoza/i18n';
import { I18nDevToolsPanel } from '@sucoza/i18n-devtools-plugin';

// The i18n utility automatically integrates with DevTools
// when devtools: true is set in the configuration
function App() {
  return (
    <div>
      <I18nDevToolsPanel />
      {/* Your app content */}
    </div>
  );
}
```

## API Reference

### Configuration Options

```typescript
interface I18nConfig {
  locale: string;                    // Current locale
  fallbackLocale: string;            // Fallback locale
  devtools?: boolean;                // Enable DevTools integration
  interpolation?: {                  // Interpolation settings
    prefix?: string;                 // Default: '{{'
    suffix?: string;                 // Default: '}}'
  };
  defaultNamespace?: string;         // Default namespace
  pluralization?: {                  // Pluralization settings
    enabled: boolean;
    rules?: Record<string, (n: number) => string>;
  };
  missingKeyHandler?: (key: string, locale: string, namespace?: string) => string;
  debug?: boolean;                   // Debug mode
}
```

### Main Methods

- `t(key, options?)` - Get translation
- `exists(key, options?)` - Check if translation exists
- `setLocale(locale)` - Change current locale
- `addTranslations(locale, translations, namespace?)` - Add translations
- `removeTranslations(locale, namespace?)` - Remove translations
- `getTranslations(locale?, namespace?)` - Get all translations
- `addLocale(locale, info?)` - Add locale information
- `removeLocale(locale)` - Remove locale
- `getMissingKeys(locale?)` - Get missing translation keys
- `getUsageStats()` - Get translation usage statistics
- `on(event, listener)` - Add event listener
- `off(event, listener)` - Remove event listener
- `clear()` - Clear all translations
- `getState()` - Get current state (for debugging)

### Utility Functions

```typescript
import { 
  formatNumber, 
  formatDate, 
  formatRelativeTime, 
  isRTL, 
  isValidLocale,
  getBrowserLocales 
} from '@sucoza/i18n';

// Format numbers
formatNumber(1234.56, 'en-US'); // "1,234.56"
formatNumber(1234.56, 'de-DE'); // "1.234,56"

// Format dates
formatDate(new Date(), 'en-US'); // "12/25/2023"
formatDate(new Date(), 'de-DE'); // "25.12.2023"

// Relative time
formatRelativeTime(yesterday, 'en'); // "1 day ago"

// RTL detection
isRTL('ar'); // true
isRTL('en'); // false

// Locale validation
isValidLocale('en-US'); // true

// Browser locales
getBrowserLocales(); // ['en', 'es', 'fr']
```

## Contributing

Contributions are welcome! Please read our contributing guidelines and submit pull requests to our repository.

## License

MIT

---

Part of the @sucoza DevTools ecosystem.