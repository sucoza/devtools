import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { i18n, createI18n, formatNumber, formatDate, isRTL } from '@sucoza/i18n';
import { 
  I18nDevToolsPanel, 
  createSucozaI18nAdapter,
  createReactI18nextAdapter 
} from '@sucoza/i18n-devtools-plugin';
import './i18n-setup';

// Create a separate i18n instance to demonstrate both integrations
const customI18n = createI18n({
  locale: 'en',
  fallbackLocale: 'en',
  devtools: true,
  debug: true,
  defaultNamespace: 'custom'
});

// Setup translations for custom instance
customI18n.addTranslations('en', {
  customMessage: 'This is from @sucoza/i18n utility',
  dynamicCount: 'Custom instance has {{count}} dynamic item',
  dynamicCount_plural: 'Custom instance has {{count}} dynamic items',
  nested: {
    deep: {
      message: 'Deep nested translation works!'
    }
  }
}, 'custom');

customI18n.addTranslations('es', {
  customMessage: 'Esto es de la utilidad @sucoza/i18n',
  dynamicCount: 'La instancia personalizada tiene {{count}} elemento dinámico',
  dynamicCount_plural: 'La instancia personalizada tiene {{count}} elementos dinámicos',
  nested: {
    deep: {
      message: '¡La traducción anidada profunda funciona!'
    }
  }
}, 'custom');

