import React from 'react';
import { RefreshCw, Download, Upload, Settings, Trash2 } from 'lucide-react';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../styles/plugin-styles';
import { SearchInput } from './SearchInput';
import { Dropdown } from './Dropdown';
import { Tooltip } from './Tooltip';

export interface ToolbarAction {
  id: string;
  label?: React.ReactNode;
  icon?: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  tooltip?: string;
  variant?: 'default' | 'primary' | 'danger';
  badge?: React.ReactNode;
  dropdown?: {
    options: Array<{
      value: string;
      label: React.ReactNode;
      icon?: React.ReactNode;
      onClick?: () => void;
      disabled?: boolean;
      divider?: boolean;
    }>;
  };
}

export interface ToolbarGroup {
  id: string;
  actions: ToolbarAction[];
  align?: 'left' | 'right' | 'center';
}

export interface ToolbarProps {
  // Actions
  actions?: ToolbarAction[];
  groups?: ToolbarGroup[];
  
  // Search
  showSearch?: boolean;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  
  // Filters
  filters?: Array<{
    id: string;
    label: React.ReactNode;
    options: Array<{
      value: any;
      label: React.ReactNode;
    }>;
    value?: any;
    onChange?: (value: any) => void;
    multiple?: boolean;
  }>;
  
  // Quick Actions
  showRefresh?: boolean;
  onRefresh?: () => void;
  refreshing?: boolean;
  
  showClear?: boolean;
  onClear?: () => void;
  
  showExport?: boolean;
  onExport?: () => void;
  
  showImport?: boolean;
  onImport?: () => void;
  
  showSettings?: boolean;
  onSettings?: () => void;
  
  // Title
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  
  // Display
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'compact' | 'minimal';
  sticky?: boolean;
  
  // Custom content
  leftContent?: React.ReactNode;
  centerContent?: React.ReactNode;
  rightContent?: React.ReactNode;
  
  // Style
  className?: string;
  style?: React.CSSProperties;
}

