import type {
  BrowserAutomationState,
  BrowserAutomationAction,
  BrowserAutomationEvents,
  RecordedEvent,
  TestGenerationOptions,
  ExportOptions,
  SelectorMode,
  DevToolsTab,
  EventFilters,
  RecorderSettings,
  RecordingOptions,
} from '../types';
import { getBrowserAutomationStore } from './devtools-store';
import { EventRecorder } from './recorder';
import { SelectorEngine } from './selector-engine';
import { CDPClient } from './cdp-client';
import { EventProcessor } from './event-processor';

/**
 * Event client interface following TanStack DevTools patterns
 */
export interface BrowserAutomationEventClient {
  subscribe: (
    callback: (
      event: BrowserAutomationEvents[keyof BrowserAutomationEvents],
      type: keyof BrowserAutomationEvents
    ) => void
  ) => () => void;
  emit: <TEventType extends keyof BrowserAutomationEvents>(
    type: TEventType,
    event: BrowserAutomationEvents[TEventType]
  ) => void;
  getState: () => BrowserAutomationState;
  dispatch: (action: BrowserAutomationAction) => void;
}

/**
 * Browser Automation DevTools event client implementation
 */
export class BrowserAutomationDevToolsEventClient implements BrowserAutomationEventClient {
  private unsubscribe?: () => void;
  private store = getBrowserAutomationStore();
  private subscribers = new Set<(
    event: BrowserAutomationEvents[keyof BrowserAutomationEvents],
    type: keyof BrowserAutomationEvents
  ) => void>();
  
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
    
