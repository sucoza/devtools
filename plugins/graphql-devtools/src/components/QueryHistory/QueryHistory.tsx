import React from 'react';
import { History, TrendingUp, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { OperationList } from './OperationList';
import { OperationDetails } from './OperationDetails';
import type { GraphQLOperation, PerformanceMetrics } from '../../types';

interface QueryHistoryProps {
  operations: GraphQLOperation[];
  performance: PerformanceMetrics;
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

export const QueryHistory: React.FC<QueryHistoryProps> = ({
  operations,
  performance,
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
  const selectedOperationData = selectedOperation 
    ? operations.find(op => op.id === selectedOperation)
    : undefined;

  const formatExecutionTime = (time: number) => {
    if (time < 1000) return `${Math.round(time)}ms`;
    return `${(time / 1000).toFixed(2)}s`;
  };

  const getSuccessRate = () => {
    const total = performance.totalOperations;
    if (total === 0) return 0;
    return Math.round((performance.successfulOperations / total) * 100);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Performance metrics header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <History size={20} className="text-blue-500" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              Operation History
            </h2>
          </div>
          
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Last 24 hours
          </div>
        </div>

        {/* Performance stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp size={16} className="text-blue-500" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Total</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {performance.totalOperations}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              operations
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle size={16} className="text-green-500" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Success</span>
            </div>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {getSuccessRate()}%
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {performance.successfulOperations} successful
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-1">
              <AlertCircle size={16} className="text-red-500" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Errors</span>
            </div>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {performance.failedOperations}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              failed operations
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-1">
              <Clock size={16} className="text-purple-500" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Avg Time</span>
            </div>
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {formatExecutionTime(performance.averageExecutionTime)}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              execution time
            </div>
          </div>
        </div>

        {/* Operation type breakdown */}
        <div className="mt-4 flex items-center gap-6 text-sm">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-gray-600 dark:text-gray-400">
              Queries: {performance.operationsByType.queries}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
            <span className="text-gray-600 dark:text-gray-400">
              Mutations: {performance.operationsByType.mutations}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
            <span className="text-gray-600 dark:text-gray-400">
              Subscriptions: {performance.operationsByType.subscriptions}
            </span>
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left panel - Operations list */}
        <div className="w-80 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
          <OperationList
            operations={operations}
            selectedOperation={selectedOperation}
            onOperationSelect={onOperationSelect}
            onOperationDelete={onOperationDelete}
            onClearOperations={onClearOperations}
            onCopyOperation={onCopyOperation}
            onReplayOperation={onReplayOperation}
            showFilters={showFilters}
            onToggleFilters={onToggleFilters}
            filters={filters}
            onUpdateFilters={onUpdateFilters}
          />
        </div>

        {/* Right panel - Operation details */}
        <div className="flex-1 bg-white dark:bg-gray-900">
          {selectedOperationData ? (
            <OperationDetails
              operation={selectedOperationData}
              networkInfo={
                'networkInfo' in selectedOperationData 
                  ? (selectedOperationData as any).networkInfo 
                  : undefined
              }
              onCopyQuery={(_query) => onCopyOperation(selectedOperationData)}
              onReplayOperation={onReplayOperation}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <History size={48} className="text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Select an Operation
              </h3>
              <p className="text-gray-600 dark:text-gray-400 max-w-md">
                Choose an operation from the list to view its details, query, variables, and response.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};