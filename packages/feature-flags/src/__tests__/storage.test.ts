import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { LocalStorageAdapter, MemoryStorageAdapter } from '../storage';

describe('MemoryStorageAdapter', () => {
  let storage: MemoryStorageAdapter;

  beforeEach(() => {
    storage = new MemoryStorageAdapter();
  });

  it('should store and retrieve items', () => {
    storage.setItem('test-key', { foo: 'bar' });
    const result = storage.getItem('test-key');

    expect(result).toEqual({ foo: 'bar' });
  });

  it('should return null for non-existent items', () => {
    const result = storage.getItem('non-existent');
    expect(result).toBeNull();
  });

  it('should remove items', () => {
    storage.setItem('test-key', 'value');
    expect(storage.getItem('test-key')).toBe('value');

    storage.removeItem('test-key');
    expect(storage.getItem('test-key')).toBeNull();
  });

  it('should clear all items', () => {
    storage.setItem('key1', 'value1');
    storage.setItem('key2', 'value2');

    storage.clear();

    expect(storage.getItem('key1')).toBeNull();
    expect(storage.getItem('key2')).toBeNull();
  });

  it('should get all keys', () => {
    storage.setItem('key1', 'value1');
    storage.setItem('key2', 'value2');

    const keys = storage.getAllKeys();

    expect(keys).toContain('key1');
    expect(keys).toContain('key2');
    expect(keys.length).toBe(2);
  });

  it('should handle complex objects', () => {
    const complexObject = {
      flags: [
        { id: 'flag1', enabled: true },
        { id: 'flag2', enabled: false }
      ],
      metadata: {
        version: '1.0.0',
        timestamp: Date.now()
      }
    };

    storage.setItem('complex', complexObject);
    const result = storage.getItem('complex');

    expect(result).toEqual(complexObject);
  });
});

describe('LocalStorageAdapter', () => {
  let storage: LocalStorageAdapter;
  let mockLocalStorage: { [key: string]: string };

  beforeEach(() => {
    mockLocalStorage = {};

    // Mock localStorage
    global.localStorage = {
      getItem: vi.fn((key: string) => mockLocalStorage[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        mockLocalStorage[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete mockLocalStorage[key];
      }),
      clear: vi.fn(() => {
        mockLocalStorage = {};
      }),
      get length() {
        return Object.keys(mockLocalStorage).length;
      },
      key: vi.fn((index: number) => {
        const keys = Object.keys(mockLocalStorage);
        return keys[index] || null;
      })
    } as any;

    storage = new LocalStorageAdapter('test-prefix');
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should store items with prefix', () => {
    storage.setItem('test-key', { foo: 'bar' });

    expect(localStorage.setItem).toHaveBeenCalled();
    const callArgs = (localStorage.setItem as any).mock.calls[0];
    expect(callArgs[0]).toBe('test-prefix:test-key');

    const stored = JSON.parse(callArgs[1]);
    expect(stored.data).toEqual({ foo: 'bar' });
    expect(stored.version).toBe('1.0.0');
    expect(stored.timestamp).toBeTypeOf('number');
  });

  it('should retrieve items with prefix', () => {
    mockLocalStorage['test-prefix:test-key'] = JSON.stringify({
      data: { foo: 'bar' },
      timestamp: Date.now(),
      version: '1.0.0'
    });

    const result = storage.getItem('test-key');

    expect(localStorage.getItem).toHaveBeenCalledWith('test-prefix:test-key');
    expect(result).toEqual({ foo: 'bar' });
  });

  it('should return null for non-existent items', () => {
    const result = storage.getItem('non-existent');
    expect(result).toBeNull();
  });

  it('should handle JSON parse errors gracefully', () => {
    mockLocalStorage['test-prefix:bad-json'] = 'invalid json {';

    const result = storage.getItem('bad-json');
    expect(result).toBeNull();
  });

  it('should remove items with prefix', () => {
    storage.removeItem('test-key');

    expect(localStorage.removeItem).toHaveBeenCalledWith('test-prefix:test-key');
  });

  it('should clear only prefixed items', () => {
    mockLocalStorage['test-prefix:key1'] = 'value1';
    mockLocalStorage['test-prefix:key2'] = 'value2';
    mockLocalStorage['other-prefix:key3'] = 'value3';

    storage.clear();

    expect(mockLocalStorage['test-prefix:key1']).toBeUndefined();
    expect(mockLocalStorage['test-prefix:key2']).toBeUndefined();
    expect(mockLocalStorage['other-prefix:key3']).toBe('value3');
  });

  it('should get all keys with prefix', () => {
    mockLocalStorage['test-prefix:key1'] = 'value1';
    mockLocalStorage['test-prefix:key2'] = 'value2';
    mockLocalStorage['other-prefix:key3'] = 'value3';

    const keys = storage.getAllKeys();

    expect(keys).toContain('key1');
    expect(keys).toContain('key2');
    expect(keys).not.toContain('key3');
    expect(keys.length).toBe(2);
  });

  it('should use default prefix if none provided', () => {
    const defaultStorage = new LocalStorageAdapter();
    defaultStorage.setItem('test', 'value');

    expect(localStorage.setItem).toHaveBeenCalled();
    const callArgs = (localStorage.setItem as any).mock.calls[0];
    expect(callArgs[0]).toBe('feature-flags:test');

    const stored = JSON.parse(callArgs[1]);
    expect(stored.data).toBe('value');
    expect(stored.version).toBe('1.0.0');
  });
});
