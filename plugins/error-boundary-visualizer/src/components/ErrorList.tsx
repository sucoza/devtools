import React, { useState, useMemo } from 'react'
import { useErrorBoundaryDevTools } from '../core/store'
import type { ErrorInfo } from '../types'
import { ErrorCategory, ErrorSeverity } from '../types'

export const ErrorList: React.FC = () => {
  const { 
    errors, 
    selectedError, 
    selectError, 
    clearErrors, 
    config
  } = useErrorBoundaryDevTools()
  
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<ErrorCategory | 'all'>('all')
  const [severityFilter, setSeverityFilter] = useState<ErrorSeverity | 'all'>('all')

  const theme = config.theme === 'auto' 
    ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : config.theme

  const filteredErrors = useMemo(() => {
    return errors.filter((error) => {
      const matchesSearch = !searchQuery || 
        error.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (error.componentStack?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
      
      const matchesCategory = categoryFilter === 'all' || error.category === categoryFilter
      const matchesSeverity = severityFilter === 'all' || error.severity === severityFilter
      
      return matchesSearch && matchesCategory && matchesSeverity
    })
  }, [errors, searchQuery, categoryFilter, severityFilter])

  const getSeverityColor = (severity: ErrorSeverity) => {
    const colors = {
      low: '#4caf50',
      medium: '#ff9800', 
      high: '#ff5722',
      critical: '#f44336'
    }
    return colors[severity]
  }

  const containerStyles: React.CSSProperties = {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  }

  const headerStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  }

  const controlsStyles: React.CSSProperties = {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
    flexWrap: 'wrap',
  }

  const inputStyles: React.CSSProperties = {
    padding: '6px 10px',
    border: `1px solid ${theme === 'dark' ? '#444' : '#ccc'}`,
    borderRadius: '4px',
    backgroundColor: theme === 'dark' ? '#2d2d2d' : '#ffffff',
    color: theme === 'dark' ? '#ffffff' : '#333333',
    fontSize: '13px',
    flex: 1,
    minWidth: '200px',
  }

  const selectStyles: React.CSSProperties = {
    ...inputStyles,
    flex: 'none',
    minWidth: '120px',
  }

  const buttonStyles: React.CSSProperties = {
    padding: '6px 12px',
    border: 'none',
    borderRadius: '4px',
    backgroundColor: theme === 'dark' ? '#007acc' : '#007acc',
    color: '#ffffff',
    fontSize: '13px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  }

  const listStyles: React.CSSProperties = {
    flex: 1,
    overflow: 'auto',
    border: `1px solid ${theme === 'dark' ? '#444' : '#ccc'}`,
    borderRadius: '4px',
    backgroundColor: theme === 'dark' ? '#1a1a1a' : '#ffffff',
  }

  const errorItemStyles = (error: ErrorInfo): React.CSSProperties => ({
    padding: '12px',
    borderBottom: `1px solid ${theme === 'dark' ? '#333' : '#eee'}`,
    cursor: 'pointer',
    backgroundColor: selectedError?.id === error.id
      ? (theme === 'dark' ? '#2d5aa0' : '#e3f2fd')
      : 'transparent',
  })

  const badgeStyles = (color: string): React.CSSProperties => ({
    display: 'inline-block',
    padding: '2px 6px',
    borderRadius: '10px',
    fontSize: '11px',
    fontWeight: 'bold',
    color: '#ffffff',
    backgroundColor: color,
    marginRight: '8px',
  })

  return (
    <div style={containerStyles}>
      <div style={headerStyles}>
        <div style={controlsStyles}>
          <input
            type="text"
            placeholder="Search errors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={inputStyles}
          />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as any)}
            style={selectStyles}
          >
            <option value="all">All Categories</option>
            {Object.values(ErrorCategory).map(category => (
              <option key={category} value={category}>
                {category.charAt(0).toUpperCase() + category.slice(1).replace('_', ' ')}
              </option>
            ))}
          </select>
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value as any)}
            style={selectStyles}
          >
            <option value="all">All Severities</option>
            {Object.values(ErrorSeverity).map(severity => (
              <option key={severity} value={severity}>
                {severity.charAt(0).toUpperCase() + severity.slice(1)}
              </option>
            ))}
          </select>
          <button style={buttonStyles} onClick={clearErrors}>
            Clear All
          </button>
        </div>
        
        <div style={{ 
          fontSize: '12px', 
          color: theme === 'dark' ? '#ccc' : '#666',
          padding: '8px'
        }}>
          Total: {filteredErrors.length} | 
          Critical: {filteredErrors.filter(e => e.severity === 'critical').length} | 
          High: {filteredErrors.filter(e => e.severity === 'high').length} | 
          Medium: {filteredErrors.filter(e => e.severity === 'medium').length} | 
          Low: {filteredErrors.filter(e => e.severity === 'low').length}
        </div>
      </div>

      <div style={listStyles}>
        {filteredErrors.length === 0 ? (
          <div style={{ 
            padding: '20px', 
            textAlign: 'center', 
            color: theme === 'dark' ? '#999' : '#666' 
          }}>
            {errors.length === 0 
              ? 'No errors recorded yet.'
              : 'No errors match the current filters.'
            }
          </div>
        ) : (
          filteredErrors.map((error) => (
            <div
              key={error.id}
              style={errorItemStyles(error)}
              onClick={() => selectError(selectedError?.id === error.id ? null : error)}
            >
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
                <span style={badgeStyles(getSeverityColor(error.severity))}>
                  {error.severity.toUpperCase()}
                </span>
                <span style={{ fontSize: '12px', color: theme === 'dark' ? '#ccc' : '#666' }}>
                  {error.category.replace('_', ' ')} • {new Date(error.timestamp).toLocaleString()}
                </span>
              </div>
              <div style={{ 
                fontSize: '14px',
                color: theme === 'dark' ? '#ffffff' : '#333333',
                marginBottom: '4px'
              }}>
                {error.message}
              </div>
              {error.occurrences > 1 && (
                <div style={{ 
                  fontSize: '11px', 
                  color: theme === 'dark' ? '#999' : '#666' 
                }}>
                  Occurred {error.occurrences} times
                </div>
              )}
              {selectedError?.id === error.id && error.stack && (
                <div style={{
                  marginTop: '12px',
                  padding: '8px',
                  backgroundColor: theme === 'dark' ? '#252525' : '#f8f9fa',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontFamily: 'monaco, consolas, monospace',
                  overflow: 'auto',
                  maxHeight: '200px',
                }}>
                  {error.stack}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}