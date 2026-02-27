import React from 'react';
import { AlertCircle, CheckCircle, Activity, Clock, Database, Cpu, HardDrive } from 'lucide-react';
import { COLORS, SPACING, TYPOGRAPHY } from '../styles/plugin-styles';
import { StatusIndicator } from './StatusIndicator';
import { Tooltip } from './Tooltip';

export interface FooterStat {
  id: string;
  label: React.ReactNode;
  value: React.ReactNode;
  icon?: React.ReactNode;
  tooltip?: string;
  onClick?: () => void;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
}

export interface FooterAction {
  id: string;
  label?: React.ReactNode;
  icon?: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  tooltip?: string;
}

export interface FooterProps {
  // Status
  status?: {
    type: 'connected' | 'disconnected' | 'error' | 'loading';
    message?: React.ReactNode;
    details?: React.ReactNode;
  };
  
  // Statistics
  stats?: FooterStat[];
  
  // Actions
  actions?: FooterAction[];
  
  // Metrics
  showMetrics?: boolean;
  metrics?: {
    cpu?: number;
    memory?: number;
    storage?: number;
    latency?: number;
    fps?: number;
  };
  
  // Info sections
  leftContent?: React.ReactNode;
  centerContent?: React.ReactNode;
  rightContent?: React.ReactNode;
  
  // Display
  size?: 'xs' | 'sm' | 'md';
  variant?: 'default' | 'minimal' | 'compact';
  sticky?: boolean;
  
  // Version/Build info
  version?: string;
  buildInfo?: React.ReactNode;
  
  // Copyright
  copyright?: React.ReactNode;
  
  // Style
  className?: string;
  style?: React.CSSProperties;
}

