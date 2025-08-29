import React from 'react';
import { Activity, BarChart3, TreePine, Network } from 'lucide-react';
import type { BundleAnalyzerState } from '../../types';

interface VisualizationTabProps {
  state: BundleAnalyzerState;
  eventClient: any;
}

export function VisualizationTab({ state, eventClient }: VisualizationTabProps) {
  const viewModes = [
    { id: 'treemap', label: 'Treemap', icon: BarChart3 },
    { id: 'sunburst', label: 'Sunburst', icon: Activity },
    { id: 'tree', label: 'Tree View', icon: TreePine },
    { id: 'network', label: 'Network Graph', icon: Network },
  ] as const;

  const handleViewModeChange = (mode: typeof viewModes[number]['id']) => {
    eventClient.updateVisualization({ viewMode: mode });
  };

  return (
    <div className="visualization-tab">
      <div className="visualization-controls">
        <div className="view-modes">
          {viewModes.map(mode => {
            const Icon = mode.icon;
            return (
              <button
                key={mode.id}
                className={`view-mode-btn ${state.visualization.viewMode === mode.id ? 'active' : ''}`}
                onClick={() => handleViewModeChange(mode.id)}
              >
                <Icon size={14} />
                <span>{mode.label}</span>
              </button>
            );
          })}
        </div>

        <div className="zoom-controls">
          <button 
            className="zoom-btn"
            onClick={() => eventClient.updateVisualization({ 
              zoomLevel: Math.max(0.1, state.visualization.zoomLevel - 0.1) 
            })}
          >
            -
          </button>
          <span className="zoom-level">
            {Math.round(state.visualization.zoomLevel * 100)}%
          </span>
          <button 
            className="zoom-btn"
            onClick={() => eventClient.updateVisualization({ 
              zoomLevel: Math.min(3, state.visualization.zoomLevel + 0.1) 
            })}
          >
            +
          </button>
        </div>
      </div>

      <div className="visualization-content">
        <div className="placeholder-visualization">
          <Activity size={64} color="var(--text-secondary)" />
          <h3>Bundle Visualization</h3>
          <p>
            Interactive {state.visualization.viewMode} visualization would appear here.
            This would show the bundle structure with size-proportional visual elements.
          </p>
          
          <div className="mock-features">
            <div className="feature-item">
              <BarChart3 size={16} />
              <span>Size-proportional modules</span>
            </div>
            <div className="feature-item">
              <TreePine size={16} />
              <span>Hierarchical chunk structure</span>
            </div>
            <div className="feature-item">
              <Network size={16} />
              <span>Dependency relationships</span>
            </div>
            <div className="feature-item">
              <Activity size={16} />
              <span>Interactive zoom and pan</span>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .visualization-tab {
          height: 100%;
          display: flex;
          flex-direction: column;
        }

        .visualization-controls {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          background: var(--bg-secondary);
          border-bottom: 1px solid var(--border-primary);
        }

        .view-modes {
          display: flex;
          gap: 4px;
        }

        .view-mode-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border: 1px solid var(--border-primary);
          background: var(--bg-primary);
          border-radius: 4px;
          color: var(--text-primary);
          font-size: 11px;
          cursor: pointer;
        }

        .view-mode-btn:hover {
          background: var(--bg-hover);
        }

        .view-mode-btn.active {
          background: var(--accent-primary);
          color: white;
          border-color: var(--accent-primary);
        }

        .zoom-controls {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .zoom-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          border: 1px solid var(--border-primary);
          background: var(--bg-primary);
          border-radius: 3px;
          cursor: pointer;
          color: var(--text-primary);
          font-weight: bold;
        }

        .zoom-btn:hover {
          background: var(--bg-hover);
        }

        .zoom-level {
          color: var(--text-secondary);
          font-size: 11px;
          min-width: 40px;
          text-align: center;
        }

        .visualization-content {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }

        .placeholder-visualization {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          max-width: 400px;
        }

        .placeholder-visualization h3 {
          margin: 16px 0 8px 0;
          color: var(--text-primary);
          font-size: 18px;
        }

        .placeholder-visualization p {
          margin: 0 0 24px 0;
          color: var(--text-secondary);
          font-size: 12px;
          line-height: 1.5;
        }

        .mock-features {
          display: flex;
          flex-direction: column;
          gap: 12px;
          width: 100%;
        }

        .feature-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px 12px;
          background: var(--bg-secondary);
          border-radius: 6px;
          color: var(--text-primary);
          font-size: 12px;
        }
      `}</style>
    </div>
  );
}