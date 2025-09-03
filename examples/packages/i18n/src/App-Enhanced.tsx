import React, { useState, useEffect, useCallback } from 'react';
import { 
  i18n, 
  createI18n, 
  createBrowserI18n, 
  createMultipleI18n,
  formatNumber, 
  formatDate, 
  formatRelativeTime, 
  isRTL, 
  getBrowserLocales,
  isValidLocale
} from '@sucoza/i18n';
import { I18nDevToolsPanel, createSucozaI18nAdapter } from '@sucoza/i18n-devtools-plugin';

// Create multiple i18n instances for different domains
const domainInstances = createMultipleI18n({
  auth: { 
    locale: 'en', 
    defaultNamespace: 'auth',
    debug: true 
  },
  ecommerce: { 
    locale: 'en', 
    defaultNamespace: 'ecommerce',
    debug: true 
  },
  admin: { 
    locale: 'en', 
    defaultNamespace: 'admin',
    debug: true 
  }
});

// Browser-optimized instance
const browserI18n = createBrowserI18n({
  fallbackLocale: 'en',
  devtools: true,
  debug: true
});

// Setup comprehensive translations
const setupAdvancedTranslations = () => {
  // Main instance translations with advanced features
  const languages = ['en', 'es', 'fr', 'de', 'ja', 'ar', 'hi'];
  
  // English translations
  i18n.addTranslations('en', {
    welcome: 'Welcome to the Enhanced @sucoza/i18n Demo',
    greeting: 'Hello {{name}}! You have {{unreadCount}} unread message',
    greeting_plural: 'Hello {{name}}! You have {{unreadCount}} unread messages',
    currentTime: 'Current time',
    
    // Context-based translations
    button: 'Button',
    button_male: 'Button (masculine)',
    button_female: 'Button (feminine)',
    
    // Complex pluralization
    file: '{{count}} file',
    file_plural: '{{count}} files',
    
    // Nested structures
    user: {
      profile: {
        name: 'Name',
        email: 'Email',
        settings: {
          language: 'Language',
          theme: 'Theme',
          notifications: 'Notifications'
        }
      },
      actions: {
        edit: 'Edit Profile',
        delete: 'Delete Account',
        export: 'Export Data'
      }
    },
    
    // Date/Time contexts
    timeAgo: {
      justNow: 'just now',
      minutesAgo: '{{count}} minute ago',
      minutesAgo_plural: '{{count}} minutes ago',
      hoursAgo: '{{count}} hour ago', 
      hoursAgo_plural: '{{count}} hours ago'
    },
    
    // Error messages
    errors: {
      network: 'Network connection failed',
      validation: 'Please check your input',
      permission: 'You don\'t have permission to perform this action',
      generic: 'Something went wrong. Please try again.'
    },
    
    // Status messages  
    status: {
      loading: 'Loading...',
      success: 'Operation completed successfully',
      processing: 'Processing your request...',
      idle: 'Ready'
    }
  }, 'common');

  // Domain-specific translations for auth
  domainInstances.auth.addTranslations('en', {
    login: 'Log In',
    logout: 'Log Out',
    signup: 'Sign Up',
    forgotPassword: 'Forgot Password?',
    resetPassword: 'Reset Password',
    
    validation: {
      emailRequired: 'Email is required',
      passwordTooShort: 'Password must be at least {{minLength}} characters',
      passwordMismatch: 'Passwords do not match'
    },
    
    messages: {
      loginSuccess: 'Welcome back!',
      logoutSuccess: 'You have been logged out',
      passwordResetSent: 'Password reset email sent'
    }
  }, 'auth');

  // E-commerce translations
  domainInstances.ecommerce.addTranslations('en', {
    product: {
      addToCart: 'Add to Cart',
      buyNow: 'Buy Now',
      outOfStock: 'Out of Stock',
      price: '${{amount}}',
      discount: '{{percent}}% OFF',
      rating: '{{stars}} out of 5 stars'
    },
    
    cart: {
      empty: 'Your cart is empty',
      total: 'Total: ${{amount}}',
      shipping: 'Shipping: ${{amount}}',
      tax: 'Tax: ${{amount}}',
      checkout: 'Proceed to Checkout'
    },
    
    orders: {
      pending: 'Order Pending',
      processing: 'Processing Order',
      shipped: 'Order Shipped',
      delivered: 'Order Delivered'
    }
  }, 'ecommerce');

  // Admin translations
  domainInstances.admin.addTranslations('en', {
    dashboard: 'Dashboard',
    users: 'User Management',
    analytics: 'Analytics',
    settings: 'System Settings',
    
    metrics: {
      totalUsers: '{{count}} total user',
      totalUsers_plural: '{{count}} total users',
      activeUsers: '{{count}} active user',
      activeUsers_plural: '{{count}} active users',
      revenue: 'Revenue: ${{amount}}',
      conversion: 'Conversion Rate: {{rate}}%'
    },
    
    actions: {
      export: 'Export Data',
      import: 'Import Data',
      backup: 'Create Backup',
      restore: 'Restore from Backup'
    }
  }, 'admin');

  // Add locale information
  const localeData = [
    { code: 'en', name: 'English', nativeName: 'English', direction: 'ltr' },
    { code: 'es', name: 'Spanish', nativeName: 'Español', direction: 'ltr' },
    { code: 'fr', name: 'French', nativeName: 'Français', direction: 'ltr' },
    { code: 'de', name: 'German', nativeName: 'Deutsch', direction: 'ltr' },
    { code: 'ja', name: 'Japanese', nativeName: '日本語', direction: 'ltr' },
    { code: 'ar', name: 'Arabic', nativeName: 'العربية', direction: 'rtl' },
    { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', direction: 'ltr' }
  ];

  localeData.forEach(locale => {
    i18n.addLocale(locale.code, locale);
    Object.values(domainInstances).forEach(instance => {
      instance.addLocale(locale.code, locale);
    });
  });
};

function EnhancedI18nDemo() {
  const [currentLocale, setCurrentLocale] = useState(i18n.locale);
  const [unreadCount, setUnreadCount] = useState(5);
  const [userName, setUserName] = useState('Advanced User');
  const [selectedDomain, setSelectedDomain] = useState<'auth' | 'ecommerce' | 'admin'>('auth');
  const [contextGender, setContextGender] = useState<'male' | 'female' | null>(null);
  
  // Performance tracking
  const [performanceStats, setPerformanceStats] = useState({
    translationsLoaded: 0,
    keysAccessed: 0,
    missingKeys: 0,
    averageTime: 0
  });

  // Advanced demo state
  const [fileCount, setFileCount] = useState(3);
  const [orderStatus, setOrderStatus] = useState('pending');
  const [userCount, setUserCount] = useState(1247);
  const [showMissingKeys, setShowMissingKeys] = useState(false);

  // Initialize everything
  useEffect(() => {
    setupAdvancedTranslations();
    
    // Setup DevTools adapters for all instances
    const adapters = [
      createSucozaI18nAdapter(i18n),
      createSucozaI18nAdapter(domainInstances.auth),
      createSucozaI18nAdapter(domainInstances.ecommerce),
      createSucozaI18nAdapter(domainInstances.admin),
      createSucozaI18nAdapter(browserI18n)
    ];

    // Track performance metrics
    let accessCount = 0;
    let missingCount = 0;

    const unsubscribers = [
      i18n.on('translation:access', () => {
        accessCount++;
        setPerformanceStats(prev => ({ ...prev, keysAccessed: accessCount }));
      }),
      i18n.on('translation:missing', () => {
        missingCount++;
        setPerformanceStats(prev => ({ ...prev, missingKeys: missingCount }));
      })
    ];

    return () => {
      adapters.forEach(adapter => adapter.destroy());
      unsubscribers.forEach(unsub => unsub());
    };
  }, []);

  // Handle locale changes across all instances
  const handleGlobalLocaleChange = useCallback(async (locale: string) => {
    await Promise.all([
      i18n.setLocale(locale),
      domainInstances.auth.setLocale(locale),
      domainInstances.ecommerce.setLocale(locale), 
      domainInstances.admin.setLocale(locale),
      browserI18n.setLocale(locale)
    ]);
    setCurrentLocale(locale);
  }, []);

  // Performance test
  const runPerformanceTest = useCallback(() => {
    const start = performance.now();
    
    for (let i = 0; i < 1000; i++) {
      i18n.t('greeting', { 
        interpolation: { name: 'Test', unreadCount: i },
        count: i
      });
      domainInstances.auth.t('login', { namespace: 'auth' });
      domainInstances.ecommerce.t('product.addToCart', { namespace: 'ecommerce' });
    }
    
    const end = performance.now();
    const avgTime = (end - start) / 3000; // 3000 total translations
    
    setPerformanceStats(prev => ({
      ...prev,
      averageTime: Math.round(avgTime * 1000) / 1000
    }));
  }, []);

  // Generate missing keys for demo
  const triggerMissingKeys = useCallback(() => {
    const missingKeys = [
      'nonexistent.key.one',
      'missing.translation.example',
      'undefined.message.test',
      'fake.key.demo'
    ];
    
    missingKeys.forEach(key => {
      i18n.t(key, { defaultValue: `Fallback for ${key}` });
    });
    
    setShowMissingKeys(true);
  }, []);

  const direction = isRTL(currentLocale) ? 'rtl' : 'ltr';
  const currentDomainInstance = domainInstances[selectedDomain];

  return (
    <div style={{ 
      direction, 
      textAlign: direction === 'rtl' ? 'right' : 'left',
      maxWidth: '1400px',
      margin: '0 auto',
      padding: '20px'
    }}>
      <h1>{i18n.t('welcome', { namespace: 'common' })}</h1>

      {/* Enhanced Language Selector */}
      <div style={{ marginBottom: '30px', padding: '20px', background: '#f8f9fa', borderRadius: '8px' }}>
        <h2>🌍 Advanced Language Selection</h2>
        <p>Browser Locales Detected: {getBrowserLocales().join(', ')}</p>
        
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '15px' }}>
          {['en', 'es', 'fr', 'de', 'ja', 'ar', 'hi'].map(locale => {
            const localeInfo = i18n.getLocaleInfo(locale);
            return (
              <button
                key={locale}
                onClick={() => handleGlobalLocaleChange(locale)}
                style={{
                  backgroundColor: currentLocale === locale ? '#007bff' : '#ffffff',
                  color: currentLocale === locale ? 'white' : 'black',
                  border: '1px solid #dee2e6',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                {localeInfo?.nativeName || locale.toUpperCase()}
                {!isValidLocale(locale) && ' ⚠️'}
              </button>
            );
          })}
        </div>
      </div>

      {/* Multiple Instance Demo */}
      <div style={{ marginBottom: '30px', padding: '20px', background: '#e3f2fd', borderRadius: '8px' }}>
        <h2>🏗️ Multiple I18n Instances</h2>
        <p>Demonstrating domain-separated i18n instances with different namespaces.</p>
        
        <div style={{ marginBottom: '15px' }}>
          <label>Select Domain: </label>
          {(['auth', 'ecommerce', 'admin'] as const).map(domain => (
            <button
              key={domain}
              onClick={() => setSelectedDomain(domain)}
              style={{
                margin: '0 5px',
                backgroundColor: selectedDomain === domain ? '#28a745' : '#6c757d',
                color: 'white',
                border: 'none',
                padding: '6px 12px',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              {domain.charAt(0).toUpperCase() + domain.slice(1)}
            </button>
          ))}
        </div>

        <div style={{ background: 'white', padding: '15px', borderRadius: '6px', border: '1px solid #dee2e6' }}>
          <h3>{selectedDomain.charAt(0).toUpperCase() + selectedDomain.slice(1)} Domain</h3>
          {selectedDomain === 'auth' && (
            <div>
              <p>{currentDomainInstance.t('login', { namespace: 'auth' })}</p>
              <p>{currentDomainInstance.t('validation.emailRequired', { namespace: 'auth' })}</p>
              <p>{currentDomainInstance.t('validation.passwordTooShort', { 
                namespace: 'auth',
                interpolation: { minLength: 8 }
              })}</p>
            </div>
          )}
          {selectedDomain === 'ecommerce' && (
            <div>
              <p>{currentDomainInstance.t('product.addToCart', { namespace: 'ecommerce' })}</p>
              <p>{currentDomainInstance.t('product.price', { 
                namespace: 'ecommerce',
                interpolation: { amount: '29.99' }
              })}</p>
              <p>{currentDomainInstance.t('cart.total', { 
                namespace: 'ecommerce',
                interpolation: { amount: '156.47' }
              })}</p>
            </div>
          )}
          {selectedDomain === 'admin' && (
            <div>
              <p>{currentDomainInstance.t('metrics.totalUsers', { 
                namespace: 'admin',
                count: userCount,
                interpolation: { count: userCount }
              })}</p>
              <p>{currentDomainInstance.t('metrics.revenue', { 
                namespace: 'admin',
                interpolation: { amount: '47,382.91' }
              })}</p>
              <div>
                <button onClick={() => setUserCount(userCount + 100)}>Add 100 Users</button>
                <button onClick={() => setUserCount(Math.max(0, userCount - 100))} style={{ marginLeft: '10px' }}>Remove 100 Users</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Advanced Interpolation & Context */}
      <div style={{ marginBottom: '30px', padding: '20px', background: '#fff3cd', borderRadius: '8px' }}>
        <h2>🔤 Advanced Interpolation & Context</h2>
        
        <div style={{ marginBottom: '15px' }}>
          <h3>Complex Interpolation with Pluralization</h3>
          <p>{i18n.t('greeting', { 
            namespace: 'common',
            count: unreadCount,
            interpolation: { name: userName, unreadCount }
          })}</p>
          <div>
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              style={{ marginRight: '10px', padding: '5px' }}
              placeholder="Enter name"
            />
            <button onClick={() => setUnreadCount(Math.max(0, unreadCount - 1))}>-</button>
            <span style={{ margin: '0 10px' }}>{unreadCount} messages</span>
            <button onClick={() => setUnreadCount(unreadCount + 1)}>+</button>
          </div>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <h3>Context-Based Translations</h3>
          <p>Context: {contextGender || 'none'}</p>
          <p>{i18n.t('button', { 
            namespace: 'common',
            context: contextGender || undefined
          })}</p>
          <div>
            <button onClick={() => setContextGender('male')}>Male Context</button>
            <button onClick={() => setContextGender('female')} style={{ margin: '0 10px' }}>Female Context</button>
            <button onClick={() => setContextGender(null)}>No Context</button>
          </div>
        </div>

        <div>
          <h3>File Count Pluralization</h3>
          <p>{i18n.t('file', { 
            namespace: 'common',
            count: fileCount,
            interpolation: { count: fileCount }
          })}</p>
          <div>
            <button onClick={() => setFileCount(Math.max(0, fileCount - 1))}>-</button>
            <span style={{ margin: '0 10px' }}>{fileCount}</span>
            <button onClick={() => setFileCount(fileCount + 1)}>+</button>
          </div>
        </div>
      </div>

      {/* Advanced Formatting */}
      <div style={{ marginBottom: '30px', padding: '20px', background: '#d1ecf1', borderRadius: '8px' }}>
        <h2>🌐 Advanced Localization Features</h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
          <div>
            <h3>Number & Currency Formatting</h3>
            <p><strong>Number:</strong> {formatNumber(1234567.89, currentLocale)}</p>
            <p><strong>Percentage:</strong> {formatNumber(0.1234, currentLocale, { style: 'percent' })}</p>
            <p><strong>Currency:</strong> {formatNumber(1234.56, currentLocale, { 
              style: 'currency', 
              currency: currentLocale === 'ja' ? 'JPY' : currentLocale === 'de' ? 'EUR' : 'USD'
            })}</p>
          </div>

          <div>
            <h3>Date & Time Formatting</h3>
            <p><strong>Full Date:</strong> {formatDate(new Date(), currentLocale, {
              weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
            })}</p>
            <p><strong>Short Date:</strong> {formatDate(new Date(), currentLocale)}</p>
            <p><strong>Relative Time:</strong> {formatRelativeTime(
              new Date(Date.now() - 2 * 60 * 60 * 1000), 
              currentLocale
            )}</p>
          </div>

          <div>
            <h3>RTL/LTR Support</h3>
            <p><strong>Direction:</strong> {direction}</p>
            <p><strong>Is RTL:</strong> {isRTL(currentLocale) ? 'Yes' : 'No'}</p>
            <div style={{
              padding: '10px',
              background: isRTL(currentLocale) ? '#ffeaa7' : '#74b9ff',
              color: isRTL(currentLocale) ? '#2d3436' : 'white',
              borderRadius: '4px',
              textAlign: 'center',
              marginTop: '10px'
            }}>
              This text adapts to {direction} layout
            </div>
          </div>
        </div>
      </div>

      {/* Performance & Analytics */}
      <div style={{ marginBottom: '30px', padding: '20px', background: '#f8d7da', borderRadius: '8px' }}>
        <h2>📊 Performance Analytics</h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '20px' }}>
          <div style={{ background: 'white', padding: '15px', borderRadius: '6px', textAlign: 'center' }}>
            <div style={{ fontSize: '2em', fontWeight: 'bold', color: '#007bff' }}>
              {performanceStats.keysAccessed}
            </div>
            <div>Keys Accessed</div>
          </div>
          <div style={{ background: 'white', padding: '15px', borderRadius: '6px', textAlign: 'center' }}>
            <div style={{ fontSize: '2em', fontWeight: 'bold', color: '#28a745' }}>
              {performanceStats.translationsLoaded}
            </div>
            <div>Translations Loaded</div>
          </div>
          <div style={{ background: 'white', padding: '15px', borderRadius: '6px', textAlign: 'center' }}>
            <div style={{ fontSize: '2em', fontWeight: 'bold', color: '#dc3545' }}>
              {performanceStats.missingKeys}
            </div>
            <div>Missing Keys</div>
          </div>
          <div style={{ background: 'white', padding: '15px', borderRadius: '6px', textAlign: 'center' }}>
            <div style={{ fontSize: '2em', fontWeight: 'bold', color: '#6610f2' }}>
              {performanceStats.averageTime}ms
            </div>
            <div>Avg Lookup Time</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button 
            onClick={runPerformanceTest}
            style={{ backgroundColor: '#17a2b8', color: 'white', border: 'none', padding: '10px 15px', borderRadius: '4px' }}
          >
            Run Performance Test (3000 translations)
          </button>
          <button 
            onClick={triggerMissingKeys}
            style={{ backgroundColor: '#dc3545', color: 'white', border: 'none', padding: '10px 15px', borderRadius: '4px' }}
          >
            Generate Missing Keys
          </button>
        </div>

        {showMissingKeys && (
          <div style={{ marginTop: '15px', background: 'white', padding: '15px', borderRadius: '6px' }}>
            <h4>Missing Keys Detected:</h4>
            <ul>
              {i18n.getMissingKeys().map(key => (
                <li key={key} style={{ color: '#dc3545' }}>{key}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Debug Information */}
      <div style={{ marginBottom: '30px', padding: '20px', background: '#e2e3e5', borderRadius: '8px' }}>
        <h2>🐛 Debug Information</h2>
        <details>
          <summary style={{ cursor: 'pointer', fontSize: '1.1em', marginBottom: '10px' }}>
            Click to view current state
          </summary>
          <pre style={{ 
            background: '#f8f9fa', 
            padding: '15px', 
            borderRadius: '4px',
            overflow: 'auto',
            fontSize: '12px'
          }}>
{JSON.stringify({
  mainInstance: {
    locale: i18n.locale,
    locales: i18n.locales,
    config: i18n.config,
    usageStats: i18n.getUsageStats().slice(0, 3)
  },
  domainInstances: {
    auth: {
      locale: domainInstances.auth.locale,
      usageStats: domainInstances.auth.getUsageStats().slice(0, 2)
    },
    ecommerce: {
      locale: domainInstances.ecommerce.locale,
      usageStats: domainInstances.ecommerce.getUsageStats().slice(0, 2)
    },
    admin: {
      locale: domainInstances.admin.locale,
      usageStats: domainInstances.admin.getUsageStats().slice(0, 2)
    }
  },
  browserDetection: {
    detectedLocales: getBrowserLocales(),
    currentDirection: direction,
    isRTL: isRTL(currentLocale)
  },
  performance: performanceStats
}, null, 2)}
          </pre>
        </details>
      </div>

      {/* DevTools Instructions */}
      <div style={{ 
        background: '#e3f2fd', 
        padding: '20px', 
        borderRadius: '8px',
        marginBottom: '30px'
      }}>
        <h3>🧰 DevTools Integration</h3>
        <p>
          This enhanced demo showcases multiple i18n instances working together. 
          Press <kbd>Ctrl+Shift+Alt+D</kbd> (or <kbd>Cmd+Shift+Alt+D</kbd> on Mac) to open TanStack DevTools.
        </p>
        <p>Navigate to the <strong>I18n</strong> tab to see:</p>
        <ul>
          <li>Multiple instance tracking</li>
          <li>Domain-separated translation usage</li>
          <li>Performance metrics across instances</li>
          <li>Missing key detection</li>
          <li>Real-time usage analytics</li>
          <li>Namespace organization</li>
        </ul>
      </div>

      {/* DevTools Panel */}
      <I18nDevToolsPanel />
    </div>
  );
}

export default EnhancedI18nDemo;