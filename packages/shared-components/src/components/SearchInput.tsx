import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Search, X, History } from 'lucide-react';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../styles/plugin-styles';

export interface SearchInputProps {
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  
  // Features
  showIcon?: boolean;
  clearable?: boolean;
  showHistory?: boolean;
  showSuggestions?: boolean;
  showFilter?: boolean;
  caseSensitive?: boolean;
  useRegex?: boolean;
  debounceMs?: number;
  
  // History & Suggestions
  maxHistory?: number;
  history?: string[];
  suggestions?: string[];
  onHistorySelect?: (query: string) => void;
  onSuggestionSelect?: (suggestion: string) => void;
  
  // Search options
  searchOptions?: {
    matchCase?: boolean;
    matchWholeWord?: boolean;
    useRegex?: boolean;
  };
  
  // Callbacks
  onChange?: (value: string) => void;
  onSearch?: (value: string, options?: SearchOptions) => void;
  onClear?: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
  onKeyDown?: (event: React.KeyboardEvent) => void;
  
  // Validation
  validate?: (value: string) => string | null;
  errorMessage?: string;
  
  // Style
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'filled' | 'outlined';
  className?: string;
  style?: React.CSSProperties;
  disabled?: boolean;
  autoFocus?: boolean;
}

export interface SearchOptions {
  matchCase: boolean;
  matchWholeWord: boolean;
  useRegex: boolean;
}

