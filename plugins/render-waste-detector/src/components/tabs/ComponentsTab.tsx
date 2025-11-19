import React from "react";
import { Search, BarChart3, Filter } from "lucide-react";
import type {
  RenderWasteDetectorState,
  RenderWasteDetectorEventClient,
} from "../../types";

interface ComponentsTabProps {
  state: RenderWasteDetectorState;
  eventClient: RenderWasteDetectorEventClient;
  dispatch: (action: unknown) => void;
  compact: boolean;
  onComponentSelect: (componentId: string | null) => void;
  onSuggestionApply: (suggestionId: string) => void;
}

export function ComponentsTab({
  state,
  eventClient,
  dispatch: _dispatch,
  compact: _compact,
  onComponentSelect,
}: ComponentsTabProps) {
  return (
    <div className="components-tab">
      <div className="tab-header">
        <h2>Component Analysis</h2>
        <div className="search-filter">
          <div className="search-box">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search components..."
              value={state.ui.filters.componentNameFilter}
              onChange={(e) =>
                eventClient.updateFilters({
                  componentNameFilter: e.target.value,
                })
              }
            />
          </div>
          <button className="filter-btn">
            <Filter size={16} />
            Filter
          </button>
        </div>
      </div>

      <div className="components-content">
        {Array.from(state.components.values()).length > 0 ? (
          <div className="components-list">
            {Array.from(state.components.values()).map((component) => (
              <div
                key={component.id}
                className="component-item"
                onClick={() => onComponentSelect(component.id)}
              >
                <div className="component-info">
                  <div className="component-name">{component.name}</div>
                  <div className="component-location">
                    {component.location.file}
                  </div>
                </div>
                <div className="component-metrics">
                  <BarChart3 size={16} />
                  <span>Metrics</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <BarChart3 size={48} />
            <h3>No Components Tracked</h3>
            <p>Start recording to analyze component render patterns</p>
          </div>
        )}
      </div>

      <style>{`
        .components-tab {
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
          color: var(--dt-text-primary, #1a1a1a);
        }

        .search-filter {
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .search-box {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          background: var(--dt-bg-secondary, #f8f9fa);
          border: 1px solid var(--dt-border-primary, #e1e5e9);
          border-radius: 6px;
        }

        .search-box input {
          border: none;
          background: transparent;
          outline: none;
          font-size: 13px;
          width: 200px;
        }

        .filter-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 12px;
          background: var(--dt-bg-secondary, #f8f9fa);
          border: 1px solid var(--dt-border-primary, #e1e5e9);
          border-radius: 6px;
          cursor: pointer;
          font-size: 13px;
        }

        .components-content {
          flex: 1;
          overflow-y: auto;
        }

        .components-list {
          display: grid;
          gap: 12px;
        }

        .component-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px;
          background: var(--dt-bg-secondary, #f8f9fa);
          border: 1px solid var(--dt-border-primary, #e1e5e9);
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .component-item:hover {
          border-color: var(--dt-border-focus, #007bff);
        }

        .component-info {
          flex: 1;
        }

        .component-name {
          font-weight: 500;
          color: var(--dt-text-primary, #1a1a1a);
          margin-bottom: 4px;
        }

        .component-location {
          font-size: 11px;
          color: var(--dt-text-secondary, #6c757d);
        }

        .component-metrics {
          display: flex;
          align-items: center;
          gap: 6px;
          color: var(--dt-border-focus, #007bff);
          font-size: 13px;
        }

        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          text-align: center;
          color: var(--dt-text-secondary, #6c757d);
        }

        .empty-state h3 {
          margin: 16px 0 8px 0;
          color: var(--dt-text-primary, #1a1a1a);
        }
      `}</style>
    </div>
  );
}

export default ComponentsTab;
