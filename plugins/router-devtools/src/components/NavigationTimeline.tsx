/**
 * Navigation Timeline Component
 */

import React, { useState, useMemo } from 'react';
import { NavigationHistoryEntry, NavigationState } from '../types/router';

interface NavigationTimelineProps {
  history: NavigationHistoryEntry[];
  currentState: NavigationState | null;
  onNavigate: (to: string, options?: { replace?: boolean }) => void;
  onClearHistory: () => void;
}

interface TimelineEntryProps {
  entry: NavigationHistoryEntry;
  index: number;
  _index: number;
  isLatest: boolean;
  isCurrent: boolean;
  onNavigate: (to: string, options?: { replace?: boolean }) => void;
}

function TimelineEntry({ entry, _index, isLatest, isCurrent, onNavigate }: TimelineEntryProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const handleNavigateToEntry = () => {
    const url = entry.location.pathname + entry.location.search + entry.location.hash;
    onNavigate(url);
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'PUSH': return '#4ec9b0';
      case 'REPLACE': return '#f39c12';
      case 'POP': return '#3498db';
      default: return '#cccccc';
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'PUSH': return '→';
      case 'REPLACE': return '↻';
      case 'POP': return '←';
      default: return '•';
    }
  };

  const formatDuration = (duration?: number) => {
    if (!duration) return null;
    if (duration < 1000) return `${duration}ms`;
    return `${(duration / 1000).toFixed(1)}s`;
  };

  return (
    <div style={{
      background: isCurrent ? '#1e3a28' : '#252526',
      border: `1px solid ${isCurrent ? '#4ec9b0' : '#3c3c3c'}`,
      borderRadius: '4px',
      marginBottom: '8px',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div 
        style={{
          padding: '8px 12px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '11px'
        }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {/* Timeline connector */}
        <div style={{
          width: '20px',
          height: '20px',
          borderRadius: '50%',
          background: getActionColor(entry.action),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#1e1e1e',
          fontSize: '10px',
          fontWeight: 'bold'
        }}>
          {getActionIcon(entry.action)}
        </div>

        {/* Entry info */}
        <div style={{ flex: 1 }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            marginBottom: '2px'
          }}>
            <span style={{ color: '#cccccc', fontWeight: '500' }}>
              {entry.location.pathname}
            </span>
            {entry.location.search && (
              <span style={{ color: '#3498db', fontSize: '10px' }}>
                {entry.location.search}
              </span>
            )}
            {entry.location.hash && (
              <span style={{ color: '#f39c12', fontSize: '10px' }}>
                {entry.location.hash}
              </span>
            )}
            {isLatest && (
              <span style={{ 
                color: '#27ae60', 
                fontSize: '9px',
                background: '#1e3a28',
                padding: '1px 4px',
                borderRadius: '2px'
              }}>
                LATEST
              </span>
            )}
            {isCurrent && (
              <span style={{ 
                color: '#4ec9b0', 
                fontSize: '9px',
                background: '#1e3a28',
                padding: '1px 4px',
                borderRadius: '2px'
              }}>
                CURRENT
              </span>
            )}
          </div>
          
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px',
            color: '#969696',
            fontSize: '10px'
          }}>
            <span>{new Date(entry.timestamp).toLocaleTimeString()}</span>
            <span style={{ color: getActionColor(entry.action) }}>{entry.action}</span>
            {entry.duration && (
              <span>Duration: {formatDuration(entry.duration)}</span>
            )}
            {entry.loadingState && entry.loadingState !== 'idle' && (
              <span style={{ color: '#f39c12' }}>
                {entry.loadingState.toUpperCase()}
              </span>
            )}
          </div>
        </div>

        {/* Expand indicator */}
        <div style={{
          color: '#969696',
          fontSize: '10px',
          transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
          transition: 'transform 0.1s ease'
        }}>
          ▶
        </div>
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <div style={{
          borderTop: '1px solid #3c3c3c',
          padding: '12px'
        }}>
          {/* Matches */}
          {entry.matches.length > 0 && (
            <div style={{ marginBottom: '12px' }}>
              <div style={{ 
                color: '#9cdcfe', 
                fontSize: '10px', 
                marginBottom: '6px',
                fontWeight: '500'
              }}>
                Route Matches ({entry.matches.length}):
              </div>
              <div style={{ marginLeft: '8px' }}>
                {entry.matches.map((match, idx) => (
                  <div key={idx} style={{ 
                    fontSize: '10px', 
                    marginBottom: '4px',
                    display: 'flex',
                    gap: '8px'
                  }}>
                    <span style={{ color: '#e74c3c', minWidth: '60px' }}>
                      {match.route.path || '/'}
                    </span>
                    {match.route.element && (
                      <span style={{ color: '#8e44ad' }}>
                        {match.route.element}
                      </span>
                    )}
                    {Object.keys(match.params).length > 0 && (
                      <span style={{ color: '#3498db' }}>
                        {Object.entries(match.params).map(([key, value]) => 
                          `${key}=${value}`
                        ).join(', ')}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Location details */}
          <div style={{ marginBottom: '12px' }}>
            <div style={{ 
              color: '#9cdcfe', 
              fontSize: '10px', 
              marginBottom: '6px',
              fontWeight: '500'
            }}>
              Location Details:
            </div>
            <div style={{ 
              background: '#1e1e1e', 
              border: '1px solid #3c3c3c',
              borderRadius: '3px',
              padding: '8px',
              fontSize: '10px'
            }}>
              <pre style={{ margin: 0, color: '#d4d4d4' }}>
                {JSON.stringify({
                  pathname: entry.location.pathname,
                  search: entry.location.search,
                  hash: entry.location.hash,
                  state: entry.location.state,
                  key: entry.location.key
                }, null, 2)}
              </pre>
            </div>
          </div>

          {/* Actions */}
          <div style={{ 
            display: 'flex', 
            gap: '6px',
            justifyContent: 'flex-end'
          }}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigator.clipboard.writeText(
                  entry.location.pathname + entry.location.search + entry.location.hash
                );
              }}
              style={{
                padding: '4px 8px',
                fontSize: '10px',
                border: '1px solid #3c3c3c',
                background: '#2d2d30',
                color: '#cccccc',
                cursor: 'pointer',
                borderRadius: '2px'
              }}
            >
              Copy URL
            </button>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleNavigateToEntry();
              }}
              style={{
                padding: '4px 8px',
                fontSize: '10px',
                border: '1px solid #3c3c3c',
                background: '#1e5f1e',
                color: '#4ec9b0',
                cursor: 'pointer',
                borderRadius: '2px'
              }}
            >
              Go to URL
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function NavigationTimeline({ 
  history, 
  currentState, 
  onNavigate, 
  onClearHistory 
}: NavigationTimelineProps) {
  const [filterAction, setFilterAction] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  const filteredHistory = useMemo(() => {
    let filtered = [...history];
    
    if (filterAction !== 'all') {
      filtered = filtered.filter(entry => entry.action === filterAction);
    }
    
    filtered.sort((a, b) => 
      sortOrder === 'desc' ? b.timestamp - a.timestamp : a.timestamp - b.timestamp
    );
    
    return filtered;
  }, [history, filterAction, sortOrder]);

  const stats = useMemo(() => {
    const actionCounts = history.reduce((acc, entry) => {
      acc[entry.action] = (acc[entry.action] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const averageDuration = history
      .filter(entry => entry.duration)
      .reduce((sum, entry, _, arr) => sum + ((entry.duration ?? 0) / arr.length), 0);

    return { actionCounts, averageDuration };
  }, [history]);

  if (history.length === 0) {
    return (
      <div style={{
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        color: '#969696',
        fontSize: '12px'
      }}>
        <div style={{ marginBottom: '8px' }}>No navigation history</div>
        <div style={{ fontSize: '11px' }}>
          Navigate around your application to see the timeline.
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header with stats and controls */}
      <div style={{
        padding: '8px 12px',
        background: '#252526',
        border: '1px solid #3c3c3c',
        borderRadius: '4px',
        marginBottom: '10px',
        fontSize: '11px'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '8px'
        }}>
          <span style={{ color: '#9cdcfe', fontWeight: '500' }}>
            Navigation Timeline
          </span>
          <span style={{ color: '#969696' }}>
            {history.length} entries
          </span>
        </div>

        {/* Stats */}
        <div style={{ 
          display: 'flex', 
          gap: '16px', 
          marginBottom: '8px',
          fontSize: '10px',
          color: '#969696'
        }}>
          <span>PUSH: {stats.actionCounts.PUSH || 0}</span>
          <span>REPLACE: {stats.actionCounts.REPLACE || 0}</span>
          <span>POP: {stats.actionCounts.POP || 0}</span>
          {stats.averageDuration > 0 && (
            <span>Avg Duration: {stats.averageDuration.toFixed(1)}ms</span>
          )}
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            style={{
              padding: '2px 6px',
              fontSize: '10px',
              border: '1px solid #3c3c3c',
              background: '#2d2d30',
              color: '#cccccc',
              borderRadius: '2px'
            }}
          >
            <option value="all">All Actions</option>
            <option value="PUSH">Push Only</option>
            <option value="REPLACE">Replace Only</option>
            <option value="POP">Pop Only</option>
          </select>

          <button
            onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
            style={{
              padding: '2px 6px',
              fontSize: '10px',
              border: '1px solid #3c3c3c',
              background: '#2d2d30',
              color: '#cccccc',
              cursor: 'pointer',
              borderRadius: '2px'
            }}
          >
            {sortOrder === 'desc' ? '↓ Newest' : '↑ Oldest'}
          </button>

          <div style={{ flex: 1 }} />

          <button
            onClick={onClearHistory}
            style={{
              padding: '2px 8px',
              fontSize: '10px',
              border: '1px solid #3c3c3c',
              background: '#2d2d30',
              color: '#e74c3c',
              cursor: 'pointer',
              borderRadius: '2px'
            }}
          >
            Clear All
          </button>
        </div>
      </div>

      {/* Timeline entries */}
      <div style={{ 
        flex: 1, 
        overflowY: 'auto',
        padding: '0 4px'
      }}>
        {filteredHistory.length === 0 ? (
          <div style={{
            textAlign: 'center',
            color: '#969696',
            fontSize: '11px',
            padding: '20px 0'
          }}>
            No entries match the current filter
          </div>
        ) : (
          filteredHistory.map((entry, index) => (
            <TimelineEntry
              key={entry.id}
              entry={entry}
              index={index}
              _index={index}
              isLatest={index === 0 && sortOrder === 'desc'}
              isCurrent={currentState ? 
                entry.location.pathname === currentState.location.pathname &&
                entry.location.search === currentState.location.search &&
                entry.location.hash === currentState.location.hash
                : false
              }
              onNavigate={onNavigate}
            />
          ))
        )}
      </div>
    </div>
  );
}