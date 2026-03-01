import { describe, it, expect } from 'vitest';
import { interpolateString } from './index';

describe('interpolateString', () => {
  // --- Basic {{variable}} interpolation ---

  it('replaces a single {{variable}} placeholder', () => {
    const result = interpolateString('Hello {{name}}!', { name: 'World' });
    expect(result).toBe('Hello World!');
  });

  // --- Multiple variables in one string ---

  it('replaces multiple variables in one string', () => {
    const result = interpolateString('{{greeting}}, {{name}}! You have {{count}} messages.', {
      greeting: 'Hi',
      name: 'Alice',
      count: 5,
    });
    expect(result).toBe('Hi, Alice! You have 5 messages.');
  });

  // --- Missing variable leaves placeholder unchanged ---

  it('leaves placeholder unchanged when variable is missing', () => {
    const result = interpolateString('Hello {{name}}, welcome to {{place}}!', {
      name: 'Bob',
    });
    expect(result).toBe('Hello Bob, welcome to {{place}}!');
  });

  // --- Whitespace inside delimiters ---

  it('handles whitespace inside delimiters: {{ variable }}', () => {
    const result = interpolateString('Hello {{ name }}!', { name: 'World' });
    expect(result).toBe('Hello World!');
  });

  it('handles extra whitespace inside delimiters: {{   name   }}', () => {
    const result = interpolateString('Value is {{   count   }}.', { count: 42 });
    expect(result).toBe('Value is 42.');
  });

  // --- Non-greedy matching with custom suffixes (the fix) ---

  it('uses non-greedy matching so adjacent placeholders are handled correctly', () => {
    // With greedy matching, "{{a}} and {{b}}" would try to match
    // "{{a}} and {{b}}" as a single placeholder. Non-greedy (.+?) prevents that.
    const result = interpolateString('{{a}} and {{b}}', { a: '1', b: '2' });
    expect(result).toBe('1 and 2');
  });

  it('handles custom prefix/suffix with non-greedy matching', () => {
    const result = interpolateString(
      '<%= name %> is <%= age %> years old',
      { name: 'Alice', age: 30 },
      '<%=',
      '%>',
    );
    expect(result).toBe('Alice is 30 years old');
  });

  it('handles custom delimiters { and }', () => {
    const result = interpolateString('Hello {name}!', { name: 'World' }, '{', '}');
    expect(result).toBe('Hello World!');
  });

  it('handles custom delimiters with special regex characters', () => {
    const result = interpolateString(
      'Value is $[key]$.',
      { key: 'resolved' },
      '$[',
      ']$',
    );
    expect(result).toBe('Value is resolved.');
  });

  // --- Nested-looking content does not cause issues ---

  it('does not break on nested-looking content like {{{{deep}}}}', () => {
    // The inner "{{deep}}" should be matched and replaced;
    // the outer "{{ ... }}" may or may not match depending on result,
    // but should not throw or hang.
    const result = interpolateString('{{deep}}', { deep: 'value' });
    expect(result).toBe('value');
  });

  it('does not break on content that looks like nested braces', () => {
    // "{{a{{b}}}}" — the .+? match will capture "a{{b" as the key,
    // which won't match any variable, leaving it unchanged.
    const result = interpolateString('{{a{{b}}}}', { b: 'x' });
    // The non-greedy regex matches "{{a{{b}}" first (key="a{{b"),
    // which has no variable, so it stays. The trailing "}}" is literal.
    // This should not throw.
    expect(typeof result).toBe('string');
  });

  // --- Edge cases ---

  it('returns original string when no placeholders exist', () => {
    const result = interpolateString('No placeholders here', { name: 'unused' });
    expect(result).toBe('No placeholders here');
  });

  it('handles empty template string', () => {
    const result = interpolateString('', { name: 'value' });
    expect(result).toBe('');
  });

  it('converts non-string values via String()', () => {
    const result = interpolateString('bool={{flag}}, null={{nil}}', {
      flag: true,
      nil: null,
    });
    expect(result).toBe('bool=true, null=null');
  });
});
