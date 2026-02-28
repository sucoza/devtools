import React, { useState, useEffect } from 'react';
import { clsx } from 'clsx';
import { X, Search, Calendar, Filter } from 'lucide-react';

export interface FilterConfig {
  searchText?: string;
  timeRange?: {
    start: number;
    end: number;
  };
  options?: Array<{
    key: string;
    label: string;
    values: Array<{ value: any; label: string; count?: number }>;
    multiple?: boolean;
  }>;
}

export interface FilterPanelProps {
  filter: FilterConfig;
  onFilterChange: (updates: Partial<FilterConfig>) => void;
  onClearFilters: () => void;
  className?: string;
  placeholder?: string;
}

/**
 * Shared FilterPanel component for all DevTools plugins
 * Provides consistent filtering UI with configurable options
 */
export function FilterPanel({
  filter,
  onFilterChange,
  onClearFilters,
  className,
  placeholder = "Search..."
}: FilterPanelProps) {
  const [tempTimeRange, setTempTimeRange] = useState({
    start: filter.timeRange ? new Date(filter.timeRange.start).toISOString().slice(0, 16) : '',
    end: filter.timeRange ? new Date(filter.timeRange.end).toISOString().slice(0, 16) : '',
  });

  useEffect(() => {
    setTempTimeRange({
      start: filter.timeRange ? new Date(filter.timeRange.start).toISOString().slice(0, 16) : '',
      end: filter.timeRange ? new Date(filter.timeRange.end).toISOString().slice(0, 16) : '',
    });
  }, [filter.timeRange?.start, filter.timeRange?.end]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    onFilterChange({ searchText: value || undefined });
  };

  const handleOptionToggle = (optionKey: string, value: any) => {
    const option = filter.options?.find(opt => opt.key === optionKey);
    if (!option) return;

    const currentValues = (filter as any)[optionKey] || [];
    
    if (option.multiple) {
      const newValues = Array.isArray(currentValues) && currentValues.includes(value)
        ? currentValues.filter(v => v !== value)
        : [...(Array.isArray(currentValues) ? currentValues : []), value];
      
      onFilterChange({ [optionKey]: newValues.length > 0 ? newValues : undefined });
    } else {
      onFilterChange({ [optionKey]: currentValues === value ? undefined : value });
    }
  };

  const handleTimeRangeApply = () => {
    if (tempTimeRange.start && tempTimeRange.end) {
      const start = new Date(tempTimeRange.start).getTime();
      const end = new Date(tempTimeRange.end).getTime();
      
      if (start <= end) {
        onFilterChange({ timeRange: { start, end } });
      }
    } else if (!tempTimeRange.start && !tempTimeRange.end) {
      onFilterChange({ timeRange: undefined });
    }
  };

  const hasActiveFilters = Boolean(
    filter.searchText ||
    filter.timeRange ||
    filter.options?.some(opt => (filter as any)[opt.key])
  );

  return (
    <div className={clsx(
      'bg-white border border-gray-200 rounded-lg p-4 space-y-4',
      className
    )}>
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input
          type="text"
          placeholder={placeholder}
          value={filter.searchText || ''}
          onChange={handleSearchChange}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Time Range */}
      <div className="space-y-2">
        <label className="flex items-center text-sm font-medium text-gray-700">
          <Calendar className="w-4 h-4 mr-2" />
          Time Range
        </label>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="datetime-local"
            value={tempTimeRange.start}
            onChange={(e) => setTempTimeRange(prev => ({ ...prev, start: e.target.value }))}
            onBlur={handleTimeRangeApply}
            className="px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <input
            type="datetime-local"
            value={tempTimeRange.end}
            onChange={(e) => setTempTimeRange(prev => ({ ...prev, end: e.target.value }))}
            onBlur={handleTimeRangeApply}
            className="px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Dynamic Filter Options */}
      {filter.options?.map(option => (
        <div key={option.key} className="space-y-2">
          <label className="flex items-center text-sm font-medium text-gray-700">
            <Filter className="w-4 h-4 mr-2" />
            {option.label}
          </label>
          <div className="flex flex-wrap gap-1">
            {option.values.map(({ value, label, count }) => {
              const isSelected = option.multiple 
                ? Array.isArray((filter as any)[option.key]) && (filter as any)[option.key]?.includes(value)
                : (filter as any)[option.key] === value;
              
              return (
                <button
                  key={String(value)}
                  onClick={() => handleOptionToggle(option.key, value)}
                  className={clsx(
                    'px-2 py-1 text-xs rounded-full border transition-colors',
                    isSelected
                      ? 'bg-blue-100 border-blue-300 text-blue-800'
                      : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                  )}
                >
                  {label}
                  {count !== undefined && (
                    <span className="ml-1 text-gray-500">({count})</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {/* Clear Filters */}
      {hasActiveFilters && (
        <button
          onClick={onClearFilters}
          className="flex items-center text-sm text-red-600 hover:text-red-700 font-medium"
        >
          <X className="w-4 h-4 mr-1" />
          Clear Filters
        </button>
      )}
    </div>
  );
}