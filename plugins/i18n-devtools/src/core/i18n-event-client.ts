/**
 * I18n DevTools Event Client
 * Handles communication between the i18n adapter and DevTools panel
 */

import { EventClient } from '@tanstack/devtools-event-client';
import { I18nDevToolsEvents, I18nEventType, I18nEventPayload, I18nDevToolsConfig } from '../types/devtools';

export class I18nEventClient {
  private eventClient: EventClient<I18nDevToolsEvents>;
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

    this.eventClient = new EventClient<I18nDevToolsEvents>(this.config.pluginId);
    this.isEnabled = this.config.enabled;
  }

  /**
   * Emit an event to the DevTools panel
   */
  emit<T extends I18nEventType>(type: T, payload: I18nEventPayload<T>): void {
    if (!this.isEnabled) return;

    try {
      this.eventClient.emit(type, payload);
      
      if (this.config.debugMode) {
        console.debug(`[I18n DevTools] Event emitted: ${type}`, payload);
      }
    } catch (error) {
      console.error(`[I18n DevTools] Failed to emit event ${type}:`, error);
      
      // Emit error event
      this.eventClient.emit('i18n-error', {
        type: 'network',
        message: `Failed to emit event: ${type}`,
        details: { originalError: error },
      });
    }
  }

  /**
   * Subscribe to events from the DevTools panel
   */
  on<T extends I18nEventType>(
    type: T,
    callback: (event: { type: T; payload: I18nEventPayload<T>; timestamp: number }) => void
  ): () => void {
    return this.eventClient.on(type, (event) => {
      if (!this.isEnabled) return;

      try {
        callback(event);
        
        if (this.config.debugMode) {
          console.debug(`[I18n DevTools] Event received: ${type}`, event);
        }
      } catch (error) {
        console.error(`[I18n DevTools] Error handling event ${type}:`, error);
        
        // Emit error event
        this.emit('i18n-error', {
          type: 'translation',
          message: `Error handling event: ${type}`,
          details: { originalError: error },
          stack: error instanceof Error ? error.stack : undefined,
        });
      }
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
      if (!this.isEnabled) return;
      
      try {
        callback(event);
      } catch (error) {
        console.error('[I18n DevTools] Error handling all events:', error);
      }
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
    this.eventClient.destroy();
  }

  /**
   * Check if the client is connected to DevTools
   */
  isConnected(): boolean {
    return this.eventClient && this.isEnabled;
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