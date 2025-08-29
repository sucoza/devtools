import React from 'react';
import { 
  Search, 
  Settings, 
  Zap, 
  Eye, 
  RefreshCw, 
  AlertCircle,
  Play,
  Edit3
} from 'lucide-react';
import { FieldSelector } from './FieldSelector';
import { VariableEditor } from './VariableEditor';
import { QueryPreview } from './QueryPreview';
import type { 
  SchemaInfo, 
  QueryBuilderState, 
  SelectedField,
  QueryVariable,
  ValidationError 
} from '../../types';

interface QueryBuilderProps {
  schemaInfo: SchemaInfo;
  queryBuilder: QueryBuilderState;
  onUpdateQueryBuilder: (updates: Partial<QueryBuilderState>) => void;
  onGenerateQuery: () => void;
  onValidateQuery: () => void;
  onResetBuilder: () => void;
  onExecuteQuery?: (query: string, variables?: Record<string, any>) => Promise<any>;
  onCopyQuery: (query: string) => void;
  validationErrors: ValidationError[];
}

export const QueryBuilder: React.FC<QueryBuilderProps> = ({
  schemaInfo,
  queryBuilder,
  onUpdateQueryBuilder,
  onGenerateQuery,
  onValidateQuery,
  onResetBuilder,
  onExecuteQuery,
  onCopyQuery,
  validationErrors
}) => {
  const [activeTab, setActiveTab] = React.useState<'fields' | 'variables' | 'preview'>('fields');
  const [operationName, setOperationName] = React.useState(queryBuilder.operationName || '');

  const hasSchema = schemaInfo.schema !== null;

  // Get available fields based on operation type
  const availableFields = React.useMemo(() => {
    if (!hasSchema) return [];

    switch (queryBuilder.operationType) {
      case 'mutation':
        return schemaInfo.mutations;
      case 'subscription':
        return schemaInfo.subscriptions;
      default:
        return schemaInfo.queries;
    }
  }, [hasSchema, queryBuilder.operationType, schemaInfo]);

  const handleOperationTypeChange = (operationType: 'query' | 'mutation' | 'subscription') => {
    onUpdateQueryBuilder({
      operationType,
      selectedFields: [], // Reset fields when changing operation type
      generatedQuery: ''
    });
  };

  const handleOperationNameChange = (name: string) => {
    setOperationName(name);
    onUpdateQueryBuilder({ operationName: name || undefined });
  };

  const handleAddField = (field: SelectedField) => {
    const updatedFields = [...queryBuilder.selectedFields, field];
    onUpdateQueryBuilder({ selectedFields: updatedFields });
    onGenerateQuery();
  };

  const handleRemoveField = (fieldName: string) => {
    const updatedFields = queryBuilder.selectedFields.filter(f => f.fieldName !== fieldName);
    onUpdateQueryBuilder({ selectedFields: updatedFields });
    onGenerateQuery();
  };

  const handleUpdateField = (fieldName: string, updates: Partial<SelectedField>) => {
    const updatedFields = queryBuilder.selectedFields.map(field =>
      field.fieldName === fieldName ? { ...field, ...updates } : field
    );
    onUpdateQueryBuilder({ selectedFields: updatedFields });
    onGenerateQuery();
  };

  const handleAddVariable = (variable: QueryVariable) => {
    const updatedVariables = [...queryBuilder.variables, variable];
    onUpdateQueryBuilder({ variables: updatedVariables });
    onGenerateQuery();
  };

  const handleRemoveVariable = (variableName: string) => {
    const updatedVariables = queryBuilder.variables.filter(v => v.name !== variableName);
    onUpdateQueryBuilder({ variables: updatedVariables });
    onGenerateQuery();
  };

  const handleUpdateVariable = (variableName: string, updates: Partial<QueryVariable>) => {
    const updatedVariables = queryBuilder.variables.map(variable =>
      variable.name === variableName ? { ...variable, ...updates } : variable
    );
    onUpdateQueryBuilder({ variables: updatedVariables });
    onGenerateQuery();
  };

  const getOperationIcon = (type: string) => {
    switch (type) {
      case 'mutation':
        return <Settings size={16} className="text-purple-500" />;
      case 'subscription':
        return <Zap size={16} className="text-orange-500" />;
      default:
        return <Search size={16} className="text-blue-500" />;
    }
  };

  const getTabIcon = (tab: string) => {
    switch (tab) {
      case 'variables':
        return <Edit3 size={16} />;
      case 'preview':
        return <Eye size={16} />;
      default:
        return <Search size={16} />;
    }
  };

  if (!hasSchema) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <AlertCircle size={48} className="text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          No Schema Available
        </h3>
        <p className="text-gray-600 dark:text-gray-400 max-w-md">
          A GraphQL schema is required to use the query builder. Please load a schema first.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header with operation controls */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            Query Builder
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={onValidateQuery}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800 rounded-md transition-colors"
            >
              <RefreshCw size={16} />
              Validate
            </button>
            <button
              onClick={onResetBuilder}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Operation type selector */}
        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Operation:
            </span>
            <div className="flex rounded-md border border-gray-200 dark:border-gray-600 overflow-hidden">
              {(['query', 'mutation', 'subscription'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => handleOperationTypeChange(type)}
                  disabled={type !== 'query' && availableFields.length === 0}
                  className={`px-3 py-1.5 text-sm font-medium transition-colors flex items-center gap-2 ${
                    queryBuilder.operationType === type
                      ? 'bg-blue-600 text-white'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed'
                  }`}
                >
                  {getOperationIcon(type)}
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                  {type !== 'query' && (
                    <span className="text-xs opacity-75">
                      ({type === 'mutation' ? schemaInfo.mutations.length : schemaInfo.subscriptions.length})
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Operation name */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Name:
            </span>
            <input
              type="text"
              value={operationName}
              onChange={(e) => handleOperationNameChange(e.target.value)}
              placeholder={`My${queryBuilder.operationType.charAt(0).toUpperCase() + queryBuilder.operationType.slice(1)}`}
              className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Status indicators */}
        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-1">
            <span>Fields:</span>
            <span className="font-medium">{queryBuilder.selectedFields.length}</span>
          </div>
          <div className="flex items-center gap-1">
            <span>Variables:</span>
            <span className="font-medium">{queryBuilder.variables.length}</span>
          </div>
          <div className="flex items-center gap-1">
            <span>Valid:</span>
            <span className={`font-medium ${queryBuilder.isValid ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {queryBuilder.isValid ? 'Yes' : 'No'}
            </span>
          </div>
          {validationErrors.length > 0 && (
            <div className="flex items-center gap-1 text-red-600 dark:text-red-400">
              <AlertCircle size={16} />
              <span>{validationErrors.length} errors</span>
            </div>
          )}
        </div>
      </div>

      {/* Tab navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <div className="flex">
          {([
            { key: 'fields', label: 'Fields', disabled: false },
            { key: 'variables', label: 'Variables', disabled: false },
            { key: 'preview', label: 'Preview', disabled: !queryBuilder.generatedQuery }
          ] as const).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              disabled={tab.disabled}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === tab.key
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:border-gray-300 dark:hover:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed'
              }`}
            >
              {getTabIcon(tab.key)}
              {tab.label}
              {tab.key === 'fields' && queryBuilder.selectedFields.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full">
                  {queryBuilder.selectedFields.length}
                </span>
              )}
              {tab.key === 'variables' && queryBuilder.variables.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-xs bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded-full">
                  {queryBuilder.variables.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'fields' && (
          <div className="h-full overflow-auto p-4">
            <FieldSelector
              availableFields={availableFields}
              selectedFields={queryBuilder.selectedFields}
              types={schemaInfo.types}
              onAddField={handleAddField}
              onRemoveField={handleRemoveField}
              onUpdateField={handleUpdateField}
              parentType={queryBuilder.operationType === 'mutation' ? 'Mutation' : queryBuilder.operationType === 'subscription' ? 'Subscription' : 'Query'}
            />
          </div>
        )}

        {activeTab === 'variables' && (
          <div className="h-full overflow-auto p-4">
            <VariableEditor
              variables={queryBuilder.variables}
              onAddVariable={handleAddVariable}
              onRemoveVariable={handleRemoveVariable}
              onUpdateVariable={handleUpdateVariable}
              validationErrors={validationErrors}
            />
          </div>
        )}

        {activeTab === 'preview' && (
          <div className="h-full">
            <QueryPreview
              queryBuilder={queryBuilder}
              onExecuteQuery={onExecuteQuery}
              onCopyQuery={onCopyQuery}
              validationErrors={validationErrors}
            />
          </div>
        )}
      </div>
    </div>
  );
};