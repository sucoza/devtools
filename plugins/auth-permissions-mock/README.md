# Auth Permissions Mock DevTools Plugin

A TanStack DevTools plugin for mocking authentication states and permissions testing during development.

## ⚠️ Important Notice

**This plugin provides CLIENT-SIDE ONLY mocking.** It does not make real network requests or affect server-side authentication. Use this for development, testing, and prototyping purposes only.

## Features

- **Real-time Auth State Management**: Mock user authentication states, roles, and permissions
- **JWT Token Editor**: Create, edit, and decode JWT tokens with live preview
- **Permission Matrix**: Visual interface for managing role-based and attribute-based access control (RBAC/ABAC)
- **Storage Monitoring**: Track authentication-related localStorage/sessionStorage operations
- **Mock Scenarios**: Pre-defined authentication scenarios for quick testing
- **Client-side Only**: Safe testing environment that doesn't affect server-side validation

## Installation

```bash
npm install @sucoza/auth-permissions-mock-devtools-plugin
```

## Usage

### Basic Integration

```tsx
import { AuthPermissionsMockPanel } from '@sucoza/auth-permissions-mock-devtools-plugin';

function MyDevToolsPanel() {
  return (
    <div>
      <AuthPermissionsMockPanel />
    </div>
  );
}
```

### Using the Client API

```tsx
import { useAuthMockClient } from '@sucoza/auth-permissions-mock-devtools-plugin';

function MyComponent() {
  const { state, client } = useAuthMockClient();

  const loginAsAdmin = () => {
    client.mockLogin(
      { email: 'admin@example.com', name: 'Admin User' },
      ['admin'],
      ['read', 'write', 'delete', 'manage_users']
    );
  };

  const applyScenario = () => {
    client.applyScenario('admin_user');
  };

  return (
    <div>
      <p>Authenticated: {state.authState.isAuthenticated ? 'Yes' : 'No'}</p>
      <p>User: {state.authState.user?.email || 'None'}</p>
      <p>Roles: {state.authState.roles.join(', ')}</p>
      
      <button onClick={loginAsAdmin}>Login as Admin</button>
      <button onClick={applyScenario}>Apply Admin Scenario</button>
      <button onClick={() => client.mockLogout()}>Logout</button>
    </div>
  );
}
```

### Application Integration

To have your application respond to auth mock changes, listen for the custom event:

```javascript
// In your application's auth service
window.addEventListener('auth-mock-update', (event) => {
  const authState = event.detail;
  
  // Update your application's auth state
  updateApplicationAuthState(authState);
  
  // Trigger re-renders or navigation changes
  window.location.reload(); // Simple approach
  // or use your app's state management system
});
```

### Storage Configuration

Configure which storage keys the plugin should monitor and modify:

```tsx
import { devtoolsStore } from '@sucoza/auth-permissions-mock-devtools-plugin';

// Configure storage settings
devtoolsStore.importConfig({
  storageConfig: {
    type: 'localStorage', // or 'sessionStorage'
    key: 'authToken', // your app's token key
    userKey: 'currentUser' // optional user data key
  }
});
```

## API Reference

### useAuthMockClient()

Returns an object with:
- `state`: Current plugin state including auth state, scenarios, roles, etc.
- `client`: AuthMockDevToolsClient instance with methods for controlling auth state

### AuthMockDevToolsClient Methods

- `mockLogin(user, roles, permissions)`: Simulate user login
- `mockLogout()`: Simulate user logout
- `applyScenario(scenarioId)`: Apply a predefined auth scenario
- `updateRoles(roles)`: Update user roles
- `updatePermissions(permissions)`: Update user permissions
- `updateToken(token)`: Set a custom JWT token
- `getScenarios()`: Get available mock scenarios
- `getRoles()`: Get available roles
- `getPermissions()`: Get available permissions
- `clear()`: Reset all auth state

### Event System

The plugin dispatches custom events that your application can listen to:

- `auth-mock-update`: Fired when auth state changes
- `auth-state-change`: Fired by your app to notify the plugin of auth changes

## Mock Scenarios

Built-in scenarios include:

- **guest**: Unauthenticated user
- **standard_user**: Basic authenticated user with read/write permissions
- **admin_user**: Administrator with full permissions

Create custom scenarios:

```tsx
client.addScenario({
  id: 'moderator',
  name: 'Moderator',
  description: 'Content moderation access',
  authState: {
    isAuthenticated: true,
    user: { email: 'mod@example.com', name: 'Moderator' },
    roles: ['moderator'],
    permissions: ['read', 'write', 'moderate_content'],
    token: null, // Will be generated
    expires: Date.now() + (8 * 60 * 60 * 1000)
  }
});
```

## Development

```bash
# Install dependencies
npm install

# Build the plugin
npm run build

# Development mode
npm run dev

# Run tests
npm run test

# Type checking
npm run typecheck
```

## Security Considerations

⚠️ **Important**: This plugin only affects client-side authentication state for testing purposes. Server-side validation and authorization remain unchanged and secure. Always ensure your backend properly validates all requests regardless of client-side state.

The plugin displays warnings when mock mode is active to remind developers that this is for testing only.

## License

MIT

---

Part of the @sucoza TanStack DevTools ecosystem.