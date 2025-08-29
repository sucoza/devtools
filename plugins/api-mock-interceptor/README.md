# API Mock Interceptor DevTools Plugin

A powerful DevTools plugin for intercepting, mocking, and modifying API responses directly in the browser. Perfect for development, testing, and debugging scenarios.

## Features

### 🎯 Core Functionality
- **Full API Interception**: Intercepts both `fetch` and `XMLHttpRequest` calls
- **Real-time Monitoring**: View all API calls in real-time with detailed information
- **Mock Response System**: Create custom mock responses with dynamic content
- **Request Matching**: Flexible URL patterns, methods, headers, and body matching
- **Network Simulation**: Simulate latency, failures, and throttling

### 📊 Advanced Features
- **Mock Scenarios**: Group multiple rules into scenarios for different test environments
- **Template Variables**: Dynamic response generation with built-in variables
- **Export/Import**: Share configurations between team members
- **Persistence**: Auto-save configurations in localStorage
- **Statistics**: Detailed analytics about API usage and performance

### 🎨 User Interface
- **Tabbed Interface**: Organized tabs for calls, rules, scenarios, and settings
- **Real-time Search**: Filter API calls by URL, method, status, or content
- **Dark Mode**: Automatic theme detection with manual override
- **Responsive Design**: Works well in DevTools panels of various sizes

## Installation

```bash
npm install @sucoza/api-mock-interceptor-devtools-plugin
```

## Usage

### Basic Setup

```tsx
import React from 'react';
import { ApiMockInterceptorPanel, createApiMockInterceptorDevToolsClient } from '@sucoza/api-mock-interceptor-devtools-plugin';

// Create the DevTools client
const client = createApiMockInterceptorDevToolsClient();

function App() {
  return (
    <div className="h-screen">
      <ApiMockInterceptorPanel />
    </div>
  );
}

export default App;
```

### Custom Hook Usage

```tsx
import React from 'react';
import { useInterceptor } from '@sucoza/api-mock-interceptor-devtools-plugin';

function CustomComponent() {
  const { state, actions, selectors } = useInterceptor();
  
  const handleCreateRule = () => {
    const rule = {
      id: 'test-rule',
      name: 'Test Mock Rule',
      enabled: true,
      priority: 1,
      matcher: {
        urlPattern: '/api/users/*',
        method: 'GET',
      },
      mockResponse: {
        status: 200,
        headers: { 'content-type': 'application/json' },
        body: { users: [], total: 0 },
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    
    actions.addMockRule(rule);
  };
  
  return (
    <div>
      <p>Total API Calls: {state.stats.totalCalls}</p>
      <p>Mocked Calls: {state.stats.mockedCalls}</p>
      <button onClick={handleCreateRule}>Add Test Rule</button>
    </div>
  );
}
```

## API Reference

### Core Classes

#### `ApiInterceptor`
Handles the core interception of fetch and XMLHttpRequest calls.

```tsx
import { getApiInterceptor } from '@sucoza/api-mock-interceptor-devtools-plugin';

const interceptor = getApiInterceptor();
interceptor.enableInterception();
interceptor.addListener((apiCall) => {
  console.log('API call intercepted:', apiCall);
});
```

#### `RequestMatcherEngine`
Manages request matching logic for mock rules.

```tsx
import { getRequestMatcher } from '@sucoza/api-mock-interceptor-devtools-plugin';

const matcher = getRequestMatcher();
const isMatch = matcher.matches(request, {
  urlPattern: '/api/users/*',
  method: 'GET'
});
```

#### `MockResponseEngine`
Generates mock responses and simulates network conditions.

```tsx
import { getMockResponseEngine } from '@sucoza/api-mock-interceptor-devtools-plugin';

const mocker = getMockResponseEngine();
const response = await mocker.createMockResponse(request, {
  status: 200,
  body: { message: 'Hello from mock!' },
  delay: 1000
});
```

### Hook API

#### `useInterceptor()`
Main hook for interacting with the interceptor state.

```tsx
const { state, actions, selectors } = useInterceptor();

// State access
state.apiCalls          // All recorded API calls
state.mockRules         // All mock rules
state.mockScenarios     // All mock scenarios
state.isInterceptionEnabled  // Current interception status

// Actions
actions.enableInterception()    // Enable API interception
actions.disableInterception()   // Disable API interception
actions.addMockRule(rule)      // Add new mock rule
actions.toggleMockRule(id)     // Enable/disable specific rule
actions.clearApiCalls()        // Clear all recorded calls

// Selectors
selectors.getFilteredApiCalls()  // Get filtered API calls
selectors.getEnabledMockRules()  // Get active mock rules
selectors.getSelectedCall()      // Get currently selected call
```

## Mock Rule Configuration

### Request Matcher
Define which requests should be mocked:

```tsx
const matcher = {
  // Exact URL match
  url: 'https://api.example.com/users',
  
  // Pattern matching (supports * wildcards and regex)
  urlPattern: '/api/users/*',  // or '/api\/users\/\d+/'
  
  // HTTP method(s)
  method: 'GET',  // or ['GET', 'POST']
  
  // Header matching
  headers: {
    'authorization': 'Bearer *',
    'content-type': 'application/json'
  },
  
  // Request body matching
  body: { userId: 123 }
};
```

### Mock Response
Define the mock response to return:

```tsx
const mockResponse = {
  status: 200,
  statusText: 'OK',
  headers: {
    'content-type': 'application/json',
    'x-custom-header': 'mock-value'
  },
  body: {
    id: '{{random_uuid}}',
    name: 'John Doe',
    timestamp: '{{iso_date}}',
    requestUrl: '{{request.url}}'
  },
  delay: 500  // milliseconds
};
```

### Template Variables
Supported template variables in response bodies:

- `{{timestamp}}` - Current timestamp
- `{{iso_date}}` - Current ISO date string
- `{{random_id}}` - Random ID string
- `{{random_uuid}}` - Random UUID v4
- `{{random_number}}` - Random number
- `{{random_string}}` - Random string
- `{{request_method}}` - Original request method
- `{{request_url}}` - Original request URL
- `{{request.field}}` - Extract field from request object

## Network Simulation

Simulate various network conditions:

```tsx
actions.setNetworkConditions({
  latency: 1000,        // Add 1 second delay
  failureRate: 0.1,     // 10% chance of failure
  offline: false,       // Simulate offline mode
  throttling: {
    downloadThroughput: 50000,  // 50KB/s download
    uploadThroughput: 25000     // 25KB/s upload
  }
});
```

## Configuration Management

### Export Configuration
```tsx
import { getStorageEngine } from '@sucoza/api-mock-interceptor-devtools-plugin';

const storage = getStorageEngine();
const config = storage.exportData();
console.log(JSON.stringify(config, null, 2));
```

### Import Configuration
```tsx
const importResult = storage.importData(configData);
if (importResult.success) {
  console.log(`Imported ${importResult.imported.rules} rules and ${importResult.imported.scenarios} scenarios`);
}
```

## TypeScript Support

The plugin is fully typed with TypeScript. Key interfaces:

```tsx
import type {
  ApiCall,
  MockRule,
  MockScenario,
  RequestMatcher,
  MockResponse,
  HttpMethod,
  DevToolsState
} from '@sucoza/api-mock-interceptor-devtools-plugin';
```

## Browser Compatibility

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT

---

Part of the @sucoza TanStack DevTools ecosystem.