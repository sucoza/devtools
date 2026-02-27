import React from 'react';
import { Check } from 'lucide-react';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../styles/plugin-styles';

// Progress Bar Component
export interface ProgressBarProps {
  value: number;
  max?: number;
  
  // Display
  label?: React.ReactNode;
  showValue?: boolean;
  valueFormat?: (value: number, max: number) => string;
  
  // Appearance
  size?: 'xs' | 'sm' | 'md' | 'lg';
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  striped?: boolean;
  animated?: boolean;
  indeterminate?: boolean;
  
  // Style
  className?: string;
  style?: React.CSSProperties;
  barClassName?: string;
  barStyle?: React.CSSProperties;
}

export function ProgressBar({
  value,
  max = 100,
  label,
  showValue = false,
  valueFormat = (v, m) => `${Math.round((v / m) * 100)}%`,
  size = 'md',
  variant = 'default',
  striped = false,
  animated = false,
  indeterminate = false,
  className,
  style,
  barClassName,
  barStyle,
}: ProgressBarProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  
  // Get size styles
  const getSizeStyles = () => {
    switch (size) {
      case 'xs':
        return { height: '4px', fontSize: TYPOGRAPHY.fontSize.xs };
      case 'sm':
        return { height: '8px', fontSize: TYPOGRAPHY.fontSize.xs };
      case 'lg':
        return { height: '20px', fontSize: TYPOGRAPHY.fontSize.md };
      case 'md':
      default:
        return { height: '12px', fontSize: TYPOGRAPHY.fontSize.sm };
    }
  };
  
  // Get variant color
  const getVariantColor = () => {
    switch (variant) {
      case 'success':
        return COLORS.status.success;
      case 'warning':
        return COLORS.status.warning;
      case 'error':
        return COLORS.status.error;
      case 'info':
        return COLORS.status.info;
      case 'default':
      default:
        return COLORS.text.accent;
    }
  };
  
  const sizeStyles = getSizeStyles();
  const color = getVariantColor();
  
  return (
    <div className={className} style={style}>
      {label && (
        <div style={{
          marginBottom: SPACING.xs,
          fontSize: sizeStyles.fontSize,
          color: COLORS.text.primary,
        }}>
          {label}
        </div>
      )}
      
      <div style={{
        position: 'relative',
        width: '100%',
        height: sizeStyles.height,
        backgroundColor: COLORS.background.secondary,
        borderRadius: RADIUS.full,
        overflow: 'hidden',
      }}>
        <div
          className={barClassName}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            height: '100%',
            width: indeterminate ? '30%' : `${percentage}%`,
            backgroundColor: color,
            borderRadius: RADIUS.full,
            transition: indeterminate ? 'none' : 'width 0.3s ease',
            ...(striped && {
              backgroundImage: `linear-gradient(
                45deg,
                rgba(255, 255, 255, 0.15) 25%,
                transparent 25%,
                transparent 50%,
                rgba(255, 255, 255, 0.15) 50%,
                rgba(255, 255, 255, 0.15) 75%,
                transparent 75%,
                transparent
              )`,
              backgroundSize: '1rem 1rem',
            }),
            ...(animated && striped && {
              animation: 'progress-bar-stripes 1s linear infinite',
            }),
            ...(indeterminate && {
              animation: 'progress-bar-indeterminate 1.5s ease-in-out infinite',
            }),
            ...barStyle,
          }}
        />
        
        {showValue && !indeterminate && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontSize: sizeStyles.fontSize,
            fontWeight: TYPOGRAPHY.fontWeight.medium,
            color: percentage > 50 ? COLORS.background.primary : COLORS.text.primary,
            whiteSpace: 'nowrap',
          }}>
            {valueFormat(value, max)}
          </div>
        )}
      </div>
      
      <style>{`
        @keyframes progress-bar-stripes {
          from {
            background-position: 1rem 0;
          }
          to {
            background-position: 0 0;
          }
        }

        @keyframes progress-bar-indeterminate {
          0% {
            left: -30%;
          }
          100% {
            left: 100%;
          }
        }
      `}</style>
    </div>
  );
}

// Circular Progress Component
export interface CircularProgressProps {
  value?: number;
  max?: number;
  
  // Display
  size?: number;
  strokeWidth?: number;
  showValue?: boolean;
  valueFormat?: (value: number, max: number) => string;
  
