import React from 'react';

interface MetricsBarProps {
  metrics: {
    connections: number;
    totalConnections: number;
    messages: number;
    bytes?: number;
    invocations?: number;
    reconnections?: number;
    errors: number;
  };
}

export function MetricsBar({ metrics }: MetricsBarProps) {
  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  };

  const formatNumber = (num: number) => {
    if (num < 1000) return num.toString();
    if (num < 1000000) return `${(num / 1000).toFixed(1)}K`;
    return `${(num / 1000000).toFixed(1)}M`;
  };

  return (
    <div className="metrics-bar">
      <div className="metric">
        <div className="metric-value">{metrics.connections}</div>
        <div className="metric-label">Active</div>
      </div>

      <div className="metric">
        <div className="metric-value">{metrics.totalConnections}</div>
        <div className="metric-label">Total</div>
      </div>

      <div className="metric">
        <div className="metric-value">{formatNumber(metrics.messages)}</div>
        <div className="metric-label">Messages</div>
      </div>

      {metrics.bytes !== undefined && (
        <div className="metric">
          <div className="metric-value">{formatBytes(metrics.bytes)}</div>
          <div className="metric-label">Data</div>
        </div>
      )}

      {metrics.invocations !== undefined && (
        <div className="metric">
          <div className="metric-value">{formatNumber(metrics.invocations)}</div>
          <div className="metric-label">Calls</div>
        </div>
      )}

      {metrics.reconnections !== undefined && (
        <div className="metric">
          <div className="metric-value">{metrics.reconnections.toFixed(1)}</div>
          <div className="metric-label">Reconnects</div>
        </div>
      )}

      <div className={`metric ${metrics.errors > 0 ? 'error' : ''}`}>
        <div className="metric-value">{metrics.errors.toFixed(1)}%</div>
        <div className="metric-label">Errors</div>
      </div>

      <style jsx>{`
        .metrics-bar {
          display: flex;
          align-items: center;
          gap: 24px;
          padding: 12px 16px;
          background: var(--devtools-panel-bg);
          border-bottom: 1px solid var(--devtools-border);
          font-size: 12px;
        }

        .metric {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
        }

        .metric-value {
          font-size: 18px;
          font-weight: 700;
          color: var(--devtools-accent);
          line-height: 1;
          font-variant-numeric: tabular-nums;
        }

        .metric-label {
          color: var(--devtools-color);
          opacity: 0.7;
          font-size: 11px;
          text-transform: uppercase;
          font-weight: 500;
        }

        .metric.error .metric-value {
          color: var(--devtools-danger);
        }

        .metric.error .metric-label {
          color: var(--devtools-danger);
          opacity: 0.8;
        }
      `}</style>
    </div>
  );
}