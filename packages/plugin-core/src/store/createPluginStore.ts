import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { DevToolsEvent } from '../devtools-client/BaseDevToolsClient';

export interface BasePluginState {
  isActive: boolean;
  isMonitoring: boolean;
  config: Record<string, any>;
  ui: {
    selectedTab: string;
    filter: Record<string, any>;
    settings: Record<string, any>;
  };
}

export interface PluginStoreActions<T> {
  setActive: (active: boolean) => void;
  setMonitoring: (monitoring: boolean) => void;
  updateConfig: (config: Partial<T['config']>) => void;
  updateUI: (ui: Partial<T['ui']>) => void;
  updateFilter: (filter: Partial<T['ui']['filter']>) => void;
  reset: () => void;
}

export type PluginStore<T extends BasePluginState> = T & PluginStoreActions<T>;

/**
 * Factory function to create standardized Zustand stores for DevTools plugins
 */
export function createPluginStore<T extends BasePluginState>(
  initialState: T,
  pluginName: string
) {
  const store = create<PluginStore<T>>()(
    subscribeWithSelector(
      (set, get) => ({
        ...initialState,

        setActive: (active: boolean) => {
          set({ isActive: active });
        },

        setMonitoring: (monitoring: boolean) => {
          set({ isMonitoring: monitoring });
        },

        updateConfig: (config: Partial<T['config']>) => {
          set((state) => ({
            config: { ...state.config, ...config }
          }));
        },

        updateUI: (ui: Partial<T['ui']>) => {
          set((state) => ({
            ui: { ...state.ui, ...ui }
          }));
        },

        updateFilter: (filter: Partial<T['ui']['filter']>) => {
          set((state) => ({
            ui: {
              ...state.ui,
              filter: { ...state.ui.filter, ...filter }
            }
          }));
        },

        reset: () => {
          set(initialState);
        }
      })
    )
  );

  // Add event emission capability
  const originalStore = store;
  const enhancedStore = {
    ...originalStore,
    
    emit: (event: DevToolsEvent) => {
      // Plugin-specific event handling can be added here
      console.debug(`[${pluginName}] DevTools Event:`, event);
    },

    subscribe: (listener: () => void) => {
      return originalStore.subscribe(listener);
    },

    getSnapshot: () => {
      return originalStore.getState();
    }
  };

  return enhancedStore;
}