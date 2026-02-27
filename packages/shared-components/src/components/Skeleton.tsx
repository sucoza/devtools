import React from 'react';
import { COLORS, SPACING, RADIUS } from '../styles/plugin-styles';

export interface SkeletonProps {
  // Shape
  variant?: 'text' | 'rectangular' | 'circular' | 'rounded';
  
  // Size
  width?: number | string;
  height?: number | string;
  
  // Animation
  animation?: 'pulse' | 'wave' | 'none';
  speed?: 'slow' | 'normal' | 'fast';
  
  // Style
  className?: string;
  style?: React.CSSProperties;
}

export function Skeleton({
  variant = 'text',
  width,
  height,
  animation = 'pulse',
  speed = 'normal',
  className,
  style,
}: SkeletonProps) {
  // Get dimensions based on variant
  const getDimensions = () => {
    switch (variant) {
      case 'text':
        return {
          width: width || '100%',
          height: height || '1em',
        };
      case 'circular':
        return {
          width: width || 40,
          height: height || width || 40,
        };
      case 'rectangular':
      case 'rounded':
      default:
        return {
          width: width || '100%',
          height: height || 120,
        };
    }
  };
  
  // Get animation duration
  const getAnimationDuration = () => {
    switch (speed) {
      case 'slow':
        return '2s';
      case 'fast':
        return '1s';
      case 'normal':
      default:
        return '1.5s';
    }
  };
  
  const dimensions = getDimensions();
  const duration = getAnimationDuration();
  
  // Get border radius
  const getBorderRadius = () => {
    switch (variant) {
      case 'circular':
        return '50%';
      case 'rounded':
        return RADIUS.md;
      case 'text':
        return RADIUS.sm;
      case 'rectangular':
      default:
        return 0;
    }
  };
  
  return (
    <div
      className={className}
      style={{
        width: dimensions.width,
        height: dimensions.height,
        backgroundColor: COLORS.background.secondary,
        borderRadius: getBorderRadius(),
        position: 'relative',
        overflow: 'hidden',
        ...(animation === 'pulse' && {
          animation: `skeleton-pulse ${duration} ease-in-out infinite`,
        }),
        ...style,
      }}
    >
      {animation === 'wave' && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `linear-gradient(
              90deg,
              transparent,
              ${COLORS.background.hover},
              transparent
            )`,
            animation: `skeleton-wave ${duration} ease-in-out infinite`,
          }}
        />
      )}
      
      <style>{`
        @keyframes skeleton-pulse {
          0% {
            opacity: 1;
          }
          50% {
            opacity: 0.4;
          }
          100% {
            opacity: 1;
          }
        }

        @keyframes skeleton-wave {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </div>
  );
}

// Skeleton group for common patterns
export interface SkeletonGroupProps {
  preset?: 'card' | 'list-item' | 'avatar' | 'paragraph' | 'table-row' | 'form';
  count?: number;
  
  // Animation
  animation?: 'pulse' | 'wave' | 'none';
  speed?: 'slow' | 'normal' | 'fast';
  
  // Style
  className?: string;
  style?: React.CSSProperties;
}

export function SkeletonGroup({
  preset = 'paragraph',
  count = 1,
  animation = 'pulse',
  speed = 'normal',
  className,
  style,
}: SkeletonGroupProps) {
  const renderPreset = () => {
    switch (preset) {
      case 'card':
        return (
          <div style={{
            padding: SPACING.md,
            border: `1px solid ${COLORS.border.primary}`,
            borderRadius: RADIUS.md,
          }}>
            <Skeleton variant="rectangular" height={200} animation={animation} speed={speed} />
            <div style={{ marginTop: SPACING.md }}>
              <Skeleton variant="text" width="60%" animation={animation} speed={speed} />
              <Skeleton 
                variant="text" 
                width="100%" 
                animation={animation} 
                speed={speed}
                style={{ marginTop: SPACING.sm }}
              />
              <Skeleton 
                variant="text" 
                width="80%" 
                animation={animation} 
                speed={speed}
                style={{ marginTop: SPACING.xs }}
              />
            </div>
          </div>
        );
        
      case 'list-item':
        return (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: SPACING.md,
            padding: SPACING.md,
          }}>
            <Skeleton variant="circular" width={40} height={40} animation={animation} speed={speed} />
            <div style={{ flex: 1 }}>
              <Skeleton variant="text" width="30%" animation={animation} speed={speed} />
              <Skeleton 
                variant="text" 
                width="50%" 
                animation={animation} 
                speed={speed}
                style={{ marginTop: SPACING.xs, height: '0.8em' }}
              />
            </div>
          </div>
        );
        
      case 'avatar':
        return (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: SPACING.sm,
          }}>
            <Skeleton variant="circular" width={32} height={32} animation={animation} speed={speed} />
            <Skeleton variant="text" width={100} animation={animation} speed={speed} />
          </div>
        );
        
      case 'paragraph':
        return (
          <div>
            <Skeleton variant="text" width="100%" animation={animation} speed={speed} />
            <Skeleton 
              variant="text" 
              width="100%" 
              animation={animation} 
              speed={speed}
              style={{ marginTop: SPACING.xs }}
            />
            <Skeleton 
              variant="text" 
              width="70%" 
              animation={animation} 
              speed={speed}
              style={{ marginTop: SPACING.xs }}
            />
          </div>
        );
        
      case 'table-row':
        return (
          <div style={{
            display: 'flex',
            gap: SPACING.md,
            padding: SPACING.sm,
            borderBottom: `1px solid ${COLORS.border.primary}`,
          }}>
            <Skeleton variant="text" width="20%" animation={animation} speed={speed} />
            <Skeleton variant="text" width="30%" animation={animation} speed={speed} />
            <Skeleton variant="text" width="25%" animation={animation} speed={speed} />
            <Skeleton variant="text" width="25%" animation={animation} speed={speed} />
          </div>
        );
        
      case 'form':
        return (
          <div>
            <Skeleton 
              variant="text" 
              width={80} 
              height="0.8em" 
              animation={animation} 
              speed={speed}
            />
            <Skeleton 
              variant="rounded" 
              height={40} 
              animation={animation} 
              speed={speed}
              style={{ marginTop: SPACING.xs }}
            />
            <Skeleton 
              variant="text" 
              width={80} 
              height="0.8em" 
              animation={animation} 
              speed={speed}
              style={{ marginTop: SPACING.md }}
            />
            <Skeleton 
              variant="rounded" 
              height={40} 
              animation={animation} 
              speed={speed}
              style={{ marginTop: SPACING.xs }}
            />
          </div>
        );
        
      default:
        return null;
    }
  };
  
  return (
    <div className={className} style={style}>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} style={{ marginBottom: index < count - 1 ? SPACING.md : 0 }}>
          {renderPreset()}
        </div>
      ))}
    </div>
  );
}