import React, { useState } from 'react';
import { clsx } from 'clsx';
import { X, Calendar, Hash, Link, AlertCircle } from 'lucide-react';
import { useInterceptor } from '../hooks/useInterceptor';
import type { HttpMethod } from '../types';

/**
 * Filter panel for API calls
 */
export function FilterPanel() {
  const { state, actions } = useInterceptor();
  const [tempTimeRange, setTempTimeRange] = useState({
    start: '',
    end: '',
  });

  const httpMethods: HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];
  const commonStatusCodes = [200, 201, 204, 400, 401, 403, 404, 409, 422, 429, 500, 502, 503, 504];

  const handleMethodToggle = (method: HttpMethod) => {
    const currentMethods = state.ui.filter.method || [];
    const newMethods = currentMethods.includes(method)
      ? currentMethods.filter(m => m !== method)
      : [...currentMethods, method];
    
    actions.updateFilter({ method: newMethods.length > 0 ? newMethods : undefined });
  };

  const handleStatusToggle = (status: number) => {
    const currentStatuses = state.ui.filter.status || [];
    const newStatuses = currentStatuses.includes(status)
      ? currentStatuses.filter(s => s !== status)
      : [...currentStatuses, status];
    
    actions.updateFilter({ status: newStatuses.length > 0 ? newStatuses : undefined });
  };

  const handleTimeRangeApply = () => {
    if (tempTimeRange.start && tempTimeRange.end) {
      const start = new Date(tempTimeRange.start).getTime();
      const end = new Date(tempTimeRange.end).getTime();
      
      if (start <= end) {
        actions.updateFilter({ timeRange: { start, end } });
      }
    } else if (!tempTimeRange.start && !tempTimeRange.end) {
      actions.updateFilter({ timeRange: undefined });
    }
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
    setTempTimeRange({ start: '', end: '' });
  };

  const hasActiveFilters = !!(
    state.ui.filter.method?.length ||
    state.ui.filter.status?.length ||
    state.ui.filter.url ||
    state.ui.filter.timeRange ||
    state.ui.filter.isMocked !== undefined ||
    state.ui.filter.hasError !== undefined
  );

  const formatDateTimeLocal = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toISOString().slice(0, 16);
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-gray-900 dark:text-white">Filters</h3>
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Clear All
            </button>
          )}
          <button
            onClick={actions.toggleFilters}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {/* HTTP Methods */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <Hash className="w-4 h-4 inline mr-1" />
            HTTP Methods
          </label>
          <div className="flex flex-wrap gap-2">
            {httpMethods.map((method) => {
              const isSelected = state.ui.filter.method?.includes(method);
              return (
                <button
                  key={method}
                  onClick={() => handleMethodToggle(method)}
                  className={clsx(
                    'px-3 py-1 text-sm rounded border transition-colors',
                    isSelected
                      ? 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600'
                  )}
                >
                  {method}
                </button>
              );
            })}
          </div>
        </div>

        {/* Status Codes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Status Codes
          </label>
          <div className="flex flex-wrap gap-2">
            {commonStatusCodes.map((status) => {
              const isSelected = state.ui.filter.status?.includes(status);
              return (
                <button
                  key={status}
                  onClick={() => handleStatusToggle(status)}
                  className={clsx(
                    'px-3 py-1 text-sm rounded border transition-colors',
                    isSelected
                      ? 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600'
                  )}
                >
                  {status}
                </button>
              );
            })}
          </div>
        </div>

        {/* URL Pattern */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <Link className="w-4 h-4 inline mr-1" />
            URL Pattern
          </label>
          <input
            type="text"
            value={state.ui.filter.url || ''}
            onChange={(e) => actions.updateFilter({ url: e.target.value || undefined })}
            placeholder="Filter by URL pattern..."
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Time Range */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <Calendar className="w-4 h-4 inline mr-1" />
            Time Range
          </label>
          <div className="flex items-center gap-2">
            <input
              type="datetime-local"
              value={tempTimeRange.start || (state.ui.filter.timeRange ? formatDateTimeLocal(state.ui.filter.timeRange.start) : '')}
              onChange={(e) => setTempTimeRange(prev => ({ ...prev, start: e.target.value }))}
              className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <span className="text-gray-500 dark:text-gray-400">to</span>
            <input
              type="datetime-local"
              value={tempTimeRange.end || (state.ui.filter.timeRange ? formatDateTimeLocal(state.ui.filter.timeRange.end) : '')}
              onChange={(e) => setTempTimeRange(prev => ({ ...prev, end: e.target.value }))}
              className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={handleTimeRangeApply}
              className="px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Apply
            </button>
          </div>
        </div>

        {/* Toggle Filters */}
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={state.ui.filter.isMocked === true}
              onChange={(e) => actions.updateFilter({ isMocked: e.target.checked ? true : undefined })}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Mocked only</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={state.ui.filter.hasError === true}
              onChange={(e) => actions.updateFilter({ hasError: e.target.checked ? true : undefined })}
              className="w-4 h-4 text-red-600 bg-gray-100 border-gray-300 rounded focus:ring-red-500 dark:focus:ring-red-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              Errors only
            </span>
          </label>
        </div>
      </div>
    </div>
  );
}

export default FilterPanel;