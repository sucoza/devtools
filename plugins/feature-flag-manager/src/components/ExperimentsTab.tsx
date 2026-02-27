import React from 'react';
import { FeatureFlagDevToolsState, FeatureFlagDevToolsClient } from '../types';

interface ExperimentsTabProps {
  state: FeatureFlagDevToolsState;
  client: FeatureFlagDevToolsClient;
}

export const ExperimentsTab: React.FC<ExperimentsTabProps> = ({
  state,
  client: _client
}) => {
  const experiments = state.experiments;

  const _getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'var(--dt-status-success)';
      case 'paused': return 'var(--dt-status-warning)';
      case 'completed': return 'var(--dt-text-secondary)';
      case 'draft': return 'var(--dt-border-focus)';
      default: return 'var(--dt-text-secondary)';
    }
  };

  const _calculateConversionRate = (conversions: number, exposures: number) => {
    if (exposures === 0) return 0;
    return ((conversions / exposures) * 100).toFixed(2);
  };

  const _getSignificanceLevel = (significance?: number) => {
    if (!significance) return 'No data';
    if (significance >= 0.95) return 'High';
    if (significance >= 0.80) return 'Medium';
    return 'Low';
  };

  if (experiments.length === 0) {
    return (
      <div className="experiments-tab">
        <div className="empty-state">
          <div className="empty-icon">🧪</div>
          <h3>No Experiments</h3>
          <p>
            A/B tests and experiments will appear here when they are configured.
            Experiments help you measure the impact of feature flag changes.
          </p>
        </div>

        <style>{`
          .experiments-tab {
            padding: 32px;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          
          .empty-state {
            text-align: center;
            max-width: 400px;
            color: var(--dt-text-secondary);
          }
          
          .empty-icon {
            font-size: 48px;
            margin-bottom: 16px;
          }
          
          .empty-state h3 {
            margin: 0 0 12px 0;
            font-size: 20px;
            color: var(--dt-text-primary);
          }
          
          .empty-state p {
            line-height: 1.5;
          }

      `}</style>
    </div>
  );
  }

  // TODO: Implement experiments list view
  return (
    <div className="experiments-tab">
      <p>Experiments list view - To be implemented</p>
    </div>
  );
};