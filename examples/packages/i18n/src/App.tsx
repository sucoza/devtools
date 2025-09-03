import React, { useState, useEffect } from 'react';
import { i18n, createI18n, formatNumber, formatDate, formatRelativeTime, isRTL } from '@sucoza/i18n';
import { I18nDevToolsPanel, createSucozaI18nAdapter } from '@sucoza/i18n-devtools-plugin';

// Initialize translations
const setupTranslations = () => {
  // English translations
  i18n.addTranslations('en', {
    greeting: 'Hello {{name}}!',
    welcome: 'Welcome to the @sucoza/i18n demo',
    currentTime: 'Current time',
    items: 'You have {{count}} item',
    items_plural: 'You have {{count}} items',
    actions: {
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      edit: 'Edit'
    },
    navigation: {
      home: 'Home',
      profile: 'Profile',
      settings: 'Settings',
      logout: 'Log Out'
    }
  }, 'common');

  // Spanish translations
  i18n.addTranslations('es', {
    greeting: '¡Hola {{name}}!',
    welcome: 'Bienvenido a la demo de @sucoza/i18n',
    currentTime: 'Hora actual',
    items: 'Tienes {{count}} elemento',
    items_plural: 'Tienes {{count}} elementos',
    actions: {
      save: 'Guardar',
      cancel: 'Cancelar',
      delete: 'Eliminar',
      edit: 'Editar'
    },
    navigation: {
      home: 'Inicio',
      profile: 'Perfil',
      settings: 'Configuración',
      logout: 'Cerrar Sesión'
    }
  }, 'common');

  // French translations
  i18n.addTranslations('fr', {
    greeting: 'Bonjour {{name}}!',
    welcome: 'Bienvenue dans la démo @sucoza/i18n',
    currentTime: 'Heure actuelle',
    items: 'Vous avez {{count}} élément',
    items_plural: 'Vous avez {{count}} éléments',
    actions: {
      save: 'Enregistrer',
      cancel: 'Annuler',
      delete: 'Supprimer',
      edit: 'Modifier'
    },
    navigation: {
      home: 'Accueil',
      profile: 'Profil',
      settings: 'Paramètres',
      logout: 'Se Déconnecter'
    }
  }, 'common');

  // Arabic translations (RTL example)
  i18n.addTranslations('ar', {
    greeting: 'مرحبا {{name}}!',
    welcome: 'مرحبا بكم في عرض @sucoza/i18n',
    currentTime: 'الوقت الحالي',
    items: 'لديك {{count}} عنصر',
    items_plural: 'لديك {{count}} عناصر',
    actions: {
      save: 'حفظ',
      cancel: 'إلغاء',
      delete: 'حذف',
      edit: 'تعديل'
    },
    navigation: {
      home: 'الرئيسية',
      profile: 'الملف الشخصي',
      settings: 'الإعدادات',
      logout: 'تسجيل الخروج'
    }
  }, 'common');

  // Add locale information
  i18n.addLocale('en', {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    direction: 'ltr'
  });

  i18n.addLocale('es', {
    code: 'es',
    name: 'Spanish',
    nativeName: 'Español',
    direction: 'ltr'
  });

  i18n.addLocale('fr', {
    code: 'fr',
    name: 'French',
    nativeName: 'Français',
    direction: 'ltr'
  });

  i18n.addLocale('ar', {
    code: 'ar',
    name: 'Arabic',
    nativeName: 'العربية',
    direction: 'rtl'
  });
};

