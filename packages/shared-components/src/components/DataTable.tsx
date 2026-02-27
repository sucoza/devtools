import React, { useState, useMemo, useCallback } from 'react';
import { ChevronUp, ChevronDown, ChevronRight, ChevronsUpDown, MoreVertical } from 'lucide-react';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../styles/plugin-styles';
import { ScrollableContainer } from './ScrollableContainer';
import { SearchInput } from './SearchInput';
import { Badge } from './Badge';

export interface Column<T> {
  key: string;
  header: React.ReactNode;
  accessor?: (row: T) => React.ReactNode;
  width?: number | string;
  minWidth?: number | string;
  maxWidth?: number | string;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  filterable?: boolean;
  resizable?: boolean;
  sticky?: 'left' | 'right';
  render?: (value: any, row: T, index: number) => React.ReactNode;
  headerRender?: () => React.ReactNode;
  cellClassName?: string | ((row: T) => string);
  headerClassName?: string;
}

export interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  
  // Features
  sortable?: boolean;
  filterable?: boolean;
  searchable?: boolean;
  selectable?: boolean;
  expandable?: boolean;
  resizable?: boolean;
  virtualized?: boolean;
  
  // Selection
  selectedRows?: Set<number>;
  onSelectionChange?: (selectedRows: Set<number>) => void;
  selectAll?: boolean;
  
  // Expansion
  expandedRows?: Set<number>;
  onExpansionChange?: (expandedRows: Set<number>) => void;
  renderExpandedRow?: (row: T) => React.ReactNode;
  
  // Pagination
  paginated?: boolean;
  pageSize?: number;
  currentPage?: number;
  onPageChange?: (page: number) => void;
  
  // Display options
  striped?: boolean;
  hover?: boolean;
  bordered?: boolean;
  compact?: boolean;
  stickyHeader?: boolean;
  maxHeight?: number | string;
  
  // Loading & empty states
  loading?: boolean;
  emptyMessage?: React.ReactNode;
  loadingMessage?: React.ReactNode;
  
  // Actions
  rowActions?: Array<{
    label: string;
    icon?: React.ReactNode;
    onClick: (row: T, index: number) => void;
    disabled?: (row: T) => boolean;
  }>;
  bulkActions?: Array<{
    label: string;
    icon?: React.ReactNode;
    onClick: (selectedRows: T[]) => void;
    disabled?: boolean;
  }>;
  
  // Callbacks
  onRowClick?: (row: T, index: number) => void;
  onRowDoubleClick?: (row: T, index: number) => void;
  onSort?: (column: string, direction: 'asc' | 'desc' | null) => void;
  onFilter?: (filters: Record<string, any>) => void;
  onSearch?: (query: string) => void;
  
  // Custom rendering
  getRowKey?: (row: T, index: number) => string | number;
  getRowClassName?: (row: T, index: number) => string;
  
  // Style
  className?: string;
  style?: React.CSSProperties;
}

