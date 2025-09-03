/**
 * Main entry point for I18n DevTools Plugin
 */

// Core functionality
export * from './core';
export * from './adapters';
export * from './components';
export * from './types';

// Default export for easy usage
export { I18nDevToolsPanel as default } from './components/I18nDevToolsPanel';

// Convenience exports for quick setup
export { i18nEventClient, I18nEventClient } from './core/i18n-event-client';
export { createReactI18nextAdapter, ReactI18nextAdapter } from './adapters/react-i18next-adapter';
export { createSucozaI18nAdapter, SucozaI18nAdapter } from './adapters/sucoza-i18n-adapter';