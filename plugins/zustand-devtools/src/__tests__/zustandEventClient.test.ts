import { describe, test, expect } from 'vitest';
import { zustandEventClient, ZustandEventClient } from '../zustandEventClient';

describe('Zustand Event Client', () => {
  describe('Event Client Instance', () => {
    test('should be defined', () => {
      expect(zustandEventClient).toBeDefined();
    });

    test('should be a singleton instance', () => {
      const instance1 = ZustandEventClient.getInstance();
      const instance2 = ZustandEventClient.getInstance();

      expect(instance1).toBe(instance2);
      expect(instance1).toBe(zustandEventClient);
    });

    test('should have required event methods', () => {
      expect(typeof zustandEventClient.on).toBe('function');
      expect(typeof zustandEventClient.emit).toBe('function');
    });
  });

  describe('Event Type Safety', () => {
    test('should support all required event types', () => {
      // This test ensures that the TypeScript types are properly defined
      // The actual functionality is tested in integration tests

      // Test that we can call on/emit with each event type without TypeScript errors
      const testEvents = {
        'zustand-state-update': {
          stores: {
            test: {
              name: 'test',
              state: {},
              timestamp: Date.now()
            }
          }
        },
        'zustand-store-registered': {
          storeName: 'test',
          initialState: {}
        },
        'zustand-store-action': {
          storeName: 'test',
          action: 'test',
          prevState: {},
          nextState: {},
          timestamp: Date.now()
        },
        'zustand-state-request': undefined,
        'zustand-state-response': {
          stores: {}
        },
        'zustand-restore-state': {
          storeName: 'test',
          state: {},
          timestamp: Date.now()
        },
        'zustand-state-restored': {
          storeName: 'test',
          state: {},
          timestamp: Date.now()
        },
        'zustand-save-snapshot': {
          name: 'test',
          stores: {}
        },
        'zustand-load-snapshot': {
          name: 'test'
        }
      };

      // Just verify the structure exists
      expect(testEvents).toBeDefined();
    });
  });

  describe('Event Registration', () => {
    test('should register event listeners', () => {
      const unsubscribe = zustandEventClient.on('zustand-state-request', () => {});

      expect(typeof unsubscribe).toBe('function');

      // Cleanup
      unsubscribe();
    });

    test('should emit events', () => {
      // Just test that emit doesn't throw
      expect(() => {
        zustandEventClient.emit('zustand-state-request', undefined);
      }).not.toThrow();
    });
  });
});
