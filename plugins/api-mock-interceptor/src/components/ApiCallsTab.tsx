import React, { useState } from 'react';
import { clsx } from 'clsx';
import { Filter, Search, ExternalLink, Clock, AlertCircle, CheckCircle } from 'lucide-react';
import { useInterceptor } from '../hooks/useInterceptor';
import type { ApiCall, HttpMethod } from '../types';
import { ApiCallDetails } from './ApiCallDetails';
import { FilterPanel } from './FilterPanel';

/**
 * API Calls tab component
 */
export function ApiCallsTab() {
  const { state, actions, selectors } = useInterceptor();
  const [searchQuery, setSearchQuery] = useState('');
  
  const filteredCalls = selectors.getFilteredApiCalls();
  const selectedCall = selectors.getSelectedCall();
  
  // Further filter by search query
  const searchFilteredCalls = filteredCalls.filter(call => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      call.request.url.toLowerCase().includes(query) ||
      call.request.method.toLowerCase().includes(query) ||
      (call.response?.status.toString().includes(query)) ||
      (call.error?.toLowerCase().includes(query))
    );
  });

  const getMethodColor = (method: HttpMethod) => {
    const colors = {
      GET: 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/30',
      POST: 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/30',
      PUT: 'text-yellow-600 bg-yellow-50 dark:text-yellow-400 dark:bg-yellow-900/30',
      PATCH: 'text-orange-600 bg-orange-50 dark:text-orange-400 dark:bg-orange-900/30',
      DELETE: 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/30',
      HEAD: 'text-gray-600 bg-gray-50 dark:text-gray-400 dark:bg-gray-900/30',
      OPTIONS: 'text-purple-600 bg-purple-50 dark:text-purple-400 dark:bg-purple-900/30',
    };
    return colors[method] || colors.GET;
  };

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) {
      return 'text-green-600 dark:text-green-400';
    } else if (status >= 300 && status < 400) {
      return 'text-yellow-600 dark:text-yellow-400';
    } else if (status >= 400 && status < 500) {
      return 'text-orange-600 dark:text-orange-400';
    } else if (status >= 500) {
      return 'text-red-600 dark:text-red-400';
    }
    return 'text-gray-600 dark:text-gray-400';
  };

  const formatDuration = (duration?: number) => {
    if (!duration) return '-';
    if (duration < 1000) return `${duration}ms`;
    return `${(duration / 1000).toFixed(2)}s`;
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const truncateUrl = (url: string, maxLength = 60) => {
    if (url.length <= maxLength) return url;
    return `${url.substring(0, maxLength)}...`;
  };

  return (
    <div className="flex h-full">
      {/* API Calls List */}
      <div className="flex-1 flex flex-col border-r border-gray-200 dark:border-gray-700">
        {/* Search and Filter Bar */}
        <div className="flex items-center gap-2 p-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search API calls..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={actions.toggleFilters}
            className={clsx(
              'flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors',
              state.ui.showFilters
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            )}
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>
        </div>

        {/* Filter Panel */}
        {state.ui.showFilters && <FilterPanel />}

        {/* API Calls List */}
        <div className="flex-1 overflow-auto">
          {searchFilteredCalls.length === 0 ? (
            <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
              <div className="text-center">
                <div className="text-lg font-medium mb-2">No API calls found</div>
                <div className="text-sm">
                  {!state.isInterceptionEnabled
                    ? 'Enable interception to start capturing API calls'
                    : 'Make some API requests to see them here'
                  }
                </div>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {searchFilteredCalls.map((call) => (
                <div
                  key={call.id}
                  onClick={() => actions.selectCall(call.id)}
                  className={clsx(
                    'p-3 cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50',
                    selectedCall?.id === call.id && 'bg-blue-50 dark:bg-blue-900/30'
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={clsx(
                          'px-2 py-1 text-xs font-medium rounded',
                          getMethodColor(call.request.method)
                        )}
                      >
                        {call.request.method}
                      </span>
                      
                      {call.response && (
                        <span className={clsx('text-sm font-medium', getStatusColor(call.response.status))}>
                          {call.response.status}
                        </span>
                      )}
                      
                      {call.error && (
                        <AlertCircle className="w-4 h-4 text-red-500" />
                      )}
                      
                      {call.isMocked && (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <span>{formatDuration(call.duration)}</span>
                      <Clock className="w-3 h-3" />
                      <span>{formatTimestamp(call.timestamp)}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-900 dark:text-white font-mono">
                      {truncateUrl(call.request.url)}
                    </span>
                    <ExternalLink className="w-4 h-4 text-gray-400" />
                  </div>
                  
                  {call.error && (
                    <div className="mt-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 p-2 rounded">
                      {call.error}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* API Call Details */}
      <div className="w-1/2">
        {selectedCall ? (
          <ApiCallDetails call={selectedCall} />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
            <div className="text-center">
              <div className="text-lg font-medium mb-2">Select an API call</div>
              <div className="text-sm">Click on an API call to view its details</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ApiCallsTab;