import React from 'react';
import { AlertCircle, CheckCircle, Info, AlertTriangle, X } from 'lucide-react';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../styles/plugin-styles';

export interface AlertProps {
  // Content
  title?: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  
  // Type
  type?: 'info' | 'success' | 'warning' | 'error';
  
  // Display
  variant?: 'default' | 'filled' | 'outlined' | 'light';
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  closable?: boolean;
  
  // Actions
  action?: {
    label: React.ReactNode;
    onClick: () => void;
  };
  onClose?: () => void;
  
  // Style
  className?: string;
  style?: React.CSSProperties;
}

export function Alert({
  title,
  description,
  icon,
  type = 'info',
  variant = 'default',
  size = 'md',
  showIcon = true,
  closable = false,
  action,
  onClose,
  className,
  style,
}: AlertProps) {
  // Get type configuration
  const getTypeConfig = () => {
    const configs = {
      info: {
        icon: <Info />,
        color: COLORS.status.info,
      },
      success: {
        icon: <CheckCircle />,
        color: COLORS.status.success,
      },
      warning: {
        icon: <AlertTriangle />,
        color: COLORS.status.warning,
      },
      error: {
        icon: <AlertCircle />,
        color: COLORS.status.error,
      },
    };
    
    return configs[type];
  };
  
  // Get size styles
  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return {
          padding: `${SPACING.sm} ${SPACING.md}`,
          fontSize: TYPOGRAPHY.fontSize.xs,
          iconSize: 16,
        };
      case 'lg':
        return {
          padding: `${SPACING.lg} ${SPACING.xl}`,
          fontSize: TYPOGRAPHY.fontSize.md,
          iconSize: 24,
        };
      case 'md':
      default:
        return {
          padding: `${SPACING.md} ${SPACING.lg}`,
          fontSize: TYPOGRAPHY.fontSize.sm,
          iconSize: 20,
        };
    }
  };
  
  // Get variant styles
  const getVariantStyles = (color: string) => {
    switch (variant) {
      case 'filled':
        return {
          backgroundColor: color,
          color: COLORS.background.primary,
          border: `1px solid ${color}`,
        };
      case 'outlined':
        return {
          backgroundColor: 'transparent',
          color: COLORS.text.primary,
          border: `1px solid ${color}`,
        };
      case 'light':
        return {
          backgroundColor: `${color}15`,
          color: COLORS.text.primary,
          border: `1px solid ${color}30`,
        };
      case 'default':
      default:
        return {
          backgroundColor: `${color}10`,
          color: COLORS.text.primary,
          border: `1px solid ${color}50`,
        };
    }
  };
  
  const typeConfig = getTypeConfig();
  const sizeStyles = getSizeStyles();
  const variantStyles = getVariantStyles(typeConfig.color);
  const displayIcon = icon || (showIcon && typeConfig.icon);
  
  return (
    <div
      className={className}
      role="alert"
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: SPACING.md,
        padding: sizeStyles.padding,
        borderRadius: RADIUS.md,
        ...variantStyles,
        ...style,
      }}
    >
      {/* Icon */}
      {displayIcon && (
        <div style={{
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          color: variant === 'filled' ? 'inherit' : typeConfig.color,
        }}>
          {React.isValidElement(displayIcon) 
            ? React.cloneElement(displayIcon as React.ReactElement<any>, {
                size: sizeStyles.iconSize,
              })
            : displayIcon
          }
        </div>
      )}
      
      {/* Content */}
      <div style={{ flex: 1 }}>
        {title && (
          <div style={{
            fontSize: sizeStyles.fontSize,
            fontWeight: TYPOGRAPHY.fontWeight.medium,
            marginBottom: description ? SPACING.xs : 0,
          }}>
            {title}
          </div>
        )}
        
        {description && (
          <div style={{
            fontSize: sizeStyles.fontSize,
            opacity: 0.9,
            lineHeight: 1.5,
          }}>
            {description}
          </div>
        )}
        
        {action && (
          <button
            onClick={action.onClick}
            style={{
              marginTop: SPACING.sm,
              padding: `${SPACING.xs} ${SPACING.sm}`,
              backgroundColor: variant === 'filled' ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
              border: `1px solid ${variant === 'filled' ? 'rgba(255, 255, 255, 0.3)' : typeConfig.color}`,
              borderRadius: RADIUS.sm,
              color: variant === 'filled' ? 'inherit' : typeConfig.color,
              fontSize: TYPOGRAPHY.fontSize.xs,
              fontWeight: TYPOGRAPHY.fontWeight.medium,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = variant === 'filled' 
                ? 'rgba(255, 255, 255, 0.3)'
                : `${typeConfig.color}10`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = variant === 'filled'
                ? 'rgba(255, 255, 255, 0.2)'
                : 'transparent';
            }}
          >
            {action.label}
          </button>
        )}
      </div>
      
      {/* Close button */}
      {closable && (
        <button
          onClick={onClose}
          style={{
            flexShrink: 0,
            background: 'transparent',
            border: 'none',
            color: variant === 'filled' ? 'inherit' : COLORS.text.muted,
            cursor: 'pointer',
            padding: SPACING.xs,
            display: 'flex',
            alignItems: 'center',
            borderRadius: RADIUS.sm,
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = variant === 'filled'
              ? 'rgba(255, 255, 255, 0.2)'
              : COLORS.background.hover;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
          aria-label="Close alert"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}