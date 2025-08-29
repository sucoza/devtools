import React, { useState } from 'react'
import { StressTestConfig } from '../types'

interface TestRunnerProps {
  configs: StressTestConfig[]
  onRunFixedTest: (count: number, concurrency: number) => void
  onRunTimedTest: (duration: number, ratePerSecond: number) => void
  onStop: () => void
  isRunning: boolean
}

export const TestRunner: React.FC<TestRunnerProps> = ({
  configs,
  onRunFixedTest,
  onRunTimedTest,
  onStop,
  isRunning
}) => {
  const [activeTab, setActiveTab] = useState<'fixed' | 'timed'>('fixed')
  const [count, setCount] = useState(100)
  const [concurrency, setConcurrency] = useState(10)
  const [duration, setDuration] = useState(1)
  const [ratePerSecond, setRatePerSecond] = useState(5)

  const handleRunFixed = () => {
    if (configs.length === 0) {
      alert('No request configurations available')
      return
    }
    onRunFixedTest(count, concurrency)
  }

  const handleRunTimed = () => {
    if (configs.length === 0) {
      alert('No request configurations available')
      return
    }
    onRunTimedTest(duration, ratePerSecond)
  }

  return (
    <div className="test-runner">
      <div className="runner-tabs">
        <button
          className={`tab ${activeTab === 'fixed' ? 'active' : ''}`}
          onClick={() => setActiveTab('fixed')}
        >
          Fixed Count
        </button>
        <button
          className={`tab ${activeTab === 'timed' ? 'active' : ''}`}
          onClick={() => setActiveTab('timed')}
        >
          Timed Rate
        </button>
      </div>

      <div className="runner-content">
        {activeTab === 'fixed' && (
          <div className="fixed-test-panel">
            <div className="form-group">
              <label htmlFor="count">Total Requests:</label>
              <input
                id="count"
                type="number"
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
                min="1"
                max="10000"
                disabled={isRunning}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="concurrency">Concurrency:</label>
              <input
                id="concurrency"
                type="number"
                value={concurrency}
                onChange={(e) => setConcurrency(Number(e.target.value))}
                min="1"
                max="100"
                disabled={isRunning}
              />
            </div>
            
            <div className="test-info">
              <div>Requests per suite: {configs.length}</div>
              <div>Total suites: {count}</div>
              <div>Total requests: {count * configs.length}</div>
            </div>
            
            <button
              onClick={handleRunFixed}
              disabled={isRunning}
              className="btn-primary run-button"
            >
              {isRunning ? 'Running...' : 'Run Fixed Test'}
            </button>
          </div>
        )}

        {activeTab === 'timed' && (
          <div className="timed-test-panel">
            <div className="form-group">
              <label htmlFor="duration">Duration (minutes):</label>
              <input
                id="duration"
                type="number"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                min="0.1"
                max="60"
                step="0.1"
                disabled={isRunning}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="rate">Requests per second:</label>
              <input
                id="rate"
                type="number"
                value={ratePerSecond}
                onChange={(e) => setRatePerSecond(Number(e.target.value))}
                min="0.1"
                max="100"
                step="0.1"
                disabled={isRunning}
              />
            </div>
            
            <div className="test-info">
              <div>Requests per suite: {configs.length}</div>
              <div>Estimated total requests: {Math.ceil(duration * 60 * ratePerSecond)}</div>
              <div>Test will cycle through {configs.length} request(s)</div>
            </div>
            
            <button
              onClick={handleRunTimed}
              disabled={isRunning}
              className="btn-primary run-button"
            >
              {isRunning ? 'Running...' : 'Run Timed Test'}
            </button>
          </div>
        )}
      </div>

      {isRunning && (
        <div className="running-controls">
          <button onClick={onStop} className="btn-danger stop-button">
            ⛔ Stop Test
          </button>
        </div>
      )}
    </div>
  )
}