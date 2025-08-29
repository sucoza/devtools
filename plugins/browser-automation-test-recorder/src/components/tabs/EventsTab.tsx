import React from 'react';
import { clsx } from 'clsx';
import { MousePointer, Keyboard, Navigation, Search, Filter } from 'lucide-react';

import type { TabComponentProps } from '../../types';

/**
 * Events list and management tab component
 */
export default function EventsTab({ state, dispatch, compact }: TabComponentProps) {
  const { events, ui } = state;
  const filteredEvents = events; // This would use the actual filtering logic

  return (
    <div className="events-tab">
      {/* Search and Filters */}
      <div className="filters-section">
        <div className="search-bar">
          <Search size={14} />
          <input
            type="text"
            placeholder="Search events..."
            value={ui.filters.search}
            onChange={(e) => dispatch({
              type: 'ui/filter/update',
              payload: { search: e.target.value },
            })}
          />
        </div>

        <div className="filter-toggles">
          <button
            onClick={() => dispatch({ type: 'ui/panel/toggle', payload: 'filters' })}
            className={clsx('filter-button', {
              active: ui.panelsExpanded.filters,
            })}
          >
            <Filter size={14} />
            Filters
          </button>
        </div>
      </div>

      {/* Event Type Filters */}
      {ui.panelsExpanded.filters && (
        <div className="event-type-filters">
          <h4>Event Types</h4>
          <div className="filter-grid">
            {['click', 'input', 'navigation', 'keydown', 'scroll'].map(eventType => (
              <label key={eventType} className="filter-checkbox">
                <input
                  type="checkbox"
                  checked={ui.filters.eventTypes.has(eventType as any)}
                  onChange={(e) => {
                    const newTypes = new Set(ui.filters.eventTypes);
                    if (e.target.checked) {
                      newTypes.add(eventType as any);
                    } else {
                      newTypes.delete(eventType as any);
                    }
                    dispatch({
                      type: 'ui/filter/update',
                      payload: { eventTypes: newTypes },
                    });
                  }}
                />
                {eventType}
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Events List */}
      <div className="events-section">
        <div className="events-header">
          <h3>Events ({filteredEvents.length})</h3>
          
          {events.length > 0 && (
            <button
              onClick={() => dispatch({ type: 'recording/clear' })}
              className="clear-button"
            >
              Clear All
            </button>
          )}
        </div>

        {filteredEvents.length === 0 ? (
          <div className="empty-state">
            <MousePointer size={48} opacity={0.3} />
            <p>No events recorded yet.</p>
            <p>Start recording to see browser interactions here.</p>
          </div>
        ) : (
          <div className="events-list">
            {filteredEvents.map((event, index) => (
              <div
                key={event.id}
                className={clsx('event-item', {
                  selected: ui.selectedEventId === event.id,
                })}
                onClick={() => dispatch({
                  type: 'ui/event/select',
                  payload: event.id,
                })}
              >
                <div className="event-icon">
                  {getEventIcon(event.type)}
                </div>
                
                <div className="event-details">
                  <div className="event-type">{event.type}</div>
                  <div className="event-target">{event.target.selector}</div>
                  <div className="event-time">
                    {new Date(event.timestamp).toLocaleTimeString()}
                  </div>
                </div>
                
                <div className="event-sequence">#{event.sequence}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Event Details */}
      {ui.selectedEventId && (
        <div className="event-details-section">
          <h3>Event Details</h3>
          <div className="placeholder-content">
            <p>Selected Event ID: {ui.selectedEventId}</p>
            <p>Detailed event information will be displayed here including:</p>
            <ul>
              <li>Full event data and context</li>
              <li>Element selector information</li>
              <li>Screenshots (if captured)</li>
              <li>Performance metrics</li>
              <li>Edit and annotation capabilities</li>
            </ul>
          </div>
        </div>
      )}

      <style>{`
        .events-tab {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .filters-section {
          display: flex;
          gap: 12px;
          align-items: center;
          background: var(--bg-secondary, #f8f9fa);
          border: 1px solid var(--border-color, #e1e5e9);
          border-radius: 6px;
          padding: 12px;
        }

        .search-bar {
          display: flex;
          align-items: center;
          gap: 8px;
          flex: 1;
          position: relative;
        }

        .search-bar input {
          flex: 1;
          padding: 6px 8px;
          border: 1px solid var(--border-color, #ced4da);
          border-radius: 4px;
          font-size: 13px;
        }

        .filter-button {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border: 1px solid var(--border-color, #ced4da);
          border-radius: 4px;
          background: var(--bg-primary, #ffffff);
          font-size: 13px;
          cursor: pointer;
        }

        .filter-button.active {
          background: var(--color-primary, #007bff);
          color: white;
          border-color: var(--color-primary, #007bff);
        }

        .event-type-filters {
          background: var(--bg-secondary, #f8f9fa);
          border: 1px solid var(--border-color, #e1e5e9);
          border-radius: 6px;
          padding: 12px;
        }

        .event-type-filters h4 {
          margin: 0 0 8px 0;
          font-size: 13px;
          font-weight: 600;
        }

        .filter-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
          gap: 8px;
        }

        .filter-checkbox {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          cursor: pointer;
        }

        .events-section {
          background: var(--bg-secondary, #f8f9fa);
          border: 1px solid var(--border-color, #e1e5e9);
          border-radius: 6px;
          padding: 16px;
          flex: 1;
        }

        .events-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .events-header h3 {
          margin: 0;
          font-size: 14px;
          font-weight: 600;
        }

        .clear-button {
          padding: 4px 8px;
          border: 1px solid var(--border-color, #ced4da);
          border-radius: 4px;
          background: var(--bg-primary, #ffffff);
          font-size: 12px;
          cursor: pointer;
          color: var(--color-danger, #dc3545);
        }

        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px;
          color: var(--text-secondary, #6c757d);
          text-align: center;
        }

        .empty-state p {
          margin: 8px 0;
        }

        .events-list {
          max-height: 400px;
          overflow-y: auto;
        }

        .event-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px;
          border: 1px solid var(--border-color, #e1e5e9);
          border-radius: 4px;
          margin-bottom: 4px;
          cursor: pointer;
          transition: all 0.2s ease;
          background: var(--bg-primary, #ffffff);
        }

        .event-item:hover {
          background: var(--bg-hover, #f1f3f4);
        }

        .event-item.selected {
          border-color: var(--color-primary, #007bff);
          background: var(--color-primary-light, #e7f1ff);
        }

        .event-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          background: var(--bg-tertiary, #e9ecef);
          border-radius: 4px;
        }

        .event-details {
          flex: 1;
          min-width: 0;
        }

        .event-type {
          font-size: 13px;
          font-weight: 500;
          color: var(--text-primary, #1a1a1a);
        }

        .event-target {
          font-size: 11px;
          color: var(--text-secondary, #6c757d);
          font-family: monospace;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .event-time {
          font-size: 11px;
          color: var(--text-secondary, #6c757d);
        }

        .event-sequence {
          font-size: 11px;
          color: var(--text-secondary, #6c757d);
          font-weight: 500;
        }

        .event-details-section {
          background: var(--bg-secondary, #f8f9fa);
          border: 1px solid var(--border-color, #e1e5e9);
          border-radius: 6px;
          padding: 16px;
        }

        .event-details-section h3 {
          margin: 0 0 12px 0;
          font-size: 14px;
          font-weight: 600;
        }

        .placeholder-content p {
          margin: 0 0 8px 0;
          color: var(--text-secondary, #6c757d);
        }

        .placeholder-content ul {
          margin: 8px 0 0 0;
          padding-left: 20px;
          color: var(--text-secondary, #6c757d);
        }

        .placeholder-content li {
          margin-bottom: 4px;
        }
      `}</style>
    </div>
  );
}

function getEventIcon(eventType: string) {
  switch (eventType) {
    case 'click':
    case 'dblclick':
      return <MousePointer size={12} />;
    case 'keydown':
    case 'keyup':
    case 'input':
      return <Keyboard size={12} />;
    case 'navigation':
      return <Navigation size={12} />;
    default:
      return <MousePointer size={12} />;
  }
}