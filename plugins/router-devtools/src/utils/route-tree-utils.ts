/**
 * Utility functions for route tree manipulation and visualization
 */

import { RouteInfo, RouteTreeNode, RouteMatch } from '../types/router';

/**
 * Convert RouteInfo array to RouteTreeNode array for visualization
 */
export function convertToRouteTree(
  routes: RouteInfo[], 
  matches: RouteMatch[] = [],
  basePath = '',
  level = 0
): RouteTreeNode[] {
  return routes.map(route => {
    const fullPath = basePath + route.path;
    const isMatched = matches.some(match => match.route.id === route.id);
    const matchData = matches.find(match => match.route.id === route.id);
    
    return {
      id: route.id,
      path: route.path,
      fullPath,
      element: route.element,
      index: route.index,
      children: route.children ? convertToRouteTree(
        route.children, 
        matches, 
        fullPath,
        level + 1
      ) : [],
      isActive: isMatched,
      isMatched,
      params: matchData?.params,
      data: matchData?.data,
      level
    };
  });
}

/**
 * Find a route node by ID in the tree
 */
export function findRouteNode(
  nodes: RouteTreeNode[], 
  id: string
): RouteTreeNode | null {
  for (const node of nodes) {
    if (node.id === id) {
      return node;
    }
    
    if (node.children.length > 0) {
      const found = findRouteNode(node.children, id);
      if (found) {
        return found;
      }
    }
  }
  
  return null;
}

/**
 * Get all active routes in the tree
 */
export function getActiveRoutes(nodes: RouteTreeNode[]): RouteTreeNode[] {
  const activeRoutes: RouteTreeNode[] = [];
  
  const traverse = (nodeList: RouteTreeNode[]) => {
    for (const node of nodeList) {
      if (node.isActive) {
        activeRoutes.push(node);
      }
      if (node.children.length > 0) {
        traverse(node.children);
      }
    }
  };
  
  traverse(nodes);
  return activeRoutes;
}

/**
 * Get the breadcrumb path for an active route
 */
export function getRouteBreadcrumbs(
  nodes: RouteTreeNode[], 
  targetId: string
): RouteTreeNode[] {
  const breadcrumbs: RouteTreeNode[] = [];
  
  const findPath = (nodeList: RouteTreeNode[], path: RouteTreeNode[]): boolean => {
    for (const node of nodeList) {
      const currentPath = [...path, node];
      
      if (node.id === targetId) {
        breadcrumbs.push(...currentPath);
        return true;
      }
      
      if (node.children.length > 0) {
        if (findPath(node.children, currentPath)) {
          return true;
        }
      }
    }
    
    return false;
  };
  
  findPath(nodes, []);
  return breadcrumbs;
}

/**
 * Filter routes based on search query
 */
export function filterRoutes(
  nodes: RouteTreeNode[], 
  query: string
): RouteTreeNode[] {
  if (!query.trim()) {
    return nodes;
  }
  
  const lowerQuery = query.toLowerCase();
  
  const filterNode = (node: RouteTreeNode): RouteTreeNode | null => {
    const matches = 
      node.path.toLowerCase().includes(lowerQuery) ||
      node.fullPath.toLowerCase().includes(lowerQuery) ||
      (node.element && node.element.toLowerCase().includes(lowerQuery));
    
    const filteredChildren = node.children
      .map(filterNode)
      .filter((child): child is RouteTreeNode => child !== null);
    
    if (matches || filteredChildren.length > 0) {
      return {
        ...node,
        children: filteredChildren
      };
    }
    
    return null;
  };
  
  return nodes
    .map(filterNode)
    .filter((node): node is RouteTreeNode => node !== null);
}

/**
 * Get route statistics
 */
export function getRouteStatistics(nodes: RouteTreeNode[]): {
  totalRoutes: number;
  activeRoutes: number;
  matchedRoutes: number;
  maxDepth: number;
} {
  let totalRoutes = 0;
  let activeRoutes = 0;
  let matchedRoutes = 0;
  let maxDepth = 0;
  
  const traverse = (nodeList: RouteTreeNode[], depth = 0) => {
    maxDepth = Math.max(maxDepth, depth);
    
    for (const node of nodeList) {
      totalRoutes++;
      
      if (node.isActive) {
        activeRoutes++;
      }
      
      if (node.isMatched) {
        matchedRoutes++;
      }
      
      if (node.children.length > 0) {
        traverse(node.children, depth + 1);
      }
    }
  };
  
  traverse(nodes);
  
  return {
    totalRoutes,
    activeRoutes,
    matchedRoutes,
    maxDepth
  };
}

/**
 * Sort routes by various criteria
 */
export function sortRoutes(
  nodes: RouteTreeNode[], 
  sortBy: 'path' | 'element' | 'active' = 'path'
): RouteTreeNode[] {
  const sortedNodes = [...nodes].sort((a, b) => {
    switch (sortBy) {
      case 'path':
        return a.path.localeCompare(b.path);
      case 'element':
        return (a.element || '').localeCompare(b.element || '');
      case 'active':
        if (a.isActive && !b.isActive) return -1;
        if (!a.isActive && b.isActive) return 1;
        return a.path.localeCompare(b.path);
      default:
        return 0;
    }
  });
  
  // Recursively sort children
  return sortedNodes.map(node => ({
    ...node,
    children: node.children.length > 0 ? sortRoutes(node.children, sortBy) : []
  }));
}