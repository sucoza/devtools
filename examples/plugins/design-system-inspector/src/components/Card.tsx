import React from 'react';

export interface CardProps {
  children: React.ReactNode;
  title?: string;
  variant?: 'default' | 'elevated' | 'interactive';
}

export function Card({ children, title, variant = 'default' }: CardProps) {
  const baseStyles: React.CSSProperties = {
    backgroundColor: 'white',
    borderRadius: 'var(--border-radius-lg)',
    border: '1px solid var(--color-neutral-100)',
    padding: 'var(--spacing-6)',
    transition: 'all 0.2s ease',
  };

  const variantStyles: Record<string, React.CSSProperties> = {
    default: {
      boxShadow: 'var(--shadow-sm)',
    },
    elevated: {
      boxShadow: 'var(--shadow-lg)',
      borderColor: 'var(--color-neutral-100)',
    },
    interactive: {
      boxShadow: 'var(--shadow)',
      cursor: 'pointer',
    },
  };

  const hoverStyles: React.CSSProperties = variant === 'interactive' ? {
    transform: 'translateY(-2px)',
    boxShadow: 'var(--shadow-lg)',
  } : {};

  return (
    <div
      style={{
        ...baseStyles,
        ...variantStyles[variant],
      }}
      onMouseEnter={(e) => {
        if (variant === 'interactive') {
          Object.assign(e.currentTarget.style, hoverStyles);
        }
      }}
      onMouseLeave={(e) => {
        if (variant === 'interactive') {
          Object.assign(e.currentTarget.style, {
            transform: 'none',
            boxShadow: 'var(--shadow)',
          });
        }
      }}
      data-component="Card"
      data-variant={variant}
    >
      {title && (
        <h4 style={{
          fontSize: 'var(--font-size-lg)',
          fontWeight: 'var(--font-weight-semibold)',
          color: 'var(--color-neutral-900)',
          margin: '0 0 var(--spacing-4) 0',
        }}>
          {title}
        </h4>
      )}
      {children}
    </div>
  );
}