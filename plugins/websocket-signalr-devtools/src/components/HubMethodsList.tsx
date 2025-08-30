import React from 'react';
import type { SignalRHubMethod } from '../types';

interface HubMethodsListProps {
  hubMethods: SignalRHubMethod[];
  connectionId: string;
}

export function HubMethodsList({ hubMethods, connectionId: _connectionId }: HubMethodsListProps) {
  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const formatExecutionTime = (time: number) => {
    if (time < 1) return '<1ms';
    if (time < 1000) return `${Math.round(time)}ms`;
    return `${(time / 1000).toFixed(1)}s`;
  };

  const sortedMethods = React.useMemo(() => {
    return [...hubMethods].sort((a, b) => {
      // Sort by invocation count (descending), then by name
      if (a.invocationCount !== b.invocationCount) {
        return b.invocationCount - a.invocationCount;
      }
      return a.name.localeCompare(b.name);
    });
  }, [hubMethods]);

  if (hubMethods.length === 0) {
    return (
      <div className="hub-methods-empty">
        <div>No hub methods called yet</div>

        <style>{`
          .hub-methods-empty {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--devtools-color);
            opacity: 0.5;
            font-size: 14px;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="hub-methods-list">
      <div className="methods-header">
        <div className="header-col method">Method</div>
        <div className="header-col calls">Calls</div>
        <div className="header-col time">Avg Time</div>
        <div className="header-col errors">Errors</div>
        <div className="header-col last">Last Called</div>
      </div>
      
      <div className="methods-body">
        {sortedMethods.map(method => (
          <div key={method.name} className="method-item">
            <div className="method-col method">
              <div className="method-name" title={method.name}>
                {method.name}
              </div>
            </div>
            <div className="method-col calls">
              <span className="call-count">{method.invocationCount}</span>
            </div>
            <div className="method-col time">
              <span className="execution-time">
                {formatExecutionTime(method.averageExecutionTime)}
              </span>
            </div>
            <div className="method-col errors">
              {method.errorCount > 0 && (
                <span className="error-count">{method.errorCount}</span>
              )}
            </div>
            <div className="method-col last">
              <span className="last-called">
                {formatTimestamp(method.lastInvoked)}
              </span>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        .hub-methods-list {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          font-family: 'SF Mono', Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
        }

        .methods-header {
          display: flex;
          background: var(--devtools-panel-bg);
          border-bottom: 1px solid var(--devtools-border);
          padding: 8px 12px;
          font-size: 11px;
          font-weight: 600;
          color: var(--devtools-color);
          opacity: 0.8;
          position: sticky;
          top: 0;
          z-index: 1;
        }

        .methods-body {
          flex: 1;
          overflow-y: auto;
          padding: 4px;
        }

        .header-col,
        .method-col {
          padding: 0 4px;
        }

        .header-col.method,
        .method-col.method {
          flex: 2;
          min-width: 0;
        }

        .header-col.calls,
        .method-col.calls {
          width: 60px;
          flex-shrink: 0;
          text-align: center;
        }

        .header-col.time,
        .method-col.time {
          width: 80px;
          flex-shrink: 0;
          text-align: center;
        }

        .header-col.errors,
        .method-col.errors {
          width: 60px;
          flex-shrink: 0;
          text-align: center;
        }

        .header-col.last,
        .method-col.last {
          width: 80px;
          flex-shrink: 0;
          text-align: right;
        }

        .method-item {
          display: flex;
          align-items: center;
          padding: 8px 8px;
          margin-bottom: 1px;
          font-size: 12px;
          border-radius: 3px;
          transition: background-color 0.15s ease;
        }

        .method-item:hover {
          background: var(--devtools-button-hover-bg);
        }

        .method-name {
          font-weight: 500;
          color: var(--devtools-color);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .call-count {
          background: var(--devtools-accent);
          color: var(--devtools-accent-contrast);
          padding: 2px 6px;
          border-radius: 10px;
          font-size: 10px;
          font-weight: 600;
          min-width: 20px;
          text-align: center;
          display: inline-block;
        }

        .execution-time {
          color: var(--devtools-success);
          font-weight: 500;
          font-size: 11px;
        }

        .error-count {
          background: var(--devtools-danger);
          color: white;
          padding: 2px 6px;
          border-radius: 10px;
          font-size: 10px;
          font-weight: 600;
          min-width: 20px;
          text-align: center;
          display: inline-block;
        }

        .last-called {
          font-size: 11px;
          opacity: 0.7;
          color: var(--devtools-color);
          font-variant-numeric: tabular-nums;
        }
      `}</style>
    </div>
  );
}