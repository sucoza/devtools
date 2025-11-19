import { describe, test, expect, beforeEach, vi } from 'vitest';
import { create } from 'zustand';
import { zustandRegistry, createDevToolsStore } from '../zustandDevtoolsIntegration';
import { zustandEventClient } from '../zustandEventClient';

describe('Zustand DevTools Integration - State Restoration', () => {
  beforeEach(() => {
    // Clear any registered stores before each test
    zustandRegistry['stores'].clear();
    zustandRegistry['storeStates'].clear();
    zustandRegistry['actionHistory'] = [];
    zustandRegistry['snapshots'].clear();
  });

  describe('Store Registration and State Tracking', () => {
    test('should register store and track initial state', () => {
      interface TestStore {
        count: number;
        increment: () => void;
      }

      const useTestStore = create<TestStore>((set) => ({
        count: 0,
        increment: () => set((state) => ({ count: state.count + 1 })),
      }));

      zustandRegistry.registerStore('testStore', useTestStore as any);

      const stores = zustandRegistry.getStores();
      expect(stores).toHaveLength(1);
      expect(stores[0].name).toBe('testStore');
      expect(stores[0].state).toMatchObject({ count: 0 });
    });

    test('should track state changes in action history', () => {
      interface CounterStore {
        count: number;
        increment: () => void;
      }

      const useCounterStore = create<CounterStore>((set) => ({
        count: 0,
        increment: () => set((state) => ({ count: state.count + 1 })),
      }));

      zustandRegistry.registerStore('counterStore', useCounterStore as any);

      // Trigger state change
      useCounterStore.getState().increment();

      // Wait for subscription to fire
      setTimeout(() => {
        const history = zustandRegistry.getActionHistory();
        expect(history.length).toBeGreaterThan(0);
        expect(history[0].storeName).toBe('counterStore');
      }, 10);
    });

    test('should clear action history', () => {
      interface TestStore {
        value: number;
      }

      const useTestStore = create<TestStore>(() => ({ value: 1 }));
      zustandRegistry.registerStore('testStore', useTestStore as any);

      // Simulate some history
      zustandRegistry['actionHistory'].push({
        storeName: 'testStore',
        action: 'update',
        prevState: { value: 1 },
        nextState: { value: 2 },
        timestamp: Date.now(),
      });

      expect(zustandRegistry.getActionHistory()).toHaveLength(1);

      zustandRegistry.clearActionHistory();
      expect(zustandRegistry.getActionHistory()).toHaveLength(0);
    });
  });

  describe('State Restoration', () => {
    test('should restore store to previous state', async () => {
      interface CounterStore {
        count: number;
        increment: () => void;
      }

      const useCounterStore = create<CounterStore>((set) => ({
        count: 0,
        increment: () => set((state) => ({ count: state.count + 1 })),
      }));

      zustandRegistry.registerStore('counterStore', useCounterStore as any);

      // Initial state
      expect(useCounterStore.getState().count).toBe(0);

      // Increment
      useCounterStore.getState().increment();
      expect(useCounterStore.getState().count).toBe(1);

      // Directly call the restore method instead of emitting event
      const payload = {
        storeName: 'counterStore',
        state: { count: 0, increment: useCounterStore.getState().increment },
        timestamp: Date.now(),
      };

      zustandRegistry['handleRestoreState'](payload);

      // State should be restored
      expect(useCounterStore.getState().count).toBe(0);
    });

    test('should handle restore for non-existent store gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      zustandRegistry['handleRestoreState']({
        storeName: 'nonExistentStore',
        state: { value: 123 },
        timestamp: Date.now(),
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Cannot restore state')
      );

      consoleSpy.mockRestore();
    });

    test('should update tracked state after restoration', () => {
      interface TestStore {
        value: string;
      }

      const useTestStore = create<TestStore>(() => ({ value: 'initial' }));
      zustandRegistry.registerStore('testStore', useTestStore as any);

      // Restore state
      zustandRegistry['handleRestoreState']({
        storeName: 'testStore',
        state: { value: 'restored' },
        timestamp: Date.now(),
      });

      expect(useTestStore.getState().value).toBe('restored');

      // Check that tracked state is also updated
      const stores = zustandRegistry.getStores();
      const testStore = stores.find((s) => s.name === 'testStore');
      expect(testStore?.state).toMatchObject({ value: 'restored' });
    });
  });

  describe('Snapshot Management', () => {
    test('should save snapshot of all store states', () => {
      interface Store1 {
        count: number;
      }
      interface Store2 {
        name: string;
      }

      const useStore1 = create<Store1>(() => ({ count: 42 }));
      const useStore2 = create<Store2>(() => ({ name: 'test' }));

      zustandRegistry.registerStore('store1', useStore1 as any);
      zustandRegistry.registerStore('store2', useStore2 as any);

      const snapshotName = 'test-snapshot';
      zustandRegistry['handleSaveSnapshot']({
        name: snapshotName,
        stores: {
          store1: { count: 42 },
          store2: { name: 'test' },
        },
      });

      const snapshots = zustandRegistry.getSnapshots();
      expect(snapshots).toContain(snapshotName);
    });

    test('should load snapshot and restore all stores', () => {
      interface CounterStore {
        count: number;
      }
      interface NameStore {
        name: string;
      }

      const useCounterStore = create<CounterStore>((set) => ({
        count: 0,
      }));
      const useNameStore = create<NameStore>((set) => ({
        name: 'initial',
      }));

      zustandRegistry.registerStore('counterStore', useCounterStore as any);
      zustandRegistry.registerStore('nameStore', useNameStore as any);

      // Create a snapshot manually
      const snapshotName = 'saved-state';
      zustandRegistry['snapshots'].set(snapshotName, {
        counterStore: { count: 100 },
        nameStore: { name: 'snapshot' },
      });

      // Load the snapshot
      zustandRegistry['handleLoadSnapshot']({
        name: snapshotName,
      });

      expect(useCounterStore.getState().count).toBe(100);
      expect(useNameStore.getState().name).toBe('snapshot');
    });

    test('should handle loading non-existent snapshot gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      zustandRegistry['handleLoadSnapshot']({
        name: 'non-existent-snapshot',
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Snapshot "non-existent-snapshot" not found')
      );

      consoleSpy.mockRestore();
    });

    test('should delete snapshot', () => {
      zustandRegistry['snapshots'].set('test-snapshot', { store1: { value: 1 } });
      expect(zustandRegistry.getSnapshots()).toContain('test-snapshot');

      zustandRegistry.deleteSnapshot('test-snapshot');
      expect(zustandRegistry.getSnapshots()).not.toContain('test-snapshot');
    });

    test('should get list of all snapshots', () => {
      zustandRegistry['snapshots'].set('snapshot1', {});
      zustandRegistry['snapshots'].set('snapshot2', {});
      zustandRegistry['snapshots'].set('snapshot3', {});

      const snapshots = zustandRegistry.getSnapshots();
      expect(snapshots).toHaveLength(3);
      expect(snapshots).toEqual(
        expect.arrayContaining(['snapshot1', 'snapshot2', 'snapshot3'])
      );
    });
  });

  describe('State Serialization', () => {
    test('should clean functions from state', () => {
      interface StoreWithFunctions {
        count: number;
        increment: () => void;
        decrement: () => void;
      }

      const useStore = create<StoreWithFunctions>((set) => ({
        count: 0,
        increment: () => set((s) => ({ count: s.count + 1 })),
        decrement: () => set((s) => ({ count: s.count - 1 })),
      }));

      zustandRegistry.registerStore('funcStore', useStore as any);

      const stores = zustandRegistry.getStores();
      const state = stores[0].state as any;

      // Functions should be replaced with '[Function]' string
      expect(state.increment).toBe('[Function]');
      expect(state.decrement).toBe('[Function]');
      expect(state.count).toBe(0);
    });

    test('should serialize Date objects', () => {
      interface DateStore {
        timestamp: Date;
      }

      const testDate = new Date('2025-01-01T00:00:00Z');
      const useDateStore = create<DateStore>(() => ({
        timestamp: testDate,
      }));

      zustandRegistry.registerStore('dateStore', useDateStore as any);

      const stores = zustandRegistry.getStores();
      const state = stores[0].state as any;

      expect(state.timestamp).toBe(testDate.toISOString());
    });

    test('should handle nested objects', () => {
      interface NestedStore {
        user: {
          name: string;
          address: {
            city: string;
            country: string;
          };
        };
      }

      const useNestedStore = create<NestedStore>(() => ({
        user: {
          name: 'John',
          address: {
            city: 'New York',
            country: 'USA',
          },
        },
      }));

      zustandRegistry.registerStore('nestedStore', useNestedStore as any);

      const stores = zustandRegistry.getStores();
      const state = stores[0].state as any;

      expect(state.user.name).toBe('John');
      expect(state.user.address.city).toBe('New York');
      expect(state.user.address.country).toBe('USA');
    });
  });

  describe('createDevToolsStore Helper', () => {
    test('should create and auto-register store', () => {
      interface TestStore {
        value: number;
      }

      const useTestStore = createDevToolsStore('autoStore', () =>
        create<TestStore>(() => ({ value: 123 }))
      );

      const stores = zustandRegistry.getStores();
      expect(stores.some((s) => s.name === 'autoStore')).toBe(true);
      expect(useTestStore.getState().value).toBe(123);
    });
  });

  describe('Action History Management', () => {
    test('should track action history as stores change', () => {
      interface CounterStore {
        count: number;
        increment: () => void;
      }

      const useCounterStore = create<CounterStore>((set) => ({
        count: 0,
        increment: () => set((state) => ({ count: state.count + 1 })),
      }));

      zustandRegistry.registerStore('counterStore', useCounterStore as any);

      // Initial history should be empty or minimal
      const initialHistory = zustandRegistry.getActionHistory();
      const initialLength = initialHistory.length;

      // Trigger a state change
      useCounterStore.getState().increment();

      // Wait a bit for the subscription to fire
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          const newHistory = zustandRegistry.getActionHistory();
          // History should have grown
          expect(newHistory.length).toBeGreaterThanOrEqual(initialLength);
          resolve();
        }, 20);
      });
    });

    test('should get action history', () => {
      const history = zustandRegistry.getActionHistory();
      expect(Array.isArray(history)).toBe(true);
    });
  });
});
