import React from 'react';
import { X } from 'lucide-react';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../styles/plugin-styles';

export interface BadgeProps {
  children: React.ReactNode;
  
  // Variants
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info' | 'outline';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  
  // Display options
  dot?: boolean;
  count?: number;
  max?: number;
  showZero?: boolean;
  
  // Removable
  removable?: boolean;
  onRemove?: () => void;
  
  // Icon
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  
  // Style
  color?: string;
  backgroundColor?: string;
  borderColor?: string;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}

export interface TagProps extends Omit<BadgeProps, 'dot' | 'count' | 'max' | 'showZero'> {
  // Additional tag-specific props
  selected?: boolean;
  disabled?: boolean;
  onSelect?: (selected: boolean) => void;
}

export function Badge({
  children,
  variant = 'default',
  size = 'md',
  dot = false,
  count,
  max = 99,
  showZero = false,
  removable = false,
  onRemove,
  icon,
  iconPosition = 'left',
  color,
  backgroundColor,
  borderColor,
  className,
  style,
  onClick,
}: BadgeProps) {
  // Get variant styles
  const getVariantStyles = () => {
    const variants = {
      default: {
        bg: backgroundColor || COLORS.background.tertiary,
        text: color || COLORS.text.primary,
        border: borderColor || COLORS.border.primary,
      },
      primary: {
        bg: backgroundColor || COLORS.text.accent,
        text: color || COLORS.background.primary,
        border: borderColor || COLORS.text.accent,
      },
      success: {
        bg: backgroundColor || COLORS.status.success,
        text: color || COLORS.background.primary,
        border: borderColor || COLORS.status.success,
      },
      warning: {
        bg: backgroundColor || COLORS.status.warning,
        text: color || COLORS.background.primary,
        border: borderColor || COLORS.status.warning,
      },
      error: {
        bg: backgroundColor || COLORS.status.error,
        text: color || COLORS.background.primary,
        border: borderColor || COLORS.status.error,
      },
      info: {
        bg: backgroundColor || COLORS.status.info,
        text: color || COLORS.background.primary,
        border: borderColor || COLORS.status.info,
      },
      outline: {
        bg: backgroundColor || 'transparent',
        text: color || COLORS.text.primary,
        border: borderColor || COLORS.border.primary,
      },
    };
    
    return variants[variant] || variants.default;
  };
  
  // Get size styles
  const getSizeStyles = () => {
    const sizes = {
      xs: {
        padding: `1px ${SPACING.xs}`,
        fontSize: '10px',
        height: '16px',
        dotSize: 6,
      },
      sm: {
        padding: `${SPACING.xs} ${SPACING.sm}`,
        fontSize: TYPOGRAPHY.fontSize.xs,
        height: '20px',
        dotSize: 8,
      },
      md: {
        padding: `${SPACING.xs} ${SPACING.md}`,
        fontSize: TYPOGRAPHY.fontSize.sm,
        height: '24px',
        dotSize: 10,
      },
      lg: {
        padding: `${SPACING.sm} ${SPACING.lg}`,
        fontSize: TYPOGRAPHY.fontSize.md,
        height: '28px',
        dotSize: 12,
      },
    };
    
    return sizes[size] || sizes.md;
  };
  
  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();
  
  // Format count
  const displayCount = count !== undefined
    ? count > max ? `${max}+` : count.toString()
    : null;
  
  // Don't render if count is 0 and showZero is false
  if (count === 0 && !showZero && !children) {
    return null;
  }
  
  // Render dot badge
  if (dot) {
    return (
      <span
        className={className}
        style={{
          position: 'relative',
          display: 'inline-block',
          ...style,
        }}
      >
        {children}
        <span
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            transform: 'translate(50%, -50%)',
            width: sizeStyles.dotSize,
            height: sizeStyles.dotSize,
            borderRadius: '50%',
            backgroundColor: variantStyles.bg,
            border: `1px solid ${COLORS.background.primary}`,
          }}
        />
      </span>
    );
  }
  
  // Render count badge
  if (displayCount !== null && !children) {
    return (
      <span
        className={className}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          minWidth: sizeStyles.height,
          height: sizeStyles.height,
          padding: `0 ${SPACING.xs}`,
          borderRadius: RADIUS.full,
          backgroundColor: variantStyles.bg,
          color: variantStyles.text,
          fontSize: sizeStyles.fontSize,
          fontWeight: TYPOGRAPHY.fontWeight.medium,
          cursor: onClick ? 'pointer' : 'default',
          ...style,
        }}
        onClick={onClick}
      >
        {displayCount}
      </span>
    );
  }
  
  // Render regular badge
  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: SPACING.xs,
        padding: sizeStyles.padding,
        borderRadius: RADIUS.sm,
        backgroundColor: variantStyles.bg,
        color: variantStyles.text,
        border: variant === 'outline' ? `1px solid ${variantStyles.border}` : 'none',
        fontSize: sizeStyles.fontSize,
        fontWeight: TYPOGRAPHY.fontWeight.medium,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s ease',
        ...style,
      }}
      onClick={onClick}
    >
      {icon && iconPosition === 'left' && (
        <span style={{ display: 'flex', alignItems: 'center' }}>{icon}</span>
      )}
      
      {children}
      
      {displayCount !== null && (
        <span style={{
          marginLeft: SPACING.xs,
          padding: `0 ${SPACING.xs}`,
          backgroundColor: `${variantStyles.text}20`,
          borderRadius: RADIUS.full,
          fontSize: '0.85em',
        }}>
          {displayCount}
        </span>
      )}
      
      {icon && iconPosition === 'right' && !removable && (
        <span style={{ display: 'flex', alignItems: 'center' }}>{icon}</span>
      )}
      
      {removable && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove?.();
          }}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'inherit',
            cursor: 'pointer',
            padding: 0,
            marginLeft: SPACING.xs,
            display: 'flex',
            alignItems: 'center',
            opacity: 0.7,
            transition: 'opacity 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = '1';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = '0.7';
          }}
        >
          <X size={12} />
        </button>
      )}
    </span>
  );
}

