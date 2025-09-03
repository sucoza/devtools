/**
 * Navigation Timeline Component
 */

import React, { useState, useMemo } from 'react';
import {
  DataTable,
  Badge,
  EmptyState,
  type Column
} from '@sucoza/shared-components';
import { Clock, Navigation, Copy, ExternalLink } from 'lucide-react';
import { NavigationHistoryEntry, NavigationState } from '../types/router';

interface NavigationTimelineProps {
  history: NavigationHistoryEntry[];
  currentState: NavigationState | null;
  onNavigate: (to: string, options?: { replace?: boolean }) => void;
  onClearHistory: () => void;
}

function getActionVariant(action: string): 'success' | 'warning' | 'info' | 'default' {
  switch (action) {
    case 'PUSH': return 'success';
    case 'REPLACE': return 'warning';
    case 'POP': return 'info';
    default: return 'default';
  }
}

function formatDuration(duration?: number) {
  if (!duration) return '-';
  if (duration < 1000) return `${duration}ms`;
  return `${(duration / 1000).toFixed(1)}s`;
}


export function NavigationTimeline({ 
  history, 
  currentState, 
  onNavigate, 
  onClearHistory 
}: NavigationTimelineProps) {
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  
  // Using onClearHistory in parent component, not directly here
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _unused = onClearHistory;

  // Define columns for DataTable
  const columns: Column<NavigationHistoryEntry>[] = useMemo(() => [
    {
      key: 'timestamp',
      header: 'Time',
      width: 100,
      sortable: true,
      render: (_value, row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Clock size={12} />
          <span>{new Date(row.timestamp).toLocaleTimeString()}</span>
        </div>
      )
    },
    {
      key: 'action',
      header: 'Action',
      width: 80,
      sortable: true,
      filterable: true,
      render: (_value, row) => (
        <Badge
          variant={getActionVariant(row.action)}
          size="sm"
        >
          {row.action}
        </Badge>
      )
    },
    {
      key: 'path',
      header: 'Path',
      width: 200,
      sortable: true,
      render: (_value, row) => {
        const isCurrent = currentState ? 
          row.location.pathname === currentState.location.pathname &&
          row.location.search === currentState.location.search &&
          row.location.hash === currentState.location.hash
          : false;
          
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Navigation size={12} />
            <span style={{
              fontWeight: isCurrent ? 'bold' : 'normal',
              color: isCurrent ? '#4ec9b0' : undefined
            }}>
              {row.location.pathname}
            </span>
            {isCurrent && (
              <Badge variant="success" size="xs">CURRENT</Badge>
            )}
          </div>
        );
      }
    },
    {
      key: 'search',
      header: 'Query',
      width: 150,
      render: (_value, row) => (
        <span style={{ color: '#3498db', fontSize: '11px' }}>
          {row.location.search || '-'}
        </span>
      )
    },
    {
      key: 'hash',
      header: 'Hash',
      width: 100,
      render: (_value, row) => (
        <span style={{ color: '#f39c12', fontSize: '11px' }}>
          {row.location.hash || '-'}
        </span>
      )
    },
    {
      key: 'duration',
      header: 'Duration',
      width: 80,
      sortable: true,
      align: 'right' as const,
      render: (_value, row) => (
        <span>{formatDuration(row.duration)}</span>
      )
    },
    {
      key: 'matches',
      header: 'Matches',
      width: 80,
      align: 'center' as const,
      render: (_value, row) => (
        <Badge
          variant="info"
          size="sm"
        >
          {row.matches.length.toString()}
        </Badge>
      )
    }
  ], [currentState]);

  // Row actions
  const rowActions = useMemo(() => [
    {
      label: 'Copy URL',
      icon: <Copy size={12} />,
      onClick: (row: NavigationHistoryEntry) => {
        const url = row.location.pathname + row.location.search + row.location.hash;
        navigator.clipboard.writeText(url);
      }
    },
    {
      label: 'Navigate',
      icon: <ExternalLink size={12} />,
      onClick: (row: NavigationHistoryEntry) => {
        const url = row.location.pathname + row.location.search + row.location.hash;
        onNavigate(url);
      }
    }
  ], [onNavigate]);

  // Render expanded row details
  const renderExpandedRow = (row: NavigationHistoryEntry) => (
    <div style={{ padding: 16, background: '#1e1e1e', border: '1px solid #3c3c3c' }}>
      <div style={{ marginBottom: 12 }}>
        <h4 style={{ color: '#9cdcfe', fontSize: 12, margin: '0 0 8px 0' }}>Route Matches:</h4>
        {row.matches.length === 0 ? (
          <p style={{ color: '#969696', fontSize: 11 }}>No route matches</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {row.matches.map((match, idx) => (
              <div key={idx} style={{ fontSize: 11, display: 'flex', gap: 8 }}>
                <span style={{ color: '#e74c3c', minWidth: 60 }}>
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
        )}
      </div>
      
      <div>
        <h4 style={{ color: '#9cdcfe', fontSize: 12, margin: '0 0 8px 0' }}>Location Details:</h4>
        <pre style={{
          background: '#252526',
          border: '1px solid #3c3c3c',
          padding: 8,
          borderRadius: 4,
          fontSize: 10,
          color: '#d4d4d4',
          margin: 0,
          overflow: 'auto'
        }}>
          {JSON.stringify({
            pathname: row.location.pathname,
            search: row.location.search,
            hash: row.location.hash,
            state: row.location.state,
            key: row.location.key
          }, null, 2)}
        </pre>
      </div>
    </div>
  );

  if (history.length === 0) {
    return (
      <EmptyState
        icon={<Navigation size={48} />}
        title="No navigation history"
        description="Navigate around your application to see the timeline."
      />
    );
  }

  return (
    <DataTable<NavigationHistoryEntry>
      data={history}
      columns={columns}
      sortable
      filterable
      searchable
      expandable
      selectable
      hover
      striped
      bordered
      stickyHeader
      maxHeight="100%"
      selectedRows={selectedRows}
      onSelectionChange={setSelectedRows}
      expandedRows={expandedRows}
      onExpansionChange={setExpandedRows}
      renderExpandedRow={renderExpandedRow}
      rowActions={rowActions}
      bulkActions={[
        {
          label: 'Clear Selected',
          icon: <Copy size={16} />,
          onClick: (selectedEntries) => {
            // Clear selected history entries if needed
            // Future: implement bulk clear functionality
            void selectedEntries;
          }
        }
      ]}
      emptyMessage="No navigation history available. Navigate around your application to see entries here."
      getRowKey={(row, index) => row.id || index}
      getRowClassName={(row) => {
        const isCurrent = currentState ? 
          row.location.pathname === currentState.location.pathname &&
          row.location.search === currentState.location.search &&
          row.location.hash === currentState.location.hash
          : false;
        return isCurrent ? 'current-route' : '';
      }}
    />
  );
}