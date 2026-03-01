import { StressTestConfig, RequestResult, AuthContext } from './types'

export class StressTestRunner {
  private abortController: AbortController | null = null
  private authContext: AuthContext = {
    tenantId: null,
    regionId: null,
    jwtToken: null,
    xsrfToken: null
  }

  constructor(private onResult: (result: RequestResult) => void) {
    this.initializeAuth()
  }

  private initializeAuth() {
    // Extract JWT token from localStorage
    this.authContext.jwtToken = localStorage.getItem('jwtToken')
    
    // Extract XSRF token from cookies
    const xsrfCookie = document.cookie
      .split('; ')
      .find(row => row.startsWith('XSRF-TOKEN-WEBAPI='))
    
    if (xsrfCookie) {
      this.authContext.xsrfToken = xsrfCookie.split('=')[1]
    }
  }

  async fetchUserInfo(): Promise<boolean> {
    try {
      const headers = this.getHeaders()
      const response = await fetch(`${location.origin}/api/users/userInfo`, {
        headers
      })

      if (response.ok) {
        const userInfo = await response.json()
        this.authContext.tenantId = userInfo.tenantId
        this.authContext.regionId = userInfo.regionId
        return true
      }
    } catch (error) {
      console.error('Failed to fetch user info:', error)
    }
    return false
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    }

    if (this.authContext.jwtToken) {
      headers['Authorization'] = `Token ${this.authContext.jwtToken}`
    }

    if (this.authContext.xsrfToken) {
      headers['X-XSRF-TOKEN-WEBAPI'] = this.authContext.xsrfToken
    }

    return headers
  }

  private substituteTokens(obj: any): any {
    const str = JSON.stringify(obj)
    // Escape replacement values for safe insertion into JSON strings
    const escapeForJson = (value: string) =>
      value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    try {
      return JSON.parse(
        str
          .replace(/{{tenantId}}/g, escapeForJson(this.authContext.tenantId || ''))
          .replace(/{{regionId}}/g, escapeForJson(this.authContext.regionId || ''))
      )
    } catch (e) {
      console.warn('Token substitution produced invalid JSON, using original:', e);
      return obj;
    }
  }

  async executeRequest(config: StressTestConfig): Promise<RequestResult> {
    const startTime = performance.now()
    
    try {
      const headers = { ...this.getHeaders(), ...config.headers }
      const body = config.method !== 'GET' ? JSON.stringify(this.substituteTokens(config.inputParams)) : null
      
      const response = await fetch(`${location.origin}${config.path}`, {
        method: config.method,
        headers,
        body,
        signal: this.abortController?.signal
      })

      const duration = performance.now() - startTime
      const timestamp = Date.now()

      if (!response.ok) {
        return {
          configName: config.name,
          duration,
          timestamp,
          success: false,
          statusCode: response.status,
          error: `HTTP ${response.status}`
        }
      }

      // Parse response
      const contentType = response.headers.get('content-type') || ''
      let responseData: any
      
      if (contentType.includes('json')) {
        responseData = await response.json()
      } else {
        responseData = await response.text()
      }

      // Run test validation
      let testPassed = true
      try {
        // SECURITY NOTE: new Function() is used here to execute user-provided test
        // assertions in a devtools context. This is intentional for the stress-testing
        // tool, but the code runs with full page privileges. Only use with trusted input.
        if (typeof config.test !== 'string' || config.test.trim() === '') {
          testPassed = false
        } else {
          const testFunction = new Function('response', `return ${config.test}`)
          testPassed = testFunction(responseData)
        }
      } catch {
        testPassed = false
      }

      return {
        configName: config.name,
        duration,
        timestamp,
        success: testPassed,
        statusCode: response.status,
        responseSize: JSON.stringify(responseData).length
      }

    } catch (error: any) {
      const duration = performance.now() - startTime
      const timestamp = Date.now()

      return {
        configName: config.name,
        duration,
        timestamp,
        success: false,
        error: error.message || 'Unknown error'
      }
    }
  }

  async runFixedCountTest(
    configs: StressTestConfig[],
    count: number,
    concurrency: number
  ): Promise<void> {
    this.abortController = new AbortController()
    await this.fetchUserInfo()

    const queue = Array(count).fill(null).map(() => async () => {
      for (const config of configs) {
        if (this.abortController?.signal.aborted) return
        const result = await this.executeRequest(config)
        this.onResult(result)
      }
    })

    let active = 0
    let queueIndex = 0

    return new Promise((resolve) => {
      const processNext = () => {
        if (queueIndex >= queue.length && active === 0) {
          resolve()
          return
        }

        while (queueIndex < queue.length && active < concurrency) {
          active++
          const task = queue[queueIndex++]
          task().finally(() => {
            active--
            processNext()
          })
        }
      }

      processNext()
    })
  }

  async runTimedTest(
    configs: StressTestConfig[],
    durationMinutes: number,
    ratePerSecond: number
  ): Promise<void> {
    if (ratePerSecond <= 0) {
      throw new Error('Rate per second must be greater than 0')
    }
    this.abortController = new AbortController()
    await this.fetchUserInfo()

    const endTime = Date.now() + (durationMinutes * 60 * 1000)
    let configIndex = 0

    return new Promise((resolve) => {
      const interval = setInterval(async () => {
        try {
          if (Date.now() >= endTime || this.abortController?.signal.aborted) {
            clearInterval(interval)
            resolve()
            return
          }

          const config = configs[configIndex++ % configs.length]
          const result = await this.executeRequest(config)
          this.onResult(result)
        } catch {
          clearInterval(interval)
          resolve()
        }
      }, 1000 / ratePerSecond)
    })
  }

  stop() {
    if (this.abortController) {
      this.abortController.abort()
    }
  }
}