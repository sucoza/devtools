import React from 'react';
import { RefreshCw, AlertCircle, Loader, Database, TrendingUp } from 'lucide-react';
import { TypeList } from './TypeList';
import { TypeDetails } from './TypeDetails';
import type { SchemaInfo } from '../../types';

interface SchemaExplorerProps {
  schemaInfo: SchemaInfo;
  isLoading: boolean;
  error?: string;
  selectedType?: string;
  onTypeSelect: (typeName: string) => void;
  onIntrospectSchema: () => void;
}

export const SchemaExplorer: React.FC<SchemaExplorerProps> = ({
  schemaInfo,
  isLoading,
  error,
  selectedType,
  onTypeSelect,
  onIntrospectSchema
}) => {
  const [searchTerm, setSearchTerm] = React.useState('');

  const selectedTypeInfo = selectedType 
    ? schemaInfo.types.find(type => type.name === selectedType)
    : undefined;

  const hasSchema = schemaInfo.schema !== null;

  const schemaStats = React.useMemo(() => {
    if (!hasSchema) return null;

    const stats = {
      totalTypes: schemaInfo.types.length,
      objectTypes: schemaInfo.types.filter(t => t.kind.includes('OBJECT')).length,
      scalarTypes: schemaInfo.types.filter(t => t.kind.includes('SCALAR')).length,
      enumTypes: schemaInfo.types.filter(t => t.kind.includes('ENUM')).length,
      interfaceTypes: schemaInfo.types.filter(t => t.kind.includes('INTERFACE')).length,
      unionTypes: schemaInfo.types.filter(t => t.kind.includes('UNION')).length,
      inputTypes: schemaInfo.types.filter(t => t.kind.includes('INPUT')).length,
      totalQueries: schemaInfo.queries.length,
      totalMutations: schemaInfo.mutations.length,
      totalSubscriptions: schemaInfo.subscriptions.length
    };

    return stats;
  }, [schemaInfo, hasSchema]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <AlertCircle size={48} className="text-red-500 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Schema Error
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4 max-w-md">
          {error}
        </p>
        <button
          onClick={onIntrospectSchema}
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-md transition-colors"
        >
          <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
          Retry Introspection
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <Loader size={48} className="text-blue-500 mb-4 animate-spin" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Loading Schema...
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Performing GraphQL introspection
        </p>
      </div>
    );
  }

  if (!hasSchema) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <Database size={48} className="text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          No Schema Loaded
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4 max-w-md">
          Load a GraphQL schema to explore types, queries, mutations, and subscriptions.
        </p>
        <button
          onClick={onIntrospectSchema}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
        >
          <RefreshCw size={16} />
          Introspect Schema
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* Left Panel - Type List */}
      <div className="w-80 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        {/* Schema Stats Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              Schema Overview
            </h3>
            <button
              onClick={onIntrospectSchema}
              disabled={isLoading}
              className="p-1.5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 rounded transition-colors"
              title="Refresh Schema"
            >
              <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
            </button>
          </div>
          
          {schemaStats && (
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <TrendingUp size={14} className="text-blue-500" />
                <span className="text-gray-600 dark:text-gray-400">
                  {schemaStats.totalTypes} types
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Database size={14} className="text-green-500" />
                <span className="text-gray-600 dark:text-gray-400">
                  {schemaStats.totalQueries} queries
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 bg-purple-500 rounded-full flex-shrink-0" />
                <span className="text-gray-600 dark:text-gray-400">
                  {schemaStats.totalMutations} mutations
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 bg-orange-500 rounded-full flex-shrink-0" />
                <span className="text-gray-600 dark:text-gray-400">
                  {schemaStats.totalSubscriptions} subscriptions
                </span>
              </div>
            </div>
          )}
          
          {schemaInfo.lastUpdated && (
            <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
              Updated {new Date(schemaInfo.lastUpdated).toLocaleString()}
            </div>
          )}
        </div>

        {/* Type List */}
        <TypeList
          types={schemaInfo.types}
          selectedType={selectedType}
          onTypeSelect={onTypeSelect}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
        />
      </div>

      {/* Right Panel - Type Details or Empty State */}
      <div className="flex-1 bg-white dark:bg-gray-900">
        {selectedTypeInfo ? (
          <TypeDetails
            type={selectedTypeInfo}
            onTypeSelect={onTypeSelect}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <Database size={48} className="text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Select a Type
            </h3>
            <p className="text-gray-600 dark:text-gray-400 max-w-md">
              Choose a type from the list to view its details, fields, and relationships.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};