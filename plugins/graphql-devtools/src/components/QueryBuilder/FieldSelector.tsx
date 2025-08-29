import React from 'react';
import { 
  Plus, 
  Minus, 
  ChevronRight, 
  ChevronDown, 
  Type,
  Database,
  Settings,
  AlertCircle
} from 'lucide-react';
import type { 
  GraphQLFieldInfo, 
  GraphQLTypeInfo, 
  SelectedField, 
  FieldArgument 
} from '../../types';

interface FieldSelectorProps {
  availableFields: GraphQLFieldInfo[];
  selectedFields: SelectedField[];
  types: GraphQLTypeInfo[];
  onAddField: (field: SelectedField) => void;
  onRemoveField: (fieldName: string) => void;
  onUpdateField: (fieldName: string, updates: Partial<SelectedField>) => void;
  parentType: string;
}

export const FieldSelector: React.FC<FieldSelectorProps> = ({
  availableFields,
  selectedFields,
  types,
  onAddField,
  onRemoveField,
  onUpdateField,
  parentType
}) => {
  const [expandedFields, setExpandedFields] = React.useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = React.useState('');

  const filteredFields = availableFields.filter(field =>
    field.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (field.description && field.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const isFieldSelected = (fieldName: string) => {
    return selectedFields.some(field => field.fieldName === fieldName);
  };

  const toggleFieldExpansion = (fieldName: string) => {
    const newExpanded = new Set(expandedFields);
    if (newExpanded.has(fieldName)) {
      newExpanded.delete(fieldName);
    } else {
      newExpanded.add(fieldName);
    }
    setExpandedFields(newExpanded);
  };

  const handleAddField = (field: GraphQLFieldInfo) => {
    const selectedField: SelectedField = {
      fieldName: field.name,
      arguments: field.args.map(arg => ({
        name: arg.name,
        value: arg.defaultValue ?? '',
        type: arg.type,
        variableName: undefined
      })),
      subFields: [],
      parentType
    };

    onAddField(selectedField);
  };

  const handleRemoveField = (fieldName: string) => {
    onRemoveField(fieldName);
    const newExpanded = new Set(expandedFields);
    newExpanded.delete(fieldName);
    setExpandedFields(newExpanded);
  };

  const parseTypeString = (typeString: string): string => {
    // Extract the core type name from GraphQL type strings like "String!" or "[User!]!"
    const match = typeString.match(/([A-Za-z_][A-Za-z0-9_]*)/);
    return match ? match[1] : typeString;
  };

  const getTypeInfo = (typeName: string): GraphQLTypeInfo | undefined => {
    return types.find(type => type.name === typeName);
  };

  const isObjectType = (typeString: string): boolean => {
    const coreType = parseTypeString(typeString);
    const typeInfo = getTypeInfo(coreType);
    return typeInfo?.kind.includes('OBJECT') || false;
  };

  const getFieldIcon = (field: GraphQLFieldInfo) => {
    const coreType = parseTypeString(field.type);
    const typeInfo = getTypeInfo(coreType);
    
    if (!typeInfo) {
      return <Database size={16} className="text-green-500" />; // Scalar
    }
    
    if (typeInfo.kind.includes('OBJECT')) {
      return <Type size={16} className="text-blue-500" />;
    }
    
    if (typeInfo.kind.includes('ENUM')) {
      return <Settings size={16} className="text-yellow-500" />;
    }
    
    return <Database size={16} className="text-green-500" />;
  };

  const renderArgumentInput = (
    fieldName: string, 
    arg: FieldArgument, 
    index: number
  ) => {
    const selectedField = selectedFields.find(f => f.fieldName === fieldName);
    const currentArg = selectedField?.arguments[index];
    
    if (!currentArg) return null;

    const handleArgumentChange = (value: string) => {
      if (selectedField) {
        const updatedArguments = [...selectedField.arguments];
        updatedArguments[index] = { ...updatedArguments[index], value };
        onUpdateField(fieldName, { arguments: updatedArguments });
      }
    };

    const handleVariableToggle = () => {
      if (selectedField) {
        const updatedArguments = [...selectedField.arguments];
        const currentArg = updatedArguments[index];
        
        if (currentArg.variableName) {
          // Remove variable
          updatedArguments[index] = {
            ...currentArg,
            variableName: undefined
          };
        } else {
          // Add variable
          const variableName = `${fieldName}_${currentArg.name}`;
          updatedArguments[index] = {
            ...currentArg,
            variableName
          };
        }
        
        onUpdateField(fieldName, { arguments: updatedArguments });
      }
    };

    return (
      <div key={`${fieldName}_${arg.name}`} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700 rounded">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-0 flex-shrink-0">
          {arg.name}:
        </span>
        <input
          type="text"
          value={currentArg.variableName ? `$${currentArg.variableName}` : currentArg.value}
          onChange={(e) => handleArgumentChange(e.target.value)}
          disabled={!!currentArg.variableName}
          placeholder={arg.type}
          className="flex-1 text-sm px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 disabled:bg-gray-100 dark:disabled:bg-gray-600"
        />
        <button
          onClick={handleVariableToggle}
          className={`text-xs px-2 py-1 rounded transition-colors ${
            currentArg.variableName
              ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
              : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-500'
          }`}
        >
          {currentArg.variableName ? 'Var' : '$'}
        </button>
      </div>
    );
  };

  const renderNestedFields = (field: GraphQLFieldInfo, selectedField: SelectedField) => {
    const coreType = parseTypeString(field.type);
    const typeInfo = getTypeInfo(coreType);
    
    if (!typeInfo || !typeInfo.fields) {
      return null;
    }

    return (
      <div className="ml-4 border-l-2 border-gray-200 dark:border-gray-700 pl-3 mt-2">
        <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Select fields from {coreType}:
        </div>
        <FieldSelector
          availableFields={typeInfo.fields}
          selectedFields={selectedField.subFields}
          types={types}
          onAddField={(subField) => {
            const updatedSubFields = [...selectedField.subFields, subField];
            onUpdateField(selectedField.fieldName, { subFields: updatedSubFields });
          }}
          onRemoveField={(subFieldName) => {
            const updatedSubFields = selectedField.subFields.filter(
              sf => sf.fieldName !== subFieldName
            );
            onUpdateField(selectedField.fieldName, { subFields: updatedSubFields });
          }}
          onUpdateField={(subFieldName, updates) => {
            const updatedSubFields = selectedField.subFields.map(sf =>
              sf.fieldName === subFieldName ? { ...sf, ...updates } : sf
            );
            onUpdateField(selectedField.fieldName, { subFields: updatedSubFields });
          }}
          parentType={coreType}
        />
      </div>
    );
  };

  return (
    <div className="space-y-2">
      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search fields..."
          className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Available Fields */}
      <div className="space-y-1">
        {filteredFields.map((field) => {
          const selected = isFieldSelected(field.name);
          const expanded = expandedFields.has(field.name);
          const selectedField = selectedFields.find(f => f.fieldName === field.name);
          const hasObjectType = isObjectType(field.type);

          return (
            <div key={field.name} className="border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="flex items-center p-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                {/* Expand button for object types */}
                {selected && hasObjectType && (
                  <button
                    onClick={() => toggleFieldExpansion(field.name)}
                    className="mr-2 p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  >
                    {expanded ? (
                      <ChevronDown size={16} className="text-gray-500" />
                    ) : (
                      <ChevronRight size={16} className="text-gray-500" />
                    )}
                  </button>
                )}

                {/* Field icon */}
                <div className="mr-3">
                  {getFieldIcon(field)}
                </div>

                {/* Field info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {field.name}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400 font-mono">
                      {field.type}
                    </span>
                    {field.isDeprecated && (
                      <AlertCircle size={14} className="text-yellow-500" />
                    )}
                  </div>
                  {field.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-1">
                      {field.description}
                    </p>
                  )}
                </div>

                {/* Add/Remove button */}
                <button
                  onClick={() => selected ? handleRemoveField(field.name) : handleAddField(field)}
                  className={`p-2 rounded-md transition-colors ${
                    selected
                      ? 'bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-800'
                      : 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-800'
                  }`}
                >
                  {selected ? <Minus size={16} /> : <Plus size={16} />}
                </button>
              </div>

              {/* Field arguments */}
              {selected && selectedField && field.args.length > 0 && (
                <div className="border-t border-gray-200 dark:border-gray-700 p-3 bg-gray-50 dark:bg-gray-800">
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Arguments:
                  </div>
                  <div className="space-y-2">
                    {field.args.map((arg, index) => 
                      renderArgumentInput(field.name, {
                        name: arg.name,
                        value: arg.defaultValue ?? '',
                        type: arg.type,
                        variableName: undefined
                      }, index)
                    )}
                  </div>
                </div>
              )}

              {/* Nested fields for object types */}
              {selected && selectedField && expanded && hasObjectType && (
                <div className="border-t border-gray-200 dark:border-gray-700 p-3">
                  {renderNestedFields(field, selectedField)}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filteredFields.length === 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          {searchTerm ? 'No fields found matching your search' : 'No fields available'}
        </div>
      )}
    </div>
  );
};