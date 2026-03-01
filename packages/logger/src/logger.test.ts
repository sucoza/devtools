import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Logger } from './logger';

describe('Logger.cleanData', () => {
  let logger: Logger;

  beforeEach(() => {
    logger = Logger.getInstance();
    logger.updateConfig({ output: { console: false } });
    logger.clearLogs();
    logger.clearMetrics();
  });

  afterEach(() => {
    logger.disableConsoleCapture();
    logger.destroy();
    (Logger as any).instance = null;
  });

  function cleanData(data: any): any {
    return (logger as any).cleanData(data);
  }

  it('handles null', () => {
    expect(cleanData(null)).toBeNull();
  });

  it('handles undefined', () => {
    expect(cleanData(undefined)).toBeUndefined();
  });

  it('handles string primitives', () => {
    expect(cleanData('hello')).toBe('hello');
  });

  it('handles number primitives', () => {
    expect(cleanData(42)).toBe(42);
  });

  it('handles boolean primitives', () => {
    expect(cleanData(true)).toBe(true);
    expect(cleanData(false)).toBe(false);
  });

  it('converts functions to "[Function]"', () => {
    expect(cleanData(() => {})).toBe('[Function]');
    expect(cleanData(function named() {})).toBe('[Function]');
  });

  it('converts symbols to "[Symbol]"', () => {
    expect(cleanData(Symbol('test'))).toBe('[Symbol]');
  });

  it('converts Errors to { name, message, stack }', () => {
    const err = new Error('test error');
    const result = cleanData(err);
    expect(result).toEqual({
      name: 'Error',
      message: 'test error',
      stack: err.stack,
    });
  });

  it('handles circular references with "[Circular]" (the fix)', () => {
    const obj: any = { a: 1 };
    obj.self = obj;

    const result = cleanData(obj);
    expect(result.a).toBe(1);
    expect(result.self).toBe('[Circular]');
  });

  it('handles deeply nested objects beyond depth 10 with "[Max Depth]" (the fix)', () => {
    let obj: any = { value: 'leaf' };
    for (let i = 0; i < 15; i++) {
      obj = { nested: obj };
    }

    const result = cleanData(obj);

    // Walk down 11 levels (depth 0 through 10 are processed normally)
    let current = result;
    for (let i = 0; i < 11; i++) {
      expect(current).toHaveProperty('nested');
      current = current.nested;
    }
    // At depth 11 (which is > 10), the value should be '[Max Depth]'
    expect(current).toBe('[Max Depth]');
  });

  it('handles arrays with circular references', () => {
    const arr: any[] = [1, 2, 3];
    arr.push(arr);

    const result = cleanData(arr);
    expect(result[0]).toBe(1);
    expect(result[1]).toBe(2);
    expect(result[2]).toBe(3);
    expect(result[3]).toBe('[Circular]');
  });

  it('handles normal nested objects correctly', () => {
    const data = {
      user: {
        name: 'Alice',
        settings: {
          theme: 'dark',
          notifications: true,
        },
      },
      items: [1, 2, 3],
    };

    const result = cleanData(data);
    expect(result).toEqual(data);
  });

  it('converts Promises to "[Promise]"', () => {
    const promise = Promise.resolve('value');
    expect(cleanData(promise)).toBe('[Promise]');
  });

  it('handles objects with function values', () => {
    const obj = {
      name: 'test',
      callback: () => {},
    };

    const result = cleanData(obj);
    expect(result.name).toBe('test');
    expect(result.callback).toBe('[Function]');
  });

  it('handles arrays within objects', () => {
    const data = {
      list: [{ id: 1 }, { id: 2 }],
    };

    const result = cleanData(data);
    expect(result.list).toEqual([{ id: 1 }, { id: 2 }]);
  });

  it('handles mutual circular references', () => {
    const a: any = { name: 'a' };
    const b: any = { name: 'b' };
    a.ref = b;
    b.ref = a;

    const result = cleanData(a);
    expect(result.name).toBe('a');
    expect(result.ref.name).toBe('b');
    expect(result.ref.ref).toBe('[Circular]');
  });
});