  // Appearance
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  indeterminate?: boolean;
  
  // Style
  className?: string;
  style?: React.CSSProperties;
  trackColor?: string;
  color?: string;
}

export function CircularProgress({
  value = 0,
  max = 100,
  size = 40,
  strokeWidth = 4,
  showValue = false,
  valueFormat = (v, m) => `${Math.round((v / m) * 100)}%`,
  variant = 'default',
  indeterminate = false,
  className,
  style,
  trackColor = COLORS.background.secondary,
  color,
}: CircularProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  
  // Get variant color
  const getVariantColor = () => {
    if (color) return color;
    
    switch (variant) {
      case 'success':
        return COLORS.status.success;
      case 'warning':
        return COLORS.status.warning;
      case 'error':
        return COLORS.status.error;
      case 'info':
        return COLORS.status.info;
      case 'default':
      default:
        return COLORS.text.accent;
    }
  };
  
  const progressColor = getVariantColor();
  
  return (
    <div
      className={className}
      style={{
        position: 'relative',
        display: 'inline-flex',
        ...style,
      }}
    >
      <svg
        width={size}
        height={size}
        style={{
          transform: 'rotate(-90deg)',
          ...(indeterminate && {
            animation: 'circular-progress-rotate 2s linear infinite',
          }),
        }}
      >
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
        />
        
        {/* Progress */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={progressColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={indeterminate ? circumference * 0.75 : strokeDashoffset}
          strokeLinecap="round"
          style={{
            transition: indeterminate ? 'none' : 'stroke-dashoffset 0.3s ease',
            ...(indeterminate && {
              animation: 'circular-progress-dash 1.5s ease-in-out infinite',
            }),
          }}
        />
      </svg>
      
      {showValue && !indeterminate && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          fontSize: size * 0.3,
          fontWeight: TYPOGRAPHY.fontWeight.medium,
          color: COLORS.text.primary,
        }}>
          {valueFormat(value, max)}
        </div>
      )}
      
      <style>{`
        @keyframes circular-progress-rotate {
          100% {
            transform: rotate(270deg);
          }
        }

        @keyframes circular-progress-dash {
          0% {
            stroke-dasharray: 1, 150;
            stroke-dashoffset: 0;
          }
          50% {
            stroke-dasharray: 90, 150;
            stroke-dashoffset: -35;
          }
          100% {
            stroke-dasharray: 90, 150;
            stroke-dashoffset: -124;
          }
        }
      `}</style>
    </div>
  );
}

// Step Progress Component
export interface Step {
  id: string;
  label: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  status?: 'pending' | 'active' | 'completed' | 'error';
  disabled?: boolean;
}

export interface StepProgressProps {
  steps: Step[];
  current?: number;
  
  // Display
  orientation?: 'horizontal' | 'vertical';
  size?: 'sm' | 'md' | 'lg';
  showConnector?: boolean;
  labelPlacement?: 'bottom' | 'right';
  clickable?: boolean;
  
  // Callbacks
  onStepClick?: (step: Step, index: number) => void;
  
  // Style
  className?: string;
  style?: React.CSSProperties;
}

