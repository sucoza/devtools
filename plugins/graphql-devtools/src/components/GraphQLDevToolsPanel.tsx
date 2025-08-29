import React from 'react';
import { 
  Database, 
  Search, 
  History, 
  TrendingUp, 
  Settings,
  Play,
  Square,
  RefreshCw,
  Download,
  Upload
} from 'lucide-react';
import { SchemaExplorer } from './SchemaExplorer';
import { QueryBuilder } from './QueryBuilder';
import { QueryHistory } from './QueryHistory';
import { useGraphQLDevToolsStore } from '../core/devtools-store';
import { createGraphQLDevToolsClient } from '../core/devtools-client';

export const GraphQLDevToolsPanel: React.FC = () => {
  const state = useGraphQLDevToolsStore();
  const clientRef = React.useRef(createGraphQLDevToolsClient());
  const client = clientRef.current;

  const handleTabChange = (tab: typeof state.ui.activeTab) => {
    client.selectTab(tab);
  };

  const handleIntrospectSchema = () => {
    client.introspectSchema();
  };

  const handleTypeSelect = (typeName: string) => {
    client.selectType(typeName);
  };

  const handleOperationSelect = (id: string) => {
    client.selectOperation(id);
  };

  const handleOperationDelete = (id: string) => {
    // Remove specific operation
    // This would need to be added to the client API
    console.log('Delete operation:', id);
  };

  const handleClearOperations = () => {
    client.clearOperations();
  };

  const handleCopyOperation = (operation: any) => {
    navigator.clipboard.writeText(operation.query);
  };

  const handleReplayOperation = async (operation: any) => {
    // Replay the operation by executing it again
    try {
      // This would need endpoint configuration
      console.log('Replay operation:', operation);
    } catch (error) {
      console.error('Failed to replay operation:', error);
    }
  };

  const handleUpdateQueryBuilder = (updates: any) => {
    // Apply updates to query builder state
    Object.entries(updates).forEach(([key, value]) => {
      switch (key) {
        case 'operationType':
          client.setQueryBuilderOperationType(value as any);
          break;
        case 'selectedFields':
          // This would need more specific handling
          break;
        case 'variables':
          // This would need more specific handling
          break;
        case 'operationName':
          client.setQueryBuilderOperationName(value as string);
          break;
      }
    });
  };

  const handleGenerateQuery = () => {
    client.generateQuery();
  };

  const handleValidateQuery = () => {
    client.validateQueryBuilder();
  };

  const handleResetBuilder = () => {
    client.resetQueryBuilder();
  };

  const handleExecuteQuery = async (query: string, variables?: Record<string, any>) => {
    // This would need endpoint configuration
    console.log('Execute query:', query, variables);
    throw new Error('Query execution requires endpoint configuration');
  };

  const handleToggleRecording = () => {
    client.toggleRecording();
  };

  const handleToggleFilters = () => {
    client.toggleFilters();
  };

  const handleUpdateFilters = (filters: any) => {
    client.updateFilters(filters);
  };

  const handleExportData = () => {
    const data = client.exportOperations();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `graphql-devtools-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result as string;
        client.importOperations(data);
      } catch (error) {
        console.error('Failed to import data:', error);
      }
    };
    reader.readAsText(file);
    
    // Reset input
    event.target.value = '';
  };

  const getTabIcon = (tab: string) => {
    switch (tab) {
      case 'schema':
        return <Database size={16} />;
      case 'query-builder':
        return <Search size={16} />;
      case 'performance':
        return <TrendingUp size={16} />;
      default:
        return <History size={16} />;
    }
  };

  const filteredOperations = client.getFilteredOperations();

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Database size={16} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold">GraphQL DevTools Enhanced</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Schema exploration, query building & performance monitoring
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Recording toggle */}
          <button
            onClick={handleToggleRecording}
            className={`inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              state.ui.isRecording
                ? 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-800'
                : 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-800'
            }`}
          >
            {state.ui.isRecording ? (
              <>
                <Square size={16} className="fill-current" />
                Recording
              </>
            ) : (
              <>
                <Play size={16} className="fill-current" />
                Start Recording
              </>
            )}
          </button>

          {/* Export/Import */}
          <button
            onClick={handleExportData}
            className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors"
            title="Export data"
          >
            <Download size={16} />
          </button>
          
          <label className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors cursor-pointer" title="Import data">
            <Upload size={16} />
            <input
              type="file"
              accept=".json"
              onChange={handleImportData}
              className="hidden"
            />
          </label>

          {/* Settings */}
          <button
            className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors"
            title="Settings"
          >
            <Settings size={16} />
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <div className="flex">
          {([
            { key: 'operations', label: 'Operations', count: state.operations.length },
            { key: 'schema', label: 'Schema', count: state.schema.types.length },
            { key: 'query-builder', label: 'Query Builder', count: state.queryBuilder.selectedFields.length },
            { key: 'performance', label: 'Performance', count: null }
          ] as const).map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                state.ui.activeTab === tab.key
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              {getTabIcon(tab.key)}
              {tab.label}
              {tab.count !== null && tab.count > 0 && (
                <span className="ml-1 px-2 py-0.5 text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        {state.ui.activeTab === 'operations' && (
          <QueryHistory
            operations={filteredOperations}
            performance={state.performance}
            selectedOperation={state.ui.selectedOperation}
            onOperationSelect={handleOperationSelect}
            onOperationDelete={handleOperationDelete}
            onClearOperations={handleClearOperations}
            onCopyOperation={handleCopyOperation}
            onReplayOperation={handleReplayOperation}
            showFilters={state.ui.showFilters}
            onToggleFilters={handleToggleFilters}
            filters={state.ui.filters}
            onUpdateFilters={handleUpdateFilters}
          />
        )}

        {state.ui.activeTab === 'schema' && (
          <SchemaExplorer
            schemaInfo={state.schema}
            isLoading={state.isLoadingSchema}
            error={state.schemaError}
            selectedType={state.ui.selectedType}
            onTypeSelect={handleTypeSelect}
            onIntrospectSchema={handleIntrospectSchema}
          />
        )}

        {state.ui.activeTab === 'query-builder' && (
          <QueryBuilder
            schemaInfo={state.schema}
            queryBuilder={state.queryBuilder}
            onUpdateQueryBuilder={handleUpdateQueryBuilder}
            onGenerateQuery={handleGenerateQuery}
            onValidateQuery={handleValidateQuery}
            onResetBuilder={handleResetBuilder}
            onExecuteQuery={handleExecuteQuery}
            onCopyQuery={(query) => navigator.clipboard.writeText(query)}
            validationErrors={state.queryBuilder.validationErrors}
          />
        )}

        {state.ui.activeTab === 'performance' && (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <TrendingUp size={48} className="text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Performance Dashboard
            </h3>
            <p className="text-gray-600 dark:text-gray-400 max-w-md mb-4">
              Detailed performance analytics and monitoring will be available in a future update.
            </p>
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                For now, basic performance metrics are available in the Operations tab.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};