export function SearchInput({
  value: controlledValue,
  defaultValue = '',
  placeholder = 'Search...',
  showIcon = true,
  clearable = true,
  showHistory = false,
  showSuggestions = false,
  showFilter = false,
  caseSensitive = false,
  useRegex = false,
  debounceMs = 300,
  maxHistory = 5,
  history = [],
  suggestions = [],
  onHistorySelect,
  onSuggestionSelect,
  searchOptions = {},
  onChange,
  onSearch,
  onClear,
  onFocus,
  onBlur,
  onKeyDown,
  validate,
  errorMessage,
  size = 'md',
  variant = 'default',
  className,
  style,
  disabled = false,
  autoFocus = false,
}: SearchInputProps) {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const [isFocused, setIsFocused] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [options, setOptions] = useState<SearchOptions>({
    matchCase: searchOptions.matchCase ?? caseSensitive,
    matchWholeWord: searchOptions.matchWholeWord ?? false,
    useRegex: searchOptions.useRegex ?? useRegex,
  });
  
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const blurTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const value = controlledValue !== undefined ? controlledValue : internalValue;
  
  // Combine history and suggestions for dropdown
  const dropdownItems = [
    ...(showHistory && history.length > 0 ? history.slice(0, maxHistory) : []),
    ...(showSuggestions && suggestions.length > 0 ? suggestions : []),
  ];
  
  // Size styles
  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return {
          padding: `${SPACING.xs} ${SPACING.sm}`,
          fontSize: TYPOGRAPHY.fontSize.xs,
          height: '28px',
        };
      case 'lg':
        return {
          padding: `${SPACING.md} ${SPACING.lg}`,
          fontSize: TYPOGRAPHY.fontSize.md,
          height: '40px',
        };
      case 'md':
      default:
        return {
          padding: `${SPACING.sm} ${SPACING.md}`,
          fontSize: TYPOGRAPHY.fontSize.sm,
          height: '32px',
        };
    }
  };
  
  // Variant styles
  const getVariantStyles = () => {
    const base = {
      backgroundColor: COLORS.background.primary,
      border: `1px solid ${COLORS.border.primary}`,
      color: COLORS.text.primary,
    };
    
    switch (variant) {
      case 'filled':
        return {
          ...base,
          backgroundColor: COLORS.background.secondary,
          border: `1px solid transparent`,
        };
      case 'outlined':
        return {
          ...base,
          backgroundColor: 'transparent',
          border: `1px solid ${isFocused ? COLORS.border.focus : COLORS.border.primary}`,
        };
      case 'default':
      default:
        return base;
    }
  };
  
  // Handle value change
  const handleChange = useCallback((newValue: string) => {
    if (controlledValue === undefined) {
      setInternalValue(newValue);
    }
    
    // Validate
    if (validate) {
      const error = validate(newValue);
      setValidationError(error);
    }
    
    // Call onChange
    if (onChange) {
      onChange(newValue);
    }
    
    // Debounced search
    if (onSearch) {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      
      debounceTimeoutRef.current = setTimeout(() => {
        onSearch(newValue, options);
      }, debounceMs);
    }
  }, [controlledValue, onChange, onSearch, validate, options, debounceMs]);
  
  // Handle clear
  const handleClear = useCallback(() => {
    handleChange('');
    inputRef.current?.focus();
    if (onClear) onClear();
  }, [handleChange, onClear]);
  
  // Handle dropdown item selection
  const handleItemSelect = useCallback((item: string) => {
    handleChange(item);
    setShowDropdown(false);
    
    if (showHistory && history.includes(item) && onHistorySelect) {
      onHistorySelect(item);
    } else if (showSuggestions && suggestions.includes(item) && onSuggestionSelect) {
      onSuggestionSelect(item);
    }
    
    if (onSearch) {
      onSearch(item, options);
    }
  }, [handleChange, showHistory, showSuggestions, history, suggestions, onHistorySelect, onSuggestionSelect, onSearch, options]);
  
  // Handle keyboard navigation
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (showDropdown && dropdownItems.length > 0) {
      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          setSelectedIndex(prev => 
            prev < dropdownItems.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          event.preventDefault();
          setSelectedIndex(prev => 
            prev > 0 ? prev - 1 : dropdownItems.length - 1
          );
          break;
        case 'Enter':
          event.preventDefault();
          if (selectedIndex >= 0 && selectedIndex < dropdownItems.length) {
            handleItemSelect(dropdownItems[selectedIndex]);
          } else if (onSearch) {
            onSearch(value, options);
          }
          break;
        case 'Escape':
          setShowDropdown(false);
          setSelectedIndex(-1);
          break;
      }
    } else if (event.key === 'Enter' && onSearch) {
      onSearch(value, options);
    }
    
    if (onKeyDown) {
      onKeyDown(event);
    }
  }, [showDropdown, dropdownItems, selectedIndex, handleItemSelect, onSearch, value, options, onKeyDown]);
  
  // Handle focus
  const handleFocus = useCallback(() => {
    setIsFocused(true);
    if ((showHistory && history.length > 0) || (showSuggestions && suggestions.length > 0)) {
      setShowDropdown(true);
    }
    if (onFocus) onFocus();
  }, [showHistory, showSuggestions, history, suggestions, onFocus]);
  
  // Handle blur
  const handleBlur = useCallback(() => {
    setIsFocused(false);
    // Delay to allow dropdown item click
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
    }
    blurTimeoutRef.current = setTimeout(() => setShowDropdown(false), 200);
    if (onBlur) onBlur();
  }, [onBlur]);
  
  // Toggle search option
  const toggleOption = useCallback((option: keyof SearchOptions) => {
    setOptions(prev => ({
      ...prev,
      [option]: !prev[option],
    }));
  }, []);
  
  // Cleanup
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      if (blurTimeoutRef.current) {
        clearTimeout(blurTimeoutRef.current);
      }
    };
  }, []);
  
  const sizeStyles = getSizeStyles();
  const variantStyles = getVariantStyles();
  const hasError = validationError || errorMessage;
  
  return (
    <div className={className} style={{ position: 'relative', ...style }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        borderRadius: RADIUS.md,
        transition: 'all 0.2s ease',
        ...variantStyles,
        ...(hasError && { borderColor: COLORS.status.error }),
        ...(disabled && { opacity: 0.5, cursor: 'not-allowed' }),
      }}>
        {/* Search icon */}
        {showIcon && (
          <Search 
            size={16} 
            style={{ 
              marginLeft: SPACING.sm,
              color: COLORS.text.muted,
              flexShrink: 0,
            }} 
          />
        )}
        
        {/* Input */}
        <input
          ref={inputRef}
          type="text"
          value={value}
          placeholder={placeholder}
          disabled={disabled}
          autoFocus={autoFocus}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: COLORS.text.primary,
            ...sizeStyles,
            padding: `0 ${SPACING.sm}`,
          }}
        />
        
        {/* Filter options */}
        {showFilter && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: SPACING.xs,
            marginRight: SPACING.sm,
          }}>
            <button
              onClick={() => toggleOption('matchCase')}
              style={{
                background: options.matchCase ? COLORS.background.selected : 'transparent',
                border: 'none',
                color: options.matchCase ? COLORS.text.accent : COLORS.text.muted,
                padding: '2px 4px',
                borderRadius: RADIUS.sm,
                cursor: 'pointer',
                fontSize: '11px',
                fontWeight: TYPOGRAPHY.fontWeight.medium,
              }}
              title="Match case"
            >
              Aa
            </button>
            <button
              onClick={() => toggleOption('matchWholeWord')}
              style={{
                background: options.matchWholeWord ? COLORS.background.selected : 'transparent',
                border: 'none',
                color: options.matchWholeWord ? COLORS.text.accent : COLORS.text.muted,
                padding: '2px 4px',
                borderRadius: RADIUS.sm,
                cursor: 'pointer',
                fontSize: '11px',
                fontWeight: TYPOGRAPHY.fontWeight.medium,
              }}
              title="Match whole word"
            >
              W
            </button>
            <button
              onClick={() => toggleOption('useRegex')}
              style={{
                background: options.useRegex ? COLORS.background.selected : 'transparent',
                border: 'none',
                color: options.useRegex ? COLORS.text.accent : COLORS.text.muted,
                padding: '2px 4px',
                borderRadius: RADIUS.sm,
                cursor: 'pointer',
                fontSize: '11px',
                fontWeight: TYPOGRAPHY.fontWeight.medium,
              }}
              title="Use regular expression"
            >
              .*
            </button>
          </div>
        )}
        
        {/* Clear button */}
        {clearable && value && (
          <button
            onClick={handleClear}
            style={{
              background: 'transparent',
              border: 'none',
              color: COLORS.text.muted,
              cursor: 'pointer',
              padding: SPACING.xs,
              marginRight: SPACING.xs,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={16} />
          </button>
        )}
      </div>
      
      {/* Error message */}
      {hasError && (
        <div style={{
          color: COLORS.status.error,
          fontSize: TYPOGRAPHY.fontSize.xs,
          marginTop: SPACING.xs,
          marginLeft: SPACING.sm,
        }}>
          {validationError || errorMessage}
        </div>
      )}
      
      {/* Dropdown */}
      {showDropdown && dropdownItems.length > 0 && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          marginTop: SPACING.xs,
          backgroundColor: COLORS.background.elevated,
          border: `1px solid ${COLORS.border.primary}`,
          borderRadius: RADIUS.md,
          maxHeight: '200px',
          overflowY: 'auto',
          zIndex: 1000,
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
        }}>
          {dropdownItems.map((item, index) => {
            const isHistory = showHistory && history.includes(item);
            const isSelected = index === selectedIndex;
            
            return (
              <div
                key={item}
                onClick={() => handleItemSelect(item)}
                style={{
                  padding: `${SPACING.sm} ${SPACING.md}`,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: SPACING.sm,
                  backgroundColor: isSelected ? COLORS.background.hover : 'transparent',
                  color: COLORS.text.primary,
                  fontSize: TYPOGRAPHY.fontSize.sm,
                  transition: 'background-color 0.1s ease',
                }}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                {isHistory && <History size={14} style={{ color: COLORS.text.muted }} />}
                <span style={{ flex: 1 }}>{item}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}