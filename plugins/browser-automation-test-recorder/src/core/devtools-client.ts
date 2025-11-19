import type {
  BrowserAutomationState,
  RecordedEvent,
  TestGenerationOptions,
  ExportOptions,
  SelectorMode,
  DevToolsTab,
  EventFilters,
  RecorderSettings,
  RecordingOptions,
} from '../types';
import { getBrowserAutomationStoreApi } from './devtools-store';
import { EventRecorder } from './recorder';
import { SelectorEngine } from './selector-engine';
import { CDPClient } from './cdp-client';
import { EventProcessor } from './event-processor';

/**
 * DevTools event client interface following TanStack patterns
 */
export interface DevToolsEventClient<TEvents extends Record<string, any>> {
  subscribe: (callback: (event: TEvents[keyof TEvents], type: keyof TEvents) => void) => () => void;
  getState: () => BrowserAutomationState;
}

export interface BrowserAutomationEvents {
  'browser-automation:state': BrowserAutomationState;
  'browser-automation:error': { message: string; stack?: string };
}

/**
 * Browser Automation DevTools event client
 * Follows the simplified TanStack DevTools pattern
 */
export class BrowserAutomationDevToolsClient implements DevToolsEventClient<BrowserAutomationEvents> {
  private unsubscribeStore?: () => void;
  private storeApi = getBrowserAutomationStoreApi();

  // Core recording components
  private selectorEngine: SelectorEngine;
  private cdpClient: CDPClient;
  private eventRecorder: EventRecorder;
  private eventProcessor: EventProcessor;

  constructor() {
    // Initialize core components
    this.selectorEngine = new SelectorEngine();
    this.cdpClient = new CDPClient();
    this.eventRecorder = new EventRecorder(this.selectorEngine, this);
    this.eventProcessor = new EventProcessor();
  }

  /**
   * Subscribe to store changes
   */
  subscribe = (
    callback: (
      event: BrowserAutomationEvents[keyof BrowserAutomationEvents],
      type: keyof BrowserAutomationEvents
    ) => void
  ) => {
    // Subscribe to store changes
    this.unsubscribeStore = this.storeApi.subscribe(() => {
      const state = this.storeApi.getState();
      callback(state, 'browser-automation:state');
    });

    // Send initial state
    const initialState = this.storeApi.getState();
    callback(initialState, 'browser-automation:state');

    return () => {
      this.unsubscribeStore?.();
    };
  };

  /**
   * Get current state
   */
  getState = (): BrowserAutomationState => {
    return this.storeApi.getState();
  };

  // Recording control methods
  startRecording = async (options?: RecordingOptions): Promise<void> => {
    await this.storeApi.getState().startRecording(options);
    this.eventRecorder.start();
  };

  stopRecording = async (): Promise<void> => {
    this.eventRecorder.stop();
    await this.storeApi.getState().stopRecording();
  };

  pauseRecording = (): void => {
    this.eventRecorder.pause();
    this.storeApi.getState().pauseRecording();
  };

  resumeRecording = (): void => {
    this.eventRecorder.resume();
    this.storeApi.getState().resumeRecording();
  };

  clearRecording = (): void => {
    this.storeApi.getState().clearRecording();
  };

  isRecording = (): boolean => {
    return this.storeApi.getState().recording.isRecording;
  };

  // Event management methods
  addEvent = (event: RecordedEvent): void => {
    this.storeApi.getState().addEvent(event);
  };

  removeEvent = (eventId: string): void => {
    this.storeApi.getState().removeEvent(eventId);
  };

  updateEvent = (eventId: string, updates: Partial<RecordedEvent>): void => {
    this.storeApi.getState().updateEvent(eventId, updates);
  };

  // Playback control methods
  startPlayback = (): void => {
    this.storeApi.getState().startPlayback();
  };

  stopPlayback = (): void => {
    this.storeApi.getState().stopPlayback();
  };

  pausePlayback = (): void => {
    this.storeApi.getState().pausePlayback();
  };

  resumePlayback = (): void => {
    this.storeApi.getState().resumePlayback();
  };

  stepPlayback = (eventId: string): void => {
    this.storeApi.getState().stepPlayback(eventId);
  };

