# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Organization Name
These projects are under the `@sucoza` org on NPM, and sucoza on github.

## Development Commands

### Building
- **Individual Plugin**: `npm run build` (builds to `dist/` with CJS and ESM outputs)
- **Development Watch**: `npm run dev` (watches for changes and rebuilds)
- **Type Checking**: `npm run typecheck` (TypeScript compilation check without emit)
- **Linting**: `npm run lint` (ESLint on TypeScript/TSX files)
- **Formatting**: `npm run format` (Prettier formatting)

### Testing
- **Run Tests**: `npm test` (Vitest runner)  
- **Test UI**: `npm run test:ui` (Vitest with UI interface)
- **Example Apps**: `npm run example` (runs example application from `example/` directory)

### Workspace Commands (Run from Root)
- **Build All**: `pnpm run build:all` (builds shared packages first, then plugins)
- **Build Shared**: `pnpm run build:shared` (builds packages in packages/ directory)
- **Build Plugins**: `pnpm run build:plugins` (builds all plugins)
- **Test All**: `pnpm run test:all` (runs tests in shared packages and plugins)
- **Lint All**: `pnpm run lint` (lints entire monorepo)
- **Clean All**: `pnpm run clean:all` (removes all dist/ and node_modules/)

### Plugin Development
- **Install Dependencies**: `npm install` in each plugin directory
- **Build Plugin**: Each plugin outputs dual CJS/ESM bundles with TypeScript declarations
- **Test Plugin**: Use the `example/` directory in each plugin for local testing

## Architecture Overview

### TanStack DevTools Plugin Ecosystem
This monorepo contains 21 TanStack DevTools plugins following a standardized architecture:

**Core Plugin Structure:**
```
plugin-name/
├── src/
│   ├── components/           # React UI components
│   │   └── PluginPanel.tsx   # Main devtools panel
│   ├── core/                 # Business logic
│   │   ├── devtools-client.ts    # Event client & store integration
│   │   ├── devtools-store.ts     # Zustand store for state management  
│   │   └── interceptor.ts        # Runtime interception logic
│   ├── hooks/                # Custom React hooks
│   ├── types/                # TypeScript definitions
│   └── utils/                # Utility functions
├── example/                  # Demo application
├── rollup.config.js          # Build configuration
└── package.json              # Dependencies & scripts
```

### Event-Driven Architecture
All plugins use `@tanstack/devtools-event-client` for communication:
- **Event Client**: Manages subscription/emission of devtools events
- **Store Integration**: Uses `useSyncExternalStore` for React state sync
- **Event Bus**: Centralized event handling via TanStack's event system

### State Management Pattern
Each plugin follows this state pattern:
1. **Zustand Store**: Core application state (`devtools-store.ts`)
2. **Event Client**: Bridge between DevTools and React (`devtools-client.ts`) 
3. **React Integration**: `useSyncExternalStore` for component state sync
4. **Interceptors**: Runtime monitoring and data collection

### Build System
- **Rollup**: Standardized across all plugins for consistent bundling
- **Dual Output**: CJS (`dist/index.js`) and ESM (`dist/index.esm.js`) 
- **TypeScript**: Full typing with declaration files (`dist/index.d.ts`)
- **Source Maps**: Enabled for debugging
- **PostCSS**: CSS processing and injection

### Plugin Categories

**Debugging & Development:**
- `accessibility-auditor-plugin` - WCAG compliance & a11y testing
- `error-boundary-visualizer-plugin` - React error boundary debugging
- `form-state-inspector-plugin` - Form validation & state tracking
- `logger-devtools-plugin` - Enhanced logging with TanStack integration

**API & Data:**
- `api-mock-interceptor-plugin` - HTTP request/response mocking
- `graphql-devtools-plugin` - GraphQL query analysis & debugging
- `websocket-signalr-devtools-plugin` - Real-time communication monitoring

**State & Routing:**
- `zustand-devtools-plugin` - Zustand state inspection
- `router-devtools-plugin` - Navigation & routing debugging
- `feature-flag-manager-plugin` - Feature flag testing & simulation

**Security & Testing:**
- `auth-permissions-mock-extension` - Authentication & authorization testing
- `i18n-devtools-plugin` - Internationalization debugging

### Shared Dependencies
All plugins use consistent peer dependencies:
- `react` & `react-dom` (>=16.8.0) 
- `@tanstack/devtools` & related packages
- `clsx` for conditional CSS classes
- `lucide-react` for consistent iconography
- `use-sync-external-store` for React 18 compatibility

### Workspace Structure

```
devtools/
├── packages/                    # Shared infrastructure
│   ├── devtools-common/        # Common types and utilities
│   ├── devtools-importer/      # Vite plugin for easy setup
│   ├── plugin-core/            # Core plugin infrastructure
│   └── shared-components/      # Shared UI components
├── plugins/                    # Individual DevTools plugins (21)
└── pnpm-workspace.yaml        # Workspace configuration
```

### Development Workflow
1. Navigate to specific plugin directory
2. `npm install` to install dependencies  
3. `npm run dev` for development with hot reload
4. `npm run example` to test with demo application
5. `npm run build` to create production bundle
6. `npm run typecheck` and `npm run lint` before committing

### Plugin Integration Points
Plugins are designed to work together through:
- Shared event bus for cross-plugin communication
- Consistent UI patterns and styling
- Common state management approaches
- Unified error handling and logging

### BaseDevToolsClient Pattern
All plugins extend from `BaseDevToolsClient` which provides:
- Event emission and subscription
- React integration via `useSyncExternalStore` 
- Store snapshot management
- Abstract methods for `startMonitoring()`, `stopMonitoring()`, `cleanup()`

### Package Naming Convention
- NPM packages use `@sucoza/[plugin-name]-devtools-plugin` format
- Main export is typically `[PluginName]DevToolsPanel` component
- Event clients follow `[pluginName]EventClient` pattern
- Stores use `[pluginName]DevToolsStore` naming

### Testing Strategy
- **Vitest**: Test runner with React Testing Library integration
- **Example Apps**: Each plugin includes working demo applications
- **Type Safety**: Full TypeScript coverage with strict mode enabled
- **Component Testing**: UI components tested in isolation