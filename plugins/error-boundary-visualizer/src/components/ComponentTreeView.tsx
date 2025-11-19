import React, { useState, useCallback } from 'react'
import { useErrorBoundaryDevTools } from '../core/store'
import type { ComponentTreeNode } from '../types'

export const ComponentTreeView: React.FC = () => {
  const { 
    componentTree, 
    config, 
    selectBoundary, 
    errorBoundaries,
    calculateCoverage
  } = useErrorBoundaryDevTools()
  
  const [selectedNode, setSelectedNode] = useState<ComponentTreeNode | null>(null)
  const [showHeatmap, setShowHeatmap] = useState(true)

  const theme = config.theme === 'auto' 
    ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : config.theme

  const coverage = calculateCoverage()

  const handleNodeSelect = useCallback((node: ComponentTreeNode) => {
    setSelectedNode(node)
    
    // If selecting an error boundary, update the boundary selection
    if (node.type === 'error-boundary' && node.errorBoundaryId) {
      const boundary = errorBoundaries.get(node.errorBoundaryId)
      if (boundary) {
        selectBoundary(boundary)
      }
    }
  }, [errorBoundaries, selectBoundary])

  const containerStyles: React.CSSProperties = {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    padding: '16px'
  }

  const headerStyles: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px'
  }

  const statsStyles: React.CSSProperties = {
    fontSize: '14px',
    color: "var(--dt-text-secondary)",
    marginBottom: '16px'
  }

  return (
    <div style={containerStyles}>
      <div style={headerStyles}>
        <h3 style={{ margin: 0, color: "var(--dt-text-primary)" }}>
          Component Tree
        </h3>
        <label style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '6px', 
          fontSize: '13px',
          color: "var(--dt-text-secondary)"
        }}>
          <input
            type="checkbox"
            checked={showHeatmap}
            onChange={(e) => setShowHeatmap(e.target.checked)}
          />
          Error Heatmap
        </label>
      </div>
      
      <div style={statsStyles}>
        Coverage: {coverage.toFixed(1)}% | 
        Error Boundaries: {errorBoundaries.size} | 
        Total Components: {componentTree?.children?.length || 0}
        {showHeatmap && ' | Heatmap shows error frequency'}
      </div>

      <div style={{
        flex: 1,
        border: "1px solid var(--dt-border-primary)",
        borderRadius: '4px',
        backgroundColor: "var(--dt-bg-secondary)",
        padding: '12px'
      }}>
        {componentTree ? (
          <div style={{ 
            color: "var(--dt-text-primary)",
            fontSize: '14px'
          }}>
            <TreeNodeComponent
              node={componentTree}
              level={0}
              onSelect={handleNodeSelect}
              selectedNode={selectedNode}
              theme={theme}
              showHeatmap={showHeatmap}
            />
          </div>
        ) : (
          <div style={{ 
            padding: '20px', 
            textAlign: 'center', 
            color: "var(--dt-text-tertiary)" 
          }}>
            No component tree available. Make sure the DevTools hook is properly connected.
          </div>
        )}
      </div>

      {selectedNode && (
        <div style={{
          padding: '12px',
          border: "1px solid var(--dt-border-primary)",
          borderRadius: '4px',
          backgroundColor: "var(--dt-bg-secondary)",
        }}>
          <h4 style={{ margin: '0 0 8px 0', color: "var(--dt-text-primary)" }}>
            {selectedNode.name}
          </h4>
          <div style={{ fontSize: '12px', color: "var(--dt-text-secondary)" }}>
            <div>Type: {selectedNode.type}</div>
            <div>Path: {selectedNode.path}</div>
            <div>Has Error Boundary: {selectedNode.hasErrorBoundary ? 'Yes' : 'No'}</div>
            <div>Errors: {selectedNode.errors.length}</div>
            <div>Children: {selectedNode.children.length}</div>
          </div>
        </div>
      )}
    </div>
  )
}

interface TreeNodeProps {
  node: ComponentTreeNode
  level: number
  onSelect: (node: ComponentTreeNode) => void
  selectedNode: ComponentTreeNode | null
  theme: 'light' | 'dark'
  showHeatmap: boolean
}

const TreeNodeComponent: React.FC<TreeNodeProps> = ({
  node,
  level,
  onSelect,
  selectedNode,
  theme,
  showHeatmap
}) => {
  const [isExpanded, setIsExpanded] = useState(level < 2)
  
  const hasChildren = node.children.length > 0
  const errorCount = node.errors.length
  const heatmapIntensity = showHeatmap ? Math.min(errorCount / 5, 1) : 0
  
  const nodeStyles: React.CSSProperties = {
    paddingLeft: `${level * 16 + 8}px`,
    paddingTop: '4px',
    paddingBottom: '4px',
    paddingRight: '8px',
    cursor: 'pointer',
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: selectedNode?.id === node.id 
      ? "var(--dt-bg-selected)"
      : showHeatmap && heatmapIntensity > 0
        ? `rgba(255, ${Math.floor(255 - (heatmapIntensity * 100))}, ${Math.floor(255 - (heatmapIntensity * 100))}, 0.2)`
        : 'transparent',
    borderLeft: node.hasErrorBoundary 
      ? `3px solid ${node.type === 'error-boundary' ? 'var(--dt-status-success)' : 'var(--dt-status-warning)'}`
      : '3px solid transparent',
  }

  const getNodeIcon = () => {
    switch (node.type) {
      case 'error-boundary':
        return '🛡️'
      case 'component':
        return '📦'
      case 'fragment':
        return '📄'
      default:
        return '❓'
    }
  }

  const handleToggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    if (hasChildren) {
      setIsExpanded(!isExpanded)
    }
  }, [hasChildren, isExpanded])

  const handleSelect = useCallback(() => {
    onSelect(node)
  }, [node, onSelect])

  return (
    <>
      <div style={nodeStyles} onClick={handleSelect}>
        <div 
          style={{ cursor: hasChildren ? 'pointer' : 'default', minWidth: '12px' }} 
          onClick={handleToggle}
        >
          {hasChildren ? (isExpanded ? '▼' : '▶') : '○'}
        </div>
        
        <span style={{ fontSize: '14px' }}>{getNodeIcon()}</span>
        
        <span style={{ flex: 1, fontFamily: 'monaco, consolas, monospace', fontSize: '13px' }}>
          {node.name}
        </span>
        
        {node.hasErrorBoundary && (
          <span style={{
            fontSize: '11px',
            padding: '2px 6px',
            borderRadius: '10px',
            backgroundColor: "var(--dt-bg-secondary)",
            color: "var(--dt-text-secondary)",
          }}>
            EB
          </span>
        )}
        
        {errorCount > 0 && (
          <span style={{
            fontSize: '11px',
            padding: '2px 6px',
            borderRadius: '10px',
            backgroundColor: "var(--dt-status-error)",
            color: "var(--dt-text-secondary)",
          }}>
            {errorCount}
          </span>
        )}
      </div>
      
      {isExpanded && hasChildren && (
        <div>
          {node.children.map((child) => (
            <TreeNodeComponent
              key={child.id}
              node={child}
              level={level + 1}
              onSelect={onSelect}
              selectedNode={selectedNode}
              theme={theme}
              showHeatmap={showHeatmap}
            />
          ))}
        </div>
      )}
    </>
  )
}