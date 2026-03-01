import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Plus } from 'lucide-react';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../styles/plugin-styles';

export interface Tab {
  id: string;
  label: React.ReactNode;
  content?: React.ReactNode;
  icon?: React.ReactNode;
  disabled?: boolean;
  closable?: boolean;
  badge?: React.ReactNode;
  tooltip?: string;
}

export interface TabsProps {
  tabs: Tab[];
  activeTab?: string;
  defaultActiveTab?: string;
  onTabChange?: (tabId: string) => void;
  
  // Behavior
  orientation?: 'horizontal' | 'vertical';
  variant?: 'default' | 'pills' | 'underline' | 'enclosed' | 'soft';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  centered?: boolean;
  scrollable?: boolean;
  
  // Features
  addable?: boolean;
  onAdd?: () => void;
  onClose?: (tabId: string) => void;
  
  // Styling
  tabListClassName?: string;
  tabListStyle?: React.CSSProperties;
  tabClassName?: string;
  tabStyle?: React.CSSProperties;
  panelClassName?: string;
  panelStyle?: React.CSSProperties;
  
  // Custom rendering
  renderTab?: (tab: Tab, isActive: boolean) => React.ReactNode;
  renderPanel?: (tab: Tab) => React.ReactNode;
}

export function Tabs({
  tabs,
  activeTab: controlledActiveTab,
  defaultActiveTab,
  onTabChange,
  orientation = 'horizontal',
  variant = 'default',
  size = 'md',
  fullWidth = false,
  centered = false,
  scrollable = false,
  addable = false,
  onAdd,
  onClose,
  tabListClassName,
  tabListStyle,
  tabClassName,
  tabStyle,
  panelClassName,
  panelStyle,
  renderTab,
  renderPanel,
}: TabsProps) {
  const [internalActiveTab, setInternalActiveTab] = useState(
    defaultActiveTab || tabs[0]?.id || ''
  );
  const tabListRef = useRef<HTMLDivElement>(null);
  const [showScrollButtons, setShowScrollButtons] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  
  const activeTabId = controlledActiveTab !== undefined ? controlledActiveTab : internalActiveTab;
  const activeTabData = tabs.find(tab => tab.id === activeTabId);

  // Auto-select first tab when active tab no longer exists (e.g., after closing)
  useEffect(() => {
    if (controlledActiveTab !== undefined) return;
    if (tabs.length > 0 && !tabs.some(t => t.id === internalActiveTab)) {
      setInternalActiveTab(tabs[0].id);
    }
  }, [tabs, internalActiveTab, controlledActiveTab]);
  
  // Handle tab change
  const handleTabChange = useCallback((tabId: string) => {
    const tab = tabs.find(t => t.id === tabId);
    if (tab?.disabled) return;
    
    setInternalActiveTab(tabId);
    onTabChange?.(tabId);
  }, [tabs, onTabChange]);
  
  // Check scroll state
  const checkScrollState = useCallback(() => {
    if (!scrollable || !tabListRef.current) return;
    
    const { scrollLeft, scrollWidth, clientWidth } = tabListRef.current;
    setShowScrollButtons(scrollWidth > clientWidth);
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
  }, [scrollable]);
  
  // Setup scroll listener
  useEffect(() => {
    if (!scrollable) return undefined;
    
    checkScrollState();
    window.addEventListener('resize', checkScrollState);
    
    const tabList = tabListRef.current;
    if (tabList) {
      tabList.addEventListener('scroll', checkScrollState);
    }
    
    return () => {
      window.removeEventListener('resize', checkScrollState);
      if (tabList) {
        tabList.removeEventListener('scroll', checkScrollState);
      }
    };
  }, [scrollable, checkScrollState]);
  
  // Scroll to active tab
  useEffect(() => {
    if (!scrollable || !tabListRef.current) return;
    
    const activeTabElement = tabListRef.current.querySelector(`[data-tab-id="${activeTabId}"]`);
    if (activeTabElement) {
      activeTabElement.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [activeTabId, scrollable]);
  
  // Get size styles
  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return {
          padding: `${SPACING.xs} ${SPACING.sm}`,
          fontSize: TYPOGRAPHY.fontSize.xs,
          iconSize: 14,
        };
      case 'lg':
        return {
          padding: `${SPACING.md} ${SPACING.lg}`,
          fontSize: TYPOGRAPHY.fontSize.md,
          iconSize: 18,
        };
      case 'md':
      default:
        return {
          padding: `${SPACING.sm} ${SPACING.md}`,
          fontSize: TYPOGRAPHY.fontSize.sm,
          iconSize: 16,
        };
    }
  };
  
  // Get variant styles for tab
  const getTabVariantStyles = (isActive: boolean, disabled: boolean) => {
    if (disabled) {
      return {
        opacity: 0.5,
        cursor: 'not-allowed',
        backgroundColor: 'transparent',
        color: COLORS.text.muted,
      };
    }
    
    switch (variant) {
      case 'pills':
        return {
          backgroundColor: isActive ? COLORS.background.selected : 'transparent',
          color: isActive ? COLORS.text.accent : COLORS.text.primary,
          borderRadius: RADIUS.md,
          border: 'none',
        };
        
      case 'underline':
        return {
          backgroundColor: 'transparent',
          color: isActive ? COLORS.text.accent : COLORS.text.primary,
          borderBottom: isActive ? `2px solid ${COLORS.text.accent}` : '2px solid transparent',
          borderRadius: 0,
        };
        
      case 'enclosed':
        return {
          backgroundColor: isActive ? COLORS.background.primary : COLORS.background.secondary,
          color: isActive ? COLORS.text.primary : COLORS.text.secondary,
          border: `1px solid ${COLORS.border.primary}`,
          borderBottom: isActive && orientation === 'horizontal' ? `1px solid ${COLORS.background.primary}` : undefined,
          borderRight: isActive && orientation === 'vertical' ? `1px solid ${COLORS.background.primary}` : undefined,
          borderRadius: `${RADIUS.md} ${RADIUS.md} 0 0`,
        };
        
      case 'soft':
        return {
          backgroundColor: isActive ? `${COLORS.text.accent}20` : 'transparent',
          color: isActive ? COLORS.text.accent : COLORS.text.primary,
          borderRadius: RADIUS.sm,
          border: 'none',
        };
        
      case 'default':
      default:
        return {
          backgroundColor: isActive ? COLORS.background.secondary : 'transparent',
          color: isActive ? COLORS.text.primary : COLORS.text.secondary,
          borderRadius: RADIUS.sm,
          border: 'none',
        };
    }
  };
  
  const sizeStyles = getSizeStyles();
  
  // Scroll handlers
  const scrollLeft = () => {
    if (tabListRef.current) {
      tabListRef.current.scrollBy({ left: -200, behavior: 'smooth' });
    }
  };
  
  const scrollRight = () => {
    if (tabListRef.current) {
      tabListRef.current.scrollBy({ left: 200, behavior: 'smooth' });
    }
  };
  
  // Render tab list
  const tabList = (
    <div
      ref={tabListRef}
      className={tabListClassName}
      style={{
        display: 'flex',
        flexDirection: orientation === 'vertical' ? 'column' : 'row',
        gap: SPACING.xs,
        ...(orientation === 'horizontal' && {
          borderBottom: variant === 'underline' || variant === 'enclosed' ? `1px solid ${COLORS.border.primary}` : 'none',
          overflowX: scrollable ? 'auto' : 'visible',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitScrollbar: { display: 'none' },
        }),
        ...(orientation === 'vertical' && {
          borderRight: variant === 'underline' || variant === 'enclosed' ? `1px solid ${COLORS.border.primary}` : 'none',
          minWidth: '200px',
        }),
        ...(fullWidth && orientation === 'horizontal' && { width: '100%' }),
        ...(centered && { justifyContent: 'center' }),
        ...tabListStyle,
      }}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTabId;
        const tabVariantStyles = getTabVariantStyles(isActive, tab.disabled || false);
        
        if (renderTab) {
          return (
            <div
              key={tab.id}
              data-tab-id={tab.id}
              onClick={() => handleTabChange(tab.id)}
              style={{ cursor: tab.disabled ? 'not-allowed' : 'pointer' }}
            >
              {renderTab(tab, isActive)}
            </div>
          );
        }
        
        return (
          <button
            key={tab.id}
            data-tab-id={tab.id}
            className={tabClassName}
            onClick={() => handleTabChange(tab.id)}
            disabled={tab.disabled}
            title={tab.tooltip}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: SPACING.xs,
              padding: sizeStyles.padding,
              fontSize: sizeStyles.fontSize,
              fontWeight: isActive ? TYPOGRAPHY.fontWeight.medium : TYPOGRAPHY.fontWeight.normal,
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap',
              border: 'none',
              outline: 'none',
              ...(fullWidth && orientation === 'horizontal' && { flex: 1 }),
              ...tabVariantStyles,
              ...tabStyle,
            }}
            onMouseEnter={(e) => {
              if (!tab.disabled && !isActive) {
                e.currentTarget.style.backgroundColor = 
                  variant === 'pills' || variant === 'soft' 
                    ? `${COLORS.text.accent}10` 
                    : COLORS.background.hover;
              }
            }}
            onMouseLeave={(e) => {
              if (!tab.disabled && !isActive) {
                e.currentTarget.style.backgroundColor = tabVariantStyles.backgroundColor as string;
              }
            }}
          >
            {tab.icon && (
              <span style={{ display: 'flex', alignItems: 'center' }}>
                {tab.icon}
              </span>
            )}
            
            <span>{tab.label}</span>
            
            {tab.badge && (
              <span style={{
                marginLeft: SPACING.xs,
                display: 'flex',
                alignItems: 'center',
              }}>
                {tab.badge}
              </span>
            )}
            
            {tab.closable && onClose && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onClose(tab.id);
                }}
                style={{
                  marginLeft: SPACING.xs,
                  padding: '2px',
                  background: 'transparent',
                  border: 'none',
                  color: COLORS.text.muted,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  borderRadius: RADIUS.sm,
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = COLORS.background.hover;
                  e.currentTarget.style.color = COLORS.text.primary;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = COLORS.text.muted;
                }}
              >
                <X size={14} />
              </button>
            )}
          </button>
        );
      })}
      
      {addable && onAdd && (
        <button
          onClick={onAdd}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: sizeStyles.padding,
            background: 'transparent',
            border: 'none',
            color: COLORS.text.muted,
            cursor: 'pointer',
            borderRadius: RADIUS.sm,
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = COLORS.background.hover;
            e.currentTarget.style.color = COLORS.text.primary;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = COLORS.text.muted;
          }}
        >
          <Plus size={sizeStyles.iconSize} />
        </button>
      )}
    </div>
  );
  
  // Render content
  const content = (
    <div style={{
      display: 'flex',
      flexDirection: orientation === 'vertical' ? 'row' : 'column',
      ...(orientation === 'vertical' && { height: '100%' }),
    }}>
      {/* Tab list with scroll buttons */}
      {orientation === 'horizontal' && scrollable && showScrollButtons ? (
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <button
            onClick={scrollLeft}
            disabled={!canScrollLeft}
            style={{
              position: 'absolute',
              left: 0,
              zIndex: 1,
              padding: SPACING.xs,
              background: COLORS.background.primary,
              border: `1px solid ${COLORS.border.primary}`,
              borderRadius: RADIUS.sm,
              cursor: canScrollLeft ? 'pointer' : 'not-allowed',
              opacity: canScrollLeft ? 1 : 0.5,
            }}
          >
            ←
          </button>
          
          <div style={{ overflow: 'hidden', flex: 1, marginLeft: '30px', marginRight: '30px' }}>
            {tabList}
          </div>
          
          <button
            onClick={scrollRight}
            disabled={!canScrollRight}
            style={{
              position: 'absolute',
              right: 0,
              zIndex: 1,
              padding: SPACING.xs,
              background: COLORS.background.primary,
              border: `1px solid ${COLORS.border.primary}`,
              borderRadius: RADIUS.sm,
              cursor: canScrollRight ? 'pointer' : 'not-allowed',
              opacity: canScrollRight ? 1 : 0.5,
            }}
          >
            →
          </button>
        </div>
      ) : (
        tabList
      )}
      
      {/* Tab panel */}
      {activeTabData && (
        <div
          className={panelClassName}
          style={{
            flex: 1,
            padding: SPACING.md,
            ...(variant === 'enclosed' && {
              border: `1px solid ${COLORS.border.primary}`,
              borderTop: orientation === 'horizontal' ? 'none' : undefined,
              borderLeft: orientation === 'vertical' ? 'none' : undefined,
            }),
            ...panelStyle,
          }}
        >
          {renderPanel ? renderPanel(activeTabData) : activeTabData.content}
        </div>
      )}
    </div>
  );
  
  return content;
}

// TabPanel component for lazy rendering
export interface TabPanelProps {
  tabId: string;
  activeTabId: string;
  children: React.ReactNode;
  lazy?: boolean;
  keepMounted?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export function TabPanel({
  tabId,
  activeTabId,
  children,
  lazy = false,
  keepMounted = false,
  className,
  style,
}: TabPanelProps) {
  const isActive = tabId === activeTabId;
  const [hasBeenActive, setHasBeenActive] = useState(isActive);
  
  useEffect(() => {
    if (isActive && !hasBeenActive) {
      setHasBeenActive(true);
    }
  }, [isActive, hasBeenActive]);
  
  // Don't render if lazy and never been active
  if (lazy && !hasBeenActive) {
    return null;
  }
  
  // Hide if not active and not keeping mounted
  if (!isActive && !keepMounted) {
    return null;
  }
  
  return (
    <div
      className={className}
      style={{
        display: isActive ? 'block' : 'none',
        ...style,
      }}
    >
      {children}
    </div>
  );
}