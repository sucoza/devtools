# LinguiJS Integration Guide

This guide explains how to use LinguiJS for internationalization (i18n) in the DevTools monorepo.

## Table of Contents

- [Overview](#overview)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [Workflow](#workflow)
- [Best Practices](#best-practices)
- [Examples](#examples)
- [Troubleshooting](#troubleshooting)

## Overview

LinguiJS is a powerful internationalization framework for JavaScript and React applications. It provides:

- **Compile-time extraction**: Extract translatable strings automatically
- **ICU MessageFormat**: Industry-standard message formatting
- **TypeScript support**: Full type safety
- **Pluralization**: Smart plural forms for all languages
- **Small bundle size**: Only load translations for the active locale
- **Developer-friendly**: Intuitive API with macro support

## Installation

LinguiJS is already installed at the workspace level. To use it in a package or plugin:

```bash
# Navigate to your package/plugin directory
cd packages/your-package  # or plugins/your-plugin

# The dependencies are already available via the workspace
```

The following packages are available:
- `@lingui/core` - Core i18n functionality
- `@lingui/react` - React integration
- `@lingui/macro` - Compile-time macros
- `@lingui/detect-locale` - Locale detection utilities
- `@lingui/cli` - CLI tools for extraction and compilation

## Configuration

### Root Configuration

The monorepo has a root `lingui.config.ts` that defines default settings:

```typescript
// lingui.config.ts
const config: LinguiConfig = {
  locales: ['en', 'es', 'fr', 'de', 'ja', 'zh'],
  sourceLocale: 'en',
  catalogs: [
    {
      path: '<rootDir>/locales/{locale}/messages',
      include: ['<rootDir>/packages/*/src', '<rootDir>/plugins/*/src'],
      exclude: ['**/node_modules/**', '**/dist/**', '**/*.test.ts', '**/*.test.tsx'],
    },
  ],
  format: 'po',
};
```

### Package-specific Configuration

To override settings for a specific package, create a `lingui.config.ts` in the package root:

```typescript
// packages/my-package/lingui.config.ts
import type { LinguiConfig } from '@lingui/conf';

const config: LinguiConfig = {
  locales: ['en', 'es'],  // Only support English and Spanish
  sourceLocale: 'en',
  catalogs: [
    {
      path: '<rootDir>/locales/{locale}',
      include: ['<rootDir>/src'],
    },
  ],
};

export default config;
```

### Babel Configuration

LinguiJS uses Babel macros. The root `babel.config.js` is already configured:

```javascript
module.exports = {
  presets: ['@babel/preset-typescript', '@babel/preset-react'],
  plugins: ['macros'],
};
```

### Vite Configuration

For Vite-based packages/plugins, ensure the macro plugin is enabled:

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: ['macros'],
      },
    }),
  ],
});
```

## Usage

### React Components

#### Basic Translation

```tsx
import { Trans } from '@lingui/macro';

function Welcome() {
  return (
    <div>
      <Trans>Welcome to DevTools</Trans>
    </div>
  );
}
```

#### With Variables

```tsx
import { Trans } from '@lingui/macro';

function Greeting({ name }: { name: string }) {
  return <Trans>Hello {name}!</Trans>;
}
```

#### With Components

```tsx
import { Trans } from '@lingui/macro';

function Message() {
  return (
    <Trans>
      Click <a href="/docs">here</a> to read the <strong>documentation</strong>
    </Trans>
  );
}
```

### JavaScript/TypeScript

#### Basic Translation

```ts
import { t } from '@lingui/macro';
import { i18n } from '@lingui/core';

const message = t(i18n)`Welcome to DevTools`;
console.log(message);
```

#### With Variables

```ts
import { t } from '@lingui/macro';
import { i18n } from '@lingui/core';

const name = 'Alice';
const greeting = t(i18n)`Hello ${name}!`;
```

### Pluralization

```tsx
import { Plural } from '@lingui/macro';

function ItemCount({ count }: { count: number }) {
  return (
    <Plural
      value={count}
      zero="No items"
      one="One item"
      other="# items"
    />
  );
}
```

### Select (Context-based)

```tsx
import { Select } from '@lingui/macro';

function UserStatus({ gender }: { gender: 'male' | 'female' | 'other' }) {
  return (
    <Select
      value={gender}
      male="He is online"
      female="She is online"
      other="They are online"
    />
  );
}
```

### Setting up i18n

Create an i18n setup file in your package:

```typescript
// src/i18n.ts
import { i18n } from '@lingui/core';
import { detect, fromNavigator, fromStorage } from '@lingui/detect-locale';

export const LOCALES = ['en', 'es', 'fr'] as const;
export type Locale = typeof LOCALES[number];

export async function loadCatalog(locale: Locale) {
  const { messages } = await import(`../locales/${locale}/messages.po`);
  i18n.load(locale, messages);
  i18n.activate(locale);
}

export async function initI18n() {
  const locale = detect(
    fromStorage('locale'),
    fromNavigator(),
    'en'
  ) as Locale;

  await loadCatalog(locale);
  return locale;
}

export { i18n };
```

### Provider Setup

Wrap your application with `I18nProvider`:

```tsx
// src/App.tsx
import { I18nProvider } from '@lingui/react';
import { i18n, initI18n } from './i18n';
import { useEffect, useState } from 'react';

export function App() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    initI18n().then(() => setIsReady(true));
  }, []);

  if (!isReady) return <div>Loading...</div>;

  return (
    <I18nProvider i18n={i18n}>
      {/* Your app */}
    </I18nProvider>
  );
}
```

## Workflow

### 1. Write Code with Translations

```tsx
import { Trans } from '@lingui/macro';