export function Tag({
  children,
  variant = 'default',
  size = 'md',
  selected = false,
  disabled = false,
  removable = false,
  onRemove,
  onSelect,
  icon,
  iconPosition = 'left',
  color,
  backgroundColor,
  borderColor,
  className,
  style,
  onClick,
}: TagProps) {
  const handleClick = () => {
    if (disabled) return;
    
    if (onSelect) {
      onSelect(!selected);
    }
    
    if (onClick) {
      onClick();
    }
  };
  
  // Override styles for selected/disabled states
  const getStateStyles = () => {
    if (disabled) {
      return {
        opacity: 0.5,
        cursor: 'not-allowed',
      };
    }
    
    if (selected) {
      return {
        backgroundColor: backgroundColor || COLORS.background.selected,
        color: color || COLORS.text.accent,
        borderColor: borderColor || COLORS.border.focus,
      };
    }
    
    return {};
  };
  
  return (
    <Badge
      variant={variant}
      size={size}
      removable={removable}
      onRemove={onRemove}
      icon={icon}
      iconPosition={iconPosition}
      color={color}
      backgroundColor={backgroundColor}
      borderColor={borderColor}
      className={className}
      style={{
        cursor: disabled ? 'not-allowed' : (onSelect ? 'pointer' : 'default'),
        ...getStateStyles(),
        ...style,
      }}
      onClick={handleClick}
    >
      {children}
    </Badge>
  );
}

// Tag Group component for managing multiple tags
export interface TagGroupProps {
  tags: Array<{
    id: string;
    label: string;
    icon?: React.ReactNode;
    color?: string;
    removable?: boolean;
  }>;
  selectedIds?: string[];
  onSelect?: (id: string, selected: boolean) => void;
  onRemove?: (id: string) => void;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info' | 'outline';
  gap?: number;
  wrap?: boolean;
  maxVisible?: number;
  className?: string;
  style?: React.CSSProperties;
}

export function TagGroup({
  tags,
  selectedIds = [],
  onSelect,
  onRemove,
  size = 'md',
  variant = 'default',
  gap = 8,
  wrap = true,
  maxVisible,
  className,
  style,
}: TagGroupProps) {
  const visibleTags = maxVisible ? tags.slice(0, maxVisible) : tags;
  const hiddenCount = maxVisible && tags.length > maxVisible ? tags.length - maxVisible : 0;
  
  return (
    <div
      className={className}
      style={{
        display: 'flex',
        flexWrap: wrap ? 'wrap' : 'nowrap',
        gap,
        alignItems: 'center',
        ...style,
      }}
    >
      {visibleTags.map((tag) => (
        <Tag
          key={tag.id}
          size={size}
          variant={variant}
          selected={selectedIds.includes(tag.id)}
          removable={tag.removable}
          icon={tag.icon}
          color={tag.color}
          onSelect={onSelect ? (selected) => onSelect(tag.id, selected) : undefined}
          onRemove={onRemove ? () => onRemove(tag.id) : undefined}
        >
          {tag.label}
        </Tag>
      ))}
      
      {hiddenCount > 0 && (
        <Badge size={size} variant="outline">
          +{hiddenCount} more
        </Badge>
      )}
    </div>
  );
}