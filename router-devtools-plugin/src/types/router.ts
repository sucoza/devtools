/**
 * Core router types and interfaces for the Router DevTools Enhanced plugin
 */

export interface RouteInfo {
  id: string;
  path: string;
  element?: string;
  index?: boolean;
  caseSensitive?: boolean;
  children?: RouteInfo[];
  loader?: boolean;
  action?: boolean;
  errorElement?: string;
  handle?: Record<string, unknown>;
}

export interface RouteMatch {
  id: string;
  pathname: string;
  pathnameBase: string;
  route: RouteInfo;
  params: Record<string, string>;
  data?: unknown;
  handle?: Record<string, unknown>;
}

export interface NavigationState {
  location: {
    pathname: string;
    search: string;
    hash: string;
    state?: unknown;
    key: string;
  };
  matches: RouteMatch[];
  navigation: {
    state: 'idle' | 'loading' | 'submitting';
    location?: {
      pathname: string;
      search: string;
      hash: string;
      state?: unknown;
      key: string;
    };
    formMethod?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    formAction?: string;
    formEncType?: 'application/x-www-form-urlencoded' | 'multipart/form-data';
    formData?: FormData;
  };
  actionData?: unknown;
  loaderData: Record<string, unknown>;
  errors?: Record<string, Error>;
}

export interface NavigationHistoryEntry {
  id: string;
  timestamp: number;
  location: NavigationState['location'];
  matches: RouteMatch[];
  action: 'PUSH' | 'REPLACE' | 'POP';
  delta?: number;
  duration?: number;
  loadingState?: 'idle' | 'loading' | 'submitting';
}

export interface RouteTreeNode {
  id: string;
  path: string;
  fullPath: string;
  element?: string;
  index?: boolean;
  children: RouteTreeNode[];
  isActive: boolean;
  isMatched: boolean;
  params?: Record<string, string>;
  data?: unknown;
  level: number;
}

/**
 * Generic router adapter interface for different router libraries
 */
export interface IRouterAdapter {
  /**
   * Get the current navigation state
   */
  getCurrentState(): NavigationState | null;

  /**
   * Get all available routes in the application
   */
  getRouteTree(): RouteInfo[];

  /**
   * Subscribe to navigation changes
   */
  subscribe(callback: (state: NavigationState) => void): () => void;

  /**
   * Navigate programmatically
   */
  navigate(to: string, options?: NavigationOptions): void;

  /**
   * Update route parameters
   */
  updateParams(params: Record<string, string>): void;

  /**
   * Update query parameters
   */
  updateSearch(search: string): void;

  /**
   * Get router type identifier
   */
  getRouterType(): string;
}

export interface NavigationOptions {
  replace?: boolean;
  state?: unknown;
  preventScrollReset?: boolean;
  relative?: 'route' | 'path';
}

/**
 * Route parameter editing context
 */
export interface RouteParamEditContext {
  currentParams: Record<string, string>;
  currentSearch: URLSearchParams;
  isEditing: boolean;
  pendingParams: Record<string, string>;
  pendingSearch: string;
  errors: Record<string, string>;
}

/**
 * Router DevTools configuration
 */
export interface RouterDevToolsConfig {
  /**
   * Maximum number of navigation history entries to keep
   */
  maxHistoryEntries?: number;

  /**
   * Whether to automatically expand route tree nodes
   */
  autoExpandRoutes?: boolean;

  /**
   * Whether to enable live parameter editing
   */
  enableLiveEditing?: boolean;

  /**
   * Custom route name resolver
   */
  routeNameResolver?: (route: RouteInfo) => string;

  /**
   * Custom parameter validator
   */
  paramValidator?: (params: Record<string, string>) => Record<string, string>;
}