export function DataTable<T = any>({
  data,
  columns,
  sortable = true,
  filterable = false,
  searchable = false,
  selectable = false,
  expandable = false,
  _resizable = false,
  _virtualized = false,
  selectedRows = new Set(),
  onSelectionChange,
  selectAll = true,
  expandedRows = new Set(),
  onExpansionChange,
  renderExpandedRow,
  paginated = false,
  pageSize = 10,
  currentPage = 1,
  onPageChange,
  striped = false,
  hover = true,
  bordered = true,
  compact = false,
  stickyHeader = true,
  maxHeight,
  loading = false,
  emptyMessage = 'No data available',
  loadingMessage = 'Loading...',
  rowActions,
  bulkActions,
  onRowClick,
  onRowDoubleClick,
  onSort,
  _onFilter,
  onSearch,
  getRowKey = (_, index) => index,
  getRowClassName,
  className,
  style,
}: DataTableProps<T>) {
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, _setFilters] = useState<Record<string, any>>({});
  const [columnWidths, _setColumnWidths] = useState<Record<string, number>>({});
  
  // Handle sorting
  const handleSort = useCallback((column: Column<T>) => {
    if (!column.sortable && !sortable) return;
    
    let newDirection: 'asc' | 'desc' | null = 'asc';
    
    if (sortColumn === column.key) {
      if (sortDirection === 'asc') {
        newDirection = 'desc';
      } else if (sortDirection === 'desc') {
        newDirection = null;
      }
    }
    
    setSortColumn(newDirection ? column.key : null);
    setSortDirection(newDirection);
    onSort?.(column.key, newDirection);
  }, [sortColumn, sortDirection, sortable, onSort]);
  
  // Handle selection
  const handleSelectRow = useCallback((index: number) => {
    const newSelection = new Set(selectedRows);
    if (newSelection.has(index)) {
      newSelection.delete(index);
    } else {
      newSelection.add(index);
    }
    onSelectionChange?.(newSelection);
  }, [selectedRows, onSelectionChange]);
  
  const handleSelectAll = useCallback(() => {
    if (selectedRows.size === data.length) {
      onSelectionChange?.(new Set());
    } else {
      onSelectionChange?.(new Set(data.map((_, i) => i)));
    }
  }, [data, selectedRows, onSelectionChange]);
  
  // Handle expansion
  const handleExpandRow = useCallback((index: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    onExpansionChange?.(newExpanded);
  }, [expandedRows, onExpansionChange]);
  
  // Filter and sort data
  const processedData = useMemo(() => {
    let result = [...data];
    
    // Apply search
    if (searchQuery && searchable) {
      result = result.filter(row => {
        return columns.some(col => {
          const value = col.accessor ? col.accessor(row) : (row as any)[col.key];
          return String(value).toLowerCase().includes(searchQuery.toLowerCase());
        });
      });
    }
    
    // Apply filters
    if (filterable && Object.keys(filters).length > 0) {
      result = result.filter(row => {
        return Object.entries(filters).every(([key, value]) => {
          if (!value) return true;
          const column = columns.find(c => c.key === key);
          const rowValue = column?.accessor ? column.accessor(row) : (row as any)[key];
          return String(rowValue).toLowerCase().includes(String(value).toLowerCase());
        });
      });
    }
    
    // Apply sorting
    if (sortColumn && sortDirection) {
      const column = columns.find(c => c.key === sortColumn);
      result.sort((a, b) => {
        const aValue = column?.accessor ? column.accessor(a) : (a as any)[sortColumn];
        const bValue = column?.accessor ? column.accessor(b) : (b as any)[sortColumn];
        
        if (aValue === bValue) return 0;
        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;
        
        const comparison = aValue < bValue ? -1 : 1;
        return sortDirection === 'asc' ? comparison : -comparison;
      });
    }
    
    return result;
  }, [data, columns, searchQuery, searchable, filters, filterable, sortColumn, sortDirection]);
  
  // Pagination
  const paginatedData = useMemo(() => {
    if (!paginated) return processedData;
    
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    return processedData.slice(start, end);
  }, [processedData, paginated, currentPage, pageSize]);
  
  const totalPages = Math.ceil(processedData.length / pageSize);
  
  // Cell padding based on compact mode
  const cellPadding = compact ? SPACING.xs : SPACING.sm;
  
  // Render sort indicator
  const renderSortIndicator = (column: Column<T>) => {
    if (!column.sortable && !sortable) return null;
    
    const isActive = sortColumn === column.key;
    const icon = isActive && sortDirection === 'asc' ? (
      <ChevronUp size={14} />
    ) : isActive && sortDirection === 'desc' ? (
      <ChevronDown size={14} />
    ) : (
      <ChevronsUpDown size={14} />
    );
    
    return (
      <span style={{
        marginLeft: SPACING.xs,
        color: isActive ? COLORS.text.accent : COLORS.text.muted,
        display: 'inline-flex',
        alignItems: 'center',
      }}>
        {icon}
      </span>
    );
  };
  
  // Render table content
  const tableContent = (
    <table
      style={{
        width: '100%',
        borderCollapse: 'collapse',
        fontSize: TYPOGRAPHY.fontSize.sm,
      }}
    >
      <thead
        style={{
          ...(stickyHeader && {
            position: 'sticky',
            top: 0,
            zIndex: 10,
          }),
        }}
      >
        <tr>
          {selectable && (
            <th
              style={{
                width: '40px',
                padding: cellPadding,
                backgroundColor: COLORS.background.secondary,
                borderBottom: bordered ? `1px solid ${COLORS.border.primary}` : 'none',
                textAlign: 'center',
              }}
            >
              {selectAll && (
                <input
                  type="checkbox"
                  checked={selectedRows.size === data.length && data.length > 0}
                  onChange={handleSelectAll}
                  style={{ cursor: 'pointer' }}
                  ref={(el) => {
                    if (el) {
                      el.indeterminate = selectedRows.size > 0 && selectedRows.size < data.length;
                    }
                  }}
                />
              )}
            </th>
          )}
          
          {expandable && (
            <th
              style={{
                width: '40px',
                padding: cellPadding,
                backgroundColor: COLORS.background.secondary,
                borderBottom: bordered ? `1px solid ${COLORS.border.primary}` : 'none',
              }}
            />
          )}
          
          {columns.map((column) => (
            <th
              key={column.key}
              className={column.headerClassName}
              style={{
                padding: cellPadding,
                backgroundColor: COLORS.background.secondary,
                borderBottom: bordered ? `1px solid ${COLORS.border.primary}` : 'none',
                textAlign: column.align || 'left',
                fontWeight: TYPOGRAPHY.fontWeight.medium,
                color: COLORS.text.primary,
                cursor: (column.sortable || sortable) ? 'pointer' : 'default',
                userSelect: 'none',
                whiteSpace: 'nowrap',
                width: columnWidths[column.key] || column.width,
                minWidth: column.minWidth,
                maxWidth: column.maxWidth,
                ...(column.sticky && {
                  position: 'sticky',
                  [column.sticky]: 0,
                  zIndex: 11,
                }),
              }}
              onClick={() => handleSort(column)}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: column.align === 'center' ? 'center' : column.align === 'right' ? 'flex-end' : 'flex-start',
              }}>
                {column.headerRender ? column.headerRender() : column.header}
                {renderSortIndicator(column)}
              </div>
            </th>
          ))}
          
          {rowActions && (
            <th
              style={{
                width: '60px',
                padding: cellPadding,
                backgroundColor: COLORS.background.secondary,
                borderBottom: bordered ? `1px solid ${COLORS.border.primary}` : 'none',
              }}
            />
          )}
        </tr>
      </thead>
      
      <tbody>
        {loading ? (
          <tr>
            <td
              colSpan={columns.length + (selectable ? 1 : 0) + (expandable ? 1 : 0) + (rowActions ? 1 : 0)}
              style={{
                padding: SPACING.xl,
                textAlign: 'center',
                color: COLORS.text.muted,
              }}
            >
              {loadingMessage}
            </td>
          </tr>
        ) : paginatedData.length === 0 ? (
          <tr>
            <td
              colSpan={columns.length + (selectable ? 1 : 0) + (expandable ? 1 : 0) + (rowActions ? 1 : 0)}
              style={{
                padding: SPACING.xl,
                textAlign: 'center',
                color: COLORS.text.muted,
              }}
            >
              {emptyMessage}
            </td>
          </tr>
        ) : (
          paginatedData.map((row, rowIndex) => {
            const actualIndex = paginated ? (currentPage - 1) * pageSize + rowIndex : rowIndex;
            const isSelected = selectedRows.has(actualIndex);
            const isExpanded = expandedRows.has(actualIndex);
            const rowKey = getRowKey(row, actualIndex);
            
            return (
              <React.Fragment key={rowKey}>
                <tr
                  className={getRowClassName?.(row, actualIndex)}
                  style={{
                    backgroundColor: isSelected
                      ? COLORS.background.selected
                      : striped && rowIndex % 2 === 1
                      ? COLORS.background.secondary
                      : 'transparent',
                    cursor: onRowClick ? 'pointer' : 'default',
                    transition: 'background-color 0.1s ease',
                  }}
                  onClick={() => onRowClick?.(row, actualIndex)}
                  onDoubleClick={() => onRowDoubleClick?.(row, actualIndex)}
                  onMouseEnter={(e) => {
                    if (hover && !isSelected) {
                      e.currentTarget.style.backgroundColor = COLORS.background.hover;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (hover && !isSelected) {
                      e.currentTarget.style.backgroundColor = striped && rowIndex % 2 === 1
                        ? COLORS.background.secondary
                        : 'transparent';
                    }
                  }}
                >
                  {selectable && (
                    <td
                      style={{
                        padding: cellPadding,
                        borderBottom: bordered ? `1px solid ${COLORS.border.primary}` : 'none',
                        textAlign: 'center',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleSelectRow(actualIndex);
                        }}
                        style={{ cursor: 'pointer' }}
                      />
                    </td>
                  )}
                  
                  {expandable && (
                    <td
                      style={{
                        padding: cellPadding,
                        borderBottom: bordered ? `1px solid ${COLORS.border.primary}` : 'none',
                        textAlign: 'center',
                        cursor: 'pointer',
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleExpandRow(actualIndex);
                      }}
                    >
                      {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </td>
                  )}
                  
                  {columns.map((column) => {
                    const value = column.accessor ? column.accessor(row) : (row as any)[column.key];
                    const cellClassName = typeof column.cellClassName === 'function'
                      ? column.cellClassName(row)
                      : column.cellClassName;
                    
                    return (
                      <td
                        key={column.key}
                        className={cellClassName}
                        style={{
                          padding: cellPadding,
                          borderBottom: bordered ? `1px solid ${COLORS.border.primary}` : 'none',
                          textAlign: column.align || 'left',
                          color: COLORS.text.primary,
                          width: columnWidths[column.key] || column.width,
                          minWidth: column.minWidth,
                          maxWidth: column.maxWidth,
                          ...(column.sticky && {
                            position: 'sticky',
                            [column.sticky]: 0,
                            backgroundColor: isSelected
                              ? COLORS.background.selected
                              : striped && rowIndex % 2 === 1
                              ? COLORS.background.secondary
                              : COLORS.background.primary,
                            zIndex: 1,
                          }),
                        }}
                      >
                        {column.render ? column.render(value, row, actualIndex) : value}
                      </td>
                    );
                  })}
                  
                  {rowActions && (
                    <td
                      style={{
                        padding: cellPadding,
                        borderBottom: bordered ? `1px solid ${COLORS.border.primary}` : 'none',
                        textAlign: 'center',
                      }}
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          // Show actions menu
                        }}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: COLORS.text.muted,
                          cursor: 'pointer',
                          padding: SPACING.xs,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <MoreVertical size={16} />
                      </button>
                    </td>
                  )}
                </tr>
                
                {isExpanded && renderExpandedRow && (
                  <tr>
                    <td
                      colSpan={columns.length + (selectable ? 1 : 0) + (expandable ? 1 : 0) + (rowActions ? 1 : 0)}
                      style={{
                        padding: cellPadding,
                        backgroundColor: COLORS.background.secondary,
                        borderBottom: bordered ? `1px solid ${COLORS.border.primary}` : 'none',
                      }}
                    >
                      {renderExpandedRow(row)}
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })
        )}
      </tbody>
    </table>
  );
  
  return (
    <div className={className} style={{ ...style }}>
      {/* Toolbar */}
      {(searchable || bulkActions) && (
        <div style={{
          display: 'flex',
          gap: SPACING.md,
          marginBottom: SPACING.md,
          alignItems: 'center',
        }}>
          {searchable && (
            <SearchInput
              placeholder="Search..."
              value={searchQuery}
              onChange={(value) => {
                setSearchQuery(value);
                onSearch?.(value);
              }}
              style={{ flex: 1, maxWidth: '300px' }}
            />
          )}
          
          {bulkActions && selectedRows.size > 0 && (
            <div style={{ display: 'flex', gap: SPACING.sm, marginLeft: 'auto' }}>
              <Badge variant="primary" size="sm">
                {selectedRows.size} selected
              </Badge>
              {bulkActions.map((action, i) => (
                <button
                  key={i}
                  onClick={() => {
                    const selected = Array.from(selectedRows).map(i => data[i]);
                    action.onClick(selected);
                  }}
                  disabled={action.disabled}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: SPACING.xs,
                    padding: `${SPACING.xs} ${SPACING.sm}`,
                    borderRadius: RADIUS.sm,
                    border: `1px solid ${COLORS.border.primary}`,
                    backgroundColor: 'transparent',
                    color: action.disabled ? COLORS.text.muted : COLORS.text.primary,
                    fontSize: TYPOGRAPHY.fontSize.sm,
                    cursor: action.disabled ? 'not-allowed' : 'pointer',
                    opacity: action.disabled ? 0.5 : 1,
                  }}
                >
                  {action.icon}
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      
      {/* Table */}
      {maxHeight ? (
        <ScrollableContainer
          style={{ maxHeight }}
          showShadows={true}
          smoothScroll={true}
          scrollbarWidth="thin"
        >
          {tableContent}
        </ScrollableContainer>
      ) : (
        tableContent
      )}
      
      {/* Pagination */}
      {paginated && totalPages > 1 && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: SPACING.md,
          padding: SPACING.sm,
          borderTop: `1px solid ${COLORS.border.primary}`,
        }}>
          <div style={{
            fontSize: TYPOGRAPHY.fontSize.sm,
            color: COLORS.text.secondary,
          }}>
            Showing {Math.min((currentPage - 1) * pageSize + 1, processedData.length)} to{' '}
            {Math.min(currentPage * pageSize, processedData.length)} of {processedData.length} entries
          </div>
          
          <div style={{ display: 'flex', gap: SPACING.xs }}>
            <button
              onClick={() => onPageChange?.(1)}
              disabled={currentPage === 1}
              style={{
                padding: `${SPACING.xs} ${SPACING.sm}`,
                borderRadius: RADIUS.sm,
                border: `1px solid ${COLORS.border.primary}`,
                backgroundColor: 'transparent',
                color: currentPage === 1 ? COLORS.text.muted : COLORS.text.primary,
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                opacity: currentPage === 1 ? 0.5 : 1,
              }}
            >
              First
            </button>
            
            <button
              onClick={() => onPageChange?.(currentPage - 1)}
              disabled={currentPage === 1}
              style={{
                padding: `${SPACING.xs} ${SPACING.sm}`,
                borderRadius: RADIUS.sm,
                border: `1px solid ${COLORS.border.primary}`,
                backgroundColor: 'transparent',
                color: currentPage === 1 ? COLORS.text.muted : COLORS.text.primary,
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                opacity: currentPage === 1 ? 0.5 : 1,
              }}
            >
              Previous
            </button>
            
            <span style={{
              padding: `${SPACING.xs} ${SPACING.md}`,
              fontSize: TYPOGRAPHY.fontSize.sm,
              color: COLORS.text.primary,
            }}>
              Page {currentPage} of {totalPages}
            </span>
            
            <button
              onClick={() => onPageChange?.(currentPage + 1)}
              disabled={currentPage === totalPages}
              style={{
                padding: `${SPACING.xs} ${SPACING.sm}`,
                borderRadius: RADIUS.sm,
                border: `1px solid ${COLORS.border.primary}`,
                backgroundColor: 'transparent',
                color: currentPage === totalPages ? COLORS.text.muted : COLORS.text.primary,
                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                opacity: currentPage === totalPages ? 0.5 : 1,
              }}
            >
              Next
            </button>
            
            <button
              onClick={() => onPageChange?.(totalPages)}
              disabled={currentPage === totalPages}
              style={{
                padding: `${SPACING.xs} ${SPACING.sm}`,
                borderRadius: RADIUS.sm,
                border: `1px solid ${COLORS.border.primary}`,
                backgroundColor: 'transparent',
                color: currentPage === totalPages ? COLORS.text.muted : COLORS.text.primary,
                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                opacity: currentPage === totalPages ? 0.5 : 1,
              }}
            >
              Last
            </button>
          </div>
        </div>
      )}
    </div>
  );
}