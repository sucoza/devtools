import React, { useState, useCallback, useEffect } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../styles/plugin-styles';

export interface AccordionItem {
  id: string;
  title: React.ReactNode;
  content: React.ReactNode;
  icon?: React.ReactNode;
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export interface AccordionProps {
  items: AccordionItem[];
  
  // Behavior
  defaultExpanded?: string[];
  expanded?: string[];
  onExpandedChange?: (expanded: string[]) => void;
  multiple?: boolean;
  collapsible?: boolean;
  
  // Display
  variant?: 'default' | 'filled' | 'separated' | 'bordered';
  size?: 'sm' | 'md' | 'lg';
  iconPosition?: 'left' | 'right';
  showDivider?: boolean;
  animate?: boolean;
  
  // Custom rendering
  renderHeader?: (item: AccordionItem, isExpanded: boolean) => React.ReactNode;
  renderContent?: (item: AccordionItem) => React.ReactNode;
  
  // Style
  className?: string;
  style?: React.CSSProperties;
  headerClassName?: string;
  headerStyle?: React.CSSProperties;
  contentClassName?: string;
  contentStyle?: React.CSSProperties;
}

export function Accordion({
  items,
  defaultExpanded = [],
  expanded: controlledExpanded,
  onExpandedChange,
  multiple = false,
  collapsible = true,
  variant = 'default',
  size = 'md',
  iconPosition = 'left',
  showDivider = true,
  animate = true,
  renderHeader,
  renderContent,
  className,
  style,
  headerClassName,
  headerStyle,
  contentClassName,
  contentStyle,
}: AccordionProps) {
  const [internalExpanded, setInternalExpanded] = useState<Set<string>>(
    new Set(defaultExpanded)
  );
  
  const expandedSet = controlledExpanded !== undefined 
    ? new Set(controlledExpanded)
    : internalExpanded;
  
  // Handle expansion
  const handleToggle = useCallback((itemId: string) => {
    const item = items.find(i => i.id === itemId);
    if (item?.disabled) return;
    
    let newExpanded: Set<string>;
    
    if (expandedSet.has(itemId)) {
      // Collapse
      if (!collapsible && expandedSet.size === 1) {
        return; // Don't collapse if it's the only expanded item and collapsible is false
      }
      newExpanded = new Set(expandedSet);
      newExpanded.delete(itemId);
    } else {
      // Expand
      if (multiple) {
        newExpanded = new Set(expandedSet);
        newExpanded.add(itemId);
      } else {
        newExpanded = new Set([itemId]);
      }
    }
    
    setInternalExpanded(newExpanded);
    onExpandedChange?.(Array.from(newExpanded));
  }, [expandedSet, items, multiple, collapsible, onExpandedChange]);
  
  // Get size styles
  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return {
          headerPadding: `${SPACING.sm} ${SPACING.md}`,
          contentPadding: `${SPACING.sm} ${SPACING.md}`,
          fontSize: TYPOGRAPHY.fontSize.xs,
          iconSize: 16,
        };
      case 'lg':
        return {
          headerPadding: `${SPACING.lg} ${SPACING.xl}`,
          contentPadding: `${SPACING.lg} ${SPACING.xl}`,
          fontSize: TYPOGRAPHY.fontSize.md,
          iconSize: 20,
        };
      case 'md':
      default:
        return {
          headerPadding: `${SPACING.md} ${SPACING.lg}`,
          contentPadding: `${SPACING.md} ${SPACING.lg}`,
          fontSize: TYPOGRAPHY.fontSize.sm,
          iconSize: 18,
        };
    }
  };
  
  // Get variant styles
  const getVariantStyles = () => {
    switch (variant) {
      case 'filled':
        return {
          container: {},
          item: {
            backgroundColor: COLORS.background.secondary,
            marginBottom: SPACING.xs,
            borderRadius: RADIUS.md,
            overflow: 'hidden',
          },
          header: {
            backgroundColor: COLORS.background.secondary,
          },
          content: {
            backgroundColor: COLORS.background.primary,
          },
        };
        
      case 'separated':
        return {
          container: {
            display: 'flex',
            flexDirection: 'column' as const,
            gap: SPACING.md,
          },
          item: {
            border: `1px solid ${COLORS.border.primary}`,
            borderRadius: RADIUS.md,
            overflow: 'hidden',
          },
          header: {},
          content: {},
        };
        
      case 'bordered':
        return {
          container: {
            border: `1px solid ${COLORS.border.primary}`,
            borderRadius: RADIUS.md,
            overflow: 'hidden',
          },
          item: {},
          header: {},
          content: {},
        };
        
      case 'default':
      default:
        return {
          container: {},
          item: {},
          header: {},
          content: {},
        };
    }
  };
  
  const sizeStyles = getSizeStyles();
  const variantStyles = getVariantStyles();
  
  return (
    <div
      className={className}
      style={{
        ...variantStyles.container,
        ...style,
      }}
    >
      {items.map((item, index) => {
        const isExpanded = expandedSet.has(item.id);
        const isLast = index === items.length - 1;
        
        return (
          <div
            key={item.id}
            className={item.className}
            style={{
              ...variantStyles.item,
              ...item.style,
            }}
          >
            {/* Header */}
            <button
              className={headerClassName}
              onClick={() => handleToggle(item.id)}
              disabled={item.disabled}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: sizeStyles.headerPadding,
                backgroundColor: 'transparent',
                border: 'none',
                cursor: item.disabled ? 'not-allowed' : 'pointer',
                opacity: item.disabled ? 0.5 : 1,
                fontSize: sizeStyles.fontSize,
                fontWeight: TYPOGRAPHY.fontWeight.medium,
                color: COLORS.text.primary,
                transition: 'background-color 0.2s ease',
                ...variantStyles.header,
                ...headerStyle,
              }}
              onMouseEnter={(e) => {
                if (!item.disabled) {
                  e.currentTarget.style.backgroundColor = COLORS.background.hover;
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = variantStyles.header.backgroundColor || 'transparent';
              }}
            >
              {renderHeader ? (
                renderHeader(item, isExpanded)
              ) : (
                <>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: SPACING.sm,
                    flex: 1,
                  }}>
                    {iconPosition === 'left' && (
                      <span style={{
                        display: 'flex',
                        alignItems: 'center',
                        transition: animate ? 'transform 0.2s ease' : 'none',
                        transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                      }}>
                        <ChevronRight size={sizeStyles.iconSize} />
                      </span>
                    )}
                    
                    {item.icon && (
                      <span style={{
                        display: 'flex',
                        alignItems: 'center',
                      }}>
                        {item.icon}
                      </span>
                    )}
                    
                    <span>{item.title}</span>
                  </div>
                  
                  {iconPosition === 'right' && (
                    <span style={{
                      display: 'flex',
                      alignItems: 'center',
                      transition: animate ? 'transform 0.2s ease' : 'none',
                      transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                    }}>
                      <ChevronDown size={sizeStyles.iconSize} />
                    </span>
                  )}
                </>
              )}
            </button>
            
            {/* Content */}
            <AccordionContent
              isExpanded={isExpanded}
              animate={animate}
              className={contentClassName}
              style={{
                ...variantStyles.content,
                ...contentStyle,
              }}
              contentStyle={{
                padding: sizeStyles.contentPadding,
                fontSize: sizeStyles.fontSize,
              }}
            >
              {renderContent ? renderContent(item) : item.content}
            </AccordionContent>
            
            {/* Divider */}
            {showDivider && !isLast && variant === 'default' && (
              <div style={{
                height: '1px',
                backgroundColor: COLORS.border.primary,
                margin: 0,
              }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// Collapsible content component with animation
interface AccordionContentProps {
  isExpanded: boolean;
  animate: boolean;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  contentStyle?: React.CSSProperties;
}

function AccordionContent({
  isExpanded,
  animate,
  children,
  className,
  style,
  contentStyle,
}: AccordionContentProps) {
  const [height, setHeight] = useState<number | 'auto'>('auto');
  const [isAnimating, setIsAnimating] = useState(false);
  const contentRef = React.useRef<HTMLDivElement>(null);
  const innerRef = React.useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!animate || !contentRef.current || !innerRef.current) return;
    
    if (isExpanded) {
      // Expanding
      setIsAnimating(true);
      setHeight(0);
      
      requestAnimationFrame(() => {
        if (innerRef.current) {
          setHeight(innerRef.current.scrollHeight);
        }
      });
      
      setTimeout(() => {
        setHeight('auto');
        setIsAnimating(false);
      }, 200);
    } else {
      // Collapsing
      if (innerRef.current) {
        setIsAnimating(true);
        setHeight(innerRef.current.scrollHeight);
        
        requestAnimationFrame(() => {
          setHeight(0);
        });
        
        setTimeout(() => {
          setIsAnimating(false);
        }, 200);
      }
    }
  }, [isExpanded, animate]);
  
  if (!animate) {
    return isExpanded ? (
      <div className={className} style={style}>
        <div style={contentStyle}>
          {children}
        </div>
      </div>
    ) : null;
  }
  
  return (
    <div
      ref={contentRef}
      className={className}
      style={{
        height: isExpanded || isAnimating ? height : 0,
        overflow: 'hidden',
        transition: isAnimating ? 'height 0.2s ease' : 'none',
        ...style,
      }}
    >
      <div ref={innerRef} style={contentStyle}>
        {children}
      </div>
    </div>
  );
}

// Single collapsible component
export interface CollapsibleProps {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
  trigger: React.ReactNode;
  
  // Options
  disabled?: boolean;
  animate?: boolean;
  
  // Style
  className?: string;
  style?: React.CSSProperties;
  triggerClassName?: string;
  triggerStyle?: React.CSSProperties;
  contentClassName?: string;
  contentStyle?: React.CSSProperties;
}

export function Collapsible({
  open,
  onOpenChange,
  children,
  trigger,
  disabled = false,
  animate = true,
  className,
  style,
  triggerClassName,
  triggerStyle,
  contentClassName,
  contentStyle,
}: CollapsibleProps) {
  const handleToggle = () => {
    if (!disabled) {
      onOpenChange?.(!open);
    }
  };
  
  return (
    <div className={className} style={style}>
      <div
        className={triggerClassName}
        onClick={handleToggle}
        style={{
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.5 : 1,
          ...triggerStyle,
        }}
      >
        {trigger}
      </div>
      
      <AccordionContent
        isExpanded={open}
        animate={animate}
        className={contentClassName}
        style={{}}
        contentStyle={contentStyle}
      >
        {children}
      </AccordionContent>
    </div>
  );
}