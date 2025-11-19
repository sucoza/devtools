import React from 'react';

/**
 * Comprehensive style system for TanStack DevTools plugins
 * Supports both light and dark themes with consistent design tokens
 */

export type Theme = 'light' | 'dark';

// Color Palette - Dark Theme (VS Code inspired)
export const COLORS_DARK = {
  // Background colors
  background: {
    primary: '#1e1e1e',        // Main background
    secondary: '#252526',      // Elevated surfaces
    tertiary: '#2d2d30',       // Interactive elements
    elevated: '#3c3c3c',       // Borders and dividers
    selected: '#094771',       // Selected items
    hover: 'rgba(255, 255, 255, 0.1)', // Hover overlay
  },

  // Border colors
  border: {
    primary: '#3c3c3c',        // Main borders
    secondary: '#2d2d30',      // Secondary borders
    focus: '#3b82f6',          // Focus indicators (standardized blue)
  },

  // Text colors
  text: {
    primary: '#d4d4d4',        // Primary text
    secondary: '#969696',      // Secondary text
    muted: '#666666',          // Muted text
    heading: '#cccccc',        // Headings
    accent: '#9cdcfe',         // Accent text
    link: '#4fc1ff',           // Links
    filename: '#dcdcaa',       // File names
  },

  // Status colors
  status: {
    success: '#10b981',        // Success state (standardized)
    warning: '#fbbf24',        // Warning state (standardized)
    error: '#ef4444',          // Error state (standardized)
    info: '#3b82f6',           // Info state (standardized)
    fatal: '#dc2626',          // Fatal error (standardized)
    trace: '#6b7280',          // Trace level
    debug: '#9ca3af',          // Debug level
  },

  // Log level colors
  log: {
    trace: '#6b7280',
    debug: '#9ca3af',
    info: '#3b82f6',
    warn: '#fbbf24',
    error: '#ef4444',
    fatal: '#dc2626',
  },

  // Log background colors (transparent overlays)
  logBackground: {
    trace: 'transparent',
    debug: 'transparent',
    info: 'transparent',
    warn: 'rgba(251, 191, 36, 0.1)',
    error: 'rgba(239, 68, 68, 0.1)',
    fatal: 'rgba(220, 38, 38, 0.2)',
  },

  // Severity colors
  severity: {
    critical: '#ef4444',
    serious: '#fbbf24',
    moderate: '#eab308',
    minor: '#3b82f6',
  },

  // Chart and visualization colors
  chart: {
    grid: '#3c3c3c',
    axis: '#969696',
    tooltip: '#2d2d30',
  },
} as const;

// Color Palette - Light Theme (Modern, clean design)
export const COLORS_LIGHT = {
  // Background colors
  background: {
    primary: '#ffffff',        // Main background
    secondary: '#f8f9fa',      // Elevated surfaces
    tertiary: '#f3f4f6',       // Interactive elements
    elevated: '#e5e7eb',       // Borders and dividers
    selected: '#dbeafe',       // Selected items
    hover: 'rgba(0, 0, 0, 0.05)', // Hover overlay
  },

  // Border colors
  border: {
    primary: '#e5e7eb',        // Main borders
    secondary: '#d1d5db',      // Secondary borders
    focus: '#3b82f6',          // Focus indicators
  },

  // Text colors
  text: {
    primary: '#1f2937',        // Primary text
    secondary: '#6b7280',      // Secondary text
    muted: '#9ca3af',          // Muted text
    heading: '#111827',        // Headings
    accent: '#3b82f6',         // Accent text
    link: '#2563eb',           // Links
    filename: '#7c3aed',       // File names
  },

  // Status colors
  status: {
    success: '#10b981',        // Success state
    warning: '#fbbf24',        // Warning state
    error: '#ef4444',          // Error state
    info: '#3b82f6',           // Info state
    fatal: '#dc2626',          // Fatal error
    trace: '#6b7280',          // Trace level
    debug: '#9ca3af',          // Debug level
  },

  // Log level colors
  log: {
    trace: '#6b7280',
    debug: '#9ca3af',
    info: '#3b82f6',
    warn: '#f59e0b',
    error: '#ef4444',
    fatal: '#dc2626',
  },

  // Log background colors (transparent overlays)
  logBackground: {
    trace: 'transparent',
    debug: 'transparent',
    info: 'transparent',
    warn: 'rgba(251, 191, 36, 0.1)',
    error: 'rgba(239, 68, 68, 0.1)',
    fatal: 'rgba(220, 38, 38, 0.15)',
  },

  // Severity colors
  severity: {
    critical: '#dc2626',
    serious: '#f59e0b',
    moderate: '#eab308',
    minor: '#3b82f6',
  },

  // Chart and visualization colors
  chart: {
    grid: '#e5e7eb',
    axis: '#6b7280',
    tooltip: '#f8f9fa',
  },
} as const;

