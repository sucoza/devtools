/**
 * Browser Automation Test Recorder Components
 * Export all component modules
 */

// Main panel component
export { BrowserAutomationPanel } from './BrowserAutomationPanel';

// Tab components
export { default as RecorderTab } from './tabs/RecorderTab';
export { default as PlaybackTab } from './tabs/PlaybackTab';
export { default as EventsTab } from './tabs/EventsTab';
export { default as SelectorsTab } from './tabs/SelectorsTab';
export { default as TestGeneratorTab } from './tabs/TestGeneratorTab';
export { CollaborationTab } from './tabs/CollaborationTab';
export { default as SettingsTab } from './tabs/SettingsTab';

// Collaboration components
export * from './collaboration';