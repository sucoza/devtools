import React, { useState, useEffect, useCallback } from 'react';
import { clsx } from 'clsx';
import { 
  Play, 
  Pause, 
  Square, 
  SkipForward, 
  StepForward,
  Settings, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Camera,
  Activity,
  Clock,
  Target,
  Zap
} from 'lucide-react';

import type { 
  TabComponentProps, 
  PlaybackError, 
  EventExecutionResult,
  PlaybackMetrics 
} from '../../types';

/**
 * Enhanced playback control tab component with real-time monitoring
 */
export default function PlaybackTab({ state, dispatch, compact }: TabComponentProps) {
  const { playback, events, settings } = state;
  
  // Local state for enhanced UI
  const [playbackMetrics, setPlaybackMetrics] = useState<PlaybackMetrics | null>(null);
  const [currentError, setCurrentError] = useState<PlaybackError | null>(null);
  const [lastResult, setLastResult] = useState<EventExecutionResult | null>(null);
  const [isStepMode, setIsStepMode] = useState(false);
  const [showBreakpoints, setShowBreakpoints] = useState(false);
  const [breakpoints, setBreakpoints] = useState<Set<string>>(new Set());
  const [liveScreenshot, setLiveScreenshot] = useState<string | null>(null);
  
  // Real-time updates simulation (would integrate with actual playback engine)
  useEffect(() => {
    if (playback.isPlaying) {
      const interval = setInterval(() => {
        // Simulate metrics updates
        setPlaybackMetrics({
          totalEvents: events.length,
          completedEvents: playback.status.currentStep,
          failedEvents: playback.errors.length,
          skippedEvents: 0,
          totalExecutionTime: playback.status.elapsed,
          averageEventTime: playback.status.elapsed / Math.max(playback.status.currentStep, 1),
          minEventTime: 50,
          maxEventTime: 2000,
          errorRate: playback.errors.length / Math.max(playback.status.currentStep, 1),
          recoveryRate: 0.8,
          criticalErrors: 0,
          memoryUsage: 45 * 1024 * 1024, // 45MB
          cpuUsage: 15,
          networkLatency: 120,
          selectorSuccessRate: 0.95,
          healingSuccessRate: 0.85,
          retryCount: 2,
        });
        
        // Simulate current event result
        if (playback.status.lastEventResult) {
          setLastResult(playback.status.lastEventResult);
        }
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [playback.isPlaying, events.length, playback.status, playback.errors.length]);
  
  // Handle playback control actions
  const handlePlay = useCallback(() => {
    if (isStepMode) {
      dispatch({ type: 'playback/step', payload: events[playback.status.currentStep]?.id || '' });
    } else {
      dispatch({ type: 'playback/start' });
    }
  }, [dispatch, isStepMode, events, playback.status.currentStep]);
  
  const handleStep = useCallback(() => {
    const currentEvent = events[playback.status.currentStep];
    if (currentEvent) {
      dispatch({ type: 'playback/step', payload: currentEvent.id });
    }
  }, [dispatch, events, playback.status.currentStep]);
  
  const toggleBreakpoint = useCallback((eventId: string) => {
    const newBreakpoints = new Set(breakpoints);
    if (newBreakpoints.has(eventId)) {
      newBreakpoints.delete(eventId);
    } else {
      newBreakpoints.add(eventId);
    }
    setBreakpoints(newBreakpoints);
  }, [breakpoints]);
  
  const getCurrentEvent = useCallback(() => {
    return events[playback.status.currentStep] || null;
  }, [events, playback.status.currentStep]);
  
  const getExecutionStatusIcon = (result: EventExecutionResult | null) => {
    if (!result) return <Clock size={16} className="text-gray-400" />;
    if (result.success) return <CheckCircle size={16} className="text-green-500" />;
    return <XCircle size={16} className="text-red-500" />;
  };

  return (
    <div className={clsx('playback-tab', { compact })}>
      {/* Main Playback Controls */}
      <div className="control-section">
        <div className="section-header">
          <h3>Playback Controls</h3>
          <div className="control-modes">
            <button
              className={clsx('mode-button', { active: !isStepMode })}
              onClick={() => setIsStepMode(false)}
              title="Continuous playback"
            >
              <Play size={14} />
              Run
            </button>
            <button
              className={clsx('mode-button', { active: isStepMode })}
              onClick={() => setIsStepMode(true)}
              title="Step-by-step execution"
            >
              <StepForward size={14} />
              Step
            </button>
          </div>
        </div>
        
        <div className="control-buttons">
          <button
            onClick={handlePlay}
            disabled={events.length === 0 || (playback.isPlaying && !isStepMode)}
            className="primary-button"
          >
            <Play size={16} />
            {isStepMode ? 'Step' : 'Play'}
          </button>

          {!isStepMode && (
            <button
              onClick={() => dispatch({ type: 'playback/pause' })}
              disabled={!playback.isPlaying || playback.isPaused}
              className="secondary-button"
            >
              <Pause size={16} />
              Pause
            </button>
          )}

          <button
            onClick={() => dispatch({ type: 'playback/stop' })}
            disabled={!playback.isPlaying}
            className="secondary-button"
          >
            <Square size={16} />
            Stop
          </button>

          {isStepMode && (
            <button
              onClick={handleStep}
              disabled={!playback.isPlaying || playback.status.currentStep >= events.length}
              className="secondary-button"
            >
              <SkipForward size={16} />
              Next
            </button>
          )}

          <button
            className="secondary-button"
            onClick={() => setShowBreakpoints(!showBreakpoints)}
            title="Toggle breakpoints"
          >
            <Target size={16} />
            {showBreakpoints ? 'Hide' : 'Show'} Breakpoints
          </button>
        </div>

        {/* Speed Control */}
        <div className="speed-control">
          <label>
            <span>Speed: <strong>{playback.speed.toFixed(1)}x</strong></span>
            <input
              type="range"
              min="0.5"
              max="5"
              step="0.5"
              value={playback.speed}
              onChange={(e) => dispatch({
                type: 'playback/speed/set',
                payload: parseFloat(e.target.value),
              })}
            />
            <div className="speed-marks">
              <span>0.5x</span>
              <span>1x</span>
              <span>2x</span>
              <span>5x</span>
            </div>
          </label>
        </div>
      </div>

      {/* Current Event Status */}
      {playback.isPlaying && (
        <div className="current-event-section">
          <h3>Current Event</h3>
          <div className="current-event">
            <div className="event-icon">
              {getExecutionStatusIcon(lastResult)}
            </div>
            <div className="event-details">
              <div className="event-type">
                {getCurrentEvent()?.type || 'Unknown'}
              </div>
              <div className="event-selector">
                {getCurrentEvent()?.target.selector || 'No selector'}
              </div>
              {lastResult?.duration && (
                <div className="event-timing">
                  Executed in {lastResult.duration}ms
                </div>
              )}
            </div>
            {settings.playbackOptions.screenshotOnError && liveScreenshot && (
              <div className="live-screenshot">
                <Camera size={16} />
                <img src={liveScreenshot} alt="Live screenshot" width={60} height={40} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Progress & Metrics */}
      <div className="progress-section">
        <div className="section-header">
          <h3>Progress</h3>
          <div className="progress-stats">
            <span className="stat">
              <Activity size={14} />
              {Math.round((playback.status.currentStep / Math.max(playback.status.totalSteps, 1)) * 100)}%
            </span>
            <span className="stat">
              <Clock size={14} />
              {Math.round(playback.status.elapsed / 1000)}s
            </span>
            {playback.status.estimated > 0 && (
              <span className="stat">
                <Zap size={14} />
                ~{Math.round(playback.status.estimated / 1000)}s left
              </span>
            )}
          </div>
        </div>
        
        <div className="progress-bar">
          <div 
            className="progress-fill"
            style={{
              width: `${(playback.status.currentStep / Math.max(playback.status.totalSteps, 1)) * 100}%`
            }}
          />
          {breakpoints.size > 0 && (
            <div className="breakpoint-indicators">
              {Array.from(breakpoints).map((eventId) => {
                const eventIndex = events.findIndex(e => e.id === eventId);
                const percentage = (eventIndex / Math.max(events.length, 1)) * 100;
                return (
                  <div 
                    key={eventId}
                    className="breakpoint-indicator"
                    style={{ left: `${percentage}%` }}
                  />
                );
              })}
            </div>
          )}
        </div>
        
        <div className="progress-text">
          Step {playback.status.currentStep} of {playback.status.totalSteps}
          {playback.errors.length > 0 && (
            <span className="error-count">
              <AlertTriangle size={14} />
              {playback.errors.length} error{playback.errors.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {/* Real-time Metrics */}
      {playbackMetrics && (
        <div className="metrics-section">
          <h3>Performance Metrics</h3>
          <div className="metrics-grid">
            <div className="metric">
              <label>Success Rate</label>
              <div className="metric-value">
                <div className={clsx('metric-bar', {
                  'success': (1 - playbackMetrics.errorRate) >= 0.9,
                  'warning': (1 - playbackMetrics.errorRate) >= 0.7,
                  'error': (1 - playbackMetrics.errorRate) < 0.7
                })}>
                  <div 
                    className="metric-fill" 
                    style={{ width: `${(1 - playbackMetrics.errorRate) * 100}%` }}
                  />
                </div>
                <span>{Math.round((1 - playbackMetrics.errorRate) * 100)}%</span>
              </div>
            </div>
            
            <div className="metric">
              <label>Avg Event Time</label>
              <div className="metric-value">
                <span className="metric-number">
                  {Math.round(playbackMetrics.averageEventTime)}ms
                </span>
              </div>
            </div>
            
            <div className="metric">
              <label>Memory Usage</label>
              <div className="metric-value">
                <span className="metric-number">
                  {Math.round(playbackMetrics.memoryUsage / 1024 / 1024)}MB
                </span>
              </div>
            </div>
            
            <div className="metric">
              <label>Network Latency</label>
              <div className="metric-value">
                <span className="metric-number">
                  {Math.round(playbackMetrics.networkLatency)}ms
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {playback.errors.length > 0 && (
        <div className="errors-section">
          <h3>Recent Errors</h3>
          <div className="error-list">
            {playback.errors.slice(-3).map((error, index) => (
              <div key={error.id} className="error-item">
                <div className="error-icon">
                  <XCircle size={16} />
                </div>
                <div className="error-details">
                  <div className="error-message">{error.message}</div>
                  <div className="error-timestamp">
                    {new Date(error.timestamp).toLocaleTimeString()}
                  </div>
                </div>
                {error.screenshot && (
                  <button 
                    className="error-screenshot"
                    title="View error screenshot"
                  >
                    <Camera size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Event List with Breakpoints */}
      {showBreakpoints && (
        <div className="events-section">
          <h3>Events & Breakpoints</h3>
          <div className="events-list">
            {events.slice(0, 10).map((event, index) => (
              <div 
                key={event.id}
                className={clsx('event-item', {
                  'current': index === playback.status.currentStep,
                  'completed': index < playback.status.currentStep,
                  'breakpoint': breakpoints.has(event.id)
                })}
              >
                <button 
                  className="breakpoint-toggle"
                  onClick={() => toggleBreakpoint(event.id)}
                  title={breakpoints.has(event.id) ? 'Remove breakpoint' : 'Add breakpoint'}
                >
                  <div className={clsx('breakpoint-dot', {
                    'active': breakpoints.has(event.id)
                  })} />
                </button>
                <div className="event-info">
                  <span className="event-sequence">#{event.sequence}</span>
                  <span className="event-type">{event.type}</span>
                  <span className="event-target">
                    {event.target.selector.length > 30 
                      ? `${event.target.selector.substring(0, 30)}...` 
                      : event.target.selector}
                  </span>
                </div>
              </div>
            ))}
            {events.length > 10 && (
              <div className="events-overflow">
                +{events.length - 10} more events...
              </div>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        .playback-tab {
          display: flex;
          flex-direction: column;
          gap: 16px;
          height: 100%;
          overflow-y: auto;
        }

        .playback-tab.compact {
          gap: 12px;
        }

        .control-section,
        .progress-section,
        .current-event-section,
        .metrics-section,
        .errors-section,
        .events-section {
          background: var(--bg-secondary, #f8f9fa);
          border: 1px solid var(--border-color, #e1e5e9);
          border-radius: 6px;
          padding: 16px;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .section-header h3 {
          margin: 0;
          font-size: 14px;
          font-weight: 600;
          color: var(--text-primary, #1a1a1a);
        }

        .control-modes {
          display: flex;
          gap: 4px;
        }

        .mode-button {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 4px 8px;
          border: 1px solid var(--border-color, #ced4da);
          background: transparent;
          border-radius: 4px;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .mode-button.active {
          background: var(--color-primary, #007bff);
          color: white;
          border-color: var(--color-primary, #007bff);
        }

        .control-buttons {
          display: flex;
          gap: 8px;
          margin-bottom: 16px;
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
          white-space: nowrap;
        }

        .primary-button {
          background: var(--color-primary, #007bff);
          color: white;
        }

        .primary-button:hover:not(:disabled) {
          background: var(--color-primary-dark, #0056b3);
        }

        .primary-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .secondary-button {
          background: var(--bg-tertiary, #e9ecef);
          color: var(--text-primary, #1a1a1a);
          border: 1px solid var(--border-color, #ced4da);
        }

        .secondary-button:hover:not(:disabled) {
          background: var(--bg-quaternary, #dee2e6);
        }

        .secondary-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .speed-control {
          margin-top: 8px;
        }

        .speed-control label {
          display: flex;
          flex-direction: column;
          gap: 8px;
          font-size: 13px;
        }

        .speed-control label > span {
          display: flex;
          align-items: center;
        }

        .speed-control input[type="range"] {
          width: 100%;
          max-width: 300px;
        }

        .speed-marks {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          color: var(--text-secondary, #6c757d);
          max-width: 300px;
        }

        .progress-stats {
          display: flex;
          gap: 16px;
          align-items: center;
        }

        .stat {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;
          color: var(--text-secondary, #6c757d);
        }

        .progress-bar {
          position: relative;
          width: 100%;
          height: 12px;
          background: var(--bg-tertiary, #e9ecef);
          border-radius: 6px;
          overflow: hidden;
          margin-bottom: 8px;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, var(--color-primary, #007bff), var(--color-success, #28a745));
          transition: width 0.3s ease;
        }

        .breakpoint-indicators {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          pointer-events: none;
        }

        .breakpoint-indicator {
          position: absolute;
          top: 0;
          bottom: 0;
          width: 2px;
          background: var(--color-warning, #ffc107);
          z-index: 1;
        }

        .progress-text {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 12px;
          color: var(--text-secondary, #6c757d);
        }

        .error-count {
          display: flex;
          align-items: center;
          gap: 4px;
          color: var(--color-danger, #dc3545);
        }

        .current-event {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          background: var(--bg-primary, #ffffff);
          border-radius: 4px;
          border: 1px solid var(--border-color, #e1e5e9);
        }

        .event-icon {
          flex-shrink: 0;
        }

        .event-details {
          flex: 1;
          min-width: 0;
        }

        .event-type {
          font-weight: 600;
          font-size: 14px;
          color: var(--text-primary, #1a1a1a);
        }

        .event-selector {
          font-size: 12px;
          color: var(--text-secondary, #6c757d);
          margin-top: 2px;
          word-break: break-all;
        }

        .event-timing {
          font-size: 11px;
          color: var(--text-tertiary, #9ca3af);
          margin-top: 2px;
        }

        .live-screenshot {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 4px 8px;
          background: var(--bg-tertiary, #e9ecef);
          border-radius: 4px;
        }

        .live-screenshot img {
          border-radius: 2px;
        }

        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
        }

        .metric {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .metric label {
          font-size: 12px;
          font-weight: 500;
          color: var(--text-secondary, #6c757d);
        }

        .metric-value {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .metric-bar {
          flex: 1;
          height: 6px;
          background: var(--bg-tertiary, #e9ecef);
          border-radius: 3px;
          overflow: hidden;
        }

        .metric-fill {
          height: 100%;
          transition: width 0.3s ease;
        }

        .metric-bar.success .metric-fill {
          background: var(--color-success, #28a745);
        }

        .metric-bar.warning .metric-fill {
          background: var(--color-warning, #ffc107);
        }

        .metric-bar.error .metric-fill {
          background: var(--color-danger, #dc3545);
        }

        .metric-number {
          font-weight: 600;
          font-size: 13px;
          color: var(--text-primary, #1a1a1a);
        }

        .error-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .error-item {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          padding: 8px;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 4px;
        }

        .error-icon {
          flex-shrink: 0;
          margin-top: 1px;
        }

        .error-details {
          flex: 1;
          min-width: 0;
        }

        .error-message {
          font-size: 13px;
          color: var(--color-danger, #dc3545);
          font-weight: 500;
        }

        .error-timestamp {
          font-size: 11px;
          color: var(--text-secondary, #6c757d);
          margin-top: 2px;
        }

        .error-screenshot {
          flex-shrink: 0;
          padding: 4px;
          border: none;
          background: transparent;
          color: var(--text-secondary, #6c757d);
          cursor: pointer;
          border-radius: 2px;
        }

        .error-screenshot:hover {
          background: var(--bg-tertiary, #e9ecef);
        }

        .events-list {
          display: flex;
          flex-direction: column;
          gap: 4px;
          max-height: 300px;
          overflow-y: auto;
        }

        .event-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 8px;
          border-radius: 4px;
          transition: all 0.2s ease;
        }

        .event-item:hover {
          background: var(--bg-tertiary, #e9ecef);
        }

        .event-item.current {
          background: #e3f2fd;
          border: 1px solid #2196f3;
        }

        .event-item.completed {
          opacity: 0.7;
        }

        .event-item.breakpoint {
          background: #fff3cd;
          border: 1px solid #ffc107;
        }

        .breakpoint-toggle {
          padding: 2px;
          border: none;
          background: transparent;
          cursor: pointer;
        }

        .breakpoint-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          border: 1px solid var(--border-color, #ced4da);
          background: transparent;
          transition: all 0.2s ease;
        }

        .breakpoint-dot.active {
          background: var(--color-warning, #ffc107);
          border-color: var(--color-warning, #ffc107);
        }

        .event-info {
          display: flex;
          align-items: center;
          gap: 8px;
          flex: 1;
          min-width: 0;
        }

        .event-sequence {
          font-size: 11px;
          color: var(--text-secondary, #6c757d);
          min-width: 20px;
        }

        .event-type {
          font-size: 12px;
          font-weight: 500;
          color: var(--text-primary, #1a1a1a);
          min-width: 60px;
        }

        .event-target {
          font-size: 11px;
          color: var(--text-secondary, #6c757d);
          font-family: monospace;
          flex: 1;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .events-overflow {
          padding: 8px;
          text-align: center;
          font-size: 12px;
          color: var(--text-secondary, #6c757d);
          font-style: italic;
        }

        h3 {
          margin: 0;
          font-size: 14px;
          font-weight: 600;
          color: var(--text-primary, #1a1a1a);
        }
      `}</style>
    </div>
  );
}