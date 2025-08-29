import React from 'react';
import { 
  Copy, 
  Play, 
  Check, 
  AlertCircle, 
  Eye, 
  EyeOff,
  Settings,
  Zap
} from 'lucide-react';
import type { QueryBuilderState, ValidationError } from '../../types';

interface QueryPreviewProps {
  queryBuilder: QueryBuilderState;
  onExecuteQuery?: (query: string, variables?: Record<string, any>) => Promise<any>;
  onCopyQuery: (query: string) => void;
  validationErrors: ValidationError[];
}

export const QueryPreview: React.FC<QueryPreviewProps> = ({
  queryBuilder,
  onExecuteQuery,
  onCopyQuery,
  validationErrors
}) => {
  const [copied, setCopied] = React.useState(false);
  const [isExecuting, setIsExecuting] = React.useState(false);
  const [executionResult, setExecutionResult] = React.useState<any>(null);
  const [executionError, setExecutionError] = React.useState<string | null>(null);
  const [showVariables, setShowVariables] = React.useState(false);
  const [variableValues, setVariableValues] = React.useState<Record<string, any>>({});

  const { generatedQuery, variables, isValid } = queryBuilder;

  // Initialize variable values
  React.useEffect(() => {
    const initialValues: Record<string, any> = {};
    variables.forEach(variable => {
      if (variable.defaultValue !== undefined) {
        initialValues[variable.name] = variable.defaultValue;
      }
    });
    setVariableValues(prev => ({ ...prev, ...initialValues }));
  }, [variables]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatedQuery);
      onCopyQuery(generatedQuery);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.warn('Failed to copy query:', error);
    }
  };

  const handleExecute = async () => {
    if (!onExecuteQuery || !isValid || !generatedQuery) {
      return;
    }

    setIsExecuting(true);
    setExecutionError(null);
    setExecutionResult(null);

    try {
      const result = await onExecuteQuery(generatedQuery, variableValues);
      setExecutionResult(result);
    } catch (error) {
      setExecutionError(error instanceof Error ? error.message : 'Execution failed');
    } finally {
      setIsExecuting(false);
    }
  };

  const handleVariableValueChange = (variableName: string, value: string) => {
    const variable = variables.find(v => v.name === variableName);
    if (!variable) return;

    let parsedValue: any = value;

    // Try to parse the value based on the variable type
    if (variable.type.includes('Int') && value.trim()) {
      const parsed = parseInt(value, 10);
      if (!isNaN(parsed)) parsedValue = parsed;
    } else if (variable.type.includes('Float') && value.trim()) {
      const parsed = parseFloat(value);
      if (!isNaN(parsed)) parsedValue = parsed;
    } else if (variable.type.includes('Boolean')) {
      parsedValue = value === 'true';
    } else if (variable.type.startsWith('[') && value.trim()) {
      try {
        parsedValue = JSON.parse(value);
      } catch {
        parsedValue = value.split(',').map(s => s.trim());
      }
    }

    setVariableValues(prev => ({
      ...prev,
      [variableName]: parsedValue
    }));
  };

  const getOperationIcon = () => {
    switch (queryBuilder.operationType) {
      case 'mutation':
        return <Settings size={16} className="text-purple-500" />;
      case 'subscription':
        return <Zap size={16} className="text-orange-500" />;
      default:
        return <Eye size={16} className="text-blue-500" />;
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <div className="flex items-center gap-2">
          {getOperationIcon()}
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Query Preview
          </h3>
          {queryBuilder.operationName && (
            <span className="px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full">
              {queryBuilder.operationName}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {variables.length > 0 && (
            <button
              onClick={() => setShowVariables(!showVariables)}
              className={`p-2 rounded-md transition-colors ${
                showVariables 
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
              title={showVariables ? 'Hide variables' : 'Show variables'}
            >
              {showVariables ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          )}
          
          <button
            onClick={handleCopy}
            disabled={!generatedQuery}
            className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors disabled:opacity-50"
            title="Copy query"
          >
            {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
          </button>

          {onExecuteQuery && (
            <button
              onClick={handleExecute}
              disabled={!isValid || !generatedQuery || isExecuting}
              className={`inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                isValid && generatedQuery && !isExecuting
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
              }`}
            >
              <Play size={16} className={isExecuting ? 'animate-pulse' : ''} />
              {isExecuting ? 'Executing...' : 'Execute'}
            </button>
          )}
        </div>
      </div>

      {/* Variables panel */}
      {showVariables && variables.length > 0 && (
        <div className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <div className="p-4">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Variable Values
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {variables.map((variable) => (
                <div key={variable.name} className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400 min-w-0 flex-shrink-0">
                    ${variable.name}:
                  </label>
                  <input
                    type="text"
                    value={variableValues[variable.name] || variable.defaultValue || ''}
                    onChange={(e) => handleVariableValueChange(variable.name, e.target.value)}
                    placeholder={variable.type}
                    className="flex-1 text-sm px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Query content */}
      <div className="flex-1 overflow-auto">
        {generatedQuery ? (
          <div className="p-4">
            <pre className="text-sm font-mono bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-auto border border-gray-200 dark:border-gray-700">
              <code className="text-gray-900 dark:text-gray-100">
                {generatedQuery}
              </code>
            </pre>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <Eye size={48} className="text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              No Query Generated
            </h3>
            <p className="text-gray-600 dark:text-gray-400 max-w-md">
              Select fields and configure your operation to see the generated GraphQL query.
            </p>
          </div>
        )}

        {/* Validation errors */}
        {validationErrors.length > 0 && (
          <div className="p-4 border-t border-red-200 dark:border-red-700 bg-red-50 dark:bg-red-900/20">
            <div className="space-y-2">
              {validationErrors.map((error, index) => (
                <div key={index} className="flex items-start gap-2">
                  <AlertCircle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-red-800 dark:text-red-200">
                      {error.severity === 'error' ? 'Error' : 'Warning'}
                      {error.line && error.column && (
                        <span className="ml-2 text-xs font-normal">
                          Line {error.line}, Column {error.column}
                        </span>
                      )}
                    </p>
                    <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                      {error.message}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Execution result */}
        {(executionResult || executionError) && (
          <div className="border-t border-gray-200 dark:border-gray-700">
            <div className="p-4">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                Execution Result
              </h4>
              
              {executionError ? (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <AlertCircle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-red-800 dark:text-red-200">
                        Execution Error
                      </p>
                      <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                        {executionError}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <pre className="text-sm font-mono bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-auto border border-gray-200 dark:border-gray-700 max-h-64">
                  <code className="text-gray-900 dark:text-gray-100">
                    {JSON.stringify(executionResult, null, 2)}
                  </code>
                </pre>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};