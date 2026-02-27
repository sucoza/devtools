import { StoreApi, UseBoundStore } from 'zustand';
import { zustandEventClient } from './zustandEventClient';

type AnyStore = UseBoundStore<StoreApi<any>>;

class ZustandStoreRegistry {
  private stores = new Map<string, AnyStore>();
  private storeStates = new Map<string, unknown>();
  private actionHistory: Array<{
    storeName: string;
    action: string;
    prevState: unknown;
    nextState: unknown;
    timestamp: number;
  }> = [];
  private snapshots = new Map<string, Record<string, unknown>>();

  constructor() {
    // Listen for state requests from the DevTools panel
    zustandEventClient.on('zustand-state-request', () => {
      this.handleStateRequest();
    });

    // Listen for state restoration requests
    zustandEventClient.on('zustand-restore-state', (event: any) => {
      this.handleRestoreState(event.payload);
    });

    // Listen for snapshot save requests
    zustandEventClient.on('zustand-save-snapshot', (event: any) => {
      this.handleSaveSnapshot(event.payload);
    });

    // Listen for snapshot load requests
    zustandEventClient.on('zustand-load-snapshot', (event: any) => {
      this.handleLoadSnapshot(event.payload);
    });
  }

  private handleStateRequest() {
    const storesState: Record<string, any> = {};
    
    this.storeStates.forEach((state, name) => {
      storesState[name] = {
        name,
        state,
        timestamp: Date.now(),
      };
    });

    zustandEventClient.emit('zustand-state-response', {
      stores: storesState,
    });
  }

  // Helper to clean state for serialization
  private cleanStateForSerialization(obj: any): any {
    if (obj === null || obj === undefined) return obj;
    if (typeof obj === 'function') return '[Function]';
    if (typeof obj === 'symbol') return '[Symbol]';
    if (obj instanceof Promise) return '[Promise]';
    if (obj instanceof Date) return obj.toISOString();
    if (obj instanceof RegExp) return obj.toString();
    if (obj instanceof Error) return { name: obj.name, message: obj.message, stack: obj.stack };
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.cleanStateForSerialization(item));
    }
    
    if (typeof obj === 'object') {
      const cleaned: any = {};
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          cleaned[key] = this.cleanStateForSerialization(obj[key]);
        }
      }
      return cleaned;
    }
    
    return obj;
  }

  registerStore(name: string, store: AnyStore) {
    if (this.stores.has(name)) {
      console.warn(`Store "${name}" is already registered. Overwriting.`);
    }

    this.stores.set(name, store);
    const initialState = store.getState();
    const cleanedInitialState = this.cleanStateForSerialization(initialState);
    this.storeStates.set(name, cleanedInitialState);

    // Emit registration event with cleaned state
    zustandEventClient.emit('zustand-store-registered', {
      storeName: name,
      initialState: cleanedInitialState,
    });

    // Subscribe to store changes
    const unsubscribe = store.subscribe((state, prevState) => {
      const cleanedState = this.cleanStateForSerialization(state);
      const cleanedPrevState = this.cleanStateForSerialization(prevState);
      this.storeStates.set(name, cleanedState);
      
      // Track action history with cleaned states
      const actionEntry = {
        storeName: name,
        action: 'state-update',
        prevState: cleanedPrevState,
        nextState: cleanedState,
        timestamp: Date.now(),
      };
      
      this.actionHistory.push(actionEntry);
      
      // Keep only last 100 actions
      if (this.actionHistory.length > 100) {
        this.actionHistory.shift();
      }

      // Emit action event with cleaned states
      zustandEventClient.emit('zustand-store-action', actionEntry);

      // Emit overall state update
      this.emitStateUpdate();
    });

    // Initial state emission
    this.emitStateUpdate();

    return unsubscribe;
  }

  unregisterStore(name: string) {
    this.stores.delete(name);
    this.storeStates.delete(name);
    this.emitStateUpdate();
  }

  private emitStateUpdate() {
    const storesState: Record<string, any> = {};
    
    this.storeStates.forEach((state, name) => {
      storesState[name] = {
        name,
        state,
        timestamp: Date.now(),
      };
    });

    zustandEventClient.emit('zustand-state-update', {
      stores: storesState,
    });
  }

  getStores() {
    return Array.from(this.stores.entries()).map(([name, store]) => ({
      name,
      state: this.cleanStateForSerialization(store.getState()),
    }));
  }

  getActionHistory() {
    return [...this.actionHistory];
  }

  clearActionHistory() {
    this.actionHistory = [];
  }

  private handleRestoreState(payload: { storeName: string; state: unknown; timestamp: number }) {
    const { storeName, state } = payload;
    const store = this.stores.get(storeName);

    if (!store) {
      console.warn(`Cannot restore state: Store "${storeName}" not found`);
      return;
    }

    try {
      // Restore the state by calling setState with the historical state
      store.setState(state as any, true);

      // Update our tracked state
      const cleanedState = this.cleanStateForSerialization(state);
      this.storeStates.set(storeName, cleanedState);

      // Emit confirmation event
      zustandEventClient.emit('zustand-state-restored', {
        storeName,
        state: cleanedState,
        timestamp: Date.now()
      });

      // Emit state update to refresh the UI
      this.emitStateUpdate();
    } catch (error) {
      console.error(`Failed to restore state for store "${storeName}":`, error);
    }
  }

  private handleSaveSnapshot(payload: { name: string; stores: Record<string, unknown> }) {
    const { name, stores: _stores } = payload;

    // Save current states of all stores
    const snapshot: Record<string, unknown> = {};
    this.storeStates.forEach((state, storeName) => {
      snapshot[storeName] = state;
    });

    this.snapshots.set(name, snapshot);
    console.log(`Snapshot "${name}" saved with ${Object.keys(snapshot).length} stores`);
  }

  private handleLoadSnapshot(payload: { name: string }) {
    const { name } = payload;
    const snapshot = this.snapshots.get(name);

    if (!snapshot) {
      console.warn(`Snapshot "${name}" not found`);
      return;
    }

    // Restore each store from the snapshot
    Object.entries(snapshot).forEach(([storeName, state]) => {
      const store = this.stores.get(storeName);
      if (store) {
        try {
          store.setState(state as any, true);
          this.storeStates.set(storeName, state);
        } catch (error) {
          console.error(`Failed to restore store "${storeName}" from snapshot:`, error);
        }
      }
    });

    // Emit state update to refresh the UI
    this.emitStateUpdate();
    console.log(`Snapshot "${name}" loaded`);
  }

  getSnapshots() {
    return Array.from(this.snapshots.keys());
  }

  deleteSnapshot(name: string) {
    this.snapshots.delete(name);
  }
}

export const zustandRegistry = new ZustandStoreRegistry();

// Enhanced store creation with automatic DevTools registration
// S is the full store type (the hook function itself)
export function createDevToolsStore<S extends (...args: any[]) => any>(
  name: string,
  createStore: () => S
): S {
  const store = createStore();
  zustandRegistry.registerStore(name, store as any);
  return store;
}

// Hook to register an existing store with DevTools
export function useRegisterZustandStore(name: string, store: AnyStore) {
  // Use useEffect equivalent logic if in React context
  if (typeof window !== 'undefined') {
    zustandRegistry.registerStore(name, store);
  }
}

// Middleware for automatic action tracking
export const devtoolsMiddleware = (config: any) => (set: any, get: any, api: any) =>
  config(
    (args: any) => {
      set(args);
      const nextState = get();
      
      // This will be picked up by the subscription in registerStore
      return nextState;
    },
    get,
    api
  );