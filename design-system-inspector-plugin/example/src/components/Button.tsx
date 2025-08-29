import React from 'react';
import { clsx } from 'clsx';

export interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  onClick?: () => void;
}

export function Button({ 
  children, 
  variant = 'primary', 
  size = 'medium', 
  disabled = false, 
  onClick 
}: ButtonProps) {
  const baseStyles: React.CSSProperties = {
    fontFamily: 'var(--font-family-sans)',
    fontWeight: 'var(--font-weight-medium)',
    borderRadius: 'var(--border-radius)',
    border: '1px solid transparent',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.6 : 1,
    transition: 'all 0.2s ease',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  const sizeStyles: Record<string, React.CSSProperties> = {
    small: {
      fontSize: 'var(--font-size-xs)',
      padding: 'var(--spacing-2) var(--spacing-3)',
    },
    medium: {
      fontSize: 'var(--font-size-sm)',
      padding: 'var(--spacing-3) var(--spacing-4)',
    },
    large: {
      fontSize: 'var(--font-size-base)',
      padding: 'var(--spacing-4) var(--spacing-6)',
    },
  };

  const variantStyles: Record<string, React.CSSProperties> = {
    primary: {
      backgroundColor: 'var(--color-primary)',
      color: 'white',
      borderColor: 'var(--color-primary)',
    },
    secondary: {
      backgroundColor: 'var(--color-secondary)',
      color: 'white',
      borderColor: 'var(--color-secondary)',
    },
    success: {
      backgroundColor: 'var(--color-success)',
      color: 'white',
      borderColor: 'var(--color-success)',
    },
    warning: {
      backgroundColor: 'var(--color-warning)',
      color: 'white',
      borderColor: 'var(--color-warning)',
    },
    error: {
      backgroundColor: 'var(--color-error)',
      color: 'white',
      borderColor: 'var(--color-error)',
    },
  };

  return (
    <button
      style={{
        ...baseStyles,
        ...sizeStyles[size],
        ...variantStyles[variant],
      }}
      disabled={disabled}
      onClick={onClick}
      data-component="Button"
      data-variant={variant}
      data-size={size}
    >
      {children}
    </button>
  );
}