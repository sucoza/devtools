import React, { useState } from 'react';
import { FeatureFlagDevToolsState, FeatureFlagDevToolsClient } from '../types';
import { getDisplayValue } from '../utils';

interface HistoryTabProps {
  state: FeatureFlagDevToolsState;
  client: FeatureFlagDevToolsClient;
}

export const HistoryTab: React.FC<HistoryTabProps> = ({
  state,
  client: _client
}) => {
  const [selectedFlagFilter, setSelectedFlagFilter] = useState<string>('all');
  const [selectedReasonFilter, setSelectedReasonFilter] = useState<string>('all');
  
  const evaluationHistory = state.evaluationHistory;
  const flags = Array.from(state.flags.values());
  
  // Get unique reasons for filter
  const uniqueReasons = Array.from(new Set(evaluationHistory.map(e => e.reason)));

  // Filter evaluations
  const filteredEvaluations = evaluationHistory.filter(evaluation => {
    if (selectedFlagFilter !== 'all' && evaluation.flagId !== selectedFlagFilter) {
      return false;
    }
    if (selectedReasonFilter !== 'all' && evaluation.reason !== selectedReasonFilter) {
      return false;
    }
    return true;
  });

  const getReasonColor = (reason: string) => {
    switch (reason) {
      case 'default': return '#6b7280';
      case 'override': return '#f59e0b';
      case 'targeting': return '#8b5cf6';
      case 'rollout': return '#3b82f6';
      case 'variant': return '#ec4899';
      case 'dependency': return '#ef4444';
      case 'error': return '#dc2626';
      default: return '#6b7280';
    }
  };

  const handleClearHistory = () => {
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