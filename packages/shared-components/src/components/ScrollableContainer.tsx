import React, { useRef, useState, useEffect, useCallback } from 'react';
import { COLORS, RADIUS } from '../styles/plugin-styles';

export interface ScrollableContainerProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  
  // Scroll behavior
  scrollDirection?: 'vertical' | 'horizontal' | 'both';
  smoothScroll?: boolean;
  scrollbarWidth?: 'thin' | 'normal' | 'none';
  autoHideScrollbar?: boolean;
  scrollbarDelay?: number;
  
  // Shadow indicators
  showShadows?: boolean;
  shadowIntensity?: 'light' | 'medium' | 'strong';
  shadowColor?: string;
  
  // Bounce effect
  enableBounce?: boolean;
  bounceIntensity?: number;
  
  // Scroll position indicators
  showScrollIndicator?: boolean;
  onScrollPositionChange?: (position: { top: number; bottom: number; left: number; right: number }) => void;
  
  // Performance
  useVirtualization?: boolean;
  virtualItemHeight?: number;
  overscan?: number;
  
  // Callbacks
  onScroll?: (event: React.UIEvent<HTMLDivElement>) => void;
  onReachTop?: () => void;
  onReachBottom?: () => void;
  onReachLeft?: () => void;
  onReachRight?: () => void;
}

