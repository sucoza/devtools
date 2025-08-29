import React, { useState } from 'react';
import { FeatureFlag, FlagOverride, FlagEvaluation } from '../types';
import { getDisplayValue, getFlagStatusColor, getFlagTypeColor, formatDate } from '../utils';
import { VariantSwitcher } from './VariantSwitcher';
import { OverrideControls } from './OverrideControls';

interface FlagListItemProps {
  flag: FeatureFlag;
  override?: FlagOverride;
  evaluation?: FlagEvaluation;
  onToggle: (flagId: string, enabled: boolean) => void;
  onOverride: (flagId: string, value: any, variant?: string) => void;
  onRemoveOverride: (flagId: string) => void;
  onSelect: (flagId: string) => void;
  isSelected: boolean;
}

export const FlagListItem: React.FC<FlagListItemProps> = ({
  flag,
  override,
  evaluation,
  onToggle,
  onOverride,
  onRemoveOverride,
  onSelect,
  isSelected
}) => {
  const [showControls, setShowControls] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const currentValue = override?.value !== undefined ? override.value : flag.value;
  const hasOverride = override !== undefined;
  const statusColor = getFlagStatusColor(flag, hasOverride);
  const typeColor = getFlagTypeColor(flag.type);

  const handleToggle = () => {
    if (flag.type === 'boolean') {
      onToggle(flag.id, !flag.enabled);
    }
  };

  const handleVariantSelect = (variantId: string) => {
    const variant = flag.variants?.find(v => v.id === variantId);
    if (variant) {
      onOverride(flag.id, variant.value, variantId);
    }
  };

  return (
    <div 
      className={`flag-item ${isSelected ? 'selected' : ''}`}
      onClick={() => onSelect(flag.id)}
    >
      <div className="flag-header">
        <div className="flag-info">
          <div className="flag-name-row">
            <span className="flag-name">{flag.name}</span>
            <div className="flag-badges">
              <span 
                className="flag-type-badge"
                style={{ backgroundColor: typeColor, color: 'white' }}
              >
                {flag.type}
              </span>
              {hasOverride && (
                <span className="override-badge">overridden</span>
              )}
              {flag.rollout && flag.rollout.percentage < 100 && (
                <span className="rollout-badge">
                  {flag.rollout.percentage}%
                </span>
              )}
            </div>
          </div>
          
          <div className="flag-id">{flag.id}</div>
          
          {flag.description && (
            <div className="flag-description">{flag.description}</div>
          )}
          
          <div className="flag-meta">
            <span>Environment: {flag.environment}</span>
            <span>•</span>
            <span>Updated: {formatDate(flag.updatedAt)}</span>
            {flag.tags.length > 0 && (
              <>
                <span>•</span>
                <span>Tags: {flag.tags.slice(0, 3).join(', ')}{flag.tags.length > 3 ? '...' : ''}</span>
              </>
            )}
          </div>
        </div>

        <div className="flag-status">
          <div 
            className={`status-indicator ${flag.enabled ? 'enabled' : 'disabled'}`}
            style={{ backgroundColor: statusColor }}
          >
            {flag.enabled ? 'ON' : 'OFF'}
          </div>
          
          <div className="flag-value">
            {getDisplayValue(flag, currentValue)}
          </div>
        </div>
      </div>

      {/* Controls Section */}
      <div className="flag-controls">
        <div className="control-buttons">
          {flag.type === 'boolean' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleToggle();
              }}
              className={`toggle-button ${flag.enabled ? 'enabled' : 'disabled'}`}
            >
              {flag.enabled ? 'Disable' : 'Enable'}
            </button>
          )}

          {flag.variants && flag.variants.length > 0 && (
            <VariantSwitcher
              flag={flag}
              currentVariant={override?.variant}
              onVariantSelect={handleVariantSelect}
            />
          )}

          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowControls(!showControls);
            }}
            className={`control-button ${showControls ? 'active' : ''}`}
          >
            Override
          </button>

          {hasOverride && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemoveOverride(flag.id);
              }}
              className="remove-override-button"
            >
              Clear Override
            </button>
          )}

          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="expand-button"
          >
            {isExpanded ? '▼' : '▶'}
          </button>
        </div>
      </div>

      {/* Override Controls Panel */}
      {showControls && (
        <div className="override-panel" onClick={(e) => e.stopPropagation()}>
          <OverrideControls
            flag={flag}
            override={override}
            onApply={(value, variant) => {
              onOverride(flag.id, value, variant);
              setShowControls(false);
            }}
            onRemove={() => {
              onRemoveOverride(flag.id);
              setShowControls(false);
            }}
          />
        </div>
      )}

      {/* Expanded Details */}
      {isExpanded && (
        <div className="expanded-details" onClick={(e) => e.stopPropagation()}>
          {/* Dependencies */}
          {flag.dependencies && flag.dependencies.length > 0 && (
            <div className="detail-section">
              <h4>Dependencies</h4>
              <ul>
                {flag.dependencies.map((dep, index) => (
                  <li key={index}>
                    Flag "{dep.flagId}" must be {dep.condition}
                    {dep.value !== undefined && ` (value: ${JSON.stringify(dep.value)})`}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Targeting Rules */}
          {flag.targeting && (
            <div className="detail-section">
              <h4>Targeting</h4>
              {flag.targeting.userSegments && (
                <div>
                  <strong>Segments:</strong> {flag.targeting.userSegments.join(', ')}
                </div>
              )}
              {flag.targeting.rules && flag.targeting.rules.length > 0 && (
                <div>
                  <strong>Rules:</strong>
                  <ul>
                    {flag.targeting.rules.map((rule) => (
                      <li key={rule.id}>
                        {rule.attribute} {rule.operator} {rule.values.join(', ')}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Rollout Configuration */}
          {flag.rollout && (
            <div className="detail-section">
              <h4>Rollout</h4>
              <div>Percentage: {flag.rollout.percentage}%</div>
              {flag.rollout.stickiness && (
                <div>Stickiness: {flag.rollout.stickiness}</div>
              )}
            </div>
          )}

          {/* Recent Evaluation */}
          {evaluation && (
            <div className="detail-section">
              <h4>Last Evaluation</h4>
              <div>Value: {getDisplayValue(flag, evaluation.value)}</div>
              <div>Reason: {evaluation.reason}</div>
              {evaluation.variant && (
                <div>Variant: {evaluation.variant.name}</div>
              )}
            </div>
          )}
        </div>
      )}

      <style>{`
        .flag-item {
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          background-color: white;
          margin: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .flag-item:hover {
          border-color: #d1d5db;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        
        .flag-item.selected {
          border-color: #3b82f6;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
        }
        
        .flag-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding: 16px;
          padding-bottom: 12px;
        }
        
        .flag-info {
          flex: 1;
        }
        
        .flag-name-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 4px;
        }
        
        .flag-name {
          font-size: 16px;
          font-weight: 600;
          color: #111827;
        }
        
        .flag-badges {
          display: flex;
          gap: 4px;
        }
        
        .flag-type-badge {
          padding: 2px 6px;
          border-radius: 12px;
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .override-badge {
          padding: 2px 6px;
          background-color: #f59e0b;
          color: white;
          border-radius: 12px;
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
        }
        
        .rollout-badge {
          padding: 2px 6px;
          background-color: #8b5cf6;
          color: white;
          border-radius: 12px;
          font-size: 10px;
          font-weight: 700;
        }
        
        .flag-id {
          font-family: monospace;
          font-size: 12px;
          color: #6b7280;
          margin-bottom: 4px;
        }
        
        .flag-description {
          font-size: 14px;
          color: #6b7280;
          margin-bottom: 8px;
          line-height: 1.4;
        }
        
        .flag-meta {
          font-size: 12px;
          color: #9ca3af;
          display: flex;
          gap: 8px;
        }
        
        .flag-status {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 4px;
        }
        
        .status-indicator {
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 700;
          color: white;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .flag-value {
          font-family: monospace;
          font-size: 12px;
          color: #6b7280;
          max-width: 120px;
          text-align: right;
          word-break: break-all;
        }
        
        .flag-controls {
          border-top: 1px solid #f3f4f6;
          padding: 12px 16px;
        }
        
        .control-buttons {
          display: flex;
          gap: 8px;
          align-items: center;
        }
        
        .toggle-button {
          padding: 6px 12px;
          border: none;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .toggle-button.enabled {
          background-color: #ef4444;
          color: white;
        }
        
        .toggle-button.disabled {
          background-color: #10b981;
          color: white;
        }
        
        .control-button {
          padding: 6px 12px;
          background-color: #f3f4f6;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .control-button:hover {
          background-color: #e5e7eb;
        }
        
        .control-button.active {
          background-color: #3b82f6;
          color: white;
          border-color: #3b82f6;
        }
        
        .remove-override-button {
          padding: 6px 12px;
          background-color: #ef4444;
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 12px;
          cursor: pointer;
        }
        
        .expand-button {
          padding: 6px 8px;
          background: none;
          border: none;
          font-size: 12px;
          cursor: pointer;
          color: #6b7280;
        }
        
        .override-panel {
          border-top: 1px solid #f3f4f6;
          padding: 16px;
          background-color: #f9fafb;
        }
        
        .expanded-details {
          border-top: 1px solid #f3f4f6;
          padding: 16px;
          background-color: #fafafa;
        }
        
        .detail-section {
          margin-bottom: 16px;
        }
        
        .detail-section:last-child {
          margin-bottom: 0;
        }
        
        .detail-section h4 {
          margin: 0 0 8px 0;
          font-size: 14px;
          font-weight: 600;
          color: #374151;
        }
        
        .detail-section ul {
          margin: 4px 0;
          padding-left: 20px;
        }
        
        .detail-section li {
          font-size: 13px;
          color: #6b7280;
          margin-bottom: 2px;
        }
        
        .detail-section div {
          font-size: 13px;
          color: #6b7280;
          margin-bottom: 2px;
        }
        
        /* Dark theme */
        :global(.dark) .flag-item {
          background-color: #374151;
          border-color: #4b5563;
        }
        
        :global(.dark) .flag-name {
          color: #f3f4f6;
        }
        
        :global(.dark) .override-panel {
          background-color: #4b5563;
          border-color: #6b7280;
        }
        
        :global(.dark) .expanded-details {
          background-color: #4b5563;
          border-color: #6b7280;
        }
        
        :global(.dark) .control-button {
          background-color: #4b5563;
          border-color: #6b7280;
          color: #f3f4f6;
        }
        
        :global(.dark) .detail-section h4 {
          color: #f3f4f6;
        }
      `}</style>
    </div>
  );
};