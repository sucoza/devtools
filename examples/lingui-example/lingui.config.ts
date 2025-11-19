import type { LinguiConfig } from '@lingui/conf';

const config: LinguiConfig = {
  locales: ['en', 'es', 'fr', 'de', 'ja', 'zh'],
  sourceLocale: 'en',
  catalogs: [
    {
      path: '<rootDir>/../../locales/{locale}/messages',
      include: ['<rootDir>/src'],
      exclude: ['**/node_modules/**', '**/dist/**'],
    },
  ],
  format: 'po',
};

export default config;
