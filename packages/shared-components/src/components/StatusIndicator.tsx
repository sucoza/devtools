import React, { ReactNode } from 'react';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../styles/plugin-styles';

export interface StatusIndicatorProps {
  status?: 'active' | 'inactive' | 'pending' | 'success' | 'warning' | 'error' | 'loading';
  label?: ReactNode;
  
  // Display options
  size?: 'xs' | 'sm' | 'md' | 'lg';
  variant?: 'dot' | 'badge' | 'pill' | 'icon';
  showLabel?: boolean;
  pulse?: boolean;
  animate?: boolean;
  
  // Custom colors
  color?: string;
  backgroundColor?: string;
  
  // Custom content
  icon?: React.ReactNode;
  value?: string | number;
  
  // Style
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}

export function StatusIndicator({
  status = 'inactive',
  label,
  size = 'md',
  variant = 'dot',
  showLabel = true,
  pulse = false,
  animate = false,
  color,
  backgroundColor,
  icon,
  value,
  className,
  style,
  onClick,
}: StatusIndicatorProps) {
  // Get status colors
  const getStatusColors = () => {
    switch (status) {
      case 'active':
        return {
          bg: color || COLORS.status.success,
          text: COLORS.text.primary,
        };
      case 'success':
        return {
          bg: color || COLORS.status.success,
          text: COLORS.text.primary,
        };
      case 'warning':
        return {
          bg: color || COLORS.status.warning,
          text: COLORS.text.primary,
        };
      case 'error':
        return {
          bg: color || COLORS.status.error,
          text: COLORS.text.primary,
        };
      case 'pending':
        return {
          bg: color || COLORS.status.info,
          text: COLORS.text.primary,
        };
      case 'loading':
        return {
          bg: color || COLORS.text.accent,
          text: COLORS.text.primary,
        };
      case 'inactive':
      default:
        return {
          bg: color || COLORS.text.muted,
          text: COLORS.text.secondary,
        };
    }
  };
  
  // Get size dimensions
  const getSizeDimensions = () => {
    switch (size) {
      case 'xs':
        return { dot: 6, badge: 16, fontSize: TYPOGRAPHY.fontSize.xs };
      case 'sm':
        return { dot: 8, badge: 20, fontSize: TYPOGRAPHY.fontSize.xs };
      case 'lg':
        return { dot: 12, badge: 28, fontSize: TYPOGRAPHY.fontSize.md };
      case 'md':
      default:
        return { dot: 10, badge: 24, fontSize: TYPOGRAPHY.fontSize.sm };
    }
  };
  
  // Get status label
  const getStatusLabel = () => {
    if (label) return label;
    if (value !== undefined) return value.toString();
    
    switch (status) {
      case 'active': return 'Active';
      case 'inactive': return 'Inactive';
      case 'pending': return 'Pending';
      case 'success': return 'Success';
      case 'warning': return 'Warning';
      case 'error': return 'Error';
      case 'loading': return 'Loading';
      default: return '';
    }
  };
  
  const colors = getStatusColors();
  const dimensions = getSizeDimensions();
  const displayLabel = getStatusLabel();
  
  // Pulse animation
  const pulseAnimation = pulse ? `
    @keyframes pulse-${status} {
      0% {
        box-shadow: 0 0 0 0 ${colors.bg}66;
      }
      70% {
        box-shadow: 0 0 0 10px ${colors.bg}00;
      }
      100% {
        box-shadow: 0 0 0 0 ${colors.bg}00;
      }
    }
  ` : '';
  
  // Loading animation
  const loadingAnimation = status === 'loading' && animate ? `
    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }
  ` : '';
  
  // Base container styles
  const containerStyles: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: SPACING.sm,
    cursor: onClick ? 'pointer' : 'default',
    ...style,
  };
  
  // Render dot variant
  const renderDot = () => (
    <div
      style={{
        width: dimensions.dot,
        height: dimensions.dot,
        borderRadius: '50%',
        backgroundColor: backgroundColor || colors.bg,
        flexShrink: 0,
        position: 'relative',
        ...(pulse && {
          animation: `pulse-${status} 2s infinite`,
        }),
        ...(status === 'loading' && animate && {
          border: `2px solid ${COLORS.border.primary}`,
          borderTopColor: colors.bg,
          backgroundColor: 'transparent',
          animation: 'spin 1s linear infinite',
        }),
      }}
    />
  );
  
  // Render badge variant
  const renderBadge = () => (
    <div
      style={{
        minWidth: dimensions.badge,
        height: dimensions.badge,
        padding: `0 ${SPACING.sm}`,
        borderRadius: RADIUS.sm,
        backgroundColor: backgroundColor || `${colors.bg}20`,
        border: `1px solid ${colors.bg}`,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: dimensions.fontSize,
        fontWeight: TYPOGRAPHY.fontWeight.medium,
        color: colors.bg,
        flexShrink: 0,
        ...(status === 'loading' && animate && {
          animation: 'spin 1s linear infinite',
        }),
      }}
    >
      {icon || value || (typeof displayLabel === 'string' ? displayLabel.charAt(0).toUpperCase() : displayLabel)}
    </div>
  );
  
  // Render pill variant
  const renderPill = () => (
    <div
      style={{
        padding: `${SPACING.xs} ${SPACING.md}`,
        borderRadius: RADIUS.full,
        backgroundColor: backgroundColor || `${colors.bg}20`,
        border: `1px solid ${colors.bg}`,
        display: 'inline-flex',
        alignItems: 'center',
        gap: SPACING.xs,
        fontSize: dimensions.fontSize,
        fontWeight: TYPOGRAPHY.fontWeight.medium,
        color: colors.bg,
        ...(status === 'loading' && animate && {
          position: 'relative',
          overflow: 'hidden',
        }),
      }}
    >
      {status === 'loading' && animate && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: '-100%',
            width: '100%',
            height: '100%',
            background: `linear-gradient(90deg, transparent, ${colors.bg}40, transparent)`,
            animation: 'slide 1.5s infinite',
          }}
        />
      )}
      {icon && <span style={{ display: 'flex', alignItems: 'center' }}>{icon}</span>}
      {displayLabel}
    </div>
  );
  
  // Render icon variant
  const renderIcon = () => {
    if (!icon) {
      // Default icons based on status
      const defaultIcons: Record<string, string> = {
        active: '●',
        inactive: '○',
        pending: '◐',
        success: '✓',
        warning: '⚠',
        error: '✕',
        loading: '◌',
      };
      
      return (
        <span
          style={{
            fontSize: dimensions.badge,
            color: colors.bg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            ...(status === 'loading' && animate && {
              animation: 'spin 1s linear infinite',
            }),
          }}
        >
          {defaultIcons[status] || '●'}
        </span>
      );
    }
    
    return (
      <span
        style={{
          color: colors.bg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: dimensions.badge,
          ...(status === 'loading' && animate && {
            animation: 'spin 1s linear infinite',
          }),
        }}
      >
        {icon}
      </span>
    );
  };
  
  // Render indicator based on variant
  const renderIndicator = () => {
    switch (variant) {
      case 'badge':
        return renderBadge();
      case 'pill':
        return renderPill();
      case 'icon':
        return renderIcon();
      case 'dot':
      default:
        return renderDot();
    }
  };
  
  return (
    <div className={className} style={containerStyles} onClick={onClick}>
      {pulseAnimation && <style>{pulseAnimation}</style>}
      {loadingAnimation && <style>{loadingAnimation}</style>}
      {status === 'loading' && animate && variant === 'pill' && (
        <style>{`
          @keyframes slide {
            to {
              left: 100%;
            }
          }
        `}</style>
      )}
      
      {renderIndicator()}
      
      {showLabel && displayLabel && variant !== 'pill' && (
        <span style={{
          fontSize: dimensions.fontSize,
          color: colors.text,
          fontWeight: TYPOGRAPHY.fontWeight.normal,
        }}>
          {displayLabel}
        </span>
      )}
    </div>
  );
}