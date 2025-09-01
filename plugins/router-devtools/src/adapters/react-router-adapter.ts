/**
 * React Router v6 Adapter
 * Integrates with React Router v6 to provide route information and navigation control
 */

import { 
  IRouterAdapter, 
  NavigationState, 
  RouteInfo, 
  RouteMatch,
  NavigationOptions 
} from '../types/router';

// Types for React Router v6 integration
declare global {
  interface Window {
    __REACT_ROUTER_DEVTOOLS__?: {
      router?: unknown;
      routes?: unknown[];
    };
  }
}

export class ReactRouterAdapter implements IRouterAdapter {
  private listeners: ((state: NavigationState) => void)[] = [];
  private router: unknown = null;
  private routes: unknown[] = [];

  constructor() {
    this.initialize();
  }

  /**
   * Initialize the adapter by finding the React Router instance
   */
  private initialize(): void {
    // Try to get router from global devtools hook
    if (window.__REACT_ROUTER_DEVTOOLS__) {
      this.router = window.__REACT_ROUTER_DEVTOOLS__.router;
      this.routes = window.__REACT_ROUTER_DEVTOOLS__.routes || [];
    } else {
      // Try to find router in React DevTools
      this.findRouterInReactDevTools();
    }

    // Set up router state monitoring
    this.setupRouterMonitoring();
  }

  /**
   * Find React Router instance using React DevTools
   */
  private findRouterInReactDevTools(): void {
    // This is a simplified approach - in a real implementation,
    // you would need to traverse the React fiber tree to find the router
    try {
      // Look for router instance in window
      const reactRouter = (window as unknown as { __reactRouter?: unknown }).__reactRouter;
      if (reactRouter) {
        this.router = reactRouter;
      }
    } catch (error) {
      console.warn('Could not find React Router instance:', error);
    }
  }

  /**
   * Set up monitoring for router state changes
   */
  private setupRouterMonitoring(): void {
    // Monitor URL changes
    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;
    
    window.history.pushState = (...args) => {
      originalPushState.apply(window.history, args);
      this.notifyListeners();
    };
    
    window.history.replaceState = (...args) => {
      originalReplaceState.apply(window.history, args);
      this.notifyListeners();
    };

    window.addEventListener('popstate', () => {
      this.notifyListeners();
    });

    // Monitor hash changes
    window.addEventListener('hashchange', () => {
      this.notifyListeners();
    });
  }

  /**
   * Get current navigation state
   */
  getCurrentState(): NavigationState | null {
    try {
      const location = window.location;
      const matches = this.getMatches();

      return {
        location: {
          pathname: location.pathname,
          search: location.search,
          hash: location.hash,
          state: window.history.state,
          key: this.generateLocationKey()
        },
        matches,
        navigation: {
          state: 'idle' // Simplified - would need to track actual loading state
        },
        actionData: undefined,
        loaderData: this.getLoaderData(matches),
        errors: undefined
      };
    } catch (error) {
      console.error('Error getting current state:', error);
      return null;
    }
  }

  /**
   * Get all available routes
   */
  getRouteTree(): RouteInfo[] {
    try {
      if (this.routes.length > 0) {
        return this.convertRoutesToRouteInfo(this.routes);
      }

      // Fallback: extract routes from current location
      return this.extractRoutesFromLocation();
    } catch (error) {
      console.error('Error getting route tree:', error);
      return [];
    }
  }