export function MyComponent() {
  return (
    <div>
      <Trans>This text will be translated</Trans>
    </div>
  );
}
```

### 2. Extract Messages

From the workspace root:

```bash
# Extract from entire monorepo
pnpm run i18n:extract

# Extract from specific package
cd packages/my-package
pnpm run i18n:extract
```

This creates/updates `.po` files in `locales/{locale}/messages.po`.

### 3. Translate

Edit the `.po` files manually or use translation tools:

```po
# locales/es/messages.po
msgid "This text will be translated"
msgstr "Este texto será traducido"
```

**Recommended Tools:**
- [Poedit](https://poedit.net/) - Desktop app for `.po` files
- [Lokalise](https://lokalise.com/) - Translation management platform
- [Crowdin](https://crowdin.com/) - Collaborative translation
- Any text editor

### 4. Compile

Compile translations to JavaScript:

```bash
# Compile entire monorepo
pnpm run i18n:compile

# Compile specific package
cd packages/my-package
pnpm run i18n:compile
```

### 5. Test

Run your application and switch between locales to verify translations.

### Combined Command

Extract and compile in one step:

```bash
pnpm run i18n:extract-compile
```

## Best Practices

### 1. Use Descriptive Message IDs

```tsx
// ❌ Avoid
<Trans id="btn1">Click me</Trans>

// ✅ Better
<Trans id="button.submit">Submit</Trans>
```

### 2. Provide Context for Ambiguous Strings

```tsx
// The word "Save" can mean different things
<Trans context="action">Save</Trans>  // Save button
<Trans context="noun">Save</Trans>    // A saved game
```

### 3. Keep Variables Consistent

```tsx
// ✅ Good
<Trans>Hello {userName}!</Trans>

// ❌ Avoid changing variable names
// English: "Hello {userName}!"
// Spanish: "¡Hola {nombreUsuario}!" // Different variable name!
```

### 4. Use Pluralization Properly

```tsx
// ❌ Avoid
<Trans>You have {count} item{count !== 1 ? 's' : ''}</Trans>

// ✅ Better
<Plural value={count} one="You have # item" other="You have # items" />
```

### 5. Don't Concatenate Strings

```tsx
// ❌ Avoid
const message = t`Hello` + ` ` + name + `!`;

// ✅ Better
const message = t`Hello ${name}!`;
```

### 6. Extract Regularly

Run `pnpm run i18n:extract` frequently to catch new strings early.

### 7. Test in Multiple Locales

Always test your UI in at least 2-3 locales before releasing.

### 8. Use Lazy Loading

Only load catalogs for the active locale:

```typescript
async function loadCatalog(locale: Locale) {
  const { messages } = await import(`../locales/${locale}/messages.po`);
  i18n.load(locale, messages);
  i18n.activate(locale);
}
```

### 9. Handle Missing Translations

```typescript
import { i18n } from '@lingui/core';

i18n.on('missing', ({ id, locale }) => {
  console.warn(`Missing translation for "${id}" in locale "${locale}"`);
});
```

### 10. Commit Compiled Catalogs

Include both `.po` source files and compiled `.js` files in version control.

## Examples

### Complete Example

See `examples/lingui-example/` for a full working example demonstrating:
- Basic translations
- Variable interpolation
- Pluralization
- Context selection
- Date/time formatting
- Language switching
- Locale detection

To run the example:

```bash
cd examples/lingui-example
pnpm install
pnpm run i18n:extract-compile
pnpm run dev
```

### Integration with Existing i18n Package

If you want to use LinguiJS alongside the existing `@sucoza/i18n` package:

```typescript
// Bridge between LinguiJS and @sucoza/i18n
import { i18n as linguiI18n } from '@lingui/core';
import { i18n as sucozaI18n } from '@sucoza/i18n';

// Sync locale changes
linguiI18n.on('change', () => {
  sucozaI18n.setLocale(linguiI18n.locale);
});

sucozaI18n.on('locale:change', (event) => {
  linguiI18n.activate(event.to);
});
```

## Troubleshooting

### Issue: "Cannot find module '*/messages.po'"

**Solution:** Run `pnpm run i18n:extract` to create the catalog files.

### Issue: "Macro plugin not found"

**Solution:** Ensure `babel.config.js` includes the `macros` plugin:

```javascript
module.exports = {
  plugins: ['macros'],
};
```

### Issue: Translations not updating

**Solution:**
1. Extract: `pnpm run i18n:extract`
2. Update `.po` files
3. Compile: `pnpm run i18n:compile`
4. Restart dev server

### Issue: "Module parse failed: Unexpected token"

**Solution:** Configure your bundler to handle `.po` files:

```typescript
// vite.config.ts
export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: ['macros'],
      },
    }),
  ],
  assetsInclude: ['**/*.po'],
});
```

### Issue: TypeScript errors with macros

**Solution:** Add LinguiJS types to `tsconfig.json`:

```json
{
  "compilerOptions": {
    "types": ["@lingui/macro"]
  }
}
```

## Resources

- [LinguiJS Official Documentation](https://lingui.dev/)
- [LinguiJS React Tutorial](https://lingui.dev/tutorials/react)
- [ICU Message Format Guide](https://unicode-org.github.io/icu/userguide/format_parse/messages/)
- [CLDR Plural Rules](https://unicode-org.github.io/cldr-staging/charts/latest/supplemental/language_plural_rules.html)
- [Example Application](../examples/lingui-example/)

## Support

For questions or issues:
1. Check this documentation
2. Review the [example application](../examples/lingui-example/)
3. Consult the [LinguiJS docs](https://lingui.dev/)
4. Ask in the team chat or create an issue

---

**Happy translating! 🌍**
