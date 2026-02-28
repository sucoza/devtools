import React, { useState, useMemo } from 'react'
import { Trans } from '@lingui/macro'
import {
  PluginPanel,
  ConfigMenu,
  ThemeProvider,
  type ConfigMenuItem
} from '@sucoza/shared-components'
import '@sucoza/shared-components/dist/styles/theme.css'
import type { PluginTab } from '@sucoza/shared-components'
import { Play, Settings, AlertTriangle } from 'lucide-react'
import { useErrorBoundaryDevTools } from '../core/store'
import { ComponentTreeView } from './ComponentTreeView'
import { ErrorList } from './ErrorList'
import { ErrorAnalytics } from './ErrorAnalytics'
import { ErrorSimulator } from './ErrorSimulator'
import { RecoveryStrategyEditor } from './RecoveryStrategyEditor'


interface ErrorBoundaryDevToolsPanelProps {
  theme?: 'light' | 'dark' | 'auto'
}

function ErrorBoundaryDevToolsPanelInner() {
  const { 
    errorBoundaries: _errorBoundaries,
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
      label: <Trans>Errors</Trans>,
      icon: AlertTriangle,
      content: <ErrorList />
    },
    {
      id: 'tree',
      label: <Trans>Component Tree</Trans>,
      content: <ComponentTreeView />
    },
    {
      id: 'analytics',
      label: <Trans>Analytics</Trans>,
      content: <ErrorAnalytics />
    },
    {
      id: 'simulator',
      label: <Trans>Simulator</Trans>,
      icon: Play,
      content: <ErrorSimulator />
    },
    {
      id: 'recovery',
      label: <Trans>Recovery</Trans>,
      icon: Settings,
      content: <RecoveryStrategyEditor />
    },
  ]

  const configMenuItems: ConfigMenuItem[] = [
    {
      id: 'recording',
      label: isRecording ? <Trans>Stop Recording</Trans> : <Trans>Start Recording</Trans>,
      icon: isRecording ? '⏸️' : '▶️',
      onClick: handleToggleRecording,
      shortcut: 'Ctrl+R'
    },
    {
      id: 'clear',
      label: <Trans>Clear Errors</Trans>,
      icon: '🗑️',
      onClick: clearErrors,
      shortcut: 'Ctrl+K',
      separator: true
    },
    {
      id: 'export',
      label: <Trans>Export Error Data</Trans>,
      icon: '💾',
      onClick: handleExport,
      shortcut: 'Ctrl+E'
    },
    {
      id: 'settings',
      label: <Trans>Settings</Trans>,
      icon: '⚙️',
      onClick: () => console.log('Settings clicked'),
      separator: true
    }
  ]

  return (
    <>

      <div style={{ position: 'relative', height: '100%' }}>
        <PluginPanel
          title={<Trans>Error Boundary DevTools</Trans>}
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

export function ErrorBoundaryDevToolsPanel(props: ErrorBoundaryDevToolsPanelProps = {}) {
  const { theme = 'auto' } = props

  const resolvedTheme = useMemo(() => {
    if (theme === 'auto') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
    return theme
  }, [theme])

  return (
    <ThemeProvider defaultTheme={resolvedTheme}>
      <ErrorBoundaryDevToolsPanelInner />
    </ThemeProvider>
  )
}