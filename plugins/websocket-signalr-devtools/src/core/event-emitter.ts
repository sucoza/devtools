export type EventListener<T> = (data: T) => void;

export class EventEmitter<TEventMap extends Record<string, any>> {
  private listeners = new Map<keyof TEventMap, Set<EventListener<any>>>();

  on<K extends keyof TEventMap>(event: K, listener: EventListener<TEventMap[K]>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    
    this.listeners.get(event)!.add(listener);

    // Return unsubscribe function
    return () => {
      this.off(event, listener);
    };
  }

  off<K extends keyof TEventMap>(event: K, listener: EventListener<TEventMap[K]>): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.delete(listener);
      if (eventListeners.size === 0) {
        this.listeners.delete(event);
      }
    }
  }

  emit<K extends keyof TEventMap>(event: K, data: TEventMap[K]): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          console.error('Error in event listener:', error);
        }
      });
    }
  }

  once<K extends keyof TEventMap>(event: K, listener: EventListener<TEventMap[K]>): () => void {
    const onceListener = (data: TEventMap[K]) => {
      listener(data);
      this.off(event, onceListener);
    };

    return this.on(event, onceListener);
  }

  removeAllListeners<K extends keyof TEventMap>(event?: K): void {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }

  listenerCount<K extends keyof TEventMap>(event: K): number {
    const eventListeners = this.listeners.get(event);
    return eventListeners ? eventListeners.size : 0;
  }

  eventNames(): Array<keyof TEventMap> {
    return Array.from(this.listeners.keys());
  }
}