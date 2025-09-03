import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { tanstackDevtoolsImporter } from '@sucoza/devtools-importer';

export default defineConfig({
  plugins: [
    react(),
    tanstackDevtoolsImporter({
      plugins: [
        '@sucoza/api-mock-interceptor-devtools-plugin',
        '@sucoza/websocket-signalr-devtools-plugin'
      ],
      config: {
        defaultOpen: false,
        position: 'bottom-right', // Official TanStack DevTools position option
        hideUntilHover: false,
        panelLocation: 'bottom'
      },
      port: { min: 40000, max: 49999 },
      enhancedLogs: { enabled: true }
    })
  ],
  server: {
    port: 3000
  }
});