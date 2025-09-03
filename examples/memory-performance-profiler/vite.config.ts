import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { tanstackDevtoolsImporter } from '@sucoza/devtools-importer';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tanstackDevtoolsImporter({
      plugins: [
        '@sucoza/logger-devtools-plugin',
        '@sucoza/zustand-devtools-plugin',
        '@sucoza/design-system-inspector-devtools-plugin',
        '@sucoza/router-devtools-plugin',
        '@sucoza/error-boundary-visualizer-devtools-plugin',
        '@sucoza/websocket-signalr-devtools-plugin',
        '@sucoza/memory-performance-profiler-devtools-plugin',
        '@sucoza/render-waste-detector-devtools-plugin',
        '@sucoza/accessibility-devtools-plugin',
      ],
      config: {
        defaultOpen: false,
        position: 'bottom-right',
      },
      eventBusConfig: {
        connectToServerBus: true
      },
      port: { min: 40000, max: 49999 },
    }),
    react()],
})
