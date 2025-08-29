import React from 'react';
import { FilterPanel as SharedFilterPanel, FilterConfig } from '@sucoza/shared-components';
import { useInterceptor } from '../hooks/useInterceptor';
import type { HttpMethod } from '../types';

/**
 * Filter panel for API calls - now using shared component
 */
export function FilterPanel() {
  const { state, actions } = useInterceptor();

  const httpMethods: HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];
  const commonStatusCodes = [200, 201, 204, 400, 401, 403, 404, 409, 422, 429, 500, 502, 503, 504];

  // Configure filter options for the shared component
  const filterConfig: FilterConfig = {
    searchText: state.ui.filter.url,
    timeRange: state.ui.filter.timeRange,
    options: [
      {
        key: 'method',
        label: 'HTTP Methods',
        values: httpMethods.map(method => ({ value: method, label: method })),
        multiple: true,
      },
      {
        key: 'status',
        label: 'Status Codes',
        values: commonStatusCodes.map(status => ({ value: status, label: String(status) })),
        multiple: true,
      },
      {
        key: 'isMocked',
        label: 'Mocked',
        values: [{ value: true, label: 'Mocked only' }],
        multiple: false,
      },
      {
        key: 'hasError',
        label: 'Errors',
        values: [{ value: true, label: 'Errors only' }],
        multiple: false,
      },
    ],
    // Pass current filter values
    method: state.ui.filter.method,
    status: state.ui.filter.status,
    isMocked: state.ui.filter.isMocked,
    hasError: state.ui.filter.hasError,
  };

  const handleFilterChange = (updates: Partial<FilterConfig>) => {
    // Map shared component updates back to plugin-specific filter format
    const pluginUpdates: any = {};
    
    if ('searchText' in updates) {
      pluginUpdates.url = updates.searchText;
    }
    
    if ('timeRange' in updates) {
      pluginUpdates.timeRange = updates.timeRange;
    }

    // Handle other filter updates
    Object.entries(updates).forEach(([key, value]) => {
      if (key !== 'searchText' && key !== 'timeRange' && key !== 'options') {
        pluginUpdates[key] = value;
      }
    });

    actions.updateFilter(pluginUpdates);
  };

  const clearAllFilters = () => {
    actions.updateFilter({
      method: undefined,
      status: undefined,
      url: undefined,
      timeRange: undefined,
      isMocked: undefined,
      hasError: undefined,
    });
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-gray-900 dark:text-white">Filters</h3>
        <button
          onClick={actions.toggleFilters}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          ×
        </button>
      </div>
      
      <SharedFilterPanel
        filter={filterConfig}
        onFilterChange={handleFilterChange}
        onClearFilters={clearAllFilters}
        placeholder="Filter by URL pattern..."
        className="bg-transparent border-0 p-0"
      />
    </div>
  );
}

export default FilterPanel;