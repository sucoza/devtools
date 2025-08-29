# Contributing to TanStack DevTools Plugin Ecosystem

Thank you for your interest in contributing to the TanStack DevTools Plugin Ecosystem! This document provides guidelines and information for contributors.

## Development Setup

### Prerequisites

- Node.js (>=18.0.0)
- pnpm (>=8.0.0) - recommended, or npm (>=9.0.0)
- Git

### Getting Started

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd tndt
   ```

2. **Install dependencies** (pnpm recommended)
   ```bash
   pnpm install
   
   # Or with npm
   npm install
   ```

3. **Build all packages**
   ```bash
   pnpm run build:all
   
   # Or with npm
   npm run build:all
   ```

## Project Structure

This is a monorepo containing TanStack DevTools plugins and shared packages:

```
tndt/
├── packages/                    # Shared packages
│   ├── devtools-common/        # Common types and utilities
│   ├── devtools-importer/      # Vite plugin for automatic plugin loading
│   ├── plugin-core/            # Core infrastructure for plugins
│   └── shared-components/      # Shared UI components
├── plugins/                    # DevTools plugins
│   ├── accessibility-devtools/
│   ├── api-mock-interceptor/
│   ├── browser-automation-test-recorder/
│   └── ... (20+ more plugins)
└── CLAUDE.md                   # Development guidance
```

## Development Workflow

### Working on Plugins

1. **Navigate to plugin directory**
   ```bash
   cd plugins/<plugin-name>
   ```

2. **Start development mode**
   ```bash
   pnpm run dev
   # or: npm run dev
   ```

3. **Run example application**
   ```bash
   pnpm run example
   # or: npm run example
   ```

4. **Run tests**
   ```bash
   pnpm test
   # or: npm test
   ```

### Working on Shared Packages

1. **Navigate to package directory**
   ```bash
   cd packages/<package-name>
   ```

2. **Build in watch mode**
   ```bash
   pnpm run dev
   # or: npm run dev
   ```

3. **Run tests**
   ```bash
   pnpm test
   # or: npm test
   ```

## Plugin Architecture

Each plugin follows a standardized architecture:

### Directory Structure
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

### Key Patterns

1. **Event-Driven Architecture**: All plugins use `@tanstack/devtools-event-client`
2. **State Management**: Zustand stores with `useSyncExternalStore` integration
3. **Shared Dependencies**: Use workspace packages for common functionality
4. **TypeScript**: Full typing with strict mode enabled

## Code Standards

### TypeScript

- Use strict TypeScript configuration
- Define proper interfaces and types
- Avoid `any` types - use proper typing

### React

- Use functional components with hooks
- Follow React best practices
- Use `useSyncExternalStore` for external state integration

### Testing

- Write unit tests for core functionality
- Include component tests using React Testing Library
- Maintain good test coverage

### Code Style

- Use ESLint and Prettier configurations
- Follow existing code patterns
- Keep components focused and single-responsibility

## Building and Testing

### Individual Plugin Commands

```bash
# Build plugin
pnpm run build
# or: npm run build

# Development mode with watch
pnpm run dev
# or: npm run dev

# Type checking
pnpm run typecheck
# or: npm run typecheck

# Linting
pnpm run lint
# or: npm run lint

# Format code
pnpm run format
# or: npm run format

# Run tests
pnpm test
# or: npm test

# Test with UI
pnpm run test:ui
# or: npm run test:ui

# Run example app
pnpm run example
# or: npm run example
```

### Monorepo Commands

```bash
# Build all packages and plugins
pnpm run build:all
# or: npm run build:all

# Build only shared packages
pnpm run build:shared

# Build only plugins
pnpm run build:plugins

# Run tests across all packages
pnpm run test:all
# or: npm run test:all

# Lint all code
pnpm run lint
# or: npm run lint

# Type check all packages
pnpm run typecheck
# or: npm run typecheck

# Clean build outputs
pnpm run clean:dist

# Update all dependencies
pnpm run update:deps
```

## Pull Request Process

1. **Fork the repository** and create a feature branch
2. **Make your changes** following the coding standards
3. **Add or update tests** as needed
4. **Run the test suite** to ensure everything passes
5. **Update documentation** if you're changing functionality
6. **Submit a pull request** with a clear description

### PR Guidelines

- **Clear title**: Describe what the PR does
- **Detailed description**: Explain the changes and why they're needed
- **Link issues**: Reference any related issues
- **Tests**: Ensure all tests pass
- **Documentation**: Update relevant docs

## Plugin Development Guidelines

### Creating a New Plugin

1. **Use the plugin template structure**
2. **Follow naming conventions**: `@sucoza/<name>-devtools-plugin`
3. **Include shared packages**: Use workspace dependencies
4. **Add proper exports**: Export `DevToolsPanel` as default
5. **Create example app**: Provide working demo
6. **Write tests**: Include comprehensive test coverage

### Integrating with TanStack DevTools

- Use `@tanstack/devtools-event-client` for communication
- Follow the event-driven architecture pattern
- Integrate with the shared component library
- Use consistent UI patterns across plugins

## Issue Reporting

When reporting issues:

1. **Check existing issues** first
2. **Use issue templates** when available
3. **Provide reproduction steps**
4. **Include environment details**
5. **Add relevant code snippets**

## Security

- Never commit secrets or sensitive data
- Follow security best practices
- Report security vulnerabilities privately

## Questions and Support

- Check the documentation in individual plugin READMEs
- Look at example applications for usage patterns
- Review existing code for implementation examples
- Open an issue for questions or clarification

## License

By contributing to this project, you agree that your contributions will be licensed under the MIT License.