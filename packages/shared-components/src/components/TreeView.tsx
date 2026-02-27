import React, { useState, useCallback, useMemo } from 'react';
import { ChevronRight, ChevronDown, Folder, FolderOpen, File, FileText, FileCode, Image } from 'lucide-react';
import { COLORS, SPACING, TYPOGRAPHY } from '../styles/plugin-styles';
import { ScrollableContainer } from './ScrollableContainer';

export interface TreeNode<T = any> {
  id: string;
  label: string;
  data?: T;
  children?: TreeNode<T>[];
  icon?: React.ReactNode;
  type?: 'folder' | 'file' | string;
  expanded?: boolean;
  selected?: boolean;
  disabled?: boolean;
  metadata?: Record<string, any>;
}

export interface TreeViewProps<T = any> {
  data: TreeNode<T>[];
  
  // Selection
  selectedIds?: string[];
  multiSelect?: boolean;
  onSelect?: (node: TreeNode<T>, selected: boolean) => void;
  onMultiSelect?: (nodes: TreeNode<T>[]) => void;
  
  // Expansion
  expandedIds?: string[];
  defaultExpandedIds?: string[];
  expandOnSelect?: boolean;
  onExpand?: (node: TreeNode<T>, expanded: boolean) => void;
  
  // Display options
  showIcons?: boolean;
  showLines?: boolean;
  indent?: number;
  maxHeight?: number | string;
  
  // Custom rendering
  renderNode?: (node: TreeNode<T>, level: number) => React.ReactNode;
  renderLabel?: (node: TreeNode<T>) => React.ReactNode;
  renderIcon?: (node: TreeNode<T>, expanded: boolean) => React.ReactNode;
  getNodeClassName?: (node: TreeNode<T>) => string;
  
  // Interaction
  onNodeClick?: (node: TreeNode<T>, event: React.MouseEvent) => void;
  onNodeDoubleClick?: (node: TreeNode<T>, event: React.MouseEvent) => void;
  onNodeRightClick?: (node: TreeNode<T>, event: React.MouseEvent) => void;
  
  // Search
  searchQuery?: string;
  highlightMatches?: boolean;
  
  // Style
  className?: string;
  style?: React.CSSProperties;
}

