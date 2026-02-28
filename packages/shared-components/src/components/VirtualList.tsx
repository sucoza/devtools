import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { ScrollableContainer } from './ScrollableContainer';
import { COLORS, SPACING } from '../styles/plugin-styles';

export interface VirtualListProps<T> {
  items: T[];
  itemHeight: number | ((index: number, item: T) => number);
  renderItem: (item: T, index: number, style: React.CSSProperties) => React.ReactNode;
  
  // Container props
  height?: number | string;
  width?: number | string;
  className?: string;
  style?: React.CSSProperties;
  
  // Performance
  overscan?: number;
  estimatedItemHeight?: number;
  getItemKey?: (item: T, index: number) => string | number;
  
  // Scroll behavior
  initialScrollOffset?: number;
  scrollToAlignment?: 'start' | 'center' | 'end' | 'auto';
  onScroll?: (scrollOffset: number) => void;
  
  // Loading states
  isLoading?: boolean;
  hasMore?: boolean;
  loadMore?: () => void;
  loadMoreThreshold?: number;
  
  // Empty state
  emptyState?: React.ReactNode;
  
  // Header/Footer
  header?: React.ReactNode;
  footer?: React.ReactNode;
  stickyHeader?: boolean;
  stickyFooter?: boolean;
}

interface ItemMetadata {
  offset: number;
  height: number;
}

