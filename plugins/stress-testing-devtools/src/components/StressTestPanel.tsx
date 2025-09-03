import React, { useState, useEffect, useCallback } from 'react'
import { Flame, Play, Settings, History } from 'lucide-react'
import {
  PluginPanel,
  ScrollableContainer,
  Tabs,
  Badge,
  StatusIndicator,
  Footer,
  COLORS,
  SPACING,
  TYPOGRAPHY,
  ConfigMenu,
  type ConfigMenuItem,
} from '@sucoza/shared-components'
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

  const handleClearAllData = useCallback(() => {
    if (confirm('Are you sure you want to clear all test data?')) {
      // Clear all test runs and results
      state.testRuns.forEach(run => {
        stressTestStore.clearResults(run.id)
      })
      stressTestStore.getState().testRuns = []
      stressTestStore.setActiveTest(null)
    }
  }, [state.testRuns])

  const handleExportResults = useCallback(() => {
    if (!state.activeTestId || !activeMetrics) return
    
    const testRun = state.testRuns.find(run => run.id === state.activeTestId)
    const exportData = {
      testRun,
      metrics: activeMetrics,
      results: state.results[state.activeTestId] || []
    }
    
    const dataStr = JSON.stringify(exportData, null, 2)
    const blob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `stress-test-results-${Date.now()}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, [state.activeTestId, activeMetrics, state.testRuns, state.results])

  const handleResetTest = useCallback(() => {
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
    stressTestStore.setActiveTest(null)
  }, [testRunner, state.activeTestId])

  const isRunning = testRunner !== null
  const activeMetrics = state.activeTestId ? state.metrics[state.activeTestId] : null

  // Tab configuration
  const tabs = [
    { id: 'runner', label: 'Test Runner', icon: Play },
    { id: 'config', label: 'Configuration', icon: Settings },
    { id: 'history', label: 'History', icon: History, badge: state.testRuns.length },
  ];

  // Footer stats
  const footerStats = [
    { label: 'Configs', value: state.configs.length.toString() },
    { label: 'Test Runs', value: state.testRuns.length.toString() },
  ];

  if (state.activeTestId && activeMetrics) {
    footerStats.push(
      { label: 'Requests', value: activeMetrics.totalRequests.toString() },
      { label: 'Success Rate', value: `${(activeMetrics.successRate * 100).toFixed(1)}%` },
      { label: 'Avg Response Time', value: `${activeMetrics.avgResponseTime.toFixed(1)}ms` },
    );
  }

  // Convert actions into config menu items
  const configMenuItems: ConfigMenuItem[] = [
    {
      id: 'start-test',
      label: isRunning ? 'Running...' : 'Start Stress Test',
      icon: '▶️',
      onClick: () => {
        if (!isRunning) {
          // Start with default settings - fixed test with 100 requests, 10 concurrent
          handleRunFixedTest(100, 10)
        }
      },
      disabled: isRunning || state.configs.length === 0,
      shortcut: 'Ctrl+R'
    },
    {
      id: 'stop-test',
      label: 'Stop Test',
      icon: '⏹️',
      onClick: handleStopTest,
      disabled: !isRunning,
      shortcut: 'Ctrl+S'
    },
    {
      id: 'view-results',
      label: 'View Results',
      icon: '📊',
      onClick: () => setActiveTab('history'),
      disabled: state.testRuns.length === 0,
      shortcut: 'Ctrl+V'
    },
    {
      id: 'reset-test',
      label: 'Reset Test',
      icon: '🔄',
      onClick: handleResetTest
    },
    {
      id: 'export-results',
      label: 'Export Results',
      icon: '💾',
      onClick: handleExportResults,
      disabled: !state.activeTestId || !activeMetrics,
      shortcut: 'Ctrl+E'
    },
    {
      id: 'clear-data',
      label: 'Clear Data',
      icon: '🗑️',
      onClick: handleClearAllData,
      disabled: state.testRuns.length === 0,
      shortcut: 'Ctrl+K',
      separator: true
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: '⚙️',
      onClick: () => setActiveTab('config')
    }
  ];

  return (
    <div style={{ position: 'relative', height: '100%' }}>
      <PluginPanel
        title="Stress Testing"
        icon={Flame}
        headerContent={(
          state.activeTestId && isRunning && (
            <StatusIndicator
              status="loading"
              label="Running"
              size="sm"
            />
          )
        )}
      >
      <Tabs
        activeTab={activeTab}
        onTabChange={(tabId) => setActiveTab(tabId as 'runner' | 'config' | 'history')}
        tabs={tabs}
      >
        <ScrollableContainer>
          {activeTab === 'runner' && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: SPACING.lg,
              padding: SPACING.md,
            }}>
              <div>
                <TestRunner
                  configs={state.configs}
                  onRunFixedTest={handleRunFixedTest}
                  onRunTimedTest={handleRunTimedTest}
                  onStop={handleStopTest}
                  isRunning={isRunning}
                />
              </div>
              
              <div>
                <div style={{
                  marginBottom: SPACING.md,
                  display: 'flex',
                  alignItems: 'center',
                  gap: SPACING.sm,
                }}>
                  <h3 style={{
                    ...TYPOGRAPHY.heading.h3,
                    color: COLORS.text.primary,
                    margin: 0,
                  }}>
                    Live Metrics
                  </h3>
                  {state.activeTestId && isRunning && (
                    <Badge variant="success" size="sm">
                      Running
                    </Badge>
                  )}
                </div>
                <MetricsDisplay 
                  metrics={activeMetrics} 
                  isActive={isRunning}
                />
              </div>
            </div>
          )}

          {activeTab === 'config' && (
            <div style={{ padding: SPACING.md }}>
              <ConfigEditor
                configs={state.configs}
                onSave={handleSaveConfigs}
              />
            </div>
          )}

          {activeTab === 'history' && (
            <div style={{ padding: SPACING.md }}>
              <TestHistory
                testRuns={state.testRuns}
                metrics={state.metrics}
                onSelectTest={handleSelectTest}
                onClearTest={handleClearTest}
                activeTestId={state.activeTestId}
              />
            </div>
          )}
        </ScrollableContainer>
      </Tabs>

        <Footer stats={footerStats} />
      </PluginPanel>

      <div style={{ position: 'absolute', top: '12px', right: '12px', zIndex: 10 }}>
        <ConfigMenu items={configMenuItems} size="sm" />
      </div>
    </div>
  )
}