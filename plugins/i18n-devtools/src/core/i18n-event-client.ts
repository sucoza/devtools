/**
 * I18n DevTools Event Client
 * Handles communication between the i18n adapter and DevTools panel
 */

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
}

export class I18nEventClient implements I18nEventClientInterface {
  private config: I18nDevToolsConfig;
  private isEnabled: boolean = true;
  private subscribers = new Map<string, Set<(...args: any[]) => void>>();
  private allSubscribers = new Set<(...args: any[]) => void>();

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
  }

  /**
   * Emit an event to the DevTools panel
   */
  emit<T extends I18nEventType>(type: T, payload: I18nEventPayload<T>): void {
    if (!this.isEnabled) return;

    try {
      const event = {
        type,
        payload,
        timestamp: Date.now()
      };

      // Notify specific subscribers
      const typeSubscribers = this.subscribers.get(type);
      if (typeSubscribers) {
        typeSubscribers.forEach(callback => {
          try {
            callback(event);
          } catch (error) {
            console.error(`[I18n DevTools] Error in subscriber for ${type}:`, error);
          }
        });
      }

      // Notify all subscribers
      this.allSubscribers.forEach(callback => {
        try {
          callback(event);
        } catch (error) {
          console.error('[I18n DevTools] Error in all subscriber:', error);
        }
      });
      
      if (this.config.debugMode) {
        // console.debug(`[I18n DevTools] Event emitted: ${type}`, payload);
      }
    } catch (error) {
      console.error(`[I18n DevTools] Failed to emit event ${type}:`, error);
    }
  }

  /**
   * Subscribe to events from the DevTools panel
   */
  on<T extends I18nEventType>(
    type: T,
    callback: (event: { type: T; payload: I18nEventPayload<T>; timestamp: number }) => void
  ): () => void {
    if (!this.subscribers.has(type)) {
      this.subscribers.set(type, new Set());
    }
    
    const typeSubscribers = this.subscribers.get(type)!;
    typeSubscribers.add(callback);

    // Return unsubscribe function
    return () => {
      typeSubscribers.delete(callback);
      if (typeSubscribers.size === 0) {
        this.subscribers.delete(type);
      }
    };
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
    this.allSubscribers.add(callback);
    
    return () => {
      this.allSubscribers.delete(callback);
    };
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
    this.subscribers.clear();
    this.allSubscribers.clear();
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
