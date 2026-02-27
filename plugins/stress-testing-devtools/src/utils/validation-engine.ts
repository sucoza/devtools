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

export interface ValidationResult {
  ruleId: string
  ruleName: string
  passed: boolean
  actualValue?: any
  expectedValue?: any
  error?: string
}

export interface RequestValidationResult {
  passed: boolean
  results: ValidationResult[]
  executionTime: number
}

export class ValidationEngine {
  static validateResponse(
    response: any,
    status: number,
    headers: Record<string, string>,
    responseTime: number,
    responseSize: number,
    rules: ValidationRule[]
  ): RequestValidationResult {
    const startTime = performance.now()
    const results: ValidationResult[] = []
    
    for (const rule of rules.filter(r => r.enabled)) {
      try {
        const result = this.validateRule(response, status, headers, responseTime, responseSize, rule)
        results.push(result)
      } catch (error: any) {
        results.push({
          ruleId: rule.id,
          ruleName: rule.name,
          passed: false,
          error: error.message || 'Validation error'
        })
      }
    }
    
    const executionTime = performance.now() - startTime
    const passed = results.every(r => r.passed)
    
    return {
      passed,
      results,
      executionTime
    }
  }
  
  private static validateRule(
    response: any,
    status: number,
    headers: Record<string, string>,
    responseTime: number,
    responseSize: number,
    rule: ValidationRule
  ): ValidationResult {
    let actualValue: any
    let passed = false
    
    // Get the actual value based on rule type
    switch (rule.type) {
      case 'status':
        actualValue = status
        break
        
      case 'header':
        actualValue = headers[rule.target || '']
        break
        
      case 'body':
        actualValue = response
        break
        
      case 'responseTime':
        actualValue = responseTime
        break
        
      case 'size':
        actualValue = responseSize
        break
        
      case 'custom':
        return this.executeCustomValidation(response, status, headers, responseTime, responseSize, rule)
    }
    
    // Apply the operator
    switch (rule.operator) {
      case 'equals':
        passed = String(actualValue) === String(rule.expectedValue)
        break

      case 'notEquals':
        passed = String(actualValue) !== String(rule.expectedValue)
        break
        
      case 'contains':
        if (typeof actualValue === 'string') {
          passed = actualValue.includes(rule.expectedValue)
        } else if (Array.isArray(actualValue)) {
          passed = actualValue.includes(rule.expectedValue)
        } else if (typeof actualValue === 'object' && actualValue !== null) {
          passed = JSON.stringify(actualValue).includes(rule.expectedValue)
        }
        break
        
      case 'notContains':
        if (typeof actualValue === 'string') {
          passed = !actualValue.includes(rule.expectedValue)
        } else if (Array.isArray(actualValue)) {
          passed = !actualValue.includes(rule.expectedValue)
        } else if (typeof actualValue === 'object' && actualValue !== null) {
          passed = !JSON.stringify(actualValue).includes(rule.expectedValue)
        }
        break
        
      case 'greaterThan':
        passed = Number(actualValue) > Number(rule.expectedValue)
        break
        
      case 'lessThan':
        passed = Number(actualValue) < Number(rule.expectedValue)
        break
        
      case 'greaterThanOrEqual':
        passed = Number(actualValue) >= Number(rule.expectedValue)
        break
        
      case 'lessThanOrEqual':
        passed = Number(actualValue) <= Number(rule.expectedValue)
        break
        
      case 'exists':
        passed = actualValue !== undefined && actualValue !== null
        break
        
      case 'notExists':
        passed = actualValue === undefined || actualValue === null
        break
        
      case 'regex':
        if (typeof actualValue === 'string') {
          const regex = new RegExp(rule.expectedValue, 'i')
          passed = regex.test(actualValue)
        }
        break
        
      case 'jsonPath':
        try {
          const value = this.getJsonPath(response, rule.target || '')
          passed = String(value) === String(rule.expectedValue)
          actualValue = value
        } catch (error: any) {
          throw new Error(`JSONPath error: ${error.message}`)
        }
        break
        
      case 'custom':
        return this.executeCustomValidation(response, status, headers, responseTime, responseSize, rule)
    }
    
    return {
      ruleId: rule.id,
      ruleName: rule.name,
      passed,
      actualValue,
      expectedValue: rule.expectedValue
    }
  }
  
