/**
 * Router DevTools Enhanced Plugin
 * 
 * A comprehensive router debugging plugin for TanStack DevTools with live parameter editing,
 * route tree visualization, and navigation timeline tracking.
 */

import React from 'react';
import { createReactRouterAdapter } from './adapters/react-router-adapter';
import { routerStateManager } from './core/router-state-manager';

// Main exports
export { RouterDevToolsPanel } from './components/RouterDevToolsPanel';
export { routerEventClient, RouterEventClient } from './core/router-event-client';
export { routerStateManager, RouterStateManager } from './core/router-state-manager';

// Component exports
export * from './components';

// Core exports
export * from './core';

// Adapter exports
export * from './adapters';

// Type exports
export * from './types';

// Utility exports
export * from './utils';

// Convenience functions for easy integration
export { createReactRouterAdapter } from './adapters/react-router-adapter';

/**
 * Initialize Router DevTools with React Router v6
 * 
 * @example
 * ```tsx
 * import { initializeRouterDevTools } from '@tanstack/router-devtools-enhanced';
 * 
 * // In your app initialization
 * const cleanup = initializeRouterDevTools();
 * 
 * // Clean up when needed
 * cleanup();
 * ```
 */
export function initializeRouterDevTools() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { createReactRouterAdapter } = require('./adapters/react-router-adapter');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { routerStateManager } = require('./core/router-state-manager');
  
  const adapter = createReactRouterAdapter();
  routerStateManager.registerAdapter(adapter);
  
  return () => {
    routerStateManager.destroy();
  };
}

/**
 * Hook for integrating Router DevTools into a React Router application
 * 
 * @example
 * ```tsx
 * import { useRouterDevTools } from '@tanstack/router-devtools-enhanced';
 * 
 * function App() {
 *   useRouterDevTools();
 *   
 *   return (
 *     <BrowserRouter>
 *       Your app content
 *     </BrowserRouter>
 *   );
 * }
 * ```
 */
export function useRouterDevTools(): void {
  React.useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined; // Skip in SSR
    }
    
    const cleanup = initializeRouterDevTools();
    return cleanup;
  }, []);
}

// Default export
export { RouterDevToolsPanel as default } from './components/RouterDevToolsPanel';