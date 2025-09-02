import React, { useState } from 'react'
import { useErrorBoundaryDevTools } from '../core/store'
import { ComponentTreeView } from './ComponentTreeView'
import { ErrorList } from './ErrorList'
import { ErrorAnalytics } from './ErrorAnalytics'
import { ErrorSimulator } from './ErrorSimulator'
import { RecoveryStrategyEditor } from './RecoveryStrategyEditor'

interface TabConfig {
  id: string
  label: string
  component: React.ComponentType
  icon?: string
}

const tabs: TabConfig[] = [
  { id: 'errors', label: 'Errors', component: ErrorList, icon: '⚠️' },
  { id: 'tree', label: 'Component Tree', component: ComponentTreeView, icon: '🌳' },
  { id: 'analytics', label: 'Analytics', component: ErrorAnalytics, icon: '📊' },
  { id: 'simulator', label: 'Simulator', component: ErrorSimulator, icon: '🧪' },
  { id: 'recovery', label: 'Recovery', component: RecoveryStrategyEditor, icon: '🔧' },
]

export const ErrorBoundaryDevToolsPanel: React.FC = () => {
  const { errors, errorBoundaries, isRecording } = useErrorBoundaryDevTools()
  const [activeTab, setActiveTab] = useState('errors')

  const ActiveTabComponent = tabs.find(tab => tab.id === activeTab)?.component || ErrorList

  const panelStyles: React.CSSProperties = {
    height: '100%',
    width: '100%',
    backgroundColor: '#1e1e1e',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    fontSize: '14px',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  }

  const headerStyles: React.CSSProperties = {
    padding: '8px 12px',
    backgroundColor: '#2d2d2d',
    borderBottom: '1px solid #333',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    userSelect: 'none',
    flexShrink: 0,
  }

  const tabsStyles: React.CSSProperties = {
    display: 'flex',
    backgroundColor: '#252525',
    borderBottom: '1px solid #333',
    flexShrink: 0,
  }

  const tabStyle = (isActive: boolean): React.CSSProperties => ({
    padding: '8px 16px',
    cursor: 'pointer',
    backgroundColor: isActive ? '#1e1e1e' : 'transparent',
    borderBottom: isActive ? '2px solid #007acc' : 'none',
    color: '#d4d4d4',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  })

  const contentStyles: React.CSSProperties = {
    flex: 1,
    overflow: 'auto',
    padding: '16px',
    backgroundColor: '#1e1e1e',
    color: '#d4d4d4',
  }

  const statusIndicatorStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    fontSize: '12px',
    color: '#999',
  }

  const recordingDotStyles: React.CSSProperties = {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: isRecording ? '#ff4444' : '#666',
    animation: isRecording ? 'pulse 1.5s infinite' : 'none',
  }

  return (
    <>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
      <div style={panelStyles}>
        <div style={headerStyles}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ fontWeight: 'bold', color: '#007acc' }}>
              Error Boundary DevTools
            </div>
            <div style={statusIndicatorStyles}>
              <div style={recordingDotStyles}></div>
              <span>{errors.length} errors</span>
              <span>{errorBoundaries.size} boundaries</span>
            </div>
          </div>
        </div>

        <div style={tabsStyles}>
          {tabs.map((tab) => (
            <div
              key={tab.id}
              style={tabStyle(activeTab === tab.id)}
              onClick={() => setActiveTab(tab.id)}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </div>
          ))}
        </div>

        <div style={contentStyles}>
          <ActiveTabComponent />
        </div>
      </div>
    </>
  )
}