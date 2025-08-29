import React, { useMemo } from 'react';
import { FeatureFlagDevToolsState, FeatureFlagDevToolsClient, PanelTab } from '../types';
import { formatDate } from '../utils';

interface DashboardTabProps {
  state: FeatureFlagDevToolsState;
  client: FeatureFlagDevToolsClient;
  onToggleFlag: (flagId: string, enabled: boolean) => void;
  onNavigateToTab: (tab: PanelTab) => void;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({
  state,
  client,
  onToggleFlag,
  onNavigateToTab
}) => {
  const stats = useMemo(() => {
    const flags = Array.from(state.flags.values());
    const overrides = Array.from(state.overrides.values());
    
    return {
      totalFlags: flags.length,
      enabledFlags: flags.filter(f => f.enabled).length,
      disabledFlags: flags.filter(f => !f.enabled).length,
      overriddenFlags: overrides.length,
      experiments: state.experiments.length,
      activeExperiments: state.experiments.filter(e => e.status === 'running').length,
      evaluations: state.evaluationHistory.length,
      recentEvaluations: state.evaluationHistory.slice(0, 5)
    };
  }, [state]);

  const recentFlags = useMemo(() => {
    return Array.from(state.flags.values())
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 5);
  }, [state.flags]);

  return (
    <div className="dashboard-tab">
      {/* Stats Overview */}
      <div className="stats-grid">
        <div 
          className="stat-card clickable"
          onClick={() => onNavigateToTab('flags')}
        >
          <h3>Feature Flags</h3>
          <div className="stat-value">{stats.totalFlags}</div>
          <div className="stat-details">
            <span className="enabled">{stats.enabledFlags} enabled</span>
            <span className="disabled">{stats.disabledFlags} disabled</span>
          </div>
        </div>

        <div 
          className="stat-card clickable"
          onClick={() => onNavigateToTab('overrides')}
        >
          <h3>Overrides</h3>
          <div className="stat-value">{stats.overriddenFlags}</div>
          <div className="stat-details">Active overrides</div>
        </div>

        <div 
          className="stat-card clickable"
          onClick={() => onNavigateToTab('experiments')}
        >
          <h3>Experiments</h3>
          <div className="stat-value">{stats.experiments}</div>
          <div className="stat-details">
            <span className="active">{stats.activeExperiments} active</span>
          </div>
        </div>

        <div 
          className="stat-card clickable"
          onClick={() => onNavigateToTab('history')}
        >
          <h3>Evaluations</h3>
          <div className="stat-value">{stats.evaluations}</div>
          <div className="stat-details">Total evaluations</div>
        </div>
      </div>

      <div className="dashboard-content">
        {/* Recent Flags */}
        <div className="section">
          <div className="section-header">
            <h3>Recently Updated Flags</h3>
            <button 
              onClick={() => onNavigateToTab('flags')}
              className="view-all-button"
            >
              View All
            </button>
          </div>
          <div className="flag-list">
            {recentFlags.map((flag) => {
              const override = state.overrides.get(flag.id);
              return (
                <div key={flag.id} className="flag-item">
                  <div className="flag-info">
                    <div className="flag-header">
                      <span className="flag-name">{flag.name}</span>
                      <div className="flag-badges">
                        <span className={`flag-type ${flag.type}`}>{flag.type}</span>
                        {override && <span className="override-badge">overridden</span>}
                      </div>
                    </div>
                    <div className="flag-description">{flag.description}</div>
                    <div className="flag-meta">
                      Updated {formatDate(flag.updatedAt)} • Environment: {flag.environment}
                    </div>
                  </div>
                  <div className="flag-controls">
                    <div className={`flag-status ${flag.enabled ? 'enabled' : 'disabled'}`}>
                      {flag.enabled ? 'ON' : 'OFF'}
                    </div>
                    {flag.type === 'boolean' && (
                      <button
                        onClick={() => onToggleFlag(flag.id, !flag.enabled)}
                        className={`toggle-button ${flag.enabled ? 'enabled' : 'disabled'}`}
                      >
                        {flag.enabled ? 'Disable' : 'Enable'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
            {recentFlags.length === 0 && (
              <div className="empty-state">
                <p>No flags found</p>
                <button 
                  onClick={() => onNavigateToTab('settings')}
                  className="setup-button"
                >
                  Set up providers
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Recent Evaluations */}
        <div className="section">
          <div className="section-header">
            <h3>Recent Evaluations</h3>
            <button 
              onClick={() => onNavigateToTab('history')}
              className="view-all-button"
            >
              View All
            </button>
          </div>
          <div className="evaluation-list">
            {stats.recentEvaluations.map((evaluation, index) => {
              const flag = state.flags.get(evaluation.flagId);
              return (
                <div key={`${evaluation.flagId}-${index}`} className="evaluation-item">
                  <div className="evaluation-info">
                    <div className="evaluation-flag">
                      {flag?.name || evaluation.flagId}
                    </div>
                    <div className="evaluation-details">
                      <span className={`evaluation-reason ${evaluation.reason}`}>
                        {evaluation.reason}
                      </span>
                      <span className="evaluation-value">
                        {typeof evaluation.value === 'boolean' 
                          ? evaluation.value.toString()
                          : JSON.stringify(evaluation.value)
                        }
                      </span>
                    </div>
                  </div>
                  {evaluation.variant && (
                    <div className="evaluation-variant">
                      Variant: {evaluation.variant.name}
                    </div>
                  )}
                </div>
              );
            })}
            {stats.recentEvaluations.length === 0 && (
              <div className="empty-state">
                <p>No evaluations yet</p>
                <p className="empty-description">
                  Flag evaluations will appear here as they occur
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .dashboard-tab {
          padding: 16px;
          height: 100%;
          overflow-y: auto;
        }
        
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }
        
        .stat-card {
          padding: 16px;
          background-color: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          transition: all 0.2s ease;
        }
        
        .stat-card.clickable {
          cursor: pointer;
        }
        
        .stat-card.clickable:hover {
          background-color: #f3f4f6;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        
        .stat-card h3 {
          margin: 0 0 8px 0;
          font-size: 14px;
          font-weight: 500;
          color: #6b7280;
        }
        
        .stat-value {
          font-size: 24px;
          font-weight: 700;
          color: #111827;
          margin-bottom: 4px;
        }
        
        .stat-details {
          font-size: 12px;
          color: #6b7280;
          display: flex;
          gap: 8px;
        }
        
        .enabled {
          color: #10b981;
        }
        
        .disabled {
          color: #ef4444;
        }
        
        .active {
          color: #3b82f6;
        }
        
        .dashboard-content {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
        }
        
        .section {
          background-color: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          overflow: hidden;
        }
        
        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px;
          background-color: #f9fafb;
          border-bottom: 1px solid #e5e7eb;
        }
        
        .section-header h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
        }
        
        .view-all-button {
          padding: 4px 8px;
          background-color: #3b82f6;
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 12px;
          cursor: pointer;
        }
        
        .flag-list, .evaluation-list {
          max-height: 300px;
          overflow-y: auto;
        }
        
        .flag-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px;
          border-bottom: 1px solid #f3f4f6;
        }
        
        .flag-item:last-child {
          border-bottom: none;
        }
        
        .flag-info {
          flex: 1;
        }
        
        .flag-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 4px;
        }
        
        .flag-name {
          font-weight: 600;
          color: #111827;
        }
        
        .flag-badges {
          display: flex;
          gap: 4px;
        }
        
        .flag-type {
          padding: 2px 6px;
          border-radius: 3px;
          font-size: 10px;
          font-weight: 600;
          text-transform: uppercase;
        }
        
        .flag-type.boolean {
          background-color: #dbeafe;
          color: #1e40af;
        }
        
        .flag-type.string {
          background-color: #d1fae5;
          color: #065f46;
        }
        
        .flag-type.number {
          background-color: #fef3c7;
          color: #92400e;
        }
        
        .override-badge {
          padding: 2px 6px;
          background-color: #fbbf24;
          color: #92400e;
          border-radius: 3px;
          font-size: 10px;
          font-weight: 600;
          text-transform: uppercase;
        }
        
        .flag-description {
          font-size: 14px;
          color: #6b7280;
          margin-bottom: 4px;
        }
        
        .flag-meta {
          font-size: 12px;
          color: #9ca3af;
        }
        
        .flag-controls {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .flag-status {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
        }
        
        .flag-status.enabled {
          background-color: #d1fae5;
          color: #065f46;
        }
        
        .flag-status.disabled {
          background-color: #fee2e2;
          color: #991b1b;
        }
        
        .toggle-button {
          padding: 4px 12px;
          border: none;
          border-radius: 4px;
          font-size: 12px;
          cursor: pointer;
        }
        
        .toggle-button.enabled {
          background-color: #ef4444;
          color: white;
        }
        
        .toggle-button.disabled {
          background-color: #10b981;
          color: white;
        }
        
        .evaluation-item {
          padding: 12px 16px;
          border-bottom: 1px solid #f3f4f6;
        }
        
        .evaluation-item:last-child {
          border-bottom: none;
        }
        
        .evaluation-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 4px;
        }
        
        .evaluation-flag {
          font-weight: 500;
          color: #111827;
        }
        
        .evaluation-details {
          display: flex;
          gap: 8px;
          align-items: center;
        }
        
        .evaluation-reason {
          padding: 2px 6px;
          border-radius: 3px;
          font-size: 10px;
          font-weight: 600;
          text-transform: uppercase;
        }
        
        .evaluation-reason.default {
          background-color: #f3f4f6;
          color: #374151;
        }
        
        .evaluation-reason.override {
          background-color: #fbbf24;
          color: #92400e;
        }
        
        .evaluation-reason.targeting {
          background-color: #a78bfa;
          color: #5b21b6;
        }
        
        .evaluation-value {
          font-family: monospace;
          font-size: 12px;
          color: #6b7280;
        }
        
        .evaluation-variant {
          font-size: 12px;
          color: #6b7280;
        }
        
        .empty-state {
          padding: 32px 16px;
          text-align: center;
          color: #6b7280;
        }
        
        .empty-state p {
          margin: 0 0 8px 0;
        }
        
        .empty-description {
          font-size: 12px;
          color: #9ca3af;
        }
        
        .setup-button {
          padding: 8px 16px;
          background-color: #3b82f6;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          margin-top: 8px;
        }
        
        /* Dark theme */
        :global(.dark) .stat-card {
          background-color: #374151;
          border-color: #4b5563;
        }
        
        :global(.dark) .stat-card:hover {
          background-color: #4b5563;
        }
        
        :global(.dark) .stat-card h3 {
          color: #9ca3af;
        }
        
        :global(.dark) .stat-value {
          color: #f3f4f6;
        }
        
        :global(.dark) .section {
          background-color: #1f2937;
          border-color: #374151;
        }
        
        :global(.dark) .section-header {
          background-color: #374151;
          border-color: #4b5563;
        }
        
        :global(.dark) .flag-name {
          color: #f3f4f6;
        }
        
        :global(.dark) .evaluation-flag {
          color: #f3f4f6;
        }
      `}</style>
    </div>
  );
};