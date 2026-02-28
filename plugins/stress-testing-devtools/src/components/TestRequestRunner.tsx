import React, { useState } from 'react'
import { StressTestConfig } from '../types'
import { ValidationEngine, ValidationRule } from '../utils/validation-engine'
import { StressTestRunner } from '../stress-runner'

interface TestRequestRunnerProps {
  config: StressTestConfig
  onValidationRulesGenerated: (rules: ValidationRule[]) => void
  onConfigUpdate: (config: StressTestConfig) => void
}

interface TestResult {
  success: boolean
  status: number
  headers: Record<string, string>
  response: any
  responseTime: number
  responseSize: number
  validationResult?: any
  error?: string
}

export const TestRequestRunner: React.FC<TestRequestRunnerProps> = ({
  config,
  onValidationRulesGenerated,
  onConfigUpdate: _onConfigUpdate
}) => {
  const [testResult, setTestResult] = useState<TestResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const runTestRequest = async () => {
    setIsLoading(true)
    setTestResult(null)

    try {
      const runner = new StressTestRunner(() => {})
      await runner.fetchUserInfo()

      // Execute single request
      const startTime = performance.now()
      const result = await runner.executeRequest(config)
      const endTime = performance.now()

      if (result.success) {
        // For successful requests, we need to fetch the actual response
        // Since executeRequest doesn't return the full response, we'll make the request again
        const headers = runner['getHeaders']() // Access private method
        const body = config.method !== 'GET' ? JSON.stringify(runner['substituteTokens'](config.inputParams)) : null
        
        const response = await fetch(`${location.origin}${config.path}`, {
          method: config.method,
          headers: { ...headers, ...config.headers },
          body
        })

        const responseHeaders: Record<string, string> = {}
        response.headers.forEach((value, key) => {
          responseHeaders[key] = value
        })

        let responseData: any
        const contentType = response.headers.get('content-type') || ''
        
        if (contentType.includes('json')) {
          responseData = await response.json()
        } else {
          responseData = await response.text()
        }

        const responseSize = JSON.stringify(responseData).length
        const responseTime = endTime - startTime

        // Run validation if rules exist
        let validationResult
        if (config.validationRules && config.validationRules.length > 0) {
          validationResult = ValidationEngine.validateResponse(
            responseData,
            response.status,
            responseHeaders,
            responseTime,
            responseSize,
            config.validationRules
          )
        }

        setTestResult({
          success: true,
          status: response.status,
          headers: responseHeaders,
          response: responseData,
          responseTime,
          responseSize,
          validationResult
        })

      } else {
        setTestResult({
          success: false,
          status: result.statusCode || 0,
          headers: {},
          response: null,
          responseTime: result.duration,
          responseSize: 0,
          error: result.error
        })
      }
    } catch (error: any) {
      setTestResult({
        success: false,
        status: 0,
        headers: {},
        response: null,
        responseTime: 0,
        responseSize: 0,
        error: error.message
      })
    } finally {
      setIsLoading(false)
    }
  }

  const generateValidationRules = () => {
    if (testResult && testResult.success) {
      const suggestedRules = ValidationEngine.generateSuggestedRules(
        testResult.response,
        testResult.status,
        testResult.headers
      )
      onValidationRulesGenerated(suggestedRules)
    }
  }

  const copyAsJson = () => {
    if (testResult) {
      navigator.clipboard.writeText(JSON.stringify(testResult.response, null, 2)).catch(() => {})
    }
  }

  const copyHeaders = () => {
    if (testResult) {
      navigator.clipboard.writeText(JSON.stringify(testResult.headers, null, 2)).catch(() => {})
    }
  }

  return (
    <div className="test-request-runner">
      <div className="test-runner-header">
        <h4>Test Single Request</h4>
        <div className="test-actions">
          <button
            onClick={runTestRequest}
            disabled={isLoading}
            className="btn-primary test-btn"
          >
            {isLoading ? 'Testing...' : '🧪 Test Request'}
          </button>
        </div>
      </div>

      {testResult && (
        <div className="test-results">
          <div className="result-summary">
            <div className={`status-indicator ${testResult.success ? 'success' : 'error'}`}>
              <span className="status-code">{testResult.status}</span>
              <span className="status-text">
                {testResult.success ? 'Success' : 'Failed'}
              </span>
              <span className="response-time">{testResult.responseTime.toFixed(1)}ms</span>
            </div>
            
            <div className="result-actions">
              {testResult.success && (
                <>
                  <button onClick={generateValidationRules} className="btn-secondary">
                    ✨ Generate Rules
                  </button>
                  <button onClick={copyAsJson} className="btn-secondary">
                    📋 Copy Response
                  </button>
                  <button onClick={copyHeaders} className="btn-secondary">
                    📋 Copy Headers
                  </button>
                </>
              )}
            </div>
          </div>

          {testResult.error && (
            <div className="error-details">
              <h5>Error Details</h5>
              <pre className="error-text">{testResult.error}</pre>
            </div>
          )}

          {testResult.success && (
            <>
              <div className="response-headers">
                <h5>Response Headers</h5>
                <div className="headers-grid">
                  {Object.entries(testResult.headers).map(([key, value]) => (
                    <div key={key} className="header-row">
                      <span className="header-key">{key}:</span>
                      <span className="header-value">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="response-body">
                <h5>Response Body</h5>
                <pre className="response-json">
                  {typeof testResult.response === 'object'
                    ? JSON.stringify(testResult.response, null, 2)
                    : testResult.response
                  }
                </pre>
              </div>

              {testResult.validationResult && (
                <div className="validation-results">
                  <h5>
                    Validation Results
                    <span className={`validation-status ${testResult.validationResult.passed ? 'passed' : 'failed'}`}>
                      {testResult.validationResult.passed ? '✅ Passed' : '❌ Failed'}
                    </span>
                  </h5>
                  <div className="validation-list">
                    {testResult.validationResult.results.map((result: any, index: number) => (
                      <div key={index} className={`validation-item ${result.passed ? 'passed' : 'failed'}`}>
                        <div className="validation-name">
                          <span className={`validation-icon ${result.passed ? 'success' : 'error'}`}>
                            {result.passed ? '✓' : '✗'}
                          </span>
                          {result.ruleName}
                        </div>
                        {result.error && (
                          <div className="validation-error">{result.error}</div>
                        )}
                        {result.actualValue !== undefined && (
                          <div className="validation-values">
                            <span>Expected: {JSON.stringify(result.expectedValue)}</span>
                            <span>Actual: {JSON.stringify(result.actualValue)}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}