// Helper function to get colors based on theme
export const getColors = (theme: Theme = 'dark') => {
  return theme === 'dark' ? COLORS_DARK : COLORS_LIGHT;
};

// Default to dark theme for backward compatibility
export const COLORS = COLORS_DARK;

// Typography styles
export const TYPOGRAPHY = {
  // Font families
  fontFamily: {
    sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    mono: '"SF Mono", Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
  },

  // Font sizes (standardized across all plugins)
  fontSize: {
    xs: '10px',     // Extra small
    sm: '11px',     // Small
    base: '12px',   // Base (most common in plugins)
    md: '13px',     // Medium
    lg: '14px',     // Large
    xl: '16px',     // Extra large
    '2xl': '18px',  // 2X large
  },
  
  // Font weights
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  
  // Line heights
  lineHeight: {
    tight: '1.2',
    normal: '1.4',
    relaxed: '1.6',
  },
} as const;

// Spacing system
export const SPACING = {
  // Base spacing units (px)
  xs: '2px',
  sm: '4px',
  md: '6px',
  lg: '8px',
  xl: '10px',
  '2xl': '12px',
  '3xl': '16px',
  '4xl': '20px',
  '5xl': '24px',
  '6xl': '32px',
} as const;

// Border radius (standardized across all plugins)
export const RADIUS = {
  none: '0',
  sm: '2px',
  md: '4px',    // Most common in plugins
  lg: '6px',
  xl: '8px',
  full: '9999px',
} as const;

// Shadow styles
export const SHADOWS = {
  none: 'none',
  sm: '0 1px 2px rgba(0, 0, 0, 0.3)',
  md: '0 2px 4px rgba(0, 0, 0, 0.3)',
  lg: '0 4px 8px rgba(0, 0, 0, 0.3)',
  xl: '0 8px 16px rgba(0, 0, 0, 0.4)',
  tooltip: '0 2px 8px rgba(0, 0, 0, 0.3)',
} as const;

// Z-index scale
export const Z_INDEX = {
  base: 0,
  dropdown: 100,
  sticky: 200,
  modal: 300,
  popover: 400,
  tooltip: 500,
  overlay: 600,
} as const;

// Component Styles - Reusable style objects for common components
// Use getComponentStyles(theme) to get theme-aware styles

