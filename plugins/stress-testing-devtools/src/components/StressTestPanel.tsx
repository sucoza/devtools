import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Flame, Play, Settings, History } from 'lucide-react'
import {
  PluginPanel,
  ScrollableContainer,
  Tabs,
  Badge,
  Footer,
  COLORS,
  SPACING,
  TYPOGRAPHY,
  ConfigMenu,
  ThemeProvider,
  type ConfigMenuItem,
} from '@sucoza/shared-components'
import '@sucoza/shared-components/dist/styles/theme.css'
import { TestRunner } from './TestRunner'
import { MetricsDisplay } from './MetricsDisplay'
import { ConfigEditor } from './ConfigEditor'
import { TestHistory } from './TestHistory'
import { stressTestStore } from '../store'
import { StressTestRunner } from '../stress-runner'
import { TestRun, StressTestConfig } from '../types'

export interface StressTestPanelProps {
  theme?: 'light' | 'dark' | 'auto';
}

const StressTestPanelInner: React.FC<StressTestPanelProps> = () => {
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
      id: `test-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
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
    stressTestStore.removeTestRun(id)
    if (state.activeTestId === id) {
      stressTestStore.setActiveTest(null)
    }
  }, [state.activeTestId])

  const handleClearAllData = useCallback(() => {
    if (confirm('Are you sure you want to clear all test data?')) {
      // Clear all test runs and results
      state.testRuns.forEach(run => {
        stressTestStore.clearResults(run.id)
      })
      stressTestStore.clearAllTestRuns()
      stressTestStore.setActiveTest(null)
    }
  }, [state.testRuns])

  const isRunning = testRunner !== null
  const activeMetrics = state.activeTestId ? state.metrics[state.activeTestId] : null

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
    try {
      const link = document.createElement('a')
      link.href = url
      link.download = `stress-test-results-${Date.now()}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } finally {
      URL.revokeObjectURL(url)
    }
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

  // Tab configuration with content
  const tabs = [
    {
      id: 'runner',
      label: 'Test Runner',
      icon: <Play size={16} />,
      content: (
        <ScrollableContainer>
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
                  fontSize: TYPOGRAPHY.fontSize.lg,
                  fontWeight: TYPOGRAPHY.fontWeight.semibold,
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
        </ScrollableContainer>
      ),
    },
    {
      id: 'config',
      label: 'Configuration',
      icon: <Settings size={16} />,
      content: (
        <ScrollableContainer>
          <div style={{ padding: SPACING.md }}>
            <ConfigEditor
              configs={state.configs}
              onSave={handleSaveConfigs}
            />
          </div>
        </ScrollableContainer>
      ),
    },
    {
      id: 'history',
      label: 'History',
      icon: <History size={16} />,
      badge: state.testRuns.length,
      content: (
        <ScrollableContainer>
          <div style={{ padding: SPACING.md }}>
            <TestHistory
              testRuns={state.testRuns}
              metrics={state.metrics}
              onSelectTest={handleSelectTest}
              onClearTest={handleClearTest}
              activeTestId={state.activeTestId}
            />
          </div>
        </ScrollableContainer>
      ),
    },
  ];

  // Footer stats
  const footerStats = [
    { id: 'configs', label: 'Configs', value: state.configs.length.toString() },
    { id: 'test-runs', label: 'Test Runs', value: state.testRuns.length.toString() },
  ];

  if (state.activeTestId && activeMetrics) {
    const successRate = activeMetrics.totalRequests > 0
      ? (activeMetrics.successfulRequests / activeMetrics.totalRequests)
      : 0;
    footerStats.push(
      { id: 'requests', label: 'Requests', value: activeMetrics.totalRequests.toString() },
      { id: 'success-rate', label: 'Success Rate', value: `${(successRate * 100).toFixed(1)}%` },
      { id: 'avg-response-time', label: 'Avg Response Time', value: `${activeMetrics.averageResponseTime.toFixed(1)}ms` },
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
      >
        <Tabs
          activeTab={activeTab}
          onTabChange={(tabId) => setActiveTab(tabId as 'runner' | 'config' | 'history')}
          tabs={tabs}
        />

        <Footer stats={footerStats} />
      </PluginPanel>

      <div style={{ position: 'absolute', top: '12px', right: '12px', zIndex: 10 }}>
        <ConfigMenu items={configMenuItems} size="sm" />
      </div>
    </div>
  )
}

/**
 * Stress Test Panel with Theme Provider
 */
export const StressTestPanel: React.FC<StressTestPanelProps> = (props) => {
  const { theme = 'auto' } = props;

  // Resolve theme
  const resolvedTheme = useMemo(() => {
    if (theme === 'auto') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return theme;
  }, [theme]);

  return (
    <ThemeProvider defaultTheme={resolvedTheme}>
      <StressTestPanelInner {...props} />
    </ThemeProvider>
  );
}