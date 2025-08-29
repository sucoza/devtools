# Router DevTools Enhanced

A comprehensive router debugging plugin for TanStack DevTools with live parameter editing, route tree visualization, and navigation timeline tracking.

## Features

- **Route Tree Visualization**: Interactive hierarchical display of all application routes
- **Live Parameter Editing**: Real-time editing of route parameters and query strings with instant navigation
- **Navigation Timeline**: Complete history of all navigation events with detailed information
- **React Router v6 Support**: Built-in adapter for React Router v6 (extensible to other routers)
- **Type-Safe**: Full TypeScript support with comprehensive type definitions

## Installation

```bash
npm install @tanstack/router-devtools-enhanced
```

## Quick Start

### Basic Usage

```tsx
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useRouterDevTools } from '@tanstack/router-devtools-enhanced';

function App() {
  // Initialize router DevTools
  useRouterDevTools();

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/users/:id" element={<UserProfile />} />
        <Route path="/products" element={<ProductList />} />
      </Routes>
    </BrowserRouter>
  );
}
```

### Manual Initialization

```tsx
import { initializeRouterDevTools } from '@tanstack/router-devtools-enhanced';

// Initialize manually
const cleanup = initializeRouterDevTools();

// Clean up when needed
cleanup();
```

### Adding to TanStack DevTools

```tsx
import { TanStackRouterDevtools } from '@tanstack/router-devtools';
import { RouterDevToolsPanel } from '@tanstack/router-devtools-enhanced';

function MyDevTools() {
  return (
    <TanStackRouterDevtools>
      <RouterDevToolsPanel />
    </TanStackRouterDevtools>
  );
}
```

## API Reference

### Components

#### `RouterDevToolsPanel`

Main DevTools panel component with three tabs:

- **Route Tree**: Interactive route visualization
- **Parameters**: Live parameter and query string editing
- **Timeline**: Navigation history with detailed information

#### `RouteTreeView`

Displays hierarchical route structure with:
- Active route highlighting
- Parameter display
- Navigation shortcuts
- Expand/collapse functionality

#### `RouteParameterInspector`

Live parameter editing interface featuring:
- Route parameter editing with validation
- Query string parameter management
- Raw JSON view toggle
- Apply/reset functionality

#### `NavigationTimeline`

Navigation history display with:
- Action type indicators (PUSH/REPLACE/POP)
- Duration tracking
- Detailed route information
- Time-based filtering

### Core Classes

#### `RouterStateManager`

Central state management for router DevTools.

```tsx
import { RouterStateManager } from '@tanstack/router-devtools-enhanced';

const stateManager = new RouterStateManager({
  maxHistoryEntries: 50,
  autoExpandRoutes: true,
  enableLiveEditing: true
});
```

#### `ReactRouterAdapter`

Adapter for React Router v6 integration.

```tsx
import { createReactRouterAdapter } from '@tanstack/router-devtools-enhanced';

const adapter = createReactRouterAdapter();
stateManager.registerAdapter(adapter);
```

### Types

#### `IRouterAdapter`

Interface for creating custom router adapters:

```tsx
interface IRouterAdapter {
  getCurrentState(): NavigationState | null;
  getRouteTree(): RouteInfo[];
  subscribe(callback: (state: NavigationState) => void): () => void;
  navigate(to: string, options?: NavigationOptions): void;
  updateParams(params: Record<string, string>): void;
  updateSearch(search: string): void;
  getRouterType(): string;
}
```

#### `RouteInfo`

Route definition structure:

```tsx
interface RouteInfo {
  id: string;
  path: string;
  element?: string;
  index?: boolean;
  caseSensitive?: boolean;
  children?: RouteInfo[];
  loader?: boolean;
  action?: boolean;
  errorElement?: string;
  handle?: Record<string, unknown>;
}
```

#### `NavigationState`

Current navigation state:

```tsx
interface NavigationState {
  location: {
    pathname: string;
    search: string;
    hash: string;
    state?: unknown;
    key: string;
  };
  matches: RouteMatch[];
  navigation: {
    state: 'idle' | 'loading' | 'submitting';
    // ... additional navigation properties
  };
  actionData?: unknown;
  loaderData: Record<string, unknown>;
  errors?: Record<string, Error>;
}
```

## Configuration

### RouterDevToolsConfig

```tsx
interface RouterDevToolsConfig {
  maxHistoryEntries?: number; // Default: 50
  autoExpandRoutes?: boolean; // Default: true
  enableLiveEditing?: boolean; // Default: true
  routeNameResolver?: (route: RouteInfo) => string;
  paramValidator?: (params: Record<string, string>) => Record<string, string>;
}
```

### Parameter Validation

Custom parameter validators can be provided:

```tsx
import { commonValidators } from '@tanstack/router-devtools-enhanced';

const config = {
  paramValidator: (params) => {
    const errors: Record<string, string> = {};
    
    if (params.id && !commonValidators.uuid(params.id)) {
      errors.id = 'Must be a valid UUID';
    }
    
    return errors;
  }
};
```

## Advanced Usage

### Custom Router Adapter

Create adapters for other router libraries:

```tsx
import { IRouterAdapter, NavigationState } from '@tanstack/router-devtools-enhanced';

class MyRouterAdapter implements IRouterAdapter {
  getCurrentState(): NavigationState | null {
    // Implementation for your router
  }
  
  getRouteTree(): RouteInfo[] {
    // Implementation for your router
  }
  
  // ... other interface methods
}
```

### Event Listening

Listen to router events programmatically:

```tsx
import { routerEventClient } from '@tanstack/router-devtools-enhanced';

routerEventClient.on('router-navigation', (event) => {
  console.log('Navigation event:', event.payload);
});
```

## Browser Support

- Chrome/Chromium-based browsers
- Firefox
- Safari
- Edge

## TypeScript Support

This package is written in TypeScript and includes comprehensive type definitions. No additional `@types` packages are required.

## Contributing

Contributions are welcome! Please see our [contributing guide](CONTRIBUTING.md) for details.

## License

MIT License - see [LICENSE](LICENSE) for details.