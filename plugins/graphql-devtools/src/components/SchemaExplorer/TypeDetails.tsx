import React from 'react';
import { 
  Type, 
  Database, 
  Settings, 
  Zap, 
  List, 
  Square,
  ArrowRight,
  AlertTriangle,
  Info,
  Copy,
  Check
} from 'lucide-react';
import type { GraphQLTypeInfo, GraphQLFieldInfo } from '../../types';

interface TypeDetailsProps {
  type: GraphQLTypeInfo;
  onTypeSelect: (typeName: string) => void;
}

export const TypeDetails: React.FC<TypeDetailsProps> = ({ type, onTypeSelect }) => {
  const [copiedField, setCopiedField] = React.useState<string | null>(null);

  const getTypeIcon = (kind: string) => {
    if (kind.includes('OBJECT')) return <Type size={20} className="text-blue-500" />;
    if (kind.includes('SCALAR')) return <Database size={20} className="text-green-500" />;
    if (kind.includes('ENUM')) return <List size={20} className="text-yellow-500" />;
    if (kind.includes('INTERFACE')) return <Settings size={20} className="text-purple-500" />;
    if (kind.includes('UNION')) return <Zap size={20} className="text-red-500" />;
    if (kind.includes('INPUT')) return <Square size={20} className="text-gray-500" />;
    return <Type size={20} className="text-gray-400" />;
  };

  const getTypeKindLabel = (kind: string) => {
    if (kind.includes('OBJECT')) return 'Object Type';
    if (kind.includes('SCALAR')) return 'Scalar Type';
    if (kind.includes('ENUM')) return 'Enum Type';
    if (kind.includes('INTERFACE')) return 'Interface Type';
    if (kind.includes('UNION')) return 'Union Type';
    if (kind.includes('INPUT')) return 'Input Type';
    return 'Type';
  };

  const handleCopyField = async (fieldName: string) => {
    try {
      await navigator.clipboard.writeText(fieldName);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      console.warn('Failed to copy field name:', error);
    }
  };

  const parseTypeString = (typeString: string) => {
    // Extract the core type name from GraphQL type strings like "String!" or "[User!]!"
    const match = typeString.match(/([A-Za-z_][A-Za-z0-9_]*)/);
    return match ? match[1] : typeString;
  };

  const isBuiltinType = (typeName: string) => {
    return ['String', 'Int', 'Float', 'Boolean', 'ID'].includes(typeName);
  };

  const renderTypeLink = (typeString: string) => {
    const coreType = parseTypeString(typeString);
    
    if (isBuiltinType(coreType)) {
      return (
        <span className="text-green-600 dark:text-green-400 font-mono">
          {typeString}
        </span>
      );
    }
    
    return (
      <button
        onClick={() => onTypeSelect(coreType)}
        className="text-blue-600 dark:text-blue-400 font-mono hover:underline focus:outline-none focus:underline"
      >
        {typeString}
      </button>
    );
  };

  const renderField = (field: GraphQLFieldInfo) => (
    <div key={field.name} className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleCopyField(field.name)}
              className="flex items-center gap-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded px-2 py-1 transition-colors"
            >
              <span className="font-mono font-semibold text-gray-900 dark:text-gray-100">
                {field.name}
              </span>
              {copiedField === field.name ? (
                <Check size={14} className="text-green-500" />
              ) : (
                <Copy size={14} className="text-gray-400" />
              )}
            </button>
            <ArrowRight size={14} className="text-gray-400" />
            {renderTypeLink(field.type)}
            {field.isDeprecated && (
              <span title="Deprecated"><AlertTriangle size={14} className="text-yellow-500" /></span>
            )}
          </div>
          
          {field.description && (
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              {field.description}
            </p>
          )}

          {field.isDeprecated && field.deprecationReason && (
            <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded">
              <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
                <AlertTriangle size={14} />
                <span className="text-sm font-medium">Deprecated</span>
              </div>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                {field.deprecationReason}
              </p>
            </div>
          )}

          {field.args && field.args.length > 0 && (
            <div className="mt-3">
              <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Arguments:
              </h5>
              <div className="space-y-2">
                {field.args.map((arg) => (
                  <div key={arg.name} className="flex items-center gap-2 text-sm">
                    <span className="font-mono text-gray-600 dark:text-gray-400">
                      {arg.name}:
                    </span>
                    {renderTypeLink(arg.type)}
                    {arg.defaultValue !== undefined && (
                      <span className="text-gray-500 dark:text-gray-400">
                        = {JSON.stringify(arg.defaultValue)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          {getTypeIcon(type.kind)}
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              {type.name}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {getTypeKindLabel(type.kind)}
            </p>
          </div>
        </div>
        
        {type.description && (
          <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
            <div className="flex items-start gap-2">
              <Info size={16} className="text-blue-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-blue-800 dark:text-blue-200">
                {type.description}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4 space-y-6">
        {/* Fields */}
        {type.fields && type.fields.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
              Fields ({type.fields.length})
            </h3>
            <div className="space-y-3">
              {type.fields.map(renderField)}
            </div>
          </div>
        )}

        {/* Enum Values */}
        {type.enumValues && type.enumValues.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
              Enum Values ({type.enumValues.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {type.enumValues.map((enumValue) => (
                <div 
                  key={enumValue.name} 
                  className="border rounded-lg p-3 bg-gray-50 dark:bg-gray-800"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-semibold text-gray-900 dark:text-gray-100">
                      {enumValue.name}
                    </span>
                    {enumValue.isDeprecated && (
                      <span title="Deprecated"><AlertTriangle size={14} className="text-yellow-500" /></span>
                    )}
                  </div>
                  
                  {enumValue.description && (
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                      {enumValue.description}
                    </p>
                  )}

                  {enumValue.isDeprecated && enumValue.deprecationReason && (
                    <div className="mt-2 text-sm text-yellow-600 dark:text-yellow-400">
                      Deprecated: {enumValue.deprecationReason}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Input Fields */}
        {type.inputFields && type.inputFields.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
              Input Fields ({type.inputFields.length})
            </h3>
            <div className="space-y-3">
              {type.inputFields.map((inputField) => (
                <div 
                  key={inputField.name} 
                  className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-semibold text-gray-900 dark:text-gray-100">
                      {inputField.name}:
                    </span>
                    {renderTypeLink(inputField.type)}
                    {inputField.defaultValue !== undefined && (
                      <span className="text-gray-500 dark:text-gray-400">
                        = {JSON.stringify(inputField.defaultValue)}
                      </span>
                    )}
                  </div>
                  
                  {inputField.description && (
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                      {inputField.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Possible Types (for Unions) */}
        {type.possibleTypes && type.possibleTypes.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
              Possible Types ({type.possibleTypes.length})
            </h3>
            <div className="flex flex-wrap gap-2">
              {type.possibleTypes.map((possibleType) => (
                <button
                  key={possibleType.name}
                  onClick={() => onTypeSelect(possibleType.name)}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                >
                  {possibleType.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Interfaces */}
        {type.interfaces && type.interfaces.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
              Implements ({type.interfaces.length})
            </h3>
            <div className="flex flex-wrap gap-2">
              {type.interfaces.map((interfaceType) => (
                <button
                  key={interfaceType.name}
                  onClick={() => onTypeSelect(interfaceType.name)}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 hover:bg-purple-200 dark:hover:bg-purple-800 transition-colors"
                >
                  {interfaceType.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};