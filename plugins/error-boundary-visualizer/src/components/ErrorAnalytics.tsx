import React, { useState, useMemo } from 'react'
import { useErrorBoundaryDevTools } from '../core/store'
import { ErrorCategory, ErrorSeverity } from '../types'

interface ChartData {
  label: string
  value: number
  color?: string
}

export const ErrorAnalytics: React.FC = () => {
  const { 
    errors, 
    errorGroups, 
    config,
    calculateCoverage 
  } = useErrorBoundaryDevTools()
  
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('24h')
  const [selectedChart, setSelectedChart] = useState<'category' | 'severity' | 'component' | 'trend'>('category')

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

  const categoryData: ChartData[] = useMemo(() => {
    const counts: Record<ErrorCategory, number> = Object.values(ErrorCategory).reduce(
      (acc, cat) => ({ ...acc, [cat]: 0 }),
      {} as Record<ErrorCategory, number>
    )
    
    filteredErrors.forEach(error => {
      counts[error.category]++
    })

    const colors = {
      render: '#ff6b6b',
      async: '#4ecdc4', 
      event_handler: '#45b7d1',
      lifecycle: '#96ceb4',
      network: '#feca57',
      unknown: '#gray'
    }

    return Object.entries(counts)
      .filter(([_, count]) => count > 0)
      .map(([category, count]) => ({
        label: category.replace('_', ' ').toUpperCase(),
        value: count,
        color: colors[category as ErrorCategory]
      }))
  }, [filteredErrors])

  const severityData: ChartData[] = useMemo(() => {
    const counts: Record<ErrorSeverity, number> = Object.values(ErrorSeverity).reduce(
      (acc, sev) => ({ ...acc, [sev]: 0 }),
      {} as Record<ErrorSeverity, number>
    )
    
    filteredErrors.forEach(error => {
      counts[error.severity]++
    })

    const colors = {
      low: '#4caf50',
      medium: '#ff9800',
      high: '#ff5722', 
      critical: '#f44336'
    }

    return Object.entries(counts)
      .filter(([_, count]) => count > 0)
      .map(([severity, count]) => ({
        label: severity.toUpperCase(),
        value: count,
        color: colors[severity as ErrorSeverity]
      }))
  }, [filteredErrors])

  const componentData: ChartData[] = useMemo(() => {
    const counts: Record<string, number> = {}
    
    filteredErrors.forEach(error => {
      const component = error.componentStack?.split('\n')[0]?.trim() || 'Unknown'
      counts[component] = (counts[component] || 0) + 1
    })

    return Object.entries(counts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([component, count], index) => ({
        label: component,
        value: count,
        color: `hsl(${index * 36}, 70%, 50%)`
      }))
  }, [filteredErrors])

  const trendData = useMemo(() => {
    const buckets: Record<string, number> = {}
    const bucketSize = timeRange === '1h' ? 5 * 60 * 1000 : // 5 minutes
                      timeRange === '24h' ? 60 * 60 * 1000 : // 1 hour
                      timeRange === '7d' ? 24 * 60 * 60 * 1000 : // 1 day
                      24 * 60 * 60 * 1000 // 1 day

    filteredErrors.forEach(error => {
      const bucket = Math.floor(error.timestamp / bucketSize) * bucketSize
      const key = new Date(bucket).toISOString()
      buckets[key] = (buckets[key] || 0) + 1
    })

    return Object.entries(buckets)
      .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
      .map(([timestamp, count]) => ({
        label: formatTrendLabel(new Date(timestamp), timeRange),
        value: count
      }))
  }, [filteredErrors, timeRange])

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
    flexWrap: 'wrap',
    gap: '12px',
  }

  const controlsStyles: React.CSSProperties = {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
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
    marginBottom: '16px',
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

  const chartContainerStyles: React.CSSProperties = {
    flex: 1,
    display: 'flex',
    gap: '16px',
  }

  const chartStyles: React.CSSProperties = {
    flex: 1,
    padding: '16px',
    backgroundColor: theme === 'dark' ? '#252525' : '#f8f9fa',
    border: `1px solid ${theme === 'dark' ? '#444' : '#ccc'}`,
    borderRadius: '6px',
    minHeight: '300px',
    display: 'flex',
    flexDirection: 'column',
  }

  const chartTitleStyles: React.CSSProperties = {
    fontSize: '16px',
    fontWeight: 'bold',
    marginBottom: '16px',
    color: theme === 'dark' ? '#ffffff' : '#333333',
  }

  return (
    <div style={containerStyles}>
      <div style={headerStyles}>
        <h3 style={{ margin: 0, color: theme === 'dark' ? '#ffffff' : '#333333' }}>
          Error Analytics
        </h3>
        <div style={controlsStyles}>
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
          <select
            value={selectedChart}
            onChange={(e) => setSelectedChart(e.target.value as any)}
            style={selectStyles}
          >
            <option value="category">By Category</option>
            <option value="severity">By Severity</option>
            <option value="component">By Component</option>
            <option value="trend">Error Trend</option>
          </select>
        </div>
      </div>

      <div style={metricsGridStyles}>
        <div style={metricCardStyles}>
          <div style={metricTitleStyles}>Total Errors</div>
          <div style={metricValueStyles}>{filteredErrors.length}</div>
        </div>
        <div style={metricCardStyles}>
          <div style={metricTitleStyles}>Error Rate</div>
          <div style={metricValueStyles}>
            {(filteredErrors.length / Math.max(1, (Date.now() - timeRangeMs) / 1000 / 60)).toFixed(2)}/min
          </div>
        </div>
        <div style={metricCardStyles}>
          <div style={metricTitleStyles}>Coverage</div>
          <div style={metricValueStyles}>{coverage.toFixed(1)}%</div>
        </div>
        <div style={metricCardStyles}>
          <div style={metricTitleStyles}>MTTR</div>
          <div style={metricValueStyles}>{calculateMTTR()}m</div>
        </div>
        <div style={metricCardStyles}>
          <div style={metricTitleStyles}>Error Groups</div>
          <div style={metricValueStyles}>{errorGroups.length}</div>
        </div>
        <div style={metricCardStyles}>
          <div style={metricTitleStyles}>Critical Errors</div>
          <div style={{ ...metricValueStyles, color: '#f44336' }}>
            {filteredErrors.filter(e => e.severity === 'critical').length}
          </div>
        </div>
      </div>

      <div style={chartContainerStyles}>
        <div style={chartStyles}>
          <div style={chartTitleStyles}>
            {selectedChart === 'category' && 'Errors by Category'}
            {selectedChart === 'severity' && 'Errors by Severity'}
            {selectedChart === 'component' && 'Top Components with Errors'}
            {selectedChart === 'trend' && 'Error Trend Over Time'}
          </div>
          
          {selectedChart !== 'trend' ? (
            <BarChart 
              data={
                selectedChart === 'category' ? categoryData :
                selectedChart === 'severity' ? severityData :
                componentData
              } 
              theme={theme}
            />
          ) : (
            <LineChart data={trendData} theme={theme} />
          )}
        </div>
      </div>
    </div>
  )
}