  private static executeCustomValidation(
    response: any,
    status: number,
    headers: Record<string, string>,
    responseTime: number,
    responseSize: number,
    rule: ValidationRule
  ): ValidationResult {
    try {
      // Create a safe execution context
      const context = {
        response,
        status,
        headers,
        responseTime,
        responseSize,
        // Utility functions
        JSON,
        Array,
        Object,
        Math,
        Date,
        RegExp
      }
      
      // Create function from custom code
      const func = new Function(
        'response', 'status', 'headers', 'responseTime', 'responseSize',
        'JSON', 'Array', 'Object', 'Math', 'Date', 'RegExp',
        `
        try {
          ${rule.customCode}
        } catch (error) {
          return { passed: false, error: error.message };
        }
        `
      )
      
      const result = func(
        context.response,
        context.status,
        context.headers,
        context.responseTime,
        context.responseSize,
        context.JSON,
        context.Array,
        context.Object,
        context.Math,
        context.Date,
        context.RegExp
      )
      
      if (typeof result === 'boolean') {
        return {
          ruleId: rule.id,
          ruleName: rule.name,
          passed: result
        }
      } else if (typeof result === 'object' && result !== null) {
        return {
          ruleId: rule.id,
          ruleName: rule.name,
          passed: result.passed || false,
          actualValue: result.actualValue,
          error: result.error
        }
      } else {
        return {
          ruleId: rule.id,
          ruleName: rule.name,
          passed: !!result
        }
      }
    } catch (error: any) {
      return {
        ruleId: rule.id,
        ruleName: rule.name,
        passed: false,
        error: error.message || 'Custom validation failed'
      }
    }
  }
  
  private static getJsonPath(obj: any, path: string): any {
    // Simple JSONPath implementation for common cases
    if (!path || path === '$') return obj
    
    // Remove leading $ if present
    const cleanPath = path.replace(/^\$\.?/, '')
    
    // Split path and navigate
    const parts = cleanPath.split('.')
    let current = obj
    
    for (const part of parts) {
      if (current === null || current === undefined) {
        return undefined
      }
      
      // Handle array indices
      if (part.includes('[') && part.includes(']')) {
        const [key, indexStr] = part.split('[')
        const index = parseInt(indexStr.replace(']', ''), 10)
        
        if (key) {
          current = current[key]
        }
        
        if (Array.isArray(current) && !isNaN(index)) {
          current = current[index]
        } else {
          return undefined
        }
      } else {
        current = current[part]
      }
    }
    
    return current
  }
  
  /**
   * Generate common validation rules based on a sample response
   */
  static generateSuggestedRules(
    response: any,
    status: number,
    headers: Record<string, string>
  ): ValidationRule[] {
    const rules: ValidationRule[] = []
    
    // Status code rule
    rules.push({
      id: `status-${Date.now()}`,
      name: 'Status Code Success',
      type: 'status',
      operator: 'equals',
      expectedValue: status,
      enabled: true
    })
    
    // Content-Type header rule
    if (headers['content-type']) {
      rules.push({
        id: `header-content-type-${Date.now()}`,
        name: 'Content-Type Header',
        type: 'header',
        operator: 'equals',
        target: 'content-type',
        expectedValue: headers['content-type'],
        enabled: true
      })
    }
    
    // Response structure rules for JSON
    if (typeof response === 'object' && response !== null) {
      // Check for common success indicators
      if ('success' in response) {
        rules.push({
          id: `body-success-${Date.now()}`,
          name: 'Response Success Flag',
          type: 'body',
          operator: 'jsonPath',
          target: 'success',
          expectedValue: response.success,
          enabled: true
        })
      }
      
      if ('data' in response) {
        rules.push({
          id: `body-data-exists-${Date.now()}`,
          name: 'Data Field Exists',
          type: 'body',
          operator: 'jsonPath',
          target: 'data',
          expectedValue: undefined,
          enabled: true
        })
      }
      
      if ('error' in response) {
        rules.push({
          id: `body-no-error-${Date.now()}`,
          name: 'No Error Field',
          type: 'body',
          operator: 'jsonPath',
          target: 'error',
          expectedValue: null,
          enabled: false
        })
      }
      
      // Array length checks
      Object.keys(response).forEach(key => {
        if (Array.isArray(response[key])) {
          rules.push({
            id: `array-${key}-${Date.now()}`,
            name: `${key} Array Not Empty`,
            type: 'body',
            operator: 'custom',
            customCode: `return response.${key} && response.${key}.length > 0`,
            enabled: false
          })
        }
      })
    }
    
    // Response time rule
    rules.push({
      id: `response-time-${Date.now()}`,
      name: 'Response Time Under 2s',
      type: 'responseTime',
      operator: 'lessThan',
      expectedValue: 2000,
      enabled: false
    })
    
    return rules
  }
  
  /**
   * Create a default validation rule
   */
  static createDefaultRule(type: ValidationRule['type']): ValidationRule {
    const id = `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    const defaults: Record<ValidationRule['type'], Partial<ValidationRule>> = {
      status: {
        name: 'Status Code Check',
        operator: 'equals',
        expectedValue: 200
      },
      header: {
        name: 'Header Check',
        operator: 'exists',
        target: 'content-type'
      },
      body: {
        name: 'Body Field Check',
        operator: 'jsonPath',
        target: 'data'
      },
      responseTime: {
        name: 'Response Time Check',
        operator: 'lessThan',
        expectedValue: 1000
      },
      size: {
        name: 'Response Size Check',
        operator: 'greaterThan',
        expectedValue: 0
      },
      custom: {
        name: 'Custom Validation',
        operator: 'custom',
        customCode: 'return true; // Add your validation logic here'
      }
    }
    
    return {
      id,
      type,
      enabled: true,
      ...defaults[type]
    } as ValidationRule
  }
}