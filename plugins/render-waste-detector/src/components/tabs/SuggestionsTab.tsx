import React from "react";
import { Lightbulb, Filter, AlertTriangle, CheckCircle, X } from "lucide-react";
import { clsx } from "clsx";
import type {
  RenderWasteDetectorState,
  RenderWasteDetectorEventClient,
  OptimizationSuggestion,
} from "../../types";

interface SuggestionsTabProps {
  state: RenderWasteDetectorState;
  eventClient: RenderWasteDetectorEventClient;
  dispatch: (action: any) => void;
  compact: boolean;
  onComponentSelect: (componentId: string | null) => void;
  onSuggestionApply: (suggestionId: string) => void;
}

export function SuggestionsTab({
  state,
  eventClient,
  dispatch,
  compact,
  onComponentSelect,
  onSuggestionApply,
}: SuggestionsTabProps) {
  const { suggestions, ui } = state;
  const filteredSuggestions = eventClient.getFilteredSuggestions();

  const getSeverityIcon = (severity: OptimizationSuggestion["severity"]) => {
    switch (severity) {
      case "critical":
        return "🔥";
      case "high":
        return "⚠️";
      case "medium":
        return "💡";
      case "low":
        return "ℹ️";
      default:
        return "💡";
    }
  };

  const getSeverityColor = (severity: OptimizationSuggestion["severity"]) => {
    switch (severity) {
      case "critical":
        return "#dc3545";
      case "high":
        return "#fd7e14";
      case "medium":
        return "#ffc107";
      case "low":
        return "#17a2b8";
      default:
        return "#17a2b8";
    }
  };

  return (
    <div className="suggestions-tab">
      <div className="tab-header">
        <h2>Optimization Suggestions</h2>
        <div className="suggestions-actions">
          <button
            onClick={() => eventClient.startAnalysis()}
            disabled={state.performance.isAnalyzing}
            className="analyze-btn"
          >
            <Lightbulb size={16} />
            {state.performance.isAnalyzing ? "Analyzing..." : "Analyze"}
          </button>
          <button className="filter-btn">
            <Filter size={16} />
            Filter
          </button>
        </div>
      </div>

      <div className="suggestions-stats">
        <div className="stat-item">
          <span className="stat-label">Total:</span>
          <span className="stat-value">{suggestions.length}</span>
        </div>
        <div className="stat-item critical">
          <span className="stat-label">Critical:</span>
          <span className="stat-value">
            {suggestions.filter((s) => s.severity === "critical").length}
          </span>
        </div>
        <div className="stat-item high">
          <span className="stat-label">High:</span>
          <span className="stat-value">
            {suggestions.filter((s) => s.severity === "high").length}
          </span>
        </div>
        <div className="stat-item medium">
          <span className="stat-label">Medium:</span>
          <span className="stat-value">
            {suggestions.filter((s) => s.severity === "medium").length}
          </span>
        </div>
      </div>

      <div className="suggestions-content">
        {filteredSuggestions.length > 0 ? (
          <div className="suggestions-list">
            {filteredSuggestions.map((suggestion: OptimizationSuggestion) => (
              <div key={suggestion.id} className="suggestion-card">
                <div className="suggestion-header">
                  <div className="suggestion-severity">
                    <span className="severity-icon">
                      {getSeverityIcon(suggestion.severity)}
                    </span>
                    <span
                      className={clsx("severity-label", suggestion.severity)}
                    >
                      {suggestion.severity}
                    </span>
                  </div>
                  <div className="suggestion-actions">
                    <button
                      onClick={() => onSuggestionApply(suggestion.id)}
                      className="apply-btn"
                    >
                      <CheckCircle size={14} />
                      Apply
                    </button>
                    <button
                      onClick={() =>
                        eventClient.dismissSuggestion(suggestion.id)
                      }
                      className="dismiss-btn"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>

                <div className="suggestion-content">
                  <h3 className="suggestion-title">{suggestion.title}</h3>
                  <div
                    className="suggestion-component"
                    onClick={() => onComponentSelect(suggestion.componentId)}
                  >
                    {suggestion.componentName}
                  </div>

                  <p className="suggestion-description">
                    {suggestion.description}
                  </p>

                  <div className="suggestion-solution">
                    <strong>Solution:</strong> {suggestion.solution}
                  </div>

                  {suggestion.codeExample && (
                    <div className="code-example">
                      <div className="code-header">
                        <span>Code Example</span>
                        <button className="copy-btn">Copy</button>
                      </div>
                      <pre>
                        <code>{suggestion.codeExample}</code>
                      </pre>
                    </div>
                  )}

                  <div className="suggestion-impact">
                    <div className="impact-item">
                      <span className="impact-label">Performance Gain:</span>
                      <span className="impact-value">
                        {suggestion.impact.performanceGain}%
                      </span>
                    </div>
                    <div className="impact-item">
                      <span className="impact-label">Render Reduction:</span>
                      <span className="impact-value">
                        {suggestion.impact.renderReduction}%
                      </span>
                    </div>
                    <div className="impact-item">
                      <span className="impact-label">Complexity:</span>
                      <span
                        className={clsx(
                          "complexity-badge",
                          suggestion.impact.complexity,
                        )}
                      >
                        {suggestion.impact.complexity}
                      </span>
                    </div>
                  </div>

                  {suggestion.relatedProps &&
                    suggestion.relatedProps.length > 0 && (
                      <div className="related-props">
                        <span className="related-label">Related props:</span>
                        {suggestion.relatedProps.map((prop: string) => (
                          <span key={prop} className="prop-tag">
                            {prop}
                          </span>
                        ))}
                      </div>
                    )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <Lightbulb size={48} />
            <h3>No Suggestions Available</h3>
            <p>
              {suggestions.length === 0
                ? "Run analysis on your render data to get optimization suggestions"
                : "All suggestions are filtered out by current filters"}
            </p>
            {suggestions.length === 0 && !state.performance.isAnalyzing && (
              <button
                onClick={() => eventClient.startAnalysis()}
                className="analyze-btn"
              >
                <Lightbulb size={16} />
                Run Analysis
              </button>
            )}
          </div>
        )}
      </div>

      <style>{`
        .suggestions-tab {
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

        .suggestions-actions {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .analyze-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 12px;
          background: var(--color-primary, #007bff);
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 13px;
        }

        .analyze-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .filter-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 12px;
          background: var(--bg-secondary, #f8f9fa);
          border: 1px solid var(--border-color, #e1e5e9);
          border-radius: 6px;
          cursor: pointer;
          font-size: 13px;
        }

        .suggestions-stats {
          display: flex;
          gap: 16px;
          padding: 12px 16px;
          background: var(--bg-secondary, #f8f9fa);
          border: 1px solid var(--border-color, #e1e5e9);
          border-radius: 6px;
          font-size: 12px;
        }

        .stat-item {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .stat-label {
          color: var(--text-secondary, #6c757d);
        }

        .stat-value {
          font-weight: 600;
          color: var(--text-primary, #1a1a1a);
        }

        .stat-item.critical .stat-value {
          color: var(--color-danger, #dc3545);
        }

        .stat-item.high .stat-value {
          color: var(--color-warning, #fd7e14);
        }

        .stat-item.medium .stat-value {
          color: var(--color-warning, #ffc107);
        }

        .suggestions-content {
          flex: 1;
          overflow-y: auto;
        }

        .suggestions-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .suggestion-card {
          background: var(--bg-secondary, #f8f9fa);
          border: 1px solid var(--border-color, #e1e5e9);
          border-radius: 8px;
          overflow: hidden;
        }

        .suggestion-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          background: var(--bg-tertiary, #f1f3f4);
          border-bottom: 1px solid var(--border-color, #e1e5e9);
        }

        .suggestion-severity {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .severity-icon {
          font-size: 16px;
        }

        .severity-label {
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 10px;
          font-weight: 600;
          text-transform: uppercase;
        }

        .severity-label.critical {
          background: var(--color-danger, #dc3545);
          color: white;
        }

        .severity-label.high {
          background: var(--color-warning, #fd7e14);
          color: white;
        }

        .severity-label.medium {
          background: var(--color-warning, #ffc107);
          color: #1a1a1a;
        }

        .severity-label.low {
          background: var(--color-info, #17a2b8);
          color: white;
        }

        .suggestion-actions {
          display: flex;
          gap: 8px;
        }

        .apply-btn {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 6px 10px;
          background: var(--color-success, #28a745);
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 11px;
        }

        .dismiss-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          background: var(--color-danger, #dc3545);
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }

        .suggestion-content {
          padding: 16px;
        }

        .suggestion-title {
          margin: 0 0 8px 0;
          font-size: 14px;
          font-weight: 600;
          color: var(--text-primary, #1a1a1a);
        }

        .suggestion-component {
          display: inline-block;
          padding: 2px 8px;
          background: var(--color-primary, #007bff);
          color: white;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 500;
          cursor: pointer;
          margin-bottom: 12px;
        }

        .suggestion-description {
          margin: 0 0 12px 0;
          color: var(--text-secondary, #6c757d);
          line-height: 1.5;
        }

        .suggestion-solution {
          margin-bottom: 16px;
          font-size: 13px;
          color: var(--text-primary, #1a1a1a);
        }

        .code-example {
          margin-bottom: 16px;
          border: 1px solid var(--border-color, #e1e5e9);
          border-radius: 4px;
          overflow: hidden;
        }

        .code-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 12px;
          background: var(--bg-tertiary, #f1f3f4);
          border-bottom: 1px solid var(--border-color, #e1e5e9);
          font-size: 11px;
          font-weight: 500;
        }

        .copy-btn {
          padding: 2px 6px;
          background: var(--color-primary, #007bff);
          color: white;
          border: none;
          border-radius: 3px;
          cursor: pointer;
          font-size: 10px;
        }

        .code-example pre {
          margin: 0;
          padding: 12px;
          background: var(--bg-primary, #ffffff);
          font-family: "Monaco", "Consolas", monospace;
          font-size: 11px;
          line-height: 1.4;
          overflow-x: auto;
        }

        .suggestion-impact {
          display: flex;
          gap: 16px;
          margin-bottom: 12px;
          font-size: 12px;
        }

        .impact-item {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .impact-label {
          color: var(--text-secondary, #6c757d);
        }

        .impact-value {
          font-weight: 600;
          color: var(--color-success, #28a745);
        }

        .complexity-badge {
          padding: 2px 6px;
          border-radius: 3px;
          font-size: 10px;
          font-weight: 500;
          text-transform: uppercase;
        }

        .complexity-badge.low {
          background: var(--color-success, #28a745);
          color: white;
        }

        .complexity-badge.medium {
          background: var(--color-warning, #ffc107);
          color: #1a1a1a;
        }

        .complexity-badge.high {
          background: var(--color-danger, #dc3545);
          color: white;
        }

        .related-props {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          align-items: center;
          font-size: 11px;
        }

        .related-label {
          color: var(--text-secondary, #6c757d);
        }

        .prop-tag {
          padding: 2px 6px;
          background: var(--bg-tertiary, #f1f3f4);
          border: 1px solid var(--border-color, #e1e5e9);
          border-radius: 3px;
          font-family: monospace;
        }

        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          text-align: center;
          color: var(--text-secondary, #6c757d);
          padding: 48px;
        }

        .empty-state h3 {
          margin: 16px 0 8px 0;
          color: var(--text-primary, #1a1a1a);
        }

        .empty-state .analyze-btn {
          margin-top: 16px;
        }

        /* Dark theme */
        .theme-dark .tab-header h2 {
          color: var(--text-primary, #ffffff);
        }

        .theme-dark .filter-btn {
          background: var(--bg-secondary, #2a2a2a);
          border-color: var(--border-color, #333);
        }

        .theme-dark .suggestions-stats {
          background: var(--bg-secondary, #2a2a2a);
          border-color: var(--border-color, #333);
        }

        .theme-dark .stat-value {
          color: var(--text-primary, #ffffff);
        }

        .theme-dark .suggestion-card {
          background: var(--bg-secondary, #2a2a2a);
          border-color: var(--border-color, #333);
        }

        .theme-dark .suggestion-header {
          background: var(--bg-tertiary, #333);
          border-color: var(--border-color, #444);
        }

        .theme-dark .suggestion-title {
          color: var(--text-primary, #ffffff);
        }

        .theme-dark .suggestion-solution {
          color: var(--text-primary, #ffffff);
        }

        .theme-dark .code-header {
          background: var(--bg-tertiary, #333);
          border-color: var(--border-color, #444);
        }

        .theme-dark .code-example pre {
          background: var(--bg-primary, #1a1a1a);
          color: var(--text-primary, #ffffff);
        }

        .theme-dark .prop-tag {
          background: var(--bg-tertiary, #333);
          border-color: var(--border-color, #444);
        }

        .theme-dark .empty-state h3 {
          color: var(--text-primary, #ffffff);
        }
      `}</style>
    </div>
  );
}

export default SuggestionsTab;
