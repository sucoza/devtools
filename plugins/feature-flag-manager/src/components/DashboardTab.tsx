import React, { useMemo } from 'react';
import { clsx } from 'clsx';
import { FeatureFlagDevToolsState, FeatureFlagDevToolsClient, PanelTab } from '../types';
import { formatDate } from '../utils';
import './DashboardTab.css';

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
          className={clsx("stat-card", "clickable")}
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
          className={clsx("stat-card", "clickable")}
          onClick={() => onNavigateToTab('overrides')}
        >
          <h3>Overrides</h3>
          <div className="stat-value">{stats.overriddenFlags}</div>
          <div className="stat-details">Active overrides</div>
        </div>

        <div 
          className={clsx("stat-card", "clickable")}
          onClick={() => onNavigateToTab('experiments')}
        >
          <h3>Experiments</h3>
          <div className="stat-value">{stats.experiments}</div>
          <div className="stat-details">
            <span className="active">{stats.activeExperiments} active</span>
          </div>
        </div>

        <div 
          className={clsx("stat-card", "clickable")}
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
                        <span className={clsx("flag-type", flag.type)}>{flag.type}</span>
                        {override && <span className="override-badge">overridden</span>}
                      </div>
                    </div>
                    <div className="flag-description">{flag.description}</div>
                    <div className="flag-meta">
                      Updated {formatDate(flag.updatedAt)} • Environment: {flag.environment}
                    </div>
                  </div>
                  <div className="flag-controls">
                    <div className={clsx("flag-status", flag.enabled ? 'enabled' : 'disabled')}>
                      {flag.enabled ? 'ON' : 'OFF'}
                    </div>
                    {flag.type === 'boolean' && (
                      <button
                        onClick={() => onToggleFlag(flag.id, !flag.enabled)}
                        className={clsx("toggle-button", flag.enabled ? 'enabled' : 'disabled')}
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
                      <span className={clsx("evaluation-reason", evaluation.reason)}>
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

    </div>
  );
};