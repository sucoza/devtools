import React, { useState, useMemo } from 'react'
import { Trans } from '@lingui/macro'
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
    border: `1px solid ${theme === 'dark' ? '#444' : '#ccc'}`,
    borderRadius: '4px',
    backgroundColor: theme === 'dark' ? '#2d2d2d' : '#ffffff',
    color: theme === 'dark' ? '#ffffff' : '#333333',
    fontSize: '13px',
  }

  const metricsGridStyles: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '12px',
  }

  const metricCardStyles: React.CSSProperties = {
    padding: '16px',
    backgroundColor: theme === 'dark' ? '#252525' : '#f8f9fa',
    border: `1px solid ${theme === 'dark' ? '#444' : '#ccc'}`,
    borderRadius: '6px',
  }

  const metricTitleStyles: React.CSSProperties = {
    fontSize: '12px',
    color: theme === 'dark' ? '#ccc' : '#666',
    marginBottom: '4px',
    textTransform: 'uppercase',
    fontWeight: 'bold',
  }

  const metricValueStyles: React.CSSProperties = {
    fontSize: '24px',
    fontWeight: 'bold',
    color: theme === 'dark' ? '#ffffff' : '#333333',
  }

  const breakdownStyles: React.CSSProperties = {
    display: 'grid', 
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
    gap: '12px' 
  }

  const breakdownCardStyles: React.CSSProperties = {
    padding: '12px',
    backgroundColor: theme === 'dark' ? '#252525' : '#f8f9fa',
    border: `1px solid ${theme === 'dark' ? '#444' : '#ccc'}`,
    borderRadius: '6px'
  }

  const badgeStyles = (color: string): React.CSSProperties => ({
    display: 'inline-block',
    padding: '2px 6px',
    borderRadius: '10px',
    fontSize: '11px',
    fontWeight: 'bold',
    color: '#ffffff',
    backgroundColor: color,
    marginRight: '4px',
    marginBottom: '4px'
  })

  const getSeverityColor = (severity: ErrorSeverity) => {
    const colors = {
      low: '#4caf50',
      medium: '#ff9800',
      high: '#ff5722', 
      critical: '#f44336'
    }
    return colors[severity]
  }

  return (
    <div style={containerStyles}>
      {/* Header Controls */}
      <div style={headerStyles}>
        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: theme === 'dark' ? '#ffffff' : '#333333' }}>
          <Trans>Error Analytics</Trans>
        </h3>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value as any)}
          style={selectStyles}
        >
          <option value="1h"><Trans>Last Hour</Trans></option>
          <option value="24h"><Trans>Last 24 Hours</Trans></option>
          <option value="7d"><Trans>Last 7 Days</Trans></option>
          <option value="30d"><Trans>Last 30 Days</Trans></option>
        </select>
      </div>

      {/* Metrics Grid */}
      <div style={metricsGridStyles}>
        <div style={metricCardStyles}>
          <div style={metricTitleStyles}><Trans>Total Errors</Trans></div>
          <div style={{...metricValueStyles, color: filteredErrors.length > 10 ? '#ff5722' : '#4caf50'}}>{filteredErrors.length}</div>
        </div>
        <div style={metricCardStyles}>
          <div style={metricTitleStyles}><Trans>Error Rate</Trans></div>
          <div style={{...metricValueStyles, color: errorRate > 1 ? '#f44336' : '#4caf50'}}>
            {errorRate.toFixed(2)}/min
          </div>
        </div>
        <div style={metricCardStyles}>
          <div style={metricTitleStyles}><Trans>Coverage</Trans></div>
          <div style={{...metricValueStyles, color: coverage > 80 ? '#4caf50' : coverage > 50 ? '#ff9800' : '#f44336'}}>
            {coverage.toFixed(1)}%
          </div>
        </div>
        <div style={metricCardStyles}>
          <div style={metricTitleStyles}><Trans>MTTR</Trans></div>
          <div style={{...metricValueStyles, color: calculateMTTR() < 5 ? '#4caf50' : '#ff9800'}}>
            {calculateMTTR()}m
          </div>
        </div>
        <div style={metricCardStyles}>
          <div style={metricTitleStyles}><Trans>Error Groups</Trans></div>
          <div style={metricValueStyles}>{errorGroups.length}</div>
        </div>
        <div style={metricCardStyles}>
          <div style={metricTitleStyles}><Trans>Critical Errors</Trans></div>
          <div style={{...metricValueStyles, color: criticalErrors > 0 ? '#f44336' : '#4caf50'}}>
            {criticalErrors}
          </div>
        </div>
      </div>

      {/* Error Breakdown */}
      {filteredErrors.length > 0 && (
        <div style={breakdownStyles}>
          <div style={breakdownCardStyles}>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 'bold', color: theme === 'dark' ? '#ffffff' : '#333333' }}>
              <Trans>By Severity</Trans>
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
            <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 'bold', color: theme === 'dark' ? '#ffffff' : '#333333' }}>
              <Trans>By Category</Trans>
            </h4>
            <div>
              {Object.values(ErrorCategory).map(category => {
                const count = filteredErrors.filter(e => e.category === category).length
                if (count === 0) return null
                return (
                  <span key={category} style={badgeStyles('#007acc')}>
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
        backgroundColor: theme === 'dark' ? '#252525' : '#f8f9fa',
        border: `1px solid ${theme === 'dark' ? '#444' : '#ccc'}`,
        borderRadius: '6px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: theme === 'dark' ? '#ccc' : '#666'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '8px' }}>📊</div>
          <div><Trans>Error trend chart would be displayed here</Trans></div>
          <div style={{ fontSize: '12px', marginTop: '4px' }}>
            <Trans>(Chart visualization will be implemented in future version)</Trans>
          </div>
        </div>
      </div>
    </div>
  )
}