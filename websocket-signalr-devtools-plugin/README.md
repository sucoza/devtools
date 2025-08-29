# WebSocket & SignalR DevTools Plugin

A comprehensive DevTools plugin for monitoring and debugging WebSocket and SignalR connections in real-time. Built following TanStack DevTools patterns and architecture.

## Features

### 🔌 WebSocket Monitoring
- **Real-time Connection Tracking** - Monitor WebSocket connections as they're created, opened, and closed
- **Message Inspection** - View sent/received messages with JSON and binary data support  
- **Connection State Monitoring** - Track connection states (CONNECTING, OPEN, CLOSING, CLOSED)
- **Protocol Support** - Handle custom WebSocket protocols and extensions
- **Error Tracking** - Capture and display connection and message errors

### 📡 SignalR Monitoring  
- **Hub Connection Tracking** - Monitor SignalR hub connections and their lifecycle
- **Method Invocation Monitoring** - Track hub method calls with arguments and results
- **Transport Layer Visibility** - See which transport is being used (WebSockets, SSE, Long Polling)
- **Automatic Reconnection Tracking** - Monitor reconnection attempts and strategies
- **Streaming Support** - Track streaming invocations and their data flow
- **Hub Method Statistics** - Performance metrics for each hub method

### 📊 Performance Monitoring
- **Real-time Metrics** - Connection counts, message rates, data transfer rates
- **Interactive Charts** - Message activity, bytes transferred, connection states over time
- **Hub Method Performance** - Execution times, invocation counts, error rates
- **Connection Health** - Error rates, reconnection patterns, uptime tracking

### 🔍 Advanced Debugging
- **Message Filtering** - Filter by connection, message type, time range, content
- **Search Functionality** - Full-text search across all messages and data
- **Export Capabilities** - Export data as JSON, CSV, or HAR format
- **Connection Simulation** - Test connections with simulated data (coming soon)

### 🎨 Developer Experience
- **Responsive UI** - Works great on all screen sizes
- **Dark/Light Theme** - Automatic theme detection with manual override
- **Keyboard Shortcuts** - Quick actions for common tasks
- **Real-time Updates** - No polling - everything updates instantly
- **Zero Configuration** - Works out of the box with any WebSocket/SignalR app

## Installation

```bash
npm install @tanstack/websocket-signalr-devtools
```

## Quick Start

### Basic Usage

```tsx
import React from 'react';
import { WebSocketSignalRDevToolsPanel } from '@tanstack/websocket-signalr-devtools';

function App() {
  return (
    <div>
      <h1>My Application</h1>
      
      {/* Your app content */}
      <MyWebSocketApp />
      
      {/* DevTools Panel */}
      <WebSocketSignalRDevToolsPanel height={600} />
    </div>
  );
}
```

### Advanced Configuration

```tsx
import React from 'react';
import { 
  WebSocketSignalRDevToolsPanel,
  createWebSocketSignalRDevToolsClient 
} from '@tanstack/websocket-signalr-devtools';

function App() {
  const client = React.useMemo(() => 
    createWebSocketSignalRDevToolsClient(), []
  );

  return (
    <div>
      <WebSocketSignalRDevToolsPanel 
        height={800}
        theme="dark"
        className="my-devtools"
      />
    </div>
  );
}
```

### Programmatic Control

```tsx
import { createWebSocketSignalRDevToolsClient } from '@tanstack/websocket-signalr-devtools';

const client = createWebSocketSignalRDevToolsClient();

// Control recording
client.toggleWebSocketRecording();
client.toggleSignalRRecording();

// Clear data
client.clearWebSocketData();
client.clearSignalRData();

// Force close connections
client.closeConnection('websocket', 'connection-id');
client.closeConnection('signalr', 'hub-connection-id');

// Access state
const state = client.getState();
console.log('WebSocket connections:', state.websocket.connections.size);
console.log('SignalR connections:', state.signalr.connections.size);
```

## How It Works

The plugin uses JavaScript proxying to intercept WebSocket constructor calls and SignalR hub connection creations. This allows it to:

1. **Monitor WebSocket connections** by wrapping the native WebSocket constructor
2. **Track SignalR connections** by intercepting HubConnectionBuilder.build() calls  
3. **Capture all network traffic** without modifying your application code
4. **Provide real-time updates** through an event-driven architecture
5. **Maintain connection state** even when DevTools is opened/closed

### Interception Details

- **WebSocket**: Proxies the global `WebSocket` constructor
- **SignalR**: Intercepts `HubConnectionBuilder` instances and wraps connection methods
- **Zero Impact**: No performance impact on your application
- **Framework Agnostic**: Works with any JavaScript framework or vanilla JS

## API Reference

### WebSocketSignalRDevToolsPanel Props

```tsx
interface WebSocketSignalRDevToolsPanelProps {
  height?: number;           // Panel height in pixels (default: 600)
  className?: string;        // Additional CSS classes
  theme?: 'light' | 'dark' | 'auto'; // Theme preference (default: 'auto')
}
```

### Client Methods

```tsx
interface WebSocketSignalRDevToolsClient {
  // Recording control
  toggleWebSocketRecording(): void;
  toggleSignalRRecording(): void;
  
  // Data management  
  clearWebSocketData(): void;
  clearSignalRData(): void;
  
  // Connection control
  closeConnection(type: 'websocket' | 'signalr', id: string): void;
  
  // State access
  getState(): DevToolsState;
  
  // UI control
  selectTab(tab: 'websocket' | 'signalr' | 'performance'): void;
  selectConnection(id?: string): void;
  selectMessage(id?: string): void;
  toggleFilters(): void;
  setTheme(theme: 'light' | 'dark' | 'auto'): void;
}
```

## Examples

Check out the example applications:

- **WebSocket Example**: `example/websocket-app/` - Demonstrates WebSocket connection monitoring
- **SignalR Example**: `example/signalr-app/` - Shows SignalR hub connection tracking

To run the examples:

```bash
# WebSocket example
cd example/websocket-app
npm install
npm run dev

# SignalR example  
cd example/signalr-app
npm install
npm run dev
```

## Architecture

The plugin follows TanStack DevTools patterns:

```
┌─────────────────────────┐
│   React UI Components   │
├─────────────────────────┤
│   DevTools Store        │  ← useSyncExternalStore
├─────────────────────────┤
│   Event Client          │  ← TanStack DevTools integration
├─────────────────────────┤
│   Interceptors          │  ← WebSocket/SignalR proxying
└─────────────────────────┘
```

- **UI Components**: React components for the DevTools interface
- **Store**: Centralized state management with external store pattern
- **Event Client**: TanStack DevTools integration layer
- **Interceptors**: Network interception and monitoring

## Browser Support

- **Chrome/Edge**: Full support
- **Firefox**: Full support  
- **Safari**: Full support
- **Mobile**: Responsive design works on mobile browsers

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Development Setup

```bash
# Clone the repository
git clone https://github.com/tanstack/websocket-signalr-devtools.git
cd websocket-signalr-devtools

# Install dependencies
npm install

# Start development
npm run dev

# Run tests
npm run test

# Build for production
npm run build
```

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history and updates.