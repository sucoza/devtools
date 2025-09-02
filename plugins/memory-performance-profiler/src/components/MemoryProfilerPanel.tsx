import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  Square, 
  Camera, 
  Download, 
  Trash2, 
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Activity,
  Zap
} from 'lucide-react';
import { useMemoryProfilerDevTools } from '../core/devtools-client';
import type { ComponentMemoryInfo, MemoryLeak, MemoryOptimizationSuggestion } from '../types';

export function MemoryProfilerPanel() {
  const {
    isRunning,
    currentMemory,
    components,
    hooks: _hooks,
    leaks,
    performance,
    suggestions,
    alerts,
    timeline,
    isSupported,
    supportInfo,
    start,
    stop,
    reset,
    createSnapshot,
    forceGC,
    exportData,
    dismissAlert,
    dismissSuggestion
  } = useMemoryProfilerDevTools();

  const [activeTab, setActiveTab] = useState<'overview' | 'components' | 'leaks' | 'suggestions' | 'timeline'>('overview');
  const [snapshotName, setSnapshotName] = useState('');

  // Auto-start profiling when component mounts (if supported)
  useEffect(() => {
    if (isSupported && !isRunning) {
      start();
    }
  }, [isSupported, isRunning, start]);

  if (!isSupported) {
    return (
      <div className="memory-profiler-panel">
        <div className="memory-profiler-unsupported">
          <AlertTriangle className="icon-warning" />
          <h3>Memory Profiler Not Supported</h3>
          <p>This browser doesn&apos;t support the required APIs for memory profiling.</p>
          <div className="support-info">
            <h4>Required Features:</h4>
            <ul>
              <li className={supportInfo.memoryAPI ? 'supported' : 'not-supported'}>
                {supportInfo.memoryAPI ? <CheckCircle /> : <XCircle />}
                Performance Memory API
              </li>
              <li className={supportInfo.performanceObserver ? 'supported' : 'not-supported'}>
                {supportInfo.performanceObserver ? <CheckCircle /> : <XCircle />}
                Performance Observer API
              </li>
              <li className={supportInfo.reactDevTools ? 'supported' : 'not-supported'}>
                {supportInfo.reactDevTools ? <CheckCircle /> : <XCircle />}
                React DevTools Hook (optional)
              </li>
            </ul>
            <p className="help-text">
              For best results, use Chrome with: <br />
              <code>--enable-precise-memory-info --js-flags=&quot;--expose-gc&quot;</code>
            </p>
          </div>
        </div>
      </div>
    );
  }

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const _getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="trend-up" />;
      case 'down': return <TrendingDown className="trend-down" />;
      default: return <Minus className="trend-stable" />;
    }
  };

  const _getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'severity-critical';
      case 'high': return 'severity-high';
      case 'medium': return 'severity-medium';
      case 'low': return 'severity-low';
      default: return 'severity-info';
    }
  };

  const handleSnapshot = () => {
    const name = snapshotName.trim() || `Snapshot ${new Date().toLocaleTimeString()}`;
    createSnapshot(name);
    setSnapshotName('');
  };

  const handleExport = () => {
    const data = exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `memory-profiler-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="memory-profiler-panel">
      {/* Header with controls */}
      <div className="memory-profiler-header">
        <div className="profiler-controls">
          {isRunning ? (
            <button onClick={stop} className="control-btn stop">
              <Pause />
              Stop
            </button>
          ) : (
            <button onClick={() => start()} className="control-btn start">
              <Play />
              Start
            </button>
          )}
          
          <button onClick={reset} className="control-btn reset">
            <Square />
            Reset
          </button>

          <button onClick={forceGC} className="control-btn gc" title="Force Garbage Collection">
            <Trash2 />
            GC
          </button>

          <div className="snapshot-controls">
            <input 
              type="text" 
              placeholder="Snapshot name..." 
              value={snapshotName}
              onChange={(e) => setSnapshotName(e.target.value)}
              className="snapshot-input"
            />
            <button onClick={handleSnapshot} className="control-btn snapshot">
              <Camera />
              Snapshot
            </button>
          </div>

          <button onClick={handleExport} className="control-btn export">
            <Download />
            Export
          </button>
        </div>

        <div className="memory-status">
          <div className="status-indicator">
            <Activity className={`status-icon ${isRunning ? 'running' : 'stopped'}`} />
            <span>{isRunning ? 'Profiling' : 'Stopped'}</span>
          </div>
          
          {currentMemory && (
            <div className="memory-display">
              <span className="memory-usage">
                {formatBytes(currentMemory.heapUsed)} / {formatBytes(currentMemory.heapLimit)}
              </span>
              <div className="memory-bar">
                <div 
                  className="memory-bar-fill" 
                  style={{ width: `${(currentMemory.heapUsed / currentMemory.heapLimit) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="memory-alerts">
          {alerts.slice(0, 3).map(alert => (
            <div key={alert.id} className={`alert alert-${alert.severity}`}>
              <AlertTriangle />
              <span>{alert.message}</span>
              <button onClick={() => dismissAlert(alert.id)} className="alert-dismiss">
                <XCircle />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Tab Navigation */}
      <div className="tab-navigation">
        {[
          { id: 'overview', label: 'Overview', count: null },
          { id: 'components', label: 'Components', count: components.length },
          { id: 'leaks', label: 'Leaks', count: leaks.length },
          { id: 'suggestions', label: 'Suggestions', count: suggestions.length },
          { id: 'timeline', label: 'Timeline', count: null }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`tab ${activeTab === tab.id ? 'active' : ''}`}
          >
            {tab.label}
            {tab.count !== null && tab.count > 0 && (
              <span className="tab-badge">{tab.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'overview' && (
          <OverviewTab 
            currentMemory={currentMemory}
            performance={performance}
            components={components}
            leaks={leaks}
            suggestions={suggestions}
          />
        )}

        {activeTab === 'components' && (
          <ComponentsTab components={components} />
        )}

        {activeTab === 'leaks' && (
          <LeaksTab leaks={leaks} />
        )}

        {activeTab === 'suggestions' && (
          <SuggestionsTab suggestions={suggestions} onDismiss={dismissSuggestion} />
        )}

        {activeTab === 'timeline' && (
          <TimelineTab timeline={timeline} />
        )}
      </div>
    </div>
  );
}

// Individual tab components
function OverviewTab({ currentMemory, performance, components, leaks, suggestions }: any) {
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="overview-tab">
      <div className="overview-grid">
        <div className="overview-card">
          <h3>Memory Usage</h3>
          {currentMemory ? (
            <div className="memory-stats">
              <div className="stat">
                <label>Heap Used:</label>
                <span>{formatBytes(currentMemory.heapUsed)}</span>
              </div>
              <div className="stat">
                <label>Heap Size:</label>
                <span>{formatBytes(currentMemory.heapSize)}</span>
              </div>
              <div className="stat">
                <label>Heap Limit:</label>
                <span>{formatBytes(currentMemory.heapLimit)}</span>
              </div>
            </div>
          ) : (
            <p>No memory data available</p>
          )}
        </div>

        <div className="overview-card">
          <h3>Components</h3>
          <div className="component-summary">
            <div className="stat">
              <label>Total Components:</label>
              <span>{components.length}</span>
            </div>
            <div className="stat">
              <label>Memory Intensive:</label>
              <span>{components.filter((c: ComponentMemoryInfo) => c.totalMemory > 100000).length}</span>
            </div>
          </div>
        </div>

        <div className="overview-card">
          <h3>Issues</h3>
          <div className="issues-summary">
            <div className="stat">
              <label>Memory Leaks:</label>
              <span className={leaks.length > 0 ? 'warning' : ''}>{leaks.length}</span>
            </div>
            <div className="stat">
              <label>Suggestions:</label>
              <span>{suggestions.length}</span>
            </div>
          </div>
        </div>

        {performance && (
          <div className="overview-card">
            <h3>Performance</h3>
            <div className="performance-stats">
              <div className="stat">
                <label>FCP:</label>
                <span>{performance.fcp.toFixed(2)}ms</span>
              </div>
              <div className="stat">
                <label>LCP:</label>
                <span>{performance.lcp.toFixed(2)}ms</span>
              </div>
              <div className="stat">
                <label>Memory Pressure:</label>
                <span className={`pressure-${performance.memoryPressure}`}>
                  {performance.memoryPressure}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ComponentsTab({ components }: { components: ComponentMemoryInfo[] }) {
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const _getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="trend-up" />;
      case 'down': return <TrendingDown className="trend-down" />;
      default: return <Minus className="trend-stable" />;
    }
  };

  const sortedComponents = [...components].sort((a, b) => b.totalMemory - a.totalMemory);

  return (
    <div className="components-tab">
      <div className="components-table">
        <div className="table-header">
          <span>Component</span>
          <span>Instances</span>
          <span>Total Memory</span>
          <span>Avg/Instance</span>
          <span>Trend</span>
          <span>Status</span>
        </div>
        
        {sortedComponents.map((component, _index) => (
          <div key={component.name} className="table-row">
            <span className="component-name">{component.name}</span>
            <span>{component.instanceCount}</span>
            <span>{formatBytes(component.totalMemory)}</span>
            <span>{formatBytes(component.averageMemoryPerInstance)}</span>
            <span className="trend-cell">
              {_getTrendIcon(component.trend)}
            </span>
            <span className={`status ${component.suspiciousGrowth ? 'warning' : 'normal'}`}>
              {component.suspiciousGrowth ? (
                <>
                  <AlertTriangle />
                  Growing
                </>
              ) : (
                <>
                  <CheckCircle />
                  Normal
                </>
              )}
            </span>
          </div>
        ))}

        {sortedComponents.length === 0 && (
          <div className="empty-state">
            <p>No component data available. Start profiling to see component memory usage.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function LeaksTab({ leaks }: { leaks: MemoryLeak[] }) {
  const _getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'severity-critical';
      case 'high': return 'severity-high';
      case 'medium': return 'severity-medium';
      case 'low': return 'severity-low';
      default: return 'severity-info';
    }
  };

  const sortedLeaks = [...leaks].sort((a, b) => {
    const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
    return (severityOrder as any)[b.severity] - (severityOrder as any)[a.severity];
  });

  return (
    <div className="leaks-tab">
      {sortedLeaks.length > 0 ? (
        <div className="leaks-list">
          {sortedLeaks.map(leak => (
            <div key={leak.id} className={`leak-card ${_getSeverityColor(leak.severity)}`}>
              <div className="leak-header">
                <div className="leak-title">
                  <AlertTriangle />
                  <span>{leak.component || 'Unknown Component'}</span>
                  <span className="leak-type">{leak.type}</span>
                </div>
                <span className={`severity-badge ${_getSeverityColor(leak.severity)}`}>
                  {leak.severity}
                </span>
              </div>
              
              <div className="leak-description">
                {leak.description}
              </div>

              <div className="leak-details">
                <span>Impact: ~{(leak.estimatedMemoryImpact / 1024).toFixed(1)} KB</span>
                <span>Detected: {new Date(leak.detectedAt).toLocaleTimeString()}</span>
              </div>

              <div className="leak-recommendation">
                <strong>Recommendation:</strong> {leak.recommendation}
              </div>

              {leak.autoFixAvailable && (
                <button className="auto-fix-btn">
                  <Zap />
                  Auto Fix Available
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <CheckCircle />
          <h3>No Memory Leaks Detected</h3>
          <p>Great! No memory leaks have been detected in your application.</p>
        </div>
      )}
    </div>
  );
}

function SuggestionsTab({ 
  suggestions, 
  onDismiss 
}: { 
  suggestions: MemoryOptimizationSuggestion[]; 
  onDismiss: (id: string) => void;
}) {
  return (
    <div className="suggestions-tab">
      {suggestions.length > 0 ? (
        <div className="suggestions-list">
          {suggestions.map(suggestion => (
            <div key={suggestion.id} className="suggestion-card">
              <div className="suggestion-header">
                <div className="suggestion-title">
                  <span className="suggestion-type">{suggestion.type}</span>
                  <span>{suggestion.component}</span>
                </div>
                <div className="suggestion-impact">
                  <span className="savings">~{suggestion.projectedSavingsMB.toFixed(1)} MB</span>
                  <span className={`effort effort-${suggestion.effort}`}>{suggestion.effort} effort</span>
                </div>
              </div>

              <div className="suggestion-description">
                {suggestion.description}
              </div>

              <div className="suggestion-impact-text">
                <strong>Impact:</strong> {suggestion.impact}
              </div>

              {suggestion.codeExample && (
                <div className="suggestion-code">
                  <pre><code>{suggestion.codeExample}</code></pre>
                </div>
              )}

              <div className="suggestion-actions">
                {suggestion.oneClickFix ? (
                  <button className="fix-btn primary">
                    <Zap />
                    Apply Fix
                  </button>
                ) : (
                  <button className="fix-btn secondary">
                    View Details
                  </button>
                )}
                
                <button 
                  onClick={() => onDismiss(suggestion.id)} 
                  className="dismiss-btn"
                >
                  <XCircle />
                  Dismiss
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <CheckCircle />
          <h3>No Optimization Suggestions</h3>
          <p>Your application appears to be well-optimized for memory usage.</p>
        </div>
      )}
    </div>
  );
}

function TimelineTab({ timeline }: any) {
  return (
    <div className="timeline-tab">
      {timeline ? (
        <div className="timeline-content">
          <div className="timeline-header">
            <h3>Memory Timeline</h3>
            <div className="timeline-stats">
              <span>Duration: {((timeline.endTime - timeline.startTime) / 1000 / 60).toFixed(1)} min</span>
              <span>Measurements: {timeline.measurements.length}</span>
              <span>Events: {timeline.events.length}</span>
            </div>
          </div>

          <div className="timeline-chart">
            {/* This would contain a memory usage chart visualization */}
            <p>Timeline visualization would be rendered here</p>
            <p>Showing memory usage over time with events marked</p>
          </div>

          <div className="timeline-events">
            <h4>Recent Events</h4>
            {timeline.events.slice(-10).map((event: any, index: number) => (
              <div key={index} className="timeline-event">
                <span className="event-time">
                  {new Date(event.timestamp).toLocaleTimeString()}
                </span>
                <span className={`event-type event-${event.type}`}>
                  {event.type}
                </span>
                <span className="event-description">
                  {event.description}
                </span>
                {event.memoryImpact && (
                  <span className="event-impact">
                    {event.memoryImpact > 0 ? '+' : ''}{(event.memoryImpact / 1024).toFixed(1)} KB
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="empty-state">
          <Activity />
          <h3>No Timeline Data</h3>
          <p>Start profiling to see memory usage timeline.</p>
        </div>
      )}
    </div>
  );
}