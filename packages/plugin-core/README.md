# @sucoza/plugin-core

Core infrastructure and base classes for building TanStack DevTools plugins. This package provides the essential building blocks for creating powerful, consistent DevTools plugins.

## Features

- 🏗️ **Plugin Architecture** - Standardized plugin lifecycle and architecture
- 🔄 **Event System** - Robust event-driven communication framework
- 📊 **State Management** - Built-in state management with React integration
- 🎣 **React Hooks** - Pre-built hooks for common plugin functionality
- 🔌 **Hot Reload Support** - Development-friendly hot reloading
- 🛡️ **Error Boundaries** - Built-in error handling and recovery
- 📝 **TypeScript First** - Full type safety for plugin development

## Installation

```bash
npm install @sucoza/plugin-core
# or
yarn add @sucoza/plugin-core
# or
pnpm add @sucoza/plugin-core
```

## Quick Start

### Creating a Basic Plugin

```typescript
import { BaseDevToolsPlugin, usePluginState } from '@sucoza/plugin-core';

interface MyPluginState {
  items: string[];
  selectedItem: string | null;
}

class MyDevToolsPlugin extends BaseDevToolsPlugin<MyPluginState> {
  constructor() {
    super({
      name: 'My DevTools Plugin',
      version: '1.0.0',
      namespace: 'my-plugin'
    });
  }

  protected getInitialState(): MyPluginState {
    return {
      items: [],
      selectedItem: null
    };
  }

  protected onActivate(): void {
    // Plugin activation logic
    this.startMonitoring();
  }

  protected onDeactivate(): void {
    // Plugin deactivation logic
    this.stopMonitoring();
  }

  private startMonitoring(): void {
    // Start collecting data
    this.updateState({
      items: ['item1', 'item2', 'item3']
    });
  }

  private stopMonitoring(): void {
    // Stop collecting data
  }
}

export const myPlugin = new MyDevToolsPlugin();
```

### Plugin Component

```tsx
import React from 'react';
import { usePluginState, PluginPanel } from '@sucoza/plugin-core';
import { myPlugin } from './my-plugin';

export function MyPluginPanel() {
  const { state, actions } = usePluginState(myPlugin);

  return (
    <PluginPanel
      title="My Plugin"
      plugin={myPlugin}
    >
      <div>
        <h3>Items ({state.items.length})</h3>
        <ul>
          {state.items.map((item, index) => (
            <li 
              key={index}
              onClick={() => actions.updateState({ selectedItem: item })}
              style={{ 
                backgroundColor: state.selectedItem === item ? '#e3f2fd' : 'transparent' 
              }}
            >
              {item}
            </li>
          ))}
        </ul>
      </div>
    </PluginPanel>
  );
}
```

## Core Concepts

### Plugin Lifecycle

```typescript
import { BaseDevToolsPlugin, PluginLifecycle } from '@sucoza/plugin-core';

class MyPlugin extends BaseDevToolsPlugin implements PluginLifecycle {
  // Called when plugin is first loaded
  async onInitialize(): Promise<void> {
    console.log('Plugin initialized');
  }

  // Called when plugin becomes active
  protected onActivate(): void {
    console.log('Plugin activated');
  }

  // Called when plugin becomes inactive
  protected onDeactivate(): void {
    console.log('Plugin deactivated');
  }

  // Called when plugin is being destroyed
  async onDestroy(): Promise<void> {
    console.log('Plugin destroyed');
  }
}
```

### Event System

```typescript
import { EventEmitter, PluginEvent } from '@sucoza/plugin-core';

// Emit custom events
myPlugin.emit('data-updated', { 
  timestamp: Date.now(),
  items: newItems 
});

// Listen to events
myPlugin.on('data-updated', (event: PluginEvent<{ items: string[] }>) => {
  console.log('Data updated:', event.data.items);
});

// One-time event listener
myPlugin.once('initialized', () => {
  console.log('Plugin ready!');
});
```

### State Management

```typescript
import { usePluginState, StateAction } from '@sucoza/plugin-core';

function MyComponent() {
  const { 
    state, 
    actions, 
    isLoading, 
    error,
    reset 
  } = usePluginState(myPlugin);

  // Update state
  const handleAddItem = (newItem: string) => {
    actions.updateState({
      items: [...state.items, newItem]
    });
  };

  // Batch state updates
  const handleBatchUpdate = () => {
    actions.batchUpdate([
      { items: [...state.items, 'new1'] },
      { selectedItem: 'new1' }
    ]);
  };

  return (
    <div>
      {isLoading && <p>Loading...</p>}
      {error && <p>Error: {error}</p>}
      <button onClick={() => handleAddItem('new item')}>
        Add Item
      </button>
      <button onClick={() => reset()}>
        Reset State
      </button>
    </div>
  );
}
```

## API Reference

### BaseDevToolsPlugin<T>

Core abstract class for all DevTools plugins.

#### Constructor Options

```typescript
interface PluginOptions {
  name: string;
  version: string;
  namespace: string;
  enabled?: boolean;
  debug?: boolean;
  autoActivate?: boolean;
}
```

