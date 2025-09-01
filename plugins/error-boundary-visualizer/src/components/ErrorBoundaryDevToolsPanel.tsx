import React, { useState, useRef, useEffect, useCallback } from 'react'
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
  const { config, updateConfig, errors, errorBoundaries, isRecording } = useErrorBoundaryDevTools()
  const [activeTab, setActiveTab] = useState('errors')
  const [isMinimized, setIsMinimized] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [position, setPosition] = useState({ x: 20, y: 20 })
  const [size, setSize] = useState({ width: 800, height: 600 })
  const panelRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{ x: number; y: number } | null>(null)

  const theme = config.theme === 'auto' 
    ? (window.matchMedia?.('(prefers-color-scheme: dark)')?.matches ? 'dark' : 'light')
    : config.theme

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.tab-content') || (e.target as HTMLElement).closest('.resize-handle')) {
      return
    }
    
    setIsDragging(true)
    dragRef.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    }
  }

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging && dragRef.current) {
      setPosition({
        x: e.clientX - dragRef.current.x,
        y: e.clientY - dragRef.current.y,
      })
    }
  }, [isDragging])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
    dragRef.current = null
  }, [])

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
    // Return undefined explicitly for when isDragging is false
    return undefined
  }, [isDragging, handleMouseMove, handleMouseUp])

  const handleResize = (e: React.MouseEvent) => {
    e.preventDefault()
    const startX = e.clientX
    const startY = e.clientY
    const startWidth = size.width
    const startHeight = size.height

    const handleMouseMove = (e: MouseEvent) => {
      setSize({
        width: Math.max(400, startWidth + (e.clientX - startX)),
        height: Math.max(300, startHeight + (e.clientY - startY)),
      })
    }

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  const ActiveTabComponent = tabs.find(tab => tab.id === activeTab)?.component || ErrorList

  const panelStyles: React.CSSProperties = {
    position: 'fixed',
    left: position.x,
    top: position.y,
    width: size.width,
    height: isMinimized ? 'auto' : size.height,
    backgroundColor: theme === 'dark' ? '#1e1e1e' : '#ffffff',
    border: `1px solid ${theme === 'dark' ? '#333' : '#ccc'}`,
    borderRadius: '8px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    fontSize: '14px',
    zIndex: 10000,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  }

  const headerStyles: React.CSSProperties = {
    padding: '8px 12px',
    backgroundColor: theme === 'dark' ? '#2d2d2d' : '#f5f5f5',
    borderBottom: `1px solid ${theme === 'dark' ? '#333' : '#ccc'}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    cursor: isDragging ? 'grabbing' : 'grab',
    userSelect: 'none',
  }

  const tabsStyles: React.CSSProperties = {
    display: 'flex',
    backgroundColor: theme === 'dark' ? '#252525' : '#f9f9f9',
    borderBottom: `1px solid ${theme === 'dark' ? '#333' : '#ccc'}`,
  }

  const tabStyle = (isActive: boolean): React.CSSProperties => ({
    padding: '8px 16px',
    cursor: 'pointer',
    backgroundColor: isActive 
      ? (theme === 'dark' ? '#1e1e1e' : '#ffffff')
      : 'transparent',
    borderBottom: isActive ? `2px solid #007acc` : 'none',
    color: theme === 'dark' ? '#ffffff' : '#333333',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  })

  const contentStyles: React.CSSProperties = {
    flex: 1,
    overflow: 'auto',
    padding: '16px',
    backgroundColor: theme === 'dark' ? '#1e1e1e' : '#ffffff',
    color: theme === 'dark' ? '#ffffff' : '#333333',
  }

  const statusIndicatorStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    fontSize: '12px',
    color: theme === 'dark' ? '#999' : '#666',
  }

  const recordingDotStyles: React.CSSProperties = {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: isRecording ? '#ff4444' : '#666',
    animation: isRecording ? 'pulse 1.5s infinite' : 'none',
  }

  const buttonStyle: React.CSSProperties = {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px 8px',
    borderRadius: '4px',
    color: theme === 'dark' ? '#ffffff' : '#333333',
    fontSize: '14px',
  }

  const resizeHandleStyles: React.CSSProperties = {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: '16px',
    height: '16px',
    cursor: 'se-resize',
    background: `linear-gradient(135deg, transparent 0%, transparent 30%, ${theme === 'dark' ? '#666' : '#ccc'} 30%, ${theme === 'dark' ? '#666' : '#ccc'} 35%, transparent 35%, transparent 65%, ${theme === 'dark' ? '#666' : '#ccc'} 65%, ${theme === 'dark' ? '#666' : '#ccc'} 70%, transparent 70%)`,
  }

  if (!config.enabled) return null

  return (
    <>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
      <div ref={panelRef} style={panelStyles}>
        <div style={headerStyles} onMouseDown={handleMouseDown}>
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
          <div style={{ display: 'flex', gap: '4px' }}>
            <button
              type="button"
              style={buttonStyle}
              onClick={() => setIsMinimized(!isMinimized)}
              title={isMinimized ? 'Restore' : 'Minimize'}
            >
              {isMinimized ? '□' : '_'}
            </button>
            <button
              type="button"
              style={buttonStyle}
              onClick={() => {
                try {
                  updateConfig({ enabled: false });
                } catch (error) {
                  // Handle store errors gracefully
                  console.error('Error closing DevTools panel:', error);
                }
              }}
              title="Close"
            >
              ×
            </button>
          </div>
        </div>

        {!isMinimized && (
          <>
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

            <div className="tab-content" style={contentStyles}>
              <ActiveTabComponent />
            </div>

            <div
              className="resize-handle"
              style={resizeHandleStyles}
              onMouseDown={handleResize}
            />
          </>
        )}
      </div>
    </>
  )
}