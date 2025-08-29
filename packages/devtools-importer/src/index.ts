import type { Plugin, UserConfig } from "vite";
import { devtools as tanstackDevtoolsVite } from "@tanstack/devtools-vite";
import type { TanStackDevtoolsConfig } from "@tanstack/devtools";
import type { ServerEventBusConfig } from "@tanstack/devtools-event-bus/server";
import { findAvailablePort } from "./port";

export type EnhancedLogs = { enabled: boolean };

export type TanstackDevtoolsImporterOptions = {
    /**
     * The list of plugin import specifiers (paths or package names).
     * These MUST be resolvable by Vite (aliases like "@" are fine if configured).
     */
    plugins: string[];

    /**
     * DevTools core config (e.g. { defaultOpen: false })
     */
    config?: Partial<TanStackDevtoolsConfig>;

    /**
     * Server event bus config seed. The port will be injected automatically in dev.
     */
    eventBusConfig?: Partial<ServerEventBusConfig>;

    /**
     * Optional enhanced logging toggle you want to pass through to your app.
     */
    enhancedLogs?: EnhancedLogs;

    /**
     * DevTools port:
     * - number → fixed port
     * - {min,max} → choose a random free port in that range
     * Defaults to {min: 40000, max: 49999}.
     */
    port?: number | { min: number; max: number };

    /**
     * Enable DevTools outside development (default false).
     */
    enableInProd?: boolean;

    /**
     * Customize the virtual module id prefix (for multi-app monorepos).
     * Defaults to "virtual:tdi".
     */
    virtualIdBase?: string;

};

export function tanstackDevtoolsImporter(opts: TanstackDevtoolsImporterOptions): Plugin {
    const { 
        plugins, 
        config = {}, 
        eventBusConfig = {}, 
        enhancedLogs, 
        port, 
        enableInProd = false, 
        virtualIdBase = "virtual:tdi"
    } = opts;

    if (!Array.isArray(plugins) || plugins.length === 0) {
        throw new Error("[tanstack-devtools-importer] `plugins` must be a non-empty array of import specifiers.");
    }

    // Virtual ids
    const V_PLUGINS = `${virtualIdBase}/plugins`;
    const V_CONFIG = `${virtualIdBase}/config`;
    const R_PLUGINS = "\0" + V_PLUGINS;
    const R_CONFIG = "\0" + V_CONFIG;

    // Mutable values set during `config` hook
    let mode: string = "development";
    let selectedPort: number | undefined;
    let shouldEnable = false;

    // Make a snapshot we can expose via the config virtual module
    const appConfig = {
        plugins,
        config,
        eventBusConfig: { ...eventBusConfig } as Partial<ServerEventBusConfig>,
        enhancedLogs,
    };

    return {
        name: "tanstack-devtools-importer",
        enforce: "pre",

        async config(user: UserConfig, env) {
            mode = env.mode;
            shouldEnable = mode === "development" || enableInProd;

            // Resolve port only if we should enable
            if (shouldEnable) {
                if (typeof port === "number") {
                    selectedPort = port;
                } else {
                    // interpret port as {min,max} OR default to [40000,49999]
                    const { min, max } = port ?? { min: 40000, max: 49999 };
                    selectedPort = await findAvailablePort(min, max);
                }

                // Inject port into the eventBus config we expose to the app
                appConfig.eventBusConfig = {
                    ...eventBusConfig,
                    port: selectedPort,
                };

                // Also attach the official TanStack DevTools Vite plugin
                // so it spins up the server/event bus on the chosen port.
                return {
                    plugins: [
                        tanstackDevtoolsVite({
                            eventBusConfig: { port: selectedPort },
                        }) as any,
                    ],
                } as UserConfig;
            }

            return {};
        },

        async resolveId(id) {
            if (id === V_PLUGINS) return R_PLUGINS;
            if (id === V_CONFIG) return R_CONFIG;
            return null;
        },

        async load(id) {
            // The "plugins" virtual module — turn your list into static dynamic imports
            if (id === R_PLUGINS) {
                // Validate each spec resolves at build-time for nice errors
                const checks = await Promise.all(plugins.map(async (spec) => ({ spec, ok: !!(await this.resolve(spec)) })));
                const bad = checks.filter((c) => !c.ok);
                if (bad.length) {
                    this.error(`[tanstack-devtools-importer] Could not resolve:\n` + bad.map((b) => `  - ${b.spec}`).join("\n"));
                }

                const entries = plugins
                    .map((spec) => {
                        const key = JSON.stringify(spec);
                        // Note: literal import() so Vite can code-split
                        return `${key}: () => import(${key})`;
                    })
                    .join(",");

                return `
          // auto-generated by tanstack-devtools-importer
          export const pluginLoaders = { ${entries} };
          export const pluginIds = ${JSON.stringify(plugins)};
        `;
            }

            // The "config" virtual module — expose the resolved config (incl. port)
            if (id === R_CONFIG) {
                return `
          // auto-generated by tanstack-devtools-importer
          export const devtoolsConfig = ${JSON.stringify({
              ...appConfig,
              // In production (when disabled), we still export the object so imports don't break,
              // but your React component will decide whether to render.
              enabled: shouldEnable,
          })};
        `;
            }

            return null;
        },
    };
}
