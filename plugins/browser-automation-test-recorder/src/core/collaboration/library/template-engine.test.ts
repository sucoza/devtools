import { describe, it, expect } from 'vitest';
import { TemplateEngine } from './template-engine';
import type { TemplateEngineConfig } from './template-engine';

/**
 * Tests for the TemplateEngine's parameter substitution logic.
 *
 * The key fix being verified is that parameter names containing RegExp special
 * characters (like . * + ? ^ $ { } ( ) | [ ] \) are properly escaped before
 * being used in a RegExp constructor. Without escaping, these characters would
 * either cause a SyntaxError or produce incorrect replacement behavior.
 */

function createEngine(): TemplateEngine {
  const config: TemplateEngineConfig = {
    storage: { type: 'memory' },
  };
  return new TemplateEngine(config);
}

/**
 * Access the private applyParametersToString method for direct testing.
 * This is a common pattern for unit-testing private methods that implement
 * critical logic (in this case, the RegExp injection fix).
 */
function applyParams(
  engine: TemplateEngine,
  text: string,
  parameters: Record<string, any>
): string {
  return (engine as any).applyParametersToString(text, parameters);
}

describe('TemplateEngine - applyParametersToString', () => {
  let engine: TemplateEngine;

  beforeEach(() => {
    engine = createEngine();
  });

  it('should substitute a simple parameter name', () => {
    const result = applyParams(engine, 'Hello {{name}}!', { name: 'World' });
    expect(result).toBe('Hello World!');
  });

  it('should substitute multiple occurrences of the same parameter', () => {
    const result = applyParams(engine, '{{x}} + {{x}} = 2{{x}}', { x: '5' });
    expect(result).toBe('5 + 5 = 25');
  });

  it('should substitute multiple different parameters', () => {
    const result = applyParams(engine, '{{first}} {{last}}', {
      first: 'Jane',
      last: 'Doe',
    });
    expect(result).toBe('Jane Doe');
  });

  it('should leave unmatched placeholders unchanged', () => {
    const result = applyParams(engine, '{{known}} and {{unknown}}', {
      known: 'replaced',
    });
    expect(result).toBe('replaced and {{unknown}}');
  });

  it('should return original text when parameters is empty', () => {
    const result = applyParams(engine, 'no {{changes}} here', {});
    expect(result).toBe('no {{changes}} here');
  });

  describe('RegExp special character escaping (fix verification)', () => {
    it('should handle parameter name containing a dot (.)', () => {
      const result = applyParams(engine, 'value is {{config.key}}', {
        'config.key': '42',
      });
      expect(result).toBe('value is 42');
    });

    it('should handle parameter name containing an asterisk (*)', () => {
      const result = applyParams(engine, 'value is {{star*name}}', {
        'star*name': 'matched',
      });
      expect(result).toBe('value is matched');
    });

    it('should handle parameter name containing a plus (+)', () => {
      const result = applyParams(engine, 'value is {{a+b}}', {
        'a+b': 'sum',
      });
      expect(result).toBe('value is sum');
    });

    it('should handle parameter name containing a question mark (?)', () => {
      const result = applyParams(engine, 'value is {{is?optional}}', {
        'is?optional': 'yes',
      });
      expect(result).toBe('value is yes');
    });

    it('should handle parameter name containing parentheses', () => {
      const result = applyParams(engine, 'call {{fn(x)}}', {
        'fn(x)': 'result',
      });
      expect(result).toBe('call result');
    });

    it('should handle parameter name containing square brackets', () => {
      const result = applyParams(engine, 'value is {{arr[0]}}', {
        'arr[0]': 'first',
      });
      expect(result).toBe('value is first');
    });

    it('should handle parameter name containing curly braces', () => {
      // Note: the placeholder syntax uses {{ and }}, so only inner braces matter
      const result = applyParams(engine, 'value is {{obj{key}}}', {
        'obj{key}': 'found',
      });
      expect(result).toBe('value is found');
    });

    it('should handle parameter name containing a pipe (|)', () => {
      const result = applyParams(engine, 'value is {{a|b}}', {
        'a|b': 'either',
      });
      expect(result).toBe('value is either');
    });

    it('should handle parameter name containing a caret (^)', () => {
      const result = applyParams(engine, 'value is {{^start}}', {
        '^start': 'beginning',
      });
      expect(result).toBe('value is beginning');
    });

    it('should handle parameter name containing a dollar sign ($)', () => {
      const result = applyParams(engine, 'price is {{$amount}}', {
        '$amount': '9.99',
      });
      expect(result).toBe('price is 9.99');
    });

    it('should handle parameter name containing a backslash (\\)', () => {
      const result = applyParams(engine, 'path is {{dir\\file}}', {
        'dir\\file': 'C:\\data',
      });
      expect(result).toBe('path is C:\\data');
    });

    it('should handle parameter name with multiple special characters combined', () => {
      const result = applyParams(engine, 'test {{a.b[0]+(c)}}', {
        'a.b[0]+(c)': 'complex',
      });
      expect(result).toBe('test complex');
    });

    it('should not produce false matches without escaping', () => {
      // Without escaping, a parameter name like "a.b" would match "a" + any char + "b"
      // With proper escaping, it should ONLY match the literal "a.b"
      const text = '{{a.b}} and {{axb}}';
      const result = applyParams(engine, text, { 'a.b': 'dot' });
      expect(result).toBe('dot and {{axb}}');
    });
  });

  describe('applyParametersToData', () => {
    it('should recursively apply parameters to string values in objects', () => {
      const data = {
        greeting: 'Hello {{name}}',
        nested: {
          message: '{{name}} is here',
        },
      };

      const result = (engine as any).applyParametersToData(data, {
        name: 'Alice',
      });

      expect(result).toEqual({
        greeting: 'Hello Alice',
        nested: {
          message: 'Alice is here',
        },
      });
    });

    it('should recursively apply parameters to arrays', () => {
      const data = ['{{a}}', '{{b}}', 'literal'];
      const result = (engine as any).applyParametersToData(data, {
        a: '1',
        b: '2',
      });

      expect(result).toEqual(['1', '2', 'literal']);
    });

    it('should return non-string non-object primitives unchanged', () => {
      expect((engine as any).applyParametersToData(42, { x: 'y' })).toBe(42);
      expect((engine as any).applyParametersToData(true, { x: 'y' })).toBe(true);
      expect((engine as any).applyParametersToData(null, { x: 'y' })).toBeNull();
    });
  });
});
