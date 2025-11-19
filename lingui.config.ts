import type { LinguiConfig } from '@lingui/conf';

/**
 * LinguiJS configuration for the DevTools monorepo
 *
 * This is the root configuration. Individual packages/plugins can override
 * these settings with their own lingui.config.ts files.
 */
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
  formatOptions: {
    origins: true,
    lineNumbers: true,
  },
  compileNamespace: 'es',
  extractBabelOptions: {
    presets: ['@babel/preset-typescript', '@babel/preset-react'],
  },
  orderBy: 'messageId',
  pseudoLocale: 'pseudo',
  fallbackLocales: {
    default: 'en',
  },
  service: {
    name: 'TranslationIO',
    apiKey: process.env.TRANSLATION_IO_API_KEY,
  },
};

export default config;
