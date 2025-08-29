import React from 'react'
import { TestRun, TestMetrics } from '../types'

interface TestHistoryProps {
  testRuns: TestRun[]
  metrics: Record<string, TestMetrics>
  onSelectTest: (id: string) => void
  onClearTest: (id: string) => void
  activeTestId: string | null
}

export const TestHistory: React.FC<TestHistoryProps> = ({
  testRuns,
  metrics,
  onSelectTest,
  onClearTest,
  activeTestId
}) => {
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString()
  }

  const formatDuration = (startTime: number, endTime?: number) => {
    if (!endTime) return 'Running...'
    const duration = endTime - startTime
    return `${(duration / 1000).toFixed(1)}s`
  }

  const getStatusColor = (status: TestRun['status']) => {
    switch (status) {
      case 'running': return '#2196F3'
      case 'completed': return '#4CAF50'
      case 'stopped': return '#FF9800'
      case 'failed': return '#f44336'
      default: return '#666'
    }
  }

  return (
    <div className="test-history">
      <h3>Test History</h3>
      
      {testRuns.length === 0 ? (
        <div className="no-history">
          No test runs yet. Run your first stress test to see results here.
        </div>
      ) : (
        <div className="history-list">
          {testRuns.map((testRun) => {
            const testMetrics = metrics[testRun.id]
            const isSelected = activeTestId === testRun.id
            
            return (
              <div
                key={testRun.id}
                className={`history-item ${isSelected ? 'selected' : ''}`}
                onClick={() => onSelectTest(testRun.id)}
              >
                <div className="history-header">
                  <div className="test-name">{testRun.name}</div>
                  <div className="test-actions">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onClearTest(testRun.id)
                      }}
                      className="clear-button"
                      title="Clear test results"
                    >
                      ×
                    </button>
                  </div>
                </div>
                
                <div className="history-details">
                  <div className="detail-row">
                    <span className="detail-label">Started:</span>
                    <span className="detail-value">{formatDate(testRun.startTime)}</span>
                  </div>
                  
                  <div className="detail-row">
                    <span className="detail-label">Duration:</span>
                    <span className="detail-value">
                      {formatDuration(testRun.startTime, testRun.endTime)}
                    </span>
                  </div>
                  
                  <div className="detail-row">
                    <span className="detail-label">Status:</span>
                    <span 
                      className="detail-value status"
                      style={{ color: getStatusColor(testRun.status) }}
                    >
                      {testRun.status.toUpperCase()}
                    </span>
                  </div>
                  
                  <div className="detail-row">
                    <span className="detail-label">Type:</span>
                    <span className="detail-value">
                      {testRun.type === 'fixed' ? 'Fixed Count' : 'Timed Rate'}
                    </span>
                  </div>
                  
                  {testRun.type === 'fixed' && (
                    <>
                      <div className="detail-row">
                        <span className="detail-label">Count:</span>
                        <span className="detail-value">{testRun.config.count}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Concurrency:</span>
                        <span className="detail-value">{testRun.config.concurrency}</span>
                      </div>
                    </>
                  )}
                  
                  {testRun.type === 'timed' && (
                    <>
                      <div className="detail-row">
                        <span className="detail-label">Duration:</span>
                        <span className="detail-value">{testRun.config.duration}m</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Rate:</span>
                        <span className="detail-value">{testRun.config.ratePerSecond}/s</span>
                      </div>
                    </>
                  )}
                  
                  {testMetrics && (
                    <div className="quick-metrics">
                      <div className="metric-summary">
                        <span>{testMetrics.totalRequests} requests</span>
                        <span>
                          {((testMetrics.successfulRequests / testMetrics.totalRequests) * 100).toFixed(1)}% success
                        </span>
                        <span>{testMetrics.averageResponseTime.toFixed(1)}ms avg</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}