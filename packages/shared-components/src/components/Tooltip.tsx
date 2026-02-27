import React, { useState, useRef, useEffect, useCallback } from 'react';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../styles/plugin-styles';

export interface TooltipProps {
  children: React.ReactNode;
  content: React.ReactNode;
  
  // Positioning
  position?: 'top' | 'bottom' | 'left' | 'right' | 'auto';
  align?: 'start' | 'center' | 'end';
  offset?: number;
  
  // Trigger
  trigger?: 'hover' | 'click' | 'focus' | 'manual';
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  
  // Display options
  arrow?: boolean;
  delay?: number;
  closeDelay?: number;
  interactive?: boolean;
  disabled?: boolean;
  
  // Style
  variant?: 'default' | 'dark' | 'light' | 'error' | 'warning' | 'success';
  maxWidth?: number | string;
  className?: string;
  style?: React.CSSProperties;
  contentClassName?: string;
  contentStyle?: React.CSSProperties;
}

export function Tooltip({
  children,
  content,
  position = 'top',
  align = 'center',
  offset = 8,
  trigger = 'hover',
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  arrow = true,
  delay = 200,
  closeDelay = 100,
  interactive = false,
  disabled = false,
  variant = 'dark',
  maxWidth = 250,
  className,
  style,
  contentClassName,
  contentStyle,
}: TooltipProps) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const [actualPosition, setActualPosition] = useState(position);
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
  const [arrowStyle, setArrowStyle] = useState<React.CSSProperties>({});
  
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const delayTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  
  // Clear timeouts
  const clearTimeouts = () => {
    if (delayTimeoutRef.current) {
      clearTimeout(delayTimeoutRef.current);
    }
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
    }
  };
  
  // Handle open state change
  const handleOpenChange = (newOpen: boolean) => {
    if (disabled) return;
    
    clearTimeouts();
    
    if (newOpen && delay > 0) {
      delayTimeoutRef.current = setTimeout(() => {
        setInternalOpen(true);
        onOpenChange?.(true);
      }, delay);
    } else if (!newOpen && closeDelay > 0) {
      closeTimeoutRef.current = setTimeout(() => {
        setInternalOpen(false);
        onOpenChange?.(false);
      }, closeDelay);
    } else {
      setInternalOpen(newOpen);
      onOpenChange?.(newOpen);
    }
  };
  
  // Calculate position
  const calculatePosition = useCallback(() => {
    if (!triggerRef.current || !tooltipRef.current) return;
    
    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    let finalPosition = position;
    let top = 0;
    let left = 0;
    
    // Auto position
    if (position === 'auto') {
      const spaceAbove = triggerRect.top;
      const spaceBelow = viewportHeight - triggerRect.bottom;
      const spaceLeft = triggerRect.left;
      const spaceRight = viewportWidth - triggerRect.right;
      
      if (spaceAbove > tooltipRect.height + offset && spaceAbove > spaceBelow) {
        finalPosition = 'top';
      } else if (spaceBelow > tooltipRect.height + offset) {
        finalPosition = 'bottom';
      } else if (spaceLeft > tooltipRect.width + offset && spaceLeft > spaceRight) {
        finalPosition = 'left';
      } else {
        finalPosition = 'right';
      }
    }
    
    // Calculate position based on finalPosition
    switch (finalPosition) {
      case 'top':
        top = triggerRect.top - tooltipRect.height - offset;
        switch (align) {
          case 'start':
            left = triggerRect.left;
            break;
          case 'end':
            left = triggerRect.right - tooltipRect.width;
            break;
          case 'center':
          default:
            left = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2;
            break;
        }
        break;
        
      case 'bottom':
        top = triggerRect.bottom + offset;
        switch (align) {
          case 'start':
            left = triggerRect.left;
            break;
          case 'end':
            left = triggerRect.right - tooltipRect.width;
            break;
          case 'center':
          default:
            left = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2;
            break;
        }
        break;
        
      case 'left':
        left = triggerRect.left - tooltipRect.width - offset;
        switch (align) {
          case 'start':
            top = triggerRect.top;
            break;
          case 'end':
            top = triggerRect.bottom - tooltipRect.height;
            break;
          case 'center':
          default:
            top = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2;
            break;
        }
        break;
        
      case 'right':
        left = triggerRect.right + offset;
        switch (align) {
          case 'start':
            top = triggerRect.top;
            break;
          case 'end':
            top = triggerRect.bottom - tooltipRect.height;
            break;
          case 'center':
          default:
            top = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2;
            break;
        }
        break;
    }
    
    // Adjust if tooltip goes outside viewport
    if (left < 0) left = 8;
    if (left + tooltipRect.width > viewportWidth) {
      left = viewportWidth - tooltipRect.width - 8;
    }
    if (top < 0) top = 8;
    if (top + tooltipRect.height > viewportHeight) {
      top = viewportHeight - tooltipRect.height - 8;
    }
    
    setActualPosition(finalPosition);
    setTooltipStyle({
      position: 'fixed',
      top: `${top}px`,
      left: `${left}px`,
      zIndex: 9999,
    });
    
    // Calculate arrow position
    if (arrow) {
      const arrowSize = 8;
      let arrowTop = '50%';
      let arrowLeft = '50%';
      let arrowTransform = 'translate(-50%, -50%) rotate(45deg)';
      
      switch (finalPosition) {
        case 'top':
          arrowTop = '100%';
          arrowTransform = 'translate(-50%, -50%) rotate(45deg)';
          break;
        case 'bottom':
          arrowTop = '0';
          arrowTransform = 'translate(-50%, -50%) rotate(45deg)';
          break;
        case 'left':
          arrowLeft = '100%';
          arrowTransform = 'translate(-50%, -50%) rotate(45deg)';
          break;
        case 'right':
          arrowLeft = '0';
          arrowTransform = 'translate(-50%, -50%) rotate(45deg)';
          break;
      }
      
      setArrowStyle({
        position: 'absolute',
        width: `${arrowSize}px`,
        height: `${arrowSize}px`,
        top: arrowTop,
        left: arrowLeft,
        transform: arrowTransform,
      });
    }
  }, [position, align, offset, arrow]);
  
  // Update position when open
  useEffect(() => {
    if (isOpen) {
      calculatePosition();
      window.addEventListener('scroll', calculatePosition);
      window.addEventListener('resize', calculatePosition);
      
      return () => {
        window.removeEventListener('scroll', calculatePosition);
        window.removeEventListener('resize', calculatePosition);
      };
    }
    return undefined;
  }, [isOpen, calculatePosition]);
  
  // Get variant styles
  const getVariantStyles = () => {
    switch (variant) {
      case 'light':
        return {
          bg: COLORS.background.secondary,
          text: COLORS.text.primary,
          border: COLORS.border.primary,
        };
      case 'error':
        return {
          bg: COLORS.status.error,
          text: COLORS.background.primary,
          border: COLORS.status.error,
        };
      case 'warning':
        return {
          bg: COLORS.status.warning,
          text: COLORS.background.primary,
          border: COLORS.status.warning,
        };
      case 'success':
        return {
          bg: COLORS.status.success,
          text: COLORS.background.primary,
          border: COLORS.status.success,
        };
      case 'dark':
      default:
        return {
          bg: COLORS.background.elevated,
          text: COLORS.text.primary,
          border: COLORS.border.secondary,
        };
    }
  };
  
  const variantStyles = getVariantStyles();
  
  // Handle trigger events
  const handleMouseEnter = () => {
    if (trigger === 'hover') {
      handleOpenChange(true);
    }
  };
  
  const handleMouseLeave = () => {
    if (trigger === 'hover' && !interactive) {
      handleOpenChange(false);
    }
  };
  
  const handleClick = () => {
    if (trigger === 'click') {
      handleOpenChange(!isOpen);
    }
  };
  
  const handleFocus = () => {
    if (trigger === 'focus') {
      handleOpenChange(true);
    }
  };
  
  const handleBlur = () => {
    if (trigger === 'focus') {
      handleOpenChange(false);
    }
  };
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimeouts();
    };
  }, []);
  
  return (
    <>
      <div
        ref={triggerRef}
        className={className}
        style={{
          display: 'inline-block',
          ...style,
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        onFocus={handleFocus}
        onBlur={handleBlur}
      >
        {children}
      </div>
      
      {isOpen && content && (
        <div
          ref={tooltipRef}
          className={contentClassName}
          style={{
            ...tooltipStyle,
            backgroundColor: variantStyles.bg,
            color: variantStyles.text,
            border: `1px solid ${variantStyles.border}`,
            borderRadius: RADIUS.md,
            padding: `${SPACING.sm} ${SPACING.md}`,
            fontSize: TYPOGRAPHY.fontSize.sm,
            fontWeight: TYPOGRAPHY.fontWeight.normal,
            lineHeight: 1.4,
            maxWidth,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            opacity: 0,
            animation: 'tooltip-fade-in 0.2s ease forwards',
            pointerEvents: interactive ? 'auto' : 'none',
            ...contentStyle,
          }}
          onMouseEnter={() => {
            if (trigger === 'hover' && interactive) {
              clearTimeouts();
            }
          }}
          onMouseLeave={() => {
            if (trigger === 'hover' && interactive) {
              handleOpenChange(false);
            }
          }}
        >
          {content}
          
          {arrow && (
            <div
              style={{
                ...arrowStyle,
                backgroundColor: variantStyles.bg,
                border: `1px solid ${variantStyles.border}`,
                borderTop: 'none',
                borderLeft: 'none',
                ...(actualPosition === 'top' && {
                  borderTop: `1px solid ${variantStyles.border}`,
                  borderRight: 'none',
                }),
                ...(actualPosition === 'left' && {
                  borderLeft: `1px solid ${variantStyles.border}`,
                  borderBottom: 'none',
                }),
                ...(actualPosition === 'bottom' && {
                  borderBottom: `1px solid ${variantStyles.border}`,
                  borderRight: 'none',
                }),
              }}
            />
          )}
        </div>
      )}
      
      <style>{`
        @keyframes tooltip-fade-in {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </>
  );
}