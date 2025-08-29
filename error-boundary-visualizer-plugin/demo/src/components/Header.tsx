import React from 'react'

interface HeaderProps {
  theme: 'light' | 'dark'
  onThemeToggle: () => void
}

export function Header({ theme, onThemeToggle }: HeaderProps) {
  return (
    <header style={{
      background: 'rgba(255, 255, 255, 0.95)',
      borderRadius: '12px',
      padding: '20px 30px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
    }}>
      <div>
        <h1 style={{
          fontSize: '28px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          margin: 0,
        }}>
          Error Boundary Visualizer
        </h1>
        <p style={{
          color: '#718096',
          marginTop: '5px',
          fontSize: '14px',
        }}>
          Interactive Demo Application
        </p>
      </div>
      
      <div style={{ display: 'flex', gap: '15px' }}>
        <button
          onClick={onThemeToggle}
          style={{
            padding: '10px 20px',
            background: theme === 'dark' ? '#2d3748' : '#edf2f7',
            color: theme === 'dark' ? 'white' : '#2d3748',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            transition: 'all 0.2s',
          }}
        >
          {theme === 'dark' ? '🌙' : '☀️'} {theme === 'dark' ? 'Dark' : 'Light'}
        </button>
        
        <button
          style={{
            padding: '10px 20px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
          }}
        >
          Documentation
        </button>
      </div>
    </header>
  )
}