function App() {
  const [currentLocale, setCurrentLocale] = useState(i18n.locale);
  const [itemCount, setItemCount] = useState(1);
  const [userName, setUserName] = useState('World');
  const [currentTime, setCurrentTime] = useState(new Date());

  // Initialize translations and DevTools adapter
  useEffect(() => {
    setupTranslations();
    
    // Create and setup DevTools adapter
    const adapter = createSucozaI18nAdapter(i18n);

    // Listen for locale changes
    const unsubscribe = i18n.on('locale:change', (event) => {
      setCurrentLocale(event.to);
    });

    // Update time every second
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => {
      unsubscribe();
      adapter.destroy();
      clearInterval(timeInterval);
    };
  }, []);

  // Handle locale change
  const handleLocaleChange = async (locale: string) => {
    await i18n.setLocale(locale);
  };

  // Get current direction
  const direction = isRTL(currentLocale) ? 'rtl' : 'ltr';

  return (
    <div style={{ direction, textAlign: direction === 'rtl' ? 'right' : 'left' }}>
      <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
        <h1>{i18n.t('welcome', { namespace: 'common' })}</h1>
        
        {/* Language Selector */}
        <div style={{ marginBottom: '30px' }}>
          <h2>Language / اللغة / Idioma / Langue</h2>
          <div>
            {['en', 'es', 'fr', 'ar'].map(locale => (
              <button
                key={locale}
                onClick={() => handleLocaleChange(locale)}
                style={{
                  backgroundColor: currentLocale === locale ? '#007bff' : '#f8f9fa',
                  color: currentLocale === locale ? 'white' : 'black',
                  margin: '5px'
                }}
              >
                {i18n.getLocaleInfo(locale)?.nativeName || locale.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Greeting with Interpolation */}
        <div style={{ marginBottom: '30px' }}>
          <h2>{i18n.t('greeting', { 
            namespace: 'common', 
            interpolation: { name: userName }
          })}</h2>
          <input
            type="text"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            placeholder="Enter your name"
            style={{ padding: '8px', marginLeft: '10px' }}
          />
        </div>

        {/* Pluralization Demo */}
        <div style={{ marginBottom: '30px' }}>
          <h2>Pluralization Demo</h2>
          <p>{i18n.t('items', { 
            namespace: 'common',
            count: itemCount,
            interpolation: { count: itemCount }
          })}</p>
          <div>
            <button onClick={() => setItemCount(Math.max(0, itemCount - 1))}>-</button>
            <span style={{ margin: '0 15px', fontSize: '18px' }}>{itemCount}</span>
            <button onClick={() => setItemCount(itemCount + 1)}>+</button>
          </div>
        </div>

        {/* Actions (Nested translations) */}
        <div style={{ marginBottom: '30px' }}>
          <h2>Actions</h2>
          <div>
            <button>{i18n.t('actions.save', { namespace: 'common' })}</button>
            <button>{i18n.t('actions.edit', { namespace: 'common' })}</button>
            <button>{i18n.t('actions.delete', { namespace: 'common' })}</button>
            <button>{i18n.t('actions.cancel', { namespace: 'common' })}</button>
          </div>
        </div>

        {/* Navigation */}
        <div style={{ marginBottom: '30px' }}>
          <h2>Navigation</h2>
          <nav>
            <a href="#" style={{ margin: '0 10px' }}>
              {i18n.t('navigation.home', { namespace: 'common' })}
            </a>
            <a href="#" style={{ margin: '0 10px' }}>
              {i18n.t('navigation.profile', { namespace: 'common' })}
            </a>
            <a href="#" style={{ margin: '0 10px' }}>
              {i18n.t('navigation.settings', { namespace: 'common' })}
            </a>
            <a href="#" style={{ margin: '0 10px' }}>
              {i18n.t('navigation.logout', { namespace: 'common' })}
            </a>
          </nav>
        </div>

        {/* Formatting Demo */}
        <div style={{ marginBottom: '30px' }}>
          <h2>{i18n.t('currentTime', { namespace: 'common' })}</h2>
          <div>
            <p><strong>Date:</strong> {formatDate(currentTime, currentLocale)}</p>
            <p><strong>Number:</strong> {formatNumber(12345.67, currentLocale)}</p>
            <p><strong>Currency:</strong> {formatNumber(1234.56, currentLocale, { 
              style: 'currency', 
              currency: currentLocale === 'ar' ? 'SAR' : 'USD' 
            })}</p>
            <p><strong>Relative:</strong> {formatRelativeTime(
              new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
              currentLocale
            )}</p>
          </div>
        </div>

        {/* Missing Translation Demo */}
        <div style={{ marginBottom: '30px' }}>
          <h2>Missing Translation Demo</h2>
          <p>This will show a missing key warning in DevTools:</p>
          <p>{i18n.t('missing.translation.key', { 
            namespace: 'common',
            defaultValue: 'This is a fallback value'
          })}</p>
        </div>

        {/* Current State Info */}
        <div style={{ marginBottom: '30px' }}>
          <h2>Current State</h2>
          <pre style={{ 
            background: '#f5f5f5', 
            padding: '15px', 
            borderRadius: '5px',
            textAlign: 'left',
            overflow: 'auto',
            fontSize: '14px'
          }}>
            {JSON.stringify({
              locale: currentLocale,
              direction: direction,
              availableLocales: i18n.locales,
              missingKeys: i18n.getMissingKeys(),
              usageStats: i18n.getUsageStats().slice(0, 5) // Show first 5
            }, null, 2)}
          </pre>
        </div>

        {/* Instructions */}
        <div style={{ 
          background: '#e3f2fd', 
          padding: '20px', 
          borderRadius: '8px',
          marginBottom: '30px'
        }}>
          <h3>🧰 DevTools Instructions</h3>
          <p>Press <kbd>Ctrl+Shift+Alt+D</kbd> (or <kbd>Cmd+Shift+Alt+D</kbd> on Mac) to open TanStack DevTools.</p>
          <p>Navigate to the <strong>I18n</strong> tab to see:</p>
          <ul style={{ textAlign: 'left', margin: '10px 0' }}>
            <li>Translation key usage tracking</li>
            <li>Missing translation detection</li>
            <li>Language switching events</li>
            <li>Namespace organization</li>
            <li>Translation coverage analysis</li>
          </ul>
        </div>
      </div>

      {/* DevTools Panel */}
      <I18nDevToolsPanel />
    </div>
  );
}

export default App;