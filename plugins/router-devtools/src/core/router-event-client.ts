/**
 * Router DevTools Event Client
 * Handles communication between the router adapter and DevTools panel
 */

import { EventClient } from '@tanstack/devtools-event-client';
import { RouterEventType, RouterEventPayload } from '../types/devtools';

export class RouterEventClient {
  private eventClient: InstanceType<typeof EventClient>;

  constructor() {
    this.eventClient = new EventClient({ pluginId: 'router-devtools' });
  }

  /**
   * Emit an event to the DevTools panel
   */
  emit<T extends RouterEventType>(type: T, payload: RouterEventPayload<T>): void {
    this.eventClient.emit(type, payload);
  }

  /**
   * Subscribe to events from the DevTools panel
   */
  on<T extends RouterEventType>(
    type: T,
    callback: (event: { type: T; payload: RouterEventPayload<T>; timestamp: number }) => void
  ): () => void {
    return this.eventClient.on(type, (event) => {
      callback({
        type,
        payload: event.payload,
        timestamp: Date.now()
      });
    });
  }

  /**
   * Subscribe to all events
   */
  onAll(
    callback: (event: { 
      type: RouterEventType; 
      payload: RouterEventPayload<RouterEventType>; 
      timestamp: number 
    }) => void
  ): () => void {
    return this.eventClient.onAll((event) => {
      const eventType = event.type.split(':')[1] as RouterEventType;
      callback({
        type: eventType,
        payload: event.payload,
        timestamp: Date.now()
      });
    });
  }

  /**
   * Remove all listeners
   */
  destroy(): void {
    // EventClient doesn't have a destroy method, but we can implement cleanup
    // The unsubscribe functions from on() calls handle cleanup
  }
}

// Global event client instance
export const routerEventClient = new RouterEventClient();