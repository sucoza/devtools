import React, { useState } from 'react';
import { clsx } from 'clsx';
import { 
  Component, 
  FileText, 
  TrendingUp, 
  Settings,
  ChevronRight,
  ChevronDown,
  Clock,
  Hash,
  Code
} from 'lucide-react';
import { useDesignSystemInspector, useFilteredData, useComponentStats } from '../../hooks';

export function ComponentsTab() {
  const { state, actions } = useDesignSystemInspector();
  const filteredData = useFilteredData(state);
  const componentStats = useComponentStats(filteredData.components);
  const [selectedComponent, setSelectedComponent] = useState<string | undefined>(
    state.ui.selectedComponent
  );
  const [expandedComponents, setExpandedComponents] = useState<Set<string>>(new Set());

  const handleSelectComponent = (componentId: string | undefined) => {
    setSelectedComponent(componentId);
    actions.selectComponent(componentId);
  };

  const toggleComponentExpanded = (componentId: string) => {
    const newExpanded = new Set(expandedComponents);
    if (newExpanded.has(componentId)) {
      newExpanded.delete(componentId);
    } else {
      newExpanded.add(componentId);
    }
    setExpandedComponents(newExpanded);
  };

  const selectedComponentData = selectedComponent 
    ? filteredData.components.find(c => c.id === selectedComponent)
    : null;

  return (
    <div className="flex h-full">
      {/* Component List */}
      <div className="flex-none w-80 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Components ({filteredData.components.length})
          </h3>
          
          {/* Stats */}
          <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
            <div className="bg-white dark:bg-gray-900 rounded-lg p-3">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {componentStats.totalUsage}
              </div>
              <div className="text-gray-500 dark:text-gray-400">Total Usage</div>
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-lg p-3">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {Math.round(componentStats.averageUsage)}
              </div>
              <div className="text-gray-500 dark:text-gray-400">Avg Usage</div>
            </div>
          </div>
        </div>
        
        <div className="overflow-y-auto flex-1">
          {filteredData.components.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              <Component className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No components found</p>
              <p className="text-sm">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="p-2">
              {filteredData.components.map((component) => (
                <ComponentListItem
                  key={component.id}
                  component={component}
                  isSelected={selectedComponent === component.id}
                  isExpanded={expandedComponents.has(component.id)}
                  onSelect={handleSelectComponent}
                  onToggleExpanded={toggleComponentExpanded}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Component Details */}
      <div className="flex-1 overflow-y-auto">
        {selectedComponentData ? (
          <ComponentDetails component={selectedComponentData} />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
            <div className="text-center">
              <Component className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">Select a component</p>
              <p>Choose a component from the list to view its details</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ComponentListItem({
  component,
  isSelected,
  isExpanded,
  onSelect,
  onToggleExpanded
}: {
  component: import('../../types').ComponentUsage;
  isSelected: boolean;
  isExpanded: boolean;
  onSelect: (id: string) => void;
  onToggleExpanded: (id: string) => void;
}) {
  return (
    <div className="mb-2">
      <div
        className={clsx(
          'p-3 rounded-lg cursor-pointer transition-colors border',
          isSelected
            ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
            : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
        )}
        onClick={() => onSelect(component.id)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center flex-1 min-w-0">
            <Component className={clsx(
              'w-4 h-4 mr-2 flex-none',
              isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'
            )} />
            <div className="min-w-0 flex-1">
              <div className="font-medium text-gray-900 dark:text-white truncate">
                {component.displayName}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                {component.name}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2 ml-2">
            <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-1 rounded">
              {component.usageCount}x
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleExpanded(component.id);
              }}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
        
        {isExpanded && (
          <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700 text-xs">
            <div className="flex items-center text-gray-500 dark:text-gray-400 mb-1">
              <FileText className="w-3 h-3 mr-1" />
              {component.filePath}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500 dark:text-gray-400">
                {component.props.length} props
              </span>
              <span className="text-gray-500 dark:text-gray-400">
                {component.variants.length} variants
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ComponentDetails({ 
  component 
}: { 
  component: import('../../types').ComponentUsage 
}) {
  const [activeSection, setActiveSection] = useState<'overview' | 'props' | 'variants' | 'usage'>('overview');

  const sections = [
    { id: 'overview', label: 'Overview', icon: Component },
    { id: 'props', label: 'Props', icon: Settings },
    { id: 'variants', label: 'Variants', icon: Code },
    { id: 'usage', label: 'Usage', icon: TrendingUp },
  ] as const;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex-none border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {component.displayName}
            </h2>
            <div className="flex items-center mt-2 space-x-4 text-sm text-gray-500 dark:text-gray-400">
              <span className="flex items-center">
                <FileText className="w-4 h-4 mr-1" />
                {component.filePath}
              </span>
              <span className="flex items-center">
                <Hash className="w-4 h-4 mr-1" />
                {component.usageCount} uses
              </span>
              <span className="flex items-center">
                <Clock className="w-4 h-4 mr-1" />
                Last seen {formatRelativeTime(component.lastSeen)}
              </span>
            </div>
          </div>
        </div>
        
        {/* Section Navigation */}
        <div className="flex space-x-1 mt-4">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id as any)}
              className={clsx(
                'flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                activeSection === section.id
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
              )}
            >
              <section.icon className="w-4 h-4 mr-2" />
              {section.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeSection === 'overview' && (
          <ComponentOverview component={component} />
        )}
        {activeSection === 'props' && (
          <ComponentProps component={component} />
        )}
        {activeSection === 'variants' && (
          <ComponentVariants component={component} />
        )}
        {activeSection === 'usage' && (
          <ComponentUsage component={component} />
        )}
      </div>
    </div>
  );
}

function ComponentOverview({ 
  component 
}: { 
  component: import('../../types').ComponentUsage 
}) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {component.usageCount}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Times Used</div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {component.props.length}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Props</div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {component.variants.length}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Variants</div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Component Information
        </h3>
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Name</dt>
            <dd className="mt-1 text-sm text-gray-900 dark:text-white">{component.name}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Display Name</dt>
            <dd className="mt-1 text-sm text-gray-900 dark:text-white">{component.displayName}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">File Path</dt>
            <dd className="mt-1 text-sm text-gray-900 dark:text-white font-mono text-xs">
              {component.filePath}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">First Seen</dt>
            <dd className="mt-1 text-sm text-gray-900 dark:text-white">
              {formatRelativeTime(component.firstSeen)}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}

function ComponentProps({ 
  component 
}: { 
  component: import('../../types').ComponentUsage 
}) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
        Props Usage ({component.props.length})
      </h3>
      
      {component.props.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">No props detected for this component.</p>
      ) : (
        <div className="space-y-4">
          {component.props.map((prop) => (
            <div key={prop.name} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900 dark:text-white">
                  {prop.name}
                  {prop.isRequired && (
                    <span className="ml-2 text-xs bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 px-2 py-1 rounded">
                      Required
                    </span>
                  )}
                </h4>
                <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                  <span>{prop.type}</span>
                  <span>•</span>
                  <span>{prop.usageCount} uses</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">Values:</h5>
                <div className="grid grid-cols-1 gap-2">
                  {prop.values.slice(0, 5).map((value, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 rounded p-2">
                      <code className="text-sm text-gray-700 dark:text-gray-300">
                        {value.value}
                      </code>
                      <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                        <span>{value.count}x</span>
                        <span>({value.percentage.toFixed(1)}%)</span>
                      </div>
                    </div>
                  ))}
                  {prop.values.length > 5 && (
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      +{prop.values.length - 5} more values
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ComponentVariants({ 
  component 
}: { 
  component: import('../../types').ComponentUsage 
}) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
        Variants ({component.variants.length})
      </h3>
      
      {component.variants.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">No variants detected for this component.</p>
      ) : (
        <div className="space-y-3">
          {component.variants.map((variant, index) => (
            <div key={index} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900 dark:text-white">
                  Variant {index + 1}
                </h4>
                <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                  <span>{variant.count} uses</span>
                  <span>•</span>
                  <span>{variant.percentage.toFixed(1)}%</span>
                </div>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-700 rounded p-3">
                <pre className="text-sm text-gray-700 dark:text-gray-300 overflow-x-auto">
                  {JSON.stringify(variant.props, null, 2)}
                </pre>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ComponentUsage({ 
  component 
}: { 
  component: import('../../types').ComponentUsage 
}) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
        Usage Analysis
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <h4 className="font-medium text-gray-900 dark:text-white mb-3">Timeline</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">First seen:</span>
              <span className="text-gray-900 dark:text-white">{formatRelativeTime(component.firstSeen)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Last seen:</span>
              <span className="text-gray-900 dark:text-white">{formatRelativeTime(component.lastSeen)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Total usage:</span>
              <span className="text-gray-900 dark:text-white">{component.usageCount}x</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <h4 className="font-medium text-gray-900 dark:text-white mb-3">Recommendations</h4>
          <div className="space-y-2 text-sm">
            {component.usageCount === 1 && (
              <div className="text-yellow-600 dark:text-yellow-400">
                • Component used only once - consider if it should be abstracted
              </div>
            )}
            {component.usageCount > 20 && (
              <div className="text-green-600 dark:text-green-400">
                • High usage component - good candidate for documentation
              </div>
            )}
            {component.props.length === 0 && (
              <div className="text-blue-600 dark:text-blue-400">
                • Consider adding props to make this component more flexible
              </div>
            )}
            {component.variants.length > 10 && (
              <div className="text-orange-600 dark:text-orange-400">
                • Many variants detected - consider standardizing usage patterns
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days} day${days !== 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  return 'Just now';
}