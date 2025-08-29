import React from 'react';
import { 
  Search, 
  Filter, 
  Clock, 
  AlertCircle, 
  CheckCircle, 
  Loader,
  Settings,
  Zap,
  Eye,
  Trash2,
  Copy,
  Play
} from 'lucide-react';
import type { GraphQLOperation } from '../../types';

interface OperationListProps {
  operations: GraphQLOperation[];
  selectedOperation?: string;
  onOperationSelect: (id: string) => void;
  onOperationDelete: (id: string) => void;
  onClearOperations: () => void;
  onCopyOperation: (operation: GraphQLOperation) => void;
  onReplayOperation?: (operation: GraphQLOperation) => void;
  showFilters: boolean;
  onToggleFilters: () => void;
  filters: {
    operationType?: 'query' | 'mutation' | 'subscription';
    status?: 'pending' | 'success' | 'error';
    timeRange?: number;
    searchTerm?: string;
  };
  onUpdateFilters: (filters: any) => void;
}

export const OperationList: React.FC<OperationListProps> = ({
  operations,
  selectedOperation,
  onOperationSelect,
  onOperationDelete,
  onClearOperations,
  onCopyOperation,
  onReplayOperation,
  showFilters,
  onToggleFilters,
  filters,
  onUpdateFilters
}) => {
  const getOperationIcon = (type: string) => {
    switch (type) {
      case 'mutation':
        return <Settings size={16} className="text-purple-500" />;
      case 'subscription':
        return <Zap size={16} className="text-orange-500" />;
      default:
        return <Eye size={16} className="text-blue-500" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle size={16} className="text-green-500" />;
      case 'error':
        return <AlertCircle size={16} className="text-red-500" />;
      case 'pending':
        return <Loader size={16} className="text-yellow-500 animate-spin" />;
      default:
        return <Clock size={16} className="text-gray-400" />;
    }
  };

  const formatExecutionTime = (time?: number) => {
    if (!time) return '-';
    if (time < 1000) return `${Math.round(time)}ms`;
    return `${(time / 1000).toFixed(2)}s`;
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const truncateQuery = (query: string, maxLength = 100) => {
    if (query.length <= maxLength) return query;
    return query.substring(0, maxLength) + '...';
  };

  const filteredOperations = React.useMemo(() => {
    return operations.filter(operation => {
      if (filters.operationType && operation.operationType !== filters.operationType) {
        return false;
      }
      
      if (filters.status && operation.status !== filters.status) {
        return false;
      }
      
      if (filters.timeRange) {
        const cutoff = Date.now() - filters.timeRange;
        if (operation.timestamp < cutoff) {
          return false;
        }
      }
      
      if (filters.searchTerm) {
        const searchTerm = filters.searchTerm.toLowerCase();
        return (
          (operation.operationName && operation.operationName.toLowerCase().includes(searchTerm)) ||
          operation.query.toLowerCase().includes(searchTerm) ||
          (operation.error && operation.error.toLowerCase().includes(searchTerm))
        );
      }
      
      return true;
    });
  }, [operations, filters]);

  return (
    <div className="flex flex-col h-full">
      {/* Header with controls */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Operations ({filteredOperations.length})
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={onToggleFilters}
              className={`p-2 rounded-md transition-colors ${
                showFilters
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
              title="Toggle filters"
            >
              <Filter size={16} />
            </button>
            <button
              onClick={onClearOperations}
              disabled={operations.length === 0}
              className="p-2 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Clear all operations"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                value={filters.searchTerm || ''}
                onChange={(e) => onUpdateFilters({ searchTerm: e.target.value })}
                placeholder="Search operations..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <select
                value={filters.operationType || ''}
                onChange={(e) => onUpdateFilters({ operationType: e.target.value || undefined })}
                className="text-sm px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              >
                <option value="">All types</option>
                <option value="query">Query</option>
                <option value="mutation">Mutation</option>
                <option value="subscription">Subscription</option>
              </select>

              <select
                value={filters.status || ''}
                onChange={(e) => onUpdateFilters({ status: e.target.value || undefined })}
                className="text-sm px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              >
                <option value="">All statuses</option>
                <option value="success">Success</option>
                <option value="error">Error</option>
                <option value="pending">Pending</option>
              </select>

              <select
                value={filters.timeRange || ''}
                onChange={(e) => onUpdateFilters({ timeRange: e.target.value ? Number(e.target.value) : undefined })}
                className="text-sm px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              >
                <option value="">All time</option>
                <option value={3600000}>Last hour</option>
                <option value={86400000}>Last day</option>
                <option value={604800000}>Last week</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Operations list */}
      <div className="flex-1 overflow-auto">
        {filteredOperations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <Eye size={48} className="text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              No Operations Found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 max-w-sm">
              {operations.length === 0 
                ? 'GraphQL operations will appear here as they are executed'
                : 'No operations match your current filters'
              }
            </p>
          </div>
        ) : (
          <div className="p-2 space-y-2">
            {filteredOperations.map((operation) => (
              <div
                key={operation.id}
                onClick={() => onOperationSelect(operation.id)}
                className={`p-3 rounded-lg cursor-pointer transition-colors border ${
                  selectedOperation === operation.id
                    ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700'
                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {getOperationIcon(operation.operationType)}
                    <span className="font-medium text-gray-900 dark:text-gray-100 truncate">
                      {operation.operationName || `${operation.operationType}Operation`}
                    </span>
                    {getStatusIcon(operation.status)}
                  </div>
                  
                  <div className="flex items-center gap-1 ml-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onCopyOperation(operation);
                      }}
                      className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded transition-colors"
                      title="Copy operation"
                    >
                      <Copy size={14} />
                    </button>
                    
                    {onReplayOperation && operation.status !== 'pending' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onReplayOperation(operation);
                        }}
                        className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded transition-colors"
                        title="Replay operation"
                      >
                        <Play size={14} />
                      </button>
                    )}
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOperationDelete(operation.id);
                      }}
                      className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded transition-colors"
                      title="Delete operation"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  <code className="text-xs bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded">
                    {truncateQuery(operation.query.trim())}
                  </code>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-3">
                    <span>{formatTimestamp(operation.timestamp)}</span>
                    <span>{formatExecutionTime(operation.executionTime)}</span>
                  </div>
                  
                  {operation.error && (
                    <span className="text-red-500 truncate max-w-32">
                      {operation.error}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};