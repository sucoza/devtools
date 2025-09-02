# @sucoza/devtools-importer

A simplified Vite plugin for importing and configuring TanStack DevTools plugins with automatic port management and configuration.

## Features

- **Dynamic Plugin Loading**: Automatically imports and loads your specified DevTools plugins
- **Port Management**: Automatically finds available ports or uses specified ports
- **React Component**: Pre-built React component for rendering plugin panels
- **TypeScript Support**: Full TypeScript support with proper type definitions
- **Development Optimized**: Only loads in development by default (configurable)

## Installation

```bash
npm install @sucoza/devtools-importer
```

## Usage

### ⚠️ Important Setup Requirements

1. **The Vite plugin MUST be placed FIRST in the plugins array** - This ensures proper initialization before other plugins
2. **The DevToolsManager component should be placed as HIGH as possible in your React tree** - Ideally in your root App component or index file

### Vite Configuration

```javascript
// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { tanstackDevtoolsImporter } from '@sucoza/devtools-importer';

export default defineConfig({
  plugins: [
    // ⚠️ IMPORTANT: tanstackDevtoolsImporter MUST be first!
    tanstackDevtoolsImporter({
      plugins: [
        '@sucoza/api-mock-interceptor-devtools-plugin',
        '@sucoza/websocket-signalr-devtools-plugin',
        '@sucoza/memory-performance-profiler-devtools-plugin'
      ],
      config: {
        defaultOpen: false,
        position: 'bottom-right', // TanStack DevTools position
        hideUntilHover: true,
        panelLocation: 'bottom'
      },
      port: { min: 40000, max: 49999 }, // or specify a fixed port: 3001
    })
  ],
});
```

### React Component

```tsx
// App.tsx
import React from 'react';
import { DevToolsManager } from '@sucoza/devtools-importer/react';

function App() {
  return (
    <div>
      <h1>My Application</h1>
      
      {/* DevTools configured in vite.config.js, will only render in development */}
      <DevToolsManager />
    </div>
  );
}

export default App;
```

### Advanced Usage

```tsx
// Custom DevTools setup with error handling
import React from 'react';
import { DevToolsManager } from '@sucoza/devtools-importer/react';

function App() {
  return (
    <div>
      <DevToolsManager
        onError={(error) => console.error('DevTools Error:', error)}
        onPluginLoad={(pluginId) => console.log('Loaded plugin:', pluginId)}
        className="my-devtools"
      />
    </div>
  );
}
```

## Configuration Options

### Vite Plugin Options

```typescript
interface TanstackDevtoolsImporterOptions {
  // Required: List of plugin import paths
  plugins: string[];
  
  // Optional: DevTools core configuration
  config?: Partial<TanStackDevtoolsConfig>;
  
  // Optional: Event bus configuration
  eventBusConfig?: Partial<ServerEventBusConfig>;
  
  // Optional: Enhanced logging toggle
  enhancedLogs?: { enabled: boolean };
  
  // Optional: Port configuration
  port?: number | { min: number; max: number };
  
  // Optional: Enable in production (default: false)
  enableInProd?: boolean;
  
  // Optional: Virtual module ID prefix (default: "virtual:tdi")
  virtualIdBase?: string;
}
```

### React Component Props

```typescript
interface DevToolsManagerProps {
  // Optional: Custom className
  className?: string;
  
  // Optional: Error handler
  onError?: (error: Error) => void;
  
  // Optional: Plugin load handler
  onPluginLoad?: (pluginId: string) => void;
}
```

The `DevToolsManager` uses the TanStack DevTools configuration passed through the Vite plugin, including position, styling, and behavior options.

## Virtual Modules

The plugin creates virtual modules that you can import:

```typescript
// Access plugin loaders
import { pluginLoaders, pluginIds } from 'virtual:tdi/plugins';

// Access resolved configuration
import { devtoolsConfig } from 'virtual:tdi/config';
```

## Examples

### Basic Setup

```javascript
// vite.config.js
export default defineConfig({
  plugins: [
    tanstackDevtoolsImporter({
      plugins: ['@sucoza/api-mock-interceptor-devtools-plugin']
    })
  ]
});
```

### Multiple Plugins with Custom Port

```javascript
// vite.config.js  
export default defineConfig({
  plugins: [
    tanstackDevtoolsImporter({
      plugins: [
        '@sucoza/api-mock-interceptor-devtools-plugin',
        '@sucoza/websocket-signalr-devtools-plugin',
        '@sucoza/render-waste-detector-devtools-plugin'
      ],
      port: 3001,
      config: {
        defaultOpen: true,
      }
    })
  ]
});
```

### Production Build

```javascript
// vite.config.js
export default defineConfig({
  plugins: [
    tanstackDevtoolsImporter({
      plugins: ['@sucoza/api-mock-interceptor-devtools-plugin'],
      enableInProd: true, // Enable in production builds
    })
  ]
});
```

## Development

```bash
# Install dependencies
npm install

# Build the package
npm run build

# Watch mode for development
npm run dev

# Type checking
npm run typecheck

# Linting
npm run lint
```

## License

MIT