import React, { useState } from 'react';
import { FeatureFlag, FlagOverride, FlagEvaluation, EvaluationContext, FeatureFlagDevToolsClient } from '../types';
import { getDisplayValue, formatDate, getFlagStatusColor, getFlagTypeColor } from '../utils';
import { OverrideControls } from './OverrideControls';
import { VariantSwitcher } from './VariantSwitcher';

interface FlagDetailsPanelProps {
  flag: FeatureFlag;
  override?: FlagOverride;
  evaluation?: FlagEvaluation;
  context: EvaluationContext;
  client: FeatureFlagDevToolsClient;
  onClose: () => void;
  onOverride: (flagId: string, value: any, variant?: string) => void;
  onRemoveOverride: (flagId: string) => void;
}

export const FlagDetailsPanel: React.FC<FlagDetailsPanelProps> = ({
  flag,
  override,
  evaluation,
  context,
  client,
  onClose,
  onOverride,
  onRemoveOverride
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'targeting' | 'rollout' | 'variants' | 'history'>('overview');

  const currentValue = override?.value !== undefined ? override.value : flag.value;
  const hasOverride = override !== undefined;
  const statusColor = getFlagStatusColor(flag, hasOverride);
  const typeColor = getFlagTypeColor(flag.type);

  const handleTestEvaluation = async () => {
    try {
      await client.evaluateFlag(flag.id, context);
    } catch (error) {
      console.error('Failed to evaluate flag:', error);
    }
  };

  return (
    <div className="flag-details-panel">
      {/* Header */}
      <div className="panel-header">
        <div className="header-left">
          <button onClick={onClose} className="close-button">×</button>
          <div className="flag-title">
            <h2>{flag.name}</h2>
            <div className="flag-id">{flag.id}</div>
          </div>
        </div>
        <div className="header-right">
          <div 
            className={`status-indicator ${flag.enabled ? 'enabled' : 'disabled'}`}
            style={{ backgroundColor: statusColor }}
          >
            {flag.enabled ? 'ON' : 'OFF'}
          </div>
          <span 
            className="type-badge"
            style={{ backgroundColor: typeColor, color: 'white' }}
          >
            {flag.type}
          </span>
          {hasOverride && (
            <span className="override-indicator">OVERRIDDEN</span>
          )}
        </div>
      </div>

      {/* Current Value Display */}
      <div className="current-value-section">
        <div className="value-display">
          <label>Current Value:</label>
          <div className="value-content">
            <code className="value-code">{getDisplayValue(flag, currentValue)}</code>
            {override && override.variant && (
              <span className="variant-info">Variant: {override.variant}</span>
            )}
          </div>
        </div>
        
        <div className="value-actions">
          {flag.variants && flag.variants.length > 0 && (
            <VariantSwitcher
              flag={flag}
              currentVariant={override?.variant}
              onVariantSelect={(variantId) => {
                const variant = flag.variants?.find(v => v.id === variantId);
                if (variant) {
                  onOverride(flag.id, variant.value, variantId);
                }
              }}
            />
          )}
          
          <button 
            onClick={handleTestEvaluation}
            className="test-button"
          >
            Test Evaluation
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="tab-navigation">
        {['overview', 'targeting', 'rollout', 'variants', 'history'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`tab ${activeTab === tab ? 'active' : ''}`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'overview' && (
          <div className="overview-tab">
            <div className="info-grid">
              <div className="info-item">
                <label>Description:</label>
                <div>{flag.description || 'No description provided'}</div>
              </div>
              
              <div className="info-item">
                <label>Environment:</label>
                <div>{flag.environment}</div>
              </div>
              
              <div className="info-item">
                <label>Created:</label>
                <div>{formatDate(flag.createdAt)}</div>
              </div>
              
              <div className="info-item">
                <label>Last Updated:</label>
                <div>{formatDate(flag.updatedAt)}</div>
              </div>
              
              {flag.tags.length > 0 && (
                <div className="info-item">
                  <label>Tags:</label>
                  <div className="tags-list">
                    {flag.tags.map(tag => (
                      <span key={tag} className="tag">{tag}</span>
                    ))}
                  </div>
                </div>
              )}
              
              {flag.providerMetadata && (
                <div className="info-item">
                  <label>Provider:</label>
                  <div>{flag.providerMetadata.provider || 'Custom'}</div>
                </div>
              )}
            </div>

            {/* Override Controls */}
            <div className="override-section">
              <OverrideControls
                flag={flag}
                override={override}
                onApply={(value, variant) => onOverride(flag.id, value, variant)}
                onRemove={() => onRemoveOverride(flag.id)}
              />
            </div>
          </div>
        )}

        {activeTab === 'targeting' && (
          <div className="targeting-tab">
            {flag.targeting ? (
              <>
                {flag.targeting.userSegments && flag.targeting.userSegments.length > 0 && (
                  <div className="targeting-section">
                    <h4>User Segments</h4>
                    <ul>
                      {flag.targeting.userSegments.map(segment => (
                        <li key={segment} className="segment-item">
                          {segment}
                          {context.userSegment === segment && (
                            <span className="current-indicator">← Current User</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {flag.targeting.rules && flag.targeting.rules.length > 0 && (
                  <div className="targeting-section">
                    <h4>Targeting Rules</h4>
                    {flag.targeting.rules.map(rule => (
                      <div key={rule.id} className={`rule-item ${rule.enabled ? '' : 'disabled'}`}>
                        <div className="rule-condition">
                          <strong>{rule.attribute}</strong> {rule.operator} {rule.values.join(', ')}
                        </div>
                        <div className="rule-status">
                          {rule.enabled ? 'Active' : 'Disabled'}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {flag.dependencies && flag.dependencies.length > 0 && (
                  <div className="targeting-section">
                    <h4>Dependencies</h4>
                    {flag.dependencies.map((dep, index) => (
                      <div key={index} className="dependency-item">
                        Flag <strong>{dep.flagId}</strong> must be <strong>{dep.condition}</strong>
                        {dep.value !== undefined && (
                          <span> with value <code>{JSON.stringify(dep.value)}</code></span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="empty-state">
                <p>No targeting rules configured for this flag.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'rollout' && (
          <div className="rollout-tab">
            {flag.rollout ? (
              <div className="rollout-info">
                <div className="rollout-percentage">
                  <h4>Rollout Percentage</h4>
                  <div className="percentage-display">
                    <div className="percentage-bar">
                      <div 
                        className="percentage-fill"
                        style={{ width: `${flag.rollout.percentage}%` }}
                      />
                    </div>
                    <span className="percentage-text">{flag.rollout.percentage}%</span>
                  </div>
                </div>

                <div className="rollout-settings">
                  <h4>Settings</h4>
                  <div className="setting-item">
                    <label>Stickiness:</label>
                    <span>{flag.rollout.stickiness || 'random'}</span>
                  </div>
                  {flag.rollout.attributes && flag.rollout.attributes.length > 0 && (
                    <div className="setting-item">
                      <label>Attributes:</label>
                      <span>{flag.rollout.attributes.join(', ')}</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="empty-state">
                <p>No rollout configuration for this flag (100% rollout).</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'variants' && (
          <div className="variants-tab">
            {flag.variants && flag.variants.length > 0 ? (
              <div className="variants-list">
                {flag.variants.map(variant => (
                  <div 
                    key={variant.id} 
                    className={`variant-item ${override?.variant === variant.id ? 'active' : ''}`}
                  >
                    <div className="variant-header">
                      <h4>{variant.name}</h4>
                      <div className="variant-weight">{variant.weight}%</div>
                    </div>
                    <div className="variant-value">
                      <label>Value:</label>
                      <code>{JSON.stringify(variant.value)}</code>
                    </div>
                    {variant.description && (
                      <div className="variant-description">{variant.description}</div>
                    )}
                    <button
                      onClick={() => onOverride(flag.id, variant.value, variant.id)}
                      className="select-variant-button"
                    >
                      Select This Variant
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <p>This flag has no variants configured.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="history-tab">
            {evaluation ? (
              <div className="evaluation-details">
                <h4>Last Evaluation</h4>
                <div className="evaluation-info">
                  <div className="eval-item">
                    <label>Result:</label>
                    <code>{getDisplayValue(flag, evaluation.value)}</code>
                  </div>
                  <div className="eval-item">
                    <label>Reason:</label>
                    <span className={`eval-reason ${evaluation.reason}`}>
                      {evaluation.reason}
                    </span>
                  </div>
                  {evaluation.variant && (
                    <div className="eval-item">
                      <label>Variant:</label>
                      <span>{evaluation.variant.name}</span>
                    </div>
                  )}
                  {evaluation.metadata && (
                    <div className="eval-item">
                      <label>Metadata:</label>
                      <pre>{JSON.stringify(evaluation.metadata, null, 2)}</pre>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="empty-state">
                <p>No evaluation history for this flag.</p>
                <button onClick={handleTestEvaluation} className="test-button">
                  Evaluate Now
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        .flag-details-panel {
          display: flex;
          flex-direction: column;
          height: 100%;
          background-color: white;
        }
        
        .panel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px;
          border-bottom: 1px solid #e5e7eb;
          background-color: #f9fafb;
        }
        
        .header-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .close-button {
          width: 32px;
          height: 32px;
          background: none;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          cursor: pointer;
          font-size: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .flag-title h2 {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
        }
        
        .flag-id {
          font-family: monospace;
          font-size: 12px;
          color: #6b7280;
        }
        
        .header-right {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .status-indicator {
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 700;
          color: white;
          text-transform: uppercase;
        }
        
        .type-badge {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
        }
        
        .override-indicator {
          padding: 4px 8px;
          background-color: #f59e0b;
          color: white;
          border-radius: 4px;
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
        }
        
        .current-value-section {
          padding: 16px;
          border-bottom: 1px solid #e5e7eb;
          background-color: #fafafa;
        }
        
        .value-display {
          margin-bottom: 12px;
        }
        
        .value-display label {
          display: block;
          font-weight: 600;
          margin-bottom: 4px;
        }
        
        .value-content {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .value-code {
          padding: 8px 12px;
          background-color: #f3f4f6;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          font-family: monospace;
          font-size: 14px;
        }
        
        .variant-info {
          font-size: 12px;
          color: #6b7280;
        }
        
        .value-actions {
          display: flex;
          gap: 8px;
        }
        
        .test-button {
          padding: 6px 12px;
          background-color: #3b82f6;
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 12px;
          cursor: pointer;
        }
        
        .tab-navigation {
          display: flex;
          border-bottom: 1px solid #e5e7eb;
        }
        
        .tab {
          padding: 12px 16px;
          background: none;
          border: none;
          border-bottom: 2px solid transparent;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          color: #6b7280;
        }
        
        .tab:hover {
          color: #374151;
          background-color: #f9fafb;
        }
        
        .tab.active {
          color: #3b82f6;
          border-bottom-color: #3b82f6;
        }
        
        .tab-content {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
        }
        
        .info-grid {
          display: grid;
          gap: 16px;
          margin-bottom: 24px;
        }
        
        .info-item label {
          display: block;
          font-weight: 600;
          margin-bottom: 4px;
          color: #374151;
        }
        
        .tags-list {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
        }
        
        .tag {
          padding: 2px 8px;
          background-color: #e5e7eb;
          border-radius: 12px;
          font-size: 12px;
          color: #374151;
        }
        
        .override-section {
          border-top: 1px solid #e5e7eb;
          padding-top: 24px;
        }
        
        .targeting-section {
          margin-bottom: 24px;
        }
        
        .targeting-section h4 {
          margin: 0 0 12px 0;
          font-size: 16px;
          font-weight: 600;
        }
        
        .segment-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 0;
          border-bottom: 1px solid #f3f4f6;
        }
        
        .current-indicator {
          font-size: 12px;
          color: #10b981;
          font-weight: 600;
        }
        
        .rule-item {
          padding: 12px;
          border: 1px solid #e5e7eb;
          border-radius: 4px;
          margin-bottom: 8px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .rule-item.disabled {
          opacity: 0.6;
        }
        
        .rule-status {
          font-size: 12px;
          font-weight: 600;
        }
        
        .dependency-item {
          padding: 8px 12px;
          background-color: #f9fafb;
          border-left: 3px solid #3b82f6;
          margin-bottom: 8px;
        }
        
        .rollout-info {
          max-width: 400px;
        }
        
        .rollout-percentage h4 {
          margin: 0 0 12px 0;
        }
        
        .percentage-display {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 24px;
        }
        
        .percentage-bar {
          flex: 1;
          height: 20px;
          background-color: #e5e7eb;
          border-radius: 10px;
          overflow: hidden;
        }
        
        .percentage-fill {
          height: 100%;
          background-color: #3b82f6;
          transition: width 0.3s ease;
        }
        
        .percentage-text {
          font-weight: 600;
          color: #374151;
        }
        
        .rollout-settings h4 {
          margin: 0 0 12px 0;
        }
        
        .setting-item {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid #f3f4f6;
        }
        
        .variants-list {
          display: grid;
          gap: 16px;
        }
        
        .variant-item {
          padding: 16px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          background-color: #fafafa;
        }
        
        .variant-item.active {
          border-color: #3b82f6;
          background-color: #eff6ff;
        }
        
        .variant-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }
        
        .variant-header h4 {
          margin: 0;
        }
        
        .variant-weight {
          font-weight: 600;
          color: #3b82f6;
        }
        
        .variant-value {
          margin-bottom: 8px;
        }
        
        .variant-value label {
          font-weight: 600;
          margin-right: 8px;
        }
        
        .variant-description {
          font-size: 14px;
          color: #6b7280;
          margin-bottom: 12px;
        }
        
        .select-variant-button {
          padding: 6px 12px;
          background-color: #3b82f6;
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 12px;
          cursor: pointer;
        }
        
        .evaluation-details h4 {
          margin: 0 0 16px 0;
        }
        
        .eval-item {
          display: flex;
          gap: 12px;
          margin-bottom: 12px;
        }
        
        .eval-item label {
          font-weight: 600;
          color: #374151;
          min-width: 80px;
        }
        
        .eval-reason {
          padding: 2px 6px;
          border-radius: 3px;
          font-size: 10px;
          font-weight: 600;
          text-transform: uppercase;
        }
        
        .eval-reason.default {
          background-color: #f3f4f6;
          color: #374151;
        }
        
        .eval-reason.override {
          background-color: #f59e0b;
          color: white;
        }
        
        .eval-reason.targeting {
          background-color: #8b5cf6;
          color: white;
        }
        
        .empty-state {
          text-align: center;
          padding: 40px 20px;
          color: #6b7280;
        }
        
        .empty-state p {
          margin-bottom: 16px;
        }
        
        /* Dark theme */
        :global(.dark) .flag-details-panel {
          background-color: #1f2937;
        }
        
        :global(.dark) .panel-header {
          background-color: #374151;
          border-color: #4b5563;
        }
        
        :global(.dark) .flag-title h2 {
          color: #f3f4f6;
        }
        
        :global(.dark) .current-value-section {
          background-color: #374151;
          border-color: #4b5563;
        }
        
        :global(.dark) .value-code {
          background-color: #4b5563;
          border-color: #6b7280;
          color: #f3f4f6;
        }
        
        :global(.dark) .info-item label {
          color: #f3f4f6;
        }
        
        :global(.dark) .targeting-section h4 {
          color: #f3f4f6;
        }
      `}</style>
    </div>
  );
};