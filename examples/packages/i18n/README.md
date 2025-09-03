# @sucoza/i18n Example

This example demonstrates the powerful features of the `@sucoza/i18n` utility and its integration with the DevTools plugin.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Run the development server
npm run dev
```

Visit `http://localhost:3000` to see the demo in action.

## 📋 What This Demo Shows

### Core Features

1. **Framework-Agnostic I18n**
   - Works without React-i18next or other i18n frameworks
   - Lightweight and fast
   - TypeScript-first with full type safety

2. **Multiple Language Support**
   - English, Spanish, French, Arabic, Japanese, Hindi, German
   - Automatic RTL/LTR detection and layout adaptation
   - Browser locale detection

3. **Advanced Interpolation**
   - Variable substitution: `Hello {{name}}!`
   - Pluralization rules for different languages
   - Context-based translations (gender, formality)

4. **Namespace Organization**
   - Separate translations by domain/feature
   - Multiple i18n instances for different contexts
   - Domain-specific translation management

### Advanced Features Demonstrated

#### Multiple I18n Instances
```typescript
const domainInstances = createMultipleI18n({
  auth: { locale: 'en', defaultNamespace: 'auth' },
  ecommerce: { locale: 'en', defaultNamespace: 'ecommerce' },
  admin: { locale: 'en', defaultNamespace: 'admin' }
});
```

#### Browser-Optimized Instance
```typescript
const browserI18n = createBrowserI18n({
  fallbackLocale: 'en',
  devtools: true
});
```

#### Advanced Pluralization
```typescript
// English: "1 item" / "5 items"
// Russian: "1 элемент" / "2 элемента" / "5 элементов" 
i18n.t('items', { count: 5, interpolation: { count: 5 } })
```

#### Context-Based Translations
```typescript
// Gender-based contexts
i18n.t('button', { context: 'male' })   // "Button (masculine)"
i18n.t('button', { context: 'female' }) // "Button (feminine)"
```

### DevTools Integration

The example showcases deep integration with TanStack DevTools:

- **Real-time Monitoring**: See translation access in real-time
- **Missing Key Detection**: Automatic detection and reporting
- **Performance Metrics**: Track lookup times and usage statistics
- **Multi-Instance Support**: Monitor multiple i18n instances simultaneously
- **Usage Analytics**: See which translations are used most

### Performance Features

1. **Usage Tracking**: Monitor which translations are accessed
2. **Missing Key Detection**: Automatically detect and report missing translations
3. **Performance Metrics**: Measure translation lookup performance
4. **Memory Optimization**: Efficient memory usage with large translation sets

### Localization Features

1. **Number Formatting**: Locale-specific number, currency, and percentage formatting
2. **Date/Time Formatting**: Locale-aware date and time display
3. **RTL Support**: Automatic right-to-left language support
4. **Relative Time**: "2 hours ago", "just now" formatting

## 🧰 DevTools Usage

1. **Open DevTools**: Press `Ctrl+Shift+Alt+D` (or `Cmd+Shift+Alt+D` on Mac)
2. **Navigate to I18n Tab**: Find the "I18n" tab in the DevTools panel
3. **Monitor Activity**: Perform actions in the demo to see real-time tracking
4. **Explore Features**: Use the various demo sections to trigger different events

### What You'll See in DevTools

- **Translation Usage**: Every translation access tracked
- **Missing Keys**: Red indicators for missing translations
- **Language Changes**: Locale switching events
- **Performance Data**: Lookup times and usage statistics
- **Instance Separation**: Different instances tracked separately
- **Namespace Organization**: Translations organized by namespace

## 📚 Code Examples

### Basic Usage
```typescript
import { i18n } from '@sucoza/i18n';

// Set locale
i18n.setLocale('es');

// Add translations
i18n.addTranslations('es', {
  greeting: '¡Hola {{name}}!'
});

// Use translation
console.log(i18n.t('greeting', { interpolation: { name: 'Mundo' } }));
// Output: "¡Hola Mundo!"
```

### Multiple Instances
```typescript
import { createMultipleI18n } from '@sucoza/i18n';

const instances = createMultipleI18n({
  auth: { defaultNamespace: 'auth' },
  shop: { defaultNamespace: 'shop' }
});

instances.auth.t('login');
instances.shop.t('addToCart');
```

### DevTools Integration
```typescript
import { createSucozaI18nAdapter } from '@sucoza/i18n-devtools-plugin';

// Automatic DevTools integration
const adapter = createSucozaI18nAdapter(i18n);
```

## 🎯 Key Takeaways

1. **Zero Dependencies**: Works without external i18n libraries
2. **DevTools First**: Built-in integration with TanStack DevTools
3. **Performance Focused**: Fast lookups and memory efficient
4. **Developer Friendly**: Comprehensive debugging and monitoring
5. **Production Ready**: Battle-tested with real-world features

## 🔧 Customization

The example is designed to be modified and extended. Try:

1. **Adding New Languages**: Add more locales and translations
2. **Custom Pluralization**: Implement custom pluralization rules
3. **Context Extensions**: Add more context-based translations
4. **Performance Testing**: Modify the performance test parameters
5. **Domain Expansion**: Create additional domain-specific instances

This example serves as both a demonstration and a starting point for implementing `@sucoza/i18n` in your own projects.