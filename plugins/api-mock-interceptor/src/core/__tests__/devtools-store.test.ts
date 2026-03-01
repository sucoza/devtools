/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { getDevToolsStore } from '../devtools-store';
import type { ApiCall } from '../../types';

function makeApiCall(overrides: Partial<ApiCall> = {}): ApiCall {
  return {
    id: `call-${Math.random().toString(36).substring(2)}`,
    request: {
      url: 'https://api.example.com/data',
      method: 'GET',
      headers: {},
      timestamp: Date.now(),
    },
    isMocked: false,
    timestamp: Date.now(),
    ...overrides,
  };
}

describe('DevToolsStore — updateStats average response time', () => {
  const store = getDevToolsStore();

  beforeEach(() => {
    store.clearApiCalls();
  });

  it('calculates correct average on first API call (the fix)', () => {
    const call = makeApiCall({ duration: 100 });
    store.dispatch({ type: 'api/call/add', payload: call });

    const state = store.getSnapshot();
    // Previously this produced Infinity due to division by 0
    expect(state.stats.averageResponseTime).toBe(100);
    expect(Number.isFinite(state.stats.averageResponseTime)).toBe(true);
  });

  it('calculates correct running average over multiple calls', () => {
    const call1 = makeApiCall({ duration: 100 });
    const call2 = makeApiCall({ duration: 200 });
    const call3 = makeApiCall({ duration: 300 });

    store.dispatch({ type: 'api/call/add', payload: call1 });
    expect(store.getSnapshot().stats.averageResponseTime).toBe(100);

    store.dispatch({ type: 'api/call/add', payload: call2 });
    expect(store.getSnapshot().stats.averageResponseTime).toBe(150);

    store.dispatch({ type: 'api/call/add', payload: call3 });
    expect(store.getSnapshot().stats.averageResponseTime).toBe(200);
  });

  it('handles calls without duration', () => {
    const callNoDuration = makeApiCall({ duration: undefined });
    const callWithDuration = makeApiCall({ duration: 50 });

    store.dispatch({ type: 'api/call/add', payload: callNoDuration });
    expect(store.getSnapshot().stats.averageResponseTime).toBe(0);

    store.dispatch({ type: 'api/call/add', payload: callWithDuration });
    // Average = (0 * 1 + 50) / 2 = 25
    expect(store.getSnapshot().stats.averageResponseTime).toBe(25);
  });

  it('tracks totalCalls correctly', () => {
    store.dispatch({ type: 'api/call/add', payload: makeApiCall() });
    store.dispatch({ type: 'api/call/add', payload: makeApiCall() });
    store.dispatch({ type: 'api/call/add', payload: makeApiCall() });

    expect(store.getSnapshot().stats.totalCalls).toBe(3);
  });

  it('tracks mocked calls and errors', () => {
    store.dispatch({ type: 'api/call/add', payload: makeApiCall({ isMocked: true }) });
    store.dispatch({ type: 'api/call/add', payload: makeApiCall({ error: 'Network error' }) });
    store.dispatch({ type: 'api/call/add', payload: makeApiCall() });

    const stats = store.getSnapshot().stats;
    expect(stats.mockedCalls).toBe(1);
    expect(stats.errorCount).toBe(1);
    expect(stats.totalCalls).toBe(3);
  });
});
