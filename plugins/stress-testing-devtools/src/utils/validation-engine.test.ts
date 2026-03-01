import { describe, it, expect } from 'vitest';
import { ValidationEngine, ValidationRule } from './validation-engine';

/**
 * Tests for ValidationEngine — focusing on operator correctness,
 * especially the `contains` and `notContains` fixes for primitive values.
 */

/** Helper to create a minimal enabled rule with the given overrides. */
function makeRule(overrides: Partial<ValidationRule>): ValidationRule {
  return {
    id: 'rule-1',
    name: 'Test Rule',
    type: 'body',
    operator: 'equals',
    enabled: true,
    ...overrides,
  };
}

describe('ValidationEngine', () => {
  // Common test parameters
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  const responseTime = 100;
  const responseSize = 512;
  const status = 200;

  // ---------------------------------------------------------------
  // contains operator
  // ---------------------------------------------------------------
  describe('contains operator', () => {
    it('works for string values', () => {
      const rule = makeRule({
        type: 'body',
        operator: 'contains',
        expectedValue: 'hello',
      });

      const result = ValidationEngine.validateResponse(
        'say hello world',
        status,
        headers,
        responseTime,
        responseSize,
        [rule],
      );

      expect(result.passed).toBe(true);
      expect(result.results[0].passed).toBe(true);
    });

    it('works for array values', () => {
      const rule = makeRule({
        type: 'body',
        operator: 'contains',
        expectedValue: 'b',
      });

      const result = ValidationEngine.validateResponse(
        ['a', 'b', 'c'],
        status,
        headers,
        responseTime,
        responseSize,
        [rule],
      );

      expect(result.results[0].passed).toBe(true);
    });

    it('works for object values (JSON.stringify check)', () => {
      const rule = makeRule({
        type: 'body',
        operator: 'contains',
        expectedValue: 'foo',
      });

      const result = ValidationEngine.validateResponse(
        { key: 'foo-value' },
        status,
        headers,
        responseTime,
        responseSize,
        [rule],
      );

      expect(result.results[0].passed).toBe(true);
    });

    it('works for primitive values like numbers (the fix)', () => {
      // Before the fix, numbers would have hit a dead branch and `passed`
      // would have stayed false. The fix falls through to
      // `String(actualValue).includes(String(expectedValue))`.
      const rule = makeRule({
        type: 'status',
        operator: 'contains',
        expectedValue: '20',
      });

      const result = ValidationEngine.validateResponse(
        null,
        200,
        headers,
        responseTime,
        responseSize,
        [rule],
      );

      expect(result.results[0].passed).toBe(true);
      expect(result.results[0].actualValue).toBe(200);
    });

    it('returns false when the primitive does not contain the expected substring', () => {
      const rule = makeRule({
        type: 'status',
        operator: 'contains',
        expectedValue: '99',
      });

      const result = ValidationEngine.validateResponse(
        null,
        200,
        headers,
        responseTime,
        responseSize,
        [rule],
      );

      expect(result.results[0].passed).toBe(false);
    });
  });

  // ---------------------------------------------------------------
  // notContains operator
  // ---------------------------------------------------------------
  describe('notContains operator', () => {
    it('works for string values', () => {
      const rule = makeRule({
        type: 'body',
        operator: 'notContains',
        expectedValue: 'missing',
      });

      const result = ValidationEngine.validateResponse(
        'hello world',
        status,
        headers,
        responseTime,
        responseSize,
        [rule],
      );

      expect(result.results[0].passed).toBe(true);
    });

    it('returns false for string values that DO contain expected', () => {
      const rule = makeRule({
        type: 'body',
        operator: 'notContains',
        expectedValue: 'hello',
      });

      const result = ValidationEngine.validateResponse(
        'hello world',
        status,
        headers,
        responseTime,
        responseSize,
        [rule],
      );

      expect(result.results[0].passed).toBe(false);
    });

    it('works for primitive values — returns true when value does not contain expected (the fix)', () => {
      // Before the fix, notContains for primitives always returned false
      // because the else branch was missing. Now it falls through to
      // `!String(actualValue).includes(String(expectedValue))`.
      const rule = makeRule({
        type: 'status',
        operator: 'notContains',
        expectedValue: '99',
      });

      const result = ValidationEngine.validateResponse(
        null,
        42,
        headers,
        responseTime,
        responseSize,
        [rule],
      );

      expect(result.results[0].passed).toBe(true);
    });

    it('notContains with number 42 and expected "99" should pass', () => {
      const rule = makeRule({
        type: 'status',
        operator: 'notContains',
        expectedValue: '99',
      });

      const result = ValidationEngine.validateResponse(
        null,
        42,
        headers,
        responseTime,
        responseSize,
        [rule],
      );

      expect(result.results[0].passed).toBe(true);
    });

    it('notContains with number 404 and expected "404" should fail', () => {
      const rule = makeRule({
        type: 'status',
        operator: 'notContains',
        expectedValue: '404',
      });

      const result = ValidationEngine.validateResponse(
        null,
        404,
        headers,
        responseTime,
        responseSize,
        [rule],
      );

      expect(result.results[0].passed).toBe(false);
    });

    it('works for array values', () => {
      const rule = makeRule({
        type: 'body',
        operator: 'notContains',
        expectedValue: 'z',
      });

      const result = ValidationEngine.validateResponse(
        ['a', 'b', 'c'],
        status,
        headers,
        responseTime,
        responseSize,
        [rule],
      );

      expect(result.results[0].passed).toBe(true);
    });

    it('works for object values', () => {
      const rule = makeRule({
        type: 'body',
        operator: 'notContains',
        expectedValue: 'missing-key',
      });

      const result = ValidationEngine.validateResponse(
        { key: 'value' },
        status,
        headers,
        responseTime,
        responseSize,
        [rule],
      );

      expect(result.results[0].passed).toBe(true);
    });
  });

  // ---------------------------------------------------------------
  // Other operators
  // ---------------------------------------------------------------
  describe('equals operator', () => {
    it('passes when values match (string coercion)', () => {
      const rule = makeRule({
        type: 'status',
        operator: 'equals',
        expectedValue: 200,
      });

      const result = ValidationEngine.validateResponse(
        null,
        200,
        headers,
        responseTime,
        responseSize,
        [rule],
      );

      expect(result.results[0].passed).toBe(true);
    });

    it('fails when values differ', () => {
      const rule = makeRule({
        type: 'status',
        operator: 'equals',
        expectedValue: 404,
      });

      const result = ValidationEngine.validateResponse(
        null,
        200,
        headers,
        responseTime,
        responseSize,
        [rule],
      );

      expect(result.results[0].passed).toBe(false);
    });
  });

  describe('notEquals operator', () => {
    it('passes when values differ', () => {
      const rule = makeRule({
        type: 'status',
        operator: 'notEquals',
        expectedValue: 404,
      });

      const result = ValidationEngine.validateResponse(
        null,
        200,
        headers,
        responseTime,
        responseSize,
        [rule],
      );

      expect(result.results[0].passed).toBe(true);
    });

    it('fails when values match', () => {
      const rule = makeRule({
        type: 'status',
        operator: 'notEquals',
        expectedValue: 200,
      });

      const result = ValidationEngine.validateResponse(
        null,
        200,
        headers,
        responseTime,
        responseSize,
        [rule],
      );

      expect(result.results[0].passed).toBe(false);
    });
  });

  describe('greaterThan operator', () => {
    it('passes when actual > expected', () => {
      const rule = makeRule({
        type: 'responseTime',
        operator: 'greaterThan',
        expectedValue: 50,
      });

      const result = ValidationEngine.validateResponse(
        null,
        status,
        headers,
        100,
        responseSize,
        [rule],
      );

      expect(result.results[0].passed).toBe(true);
    });

    it('fails when actual <= expected', () => {
      const rule = makeRule({
        type: 'responseTime',
        operator: 'greaterThan',
        expectedValue: 100,
      });

      const result = ValidationEngine.validateResponse(
        null,
        status,
        headers,
        100,
        responseSize,
        [rule],
      );

      expect(result.results[0].passed).toBe(false);
    });
  });

  describe('lessThan operator', () => {
    it('passes when actual < expected', () => {
      const rule = makeRule({
        type: 'responseTime',
        operator: 'lessThan',
        expectedValue: 200,
      });

      const result = ValidationEngine.validateResponse(
        null,
        status,
        headers,
        100,
        responseSize,
        [rule],
      );

      expect(result.results[0].passed).toBe(true);
    });

    it('fails when actual >= expected', () => {
      const rule = makeRule({
        type: 'responseTime',
        operator: 'lessThan',
        expectedValue: 50,
      });

      const result = ValidationEngine.validateResponse(
        null,
        status,
        headers,
        100,
        responseSize,
        [rule],
      );

      expect(result.results[0].passed).toBe(false);
    });
  });

  // ---------------------------------------------------------------
  // Disabled rules and overall result
  // ---------------------------------------------------------------
  describe('overall validation', () => {
    it('skips disabled rules', () => {
      const disabledRule = makeRule({
        operator: 'equals',
        expectedValue: 999,
        enabled: false,
      });

      const result = ValidationEngine.validateResponse(
        null,
        200,
        headers,
        responseTime,
        responseSize,
        [disabledRule],
      );

      // No results because the rule is disabled
      expect(result.results).toHaveLength(0);
      // Vacuously true — every() on empty array returns true
      expect(result.passed).toBe(true);
    });

    it('reports overall failure when any rule fails', () => {
      const passingRule = makeRule({
        id: 'pass',
        type: 'status',
        operator: 'equals',
        expectedValue: 200,
      });

      const failingRule = makeRule({
        id: 'fail',
        type: 'status',
        operator: 'equals',
        expectedValue: 404,
      });

      const result = ValidationEngine.validateResponse(
        null,
        200,
        headers,
        responseTime,
        responseSize,
        [passingRule, failingRule],
      );

      expect(result.passed).toBe(false);
      expect(result.results).toHaveLength(2);
    });

    it('includes executionTime in result', () => {
      const rule = makeRule({
        type: 'status',
        operator: 'equals',
        expectedValue: 200,
      });

      const result = ValidationEngine.validateResponse(
        null,
        200,
        headers,
        responseTime,
        responseSize,
        [rule],
      );

      expect(typeof result.executionTime).toBe('number');
      expect(result.executionTime).toBeGreaterThanOrEqual(0);
    });
  });
});
