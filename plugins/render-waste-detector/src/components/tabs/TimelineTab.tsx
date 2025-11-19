import React from "react";
import { Clock, Play, Pause, ZoomIn, ZoomOut } from "lucide-react";
import type {
  RenderWasteDetectorState,
  RenderWasteDetectorDevToolsClient,
} from "../../types";

interface TimelineTabProps {
  state: RenderWasteDetectorState;
  eventClient: RenderWasteDetectorDevToolsClient;
  compact: boolean;
  onComponentSelect: (componentId: string | null) => void;
  onSuggestionApply: (suggestionId: string) => void;
}

export function TimelineTab({
  state,
  eventClient: _eventClient,
  compact: _compact,
  onComponentSelect,
}: TimelineTabProps) {
  const { renderEvents, ui } = state;
  const { viewOptions } = ui;

  return (
    <div className="timeline-tab">
      <div className="tab-header">
        <h2>Render Timeline</h2>
        <div className="timeline-controls">
          <button className="zoom-btn">
            <ZoomOut size={16} />
          </button>
          <span className="zoom-level">
            {Math.round(viewOptions.timelineZoom * 100)}%
          </span>
          <button className="zoom-btn">
            <ZoomIn size={16} />
          </button>
          <div className="divider" />
          <button className="playback-btn">
            <Play size={16} />
          </button>
          <button className="playback-btn">
            <Pause size={16} />
          </button>
        </div>
      </div>

      <div className="timeline-content">
        {renderEvents.length > 0 ? (
          <div className="timeline-visualization">
            <div className="timeline-header">
              <div className="time-scale">
                {/* Time scale markers would go here */}
              </div>
            </div>

            <div className="timeline-tracks">
              {Array.from(state.components.entries()).map(
                ([componentId, component]) => {
                  const componentEvents = renderEvents.filter(
                    (e) => e.componentId === componentId,
                  );

                  return (
                    <div key={componentId} className="timeline-track">
                      <div
                        className="track-label"
                        onClick={() => onComponentSelect(componentId)}
                      >
                        {component.name}
                      </div>
                      <div className="track-events">
                        {componentEvents.map((event) => (
                          <div
                            key={event.id}
                            className={`timeline-event ${event.reason}`}
                            style={{
                              left: `${(event.timestamp - renderEvents[0]?.timestamp || 0) / 10}px`,
                              width: `${Math.max(2, event.duration / 2)}px`,
                            }}
                            title={`${event.componentName}: ${event.reason} (${event.duration.toFixed(1)}ms)`}
                          />
                        ))}
                      </div>
                    </div>
                  );
                },
              )}
            </div>
          </div>
        ) : (
          <div className="empty-state">
            <Clock size={48} />
            <h3>No Timeline Data</h3>
            <p>Start recording to see render events timeline</p>
          </div>
        )}
      </div>

      <style>{`
        .timeline-tab {
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

        .timeline-controls {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .zoom-btn,
        .playback-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border: 1px solid var(--dt-border-primary, #e1e5e9);
          border-radius: 4px;
          background: var(--dt-bg-secondary, #f8f9fa);
          cursor: pointer;
        }

        .zoom-level {
          font-size: 12px;
          color: var(--dt-text-secondary, #6c757d);
          min-width: 40px;
          text-align: center;
        }

        .divider {
          width: 1px;
          height: 20px;
          background: var(--dt-border-primary, #e1e5e9);
        }

        .timeline-content {
          flex: 1;
          background: var(--dt-bg-secondary, #f8f9fa);
          border: 1px solid var(--dt-border-primary, #e1e5e9);
          border-radius: 8px;
          overflow: hidden;
        }

        .timeline-visualization {
          height: 100%;
          display: flex;
          flex-direction: column;
        }

        .timeline-header {
          padding: 12px;
          border-bottom: 1px solid var(--dt-border-primary, #e1e5e9);
          background: var(--dt-bg-tertiary, #f1f3f4);
        }

        .timeline-tracks {
          flex: 1;
          overflow-y: auto;
          overflow-x: auto;
        }

        .timeline-track {
          display: flex;
          border-bottom: 1px solid var(--dt-border-primary, #e1e5e9);
          height: 40px;
        }

        .track-label {
          width: 200px;
          padding: 12px;
          background: var(--dt-bg-tertiary, #f1f3f4);
          border-right: 1px solid var(--dt-border-primary, #e1e5e9);
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          flex-shrink: 0;
        }

        .track-label:hover {
          background: var(--dt-bg-hover, #e9ecef);
        }

        .track-events {
          flex: 1;
          position: relative;
          height: 100%;
          min-width: 800px;
        }

        .timeline-event {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          height: 20px;
          border-radius: 3px;
          cursor: pointer;
        }

        .timeline-event.props-change {
          background: var(--dt-border-focus, #007bff);
        }

        .timeline-event.state-change {
          background: var(--dt-status-success, #28a745);
        }

        .timeline-event.parent-render {
          background: var(--dt-status-warning, #ffc107);
        }

        .timeline-event.context-change {
          background: var(--dt-status-info, #17a2b8);
        }

        .timeline-event.force-update {
          background: var(--dt-status-error, #dc3545);
        }

        .timeline-event.initial-mount {
          background: var(--color-secondary, #6c757d);
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

export default TimelineTab;
