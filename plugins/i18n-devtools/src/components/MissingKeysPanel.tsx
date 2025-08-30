/**
 * Missing Keys Panel Component
 * Displays and manages missing translation keys with visual indicators and quick actions
 */

import React, { useState, useMemo } from 'react';
import type { TranslationKey } from '../types/i18n';

interface MissingKeysPanelProps {
  missingKeys: TranslationKey[];
  onKeySelect: (key: string, namespace: string) => void;
}

export function MissingKeysPanel({
  missingKeys,
  onKeySelect
}: MissingKeysPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNamespace, setSelectedNamespace] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'key' | 'namespace' | 'usage' | 'lastUsed'>('usage');
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());

  // Group and filter missing keys
  const processedMissingKeys = useMemo(() => {
    const filtered = missingKeys.filter(key => {
      const matchesSearch = searchQuery.trim() === '' ||
        key.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
        key.namespace.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (key.defaultValue && key.defaultValue.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesNamespace = !selectedNamespace || key.namespace === selectedNamespace;
      
      return matchesSearch && matchesNamespace;
    });

    // Sort keys
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'key':
          return a.key.localeCompare(b.key);
        case 'namespace':
          return a.namespace.localeCompare(b.namespace);
        case 'usage':
          return b.usedAt.length - a.usedAt.length;
        case 'lastUsed':
          return (b.lastUsed || 0) - (a.lastUsed || 0);
        default:
          return 0;
      }
    });

    return filtered;
  }, [missingKeys, searchQuery, selectedNamespace, sortBy]);

  // Group by namespace for statistics
  const keysByNamespace = useMemo(() => {
    const groups: Record<string, TranslationKey[]> = {};
    missingKeys.forEach(key => {
      if (!groups[key.namespace]) {
        groups[key.namespace] = [];
      }
      groups[key.namespace].push(key);
    });
    return groups;
  }, [missingKeys]);

  const namespaces = Object.keys(keysByNamespace).sort();

  const toggleKeyExpansion = (keyId: string) => {
    setExpandedKeys(prev => {
      const next = new Set(prev);
      if (next.has(keyId)) {
        next.delete(keyId);
      } else {
        next.add(keyId);
      }
      return next;
    });
  };

  const getUsagePriorityColor = (usageCount: number): string => {
    if (usageCount >= 10) return '#f48771'; // High priority - red
    if (usageCount >= 5) return '#d19a66';  // Medium priority - orange
    if (usageCount >= 1) return '#e5c07b';  // Low priority - yellow
    return '#969696'; // Never used - gray
  };

  const getUsagePriorityLabel = (usageCount: number): string => {
    if (usageCount >= 10) return 'HIGH';
    if (usageCount >= 5) return 'MED';
    if (usageCount >= 1) return 'LOW';
    return 'NONE';
  };

  const formatLastUsed = (timestamp: number): string => {
    if (!timestamp) return 'Never';
    
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  if (missingKeys.length === 0) {
    return (
      <div style={{
        padding: '40px',
        textAlign: 'center',
        color: '#4ec9b0',
        fontSize: '14px',
        background: '#1e1e1e',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '20px' }}>✅</div>
        <div style={{ fontWeight: '600', marginBottom: '10px' }}>
          All translations complete!
        </div>
        <div style={{ color: '#969696', fontSize: '12px' }}>
          No missing translation keys detected
        </div>
      </div>
    );
  }

  return (
    <div style={{
      padding: '15px',
      height: '100%',
      overflowY: 'auto',
      background: '#1e1e1e'
    }}>
      {/* Header with stats */}
      <div style={{ marginBottom: '20px' }}>
        <h4 style={{ margin: '0 0 10px 0', color: '#f48771', fontSize: '14px', fontWeight: '600' }}>
          ❌ Missing Translation Keys
        </h4>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
          gap: '10px',
          marginBottom: '15px'
        }}>
          <div style={{
            background: '#5a1d1d',
            border: '1px solid #8b3a3a',
            padding: '10px',
            borderRadius: '4px'
          }}>
            <div style={{ fontSize: '10px', color: '#f48771', marginBottom: '4px' }}>Total Missing</div>
            <div style={{ fontSize: '18px', fontWeight: '600', color: '#ffffff' }}>{missingKeys.length}</div>
          </div>
          
          <div style={{
            background: '#252526',
            border: '1px solid #3c3c3c',
            padding: '10px',
            borderRadius: '4px'
          }}>
            <div style={{ fontSize: '10px', color: '#969696', marginBottom: '4px' }}>Namespaces</div>
            <div style={{ fontSize: '18px', fontWeight: '600', color: '#cccccc' }}>{namespaces.length}</div>
          </div>
          
          <div style={{
            background: '#252526',
            border: '1px solid #3c3c3c',
            padding: '10px',
            borderRadius: '4px'
          }}>
            <div style={{ fontSize: '10px', color: '#969696', marginBottom: '4px' }}>High Priority</div>
            <div style={{ fontSize: '18px', fontWeight: '600', color: '#f48771' }}>
              {missingKeys.filter(k => k.usedAt.length >= 10).length}
            </div>
          </div>
          
          <div style={{
            background: '#252526',
            border: '1px solid #3c3c3c',
            padding: '10px',
            borderRadius: '4px'
          }}>
            <div style={{ fontSize: '10px', color: '#969696', marginBottom: '4px' }}>Never Used</div>
            <div style={{ fontSize: '18px', fontWeight: '600', color: '#969696' }}>
              {missingKeys.filter(k => k.usedAt.length === 0).length}
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div style={{
        marginBottom: '20px',
        padding: '15px',
        background: '#252526',
        borderRadius: '4px',
        border: '1px solid #3c3c3c'
      }}>
        <div style={{
          display: 'flex',
          gap: '10px',
          alignItems: 'center',
          flexWrap: 'wrap',
          marginBottom: '10px'
        }}>
          <input
            type="text"
            placeholder="Search missing keys..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              flex: '1 1 200px',
              minWidth: '150px',
              padding: '6px 10px',
              borderRadius: '4px',
              border: '1px solid #3c3c3c',
              background: '#1e1e1e',
              color: '#cccccc',
              fontSize: '12px'
            }}
          />

          <select
            value={selectedNamespace || ''}
            onChange={(e) => setSelectedNamespace(e.target.value || null)}
            style={{
              padding: '6px 10px',
              borderRadius: '4px',
              border: '1px solid #3c3c3c',
              background: '#1e1e1e',
              color: '#cccccc',
              fontSize: '11px'
            }}
          >
            <option value="">All namespaces</option>
            {namespaces.map(ns => (
              <option key={ns} value={ns}>
                {ns} ({keysByNamespace[ns].length})
              </option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'key' | 'namespace' | 'usage' | 'lastUsed')}
            style={{
              padding: '6px 10px',
              borderRadius: '4px',
              border: '1px solid #3c3c3c',
              background: '#1e1e1e',
              color: '#cccccc',
              fontSize: '11px'
            }}
          >
            <option value="usage">Sort by Usage</option>
            <option value="lastUsed">Sort by Last Used</option>
            <option value="key">Sort by Key</option>
            <option value="namespace">Sort by Namespace</option>
          </select>
        </div>
        
        <div style={{ fontSize: '10px', color: '#969696' }}>
          Showing {processedMissingKeys.length} of {missingKeys.length} missing keys
        </div>
      </div>

      {/* Namespace breakdown */}
      <div style={{
        marginBottom: '20px',
        padding: '15px',
        background: '#252526',
        borderRadius: '4px',
        border: '1px solid #3c3c3c'
      }}>
        <h5 style={{ margin: '0 0 10px 0', color: '#9cdcfe', fontSize: '12px' }}>
          Missing Keys by Namespace
        </h5>
        
        <div style={{ display: 'grid', gap: '8px' }}>
          {namespaces.map(namespace => {
            const keys = keysByNamespace[namespace];
            const highPriorityCount = keys.filter(k => k.usedAt.length >= 10).length;
            const mediumPriorityCount = keys.filter(k => k.usedAt.length >= 5 && k.usedAt.length < 10).length;
            const lowPriorityCount = keys.filter(k => k.usedAt.length >= 1 && k.usedAt.length < 5).length;
            const unusedCount = keys.filter(k => k.usedAt.length === 0).length;
            
            return (
              <div
                key={namespace}
                onClick={() => setSelectedNamespace(selectedNamespace === namespace ? null : namespace)}
                style={{
                  padding: '8px 12px',
                  background: selectedNamespace === namespace ? '#094771' : '#2d2d30',
                  borderRadius: '3px',
                  cursor: 'pointer',
                  border: '1px solid',
                  borderColor: selectedNamespace === namespace ? '#007acc' : 'transparent'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#4ec9b0', fontWeight: '500', fontSize: '11px' }}>
                    {namespace}
                  </span>
                  <span style={{ color: '#f48771', fontWeight: '600', fontSize: '11px' }}>
                    {keys.length}
                  </span>
                </div>
                
                <div style={{ 
                  display: 'flex', 
                  gap: '8px', 
                  marginTop: '4px',
                  fontSize: '9px'
                }}>
                  {highPriorityCount > 0 && (
                    <span style={{ color: '#f48771' }}>🔴 {highPriorityCount}</span>
                  )}
                  {mediumPriorityCount > 0 && (
                    <span style={{ color: '#d19a66' }}>🟡 {mediumPriorityCount}</span>
                  )}
                  {lowPriorityCount > 0 && (
                    <span style={{ color: '#e5c07b' }}>🟢 {lowPriorityCount}</span>
                  )}
                  {unusedCount > 0 && (
                    <span style={{ color: '#969696' }}>⚫ {unusedCount}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Missing keys list */}
      <div style={{ marginBottom: '20px' }}>
        <h5 style={{ margin: '0 0 15px 0', color: '#9cdcfe', fontSize: '12px' }}>
          Missing Keys ({processedMissingKeys.length})
        </h5>
        
        {processedMissingKeys.map(key => {
          const keyId = `${key.namespace}:${key.key}`;
          const isExpanded = expandedKeys.has(keyId);
          const priorityColor = getUsagePriorityColor(key.usedAt.length);
          const priorityLabel = getUsagePriorityLabel(key.usedAt.length);
          
          return (
            <div
              key={keyId}
              style={{
                marginBottom: '8px',
                background: '#252526',
                border: '1px solid #3c3c3c',
                borderRadius: '4px',
                overflow: 'hidden'
              }}
            >
              {/* Key header */}
              <div
                onClick={() => toggleKeyExpansion(keyId)}
                style={{
                  padding: '10px 12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: '#2d2d30'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                  <span style={{ fontSize: '10px', color: '#969696', minWidth: '12px' }}>
                    {isExpanded ? '▾' : '▸'}
                  </span>
                  
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                      <span style={{
                        background: priorityColor,
                        color: '#ffffff',
                        padding: '1px 4px',
                        borderRadius: '2px',
                        fontSize: '8px',
                        fontWeight: '700'
                      }}>
                        {priorityLabel}
                      </span>
                      
                      <span style={{ color: '#f48771', fontWeight: '600', fontSize: '11px' }}>
                        {key.key}
                      </span>
                    </div>
                    
                    <div style={{ fontSize: '9px', color: '#969696' }}>
                      {key.namespace}
                    </div>
                  </div>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '10px' }}>
                  <span style={{ color: '#969696' }}>
                    {key.usedAt.length} usage{key.usedAt.length !== 1 ? 's' : ''}
                  </span>
                  
                  <span style={{ color: '#969696' }}>
                    {formatLastUsed(key.lastUsed || 0)}
                  </span>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onKeySelect(key.key, key.namespace);
                    }}
                    style={{
                      background: '#007acc',
                      border: 'none',
                      color: '#ffffff',
                      padding: '3px 8px',
                      borderRadius: '2px',
                      fontSize: '9px',
                      cursor: 'pointer'
                    }}
                  >
                    Edit
                  </button>
                </div>
              </div>
              
              {/* Expanded details */}
              {isExpanded && (
                <div style={{ padding: '12px', borderTop: '1px solid #3c3c3c' }}>
                  {/* Default value */}
                  {key.defaultValue && (
                    <div style={{ marginBottom: '10px' }}>
                      <div style={{ fontSize: '10px', color: '#9cdcfe', marginBottom: '4px' }}>
                        Default Value:
                      </div>
                      <div style={{
                        background: '#1e1e1e',
                        padding: '6px 8px',
                        borderRadius: '2px',
                        fontSize: '11px',
                        color: '#cccccc',
                        fontFamily: 'monospace',
                        border: '1px solid #3c3c3c'
                      }}>
                        &ldquo;{key.defaultValue}&rdquo;
                      </div>
                    </div>
                  )}
                  
                  {/* Interpolation values */}
                  {key.interpolation && Object.keys(key.interpolation).length > 0 && (
                    <div style={{ marginBottom: '10px' }}>
                      <div style={{ fontSize: '10px', color: '#9cdcfe', marginBottom: '4px' }}>
                        Expected Variables:
                      </div>
                      <div style={{ fontSize: '10px', color: '#d19a66' }}>
                        {Object.keys(key.interpolation).map(varName => `{{${varName}}}`).join(', ')}
                      </div>
                    </div>
                  )}
                  
                  {/* Context */}
                  {key.context && (
                    <div style={{ marginBottom: '10px' }}>
                      <div style={{ fontSize: '10px', color: '#9cdcfe', marginBottom: '4px' }}>
                        Context:
                      </div>
                      <div style={{ fontSize: '10px', color: '#e5c07b' }}>
                        {key.context}
                      </div>
                    </div>
                  )}
                  
                  {/* Count (for pluralization) */}
                  {key.count !== undefined && (
                    <div style={{ marginBottom: '10px' }}>
                      <div style={{ fontSize: '10px', color: '#9cdcfe', marginBottom: '4px' }}>
                        Pluralization Count:
                      </div>
                      <div style={{ fontSize: '10px', color: '#3498db' }}>
                        {key.count}
                      </div>
                    </div>
                  )}
                  
                  {/* Usage locations */}
                  {key.usedAt.length > 0 && (
                    <div>
                      <div style={{ fontSize: '10px', color: '#9cdcfe', marginBottom: '4px' }}>
                        Used in Components:
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {key.usedAt.slice(0, 5).map((location, index) => (
                          <span
                            key={index}
                            style={{
                              background: '#2d2d30',
                              padding: '2px 6px',
                              borderRadius: '2px',
                              fontSize: '9px',
                              color: '#cccccc'
                            }}
                          >
                            {location}
                          </span>
                        ))}
                        {key.usedAt.length > 5 && (
                          <span style={{
                            background: '#2d2d30',
                            padding: '2px 6px',
                            borderRadius: '2px',
                            fontSize: '9px',
                            color: '#969696'
                          }}>
                            +{key.usedAt.length - 5} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {processedMissingKeys.length === 0 && searchQuery.trim() && (
        <div style={{
          textAlign: 'center',
          color: '#969696',
          fontSize: '12px',
          marginTop: '40px'
        }}>
          No missing keys match your search criteria
        </div>
      )}
      
      {/* Quick actions */}
      <div style={{
        marginTop: '30px',
        padding: '15px',
        background: '#252526',
        borderRadius: '4px',
        border: '1px solid #3c3c3c'
      }}>
        <h5 style={{ margin: '0 0 10px 0', color: '#9cdcfe', fontSize: '12px' }}>
          Quick Actions
        </h5>
        
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={() => {
              const highPriorityKeys = missingKeys.filter(k => k.usedAt.length >= 10);
              if (highPriorityKeys.length > 0) {
                onKeySelect(highPriorityKeys[0].key, highPriorityKeys[0].namespace);
              }
            }}
            disabled={missingKeys.filter(k => k.usedAt.length >= 10).length === 0}
            style={{
              padding: '6px 12px',
              fontSize: '11px',
              border: '1px solid #3c3c3c',
              background: '#5a1d1d',
              color: '#f48771',
              cursor: 'pointer',
              borderRadius: '3px'
            }}
          >
            Fix High Priority First
          </button>
          
          <button
            onClick={() => {
              // Export missing keys functionality would go here
              const exportData = JSON.stringify(missingKeys, null, 2);
              navigator.clipboard.writeText(exportData);
            }}
            style={{
              padding: '6px 12px',
              fontSize: '11px',
              border: '1px solid #3c3c3c',
              background: '#2d2d30',
              color: '#cccccc',
              cursor: 'pointer',
              borderRadius: '3px'
            }}
          >
            Export Missing Keys
          </button>
        </div>
      </div>
    </div>
  );
}