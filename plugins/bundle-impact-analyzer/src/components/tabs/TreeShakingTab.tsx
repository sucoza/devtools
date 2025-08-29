import React from 'react';
import { TreePine, AlertTriangle, CheckCircle } from 'lucide-react';
import type { BundleAnalyzerState } from '../../types';

interface TreeShakingTabProps {
  state: BundleAnalyzerState;
  eventClient: any;
}

export function TreeShakingTab({ state, eventClient }: TreeShakingTabProps) {
  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const efficiency = state.stats.treeShakingEfficiency * 100;

  return (
    <div className="tree-shaking-tab">
      <div className="efficiency-overview">
        <div className="efficiency-score">
          <div className="score-circle">
            <span className="score-value">{efficiency.toFixed(1)}%</span>
          </div>
          <div className="score-info">
            <h3>Tree-shaking Efficiency</h3>
            <p>Percentage of exports actually used</p>
          </div>
        </div>
        
        <div className="efficiency-metrics">
          <div className="metric">
            <span className="metric-label">Unused Code:</span>
            <span className="metric-value">{formatSize(state.stats.unusedCodeSize)}</span>
          </div>
          <div className="metric">
            <span className="metric-label">Potential Savings:</span>
            <span className="metric-value">
              {formatSize(state.stats.unusedCodeSize * 0.7)}
            </span>
          </div>
        </div>
      </div>

      <div className="tree-shakeable-modules">
        <h3>Tree-shakeable Analysis</h3>
        {state.modules
          .filter(m => m.unusedExports && m.unusedExports.length > 0)
          .slice(0, 10)
          .map(module => (
            <div key={module.id} className="module-analysis">
              <div className="module-header">
                <div className="module-name">{module.name}</div>
                <div className="unused-ratio">
                  {module.unusedExports ? 
                    `${((module.unusedExports.length / module.exports.length) * 100).toFixed(0)}% unused`
                    : 'N/A'
                  }
                </div>
              </div>
              {module.unusedExports && module.unusedExports.length > 0 && (
                <div className="unused-exports">
                  {module.unusedExports.slice(0, 5).map(exp => (
                    <span key={exp} className="unused-export">{exp}</span>
                  ))}
                  {module.unusedExports.length > 5 && (
                    <span className="more-exports">+{module.unusedExports.length - 5} more</span>
                  )}
                </div>
              )}
            </div>
          ))}
      </div>

      <style>{`
        .tree-shaking-tab {
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .efficiency-overview {
          display: flex;
          align-items: center;
          gap: 20px;
          background: var(--bg-secondary);
          border-radius: 8px;
          padding: 20px;
        }

        .efficiency-score {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .score-circle {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 80px;
          height: 80px;
          border: 3px solid var(--accent-secondary);
          border-radius: 50%;
        }

        .score-value {
          font-size: 18px;
          font-weight: bold;
          color: var(--accent-secondary);
        }

        .score-info h3 {
          margin: 0 0 4px 0;
          color: var(--text-primary);
          font-size: 16px;
        }

        .score-info p {
          margin: 0;
          color: var(--text-secondary);
          font-size: 12px;
        }

        .efficiency-metrics {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .metric {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
        }

        .metric-label {
          color: var(--text-secondary);
          font-size: 12px;
        }

        .metric-value {
          color: var(--text-primary);
          font-size: 12px;
          font-weight: 600;
        }

        .tree-shakeable-modules {
          background: var(--bg-secondary);
          border-radius: 8px;
          padding: 16px;
        }

        .tree-shakeable-modules h3 {
          margin: 0 0 16px 0;
          color: var(--text-primary);
          font-size: 14px;
          font-weight: 600;
        }

        .module-analysis {
          background: var(--bg-tertiary);
          border-radius: 6px;
          padding: 12px;
          margin-bottom: 8px;
        }

        .module-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .module-name {
          color: var(--text-primary);
          font-size: 12px;
          font-weight: 500;
        }

        .unused-ratio {
          color: #ea4335;
          font-size: 11px;
          font-weight: 600;
        }

        .unused-exports {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
        }

        .unused-export {
          padding: 2px 6px;
          background: #ea4335;
          color: white;
          border-radius: 3px;
          font-size: 10px;
          font-weight: 500;
        }

        .more-exports {
          color: var(--text-secondary);
          font-size: 10px;
          font-style: italic;
        }
      `}</style>
    </div>
  );
}