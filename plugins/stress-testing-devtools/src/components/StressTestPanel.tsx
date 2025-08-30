import React, { useState, useEffect, useCallback } from 'react'
import { TestRunner } from './TestRunner'
import { MetricsDisplay } from './MetricsDisplay'
import { ConfigEditor } from './ConfigEditor'
import { TestHistory } from './TestHistory'
import { stressTestStore } from '../store'
import { StressTestRunner } from '../stress-runner'
import { TestRun, StressTestConfig } from '../types'

export const StressTestPanel: React.FC = () => {
  const [state, setState] = useState(stressTestStore.getState())
  const [activeTab, setActiveTab] = useState<'runner' | 'config' | 'history'>('runner')
  const [testRunner, setTestRunner] = useState<StressTestRunner | null>(null)

  useEffect(() => {
    const unsubscribe = stressTestStore.subscribe(() => {
      setState(stressTestStore.getState())
    })
    return unsubscribe
  }, [])

  const createTestRun = useCallback((
    type: 'fixed' | 'timed',
    config: any
  ): TestRun => {
    return {
      id: `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: `${type === 'fixed' ? 'Fixed Count' : 'Timed Rate'} Test - ${new Date().toLocaleTimeString()}`,
      startTime: Date.now(),
      type,
      status: 'running',
      config: {
        requests: state.configs,
        ...config
      }
    }
  }, [state.configs])

  const handleRunFixedTest = useCallback(async (count: number, concurrency: number) => {
    const testRun = createTestRun('fixed', { count, concurrency })
    stressTestStore.addTestRun(testRun)
    stressTestStore.setActiveTest(testRun.id)

    const runner = new StressTestRunner((result) => {
      stressTestStore.addResult(testRun.id, result)
    })

    setTestRunner(runner)

    try {
      await runner.runFixedCountTest(state.configs, count, concurrency)
      stressTestStore.updateTestRun(testRun.id, {
        status: 'completed',
        endTime: Date.now()
      })
    } catch {
      stressTestStore.updateTestRun(testRun.id, {
        status: 'failed',
        endTime: Date.now()
      })
    } finally {
      setTestRunner(null)
    }
  }, [state.configs, createTestRun])

  const handleRunTimedTest = useCallback(async (duration: number, ratePerSecond: number) => {
    const testRun = createTestRun('timed', { duration, ratePerSecond })
    stressTestStore.addTestRun(testRun)
    stressTestStore.setActiveTest(testRun.id)

    const runner = new StressTestRunner((result) => {
      stressTestStore.addResult(testRun.id, result)
    })

    setTestRunner(runner)

    try {
      await runner.runTimedTest(state.configs, duration, ratePerSecond)
      stressTestStore.updateTestRun(testRun.id, {
        status: 'completed',
        endTime: Date.now()
      })
    } catch {
      stressTestStore.updateTestRun(testRun.id, {
        status: 'failed',
        endTime: Date.now()
      })
    } finally {
      setTestRunner(null)
    }
  }, [state.configs, createTestRun])

  const handleStopTest = useCallback(() => {
    if (testRunner) {
      testRunner.stop()
      if (state.activeTestId) {
        stressTestStore.updateTestRun(state.activeTestId, {
          status: 'stopped',
          endTime: Date.now()
        })
      }
      setTestRunner(null)
    }
  }, [testRunner, state.activeTestId])

  const handleSaveConfigs = useCallback((configs: StressTestConfig[]) => {
    stressTestStore.updateConfigs(configs)
  }, [])

  const handleSelectTest = useCallback((id: string) => {
    stressTestStore.setActiveTest(id)
  }, [])

  const handleClearTest = useCallback((id: string) => {
    stressTestStore.clearResults(id)
    const index = state.testRuns.findIndex(run => run.id === id)
    if (index !== -1) {
      const newTestRuns = [...state.testRuns]
      newTestRuns.splice(index, 1)
      // Update the store state directly for test run removal
      stressTestStore.getState().testRuns = newTestRuns
      if (state.activeTestId === id) {
        stressTestStore.setActiveTest(null)
      }
    }
  }, [state.testRuns, state.activeTestId])

  const isRunning = testRunner !== null
  const activeMetrics = state.activeTestId ? state.metrics[state.activeTestId] : null

  return (
    <div className="stress-test-panel">
      <div className="panel-header">
        <h2>🔥 Stress Testing</h2>
        <div className="panel-tabs">
          <button
            className={`panel-tab ${activeTab === 'runner' ? 'active' : ''}`}
            onClick={() => setActiveTab('runner')}
          >
            Test Runner
          </button>
          <button
            className={`panel-tab ${activeTab === 'config' ? 'active' : ''}`}
            onClick={() => setActiveTab('config')}
          >
            Configuration
          </button>
          <button
            className={`panel-tab ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            History ({state.testRuns.length})
          </button>
        </div>
      </div>

      <div className="panel-content">
        {activeTab === 'runner' && (
          <div className="runner-layout">
            <div className="runner-section">
              <TestRunner
                configs={state.configs}
                onRunFixedTest={handleRunFixedTest}
                onRunTimedTest={handleRunTimedTest}
                onStop={handleStopTest}
                isRunning={isRunning}
              />
            </div>
            
            <div className="metrics-section">
              <h3>
                Live Metrics
                {state.activeTestId && isRunning && (
                  <span className="running-indicator"> ⚡ Running</span>
                )}
              </h3>
              <MetricsDisplay 
                metrics={activeMetrics} 
                isActive={isRunning}
              />
            </div>
          </div>
        )}

        {activeTab === 'config' && (
          <ConfigEditor
            configs={state.configs}
            onSave={handleSaveConfigs}
          />
        )}

        {activeTab === 'history' && (
          <TestHistory
            testRuns={state.testRuns}
            metrics={state.metrics}
            onSelectTest={handleSelectTest}
            onClearTest={handleClearTest}
            activeTestId={state.activeTestId}
          />
        )}
      </div>
    </div>
  )
}