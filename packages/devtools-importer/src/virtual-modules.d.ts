declare module 'virtual:tdi/plugins' {
  export const pluginLoaders: Record<string, () => Promise<any>>;
  export const pluginIds: string[];
}

declare module 'virtual:tdi/config' {
  import type { TanStackDevtoolsConfig } from '@tanstack/devtools';
  import type { ServerEventBusConfig } from '@tanstack/devtools-event-bus/server';

  export const devtoolsConfig: {
    plugins: string[];
    config?: Partial<TanStackDevtoolsConfig>;
    eventBusConfig?: Partial<ServerEventBusConfig>;
    enhancedLogs?: { enabled: boolean };
    enabled: boolean;
  };
}