// Global type declarations

// CSS module types
declare module "*.css" {
  const content: { [className: string]: string };
  export default content;
}

// Styled-jsx module augmentation
declare module "react" {
  interface HTMLAttributes<_T> {
    jsx?: boolean;
  }
}

// Use sync external store types
declare module "use-sync-external-store" {
  export function useSyncExternalStore<T>(
    subscribe: (onStoreChange: () => void) => () => void,
    getSnapshot: () => T,
    getServerSnapshot?: () => T
  ): T;
}

declare module "use-sync-external-store/shim" {
  export { useSyncExternalStore } from "use-sync-external-store";
}

// React DevTools Global Hook types
interface ReactDevToolsGlobalHook {
  onCommitRoot?: (id: number, root: any, priorityLevel: any) => void;
  onCommitUnmount?: (id: number, root: any) => void;
  supportsFiber?: boolean;
  inject?: (internals: any) => number;
  onCommitFiberRoot?: (id: number, root: any, priorityLevel?: any) => void;
  onCommitFiberUnmount?: (id: number, fiber: any) => void;
}

declare global {
  interface Window {
    __REACT_DEVTOOLS_GLOBAL_HOOK__?: ReactDevToolsGlobalHook;
  }
}