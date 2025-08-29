import React from 'react';

export interface AlertBoxProps {
  children: React.ReactNode;
  title: string;
  variant?: 'info' | 'success' | 'warning' | 'error';
}

export function AlertBox({ children, title, variant = 'info' }: AlertBoxProps) {
  const baseStyles: React.CSSProperties = {
    padding: 'var(--spacing-4)',
    borderRadius: 'var(--border-radius)',
    border: '1px solid',
  };

  const variantStyles: Record<string, React.CSSProperties> = {
    info: {
      backgroundColor: '#EBF8FF',
      borderColor: '#3B82F6',
      color: '#1E3A8A',
    },
    success: {
      backgroundColor: '#F0FDF4',
      borderColor: 'var(--color-success)',
      color: '#14532D',
    },
    warning: {
      backgroundColor: '#FFFBEB',
      borderColor: 'var(--color-warning)',
      color: '#92400E',
    },
    error: {
      backgroundColor: '#FEF2F2',
      borderColor: 'var(--color-error)',
      color: '#991B1B',
    },
  };

  const titleStyles: React.CSSProperties = {
    fontSize: 'var(--font-size-sm)',
    fontWeight: 'var(--font-weight-semibold)',
    margin: '0 0 var(--spacing-2) 0',
  };

  const contentStyles: React.CSSProperties = {
    fontSize: 'var(--font-size-sm)',
    margin: 0,
    lineHeight: 1.5,
  };

  return (
    <div
      style={{
        ...baseStyles,
        ...variantStyles[variant],
      }}
      data-component="AlertBox"
      data-variant={variant}
    >
      <h4 style={titleStyles}>{title}</h4>
      <div style={contentStyles}>{children}</div>
    </div>
  );
}