  setPlaybackSpeed = (speed: number): void => {
    this.storeApi.getState().setPlaybackSpeed(speed);
  };

  // Test generation methods
  generateTest = async (options: TestGenerationOptions): Promise<void> => {
    await this.storeApi.getState().generateTest(options);
  };

  exportData = async (options: ExportOptions): Promise<void> => {
    await this.storeApi.getState().exportData(options);
  };

  // Selector methods
  setSelectorMode = (mode: SelectorMode): void => {
    this.storeApi.getState().setSelectorMode(mode);
  };

  highlightElement = (selector: string | null): void => {
    if (selector) {
      this.selectorEngine.highlightElement(selector);
    } else {
      this.selectorEngine.clearHighlight();
    }
    this.storeApi.getState().highlightElement(selector);
  };

  // CDP integration methods
  connectToCDP = async (endpoint: string): Promise<void> => {
    await this.cdpClient.connect(endpoint);
    this.storeApi.getState().connectToCDP(endpoint);
  };

  disconnectFromCDP = async (): Promise<void> => {
    await this.cdpClient.disconnect();
    this.storeApi.getState().disconnectFromCDP();
  };

  // UI control methods
  selectTab = (tab: DevToolsTab): void => {
    this.storeApi.getState().selectTab(tab);
  };

  selectEvent = (eventId: string | null): void => {
    this.storeApi.getState().selectEvent(eventId);
  };

  togglePanel = (panelId: string): void => {
    this.storeApi.getState().togglePanel(panelId);
  };

  updateFilters = (filters: Partial<EventFilters>): void => {
    this.storeApi.getState().updateFilters(filters);
  };

  setTheme = (theme: 'light' | 'dark' | 'auto'): void => {
    this.storeApi.getState().setTheme(theme);
  };

  toggleCompactMode = (): void => {
    this.storeApi.getState().toggleCompactMode();
  };

  // Settings methods
  updateSettings = (settings: Partial<RecorderSettings>): void => {
    this.storeApi.getState().updateSettings(settings);
  };

  resetSettings = (): void => {
    this.storeApi.getState().resetSettings();
  };

  exportSettings = (): void => {
    this.storeApi.getState().exportSettings();
  };

  importSettings = (settings: RecorderSettings): void => {
    this.storeApi.getState().importSettings(settings);
  };

  // Utility methods
  getFilteredEvents = (): RecordedEvent[] => {
    return this.storeApi.getState().getFilteredEvents();
  };

  getSelectedEvent = (): RecordedEvent | null => {
    return this.storeApi.getState().getSelectedEvent();
  };

  getSelectorEngine = (): SelectorEngine => {
    return this.selectorEngine;
  };

  getCDPClient = (): CDPClient => {
    return this.cdpClient;
  };

  getEventRecorder = (): EventRecorder => {
    return this.eventRecorder;
  };

  getEventProcessor = (): EventProcessor => {
    return this.eventProcessor;
  };

  /**
   * Cleanup resources
   */
  private cleanup = async (): Promise<void> => {
    // Stop recording if active
    if (this.isRecording()) {
      await this.stopRecording();
    }

    // Disconnect from CDP
    await this.disconnectFromCDP();

    // Clear event processor
    this.eventProcessor.clear();

    // Clear selector engine highlights
    this.selectorEngine.clearHighlight();
  };

  /**
   * Destroy event client and cleanup resources
   */
  destroy = async (): Promise<void> => {
    this.unsubscribeStore?.();
    await this.cleanup();
  };
}

// Singleton instance
let clientInstance: BrowserAutomationDevToolsClient | null = null;

/**
 * Create or get browser automation DevTools event client
 */
export function createBrowserAutomationEventClient(): BrowserAutomationDevToolsClient {
  if (!clientInstance) {
    clientInstance = new BrowserAutomationDevToolsClient();
  }
  return clientInstance;
}

/**
 * Get existing browser automation DevTools event client
 */
export function getBrowserAutomationEventClient(): BrowserAutomationDevToolsClient | null {
  return clientInstance;
}

/**
 * Reset event client instance (useful for testing)
 */
export function resetBrowserAutomationEventClient(): void {
  clientInstance = null;
}