export function VirtualList<T>({
  items,
  itemHeight,
  renderItem,
  height = '100%',
  width = '100%',
  className,
  style,
  overscan = 3,
  getItemKey,
  initialScrollOffset = 0,
  scrollToAlignment = 'auto',
  onScroll,
  isLoading = false,
  hasMore = false,
  loadMore,
  loadMoreThreshold = 100,
  emptyState,
  header,
  footer,
  stickyHeader = false,
  stickyFooter = false,
}: VirtualListProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollElementRef = useRef<HTMLDivElement>(null);
  const [scrollOffset, setScrollOffset] = useState(initialScrollOffset);
  const [containerHeight, setContainerHeight] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Calculate item metadata
  const itemMetadata = useMemo(() => {
    const metadata: ItemMetadata[] = [];
    let offset = 0;

    for (let i = 0; i < items.length; i++) {
      const height = typeof itemHeight === 'function' 
        ? itemHeight(i, items[i]) 
        : itemHeight;
      
      metadata.push({ offset, height });
      offset += height;
    }

    return metadata;
  }, [items, itemHeight]);

  // Calculate total height
  const totalHeight = useMemo(() => {
    if (itemMetadata.length === 0) return 0;
    const lastItem = itemMetadata[itemMetadata.length - 1];
    return lastItem.offset + lastItem.height;
  }, [itemMetadata]);

  // Find start and end indices for visible items
  const getVisibleRange = useCallback(() => {
    if (!containerHeight || itemMetadata.length === 0) {
      return { startIndex: 0, endIndex: 0 };
    }

    // Binary search for start index
    let startIndex = 0;
    let endIndex = itemMetadata.length - 1;

    while (startIndex < endIndex) {
      const middleIndex = Math.floor((startIndex + endIndex) / 2);
      const middleOffset = itemMetadata[middleIndex].offset;

      if (middleOffset < scrollOffset) {
        startIndex = middleIndex + 1;
      } else {
        endIndex = middleIndex;
      }
    }

    // Apply overscan
    startIndex = Math.max(0, startIndex - overscan);

    // Find end index
    endIndex = startIndex;
    let accumulatedHeight = 0;

    while (endIndex < itemMetadata.length && accumulatedHeight < containerHeight + scrollOffset) {
      accumulatedHeight = itemMetadata[endIndex].offset + itemMetadata[endIndex].height;
      endIndex++;
    }

    // Apply overscan
    endIndex = Math.min(itemMetadata.length - 1, endIndex + overscan);

    return { startIndex, endIndex };
  }, [containerHeight, itemMetadata, scrollOffset, overscan]);

  const visibleRange = getVisibleRange();

  // Handle scroll
  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    const newScrollOffset = event.currentTarget.scrollTop;
    setScrollOffset(newScrollOffset);
    
    if (onScroll) {
      onScroll(newScrollOffset);
    }

    // Check if should load more
    if (loadMore && hasMore && !isLoadingMore) {
      const scrollHeight = event.currentTarget.scrollHeight;
      const clientHeight = event.currentTarget.clientHeight;
      const scrollTop = event.currentTarget.scrollTop;

      if (scrollHeight - scrollTop - clientHeight < loadMoreThreshold) {
        setIsLoadingMore(true);
        loadMore();
      }
    }
  }, [onScroll, loadMore, hasMore, isLoadingMore, loadMoreThreshold]);

  // Reset loading state when items change
  useEffect(() => {
    setIsLoadingMore(false);
  }, [items]);

  // Measure container height
  useEffect(() => {
    const measureContainer = () => {
      if (containerRef.current) {
        setContainerHeight(containerRef.current.clientHeight);
      }
    };

    measureContainer();
    window.addEventListener('resize', measureContainer);

    return () => {
      window.removeEventListener('resize', measureContainer);
    };
  }, []);

  // Scroll to index function
  const _scrollToIndex = useCallback((index: number, alignment: 'start' | 'center' | 'end' | 'auto' = scrollToAlignment) => {
    if (!scrollElementRef.current || !itemMetadata[index]) return;

    const item = itemMetadata[index];
    let offset = item.offset;

    switch (alignment) {
      case 'center':
        offset = item.offset - (containerHeight / 2) + (item.height / 2);
        break;
      case 'end':
        offset = item.offset - containerHeight + item.height;
        break;
      case 'auto':
        // Keep current position if item is visible
        if (item.offset >= scrollOffset && item.offset + item.height <= scrollOffset + containerHeight) {
          return;
        }
        // Otherwise, scroll to start
        break;
    }

    scrollElementRef.current.scrollTop = Math.max(0, Math.min(offset, totalHeight - containerHeight));
  }, [itemMetadata, containerHeight, scrollOffset, totalHeight, scrollToAlignment]);

  // Render visible items
  const visibleItems = useMemo(() => {
    const rendered: React.ReactNode[] = [];

    for (let i = visibleRange.startIndex; i <= visibleRange.endIndex; i++) {
      const meta = itemMetadata[i];
      if (!meta) continue;

      const key = getItemKey ? getItemKey(items[i], i) : i;
      const itemStyle: React.CSSProperties = {
        position: 'absolute',
        top: meta.offset,
        left: 0,
        right: 0,
        height: meta.height,
      };

      rendered.push(
        <div key={key} style={itemStyle}>
          {renderItem(items[i], i, itemStyle)}
        </div>
      );
    }

    return rendered;
  }, [visibleRange, itemMetadata, getItemKey, items, renderItem]);

  // Container styles
  const containerStyles: React.CSSProperties = {
    height,
    width,
    position: 'relative',
    ...style,
  };

  const scrollStyles: React.CSSProperties = {
    height: '100%',
    width: '100%',
    position: 'relative',
  };

  const contentStyles: React.CSSProperties = {
    height: totalHeight,
    position: 'relative',
  };

  // Empty state
  if (items.length === 0 && !isLoading) {
    return (
      <div style={containerStyles} className={className}>
        {emptyState || (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: COLORS.text.muted,
            fontSize: '14px',
          }}>
            No items to display
          </div>
        )}
      </div>
    );
  }

  return (
    <div ref={containerRef} style={containerStyles} className={className}>
      {/* Sticky header */}
      {header && stickyHeader && (
        <div style={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          background: COLORS.background.primary,
        }}>
          {header}
        </div>
      )}

      {/* Non-sticky header */}
      {header && !stickyHeader && header}

      {/* Virtual list container */}
      <ScrollableContainer
        style={scrollStyles}
        onScroll={handleScroll}
        showShadows={true}
        smoothScroll={true}
      >
        <div style={contentStyles}>
          {visibleItems}
        </div>

        {/* Loading indicator */}
        {(isLoading || isLoadingMore) && (
          <div style={{
            padding: SPACING.xl,
            textAlign: 'center',
            color: COLORS.text.muted,
          }}>
            <div style={{
              display: 'inline-block',
              width: '20px',
              height: '20px',
              border: `2px solid ${COLORS.border.primary}`,
              borderTopColor: COLORS.text.accent,
              borderRadius: '50%',
              animation: 'dt-spin 1s linear infinite',
            }} />

          </div>
        )}
      </ScrollableContainer>

      {/* Non-sticky footer */}
      {footer && !stickyFooter && footer}

      {/* Sticky footer */}
      {footer && stickyFooter && (
        <div style={{
          position: 'sticky',
          bottom: 0,
          zIndex: 10,
          background: COLORS.background.primary,
        }}>
          {footer}
        </div>
      )}
    </div>
  );
}