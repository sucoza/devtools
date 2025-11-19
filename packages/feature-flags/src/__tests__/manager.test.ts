import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { FeatureFlagManager } from '../manager';
import { MemoryStorageAdapter } from '../storage';
import type { FeatureFlag, FlagOverride, UserSegment } from '../types';

describe('FeatureFlagManager', () => {
  let manager: FeatureFlagManager;
  let storage: MemoryStorageAdapter;

  beforeEach(() => {
    storage = new MemoryStorageAdapter();
    manager = new FeatureFlagManager({
      storage,
      persistOverrides: true,
      defaultContext: {
        userId: 'test-user',
        environment: 'test'
      }
    });
  });

  afterEach(() => {
    manager.destroy();
  });

  describe('Flag Management', () => {
    it('should add a flag', () => {
      const flag: FeatureFlag = {
        id: 'test-flag',
        name: 'Test Flag',
        description: 'Test',
        type: 'boolean',
        value: true,
        enabled: true,
        environment: 'test',
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      manager.addFlag(flag);
      const retrieved = manager.getFlag('test-flag');

      expect(retrieved).toEqual(flag);
    });

    it('should update a flag', () => {
      const flag: FeatureFlag = {
        id: 'test-flag',
        name: 'Test Flag',
        description: 'Test',
        type: 'boolean',
        value: true,
        enabled: true,
        environment: 'test',
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      manager.addFlag(flag);

      const updated = { ...flag, value: false };
      manager.updateFlag(updated);

      const retrieved = manager.getFlag('test-flag');
      expect(retrieved?.value).toBe(false);
    });

    it('should remove a flag', () => {
      const flag: FeatureFlag = {
        id: 'test-flag',
        name: 'Test Flag',
        description: 'Test',
        type: 'boolean',
        value: true,
        enabled: true,
        environment: 'test',
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      manager.addFlag(flag);
      expect(manager.getFlag('test-flag')).toBeTruthy();

      manager.removeFlag('test-flag');
      expect(manager.getFlag('test-flag')).toBeNull();
    });

    it('should set multiple flags at once', () => {
      const flags: FeatureFlag[] = [
        {
          id: 'flag1',
          name: 'Flag 1',
          description: 'First flag',
          type: 'boolean',
          value: true,
          enabled: true,
          environment: 'test',
          tags: [],
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'flag2',
          name: 'Flag 2',
          description: 'Second flag',
          type: 'boolean',
          value: false,
          enabled: true,
          environment: 'test',
          tags: [],
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      manager.setFlags(flags);
      const allFlags = manager.getAllFlags();

      expect(allFlags.length).toBe(2);
      expect(allFlags.find(f => f.id === 'flag1')).toBeTruthy();
      expect(allFlags.find(f => f.id === 'flag2')).toBeTruthy();
    });

    it('should get all flags', () => {
      manager.setFlags([
        {
          id: 'flag1',
          name: 'Flag 1',
          description: 'Test',
          type: 'boolean',
          value: true,
          enabled: true,
          environment: 'test',
          tags: [],
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'flag2',
          name: 'Flag 2',
          description: 'Test',
          type: 'boolean',
          value: false,
          enabled: true,
          environment: 'test',
          tags: [],
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]);

      const flags = manager.getAllFlags();
      expect(flags.length).toBe(2);
    });
  });

  describe('Override Management', () => {
    beforeEach(() => {
      manager.addFlag({
        id: 'test-flag',
        name: 'Test Flag',
        description: 'Test',
        type: 'boolean',
        value: true,
        enabled: true,
        environment: 'test',
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date()
      });
    });

    it('should set an override', () => {
      const override: FlagOverride = {
        flagId: 'test-flag',
        value: false,
        reason: 'Testing',
        userId: 'test-user'
      };

      manager.setOverride(override);
      const retrieved = manager.getOverride('test-flag');

      expect(retrieved).toEqual(override);
    });

    it('should remove an override', () => {
      const override: FlagOverride = {
        flagId: 'test-flag',
        value: false,
        reason: 'Testing',
        userId: 'test-user'
      };

      manager.setOverride(override);
      expect(manager.getOverride('test-flag')).toBeTruthy();

      manager.removeOverride('test-flag');
      expect(manager.getOverride('test-flag')).toBeNull();
    });

    it('should clear all overrides', () => {
      manager.setOverride({
        flagId: 'test-flag',
        value: false,
        reason: 'Testing',
        userId: 'test-user'
      });

      manager.clearAllOverrides();
      expect(manager.getAllOverrides().length).toBe(0);
    });

    it('should persist overrides to storage', () => {
      const override: FlagOverride = {
        flagId: 'test-flag',
        value: false,
        reason: 'Testing',
        userId: 'test-user'
      };

      manager.setOverride(override);

      const stored = storage.getItem<FlagOverride[]>('overrides');
      expect(stored).toBeTruthy();
      expect(stored?.[0].flagId).toBe('test-flag');
    });
  });

  describe('Context Management', () => {
    it('should set and get context', () => {
      manager.setContext({
        userId: 'new-user',
        sessionId: 'session-123',
        attributes: { plan: 'premium' }
      });

      const context = manager.getContext();
      expect(context.userId).toBe('new-user');
      expect(context.sessionId).toBe('session-123');
      expect(context.attributes?.plan).toBe('premium');
    });

    it('should merge context updates', () => {
      manager.setContext({ userId: 'user-1' });
      manager.setContext({ sessionId: 'session-1' });

      const context = manager.getContext();
      expect(context.userId).toBe('user-1');
      expect(context.sessionId).toBe('session-1');
    });
  });

  describe('Flag Evaluation', () => {
    it('should evaluate a simple flag', async () => {
      manager.addFlag({
        id: 'simple-flag',
        name: 'Simple Flag',
        description: 'Simple test',
        type: 'boolean',
        value: true,
        enabled: true,
        environment: 'test',
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const result = await manager.evaluate('simple-flag');
      expect(result.value).toBe(true);
      expect(result.reason).toBe('default');
    });

    it('should evaluate with override', async () => {
      manager.addFlag({
        id: 'test-flag',
        name: 'Test Flag',
        description: 'Test',
        type: 'boolean',
        value: true,
        enabled: true,
        environment: 'test',
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date()
      });

      manager.setOverride({
        flagId: 'test-flag',
        value: false,
        reason: 'Testing override',
        userId: 'test-user'
      });

      const result = await manager.evaluate('test-flag');
      expect(result.value).toBe(false);
      expect(result.reason).toBe('override');
    });

    it('should evaluate all flags', async () => {
      manager.setFlags([
        {
          id: 'flag1',
          name: 'Flag 1',
          description: 'Test',
          type: 'boolean',
          value: true,
          enabled: true,
          environment: 'test',
          tags: [],
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'flag2',
          name: 'Flag 2',
          description: 'Test',
          type: 'boolean',
          value: false,
          enabled: true,
          environment: 'test',
          tags: [],
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]);

      const results = await manager.evaluateAll();

      expect(results.size).toBe(2);
      expect(results.get('flag1')?.value).toBe(true);
      expect(results.get('flag2')?.value).toBe(false);
    });
  });

  describe('User Segments', () => {
    it('should set and get user segments', () => {
      const segments: UserSegment[] = [
        {
          id: 'premium',
          name: 'Premium Users',
          rules: [
            {
              attribute: 'plan',
              operator: 'equals',
              values: ['premium']
            }
          ]
        }
      ];

      manager.setUserSegments(segments);
      const retrieved = manager.getUserSegments();

      expect(retrieved.length).toBe(1);
      expect(retrieved[0].id).toBe('premium');
    });
  });

  describe('Event Handling', () => {
    it('should emit flag-added event', () => {
      const listener = vi.fn();
      manager.on('flag-added', listener);

      const flag: FeatureFlag = {
        id: 'new-flag',
        name: 'New Flag',
        description: 'Test',
        type: 'boolean',
        value: true,
        enabled: true,
        environment: 'test',
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      manager.addFlag(flag);

      expect(listener).toHaveBeenCalledWith(flag);
    });

    it('should emit override-set event', () => {
      const listener = vi.fn();
      manager.on('override-set', listener);

      manager.addFlag({
        id: 'test-flag',
        name: 'Test',
        description: 'Test',
        type: 'boolean',
        value: true,
        enabled: true,
        environment: 'test',
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const override: FlagOverride = {
        flagId: 'test-flag',
        value: false,
        reason: 'Test',
        userId: 'user'
      };

      manager.setOverride(override);

      expect(listener).toHaveBeenCalledWith(override);
    });

    it('should remove event listeners', () => {
      const listener = vi.fn();
      manager.on('flag-added', listener);
      manager.off('flag-added', listener);

      manager.addFlag({
        id: 'test-flag',
        name: 'Test',
        description: 'Test',
        type: 'boolean',
        value: true,
        enabled: true,
        environment: 'test',
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date()
      });

      expect(listener).not.toHaveBeenCalled();
    });

    it('should emit context-updated event', () => {
      const listener = vi.fn();
      manager.on('context-updated', listener);

      manager.setContext({ userId: 'new-user' });

      expect(listener).toHaveBeenCalled();
    });
  });

  describe('Persistence', () => {
    it('should load persisted overrides on initialization', () => {
      const override: FlagOverride = {
        flagId: 'test-flag',
        value: false,
        reason: 'Persisted',
        userId: 'user'
      };

      storage.setItem('overrides', [override]);

      const newManager = new FeatureFlagManager({
        storage,
        persistOverrides: true
      });

      const retrieved = newManager.getOverride('test-flag');
      expect(retrieved).toBeTruthy();
      expect(retrieved?.value).toBe(false);

      newManager.destroy();
    });

    it('should not load expired overrides', () => {
      const expiredOverride: FlagOverride = {
        flagId: 'test-flag',
        value: false,
        reason: 'Expired',
        userId: 'user',
        expiresAt: new Date(Date.now() - 1000) // Expired 1 second ago
      };

      storage.setItem('overrides', [expiredOverride]);

      const newManager = new FeatureFlagManager({
        storage,
        persistOverrides: true
      });

      const retrieved = newManager.getOverride('test-flag');
      expect(retrieved).toBeNull();

      newManager.destroy();
    });
  });
});
