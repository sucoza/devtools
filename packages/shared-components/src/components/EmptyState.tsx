import React from 'react';
import { FileX, Search, AlertCircle, Inbox, Database, Cloud, FolderOpen } from 'lucide-react';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../styles/plugin-styles';

export interface EmptyStateProps {
  // Content
  title?: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  image?: string;
  
  // Actions
  action?: {
    label: React.ReactNode;
    onClick: () => void;
    variant?: 'primary' | 'secondary';
  };
  secondaryAction?: {
    label: React.ReactNode;
    onClick: () => void;
  };
  
  // Presets
  preset?: 'no-data' | 'no-results' | 'error' | 'empty' | 'offline' | 'no-access';
  
  // Display
  size?: 'sm' | 'md' | 'lg';
  align?: 'left' | 'center' | 'right';
  
  // Style
  className?: string;
  style?: React.CSSProperties;
  iconClassName?: string;
  iconStyle?: React.CSSProperties;
}

export function EmptyState({
  title,
  description,
  icon,
  image,
  action,
  secondaryAction,
  preset,
  size = 'md',
  align = 'center',
  className,
  style,
  iconClassName,
  iconStyle,
}: EmptyStateProps) {
  // Get preset configuration
  const getPresetConfig = () => {
    switch (preset) {
      case 'no-data':
        return {
          icon: <Database size={48} />,
          title: title || 'No data yet',
          description: description || 'Start by adding some data to see it displayed here.',
        };
      case 'no-results':
        return {
          icon: <Search size={48} />,
          title: title || 'No results found',
          description: description || 'Try adjusting your search or filter criteria.',
        };
      case 'error':
        return {
          icon: <AlertCircle size={48} />,
          title: title || 'Something went wrong',
          description: description || 'An error occurred while loading the data. Please try again.',
        };
      case 'empty':
        return {
          icon: <Inbox size={48} />,
          title: title || 'All caught up',
          description: description || "You've reached the end. Nothing more to see here.",
        };
      case 'offline':
        return {
          icon: <Cloud size={48} />,
          title: title || 'You\'re offline',
          description: description || 'Check your internet connection and try again.',
        };
      case 'no-access':
        return {
          icon: <FolderOpen size={48} />,
          title: title || 'Access denied',
          description: description || 'You don\'t have permission to view this content.',
        };
      default:
        return {
          icon: icon || <FileX size={48} />,
          title: title || 'No content',
          description: description,
        };
    }
  };
  
  // Get size styles
  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return {
          padding: SPACING.md,
          iconSize: 32,
          titleSize: TYPOGRAPHY.fontSize.sm,
          descSize: TYPOGRAPHY.fontSize.xs,
          maxWidth: '300px',
        };
      case 'lg':
        return {
          padding: SPACING.xl,
          iconSize: 64,
          titleSize: TYPOGRAPHY.fontSize.xl,
          descSize: TYPOGRAPHY.fontSize.md,
          maxWidth: '500px',
        };
      case 'md':
      default:
        return {
          padding: SPACING.lg,
          iconSize: 48,
          titleSize: TYPOGRAPHY.fontSize.lg,
          descSize: TYPOGRAPHY.fontSize.sm,
          maxWidth: '400px',
        };
    }
  };
  
  const config = preset ? getPresetConfig() : { icon, title, description };
  const sizeStyles = getSizeStyles();
  
  return (
    <div
      className={className}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: align === 'left' ? 'flex-start' : align === 'right' ? 'flex-end' : 'center',
        justifyContent: 'center',
        padding: sizeStyles.padding,
        textAlign: align,
        maxWidth: sizeStyles.maxWidth,
        margin: align === 'center' ? '0 auto' : undefined,
        ...style,
      }}
    >
      {/* Image or Icon */}
      {image ? (
        <img
          src={image}
          alt=""
          style={{
            width: sizeStyles.iconSize * 2,
            height: sizeStyles.iconSize * 2,
            objectFit: 'contain',
            marginBottom: SPACING.md,
            opacity: 0.8,
          }}
        />
      ) : config.icon ? (
        <div
          className={iconClassName}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: sizeStyles.iconSize * 1.5,
            height: sizeStyles.iconSize * 1.5,
            marginBottom: SPACING.md,
            color: COLORS.text.muted,
            ...iconStyle,
          }}
        >
          {React.isValidElement(config.icon) 
            ? React.cloneElement(config.icon as React.ReactElement<any>, {
                size: sizeStyles.iconSize,
              })
            : config.icon
          }
        </div>
      ) : null}
      
      {/* Title */}
      {config.title && (
        <h3 style={{
          margin: 0,
          marginBottom: SPACING.sm,
          fontSize: sizeStyles.titleSize,
          fontWeight: TYPOGRAPHY.fontWeight.semibold,
          color: COLORS.text.primary,
        }}>
          {config.title}
        </h3>
      )}
      
      {/* Description */}
      {config.description && (
        <p style={{
          margin: 0,
          marginBottom: action || secondaryAction ? SPACING.lg : 0,
          fontSize: sizeStyles.descSize,
          color: COLORS.text.secondary,
          lineHeight: 1.5,
        }}>
          {config.description}
        </p>
      )}
      
      {/* Actions */}
      {(action || secondaryAction) && (
        <div style={{
          display: 'flex',
          gap: SPACING.md,
          marginTop: SPACING.lg,
          flexDirection: size === 'sm' ? 'column' : 'row',
          alignItems: align === 'center' ? 'center' : undefined,
        }}>
          {action && (
            <button
              onClick={action.onClick}
              style={{
                padding: `${SPACING.sm} ${SPACING.lg}`,
                borderRadius: RADIUS.md,
                fontSize: TYPOGRAPHY.fontSize.sm,
                fontWeight: TYPOGRAPHY.fontWeight.medium,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                ...(action.variant === 'primary' ? {
                  backgroundColor: COLORS.text.accent,
                  color: COLORS.background.primary,
                  border: 'none',
                } : {
                  backgroundColor: 'transparent',
                  color: COLORS.text.primary,
                  border: `1px solid ${COLORS.border.primary}`,
                }),
              }}
              onMouseEnter={(e) => {
                if (action.variant === 'primary') {
                  e.currentTarget.style.opacity = '0.9';
                } else {
                  e.currentTarget.style.backgroundColor = COLORS.background.hover;
                }
              }}
              onMouseLeave={(e) => {
                if (action.variant === 'primary') {
                  e.currentTarget.style.opacity = '1';
                } else {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              {action.label}
            </button>
          )}
          
          {secondaryAction && (
            <button
              onClick={secondaryAction.onClick}
              style={{
                padding: `${SPACING.sm} ${SPACING.lg}`,
                backgroundColor: 'transparent',
                border: 'none',
                color: COLORS.text.accent,
                fontSize: TYPOGRAPHY.fontSize.sm,
                fontWeight: TYPOGRAPHY.fontWeight.medium,
                cursor: 'pointer',
                textDecoration: 'underline',
                transition: 'opacity 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '0.8';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '1';
              }}
            >
              {secondaryAction.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}