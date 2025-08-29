/**
 * Router DevTools Event Client
 * Handles communication between the router adapter and DevTools panel
 */

import { EventClient } from '@tanstack/devtools-event-client';
import { RouterDevToolsEvents, RouterEventType, RouterEventPayload } from '../types/devtools';

export class RouterEventClient {
  private eventClient: any;

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
    return this.eventClient.on(type, callback);
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
    return this.eventClient.onAll(callback);
  }

  /**
   * Remove all listeners
   */
  destroy(): void {
    this.eventClient.destroy();
  }
}

// Global event client instance
export const routerEventClient = new RouterEventClient();