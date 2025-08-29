import React, { useState } from 'react'
import { ErrorBoundaryDevTools, ErrorBoundaryWrapper } from '@tanstack/error-boundary-visualizer-plugin'
import { Header } from './components/Header'
import { Dashboard } from './components/Dashboard'
import { UserProfile } from './components/UserProfile'
import { DataTable } from './components/DataTable'
import { AsyncDataLoader } from './components/AsyncDataLoader'
import { FormWithValidation } from './components/FormWithValidation'
import { ErrorTriggers } from './components/ErrorTriggers'

function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light')

  return (
    <>
      {/* Error Boundary DevTools - Floating panel */}
      <ErrorBoundaryDevTools />
      
      <div style={{
        minHeight: '100vh',
        background: theme === 'dark' 
          ? 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)'
          : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '20px',
        transition: 'background 0.3s ease',
      }}>
        {/* Main App with multiple error boundaries */}
        <ErrorBoundaryWrapper
          boundaryName="App"
          level="page"
          fallback={({ error, resetErrorBoundary }) => (
            <div style={{
              background: 'white',
              borderRadius: '12px',
              padding: '40px',
              maxWidth: '600px',
              margin: '100px auto',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
              textAlign: 'center',
            }}>
              <h1 style={{ color: '#e53e3e', marginBottom: '20px' }}>
                Application Error
              </h1>
              <p style={{ color: '#718096', marginBottom: '20px' }}>
                {error.message}
              </p>
              <button
                onClick={resetErrorBoundary}
                style={{
                  background: '#667eea',
                  color: 'white',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  fontSize: '16px',
                  cursor: 'pointer',
                }}
              >
                Reset Application
              </button>
            </div>
          )}
        >
          <div style={{
            maxWidth: '1400px',
            margin: '0 auto',
          }}>
            {/* Header Section */}
            <ErrorBoundaryWrapper boundaryName="Header" level="section">
              <Header theme={theme} onThemeToggle={() => setTheme(t => t === 'light' ? 'dark' : 'light')} />
            </ErrorBoundaryWrapper>

            {/* Error Trigger Controls */}
            <ErrorBoundaryWrapper 
              boundaryName="ErrorTriggers" 
              level="section"
              fallback={({ resetErrorBoundary }) => (
                <div style={{
                  background: '#fed7d7',
                  padding: '20px',
                  borderRadius: '8px',
                  marginBottom: '20px',
                }}>
                  <p>Error triggers failed to load.</p>
                  <button onClick={resetErrorBoundary}>Retry</button>
                </div>
              )}
            >
              <ErrorTriggers />
            </ErrorBoundaryWrapper>

            {/* Main Dashboard Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
              gap: '20px',
              marginTop: '20px',
            }}>
              {/* Dashboard Widget */}
              <ErrorBoundaryWrapper
                boundaryName="Dashboard"
                level="component"
                fallback={({ error, resetErrorBoundary }) => (
                  <div style={{
                    background: '#fff5f5',
                    border: '2px solid #feb2b2',
                    padding: '20px',
                    borderRadius: '8px',
                  }}>
                    <h3 style={{ color: '#c53030' }}>Dashboard Error</h3>
                    <p style={{ color: '#742a2a' }}>{error.message}</p>
                    <button
                      onClick={resetErrorBoundary}
                      style={{
                        marginTop: '10px',
                        padding: '8px 16px',
                        background: '#e53e3e',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                      }}
                    >
                      Reload Dashboard
                    </button>
                  </div>
                )}
              >
                <Dashboard />
              </ErrorBoundaryWrapper>

              {/* User Profile Widget */}
              <ErrorBoundaryWrapper
                boundaryName="UserProfile"
                level="component"
              >
                <UserProfile />
              </ErrorBoundaryWrapper>

              {/* Data Table Widget */}
              <ErrorBoundaryWrapper
                boundaryName="DataTable"
                level="component"
                fallback={({ error, resetErrorBoundary }) => (
                  <div style={{
                    background: '#fffaf0',
                    border: '2px solid #feb2b2',
                    padding: '20px',
                    borderRadius: '8px',
                  }}>
                    <h3 style={{ color: '#c05621' }}>Table Error</h3>
                    <p>{error.message}</p>
                    <button onClick={resetErrorBoundary}>Retry</button>
                  </div>
                )}
              >
                <DataTable />
              </ErrorBoundaryWrapper>

              {/* Async Data Loader */}
              <ErrorBoundaryWrapper
                boundaryName="AsyncDataLoader"
                level="component"
              >
                <AsyncDataLoader />
              </ErrorBoundaryWrapper>

              {/* Form with Validation */}
              <ErrorBoundaryWrapper
                boundaryName="FormWithValidation"
                level="component"
              >
                <FormWithValidation />
              </ErrorBoundaryWrapper>
            </div>

            {/* Footer */}
            <div style={{
              marginTop: '40px',
              padding: '20px',
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              textAlign: 'center',
              color: 'white',
            }}>
              <p>Error Boundary Visualizer Demo</p>
              <p style={{ fontSize: '14px', marginTop: '10px', opacity: 0.8 }}>
                Open the DevTools panel to see error boundaries in action
              </p>
            </div>
          </div>
        </ErrorBoundaryWrapper>
      </div>
    </>
  )
}

export default App