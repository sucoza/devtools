import React, { useState, useCallback, useEffect } from 'react'
import { useErrorBoundaryDevTools } from '../core/store'
import type { ComponentTreeNode } from '../types'

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
      ? (theme === 'dark' ? '#2d5aa0' : '#e3f2fd')
      : showHeatmap && heatmapIntensity > 0
        ? `rgba(255, ${Math.floor(255 - (heatmapIntensity * 100))}, ${Math.floor(255 - (heatmapIntensity * 100))}, 0.2)`
        : 'transparent',
    borderLeft: node.hasErrorBoundary 
      ? `3px solid ${node.type === 'error-boundary' ? '#4caf50' : '#ff9800'}`
      : '3px solid transparent',
  }

  const expanderStyles: React.CSSProperties = {
    width: '12px',
    height: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '10px',
    color: theme === 'dark' ? '#999' : '#666',
    cursor: hasChildren ? 'pointer' : 'default',
    opacity: hasChildren ? 1 : 0.3,
  }

  const iconStyles: React.CSSProperties = {
    fontSize: '14px',
    width: '16px',
    textAlign: 'center',
  }

  const nameStyles: React.CSSProperties = {
    flex: 1,
    fontFamily: 'monaco, consolas, monospace',
    fontSize: '13px',
    color: theme === 'dark' ? '#ffffff' : '#333333',
  }

  const badgeStyles: React.CSSProperties = {
    fontSize: '11px',
    padding: '2px 6px',
    borderRadius: '10px',
    backgroundColor: theme === 'dark' ? '#333' : '#f0f0f0',
    color: theme === 'dark' ? '#fff' : '#666',
  }

  const errorBadgeStyles: React.CSSProperties = {
    ...badgeStyles,
    backgroundColor: errorCount > 0 ? '#ff4444' : 'transparent',
    color: '#ffffff',
    display: errorCount > 0 ? 'block' : 'none',
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
        <div style={expanderStyles} onClick={handleToggle}>
          {hasChildren ? (isExpanded ? '▼' : '▶') : '○'}
        </div>
        
        <div style={iconStyles}>
          {getNodeIcon()}
        </div>
        
        <div style={nameStyles}>
          {node.name}
        </div>
        
        {node.hasErrorBoundary && (
          <div style={badgeStyles}>
            EB
          </div>
        )}
        
        <div style={errorBadgeStyles}>
          {errorCount}
        </div>
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

export const ComponentTreeView: React.FC = () => {
  const { 
    componentTree, 
    config, 
    selectedBoundary, 
    selectBoundary, 
    errorBoundaries,
    calculateCoverage
  } = useErrorBoundaryDevTools()
  
  const [selectedNode, setSelectedNode] = useState<ComponentTreeNode | null>(null)
  const [showHeatmap, setShowHeatmap] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'error-boundary' | 'with-errors'>('all')

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

  const filterTree = useCallback((node: ComponentTreeNode): ComponentTreeNode | null => {
    if (!node) return null

    // Apply search filter
    const matchesSearch = !searchQuery || 
      node.name.toLowerCase().includes(searchQuery.toLowerCase())

    // Apply type filter
    const matchesType = filterType === 'all' ||
      (filterType === 'error-boundary' && node.hasErrorBoundary) ||
      (filterType === 'with-errors' && node.errors.length > 0)

    // Recursively filter children
    const filteredChildren = node.children
      .map(child => filterTree(child))
      .filter(Boolean) as ComponentTreeNode[]

    // Include node if it matches filters or has matching children
    if (matchesSearch && matchesType || filteredChildren.length > 0) {
      return {
        ...node,
        children: filteredChildren
      }
    }

    return null
  }, [searchQuery, filterType])

  const filteredTree = componentTree ? filterTree(componentTree) : null

  const containerStyles: React.CSSProperties = {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  }

  const headerStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  }

  const controlsStyles: React.CSSProperties = {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
    flexWrap: 'wrap',
  }

  const inputStyles: React.CSSProperties = {
    padding: '6px 10px',
    border: `1px solid ${theme === 'dark' ? '#444' : '#ccc'}`,
    borderRadius: '4px',
    backgroundColor: theme === 'dark' ? '#2d2d2d' : '#ffffff',
    color: theme === 'dark' ? '#ffffff' : '#333333',
    fontSize: '13px',
    flex: 1,
    minWidth: '200px',
  }

  const selectStyles: React.CSSProperties = {
    ...inputStyles,
    flex: 'none',
    minWidth: '120px',
  }

  const statsStyles: React.CSSProperties = {
    display: 'flex',
    gap: '16px',
    padding: '8px 12px',
    backgroundColor: theme === 'dark' ? '#252525' : '#f5f5f5',
    borderRadius: '4px',
    fontSize: '12px',
    color: theme === 'dark' ? '#ccc' : '#666',
  }

  const treeContainerStyles: React.CSSProperties = {
    flex: 1,
    overflow: 'auto',
    border: `1px solid ${theme === 'dark' ? '#444' : '#ccc'}`,
    borderRadius: '4px',
    backgroundColor: theme === 'dark' ? '#1a1a1a' : '#fafafa',
  }

  const detailsStyles: React.CSSProperties = {
    marginTop: '12px',
    padding: '12px',
    border: `1px solid ${theme === 'dark' ? '#444' : '#ccc'}`,
    borderRadius: '4px',
    backgroundColor: theme === 'dark' ? '#252525' : '#f9f9f9',
  }

  const toggleStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '13px',
    color: theme === 'dark' ? '#ccc' : '#666',
  }

  const checkboxStyles: React.CSSProperties = {
    margin: 0,
  }

  return (
    <div style={containerStyles}>
      <div style={headerStyles}>
        <div style={controlsStyles}>
          <input
            type="text"
            placeholder="Search components..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={inputStyles}
          />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            style={selectStyles}
          >
            <option value="all">All Components</option>
            <option value="error-boundary">With Error Boundaries</option>
            <option value="with-errors">With Errors</option>
          </select>
          <label style={toggleStyles}>
            <input
              type="checkbox"
              checked={showHeatmap}
              onChange={(e) => setShowHeatmap(e.target.checked)}
              style={checkboxStyles}
            />
            Error Heatmap
          </label>
        </div>
        
        <div style={statsStyles}>
          <span>Coverage: {coverage.toFixed(1)}%</span>
          <span>Boundaries: {errorBoundaries.size}</span>
          {componentTree && (
            <span>Components: {componentTree.children.length}</span>
          )}
        </div>
      </div>

      <div style={treeContainerStyles}>
        {filteredTree ? (
          <TreeNodeComponent
            node={filteredTree}
            level={0}
            onSelect={handleNodeSelect}
            selectedNode={selectedNode}
            theme={theme}
            showHeatmap={showHeatmap}
          />
        ) : (
          <div style={{ 
            padding: '20px', 
            textAlign: 'center', 
            color: theme === 'dark' ? '#999' : '#666' 
          }}>
            No component tree available. Make sure the DevTools hook is properly connected.
          </div>
        )}
      </div>

      {selectedNode && (
        <div style={detailsStyles}>
          <h4 style={{ margin: '0 0 8px 0', color: theme === 'dark' ? '#fff' : '#333' }}>
            {selectedNode.name}
          </h4>
          <div style={{ fontSize: '12px', color: theme === 'dark' ? '#ccc' : '#666' }}>
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