export function TreeView<T = any>({
  data,
  selectedIds = [],
  multiSelect = false,
  onSelect,
  onMultiSelect,
  expandedIds: controlledExpandedIds,
  defaultExpandedIds = [],
  expandOnSelect = false,
  onExpand,
  showIcons = true,
  showLines = false,
  indent = 20,
  maxHeight,
  renderNode,
  renderLabel,
  renderIcon,
  getNodeClassName,
  onNodeClick,
  onNodeDoubleClick,
  onNodeRightClick,
  searchQuery = '',
  highlightMatches = true,
  className,
  style,
}: TreeViewProps<T>) {
  const [internalExpandedIds, setInternalExpandedIds] = useState<Set<string>>(
    new Set(defaultExpandedIds)
  );
  const [internalSelectedIds, setInternalSelectedIds] = useState<Set<string>>(
    new Set(selectedIds)
  );
  
  const expandedSet = useMemo(() => 
    controlledExpandedIds !== undefined 
      ? new Set(controlledExpandedIds)
      : internalExpandedIds,
    [controlledExpandedIds, internalExpandedIds]
  );
  
  const selectedSet = useMemo(() => 
    new Set(selectedIds.length > 0 ? selectedIds : internalSelectedIds),
    [selectedIds, internalSelectedIds]
  );
  
  // Toggle expansion
  const toggleExpanded = useCallback((node: TreeNode<T>) => {
    const isExpanded = expandedSet.has(node.id);
    const newExpanded = !isExpanded;
    
    if (controlledExpandedIds === undefined) {
      setInternalExpandedIds(prev => {
        const next = new Set(prev);
        if (newExpanded) {
          next.add(node.id);
        } else {
          next.delete(node.id);
        }
        return next;
      });
    }
    
    if (onExpand) {
      onExpand(node, newExpanded);
    }
  }, [expandedSet, controlledExpandedIds, onExpand]);
  
  // Handle selection
  const handleSelect = useCallback((node: TreeNode<T>, event: React.MouseEvent) => {
    if (node.disabled) return;
    
    const isSelected = selectedSet.has(node.id);
    
    if (multiSelect && (event.ctrlKey || event.metaKey)) {
      // Multi-select with Ctrl/Cmd
      const newSelectedIds = new Set(selectedSet);
      if (isSelected) {
        newSelectedIds.delete(node.id);
      } else {
        newSelectedIds.add(node.id);
      }
      setInternalSelectedIds(newSelectedIds);
      
      if (onMultiSelect) {
        const selectedNodes = Array.from(newSelectedIds).map(id => 
          findNodeById(data, id)
        ).filter(Boolean) as TreeNode<T>[];
        onMultiSelect(selectedNodes);
      }
    } else {
      // Single select
      setInternalSelectedIds(new Set([node.id]));
      
      if (onSelect) {
        onSelect(node, !isSelected);
      }
    }
    
    // Expand on select
    if (expandOnSelect && node.children && node.children.length > 0) {
      toggleExpanded(node);
    }
    
    if (onNodeClick) {
      onNodeClick(node, event);
    }
  }, [selectedSet, multiSelect, data, onSelect, onMultiSelect, expandOnSelect, toggleExpanded, onNodeClick]);
  
  // Find node by ID
  const findNodeById = (nodes: TreeNode<T>[], id: string): TreeNode<T> | null => {
    for (const node of nodes) {
      if (node.id === id) return node;
      if (node.children) {
        const found = findNodeById(node.children, id);
        if (found) return found;
      }
    }
    return null;
  };
  
  // Default icon based on type
  const getDefaultIcon = (node: TreeNode<T>, expanded: boolean) => {
    if (node.type === 'folder' || (node.children && node.children.length > 0)) {
      return expanded ? <FolderOpen size={16} /> : <Folder size={16} />;
    }
    
    const fileExtension = node.label.split('.').pop()?.toLowerCase();
    switch (fileExtension) {
      case 'js':
      case 'jsx':
      case 'ts':
      case 'tsx':
      case 'json':
      case 'html':
      case 'css':
        return <FileCode size={16} />;
      case 'md':
      case 'txt':
      case 'doc':
        return <FileText size={16} />;
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'gif':
      case 'svg':
        return <Image size={16} />;
      default:
        return <File size={16} />;
    }
  };
  
  // Highlight search matches
  const highlightText = (text: string) => {
    if (!searchQuery || !highlightMatches) return text;
    
    const parts = text.split(new RegExp(`(${searchQuery})`, 'gi'));
    return (
      <>
        {parts.map((part, i) => 
          part.toLowerCase() === searchQuery.toLowerCase() ? (
            <span key={i} style={{ backgroundColor: COLORS.background.selected, color: COLORS.text.accent }}>
              {part}
            </span>
          ) : (
            part
          )
        )}
      </>
    );
  };
  
  // Check if node matches search
  const nodeMatchesSearch = (node: TreeNode<T>): boolean => {
    if (!searchQuery) return true;
    
    if (node.label.toLowerCase().includes(searchQuery.toLowerCase())) {
      return true;
    }
    
    if (node.children) {
      return node.children.some(child => nodeMatchesSearch(child));
    }
    
    return false;
  };
  
  // Render tree node
  const renderTreeNode = (node: TreeNode<T>, level: number = 0): React.ReactNode => {
    if (!nodeMatchesSearch(node)) return null;
    
    const isExpanded = expandedSet.has(node.id);
    const isSelected = selectedSet.has(node.id);
    const hasChildren = node.children && node.children.length > 0;
    
    // Custom render
    if (renderNode) {
      return renderNode(node, level);
    }
    
    return (
      <div key={node.id} className={getNodeClassName?.(node)}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            paddingLeft: level * indent + SPACING.sm,
            paddingRight: SPACING.sm,
            paddingTop: SPACING.xs,
            paddingBottom: SPACING.xs,
            cursor: node.disabled ? 'not-allowed' : 'pointer',
            backgroundColor: isSelected ? COLORS.background.selected : 'transparent',
            color: node.disabled ? COLORS.text.muted : (isSelected ? COLORS.text.accent : COLORS.text.primary),
            transition: 'background-color 0.1s ease',
            userSelect: 'none',
            fontSize: TYPOGRAPHY.fontSize.sm,
            opacity: node.disabled ? 0.5 : 1,
          }}
          onClick={(e) => handleSelect(node, e)}
          onDoubleClick={(e) => onNodeDoubleClick?.(node, e)}
          onContextMenu={(e) => onNodeRightClick?.(node, e)}
          onMouseEnter={(e) => {
            if (!node.disabled && !isSelected) {
              e.currentTarget.style.backgroundColor = COLORS.background.hover;
            }
          }}
          onMouseLeave={(e) => {
            if (!isSelected) {
              e.currentTarget.style.backgroundColor = 'transparent';
            }
          }}
        >
          {/* Expand/collapse chevron */}
          {hasChildren ? (
            <span
              onClick={(e) => {
                e.stopPropagation();
                toggleExpanded(node);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '16px',
                height: '16px',
                marginRight: SPACING.xs,
                cursor: 'pointer',
                color: COLORS.text.muted,
              }}
            >
              {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </span>
          ) : (
            <span style={{ width: '16px', marginRight: SPACING.xs }} />
          )}
          
          {/* Icon */}
          {showIcons && (
            <span style={{
              display: 'flex',
              alignItems: 'center',
              marginRight: SPACING.sm,
              color: isSelected ? COLORS.text.accent : COLORS.text.secondary,
            }}>
              {renderIcon 
                ? renderIcon(node, isExpanded)
                : node.icon || getDefaultIcon(node, isExpanded)
              }
            </span>
          )}
          
          {/* Label */}
          <span style={{ flex: 1 }}>
            {renderLabel ? renderLabel(node) : highlightText(node.label)}
          </span>
          
          {/* Metadata */}
          {node.metadata && (
            <span style={{
              marginLeft: 'auto',
              paddingLeft: SPACING.md,
              fontSize: TYPOGRAPHY.fontSize.xs,
              color: COLORS.text.muted,
            }}>
              {Object.entries(node.metadata).map(([key, value]) => (
                <span key={key} style={{ marginLeft: SPACING.sm }}>
                  {value}
                </span>
              ))}
            </span>
          )}
        </div>
        
        {/* Children */}
        {hasChildren && isExpanded && (
          <div>
            {showLines && (
              <div style={{
                position: 'absolute',
                left: level * indent + 20,
                top: 0,
                bottom: 0,
                width: '1px',
                backgroundColor: COLORS.border.primary,
              }} />
            )}
            {node.children!.map(child => renderTreeNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };
  
  const containerStyles: React.CSSProperties = {
    ...style,
  };
  
  const content = (
    <div style={{ position: 'relative' }}>
      {data.map(node => renderTreeNode(node))}
    </div>
  );
  
  return (
    <div className={className} style={containerStyles}>
      {maxHeight ? (
        <ScrollableContainer
          style={{ maxHeight, height: '100%' }}
          showShadows={true}
          smoothScroll={true}
          scrollbarWidth="thin"
        >
          {content}
        </ScrollableContainer>
      ) : (
        content
      )}
    </div>
  );
}