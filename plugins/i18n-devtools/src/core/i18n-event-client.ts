/**
 * I18n DevTools Event Client
 * Handles communication between the i18n adapter and DevTools panel
 * Uses the official TanStack EventClient for event management
 */

import { EventClient } from '@tanstack/devtools-event-client';
import type { I18nDevToolsEvents as _I18nDevToolsEvents, I18nEventType, I18nEventPayload, I18nDevToolsConfig } from '../types/devtools';

/**
 * Event client interface for i18n devtools
 */
export interface I18nEventClientInterface {
  emit: <T extends I18nEventType>(type: T, payload: I18nEventPayload<T>) => void;
  on: <T extends I18nEventType>(
    type: T,
    callback: (event: { type: T; payload: I18nEventPayload<T>; timestamp: number }) => void
  ) => () => void;
  onAll: (
    callback: (event: {
      type: I18nEventType;
      payload: I18nEventPayload<I18nEventType>;
      timestamp: number
    }) => void
  ) => () => void;
  destroy: () => void;
  setEnabled: (enabled: boolean) => void;
  setDebugMode: (enabled: boolean) => void;
  updateConfig: (config: Partial<I18nDevToolsConfig>) => void;
  getConfig: () => I18nDevToolsConfig;
  isConnected: () => boolean;
  ping: () => void;
}

/**
 * I18n DevTools Event Client
 * Wraps the official TanStack EventClient to provide i18n-specific functionality
 */
export class I18nEventClient implements I18nEventClientInterface {
  private eventClient: InstanceType<typeof EventClient>;
  private config: I18nDevToolsConfig;
  private isEnabled: boolean = true;

  constructor(config: Partial<I18nDevToolsConfig> = {}) {
    this.config = {
      pluginId: 'i18n-devtools',
      enabled: true,
      trackUsage: true,
      trackPerformance: true,
      debugMode: false,
      autoDetectMissing: true,
      supportedFormats: ['json', 'csv', 'xlsx'],
      maxHistorySize: 1000,
      refreshInterval: 1000,
      ...config,
    };

    this.isEnabled = this.config.enabled;
    this.eventClient = new EventClient({ pluginId: this.config.pluginId });
  }

  /**
   * Emit an event to the DevTools panel
   */
  emit<T extends I18nEventType>(type: T, payload: I18nEventPayload<T>): void {
    if (!this.isEnabled) return;

    try {
      this.eventClient.emit(type, payload);

      if (this.config.debugMode) {
        // console.debug(`[I18n DevTools] Event emitted: ${type}`, payload);
      }
    } catch (error) {
      console.error(`[I18n DevTools] Failed to emit event ${type}:`, error);
    }
  }

  /**
   * Subscribe to specific event types
   */
  on<T extends I18nEventType>(
    type: T,
    callback: (event: { type: T; payload: I18nEventPayload<T>; timestamp: number }) => void
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
      type: I18nEventType;
      payload: I18nEventPayload<I18nEventType>;
      timestamp: number
    }) => void
  ): () => void {
    return this.eventClient.onAll((event) => {
      const eventType = event.type.split(':')[1] as I18nEventType;
      callback({
        type: eventType,
        payload: event.payload,
        timestamp: Date.now()
      });
    });
  }

  /**
   * Enable or disable the event client
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    this.emit('i18n-realtime-toggle', { enabled });
  }

  /**
   * Toggle debug mode
   */
  setDebugMode(enabled: boolean): void {
    this.config.debugMode = enabled;
    this.emit('i18n-debug-mode-toggle', { enabled });
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<I18nDevToolsConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  getConfig(): I18nDevToolsConfig {
    return { ...this.config };
  }

  /**
   * Remove all listeners and cleanup
   */
  destroy(): void {
    // EventClient doesn't have a destroy method, but unsubscribe functions handle cleanup
    // The unsubscribe functions from on() calls handle cleanup
  }

  /**
   * Check if the client is connected to DevTools
   */
  isConnected(): boolean {
    return this.isEnabled;
  }

  /**
   * Send a heartbeat to check connection
   */
  ping(): void {
    this.emit('i18n-state-request', undefined);
  }
}

// Global event client instance
export const i18nEventClient = new I18nEventClient();
