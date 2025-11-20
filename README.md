# Sucoza DevTools - TanStack DevTools Plugin Ecosystem

> A comprehensive collection of 21 TanStack DevTools plugins for enhanced React application development, debugging, and monitoring.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![npm](https://img.shields.io/npm/v/@sucoza/devtools-importer.svg)](https://www.npmjs.com/org/sucoza)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)

## 🎯 Purpose

The Sucoza DevTools ecosystem provides developers with a comprehensive suite of debugging and development tools that seamlessly integrate with TanStack DevTools. Our mission is to enhance the React development experience by offering specialized plugins that cover every aspect of modern web application development - from accessibility and performance to security and testing.

## ✨ Key Features

- **🔌 21 Specialized Plugins** - Covering debugging, performance, testing, security, and more
- **🚀 Easy Integration** - One-line setup with our Vite plugin importer
- **🎨 Consistent UI/UX** - Shared component library ensures uniform experience
- **📦 Modular Architecture** - Use only the plugins you need
- **🔧 Event-Driven Design** - Real-time monitoring and debugging capabilities
- **💪 TypeScript First** - Full type safety across all plugins
- **⚡ Performance Optimized** - Minimal runtime overhead, development-only by default

## 🚀 Quick Start

### Using DevTools Importer (Recommended)

The easiest way to get started is with our Vite plugin that handles all the configuration:

```bash
npm install @sucoza/devtools-importer
```

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { tanstackDevtoolsImporter } from '@sucoza/devtools-importer'

export default defineConfig({
  plugins: [
    // ⚠️ IMPORTANT: tanstackDevtoolsImporter MUST be first!
    tanstackDevtoolsImporter({
      plugins: [
        '@sucoza/api-mock-interceptor-devtools-plugin',
        '@sucoza/memory-performance-profiler-devtools-plugin',
        '@sucoza/accessibility-devtools-plugin'
      ],
      config: {
        position: 'bottom-right',
        hideUntilHover: true
      }
    }),
    react()
  ]
})
```

```tsx
// App.tsx
import { DevToolsManager } from '@sucoza/devtools-importer/react'

function App() {
  return (
    <>
      {/* Place DevToolsManager as high as possible in your React tree */}
      <DevToolsManager />
      <YourAppContent />
    </>
  )
}
```

## 📦 Available Packages

### Core Infrastructure (6 packages)

| Package | Description | Version |
|---------|-------------|---------|  
| [@sucoza/devtools-common](./packages/devtools-common) | Common types and utilities | 0.1.5 |
| [@sucoza/plugin-core](./packages/plugin-core) | Core plugin infrastructure | 0.1.5 |
| [@sucoza/shared-components](./packages/shared-components) | Shared UI components | 0.1.5 |
| [@sucoza/devtools-importer](./packages/devtools-importer) | Vite plugin for easy setup | 0.1.5 |
| [@sucoza/feature-flags](./packages/feature-flags) | Feature flag utilities | 0.1.5 |
| [@sucoza/logger](./packages/logger) | Logging utilities | 0.1.5 |

### DevTools Plugins (21 plugins)

#### 🔍 Debugging & Development
- **[Accessibility DevTools](./plugins/accessibility-devtools)** - Real-time WCAG compliance testing with axe-core
- **[Error Boundary Visualizer](./plugins/error-boundary-visualizer)** - Visual React error boundary debugging
- **[Form State Inspector](./plugins/form-state-inspector)** - Form validation and state tracking
- **[Logger DevTools](./plugins/logger-devtools)** - Enhanced logging with filtering and export

#### 🌐 API & Data Management
- **[API Mock Interceptor](./plugins/api-mock-interceptor)** - HTTP request/response mocking and modification
- **[GraphQL DevTools](./plugins/graphql-devtools)** - GraphQL query analysis and debugging
- **[WebSocket/SignalR DevTools](./plugins/websocket-signalr-devtools)** - Real-time communication monitoring

#### 📊 State & Routing
- **[Zustand DevTools](./plugins/zustand-devtools)** - Zustand state inspection and time-travel
- **[Router DevTools](./plugins/router-devtools)** - Navigation tracking and route debugging
- **[Feature Flag Manager](./plugins/feature-flag-manager)** - Runtime feature flag testing

#### ⚡ Performance & Optimization
- **[Memory Performance Profiler](./plugins/memory-performance-profiler)** - React-specific memory analysis
- **[Bundle Impact Analyzer](./plugins/bundle-impact-analyzer)** - Bundle size and dependency analysis
- **[Render Waste Detector](./plugins/render-waste-detector)** - Unnecessary re-render detection
- **[Stress Testing DevTools](./plugins/stress-testing-devtools)** - API load testing and performance monitoring

#### 🎨 Design & UI
- **[Design System Inspector](./plugins/design-system-inspector)** - Design token consistency analysis
- **[Visual Regression Monitor](./plugins/visual-regression-monitor)** - Visual diff tracking and comparison

#### 🔐 Security & Auth
- **[Security Audit Panel](./plugins/security-audit-panel)** - Security vulnerability scanning
- **[Auth Permissions Mock](./plugins/auth-permissions-mock)** - Authentication and authorization testing

#### 🌍 Internationalization
- **[i18n DevTools](./plugins/i18n-devtools)** - Translation debugging and locale testing

#### 🧪 Testing & Automation
- **[Browser Automation Test Recorder](./plugins/browser-automation-test-recorder)** - Record and replay browser interactions

## 🏗️ Architecture

### Monorepo Structure

```
devtools/
├── packages/                    # Shared infrastructure packages
│   ├── devtools-common/        # Common types and utilities
│   ├── devtools-importer/      # Vite plugin for easy setup
│   ├── plugin-core/            # Core plugin infrastructure
│   ├── shared-components/      # Shared React components
│   ├── feature-flags/          # Feature flag utilities
│   └── logger/                 # Logging utilities
├── plugins/                    # Individual DevTools plugins (21 plugins)
│   ├── accessibility-devtools/
│   ├── api-mock-interceptor/
│   ├── auth-permissions-mock/
│   └── ... (18 more plugins)
├── docs/                       # Documentation
├── .github/                    # GitHub configuration
│   └── workflows/              # CI/CD workflows
├── pnpm-workspace.yaml         # Workspace configuration
├── CLAUDE.md                   # AI assistant instructions
└── README.md                   # This file
```

### Technical Stack

- **Framework**: React 18+ with TypeScript
- **State Management**: Zustand with useSyncExternalStore
- **Event System**: @tanstack/devtools-event-client
- **Build System**: Rollup with dual CJS/ESM output
- **Testing**: Vitest with React Testing Library
- **Package Manager**: pnpm (recommended) or npm
- **Styling**: CSS-in-JS with PostCSS

### Plugin Architecture Pattern

Each plugin follows the standardized BaseDevToolsClient pattern:

```typescript
// Standard plugin structure
plugin-name/
├── src/
│   ├── components/
│   │   └── PluginPanel.tsx      # Main UI component
│   ├── core/
│   │   ├── devtools-client.ts   # Event client implementation
│   │   ├── devtools-store.ts    # Zustand store
│   │   └── interceptor.ts       # Runtime monitoring
│   ├── hooks/                   # Custom React hooks
│   ├── types/                   # TypeScript definitions
│   └── utils/                   # Utility functions
├── example/                     # Demo application
├── rollup.config.js            # Build configuration
└── package.json                # Dependencies & scripts
```

## 🛠️ Development

### Prerequisites

- Node.js >= 18.0.0
- pnpm >= 8.0.0 (recommended) or npm >= 9.0.0
- Git

### Initial Setup

```bash
# Clone the repository
git clone https://github.com/sucoza/devtools.git
cd devtools

# Install dependencies
pnpm install

# Build all packages in correct order
pnpm run build:all
```

### Development Commands

#### Workspace-level Commands (run from root)
```bash
# Build everything
pnpm run build:all

# Build only shared packages
pnpm run build:shared

# Build only plugins
pnpm run build:plugins

# Run all tests
pnpm run test:all

# Lint entire monorepo
pnpm run lint

# Type check everything
pnpm run typecheck

# Clean all build artifacts
pnpm run clean:all
```

#### Plugin Development (run from plugin directory)
```bash
cd plugins/<plugin-name>

# Start development with hot reload
npm run dev

# Run example application
npm run example

# Run tests
npm test

# Type checking
npm run typecheck

# Linting
npm run lint
```

### Creating a New Plugin

1. **Copy the template structure** from an existing plugin
2. **Update package.json**:
   - Name: `@sucoza/<name>-devtools-plugin`
   - Update description and keywords
3. **Implement the BaseDevToolsClient**:
   - Create your store with Zustand
   - Implement event client
   - Build your UI components
4. **Add to workspace**:
   - Update root package.json if needed
   - Add to GitHub Actions workflow
5. **Test thoroughly**:
   - Unit tests for core logic
   - Integration tests for event handling
   - Example app for manual testing

## 📋 Common Use Cases

### Development Debugging
```typescript
// Use multiple debugging plugins together
tanstackDevtoolsImporter({
  plugins: [
    '@sucoza/logger-devtools-plugin',
    '@sucoza/error-boundary-visualizer-devtools-plugin',
    '@sucoza/form-state-inspector-devtools-plugin'
  ]
})
```

### Performance Optimization
```typescript
// Performance-focused plugin suite
tanstackDevtoolsImporter({
  plugins: [
    '@sucoza/memory-performance-profiler-devtools-plugin',
    '@sucoza/render-waste-detector-devtools-plugin',
    '@sucoza/bundle-impact-analyzer-devtools-plugin'
  ]
})
```

### API Development
```typescript
// API testing and mocking suite
tanstackDevtoolsImporter({
  plugins: [
    '@sucoza/api-mock-interceptor-devtools-plugin',
    '@sucoza/graphql-devtools-plugin',
    '@sucoza/websocket-signalr-devtools-plugin',
    '@sucoza/stress-testing-devtools-plugin'
  ]
})
```

### Accessibility & Internationalization
```typescript
// A11y and i18n focused plugins
tanstackDevtoolsImporter({
  plugins: [
    '@sucoza/accessibility-devtools-plugin',
    '@sucoza/i18n-devtools-plugin',
    '@sucoza/design-system-inspector-devtools-plugin'
  ]
})
```


## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](./CONTRIBUTING.md) for details on:

- Code of Conduct
- Development setup
- Coding standards
- Pull request process
- Testing requirements

### Quick Contribution Steps

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests (`pnpm run test:all`)
5. Run linting (`pnpm run lint`)
6. Commit your changes following conventional commits
7. Push to your fork
8. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## 🙏 Acknowledgments

- Built for and inspired by the [TanStack](https://tanstack.com/) ecosystem
- Powered by [TanStack DevTools](https://tanstack.com/devtools/latest)
- Created with ❤️ for the React developer community

## 📞 Support

- **Documentation**: Check individual plugin READMEs for detailed usage
- **Issues**: [GitHub Issues](https://github.com/sucoza/devtools/issues)
- **Discussions**: [GitHub Discussions](https://github.com/sucoza/devtools/discussions)
- **NPM**: [@sucoza on NPM](https://www.npmjs.com/org/sucoza)

---

**Made with ❤️ by the Sucoza team** | [Website](https://sucoza.dev) | [GitHub](https://github.com/sucoza)