export function ScrollableContainer({
  children,
  className,
  style,
  scrollDirection = 'vertical',
  smoothScroll = true,
  scrollbarWidth = 'thin',
  autoHideScrollbar = true,
  scrollbarDelay = 1000,
  showShadows = true,
  shadowIntensity = 'medium',
  shadowColor,
  enableBounce = false,
  _bounceIntensity = 0.1,
  showScrollIndicator = false,
  onScrollPositionChange,
  onScroll,
  onReachTop,
  onReachBottom,
  onReachLeft,
  onReachRight,
}: ScrollableContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollPosition, setScrollPosition] = useState({ top: 0, bottom: 0, left: 0, right: 0 });
  const [showScrollbar, setShowScrollbar] = useState(!autoHideScrollbar);
  const [shadowsVisible, setShadowsVisible] = useState({ top: false, bottom: false, left: false, right: false });
  const scrollbarTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Calculate shadow intensity
  const getShadowIntensityValue = () => {
    switch (shadowIntensity) {
      case 'light': return 0.05;
      case 'medium': return 0.1;
      case 'strong': return 0.2;
      default: return 0.1;
    }
  };

  // Calculate shadow gradient
  const getShadowGradient = (direction: 'top' | 'bottom' | 'left' | 'right') => {
    const color = shadowColor || COLORS.background.elevated;
    const intensity = getShadowIntensityValue();
    
    const gradients = {
      top: `linear-gradient(to bottom, ${color}${Math.round(intensity * 255).toString(16)}, transparent)`,
      bottom: `linear-gradient(to top, ${color}${Math.round(intensity * 255).toString(16)}, transparent)`,
      left: `linear-gradient(to right, ${color}${Math.round(intensity * 255).toString(16)}, transparent)`,
      right: `linear-gradient(to left, ${color}${Math.round(intensity * 255).toString(16)}, transparent)`,
    };
    
    return gradients[direction];
  };

  // Handle scroll event
  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    const element = event.currentTarget;
    const { scrollTop, scrollHeight, clientHeight, scrollLeft, scrollWidth, clientWidth } = element;
    
    // Calculate scroll position percentages
    const topPercent = (scrollTop / (scrollHeight - clientHeight)) * 100 || 0;
    const bottomPercent = 100 - topPercent;
    const leftPercent = (scrollLeft / (scrollWidth - clientWidth)) * 100 || 0;
    const rightPercent = 100 - leftPercent;
    
    const newPosition = {
      top: Math.round(topPercent),
      bottom: Math.round(bottomPercent),
      left: Math.round(leftPercent),
      right: Math.round(rightPercent),
    };
    
    setScrollPosition(newPosition);
    
    // Update shadows visibility
    if (showShadows) {
      setShadowsVisible({
        top: scrollTop > 0,
        bottom: scrollTop < scrollHeight - clientHeight - 1,
        left: scrollLeft > 0,
        right: scrollLeft < scrollWidth - clientWidth - 1,
      });
    }
    
    // Handle auto-hide scrollbar
    if (autoHideScrollbar) {
      setShowScrollbar(true);
      clearTimeout(scrollbarTimeoutRef.current);
      scrollbarTimeoutRef.current = setTimeout(() => {
        setShowScrollbar(false);
      }, scrollbarDelay);
    }
    
    // Trigger callbacks
    if (scrollTop === 0 && onReachTop) onReachTop();
    if (scrollTop >= scrollHeight - clientHeight - 1 && onReachBottom) onReachBottom();
    if (scrollLeft === 0 && onReachLeft) onReachLeft();
    if (scrollLeft >= scrollWidth - clientWidth - 1 && onReachRight) onReachRight();
    
    if (onScrollPositionChange) onScrollPositionChange(newPosition);
    if (onScroll) onScroll(event);
  }, [showShadows, autoHideScrollbar, scrollbarDelay, onReachTop, onReachBottom, onReachLeft, onReachRight, onScrollPositionChange, onScroll]);

  // Initialize scroll position
  useEffect(() => {
    if (containerRef.current) {
      handleScroll({ currentTarget: containerRef.current } as React.UIEvent<HTMLDivElement>);
    }
  }, [handleScroll]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (scrollbarTimeoutRef.current) {
        clearTimeout(scrollbarTimeoutRef.current);
      }
    };
  }, []);

  // Determine overflow styles
  const getOverflowStyle = () => {
    switch (scrollDirection) {
      case 'horizontal':
        return { overflowX: 'auto' as const, overflowY: 'hidden' as const };
      case 'both':
        return { overflow: 'auto' as const };
      case 'vertical':
      default:
        return { overflowY: 'auto' as const, overflowX: 'hidden' as const };
    }
  };

  // Container styles
  const containerStyles: React.CSSProperties = {
    position: 'relative',
    width: '100%',
    height: '100%',
    ...getOverflowStyle(),
    scrollBehavior: smoothScroll ? 'smooth' : 'auto',
    WebkitOverflowScrolling: enableBounce ? 'touch' : 'auto',
    ...style,
  };

  // Custom scrollbar styles
  const scrollbarStyles = `
    .devtools-scrollable-container {
      scrollbar-width: ${scrollbarWidth};
      scrollbar-color: ${showScrollbar ? COLORS.text.muted : 'transparent'} ${COLORS.background.secondary};
    }
    
    .devtools-scrollable-container::-webkit-scrollbar {
      width: ${scrollbarWidth === 'thin' ? '6px' : scrollbarWidth === 'none' ? '0' : '10px'};
      height: ${scrollbarWidth === 'thin' ? '6px' : scrollbarWidth === 'none' ? '0' : '10px'};
    }
    
    .devtools-scrollable-container::-webkit-scrollbar-track {
      background: ${COLORS.background.secondary};
      border-radius: ${RADIUS.md};
    }
    
    .devtools-scrollable-container::-webkit-scrollbar-thumb {
      background: ${showScrollbar ? COLORS.text.muted : 'transparent'};
      border-radius: ${RADIUS.md};
      transition: background 0.2s ease;
    }
    
    .devtools-scrollable-container::-webkit-scrollbar-thumb:hover {
      background: ${COLORS.text.secondary};
    }
    
    .devtools-scrollable-container::-webkit-scrollbar-corner {
      background: ${COLORS.background.secondary};
    }
  `;

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
      <style dangerouslySetInnerHTML={{ __html: scrollbarStyles }} />
      
      {/* Top shadow */}
      {showShadows && shadowsVisible.top && scrollDirection !== 'horizontal' && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '20px',
            background: getShadowGradient('top'),
            pointerEvents: 'none',
            zIndex: 1,
            transition: 'opacity 0.2s ease',
          }}
        />
      )}
      
      {/* Bottom shadow */}
      {showShadows && shadowsVisible.bottom && scrollDirection !== 'horizontal' && (
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '20px',
            background: getShadowGradient('bottom'),
            pointerEvents: 'none',
            zIndex: 1,
            transition: 'opacity 0.2s ease',
          }}
        />
      )}
      
      {/* Left shadow */}
      {showShadows && shadowsVisible.left && scrollDirection !== 'vertical' && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            bottom: 0,
            width: '20px',
            background: getShadowGradient('left'),
            pointerEvents: 'none',
            zIndex: 1,
            transition: 'opacity 0.2s ease',
          }}
        />
      )}
      
      {/* Right shadow */}
      {showShadows && shadowsVisible.right && scrollDirection !== 'vertical' && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: 0,
            width: '20px',
            background: getShadowGradient('right'),
            pointerEvents: 'none',
            zIndex: 1,
            transition: 'opacity 0.2s ease',
          }}
        />
      )}
      
      {/* Scroll position indicator */}
      {showScrollIndicator && scrollDirection !== 'horizontal' && (
        <div
          style={{
            position: 'absolute',
            right: scrollbarWidth === 'thin' ? '8px' : '12px',
            top: '10px',
            fontSize: '10px',
            color: COLORS.text.muted,
            background: COLORS.background.primary,
            padding: '2px 6px',
            borderRadius: RADIUS.sm,
            border: `1px solid ${COLORS.border.primary}`,
            zIndex: 2,
            opacity: showScrollbar ? 1 : 0,
            transition: 'opacity 0.2s ease',
            pointerEvents: 'none',
          }}
        >
          {scrollPosition.top}%
        </div>
      )}
      
      {/* Scrollable content */}
      <div
        ref={containerRef}
        className={`devtools-scrollable-container ${className || ''}`}
        style={containerStyles}
        onScroll={handleScroll}
      >
        {children}
      </div>
    </div>
  );
}