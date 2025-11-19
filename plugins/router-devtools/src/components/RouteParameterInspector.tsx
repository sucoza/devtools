/**
 * Route Parameter Inspector Component with Live Editing
 */

import React, { useState, useCallback } from 'react';
import { NavigationState, RouteParamEditContext } from '../types/router';
import { 
  updateParamEditContext, 
  hasParamErrors, 
  getParamErrorMessage, 
  parseSearchParams, 
  buildSearchString 
} from '../utils/param-validation';

interface RouteParameterInspectorProps {
  currentState: NavigationState | null;
  editContext: RouteParamEditContext;
  onEditContextChange: (context: RouteParamEditContext) => void;
  onParamUpdate: (params: Record<string, string>) => void;
  onSearchUpdate: (search: string) => void;
  onNavigate?: (to: string, options?: { replace?: boolean }) => void;
}

export function RouteParameterInspector({
  currentState,
  editContext,
  onEditContextChange,
  onParamUpdate,
  onSearchUpdate,
  onNavigate: _onNavigate
}: RouteParameterInspectorProps) {
  const [activeTab, setActiveTab] = useState<'params' | 'search' | 'state'>('params');
  const [showRawJson, setShowRawJson] = useState(false);

  const activeMatch = currentState?.matches?.[currentState.matches.length - 1];
  const _searchParams = parseSearchParams(currentState?.location.search || '');

  const handleParamEdit = useCallback((paramName: string, value: string) => {
    const newContext = updateParamEditContext(editContext, {
      pendingParams: { ...editContext.pendingParams, [paramName]: value },
      isEditing: true
    });
    onEditContextChange(newContext);
  }, [editContext, onEditContextChange]);

  const handleSearchParamEdit = useCallback((paramName: string, value: string) => {
    const currentSearchParams = parseSearchParams(editContext.pendingSearch);
    if (value === '') {
      delete currentSearchParams[paramName];
    } else {
      currentSearchParams[paramName] = value;
    }
    
    const newSearchString = buildSearchString(currentSearchParams);
    const newContext = updateParamEditContext(editContext, {
      pendingSearch: newSearchString,
      isEditing: true
    });
    onEditContextChange(newContext);
  }, [editContext, onEditContextChange]);

  const handleAddSearchParam = useCallback(() => {
    const currentSearchParams = parseSearchParams(editContext.pendingSearch);
    currentSearchParams['new-param'] = '';
    
    const newSearchString = buildSearchString(currentSearchParams);
    const newContext = updateParamEditContext(editContext, {
      pendingSearch: newSearchString,
      isEditing: true
    });
    onEditContextChange(newContext);
  }, [editContext, onEditContextChange]);

  const handleApplyChanges = useCallback(() => {
    if (hasParamErrors(editContext)) {
      return;
    }

    // Apply parameter changes
    const paramsChanged = JSON.stringify(editContext.currentParams) !== JSON.stringify(editContext.pendingParams);
    const searchChanged = editContext.currentSearch.toString() !== (editContext.pendingSearch.startsWith('?') ? editContext.pendingSearch.slice(1) : editContext.pendingSearch);

    if (paramsChanged) {
      onParamUpdate(editContext.pendingParams);
    }

    if (searchChanged) {
      onSearchUpdate(editContext.pendingSearch);
    }

    // Reset editing state
    const newContext = updateParamEditContext(editContext, {
      isEditing: false
    });
    onEditContextChange(newContext);
  }, [editContext, onParamUpdate, onSearchUpdate, onEditContextChange]);

  const handleResetChanges = useCallback(() => {
    const newContext = updateParamEditContext(editContext, {
      pendingParams: { ...editContext.currentParams },
      pendingSearch: '?' + editContext.currentSearch.toString(),
      isEditing: false
    });
    onEditContextChange(newContext);
  }, [editContext, onEditContextChange]);

  const hasChanges = editContext.isEditing && (
    JSON.stringify(editContext.currentParams) !== JSON.stringify(editContext.pendingParams) ||
    editContext.currentSearch.toString() !== (editContext.pendingSearch.startsWith('?') ? editContext.pendingSearch.slice(1) : editContext.pendingSearch)
  );

  if (!currentState) {
    return (
      <div style={{ 
        padding: '20px', 
        textAlign: 'center', 
        color: "var(--dt-text-secondary)",
        fontSize: '12px'
      }}>
        No route state available
      </div>
    );
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Tab Navigation */}
      <div style={{ 
        display: 'flex', 
        borderBottom: "1px solid var(--dt-border-primary)", 
        marginBottom: '10px',
        gap: '1px'
      }}>
        {[
          { key: 'params', label: 'Route Params' },
          { key: 'search', label: 'Query Params' },
          { key: 'state', label: 'Location State' }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as 'params' | 'search' | 'state')}
            style={{
              padding: '6px 12px',
              background: activeTab === tab.key ? "var(--dt-bg-primary)" : "transparent",
              border: 'none',
              borderBottom: activeTab === tab.key ? "2px solid var(--dt-border-focus)" : "2px solid transparent",
              color: activeTab === tab.key ? "var(--dt-text-primary)" : "var(--dt-text-secondary)",
              cursor: 'pointer',
              fontSize: '11px',
              fontWeight: '500'
            }}
          >
            {tab.label}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <button
          onClick={() => setShowRawJson(!showRawJson)}
          style={{
            padding: '4px 8px',
            fontSize: '10px',
            border: "1px solid var(--dt-border-primary)",
            background: showRawJson ? "var(--dt-status-success-bg)" : "var(--dt-bg-tertiary)",
            color: showRawJson ? "var(--dt-accent-secondary)" : "var(--dt-text-primary)",
            cursor: 'pointer',
            borderRadius: '3px',
            margin: '2px 4px'
          }}
        >
          {showRawJson ? 'Form View' : 'JSON View'}
        </button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {activeTab === 'params' && (
          <div>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '10px' 
            }}>
              <h4 style={{ margin: 0, color: "var(--dt-accent-primary)", fontSize: '12px' }}>
                Route Parameters
              </h4>
              <div style={{ fontSize: '11px', color: "var(--dt-text-secondary)" }}>
                {activeMatch?.route.path || 'No active route'}
              </div>
            </div>

            {showRawJson ? (
              <div style={{
                background: "var(--dt-bg-secondary)",
                border: "1px solid var(--dt-border-primary)",
                borderRadius: '4px',
                padding: '12px'
              }}>
                <pre style={{ 
                  fontSize: '11px', 
                  color: "var(--dt-text-primary)", 
                  margin: 0,
                  whiteSpace: 'pre-wrap' 
                }}>
                  {JSON.stringify({
                    current: editContext.currentParams,
                    pending: editContext.pendingParams,
                    route: activeMatch?.route.path
                  }, null, 2)}
                </pre>
              </div>
            ) : (
              <div style={{
                background: "var(--dt-bg-primary)",
                border: "1px solid var(--dt-border-primary)",
                borderRadius: '4px',
                padding: '12px'
              }}>
                {Object.keys(editContext.pendingParams).length === 0 ? (
                  <div style={{ 
                    color: "var(--dt-text-secondary)", 
                    fontStyle: 'italic', 
                    fontSize: '11px',
                    textAlign: 'center',
                    padding: '20px 0'
                  }}>
                    No route parameters in current route
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {Object.entries(editContext.pendingParams).map(([key, value]) => (
                      <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <label style={{ 
                          color: "var(--dt-status-error)", 
                          fontSize: '11px', 
                          minWidth: '80px',
                          fontWeight: '500' 
                        }}>
                          {key}:
                        </label>
                        <input
                          type="text"
                          value={value}
                          onChange={(e) => handleParamEdit(key, e.target.value)}
                          style={{
                            flex: 1,
                            padding: '4px 8px',
                            fontSize: '11px',
                            border: `1px solid ${editContext.errors[key] ? "var(--dt-status-error)" : "var(--dt-border-primary)"}`,
                            borderRadius: '3px',
                            background: "var(--dt-bg-secondary)",
                            color: "var(--dt-text-primary)"
                          }}
                        />
                        {editContext.errors[key] && (
                          <span style={{ 
                            color: "var(--dt-status-error)", 
                            fontSize: '10px',
                            minWidth: '120px'
                          }}>
                            {editContext.errors[key]}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'search' && (
          <div>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '10px' 
            }}>
              <h4 style={{ margin: 0, color: "var(--dt-accent-primary)", fontSize: '12px' }}>
                Query String Parameters
              </h4>
              <button
                onClick={handleAddSearchParam}
                style={{
                  padding: '4px 8px',
                  fontSize: '10px',
                  border: "1px solid var(--dt-border-primary)",
                  background: "var(--dt-bg-tertiary)",
                  color: "var(--dt-text-primary)",
                  cursor: 'pointer',
                  borderRadius: '3px'
                }}
              >
                Add Param
              </button>
            </div>

            {showRawJson ? (
              <div style={{
                background: "var(--dt-bg-secondary)",
                border: "1px solid var(--dt-border-primary)",
                borderRadius: '4px',
                padding: '12px'
              }}>
                <pre style={{ 
                  fontSize: '11px', 
                  color: "var(--dt-text-primary)", 
                  margin: 0,
                  whiteSpace: 'pre-wrap' 
                }}>
                  {JSON.stringify({
                    current: currentState.location.search,
                    pending: editContext.pendingSearch,
                    parsed: parseSearchParams(editContext.pendingSearch)
                  }, null, 2)}
                </pre>
              </div>
            ) : (
              <div style={{
                background: "var(--dt-bg-primary)",
                border: "1px solid var(--dt-border-primary)",
                borderRadius: '4px',
                padding: '12px'
              }}>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ 
                    color: "var(--dt-accent-primary)", 
                    fontSize: '11px',
                    display: 'block',
                    marginBottom: '4px'
                  }}>
                    Raw Query String:
                  </label>
                  <input
                    type="text"
                    value={editContext.pendingSearch}
                    onChange={(e) => {
                      const newContext = updateParamEditContext(editContext, {
                        pendingSearch: e.target.value,
                        isEditing: true
                      });
                      onEditContextChange(newContext);
                    }}
                    style={{
                      width: '100%',
                      padding: '4px 8px',
                      fontSize: '11px',
                      border: `1px solid ${editContext.errors.search ? "var(--dt-status-error)" : "var(--dt-border-primary)"}`,
                      borderRadius: '3px',
                      background: "var(--dt-bg-secondary)",
                      color: "var(--dt-text-primary)"
                    }}
                    placeholder="?param1=value1&param2=value2"
                  />
                  {editContext.errors.search && (
                    <div style={{ color: "var(--dt-status-error)", fontSize: '10px', marginTop: '4px' }}>
                      {editContext.errors.search}
                    </div>
                  )}
                </div>

                <div style={{ borderTop: "1px solid var(--dt-border-primary)", paddingTop: '12px' }}>
                  <div style={{ 
                    color: "var(--dt-accent-primary)", 
                    fontSize: '11px',
                    marginBottom: '8px'
                  }}>
                    Individual Parameters:
                  </div>
                  
                  {Object.keys(parseSearchParams(editContext.pendingSearch)).length === 0 ? (
                    <div style={{ 
                      color: "var(--dt-text-secondary)", 
                      fontStyle: 'italic', 
                      fontSize: '11px',
                      textAlign: 'center',
                      padding: '20px 0'
                    }}>
                      No query parameters
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {Object.entries(parseSearchParams(editContext.pendingSearch)).map(([key, value]) => (
                        <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <input
                            type="text"
                            value={key}
                            onChange={(e) => {
                              const currentParams = parseSearchParams(editContext.pendingSearch);
                              delete currentParams[key];
                              currentParams[e.target.value] = value;
                              
                              const newSearchString = buildSearchString(currentParams);
                              const newContext = updateParamEditContext(editContext, {
                                pendingSearch: newSearchString,
                                isEditing: true
                              });
                              onEditContextChange(newContext);
                            }}
                            style={{
                              minWidth: '80px',
                              padding: '4px 8px',
                              fontSize: '11px',
                              border: "1px solid var(--dt-border-primary)",
                              borderRadius: '3px',
                              background: "var(--dt-bg-secondary)",
                              color: "var(--dt-status-error)"
                            }}
                          />
                          <span style={{ color: "var(--dt-text-secondary)" }}>=</span>
                          <input
                            type="text"
                            value={value}
                            onChange={(e) => handleSearchParamEdit(key, e.target.value)}
                            style={{
                              flex: 1,
                              padding: '4px 8px',
                              fontSize: '11px',
                              border: "1px solid var(--dt-border-primary)",
                              borderRadius: '3px',
                              background: "var(--dt-bg-secondary)",
                              color: "var(--dt-status-success)"
                            }}
                          />
                          <button
                            onClick={() => handleSearchParamEdit(key, '')}
                            style={{
                              padding: '2px 6px',
                              fontSize: '10px',
                              border: "1px solid var(--dt-border-primary)",
                              background: "var(--dt-bg-tertiary)",
                              color: "var(--dt-status-error)",
                              cursor: 'pointer',
                              borderRadius: '2px'
                            }}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'state' && (
          <div>
            <h4 style={{ margin: '0 0 10px 0', color: "var(--dt-accent-primary)", fontSize: '12px' }}>
              Location State
            </h4>
            <div style={{
              background: "var(--dt-bg-secondary)",
              border: "1px solid var(--dt-border-primary)",
              borderRadius: '4px',
              padding: '12px'
            }}>
              <pre style={{ 
                fontSize: '11px', 
                color: "var(--dt-text-primary)", 
                margin: 0,
                whiteSpace: 'pre-wrap' 
              }}>
                {JSON.stringify({
                  pathname: currentState.location.pathname,
                  search: currentState.location.search,
                  hash: currentState.location.hash,
                  state: currentState.location.state,
                  key: currentState.location.key
                }, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>

      {/* Action buttons */}
      {hasChanges && (
        <div style={{
          marginTop: '10px',
          padding: '10px',
          background: "var(--dt-bg-secondary)",
          border: "1px solid var(--dt-border-primary)",
          borderRadius: '4px',
          display: 'flex',
          gap: '8px',
          justifyContent: 'flex-end'
        }}>
          {getParamErrorMessage(editContext) && (
            <div style={{ 
              flex: 1, 
              color: "var(--dt-status-error)", 
              fontSize: '10px',
              display: 'flex',
              alignItems: 'center'
            }}>
              {getParamErrorMessage(editContext)}
            </div>
          )}
          
          <button
            onClick={handleResetChanges}
            style={{
              padding: '6px 12px',
              fontSize: '11px',
              border: "1px solid var(--dt-border-primary)",
              background: "var(--dt-bg-tertiary)",
              color: "var(--dt-text-primary)",
              cursor: 'pointer',
              borderRadius: '3px'
            }}
          >
            Reset
          </button>
          
          <button
            onClick={handleApplyChanges}
            disabled={hasParamErrors(editContext)}
            style={{
              padding: '6px 12px',
              fontSize: '11px',
              border: "1px solid var(--dt-border-primary)",
              background: hasParamErrors(editContext) ? "var(--dt-border-primary)" : "var(--dt-status-success-bg)",
              color: hasParamErrors(editContext) ? "var(--dt-text-secondary)" : "var(--dt-accent-secondary)",
              cursor: hasParamErrors(editContext) ? 'not-allowed' : 'pointer',
              borderRadius: '3px'
            }}
          >
            Apply Changes
          </button>
        </div>
      )}
    </div>
  );
}