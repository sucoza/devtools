import React, { useState, useCallback, lazy, Suspense, useEffect, useMemo, Component, ErrorInfo, ReactNode } from 'react';

// Import the virtual modules provided by the Vite plugin
import { pluginLoaders } from 'virtual:tdi/plugins';
import { devtoolsConfig } from 'virtual:tdi/config';

// Simple error boundary for each plugin
class PluginErrorBoundary extends Component<
  { children: ReactNode; pluginName: string },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: ReactNode; pluginName: string }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`[Plugin Error] ${this.props.pluginName}:`, error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '20px',
          backgroundColor: '#1e1e1e',
          color: '#d4d4d4',
          border: '1px solid #3c3c3c',
          borderRadius: '4px',
          margin: '10px',
          fontFamily: 'monospace',
          fontSize: '12px'
        }}>
          <div style={{ color: '#e74c3c', marginBottom: '10px', fontWeight: 'bold' }}>
            ⚠️ Plugin Error: {this.props.pluginName}
          </div>
          <div style={{ color: '#969696', marginBottom: '10px' }}>
            {this.state.error?.message || 'An unexpected error occurred'}
          </div>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{
              padding: '4px 12px',
              backgroundColor: '#2d2d30',
              color: '#d4d4d4',
              border: '1px solid #3c3c3c',
              borderRadius: '3px',
              cursor: 'pointer',
              fontSize: '11px'
            }}
          >
            Retry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

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

// Create the lazy component outside of the component to avoid recreation
const createLazyDevTools = (
  className: string | undefined,
  onError: ((error: Error) => void) | undefined,
  onPluginLoad: ((pluginId: string) => void) | undefined
) => {
  return lazy(async () => {
    try {
      console.log('[DevToolsManager] Loading TanStack DevTools...');
      console.log('[DevToolsManager] Config:', devtoolsConfig);
      console.log('[DevToolsManager] Plugin loaders:', pluginLoaders);
      
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
            console.log(`[DevToolsManager] Loaded module for ${id}:`, module);
            console.log(`[DevToolsManager] Module type:`, typeof module);
            console.log(`[DevToolsManager] Module has default:`, 'default' in module, module.default);
            console.log(`[DevToolsManager] Module keys:`, Object.keys(module));
            console.log(`[DevToolsManager] Module own property names:`, Object.getOwnPropertyNames(module));
            
            // Try to get the component - check for default export first
            let PluginComponent = module.default;
            
            // If no default export, try other common export patterns
            if (!PluginComponent) {
              // Check for specific named exports based on plugin name
              const pluginName = id.split('/').pop()?.replace(/-devtools-plugin$/, '');
              if (pluginName) {
                const expectedExportName = pluginName.split('-')
                  .map((part, i) => i === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1))
                  .join('') + 'DevToolsPanel';
                const alternativeExportName = pluginName.split('-')
                  .map(part => part.charAt(0).toUpperCase() + part.slice(1))
                  .join('') + 'DevToolsPanel';
                
                PluginComponent = module[expectedExportName] || module[alternativeExportName] || 
                                module.Plugin || module.Devtools || module.Panel;
              }
            }
            
            // If still no component and module is a function, use it directly
            if (!PluginComponent && typeof module === 'function') {
              PluginComponent = module;
            }
            
            // Validate that we have a valid component
            if (!PluginComponent || (typeof PluginComponent !== 'function' && 
                (typeof PluginComponent !== 'object' || !PluginComponent.$$typeof))) {
              console.error(`[DevToolsManager] Invalid plugin component for ${id}:`, PluginComponent);
              console.error(`[DevToolsManager] Module exports:`, Object.keys(module));
              throw new Error(`Plugin ${id} does not export a valid React component`);
            }
            
            onPluginLoad?.(id);
            
            // Wrap the plugin component with an error boundary
            const pluginName = id.replace(/.*\//, '').replace(/-devtools-plugin$/, '');
            
            // Convert the component to the expected plugin format
            // TanStack expects either a component or a render function that returns an element
            return {
              name: pluginName,
              render: () => (
                <PluginErrorBoundary pluginName={pluginName}>
                  <PluginComponent />
                </PluginErrorBoundary>
              ),
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
        <div className={className}>
          <TanStackDevtools
            {...(devtoolsConfig.config ?? {})}
            eventBusConfig={devtoolsConfig.eventBusConfig}
            plugins={validPlugins}
          />
        </div>
      );

      console.log('[DevToolsManager] Successfully created DevTools component with', validPlugins.length, 'plugins');
      return { default: DevtoolsWithConfig };
    } catch (error) {
      console.error('[DevToolsManager] Failed to load DevTools:', error);
      throw error;
    }
  });
};

/**
 * DevTools Manager component that provides the TanStack DevTools
 * Uses configuration from the Vite plugin
 */
export const DevToolsManager: React.FC<DevToolsManagerProps> = ({
  className,
  onError,
  onPluginLoad
}) => {
  const [loadError, setLoadError] = useState<Error | null>(null);

  useEffect(() => {
    console.log('[DevToolsManager] Component mounted');
    console.log('[DevToolsManager] devtoolsConfig:', devtoolsConfig);
    console.log('[DevToolsManager] pluginLoaders:', pluginLoaders);
  }, []);

  // Memoize the lazy component to prevent recreation
  const LazyDevTools = useMemo(() => {
    return createLazyDevTools(className, (error) => {
      setLoadError(error);
      onError?.(error);
    }, onPluginLoad);
  }, [className, onError, onPluginLoad]);

  // Only render when enabled
  if (!devtoolsConfig?.enabled) {
    console.log('[DevToolsManager] DevTools disabled, not rendering');
    return null;
  }

  // Show error if loading failed
  if (loadError) {
    return (
      <div style={{ 
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        padding: '10px',
        background: 'rgba(255, 0, 0, 0.9)',
        color: 'white',
        borderRadius: '4px',
        fontSize: '14px',
        zIndex: 9999
      }}>
        DevTools Error: {loadError.message}
      </div>
    );
  }

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