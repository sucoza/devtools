import React, { lazy, Suspense } from "react";

// Import the virtual modules provided by the Vite plugin
import { pluginLoaders } from "virtual:tdi/plugins";
import { devtoolsConfig } from "virtual:tdi/config";

/**
 * A drop-in client component that mounts TanStack DevTools with the
 * configured lazily-loaded plugins.
 */
export const DevToolsImporter: React.FC = () => {
  // Only render when enabled and in dev by default (plugin can allow prod)
  if (!devtoolsConfig?.enabled) return null;

  const LazyDevTools = lazy(async () => {
    const { TanStackDevtools } = await import("@tanstack/react-devtools");

    const configuredIds: string[] = Array.isArray(devtoolsConfig.plugins)
      ? devtoolsConfig.plugins
      : [];

    const plugins = configuredIds.map((id) => {
      const loader = (pluginLoaders as Record<string, () => Promise<any>>)[id];
      if (!loader) {
        if (import.meta.env.DEV) {
          // eslint-disable-next-line no-console
          console.warn(
            `[DevToolsImporter] Unknown plugin "${id}". Known: ${Object.keys(pluginLoaders).join(", ")}`
          );
        }
        return () => null;
      }
      return lazy(() =>
        loader().then((m) => ({ default: m.default ?? m.Plugin ?? m.Devtools ?? m }))
      );
    });

    const DevtoolsWithConfig: React.FC = () => (
      <TanStackDevtools
        {...(devtoolsConfig.config ?? {})}
        // Pass through extra bits if you read them in your plugins
        // @ts-expect-error: TanStack types may not include these custom props
        enhancedLogs={devtoolsConfig.enhancedLogs}
        eventBusConfig={devtoolsConfig.eventBusConfig}
        plugins={plugins}
      />
    );

    return { default: DevtoolsWithConfig };
  });

  return (
    <Suspense fallback={null}>
      <LazyDevTools />
    </Suspense>
  );
};
