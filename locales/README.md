# Translation Catalogs

This directory contains translation catalogs for all supported locales in the DevTools monorepo.

## Supported Locales

- **en** - English (source locale)
- **es** - Spanish
- **fr** - French
- **de** - German
- **ja** - Japanese
- **zh** - Chinese

## Directory Structure

```
locales/
├── en/
│   └── messages.po
├── es/
│   └── messages.po
├── fr/
│   └── messages.po
├── de/
│   └── messages.po
├── ja/
│   └── messages.po
└── zh/
    └── messages.po
```

## Workflow

### 1. Extract Messages

Extract translatable strings from the codebase:

```bash
pnpm run i18n:extract
```

This will scan all source files and extract messages marked with LinguiJS macros.

### 2. Translate

Edit the `.po` files in each locale directory to add translations. You can use:
- [Poedit](https://poedit.net/) - Desktop application for editing .po files
- [Localazy](https://localazy.com/) - Cloud translation management
- [Crowdin](https://crowdin.com/) - Collaborative translation platform
- Any text editor

### 3. Compile

Compile the translations to JavaScript/TypeScript:

```bash
pnpm run i18n:compile
```

This creates optimized message catalogs that can be loaded by your application.

### 4. Combined Workflow

Extract and compile in one command:

```bash
pnpm run i18n:extract-compile
```

## Adding a New Locale

1. Add the locale code to `lingui.config.ts`:
   ```typescript
   locales: ['en', 'es', 'fr', 'de', 'ja', 'zh', 'new-locale'],
   ```

2. Create the directory:
   ```bash
   mkdir -p locales/new-locale
   ```

3. Extract messages:
   ```bash
   pnpm run i18n:extract
   ```

## PO File Format

The `.po` files use the Gettext format:

```po
msgid "Welcome to DevTools"
msgstr "Bienvenido a DevTools"

msgid "Hello {name}"
msgstr "Hola {name}"
```

- `msgid` - Original English string
- `msgstr` - Translated string
- Variables in `{curly braces}` should be preserved

## Best Practices

1. **Always extract before compiling** to ensure all new strings are captured
2. **Never edit compiled `.js` files** - they will be overwritten
3. **Commit both `.po` and compiled files** to version control
4. **Use context** for ambiguous strings (e.g., "Save" as verb vs. "Save" as noun)
5. **Keep translations up to date** by running extract regularly
6. **Test in multiple locales** before merging changes

## CI/CD Integration

In your CI pipeline, you can validate translations:

```bash
# Check for missing translations
pnpm run i18n:extract --dry-run

# Compile all catalogs
pnpm run i18n:compile
```

## Resources

- [LinguiJS Documentation](https://lingui.dev/)
- [ICU Message Format](https://unicode-org.github.io/icu/userguide/format_parse/messages/)
- [Pluralization Rules](https://unicode-org.github.io/cldr-staging/charts/latest/supplemental/language_plural_rules.html)
