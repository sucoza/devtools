# Using the Zustand DevTools Plugin in Your Project

## Installation in Your Project

The npm link has been successfully created! You can now use this plugin in any of your projects.

### Step 1: Link the Plugin to Your Project

Navigate to your project directory and run:

```bash
npm link zustand-tanstack-devtools-plugin
```

### Step 2: Install Required Dependencies

Make sure your project has these peer dependencies installed:

```bash
npm install zustand react @tanstack/react-devtools
```

### Step 3: Import and Use the Plugin

```typescript
// In your main App.tsx or wherever you initialize TanStack DevTools
import { TanStackDevtools } from '@tanstack/react-devtools';
import { ZustandDevToolsPanel } from 'zustand-tanstack-devtools-plugin';

// In your component
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

### Step 4: Wrap Your Zustand Stores

Update your Zustand store creation to use the DevTools wrapper:

```typescript
import { create } from 'zustand';
import { createDevToolsStore } from 'zustand-tanstack-devtools-plugin';

// Before (regular Zustand store)
const useStore = create((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
}));

// After (with DevTools integration)
const useStore = createDevToolsStore(
  'MyCounterStore', // Give your store a name
  () => create((set) => ({
    count: 0,
    increment: () => set((state) => ({ count: state.count + 1 })),
  }))
);
```

## Alternative: Manual Store Registration

If you have existing stores and don't want to change their creation:

```typescript
import { useRegisterZustandStore } from 'zustand-tanstack-devtools-plugin';

function MyComponent() {
  // Register existing store with DevTools
  useRegisterZustandStore('MyStoreName', useMyExistingStore);
  
  // Your component logic...
}
```

## Verifying the Setup

1. Start your development server
2. Open TanStack DevTools (usually in bottom-right corner)
3. Click on the "Zustand Stores" tab
4. You should see all your registered stores listed
5. Click on any store to inspect its state
6. Interact with your app to see state changes in real-time

## Removing the Link

If you want to unlink the plugin from your project:

```bash
# In your project directory
npm unlink zustand-tanstack-devtools-plugin

# To remove the global link completely
npm unlink -g zustand-tanstack-devtools-plugin
```

## Troubleshooting

### Plugin not showing up
- Make sure TanStack DevTools is properly installed and configured
- Check that you've added the plugin to the `plugins` array
- Verify the stores are being registered (check browser console for registration logs)

### Stores not appearing
- Ensure you're using `createDevToolsStore` or `useRegisterZustandStore`
- Check that the store is actually being used/mounted in your component tree
- Look for any console errors related to the event client

### TypeScript errors
- The plugin exports all necessary types
- Import types like: `import type { ZustandStoreState } from 'zustand-tanstack-devtools-plugin'`

## Development Mode

If you want to make changes to the plugin while using it:

1. Make your changes in the plugin source code
2. Run `npm run build` in the plugin directory
3. The changes will automatically be reflected in linked projects (you may need to restart your dev server)