import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryStorageAdapter } from './storage';

describe('MemoryStorageAdapter', () => {
  let storage: MemoryStorageAdapter;

  beforeEach(() => {
    storage = new MemoryStorageAdapter();
  });

  it('stores and retrieves a string value', () => {
    storage.setItem('key', 'hello');
    expect(storage.getItem('key')).toBe('hello');
  });

  it('returns null for a missing key', () => {
    expect(storage.getItem('nonexistent')).toBeNull();
  });

  it('returns false for a stored falsy value false, NOT null (the fix)', () => {
    storage.setItem('bool', false);
    const result = storage.getItem<boolean>('bool');
    expect(result).toBe(false);
    expect(result).not.toBeNull();
  });

  it('returns 0 for a stored falsy value 0, NOT null (the fix)', () => {
    storage.setItem('num', 0);
    const result = storage.getItem<number>('num');
    expect(result).toBe(0);
    expect(result).not.toBeNull();
  });

  it('returns empty string for a stored falsy value "", NOT null (the fix)', () => {
    storage.setItem('str', '');
    const result = storage.getItem<string>('str');
    expect(result).toBe('');
    expect(result).not.toBeNull();
  });

  it('removes a value with removeItem', () => {
    storage.setItem('key', 'value');
    expect(storage.getItem('key')).toBe('value');

    storage.removeItem('key');
    expect(storage.getItem('key')).toBeNull();
  });

  it('clears all values', () => {
    storage.setItem('a', 1);
    storage.setItem('b', 2);
    storage.setItem('c', 3);

    storage.clear();

    expect(storage.getItem('a')).toBeNull();
    expect(storage.getItem('b')).toBeNull();
    expect(storage.getItem('c')).toBeNull();
    expect(storage.getAllKeys()).toHaveLength(0);
  });

  it('returns all keys', () => {
    storage.setItem('x', 10);
    storage.setItem('y', 20);

    const keys = storage.getAllKeys();
    expect(keys).toContain('x');
    expect(keys).toContain('y');
    expect(keys).toHaveLength(2);
  });

  it('handles null stored value correctly', () => {
    storage.setItem('nullable', null);
    // null is stored as a value, so has() returns true, but the value is null
    // The adapter should return null because the stored value is null
    expect(storage.getItem('nullable')).toBeNull();
  });

  it('handles undefined stored value correctly', () => {
    storage.setItem('undef', undefined);
    // undefined is stored, has() returns true, but get() returns undefined
    // which is then returned (not null) - this depends on the Map behavior
    const result = storage.getItem('undef');
    // Map.get returns undefined for stored undefined, and has() returns true
    // So the ternary returns undefined (cast as T), not null
    expect(result).toBeUndefined();
  });
});
