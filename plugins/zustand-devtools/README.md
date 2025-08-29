# Zustand DevTools Plugin

A custom plugin for TanStack DevTools that allows you to inspect and debug Zustand stores in real-time.

## Features

- 🔍 **Real-time State Inspection**: View the current state of all registered Zustand stores
- 📊 **Action History**: Track state changes with before/after diffs
- 🎯 **Store Selection**: Click on any store to inspect its state in detail
- 🔎 **Search**: Filter stores by name
- 🔄 **Auto-refresh**: Toggle automatic updates when state changes
- 📝 **JSON View**: Expandable/collapsible JSON representation of store states

## Installation

```bash
npm install @sucoza/zustand-devtools-plugin
```

## Usage

### 1. Basic Setup with `createDevToolsStore`

The easiest way to integrate is using the `createDevToolsStore` wrapper:

```typescript
import { create } from 'zustand';
import { createDevToolsStore } from '@sucoza/zustand-devtools-plugin';

interface UserState {
  user: User | null;
  login: (email: string) => void;
  logout: () => void;
}

// Wrap your store creation with createDevToolsStore
// The store hook type is preserved for full type safety
export const useUserStore = createDevToolsStore(
  'UserStore', // Store name for DevTools
  () => create<UserState>()((set) => ({
    user: null,
    login: (email) => {
      // Your login logic
    },
    logout: () => set({ user: null }),
  }))
);

// useUserStore is now fully typed with all UserState properties
```

### 2. Manual Registration (for existing stores)

If you have existing stores, you can register them manually:

```typescript
import { useRegisterZustandStore } from '@sucoza/zustand-devtools-plugin';

// In your component
function MyComponent() {
  // Register an existing store
  useRegisterZustandStore('MyStore', useMyStore);
  
  // Your component logic...
}
```

### 3. Add the Plugin to TanStack DevTools

```tsx
import { TanStackDevtools } from '@tanstack/react-devtools';
import { ZustandDevToolsPanel } from '@sucoza/zustand-devtools-plugin';

function App() {
  return (
    <>
      {/* Your app content */}
      
      <TanStackDevtools
        plugins={[
          {
            name: 'Zustand Stores',
            render: () => <ZustandDevToolsPanel />,
          },
        ]}
      />
    </>
  );
}
```

## Advanced Usage

### Using the DevTools Middleware

For more detailed action tracking, use the `devtoolsMiddleware`:

```typescript
import { devtoolsMiddleware } from '@sucoza/zustand-devtools-plugin';

const useStore = create<State>()(
  devtoolsMiddleware((set) => ({
    // Your store configuration
  }))
);
```

### Programmatic Access

You can also access store information programmatically:

```typescript
import { zustandRegistry } from '@sucoza/zustand-devtools-plugin';

// Get all registered stores
const stores = zustandRegistry.getStores();

// Get action history
const history = zustandRegistry.getActionHistory();

// Clear action history
zustandRegistry.clearActionHistory();
```

## Example

See the `example` directory for a complete working example with multiple stores:
- User authentication store
- Todo list store
- Theme preferences store
- Shopping cart store

## How It Works

1. **Event Client**: Uses TanStack's event system to communicate between your app and the DevTools
2. **Store Registry**: Maintains a registry of all Zustand stores and subscribes to their changes
3. **DevTools Panel**: React component that displays store states and action history
4. **Automatic Integration**: `createDevToolsStore` wrapper handles all the setup automatically

## API Reference

### `createDevToolsStore(name, storeCreator)`
Creates a Zustand store with automatic DevTools registration.

### `useRegisterZustandStore(name, store)`
React hook to register an existing store with DevTools.

### `devtoolsMiddleware(config)`
Middleware for enhanced action tracking.

### `ZustandDevToolsPanel`
React component for the DevTools panel UI.

## License

MIT

---

Part of the @sucoza TanStack DevTools ecosystem.