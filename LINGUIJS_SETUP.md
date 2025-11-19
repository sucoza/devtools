# LinguiJS Integration - Setup Complete ✅

LinguiJS has been successfully integrated into the DevTools monorepo for robust internationalization support.

## What Was Added

### 1. **Dependencies**
- `@lingui/cli` - CLI tools for extraction and compilation
- `@lingui/core` - Core i18n functionality
- `@lingui/react` - React integration
- `@lingui/macro` - Compile-time macros for translations
- `@lingui/detect-locale` - Locale detection utilities
- `@babel/core` - Required for macro support

All dependencies are added to the workspace catalog in `pnpm-workspace.yaml`.

### 2. **Configuration Files**

#### `lingui.config.ts`
Root configuration for LinguiJS with settings for:
- Supported locales: `en`, `es`, `fr`, `de`, `ja`, `zh`
- Source locale: `en`
- Catalog paths: `locales/{locale}/messages`
- Format: `.po` (Gettext format)

#### `babel.config.js`
Babel configuration with macro support for LinguiJS transformations.

### 3. **Translation Catalogs**

Created directory structure:
```
locales/
├── en/     # English (source)
├── es/     # Spanish
├── fr/     # French
├── de/     # German
├── ja/     # Japanese
└── zh/     # Chinese
```

### 4. **Scripts**

Added to `package.json`:
```json
{
  "i18n:extract": "lingui extract",
  "i18n:compile": "lingui compile",
  "i18n:extract-compile": "lingui extract && lingui compile"
}
```

### 5. **Example Application**

Complete working example in `examples/lingui-example/` demonstrating:
- Basic translations with `<Trans>`
- Variable interpolation
- Pluralization
- Context-based selection (e.g., gender)
- Date/time formatting
- Language switching
- Locale detection

### 6. **Documentation**

- `docs/LINGUIJS_INTEGRATION.md` - Comprehensive integration guide
- `locales/README.md` - Translation workflow documentation
- `examples/lingui-example/README.md` - Example usage guide

### 7. **Git Configuration**

Updated `.gitignore` to:
- Ignore compiled catalog files (`.js`, `.mjs`, `.json`)
- Keep source `.po` files

## Quick Start

### Extract Messages

```bash
# From workspace root
pnpm run i18n:extract
```

This scans all packages and plugins for translatable strings.

### Compile Catalogs

```bash
pnpm run i18n:compile
```

Compiles `.po` files to optimized JavaScript catalogs.

### Combined Command

```bash
pnpm run i18n:extract-compile
```

### Run Example

```bash
cd examples/lingui-example
pnpm install
pnpm run i18n:extract-compile
pnpm run dev
```

## Usage in Your Package/Plugin

### 1. Add Dependencies

Dependencies are already available via workspace catalog.

### 2. Configure Vite (if using Vite)

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

### 3. Set Up i18n

```typescript
// src/i18n.ts
import { i18n } from '@lingui/core';

export async function loadCatalog(locale: string) {
  const { messages } = await import(`../locales/${locale}/messages.po`);
  i18n.load(locale, messages);
  i18n.activate(locale);
}

export { i18n };
```

### 4. Wrap Your App

```tsx
import { I18nProvider } from '@lingui/react';
import { i18n } from './i18n';

function App() {
  return (
    <I18nProvider i18n={i18n}>
      {/* Your components */}
    </I18nProvider>
  );
}
```

### 5. Use Translations

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

## Workflow

1. **Write code** using `<Trans>`, `t`, `Plural`, etc.
2. **Extract** messages: `pnpm run i18n:extract`
3. **Translate** by editing `.po` files in `locales/`
4. **Compile** catalogs: `pnpm run i18n:compile`
5. **Test** in different locales

## Translation Tools

Recommended tools for editing `.po` files:
- [Poedit](https://poedit.net/) - Desktop application
- [Lokalise](https://lokalise.com/) - Cloud platform
- [Crowdin](https://crowdin.com/) - Collaborative translation
- Any text editor

## Features

### ✅ What Works Now

- Message extraction from React components
- Pluralization with ICU MessageFormat
- Variable interpolation
- Context-based selection
- Lazy loading of catalogs
- Locale detection from browser/storage/URL
- TypeScript support
- Vite integration

### 🎯 Ready to Use

- Basic translations (`<Trans>`)
- Pluralization (`<Plural>`)
- Context selection (`<Select>`)
- Date/time formatting
- Language switching

### 📚 Documentation Available

- Integration guide: `docs/LINGUIJS_INTEGRATION.md`
- Example app: `examples/lingui-example/`
- Translation workflow: `locales/README.md`

## Best Practices

1. **Always extract before compiling**
   ```bash
   pnpm run i18n:extract-compile
   ```

2. **Use descriptive message IDs**
   ```tsx
   <Trans id="button.submit">Submit</Trans>
   ```

3. **Provide context for ambiguous strings**
   ```tsx
   <Trans context="action">Save</Trans>
   ```

4. **Test in multiple locales** before merging

5. **Commit both `.po` and compiled files**

## Integration with Existing i18n Package

LinguiJS can coexist with the existing `@sucoza/i18n` package:

- **LinguiJS**: For React components and modern i18n workflows
- **@sucoza/i18n**: For framework-agnostic utilities and DevTools integration

They can be bridged together if needed (see documentation).

## Next Steps

1. **Try the example**: `cd examples/lingui-example && pnpm run dev`
2. **Read the docs**: `docs/LINGUIJS_INTEGRATION.md`
3. **Add to your package**: Follow the usage guide above
4. **Extract messages**: `pnpm run i18n:extract`
5. **Start translating**: Edit files in `locales/`

## Resources

- [LinguiJS Documentation](https://lingui.dev/)
- [Integration Guide](docs/LINGUIJS_INTEGRATION.md)
- [Example Application](examples/lingui-example/)
- [ICU Message Format](https://unicode-org.github.io/icu/userguide/format_parse/messages/)

## Support

For questions or issues:
1. Check `docs/LINGUIJS_INTEGRATION.md`
2. Review `examples/lingui-example/`
3. Consult the [LinguiJS docs](https://lingui.dev/)

---

**LinguiJS is ready to use! 🌍**

Start internationalizing your packages and plugins today!