#### Methods

| Method | Description |
|--------|-------------|
| `activate()` | Activates the plugin |
| `deactivate()` | Deactivates the plugin |
| `isActive()` | Returns plugin activation status |
| `getState()` | Returns current plugin state |
| `updateState(update)` | Updates plugin state |
| `emit(event, data)` | Emits a plugin event |
| `on(event, handler)` | Subscribes to plugin events |
| `off(event, handler)` | Unsubscribes from events |
| `destroy()` | Destroys the plugin |

#### Abstract Methods

| Method | Description |
|--------|-------------|
| `getInitialState()` | Returns initial plugin state |
| `onActivate()` | Called when plugin activates |
| `onDeactivate()` | Called when plugin deactivates |

### Hooks

#### usePluginState<T>(plugin: BaseDevToolsPlugin<T>)

React hook for accessing plugin state and actions.

**Returns:**
```typescript
{
  state: T;                           // Current plugin state
  actions: {
    updateState: (update: Partial<T>) => void;
    batchUpdate: (updates: Partial<T>[]) => void;
    reset: () => void;
  };
  isLoading: boolean;                 // Plugin loading status
  error: string | null;               // Current error state
  isActive: boolean;                  // Plugin activation status
  reset: () => void;                  // Reset to initial state
}
```

#### usePluginEvents<T>(plugin: BaseDevToolsPlugin<T>)

Hook for subscribing to plugin events.

```typescript
const events = usePluginEvents(myPlugin, {
  'data-updated': (data) => console.log('Data:', data),
  'error': (error) => console.error('Error:', error)
});
```

#### usePluginLifecycle(plugin: BaseDevToolsPlugin)

Hook for managing plugin lifecycle.

```typescript
const { 
  activate, 
  deactivate, 
  isActive, 
  isInitialized 
} = usePluginLifecycle(myPlugin);
```

### Components

#### PluginPanel

Standard panel component for plugin UI.

```tsx
<PluginPanel
  title="My Plugin"
  plugin={myPlugin}
  toolbar={<MyToolbar />}
  onClose={() => console.log('Panel closed')}
>
  <MyPluginContent />
</PluginPanel>
```

#### PluginProvider

Context provider for plugin state management.

```tsx
<PluginProvider plugin={myPlugin}>
  <MyPluginComponents />
</PluginProvider>
```

#### ErrorBoundary

Error boundary component with plugin integration.

```tsx
<ErrorBoundary 
  plugin={myPlugin}
  fallback={<div>Plugin Error</div>}
>
  <MyPluginContent />
</ErrorBoundary>
```

### Event Types

```typescript
// Plugin lifecycle events
interface PluginLifecycleEvents {
  'plugin:initialized': { plugin: BaseDevToolsPlugin };
  'plugin:activated': { plugin: BaseDevToolsPlugin };
  'plugin:deactivated': { plugin: BaseDevToolsPlugin };
  'plugin:destroyed': { plugin: BaseDevToolsPlugin };
  'plugin:error': { plugin: BaseDevToolsPlugin; error: Error };
}

// State management events
interface PluginStateEvents {
  'state:updated': { state: any; previousState: any };
  'state:reset': { state: any };
  'state:error': { error: Error };
}
```

## Advanced Usage

### Custom Plugin Registry

```typescript
import { PluginRegistry } from '@sucoza/plugin-core';

const registry = new PluginRegistry();

// Register plugins
registry.register(myPlugin);
registry.register(anotherPlugin);

// Get all plugins
const allPlugins = registry.getAll();

// Get plugin by namespace
const plugin = registry.get('my-plugin');

// Check if plugin exists
const exists = registry.has('my-plugin');
```

### Plugin Communication

```typescript
// Plugin A emits data
pluginA.emit('data-available', { data: myData });

// Plugin B listens for data
pluginB.on('plugin:data-available', (event) => {
  if (event.source === 'pluginA') {
    // Handle data from Plugin A
    console.log('Received data:', event.data);
  }
});
```

### Middleware System

```typescript
import { PluginMiddleware } from '@sucoza/plugin-core';

const loggingMiddleware: PluginMiddleware = (plugin, next) => {
  return (action) => {
    console.log('Action:', action.type);
    const result = next(action);
    console.log('State after action:', plugin.getState());
    return result;
  };
};

myPlugin.use(loggingMiddleware);
```

## Examples

Check out the `examples/` directory for complete plugin implementations and usage patterns.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/plugin-improvement`)
3. Commit your changes (`git commit -m 'Add plugin feature'`)
4. Push to the branch (`git push origin feature/plugin-improvement`)
5. Open a Pull Request

## License

MIT © tyevco

---

Part of the @sucoza TanStack DevTools ecosystem.

## Related Packages

- [@sucoza/devtools-common](../devtools-common) - Common utilities and types
- [@sucoza/shared-components](../shared-components) - Shared UI components
- [@sucoza/devtools-importer](../devtools-importer) - Simplified plugin importing