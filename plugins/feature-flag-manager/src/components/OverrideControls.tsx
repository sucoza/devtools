import React, { useState, useEffect } from 'react';
import { FeatureFlag, FlagOverride, FlagValue } from '../types';

interface OverrideControlsProps {
  flag: FeatureFlag;
  override?: FlagOverride;
  onApply: (value: FlagValue, variant?: string) => void;
  onRemove: () => void;
}

export const OverrideControls: React.FC<OverrideControlsProps> = ({
  flag,
  override,
  onApply,
  onRemove
}) => {
  const [overrideValue, setOverrideValue] = useState<string>('');
  const [selectedVariant, setSelectedVariant] = useState<string>('');
  const [reason, setReason] = useState('Manual override from DevTools');

  // Initialize values when override changes
  useEffect(() => {
    if (override) {
      setOverrideValue(override.value?.toString() || '');
      setSelectedVariant(override.variant || '');
      setReason(override.reason || 'Manual override from DevTools');
    } else {
      setOverrideValue(flag.value?.toString() || '');
      setSelectedVariant('');
      setReason('Manual override from DevTools');
    }
  }, [override, flag]);

  const handleApply = () => {
    let parsedValue: FlagValue;

    if (selectedVariant && flag.variants) {
      const variant = flag.variants.find(v => v.id === selectedVariant);
      if (variant) {
        parsedValue = variant.value;
        onApply(parsedValue, selectedVariant);
        return;
      }
    }

    // Parse value based on flag type
    try {
      switch (flag.type) {
        case 'boolean':
          parsedValue = overrideValue.toLowerCase() === 'true';
          break;
        case 'number':
          parsedValue = parseFloat(overrideValue);
          if (isNaN(parsedValue as number)) {
            throw new Error('Invalid number');
          }
          break;
        case 'json':
          parsedValue = JSON.parse(overrideValue);
          break;
        case 'string':
        default:
          parsedValue = overrideValue;
          break;
      }
    } catch (error) {
      console.error('Failed to parse override value:', error);
      return;
    }

    onApply(parsedValue);
  };

  const handleQuickToggle = () => {
    if (flag.type === 'boolean') {
      const currentValue = override?.value ?? flag.value;
      onApply(!currentValue);
    }
  };

  const getValuePlaceholder = () => {
    switch (flag.type) {
      case 'boolean':
        return 'true or false';
      case 'number':
        return '42';
      case 'json':
        return '{"key": "value"}';
      case 'string':
      default:
        return 'string value';
    }
  };

  return (
    <div className="override-controls">
      <h4>Override Flag Value</h4>
      
      {/* Quick Actions for Boolean Flags */}
      {flag.type === 'boolean' && (
        <div className="quick-actions">
          <button
            onClick={() => onApply(true)}
            className="quick-button enabled"
          >
            Set to True
          </button>
          <button
            onClick={() => onApply(false)}
            className="quick-button disabled"
          >
            Set to False
          </button>
          <button
            onClick={handleQuickToggle}
            className="quick-button toggle"
          >
            Toggle
          </button>
        </div>
      )}

      {/* Variant Selection */}
      {flag.variants && flag.variants.length > 0 && (
        <div className="variant-selection">
          <label>Select Variant:</label>
          <select
            value={selectedVariant}
            onChange={(e) => setSelectedVariant(e.target.value)}
          >
            <option value="">None (use custom value)</option>
            {flag.variants.map(variant => (
              <option key={variant.id} value={variant.id}>
                {variant.name} ({JSON.stringify(variant.value)})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Custom Value Input */}
      {!selectedVariant && (
        <div className="value-input">
          <label>Custom Value:</label>
          <div className="input-group">
            <input
              type="text"
              value={overrideValue}
              onChange={(e) => setOverrideValue(e.target.value)}
              placeholder={getValuePlaceholder()}
              className="value-field"
            />
            <span className="value-type">{flag.type}</span>
          </div>
          
          {flag.type === 'json' && (
            <div className="input-help">
              Enter valid JSON (e.g., {`{"key": "value"}`}, [1,2,3], &quot;string&quot;)
            </div>
          )}
        </div>
      )}

      {/* Reason Input */}
      <div className="reason-input">
        <label>Reason (optional):</label>
        <input
          type="text"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Why are you overriding this flag?"
          className="reason-field"
        />
      </div>

      {/* Current Override Info */}
      {override && (
        <div className="current-override">
          <div className="override-info">
            <strong>Current Override:</strong> {JSON.stringify(override.value)}
            {override.variant && <span> (variant: {override.variant})</span>}
          </div>
          <div className="override-reason">
            Reason: {override.reason || 'No reason provided'}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="actions">
        <button
          onClick={handleApply}
          className="apply-button"
          disabled={!selectedVariant && !overrideValue.trim()}
        >
          Apply Override
        </button>
        
        {override && (
          <button
            onClick={onRemove}
            className="remove-button"
          >
            Remove Override
          </button>
        )}
      </div>

      <style>{`
        .override-controls {
          color: inherit;
        }
        
        .override-controls h4 {
          margin: 0 0 16px 0;
          font-size: 16px;
          font-weight: 600;
        }
        
        .quick-actions {
          display: flex;
          gap: 8px;
          margin-bottom: 16px;
        }
        
        .quick-button {
          padding: 6px 12px;
          border: none;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .quick-button.enabled {
          background-color: var(--dt-status-success);
          color: white;
        }
        
        .quick-button.disabled {
          background-color: var(--dt-status-error);
          color: white;
        }
        
        .quick-button.toggle {
          background-color: var(--dt-border-focus);
          color: white;
        }
        
        .variant-selection {
          margin-bottom: 16px;
        }
        
        .variant-selection label {
          display: block;
          margin-bottom: 4px;
          font-weight: 500;
        }
        
        .variant-selection select {
          width: 100%;
          padding: 8px;
          border: 1px solid var(--dt-border-primary);
          border-radius: 4px;
          font-size: 14px;
          background-color: var(--dt-bg-primary);
        }
        
        .value-input {
          margin-bottom: 16px;
        }
        
        .value-input label {
          display: block;
          margin-bottom: 4px;
          font-weight: 500;
        }
        
        .input-group {
          display: flex;
          align-items: center;
          position: relative;
        }
        
        .value-field {
          flex: 1;
          padding: 8px;
          padding-right: 60px;
          border: 1px solid var(--dt-border-primary);
          border-radius: 4px;
          font-size: 14px;
          font-family: monospace;
        }
        
        .value-type {
          position: absolute;
          right: 8px;
          font-size: 10px;
          font-weight: 600;
          color: var(--dt-text-secondary);
          text-transform: uppercase;
          background-color: var(--dt-bg-tertiary);
          padding: 2px 4px;
          border-radius: 2px;
        }
        
        .input-help {
          margin-top: 4px;
          font-size: 12px;
          color: var(--dt-text-secondary);
          font-style: italic;
        }
        
        .reason-input {
          margin-bottom: 16px;
        }
        
        .reason-input label {
          display: block;
          margin-bottom: 4px;
          font-weight: 500;
        }
        
        .reason-field {
          width: 100%;
          padding: 8px;
          border: 1px solid var(--dt-border-primary);
          border-radius: 4px;
          font-size: 14px;
        }
        
        .current-override {
          margin-bottom: 16px;
          padding: 12px;
          background-color: var(--dt-status-warning-bg);
          border-left: 4px solid #f59e0b;
          border-radius: 4px;
        }
        
        .override-info {
          font-size: 14px;
          margin-bottom: 4px;
        }
        
        .override-reason {
          font-size: 12px;
          color: var(--dt-status-warning);
        }
        
        .actions {
          display: flex;
          gap: 8px;
          justify-content: flex-end;
        }
        
        .apply-button {
          padding: 8px 16px;
          background-color: var(--dt-status-success);
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 14px;
          cursor: pointer;
        }
        
        .apply-button:disabled {
          background-color: var(--dt-border-primary);
          color: var(--dt-border-hover);
          cursor: not-allowed;
        }
        
        .remove-button {
          padding: 8px 16px;
          background-color: var(--dt-status-error);
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 14px;
          cursor: pointer;
        }

      `}</style>
    </div>
  );
};