import React, { useState } from 'react'
import { 
  PluginPanel
} from '@sucoza/shared-components'
import type { PluginTab, PluginAction } from '@sucoza/shared-components'
import { Download, RotateCcw, Play, Settings, Trash2, AlertTriangle } from 'lucide-react'
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

  const toolbarActions: PluginAction[] = [
    {
      id: 'clear',
      label: 'Clear Errors',
      icon: Trash2,
      onClick: clearErrors,
      variant: 'default'
    },
    {
      id: 'export',
      label: 'Export Errors',
      icon: Download,
      onClick: handleExport,
      variant: 'default'
    },
    {
      id: 'recording',
      label: isRecording ? 'Stop Recording' : 'Start Recording',
      icon: isRecording ? RotateCcw : Play,
      onClick: handleToggleRecording,
      variant: isRecording ? 'primary' : 'default'
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
      <PluginPanel
        title="Error Boundary DevTools"
        tabs={tabs}
        activeTabId={activeTab}
        onTabChange={setActiveTab}
        actions={toolbarActions}
      />
    </>
  )
}