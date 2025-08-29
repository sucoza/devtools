import React from 'react'
import { TestMetrics } from '../types'

interface MetricsDisplayProps {
  metrics: TestMetrics | null
  isActive: boolean
}

export const MetricsDisplay: React.FC<MetricsDisplayProps> = ({ metrics, isActive }) => {
  if (!metrics) {
    return (
      <div className="metrics-display">
        <div className="no-metrics">No metrics available</div>
      </div>
    )
  }

  const formatMs = (ms: number) => `${ms.toFixed(1)}ms`
  const formatPercent = (value: number, total: number) => 
    total > 0 ? `${((value / total) * 100).toFixed(1)}%` : '0%'

  const successRate = formatPercent(metrics.successfulRequests, metrics.totalRequests)
  const errorRate = formatPercent(metrics.failedRequests, metrics.totalRequests)

  return (
    <div className="metrics-display">
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-label">Total Requests</div>
          <div className="metric-value">{metrics.totalRequests}</div>
        </div>
        
        <div className="metric-card success">
          <div className="metric-label">Success Rate</div>
          <div className="metric-value">{successRate}</div>
        </div>
        
        <div className="metric-card error">
          <div className="metric-label">Error Rate</div>
          <div className="metric-value">{errorRate}</div>
        </div>
        
        <div className="metric-card">
          <div className="metric-label">Avg Response</div>
          <div className="metric-value">{formatMs(metrics.averageResponseTime)}</div>
        </div>
        
        <div className="metric-card">
          <div className="metric-label">P50</div>
          <div className="metric-value">{formatMs(metrics.p50)}</div>
        </div>
        
        <div className="metric-card">
          <div className="metric-label">P90</div>
          <div className="metric-value">{formatMs(metrics.p90)}</div>
        </div>
        
        <div className="metric-card">
          <div className="metric-label">P95</div>
          <div className="metric-value">{formatMs(metrics.p95)}</div>
        </div>
        
        <div className="metric-card">
          <div className="metric-label">P99</div>
          <div className="metric-value">{formatMs(metrics.p99)}</div>
        </div>
        
        <div className="metric-card">
          <div className="metric-label">Max Response</div>
          <div className="metric-value">{formatMs(metrics.maxResponseTime)}</div>
        </div>
        
        {isActive && (
          <div className="metric-card rps">
            <div className="metric-label">Current RPS</div>
            <div className="metric-value">{metrics.currentRPS}</div>
          </div>
        )}
      </div>
      
      {Object.keys(metrics.errorsByType).length > 0 && (
        <div className="error-breakdown">
          <h4>Error Breakdown</h4>
          <div className="error-list">
            {Object.entries(metrics.errorsByType).map(([error, count]) => (
              <div key={error} className="error-item">
                <span className="error-type">{error}</span>
                <span className="error-count">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}