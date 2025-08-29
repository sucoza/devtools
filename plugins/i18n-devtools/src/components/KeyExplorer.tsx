/**
 * Key Explorer Component
 * Displays and manages translation keys with search and filtering
 */

import React, { useMemo } from 'react';
import type { Translation, TranslationKey } from '../types/i18n';

interface KeyExplorerProps {
  translations: Translation[];
  searchResults: TranslationKey[];
  selectedKey: string | null;
  selectedNamespace: string | null;
  onKeySelect: (key: string, namespace: string) => void;
  expandedKeys: Set<string>;
  onToggleExpansion: (keyId: string) => void;
}

export function KeyExplorer({
  translations,
  searchResults,
  selectedKey,
  selectedNamespace,
  onKeySelect,
  expandedKeys,
  onToggleExpansion
}: KeyExplorerProps) {
  // Group translations by namespace and key structure
  const groupedTranslations = useMemo(() => {
    const groups: Record<string, Record<string, Translation[]>> = {};
    
    translations.forEach(translation => {
      if (!groups[translation.namespace]) {
        groups[translation.namespace] = {};
      }
      
      const keyParts = translation.key.split('.');
      const topLevelKey = keyParts[0];
      
      if (!groups[translation.namespace][topLevelKey]) {
        groups[translation.namespace][topLevelKey] = [];
      }
      
      groups[translation.namespace][topLevelKey].push(translation);
    });
    
    return groups;
  }, [translations]);

  const renderTranslationValue = (value: any): string => {
    if (typeof value === 'string') {
      return value.length > 50 ? `${value.substring(0, 50)}...` : value;
    }
    if (typeof value === 'object') {
      return '[Object]';
    }
    return String(value);
  };

  const getKeyStatus = (translations: Translation[]) => {
    const missingCount = translations.filter(t => t.isMissing).length;
    const partialCount = translations.filter(t => t.isPartiallyTranslated).length;
    
    if (missingCount > 0) return 'missing';
    if (partialCount > 0) return 'partial';
    return 'complete';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'missing': return { icon: '❌', color: '#f48771' };
      case 'partial': return { icon: '⚠️', color: '#d19a66' };
      case 'complete': return { icon: '✅', color: '#4ec9b0' };
      default: return { icon: '🔑', color: '#cccccc' };
    }
  };

  if (translations.length === 0) {
    return (
      <div style={{ 
        padding: '20px', 
        textAlign: 'center', 
        color: '#969696',
        fontSize: '12px'
      }}>
        {searchResults.length > 0 ? 'No translations match your search criteria' : 'No translations available'}
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
      <div style={{ marginBottom: '15px' }}>
        <h4 style={{ margin: '0 0 10px 0', color: '#9cdcfe', fontSize: '13px' }}>
          Translation Keys {translations.length > 0 && `(${translations.length})`}
        </h4>
        
        {Object.keys(groupedTranslations).length > 1 && (
          <div style={{ 
            fontSize: '11px', 
            color: '#969696',
            marginBottom: '10px'
          }}>
            Showing keys from {Object.keys(groupedTranslations).length} namespace(s)
          </div>
        )}
      </div>

      {Object.entries(groupedTranslations).map(([namespace, keys]) => (
        <div key={namespace} style={{ marginBottom: '20px' }}>
          <div style={{ 
            fontSize: '12px',
            fontWeight: '600',
            color: '#4ec9b0',
            marginBottom: '10px',
            padding: '6px 0',
            borderBottom: '1px solid #3c3c3c'
          }}>
            {namespace} ({Object.keys(keys).length} keys)
          </div>

          {Object.entries(keys).map(([topLevelKey, keyTranslations]) => {
            const keyId = `${namespace}:${topLevelKey}`;
            const isExpanded = expandedKeys.has(keyId);
            const status = getKeyStatus(keyTranslations);
            const { icon, color } = getStatusIcon(status);
            
            // Group by actual key (in case of nested keys)
            const translationsByKey: Record<string, Translation[]> = {};
            keyTranslations.forEach(t => {
              if (!translationsByKey[t.key]) {
                translationsByKey[t.key] = [];
              }
              translationsByKey[t.key].push(t);
            });

            return (
              <div key={keyId} style={{ marginBottom: '8px' }}>
                {/* Top-level key */}
                <div
                  onClick={() => onToggleExpansion(keyId)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 12px',
                    background: selectedKey === topLevelKey && selectedNamespace === namespace 
                      ? '#094771' 
                      : '#252526',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    border: '1px solid',
                    borderColor: selectedKey === topLevelKey && selectedNamespace === namespace 
                      ? '#007acc' 
                      : 'transparent',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <span style={{ fontSize: '10px', color: '#969696', minWidth: '12px' }}>
                    {Object.keys(translationsByKey).length > 1 ? (isExpanded ? '▾' : '▸') : '•'}
                  </span>
                  
                  <span style={{ color, fontSize: '12px' }}>{icon}</span>
                  
                  <span style={{ 
                    color: status === 'missing' ? '#f48771' : '#cccccc',
                    fontWeight: '500',
                    fontSize: '11px',
                    flex: 1
                  }}>
                    {topLevelKey}
                  </span>
                  
                  <span style={{ 
                    fontSize: '10px', 
                    color: '#969696',
                    background: '#2d2d30',
                    padding: '2px 6px',
                    borderRadius: '2px'
                  }}>
                    {keyTranslations.length} lang{keyTranslations.length !== 1 ? 's' : ''}
                  </span>
                </div>

                {/* Expanded content */}
                {isExpanded && Object.keys(translationsByKey).length > 1 && (
                  <div style={{ 
                    marginLeft: '20px',
                    marginTop: '6px',
                    borderLeft: '1px solid #3c3c3c',
                    paddingLeft: '12px'
                  }}>
                    {Object.entries(translationsByKey).map(([fullKey, translations]) => (
                      <div 
                        key={fullKey}
                        onClick={() => onKeySelect(fullKey, namespace)}
                        style={{
                          padding: '6px 10px',
                          margin: '3px 0',
                          background: selectedKey === fullKey && selectedNamespace === namespace 
                            ? '#094771' 
                            : '#2a2a2a',
                          borderRadius: '3px',
                          cursor: 'pointer',
                          fontSize: '10px'
                        }}
                      >
                        <div style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center',
                          marginBottom: '3px'
                        }}>
                          <span style={{ 
                            color: getKeyStatus(translations) === 'missing' ? '#f48771' : '#cccccc',
                            fontWeight: '500'
                          }}>
                            {fullKey}
                          </span>
                          <span style={{ 
                            color: getStatusIcon(getKeyStatus(translations)).color,
                            fontSize: '10px'
                          }}>
                            {getStatusIcon(getKeyStatus(translations)).icon}
                          </span>
                        </div>
                        
                        <div style={{ color: '#969696', fontSize: '9px' }}>
                          {translations.map(t => (
                            <div key={t.language} style={{ 
                              display: 'flex', 
                              justifyContent: 'space-between',
                              margin: '1px 0'
                            }}>
                              <span>{t.language}:</span>
                              <span style={{ 
                                color: t.isMissing ? '#f48771' : '#cccccc',
                                maxWidth: '150px',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}>
                                {t.isMissing ? '[MISSING]' : renderTranslationValue(t.value)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Single key content */}
                {!isExpanded && Object.keys(translationsByKey).length === 1 && (
                  <div 
                    onClick={() => onKeySelect(Object.keys(translationsByKey)[0], namespace)}
                    style={{ 
                      marginTop: '4px',
                      marginLeft: '32px',
                      fontSize: '10px',
                      color: '#969696'
                    }}
                  >
                    {Object.values(translationsByKey)[0].map(t => (
                      <div key={t.language} style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between',
                        margin: '2px 0',
                        padding: '2px 0'
                      }}>
                        <span>{t.language}:</span>
                        <span style={{ 
                          color: t.isMissing ? '#f48771' : '#cccccc',
                          maxWidth: '200px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {t.isMissing ? '[MISSING]' : renderTranslationValue(t.value)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}
      
      {searchResults.length > 0 && searchResults.length !== translations.length && (
        <div style={{ 
          marginTop: '20px',
          padding: '10px',
          background: '#2d2d30',
          borderRadius: '4px',
          border: '1px solid #3c3c3c'
        }}>
          <h5 style={{ margin: '0 0 8px 0', color: '#9cdcfe', fontSize: '11px' }}>
            Search Results ({searchResults.length})
          </h5>
          {searchResults.slice(0, 50).map(key => (
            <div
              key={`${key.namespace}:${key.key}`}
              onClick={() => onKeySelect(key.key, key.namespace)}
              style={{
                padding: '4px 8px',
                margin: '2px 0',
                background: selectedKey === key.key && selectedNamespace === key.namespace 
                  ? '#094771' 
                  : 'transparent',
                borderRadius: '2px',
                cursor: 'pointer',
                fontSize: '10px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <span style={{ color: '#cccccc' }}>
                {key.namespace}.{key.key}
              </span>
              <span style={{ color: '#969696' }}>
                {key.usedAt.length} usage{key.usedAt.length !== 1 ? 's' : ''}
              </span>
            </div>
          ))}
          
          {searchResults.length > 50 && (
            <div style={{ 
              fontSize: '9px', 
              color: '#969696', 
              textAlign: 'center',
              marginTop: '6px'
            }}>
              Showing first 50 of {searchResults.length} results
            </div>
          )}
        </div>
      )}
    </div>
  );
}