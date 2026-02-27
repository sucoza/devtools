import React, { useState, useRef, useCallback, useEffect } from 'react';
import { COLORS } from '../styles/plugin-styles';

export interface SplitPaneProps {
  children: [React.ReactNode, React.ReactNode];
  
  // Direction
  direction?: 'horizontal' | 'vertical';
  
  // Size configuration
  defaultSize?: number | string;
  minSize?: number | string;
  maxSize?: number | string;
  size?: number | string;
  onSizeChange?: (size: number) => void;
  
  // Pane configuration
  pane1MinSize?: number;
  pane2MinSize?: number;
  pane1MaxSize?: number;
  pane2MaxSize?: number;
  
  // Resizer configuration
  resizerStyle?: React.CSSProperties;
  resizerClassName?: string;
  allowResize?: boolean;
  showResizeHandle?: boolean;
  resizerSize?: number;
  
  // Snap points
  snapPoints?: number[];
  snapThreshold?: number;
  
  // Collapse configuration
  collapsible?: boolean;
  collapsed?: boolean;
  collapseDirection?: 'first' | 'second';
  onCollapse?: (collapsed: boolean) => void;
  
  // Style
  className?: string;
  style?: React.CSSProperties;
  pane1Style?: React.CSSProperties;
  pane2Style?: React.CSSProperties;
  
  // Callbacks
  onDragStart?: () => void;
  onDragEnd?: () => void;
}