export function Toolbar({
  actions = [],
  groups = [],
  showSearch = false,
  searchValue = '',
  onSearchChange,
  searchPlaceholder = 'Search...',
  filters = [],
  showRefresh = false,
  onRefresh,
  refreshing = false,
  showClear = false,
  onClear,
  showExport = false,
  onExport,
  showImport = false,
  onImport,
  showSettings = false,
  onSettings,
  title,
  subtitle,
  size = 'md',
  variant = 'default',
  sticky = false,
  leftContent,
  centerContent,
  rightContent,
  className,
  style,
}: ToolbarProps) {
  // Get size styles
  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return {
          padding: `${SPACING.xs} ${SPACING.sm}`,
          buttonPadding: `${SPACING.xs} ${SPACING.sm}`,
          fontSize: TYPOGRAPHY.fontSize.xs,
          iconSize: 14,
          gap: SPACING.xs,
        };
      case 'lg':
        return {
          padding: `${SPACING.md} ${SPACING.lg}`,
          buttonPadding: `${SPACING.sm} ${SPACING.md}`,
          fontSize: TYPOGRAPHY.fontSize.md,
          iconSize: 20,
          gap: SPACING.md,
        };
      case 'md':
      default:
        return {
          padding: `${SPACING.sm} ${SPACING.md}`,
          buttonPadding: `6px ${SPACING.sm}`,
          fontSize: TYPOGRAPHY.fontSize.sm,
          iconSize: 16,
          gap: SPACING.sm,
        };
    }
  };
  
  const sizeStyles = getSizeStyles();
  
  // Build quick actions
  const quickActions: ToolbarAction[] = [];
  
  if (showRefresh) {
    quickActions.push({
      id: 'refresh',
      icon: <RefreshCw size={sizeStyles.iconSize} className={refreshing ? 'animate-spin' : ''} />,
      onClick: onRefresh,
      disabled: refreshing,
      tooltip: 'Refresh',
    });
  }
  
  if (showClear) {
    quickActions.push({
      id: 'clear',
      icon: <Trash2 size={sizeStyles.iconSize} />,
      onClick: onClear,
      tooltip: 'Clear',
      variant: 'danger',
    });
  }
  
  if (showExport) {
    quickActions.push({
      id: 'export',
      icon: <Download size={sizeStyles.iconSize} />,
      onClick: onExport,
      tooltip: 'Export',
    });
  }
  
  if (showImport) {
    quickActions.push({
      id: 'import',
      icon: <Upload size={sizeStyles.iconSize} />,
      onClick: onImport,
      tooltip: 'Import',
    });
  }
  
  if (showSettings) {
    quickActions.push({
      id: 'settings',
      icon: <Settings size={sizeStyles.iconSize} />,
      onClick: onSettings,
      tooltip: 'Settings',
    });
  }
  
  // Render action button
  const renderAction = (action: ToolbarAction) => {
    const getActionStyles = () => {
      let bgColor: string = 'transparent';
      let textColor: string = COLORS.text.primary;
      let borderColor: string = COLORS.border.primary;
      
      switch (action.variant) {
        case 'primary':
          bgColor = COLORS.text.accent;
          textColor = COLORS.background.primary;
          borderColor = COLORS.text.accent;
          break;
        case 'danger':
          bgColor = 'transparent';
          textColor = COLORS.status.error;
          borderColor = COLORS.status.error;
          break;
      }
      
      return { bgColor, textColor, borderColor };
    };
    
    const actionStyles = getActionStyles();
    
    if (action.dropdown) {
      return (
        <Dropdown
          key={action.id}
          options={action.dropdown.options.map(opt => ({
            value: opt.value,
            label: opt.label,
            icon: opt.icon,
            disabled: opt.disabled,
          }))}
          onChange={(value) => {
            const option = action.dropdown!.options.find(o => o.value === value);
            option?.onClick?.();
          }}
          renderValue={() => (
            <div style={{ display: 'flex', alignItems: 'center', gap: sizeStyles.gap }}>
              {action.icon}
              {action.label && <span>{action.label}</span>}
              {action.badge}
            </div>
          )}
          size={size}
          disabled={action.disabled}
        />
      );
    }
    
    const button = (
      <button
        key={action.id}
        onClick={action.onClick}
        disabled={action.disabled}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: sizeStyles.gap,
          padding: sizeStyles.buttonPadding,
          backgroundColor: actionStyles.bgColor,
          color: actionStyles.textColor,
          border: variant === 'minimal' ? 'none' : `1px solid ${actionStyles.borderColor}`,
          borderRadius: RADIUS.sm,
          fontSize: sizeStyles.fontSize,
          fontWeight: action.label ? TYPOGRAPHY.fontWeight.medium : undefined,
          cursor: action.disabled ? 'not-allowed' : 'pointer',
          opacity: action.disabled ? 0.5 : 1,
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={(e) => {
          if (!action.disabled) {
            if (action.variant === 'primary') {
              e.currentTarget.style.opacity = '0.9';
            } else {
              e.currentTarget.style.backgroundColor = COLORS.background.hover;
            }
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = actionStyles.bgColor;
          e.currentTarget.style.opacity = action.disabled ? '0.5' : '1';
        }}
      >
        {action.icon}
        {action.label && <span>{action.label}</span>}
        {action.badge}
      </button>
    );
    
    return action.tooltip ? (
      <Tooltip key={action.id} content={action.tooltip} position="bottom">
        {button}
      </Tooltip>
    ) : button;
  };
  
  // Organize groups by alignment
  const leftGroups = groups.filter(g => !g.align || g.align === 'left');
  const centerGroups = groups.filter(g => g.align === 'center');
  const rightGroups = groups.filter(g => g.align === 'right');
  
  // All actions as single group if no groups specified
  const allActions = groups.length === 0 ? [...actions, ...quickActions] : quickActions;
  
  return (
    <div
      className={className}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: sizeStyles.gap,
        padding: variant === 'minimal' ? 0 : sizeStyles.padding,
        backgroundColor: variant === 'minimal' ? 'transparent' : COLORS.background.secondary,
        borderBottom: variant === 'compact' ? 'none' : `1px solid ${COLORS.border.primary}`,
        ...(sticky && {
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }),
        ...style,
      }}
    >
      {/* Left section */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: sizeStyles.gap,
        flex: 1,
      }}>
        {/* Title */}
        {(title || subtitle) && (
          <div style={{ marginRight: SPACING.md }}>
            {title && (
              <div style={{
                fontSize: size === 'sm' ? TYPOGRAPHY.fontSize.sm : TYPOGRAPHY.fontSize.md,
                fontWeight: TYPOGRAPHY.fontWeight.semibold,
                color: COLORS.text.primary,
              }}>
                {title}
              </div>
            )}
            {subtitle && (
              <div style={{
                fontSize: TYPOGRAPHY.fontSize.xs,
                color: COLORS.text.secondary,
              }}>
                {subtitle}
              </div>
            )}
          </div>
        )}
        
        {/* Left content */}
        {leftContent}
        
        {/* Left groups */}
        {leftGroups.map(group => (
          <div key={group.id} style={{ display: 'flex', gap: sizeStyles.gap }}>
            {group.actions.map(renderAction)}
          </div>
        ))}
        
        {/* Default actions if no groups */}
        {groups.length === 0 && actions.map(renderAction)}
        
        {/* Search */}
        {showSearch && (
          <SearchInput
            value={searchValue}
            onChange={onSearchChange || (() => {})}
            placeholder={searchPlaceholder}
            size={size === 'lg' ? 'md' : size}
            style={{ maxWidth: '200px' }}
          />
        )}
        
        {/* Filters */}
        {filters.map(filter => (
          <Dropdown
            key={filter.id}
            options={filter.options}
            value={filter.value}
            onChange={filter.onChange}
            multiple={filter.multiple}
            placeholder={typeof filter.label === 'string' ? filter.label : 'Filter'}
            size={size}
            variant="outlined"
            style={{ minWidth: '120px' }}
          />
        ))}
      </div>
      
      {/* Center section */}
      {(centerContent || centerGroups.length > 0) && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: sizeStyles.gap,
        }}>
          {centerContent}
          {centerGroups.map(group => (
            <div key={group.id} style={{ display: 'flex', gap: sizeStyles.gap }}>
              {group.actions.map(renderAction)}
            </div>
          ))}
        </div>
      )}
      
      {/* Right section */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: sizeStyles.gap,
      }}>
        {/* Right content */}
        {rightContent}
        
        {/* Right groups */}
        {rightGroups.map(group => (
          <div key={group.id} style={{ display: 'flex', gap: sizeStyles.gap }}>
            {group.actions.map(renderAction)}
          </div>
        ))}
        
        {/* Quick actions if no groups */}
        {groups.length === 0 && allActions.filter(a => quickActions.includes(a)).map(renderAction)}
      </div>
      
      {/* Animation for refresh */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        
        .animate-spin {
          animation: spin 1s linear infinite;
        }
      ` }} />
    </div>
  );
}