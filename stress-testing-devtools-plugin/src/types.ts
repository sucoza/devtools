export interface StressTestConfig {
  name: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  path: string
  inputParams: Record<string, any>
  test: string  // Legacy simple validation - kept for backwards compatibility
  headers?: Record<string, string>
  validationRules?: ValidationRule[]  // New advanced validation rules
}

export interface ValidationRule {
  id: string
  name: string
  type: 'status' | 'header' | 'body' | 'responseTime' | 'size' | 'custom'
  operator: 'equals' | 'notEquals' | 'contains' | 'notContains' | 'greaterThan' | 'lessThan' | 'greaterThanOrEqual' | 'lessThanOrEqual' | 'exists' | 'notExists' | 'regex' | 'jsonPath' | 'custom'
  target?: string  // For header names, JSON paths, etc.
  expectedValue?: any
  customCode?: string  // For custom validation logic
  enabled: boolean
}

export interface TestRun {
  id: string
  name: string
  startTime: number
  endTime?: number
  type: 'fixed' | 'timed'
  status: 'running' | 'completed' | 'stopped' | 'failed'
  config: {
    requests: StressTestConfig[]
    count?: number
    concurrency?: number
    duration?: number
    ratePerSecond?: number
  }
}

export interface RequestResult {
  configName: string
  duration: number
  timestamp: number
  success: boolean
  statusCode?: number
  error?: string
  responseSize?: number
}

export interface TestMetrics {
  totalRequests: number
  successfulRequests: number
  failedRequests: number
  averageResponseTime: number
  p50: number
  p90: number
  p95: number
  p99: number
  maxResponseTime: number
  minResponseTime: number
  currentRPS: number
  totalDuration: number
  errorsByType: Record<string, number>
}

export interface StressTestState {
  testRuns: TestRun[]
  activeTestId: string | null
  results: Record<string, RequestResult[]>
  metrics: Record<string, TestMetrics>
  configs: StressTestConfig[]
}

export interface AuthContext {
  tenantId: string | null
  regionId: string | null
  jwtToken: string | null
  xsrfToken: string | null
}