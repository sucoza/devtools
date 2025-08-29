import React from 'react';
import { FeatureFlagDevToolsState, FeatureFlagDevToolsClient } from '../types';

interface SegmentsTabProps {
  state: FeatureFlagDevToolsState;
  client: FeatureFlagDevToolsClient;
}

export const SegmentsTab: React.FC<SegmentsTabProps> = ({
  state,
  client
}) => {
  const segments = state.userSegments;
  const currentUserSegment = state.currentContext.userSegment;

  const handleSetCurrentSegment = async (segmentId: string) => {
    try {
      await client.setEvaluationContext({
        ...state.currentContext,
        userSegment: segmentId
      });
    } catch (error) {
      console.error('Failed to set user segment:', error);
    }
  };

  return (
    <div className="segments-tab">
      {/* Header */}
      <div className="tab-header">
        <div className="header-info">
          <h3>User Segments ({segments.length})</h3>
          <p>Manage user targeting and segmentation rules</p>
        </div>
        <div className="current-segment">
          <span className="segment-label">Current Segment:</span>
          <span className="segment-value">
            {currentUserSegment || 'None'}
          </span>
        </div>
      </div>

      {/* Segments List */}
      <div className="segments-list">
        {segments.map((segment) => {
          const isActive = currentUserSegment === segment.id;
          
          return (
            <div key={segment.id} className={`segment-card ${isActive ? 'active' : ''}`}>
              <div className="segment-header">
                <div className="segment-info">
                  <h4 className="segment-name">{segment.name}</h4>
                  <div className="segment-id">ID: {segment.id}</div>
                  {segment.description && (
                    <p className="segment-description">{segment.description}</p>
                  )}
                </div>
                
                <div className="segment-actions">
                  {isActive && (
                    <span className="active-badge">Active</span>
                  )}
                  <button
                    onClick={() => handleSetCurrentSegment(segment.id)}
                    className={`select-button ${isActive ? 'selected' : ''}`}
                    disabled={isActive}
                  >
                    {isActive ? 'Selected' : 'Select'}
                  </button>
                </div>
              </div>

              {/* Segment Rules */}
              {segment.rules && segment.rules.length > 0 && (
                <div className="segment-rules">
                  <h5>Targeting Rules</h5>
                  <div className="rules-list">
                    {segment.rules.map((rule, index) => (
                      <div key={index} className="rule-item">
                        <div className="rule-condition">
                          <strong>{rule.attribute}</strong>
                          <span className="operator">{rule.operator}</span>
                          <span className="values">{rule.values.join(', ')}</span>
                        </div>
                        
                        {/* Check if current context matches this rule */}
                        <div className="rule-match">
                          {(() => {
                            const contextValue = (state.currentContext.attributes as any)?.[rule.attribute] || 
                                               (state.currentContext as any)[rule.attribute];
                            let matches = false;
                            
                            switch (rule.operator) {
                              case 'equals':
                                matches = rule.values.includes(contextValue);
                                break;
                              case 'in':
                                matches = Array.isArray(contextValue) 
                                  ? contextValue.some(v => rule.values.includes(v))
                                  : rule.values.includes(contextValue);
                                break;
                              case 'contains':
                                matches = typeof contextValue === 'string' && 
                                         rule.values.some(v => contextValue.includes(v.toString()));
                                break;
                              case 'greater_than':
                                matches = typeof contextValue === 'number' && 
                                         rule.values.some(v => contextValue > Number(v));
                                break;
                              case 'less_than':
                                matches = typeof contextValue === 'number' && 
                                         rule.values.some(v => contextValue < Number(v));
                                break;
                            }
                            
                            return (
                              <span className={`match-status ${matches ? 'matches' : 'no-match'}`}>
                                {matches ? '✓ Matches' : '✗ No match'}
                              </span>
                            );
                          })()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* User Count (if available) */}
              {segment.userCount !== undefined && (
                <div className="segment-stats">
                  <div className="stat-item">
                    <span className="stat-label">Estimated Users:</span>
                    <span className="stat-value">{segment.userCount.toLocaleString()}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <style>{`
        .segments-tab {
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
        
        .current-segment {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background-color: #f3f4f6;
          border-radius: 6px;
        }
        
        .segment-label {
          font-size: 14px;
          color: #6b7280;
          font-weight: 500;
        }
        
        .segment-value {
          font-size: 14px;
          color: #1f2937;
          font-weight: 600;
          font-family: monospace;
        }
        
        .segments-list {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        
        .segment-card {
          background-color: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          overflow: hidden;
          transition: all 0.2s ease;
        }
        
        .segment-card.active {
          border-color: #3b82f6;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
        }
        
        .segment-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding: 16px;
          background-color: #f9fafb;
        }
        
        .segment-card.active .segment-header {
          background-color: #eff6ff;
        }
        
        .segment-info {
          flex: 1;
        }
        
        .segment-name {
          margin: 0 0 4px 0;
          font-size: 16px;
          font-weight: 600;
          color: #1f2937;
        }
        
        .segment-id {
          font-family: monospace;
          font-size: 12px;
          color: #6b7280;
          margin-bottom: 8px;
        }
        
        .segment-description {
          margin: 0;
          font-size: 14px;
          color: #4b5563;
          line-height: 1.4;
        }
        
        .segment-actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .active-badge {
          padding: 4px 8px;
          background-color: #10b981;
          color: white;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
        }
        
        .select-button {
          padding: 6px 16px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          background-color: white;
          color: #374151;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.2s;
        }
        
        .select-button:hover:not(:disabled) {
          background-color: #3b82f6;
          color: white;
          border-color: #3b82f6;
        }
        
        .select-button:disabled {
          background-color: #f3f4f6;
          color: #9ca3af;
          cursor: not-allowed;
        }
        
        .select-button.selected {
          background-color: #10b981;
          color: white;
          border-color: #10b981;
        }
        
        .segment-rules {
          padding: 16px;
          border-top: 1px solid #f3f4f6;
        }
        
        .segment-rules h5 {
          margin: 0 0 12px 0;
          font-size: 14px;
          font-weight: 600;
          color: #374151;
        }
        
        .rules-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        
        .rule-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 12px;
          background-color: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 4px;
        }
        
        .rule-condition {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
        }
        
        .rule-condition strong {
          color: #1f2937;
        }
        
        .operator {
          padding: 2px 6px;
          background-color: #e5e7eb;
          border-radius: 3px;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          color: #374151;
        }
        
        .values {
          font-family: monospace;
          color: #6b7280;
          background-color: #f3f4f6;
          padding: 2px 6px;
          border-radius: 3px;
        }
        
        .rule-match {
          flex-shrink: 0;
        }
        
        .match-status {
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 700;
        }
        
        .match-status.matches {
          background-color: #dcfce7;
          color: #166534;
        }
        
        .match-status.no-match {
          background-color: #fee2e2;
          color: #991b1b;
        }
        
        .segment-stats {
          padding: 16px;
          background-color: #f9fafb;
          border-top: 1px solid #e5e7eb;
        }
        
        .stat-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .stat-label {
          font-size: 14px;
          color: #6b7280;
          font-weight: 500;
        }
        
        .stat-value {
          font-size: 14px;
          color: #1f2937;
          font-weight: 600;
        }
        
        /* Dark theme */
        :global(.dark) .segments-tab {
          background-color: #1f2937;
        }
        
        :global(.dark) .tab-header {
          background-color: #374151;
          border-color: #4b5563;
        }
        
        :global(.dark) .header-info h3 {
          color: #f3f4f6;
        }
        
        :global(.dark) .current-segment {
          background-color: #4b5563;
        }
        
        :global(.dark) .segment-value {
          color: #f3f4f6;
        }
        
        :global(.dark) .segment-card {
          background-color: #374151;
          border-color: #4b5563;
        }
        
        :global(.dark) .segment-header {
          background-color: #4b5563;
        }
        
        :global(.dark) .segment-card.active .segment-header {
          background-color: #1e3a8a;
        }
        
        :global(.dark) .segment-name {
          color: #f3f4f6;
        }
        
        :global(.dark) .select-button {
          background-color: #4b5563;
          border-color: #6b7280;
          color: #f3f4f6;
        }
        
        :global(.dark) .rule-item {
          background-color: #4b5563;
          border-color: #6b7280;
        }
        
        :global(.dark) .rule-condition strong {
          color: #f3f4f6;
        }
        
        :global(.dark) .segment-stats {
          background-color: #4b5563;
          border-color: #6b7280;
        }
        
        :global(.dark) .stat-value {
          color: #f3f4f6;
        }
      `}</style>
    </div>
  );
};