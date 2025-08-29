# Error Boundary Visualizer DevTools Plugin

A comprehensive React DevTools plugin for visualizing, debugging, and managing error boundaries in your React applications.

## Features

### 🎯 Core Capabilities

- **Component Tree Visualization**: Interactive tree view showing React component hierarchy with error boundary coverage
- **Error Tracking & Analytics**: Real-time error monitoring with detailed analytics and metrics
- **Stack Trace Enhancement**: Enhanced stack traces with source map support and code context
- **Error Simulation Tools**: Built-in error triggers for testing error handling
- **Recovery Strategy Editor**: Create and manage custom fallback components and recovery logic
- **Heat Map Visualization**: Visual representation of error frequency across components
- **External Service Integration**: Connect with Sentry, Bugsnag, and other error reporting services

### 📊 Analytics & Metrics

- Total error count and error rate tracking
- Error distribution by category and severity
- Component-level error frequency
- Mean Time To Recovery (MTTR) metrics
- Error boundary coverage percentage
- Historical error trends

## Installation

```bash
npm install @tanstack/error-boundary-visualizer-plugin
```

## Quick Start

### Basic Setup

```tsx
import { ErrorBoundaryDevTools, ErrorBoundaryWrapper } from '@tanstack/error-boundary-visualizer-plugin'

function App() {
  return (
    <>
      {/* Add the DevTools panel */}
      <ErrorBoundaryDevTools />
      
      {/* Wrap your components with error boundaries */}
      <ErrorBoundaryWrapper
        boundaryName="App"
        level="page"
        fallback={({ error, resetErrorBoundary }) => (
          <div>
            <h2>Something went wrong</h2>
            <p>{error.message}</p>
            <button onClick={resetErrorBoundary}>Try again</button>
          </div>
        )}
      >
        <YourApp />
      </ErrorBoundaryWrapper>
    </>
  )
}
```

### Using the Hook

```tsx
import { useErrorBoundaryDevTools } from '@tanstack/error-boundary-visualizer-plugin'

function MyComponent() {
  const { addError, metrics, config } = useErrorBoundaryDevTools()
  
  // Manually report an error
  const handleError = (error) => {
    addError({
      id: `error-${Date.now()}`,
      timestamp: Date.now(),
      message: error.message,
      stack: error.stack,
      category: 'runtime',
      severity: 'high',
    })
  }
  
  return (
    // Your component JSX
  )
}
```

## API Reference

### Components

#### `<ErrorBoundaryDevTools />`

Main DevTools panel component that provides the UI for error visualization and management.

```tsx
<ErrorBoundaryDevTools 
  position="bottom-right"  // Panel position
  defaultOpen={false}      // Initial open state
  theme="auto"            // Theme: 'light' | 'dark' | 'auto'
/>
```

#### `<ErrorBoundaryWrapper />`

Error boundary wrapper component for catching and reporting errors.

```tsx
<ErrorBoundaryWrapper
  boundaryId="unique-id"
  boundaryName="ComponentName"
  level="page" | "section" | "component"
  fallback={FallbackComponent}
  onError={(error, errorInfo) => {}}
  onReset={() => {}}
  enableDevTools={true}
>
  {children}
</ErrorBoundaryWrapper>
```

### Hooks

#### `useErrorBoundaryDevTools()`

Access the DevTools store and actions.

```tsx
const {
  // State
  errors,
  errorGroups,
  errorBoundaries,
  componentTree,
  metrics,
  config,
  
  // Actions
  addError,
  clearErrors,
  selectError,
  registerErrorBoundary,
  updateConfig,
  startRecording,
  stopRecording,
  exportState,
} = useErrorBoundaryDevTools()
```

## Configuration

### DevTools Configuration

```tsx
const config = {
  enabled: true,
  position: 'bottom-right',
  defaultOpen: false,
  theme: 'auto',
  shortcuts: {
    toggle: 'ctrl+shift+e',
    clear: 'ctrl+shift+c',
    export: 'ctrl+shift+x',
  },
  features: {
    componentTree: true,
    errorHeatmap: true,
    stackTraceEnhancement: true,
    errorSimulation: true,
    externalIntegration: true,
    errorRecording: true,
    analytics: true,
  },
  performance: {
    maxErrors: 1000,
    maxStackFrames: 50,
    throttleMs: 100,
    enableProfiling: false,
  },
}
```

## Error Categories

The plugin automatically categorizes errors:

- **RENDER**: Errors during component rendering
- **ASYNC**: Promise rejections and async errors
- **EVENT_HANDLER**: Errors in event handlers
- **LIFECYCLE**: Errors in lifecycle methods
- **NETWORK**: Network and API errors
- **UNKNOWN**: Uncategorized errors

## Error Severity Levels

- **CRITICAL**: Application-breaking errors
- **HIGH**: Feature-breaking errors
- **MEDIUM**: Degraded functionality
- **LOW**: Minor issues

## Demo Application

Run the demo to see the plugin in action:

```bash
cd demo
npm install
npm run dev
```

Open http://localhost:3000 to view the demo.

## Development

### Building the Plugin

```bash
npm install
npm run build
```

### Running Tests

```bash
npm test
```

### Development Mode

```bash
npm run dev
```

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Performance Considerations

- The plugin uses throttling to prevent performance impact
- Component tree updates are debounced
- Maximum error storage is configurable
- Source map processing is done asynchronously

## Security

- No sensitive data is sent to external services without explicit configuration
- All error data is stored locally by default
- External service integration requires API keys

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

## License

MIT

## Support

For issues and feature requests, please use the GitHub issue tracker.

## Acknowledgments

Built as part of the TanStack DevTools ecosystem.