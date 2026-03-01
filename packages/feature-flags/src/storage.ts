export interface StorageAdapter {
  getItem<T>(key: string): T | null;
  setItem(key: string, value: any): void;
  removeItem(key: string): void;
  clear(): void;
  getAllKeys(): string[];
}

export class LocalStorageAdapter implements StorageAdapter {
  private prefix: string;

  constructor(prefix: string = 'feature-flags') {
    this.prefix = prefix;
  }

  private getStorageKey(key: string): string {
    return `${this.prefix}:${key}`;
  }

  setItem(key: string, value: any): void {
    try {
      const serialized = JSON.stringify({
        data: value,
        timestamp: Date.now(),
        version: '1.0.0'
      });
      localStorage.setItem(this.getStorageKey(key), serialized);
    } catch (error) {
      console.warn(`Failed to save to localStorage (${key}):`, error);
    }
  }

  getItem<T = any>(key: string): T | null {
    try {
      const item = localStorage.getItem(this.getStorageKey(key));
      if (!item) return null;

      const parsed = JSON.parse(item);
      return parsed.data as T;
    } catch (error) {
      console.warn(`Failed to read from localStorage (${key}):`, error);
      return null;
    }
  }

  removeItem(key: string): void {
    try {
      localStorage.removeItem(this.getStorageKey(key));
    } catch (error) {
      console.warn(`Failed to remove from localStorage (${key}):`, error);
    }
  }

  clear(): void {
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.prefix + ':')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.warn('Failed to clear localStorage:', error);
    }
  }

  getAllKeys(): string[] {
    const keys: string[] = [];
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.prefix + ':')) {
          keys.push(key.replace(this.prefix + ':', ''));
        }
      }
    } catch (error) {
      console.warn('Failed to get localStorage keys:', error);
    }
    return keys;
  }
}

export class MemoryStorageAdapter implements StorageAdapter {
  private storage = new Map<string, any>();

  getItem<T>(key: string): T | null {
    return this.storage.has(key) ? (this.storage.get(key) as T) : null;
  }

  setItem(key: string, value: any): void {
    this.storage.set(key, value);
  }

  removeItem(key: string): void {
    this.storage.delete(key);
  }

  clear(): void {
    this.storage.clear();
  }

  getAllKeys(): string[] {
    return Array.from(this.storage.keys());
  }
}