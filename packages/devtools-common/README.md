# @sucoza/devtools-common

Common types, utilities, and shared functionality for the TanStack DevTools ecosystem.

## Features

- 🔧 **Common Types** - Shared TypeScript definitions across all DevTools plugins
- 🛠️ **Utilities** - Helper functions for plugin development
- 📊 **Event Interfaces** - Standardized event types for DevTools communication
- 🧩 **Base Classes** - Abstract classes for plugin architecture
- 🎯 **Constants** - Shared constants and configuration values
- 📝 **TypeScript First** - Full type safety and IntelliSense support

## Installation

```bash
npm install @sucoza/devtools-common
# or
yarn add @sucoza/devtools-common
# or
pnpm add @sucoza/devtools-common
```

## Usage

### Types

```typescript
import type {
  DevToolsEvent,
  DevToolsState,
  PluginConfig,
  EventSubscription,
  BaseDevToolsClient
} from '@sucoza/devtools-common';

// Use shared types in your plugin
interface MyPluginState extends DevToolsState {
  customData: string[];
  isActive: boolean;
}
```

### Utilities

```typescript
import {
  createEventId,
  debounce,
  throttle,
  deepMerge,
  isValidSelector
} from '@sucoza/devtools-common';

// Generate unique event IDs
const eventId = createEventId('my-plugin');

// Debounce expensive operations
const debouncedUpdate = debounce((data) => {
  // Update logic
}, 300);

// Merge configuration objects
const config = deepMerge(defaultConfig, userConfig);
```

### Base Client

```typescript
import { BaseDevToolsClient } from '@sucoza/devtools-common';

class MyDevToolsClient extends BaseDevToolsClient<MyPluginState> {
  protected getInitialState(): MyPluginState {
    return {
      customData: [],
      isActive: false,
      // ... other state properties
    };
  }

  protected startMonitoring(): void {
    // Plugin-specific monitoring logic
  }

  protected stopMonitoring(): void {
    // Cleanup logic
  }

  protected cleanup(): void {
    // Final cleanup
  }
}
```

### Constants

```typescript
import {
  DEFAULT_DEBOUNCE_MS,
  MAX_EVENT_HISTORY,
  PLUGIN_NAMESPACES,
  SEVERITY_LEVELS
} from '@sucoza/devtools-common';

// Use shared constants
const myConfig = {
  debounceTime: DEFAULT_DEBOUNCE_MS,
  maxHistory: MAX_EVENT_HISTORY,
  namespace: PLUGIN_NAMESPACES.ACCESSIBILITY
};
```

## API Reference

### Types

#### DevToolsEvent
Base interface for all DevTools events.

```typescript
interface DevToolsEvent<T = any> {
  id: string;
  type: string;
  timestamp: number;
  source: string;
  data: T;
  metadata?: EventMetadata;
}
```

#### DevToolsState
Base state interface for plugin state management.

```typescript
interface DevToolsState {
  isActive: boolean;
  lastUpdate: number;
  error?: string;
}
```

#### PluginConfig
Configuration interface for DevTools plugins.

```typescript
interface PluginConfig {
  name: string;
  version: string;
  namespace: string;
  enabled: boolean;
  debug?: boolean;
}
```

### Utilities

#### createEventId(namespace: string): string
Generates a unique event identifier with the specified namespace.

#### debounce<T extends (...args: any[]) => any>(fn: T, delay: number): T
Creates a debounced version of the provided function.

#### throttle<T extends (...args: any[]) => any>(fn: T, limit: number): T
Creates a throttled version of the provided function.

#### deepMerge<T>(target: T, source: Partial<T>): T
Deep merges two objects, with source properties overriding target.

#### isValidSelector(selector: string): boolean
Validates if a string is a valid CSS selector.

#### formatError(error: Error | unknown): string
Formats an error object into a readable string.

#### sanitizeEventData<T>(data: T): T
Sanitizes event data by removing circular references and functions.

### Base Classes

#### BaseDevToolsClient<T extends DevToolsState>
Abstract base class for DevTools event clients.

**Methods:**
- `subscribe(callback: EventCallback): UnsubscribeFunction`
- `emit(type: string, data: any): void`
- `getSnapshot(): T`
- `updateState(update: Partial<T>): void`
- `destroy(): void`

**Abstract Methods:**
- `getInitialState(): T`
- `startMonitoring(): void`
- `stopMonitoring(): void`
- `cleanup(): void`

### Constants

#### DEFAULT_DEBOUNCE_MS
Default debounce time in milliseconds (300ms).

#### MAX_EVENT_HISTORY
Maximum number of events to keep in history (1000).

#### PLUGIN_NAMESPACES
Predefined namespaces for different plugin types.

#### SEVERITY_LEVELS
Standard severity levels for issues and events.

```typescript
const SEVERITY_LEVELS = {
  MINOR: 'minor',
  MODERATE: 'moderate',
  SERIOUS: 'serious',
  CRITICAL: 'critical'
} as const;
```

## Contributing

This package is part of the @sucoza DevTools ecosystem. Contributions should maintain compatibility with all plugins.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/common-improvement`)
3. Commit your changes (`git commit -m 'Add utility function'`)
4. Push to the branch (`git push origin feature/common-improvement`)
5. Open a Pull Request

## License

MIT © tyevco

---

Part of the @sucoza TanStack DevTools ecosystem.

## Related Packages

- [@sucoza/plugin-core](../plugin-core) - Core plugin infrastructure
- [@sucoza/shared-components](../shared-components) - Shared UI components
- [@sucoza/devtools-importer](../devtools-importer) - Simplified plugin importing