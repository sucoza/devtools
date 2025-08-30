import { useSyncExternalStore } from 'use-sync-external-store/shim';
import { AuthState, User, Role, Permission, MockScenario } from '../types/auth';
import { devtoolsStore } from './devtools-store';

export class AuthMockDevToolsClient {
  private listeners: Set<() => void> = new Set();
  private authInterceptor: ((authState: AuthState) => void) | null = null;

  constructor() {
    // Initialize interceptor for auth state changes
    this.setupInterceptor();
  }

  private setupInterceptor() {
    // Intercept localStorage and sessionStorage operations
    const originalSetItem = Storage.prototype.setItem;
    const originalRemoveItem = Storage.prototype.removeItem;

    Storage.prototype.setItem = (key: string, value: string) => {
      originalSetItem.call(window.localStorage, key, value);
      
      // Detect auth-related storage changes
      if (key.includes('auth') || key.includes('token') || key.includes('user')) {
        this.handleStorageChange(key, value);
      }
    };

    Storage.prototype.removeItem = (key: string) => {
      originalRemoveItem.call(window.localStorage, key);
      
      // Detect auth-related storage removal
      if (key.includes('auth') || key.includes('token') || key.includes('user')) {
        this.handleStorageChange(key, null);
      }
    };

    // Listen for auth state changes from the application
    window.addEventListener('auth-state-change', (event: Event) => {
      const customEvent = event as CustomEvent;
      this.handleAuthStateChange(customEvent.detail);
    });
  }

  private handleStorageChange(key: string, value: string | null) {
    devtoolsStore.recordStorageOperation({
      timestamp: Date.now(),
      operation: value === null ? 'remove' : 'set',
      key,
      value,
      storage: 'localStorage'
    });
  }

  private handleAuthStateChange(authState: AuthState) {
    devtoolsStore.updateAuthState(authState);
    
    if (this.authInterceptor) {
      this.authInterceptor(authState);
    }
  }

  // Public API for DevTools panel
  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  getSnapshot() {
    return devtoolsStore.getState();
  }

  // Mock authentication methods
  mockLogin(user: User, roles: string[] = ['user'], permissions?: string[]) {
    const authState = devtoolsStore.mockLogin(user, roles, permissions);
    this.injectAuthState(authState);
  }

  mockLogout() {
    const authState = devtoolsStore.mockLogout();
    this.injectAuthState(authState);
  }

  applyScenario(scenarioId: string) {
    const authState = devtoolsStore.applyScenario(scenarioId);
    this.injectAuthState(authState);
  }

  updateRoles(roles: string[]) {
    const authState = devtoolsStore.updateRoles(roles);
    this.injectAuthState(authState);
  }

  updatePermissions(permissions: string[]) {
    const authState = devtoolsStore.updatePermissions(permissions);
    this.injectAuthState(authState);
  }

  updateToken(token: string) {
    const authState = devtoolsStore.updateToken(token);
    this.injectAuthState(authState);
  }

  // Inject auth state into the application
  private injectAuthState(authState: AuthState) {
    // Update localStorage/sessionStorage
    const storageConfig = devtoolsStore.getStorageConfig();
    const storage = storageConfig.type === 'sessionStorage' ? sessionStorage : localStorage;
    
    if (authState.token) {
      storage.setItem(storageConfig.key, authState.token);
    } else {
      storage.removeItem(storageConfig.key);
    }

    // Update user data if stored separately
    if (storageConfig.userKey && authState.user) {
      storage.setItem(storageConfig.userKey, JSON.stringify(authState.user));
    } else if (storageConfig.userKey) {
      storage.removeItem(storageConfig.userKey);
    }

    // Dispatch custom event for the application to handle
    window.dispatchEvent(new CustomEvent('auth-mock-update', {
      detail: authState
    }));

    // Notify all listeners
    this.notifyListeners();
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener());
  }

  // Set custom auth interceptor
  setAuthInterceptor(interceptor: (authState: AuthState) => void) {
    this.authInterceptor = interceptor;
  }

  // Get available scenarios
  getScenarios(): MockScenario[] {
    return devtoolsStore.getScenarios();
  }

  // Get available roles
  getRoles(): Role[] {
    return devtoolsStore.getRoles();
  }

  // Get available permissions
  getPermissions(): Permission[] {
    return devtoolsStore.getPermissions();
  }

  // Add custom scenario
  addScenario(scenario: MockScenario) {
    devtoolsStore.addScenario(scenario);
  }

  // Add custom role
  addRole(role: Role) {
    devtoolsStore.addRole(role);
  }

  // Add custom permission
  addPermission(permission: Permission) {
    devtoolsStore.addPermission(permission);
  }

  // Export/Import configurations
  exportConfig() {
    return devtoolsStore.exportConfig();
  }

  importConfig(config: any) {
    devtoolsStore.importConfig(config);
  }

  // Clear all mock data
  clear() {
    const authState = devtoolsStore.clear();
    this.injectAuthState(authState);
  }
}

// Create singleton instance
export const authMockClient = new AuthMockDevToolsClient();

// React hook for using the auth mock client
export function useAuthMockClient() {
  const state = useSyncExternalStore(
    (callback) => authMockClient.subscribe(callback),
    () => authMockClient.getSnapshot(),
    () => authMockClient.getSnapshot()
  );

  return {
    state,
    client: authMockClient
  };
}