  /**
   * Subscribe to navigation changes
   */
  subscribe(callback: (state: NavigationState) => void): () => void {
    this.listeners.push(callback);
    
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Navigate programmatically
   */
  navigate(to: string, options: NavigationOptions = {}): void {
    try {
      if (this.router && (this.router as any).navigate) {
        // Use React Router's navigate if available
        (this.router as any).navigate(to, options);
      } else {
        // Fallback to browser navigation
        if (options.replace) {
          window.history.replaceState(options.state || null, '', to);
        } else {
          window.history.pushState(options.state || null, '', to);
        }
        this.notifyListeners();
      }
    } catch (error) {
      console.error('Error navigating:', error);
    }
  }

  /**
   * Update route parameters
   */
  updateParams(params: Record<string, string>): void {
    const currentPath = window.location.pathname;
    const currentSearch = window.location.search;
    
    // Replace parameters in the current path
    let newPath = currentPath;
    Object.entries(params).forEach(([key, value]) => {
      // Simple parameter replacement - in reality, you'd need proper route matching
      const _paramPattern = new RegExp(`/([^/]*)`);
      if (currentPath.includes(`/:${key}`)) {
        newPath = currentPath.replace(`/:${key}`, `/${value}`);
      }
    });

    const newUrl = newPath + currentSearch + window.location.hash;
    this.navigate(newUrl, { replace: true });
  }

  /**
   * Update query parameters
   */
  updateSearch(search: string): void {
    const newUrl = window.location.pathname + search + window.location.hash;
    this.navigate(newUrl, { replace: true });
  }

  /**
   * Get router type identifier
   */
  getRouterType(): string {
    return 'react-router-v6';
  }

  /**
   * Notify all listeners of state changes
   */
  private notifyListeners(): void {
    const state = this.getCurrentState();
    if (state) {
      this.listeners.forEach(listener => {
        try {
          listener(state);
        } catch (error) {
          console.error('Error in router listener:', error);
        }
      });
    }
  }

  /**
   * Get current route matches
   */
  private getMatches(): RouteMatch[] {
    try {
      // Simplified match extraction
      const pathname = window.location.pathname;
      const routes = this.getRouteTree();
      
      return this.matchRoutes(routes, pathname);
    } catch (error) {
      console.error('Error getting matches:', error);
      return [];
    }
  }

  /**
   * Match routes against current pathname
   */
  private matchRoutes(routes: RouteInfo[], pathname: string): RouteMatch[] {
    const matches: RouteMatch[] = [];
    
    const findMatches = (routeList: RouteInfo[], basePath = ''): void => {
      for (const route of routeList) {
        const fullPath = basePath + route.path;
        const pathPattern = this.createPathPattern(fullPath);
        
        if (pathPattern.test(pathname)) {
          const params = this.extractParams(fullPath, pathname);
          
          matches.push({
            id: route.id,
            pathname: pathname,
            pathnameBase: basePath,
            route: route,
            params: params,
            data: undefined,
            handle: route.handle
          });
        }
        
        if (route.children) {
          findMatches(route.children, fullPath);
        }
      }
    };
    
    findMatches(routes);
    return matches;
  }

  /**
   * Create a regex pattern for route matching
   */
  private createPathPattern(path: string): RegExp {
    const pattern = path
      .replace(/:[^/]+/g, '[^/]+') // Replace :param with match pattern
      .replace(/\*/g, '.*'); // Replace * with match-all
    
    return new RegExp(`^${pattern}$`);
  }

  /**
   * Extract parameters from a matched path
   */
  private extractParams(routePath: string, actualPath: string): Record<string, string> {
    const params: Record<string, string> = {};
    const routeParts = routePath.split('/');
    const actualParts = actualPath.split('/');
    
    routeParts.forEach((part, index) => {
      if (part.startsWith(':')) {
        const paramName = part.slice(1);
        params[paramName] = actualParts[index] || '';
      }
    });
    
    return params;
  }

  /**
   * Get loader data for matches
   */
  private getLoaderData(matches: RouteMatch[]): Record<string, unknown> {
    // Simplified - in reality, you'd extract actual loader data
    const loaderData: Record<string, unknown> = {};
    
    matches.forEach(match => {
      if (match.route.loader) {
        loaderData[match.id] = {}; // Placeholder
      }
    });
    
    return loaderData;
  }

  /**
   * Convert React Router routes to RouteInfo format
   */
  private convertRoutesToRouteInfo(routes: unknown[]): RouteInfo[] {
    return routes.map(route => this.convertRouteToRouteInfo(route));
  }

  /**
   * Convert a single React Router route to RouteInfo
   */
  private convertRouteToRouteInfo(route: unknown): RouteInfo {
    const r = route as any;
    return {
      id: r.id || this.generateRouteId(r.path),
      path: r.path || '',
      element: r.element?.type?.name || r.element?.name || 'Unknown',
      index: r.index,
      caseSensitive: r.caseSensitive,
      children: r.children ? this.convertRoutesToRouteInfo(r.children) : [],
      loader: !!r.loader,
      action: !!r.action,
      errorElement: r.errorElement?.type?.name || r.errorElement?.name,
      handle: r.handle
    };
  }

  /**
   * Extract routes from current location (fallback method)
   */
  private extractRoutesFromLocation(): RouteInfo[] {
    const pathname = window.location.pathname;
    const segments = pathname.split('/').filter(Boolean);
    
    // Create a basic route structure based on URL segments
    const routes: RouteInfo[] = [];
    let currentPath = '';
    
    segments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      routes.push({
        id: `route-${index}`,
        path: currentPath,
        element: 'Unknown',
        children: []
      });
    });
    
    return routes;
  }

  /**
   * Generate a unique route ID
   */
  private generateRouteId(path: string): string {
    return `route-${path?.replace(/[^a-zA-Z0-9]/g, '-') || 'unknown'}-${Date.now()}`;
  }

  /**
   * Generate a unique location key
   */
  private generateLocationKey(): string {
    return `location-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Create and register a React Router adapter
 */
export function createReactRouterAdapter(): ReactRouterAdapter {
  return new ReactRouterAdapter();
}