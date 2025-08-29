import React, { useState, useEffect } from 'react';

interface AuthState {
  isAuthenticated: boolean;
  user: any;
  token: string | null;
  roles: string[];
  permissions: string[];
  expires: number | null;
}

declare global {
  interface Window {
    AuthMock: {
      getState: () => AuthState;
      setState: (state: Partial<AuthState>) => void;
      login: (user: any, roles?: string[], permissions?: string[]) => void;
      logout: () => void;
      hasRole: (role: string) => boolean;
      hasPermission: (permission: string) => boolean;
      decodeToken: (token?: string) => any;
    };
  }
}

function App() {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    token: null,
    roles: [],
    permissions: [],
    expires: null
  });
  const [extensionLoaded, setExtensionLoaded] = useState(false);
  const [testResults, setTestResults] = useState<string[]>([]);

  useEffect(() => {
    // Check if the AuthMock extension is loaded
    if (window.AuthMock) {
      setExtensionLoaded(true);
      setAuthState(window.AuthMock.getState());

      // Listen for auth state changes
      const handleAuthChange = (event: CustomEvent) => {
        setAuthState(event.detail);
      };

      window.addEventListener('auth-mock-state-changed', handleAuthChange as EventListener);
      
      return () => {
        window.removeEventListener('auth-mock-state-changed', handleAuthChange as EventListener);
      };
    } else {
      // Retry after a short delay in case the extension loads later
      const timeout = setTimeout(() => {
        if (window.AuthMock) {
          setExtensionLoaded(true);
          setAuthState(window.AuthMock.getState());
        }
      }, 1000);
      
      return () => clearTimeout(timeout);
    }
  }, []);

  const runTests = () => {
    if (!window.AuthMock) {
      setTestResults(['❌ AuthMock extension not loaded']);
      return;
    }

    const results: string[] = [];

    try {
      // Test 1: Login functionality
      window.AuthMock.login(
        { id: 'test_user', email: 'test@example.com', name: 'Test User' },
        ['admin', 'user'],
        ['read', 'write', 'delete']
      );
      const state = window.AuthMock.getState();
      results.push(state.isAuthenticated ? '✅ Login test passed' : '❌ Login test failed');

      // Test 2: Role checking
      const hasAdminRole = window.AuthMock.hasRole('admin');
      results.push(hasAdminRole ? '✅ Role check test passed' : '❌ Role check test failed');

      // Test 3: Permission checking
      const hasWritePermission = window.AuthMock.hasPermission('write');
      results.push(hasWritePermission ? '✅ Permission check test passed' : '❌ Permission check test failed');

      // Test 4: Token decoding
      const decodedToken = window.AuthMock.decodeToken();
      results.push(decodedToken && decodedToken.email === 'test@example.com' ? '✅ Token decode test passed' : '❌ Token decode test failed');

      // Test 5: Logout functionality
      window.AuthMock.logout();
      const loggedOutState = window.AuthMock.getState();
      results.push(!loggedOutState.isAuthenticated ? '✅ Logout test passed' : '❌ Logout test failed');

    } catch (error) {
      results.push(`❌ Test error: ${error}`);
    }

    setTestResults(results);
  };

  const handleTestLogin = () => {
    if (window.AuthMock) {
      window.AuthMock.login(
        { id: 'app_user', email: 'appuser@example.com', name: 'App User' },
        ['user'],
        ['read', 'write']
      );
    }
  };

  const handleTestLogout = () => {
    if (window.AuthMock) {
      window.AuthMock.logout();
    }
  };

  const formatExpiration = (exp: number | null) => {
    if (!exp) return 'Never';
    return new Date(exp).toLocaleString();
  };

  return (
    <div className="container">
      <h1>Auth Mock System Test Application</h1>
      
      {/* Extension Status */}
      <div className={`card ${extensionLoaded ? 'status-authenticated' : 'status-unauthenticated'}`}>
        <h2>Extension Status</h2>
        <p>
          {extensionLoaded 
            ? '✅ Auth Mock extension is loaded and ready' 
            : '❌ Auth Mock extension not detected - please install and enable the extension'
          }
        </p>
        {!extensionLoaded && (
          <div>
            <p>To test this application:</p>
            <ol>
              <li>Load the Auth Mock extension in Chrome</li>
              <li>Refresh this page</li>
              <li>Open Chrome DevTools to access the Auth Mock panel</li>
            </ol>
          </div>
        )}
      </div>

      {extensionLoaded && (
        <>
          {/* Current Auth State */}
          <div className={`card ${authState.isAuthenticated ? 'status-authenticated' : 'status-unauthenticated'}`}>
            <h2>Current Authentication State</h2>
            <p><strong>Status:</strong> {authState.isAuthenticated ? 'Authenticated' : 'Not Authenticated'}</p>
            
            {authState.user && (
              <div className="info-grid">
                <div className="info-item">
                  <div className="info-label">User ID</div>
                  <div className="info-value">{authState.user.id || 'N/A'}</div>
                </div>
                <div className="info-item">
                  <div className="info-label">Name</div>
                  <div className="info-value">{authState.user.name || 'N/A'}</div>
                </div>
                <div className="info-item">
                  <div className="info-label">Email</div>
                  <div className="info-value">{authState.user.email || 'N/A'}</div>
                </div>
                <div className="info-item">
                  <div className="info-label">Expires</div>
                  <div className="info-value">{formatExpiration(authState.expires)}</div>
                </div>
              </div>
            )}

            {authState.roles.length > 0 && (
              <div className="info-item">
                <div className="info-label">Roles</div>
                <div className="permissions-list">
                  {authState.roles.map(role => (
                    <span key={role} className="permission-badge">{role}</span>
                  ))}
                </div>
              </div>
            )}

            {authState.permissions.length > 0 && (
              <div className="info-item">
                <div className="info-label">Permissions</div>
                <div className="permissions-list">
                  {authState.permissions.map(permission => (
                    <span key={permission} className="permission-badge">{permission}</span>
                  ))}
                </div>
              </div>
            )}

            {authState.token && (
              <div className="info-item">
                <div className="info-label">JWT Token</div>
                <div className="info-value" style={{ fontSize: '0.7rem', maxHeight: '100px', overflow: 'auto' }}>
                  {authState.token}
                </div>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="card">
            <h2>Quick Actions</h2>
            <p>Test the authentication system with these buttons:</p>
            
            <div>
              <button 
                className="button"
                onClick={handleTestLogin}
                disabled={authState.isAuthenticated}
              >
                Test Login
              </button>
              
              <button 
                className="button button-secondary"
                onClick={handleTestLogout}
                disabled={!authState.isAuthenticated}
              >
                Test Logout
              </button>
            </div>
          </div>

          {/* Permission Tests */}
          <div className="card">
            <h2>Permission Testing</h2>
            <div className="test-section">
              <h3>Role-Based Access Tests</h3>
              <button 
                className="button"
                onClick={() => {
                  if (window.AuthMock.hasRole('admin')) {
                    alert('✅ You have admin access!');
                  } else {
                    alert('❌ Admin access denied');
                  }
                }}
              >
                Test Admin Access
              </button>
              
              <button 
                className="button"
                onClick={() => {
                  if (window.AuthMock.hasPermission('delete')) {
                    alert('✅ You can delete items!');
                  } else {
                    alert('❌ Delete permission denied');
                  }
                }}
              >
                Test Delete Permission
              </button>
            </div>
          </div>

          {/* Automated Tests */}
          <div className="card">
            <h2>Automated Tests</h2>
            <button className="button" onClick={runTests}>
              Run All Tests
            </button>
            
            {testResults.length > 0 && (
              <div style={{ marginTop: '1rem' }}>
                <h4>Test Results:</h4>
                <ul>
                  {testResults.map((result, index) => (
                    <li key={index}>{result}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="card">
            <h2>How to Use</h2>
            <ol>
              <li><strong>Open Chrome DevTools</strong> (F12 or right-click → Inspect)</li>
              <li><strong>Navigate to the "Auth Mock" tab</strong> in DevTools</li>
              <li><strong>Use the DevTools panel</strong> to:
                <ul>
                  <li>Switch between different user roles and scenarios</li>
                  <li>Edit JWT tokens and test token validation</li>
                  <li>Manage permissions and test access control</li>
                  <li>Simulate OAuth flows</li>
                  <li>Manage browser storage for auth data</li>
                </ul>
              </li>
              <li><strong>Watch this page update</strong> in real-time as you make changes in DevTools</li>
            </ol>
          </div>
        </>
      )}
    </div>
  );
}

export default App;