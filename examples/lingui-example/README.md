# LinguiJS Example

This example demonstrates how to use LinguiJS for internationalization (i18n) in the DevTools ecosystem.

## Features Demonstrated

- **Basic translations** with `<Trans>` component
- **Variable interpolation** in translations
- **Pluralization** with smart plural forms
- **Context-based selection** (e.g., gender)
- **Date/time formatting** with locale support
- **Rich text** with HTML elements in translations
- **Language switching** at runtime
- **Locale detection** from browser, URL, or storage

## Getting Started

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Extract Translations

Extract all translatable strings from the source code:

```bash
pnpm run i18n:extract
```

This will create/update `.po` files in `../../locales/{locale}/messages.po` for each supported locale.

### 3. Add Translations

Edit the `.po` files to add translations for each locale. For example, in `../../locales/es/messages.po`:

```po
msgid "Welcome to DevTools"
msgstr "Bienvenido a DevTools"
```

You can use tools like:
- [Poedit](https://poedit.net/)
- [Lokalise](https://lokalise.com/)
- Any text editor

### 4. Compile Translations

Compile the `.po` files to JavaScript:

```bash
pnpm run i18n:compile
```

### 5. Run the Example

```bash
pnpm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Usage Patterns

### In React Components (JSX)

```tsx
import { Trans } from '@lingui/macro';

function MyComponent() {
  return (
    <div>
      <Trans>Hello World</Trans>
      <Trans>Hello {userName}</Trans>
    </div>
  );
}
```

### In JavaScript/TypeScript

```ts
import { t } from '@lingui/macro';

const message = t`Hello World`;
const greeting = t`Hello ${userName}`;
```

### Pluralization

```tsx
import { Plural } from '@lingui/macro';

<Plural
  value={count}
  zero="No items"
  one="# item"
  other="# items"
/>
```

### Context Selection

```tsx
import { Select } from '@lingui/macro';

<Select
  value={gender}
  male="He is online"
  female="She is online"
  other="They are online"
/>
```

### Message ID Pattern

```tsx
import { Trans } from '@lingui/macro';

// With explicit ID
<Trans id="app.welcome">Welcome</Trans>

// With context
<Trans context="navigation">Home</Trans>
```

## Workflow

1. **Write code** using LinguiJS macros (`<Trans>`, `t`, `Plural`, etc.)
2. **Extract** translatable strings: `pnpm run i18n:extract`
3. **Translate** by editing `.po` files
4. **Compile** translations: `pnpm run i18n:compile`
5. **Test** in different locales

## Supported Locales

- **en** - English (default)
- **es** - Spanish
- **fr** - French
- **de** - German
- **ja** - Japanese
- **zh** - Chinese

## Configuration

The LinguiJS configuration is in `lingui.config.ts`. It specifies:
- Supported locales
- Source locale (default: `en`)
- Catalog paths
- File formats (`.po`)
- Extraction options

## Integration with DevTools

This example can be integrated with the `@sucoza/i18n-devtools-plugin` for:
- Live translation editing
- Missing translation detection
- Translation coverage reports
- Locale switching in DevTools
- Translation usage analytics

## Resources

- [LinguiJS Documentation](https://lingui.dev/)
- [LinguiJS Tutorial](https://lingui.dev/tutorials/react)
- [ICU Message Format](https://unicode-org.github.io/icu/userguide/format_parse/messages/)
- [Pluralization Rules](https://unicode-org.github.io/cldr-staging/charts/latest/supplemental/language_plural_rules.html)

## Best Practices

1. **Always extract before compiling**: `pnpm run i18n:extract-compile`
2. **Use meaningful contexts** for ambiguous strings
3. **Keep variable names consistent** across locales
4. **Test in all locales** before deployment
5. **Use ICU message format** for complex pluralization
6. **Avoid string concatenation** - use interpolation instead
7. **Keep translations close to source** for better context
