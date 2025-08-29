# TanStack DevTools Plugin Ecosystem

A comprehensive collection of TanStack DevTools plugins for enhanced development experience across React applications.

## Overview

This monorepo contains 20+ specialized TanStack DevTools plugins designed to provide deep insights into different aspects of React application development, from debugging and performance monitoring to testing and security auditing.

## 🚀 Quick Start

### Using the DevTools Importer (Recommended)

The easiest way to integrate multiple plugins is using our Vite plugin:

```bash
npm install @sucoza/devtools-importer
```

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import { tanstackDevtoolsImporter } from '@sucoza/devtools-importer'

export default defineConfig({
  plugins: [
    tanstackDevtoolsImporter({
      plugins: [
        '@sucoza/api-mock-interceptor-devtools-plugin',
        '@sucoza/memory-performance-profiler-devtools-plugin',
        '@sucoza/browser-automation-test-recorder-devtools-plugin',
        // Add any plugins you need
      ],
      config: {
        position: 'bottom-right',
        hideUntilHover: true,
      }
    })
  ]
})
```

### Manual Installation

Install individual plugins as needed:

```bash
npm install @sucoza/api-mock-interceptor-devtools-plugin
npm install @sucoza/memory-performance-profiler-devtools-plugin
# ... other plugins
```

## 📦 Available Plugins

### Debugging & Development
- **[Accessibility DevTools](./plugins/accessibility-devtools/)** - WCAG compliance & a11y testing
- **[Error Boundary Visualizer](./plugins/error-boundary-visualizer/)** - React error boundary debugging
- **[Form State Inspector](./plugins/form-state-inspector/)** - Form validation & state tracking
- **[Logger DevTools](./plugins/logger-devtools/)** - Enhanced logging with TanStack integration

### API & Data Management
- **[API Mock Interceptor](./plugins/api-mock-interceptor/)** - HTTP request/response mocking
- **[GraphQL DevTools](./plugins/graphql-devtools/)** - GraphQL query analysis & debugging
- **[WebSocket/SignalR DevTools](./plugins/websocket-signalr-devtools/)** - Real-time communication monitoring

### State & Routing
- **[Zustand DevTools](./plugins/zustand-devtools/)** - Zustand state inspection
- **[Router DevTools](./plugins/router-devtools/)** - Navigation & routing debugging
- **[Feature Flag Manager](./plugins/feature-flag-manager/)** - Feature flag testing & simulation

### Performance & Analysis
- **[Memory Performance Profiler](./plugins/memory-performance-profiler/)** - React-specific memory analysis
- **[Bundle Impact Analyzer](./plugins/bundle-impact-analyzer/)** - Bundle size analysis & optimization
- **[Render Waste Detector](./plugins/render-waste-detector/)** - Unnecessary re-render detection
- **[Design System Inspector](./plugins/design-system-inspector/)** - Design token consistency analysis

### Testing & Automation
- **[Browser Automation Test Recorder](./plugins/browser-automation-test-recorder/)** - Record browser interactions for testing
- **[Visual Regression Monitor](./plugins/visual-regression-monitor/)** - Visual diff tracking
- **[Stress Testing DevTools](./plugins/stress-testing-devtools/)** - API stress testing & performance monitoring

### Security & Internationalization
- **[Security Audit Panel](./plugins/security-audit-panel/)** - Security vulnerability scanning
- **[Auth Permissions Mock](./plugins/auth-permissions-mock/)** - Authentication & authorization testing
- **[i18n DevTools](./plugins/i18n-devtools/)** - Internationalization debugging

## 🏗️ Architecture

### Monorepo Structure

```
tndt/
├── packages/                    # Shared infrastructure
│   ├── devtools-common/        # Common types and utilities
│   ├── devtools-importer/      # Vite plugin for easy setup
│   ├── plugin-core/            # Core plugin infrastructure
│   └── shared-components/      # Shared UI components
├── plugins/                    # Individual DevTools plugins
│   ├── accessibility-devtools/
│   ├── api-mock-interceptor/
│   └── ... (20+ plugins)
└── docs/                       # Documentation
```

### Plugin Architecture

Each plugin follows a consistent architecture:

- **Event-Driven**: Uses `@tanstack/devtools-event-client` for communication
- **State Management**: Zustand stores with `useSyncExternalStore` integration
- **Shared Components**: Leverages common UI components for consistency
- **TypeScript**: Full typing with strict mode enabled

### Key Features

- 🔧 **Modular Design** - Use only the plugins you need
- 🎨 **Consistent UI** - Shared component library ensures uniform experience
- ⚡ **Performance** - Optimized builds with code splitting
- 🧪 **Well Tested** - Comprehensive test coverage across all plugins
- 📚 **Well Documented** - Detailed documentation and examples

## 🛠️ Development

### Prerequisites

- Node.js (>=18.0.0)
- pnpm (>=8.0.0) - recommended, or npm (>=9.0.0)

### Setup

```bash
# Clone the repository
git clone <repository-url>
cd tndt

# Install dependencies (pnpm recommended)
pnpm install

# Or with npm
npm install

# Build all packages
pnpm run build:all
# or: npm run build:all
```

### Working with Plugins

```bash
# Navigate to plugin directory
cd plugins/<plugin-name>

# Start development mode
pnpm run dev

# Run example application
npm run example

# Run tests
npm test
```

See [CONTRIBUTING.md](./CONTRIBUTING.md) for detailed development guidelines.

## 📋 Usage Examples

### Basic Plugin Usage

```typescript
import { DevToolsPanel } from '@sucoza/api-mock-interceptor-devtools-plugin'

// Plugin automatically integrates with TanStack DevTools
// No additional setup required
```

### With Custom Configuration

```typescript
// Using the DevTools Importer
import { tanstackDevtoolsImporter } from '@sucoza/devtools-importer'

export default defineConfig({
  plugins: [
    tanstackDevtoolsImporter({
      plugins: ['@sucoza/memory-performance-profiler-devtools-plugin'],
      config: {
        position: 'top-right',
        hideUntilHover: false,
        port: 3001
      }
    })
  ]
})
```

## 🔧 Plugin Development

### Creating a New Plugin

1. **Use the standardized structure**:
   ```
   plugin-name/
   ├── src/
   │   ├── components/PluginPanel.tsx  # Main UI component
   │   ├── core/devtools-store.ts      # State management
   │   ├── hooks/                      # Custom hooks
   │   └── types/                      # TypeScript definitions
   ├── example/                        # Demo application
   └── package.json
   ```

2. **Follow naming conventions**: `@sucoza/<name>-devtools-plugin`

3. **Use shared packages**: Integrate with workspace dependencies

4. **Export DevToolsPanel**: Ensure default export is the main panel component

### Integration with TanStack DevTools

All plugins are designed to work seamlessly with TanStack DevTools:

- Automatic discovery and loading
- Consistent event handling
- Shared state management patterns
- Uniform UI/UX across plugins

## 🤝 Contributing

We welcome contributions! Please read [CONTRIBUTING.md](./CONTRIBUTING.md) for:

- Development setup instructions
- Code standards and guidelines
- Pull request process
- Plugin development guidelines

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## 🙏 Acknowledgments

- Built for the [TanStack](https://tanstack.com/) ecosystem
- Inspired by the TanStack DevTools architecture
- Designed for React developers who need comprehensive debugging tools

---

**Need help?** Check out the individual plugin READMEs or open an issue for support.