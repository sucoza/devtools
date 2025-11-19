import React, { useMemo } from 'react';
import { clsx } from 'clsx';
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
  client: _client,
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
    <div className="dt-content">
      {/* Stats Overview */}
      <div className="dt-stats-grid">
        <div
          className="dt-stat-card clickable"
          onClick={() => onNavigateToTab('flags')}
        >
          <h3>Feature Flags</h3>
          <div className="dt-stat-value">{stats.totalFlags}</div>
          <div className="dt-stat-details">
            <span className="dt-status-success">{stats.enabledFlags} enabled</span>
            <span className="dt-status-error">{stats.disabledFlags} disabled</span>
          </div>
        </div>

        <div
          className="dt-stat-card clickable"
          onClick={() => onNavigateToTab('overrides')}
        >
          <h3>Overrides</h3>
          <div className="dt-stat-value">{stats.overriddenFlags}</div>
          <div className="dt-stat-details">Active overrides</div>
        </div>

        <div
          className="dt-stat-card clickable"
          onClick={() => onNavigateToTab('experiments')}
        >
          <h3>Experiments</h3>
          <div className="dt-stat-value">{stats.experiments}</div>
          <div className="dt-stat-details">
            <span className="dt-status-info">{stats.activeExperiments} active</span>
          </div>
        </div>

        <div
          className="dt-stat-card clickable"
          onClick={() => onNavigateToTab('history')}
        >
          <h3>Evaluations</h3>
          <div className="dt-stat-value">{stats.evaluations}</div>
          <div className="dt-stat-details">Total evaluations</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Recently Updated Flags */}
        <div className="dt-section">
          <div className="dt-section-header">
            <h3>Recently Updated Flags</h3>
            <button
              onClick={() => onNavigateToTab('flags')}
              className="dt-btn dt-btn-sm dt-btn-primary"
            >
              View All
            </button>
          </div>
          <div style={{ padding: '16px' }}>
            {recentFlags.map((flag) => {
              const override = state.overrides.get(flag.id);
              return (
                <div key={flag.id} className="dt-card" style={{ marginBottom: '12px' }}>
                  <div className="dt-flex dt-justify-between dt-items-center">
                    <div style={{ flex: 1 }}>
                      <div className="dt-flex dt-items-center dt-gap-4 dt-mb-2">
                        <span className="dt-font-semibold">{flag.name}</span>
                        <div className="dt-flex dt-gap-2">
                          <span className="dt-badge dt-badge-info">{flag.type}</span>
                          {override && <span className="dt-badge dt-badge-warning">overridden</span>}
                        </div>
                      </div>
                      <div className="dt-text-secondary dt-text-sm dt-mb-2">{flag.description}</div>
                      <div className="dt-text-muted" style={{ fontSize: '11px' }}>
                        Updated {formatDate(flag.updatedAt)} • Environment: {flag.environment}
                      </div>
                    </div>
                    <div className="dt-flex dt-flex-col dt-items-center dt-gap-2" style={{ marginLeft: '16px' }}>
                      <span className={clsx("dt-badge", flag.enabled ? 'dt-badge-success' : 'dt-badge-error')}>
                        {flag.enabled ? 'ON' : 'OFF'}
                      </span>
                      {flag.type === 'boolean' && (
                        <button
                          onClick={() => onToggleFlag(flag.id, !flag.enabled)}
                          className={clsx("dt-btn dt-btn-sm", flag.enabled ? 'dt-btn-danger' : 'dt-btn-success')}
                        >
                          {flag.enabled ? 'Disable' : 'Enable'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            {recentFlags.length === 0 && (
              <div className="dt-empty-state">
                <p>No flags found</p>
                <button
                  onClick={() => onNavigateToTab('settings')}
                  className="dt-btn dt-btn-primary"
                >
                  Set up providers
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Recent Evaluations */}
        <div className="dt-section">
          <div className="dt-section-header">
            <h3>Recent Evaluations</h3>
            <button
              onClick={() => onNavigateToTab('history')}
              className="dt-btn dt-btn-sm dt-btn-primary"
            >
              View All
            </button>
          </div>
          <div style={{ padding: '16px' }}>
            {stats.recentEvaluations.map((evaluation, index) => {
              const flag = state.flags.get(evaluation.flagId);
              return (
                <div key={`${evaluation.flagId}-${index}`} className="dt-card" style={{ marginBottom: '12px' }}>
                  <div>
                    <div className="dt-font-semibold dt-mb-2">
                      {flag?.name || evaluation.flagId}
                    </div>
                    <div className="dt-flex dt-items-center dt-gap-4 dt-mb-2">
                      <span className="dt-badge dt-badge-info">
                        {evaluation.reason}
                      </span>
                      <span className="dt-text-sm dt-text-secondary">
                        {typeof evaluation.value === 'boolean'
                          ? evaluation.value.toString()
                          : JSON.stringify(evaluation.value)
                        }
                      </span>
                    </div>
                    {evaluation.variant && (
                      <div className="dt-text-muted dt-text-sm">
                        Variant: {evaluation.variant.name}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            {stats.recentEvaluations.length === 0 && (
              <div className="dt-empty-state">
                <p>No evaluations yet</p>
                <p className="dt-text-secondary">
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
