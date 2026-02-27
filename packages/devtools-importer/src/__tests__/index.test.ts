import { describe, it, expect } from 'vitest';
import { tanstackDevtoolsImporter } from '../index';

describe('devtools-importer exports', () => {
  it('exports the tanstackDevtoolsImporter function', () => {
    expect(tanstackDevtoolsImporter).toBeTypeOf('function');
  });

  it('throws when plugins array is empty', () => {
    expect(() => tanstackDevtoolsImporter({ plugins: [] })).toThrow(
      '`plugins` must be a non-empty array'
    );
  });

  it('throws when plugins is not an array', () => {
    expect(() => tanstackDevtoolsImporter({ plugins: null as any })).toThrow(
      '`plugins` must be a non-empty array'
    );
  });

  it('returns a Vite plugin object with correct name', () => {
    const plugin = tanstackDevtoolsImporter({
      plugins: ['@test/plugin'],
    });
    expect(plugin).toBeDefined();
    expect(plugin.name).toBe('tanstack-devtools-importer');
    expect(plugin.enforce).toBe('pre');
  });

  it('returns a plugin with resolveId and load hooks', () => {
    const plugin = tanstackDevtoolsImporter({
      plugins: ['@test/plugin'],
    });
    expect(plugin.resolveId).toBeTypeOf('function');
    expect(plugin.load).toBeTypeOf('function');
  });
});
