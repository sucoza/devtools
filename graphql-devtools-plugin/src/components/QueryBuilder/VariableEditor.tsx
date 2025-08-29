import React from 'react';
import { Plus, Minus, Edit3, Check, X, AlertCircle } from 'lucide-react';
import type { QueryVariable, ValidationError } from '../../types';

interface VariableEditorProps {
  variables: QueryVariable[];
  onAddVariable: (variable: QueryVariable) => void;
  onRemoveVariable: (name: string) => void;
  onUpdateVariable: (name: string, updates: Partial<QueryVariable>) => void;
  validationErrors: ValidationError[];
}

export const VariableEditor: React.FC<VariableEditorProps> = ({
  variables,
  onAddVariable,
  onRemoveVariable,
  onUpdateVariable,
  validationErrors
}) => {
  const [isAddingVariable, setIsAddingVariable] = React.useState(false);
  const [editingVariable, setEditingVariable] = React.useState<string | null>(null);
  const [newVariable, setNewVariable] = React.useState<Partial<QueryVariable>>({
    name: '',
    type: 'String',
    defaultValue: '',
    required: false
  });

  const commonTypes = [
    'String',
    'Int',
    'Float',
    'Boolean',
    'ID',
    '[String]',
    '[Int]',
    '[Float]',
    '[Boolean]',
    '[ID]'
  ];

  const variableNameError = validationErrors.find(error => 
    error.message.includes('Invalid variable name')
  );

  const handleAddVariable = () => {
    if (!newVariable.name || !newVariable.type) {
      return;
    }

    const variable: QueryVariable = {
      name: newVariable.name,
      type: newVariable.type,
      defaultValue: newVariable.defaultValue,
      required: newVariable.required || false
    };

    onAddVariable(variable);
    setNewVariable({ name: '', type: 'String', defaultValue: '', required: false });
    setIsAddingVariable(false);
  };

  const handleCancelAdd = () => {
    setNewVariable({ name: '', type: 'String', defaultValue: '', required: false });
    setIsAddingVariable(false);
  };

  const handleStartEdit = (variable: QueryVariable) => {
    setEditingVariable(variable.name);
  };

  const handleCancelEdit = () => {
    setEditingVariable(null);
  };

  const handleSaveEdit = (variableName: string) => {
    setEditingVariable(null);
  };

  const renderVariableForm = (
    variable: Partial<QueryVariable>,
    onChange: (updates: Partial<QueryVariable>) => void,
    onSave: () => void,
    onCancel: () => void,
    isEditing = false
  ) => (
    <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
      {/* Variable name */}
      <div className="flex items-center gap-1 min-w-0 flex-1">
        <span className="text-blue-600 dark:text-blue-400 font-mono">$</span>
        <input
          type="text"
          value={variable.name || ''}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder="variableName"
          disabled={isEditing}
          className="flex-1 text-sm px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 disabled:bg-gray-100 dark:disabled:bg-gray-600 min-w-0"
        />
      </div>

      <span className="text-gray-500 dark:text-gray-400">:</span>

      {/* Variable type */}
      <select
        value={variable.type || 'String'}
        onChange={(e) => onChange({ type: e.target.value })}
        className="text-sm px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
      >
        {commonTypes.map((type) => (
          <option key={type} value={type}>
            {type}
          </option>
        ))}
      </select>

      {/* Required toggle */}
      <label className="flex items-center gap-1">
        <input
          type="checkbox"
          checked={variable.required || false}
          onChange={(e) => onChange({ required: e.target.checked })}
          className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
        />
        <span className="text-xs text-gray-600 dark:text-gray-400">Required</span>
      </label>

      {/* Default value */}
      <input
        type="text"
        value={variable.defaultValue || ''}
        onChange={(e) => onChange({ defaultValue: e.target.value })}
        placeholder="Default value"
        className="text-sm px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 w-24"
      />

      {/* Actions */}
      <div className="flex items-center gap-1">
        <button
          onClick={onSave}
          className="p-1 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900 rounded transition-colors"
          title="Save"
        >
          <Check size={16} />
        </button>
        <button
          onClick={onCancel}
          className="p-1 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900 rounded transition-colors"
          title="Cancel"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );

  const renderVariable = (variable: QueryVariable) => {
    const isEditing = editingVariable === variable.name;
    const hasError = variableNameError?.message.includes(variable.name);

    if (isEditing) {
      return (
        <div key={`edit-${variable.name}`}>
          {renderVariableForm(
            variable,
            (updates) => onUpdateVariable(variable.name, updates),
            () => handleSaveEdit(variable.name),
            handleCancelEdit,
            true
          )}
        </div>
      );
    }

    return (
      <div
        key={variable.name}
        className={`flex items-center gap-3 p-3 border rounded-lg transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 ${
          hasError 
            ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20' 
            : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900'
        }`}
      >
        {/* Error icon */}
        {hasError && (
          <AlertCircle size={16} className="text-red-500 flex-shrink-0" />
        )}

        {/* Variable definition */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-blue-600 dark:text-blue-400 font-mono">
              ${variable.name}
            </span>
            <span className="text-gray-500 dark:text-gray-400">:</span>
            <span className="font-mono text-sm text-gray-700 dark:text-gray-300">
              {variable.type}
              {variable.required ? '!' : ''}
            </span>
            {variable.defaultValue && (
              <>
                <span className="text-gray-500 dark:text-gray-400">=</span>
                <span className="font-mono text-sm text-gray-600 dark:text-gray-400">
                  {JSON.stringify(variable.defaultValue)}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => handleStartEdit(variable)}
            className="p-1 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
            title="Edit variable"
          >
            <Edit3 size={16} />
          </button>
          <button
            onClick={() => onRemoveVariable(variable.name)}
            className="p-1 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900 rounded transition-colors"
            title="Remove variable"
          >
            <Minus size={16} />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Variables ({variables.length})
        </h3>
        {!isAddingVariable && (
          <button
            onClick={() => setIsAddingVariable(true)}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
          >
            <Plus size={16} />
            Add Variable
          </button>
        )}
      </div>

      {/* Variables list */}
      <div className="space-y-2">
        {variables.map(renderVariable)}
      </div>

      {/* Add variable form */}
      {isAddingVariable && (
        <div>
          {renderVariableForm(
            newVariable,
            setNewVariable,
            handleAddVariable,
            handleCancelAdd
          )}
        </div>
      )}

      {/* Validation errors */}
      {validationErrors.length > 0 && (
        <div className="mt-4 space-y-2">
          {validationErrors
            .filter(error => error.message.includes('variable'))
            .map((error, index) => (
              <div 
                key={index} 
                className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg"
              >
                <AlertCircle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-red-800 dark:text-red-200">
                    Variable Error
                  </p>
                  <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                    {error.message}
                  </p>
                </div>
              </div>
            ))}
        </div>
      )}

      {variables.length === 0 && !isAddingVariable && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <p className="mb-2">No variables defined</p>
          <p className="text-sm">Variables allow you to parameterize your queries</p>
        </div>
      )}
    </div>
  );
};