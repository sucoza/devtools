import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { ChevronDown, Check, X, Search, Loader } from 'lucide-react';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../styles/plugin-styles';

export interface DropdownOption<T = any> {
  value: T;
  label: React.ReactNode;
  icon?: React.ReactNode;
  disabled?: boolean;
  group?: string;
  description?: React.ReactNode;
  data?: any;
}

export interface DropdownProps<T = any> {
  options: DropdownOption<T>[];
  value?: T | T[];
  defaultValue?: T | T[];
  onChange?: (value: T | T[] | null) => void;
  
  // Display
  placeholder?: string;
  label?: React.ReactNode;
  error?: React.ReactNode;
  helperText?: React.ReactNode;
  
  // Behavior
  multiple?: boolean;
  searchable?: boolean;
  clearable?: boolean;
  disabled?: boolean;
  loading?: boolean;
  
  // Features
  groups?: boolean;
  virtualScroll?: boolean;
  maxHeight?: number;
  maxSelections?: number;
  
  // Async
  async?: boolean;
  loadOptions?: (query: string) => Promise<DropdownOption<T>[]>;
  
  // Customization
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'filled' | 'outlined';
  fullWidth?: boolean;
  
  // Custom rendering
  renderOption?: (option: DropdownOption<T>, isSelected: boolean) => React.ReactNode;
  renderValue?: (value: T | T[]) => React.ReactNode;
  renderGroup?: (group: string) => React.ReactNode;
  
  // Style
  className?: string;
  style?: React.CSSProperties;
  dropdownClassName?: string;
  dropdownStyle?: React.CSSProperties;
}

