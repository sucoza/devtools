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
          background: isSelected ? "var(--dt-bg-selected)" : (isCurrentPath ? "var(--dt-status-success-bg)" : "transparent"),
          border: `1px solid ${isSelected ? "var(--dt-border-focus)" : (isCurrentPath ? "var(--dt-accent-secondary)" : "transparent")}`,
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
              color: "var(--dt-text-secondary)",
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
            color: node.isActive ? "var(--dt-accent-secondary)" : "var(--dt-text-primary)",
            fontWeight: node.isActive ? '600' : '400'
          }}>
            {node.path || '/'}
            {node.index && <span style={{ color: "var(--dt-status-warning)", fontSize: '9px' }}> (index)</span>}
          </span>
          
          {/* Element name */}
          {node.element && (
            <span style={{ color: "var(--dt-accent-primary)", fontSize: '10px' }}>
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
                border: "1px solid var(--dt-border-primary)",
                color: "var(--dt-text-secondary)",
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
          background: "var(--dt-bg-secondary)",
          borderRadius: '3px',
          border: "1px solid var(--dt-border-primary)"
        }}>
          <div style={{ color: "var(--dt-accent-primary)", fontSize: '10px', marginBottom: '4px' }}>Parameters:</div>
          {Object.entries(node.params).map(([key, value]) => (
            <div key={key} style={{ display: 'flex', gap: '8px', fontSize: '10px', marginBottom: '2px' }}>
              <span style={{ color: "var(--dt-status-error)", minWidth: '60px' }}>{key}:</span>
              <span style={{ color: "var(--dt-status-success)" }}>{value}</span>
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
          background: "var(--dt-bg-secondary)",
          borderRadius: '3px',
          border: "1px solid var(--dt-border-primary)"
        }}>
          <div style={{ color: "var(--dt-accent-primary)", fontSize: '10px', marginBottom: '4px' }}>Loader Data:</div>
          <pre style={{
            fontSize: '9px',
            color: "var(--dt-text-primary)",
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
        background: "var(--dt-bg-secondary)",
        border: "1px solid var(--dt-border-primary)",
        borderRadius: '4px',
        marginBottom: '10px',
        fontSize: '11px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: "var(--dt-accent-primary)" }}>Route Tree</span>
          <span style={{ color: "var(--dt-text-secondary)" }}>
            {stats.totalNodes} routes • {stats.activeNodes} active • {stats.matchedNodes} matched
          </span>
        </div>
        {currentLocation && (
          <div style={{ marginTop: '4px', color: "var(--dt-text-primary)", fontSize: '10px' }}>
            <span style={{ color: "var(--dt-status-error)" }}>Current:</span> {currentLocation.pathname}
            {currentLocation.search && (
              <span style={{ color: "var(--dt-border-focus)" }}>{currentLocation.search}</span>
            )}
            {currentLocation.hash && (
              <span style={{ color: "var(--dt-status-warning)" }}>{currentLocation.hash}</span>
            )}
          </div>
        )}
      </div>

      {/* Route tree */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        background: "var(--dt-bg-primary)",
        border: "1px solid var(--dt-border-primary)",
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
            border: "1px solid var(--dt-border-primary)",
            background: "var(--dt-bg-tertiary)",
            color: "var(--dt-text-primary)",
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
            border: "1px solid var(--dt-border-primary)",
            background: "var(--dt-bg-tertiary)",
            color: "var(--dt-text-primary)",
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