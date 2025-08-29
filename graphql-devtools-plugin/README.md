# GraphQL DevTools Enhanced

A comprehensive GraphQL DevTools plugin for TanStack DevTools that provides advanced schema exploration, visual query building, operation monitoring, and performance analytics.

## Features

### 🔍 Schema Explorer
- **Interactive Schema Browser**: Navigate through GraphQL types, queries, mutations, and subscriptions
- **Type Details**: View field descriptions, arguments, deprecation status, and relationships
- **Schema Statistics**: Overview of type counts, operations, and schema health
- **Auto-Introspection**: Automatically detect and introspect GraphQL endpoints

### 🛠️ Visual Query Builder
- **Drag & Drop Interface**: Build queries visually by selecting fields and configuring arguments
- **Variable Management**: Define and manage query variables with type validation
- **Real-time Validation**: Instant feedback on query syntax and schema compliance
- **Query Generation**: Automatically generate optimized GraphQL queries
- **Query Execution**: Execute queries directly from the builder

### 📊 Operation History
- **Complete Operation Tracking**: Monitor all GraphQL queries, mutations, and subscriptions
- **Detailed Operation View**: Inspect query, variables, response, and network information
- **Performance Metrics**: Track execution times, success rates, and error patterns
- **Operation Replay**: Re-execute previous operations for testing
- **Advanced Filtering**: Filter by operation type, status, time range, and search terms

### 📈 Performance Monitoring
- **Execution Time Tracking**: Monitor query performance and identify bottlenecks
- **Success Rate Analytics**: Track success/failure rates across operations
- **Error Analysis**: Categorize and analyze GraphQL errors
- **Performance Trends**: Visualize performance metrics over time

### 🔧 Developer Experience
- **Network Interception**: Automatically detect and capture GraphQL operations
- **Export/Import**: Export operation history and schema information
- **Dark Mode Support**: Full dark/light theme support
- **Responsive Design**: Works on all screen sizes
- **TypeScript Support**: Fully typed with comprehensive TypeScript definitions

## Installation

```bash
npm install @tanstack/graphql-devtools-enhanced
```

## Quick Start

### Basic Setup

```tsx
import { GraphQLDevToolsPanel, createGraphQLDevToolsClient } from '@tanstack/graphql-devtools-enhanced';

// Create the DevTools client
const graphqlDevToolsClient = createGraphQLDevToolsClient();

// Add to your app
function App() {
  return (
    <div>
      {/* Your app content */}
      
      {/* DevTools panel */}
      <GraphQLDevToolsPanel />
    </div>
  );
}
```

### With TanStack DevTools

```tsx
import { TanStackDevtools } from '@tanstack/react-devtools';
import { GraphQLDevToolsPanel } from '@tanstack/graphql-devtools-enhanced';

function App() {
  return (
    <div>
      {/* Your app content */}
      
      <TanStackDevtools>
        <GraphQLDevToolsPanel />
      </TanStackDevtools>
    </div>
  );
}
```

## Configuration

### Schema Introspection

Configure endpoints for automatic schema introspection:

```tsx
import { createGraphQLDevToolsClient } from '@tanstack/graphql-devtools-enhanced';

const client = createGraphQLDevToolsClient();

// Add GraphQL endpoints
const schemaManager = client.getSchemaManager();
schemaManager.updateOptions({
  endpoints: ['http://localhost:4000/graphql', '/api/graphql'],
  autoIntrospect: true,
  cacheTimeout: 300000 // 5 minutes
});
```

### Custom Headers

Add custom headers for authenticated endpoints:

```tsx
// Introspect with custom headers
await client.introspectSchema('http://localhost:4000/graphql', {
  'Authorization': 'Bearer your-token',
  'X-Custom-Header': 'value'
});
```

### Network Interception

The plugin automatically intercepts GraphQL requests. Configure interception options:

```tsx
const interceptor = client.getInterceptor();

interceptor.updateOptions({
  enabled: true,
  endpoints: ['/graphql', '/api/graphql'],
  autoDetectEndpoints: true,
  maxOperationHistory: 1000
});
```

## API Reference

### GraphQLDevToolsClient

```tsx
const client = createGraphQLDevToolsClient();

// Schema operations
await client.introspectSchema(endpoint, headers);
client.getSchemaManager();

// Query builder
client.setQueryBuilderOperationType('query' | 'mutation' | 'subscription');
client.addQueryBuilderField(field);
client.generateQuery();
client.validateQueryBuilder();

// Operation management
client.clearOperations();
client.getFilteredOperations();
client.exportOperations();

// UI controls
client.selectTab('operations' | 'schema' | 'query-builder' | 'performance');
client.toggleRecording();
client.updateFilters(filters);
```

### React Hooks

```tsx
import { useGraphQLDevToolsStore } from '@tanstack/graphql-devtools-enhanced';

function CustomComponent() {
  const state = useGraphQLDevToolsStore();
  
  return (
    <div>
      <p>Total operations: {state.operations.length}</p>
      <p>Schema loaded: {state.schema.schema ? 'Yes' : 'No'}</p>
    </div>
  );
}
```

## Example Application

The `example/` directory contains a full demo application showing all features:

```bash
cd example
npm install
npm run dev
```

The example includes:
- Mock GraphQL server with sample schema
- Sample queries and mutations
- Interactive demo interface
- DevTools panel integration

## Development

### Building

```bash
npm run build
```

### Testing

```bash
npm test
npm run test:ui
```

### Development Mode

```bash
npm run dev
```

### Type Checking

```bash
npm run typecheck
```

## Schema Requirements

The plugin works best with GraphQL schemas that support introspection. Ensure your GraphQL server has introspection enabled:

```js
// Apollo Server example
const server = new ApolloServer({
  typeDefs,
  resolvers,
  introspection: true,  // Enable introspection
  playground: true      // Optional: enable GraphQL Playground
});
```

## Browser Support

- Chrome 88+
- Firefox 85+
- Safari 14+
- Edge 88+

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Changelog

### v1.0.0
- Initial release
- Schema exploration and introspection
- Visual query builder
- Operation history and monitoring
- Performance analytics
- Network interception
- Export/import functionality