export const getComponentStyles = (theme: Theme = 'dark') => {
  const COLORS = getColors(theme);

  return {
    // Base container styles
    container: {
      base: {
        display: 'flex',
        flexDirection: 'column' as const,
        height: '100%',
        background: COLORS.background.primary,
        color: COLORS.text.primary,
        fontFamily: TYPOGRAPHY.fontFamily.sans,
        fontSize: TYPOGRAPHY.fontSize.base,
      } satisfies React.CSSProperties,

      panel: {
        background: COLORS.background.secondary,
        border: `1px solid ${COLORS.border.primary}`,
        borderRadius: RADIUS.md,
      } satisfies React.CSSProperties,
    },
  
  // Header styles
  header: {
    base: {
      padding: SPACING.lg,
      borderBottom: `1px solid ${COLORS.border.primary}`,
      display: 'flex',
      alignItems: 'center',
      gap: SPACING.xl,
      flexWrap: 'wrap' as const,
    } satisfies React.CSSProperties,
    
    title: {
      margin: 0,
      fontSize: TYPOGRAPHY.fontSize.lg,
      color: COLORS.text.heading,
      fontWeight: TYPOGRAPHY.fontWeight.semibold,
    } satisfies React.CSSProperties,
    
    subtitle: {
      margin: 0,
      fontSize: TYPOGRAPHY.fontSize.base,
      color: COLORS.text.secondary,
      fontWeight: TYPOGRAPHY.fontWeight.normal,
    } satisfies React.CSSProperties,
    
    controls: {
      display: 'flex',
      alignItems: 'center',
      gap: SPACING.md,
      marginLeft: 'auto',
    } satisfies React.CSSProperties,
  },
  
  // Button styles
  button: {
    base: {
      padding: `${SPACING.sm} ${SPACING.lg}`,
      background: COLORS.background.tertiary,
      border: `1px solid ${COLORS.border.primary}`,
      color: COLORS.text.primary,
      borderRadius: RADIUS.md,
      cursor: 'pointer',
      fontSize: TYPOGRAPHY.fontSize.base,
      fontFamily: TYPOGRAPHY.fontFamily.mono,
      transition: 'background-color 0.15s ease, border-color 0.15s ease',
      display: 'flex',
      alignItems: 'center',
      gap: SPACING.sm,
    } satisfies React.CSSProperties,
    
    primary: {
      background: COLORS.border.focus,
      borderColor: COLORS.border.focus,
      color: '#ffffff',
    } satisfies React.CSSProperties,
    
    success: {
      background: 'rgba(78, 201, 176, 0.1)',
      borderColor: COLORS.status.success,
      color: COLORS.status.success,
    } satisfies React.CSSProperties,
    
    warning: {
      background: 'rgba(243, 156, 18, 0.1)',
      borderColor: COLORS.status.warning,
      color: COLORS.status.warning,
    } satisfies React.CSSProperties,
    
    danger: {
      background: 'rgba(231, 76, 60, 0.1)',
      borderColor: COLORS.status.error,
      color: COLORS.status.error,
    } satisfies React.CSSProperties,
    
    small: {
      padding: `${SPACING.xs} ${SPACING.md}`,
      fontSize: TYPOGRAPHY.fontSize.sm,
    } satisfies React.CSSProperties,
    
    icon: {
      padding: SPACING.sm,
      minWidth: '32px',
      justifyContent: 'center' as const,
    } satisfies React.CSSProperties,
    
    // Button states
    hover: {
      background: COLORS.background.hover,
    } satisfies React.CSSProperties,
    
    active: {
      background: COLORS.background.selected,
      borderColor: COLORS.border.focus,
    } satisfies React.CSSProperties,
    
    disabled: {
      opacity: 0.5,
      cursor: 'not-allowed',
    } satisfies React.CSSProperties,
  },
  
  // Input styles
  input: {
    base: {
      padding: `${SPACING.sm} ${SPACING.lg}`,
      background: COLORS.background.secondary,
      border: `1px solid ${COLORS.border.primary}`,
      color: COLORS.text.primary,
      borderRadius: RADIUS.md,
      fontSize: TYPOGRAPHY.fontSize.base,
      fontFamily: TYPOGRAPHY.fontFamily.mono,
      outline: 'none',
    } satisfies React.CSSProperties,
    
    focus: {
      borderColor: COLORS.border.focus,
      boxShadow: `0 0 0 1px ${COLORS.border.focus}`,
    } satisfies React.CSSProperties,
    
    search: {
      flex: '1',
      minWidth: '150px',
    } satisfies React.CSSProperties,
  },
  
  // Tab styles
  tabs: {
    container: {
      display: 'flex',
      borderBottom: `1px solid ${COLORS.border.primary}`,
      overflowX: 'auto' as const,
    } satisfies React.CSSProperties,
    
    tab: {
      base: {
        display: 'flex',
        alignItems: 'center',
        gap: SPACING.sm,
        padding: `${SPACING.lg} ${SPACING['2xl']}`,
        fontSize: TYPOGRAPHY.fontSize.base,
        fontWeight: TYPOGRAPHY.fontWeight.medium,
        borderBottom: '2px solid transparent',
        transition: 'all 0.15s ease',
        cursor: 'pointer',
        whiteSpace: 'nowrap' as const,
        border: 'none',
        background: 'transparent',
        color: COLORS.text.secondary,
      } satisfies React.CSSProperties,
      
      active: {
        borderBottomColor: COLORS.border.focus,
        color: COLORS.text.accent,
      } satisfies React.CSSProperties,
      
      hover: {
        color: COLORS.text.primary,
      } satisfies React.CSSProperties,
    },
    
    badge: {
      base: {
        padding: `${SPACING.xs} ${SPACING.md}`,
        borderRadius: RADIUS.full,
        fontSize: TYPOGRAPHY.fontSize.xs,
        fontWeight: TYPOGRAPHY.fontWeight.medium,
        background: COLORS.background.tertiary,
        color: COLORS.text.secondary,
      } satisfies React.CSSProperties,
      
      critical: {
        background: 'rgba(231, 76, 60, 0.2)',
        color: COLORS.severity.critical,
      } satisfies React.CSSProperties,
      
      serious: {
        background: 'rgba(243, 156, 18, 0.2)',
        color: COLORS.severity.serious,
      } satisfies React.CSSProperties,
    },
  },
  
  // Status indicator styles
  status: {
    indicator: {
      width: SPACING.sm,
      height: SPACING.sm,
      borderRadius: RADIUS.full,
      display: 'inline-block',
    } satisfies React.CSSProperties,
    
    active: {
      backgroundColor: COLORS.status.success,
      animation: 'pulse 2s infinite',
    } satisfies React.CSSProperties,
    
    inactive: {
      backgroundColor: COLORS.text.muted,
    } satisfies React.CSSProperties,
    
    error: {
      backgroundColor: COLORS.status.error,
    } satisfies React.CSSProperties,
  },
  
  // Content area styles
  content: {
    base: {
      flex: 1,
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column' as const,
    } satisfies React.CSSProperties,
    
    scrollable: {
      flex: 1,
      overflowY: 'auto' as const,
      padding: SPACING.sm,
    } satisfies React.CSSProperties,
    
    split: {
      display: 'flex',
      flex: 1,
      overflow: 'hidden',
    } satisfies React.CSSProperties,
  },
  
  // Sidebar styles
  sidebar: {
    base: {
      background: COLORS.background.secondary,
      borderRight: `1px solid ${COLORS.border.primary}`,
      overflowY: 'auto' as const,
      padding: SPACING.lg,
      fontSize: TYPOGRAPHY.fontSize.sm,
    } satisfies React.CSSProperties,
    
    section: {
      marginBottom: SPACING['3xl'],
    } satisfies React.CSSProperties,
    
    sectionTitle: {
      margin: `0 0 ${SPACING.lg} 0`,
      color: COLORS.text.heading,
      fontSize: TYPOGRAPHY.fontSize.md,
      fontWeight: TYPOGRAPHY.fontWeight.medium,
    } satisfies React.CSSProperties,
    
    item: {
      base: {
        padding: `${SPACING.xs} ${SPACING.md}`,
        cursor: 'pointer',
        borderRadius: RADIUS.md,
        display: 'flex',
        justifyContent: 'space-between' as const,
        alignItems: 'center',
        gap: SPACING.sm,
        marginBottom: SPACING.xs,
        transition: 'background-color 0.15s ease',
      } satisfies React.CSSProperties,
      
      active: {
        backgroundColor: COLORS.border.focus,
        color: '#ffffff',
      } satisfies React.CSSProperties,
      
      hover: {
        backgroundColor: COLORS.background.hover,
      } satisfies React.CSSProperties,
    },
    
    resizer: {
      width: '4px',
      background: COLORS.border.primary,
      cursor: 'col-resize',
      borderLeft: `1px solid ${COLORS.background.tertiary}`,
      borderRight: `1px solid ${COLORS.background.tertiary}`,
      position: 'relative' as const,
    } satisfies React.CSSProperties,
  },
  
  // Metrics and stats styles
  metrics: {
    container: {
      padding: SPACING.lg,
      background: COLORS.background.secondary,
      borderBottom: `1px solid ${COLORS.border.primary}`,
      display: 'flex',
      gap: SPACING['4xl'],
      fontSize: TYPOGRAPHY.fontSize.sm,
      flexWrap: 'wrap' as const,
    } satisfies React.CSSProperties,
    
    item: {
      display: 'flex',
      alignItems: 'center',
      gap: SPACING.sm,
    } satisfies React.CSSProperties,
    
    label: {
      color: COLORS.text.secondary,
    } satisfies React.CSSProperties,
    
    value: {
      color: COLORS.status.success,
      fontWeight: TYPOGRAPHY.fontWeight.medium,
    } satisfies React.CSSProperties,
    
    chart: {
      container: {
        width: '100%',
        padding: `${SPACING.lg} 0 ${SPACING.sm} 0`,
        borderTop: `1px solid ${COLORS.border.primary}`,
        position: 'relative' as const,
      } satisfies React.CSSProperties,
      
      title: {
        color: COLORS.text.secondary,
        fontSize: TYPOGRAPHY.fontSize.xs,
        marginBottom: SPACING.sm,
        textAlign: 'center' as const,
      } satisfies React.CSSProperties,
    },
  },
  
  // List item styles
  list: {
    container: {
      flex: 1,
      overflowY: 'auto' as const,
      padding: SPACING.sm,
    } satisfies React.CSSProperties,
    
    item: {
      base: {
        padding: `${SPACING.sm} ${SPACING.lg}`,
        borderBottom: `1px solid ${COLORS.background.tertiary}`,
        cursor: 'pointer',
        fontSize: TYPOGRAPHY.fontSize.sm,
        transition: 'background-color 0.15s ease',
      } satisfies React.CSSProperties,
      
      selected: {
        background: COLORS.background.selected,
      } satisfies React.CSSProperties,
      
      hover: {
        background: COLORS.background.hover,
      } satisfies React.CSSProperties,
    },
    
    itemContent: {
      display: 'flex',
      gap: SPACING.lg,
      alignItems: 'baseline',
    } satisfies React.CSSProperties,
    
    timestamp: {
      color: COLORS.text.muted,
      fontSize: TYPOGRAPHY.fontSize.xs,
    } satisfies React.CSSProperties,
    
    level: {
      fontWeight: TYPOGRAPHY.fontWeight.medium,
      width: '45px',
    } satisfies React.CSSProperties,
    
    message: {
      flex: 1,
      wordBreak: 'break-word' as const,
    } satisfies React.CSSProperties,
  },
  
  // Detail panel styles
  detail: {
    container: {
      width: '300px',
      borderLeft: `1px solid ${COLORS.border.primary}`,
      padding: SPACING.xl,
      overflowY: 'auto' as const,
      background: COLORS.background.secondary,
    } satisfies React.CSSProperties,
    
    title: {
      margin: `0 0 ${SPACING.xl} 0`,
      color: COLORS.text.accent,
      fontSize: TYPOGRAPHY.fontSize.lg,
    } satisfies React.CSSProperties,
    
    section: {
      marginBottom: SPACING.xl,
    } satisfies React.CSSProperties,
    
    sectionTitle: {
      color: COLORS.text.secondary,
      marginBottom: SPACING.xs,
      fontSize: TYPOGRAPHY.fontSize.sm,
    } satisfies React.CSSProperties,
    
    code: {
      margin: 0,
      padding: SPACING.sm,
      background: COLORS.background.primary,
      borderRadius: RADIUS.md,
      fontSize: TYPOGRAPHY.fontSize.xs,
      overflow: 'auto',
      color: COLORS.text.primary,
      fontFamily: TYPOGRAPHY.fontFamily.mono,
    } satisfies React.CSSProperties,
  },
  
  // Tooltip styles
  tooltip: {
    base: {
      position: 'fixed' as const,
      background: COLORS.background.tertiary,
      border: `1px solid ${COLORS.border.primary}`,
      borderRadius: RADIUS.lg,
      padding: `${SPACING.md} ${SPACING.lg}`,
      fontSize: TYPOGRAPHY.fontSize.xs,
      color: COLORS.text.primary,
      boxShadow: SHADOWS.tooltip,
      zIndex: Z_INDEX.tooltip,
      pointerEvents: 'none' as const,
      whiteSpace: 'nowrap' as const,
    } satisfies React.CSSProperties,
  },
  
  // Loading and empty states
  empty: {
    container: {
      textAlign: 'center' as const,
      color: COLORS.text.muted,
      marginTop: SPACING['4xl'],
      padding: SPACING['4xl'],
    } satisfies React.CSSProperties,
    
    icon: {
      fontSize: TYPOGRAPHY.fontSize.xl,
      marginBottom: SPACING.lg,
    } satisfies React.CSSProperties,
    
    text: {
      fontSize: TYPOGRAPHY.fontSize.base,
    } satisfies React.CSSProperties,
  },
  
  // Tag styles
  tag: {
    base: {
      padding: `${SPACING.xs} ${SPACING.sm}`,
      marginRight: SPACING.sm,
      background: COLORS.background.tertiary,
      borderRadius: RADIUS.sm,
      fontSize: TYPOGRAPHY.fontSize.xs,
      color: COLORS.text.secondary,
      display: 'inline-block',
    } satisfies React.CSSProperties,
    
    info: {
      background: 'rgba(52, 152, 219, 0.2)',
      color: COLORS.status.info,
    } satisfies React.CSSProperties,
    
    success: {
      background: 'rgba(78, 201, 176, 0.2)',
      color: COLORS.status.success,
    } satisfies React.CSSProperties,
    
    warning: {
      background: 'rgba(243, 156, 18, 0.2)',
      color: COLORS.status.warning,
    } satisfies React.CSSProperties,
    
    error: {
      background: 'rgba(231, 76, 60, 0.2)',
      color: COLORS.status.error,
    } satisfies React.CSSProperties,
  },
  } as const;
};

