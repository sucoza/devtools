import React from "react";
import { clsx } from "clsx";
import {
  Activity,
  AlertTriangle,
  Clock,
  Zap,
  TrendingUp,
  Component,
} from "lucide-react";

import type {
  RenderWasteDetectorState,
  RenderWasteDetectorEventClient,
} from "../../types";

interface OverviewTabProps {
  state: RenderWasteDetectorState;
  eventClient: RenderWasteDetectorEventClient;
  dispatch: (action: any) => void;
  compact: boolean;
  onComponentSelect: (componentId: string | null) => void;
  onSuggestionApply: (suggestionId: string) => void;
}

export function OverviewTab({
  state,
  eventClient,
  dispatch,
  compact,
  onComponentSelect,
  onSuggestionApply,
}: OverviewTabProps) {
  const { stats, components, renderEvents, suggestions } = state;

  // Calculate summary metrics
  const totalComponents = components.size;
  const totalRenders = renderEvents.length;
  const wastePercentage = stats.wastePercentage;
  const avgRenderTime = stats.performanceImpact.avgRenderTime;

  // Get top wasteful components
  const topWastefulComponents = stats.mostWastefulComponents.slice(0, 5);

  // Get recent render events
  const recentEvents = renderEvents.slice(-10).reverse();

  // Get high priority suggestions
  const highPrioritySuggestions = suggestions
    .filter((s) => s.severity === "high" || s.severity === "critical")
    .slice(0, 3);

  return (
    <div className="overview-tab">
      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="summary-card">
          <div className="card-icon">
            <Component size={20} />
          </div>
          <div className="card-content">
            <div className="card-value">{totalComponents}</div>
            <div className="card-label">Components</div>
          </div>
        </div>

        <div className="summary-card">
          <div className="card-icon">
            <Activity size={20} />
          </div>
          <div className="card-content">
            <div className="card-value">{totalRenders}</div>
            <div className="card-label">Total Renders</div>
          </div>
        </div>

        <div
          className={clsx("summary-card", { warning: wastePercentage > 30 })}
        >
          <div className="card-icon">
            <AlertTriangle size={20} />
          </div>
          <div className="card-content">
            <div className="card-value">{wastePercentage.toFixed(1)}%</div>
            <div className="card-label">Render Waste</div>
          </div>
        </div>

        <div className="summary-card">
          <div className="card-icon">
            <Clock size={20} />
          </div>
          <div className="card-content">
            <div className="card-value">{avgRenderTime.toFixed(1)}ms</div>
            <div className="card-label">Avg Render Time</div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="content-grid">
        {/* Most Wasteful Components */}
        <div className="content-section">
          <div className="section-header">
            <h3>Most Wasteful Components</h3>
            <button
              onClick={() => eventClient.selectTab("components")}
              className="view-all-btn"
            >
              View All
            </button>
          </div>
          <div className="wasteful-components-list">
            {topWastefulComponents.length > 0 ? (
              topWastefulComponents.map((component, index) => (
                <div
                  key={component.componentName}
                  className="wasteful-component-item"
                  onClick={() => onComponentSelect(component.componentName)}
                >
                  <div className="component-rank">#{index + 1}</div>
                  <div className="component-info">
                    <div className="component-name">
                      {component.componentName}
                    </div>
                    <div className="component-stats">
                      {component.renderCount} renders •{" "}
                      {component.wastePercentage.toFixed(1)}% waste
                    </div>
                  </div>
                  <div className="waste-indicator">
                    <div
                      className="waste-bar"
                      style={{
                        width: `${Math.min(100, component.wastePercentage)}%`,
                      }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <p>No wasteful components detected yet.</p>
                {!state.recording.isRecording && totalRenders === 0 && (
                  <p className="empty-hint">
                    Start recording to see component analysis.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* High Priority Suggestions */}
        <div className="content-section">
          <div className="section-header">
            <h3>Priority Optimizations</h3>
            <button
              onClick={() => eventClient.selectTab("suggestions")}
              className="view-all-btn"
            >
              View All
            </button>
          </div>
          <div className="suggestions-list">
            {highPrioritySuggestions.length > 0 ? (
              highPrioritySuggestions.map((suggestion) => (
                <div key={suggestion.id} className="suggestion-item">
                  <div
                    className={clsx("severity-indicator", suggestion.severity)}
                  >
                    {suggestion.severity === "critical" ? "🔥" : "⚠️"}
                  </div>
                  <div className="suggestion-content">
                    <div className="suggestion-title">{suggestion.title}</div>
                    <div className="suggestion-component">
                      {suggestion.componentName}
                    </div>
                    <div className="suggestion-impact">
                      {suggestion.impact.performanceGain}% performance gain
                    </div>
                  </div>
                  <button
                    onClick={() => onSuggestionApply(suggestion.id)}
                    className="apply-suggestion-btn"
                  >
                    Apply
                  </button>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <p>No high priority suggestions available.</p>
                {totalRenders > 0 && !state.performance.isAnalyzing && (
                  <button
                    onClick={() => eventClient.startAnalysis()}
                    className="analyze-btn"
                  >
                    <Zap size={16} />
                    Analyze for Suggestions
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="content-section full-width">
          <div className="section-header">
            <h3>Recent Render Activity</h3>
            <button
              onClick={() => eventClient.selectTab("timeline")}
              className="view-all-btn"
            >
              View Timeline
            </button>
          </div>
          <div className="recent-activity">
            {recentEvents.length > 0 ? (
              <div className="activity-list">
                {recentEvents.map((event) => (
                  <div key={event.id} className="activity-item">
                    <div className="activity-timestamp">
                      {new Date(event.timestamp).toLocaleTimeString()}
                    </div>
                    <div className="activity-component">
                      {event.componentName}
                    </div>
                    <div className={clsx("activity-reason", event.reason)}>
                      {event.reason.replace("-", " ")}
                    </div>
                    <div className="activity-duration">
                      {event.duration.toFixed(1)}ms
                    </div>
                    {event.reason === "parent-render" &&
                      event.propsChanges.length === 0 &&
                      event.stateChanges.length === 0 && (
                        <div className="waste-tag">Waste</div>
                      )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <p>No render events recorded yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recording Prompt */}
      {!state.recording.isRecording && totalRenders === 0 && (
        <div className="recording-prompt">
          <div className="prompt-content">
            <TrendingUp size={32} />
            <h3>Start Detecting Render Waste</h3>
            <p>
              Begin recording to analyze your React components for unnecessary
              re-renders and get optimization suggestions.
            </p>
            <button
              onClick={() => eventClient.startRecording()}
              className="start-recording-btn"
            >
              <Activity size={16} />
              Start Recording
            </button>
          </div>
        </div>
      )}

      <style>{`
        .overview-tab {
          display: flex;
          flex-direction: column;
          gap: 24px;
          height: 100%;
        }

        .summary-cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
        }

        .summary-card {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px;
          background: var(--bg-secondary, #f8f9fa);
          border: 1px solid var(--border-color, #e1e5e9);
          border-radius: 8px;
          transition: all 0.2s ease;
        }

        .summary-card.warning {
          border-color: var(--color-warning, #ffc107);
          background: var(--color-warning-bg, #fff3cd);
        }

        .summary-card:hover {
          border-color: var(--color-primary, #007bff);
        }

        .card-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          background: var(--color-primary, #007bff);
          color: white;
          border-radius: 8px;
        }

        .card-content {
          flex: 1;
        }

        .card-value {
          font-size: 24px;
          font-weight: 600;
          color: var(--text-primary, #1a1a1a);
        }

        .card-label {
          font-size: 12px;
          color: var(--text-secondary, #6c757d);
          margin-top: 2px;
        }

        .content-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
          flex: 1;
        }

        .content-section {
          display: flex;
          flex-direction: column;
          background: var(--bg-secondary, #f8f9fa);
          border: 1px solid var(--border-color, #e1e5e9);
          border-radius: 8px;
          overflow: hidden;
        }

        .content-section.full-width {
          grid-column: 1 / -1;
        }

        .section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px;
          border-bottom: 1px solid var(--border-color, #e1e5e9);
        }

        .section-header h3 {
          margin: 0;
          font-size: 14px;
          font-weight: 600;
          color: var(--text-primary, #1a1a1a);
        }

        .view-all-btn {
          padding: 4px 8px;
          font-size: 11px;
          color: var(--color-primary, #007bff);
          background: transparent;
          border: 1px solid var(--color-primary, #007bff);
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .view-all-btn:hover {
          background: var(--color-primary, #007bff);
          color: white;
        }

        .wasteful-components-list,
        .suggestions-list,
        .recent-activity {
          flex: 1;
          padding: 16px;
          overflow-y: auto;
        }

        .wasteful-component-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          border: 1px solid var(--border-color, #e1e5e9);
          border-radius: 6px;
          margin-bottom: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .wasteful-component-item:hover {
          border-color: var(--color-primary, #007bff);
          background: var(--bg-hover, #f0f8ff);
        }

        .component-rank {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          background: var(--color-danger, #dc3545);
          color: white;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 600;
        }

        .component-info {
          flex: 1;
        }

        .component-name {
          font-weight: 500;
          color: var(--text-primary, #1a1a1a);
          margin-bottom: 2px;
        }

        .component-stats {
          font-size: 11px;
          color: var(--text-secondary, #6c757d);
        }

        .waste-indicator {
          width: 60px;
          height: 6px;
          background: var(--bg-tertiary, #f1f3f4);
          border-radius: 3px;
          overflow: hidden;
        }

        .waste-bar {
          height: 100%;
          background: linear-gradient(
            90deg,
            var(--color-warning, #ffc107) 0%,
            var(--color-danger, #dc3545) 100%
          );
          transition: width 0.3s ease;
        }

        .suggestion-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          border: 1px solid var(--border-color, #e1e5e9);
          border-radius: 6px;
          margin-bottom: 8px;
        }

        .severity-indicator {
          font-size: 16px;
        }

        .suggestion-content {
          flex: 1;
        }

        .suggestion-title {
          font-weight: 500;
          color: var(--text-primary, #1a1a1a);
          margin-bottom: 2px;
          font-size: 12px;
        }

        .suggestion-component {
          font-size: 11px;
          color: var(--text-secondary, #6c757d);
          margin-bottom: 2px;
        }

        .suggestion-impact {
          font-size: 10px;
          color: var(--color-success, #28a745);
          font-weight: 500;
        }

        .apply-suggestion-btn {
          padding: 6px 12px;
          font-size: 11px;
          background: var(--color-primary, #007bff);
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .apply-suggestion-btn:hover {
          background: var(--color-primary-dark, #0056b3);
        }

        .activity-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .activity-item {
          display: grid;
          grid-template-columns: auto 1fr auto auto auto;
          gap: 12px;
          align-items: center;
          padding: 8px 12px;
          background: var(--bg-primary, #ffffff);
          border: 1px solid var(--border-color, #e1e5e9);
          border-radius: 4px;
          font-size: 11px;
        }

        .activity-timestamp {
          color: var(--text-secondary, #6c757d);
          font-family: monospace;
        }

        .activity-component {
          font-weight: 500;
          color: var(--text-primary, #1a1a1a);
        }

        .activity-reason {
          padding: 2px 6px;
          border-radius: 3px;
          font-size: 10px;
          text-transform: capitalize;
          background: var(--bg-tertiary, #f1f3f4);
          color: var(--text-secondary, #6c757d);
        }

        .activity-reason.parent-render {
          background: var(--color-warning-bg, #fff3cd);
          color: var(--color-warning-dark, #856404);
        }

        .activity-duration {
          font-family: monospace;
          color: var(--text-secondary, #6c757d);
        }

        .waste-tag {
          padding: 2px 6px;
          background: var(--color-danger, #dc3545);
          color: white;
          border-radius: 3px;
          font-size: 10px;
          font-weight: 500;
        }

        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 32px;
          text-align: center;
          color: var(--text-secondary, #6c757d);
        }

        .empty-hint {
          font-size: 11px;
          margin-top: 8px;
        }

        .analyze-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background: var(--color-primary, #007bff);
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
          margin-top: 12px;
        }

        .analyze-btn:hover {
          background: var(--color-primary-dark, #0056b3);
        }

        .recording-prompt {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 48px;
          background: var(--bg-secondary, #f8f9fa);
          border: 2px dashed var(--border-color, #e1e5e9);
          border-radius: 8px;
          text-align: center;
        }

        .prompt-content h3 {
          margin: 16px 0 8px 0;
          color: var(--text-primary, #1a1a1a);
        }

        .prompt-content p {
          margin: 0 0 24px 0;
          color: var(--text-secondary, #6c757d);
          max-width: 400px;
        }

        .start-recording-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 24px;
          background: var(--color-primary, #007bff);
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
        }

        .start-recording-btn:hover {
          background: var(--color-primary-dark, #0056b3);
        }

        /* Theme dark mode */
        .theme-dark .summary-card {
          background: var(--bg-secondary, #2a2a2a);
          border-color: var(--border-color, #333);
        }

        .theme-dark .card-value {
          color: var(--text-primary, #ffffff);
        }

        .theme-dark .content-section {
          background: var(--bg-secondary, #2a2a2a);
          border-color: var(--border-color, #333);
        }

        .theme-dark .section-header h3 {
          color: var(--text-primary, #ffffff);
        }

        .theme-dark .component-name {
          color: var(--text-primary, #ffffff);
        }

        .theme-dark .suggestion-title {
          color: var(--text-primary, #ffffff);
        }

        .theme-dark .activity-component {
          color: var(--text-primary, #ffffff);
        }

        .theme-dark .activity-item {
          background: var(--bg-primary, #1a1a1a);
          border-color: var(--border-color, #333);
        }

        .theme-dark .prompt-content h3 {
          color: var(--text-primary, #ffffff);
        }

        .theme-dark .recording-prompt {
          background: var(--bg-secondary, #2a2a2a);
          border-color: var(--border-color, #333);
        }
      `}</style>
    </div>
  );
}

export default OverviewTab;
