/**
 * Example React application demonstrating LinguiJS usage
 *
 * This shows various patterns for using LinguiJS in React components.
 */

import React, { useState, useEffect } from 'react';
import { I18nProvider } from '@lingui/react';
import { Trans, Plural, Select } from '@lingui/macro';
import { i18n, initI18n, setLocale, LOCALES, type Locale } from './i18n';

/**
 * Language selector component
 */
function LanguageSelector() {
  const [currentLocale, setCurrentLocale] = useState<Locale>(i18n.locale as Locale || 'en');

  const handleLocaleChange = async (locale: Locale) => {
    await setLocale(locale);
    setCurrentLocale(locale);
  };

  return (
    <div style={{ marginBottom: '2rem' }}>
      <label htmlFor="locale-select">
        <Trans>Select Language:</Trans>
      </label>
      <select
        id="locale-select"
        value={currentLocale}
        onChange={(e) => handleLocaleChange(e.target.value as Locale)}
        style={{ marginLeft: '0.5rem', padding: '0.25rem' }}
      >
        {Object.entries(LOCALES).map(([code, name]) => (
          <option key={code} value={code}>
            {name}
          </option>
        ))}
      </select>
    </div>
  );
}

/**
 * Examples component showing various LinguiJS patterns
 */
function Examples() {
  const [count, setCount] = useState(0);
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('other');
  const userName = 'Alice';

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
      <h1>
        <Trans>LinguiJS Examples</Trans>
      </h1>

      {/* Basic translation */}
      <section>
        <h2>
          <Trans>1. Basic Translation</Trans>
        </h2>
        <p>
          <Trans>Welcome to the DevTools internationalization example!</Trans>
        </p>
        <p>
          <Trans>This demonstrates how to use LinguiJS with React.</Trans>
        </p>
      </section>

      {/* Variable interpolation */}
      <section>
        <h2>
          <Trans>2. Variable Interpolation</Trans>
        </h2>
        <p>
          <Trans>Hello {userName}, welcome back!</Trans>
        </p>
        <p>
          <Trans>
            You have {count} {count === 1 ? 'notification' : 'notifications'}
          </Trans>
        </p>
      </section>

      {/* Pluralization */}
      <section>
        <h2>
          <Trans>3. Pluralization</Trans>
        </h2>
        <div style={{ marginBottom: '1rem' }}>
          <button onClick={() => setCount(Math.max(0, count - 1))}>-</button>
          <span style={{ margin: '0 1rem' }}>{count}</span>
          <button onClick={() => setCount(count + 1)}>+</button>
        </div>
        <p>
          <Plural
            value={count}
            zero="You have no items"
            one="You have # item"
            other="You have # items"
          />
        </p>
        <p>
          <Plural
            value={count}
            zero="No files found"
            one="Found one file"
            few="Found # files"
            many="Found # files"
            other="Found # files"
          />
        </p>
      </section>

      {/* Gender selection */}
      <section>
        <h2>
          <Trans>4. Context-based Selection</Trans>
        </h2>
        <div style={{ marginBottom: '1rem' }}>
          <label>
            <input
              type="radio"
              name="gender"
              value="male"
              checked={gender === 'male'}
              onChange={(e) => setGender(e.target.value as typeof gender)}
            />
            <Trans>Male</Trans>
          </label>
          <label style={{ marginLeft: '1rem' }}>
            <input
              type="radio"
              name="gender"
              value="female"
              checked={gender === 'female'}
              onChange={(e) => setGender(e.target.value as typeof gender)}
            />
            <Trans>Female</Trans>
          </label>
          <label style={{ marginLeft: '1rem' }}>
            <input
              type="radio"
              name="gender"
              value="other"
              checked={gender === 'other'}
              onChange={(e) => setGender(e.target.value as typeof gender)}
            />
            <Trans>Other</Trans>
          </label>
        </div>
        <p>
          <Select
            value={gender}
            male={`He is online`}
            female={`She is online`}
            other={`They are online`}
          />
        </p>
      </section>

      {/* Formatted date/time */}
      <section>
        <h2>
          <Trans>5. Date & Time Formatting</Trans>
        </h2>
        <p>
          <Trans>
            Current date: {new Date().toLocaleDateString(i18n.locale)}
          </Trans>
        </p>
        <p>
          <Trans>
            Current time: {new Date().toLocaleTimeString(i18n.locale)}
          </Trans>
        </p>
      </section>

      {/* HTML elements in translations */}
      <section>
        <h2>
          <Trans>6. Rich Text with Components</Trans>
        </h2>
        <p>
          <Trans>
            This is <strong>bold text</strong> and this is{' '}
            <em>italic text</em>.
          </Trans>
        </p>
        <p>
          <Trans>
            Click <a href="#example">this link</a> to learn more.
          </Trans>
        </p>
      </section>

      {/* Code examples */}
      <section>
        <h2>
          <Trans>7. Usage Examples</Trans>
        </h2>
        <div style={{ backgroundColor: '#f5f5f5', padding: '1rem', borderRadius: '4px' }}>
          <h3>
            <Trans>In JSX:</Trans>
          </h3>
          <pre>{`<Trans>Hello World</Trans>`}</pre>

          <h3 style={{ marginTop: '1rem' }}>
            <Trans>In JavaScript/TypeScript:</Trans>
          </h3>
          <pre>{`import { t } from '@lingui/macro';\n\nconst message = t\`Hello World\`;`}</pre>

          <h3 style={{ marginTop: '1rem' }}>
            <Trans>With variables:</Trans>
          </h3>
          <pre>{`<Trans>Hello {name}</Trans>`}</pre>

          <h3 style={{ marginTop: '1rem' }}>
            <Trans>Pluralization:</Trans>
          </h3>
          <pre>{`<Plural value={count} one="# item" other="# items" />`}</pre>
        </div>
      </section>
    </div>
  );
}

/**
 * Main App component with i18n provider
 */
export function App() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initI18n().then(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <I18nProvider i18n={i18n}>
      <LanguageSelector />
      <Examples />
    </I18nProvider>
  );
}

export default App;
