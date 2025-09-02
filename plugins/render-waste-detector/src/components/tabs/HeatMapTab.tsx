import React from "react";
import { Flame, Settings, RefreshCw } from "lucide-react";
import type {
  RenderWasteDetectorState,
  RenderWasteDetectorEventClient,
} from "../../types";

interface HeatMapTabProps {
  state: RenderWasteDetectorState;
  eventClient: RenderWasteDetectorEventClient;
  dispatch: (action: unknown) => void;
  compact: boolean;
  onComponentSelect: (componentId: string | null) => void;
  onSuggestionApply: (suggestionId: string) => void;
}

export function HeatMapTab({
  state,
  eventClient,
  dispatch: _dispatch,
  compact: _compact,
  onComponentSelect,
}: HeatMapTabProps) {
  const { heatMapData, ui } = state;
  const { viewOptions } = ui;

  return (
    <div className="heatmap-tab">
      <div className="tab-header">
        <h2>Render Heat Map</h2>
        <div className="heatmap-controls">
          <select
            value={viewOptions.heatMapMode}
            onChange={(e) => eventClient.setHeatMapMode(e.target.value as "renders" | "waste" | "time" | "impact")}
          >
            <option value="renders">Render Count</option>
            <option value="waste">Waste Level</option>
            <option value="time">Render Time</option>
            <option value="impact">Impact Score</option>
          </select>
          <button className="refresh-btn">
            <RefreshCw size={16} />
            Refresh
          </button>
          <button className="settings-btn">
            <Settings size={16} />
          </button>
        </div>
      </div>

      <div className="heatmap-content">
        {heatMapData.length > 0 ? (
          <div className="heatmap-visualization">
            <svg className="heatmap-svg" viewBox="0 0 800 600">
              {heatMapData.map((data) => (
                <rect
                  key={data.componentId}
                  x={data.position.x}
                  y={data.position.y}
                  width={data.position.width}
                  height={data.position.height}
                  fill={data.color}
                  opacity={data.intensity / 100}
                  rx={4}
                  className="heatmap-rect"
                  onClick={() => onComponentSelect(data.componentId)}
                >
                  <title>{data.tooltip}</title>
                </rect>
              ))}
            </svg>
          </div>
        ) : (
          <div className="empty-state">
            <Flame size={48} />
            <h3>No Heat Map Data</h3>
            <p>
              Record component renders and run analysis to generate heat map
            </p>
            {!state.performance.isAnalyzing && (
              <button
                onClick={() => eventClient.startAnalysis()}
                className="analyze-btn"
              >
                Generate Heat Map
              </button>
            )}
          </div>
        )}
      </div>

      <div className="heatmap-legend">
        <div className="legend-title">Heat Map Legend</div>
        <div className="legend-items">
          <div className="legend-item">
            <div className="legend-color" style={{ background: "#28a745" }} />
            <span>Low</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ background: "#ffc107" }} />
            <span>Medium</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ background: "#dc3545" }} />
            <span>High</span>
          </div>
        </div>
      </div>

      <style>{`
        .heatmap-tab {
          display: flex;
          flex-direction: column;
          height: 100%;
          gap: 16px;
        }

        .tab-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .tab-header h2 {
          margin: 0;
          font-size: 18px;
          color: var(--text-primary, #1a1a1a);
        }

        .heatmap-controls {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .heatmap-controls select {
          padding: 6px 8px;
          border: 1px solid var(--border-color, #e1e5e9);
          border-radius: 4px;
          background: var(--bg-secondary, #f8f9fa);
          font-size: 13px;
        }

        .refresh-btn,
        .settings-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border: 1px solid var(--border-color, #e1e5e9);
          border-radius: 4px;
          background: var(--bg-secondary, #f8f9fa);
          cursor: pointer;
        }

        .heatmap-content {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-secondary, #f8f9fa);
          border: 1px solid var(--border-color, #e1e5e9);
          border-radius: 8px;
          overflow: hidden;
        }

        .heatmap-visualization {
          width: 100%;
          height: 100%;
        }

        .heatmap-svg {
          width: 100%;
          height: 100%;
        }

        .heatmap-rect {
          cursor: pointer;
          transition: opacity 0.2s ease;
        }

        .heatmap-rect:hover {
          opacity: 0.8;
          stroke: var(--color-primary, #007bff);
          stroke-width: 2;
        }

        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          color: var(--text-secondary, #6c757d);
          padding: 48px;
        }

        .empty-state h3 {
          margin: 16px 0 8px 0;
          color: var(--text-primary, #1a1a1a);
        }

        .analyze-btn {
          margin-top: 16px;
          padding: 10px 20px;
          background: var(--color-primary, #007bff);
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 13px;
        }

        .heatmap-legend {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 12px 16px;
          background: var(--bg-secondary, #f8f9fa);
          border: 1px solid var(--border-color, #e1e5e9);
          border-radius: 6px;
          font-size: 12px;
        }

        .legend-title {
          font-weight: 500;
          color: var(--text-primary, #1a1a1a);
        }

        .legend-items {
          display: flex;
          gap: 12px;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .legend-color {
          width: 12px;
          height: 12px;
          border-radius: 2px;
        }

        /* Dark theme */
        .theme-dark .tab-header h2 {
          color: var(--text-primary, #ffffff);
        }

        .theme-dark .heatmap-controls select {
          background: var(--bg-secondary, #2a2a2a);
          border-color: var(--border-color, #333);
          color: var(--text-primary, #ffffff);
        }

        .theme-dark .refresh-btn,
        .theme-dark .settings-btn {
          background: var(--bg-secondary, #2a2a2a);
          border-color: var(--border-color, #333);
        }

        .theme-dark .heatmap-content {
          background: var(--bg-secondary, #2a2a2a);
          border-color: var(--border-color, #333);
        }

        .theme-dark .empty-state h3 {
          color: var(--text-primary, #ffffff);
        }

        .theme-dark .heatmap-legend {
          background: var(--bg-secondary, #2a2a2a);
          border-color: var(--border-color, #333);
        }

        .theme-dark .legend-title {
          color: var(--text-primary, #ffffff);
        }
      `}</style>
    </div>
  );
}

export default HeatMapTab;
