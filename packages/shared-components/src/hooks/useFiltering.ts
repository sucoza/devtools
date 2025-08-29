import { useState, useMemo, useCallback } from 'react';

export interface FilterState {
  searchText?: string;
  timeRange?: {
    start: number;
    end: number;
  };
  [key: string]: any;
}

export interface UseFilteringOptions<T> {
  data: T[];
  initialFilter?: FilterState;
  searchFields?: (keyof T)[];
  timeField?: keyof T;
}

export interface UseFilteringReturn<T> {
  filter: FilterState;
  filteredData: T[];
  updateFilter: (updates: Partial<FilterState>) => void;
  clearFilter: () => void;
  setFilter: (filter: FilterState) => void;
}

/**
 * Shared filtering hook for all DevTools plugins
 * Provides consistent filtering logic with search, time range, and custom filters
 */
export function useFiltering<T extends Record<string, any>>({
  data,
  initialFilter = {},
  searchFields = [],
  timeField
}: UseFilteringOptions<T>): UseFilteringReturn<T> {
  const [filter, setFilter] = useState<FilterState>(initialFilter);

  const updateFilter = useCallback((updates: Partial<FilterState>) => {
    setFilter(prev => ({ ...prev, ...updates }));
  }, []);

  const clearFilter = useCallback(() => {
    setFilter({});
  }, []);

  const filteredData = useMemo(() => {
    let filtered = data;

    // Text search
    if (filter.searchText) {
      const searchLower = filter.searchText.toLowerCase();
      filtered = filtered.filter(item => 
        searchFields.some(field => {
          const value = item[field];
          return value && 
            String(value).toLowerCase().includes(searchLower);
        })
      );
    }

    // Time range filtering
    if (filter.timeRange && timeField) {
      const { start, end } = filter.timeRange;
      filtered = filtered.filter(item => {
        const time = item[timeField] as number;
        return time >= start && time <= end;
      });
    }

    // Custom filters
    Object.keys(filter).forEach(key => {
      if (key === 'searchText' || key === 'timeRange') return;
      
      const filterValue = filter[key];
      if (filterValue === undefined || filterValue === null) return;

      filtered = filtered.filter(item => {
        const itemValue = item[key];
        
        if (Array.isArray(filterValue)) {
          // Multiple selection filter
          return filterValue.includes(itemValue);
        } else {
          // Single value filter
          return itemValue === filterValue;
        }
      });
    });

    return filtered;
  }, [data, filter, searchFields, timeField]);

  return {
    filter,
    filteredData,
    updateFilter,
    clearFilter,
    setFilter
  };
}