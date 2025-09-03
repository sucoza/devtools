/**
 * Route Tree Visualization Component
 */

import React, { useMemo } from 'react';
import {
  Badge,
  EmptyState
} from '@sucoza/shared-components';
import { Route } from 'lucide-react';
import { RouteTreeNode } from '../types/router';

interface RouteTreeViewProps {
  nodes: RouteTreeNode[];
  selectedId: string | null;
  expandedIds: Set<string>;
  onRouteSelect: (id: string) => void;
  onRouteExpand: (id: string) => void;
  onNavigate: (to: string, options?: { replace?: boolean }) => void;
  currentLocation?: {
    pathname: string;
    search: string;
    hash: string;
  };
}

interface RouteNodeProps {
  node: RouteTreeNode;
  isSelected: boolean;
  isExpanded: boolean;
  onSelect: (id: string) => void;
  onExpand: (id: string) => void;
  onNavigate: (to: string, options?: { replace?: boolean }) => void;
  currentPath?: string;
  selectedId?: string | null;
  expandedIds?: Set<string>;
}

function RouteNode({ 
  node, 
  isSelected, 
  isExpanded, 
  onSelect, 
  onExpand, 
  onNavigate,
  currentPath,
  selectedId,
  expandedIds 
}: RouteNodeProps) {
  const hasChildren = node.children.length > 0;
  const isCurrentPath = currentPath === node.fullPath;
  
  const handleNodeClick = (e: React.MouseEvent) => {
    e.preventDefault();
    onSelect(node.id);
  };
  
  const handleExpandClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (hasChildren) {
      onExpand(node.id);
    }
  };
  
  const handleNavigateClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (node.fullPath && node.fullPath !== '/') {
      onNavigate(node.fullPath);
    }
  };
  
  return (
    <div style={{ marginLeft: `${node.level * 16}px` }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '4px 8px',
          borderRadius: '3px',
          background: isSelected ? '#094771' : (isCurrentPath ? '#1e3a28' : 'transparent'),
          border: `1px solid ${isSelected ? '#007acc' : (isCurrentPath ? '#4ec9b0' : 'transparent')}`,
          cursor: 'pointer',
          fontSize: '11px',
          marginBottom: '1px'
        }}
        onClick={handleNodeClick}
      >
        {/* Expand/collapse button */}
        {hasChildren && (
          <button
            onClick={handleExpandClick}
            style={{
              background: 'none',
              border: 'none',
              color: '#969696',
              cursor: 'pointer',
              fontSize: '10px',
              padding: '0 4px 0 0',
              transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
              transition: 'transform 0.1s ease'
            }}
          >
            ▶
          </button>
        )}
        
        {/* Route info */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Path */}
          <span style={{ 
            color: node.isActive ? '#4ec9b0' : '#cccccc',
            fontWeight: node.isActive ? '600' : '400'
          }}>
            {node.path || '/'}
            {node.index && <span style={{ color: '#e67e22', fontSize: '9px' }}> (index)</span>}
          </span>
          
          {/* Element name */}
          {node.element && (
            <span style={{ color: '#8e44ad', fontSize: '10px' }}>
              {node.element}
            </span>
          )}
          
          {/* Active indicator */}
          {node.isActive && (
            <Badge variant="success" size="xs">ACTIVE</Badge>
          )}
          
          {/* Matched indicator */}
          {node.isMatched && !node.isActive && (
            <Badge variant="warning" size="xs">MATCHED</Badge>
          )}
          
          {/* Parameters count */}
          {node.params && Object.keys(node.params).length > 0 && (
            <Badge variant="info" size="xs">
              {`${Object.keys(node.params).length} param${Object.keys(node.params).length > 1 ? 's' : ''}`}
            </Badge>
          )}
        </div>
        
        {/* Actions */}
        <div style={{ display: 'flex', gap: '4px' }}>
          {node.fullPath && node.fullPath !== currentPath && (
            <button
              onClick={handleNavigateClick}
              style={{
                background: 'none',
                border: '1px solid #3c3c3c',
                color: '#969696',
                cursor: 'pointer',
                fontSize: '9px',
                padding: '2px 6px',
                borderRadius: '2px'
              }}
              title={`Navigate to ${node.fullPath}`}
            >
              Go
            </button>
          )}
        </div>
      </div>
      
      {/* Parameters display for selected route */}
      {(isSelected && node.params && Object.keys(node.params).length > 0) ? (
        <div style={{
          marginLeft: '24px',
          marginTop: '4px',
          padding: '8px',
          background: '#252526',
          borderRadius: '3px',
          border: '1px solid #3c3c3c'
        }}>
          <div style={{ color: '#9cdcfe', fontSize: '10px', marginBottom: '4px' }}>Parameters:</div>
          {Object.entries(node.params).map(([key, value]) => (
            <div key={key} style={{ display: 'flex', gap: '8px', fontSize: '10px', marginBottom: '2px' }}>
              <span style={{ color: '#e74c3c', minWidth: '60px' }}>{key}:</span>
              <span style={{ color: '#27ae60' }}>{value}</span>
            </div>
          ))}
        </div>
      ) : null}
      
      {/* Data display for selected route */}
      {(isSelected && node.data) ? (
        <div style={{
          marginLeft: '24px',
          marginTop: '4px',
          padding: '8px',
          background: '#252526',
          borderRadius: '3px',
          border: '1px solid #3c3c3c'
        }}>
          <div style={{ color: '#9cdcfe', fontSize: '10px', marginBottom: '4px' }}>Loader Data:</div>
          <pre style={{
            fontSize: '9px',
            color: '#d4d4d4',
            margin: 0,
            maxHeight: '100px',
            overflow: 'auto'
          }}>
            {JSON.stringify(node.data, null, 2)}
          </pre>
        </div>
      ) : null}
      
      {/* Children */}
      {hasChildren && isExpanded && (
        <div>
          {node.children.map(child => (
            <RouteNode
              key={child.id}
              node={child}
              isSelected={child.id === selectedId}
              isExpanded={expandedIds?.has(child.id) || false}
              onSelect={onSelect}
              onExpand={onExpand}
              onNavigate={onNavigate}
              currentPath={currentPath}
              selectedId={selectedId}
              expandedIds={expandedIds}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function RouteTreeView({ 
  nodes, 
  selectedId, 
  expandedIds, 
  onRouteSelect, 
  onRouteExpand, 
  onNavigate,
  currentLocation 
}: RouteTreeViewProps) {
  const currentPath = currentLocation?.pathname + (currentLocation?.search || '') + (currentLocation?.hash || '');
  
  
  const stats = useMemo(() => {
    let totalNodes = 0;
    let activeNodes = 0;
    let matchedNodes = 0;
    
    const countNodes = (nodeList: RouteTreeNode[]) => {
      for (const node of nodeList) {
        totalNodes++;
        if (node.isActive) activeNodes++;
        if (node.isMatched) matchedNodes++;
        if (node.children.length > 0) {
          countNodes(node.children);
        }
      }
    };
    
    countNodes(nodes);
    return { totalNodes, activeNodes, matchedNodes };
  }, [nodes]);

  if (nodes.length === 0) {
    return (
      <EmptyState
        icon={<Route size={48} />}
        title="No routes found"
        description="Make sure your router adapter is properly connected and routes are defined."
      />
    );
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Stats header */}
      <div style={{
        padding: '8px 12px',
        background: '#252526',
        border: '1px solid #3c3c3c',
        borderRadius: '4px',
        marginBottom: '10px',
        fontSize: '11px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: '#9cdcfe' }}>Route Tree</span>
          <span style={{ color: '#969696' }}>
            {stats.totalNodes} routes • {stats.activeNodes} active • {stats.matchedNodes} matched
          </span>
        </div>
        {currentLocation && (
          <div style={{ marginTop: '4px', color: '#cccccc', fontSize: '10px' }}>
            <span style={{ color: '#e74c3c' }}>Current:</span> {currentLocation.pathname}
            {currentLocation.search && (
              <span style={{ color: '#3498db' }}>{currentLocation.search}</span>
            )}
            {currentLocation.hash && (
              <span style={{ color: '#f39c12' }}>{currentLocation.hash}</span>
            )}
          </div>
        )}
      </div>

      {/* Route tree */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        background: '#1e1e1e',
        border: '1px solid #3c3c3c',
        borderRadius: '4px',
        padding: '8px'
      }}>
        {nodes.map(node => (
          <RouteNode
            key={node.id}
            node={node}
            isSelected={selectedId === node.id}
            isExpanded={expandedIds.has(node.id)}
            onSelect={onRouteSelect}
            onExpand={onRouteExpand}
            onNavigate={onNavigate}
            currentPath={currentPath}
            selectedId={selectedId}
            expandedIds={expandedIds}
          />
        ))}
      </div>

      {/* Actions footer */}
      <div style={{
        marginTop: '10px',
        display: 'flex',
        gap: '8px',
        justifyContent: 'flex-end'
      }}>
        <button
          onClick={() => {
            // Expand all routes
            const allIds = new Set<string>();
            const collectIds = (nodeList: RouteTreeNode[]) => {
              for (const node of nodeList) {
                allIds.add(node.id);
                if (node.children.length > 0) {
                  collectIds(node.children);
                }
              }
            };
            collectIds(nodes);
            allIds.forEach(id => onRouteExpand(id));
          }}
          style={{
            padding: '4px 8px',
            fontSize: '11px',
            border: '1px solid #3c3c3c',
            background: '#2d2d30',
            color: '#cccccc',
            cursor: 'pointer',
            borderRadius: '3px'
          }}
        >
          Expand All
        </button>
        
        <button
          onClick={() => {
            // Collapse all routes
            expandedIds.forEach(id => onRouteExpand(id));
          }}
          style={{
            padding: '4px 8px',
            fontSize: '11px',
            border: '1px solid #3c3c3c',
            background: '#2d2d30',
            color: '#cccccc',
            cursor: 'pointer',
            borderRadius: '3px'
          }}
        >
          Collapse All
        </button>
      </div>
    </div>
  );
}