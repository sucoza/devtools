import React, { useState } from 'react'

export function ErrorTriggers() {
  const [throwError, setThrowError] = useState<string | null>(null)

  // Trigger different types of errors
  if (throwError === 'render') {
    throw new Error('Render Error: Component failed to render properly')
  }

  const triggerAsyncError = async () => {
    await new Promise(resolve => setTimeout(resolve, 100))
    throw new Error('Async Error: Failed to fetch user data')
  }

  const triggerEventError = () => {
    throw new Error('Event Handler Error: Click handler crashed')
  }

  const triggerNetworkError = async () => {
    try {
      const response = await fetch('https://invalid-url-that-does-not-exist.com/api/data')
      if (!response.ok) {
        throw new Error(`Network Error: HTTP ${response.status}`)
      }
    } catch (error) {
      throw new Error('Network Error: Failed to connect to server')
    }
  }

  const triggerTypeError = () => {
    const obj: any = null
    // This will throw a TypeError
    obj.someMethod()
  }

  const triggerReferenceError = () => {
    // @ts-ignore - Intentional error for demo
    undefinedVariable.doSomething()
  }

  return (
    <div style={{
      background: 'white',
      borderRadius: '12px',
      padding: '20px',
      marginTop: '20px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
    }}>
      <h2 style={{
        fontSize: '20px',
        marginBottom: '15px',
        color: '#2d3748',
      }}>
        Error Triggers - Test the DevTools
      </h2>
      
      <p style={{
        color: '#718096',
        marginBottom: '20px',
        fontSize: '14px',
      }}>
        Click buttons below to trigger different types of errors and see them in the DevTools panel
      </p>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '10px',
      }}>
        <button
          onClick={() => setThrowError('render')}
          style={{
            padding: '10px 15px',
            background: '#e53e3e',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: '500',
            transition: 'transform 0.2s',
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          🔥 Render Error
        </button>

        <button
          onClick={triggerAsyncError}
          style={{
            padding: '10px 15px',
            background: '#dd6b20',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: '500',
            transition: 'transform 0.2s',
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          ⏱️ Async Error
        </button>

        <button
          onClick={triggerEventError}
          style={{
            padding: '10px 15px',
            background: '#d69e2e',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: '500',
            transition: 'transform 0.2s',
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          🖱️ Event Error
        </button>

        <button
          onClick={triggerNetworkError}
          style={{
            padding: '10px 15px',
            background: '#38a169',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: '500',
            transition: 'transform 0.2s',
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          🌐 Network Error
        </button>

        <button
          onClick={triggerTypeError}
          style={{
            padding: '10px 15px',
            background: '#3182ce',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: '500',
            transition: 'transform 0.2s',
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          ❌ Type Error
        </button>

        <button
          onClick={triggerReferenceError}
          style={{
            padding: '10px 15px',
            background: '#805ad5',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: '500',
            transition: 'transform 0.2s',
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          ⚠️ Reference Error
        </button>
      </div>

      <div style={{
        marginTop: '20px',
        padding: '15px',
        background: '#f7fafc',
        borderRadius: '8px',
        border: '1px solid #e2e8f0',
      }}>
        <p style={{
          fontSize: '13px',
          color: '#4a5568',
          marginBottom: '10px',
        }}>
          <strong>💡 Tips:</strong>
        </p>
        <ul style={{
          fontSize: '12px',
          color: '#718096',
          marginLeft: '20px',
          lineHeight: '1.6',
        }}>
          <li>Errors will be caught by the nearest error boundary</li>
          <li>Check the DevTools panel to see error details and stack traces</li>
          <li>Use the "Reset" buttons in fallback UI to recover from errors</li>
          <li>The component tree view shows which components have error boundaries</li>
        </ul>
      </div>
    </div>
  )
}