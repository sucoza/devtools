import { useSyncExternalStore } from 'use-sync-external-store/shim/index.js';

export interface DevToolsEvent<T = any> {
  type: string;
  payload: T;
  timestamp: number;
  id: string;
}

export interface BaseDevToolsStore<T = any> {
  subscribe: (listener: () => void) => () => void;
  getSnapshot: () => T;
  emit: (event: DevToolsEvent) => void;
}

/**
 * Base DevTools client that provides standardized communication patterns
 * for all TanStack DevTools plugins
 */
export abstract class BaseDevToolsClient<TState = any> {
  protected store: BaseDevToolsStore<TState>;
  protected eventId = 0;

  constructor(store: BaseDevToolsStore<TState>) {
    this.store = store;
  }

  /**
   * Generate unique event ID
   */
  protected generateEventId(): string {
    return `event-${++this.eventId}-${Date.now()}`;
  }

  /**
   * Emit an event to the devtools
   */
  protected emit<T>(type: string, payload: T): void {
    const event: DevToolsEvent<T> = {
      type,
      payload,
      timestamp: Date.now(),
      id: this.generateEventId()
    };

    this.store.emit(event);
  }

  /**
   * Subscribe to store changes for React components
   */
  public useStore<TSelected>(selector: (state: TState) => TSelected): TSelected {
    return useSyncExternalStore(
      this.store.subscribe,
      () => selector(this.store.getSnapshot()),
      () => selector(this.store.getSnapshot())
    );
  }

  /**
   * Get current state snapshot
   */
  public getSnapshot(): TState {
    return this.store.getSnapshot();
  }

  /**
   * Subscribe to store changes (non-React)
   */
  public subscribe(listener: () => void): () => void {
    return this.store.subscribe(listener);
  }

  /**
   * Abstract methods that plugins must implement
   */
  abstract startMonitoring(): void;
  abstract stopMonitoring(): void;
  abstract cleanup(): void;
}