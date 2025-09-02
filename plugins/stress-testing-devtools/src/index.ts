import React from 'react'
import { StressTestPanel } from './components/StressTestPanel'
import './styles.css'
import './styles-new-components.css'

export interface StressTestPluginConfig {
  // Plugin configuration options can be added here
  initialConfigs?: Array<{
    name: string
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
    path: string
    inputParams: Record<string, any>
    test: string
    headers?: Record<string, string>
  }>
}

export function createStressTestPlugin(config: StressTestPluginConfig = {}) {
  return {
    id: 'stress-testing',
    name: 'Stress Testing',
    description: 'API stress testing and performance monitoring',
    icon: '🔥',
    component: () => React.createElement(StressTestPanel),
    
    // Plugin lifecycle hooks
    onMount: () => {
      // Initialize plugin
      if (config.initialConfigs) {
        // Load initial configurations
        import('./store').then(({ stressTestStore }) => {
          if (config.initialConfigs) {
            stressTestStore.updateConfigs(config.initialConfigs)
          }
        })
      }
    },
    
    onUnmount: () => {
      // Cleanup plugin resources
      // console.log('Stress testing plugin unmounted')
    }
  }
}

// Export types for external use
export type { StressTestConfig, TestRun, RequestResult, TestMetrics, StressTestState } from './types'
export { stressTestStore } from './store'
export { StressTestRunner } from './stress-runner'

// Default export
export default createStressTestPlugin