export function SplitPane({
  children,
  direction = 'horizontal',
  defaultSize = '50%',
  size,
  onSizeChange,
  pane1MinSize = 50,
  pane2MinSize = 50,
  pane1MaxSize,
  pane2MaxSize,
  resizerStyle,
  resizerClassName,
  allowResize = true,
  showResizeHandle = true,
  resizerSize = 4,
  snapPoints = [],
  snapThreshold = 20,
  collapsible = false,
  collapsed = false,
  collapseDirection = 'first',
  onCollapse,
  className,
  style,
  pane1Style,
  pane2Style,
  onDragStart,
  onDragEnd,
}: SplitPaneProps) {
  const [paneSize, setPaneSize] = useState<number | string>(size || defaultSize);
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(collapsed);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const resizerRef = useRef<HTMLDivElement>(null);
  const startPosRef = useRef<number>(0);
  const startSizeRef = useRef<number>(0);

  // Convert size to pixels
  const getSizeInPixels = useCallback((sizeValue: number | string, containerSize: number): number => {
    if (typeof sizeValue === 'number') {
      return sizeValue;
    }
    if (typeof sizeValue === 'string' && sizeValue.endsWith('%')) {
      return (parseFloat(sizeValue) / 100) * containerSize;
    }
    return parseFloat(sizeValue) || 0;
  }, []);

  // Get container size
  const getContainerSize = useCallback(() => {
    if (!containerRef.current) return 0;
    return direction === 'horizontal' 
      ? containerRef.current.clientWidth 
      : containerRef.current.clientHeight;
  }, [direction]);

  // Snap to points
  const snapToPoint = useCallback((currentSize: number): number => {
    if (snapPoints.length === 0) return currentSize;
    
    const containerSize = getContainerSize();
    for (const point of snapPoints) {
      const snapSize = getSizeInPixels(point, containerSize);
      if (Math.abs(currentSize - snapSize) < snapThreshold) {
        return snapSize;
      }
    }
    
    return currentSize;
  }, [snapPoints, snapThreshold, getContainerSize, getSizeInPixels]);

  // Handle mouse down
  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    if (!allowResize) return;
    
    event.preventDefault();
    setIsDragging(true);
    
    const containerSize = getContainerSize();
    startPosRef.current = direction === 'horizontal' ? event.clientX : event.clientY;
    startSizeRef.current = getSizeInPixels(paneSize, containerSize);
    
    if (onDragStart) onDragStart();
  }, [allowResize, direction, paneSize, getContainerSize, getSizeInPixels, onDragStart]);

  // Handle mouse move
  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    
    const containerSize = getContainerSize();
    const currentPos = direction === 'horizontal' ? event.clientX : event.clientY;
    const delta = currentPos - startPosRef.current;
    let newSize = startSizeRef.current + delta;
    
    // Apply constraints
    newSize = Math.max(pane1MinSize, newSize);
    newSize = Math.min(containerSize - pane2MinSize, newSize);
    
    if (pane1MaxSize) {
      newSize = Math.min(pane1MaxSize, newSize);
    }
    if (pane2MaxSize) {
      newSize = Math.max(containerSize - pane2MaxSize, newSize);
    }
    
    // Apply snap points
    newSize = snapToPoint(newSize);
    
    // Check for collapse
    if (collapsible) {
      if (collapseDirection === 'first' && newSize < pane1MinSize / 2) {
        setIsCollapsed(true);
        if (onCollapse) onCollapse(true);
        return;
      }
      if (collapseDirection === 'second' && newSize > containerSize - pane2MinSize / 2) {
        setIsCollapsed(true);
        if (onCollapse) onCollapse(true);
        return;
      }
    }
    
    setIsCollapsed(false);
    setPaneSize(newSize);
    
    if (onSizeChange) {
      onSizeChange(newSize);
    }
  }, [
    isDragging, 
    direction, 
    pane1MinSize, 
    pane2MinSize, 
    pane1MaxSize, 
    pane2MaxSize,
    collapsible,
    collapseDirection,
    getContainerSize,
    snapToPoint,
    onSizeChange,
    onCollapse
  ]);

  // Handle mouse up
  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      if (onDragEnd) onDragEnd();
    }
  }, [isDragging, onDragEnd]);

  // Handle double click (toggle collapse)
  const handleDoubleClick = useCallback(() => {
    if (!collapsible) return;
    
    const newCollapsed = !isCollapsed;
    setIsCollapsed(newCollapsed);
    
    if (!newCollapsed) {
      // Restore to default size
      setPaneSize(defaultSize);
    }
    
    if (onCollapse) {
      onCollapse(newCollapsed);
    }
  }, [collapsible, isCollapsed, defaultSize, onCollapse]);

  // Add/remove event listeners
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = direction === 'horizontal' ? 'col-resize' : 'row-resize';
      document.body.style.userSelect = 'none';
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };
    }
    return undefined;
  }, [isDragging, handleMouseMove, handleMouseUp, direction]);

  // Update collapsed state from props
  useEffect(() => {
    setIsCollapsed(collapsed);
  }, [collapsed]);

  // Calculate pane sizes
  const containerSize = getContainerSize();
  const pane1SizePx = isCollapsed
    ? (collapseDirection === 'first' ? 0 : containerSize)
    : getSizeInPixels(size || paneSize, containerSize);
  
  const pane1SizeStyle = direction === 'horizontal' 
    ? { width: `${pane1SizePx}px` }
    : { height: `${pane1SizePx}px` };
  
  const pane2SizeStyle = direction === 'horizontal'
    ? { width: `calc(100% - ${pane1SizePx + resizerSize}px)` }
    : { height: `calc(100% - ${pane1SizePx + resizerSize}px)` };

  // Resizer styles
  const resizerStyles: React.CSSProperties = {
    position: 'relative',
    cursor: allowResize ? (direction === 'horizontal' ? 'col-resize' : 'row-resize') : 'default',
    userSelect: 'none',
    backgroundColor: isDragging ? COLORS.border.focus : (isHovered ? COLORS.background.hover : COLORS.border.primary),
    transition: isDragging ? 'none' : 'background-color 0.2s ease',
    ...(direction === 'horizontal' 
      ? { width: `${resizerSize}px`, height: '100%' }
      : { width: '100%', height: `${resizerSize}px` }
    ),
    ...resizerStyle,
  };

  // Container styles
  const containerStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: direction === 'horizontal' ? 'row' : 'column',
    width: '100%',
    height: '100%',
    position: 'relative',
    ...style,
  };

  return (
    <div ref={containerRef} className={className} style={containerStyles}>
      {/* First pane */}
      <div style={{ ...pane1SizeStyle, overflow: 'hidden', ...pane1Style }}>
        {children[0]}
      </div>

      {/* Resizer */}
      <div
        ref={resizerRef}
        className={resizerClassName}
        style={resizerStyles}
        onMouseDown={handleMouseDown}
        onDoubleClick={handleDoubleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {showResizeHandle && allowResize && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              ...(direction === 'horizontal'
                ? {
                    width: '2px',
                    height: '30px',
                    background: `linear-gradient(to bottom, transparent, ${COLORS.text.muted}, transparent)`,
                  }
                : {
                    width: '30px',
                    height: '2px',
                    background: `linear-gradient(to right, transparent, ${COLORS.text.muted}, transparent)`,
                  }
              ),
            }}
          />
        )}
      </div>

      {/* Second pane */}
      <div style={{ ...pane2SizeStyle, overflow: 'hidden', ...pane2Style }}>
        {children[1]}
      </div>
    </div>
  );
}