export function Footer({
  status,
  stats = [],
  actions = [],
  showMetrics = false,
  metrics,
  leftContent,
  centerContent,
  rightContent,
  size = 'sm',
  variant = 'default',
  sticky = false,
  version,
  buildInfo,
  copyright,
  className,
  style,
}: FooterProps) {
  // Get size styles
  const getSizeStyles = () => {
    switch (size) {
      case 'xs':
        return {
          padding: `${SPACING.xs} ${SPACING.sm}`,
          fontSize: '10px',
          iconSize: 12,
          gap: SPACING.xs,
          height: '24px',
        };
      case 'md':
        return {
          padding: `${SPACING.sm} ${SPACING.md}`,
          fontSize: TYPOGRAPHY.fontSize.sm,
          iconSize: 16,
          gap: SPACING.sm,
          height: '36px',
        };
      case 'sm':
      default:
        return {
          padding: `4px ${SPACING.sm}`,
          fontSize: TYPOGRAPHY.fontSize.xs,
          iconSize: 14,
          gap: SPACING.sm,
          height: '28px',
        };
    }
  };
  
  const sizeStyles = getSizeStyles();
  
  // Get status configuration
  const getStatusConfig = () => {
    if (!status) return null;
    
    switch (status.type) {
      case 'connected':
        return {
          icon: <CheckCircle size={sizeStyles.iconSize} />,
          color: COLORS.status.success,
          defaultMessage: 'Connected',
        };
      case 'disconnected':
        return {
          icon: <AlertCircle size={sizeStyles.iconSize} />,
          color: COLORS.text.muted,
          defaultMessage: 'Disconnected',
        };
      case 'error':
        return {
          icon: <AlertCircle size={sizeStyles.iconSize} />,
          color: COLORS.status.error,
          defaultMessage: 'Error',
        };
      case 'loading':
        return {
          icon: <Activity size={sizeStyles.iconSize} className="animate-pulse" />,
          color: COLORS.text.accent,
          defaultMessage: 'Loading...',
        };
      default:
        return null;
    }
  };
  
  const statusConfig = getStatusConfig();
  
  // Render stat
  const renderStat = (stat: FooterStat) => {
    const getStatColor = () => {
      switch (stat.variant) {
        case 'success':
          return COLORS.status.success;
        case 'warning':
          return COLORS.status.warning;
        case 'error':
          return COLORS.status.error;
        case 'info':
          return COLORS.status.info;
        default:
          return COLORS.text.secondary;
      }
    };
    
    const statElement = (
      <div
        key={stat.id}
        onClick={stat.onClick}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: sizeStyles.gap,
          padding: `0 ${sizeStyles.gap}`,
          borderRight: variant !== 'minimal' ? `1px solid ${COLORS.border.primary}` : 'none',
          cursor: stat.onClick ? 'pointer' : 'default',
          color: COLORS.text.secondary,
          fontSize: sizeStyles.fontSize,
          transition: 'color 0.2s ease',
        }}
        onMouseEnter={(e) => {
          if (stat.onClick) {
            e.currentTarget.style.color = COLORS.text.primary;
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = COLORS.text.secondary;
        }}
      >
        {stat.icon && (
          <span style={{
            display: 'flex',
            alignItems: 'center',
            color: getStatColor(),
          }}>
            {stat.icon}
          </span>
        )}
        
        {stat.label && (
          <span style={{ fontWeight: TYPOGRAPHY.fontWeight.medium }}>
            {stat.label}:
          </span>
        )}
        
        <span style={{
          fontWeight: TYPOGRAPHY.fontWeight.normal,
          color: stat.variant ? getStatColor() : COLORS.text.primary,
        }}>
          {stat.value}
        </span>
      </div>
    );
    
    return stat.tooltip ? (
      <Tooltip key={stat.id} content={stat.tooltip} position="top">
        {statElement}
      </Tooltip>
    ) : statElement;
  };
  
  // Render action
  const renderAction = (action: FooterAction) => {
    const actionElement = (
      <button
        key={action.id}
        onClick={action.onClick}
        disabled={action.disabled}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: sizeStyles.gap,
          padding: `0 ${sizeStyles.gap}`,
          background: 'transparent',
          border: 'none',
          color: action.disabled ? COLORS.text.muted : COLORS.text.secondary,
          cursor: action.disabled ? 'not-allowed' : 'pointer',
          fontSize: sizeStyles.fontSize,
          opacity: action.disabled ? 0.5 : 1,
          transition: 'color 0.2s ease',
        }}
        onMouseEnter={(e) => {
          if (!action.disabled) {
            e.currentTarget.style.color = COLORS.text.primary;
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = COLORS.text.secondary;
        }}
      >
        {action.icon}
        {action.label && <span>{action.label}</span>}
      </button>
    );
    
    return action.tooltip ? (
      <Tooltip key={action.id} content={action.tooltip} position="top">
        {actionElement}
      </Tooltip>
    ) : actionElement;
  };
  
  // Build metrics stats
  const metricStats: FooterStat[] = [];
  
  if (showMetrics && metrics) {
    if (metrics.cpu !== undefined) {
      metricStats.push({
        id: 'cpu',
        label: 'CPU',
        value: `${metrics.cpu.toFixed(1)}%`,
        icon: <Cpu size={sizeStyles.iconSize} />,
        tooltip: 'CPU Usage',
        variant: metrics.cpu > 80 ? 'error' : metrics.cpu > 60 ? 'warning' : 'default',
      });
    }
    
    if (metrics.memory !== undefined) {
      metricStats.push({
        id: 'memory',
        label: 'Memory',
        value: `${metrics.memory.toFixed(1)}%`,
        icon: <HardDrive size={sizeStyles.iconSize} />,
        tooltip: 'Memory Usage',
        variant: metrics.memory > 80 ? 'error' : metrics.memory > 60 ? 'warning' : 'default',
      });
    }
    
    if (metrics.storage !== undefined) {
      metricStats.push({
        id: 'storage',
        label: 'Storage',
        value: `${metrics.storage.toFixed(1)}MB`,
        icon: <Database size={sizeStyles.iconSize} />,
        tooltip: 'Storage Used',
      });
    }
    
    if (metrics.latency !== undefined) {
      metricStats.push({
        id: 'latency',
        label: 'Latency',
        value: `${metrics.latency}ms`,
        icon: <Clock size={sizeStyles.iconSize} />,
        tooltip: 'Network Latency',
        variant: metrics.latency > 1000 ? 'error' : metrics.latency > 500 ? 'warning' : 'success',
      });
    }
    
    if (metrics.fps !== undefined) {
      metricStats.push({
        id: 'fps',
        label: 'FPS',
        value: metrics.fps.toFixed(0),
        icon: <Activity size={sizeStyles.iconSize} />,
        tooltip: 'Frames Per Second',
        variant: metrics.fps < 30 ? 'error' : metrics.fps < 50 ? 'warning' : 'success',
      });
    }
  }
  
  const allStats = [...stats, ...metricStats];
  
  return (
    <div
      className={className}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        minHeight: sizeStyles.height,
        padding: variant === 'minimal' ? 0 : sizeStyles.padding,
        backgroundColor: variant === 'minimal' ? 'transparent' : COLORS.background.secondary,
        borderTop: variant === 'compact' ? 'none' : `1px solid ${COLORS.border.primary}`,
        fontSize: sizeStyles.fontSize,
        ...(sticky && {
          position: 'sticky',
          bottom: 0,
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
      }}>
        {/* Status */}
        {status && statusConfig && (
          <Tooltip content={status.details} position="top" disabled={!status.details}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: sizeStyles.gap,
              paddingRight: sizeStyles.gap,
              borderRight: variant !== 'minimal' ? `1px solid ${COLORS.border.primary}` : 'none',
            }}>
              <StatusIndicator
                status={status.type === 'connected' ? 'active' : 
                        status.type === 'error' ? 'error' : 
                        status.type === 'loading' ? 'loading' : 'inactive'}
                variant="dot"
                size={size}
                animate={status.type === 'loading'}
                pulse={status.type === 'connected'}
              />
              <span style={{ color: statusConfig.color }}>
                {status.message || statusConfig.defaultMessage}
              </span>
            </div>
          </Tooltip>
        )}
        
        {/* Left content */}
        {leftContent}
        
        {/* Stats */}
        {allStats.map(renderStat)}
      </div>
      
      {/* Center section */}
      {centerContent && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: sizeStyles.gap,
        }}>
          {centerContent}
        </div>
      )}
      
      {/* Right section */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: sizeStyles.gap,
      }}>
        {/* Actions */}
        {actions.map(renderAction)}
        
        {/* Right content */}
        {rightContent}
        
        {/* Version */}
        {version && (
          <div style={{
            paddingLeft: sizeStyles.gap,
            borderLeft: variant !== 'minimal' ? `1px solid ${COLORS.border.primary}` : 'none',
            color: COLORS.text.muted,
          }}>
            v{version}
          </div>
        )}
        
        {/* Build info */}
        {buildInfo && (
          <div style={{
            paddingLeft: sizeStyles.gap,
            borderLeft: variant !== 'minimal' ? `1px solid ${COLORS.border.primary}` : 'none',
            color: COLORS.text.muted,
          }}>
            {buildInfo}
          </div>
        )}
        
        {/* Copyright */}
        {copyright && (
          <div style={{
            paddingLeft: sizeStyles.gap,
            borderLeft: variant !== 'minimal' ? `1px solid ${COLORS.border.primary}` : 'none',
            color: COLORS.text.muted,
          }}>
            {copyright}
          </div>
        )}
      </div>
      
      {/* Animation for pulse */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
        
        .animate-pulse {
          animation: pulse 2s ease-in-out infinite;
        }
      ` }} />
    </div>
  );
}