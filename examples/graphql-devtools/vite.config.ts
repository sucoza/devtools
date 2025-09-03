import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/graphql': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        configure: (proxy, _options) => {
          // Mock GraphQL server fallback
          proxy.on('error', (err, _req, _res) => {
            console.log('GraphQL server not running, using mock data');
          });
        }
      }
    }
  }
})