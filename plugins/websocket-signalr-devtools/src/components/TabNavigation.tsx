import React from 'react';
import { useDevToolsSelector } from '../core/devtools-store';
import { createWebSocketSignalRDevToolsClient } from '../core/devtools-client';
import { clsx } from 'clsx';

export function TabNavigation() {
  const selectedTab = useDevToolsSelector(state => state.ui.selectedTab);
  const websocketMetrics = useDevToolsSelector(state => state.websocket.metrics);
  const signalrMetrics = useDevToolsSelector(state => state.signalr.metrics);
  
  const client = createWebSocketSignalRDevToolsClient();

  const tabs = [
    {
      id: 'websocket' as const,
      label: 'WebSocket',
      badge: websocketMetrics.activeConnections,
      icon: '🔌',
    },
    {
      id: 'signalr' as const,
      label: 'SignalR',
      badge: signalrMetrics.activeConnections,
      icon: '📡',
    },
    {
      id: 'performance' as const,
      label: 'Performance',
      icon: '📊',
    },
  ];

  return (
    <div className="tab-navigation">
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => client.selectTab(tab.id)}
          className={clsx('tab', {
            'active': selectedTab === tab.id
          })}
        >
          <span className="tab-icon">{tab.icon}</span>
          <span className="tab-label">{tab.label}</span>
          {tab.badge !== undefined && tab.badge > 0 && (
            <span className="tab-badge">{tab.badge}</span>
          )}
        </button>
      ))}

      <style>{`
        .tab-navigation {
          display: flex;
          gap: 2px;
        }

        .tab {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border: none;
          background: transparent;
          color: var(--devtools-color);
          cursor: pointer;
          border-radius: 4px 4px 0 0;
          font-size: 12px;
          font-weight: 500;
          transition: all 0.15s ease;
          position: relative;
          opacity: 0.7;
        }

        .tab:hover {
          background: var(--devtools-button-hover-bg);
          opacity: 1;
        }

        .tab.active {
          background: var(--devtools-accent);
          color: var(--devtools-accent-contrast);
          opacity: 1;
          border-bottom: 2px solid var(--devtools-accent);
        }

        .tab-icon {
          font-size: 14px;
          line-height: 1;
        }

        .tab-label {
          white-space: nowrap;
        }

        .tab-badge {
          background: var(--devtools-success);
          color: white;
          border-radius: 10px;
          padding: 2px 6px;
          font-size: 10px;
          font-weight: 600;
          line-height: 1;
          min-width: 18px;
          text-align: center;
        }

        .tab.active .tab-badge {
          background: rgba(255, 255, 255, 0.3);
          color: var(--devtools-accent-contrast);
        }
      `}</style>
    </div>
  );
}