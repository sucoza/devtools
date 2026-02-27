import React, { useState } from 'react';
import { FeatureFlagDevToolsState, FeatureFlagDevToolsClient } from '../types';

interface HistoryTabProps {
  state: FeatureFlagDevToolsState;
  client: FeatureFlagDevToolsClient;
}

export const HistoryTab: React.FC<HistoryTabProps> = ({
  state,
  client: _client
}) => {
  const [selectedFlagFilter, _setSelectedFlagFilter] = useState<string>('all');
  const [selectedReasonFilter, _setSelectedReasonFilter] = useState<string>('all');
  
  const evaluationHistory = state.evaluationHistory;
  const _flags = Array.from(state.flags.values());

  // Get unique reasons for filter
  const _uniqueReasons = Array.from(new Set(evaluationHistory.map(e => e.reason)));

  // Filter evaluations
  const _filteredEvaluations = evaluationHistory.filter(evaluation => {
    if (selectedFlagFilter !== 'all' && evaluation.flagId !== selectedFlagFilter) {
      return false;
    }
    if (selectedReasonFilter !== 'all' && evaluation.reason !== selectedReasonFilter) {
      return false;
    }
    return true;
  });

  const _getReasonColor = (reason: string) => {
    switch (reason) {
      case 'default': return 'var(--dt-text-secondary)';
      case 'override': return 'var(--dt-status-warning)';
      case 'targeting': return 'var(--dt-text-accent)';
      case 'rollout': return 'var(--dt-border-focus)';
      case 'variant': return 'var(--dt-status-error)';
      case 'dependency': return 'var(--dt-status-error)';
      case 'error': return 'var(--dt-status-error)';
      default: return 'var(--dt-text-secondary)';
    }
  };

  const _handleClearHistory = () => {
    if (confirm('Are you sure you want to clear the evaluation history?')) {
      // In a real implementation, this would call a method to clear history
      // console.log('Clear history requested');
    }
  };

  if (evaluationHistory.length === 0) {
    return (
      <div className="history-tab">
        <div className="empty-state">
          <div className="empty-icon">📊</div>
          <h3>No Evaluation History</h3>
          <p>
            Flag evaluation history will appear here as flags are evaluated.
            This helps you understand how flags are being resolved in different contexts.
          </p>
        </div>

        <style>{`
          .history-tab {
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

  // TODO: Implement history list view
  return (
    <div className="history-tab">
      <p>History list view - To be implemented</p>
    </div>
  );
};