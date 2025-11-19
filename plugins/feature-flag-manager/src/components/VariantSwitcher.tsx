import React, { useState } from 'react';
import { FeatureFlag } from '../types';

interface VariantSwitcherProps {
  flag: FeatureFlag;
  currentVariant?: string;
  onVariantSelect: (variantId: string) => void;
}

export const VariantSwitcher: React.FC<VariantSwitcherProps> = ({
  flag,
  currentVariant,
  onVariantSelect
}) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!flag.variants || flag.variants.length === 0) {
    return null;
  }

  const selectedVariant = flag.variants.find(v => v.id === currentVariant) || flag.variants[0];

  return (
    <div className="variant-switcher">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className={`variant-button ${isOpen ? 'open' : ''}`}
      >
        <span className="variant-label">
          {selectedVariant.name}
        </span>
        <span className="variant-arrow">▼</span>
      </button>

      {isOpen && (
        <div className="variant-dropdown">
          {flag.variants.map((variant) => (
            <button
              key={variant.id}
              onClick={(e) => {
                e.stopPropagation();
                onVariantSelect(variant.id);
                setIsOpen(false);
              }}
              className={`variant-option ${variant.id === currentVariant ? 'selected' : ''}`}
            >
              <div className="variant-info">
                <div className="variant-name">{variant.name}</div>
                <div className="variant-details">
                  Weight: {variant.weight}% • Value: {JSON.stringify(variant.value)}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      <style>{`
        .variant-switcher {
          position: relative;
        }
        
        .variant-button {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          background-color: var(--dt-bg-tertiary);
          border: 1px solid var(--dt-border-primary);
          border-radius: 4px;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .variant-button:hover {
          background-color: var(--dt-border-primary);
        }
        
        .variant-button.open {
          background-color: var(--dt-border-focus);
          color: white;
          border-color: var(--dt-border-focus);
        }
        
        .variant-label {
          font-weight: 500;
        }
        
        .variant-arrow {
          font-size: 10px;
          transition: transform 0.2s;
        }
        
        .variant-button.open .variant-arrow {
          transform: rotate(180deg);
        }
        
        .variant-dropdown {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          z-index: 1000;
          background-color: var(--dt-bg-primary);
          border: 1px solid var(--dt-border-primary);
          border-radius: 4px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          max-height: 200px;
          overflow-y: auto;
          margin-top: 2px;
        }
        
        .variant-option {
          display: block;
          width: 100%;
          padding: 8px 12px;
          background: none;
          border: none;
          text-align: left;
          cursor: pointer;
          transition: background-color 0.2s;
          border-bottom: 1px solid var(--dt-border-primary);
        }
        
        .variant-option:last-child {
          border-bottom: none;
        }
        
        .variant-option:hover {
          background-color: var(--dt-bg-tertiary);
        }
        
        .variant-option.selected {
          background-color: var(--dt-bg-hover);
          border-left: 3px solid var(--dt-border-focus);
        }
        
        .variant-info {
          min-width: 0;
        }
        
        .variant-name {
          font-size: 12px;
          font-weight: 500;
          color: var(--dt-text-primary);
          margin-bottom: 2px;
        }
        
        .variant-details {
          font-size: 10px;
          color: var(--dt-text-secondary);
          font-family: monospace;
        }

      `}</style>
    </div>
  );
};