// Default COMPONENT_STYLES for backward compatibility (uses dark theme)
export const COMPONENT_STYLES = getComponentStyles('dark');

// Animation keyframes (CSS-in-JS doesn't support @keyframes directly, but plugins can define these)
export const ANIMATIONS = {
  pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
  spin: 'spin 1s linear infinite',
  bounce: 'bounce 1s infinite',
} as const;

// Layout utilities
export const LAYOUT = {
  // Flexbox utilities
  flex: {
    center: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    } satisfies React.CSSProperties,
    
    between: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    } satisfies React.CSSProperties,
    
    column: {
      display: 'flex',
      flexDirection: 'column' as const,
    } satisfies React.CSSProperties,
    
    wrap: {
      flexWrap: 'wrap' as const,
    } satisfies React.CSSProperties,
  },
  
  // Grid utilities
  grid: {
    base: {
      display: 'grid',
    } satisfies React.CSSProperties,
    
    cols2: {
      gridTemplateColumns: 'repeat(2, 1fr)',
    } satisfies React.CSSProperties,
    
    cols3: {
      gridTemplateColumns: 'repeat(3, 1fr)',
    } satisfies React.CSSProperties,
  },
  
  // Position utilities
  position: {
    relative: {
      position: 'relative' as const,
    } satisfies React.CSSProperties,
    
    absolute: {
      position: 'absolute' as const,
    } satisfies React.CSSProperties,
    
    fixed: {
      position: 'fixed' as const,
    } satisfies React.CSSProperties,
  },
  
  // Size utilities
  size: {
    full: {
      width: '100%',
      height: '100%',
    } satisfies React.CSSProperties,
    
    fullWidth: {
      width: '100%',
    } satisfies React.CSSProperties,
    
    fullHeight: {
      height: '100%',
    } satisfies React.CSSProperties,
  },
} as const;

// Helper functions for merging styles
export const mergeStyles = (...styles: (React.CSSProperties | undefined)[]): React.CSSProperties => {
  return Object.assign({}, ...styles.filter(Boolean));
};

// Helper to create responsive sidebar width with constraints
export const createSidebarResizer = (
  currentWidth: number,
  onWidthChange: (width: number) => void,
  minWidth = 200,
  maxWidth = 600
) => ({
  onMouseDown: (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = currentWidth;

    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = Math.max(minWidth, Math.min(maxWidth, startWidth + (e.clientX - startX)));
      onWidthChange(newWidth);
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  },
});

export default {
  // Theme-aware exports
  getColors,
  getComponentStyles,

  // Default (dark theme) exports for backward compatibility
  COLORS,
  COLORS_DARK,
  COLORS_LIGHT,
  TYPOGRAPHY,
  SPACING,
  RADIUS,
  SHADOWS,
  Z_INDEX,
  COMPONENT_STYLES,
  ANIMATIONS,
  LAYOUT,

  // Utilities
  mergeStyles,
  createSidebarResizer,
};