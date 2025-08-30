import { AuthState, User, Role, Permission, MockScenario, StorageOperation, StorageConfig } from '../types/auth';

export interface DevToolsState {
  authState: AuthState;
  scenarios: MockScenario[];
  roles: Role[];
  permissions: Permission[];
  storageOperations: StorageOperation[];
  storageConfig: StorageConfig;
  mockMode: boolean;
}

class AuthMockDevToolsStore {
  private state: DevToolsState = {
    authState: {
      isAuthenticated: false,
      user: null,
      token: null,
      roles: [],
      permissions: [],
      expires: null
    },
    scenarios: this.getDefaultScenarios(),
    roles: this.getDefaultRoles(),
    permissions: this.getDefaultPermissions(),
    storageOperations: [],
    storageConfig: {
      type: 'localStorage',
      key: 'auth_token',
      userKey: 'auth_user'
    },
    mockMode: true
  };

  private listeners: Set<() => void> = new Set();

  getState(): DevToolsState {
    return { ...this.state };
  }

  updateAuthState(authState: Partial<AuthState>) {
    this.state.authState = { ...this.state.authState, ...authState };
    this.notifyListeners();
  }

  mockLogin(user: User, roles: string[] = ['user'], customPermissions?: string[]): AuthState {
    const rolePermissions = roles.flatMap(roleId => {
      const role = this.state.roles.find(r => r.id === roleId);
      return role ? role.permissions : [];
    });

    const permissions = customPermissions || [...new Set(rolePermissions)];
    const expires = Date.now() + (24 * 60 * 60 * 1000); // 24 hours

    const tokenPayload = {
      sub: user.id || user.email || 'mock-user',
      email: user.email,
      name: user.name,
      roles,
      permissions,
      exp: Math.floor(expires / 1000),
      iat: Math.floor(Date.now() / 1000),
      iss: 'auth-mock-devtools'
    };

    const token = this.generateMockJWT(tokenPayload);

    const authState: AuthState = {
      isAuthenticated: true,
      user,
      token,
      roles,
      permissions,
      expires
    };

    this.updateAuthState(authState);
    this.recordAuthEvent('login', { user: user.email, roles });
    
    return authState;
  }

  mockLogout(): AuthState {
    const authState: AuthState = {
      isAuthenticated: false,
      user: null,
      token: null,
      roles: [],
      permissions: [],
      expires: null
    };

    this.updateAuthState(authState);
    this.recordAuthEvent('logout', {});
    
    return authState;
  }

  applyScenario(scenarioId: string): AuthState {
    const scenario = this.state.scenarios.find(s => s.id === scenarioId);
    if (!scenario) {
      throw new Error(`Scenario ${scenarioId} not found`);
    }

    const authState = { ...scenario.authState };

    // Generate token if authenticated
    if (authState.isAuthenticated && authState.user) {
      const tokenPayload = {
        sub: authState.user.id || authState.user.email || 'mock-user',
        email: authState.user.email,
        name: authState.user.name,
        roles: authState.roles,
        permissions: authState.permissions,
        exp: authState.expires ? Math.floor(authState.expires / 1000) : undefined,
        iat: Math.floor(Date.now() / 1000),
        iss: 'auth-mock-devtools'
      };

      authState.token = this.generateMockJWT(tokenPayload);
    }

    this.updateAuthState(authState);
    this.recordAuthEvent('scenario_applied', { scenario: scenarioId });
    
    // Update storage config if provided
    if (scenario.storageConfig) {
      this.state.storageConfig = { ...this.state.storageConfig, ...scenario.storageConfig };
    }
    
    return authState;
  }

