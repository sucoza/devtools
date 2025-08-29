import React, { useMemo } from 'react';
import { FeatureFlagDevToolsState, FeatureFlagDevToolsClient } from '../types';
import { getDisplayValue, formatDate } from '../utils';

interface OverridesTabProps {
  state: FeatureFlagDevToolsState;
  client: FeatureFlagDevToolsClient;
}

export const OverridesTab: React.FC<OverridesTabProps> = ({
  state,
  client
}) => {
  const overrides = useMemo(() => {
    return Array.from(state.overrides.values()).map(override => {
      const flag = state.flags.get(override.flagId);
      return {
        override,
        flag
      };
    });
  }, [state.overrides, state.flags]);

  const handleRemoveOverride = async (flagId: string) => {
    try {
      await client.removeOverride(flagId);
    } catch (error) {
      console.error('Failed to remove override:', error);
    }
  };

  const handleClearAllOverrides = async () => {
    if (confirm('Are you sure you want to clear all overrides?')) {
      try {
        await client.clearAllOverrides();
      } catch (error) {
        console.error('Failed to clear all overrides:', error);
      }
    }
  };

  if (overrides.length === 0) {
    return (
      <div className="overrides-tab">
        <div className="empty-state">
          <div className="empty-icon">⚙️</div>
          <h3>No Active Overrides</h3>
          <p>
            Override values will appear here when you modify flag values during development.
            Overrides help you test different flag states without affecting the actual configuration.
          </p>
        </div>

        <style jsx>{`
          .overrides-tab {
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
    <div className="overrides-tab">
      {/* Header */}
      <div className="tab-header">
        <div className="header-info">
          <h3>Active Overrides ({overrides.length})</h3>
          <p>Override values are stored locally and only affect your development session</p>
        </div>
        <button
          onClick={handleClearAllOverrides}
          className="clear-all-button"
        >
          Clear All Overrides
        </button>
      </div>

      {/* Overrides List */}
      <div className="overrides-list">
        {overrides.map(({ override, flag }) => (
          <div key={override.flagId} className="override-item">
            <div className="override-header">
              <div className="flag-info">
                <h4 className="flag-name">
                  {flag?.name || override.flagId}
                </h4>
                <div className="flag-id">{override.flagId}</div>
                {flag && (
                  <div className="flag-meta">
                    <span className={`flag-type ${flag.type}`}>{flag.type}</span>
                    <span>Environment: {flag.environment}</span>
                  </div>
                )}
              </div>
              <button
                onClick={() => handleRemoveOverride(override.flagId)}
                className="remove-button"
                title="Remove override"
              >
                ×
              </button>
            </div>

            <div className="value-comparison">
              <div className="value-section">
                <label>Original Value:</label>
                <code className="original-value">
                  {flag ? getDisplayValue(flag, flag.value) : 'Unknown'}
                </code>
              </div>
              
              <div className="arrow">→</div>
              
              <div className="value-section">
                <label>Override Value:</label>
                <code className="override-value">
                  {getDisplayValue(flag || { value: override.value } as any, override.value)}
                </code>
                {override.variant && (
                  <div className="variant-info">
                    Variant: {override.variant}
                  </div>
                )}
              </div>
            </div>

            <div className="override-details">
              <div className="detail-row">
                <span className="detail-label">Reason:</span>
                <span className="detail-value">{override.reason || 'No reason provided'}</span>
              </div>
              
              {override.userId && (
                <div className="detail-row">
                  <span className="detail-label">User ID:</span>
                  <span className="detail-value">{override.userId}</span>
                </div>
              )}
              
              {override.expiresAt && (
                <div className="detail-row">
                  <span className="detail-label">Expires:</span>
                  <span className="detail-value">{formatDate(override.expiresAt)}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        .overrides-tab {
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
        
        .clear-all-button {
          padding: 8px 16px;
          background-color: #ef4444;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
        }
        
        .clear-all-button:hover {
          background-color: #dc2626;
        }
        
        .overrides-list {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        
        .override-item {
          background-color: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          overflow: hidden;
        }
        
        .override-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding: 16px;
          background-color: #fef3c7;
          border-bottom: 1px solid #f59e0b;
        }
        
        .flag-info {
          flex: 1;
        }
        
        .flag-name {
          margin: 0 0 4px 0;
          font-size: 16px;
          font-weight: 600;
          color: #92400e;
        }
        
        .flag-id {
          font-family: monospace;
          font-size: 12px;
          color: #78350f;
          margin-bottom: 8px;
        }
        
        .flag-meta {
          display: flex;
          gap: 16px;
          font-size: 12px;
        }
        
        .flag-type {
          padding: 2px 6px;
          border-radius: 12px;
          font-weight: 700;
          text-transform: uppercase;
          color: white;
        }
        
        .flag-type.boolean {
          background-color: #3b82f6;
        }
        
        .flag-type.string {
          background-color: #10b981;
        }
        
        .flag-type.number {
          background-color: #f59e0b;
        }
        
        .flag-type.json {
          background-color: #8b5cf6;
        }
        
        .flag-type.multivariate {
          background-color: #ec4899;
        }
        
        .remove-button {
          width: 28px;
          height: 28px;
          background-color: #ef4444;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 18px;
          font-weight: bold;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .remove-button:hover {
          background-color: #dc2626;
        }
        
        .value-comparison {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px;
        }
        
        .value-section {
          flex: 1;
          min-width: 0;
        }
        
        .value-section label {
          display: block;
          font-size: 12px;
          font-weight: 600;
          color: #6b7280;
          margin-bottom: 4px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .original-value,
        .override-value {
          display: block;
          padding: 8px 12px;
          border-radius: 4px;
          font-family: monospace;
          font-size: 13px;
          word-break: break-all;
          white-space: pre-wrap;
        }
        
        .original-value {
          background-color: #f3f4f6;
          border: 1px solid #d1d5db;
          color: #6b7280;
        }
        
        .override-value {
          background-color: #dcfce7;
          border: 1px solid #16a34a;
          color: #15803d;
          font-weight: 600;
        }
        
        .arrow {
          font-size: 18px;
          color: #6b7280;
          font-weight: bold;
        }
        
        .variant-info {
          margin-top: 4px;
          font-size: 11px;
          color: #16a34a;
          font-weight: 600;
        }
        
        .override-details {
          padding: 16px;
          background-color: #f9fafb;
          border-top: 1px solid #e5e7eb;
        }
        
        .detail-row {
          display: flex;
          gap: 12px;
          margin-bottom: 8px;
        }
        
        .detail-row:last-child {
          margin-bottom: 0;
        }
        
        .detail-label {
          font-size: 12px;
          font-weight: 600;
          color: #374151;
          min-width: 80px;
        }
        
        .detail-value {
          font-size: 12px;
          color: #6b7280;
          font-family: monospace;
        }
        
        /* Dark theme */
        :global(.dark) .overrides-tab {
          background-color: #1f2937;
        }
        
        :global(.dark) .tab-header {
          background-color: #374151;
          border-color: #4b5563;
        }
        
        :global(.dark) .header-info h3 {
          color: #f3f4f6;
        }
        
        :global(.dark) .override-item {
          background-color: #374151;
          border-color: #4b5563;
        }
        
        :global(.dark) .override-header {
          background-color: #451a03;
          border-color: #d97706;
        }
        
        :global(.dark) .flag-name {
          color: #fbbf24;
        }
        
        :global(.dark) .flag-id {
          color: #f59e0b;
        }
        
        :global(.dark) .original-value {
          background-color: #4b5563;
          border-color: #6b7280;
          color: #d1d5db;
        }
        
        :global(.dark) .override-value {
          background-color: #064e3b;
          border-color: #059669;
          color: #10b981;
        }
        
        :global(.dark) .override-details {
          background-color: #4b5563;
          border-color: #6b7280;
        }
        
        :global(.dark) .detail-label {
          color: #f3f4f6;
        }
      `}</style>
    </div>
  );
};