import React, { useState } from 'react';
import { Filter, Search, ExternalLink, Clock, AlertCircle, CheckCircle } from 'lucide-react';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, COMPONENT_STYLES, mergeStyles } from '@sucoza/shared-components';
import { useInterceptor } from '../hooks/useInterceptor';
import type { HttpMethod } from '../types';
import { ApiCallDetails } from './ApiCallDetails';
import { FilterPanel } from './FilterPanel';

/**
 * API Calls tab component
 */
export function ApiCallsTab() {
  const { state, actions, selectors } = useInterceptor();
  const [searchQuery, setSearchQuery] = useState('');
  
  const filteredCalls = selectors.getFilteredApiCalls();
  const selectedCall = selectors.getSelectedCall();
  
  // Further filter by search query
  const searchFilteredCalls = filteredCalls.filter(call => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      call.request.url.toLowerCase().includes(query) ||
      call.request.method.toLowerCase().includes(query) ||
      (call.response?.status.toString().includes(query)) ||
      (call.error?.toLowerCase().includes(query))
    );
  });

  const getMethodColor = (method: HttpMethod) => {
    const colors = {
      GET: { color: COLORS.status.success, background: 'rgba(78, 201, 176, 0.1)' },
      POST: { color: COLORS.status.info, background: 'rgba(52, 152, 219, 0.1)' },
      PUT: { color: COLORS.status.warning, background: 'rgba(243, 156, 18, 0.1)' },
      PATCH: { color: '#f39c12', background: 'rgba(243, 156, 18, 0.1)' },
      DELETE: { color: COLORS.status.error, background: 'rgba(231, 76, 60, 0.1)' },
      HEAD: { color: COLORS.text.muted, background: COLORS.background.tertiary },
      OPTIONS: { color: '#9b59b6', background: 'rgba(155, 89, 182, 0.1)' },
    };
    return colors[method] || colors.GET;
  };

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) {
      return COLORS.status.success;
    } else if (status >= 300 && status < 400) {
      return COLORS.status.warning;
    } else if (status >= 400 && status < 500) {
      return '#f39c12';
    } else if (status >= 500) {
      return COLORS.status.error;
    }
    return COLORS.text.muted;
  };

  const formatDuration = (duration?: number) => {
    if (!duration) return '-';
    if (duration < 1000) return `${duration}ms`;
    return `${(duration / 1000).toFixed(2)}s`;
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const truncateUrl = (url: string, maxLength = 60) => {
    if (url.length <= maxLength) return url;
    return `${url.substring(0, maxLength)}...`;
  };

  return (
    <div style={{ display: 'flex', height: '100%' }}>
      {/* API Calls List */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        borderRight: `1px solid ${COLORS.border.primary}`
      }}>
        {/* Search and Filter Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: SPACING.md,
          padding: SPACING.lg,
          background: COLORS.background.secondary,
          borderBottom: `1px solid ${COLORS.border.primary}`
        }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search style={{
              position: 'absolute',
              left: SPACING.lg,
              top: '50%',
              transform: 'translateY(-50%)',
              width: '16px',
              height: '16px',
              color: COLORS.text.muted
            }} />
            <input
              type="text"
              placeholder="Search API calls..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={mergeStyles(COMPONENT_STYLES.input.search, {
                paddingLeft: '40px'
              })}
            />
          </div>
          <button
            onClick={actions.toggleFilters}
            style={mergeStyles(
              COMPONENT_STYLES.button.base,
              state.ui.showFilters ? COMPONENT_STYLES.button.active : {}
            )}
          >
            <Filter style={{ width: '16px', height: '16px' }} />
            Filters
          </button>
        </div>

        {/* Filter Panel */}
        {state.ui.showFilters && <FilterPanel />}

        {/* API Calls List */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {searchFilteredCalls.length === 0 ? (
            <div style={COMPONENT_STYLES.empty.container}>
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  fontSize: TYPOGRAPHY.fontSize.lg,
                  fontWeight: TYPOGRAPHY.fontWeight.medium,
                  marginBottom: SPACING.md
                }}>No API calls found</div>
                <div style={{ fontSize: TYPOGRAPHY.fontSize.sm }}>
                  {!state.isInterceptionEnabled
                    ? 'Enable interception to start capturing API calls'
                    : 'Make some API requests to see them here'
                  }
                </div>
              </div>
            </div>
          ) : (
            <div>
              {searchFilteredCalls.map((call) => (
                <div
                  key={call.id}
                  onClick={() => actions.selectCall(call.id)}
                  style={mergeStyles(
                    COMPONENT_STYLES.list.item.base,
                    selectedCall?.id === call.id ? COMPONENT_STYLES.list.item.selected : {}
                  )}
                  onMouseEnter={(e) => {
                    if (selectedCall?.id !== call.id) {
                      e.currentTarget.style.background = COLORS.background.hover;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedCall?.id !== call.id) {
                      e.currentTarget.style.background = 'transparent';
                    }
                  }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: SPACING.md
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.md }}>
                      <span
                        style={{
                          padding: `${SPACING.xs} ${SPACING.md}`,
                          fontSize: TYPOGRAPHY.fontSize.xs,
                          fontWeight: TYPOGRAPHY.fontWeight.medium,
                          borderRadius: RADIUS.md,
                          ...getMethodColor(call.request.method)
                        }}
                      >
                        {call.request.method}
                      </span>
                      
                      {call.response && (
                        <span style={{
                          fontSize: TYPOGRAPHY.fontSize.sm,
                          fontWeight: TYPOGRAPHY.fontWeight.medium,
                          color: getStatusColor(call.response.status)
                        }}>
                          {call.response.status}
                        </span>
                      )}
                      
                      {call.error && (
                        <AlertCircle style={{ width: '16px', height: '16px', color: COLORS.status.error }} />
                      )}
                      
                      {call.isMocked && (
                        <CheckCircle style={{ width: '16px', height: '16px', color: COLORS.status.success }} />
                      )}
                    </div>
                    
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: SPACING.md,
                      fontSize: TYPOGRAPHY.fontSize.xs,
                      color: COLORS.text.muted
                    }}>
                      <span>{formatDuration(call.duration)}</span>
                      <Clock style={{ width: '12px', height: '12px' }} />
                      <span>{formatTimestamp(call.timestamp)}</span>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{
                      fontSize: TYPOGRAPHY.fontSize.sm,
                      color: COLORS.text.primary,
                      fontFamily: TYPOGRAPHY.fontFamily.mono
                    }}>
                      {truncateUrl(call.request.url)}
                    </span>
                    <ExternalLink style={{ width: '16px', height: '16px', color: COLORS.text.muted }} />
                  </div>
                  
                  {call.error && (
                    <div style={{
                      marginTop: SPACING.md,
                      fontSize: TYPOGRAPHY.fontSize.sm,
                      color: COLORS.status.error,
                      background: 'rgba(231, 76, 60, 0.1)',
                      padding: SPACING.md,
                      borderRadius: RADIUS.md
                    }}>
                      {call.error}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* API Call Details */}
      <div style={{ width: '50%' }}>
        {selectedCall ? (
          <ApiCallDetails call={selectedCall} />
        ) : (
          <div style={COMPONENT_STYLES.empty.container}>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                fontSize: TYPOGRAPHY.fontSize.lg,
                fontWeight: TYPOGRAPHY.fontWeight.medium,
                marginBottom: SPACING.md
              }}>Select an API call</div>
              <div style={{ fontSize: TYPOGRAPHY.fontSize.sm }}>Click on an API call to view its details</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ApiCallsTab;