export function Dropdown<T = any>({
  options: initialOptions,
  value: controlledValue,
  defaultValue,
  onChange,
  placeholder = 'Select...',
  label,
  error,
  helperText,
  multiple = false,
  searchable = false,
  clearable = false,
  disabled = false,
  loading = false,
  groups = false,
  virtualScroll = false,
  maxHeight = 300,
  maxSelections,
  async = false,
  loadOptions,
  size = 'md',
  variant = 'default',
  fullWidth = false,
  renderOption,
  renderValue,
  renderGroup,
  className,
  style,
  dropdownClassName,
  dropdownStyle,
}: DropdownProps<T>) {
  const [internalValue, setInternalValue] = useState<T | T[] | null>(
    multiple ? (defaultValue as T[]) || [] : defaultValue || null
  );
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [options, setOptions] = useState(initialOptions);
  const [asyncLoading, setAsyncLoading] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const currentValue = controlledValue !== undefined ? controlledValue : internalValue;
  
  // Filter options based on search
  const filteredOptions = useMemo(() => {
    if (!searchQuery) return options;
    
    return options.filter(option => {
      const label = typeof option.label === 'string' ? option.label : '';
      return label.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [options, searchQuery]);
  
  // Group options if needed
  const groupedOptions = useMemo(() => {
    if (!groups) return { '': filteredOptions };
    
    return filteredOptions.reduce((acc, option) => {
      const group = option.group || '';
      if (!acc[group]) acc[group] = [];
      acc[group].push(option);
      return acc;
    }, {} as Record<string, DropdownOption<T>[]>);
  }, [filteredOptions, groups]);
  
  // Load async options
  useEffect(() => {
    if (!async || !loadOptions || !isOpen) return undefined;
    
    const loadData = async () => {
      setAsyncLoading(true);
      try {
        const newOptions = await loadOptions(searchQuery);
        setOptions(newOptions);
      } catch (error) {
        console.error('Failed to load options:', error);
      } finally {
        setAsyncLoading(false);
      }
    };
    
    const debounceTimer = setTimeout(loadData, 300);
    return () => clearTimeout(debounceTimer);
  }, [async, loadOptions, searchQuery, isOpen]);
  
  // Handle value change
  const handleValueChange = useCallback((option: DropdownOption<T>) => {
    if (option.disabled) return;
    
    let newValue: T | T[] | null;
    
    if (multiple) {
      const currentArray = (currentValue || []) as T[];
      const isSelected = currentArray.some(v => v === option.value);
      
      if (isSelected) {
        newValue = currentArray.filter(v => v !== option.value);
      } else {
        if (maxSelections && currentArray.length >= maxSelections) return;
        newValue = [...currentArray, option.value];
      }
    } else {
      newValue = option.value;
      setIsOpen(false);
    }
    
    setInternalValue(newValue);
    onChange?.(newValue);
    setSearchQuery('');
  }, [currentValue, multiple, maxSelections, onChange]);
  
  // Handle clear
  const handleClear = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const newValue = multiple ? [] : null;
    setInternalValue(newValue);
    onChange?.(newValue);
    setSearchQuery('');
  }, [multiple, onChange]);
  
  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < filteredOptions.length - 1 ? prev + 1 : 0
        );
        break;
        
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : filteredOptions.length - 1
        );
        break;
        
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
          handleValueChange(filteredOptions[highlightedIndex]);
        }
        break;
        
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        break;
    }
  }, [isOpen, filteredOptions, highlightedIndex, handleValueChange]);
  
  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
    return undefined;
  }, [isOpen]);
  
  // Get size styles
  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return {
          padding: `${SPACING.xs} ${SPACING.sm}`,
          fontSize: TYPOGRAPHY.fontSize.xs,
          minHeight: '32px',
        };
      case 'lg':
        return {
          padding: `${SPACING.md} ${SPACING.lg}`,
          fontSize: TYPOGRAPHY.fontSize.md,
          minHeight: '48px',
        };
      case 'md':
      default:
        return {
          padding: `${SPACING.sm} ${SPACING.md}`,
          fontSize: TYPOGRAPHY.fontSize.sm,
          minHeight: '40px',
        };
    }
  };
  
  // Get variant styles
  const getVariantStyles = () => {
    switch (variant) {
      case 'filled':
        return {
          backgroundColor: COLORS.background.secondary,
          border: `1px solid transparent`,
        };
      case 'outlined':
        return {
          backgroundColor: 'transparent',
          border: `1px solid ${COLORS.border.primary}`,
        };
      case 'default':
      default:
        return {
          backgroundColor: COLORS.background.primary,
          border: `1px solid ${COLORS.border.primary}`,
        };
    }
  };
  
  const sizeStyles = getSizeStyles();
  const variantStyles = getVariantStyles();
  
  // Check if value is selected
  const isValueSelected = (optionValue: T) => {
    if (multiple) {
      return ((currentValue || []) as T[]).includes(optionValue);
    }
    return currentValue === optionValue;
  };
  
  // Get display value
  const getDisplayValue = () => {
    if (renderValue && currentValue) {
      return renderValue(currentValue);
    }
    
    if (multiple) {
      const selectedValues = (currentValue || []) as T[];
      if (selectedValues.length === 0) return null;
      
      const selectedOptions = options.filter(opt => 
        selectedValues.includes(opt.value)
      );
      
      if (selectedOptions.length === 0) return null;
      
      return (
        <div style={{ display: 'flex', gap: SPACING.xs, flexWrap: 'wrap' }}>
          {selectedOptions.map((opt, i) => (
            <span
              key={i}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: SPACING.xs,
                padding: `2px ${SPACING.xs}`,
                backgroundColor: COLORS.background.secondary,
                borderRadius: RADIUS.sm,
                fontSize: '0.9em',
              }}
            >
              {opt.icon}
              {opt.label}
              {clearable && !disabled && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleValueChange(opt);
                  }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: COLORS.text.muted,
                    cursor: 'pointer',
                    padding: 0,
                    display: 'flex',
                  }}
                >
                  <X size={12} />
                </button>
              )}
            </span>
          ))}
        </div>
      );
    } else {
      const selectedOption = options.find(opt => opt.value === currentValue);
      if (!selectedOption) return null;
      
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.xs }}>
          {selectedOption.icon}
          {selectedOption.label}
        </div>
      );
    }
  };
  
  const displayValue = getDisplayValue();
  const hasValue = multiple ? (currentValue as T[])?.length > 0 : currentValue !== null;
  
  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        position: 'relative',
        width: fullWidth ? '100%' : 'auto',
        ...style,
      }}
    >
      {label && (
        <div style={{
          marginBottom: SPACING.xs,
          fontSize: TYPOGRAPHY.fontSize.sm,
          fontWeight: TYPOGRAPHY.fontWeight.medium,
          color: COLORS.text.primary,
        }}>
          {label}
        </div>
      )}
      
      {/* Trigger */}
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        tabIndex={disabled ? -1 : 0}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: SPACING.sm,
          ...sizeStyles,
          ...variantStyles,
          borderRadius: RADIUS.md,
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.5 : 1,
          transition: 'all 0.2s ease',
          ...(isOpen && {
            borderColor: COLORS.border.focus,
            boxShadow: `0 0 0 2px ${COLORS.border.focus}20`,
          }),
          ...(error && {
            borderColor: COLORS.status.error,
          }),
        }}
      >
        {/* Search input or display value */}
        {searchable && isOpen ? (
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={placeholder}
            autoFocus
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              fontSize: sizeStyles.fontSize,
              color: COLORS.text.primary,
            }}
          />
        ) : (
          <div style={{
            flex: 1,
            color: hasValue ? COLORS.text.primary : COLORS.text.muted,
          }}>
            {displayValue || placeholder}
          </div>
        )}
        
        {/* Icons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.xs }}>
          {loading && <Loader size={16} className="animate-spin" />}
          {clearable && hasValue && !disabled && (
            <button
              onClick={handleClear}
              style={{
                background: 'transparent',
                border: 'none',
                color: COLORS.text.muted,
                cursor: 'pointer',
                padding: 0,
                display: 'flex',
              }}
            >
              <X size={16} />
            </button>
          )}
          <ChevronDown
            size={16}
            style={{
              color: COLORS.text.muted,
              transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease',
            }}
          />
        </div>
      </div>
      
      {/* Helper text or error */}
      {(helperText || error) && (
        <div style={{
          marginTop: SPACING.xs,
          fontSize: TYPOGRAPHY.fontSize.xs,
          color: error ? COLORS.status.error : COLORS.text.secondary,
        }}>
          {error || helperText}
        </div>
      )}
      
      {/* Dropdown */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className={dropdownClassName}
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            marginTop: SPACING.xs,
            maxHeight,
            overflowY: 'auto',
            backgroundColor: COLORS.background.elevated,
            border: `1px solid ${COLORS.border.primary}`,
            borderRadius: RADIUS.md,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            zIndex: 1000,
            ...dropdownStyle,
          }}
        >
          {asyncLoading ? (
            <div style={{
              padding: SPACING.md,
              textAlign: 'center',
              color: COLORS.text.muted,
            }}>
              Loading...
            </div>
          ) : filteredOptions.length === 0 ? (
            <div style={{
              padding: SPACING.md,
              textAlign: 'center',
              color: COLORS.text.muted,
            }}>
              No options found
            </div>
          ) : (
            Object.entries(groupedOptions).map(([group, groupOptions]) => (
              <div key={group}>
                {group && renderGroup ? (
                  renderGroup(group)
                ) : group ? (
                  <div style={{
                    padding: `${SPACING.xs} ${SPACING.md}`,
                    fontSize: TYPOGRAPHY.fontSize.xs,
                    fontWeight: TYPOGRAPHY.fontWeight.medium,
                    color: COLORS.text.secondary,
                    backgroundColor: COLORS.background.secondary,
                  }}>
                    {group}
                  </div>
                ) : null}
                
                {groupOptions.map((option, index) => {
                  const isSelected = isValueSelected(option.value);
                  const globalIndex = filteredOptions.indexOf(option);
                  const isHighlighted = globalIndex === highlightedIndex;
                  
                  if (renderOption) {
                    return (
                      <div
                        key={index}
                        onClick={() => handleValueChange(option)}
                        style={{ cursor: option.disabled ? 'not-allowed' : 'pointer' }}
                      >
                        {renderOption(option, isSelected)}
                      </div>
                    );
                  }
                  
                  return (
                    <div
                      key={index}
                      onClick={() => handleValueChange(option)}
                      onMouseEnter={() => setHighlightedIndex(globalIndex)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: `${SPACING.sm} ${SPACING.md}`,
                        cursor: option.disabled ? 'not-allowed' : 'pointer',
                        backgroundColor: isHighlighted ? COLORS.background.hover : 
                                       isSelected ? COLORS.background.selected : 'transparent',
                        color: option.disabled ? COLORS.text.muted : COLORS.text.primary,
                        opacity: option.disabled ? 0.5 : 1,
                        transition: 'background-color 0.1s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.sm, flex: 1 }}>
                        {option.icon}
                        <div>
                          <div>{option.label}</div>
                          {option.description && (
                            <div style={{
                              fontSize: TYPOGRAPHY.fontSize.xs,
                              color: COLORS.text.secondary,
                              marginTop: '2px',
                            }}>
                              {option.description}
                            </div>
                          )}
                        </div>
                      </div>
                      {isSelected && <Check size={16} color={COLORS.text.accent} />}
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}