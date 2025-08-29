import { StressTestState, TestRun, RequestResult, TestMetrics, StressTestConfig } from './types'

class StressTestStore {
  private state: StressTestState = {
    testRuns: [],
    activeTestId: null,
    results: {},
    metrics: {},
    configs: [
      {
        name: 'Get Region Path',
        method: 'GET',
        path: '/api/Regions/83bdbebb-e52d-4986-b9f4-48a84bd0baa7/RegionPath',
        inputParams: {},
        test: 'response.length > 0'
      },
      {
        name: 'Search Enrollments',
        method: 'POST',
        path: '/api/v2/Enrollments/search',
        inputParams: {
          DetailLevel: 3,
          Offset: 0,
          count: 20,
          isLinked: null,
          Ascending: 0,
          IsExact: false
        },
        test: 'response.enrollmentInfo !== undefined'
      },
      {
        name: 'Search Match Events',
        method: 'POST',
        path: '/api/v2/MatchEvents/search?limit=20',
        inputParams: {},
        test: 'response.data !== undefined'
      },
      {
        name: 'Get Tags',
        method: 'GET',
        path: '/api/Tags',
        inputParams: {},
        test: 'response.tags !== undefined'
      },
      {
        name: 'Search Users List',
        method: 'POST',
        path: '/api/Users/SearchUsersList',
        inputParams: {
          TenantId: '{{tenantId}}'
        },
        test: 'response.totalCount > 0'
      }
    ]
  }

  private listeners = new Set<() => void>()

  getState(): StressTestState {
    return this.state
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private notify() {
    this.listeners.forEach(listener => listener())
  }

  addTestRun(testRun: TestRun) {
    this.state.testRuns.push(testRun)
    this.state.results[testRun.id] = []
    this.notify()
  }

  updateTestRun(id: string, updates: Partial<TestRun>) {
    const index = this.state.testRuns.findIndex(run => run.id === id)
    if (index !== -1) {
      this.state.testRuns[index] = { ...this.state.testRuns[index], ...updates }
      this.notify()
    }
  }

  setActiveTest(id: string | null) {
    this.state.activeTestId = id
    this.notify()
  }

  addResult(testId: string, result: RequestResult) {
    if (!this.state.results[testId]) {
      this.state.results[testId] = []
    }
    this.state.results[testId].push(result)
    this.updateMetrics(testId)
    this.notify()
  }

  private updateMetrics(testId: string) {
    const results = this.state.results[testId] || []
    if (results.length === 0) return

    const successful = results.filter(r => r.success)
    const failed = results.filter(r => !r.success)
    const durations = results.map(r => r.duration)
    
    durations.sort((a, b) => a - b)
    
    const now = Date.now()
    const recentResults = results.filter(r => now - r.timestamp < 1000)
    const currentRPS = recentResults.length

    const errorsByType: Record<string, number> = {}
    failed.forEach(result => {
      const errorType = result.error || 'Unknown Error'
      errorsByType[errorType] = (errorsByType[errorType] || 0) + 1
    })

    const metrics: TestMetrics = {
      totalRequests: results.length,
      successfulRequests: successful.length,
      failedRequests: failed.length,
      averageResponseTime: durations.reduce((sum, d) => sum + d, 0) / durations.length,
      p50: this.percentile(durations, 50),
      p90: this.percentile(durations, 90),
      p95: this.percentile(durations, 95),
      p99: this.percentile(durations, 99),
      maxResponseTime: Math.max(...durations),
      minResponseTime: Math.min(...durations),
      currentRPS,
      totalDuration: results.length > 0 ? results[results.length - 1].timestamp - results[0].timestamp : 0,
      errorsByType
    }

    this.state.metrics[testId] = metrics
  }

  private percentile(sorted: number[], p: number): number {
    const index = Math.floor((p / 100) * sorted.length)
    return sorted[index] || 0
  }

  updateConfigs(configs: StressTestConfig[]) {
    this.state.configs = configs
    this.notify()
  }

  clearResults(testId: string) {
    delete this.state.results[testId]
    delete this.state.metrics[testId]
    this.notify()
  }
}

export const stressTestStore = new StressTestStore()