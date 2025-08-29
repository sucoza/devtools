import React from 'react';
import { clsx } from 'clsx';
import { Eye, Target, Settings } from 'lucide-react';

import type { TabComponentProps } from '../../types';

/**
 * Selector management and testing tab component
 */
export default function SelectorsTab({ state, dispatch, compact }: TabComponentProps) {
  const { selectorEngine } = state;

  return (
    <div className="selectors-tab">
      {/* Selector Mode */}
      <div className="mode-section">
        <h3>Selector Mode</h3>
        
        <div className="mode-buttons">
          {['auto', 'css', 'xpath', 'text', 'data-testid'].map(mode => (
            <button
              key={mode}
              onClick={() => dispatch({
                type: 'selector/mode/set',
                payload: mode as any,
              })}
              className={clsx('mode-button', {
                active: selectorEngine.mode === mode,
              })}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* Selector Strategy */}
      <div className="strategy-section">
        <h3>Selector Strategy</h3>
        
        <div className="strategy-options">
          <label className="option-label">
            <input
              type="checkbox"
              checked={selectorEngine.strategy.optimize}
              onChange={(e) => dispatch({
                type: 'selector/strategy/set',
                payload: {
                  ...selectorEngine.strategy,
                  optimize: e.target.checked,
                },
              })}
            />
            Optimize selectors
          </label>

          <label className="option-label">
            <input
              type="checkbox"
              checked={selectorEngine.strategy.fallback}
              onChange={(e) => dispatch({
                type: 'selector/strategy/set',
                payload: {
                  ...selectorEngine.strategy,
                  fallback: e.target.checked,
                },
              })}
            />
            Generate fallback selectors
          </label>

          <label className="option-label">
            <input
              type="checkbox"
              checked={selectorEngine.strategy.includePosition}
              onChange={(e) => dispatch({
                type: 'selector/strategy/set',
                payload: {
                  ...selectorEngine.strategy,
                  includePosition: e.target.checked,
                },
              })}
            />
            Include position in selectors
          </label>
        </div>
      </div>

      {/* Selector Statistics */}
      <div className="stats-section">
        <h3>Selector Statistics</h3>
        
        <div className="stats-grid">
          <div className="stat-item">
            <span className="stat-label">Total Generated:</span>
            <span className="stat-value">{selectorEngine.selectorStats.totalGenerated}</span>
          </div>

          <div className="stat-item">
            <span className="stat-label">Unique Selectors:</span>
            <span className="stat-value">{selectorEngine.selectorStats.uniqueSelectors}</span>
          </div>

          <div className="stat-item">
            <span className="stat-label">Average Length:</span>
            <span className="stat-value">{selectorEngine.selectorStats.averageLength}</span>
          </div>

          <div className="stat-item">
            <span className="stat-label">Reliability Score:</span>
            <span className="stat-value">{selectorEngine.selectorStats.reliabilityScore}%</span>
          </div>
        </div>
      </div>

      {/* Element Highlighter */}
      <div className="highlighter-section">
        <h3>Element Highlighter</h3>
        
        <div className="highlighter-controls">
          <input
            type="text"
            placeholder="Enter CSS selector to highlight..."
            value={selectorEngine.highlightedElement || ''}
            onChange={(e) => dispatch({
              type: 'selector/highlight',
              payload: e.target.value || null,
            })}
            className="selector-input"
          />
          
          <button
            onClick={() => dispatch({
              type: 'selector/highlight',
              payload: null,
            })}
            className="clear-highlight-button"
            disabled={!selectorEngine.highlightedElement}
          >
            Clear
          </button>
        </div>
      </div>

      {/* Custom Selectors */}
      <div className="custom-section">
        <h3>Custom Selectors</h3>
        
        {selectorEngine.customSelectors.length === 0 ? (
          <div className="empty-state">
            <Target size={24} opacity={0.3} />
            <p>No custom selectors defined yet.</p>
          </div>
        ) : (
          <div className="custom-list">
            {selectorEngine.customSelectors.map(selector => (
              <div key={selector.id} className="custom-item">
                <div className="custom-name">{selector.name}</div>
                <div className="custom-pattern">{selector.pattern}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Placeholder content */}
      <div className="placeholder-section">
        <p>Advanced selector functionality will be implemented including:</p>
        <ul>
          <li>Real-time element highlighting</li>
          <li>Selector reliability testing</li>
          <li>Custom selector patterns</li>
          <li>Smart selector generation algorithms</li>
          <li>Selector optimization suggestions</li>
        </ul>
      </div>

      <style jsx>{`
        .selectors-tab {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .mode-section,
        .strategy-section,
        .stats-section,
        .highlighter-section,
        .custom-section,
        .placeholder-section {
          background: var(--bg-secondary, #f8f9fa);
          border: 1px solid var(--border-color, #e1e5e9);
          border-radius: 6px;
          padding: 16px;
        }

        h3 {
          margin: 0 0 12px 0;
          font-size: 14px;
          font-weight: 600;
          color: var(--text-primary, #1a1a1a);
        }

        .mode-buttons {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .mode-button {
          padding: 6px 12px;
          border: 1px solid var(--border-color, #ced4da);
          border-radius: 4px;
          background: var(--bg-primary, #ffffff);
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
          text-transform: capitalize;
        }

        .mode-button.active {
          background: var(--color-primary, #007bff);
          color: white;
          border-color: var(--color-primary, #007bff);
        }

        .strategy-options {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .option-label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: var(--text-primary, #1a1a1a);
          cursor: pointer;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 12px;
        }

        .stat-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .stat-label {
          font-size: 12px;
          color: var(--text-secondary, #6c757d);
          font-weight: 500;
        }

        .stat-value {
          font-size: 12px;
          color: var(--text-primary, #1a1a1a);
          font-weight: 500;
        }

        .highlighter-controls {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .selector-input {
          flex: 1;
          padding: 8px;
          border: 1px solid var(--border-color, #ced4da);
          border-radius: 4px;
          font-size: 13px;
          font-family: monospace;
        }

        .clear-highlight-button {
          padding: 8px 12px;
          border: 1px solid var(--border-color, #ced4da);
          border-radius: 4px;
          background: var(--bg-primary, #ffffff);
          font-size: 13px;
          cursor: pointer;
        }

        .clear-highlight-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 24px;
          color: var(--text-secondary, #6c757d);
          text-align: center;
        }

        .empty-state p {
          margin: 8px 0 0 0;
        }

        .custom-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .custom-item {
          padding: 8px;
          border: 1px solid var(--border-color, #e1e5e9);
          border-radius: 4px;
          background: var(--bg-primary, #ffffff);
        }

        .custom-name {
          font-size: 13px;
          font-weight: 500;
          color: var(--text-primary, #1a1a1a);
        }

        .custom-pattern {
          font-size: 11px;
          color: var(--text-secondary, #6c757d);
          font-family: monospace;
          margin-top: 4px;
        }

        .placeholder-section p {
          margin: 0 0 8px 0;
          color: var(--text-secondary, #6c757d);
        }

        .placeholder-section ul {
          margin: 8px 0 0 0;
          padding-left: 20px;
          color: var(--text-secondary, #6c757d);
        }

        .placeholder-section li {
          margin-bottom: 4px;
        }
      `}</style>
    </div>
  );
}