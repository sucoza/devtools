# I18n DevTools Plugin Example

This example demonstrates the I18n DevTools plugin working with both **react-i18next** and **@sucoza/i18n** simultaneously, showcasing dual integration capabilities.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Run the development server
npm run dev
```

Visit `http://localhost:3000` to see the demo in action.

## 📋 What This Demo Shows

### Dual Integration Support

This example uniquely demonstrates the DevTools plugin working with **two different i18n systems** at the same time:

1. **React-i18next Integration**
   - Traditional react-i18next setup with useTranslation hook
   - Namespace-based translations
   - Standard i18next interpolation and pluralization

2. **@sucoza/i18n Integration**
   - Custom i18n instance with advanced features
   - Built-in DevTools integration
   - Performance monitoring and analytics

### Key Features Demonstrated

#### React-i18next Integration
```typescript
import { useTranslation } from 'react-i18next';

function Component() {
  const { t, i18n } = useTranslation();
  
  return <div>{t('greeting', { name: 'World' })}</div>;
}
```

#### @sucoza/i18n Integration  
```typescript
import { createI18n, createSucozaI18nAdapter } from '@sucoza/i18n';

const customI18n = createI18n({
  locale: 'en',
  devtools: true,
  debug: true
});

// Automatic DevTools integration
const adapter = createSucozaI18nAdapter(customI18n);
```

#### Dual DevTools Adapters
```typescript
// Both systems monitored simultaneously
const reactAdapter = createReactI18nextAdapter(reactI18n);
const sucozaAdapter = createSucozaI18nAdapter(customI18n);
```

### Interactive Demo Sections

1. **Language Switching**
   - Test both i18n systems with different locales
   - See real-time language change events in DevTools
   - Compare behavior between the two systems

2. **Translation Usage Tracking**
   - Monitor translation key access across both systems
   - Track interpolation and pluralization usage
   - See missing key detection in action

3. **Performance Analytics**
   - Real-time performance metrics
   - Translation lookup time measurement
   - Memory usage monitoring
   - Batch operation testing

4. **Missing Key Detection**
   - Trigger missing translation scenarios
   - See how both systems handle fallbacks
   - Monitor missing key events in DevTools

5. **Interactive Features**
   - Search functionality that triggers translation access
   - Dynamic content that tests interpolation
   - Batch operations for performance testing

## 🧰 DevTools Integration

### Opening DevTools

Press `Ctrl+Shift+Alt+D` (or `Cmd+Shift+Alt+D` on Mac) to open TanStack DevTools, then navigate to the **I18n** tab.

### What You'll See

The DevTools panel will show data from **both** i18n systems:

#### Translation Events
- **Key Access**: Every translation lookup from both systems
- **Language Changes**: Locale switching events
- **Missing Keys**: Translations not found in either system
- **Performance Metrics**: Lookup times and usage statistics

#### System Separation
- Events are tagged with their source system
- Performance metrics tracked separately
- Usage statistics for each instance

#### Real-Time Monitoring
- Live updates as you interact with the demo
- Event timeline with timestamps
- Performance graphs and charts

## 📊 Performance Testing

The demo includes several performance testing features:

### Batch Translation Test
```typescript
const performBatchTranslations = () => {
  const startTime = performance.now();
  
  for (let i = 0; i < 100; i++) {
    t('common.button.save');                    // react-i18next
    customI18n.t('customMessage');              // @sucoza/i18n
  }
  
  const endTime = performance.now();
  // Performance metrics updated in real-time
};
```

### Missing Key Generation
```typescript
const triggerMissingTranslation = () => {
  // Triggers missing key events in both systems
  t('missing.key.example');
  customI18n.t('another.missing.key');
};
```

## 🌐 Localization Features

### Multi-Language Support
- **English**: Default language with full translations
- **Spanish**: Complete Spanish translations
- **French**: French localization
- **German**: German translations
- **Supported by both systems**: All languages work with both i18n implementations

### Advanced Formatting
- **Numbers**: Locale-specific number formatting
- **Currencies**: Currency formatting per locale
- **Dates**: Date/time formatting
- **RTL Support**: Right-to-left language detection

### Interpolation Examples
```typescript
// react-i18next style
t('greeting', { name: userName })

// @sucoza/i18n style  
customI18n.t('dynamicCount', {
  count: itemCount,
  interpolation: { count: itemCount }
})
```

## 🔧 Code Structure

```
src/
├── App.tsx           # Main demo component
├── i18n-setup.ts     # react-i18next configuration
├── index.css         # Enhanced styling
└── main.tsx          # React app entry point
```

### Key Implementation Details

#### React-i18next Setup
```typescript
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: { /* translations */ }},
      es: { translation: { /* translations */ }}
    },
    lng: 'en',
    fallbackLng: 'en'
  });
```

#### @sucoza/i18n Setup
```typescript
const customI18n = createI18n({
  locale: 'en',
  fallbackLocale: 'en',
  devtools: true,
  debug: true,
  defaultNamespace: 'custom'
});
```

#### DevTools Adapter Setup
```typescript
useEffect(() => {
  const reactAdapter = createReactI18nextAdapter(reactI18n);
  const sucozaAdapter = createSucozaI18nAdapter(customI18n);
  
  return () => {
    reactAdapter.destroy?.();
    sucozaAdapter.destroy();
  };
}, []);
```

## 🎯 Learning Objectives

This example helps you understand:

1. **Dual System Integration**: How to use multiple i18n systems together
2. **DevTools Monitoring**: Real-time translation tracking and analytics
3. **Performance Comparison**: Compare performance between different systems
4. **Migration Strategy**: How to transition from react-i18next to @sucoza/i18n
5. **Best Practices**: Proper setup and configuration of DevTools integration

## 🚧 Common Use Cases

### Migration Scenario
This setup is perfect for gradual migration from react-i18next to @sucoza/i18n:
- Keep existing react-i18next code working
- Gradually introduce @sucoza/i18n for new features
- Monitor performance differences
- Track usage patterns

### A/B Testing
Compare the two systems side-by-side:
- Performance benchmarks
- Feature compatibility
- Developer experience
- Bundle size impact

### Framework Integration
See how the DevTools plugin works with:
- Traditional React i18n solutions
- Modern framework-agnostic utilities
- Multiple translation systems

## 🔍 Troubleshooting

### Common Issues

1. **DevTools Not Appearing**
   - Ensure both adapters are properly initialized
   - Check that devtools config is enabled
   - Verify TanStack DevTools is installed

2. **Missing Translations Not Detected**
   - Check adapter configuration
   - Ensure debug mode is enabled
   - Verify event listeners are properly set up

3. **Performance Metrics Not Updating**
   - Check that performance tracking is enabled
   - Verify event handlers are properly attached
   - Ensure adapters are not destroyed prematurely

This example serves as a comprehensive guide for implementing the I18n DevTools plugin in complex, multi-system environments.