/**
 * Browser Automation Test Recorder Core Exports
 * Main exports for the core functionality
 */

// Store exports
export {
  useBrowserAutomationStore,
  getBrowserAutomationStore,
  getBrowserAutomationStoreApi,
} from './devtools-store';

// Event client exports
export {
  BrowserAutomationDevToolsClient,
  createBrowserAutomationEventClient,
  getBrowserAutomationEventClient,
  resetBrowserAutomationEventClient,
} from './devtools-client';

// Recording system exports
export { EventRecorder } from './recorder';
export { SelectorEngine } from './selector-engine';
export type { SelectorCandidate, SelectorType, ElementHighlight } from './selector-engine';

// Chrome DevTools Protocol exports
export { CDPClient } from './cdp-client';

// Event processing exports
export { EventProcessor } from './event-processor';
export type { 
  ProcessingOptions, 
  ProcessingResult, 
  TimelineMarker 
} from './event-processor';

// Playback system exports
export { PlaybackEngine } from './playback-engine';
export type { 
  PlaybackEngineOptions, 
  PlaybackContext 
} from './playback-engine';

// Selector resolution exports
export { SelectorResolver } from './selector-resolver';
export type { 
  SelectorResolutionResult, 
  ElementMatchingCriteria, 
  HealingStrategy 
} from './selector-resolver';

// Playback monitoring exports
export { PlaybackMonitor } from './playback-monitor';
export type { 
  PlaybackMetrics, 
  MonitoringEvent, 
  RecoveryStrategy, 
  MonitoringConfig 
} from './playback-monitor';