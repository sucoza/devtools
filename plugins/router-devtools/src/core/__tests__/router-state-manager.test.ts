/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the event client before importing the module
vi.mock('../router-event-client', () => ({
  routerEventClient: {
    emit: vi.fn(),
    on: vi.fn(() => () => {}),
  },
}));

import { RouterStateManager } from '../router-state-manager';
import type { IRouterAdapter, NavigationState } from '../../types/router';

function makeNavigationState(pathname: string): NavigationState {
  return {
    location: {
      pathname,
      search: '',
      hash: '',
      key: `key-${Math.random().toString(36).substring(2, 8)}`,
    },
    matches: [],
    navigation: { state: 'idle' },
    loaderData: {},
  };
}

describe('RouterStateManager — immutable history (the fix)', () => {
  let manager: RouterStateManager;
  let subscribeCallback: ((state: NavigationState) => void) | null;

  beforeEach(() => {
    subscribeCallback = null;

    const mockAdapter: IRouterAdapter = {
      getCurrentState: () => makeNavigationState('/initial'),
      getRouteTree: () => [],
      subscribe: (cb) => {
        subscribeCallback = cb;
        return () => { subscribeCallback = null; };
      },
      navigate: vi.fn(),
      updateParams: vi.fn(),
      updateSearch: vi.fn(),
      getRouterType: () => 'mock',
    };

    manager = new RouterStateManager({ maxHistoryEntries: 5 });
    manager.registerAdapter(mockAdapter);
  });

  it('creates a new history array reference on navigation', () => {
    const historyBefore = manager.getNavigationHistory();

    // Trigger a navigation — handleNavigationChange requires previousState,
    // so the first call sets currentState, second call creates a history entry
    subscribeCallback!(makeNavigationState('/page-1'));

    const historyAfter = manager.getNavigationHistory();
    expect(historyAfter).not.toBe(historyBefore);
    expect(historyAfter.length).toBe(1);
    expect(historyAfter[0].location.pathname).toBe('/page-1');
  });

  it('trims history to maxHistoryEntries', () => {
    // Navigate 7 times (max is 5)
    for (let i = 1; i <= 7; i++) {
      subscribeCallback!(makeNavigationState(`/page-${i}`));
    }

    const history = manager.getNavigationHistory();
    expect(history.length).toBe(5);
    // Oldest entries should be trimmed, most recent should be last
    expect(history[history.length - 1].location.pathname).toBe('/page-7');
  });

  it('clearHistory creates a new empty array', () => {
    subscribeCallback!(makeNavigationState('/page-1'));
    const historyBefore = manager.getNavigationHistory();
    expect(historyBefore.length).toBe(1);

    manager.clearHistory();

    const historyAfter = manager.getNavigationHistory();
    expect(historyAfter).not.toBe(historyBefore);
    expect(historyAfter.length).toBe(0);
  });
});
