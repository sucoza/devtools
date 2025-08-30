import React, { useState, useMemo } from 'react'
import { useErrorBoundaryDevTools } from '../core/store'
import { StackTraceViewer } from './StackTraceViewer'
import type { ErrorInfo } from '../types'
import { ErrorCategory, ErrorSeverity } from '../types'

type SortField = 'timestamp' | 'severity' | 'category' | 'message' | 'occurrences'
type SortOrder = 'asc' | 'desc'

export const ErrorList: React.FC = () => {
  const { 
    errors, 
    selectedError, 
    selectError, 
    clearErrors, 
    groupErrors,
    config,
    exportState
  } = useErrorBoundaryDevTools()
  
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<ErrorCategory | 'all'>('all')
  const [severityFilter, setSeverityFilter] = useState<ErrorSeverity | 'all'>('all')
  const [sortField, setSortField] = useState<SortField>('timestamp')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [showDetails, setShowDetails] = useState<string | null>(null)

  const theme = config.theme === 'auto' 
    ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : config.theme

  const filteredAndSortedErrors = useMemo(() => {
    const filtered = errors.filter((error) => {
      const matchesSearch = !searchQuery || 
        error.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (error.componentStack?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
      
      const matchesCategory = categoryFilter === 'all' || error.category === categoryFilter
      const matchesSeverity = severityFilter === 'all' || error.severity === severityFilter
      
      return matchesSearch && matchesCategory && matchesSeverity
    })

    filtered.sort((a, b) => {
      let aVal: any, bVal: any
      
      switch (sortField) {
        case 'timestamp':
          aVal = a.timestamp
          bVal = b.timestamp
          break
        case 'severity': {
          const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 }
          aVal = severityOrder[a.severity]
          bVal = severityOrder[b.severity]
          break
        }
        case 'category':
          aVal = a.category
          bVal = b.category
          break
        case 'message':
          aVal = a.message
          bVal = b.message
          break
        case 'occurrences':
          aVal = a.occurrences
          bVal = b.occurrences
          break
        default:
          return 0
      }

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1
      return 0
    })

    return filtered
  }, [errors, searchQuery, categoryFilter, severityFilter, sortField, sortOrder])

  const getSeverityColor = (severity: ErrorSeverity) => {
    const colors = {
      low: '#4caf50',
      medium: '#ff9800', 
      high: '#ff5722',
      critical: '#f44336'
    }
    return colors[severity]
  }

  const getCategoryIcon = (category: ErrorCategory) => {
    const icons = {
      render: '🎨',
      async: '⏳',
      event_handler: '🖱️',
      lifecycle: '🔄',
      network: '🌐',
      unknown: '❓'
    }
    return icons[category]
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('desc')
    }
  }

  const toggleDetails = (errorId: string) => {
    setShowDetails(showDetails === errorId ? null : errorId)
  }

  const handleExport = () => {
    const data = exportState()
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `error-boundary-data-${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
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

  const summaryStyles: React.CSSProperties = {
    display: 'flex',
    gap: '16px',
    padding: '8px 12px',
    backgroundColor: theme === 'dark' ? '#252525' : '#f5f5f5',
    borderRadius: '4px',
    fontSize: '12px',
    color: theme === 'dark' ? '#ccc' : '#666',
  }

  const tableContainerStyles: React.CSSProperties = {
    flex: 1,
    overflow: 'auto',
    border: `1px solid ${theme === 'dark' ? '#444' : '#ccc'}`,
    borderRadius: '4px',
  }

  const tableStyles: React.CSSProperties = {
    width: '100%',
    borderCollapse: 'collapse',
    backgroundColor: theme === 'dark' ? '#1a1a1a' : '#ffffff',
  }

  const thStyles: React.CSSProperties = {
    padding: '8px 12px',
    textAlign: 'left',
    borderBottom: `1px solid ${theme === 'dark' ? '#444' : '#ccc'}`,
    backgroundColor: theme === 'dark' ? '#2d2d2d' : '#f8f9fa',
    color: theme === 'dark' ? '#ffffff' : '#333333',
    fontWeight: 'bold',
    fontSize: '12px',
    cursor: 'pointer',
    userSelect: 'none',
    position: 'sticky',
    top: 0,
    zIndex: 1,
  }

  const tdStyles: React.CSSProperties = {
    padding: '8px 12px',
    borderBottom: `1px solid ${theme === 'dark' ? '#333' : '#eee'}`,
    fontSize: '13px',
    color: theme === 'dark' ? '#ffffff' : '#333333',
  }

  const errorRowStyles = (error: ErrorInfo): React.CSSProperties => ({
    backgroundColor: selectedError?.id === error.id
      ? (theme === 'dark' ? '#2d5aa0' : '#e3f2fd')
      : 'transparent',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  })

  const badgeStyles = (color: string): React.CSSProperties => ({
    display: 'inline-block',
    padding: '2px 6px',
    borderRadius: '10px',
    fontSize: '11px',
    fontWeight: 'bold',
    color: '#ffffff',
    backgroundColor: color,
  })

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return '↕️'
    return sortOrder === 'asc' ? '↑' : '↓'
  }

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString()
  }

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
          <button style={buttonStyles} onClick={groupErrors}>
            Group Similar
          </button>
          <button style={buttonStyles} onClick={clearErrors}>
            Clear All
          </button>
          <button style={buttonStyles} onClick={handleExport}>
            Export
          </button>
        </div>
        
        <div style={summaryStyles}>
          <span>Total: {filteredAndSortedErrors.length}</span>
          <span>Critical: {filteredAndSortedErrors.filter(e => e.severity === 'critical').length}</span>
          <span>High: {filteredAndSortedErrors.filter(e => e.severity === 'high').length}</span>
          <span>Medium: {filteredAndSortedErrors.filter(e => e.severity === 'medium').length}</span>
          <span>Low: {filteredAndSortedErrors.filter(e => e.severity === 'low').length}</span>
        </div>
      </div>

      <div style={tableContainerStyles}>
        {filteredAndSortedErrors.length === 0 ? (
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
          <table style={tableStyles}>
            <thead>
              <tr>
                <th style={thStyles} onClick={() => handleSort('timestamp')}>
                  Time {getSortIcon('timestamp')}
                </th>
                <th style={thStyles} onClick={() => handleSort('severity')}>
                  Severity {getSortIcon('severity')}
                </th>
                <th style={thStyles} onClick={() => handleSort('category')}>
                  Category {getSortIcon('category')}
                </th>
                <th style={thStyles} onClick={() => handleSort('message')}>
                  Message {getSortIcon('message')}
                </th>
                <th style={thStyles} onClick={() => handleSort('occurrences')}>
                  Count {getSortIcon('occurrences')}
                </th>
                <th style={thStyles}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedErrors.map((error) => (
                <React.Fragment key={error.id}>
                  <tr 
                    style={errorRowStyles(error)}
                    onClick={() => selectError(selectedError?.id === error.id ? null : error)}
                  >
                    <td style={tdStyles}>
                      {formatTimestamp(error.timestamp)}
                    </td>
                    <td style={tdStyles}>
                      <span style={badgeStyles(getSeverityColor(error.severity))}>
                        {error.severity.toUpperCase()}
                      </span>
                    </td>
                    <td style={tdStyles}>
                      <span style={{ marginRight: '6px' }}>
                        {getCategoryIcon(error.category)}
                      </span>
                      {error.category.replace('_', ' ')}
                    </td>
                    <td style={tdStyles}>
                      <div style={{ 
                        maxWidth: '300px', 
                        overflow: 'hidden', 
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {error.message}
                      </div>
                    </td>
                    <td style={tdStyles}>
                      {error.occurrences > 1 && (
                        <span style={badgeStyles('#666')}>
                          {error.occurrences}x
                        </span>
                      )}
                    </td>
                    <td style={tdStyles}>
                      <button
                        style={{
                          ...buttonStyles,
                          fontSize: '11px',
                          padding: '4px 8px',
                          backgroundColor: 'transparent',
                          color: theme === 'dark' ? '#ffffff' : '#333333',
                          border: `1px solid ${theme === 'dark' ? '#444' : '#ccc'}`,
                        }}
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleDetails(error.id)
                        }}
                      >
                        {showDetails === error.id ? 'Hide' : 'Details'}
                      </button>
                    </td>
                  </tr>
                  {showDetails === error.id && (
                    <tr>
                      <td colSpan={6} style={{ ...tdStyles, padding: 0 }}>
                        <div style={{ 
                          padding: '12px',
                          backgroundColor: theme === 'dark' ? '#252525' : '#f8f9fa',
                          borderTop: `1px solid ${theme === 'dark' ? '#444' : '#ccc'}`,
                        }}>
                          <div style={{ marginBottom: '12px' }}>
                            <strong>Full Error Message:</strong>
                            <div style={{ 
                              marginTop: '4px',
                              padding: '8px',
                              backgroundColor: theme === 'dark' ? '#1a1a1a' : '#ffffff',
                              border: `1px solid ${theme === 'dark' ? '#444' : '#ccc'}`,
                              borderRadius: '4px',
                              fontFamily: 'monaco, consolas, monospace',
                              fontSize: '12px',
                            }}>
                              {error.message}
                            </div>
                          </div>
                          
                          {error.componentStack && (
                            <div style={{ marginBottom: '12px' }}>
                              <strong>Component Stack:</strong>
                              <div style={{ 
                                marginTop: '4px',
                                padding: '8px',
                                backgroundColor: theme === 'dark' ? '#1a1a1a' : '#ffffff',
                                border: `1px solid ${theme === 'dark' ? '#444' : '#ccc'}`,
                                borderRadius: '4px',
                                fontFamily: 'monaco, consolas, monospace',
                                fontSize: '12px',
                                whiteSpace: 'pre-wrap',
                              }}>
                                {error.componentStack}
                              </div>
                            </div>
                          )}
                          
                          {error.stack && (
                            <div>
                              <strong>Stack Trace:</strong>
                              <StackTraceViewer stack={error.stack} />
                            </div>
                          )}
                          
                          {error.metadata && Object.keys(error.metadata).length > 0 && (
                            <div style={{ marginTop: '12px' }}>
                              <strong>Metadata:</strong>
                              <pre style={{ 
                                marginTop: '4px',
                                padding: '8px',
                                backgroundColor: theme === 'dark' ? '#1a1a1a' : '#ffffff',
                                border: `1px solid ${theme === 'dark' ? '#444' : '#ccc'}`,
                                borderRadius: '4px',
                                fontSize: '12px',
                                overflow: 'auto',
                              }}>
                                {JSON.stringify(error.metadata, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}