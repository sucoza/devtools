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
    if (usageCount >= 10) return 'var(--dt-status-error)'; // High priority - red
    if (usageCount >= 5) return 'var(--dt-status-warning)';  // Medium priority - orange
    if (usageCount >= 1) return 'var(--dt-status-warning)';  // Low priority - yellow
    return 'var(--dt-text-secondary)'; // Never used - gray
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
        color: 'var(--dt-status-success)',
        fontSize: '14px',
        background: 'var(--dt-bg-primary)',
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
        <div style={{ color: 'var(--dt-text-secondary)', fontSize: '12px' }}>
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
      background: 'var(--dt-bg-primary)'
    }}>
      {/* Header with stats */}
      <div style={{ marginBottom: '20px' }}>
        <h4 style={{ margin: '0 0 10px 0', color: 'var(--dt-status-error)', fontSize: '14px', fontWeight: '600' }}>
          ❌ Missing Translation Keys
        </h4>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
          gap: '10px',
          marginBottom: '15px'
        }}>
          <div style={{
            background: 'var(--dt-status-error-bg)',
            border: '1px solid var(--dt-status-error)',
            padding: '10px',
            borderRadius: '4px'
          }}>
            <div style={{ fontSize: '10px', color: 'var(--dt-status-error)', marginBottom: '4px' }}>Total Missing</div>
            <div style={{ fontSize: '18px', fontWeight: '600', color: 'var(--dt-text-on-primary)' }}>{missingKeys.length}</div>
          </div>
          
          <div style={{
            background: 'var(--dt-bg-tertiary)',
            border: '1px solid var(--dt-border-primary)',
            padding: '10px',
            borderRadius: '4px'
          }}>
            <div style={{ fontSize: '10px', color: 'var(--dt-text-secondary)', marginBottom: '4px' }}>Namespaces</div>
            <div style={{ fontSize: '18px', fontWeight: '600', color: 'var(--dt-text-primary)' }}>{namespaces.length}</div>
          </div>
          
          <div style={{
            background: 'var(--dt-bg-tertiary)',
            border: '1px solid var(--dt-border-primary)',
            padding: '10px',
            borderRadius: '4px'
          }}>
            <div style={{ fontSize: '10px', color: 'var(--dt-text-secondary)', marginBottom: '4px' }}>High Priority</div>
            <div style={{ fontSize: '18px', fontWeight: '600', color: 'var(--dt-status-error)' }}>
              {missingKeys.filter(k => k.usedAt.length >= 10).length}
            </div>
          </div>
          
          <div style={{
            background: 'var(--dt-bg-tertiary)',
            border: '1px solid var(--dt-border-primary)',
            padding: '10px',
            borderRadius: '4px'
          }}>
            <div style={{ fontSize: '10px', color: 'var(--dt-text-secondary)', marginBottom: '4px' }}>Never Used</div>
            <div style={{ fontSize: '18px', fontWeight: '600', color: 'var(--dt-text-secondary)' }}>
              {missingKeys.filter(k => k.usedAt.length === 0).length}
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div style={{
        marginBottom: '20px',
        padding: '15px',
        background: 'var(--dt-bg-tertiary)',
        borderRadius: '4px',
        border: '1px solid var(--dt-border-primary)'
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
              border: '1px solid var(--dt-border-primary)',
              background: 'var(--dt-bg-primary)',
              color: 'var(--dt-text-primary)',
              fontSize: '12px'
            }}
          />

          <select
            value={selectedNamespace || ''}
            onChange={(e) => setSelectedNamespace(e.target.value || null)}
            style={{
              padding: '6px 10px',
              borderRadius: '4px',
              border: '1px solid var(--dt-border-primary)',
              background: 'var(--dt-bg-primary)',
              color: 'var(--dt-text-primary)',
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
              border: '1px solid var(--dt-border-primary)',
              background: 'var(--dt-bg-primary)',
              color: 'var(--dt-text-primary)',
              fontSize: '11px'
            }}
          >
            <option value="usage">Sort by Usage</option>
            <option value="lastUsed">Sort by Last Used</option>
            <option value="key">Sort by Key</option>
            <option value="namespace">Sort by Namespace</option>
          </select>
        </div>
        
        <div style={{ fontSize: '10px', color: 'var(--dt-text-secondary)' }}>
          Showing {processedMissingKeys.length} of {missingKeys.length} missing keys
        </div>
      </div>

      {/* Namespace breakdown */}
      <div style={{
        marginBottom: '20px',
        padding: '15px',
        background: 'var(--dt-bg-tertiary)',
        borderRadius: '4px',
        border: '1px solid var(--dt-border-primary)'
      }}>
        <h5 style={{ margin: '0 0 10px 0', color: 'var(--dt-border-focus)', fontSize: '12px' }}>
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
                  background: selectedNamespace === namespace ? 'var(--dt-border-focus)' : 'var(--dt-bg-secondary)',
                  borderRadius: '3px',
                  cursor: 'pointer',
                  border: '1px solid',
                  borderColor: selectedNamespace === namespace ? 'var(--dt-border-focus)' : 'transparent'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--dt-status-success)', fontWeight: '500', fontSize: '11px' }}>
                    {namespace}
                  </span>
                  <span style={{ color: 'var(--dt-status-error)', fontWeight: '600', fontSize: '11px' }}>
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
                    <span style={{ color: 'var(--dt-status-error)' }}>🔴 {highPriorityCount}</span>
                  )}
                  {mediumPriorityCount > 0 && (
                    <span style={{ color: 'var(--dt-status-warning)' }}>🟡 {mediumPriorityCount}</span>
                  )}
                  {lowPriorityCount > 0 && (
                    <span style={{ color: 'var(--dt-status-warning)' }}>🟢 {lowPriorityCount}</span>
                  )}
                  {unusedCount > 0 && (
                    <span style={{ color: 'var(--dt-text-secondary)' }}>⚫ {unusedCount}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Missing keys list */}
      <div style={{ marginBottom: '20px' }}>
        <h5 style={{ margin: '0 0 15px 0', color: 'var(--dt-border-focus)', fontSize: '12px' }}>
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
                background: 'var(--dt-bg-tertiary)',
                border: '1px solid var(--dt-border-primary)',
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
                  background: 'var(--dt-bg-secondary)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                  <span style={{ fontSize: '10px', color: 'var(--dt-text-secondary)', minWidth: '12px' }}>
                    {isExpanded ? '▾' : '▸'}
                  </span>
                  
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                      <span style={{
                        background: priorityColor,
                        color: 'var(--dt-text-on-primary)',
                        padding: '1px 4px',
                        borderRadius: '2px',
                        fontSize: '8px',
                        fontWeight: '700'
                      }}>
                        {priorityLabel}
                      </span>
                      
                      <span style={{ color: 'var(--dt-status-error)', fontWeight: '600', fontSize: '11px' }}>
                        {key.key}
                      </span>
                    </div>
                    
                    <div style={{ fontSize: '9px', color: 'var(--dt-text-secondary)' }}>
                      {key.namespace}
                    </div>
                  </div>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '10px' }}>
                  <span style={{ color: 'var(--dt-text-secondary)' }}>
                    {key.usedAt.length} usage{key.usedAt.length !== 1 ? 's' : ''}
                  </span>
                  
                  <span style={{ color: 'var(--dt-text-secondary)' }}>
                    {formatLastUsed(key.lastUsed || 0)}
                  </span>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onKeySelect(key.key, key.namespace);
                    }}
                    style={{
                      background: 'var(--dt-border-focus)',
                      border: 'none',
                      color: 'var(--dt-text-on-primary)',
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
                <div style={{ padding: '12px', borderTop: '1px solid var(--dt-border-primary)' }}>
                  {/* Default value */}
                  {key.defaultValue && (
                    <div style={{ marginBottom: '10px' }}>
                      <div style={{ fontSize: '10px', color: 'var(--dt-border-focus)', marginBottom: '4px' }}>
                        Default Value:
                      </div>
                      <div style={{
                        background: 'var(--dt-bg-primary)',
                        padding: '6px 8px',
                        borderRadius: '2px',
                        fontSize: '11px',
                        color: 'var(--dt-text-primary)',
                        fontFamily: 'monospace',
                        border: '1px solid var(--dt-border-primary)'
                      }}>
                        &ldquo;{key.defaultValue}&rdquo;
                      </div>
                    </div>
                  )}
                  
                  {/* Interpolation values */}
                  {key.interpolation && Object.keys(key.interpolation).length > 0 && (
                    <div style={{ marginBottom: '10px' }}>
                      <div style={{ fontSize: '10px', color: 'var(--dt-border-focus)', marginBottom: '4px' }}>
                        Expected Variables:
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--dt-status-warning)' }}>
                        {Object.keys(key.interpolation).map(varName => `{{${varName}}}`).join(', ')}
                      </div>
                    </div>
                  )}
                  
                  {/* Context */}
                  {key.context && (
                    <div style={{ marginBottom: '10px' }}>
                      <div style={{ fontSize: '10px', color: 'var(--dt-border-focus)', marginBottom: '4px' }}>
                        Context:
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--dt-status-warning)' }}>
                        {key.context}
                      </div>
                    </div>
                  )}
                  
                  {/* Count (for pluralization) */}
                  {key.count !== undefined && (
                    <div style={{ marginBottom: '10px' }}>
                      <div style={{ fontSize: '10px', color: 'var(--dt-border-focus)', marginBottom: '4px' }}>
                        Pluralization Count:
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--dt-border-focus)' }}>
                        {key.count}
                      </div>
                    </div>
                  )}
                  
                  {/* Usage locations */}
                  {key.usedAt.length > 0 && (
                    <div>
                      <div style={{ fontSize: '10px', color: 'var(--dt-border-focus)', marginBottom: '4px' }}>
                        Used in Components:
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {key.usedAt.slice(0, 5).map((location, index) => (
                          <span
                            key={index}
                            style={{
                              background: 'var(--dt-bg-secondary)',
                              padding: '2px 6px',
                              borderRadius: '2px',
                              fontSize: '9px',
                              color: 'var(--dt-text-primary)'
                            }}
                          >
                            {location}
                          </span>
                        ))}
                        {key.usedAt.length > 5 && (
                          <span style={{
                            background: 'var(--dt-bg-secondary)',
                            padding: '2px 6px',
                            borderRadius: '2px',
                            fontSize: '9px',
                            color: 'var(--dt-text-secondary)'
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
          color: 'var(--dt-text-secondary)',
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
        background: 'var(--dt-bg-tertiary)',
        borderRadius: '4px',
        border: '1px solid var(--dt-border-primary)'
      }}>
        <h5 style={{ margin: '0 0 10px 0', color: 'var(--dt-border-focus)', fontSize: '12px' }}>
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
              border: '1px solid var(--dt-border-primary)',
              background: 'var(--dt-status-error-bg)',
              color: 'var(--dt-status-error)',
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
              border: '1px solid var(--dt-border-primary)',
              background: 'var(--dt-bg-secondary)',
              color: 'var(--dt-text-primary)',
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