import { describe, it, expect, beforeEach } from 'vitest';
import { FlagEvaluator } from './evaluator';
import type { FeatureFlag, EvaluationContext } from './types';

describe('FlagEvaluator – circular dependency protection', () => {
  let flags: Map<string, FeatureFlag>;
  let evaluator: FlagEvaluator;
  let context: EvaluationContext;

  beforeEach(() => {
    flags = new Map();
    evaluator = new FlagEvaluator({
      getFlag: (id) => flags.get(id) || null,
    });
    context = {
      userId: 'user-1',
      sessionId: 'session-1',
      environment: 'test',
      attributes: {},
    };
  });

  // --- Normal evaluation (no dependencies) ---

  it('evaluates a simple enabled boolean flag', async () => {
    flags.set('simple', {
      id: 'simple',
      name: 'Simple',
      type: 'boolean',
      value: true,
      enabled: true,
    });

    const result = await evaluator.evaluate('simple', context);
    expect(result.value).toBe(true);
    expect(result.reason).toBe('default');
  });

  // --- Satisfied dependencies ---

  it('evaluates a flag whose dependency is satisfied', async () => {
    flags.set('parent', {
      id: 'parent',
      name: 'Parent',
      type: 'boolean',
      value: true,
      enabled: true,
    });
    flags.set('child', {
      id: 'child',
      name: 'Child',
      type: 'boolean',
      value: true,
      enabled: true,
      dependencies: [{ flagId: 'parent', condition: 'enabled' }],
    });

    const result = await evaluator.evaluate('child', context);
    expect(result.value).toBe(true);
    expect(result.reason).toBe('default');
  });

  // --- Unsatisfied dependencies ---

  it('returns default value when dependency is unsatisfied', async () => {
    flags.set('parent', {
      id: 'parent',
      name: 'Parent',
      type: 'boolean',
      value: false,
      enabled: false,
    });
    flags.set('child', {
      id: 'child',
      name: 'Child',
      type: 'boolean',
      value: true,
      enabled: true,
      dependencies: [{ flagId: 'parent', condition: 'enabled' }],
    });

    const result = await evaluator.evaluate('child', context);
    expect(result.reason).toBe('dependency');
    expect(result.value).toBe(false); // boolean default
    expect(result.metadata?.failedDependency).toBe('parent');
  });

  // --- Circular dependency A → B → A (the fix) ---

  it('handles circular dependency A→B→A without stack overflow', async () => {
    flags.set('flag-a', {
      id: 'flag-a',
      name: 'Flag A',
      type: 'boolean',
      value: true,
      enabled: true,
      dependencies: [{ flagId: 'flag-b', condition: 'enabled' }],
    });
    flags.set('flag-b', {
      id: 'flag-b',
      name: 'Flag B',
      type: 'boolean',
      value: true,
      enabled: true,
      dependencies: [{ flagId: 'flag-a', condition: 'enabled' }],
    });

    // Should NOT throw (previously would cause infinite recursion)
    const result = await evaluator.evaluate('flag-a', context);

    // The circular reference from flag-b back to flag-a returns { value: false, reason: 'error' }
    // which causes flag-b's dependency check to see the error evaluation and flag-a to
    // receive a dependency failure or an error-based result.
    expect(result).toBeDefined();
    expect(result.flagId).toBe('flag-a');
    // The key assertion: we get a result instead of a stack overflow
    expect(['error', 'dependency', 'default']).toContain(result.reason);
  });

  // --- Longer circular chain A → B → C → A (the fix) ---

  it('handles circular dependency A→B→C→A without stack overflow', async () => {
    flags.set('a', {
      id: 'a',
      name: 'A',
      type: 'boolean',
      value: true,
      enabled: true,
      dependencies: [{ flagId: 'b', condition: 'enabled' }],
    });
    flags.set('b', {
      id: 'b',
      name: 'B',
      type: 'boolean',
      value: true,
      enabled: true,
      dependencies: [{ flagId: 'c', condition: 'enabled' }],
    });
    flags.set('c', {
      id: 'c',
      name: 'C',
      type: 'boolean',
      value: true,
      enabled: true,
      dependencies: [{ flagId: 'a', condition: 'enabled' }],
    });

    const result = await evaluator.evaluate('a', context);

    expect(result).toBeDefined();
    expect(result.flagId).toBe('a');
    // Again, no stack overflow — we get a controlled result
    expect(['error', 'dependency', 'default']).toContain(result.reason);
  });

  // --- Missing dependency flag ---

  it('returns unsatisfied when dependency flag does not exist', async () => {
    flags.set('child', {
      id: 'child',
      name: 'Child',
      type: 'boolean',
      value: true,
      enabled: true,
      dependencies: [{ flagId: 'nonexistent', condition: 'enabled' }],
    });

    const result = await evaluator.evaluate('child', context);
    expect(result.reason).toBe('dependency');
    expect(result.value).toBe(false); // boolean default
    expect(result.metadata?.failedDependency).toBe('nonexistent');
  });
});