  updateRoles(roles: string[]): AuthState {
    const rolePermissions = roles.flatMap(roleId => {
      const role = this.state.roles.find(r => r.id === roleId);
      return role ? role.permissions : [];
    });

    const permissions = [...new Set(rolePermissions)];
    
    this.state.authState.roles = roles;
    this.state.authState.permissions = permissions;
    
    // Regenerate token with new roles/permissions
    if (this.state.authState.token && this.state.authState.user) {
      const tokenPayload = {
        sub: this.state.authState.user.id || this.state.authState.user.email || 'mock-user',
        email: this.state.authState.user.email,
        name: this.state.authState.user.name,
        roles,
        permissions,
        exp: this.state.authState.expires ? Math.floor(this.state.authState.expires / 1000) : undefined,
        iat: Math.floor(Date.now() / 1000),
        iss: 'auth-mock-devtools'
      };

      this.state.authState.token = this.generateMockJWT(tokenPayload);
    }
    
    this.notifyListeners();
    this.recordAuthEvent('roles_updated', { roles });
    
    return this.state.authState;
  }

  updatePermissions(permissions: string[]): AuthState {
    this.state.authState.permissions = permissions;
    
    // Regenerate token with new permissions
    if (this.state.authState.token && this.state.authState.user) {
      const tokenPayload = {
        sub: this.state.authState.user.id || this.state.authState.user.email || 'mock-user',
        email: this.state.authState.user.email,
        name: this.state.authState.user.name,
        roles: this.state.authState.roles,
        permissions,
        exp: this.state.authState.expires ? Math.floor(this.state.authState.expires / 1000) : undefined,
        iat: Math.floor(Date.now() / 1000),
        iss: 'auth-mock-devtools'
      };

      this.state.authState.token = this.generateMockJWT(tokenPayload);
    }
    
    this.notifyListeners();
    this.recordAuthEvent('permissions_updated', { permissions });
    
    return this.state.authState;
  }

  updateToken(token: string): AuthState {
    this.state.authState.token = token;
    
    // Try to decode and update auth state from token
    try {
      const payload = this.decodeJWT(token);
      if (payload) {
        this.state.authState.roles = payload.roles || [];
        this.state.authState.permissions = payload.permissions || [];
        this.state.authState.expires = payload.exp ? payload.exp * 1000 : null;
        
        if (payload.email || payload.name) {
          this.state.authState.user = {
            id: payload.sub,
            email: payload.email,
            name: payload.name
          };
        }
      }
    } catch (error) {
      console.warn('Failed to decode JWT:', error);
    }
    
    this.notifyListeners();
    this.recordAuthEvent('token_updated', {});
    
    return this.state.authState;
  }

  recordStorageOperation(operation: StorageOperation) {
    this.state.storageOperations.push(operation);
    
    // Keep only last 100 operations
    if (this.state.storageOperations.length > 100) {
      this.state.storageOperations = this.state.storageOperations.slice(-100);
    }
    
    this.notifyListeners();
  }

  private recordAuthEvent(event: string, data: any) {
    const operation: StorageOperation = {
      timestamp: Date.now(),
      operation: 'event',
      key: event,
      value: JSON.stringify(data),
      storage: 'event'
    };
    
    this.recordStorageOperation(operation);
  }

  getStorageConfig() {
    return { ...this.state.storageConfig };
  }

  getScenarios(): MockScenario[] {
    return [...this.state.scenarios];
  }

  getRoles(): Role[] {
    return [...this.state.roles];
  }

  getPermissions(): Permission[] {
    return [...this.state.permissions];
  }

  addScenario(scenario: MockScenario) {
    this.state.scenarios.push(scenario);
    this.notifyListeners();
  }

  addRole(role: Role) {
    this.state.roles.push(role);
    this.notifyListeners();
  }

  addPermission(permission: Permission) {
    this.state.permissions.push(permission);
    this.notifyListeners();
  }

  exportConfig() {
    return {
      scenarios: this.state.scenarios,
      roles: this.state.roles,
      permissions: this.state.permissions,
      storageConfig: this.state.storageConfig
    };
  }