    // Initialize any default behavior
    this.setupEventListeners();
    this.setupRecordingIntegration();
  }

  /**
   * Set up DOM event listeners for recording
   */
  private setupEventListeners() {
    // Event listeners are now handled by EventRecorder
  }
  
  /**
   * Setup integration between recording components
   */
  private setupRecordingIntegration() {
    // Handle processed events from event processor
    // This would be expanded to include more sophisticated integration
  }

  /**
   * Subscribe to store changes and emit events
   */
  subscribe = (
    callback: (
      event: BrowserAutomationEvents[keyof BrowserAutomationEvents],
      type: keyof BrowserAutomationEvents
    ) => void
  ) => {
    this.subscribers.add(callback);

    // Subscribe to store changes
    this.unsubscribe = this.store.subscribe(() => {
      const state = this.store.getState();
      callback(state, 'recorder:state');
    });

    // Send initial state
    const initialState = this.store.getState();
    callback(initialState, 'recorder:state');

    return () => {
      this.subscribers.delete(callback);
      if (this.subscribers.size === 0) {
        this.unsubscribe?.();
        this.cleanup();
      }
    };
  };

  /**
   * Emit event to all subscribers
   */
  emit = <TEventType extends keyof BrowserAutomationEvents>(
    type: TEventType,
    event: BrowserAutomationEvents[TEventType]
  ): void => {
    this.subscribers.forEach(callback => {
      callback(event, type);
    });
  };

  /**
   * Get current state from store
   */
  getState = (): BrowserAutomationState => {
    return this.store.getState();
  };

  /**
   * Dispatch action to store
   */
  dispatch = (action: BrowserAutomationAction): void => {
    this.store.dispatch(action);

    // Emit action event
    this.emit('recorder:action', action);
  };

  // Convenience methods for common actions

  /**
   * Recording control methods
   */
  startRecording = async (): Promise<void> => {
    try {
      // Get recording options from store
      const state = this.store.getState();
      const options: RecordingOptions = {
        ...state.settings.recordingOptions,
        selectorOptions: state.settings.selectorOptions,
      };
      
      // Start event recorder
      await this.eventRecorder.startRecording(options);
      
      // Update store
      this.store.startRecording();
      
      // Setup event processing pipeline
      this.setupEventProcessingPipeline();
      
      this.emit('recorder:state', this.store.getState());
    } catch (error) {
      console.error('Failed to start recording:', error);
      this.emit('recorder:error', {
        message: `Failed to start recording: ${error instanceof Error ? error.message : String(error)}`,
        stack: error instanceof Error ? error.stack : undefined,
      });
    }
  };

  stopRecording = async (): Promise<void> => {
    try {
      // Stop event recorder and get recorded events
      const recordedEvents = await this.eventRecorder.stopRecording();
      
      // Process events through event processor
      for (const event of recordedEvents) {
        this.eventProcessor.addEvent(event);
      }
      
      const processingResult = await this.eventProcessor.processAllEvents();
      const processedEvents = this.eventProcessor.getProcessedEvents();
      
      // Add processed events to store
      processedEvents.forEach(event => {
        this.store.addEvent(event);
      });
      
      // Update store
      this.store.stopRecording();
      
      this.emit('recorder:state', this.store.getState());
      this.emit('recorder:processing-complete', {
        originalCount: processingResult.originalCount,
        processedCount: processingResult.processedCount,
        optimizations: processingResult.optimizations,
      });
    } catch (error) {
      console.error('Failed to stop recording:', error);
      this.emit('recorder:error', {
        message: `Failed to stop recording: ${error instanceof Error ? error.message : String(error)}`,
        stack: error instanceof Error ? error.stack : undefined,
      });
    }
  };

  pauseRecording = (): void => {
    this.eventRecorder.pauseRecording();
    this.store.pauseRecording();
    this.emit('recorder:state', this.store.getState());
  };

  resumeRecording = (): void => {
    this.eventRecorder.resumeRecording();
    this.store.resumeRecording();
    this.emit('recorder:state', this.store.getState());
  };

  clearRecording = (): void => {
    // Clear event processor
    this.eventProcessor.clear();
    
    // Clear store
    this.store.clearRecording();
    
    this.emit('recorder:state', this.store.getState());
  };

  /**
   * Event management methods
   */
  addEvent = (event: RecordedEvent): void => {
    this.store.addEvent(event);
    this.emit('recorder:event-added', event);
    this.emit('recorder:state', this.store.getState());
  };

  removeEvent = (eventId: string): void => {
    this.store.removeEvent(eventId);
    this.emit('recorder:state', this.store.getState());
  };

  updateEvent = (eventId: string, updates: Partial<RecordedEvent>): void => {
    this.store.updateEvent(eventId, updates);
    this.emit('recorder:state', this.store.getState());
  };

  /**
   * Playback control methods
   */
  startPlayback = (): void => {
    this.store.startPlayback();
    this.emit('recorder:state', this.store.getState());
  };

  stopPlayback = (): void => {
    this.store.stopPlayback();
    this.emit('recorder:state', this.store.getState());
  };

  pausePlayback = (): void => {
    this.store.pausePlayback();
    this.emit('recorder:state', this.store.getState());
  };

  resumePlayback = (): void => {
    this.store.resumePlayback();
    this.emit('recorder:state', this.store.getState());
  };

  stepPlayback = (eventId: string): void => {
    this.store.stepPlayback(eventId);
    this.emit('recorder:state', this.store.getState());
  };

  setPlaybackSpeed = (speed: number): void => {
    this.store.setPlaybackSpeed(speed);
    this.emit('recorder:state', this.store.getState());
  };

  /**
   * Test generation methods
   */
  generateTest = async (options: TestGenerationOptions): Promise<void> => {
    try {
      const generatedTest = await this.store.generateTest(options);
      this.emit('recorder:test-generated', generatedTest);
      this.emit('recorder:state', this.store.getState());
    } catch (error) {
      this.emit('recorder:error', {
        message: `Failed to generate test: ${error instanceof Error ? error.message : String(error)}`,
        stack: error instanceof Error ? error.stack : undefined,
      });
    }
  };

  exportData = async (options: ExportOptions): Promise<void> => {
    try {
      await this.store.exportData(options);
      this.emit('recorder:state', this.store.getState());
    } catch (error) {
      this.emit('recorder:error', {
        message: `Failed to export data: ${error instanceof Error ? error.message : String(error)}`,
        stack: error instanceof Error ? error.stack : undefined,
      });
    }
  };

  /**
   * Selector management methods
   */
  setSelectorMode = (mode: SelectorMode): void => {
    this.store.setSelectorMode(mode);
    this.emit('recorder:state', this.store.getState());
  };

  highlightElement = (selector: string | null): void => {
    // Use selector engine for highlighting
    this.selectorEngine.highlightElement(selector);
    
    // Also try CDP highlighting if available
    if (selector && this.cdpClient.isConnectedToCDP()) {
      this.cdpClient.highlightElement(selector).catch(error => {
        console.warn('CDP highlighting failed:', error);
      });
    }
    
    this.store.highlightElement(selector);
    this.emit('recorder:selector-highlight', { selector });
    this.emit('recorder:state', this.store.getState());
  };

  /**
   * UI control methods
   */
  selectTab = (tab: DevToolsTab): void => {
    this.store.selectTab(tab);
    this.emit('recorder:state', this.store.getState());
  };

  selectEvent = (eventId: string | null): void => {
    this.store.selectEvent(eventId);
    this.emit('recorder:state', this.store.getState());
  };

  togglePanel = (panelId: string): void => {
    this.store.togglePanel(panelId);
    this.emit('recorder:state', this.store.getState());
  };

  updateFilters = (filters: Partial<EventFilters>): void => {
    this.store.updateFilters(filters);
    this.emit('recorder:state', this.store.getState());
  };

  setTheme = (theme: 'light' | 'dark' | 'auto'): void => {
    this.store.setTheme(theme);
    this.emit('recorder:state', this.store.getState());
  };

  toggleCompactMode = (): void => {
    this.dispatch({ type: 'ui/compact/toggle' });
  };

  /**
   * Settings methods
   */
  updateSettings = (settings: Partial<RecorderSettings>): void => {
    this.store.updateSettings(settings);
    this.emit('recorder:state', this.store.getState());
  };

  resetSettings = (): void => {
    this.store.resetSettings();
    this.emit('recorder:state', this.store.getState());
  };

  exportSettings = (): void => {
    this.dispatch({ type: 'settings/export' });
  };

  importSettings = (settings: RecorderSettings): void => {
    this.dispatch({ type: 'settings/import', payload: settings });
  };

  /**
   * Utility methods
   */
  getFilteredEvents = (): RecordedEvent[] => {
    return this.store.getFilteredEvents();
  };

  getSelectedEvent = (): RecordedEvent | null => {
    return this.store.getSelectedEvent();
  };

  /**
   * Set up event processing pipeline
   */
  private setupEventProcessingPipeline(): void {
    // This method sets up the pipeline between EventRecorder and EventProcessor
    // In a production implementation, this would handle real-time event processing
  }

  /**
   * Connect to Chrome DevTools Protocol if available
   */
  async connectToCDP(): Promise<boolean> {
    try {
      await this.cdpClient.connect();
      await this.cdpClient.enableDOM();
      await this.cdpClient.enableRuntime();
      await this.cdpClient.enablePage();
      
      this.emit('recorder:cdp-connected', { connected: true });
      return true;
    } catch (error) {
      console.warn('CDP connection failed:', error);
      this.emit('recorder:cdp-connected', { connected: false });
      return false;
    }
  }
  
  /**
   * Disconnect from Chrome DevTools Protocol
   */
  async disconnectFromCDP(): Promise<void> {
    await this.cdpClient.disconnect();
    this.emit('recorder:cdp-connected', { connected: false });
  }
  
  /**
   * Take screenshot using CDP or fallback method
   */
  async takeScreenshot(options?: any): Promise<any> {
    try {
      if (this.cdpClient.isConnectedToCDP()) {
        return await this.cdpClient.takeScreenshot(options);
      } else {
        // Fallback screenshot implementation
        console.warn('CDP not available, screenshot functionality limited');
        return null;
      }
    } catch (error) {
      console.error('Screenshot failed:', error);
      return null;
    }
  }

  /**
   * Get event processor instance for advanced event management
   */
  getEventProcessor(): EventProcessor {
    return this.eventProcessor;
  }
  
  /**
   * Get selector engine instance for element selection
   */
  getSelectorEngine(): SelectorEngine {
    return this.selectorEngine;
  }
  
  /**
   * Get CDP client instance for low-level browser automation
   */
  getCDPClient(): CDPClient {
    return this.cdpClient;
  }
  
  /**
   * Get event recorder instance
   */
  getEventRecorder(): EventRecorder {
    return this.eventRecorder;
  }

  /**
   * Check if recording is currently active
   */
  isRecording(): boolean {
    return this.eventRecorder.getStatus().isRecording;
  }
  
  /**
   * Get current recording status
   */
  getRecordingStatus(): {
    isRecording: boolean;
    isPaused: boolean;
    eventCount: number;
    sessionId: string;
  } {
    return this.eventRecorder.getStatus();
  }

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
    this.unsubscribe?.();
    await this.cleanup();
    this.subscribers.clear();
  };
}

// Singleton instance
let eventClientInstance: BrowserAutomationDevToolsEventClient | null = null;

/**
 * Create or get browser automation DevTools event client
 */
export function createBrowserAutomationEventClient(): BrowserAutomationDevToolsEventClient {
  if (!eventClientInstance) {
    eventClientInstance = new BrowserAutomationDevToolsEventClient();
  }
  return eventClientInstance;
}

/**
 * Get existing browser automation DevTools event client
 */
export function getBrowserAutomationEventClient(): BrowserAutomationDevToolsEventClient | null {
  return eventClientInstance;
}

/**
 * Reset event client instance (useful for testing)
 */
export function resetBrowserAutomationEventClient(): void {
  if (eventClientInstance) {
    eventClientInstance.destroy();
    eventClientInstance = null;
  }
}