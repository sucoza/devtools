/**
 * Global type declarations for Design System Inspector Plugin
 */

// Type declarations for use-sync-external-store/shim
declare module 'use-sync-external-store/shim' {
  export function useSyncExternalStore<Snapshot>(
    subscribe: (onStoreChange: () => void) => () => void,
    getSnapshot: () => Snapshot,
    getServerSnapshot?: () => Snapshot
  ): Snapshot;
}