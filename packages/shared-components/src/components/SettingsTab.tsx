import React from 'react';
import { clsx } from 'clsx';
import { Settings, ToggleLeft, ToggleRight } from 'lucide-react';

export interface SettingField {
  key: string;
  label: string;
  description?: string;
  type: 'boolean' | 'number' | 'string' | 'select' | 'range';
  value: any;
  options?: Array<{ label: string; value: any }>;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
}

export interface SettingSection {
  title: string;
  description?: string;
  fields: SettingField[];
}

export interface SettingsTabProps {
  sections: SettingSection[];
  onSettingChange: (sectionIndex: number, fieldKey: string, value: any) => void;
  className?: string;
}

/**
 * Shared SettingsTab component for all DevTools plugins
 * Provides consistent settings UI with configurable field types
 */
export function SettingsTab({
  sections,
  onSettingChange,
  className
}: SettingsTabProps) {
  
  const renderField = (field: SettingField, sectionIndex: number) => {
    const handleChange = (value: any) => {
      onSettingChange(sectionIndex, field.key, value);
    };

    switch (field.type) {
      case 'boolean':
        return (
          <button
            onClick={() => handleChange(!field.value)}
            className={clsx(
              'flex items-center transition-colors',
              field.value ? 'text-blue-600' : 'text-gray-400'
            )}
          >
            {field.value ? (
              <ToggleRight className="w-6 h-6" />
            ) : (
              <ToggleLeft className="w-6 h-6" />
            )}
          </button>
        );

      case 'number':
        return (
          <div className="flex items-center space-x-2">
            <input
              type="number"
              value={field.value}
              onChange={(e) => handleChange(Number(e.target.value))}
              min={field.min}
              max={field.max}
              step={field.step}
              className="px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent w-24"
            />
            {field.unit && (
              <span className="text-sm text-gray-500">{field.unit}</span>
            )}
          </div>
        );

      case 'string':
        return (
          <input
            type="text"
            value={field.value}
            onChange={(e) => handleChange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        );

      case 'select':
        return (
          <select
            value={field.value}
            onChange={(e) => handleChange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {field.options?.map(option => (
              <option key={String(option.value)} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case 'range':
        return (
          <div className="flex items-center space-x-3">
            <input
              type="range"
              value={field.value}
              onChange={(e) => handleChange(Number(e.target.value))}
              min={field.min || 0}
              max={field.max || 100}
              step={field.step || 1}
              className="flex-1"
            />
            <span className="text-sm text-gray-600 font-mono w-12">
              {field.value}
              {field.unit}
            </span>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={clsx('space-y-6', className)}>
      {sections.map((section, sectionIndex) => (
        <div key={section.title} className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center mb-4">
            <Settings className="w-5 h-5 text-gray-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">{section.title}</h3>
          </div>
          
          {section.description && (
            <p className="text-sm text-gray-600 mb-4">{section.description}</p>
          )}

          <div className="space-y-4">
            {section.fields.map(field => (
              <div key={field.key} className="flex items-center justify-between">
                <div className="flex-1 mr-4">
                  <label className="text-sm font-medium text-gray-700">
                    {field.label}
                  </label>
                  {field.description && (
                    <p className="text-xs text-gray-500 mt-1">{field.description}</p>
                  )}
                </div>
                <div className="flex-shrink-0">
                  {renderField(field, sectionIndex)}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}