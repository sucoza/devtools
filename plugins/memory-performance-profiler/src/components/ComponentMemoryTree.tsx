import React, { useState, useMemo } from 'react';
import { clsx } from 'clsx';
import { 
  ChevronRight, 
  ChevronDown, 
  Component, 
  MemoryStick, 
  Clock, 
  AlertTriangle,
  TrendingUp,
  Search,
  Filter
} from 'lucide-react';
import type { ComponentMemoryData } from '../types';

export interface ComponentMemoryTreeProps {
  componentTree: ComponentMemoryData[];
  onSelectComponent?: (componentId: string) => void;
  selectedComponent?: string | null;
  className?: string;
}

export function ComponentMemoryTree({ 
  componentTree, 
  onSelectComponent, 
  selectedComponent,
  className 
}: ComponentMemoryTreeProps) {
  const [expandedComponents, setExpandedComponents] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'memory' | 'renders'>('memory');
  const [showOnlyWarnings, setShowOnlyWarnings] = useState(false);

  const formatMemory = (bytes: number): string => {
    if (bytes >= 1024 * 1024) {
      return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
    }
    return `${(bytes / 1024).toFixed(0)}KB`;
  };

  const formatTime = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;
    if (diff < 1000) return 'just now';
    if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`;
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    return new Date(timestamp).toLocaleTimeString();
  };

  const filteredAndSortedComponents = useMemo(() => {
    let filtered = componentTree;

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(component =>
        component.componentName.toLowerCase().includes(query)
      );
    }

    // Apply warnings filter
    if (showOnlyWarnings) {
      filtered = filtered.filter(component => component.warnings.length > 0);
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.componentName.localeCompare(b.componentName);
        case 'memory':
          return b.memoryUsage - a.memoryUsage;
        case 'renders':
          return b.renderCount - a.renderCount;
        default:
          return 0;
      }
    });

    return sorted;
  }, [componentTree, searchQuery, sortBy, showOnlyWarnings]);

  const toggleExpanded = (componentId: string) => {
    const newExpanded = new Set(expandedComponents);
    if (newExpanded.has(componentId)) {
      newExpanded.delete(componentId);
    } else {
      newExpanded.add(componentId);
    }
    setExpandedComponents(newExpanded);
  };

  const handleSelectComponent = (componentId: string) => {
    onSelectComponent?.(componentId);
  };

  const getMemoryBarWidth = (memoryUsage: number): number => {
    if (componentTree.length === 0) return 0;
    const maxMemory = Math.max(...componentTree.map(c => c.memoryUsage));
    return (memoryUsage / maxMemory) * 100;
  };

  const getMemoryColor = (memoryUsage: number): string => {
    const width = getMemoryBarWidth(memoryUsage);
    if (width > 80) return 'bg-red-500';
    if (width > 60) return 'bg-yellow-500';
    if (width > 40) return 'bg-blue-500';
    return 'bg-green-500';
  };

  const ComponentRow: React.FC<{ 
    component: ComponentMemoryData; 
    depth?: number;
  }> = ({ component, depth = 0 }) => {
    const isExpanded = expandedComponents.has(component.id);
    const hasChildren = component.children && component.children.length > 0;
    const isSelected = selectedComponent === component.id;
    const hasWarnings = component.warnings.length > 0;

    return (
      <div className="select-none">
        <div
          className={clsx(
            "flex items-center py-2 px-3 rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors",
            isSelected && "bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-600",
            hasWarnings && !isSelected && "bg-red-50 dark:bg-red-900/20"
          )}
          style={{ marginLeft: `${depth * 20}px` }}
          onClick={() => handleSelectComponent(component.id)}
        >
          {/* Expand/Collapse Button */}
          <div className="w-5 flex justify-center">
            {hasChildren && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleExpanded(component.id);
                }}
                className="p-0.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
              >
                {isExpanded ? (
                  <ChevronDown className="h-3 w-3" />
                ) : (
                  <ChevronRight className="h-3 w-3" />
                )}
              </button>
            )}
          </div>

          {/* Component Icon */}
          <Component className="h-4 w-4 text-blue-500 mx-2 flex-shrink-0" />

          {/* Component Name */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <span className="font-medium text-sm truncate">
                {component.componentName}
              </span>
              {hasWarnings && (
                <AlertTriangle className="h-3 w-3 text-red-500 flex-shrink-0" />
              )}
            </div>
          </div>

          {/* Memory Usage */}
          <div className="flex items-center space-x-3 text-xs text-gray-600 dark:text-gray-400">
            <div className="flex items-center space-x-1">
              <MemoryStick className="h-3 w-3" />
              <span className="w-12 text-right">{formatMemory(component.memoryUsage)}</span>
            </div>

            <div className="flex items-center space-x-1">
              <TrendingUp className="h-3 w-3" />
              <span className="w-8 text-right">{component.renderCount}</span>
            </div>

            <div className="flex items-center space-x-1">
              <Clock className="h-3 w-3" />
              <span className="w-16 text-right">{formatTime(component.lastRenderTime)}</span>
            </div>
          </div>

          {/* Memory Bar */}
          <div className="w-16 ml-2">
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className={clsx("h-full transition-all", getMemoryColor(component.memoryUsage))}
                style={{ width: `${getMemoryBarWidth(component.memoryUsage)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Children */}
        {isExpanded && hasChildren && (
          <div>
            {component.children.map((child) => (
              <ComponentRow
                key={child.id}
                component={child}
                depth={depth + 1}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  if (componentTree.length === 0) {
    return (
      <div className={clsx("flex items-center justify-center h-64 text-gray-500", className)}>
        <div className="text-center">
          <Component className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>No component data available</p>
          <p className="text-sm mt-1">Components will appear here when profiling is active</p>
        </div>
      </div>
    );
  }

  return (
    <div className={clsx("space-y-4", className)}>
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
          <div>
            <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Total Components</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {componentTree.length}
            </p>
          </div>
        </div>

        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
          <div>
            <p className="text-sm font-medium text-green-900 dark:text-green-100">Total Memory</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {formatMemory(componentTree.reduce((sum, c) => sum + c.memoryUsage, 0))}
            </p>
          </div>
        </div>

        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3">
          <div>
            <p className="text-sm font-medium text-purple-900 dark:text-purple-100">With Warnings</p>
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {componentTree.filter(c => c.warnings.length > 0).length}
            </p>
          </div>
        </div>

        <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3">
          <div>
            <p className="text-sm font-medium text-orange-900 dark:text-orange-100">Total Renders</p>
            <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {componentTree.reduce((sum, c) => sum + c.renderCount, 0)}
            </p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* Search */}
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search components..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Sort By */}
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'name' | 'memory' | 'renders')}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="name">Name</option>
              <option value="memory">Memory Usage</option>
              <option value="renders">Render Count</option>
            </select>
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowOnlyWarnings(!showOnlyWarnings)}
            className={clsx(
              "flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
              showOnlyWarnings
                ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300"
            )}
          >
            <Filter className="h-4 w-4" />
            <span>Warnings Only</span>
          </button>
        </div>
      </div>

      {/* Component Tree */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Component Tree</h3>
            <div className="text-sm text-gray-500">
              {filteredAndSortedComponents.length} components
            </div>
          </div>
        </div>

        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {filteredAndSortedComponents.map((component) => (
            <ComponentRow
              key={component.id}
              component={component}
            />
          ))}
        </div>

        {filteredAndSortedComponents.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            <Component className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No components match your filters</p>
          </div>
        )}
      </div>
    </div>
  );
}