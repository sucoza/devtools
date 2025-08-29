import React from 'react';

export interface InputProps {
  label: string;
  type?: 'text' | 'email' | 'password' | 'number';
  placeholder?: string;
  value?: string;
  error?: string;
  disabled?: boolean;
  onChange?: (value: string) => void;
}

export function Input({ 
  label, 
  type = 'text', 
  placeholder, 
  value, 
  error, 
  disabled = false, 
  onChange 
}: InputProps) {
  const labelStyles: React.CSSProperties = {
    display: 'block',
    fontSize: 'var(--font-size-sm)',
    fontWeight: 'var(--font-weight-medium)',
    color: 'var(--color-neutral-900)',
    marginBottom: 'var(--spacing-2)',
  };

  const inputStyles: React.CSSProperties = {
    width: '100%',
    padding: 'var(--spacing-3)',
    fontSize: 'var(--font-size-base)',
    fontFamily: 'var(--font-family-sans)',
    backgroundColor: disabled ? 'var(--color-neutral-50)' : 'white',
    border: `var(--border-width) solid ${error ? 'var(--color-error)' : 'var(--color-neutral-100)'}`,
    borderRadius: 'var(--border-radius)',
    boxShadow: 'var(--shadow-sm)',
    transition: 'all 0.2s ease',
    outline: 'none',
  };

  const errorStyles: React.CSSProperties = {
    fontSize: 'var(--font-size-xs)',
    color: 'var(--color-error)',
    marginTop: 'var(--spacing-1)',
  };

  return (
    <div data-component="Input">
      <label style={labelStyles}>
        {label}
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange?.(e.target.value)}
          style={inputStyles}
          onFocus={(e) => {
            e.target.style.borderColor = error ? 'var(--color-error)' : 'var(--color-primary)';
            e.target.style.boxShadow = error 
              ? '0 0 0 3px rgba(239, 68, 68, 0.1)' 
              : '0 0 0 3px rgba(59, 130, 246, 0.1)';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = error ? 'var(--color-error)' : 'var(--color-neutral-100)';
            e.target.style.boxShadow = 'var(--shadow-sm)';
          }}
        />
      </label>
      {error && (
        <div style={errorStyles}>
          {error}
        </div>
      )}
    </div>
  );
}