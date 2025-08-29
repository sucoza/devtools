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

export interface PluginStoreActions<T extends BasePluginState> {
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
      (set) => ({
        ...initialState,

        setActive: (active: boolean) => {
          set({ isActive: active } as Partial<PluginStore<T>>);
        },

        setMonitoring: (monitoring: boolean) => {
          set({ isMonitoring: monitoring } as Partial<PluginStore<T>>);
        },

        updateConfig: (config: Partial<T['config']>) => {
          set((state) => ({
            ...state,
            config: { ...state.config, ...config }
          }) as Partial<PluginStore<T>>);
        },

        updateUI: (ui: Partial<T['ui']>) => {
          set((state) => ({
            ...state,
            ui: { ...state.ui, ...ui }
          }) as Partial<PluginStore<T>>);
        },

        updateFilter: (filter: Partial<T['ui']['filter']>) => {
          set((state) => ({
            ...state,
            ui: {
              ...state.ui,
              filter: { ...state.ui.filter, ...filter }
            }
          }) as Partial<PluginStore<T>>);
        },

        reset: () => {
          set((state) => ({ ...state, ...initialState }));
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