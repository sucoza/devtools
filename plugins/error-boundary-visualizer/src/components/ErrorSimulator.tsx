import React, { useState } from 'react'
import { useErrorBoundaryDevTools } from '../core/store'
import type { ErrorSimulation } from '../types'
import { ErrorCategory } from '../types'

export const ErrorSimulator: React.FC = () => {
  const { 
    simulations, 
    addSimulation, 
    removeSimulation, 
    runSimulation, 
    componentTree,
    config 
  } = useErrorBoundaryDevTools()
  
  const [isCreating, setIsCreating] = useState(false)
  const [newSimulation, setNewSimulation] = useState<Partial<ErrorSimulation>>({
    name: '',
    description: '',
    errorType: ErrorCategory.RENDER,
    errorMessage: '',
    triggerCondition: 'immediate',
    delay: 1000,
  })

  const theme = config.theme === 'auto' 
    ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : config.theme

  const predefinedScenarios: Partial<ErrorSimulation>[] = [
    {
      name: 'Render Error',
      description: 'Simulates a component render error',
      errorType: ErrorCategory.RENDER,
      errorMessage: 'Cannot read property \'undefined\' of undefined',
      triggerCondition: 'immediate',
    },
    {
      name: 'Async Error',
      description: 'Simulates an async operation failure',
      errorType: ErrorCategory.ASYNC,
      errorMessage: 'Promise rejected: Network request failed',
      triggerCondition: 'delayed',
      delay: 2000,
    },
    {
      name: 'Network Error',
      description: 'Simulates a network request failure',
      errorType: ErrorCategory.NETWORK,
      errorMessage: 'Failed to fetch: 500 Internal Server Error',
      triggerCondition: 'immediate',
    },
    {
      name: 'Event Handler Error',
      description: 'Simulates an error in event handling',
      errorType: ErrorCategory.EVENT_HANDLER,
      errorMessage: 'TypeError: Cannot call method on null object',
      triggerCondition: 'conditional',
    },
    {
      name: 'Lifecycle Error',
      description: 'Simulates an error in component lifecycle',
      errorType: ErrorCategory.LIFECYCLE,
      errorMessage: 'Error in componentDidMount: State update on unmounted component',
      triggerCondition: 'immediate',
    },
  ]

  const availableComponents = React.useMemo(() => {
    const components: string[] = []
    
    const traverse = (node: any) => {
      if (node?.name && !components.includes(node.name)) {
        components.push(node.name)
      }
      if (node?.children) {
        node.children.forEach(traverse)
      }
    }
    
    if (componentTree) {
      traverse(componentTree)
    }
    
    return components
  }, [componentTree])

  const handleCreateSimulation = () => {
    if (!newSimulation.name || !newSimulation.errorMessage) return

    const simulation: ErrorSimulation = {
      id: `sim-${Date.now()}`,
      name: newSimulation.name,
      description: newSimulation.description || '',
      targetComponent: newSimulation.targetComponent,
      errorType: newSimulation.errorType || ErrorCategory.RENDER,
      errorMessage: newSimulation.errorMessage,
      triggerCondition: newSimulation.triggerCondition || 'immediate',
      delay: newSimulation.delay,
      condition: newSimulation.condition,
    }

    addSimulation(simulation)
    setNewSimulation({
      name: '',
      description: '',
      errorType: ErrorCategory.RENDER,
      errorMessage: '',
      triggerCondition: 'immediate',
      delay: 1000,
    })
    setIsCreating(false)
  }

  const handleLoadScenario = (scenario: Partial<ErrorSimulation>) => {
    setNewSimulation(scenario)
    setIsCreating(true)
  }

  const handleRunSimulation = (simulationId: string) => {
    const simulation = simulations.find(s => s.id === simulationId)
    if (!simulation) return

    // In a real implementation, this would actually trigger the error
    // For now, we'll use the simulation system

    // This would be handled by the actual simulation system
    runSimulation(simulationId)
  }

  const containerStyles: React.CSSProperties = {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  }

  const headerStyles: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  }

  const buttonStyles: React.CSSProperties = {
    padding: '8px 16px',
    border: 'none',
    borderRadius: '4px',
    backgroundColor: theme === 'dark' ? '#007acc' : '#007acc',
    color: '#ffffff',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  }

  const secondaryButtonStyles: React.CSSProperties = {
    ...buttonStyles,
    backgroundColor: 'transparent',
    color: theme === 'dark' ? '#ffffff' : '#333333',
    border: `1px solid ${theme === 'dark' ? '#444' : '#ccc'}`,
  }

  const inputStyles: React.CSSProperties = {
    padding: '8px 12px',
    border: `1px solid ${theme === 'dark' ? '#444' : '#ccc'}`,
    borderRadius: '4px',
    backgroundColor: theme === 'dark' ? '#2d2d2d' : '#ffffff',
    color: theme === 'dark' ? '#ffffff' : '#333333',
    fontSize: '14px',
    width: '100%',
  }

  const selectStyles: React.CSSProperties = {
    ...inputStyles,
  }

  const textareaStyles: React.CSSProperties = {
    ...inputStyles,
    minHeight: '80px',
    resize: 'vertical',
    fontFamily: 'inherit',
  }

  const cardStyles: React.CSSProperties = {
    padding: '16px',
    backgroundColor: theme === 'dark' ? '#252525' : '#f8f9fa',
    border: `1px solid ${theme === 'dark' ? '#444' : '#ccc'}`,
    borderRadius: '6px',
    marginBottom: '12px',
  }

  const formStyles: React.CSSProperties = {
    ...cardStyles,
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  }

  const gridStyles: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '12px',
  }

  const scenarioCardStyles: React.CSSProperties = {
    ...cardStyles,
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  }

  const simulationItemStyles: React.CSSProperties = {
    ...cardStyles,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  }

  const badgeStyles = (_type: string): React.CSSProperties => ({
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: 'bold',
    backgroundColor: theme === 'dark' ? '#444' : '#e0e0e0',
    color: theme === 'dark' ? '#fff' : '#666',
    marginRight: '8px',
  })

  return (
    <div style={containerStyles}>
      <div style={headerStyles}>
        <h3 style={{ margin: 0, color: theme === 'dark' ? '#ffffff' : '#333333' }}>
          Error Simulator
        </h3>
        <button
          style={buttonStyles}
          onClick={() => setIsCreating(!isCreating)}
        >
          {isCreating ? 'Cancel' : 'Create Simulation'}
        </button>
      </div>

      {isCreating && (
        <div style={formStyles}>
          <h4 style={{ margin: '0 0 8px 0', color: theme === 'dark' ? '#ffffff' : '#333333' }}>
            Create New Simulation
          </h4>
          
          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: 'bold' }}>
              Name
            </label>
            <input
              type="text"
              value={newSimulation.name || ''}
              onChange={(e) => setNewSimulation({ ...newSimulation, name: e.target.value })}
              placeholder="Enter simulation name..."
              style={inputStyles}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: 'bold' }}>
              Description
            </label>
            <textarea
              value={newSimulation.description || ''}
              onChange={(e) => setNewSimulation({ ...newSimulation, description: e.target.value })}
              placeholder="Describe what this simulation tests..."
              style={textareaStyles}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: 'bold' }}>
                Error Type
              </label>
              <select
                value={newSimulation.errorType}
                onChange={(e) => setNewSimulation({ ...newSimulation, errorType: e.target.value as ErrorCategory })}
                style={selectStyles}
              >
                {Object.values(ErrorCategory).map(category => (
                  <option key={category} value={category}>
                    {category.replace('_', ' ').toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: 'bold' }}>
                Target Component
              </label>
              <select
                value={newSimulation.targetComponent || ''}
                onChange={(e) => setNewSimulation({ ...newSimulation, targetComponent: e.target.value || undefined })}
                style={selectStyles}
              >
                <option value="">Any Component</option>
                {availableComponents.map(component => (
                  <option key={component} value={component}>
                    {component}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: 'bold' }}>
              Error Message
            </label>
            <textarea
              value={newSimulation.errorMessage || ''}
              onChange={(e) => setNewSimulation({ ...newSimulation, errorMessage: e.target.value })}
              placeholder="Enter the error message to simulate..."
              style={textareaStyles}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: 'bold' }}>
                Trigger Condition
              </label>
              <select
                value={newSimulation.triggerCondition}
                onChange={(e) => setNewSimulation({ ...newSimulation, triggerCondition: e.target.value as any })}
                style={selectStyles}
              >
                <option value="immediate">Immediate</option>
                <option value="delayed">Delayed</option>
                <option value="conditional">Conditional</option>
              </select>
            </div>

            {newSimulation.triggerCondition === 'delayed' && (
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: 'bold' }}>
                  Delay (ms)
                </label>
                <input
                  type="number"
                  value={newSimulation.delay || 1000}
                  onChange={(e) => setNewSimulation({ ...newSimulation, delay: parseInt(e.target.value) })}
                  style={inputStyles}
                />
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button style={secondaryButtonStyles} onClick={() => setIsCreating(false)}>
              Cancel
            </button>
            <button style={buttonStyles} onClick={handleCreateSimulation}>
              Create Simulation
            </button>
          </div>
        </div>
      )}

      {!isCreating && (
        <>
          <div>
            <h4 style={{ margin: '0 0 12px 0', color: theme === 'dark' ? '#ffffff' : '#333333' }}>
              Predefined Scenarios
            </h4>
            <div style={gridStyles}>
              {predefinedScenarios.map((scenario, index) => (
                <div
                  key={index}
                  style={scenarioCardStyles}
                  onClick={() => handleLoadScenario(scenario)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = theme === 'dark' ? '#2d2d2d' : '#f0f0f0'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = theme === 'dark' ? '#252525' : '#f8f9fa'
                  }}
                >
                  <div>
                    <h5 style={{ margin: '0 0 8px 0', color: theme === 'dark' ? '#ffffff' : '#333333' }}>
                      {scenario.name}
                    </h5>
                    <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: theme === 'dark' ? '#ccc' : '#666' }}>
                      {scenario.description}
                    </p>
                    <div>
                      <span style={badgeStyles('type')}>
                        {scenario.errorType?.replace('_', ' ')}
                      </span>
                      <span style={badgeStyles('trigger')}>
                        {scenario.triggerCondition}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 style={{ margin: '0 0 12px 0', color: theme === 'dark' ? '#ffffff' : '#333333' }}>
              Active Simulations ({simulations.length})
            </h4>
            {simulations.length === 0 ? (
              <div style={{ 
                ...cardStyles, 
                textAlign: 'center', 
                color: theme === 'dark' ? '#999' : '#666' 
              }}>
                No active simulations. Create a new simulation or load a predefined scenario.
              </div>
            ) : (
              simulations.map((simulation) => (
                <div key={simulation.id} style={simulationItemStyles}>
                  <div style={{ flex: 1 }}>
                    <h5 style={{ margin: '0 0 8px 0', color: theme === 'dark' ? '#ffffff' : '#333333' }}>
                      {simulation.name}
                    </h5>
                    <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: theme === 'dark' ? '#ccc' : '#666' }}>
                      {simulation.description}
                    </p>
                    <div style={{ fontSize: '12px', color: theme === 'dark' ? '#999' : '#777' }}>
                      <div>Type: {simulation.errorType.replace('_', ' ')}</div>
                      <div>Trigger: {simulation.triggerCondition}</div>
                      {simulation.targetComponent && (
                        <div>Target: {simulation.targetComponent}</div>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      style={buttonStyles}
                      onClick={() => handleRunSimulation(simulation.id)}
                    >
                      Run
                    </button>
                    <button
                      style={secondaryButtonStyles}
                      onClick={() => removeSimulation(simulation.id)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  )
}