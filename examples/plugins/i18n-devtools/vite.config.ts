import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000
  },
  resolve: {
    alias: {
      '@sucoza/i18n': '../../../packages/i18n/src',
      '@sucoza/i18n-devtools-plugin': '../../../plugins/i18n-devtools/src'
    }
  }
})