function App() {
  const { t, i18n: reactI18n } = useTranslation();
  const [currentLocale, setCurrentLocale] = useState('en');
  const [customLocale, setCustomLocale] = useState(customI18n.locale);
  const [dynamicCount, setDynamicCount] = useState(1);
  const [userName, setUserName] = useState('DevTools User');
  const [searchTerm, setSearchTerm] = useState('');

  // State for performance demo
  const [performanceMetrics, setPerformanceMetrics] = useState({
    translationsLoaded: 0,
    keysAccessed: 0,
    missingKeys: 0,
    averageLookupTime: 0
  });

  // Initialize DevTools adapters
  useEffect(() => {
    // Setup React-i18next adapter
    const reactAdapter = createReactI18nextAdapter(reactI18n as any);
    
    // Setup Sucoza i18n adapter
    const sucozaAdapter = createSucozaI18nAdapter(customI18n);

    // Listen to custom i18n events for metrics
    const unsubscribe = customI18n.on('translation:access', () => {
      setPerformanceMetrics(prev => ({
        ...prev,
        keysAccessed: prev.keysAccessed + 1
      }));
    });

    const missingUnsubscribe = customI18n.on('translation:missing', () => {
      setPerformanceMetrics(prev => ({
        ...prev,
        missingKeys: prev.missingKeys + 1
      }));
    });

    // Simulate initial metrics
    setPerformanceMetrics({
      translationsLoaded: 45,
      keysAccessed: 0,
      missingKeys: 0,
      averageLookupTime: 0.3
    });

    return () => {
      unsubscribe();
      missingUnsubscribe();
      reactAdapter.destroy?.();
      sucozaAdapter.destroy();
    };
  }, [reactI18n]);

  // Handle locale changes
  const handleReactI18nLocaleChange = useCallback(async (locale: string) => {
    await reactI18n.changeLanguage(locale);
    setCurrentLocale(locale);
  }, [reactI18n]);

  const handleCustomLocaleChange = useCallback(async (locale: string) => {
    await customI18n.setLocale(locale);
    setCustomLocale(locale);
  }, []);

  // Simulate search functionality that triggers translation access
  const performSearch = useCallback(() => {
    if (!searchTerm) return;
    
    // This would trigger translation key access
    const searchResults = [
      t('search.results', { defaultValue: 'Search results' }),
      t('search.noResults', { defaultValue: 'No results found' }),
      customI18n.t('nested.deep.message', { namespace: 'custom' })
    ];
    
    console.log('Search performed:', searchResults);
  }, [searchTerm, t]);

  // Trigger missing translation
  const triggerMissingTranslation = useCallback(() => {
    // This will create missing key events
    t('missing.key.example', { defaultValue: 'Fallback for missing key' });
    customI18n.t('another.missing.key', { namespace: 'custom', defaultValue: 'Another fallback' });
  }, [t]);

  // Batch operations to show performance impact
  const performBatchTranslations = useCallback(() => {
    const startTime = performance.now();
    
    for (let i = 0; i < 100; i++) {
      t('common.button.save');
      t('common.message.loading');
      customI18n.t('customMessage', { namespace: 'custom' });
    }
    
    const endTime = performance.now();
    const avgTime = (endTime - startTime) / 300; // 300 total translations
    
    setPerformanceMetrics(prev => ({
      ...prev,
      averageLookupTime: Math.round(avgTime * 100) / 100
    }));
  }, [t]);

  const direction = isRTL(currentLocale) ? 'rtl' : 'ltr';

  return (
    <div className={`container ${direction === 'rtl' ? 'rtl' : 'ltr'}`}>
      <h1>{t('title', { defaultValue: 'I18n DevTools Plugin Demo' })}</h1>

      {/* Instructions */}
      <div className="instructions">
        <h3>🧰 DevTools Integration Demo</h3>
        <p>
          This demo showcases the I18n DevTools plugin working with both <strong>react-i18next</strong> and 
          <strong> @sucoza/i18n</strong> simultaneously. Press <kbd>Ctrl+Shift+Alt+D</kbd> (or <kbd>Cmd+Shift+Alt+D</kbd> on Mac) 
          to open TanStack DevTools and navigate to the <strong>I18n</strong> tab.
        </p>
        <p>
          The DevTools will show real-time translation usage, missing keys, language switching events, 
          and performance metrics from both i18n systems.
        </p>
      </div>

      {/* React-i18next Section */}
      <div className="section">
        <h2>📚 React-i18next Integration</h2>
        <p>Current Language: <strong>{currentLocale}</strong></p>
        
        <div className="button-group">
          {['en', 'es', 'fr', 'de'].map(locale => (
            <button
              key={locale}
              className={`button ${currentLocale === locale ? 'active' : ''}`}
              onClick={() => handleReactI18nLocaleChange(locale)}
            >
              {locale.toUpperCase()}
            </button>
          ))}
        </div>

        <div className="grid">
          <div className="card">
            <h3>{t('examples.basic', { defaultValue: 'Basic Translations' })}</h3>
            <div className="translation-item">
              <span>Welcome: {t('common.welcome', { defaultValue: 'Welcome' })}</span>
            </div>
            <div className="translation-item">
              <span>Save: {t('common.button.save', { defaultValue: 'Save' })}</span>
            </div>
            <div className="translation-item">
              <span>Loading: {t('common.message.loading', { defaultValue: 'Loading...' })}</span>
            </div>
          </div>

          <div className="card">
            <h3>{t('examples.interpolation', { defaultValue: 'Interpolation' })}</h3>
            <p>
              {t('greeting', { 
                name: userName, 
                defaultValue: 'Hello {{name}}!' 
              })}
            </p>
            <input
              className="input"
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="Enter your name"
            />
          </div>
        </div>
      </div>

      {/* Sucoza I18n Section */}
      <div className="section">
        <h2>🔧 @sucoza/i18n Integration</h2>
        <p>Current Language: <strong>{customLocale}</strong></p>
        
        <div className="button-group">
          {['en', 'es'].map(locale => (
            <button
              key={locale}
              className={`button ${customLocale === locale ? 'active' : ''}`}
              onClick={() => handleCustomLocaleChange(locale)}
            >
              {locale.toUpperCase()}
            </button>
          ))}
        </div>

        <div className="grid">
          <div className="card">
            <h3>Custom Instance Translations</h3>
            <div className="translation-item">
              <span>{customI18n.t('customMessage', { namespace: 'custom' })}</span>
            </div>
            <div className="translation-item">
              <span>
                {customI18n.t('dynamicCount', { 
                  namespace: 'custom',
                  count: dynamicCount,
                  interpolation: { count: dynamicCount }
                })}
              </span>
            </div>
            <div className="translation-item">
              <span>{customI18n.t('nested.deep.message', { namespace: 'custom' })}</span>
            </div>
          </div>

          <div className="card">
            <h3>Pluralization Demo</h3>
            <div className="button-group">
              <button 
                className="button secondary"
                onClick={() => setDynamicCount(Math.max(0, dynamicCount - 1))}
              >
                -
              </button>
              <span style={{ margin: '0 15px', fontSize: '18px' }}>{dynamicCount}</span>
              <button 
                className="button secondary"
                onClick={() => setDynamicCount(dynamicCount + 1)}
              >
                +
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Performance & Analytics Section */}
      <div className="section">
        <h2>📊 Performance & Analytics</h2>
        
        <div className="performance-grid">
          <div className="performance-card">
            <span className="performance-number">{performanceMetrics.translationsLoaded}</span>
            <span className="performance-label">Translations Loaded</span>
          </div>
          <div className="performance-card">
            <span className="performance-number">{performanceMetrics.keysAccessed}</span>
            <span className="performance-label">Keys Accessed</span>
          </div>
          <div className="performance-card">
            <span className="performance-number">{performanceMetrics.missingKeys}</span>
            <span className="performance-label">Missing Keys</span>
          </div>
          <div className="performance-card">
            <span className="performance-number">{performanceMetrics.averageLookupTime}ms</span>
            <span className="performance-label">Avg Lookup Time</span>
          </div>
        </div>

        <div className="button-group">
          <button className="button" onClick={performBatchTranslations}>
            Run Batch Translations (300x)
          </button>
          <button className="button secondary" onClick={triggerMissingTranslation}>
            Trigger Missing Keys
          </button>
        </div>
      </div>

      {/* Search & Interaction Section */}
      <div className="section">
        <h2>🔍 Interactive Features</h2>
        
        <div className="card">
          <h3>Search Demo (triggers translation access)</h3>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <input
              className="input"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Enter search term..."
            />
            <button className="button" onClick={performSearch}>
              {t('common.button.search', { defaultValue: 'Search' })}
            </button>
          </div>
        </div>

        <div className="card">
          <h3>Current State Debug Info</h3>
          <div className="code">
{JSON.stringify({
  reactI18n: {
    language: currentLocale,
    loadedNamespaces: reactI18n.loadedNamespaces || [],
  },
  customI18n: {
    locale: customLocale,
    availableLocales: customI18n.locales,
    missingKeys: customI18n.getMissingKeys(),
    usageStats: customI18n.getUsageStats().length
  },
  performance: performanceMetrics
}, null, 2)}
          </div>
        </div>
      </div>

      {/* Formatting Demo */}
      <div className="section">
        <h2>🌍 Localization Features</h2>
        
        <div className="grid">
          <div className="card">
            <h3>Number & Date Formatting</h3>
            <div className="metric">
              <span className="metric-label">Number:</span>
              <span className="metric-value">{formatNumber(12345.67, currentLocale)}</span>
            </div>
            <div className="metric">
              <span className="metric-label">Currency:</span>
              <span className="metric-value">
                {formatNumber(1234.56, currentLocale, { 
                  style: 'currency', 
                  currency: currentLocale === 'de' ? 'EUR' : 'USD'
                })}
              </span>
            </div>
            <div className="metric">
              <span className="metric-label">Date:</span>
              <span className="metric-value">{formatDate(new Date(), currentLocale)}</span>
            </div>
          </div>

          <div className="card">
            <h3>RTL/LTR Testing</h3>
            <p>Current Direction: <strong>{direction}</strong></p>
            <p>Is RTL Language: <strong>{isRTL(currentLocale) ? 'Yes' : 'No'}</strong></p>
            <div style={{ 
              padding: '10px', 
              background: isRTL(currentLocale) ? '#ffeaa7' : '#74b9ff',
              color: isRTL(currentLocale) ? '#2d3436' : 'white',
              borderRadius: '4px',
              textAlign: direction === 'rtl' ? 'right' : 'left'
            }}>
              This text adapts to the text direction of the selected language.
            </div>
          </div>
        </div>
      </div>

      {/* DevTools Panel */}
      <I18nDevToolsPanel />
    </div>
  );
}

export default App;