  importConfig(config: any) {
    if (config.scenarios) this.state.scenarios = config.scenarios;
    if (config.roles) this.state.roles = config.roles;
    if (config.permissions) this.state.permissions = config.permissions;
    if (config.storageConfig) this.state.storageConfig = config.storageConfig;
    
    this.notifyListeners();
  }

  clear(): AuthState {
    const authState: AuthState = {
      isAuthenticated: false,
      user: null,
      token: null,
      roles: [],
      permissions: [],
      expires: null
    };

    this.state.authState = authState;
    this.state.storageOperations = [];
    
    this.notifyListeners();
    this.recordAuthEvent('cleared', {});
    
    return authState;
  }

  private generateMockJWT(payload: any): string {
    const header = { typ: 'JWT', alg: 'HS256' };
    const encodedHeader = btoa(JSON.stringify(header));
    const encodedPayload = btoa(JSON.stringify(payload));
    const signature = 'mock_signature_' + Math.random().toString(36).substring(7);
    
    return `${encodedHeader}.${encodedPayload}.${signature}`;
  }

  private decodeJWT(token: string) {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      
      const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
      return payload;
    } catch {
      return null;
    }
  }

  private getDefaultScenarios(): MockScenario[] {
    return [
      {
        id: 'guest',
        name: 'Guest User',
        description: 'Not authenticated',
        authState: {
          isAuthenticated: false,
          user: null,
          token: null,
          roles: [],
          permissions: [],
          expires: null
        },
        storageConfig: {
          type: 'localStorage',
          key: 'auth_token'
        }
      },
      {
        id: 'standard_user',
        name: 'Standard User',
        description: 'Basic authenticated user',
        authState: {
          isAuthenticated: true,
          user: {
            id: 'user_123',
            email: 'user@example.com',
            name: 'John Doe'
          },
          token: null,
          roles: ['user'],
          permissions: ['read', 'write'],
          expires: Date.now() + (24 * 60 * 60 * 1000)
        },
        storageConfig: {
          type: 'localStorage',
          key: 'auth_token'
        }
      },
      {
        id: 'admin_user',
        name: 'Administrator',
        description: 'Full access admin user',
        authState: {
          isAuthenticated: true,
          user: {
            id: 'admin_456',
            email: 'admin@example.com',
            name: 'Jane Admin'
          },
          token: null,
          roles: ['admin'],
          permissions: ['read', 'write', 'delete', 'manage_users', 'manage_settings'],
          expires: Date.now() + (8 * 60 * 60 * 1000)
        },
        storageConfig: {
          type: 'localStorage',
          key: 'auth_token'
        }
      }
    ];
  }

  private getDefaultRoles(): Role[] {
    return [
      {
        id: 'admin',
        name: 'Administrator',
        description: 'Full system access',
        permissions: ['read', 'write', 'delete', 'manage_users', 'manage_settings']
      },
      {
        id: 'user',
        name: 'User',
        description: 'Standard user access',
        permissions: ['read', 'write']
      },
      {
        id: 'viewer',
        name: 'Viewer',
        description: 'Read-only access',
        permissions: ['read']
      },
      {
        id: 'moderator',
        name: 'Moderator',
        description: 'Content moderation access',
        permissions: ['read', 'write', 'moderate_content']
      }
    ];
  }

  private getDefaultPermissions(): Permission[] {
    return [
      { id: 'read', name: 'Read', description: 'View content', resource: '*', action: 'read' },
      { id: 'write', name: 'Write', description: 'Create/edit content', resource: '*', action: 'write' },
      { id: 'delete', name: 'Delete', description: 'Remove content', resource: '*', action: 'delete' },
      { id: 'manage_users', name: 'Manage Users', description: 'User administration', resource: 'users', action: 'manage' },
      { id: 'manage_settings', name: 'Manage Settings', description: 'System configuration', resource: 'settings', action: 'manage' },
      { id: 'moderate_content', name: 'Moderate Content', description: 'Content moderation', resource: 'content', action: 'moderate' }
    ];
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener());
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
}

export const devtoolsStore = new AuthMockDevToolsStore();