export function StepProgress({
  steps,
  current = 0,
  orientation = 'horizontal',
  size = 'md',
  showConnector = true,
  labelPlacement = 'bottom',
  clickable = false,
  onStepClick,
  className,
  style,
}: StepProgressProps) {
  // Get size styles
  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return {
          stepSize: 24,
          fontSize: TYPOGRAPHY.fontSize.xs,
          iconSize: 12,
          connectorHeight: 2,
        };
      case 'lg':
        return {
          stepSize: 40,
          fontSize: TYPOGRAPHY.fontSize.md,
          iconSize: 20,
          connectorHeight: 3,
        };
      case 'md':
      default:
        return {
          stepSize: 32,
          fontSize: TYPOGRAPHY.fontSize.sm,
          iconSize: 16,
          connectorHeight: 2,
        };
    }
  };
  
  const sizeStyles = getSizeStyles();
  
  // Get step status
  const getStepStatus = (step: Step, index: number): Step['status'] => {
    if (step.status) return step.status;
    if (index < current) return 'completed';
    if (index === current) return 'active';
    return 'pending';
  };
  
  // Get step colors
  const getStepColors = (status: Step['status']) => {
    switch (status) {
      case 'completed':
        return {
          bg: COLORS.status.success,
          text: COLORS.background.primary,
          border: COLORS.status.success,
        };
      case 'active':
        return {
          bg: COLORS.text.accent,
          text: COLORS.background.primary,
          border: COLORS.text.accent,
        };
      case 'error':
        return {
          bg: COLORS.status.error,
          text: COLORS.background.primary,
          border: COLORS.status.error,
        };
      case 'pending':
      default:
        return {
          bg: COLORS.background.secondary,
          text: COLORS.text.muted,
          border: COLORS.border.primary,
        };
    }
  };
  
  return (
    <div
      className={className}
      style={{
        display: 'flex',
        flexDirection: orientation === 'vertical' ? 'column' : 'row',
        gap: orientation === 'vertical' ? SPACING.md : 0,
        ...style,
      }}
    >
      {steps.map((step, index) => {
        const status = getStepStatus(step, index);
        const colors = getStepColors(status);
        const isLast = index === steps.length - 1;
        
        return (
          <div
            key={step.id}
            style={{
              display: 'flex',
              flexDirection: orientation === 'vertical' ? 'row' : 'column',
              alignItems: orientation === 'vertical' ? 'flex-start' : 'center',
              flex: orientation === 'horizontal' ? 1 : undefined,
              gap: SPACING.sm,
            }}
          >
            <div style={{
              display: 'flex',
              flexDirection: orientation === 'vertical' ? 'column' : 'row',
              alignItems: 'center',
              flex: orientation === 'horizontal' ? 1 : undefined,
            }}>
              {/* Step indicator */}
              <button
                onClick={() => clickable && !step.disabled && onStepClick?.(step, index)}
                disabled={step.disabled || !clickable}
                style={{
                  width: sizeStyles.stepSize,
                  height: sizeStyles.stepSize,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: colors.bg,
                  color: colors.text,
                  border: `2px solid ${colors.border}`,
                  fontSize: sizeStyles.fontSize,
                  fontWeight: TYPOGRAPHY.fontWeight.medium,
                  cursor: clickable && !step.disabled ? 'pointer' : 'default',
                  transition: 'all 0.2s ease',
                  flexShrink: 0,
                }}
              >
                {status === 'completed' ? (
                  <Check size={sizeStyles.iconSize} />
                ) : step.icon ? (
                  step.icon
                ) : (
                  index + 1
                )}
              </button>
              
              {/* Connector */}
              {showConnector && !isLast && (
                <div style={{
                  flex: 1,
                  height: orientation === 'horizontal' ? sizeStyles.connectorHeight : 'auto',
                  width: orientation === 'vertical' ? sizeStyles.connectorHeight : 'auto',
                  minHeight: orientation === 'vertical' ? '30px' : undefined,
                  backgroundColor: status === 'completed' ? colors.bg : COLORS.border.primary,
                  margin: orientation === 'horizontal' ? `0 ${SPACING.sm}` : `${SPACING.sm} 0`,
                  marginLeft: orientation === 'vertical' ? `${sizeStyles.stepSize / 2}px` : SPACING.sm,
                }} />
              )}
            </div>
            
            {/* Label and description */}
            {(step.label || step.description) && (
              <div style={{
                flex: orientation === 'vertical' ? 1 : undefined,
                textAlign: orientation === 'horizontal' && labelPlacement === 'bottom' ? 'center' : 'left',
                marginTop: orientation === 'horizontal' && labelPlacement === 'bottom' ? SPACING.sm : 0,
                marginLeft: orientation === 'vertical' || labelPlacement === 'right' ? SPACING.sm : 0,
              }}>
                {step.label && (
                  <div style={{
                    fontSize: sizeStyles.fontSize,
                    fontWeight: status === 'active' ? TYPOGRAPHY.fontWeight.medium : TYPOGRAPHY.fontWeight.normal,
                    color: status === 'active' ? COLORS.text.primary : COLORS.text.secondary,
                  }}>
                    {step.label}
                  </div>
                )}
                
                {step.description && (
                  <div style={{
                    fontSize: TYPOGRAPHY.fontSize.xs,
                    color: COLORS.text.muted,
                    marginTop: '2px',
                  }}>
                    {step.description}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}