interface BarChartProps {
  data: ChartData[]
  theme: 'light' | 'dark'
}

const BarChart: React.FC<BarChartProps> = ({ data, theme }) => {
  if (data.length === 0) {
    return (
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        color: theme === 'dark' ? '#999' : '#666'
      }}>
        No data available
      </div>
    )
  }

  const maxValue = Math.max(...data.map(d => d.value))

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {data.map((item, index) => (
        <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ 
            width: '100px', 
            fontSize: '12px',
            color: theme === 'dark' ? '#ccc' : '#666',
            textAlign: 'right',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {item.label}
          </div>
          <div style={{ 
            flex: 1, 
            height: '20px', 
            backgroundColor: theme === 'dark' ? '#333' : '#e0e0e0',
            borderRadius: '4px',
            overflow: 'hidden',
            position: 'relative',
          }}>
            <div style={{
              height: '100%',
              width: `${(item.value / maxValue) * 100}%`,
              backgroundColor: item.color || (theme === 'dark' ? '#58a6ff' : '#0366d6'),
              borderRadius: '4px',
              transition: 'width 0.3s ease',
            }} />
          </div>
          <div style={{ 
            width: '40px', 
            fontSize: '12px',
            color: theme === 'dark' ? '#fff' : '#333',
            textAlign: 'left',
            fontWeight: 'bold',
          }}>
            {item.value}
          </div>
        </div>
      ))}
    </div>
  )
}

interface LineChartProps {
  data: ChartData[]
  theme: 'light' | 'dark'
}

const LineChart: React.FC<LineChartProps> = ({ data, theme }) => {
  if (data.length === 0) {
    return (
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        color: theme === 'dark' ? '#999' : '#666'
      }}>
        No data available
      </div>
    )
  }

  const maxValue = Math.max(...data.map(d => d.value), 1)
  const width = 400
  const height = 200

  const points = data.map((item, index) => ({
    x: (index / (data.length - 1)) * width,
    y: height - (item.value / maxValue) * height,
    value: item.value,
    label: item.label,
  }))

  const pathData = points.map((point, index) => 
    `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
  ).join(' ')

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <svg width={width} height={height} style={{ border: `1px solid ${theme === 'dark' ? '#444' : '#ccc'}` }}>
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map(percent => (
          <line
            key={percent}
            x1={0}
            y1={height * percent}
            x2={width}
            y2={height * percent}
            stroke={theme === 'dark' ? '#333' : '#e0e0e0'}
            strokeWidth={1}
          />
        ))}
        
        {/* Data line */}
        <path
          d={pathData}
          fill="none"
          stroke={theme === 'dark' ? '#58a6ff' : '#0366d6'}
          strokeWidth={2}
        />
        
        {/* Data points */}
        {points.map((point, index) => (
          <circle
            key={index}
            cx={point.x}
            cy={point.y}
            r={3}
            fill={theme === 'dark' ? '#58a6ff' : '#0366d6'}
          />
        ))}
      </svg>
      
      {/* X-axis labels */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        marginTop: '8px',
        fontSize: '11px',
        color: theme === 'dark' ? '#ccc' : '#666'
      }}>
        {data.slice(0, 5).map((item, index) => (
          <span key={index}>{item.label}</span>
        ))}
      </div>
    </div>
  )
}

function formatTrendLabel(date: Date, timeRange: string): string {
  switch (timeRange) {
    case '1h':
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    case '24h':
      return date.toLocaleTimeString([], { hour: '2-digit' })
    case '7d':
    case '30d':
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
    default:
      return date.toLocaleDateString()
  }
}