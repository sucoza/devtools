declare module 'virtual:tdi/plugins' {
  export const pluginLoaders: Record<string, () => Promise<any>>;
  export const pluginIds: string[];
}

declare module 'virtual:tdi/config' {
  import type { ClientEventBusConfig, TanStackDevtoolsConfig } from '@tanstack/devtools';

  export const devtoolsConfig: {
    plugins: string[];
    config?: Partial<TanStackDevtoolsConfig>;
    eventBusConfig?: Partial<ClientEventBusConfig>;
    enhancedLogs?: { enabled: boolean };
    enabled: boolean;
  };
}