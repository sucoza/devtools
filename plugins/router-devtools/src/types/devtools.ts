/**
 * DevTools event types and interfaces
 */

import { NavigationState, NavigationHistoryEntry, RouteInfo } from './router';

export interface RouterDevToolsEvents {
  'router-state-update': {
    state: NavigationState;
    routeTree: RouteInfo[];
    timestamp: number;
  };
  
  'router-navigation': {
    entry: NavigationHistoryEntry;
    state: NavigationState;
  };
  
  'router-state-request': undefined;
  
  'router-state-response': {
    state: NavigationState | null;
    routeTree: RouteInfo[];
    history: NavigationHistoryEntry[];
  };
  
  'router-navigate': {
    to: string;
    options?: {
      replace?: boolean;
      state?: unknown;
    };
  };
  
  'router-update-params': {
    params: Record<string, string>;
  };
  
  'router-update-search': {
    search: string;
  };
  
  'router-adapter-registered': {
    routerType: string;
    timestamp: number;
  };
}

export type RouterEventMap = {
  [K in keyof RouterDevToolsEvents]: {
    type: K;
    payload: RouterDevToolsEvents[K];
    timestamp: number;
  };
};

export type RouterEventType = keyof RouterDevToolsEvents;
export type RouterEventPayload<T extends RouterEventType> = RouterDevToolsEvents[T];
export type RouterEvent<T extends RouterEventType = RouterEventType> = RouterEventMap[T];