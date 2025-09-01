import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    globals: true,
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.git/**',
      '**/cypress/**',
      '**/.nuxt/**',
      '**/.output/**',
      '**/.vercel/**',
      '**/.netlify/**',
      '**/e2e/**',
      '**/*.e2e.{spec,test}.{js,ts}',
      '**/__tests__/e2e/**'
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'dist/',
        'src/**/*.test.{ts,tsx}',
        'src/**/*.spec.{ts,tsx}',
        'src/test-setup.ts',
        'src/__tests__/',
        'src/__mocks__/',
        'vitest.config.ts',
        'rollup.config.js',
        '**/*.d.ts'
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 85,
          statements: 85
        }
      }
    },
    testTimeout: 10000,
    hookTimeout: 10000,
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true
      }
    }
  },
  resolve: {
    alias: {
      '@': new URL('./src', import.meta.url).pathname,
      '@tests': new URL('./src/__tests__', import.meta.url).pathname
    }
  }
});