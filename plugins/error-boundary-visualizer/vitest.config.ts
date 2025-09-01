import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/__tests__/setup.ts'],
    globals: true,
    // Force jsdom to load before tests to ensure global mocks are available
    environmentOptions: {
      jsdom: {
        // Ensure window object is fully available
        resources: 'usable',
      },
    },
  },
})