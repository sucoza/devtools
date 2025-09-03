import React, { useState } from 'react'
import { 
  PluginPanel,
  ConfigMenu,
  type ConfigMenuItem
} from '@sucoza/shared-components'
import type { PluginTab } from '@sucoza/shared-components'
import { Play, Settings, AlertTriangle } from 'lucide-react'
import { useErrorBoundaryDevTools } from '../core/store'
import { ComponentTreeView } from './ComponentTreeView'
import { ErrorList } from './ErrorList'
import { ErrorAnalytics } from './ErrorAnalytics'
import { ErrorSimulator } from './ErrorSimulator'
import { RecoveryStrategyEditor } from './RecoveryStrategyEditor'


export const ErrorBoundaryDevToolsPanel: React.FC = () => {
  const { 
    errorBoundaries, 
    isRecording, 
    clearErrors, 
    exportState,
    startRecording,
    stopRecording
  } = useErrorBoundaryDevTools()
  const [activeTab, setActiveTab] = useState('errors')


  const handleExport = () => {
    const data = exportState()
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `error-boundary-data-${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleToggleRecording = () => {
    if (isRecording) {
      stopRecording()
    } else {
      startRecording()
    }
  }


  const tabs: PluginTab[] = [
    { 
      id: 'errors', 
      label: 'Errors', 
      icon: AlertTriangle,
      content: <ErrorList />
    },
    { 
      id: 'tree', 
      label: 'Component Tree', 
      content: <ComponentTreeView />
    },
    { 
      id: 'analytics', 
      label: 'Analytics', 
      content: <ErrorAnalytics />
    },
    { 
      id: 'simulator', 
      label: 'Simulator', 
      icon: Play,
      content: <ErrorSimulator />
    },
    { 
      id: 'recovery', 
      label: 'Recovery', 
      icon: Settings,
      content: <RecoveryStrategyEditor />
    },
  ]

  const configMenuItems: ConfigMenuItem[] = [
    {
      id: 'recording',
      label: isRecording ? 'Stop Recording' : 'Start Recording',
      icon: isRecording ? '⏸️' : '▶️',
      onClick: handleToggleRecording,
      shortcut: 'Ctrl+R'
    },
    {
      id: 'clear',
      label: 'Clear Errors',
      icon: '🗑️',
      onClick: clearErrors,
      shortcut: 'Ctrl+K',
      separator: true
    },
    {
      id: 'export',
      label: 'Export Error Data',
      icon: '💾',
      onClick: handleExport,
      shortcut: 'Ctrl+E'
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: '⚙️',
      onClick: () => console.log('Settings clicked'),
      separator: true
    }
  ]

  return (
    <>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
      <div style={{ position: 'relative', height: '100%' }}>
        <PluginPanel
          title="Error Boundary DevTools"
          tabs={tabs}
          activeTabId={activeTab}
          onTabChange={setActiveTab}
        />
        
        <div style={{ position: 'absolute', top: '12px', right: '12px', zIndex: 10 }}>
          <ConfigMenu items={configMenuItems} size="sm" />
        </div>
      </div>
    </>
  )
}