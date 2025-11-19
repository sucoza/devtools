import React, { useState, useMemo } from 'react'
import { useErrorBoundaryDevTools } from '../core/store'
import { ErrorCategory, ErrorSeverity } from '../types'

export const ErrorAnalytics: React.FC = () => {
  const { 
    errors, 
    errorGroups, 
    config,
    calculateCoverage 
  } = useErrorBoundaryDevTools()
  
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('24h')

  const theme = config.theme === 'auto' 
    ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : config.theme

  const timeRangeMs = useMemo(() => {
    const now = Date.now()
    switch (timeRange) {
      case '1h': return now - (60 * 60 * 1000)
      case '24h': return now - (24 * 60 * 60 * 1000)
      case '7d': return now - (7 * 24 * 60 * 60 * 1000)
      case '30d': return now - (30 * 24 * 60 * 60 * 1000)
      default: return now - (24 * 60 * 60 * 1000)
    }
  }, [timeRange])

  const filteredErrors = useMemo(() => {
    return errors.filter(error => error.timestamp >= timeRangeMs)
  }, [errors, timeRangeMs])

  const calculateMTTR = () => {
    // Simple MTTR calculation - time between error and recovery
    // In a real implementation, this would track actual recovery events
    const recoveryTimes = errorGroups.map(group => {
      return group.lastSeen - group.firstSeen
    })
    
    if (recoveryTimes.length === 0) return 0
    
    const avgRecoveryTime = recoveryTimes.reduce((sum, time) => sum + time, 0) / recoveryTimes.length
    return Math.round(avgRecoveryTime / 1000 / 60) // minutes
  }

  const coverage = calculateCoverage()
  const errorRate = filteredErrors.length / Math.max(1, (Date.now() - timeRangeMs) / 1000 / 60)
  const criticalErrors = filteredErrors.filter(e => e.severity === 'critical').length

  const containerStyles: React.CSSProperties = {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    padding: '16px'
  }

  const headerStyles: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '12px',
  }

  const selectStyles: React.CSSProperties = {
    padding: '6px 10px',
    border: "1px solid var(--dt-border-primary)",
    borderRadius: '4px',
    backgroundColor: "var(--dt-bg-primary)",
    color: "var(--dt-text-primary)",
    fontSize: '13px',
  }

  const metricsGridStyles: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '12px',
  }

  const metricCardStyles: React.CSSProperties = {
    padding: '16px',
    backgroundColor: "var(--dt-bg-secondary)",
    border: "1px solid var(--dt-border-primary)",
    borderRadius: '6px',
  }

  const metricTitleStyles: React.CSSProperties = {
    fontSize: '12px',
    color: "var(--dt-text-secondary)",
    marginBottom: '4px',
    textTransform: 'uppercase',
    fontWeight: 'bold',
  }

  const metricValueStyles: React.CSSProperties = {
    fontSize: '24px',
    fontWeight: 'bold',
    color: "var(--dt-text-primary)",
  }

  const breakdownStyles: React.CSSProperties = {
    display: 'grid', 
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
    gap: '12px' 
  }

  const breakdownCardStyles: React.CSSProperties = {
    padding: '12px',
    backgroundColor: "var(--dt-bg-secondary)",
    border: "1px solid var(--dt-border-primary)",
    borderRadius: '6px'
  }

  const badgeStyles = (color: string): React.CSSProperties => ({
    display: 'inline-block',
    padding: '2px 6px',
    borderRadius: '10px',
    fontSize: '11px',
    fontWeight: 'bold',
    color: "var(--dt-text-secondary)",
    backgroundColor: color,
    marginRight: '4px',
    marginBottom: '4px'
  })

  const getSeverityColor = (severity: ErrorSeverity) => {
    const colors = {
      low: 'var(--dt-status-success)',
      medium: 'var(--dt-status-warning)',
      high: 'var(--dt-status-error)', 
      critical: 'var(--dt-status-error)'
    }
    return colors[severity]
  }

  return (
    <div style={containerStyles}>
      {/* Header Controls */}
      <div style={headerStyles}>
        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: "var(--dt-text-primary)" }}>
          Error Analytics
        </h3>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value as any)}
          style={selectStyles}
        >
          <option value="1h">Last Hour</option>
          <option value="24h">Last 24 Hours</option>
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
        </select>
      </div>

      {/* Metrics Grid */}
      <div style={metricsGridStyles}>
        <div style={metricCardStyles}>
          <div style={metricTitleStyles}>Total Errors</div>
          <div style={{...metricValueStyles, color: filteredErrors.length > 10 ? 'var(--dt-status-error)' : 'var(--dt-status-success)'}}>{filteredErrors.length}</div>
        </div>
        <div style={metricCardStyles}>
          <div style={metricTitleStyles}>Error Rate</div>
          <div style={{...metricValueStyles, color: errorRate > 1 ? 'var(--dt-status-error)' : 'var(--dt-status-success)'}}>
            {errorRate.toFixed(2)}/min
          </div>
        </div>
        <div style={metricCardStyles}>
          <div style={metricTitleStyles}>Coverage</div>
          <div style={{...metricValueStyles, color: coverage > 80 ? 'var(--dt-status-success)' : coverage > 50 ? 'var(--dt-status-warning)' : 'var(--dt-status-error)'}}>
            {coverage.toFixed(1)}%
          </div>
        </div>
        <div style={metricCardStyles}>
          <div style={metricTitleStyles}>MTTR</div>
          <div style={{...metricValueStyles, color: calculateMTTR() < 5 ? 'var(--dt-status-success)' : 'var(--dt-status-warning)'}}>
            {calculateMTTR()}m
          </div>
        </div>
        <div style={metricCardStyles}>
          <div style={metricTitleStyles}>Error Groups</div>
          <div style={metricValueStyles}>{errorGroups.length}</div>
        </div>
        <div style={metricCardStyles}>
          <div style={metricTitleStyles}>Critical Errors</div>
          <div style={{...metricValueStyles, color: criticalErrors > 0 ? 'var(--dt-status-error)' : 'var(--dt-status-success)'}}>
            {criticalErrors}
          </div>
        </div>
      </div>

      {/* Error Breakdown */}
      {filteredErrors.length > 0 && (
        <div style={breakdownStyles}>
          <div style={breakdownCardStyles}>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 'bold', color: "var(--dt-text-primary)" }}>
              By Severity
            </h4>
            <div>
              {Object.values(ErrorSeverity).map(severity => {
                const count = filteredErrors.filter(e => e.severity === severity).length
                if (count === 0) return null
                return (
                  <span key={severity} style={badgeStyles(getSeverityColor(severity))}>
                    {severity}: {count}
                  </span>
                )
              })}
            </div>
          </div>

          <div style={breakdownCardStyles}>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 'bold', color: "var(--dt-text-primary)" }}>
              By Category
            </h4>
            <div>
              {Object.values(ErrorCategory).map(category => {
                const count = filteredErrors.filter(e => e.category === category).length
                if (count === 0) return null
                return (
                  <span key={category} style={badgeStyles("var(--dt-border-focus)")}>
                    {category.replace('_', ' ')}: {count}
                  </span>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Simple Chart Placeholder */}
      <div style={{
        flex: 1,
        minHeight: '200px',
        padding: '16px',
        backgroundColor: "var(--dt-bg-secondary)",
        border: "1px solid var(--dt-border-primary)",
        borderRadius: '6px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: "var(--dt-text-secondary)"
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '8px' }}>📊</div>
          <div>Error trend chart would be displayed here</div>
          <div style={{ fontSize: '12px', marginTop: '4px' }}>
            (Chart visualization will be implemented in future version)
          </div>
        </div>
      </div>
    </div>
  )
}