import React, { useState } from 'react'
import { useErrorBoundaryDevTools } from '../core/store'
import type { ErrorRecoveryStrategy } from '../types'

export const RecoveryStrategyEditor: React.FC = () => {
  const { 
    recoveryStrategies, 
    errorBoundaries,
    addRecoveryStrategy, 
    removeRecoveryStrategy, 
    applyRecoveryStrategy,
    config 
  } = useErrorBoundaryDevTools()
  
  const [isCreating, setIsCreating] = useState(false)
  const [_editingStrategy, setEditingStrategy] = useState<ErrorRecoveryStrategy | null>(null)
  const [newStrategy, setNewStrategy] = useState<Partial<ErrorRecoveryStrategy>>({
    name: '',
    description: '',
    retryDelay: 1000,
    maxRetries: 3,
  })

  const theme = config.theme === 'auto' 
    ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : config.theme

  const predefinedStrategies: Partial<ErrorRecoveryStrategy>[] = [
    {
      name: 'Simple Retry',
      description: 'Retry the failed operation with exponential backoff',
      retryDelay: 1000,
      maxRetries: 3,
    },
    {
      name: 'Graceful Degradation',
      description: 'Show a simplified version of the component',
      retryDelay: 0,
      maxRetries: 0,
    },
    {
      name: 'Reload Page',
      description: 'Reload the entire page after a critical error',
      retryDelay: 2000,
      maxRetries: 1,
    },
    {
      name: 'Redirect to Safe State',
      description: 'Redirect user to a safe page or state',
      retryDelay: 0,
      maxRetries: 0,
    },
    {
      name: 'Show Error Boundary',
      description: 'Display a user-friendly error message with retry option',
      retryDelay: 500,
      maxRetries: 2,
    },
  ]

  const fallbackTemplates = {
    simple: `function SimpleFallback({ error, resetErrorBoundary }) {
  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h3>Something went wrong</h3>
      <p>We're sorry, but something unexpected happened.</p>
      <button onClick={resetErrorBoundary}>
        Try again
      </button>
    </div>
  )
}`,
    detailed: `function DetailedFallback({ error, resetErrorBoundary }) {
  const [showDetails, setShowDetails] = useState(false)
  
  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '4px' }}>
      <h3>Error Occurred</h3>
      <p>An error occurred while rendering this component.</p>
      
      <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
        <button onClick={resetErrorBoundary}>
          Retry
        </button>
        <button onClick={() => setShowDetails(!showDetails)}>
          {showDetails ? 'Hide' : 'Show'} Details
        </button>
      </div>
      
      {showDetails && (
        <details style={{ marginTop: '16px', fontSize: '12px' }}>
          <summary>Error Details</summary>
          <pre style={{ whiteSpace: 'pre-wrap', marginTop: '8px' }}>
            {error?.message}
            {error?.stack}
          </pre>
        </details>
      )}
    </div>
  )
}`,
    minimal: `function MinimalFallback() {
  return <div>⚠️ Error occurred</div>
}`
  }

  const handleCreateStrategy = () => {
    if (!newStrategy.name || !newStrategy.description) return

    const strategy: ErrorRecoveryStrategy = {
      id: `strategy-${Date.now()}`,
      name: newStrategy.name,
      description: newStrategy.description,
      retryDelay: newStrategy.retryDelay || 1000,
      maxRetries: newStrategy.maxRetries || 0,
      onError: newStrategy.onError,
      onReset: newStrategy.onReset,
    }

    addRecoveryStrategy(strategy)
    setNewStrategy({
      name: '',
      description: '',
      retryDelay: 1000,
      maxRetries: 3,
    })
    setIsCreating(false)
  }

  const handleLoadTemplate = (template: Partial<ErrorRecoveryStrategy>) => {
    setNewStrategy(template)
    setIsCreating(true)
  }

  const handleApplyStrategy = (boundaryId: string, strategyId: string) => {
    applyRecoveryStrategy(boundaryId, strategyId)
  }

  const containerStyles: React.CSSProperties = {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  }

  const headerStyles: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  }

  const buttonStyles: React.CSSProperties = {
    padding: '8px 16px',
    border: 'none',
    borderRadius: '4px',
    backgroundColor: theme === 'dark' ? '#007acc' : '#007acc',
    color: '#ffffff',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  }

  const secondaryButtonStyles: React.CSSProperties = {
    ...buttonStyles,
    backgroundColor: 'transparent',
    color: theme === 'dark' ? '#ffffff' : '#333333',
    border: `1px solid ${theme === 'dark' ? '#444' : '#ccc'}`,
  }

  const inputStyles: React.CSSProperties = {
    padding: '8px 12px',
    border: `1px solid ${theme === 'dark' ? '#444' : '#ccc'}`,
    borderRadius: '4px',
    backgroundColor: theme === 'dark' ? '#2d2d2d' : '#ffffff',
    color: theme === 'dark' ? '#ffffff' : '#333333',
    fontSize: '14px',
    width: '100%',
  }

  const textareaStyles: React.CSSProperties = {
    ...inputStyles,
    minHeight: '80px',
    resize: 'vertical',
    fontFamily: 'monaco, consolas, monospace',
    fontSize: '13px',
  }

  const cardStyles: React.CSSProperties = {
    padding: '16px',
    backgroundColor: theme === 'dark' ? '#252525' : '#f8f9fa',
    border: `1px solid ${theme === 'dark' ? '#444' : '#ccc'}`,
    borderRadius: '6px',
    marginBottom: '12px',
  }

  const formStyles: React.CSSProperties = {
    ...cardStyles,
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  }

  const gridStyles: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '12px',
  }

  const templateCardStyles: React.CSSProperties = {
    ...cardStyles,
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  }

  const strategyItemStyles: React.CSSProperties = {
    ...cardStyles,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  }

  const sectionStyles: React.CSSProperties = {
    marginBottom: '24px',
  }

  return (
    <div style={containerStyles}>
      <div style={headerStyles}>
        <h3 style={{ margin: 0, color: theme === 'dark' ? '#ffffff' : '#333333' }}>
          Recovery Strategy Editor
        </h3>
        <button
          style={buttonStyles}
          onClick={() => setIsCreating(!isCreating)}
        >
          {isCreating ? 'Cancel' : 'Create Strategy'}
        </button>
      </div>

      {isCreating && (
        <div style={formStyles}>
          <h4 style={{ margin: '0 0 8px 0', color: theme === 'dark' ? '#ffffff' : '#333333' }}>
            Create Recovery Strategy
          </h4>
          
          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: 'bold' }}>
              Strategy Name
            </label>
            <input
              type="text"
              value={newStrategy.name || ''}
              onChange={(e) => setNewStrategy({ ...newStrategy, name: e.target.value })}
              placeholder="Enter strategy name..."
              style={inputStyles}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: 'bold' }}>
              Description
            </label>
            <textarea
              value={newStrategy.description || ''}
              onChange={(e) => setNewStrategy({ ...newStrategy, description: e.target.value })}
              placeholder="Describe the recovery strategy..."
              style={textareaStyles}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: 'bold' }}>
                Retry Delay (ms)
              </label>
              <input
                type="number"
                value={newStrategy.retryDelay || 1000}
                onChange={(e) => setNewStrategy({ ...newStrategy, retryDelay: parseInt(e.target.value) })}
                style={inputStyles}
                min={0}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: 'bold' }}>
                Max Retries
              </label>
              <input
                type="number"
                value={newStrategy.maxRetries || 0}
                onChange={(e) => setNewStrategy({ ...newStrategy, maxRetries: parseInt(e.target.value) })}
                style={inputStyles}
                min={0}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: 'bold' }}>
              Fallback Component Template
            </label>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              {Object.entries(fallbackTemplates).map(([key, template]) => (
                <button
                  key={key}
                  style={secondaryButtonStyles}
                  onClick={() => {
                    navigator.clipboard.writeText(template)
                  }}
                >
                  Copy {key.charAt(0).toUpperCase() + key.slice(1)}
                </button>
              ))}
            </div>
            <textarea
              value={fallbackTemplates.simple}
              readOnly
              style={{
                ...textareaStyles,
                minHeight: '120px',
                backgroundColor: theme === 'dark' ? '#1a1a1a' : '#f9f9f9',
                color: theme === 'dark' ? '#ccc' : '#666',
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button style={secondaryButtonStyles} onClick={() => setIsCreating(false)}>
              Cancel
            </button>
            <button style={buttonStyles} onClick={handleCreateStrategy}>
              Create Strategy
            </button>
          </div>
        </div>
      )}

      <div style={sectionStyles}>
        <h4 style={{ margin: '0 0 12px 0', color: theme === 'dark' ? '#ffffff' : '#333333' }}>
          Predefined Templates
        </h4>
        <div style={gridStyles}>
          {predefinedStrategies.map((template, index) => (
            <div
              key={index}
              style={templateCardStyles}
              onClick={() => handleLoadTemplate(template)}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = theme === 'dark' ? '#2d2d2d' : '#f0f0f0'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = theme === 'dark' ? '#252525' : '#f8f9fa'
              }}
            >
              <div>
                <h5 style={{ margin: '0 0 8px 0', color: theme === 'dark' ? '#ffffff' : '#333333' }}>
                  {template.name}
                </h5>
                <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: theme === 'dark' ? '#ccc' : '#666' }}>
                  {template.description}
                </p>
                <div style={{ fontSize: '12px', color: theme === 'dark' ? '#999' : '#777' }}>
                  <div>Delay: {template.retryDelay}ms</div>
                  <div>Max Retries: {template.maxRetries}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={sectionStyles}>
        <h4 style={{ margin: '0 0 12px 0', color: theme === 'dark' ? '#ffffff' : '#333333' }}>
          Custom Strategies ({(Array.from(recoveryStrategies.values()) as ErrorRecoveryStrategy[]).length})
        </h4>
        {(Array.from(recoveryStrategies.values()) as ErrorRecoveryStrategy[]).length === 0 ? (
          <div style={{
            ...cardStyles,
            textAlign: 'center',
            color: theme === 'dark' ? '#999' : '#666'
          }}>
            No custom strategies created yet. Create a new strategy or use a predefined template.
          </div>
        ) : (
          (Array.from(recoveryStrategies.values()) as ErrorRecoveryStrategy[]).map((strategy) => (
            <div key={strategy.id} style={strategyItemStyles}>
              <div style={{ flex: 1 }}>
                <h5 style={{ margin: '0 0 8px 0', color: theme === 'dark' ? '#ffffff' : '#333333' }}>
                  {strategy.name}
                </h5>
                <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: theme === 'dark' ? '#ccc' : '#666' }}>
                  {strategy.description}
                </p>
                <div style={{ fontSize: '12px', color: theme === 'dark' ? '#999' : '#777' }}>
                  <div>Retry Delay: {strategy.retryDelay ?? 0}ms</div>
                  <div>Max Retries: {strategy.maxRetries ?? 0}</div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button
                  style={buttonStyles}
                  onClick={() => setEditingStrategy(strategy)}
                >
                  Edit
                </button>
                <button
                  style={secondaryButtonStyles}
                  onClick={() => removeRecoveryStrategy(strategy.id)}
                >
                  Remove
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div style={sectionStyles}>
        <h4 style={{ margin: '0 0 12px 0', color: theme === 'dark' ? '#ffffff' : '#333333' }}>
          Apply to Error Boundaries
        </h4>
        {errorBoundaries.size === 0 ? (
          <div style={{ 
            ...cardStyles, 
            textAlign: 'center', 
            color: theme === 'dark' ? '#999' : '#666' 
          }}>
            No error boundaries registered yet.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {(Array.from(errorBoundaries.values()) as import('../types').ErrorBoundaryInfo[]).map((boundary) => (
              <div key={boundary.id} style={cardStyles}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h5 style={{ margin: '0 0 4px 0', color: theme === 'dark' ? '#ffffff' : '#333333' }}>
                      {boundary.componentName}
                    </h5>
                    <div style={{ fontSize: '12px', color: theme === 'dark' ? '#999' : '#777' }}>
                      Errors: {boundary.errorCount} | Coverage: {boundary.coverage.toFixed(1)}%
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <select
                      style={{
                        ...inputStyles,
                        width: 'auto',
                        fontSize: '12px',
                        padding: '4px 8px',
                      }}
                      onChange={(e) => {
                        if (e.target.value) {
                          handleApplyStrategy(boundary.id, e.target.value)
                          e.target.value = ''
                        }
                      }}
                      defaultValue=""
                    >
                      <option value="">Select Strategy...</option>
                      {(Array.from(recoveryStrategies.values()) as ErrorRecoveryStrategy[]).map(strategy => (
                        <option key={strategy.id} value={strategy.id}>
                          {strategy.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}