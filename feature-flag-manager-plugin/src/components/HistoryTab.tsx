import React, { useState } from 'react';
import { FeatureFlagDevToolsState, FeatureFlagDevToolsClient } from '../types';
import { getDisplayValue } from '../utils';

interface HistoryTabProps {
  state: FeatureFlagDevToolsState;
  client: FeatureFlagDevToolsClient;
}

export const HistoryTab: React.FC<HistoryTabProps> = ({
  state,
  client
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
      console.log('Clear history requested');
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

        <style jsx>{`
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
            color: #6b7280;
          }
          
          .empty-icon {
            font-size: 48px;
            margin-bottom: 16px;
          }
          
          .empty-state h3 {
            margin: 0 0 12px 0;
            font-size: 20px;
            color: #374151;
          }
          
          .empty-state p {
            line-height: 1.5;
          }
          
          /* Dark theme */
          :global(.dark) .empty-state h3 {
            color: #f3f4f6;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="history-tab">
      {/* Header with Filters */}
      <div className="tab-header">
        <div className="header-info">
          <h3>Evaluation History ({filteredEvaluations.length})</h3>
          <p>Track how flags are being evaluated in different contexts</p>
        </div>
        <button
          onClick={handleClearHistory}
          className="clear-button"
        >
          Clear History
        </button>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <div className="filter-group">
          <label>Flag:</label>
          <select
            value={selectedFlagFilter}
            onChange={(e) => setSelectedFlagFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Flags</option>
            {flags.map(flag => (
              <option key={flag.id} value={flag.id}>
                {flag.name} ({flag.id})
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Reason:</label>
          <select
            value={selectedReasonFilter}
            onChange={(e) => setSelectedReasonFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Reasons</option>
            {uniqueReasons.map(reason => (
              <option key={reason} value={reason}>
                {reason.charAt(0).toUpperCase() + reason.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {(selectedFlagFilter !== 'all' || selectedReasonFilter !== 'all') && (
          <button
            onClick={() => {
              setSelectedFlagFilter('all');
              setSelectedReasonFilter('all');
            }}
            className="clear-filters-button"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Evaluation List */}
      <div className="evaluations-list">
        {filteredEvaluations.map((evaluation, index) => {
          const flag = state.flags.get(evaluation.flagId);
          const reasonColor = getReasonColor(evaluation.reason);
          
          return (
            <div key={`${evaluation.flagId}-${index}`} className="evaluation-item">
              <div className="evaluation-header">
                <div className="flag-info">
                  <h4 className="flag-name">
                    {flag?.name || evaluation.flagId}
                  </h4>
                  <div className="flag-id">{evaluation.flagId}</div>
                </div>
                
                <div className="evaluation-result">
                  <div className="result-value">
                    <code>{getDisplayValue(flag || { value: evaluation.value } as any, evaluation.value)}</code>
                  </div>
                  <span 
                    className="reason-badge"
                    style={{ backgroundColor: reasonColor, color: 'white' }}
                  >
                    {evaluation.reason}
                  </span>
                </div>
              </div>

              {/* Variant Info */}
              {evaluation.variant && (
                <div className="variant-section">
                  <div className="variant-info">
                    <span className="variant-label">Variant:</span>
                    <span className="variant-name">{evaluation.variant.name}</span>
                    <span className="variant-value">
                      ({JSON.stringify(evaluation.variant.value)})
                    </span>
                  </div>
                </div>
              )}

              {/* Metadata */}
              {evaluation.metadata && Object.keys(evaluation.metadata).length > 0 && (
                <div className="metadata-section">
                  <h5>Metadata</h5>
                  <div className="metadata-content">
                    {Object.entries(evaluation.metadata).map(([key, value]) => (
                      <div key={key} className="metadata-item">
                        <span className="metadata-key">{key}:</span>
                        <span className="metadata-value">
                          {typeof value === 'object' 
                            ? JSON.stringify(value, null, 2)
                            : String(value)
                          }
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Context Information */}
              <div className="context-section">
                <div className="context-info">
                  <span>User: {state.currentContext.userId || 'anonymous'}</span>
                  <span>•</span>
                  <span>Segment: {state.currentContext.userSegment || 'none'}</span>
                  <span>•</span>
                  <span>Environment: {state.currentContext.environment || 'unknown'}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <style jsx>{`
        .history-tab {
          height: 100%;
          display: flex;
          flex-direction: column;
          background-color: #fafafa;
        }
        
        .tab-header {
          padding: 16px;
          background-color: white;
          border-bottom: 1px solid #e5e7eb;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .header-info h3 {
          margin: 0 0 4px 0;
          font-size: 18px;
          font-weight: 600;
          color: #111827;
        }
        
        .header-info p {
          margin: 0;
          font-size: 14px;
          color: #6b7280;
        }
        
        .clear-button {
          padding: 8px 16px;
          background-color: #ef4444;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
        }
        
        .clear-button:hover {
          background-color: #dc2626;
        }
        
        .filters-bar {
          padding: 12px 16px;
          background-color: #f9fafb;
          border-bottom: 1px solid #e5e7eb;
          display: flex;
          align-items: center;
          gap: 16px;
        }
        
        .filter-group {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .filter-group label {
          font-size: 14px;
          font-weight: 500;
          color: #374151;
        }
        
        .filter-select {
          padding: 6px 8px;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          font-size: 14px;
          background-color: white;
          min-width: 150px;
        }
        
        .clear-filters-button {
          padding: 6px 12px;
          background-color: #6b7280;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
          margin-left: auto;
        }
        
        .evaluations-list {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        
        .evaluation-item {
          background-color: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          overflow: hidden;
        }
        
        .evaluation-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px;
        }
        
        .flag-info {
          flex: 1;
        }
        
        .flag-name {
          margin: 0 0 4px 0;
          font-size: 14px;
          font-weight: 600;
          color: #1f2937;
        }
        
        .flag-id {
          font-family: monospace;
          font-size: 12px;
          color: #6b7280;
        }
        
        .evaluation-result {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .result-value code {
          padding: 6px 10px;
          background-color: #f3f4f6;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          font-family: monospace;
          font-size: 12px;
          color: #1f2937;
        }
        
        .reason-badge {
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .variant-section {
          padding: 12px 16px;
          background-color: #eff6ff;
          border-top: 1px solid #e0e7ff;
        }
        
        .variant-info {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
        }
        
        .variant-label {
          font-weight: 600;
          color: #1e40af;
        }
        
        .variant-name {
          color: #1f2937;
          font-weight: 500;
        }
        
        .variant-value {
          font-family: monospace;
          color: #6b7280;
          font-size: 11px;
        }
        
        .metadata-section {
          padding: 12px 16px;
          background-color: #f9fafb;
          border-top: 1px solid #e5e7eb;
        }
        
        .metadata-section h5 {
          margin: 0 0 8px 0;
          font-size: 12px;
          font-weight: 600;
          color: #374151;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .metadata-content {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        
        .metadata-item {
          display: flex;
          gap: 8px;
          font-size: 12px;
        }
        
        .metadata-key {
          font-weight: 600;
          color: #374151;
          min-width: 80px;
        }
        
        .metadata-value {
          font-family: monospace;
          color: #6b7280;
          word-break: break-all;
        }
        
        .context-section {
          padding: 8px 16px;
          background-color: #f3f4f6;
          border-top: 1px solid #e5e7eb;
        }
        
        .context-info {
          display: flex;
          gap: 8px;
          font-size: 11px;
          color: #6b7280;
        }
        
        /* Dark theme */
        :global(.dark) .history-tab {
          background-color: #1f2937;
        }
        
        :global(.dark) .tab-header {
          background-color: #374151;
          border-color: #4b5563;
        }
        
        :global(.dark) .header-info h3 {
          color: #f3f4f6;
        }
        
        :global(.dark) .filters-bar {
          background-color: #374151;
          border-color: #4b5563;
        }
        
        :global(.dark) .filter-group label {
          color: #f3f4f6;
        }
        
        :global(.dark) .filter-select {
          background-color: #4b5563;
          border-color: #6b7280;
          color: #f3f4f6;
        }
        
        :global(.dark) .evaluation-item {
          background-color: #374151;
          border-color: #4b5563;
        }
        
        :global(.dark) .flag-name {
          color: #f3f4f6;
        }
        
        :global(.dark) .result-value code {
          background-color: #4b5563;
          border-color: #6b7280;
          color: #f3f4f6;
        }
        
        :global(.dark) .metadata-section {
          background-color: #4b5563;
          border-color: #6b7280;
        }
        
        :global(.dark) .metadata-section h5 {
          color: #f3f4f6;
        }
        
        :global(.dark) .metadata-key {
          color: #f3f4f6;
        }
        
        :global(.dark) .context-section {
          background-color: #4b5563;
          border-color: #6b7280;
        }
      `}</style>
    </div>
  );
};