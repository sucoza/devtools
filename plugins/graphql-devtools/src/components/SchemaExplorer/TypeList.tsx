import React from 'react';
import { Search, Type, Database, Settings, Zap, List, Square } from 'lucide-react';
import type { GraphQLTypeInfo } from '../../types';

interface TypeListProps {
  types: GraphQLTypeInfo[];
  selectedType?: string;
  onTypeSelect: (typeName: string) => void;
  searchTerm?: string;
  onSearchChange: (term: string) => void;
}

export const TypeList: React.FC<TypeListProps> = ({
  types,
  selectedType,
  onTypeSelect,
  searchTerm = '',
  onSearchChange
}) => {
  const filteredTypes = types.filter(type =>
    type.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (type.description && type.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getTypeIcon = (kind: string) => {
    if (kind.includes('OBJECT')) return <Type size={16} className="text-blue-500" />;
    if (kind.includes('SCALAR')) return <Database size={16} className="text-green-500" />;
    if (kind.includes('ENUM')) return <List size={16} className="text-yellow-500" />;
    if (kind.includes('INTERFACE')) return <Settings size={16} className="text-purple-500" />;
    if (kind.includes('UNION')) return <Zap size={16} className="text-red-500" />;
    if (kind.includes('INPUT')) return <Square size={16} className="text-gray-500" />;
    return <Type size={16} className="text-gray-400" />;
  };

  const getTypeKindLabel = (kind: string) => {
    if (kind.includes('OBJECT')) return 'Object';
    if (kind.includes('SCALAR')) return 'Scalar';
    if (kind.includes('ENUM')) return 'Enum';
    if (kind.includes('INTERFACE')) return 'Interface';
    if (kind.includes('UNION')) return 'Union';
    if (kind.includes('INPUT')) return 'Input';
    return 'Type';
  };

  return (
    <div className="flex flex-col h-full">
      {/* Search bar */}
      <div className="p-3 border-b border-gray-200 dark:border-gray-700">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search types..."
            className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Type list */}
      <div className="flex-1 overflow-auto">
        {filteredTypes.length === 0 ? (
          <div className="p-4 text-center text-gray-500 dark:text-gray-400">
            {searchTerm ? 'No types found matching your search' : 'No types available'}
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {filteredTypes.map((type) => (
              <div
                key={type.name}
                onClick={() => onTypeSelect(type.name)}
                className={`
                  p-3 rounded-md cursor-pointer transition-colors
                  hover:bg-gray-100 dark:hover:bg-gray-700
                  ${selectedType === type.name 
                    ? 'bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700' 
                    : 'border border-transparent'
                  }
                `}
              >
                <div className="flex items-start gap-3">
                  {getTypeIcon(type.kind)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900 dark:text-gray-100 truncate">
                        {type.name}
                      </span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                        {getTypeKindLabel(type.kind)}
                      </span>
                    </div>
                    {type.description && (
                      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                        {type.description}
                      </p>
                    )}
                    <div className="mt-2 flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                      {type.fields && type.fields.length > 0 && (
                        <span>{type.fields.length} fields</span>
                      )}
                      {type.enumValues && type.enumValues.length > 0 && (
                        <span>{type.enumValues.length} values</span>
                      )}
                      {type.inputFields && type.inputFields.length > 0 && (
                        <span>{type.inputFields.length} input fields</span>
                      )}
                      {type.possibleTypes && type.possibleTypes.length > 0 && (
                        <span>{type.possibleTypes.length} possible types</span>
                      )}
                      {type.interfaces && type.interfaces.length > 0 && (
                        <span>{type.interfaces.length} interfaces</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Type count */}
      <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {filteredTypes.length} of {types.length} types
          {searchTerm && ` matching "${searchTerm}"`}
        </div>
      </div>
    </div>
  );
};