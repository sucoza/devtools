import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';

// Import the virtual modules provided by the Vite plugin
import { pluginLoaders } from 'virtual:tdi/plugins';
import { devtoolsConfig } from 'virtual:tdi/config';

export interface DevToolsManagerProps {
  /**
   * Custom className for the DevTools container
   */
  className?: string;
  
  /**
   * Error handler for plugin loading errors
   */
  onError?: (error: Error) => void;
  
  /**
   * Callback when a plugin is loaded
   */
  onPluginLoad?: (pluginId: string) => void;
}

/**
 * DevTools Manager component that provides the TanStack DevTools
 * Uses configuration from the Vite plugin
 */
export const DevToolsManager: React.FC<DevToolsManagerProps> = ({
  className,
  onError,
  onPluginLoad
}) => {
  const [loadedPlugins, setLoadedPlugins] = useState<Set<string>>(new Set());

  // Only render when enabled
  if (!devtoolsConfig?.enabled) return null;

  const handlePluginLoad = useCallback((pluginId: string) => {
    setLoadedPlugins(prev => new Set(prev).add(pluginId));
    onPluginLoad?.(pluginId);
  }, [onPluginLoad]);

  const LazyDevTools = lazy(async () => {
    try {
      const { TanStackDevtools } = await import('@tanstack/react-devtools');

      const configuredIds: string[] = Array.isArray(devtoolsConfig.plugins)
        ? devtoolsConfig.plugins
        : [];

      const plugins = await Promise.all(
        configuredIds.map(async (id) => {
          const loader = (pluginLoaders as Record<string, () => Promise<any>>)[id];
          if (!loader) {
            const error = new Error(`Unknown plugin "${id}"`);
            onError?.(error);
            if (import.meta.env.DEV) {
              console.warn(
                `[DevToolsManager] Unknown plugin "${id}". Known: ${Object.keys(pluginLoaders).join(', ')}`
              );
            }
            return null;
          }
          
          try {
            const module = await loader();
            const PluginComponent = module.default ?? module.Plugin ?? module.Devtools ?? module;
            handlePluginLoad(id);
            
            // Convert the component to the expected plugin format
            return {
              name: id.replace(/.*\//, '').replace(/-devtools-plugin$/, ''),
              render: React.createElement(PluginComponent),
            };
          } catch (error) {
            onError?.(error as Error);
            if (import.meta.env.DEV) {
              console.error(`[DevToolsManager] Failed to load plugin "${id}":`, error);
            }
            return null;
          }
        })
      );

      const validPlugins = plugins.filter(Boolean);

      const DevtoolsWithConfig: React.FC = () => (
        <TanStackDevtools
          {...(devtoolsConfig.config ?? {})}
          eventBusConfig={devtoolsConfig.eventBusConfig}
          plugins={validPlugins}
          className={className}
        />
      );

      return { default: DevtoolsWithConfig };
    } catch (error) {
      onError?.(error as Error);
      throw error;
    }
  });

  return (
    <Suspense 
      fallback={
        <div style={{ 
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          padding: '10px',
          background: 'rgba(0, 0, 0, 0.8)',
          color: 'white',
          borderRadius: '4px',
          fontSize: '14px',
          zIndex: 9999
        }}>
          Loading DevTools...
        </div>
      }
    >
      <LazyDevTools />
    </Suspense>
  );
};

/**
 * Legacy component for backward compatibility
 * @deprecated Use DevToolsManager instead
 */
export const DevToolsImporter = DevToolsManager;
