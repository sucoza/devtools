import React from 'react';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error';
}

export function Badge({ children, variant = 'default' }: BadgeProps) {
  const baseStyles: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    padding: 'var(--spacing-1) var(--spacing-3)',
    fontSize: 'var(--font-size-xs)',
    fontWeight: 'var(--font-weight-medium)',
    borderRadius: 'var(--border-radius)',
    textTransform: 'uppercase',
    letterSpacing: '0.025em',
  };

  const variantStyles: Record<string, React.CSSProperties> = {
    default: {
      backgroundColor: 'var(--color-neutral-100)',
      color: 'var(--color-neutral-900)',
    },
    primary: {
      backgroundColor: 'var(--color-primary)',
      color: 'white',
    },
    success: {
      backgroundColor: 'var(--color-success)',
      color: 'white',
    },
    warning: {
      backgroundColor: 'var(--color-warning)',
      color: 'white',
    },
    error: {
      backgroundColor: 'var(--color-error)',
      color: 'white',
    },
  };

  return (
    <span
      style={{
        ...baseStyles,
        ...variantStyles[variant],
      }}
      data-component="Badge"
      data-variant={variant}
    >
      {children}
    </span>
  );
}