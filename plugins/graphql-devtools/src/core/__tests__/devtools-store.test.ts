/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { GraphQLDevToolsStore } from '../devtools-store';
import type { GraphQLOperation } from '../../types';

function makeOperation(overrides: Partial<GraphQLOperation> = {}): GraphQLOperation {
  return {
    id: `op-${Math.random().toString(36).substring(2)}`,
    operationType: 'query',
    query: '{ users { id name } }',
    timestamp: Date.now(),
    status: 'success',
    ...overrides,
  };
}

describe('GraphQLDevToolsStore — averageExecutionTime', () => {
  let store: GraphQLDevToolsStore;

  beforeEach(() => {
    store = new GraphQLDevToolsStore();
  });

  it('does not produce NaN on first operation with executionTime (the fix)', () => {
    const op = makeOperation({ executionTime: 50 });
    store.dispatch({ type: 'operations/add', payload: op });

    const state = store.getSnapshot();
    expect(Number.isNaN(state.performance.averageExecutionTime)).toBe(false);
    expect(state.performance.averageExecutionTime).toBe(50);
  });

  it('calculates correct average over multiple operations', () => {
    store.dispatch({ type: 'operations/add', payload: makeOperation({ executionTime: 100 }) });
    store.dispatch({ type: 'operations/add', payload: makeOperation({ executionTime: 200 }) });
    store.dispatch({ type: 'operations/add', payload: makeOperation({ executionTime: 300 }) });

    const state = store.getSnapshot();
    expect(state.performance.averageExecutionTime).toBe(200);
  });

  it('ignores operations without executionTime', () => {
    store.dispatch({ type: 'operations/add', payload: makeOperation({ executionTime: 100 }) });
    store.dispatch({ type: 'operations/add', payload: makeOperation({ executionTime: undefined }) });
    store.dispatch({ type: 'operations/add', payload: makeOperation({ executionTime: 300 }) });

    const state = store.getSnapshot();
    // Average of [100, 300] = 200
    expect(state.performance.averageExecutionTime).toBe(200);
  });

  it('tracks slowest and fastest operations', () => {
    store.dispatch({ type: 'operations/add', payload: makeOperation({ executionTime: 100 }) });
    store.dispatch({ type: 'operations/add', payload: makeOperation({ executionTime: 500 }) });
    store.dispatch({ type: 'operations/add', payload: makeOperation({ executionTime: 200 }) });

    const state = store.getSnapshot();
    expect(state.performance.slowestOperation?.executionTime).toBe(500);
    expect(state.performance.fastestOperation?.executionTime).toBe(100);
  });
});
