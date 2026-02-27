import React, { useState, useEffect } from 'react';
import { clsx } from 'clsx';
import { Play, Square, Pause, RotateCcw, Camera, Wifi } from 'lucide-react';

import type { TabComponentProps } from '../../types';
import { createBrowserAutomationEventClient } from '../../core/devtools-client';

/**
 * Recording control tab component
 */
export default function RecorderTab({ state, dispatch, compact: _compact }: TabComponentProps) {
  const { recording } = state;
  const [isLoading, setIsLoading] = useState(false);
  const [cdpConnected, setCdpConnected] = useState(false);
  const [realTimeEventCount, setRealTimeEventCount] = useState(0);
  const [lastEventTime, setLastEventTime] = useState<number | null>(null);
  
  // Get event client instance
  const eventClient = createBrowserAutomationEventClient();

  // Set up real-time updates
  useEffect(() => {
    let previousEventCount = state.events.length;

    const unsubscribe = eventClient.subscribe((event, type) => {
      if (type === 'browser-automation:state') {
        // Type guard to check if event is BrowserAutomationState
        if ('events' in event && Array.isArray(event.events)) {
          const currentState = event;
          // Check if events were added
          if (currentState.events.length > previousEventCount) {
            setRealTimeEventCount(currentState.events.length);
            setLastEventTime(Date.now());
            previousEventCount = currentState.events.length;
          }
        }
      }
    });

    // Try to connect to CDP on mount
    eventClient.connectToCDP().then(connected => {
      setCdpConnected(connected);
    }).catch(() => {
      setCdpConnected(false);
    });

    return unsubscribe;
  }, [eventClient, state.events.length]);

  const handleStartRecording = async () => {
    setIsLoading(true);
    try {
      await eventClient.startRecording();
      setRealTimeEventCount(0);
    } catch {
      // silently ignore
    } finally {
      setIsLoading(false);
    }
  };

  const handleStopRecording = async () => {
    setIsLoading(true);
    try {
      await eventClient.stopRecording();
    } catch {
      // silently ignore
    } finally {
      setIsLoading(false);
    }
  };

  const handlePauseRecording = () => {
    eventClient.pauseRecording();
  };

  const handleResumeRecording = () => {
    eventClient.resumeRecording();
  };

  const handleClearRecording = () => {
    eventClient.clearRecording();
    setRealTimeEventCount(0);
    setLastEventTime(null);
  };

  const handleTakeScreenshot = async () => {
    try {
      const screenshot = await eventClient.takeScreenshot({ fullPage: false });
      if (screenshot) {
        // Could emit event or show notification
      }
    } catch {
      // silently ignore
    }
  };

  return (
    <div className="recorder-tab">
      {/* Recording Controls */}
      <div className="control-section">
        <h3>Recording Controls</h3>
        
        <div className="control-buttons">
          {!recording.isRecording ? (
            <button
              onClick={handleStartRecording}
              disabled={isLoading}
              className="primary-button start-button"
            >
              <Play size={16} />
              {isLoading ? 'Starting...' : 'Start Recording'}
            </button>
          ) : (
            <>
              {recording.isPaused ? (
                <button
                  onClick={handleResumeRecording}
                  disabled={isLoading}
                  className="primary-button resume-button"
                >
                  <Play size={16} />
                  Resume
                </button>
              ) : (
                <button
                  onClick={handlePauseRecording}
                  disabled={isLoading}
                  className="secondary-button pause-button"
                >
                  <Pause size={16} />
                  Pause
                </button>
              )}
              
              <button
                onClick={handleStopRecording}
                disabled={isLoading}
                className="secondary-button stop-button"
              >
                <Square size={16} />
                {isLoading ? 'Stopping...' : 'Stop'}
              </button>
            </>
          )}

          <button
            onClick={handleClearRecording}
            disabled={state.events.length === 0 || isLoading}
            className="secondary-button clear-button"
          >
            <RotateCcw size={16} />
            Clear
          </button>
          
          {cdpConnected && (
            <button
              onClick={handleTakeScreenshot}
              disabled={isLoading}
              className="secondary-button screenshot-button"
              title="Take screenshot"
            >
              <Camera size={16} />
              Screenshot
            </button>
          )}
        </div>
      </div>

      {/* Recording Status */}
      <div className="status-section">
        <div className="status-header">
          <h3>Recording Status</h3>
          <div className="status-indicators">
            {cdpConnected && (
              <span className="cdp-indicator" title="Chrome DevTools Protocol connected">
                <Wifi size={14} />
                CDP
              </span>
            )}
          </div>
        </div>
        
        <div className="status-grid">
          <div className="status-item">
            <span className="status-label">State:</span>
            <span className={clsx('status-badge', {
              'status-recording': recording.isRecording && !recording.isPaused,
              'status-paused': recording.isPaused,
              'status-stopped': !recording.isRecording,
            })}>
              {recording.isRecording 
                ? recording.isPaused ? 'Paused' : 'Recording'
                : 'Stopped'
              }
            </span>
          </div>

          <div className="status-item">
            <span className="status-label">Events:</span>
            <span className="status-value">
              {recording.isRecording ? realTimeEventCount : state.events.length}
            </span>
          </div>

          <div className="status-item">
            <span className="status-label">Duration:</span>
            <span className="status-value">
              {recording.startTime 
                ? `${Math.round((Date.now() - recording.startTime) / 1000)}s`
                : '0s'
              }
            </span>
          </div>

          <div className="status-item">
            <span className="status-label">Mode:</span>
            <span className="status-value">{recording.mode}</span>
          </div>
          
          {lastEventTime && recording.isRecording && (
            <div className="status-item">
              <span className="status-label">Last Event:</span>
              <span className="status-value">
                {Math.round((Date.now() - lastEventTime) / 1000)}s ago
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Recording Options */}
      <div className="options-section">
        <h3>Recording Options</h3>
        
        <div className="option-group">
          <label className="option-label">
            <input
              type="checkbox"
              checked={state.settings.recordingOptions.captureScreenshots}
              onChange={(e) => dispatch({
                type: 'settings/update',
                payload: {
                  recordingOptions: {
                    ...state.settings.recordingOptions,
                    captureScreenshots: e.target.checked,
                  },
                },
              })}
            />
            Capture Screenshots
          </label>

          <label className="option-label">
            <input
              type="checkbox"
              checked={state.settings.recordingOptions.captureConsole}
              onChange={(e) => dispatch({
                type: 'settings/update',
                payload: {
                  recordingOptions: {
                    ...state.settings.recordingOptions,
                    captureConsole: e.target.checked,
                  },
                },
              })}
            />
            Capture Console Logs
          </label>

          <label className="option-label">
            <input
              type="checkbox"
              checked={state.settings.recordingOptions.captureNetwork}
              onChange={(e) => dispatch({
                type: 'settings/update',
                payload: {
                  recordingOptions: {
                    ...state.settings.recordingOptions,
                    captureNetwork: e.target.checked,
                  },
                },
              })}
            />
            Capture Network Requests
          </label>
        </div>
      </div>

      {/* Active Session Info */}
      {recording.activeSession && (
        <div className="session-section">
          <h3>Active Session</h3>
          
          <div className="session-info">
            <div className="session-item">
              <span className="session-label">Session ID:</span>
              <span className="session-value">{recording.activeSession.id}</span>
            </div>
            
            <div className="session-item">
              <span className="session-label">URL:</span>
              <span className="session-value">{recording.activeSession.url}</span>
            </div>
            
            <div className="session-item">
              <span className="session-label">Viewport:</span>
              <span className="session-value">
                {recording.activeSession.viewport.width} × {recording.activeSession.viewport.height}
              </span>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .recorder-tab {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .control-section,
        .status-section,
        .options-section,
        .session-section {
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
        
        .status-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }
        
        .status-indicators {
          display: flex;
          gap: 8px;
        }
        
        .cdp-indicator {
          display: flex;
          align-items: center;
          gap: 4px;
          background: var(--color-success, #28a745);
          color: white;
          padding: 2px 6px;
          border-radius: 10px;
          font-size: 10px;
          font-weight: 600;
          text-transform: uppercase;
        }

        .control-buttons {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .primary-button,
        .secondary-button {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 12px;
          border: none;
          border-radius: 4px;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .primary-button {
          background: var(--color-primary, #007bff);
          color: white;
        }

        .primary-button:hover {
          background: var(--color-primary-hover, #0056b3);
        }

        .secondary-button {
          background: var(--bg-tertiary, #e9ecef);
          color: var(--text-primary, #1a1a1a);
          border: 1px solid var(--border-color, #ced4da);
        }

        .secondary-button:hover {
          background: var(--bg-hover, #dee2e6);
        }

        .secondary-button:disabled,
        .primary-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .screenshot-button {
          background: var(--color-info, #007bff);
          color: white;
          border: none;
        }
        
        .screenshot-button:hover:not(:disabled) {
          background: var(--color-info-hover, #0056b3);
        }

        .start-button {
          background: var(--color-success, #28a745);
        }

        .start-button:hover {
          background: var(--color-success-hover, #1e7e34);
        }

        .pause-button {
          background: var(--color-warning, #ffc107);
          color: #1a1a1a;
        }

        .stop-button {
          background: var(--color-danger, #dc3545);
          color: white;
        }

        .status-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
          gap: 12px;
        }
        
        .status-grid .status-item:nth-child(n+5) {
          grid-column: span 2;
        }

        .status-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .status-label {
          font-size: 12px;
          color: var(--text-secondary, #6c757d);
          font-weight: 500;
        }

        .status-value {
          font-size: 12px;
          color: var(--text-primary, #1a1a1a);
          font-weight: 500;
        }

        .status-badge {
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
        }

        .status-stopped {
          background: var(--bg-tertiary, #e9ecef);
          color: var(--text-secondary, #6c757d);
        }

        .status-recording {
          background: var(--color-success, #28a745);
          color: white;
        }

        .status-paused {
          background: var(--color-warning, #ffc107);
          color: #1a1a1a;
        }

        .option-group {
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

        .option-label input[type="checkbox"] {
          margin: 0;
        }

        .session-info {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .session-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .session-label {
          font-size: 12px;
          color: var(--text-secondary, #6c757d);
          font-weight: 500;
        }

        .session-value {
          font-size: 12px;
          color: var(--text-primary, #1a1a1a);
          font-family: monospace;
        }
      `}</style>
    </div>
  );
}