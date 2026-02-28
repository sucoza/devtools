import { useSyncExternalStore } from 'use-sync-external-store/shim';
import { AuthState, User, Role, Permission, MockScenario } from '../types/auth';
import { devtoolsStore } from './devtools-store';

export class AuthMockDevToolsClient {
  private listeners: Set<() => void> = new Set();
  private authInterceptor: ((authState: AuthState) => void) | null = null;
  private isMonitoring = false;

  // Store original Storage.prototype methods so they can be restored on cleanup
  private originalSetItem: typeof Storage.prototype.setItem | null = null;
  private originalRemoveItem: typeof Storage.prototype.removeItem | null = null;

  // Store the bound event handler so it can be removed later
  private authStateChangeHandler: ((event: Event) => void) | null = null;

  constructor() {
    // Initialize interceptor for auth state changes
    this.startMonitoring();
  }

  startMonitoring() {
    if (this.isMonitoring) {
      return;
    }
    this.isMonitoring = true;
    this.setupInterceptor();
  }

  stopMonitoring() {
    if (!this.isMonitoring) {
      return;
    }
    this.isMonitoring = false;

    // Restore original Storage.prototype methods
    if (this.originalSetItem) {
      Storage.prototype.setItem = this.originalSetItem;
      this.originalSetItem = null;
    }
    if (this.originalRemoveItem) {
      Storage.prototype.removeItem = this.originalRemoveItem;
      this.originalRemoveItem = null;
    }

    // Remove the auth-state-change event listener
    if (this.authStateChangeHandler) {
      window.removeEventListener('auth-state-change', this.authStateChangeHandler);
      this.authStateChangeHandler = null;
    }
  }

  cleanup() {
    this.stopMonitoring();
    this.listeners.clear();
    this.authInterceptor = null;
  }

  private setupInterceptor() {
    // Intercept localStorage and sessionStorage operations
    this.originalSetItem = Storage.prototype.setItem;
    this.originalRemoveItem = Storage.prototype.removeItem;

    const originalSetItem = this.originalSetItem;
    const originalRemoveItem = this.originalRemoveItem;
    const self = this;

    Storage.prototype.setItem = function(key: string, value: string) {
      originalSetItem.call(this, key, value);

      // Detect auth-related storage changes
      if (key.includes('auth') || key.includes('token') || key.includes('user')) {
        self.handleStorageChange(key, value);
      }
    };

    Storage.prototype.removeItem = function(key: string) {
      originalRemoveItem.call(this, key);

      // Detect auth-related storage removal
      if (key.includes('auth') || key.includes('token') || key.includes('user')) {
        self.handleStorageChange(key, null);
      }
    };

    // Listen for auth state changes from the application
    this.authStateChangeHandler = (event: Event) => {
      const customEvent = event as CustomEvent;
      this.handleAuthStateChange(customEvent.detail);
    };
    window.addEventListener('auth-state-change', this.authStateChangeHandler);
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