import { EventClient } from '@tanstack/devtools-event-client';

export type ZustandStoreState = {
  name: string;
  state: unknown;
  timestamp: number;
};

export type ZustandEventMap = {
  'zustand-state-update': {
    stores: Record<string, ZustandStoreState>;
  };
  'zustand-store-registered': {
    storeName: string;
    initialState: unknown;
  };
  'zustand-store-action': {
    storeName: string;
    action: string;
    prevState: unknown;
    nextState: unknown;
    timestamp: number;
  };
  'zustand-state-request': void;
  'zustand-state-response': {
    stores: Record<string, ZustandStoreState>;
  };
  'zustand-restore-state': {
    storeName: string;
    state: unknown;
    timestamp: number;
  };
  'zustand-state-restored': {
    storeName: string;
    state: unknown;
    timestamp: number;
  };
  'zustand-save-snapshot': {
    name: string;
    stores: Record<string, unknown>;
  };
  'zustand-load-snapshot': {
    name: string;
  };
};

export class ZustandEventClient extends EventClient<ZustandEventMap> {
  private static instance: ZustandEventClient | null = null;

  private constructor() {
    super({
      pluginId: 'zustand-devtools',
    } as any);
  }

  static getInstance(): ZustandEventClient {
    if (!ZustandEventClient.instance) {
      ZustandEventClient.instance = new ZustandEventClient();
    }
    return ZustandEventClient.instance;
  }
}

export const zustandEventClient = ZustandEventClient.getInstance() as any;