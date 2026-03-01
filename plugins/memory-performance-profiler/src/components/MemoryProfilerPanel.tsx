import React, { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Activity,
  Zap
} from 'lucide-react';
import {
  Tabs,
  DataTable,
  ProgressBar,
  Footer,
  Alert,
  Badge,
  StatusIndicator,
  EmptyState,
  ScrollableContainer,
  ConfigMenu,
  ThemeProvider,
  type ConfigMenuItem
} from '@sucoza/shared-components';
import '@sucoza/shared-components/dist/styles/theme.css';
import { useMemoryProfilerDevTools } from '../core/devtools-client';
import type { ComponentMemoryInfo, MemoryLeak, MemoryOptimizationSuggestion } from '../types';

interface MemoryProfilerPanelProps {
  theme?: 'light' | 'dark' | 'auto'
}

function MemoryProfilerPanelInner() {
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
    if (isSupported) {
      start();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSupported]);

  if (!isSupported) {
    return (
      <div style={{ 
        height: '100%', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        padding: '32px'
      }}>
        <div style={{
          maxWidth: '500px',
          textAlign: 'center',
          padding: '32px',
          background: "var(--dt-bg-secondary)",
          borderRadius: '12px',
          border: '1px solid var(--dt-border-primary)'
        }}>
          <AlertTriangle size={48} style={{ 
            color: "var(--dt-status-warning)",
            marginBottom: '16px'
          }} />
          <h3 style={{
            fontSize: '24px',
            fontWeight: 600,
            marginBottom: '12px',
            color: "var(--dt-text-primary)"
          }}>Memory Profiler Not Supported</h3>
          <p style={{
            fontSize: '14px',
            color: "var(--dt-text-secondary)",
            marginBottom: '24px'
          }}>This browser doesn&apos;t support the required APIs for memory profiling.</p>
          <div style={{
            textAlign: 'left',
            background: "var(--dt-bg-primary)",
            borderRadius: '8px',
            padding: '20px',
            border: "1px solid var(--dt-border-primary)"
          }}>
            <h4 style={{
              fontSize: '16px',
              fontWeight: 600,
              marginBottom: '16px',
              color: "var(--dt-text-primary)"
            }}>Required Features:</h4>
            <ul style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
              marginBottom: '20px'
            }}>
              <li style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 0',
                fontSize: '14px',
                color: supportInfo.memoryAPI ? "var(--dt-status-success)" : "var(--dt-status-error)"
              }}>
                {supportInfo.memoryAPI ? <CheckCircle size={18} /> : <XCircle size={18} />}
                Performance Memory API
              </li>
              <li style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 0',
                fontSize: '14px',
                color: supportInfo.performanceObserver ? "var(--dt-status-success)" : "var(--dt-status-error)"
              }}>
                {supportInfo.performanceObserver ? <CheckCircle size={18} /> : <XCircle size={18} />}
                Performance Observer API
              </li>
              <li style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 0',
                fontSize: '14px',
                color: supportInfo.reactDevTools ? "var(--dt-status-success)" : "var(--dt-text-secondary)"
              }}>
                {supportInfo.reactDevTools ? <CheckCircle size={18} /> : <XCircle size={18} />}
                React DevTools Hook (optional)
              </li>
            </ul>
            <p style={{
              fontSize: '13px',
              color: "var(--dt-text-secondary)",
              background: "var(--dt-bg-secondary)",
              padding: '12px',
              borderRadius: '4px',
              margin: 0
            }}>
              For best results, use Chrome with: <br />
              <code style={{
                fontFamily: 'monospace',
                fontSize: '12px',
                background: "var(--dt-bg-tertiary)",
                padding: '2px 4px',
                borderRadius: '3px'
              }}>--enable-precise-memory-info --js-flags=&quot;--expose-gc&quot;</code>
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

  const configMenuItems: ConfigMenuItem[] = [
    {
      id: 'start-stop',
      label: isRunning ? 'Stop Profiling' : 'Start Profiling',
      icon: isRunning ? '⏸️' : '▶️',
      onClick: isRunning ? stop : () => start(),
      shortcut: 'Ctrl+R'
    },
    {
      id: 'force-gc',
      label: 'Force Garbage Collection',
      icon: '🗑️',
      onClick: forceGC
    },
    {
      id: 'snapshot',
      label: 'Take Memory Snapshot',
      icon: '📸',
      onClick: handleSnapshot,
      separator: true
    },
    {
      id: 'reset',
      label: 'Reset Profiler Data',
      icon: '🔄',
      onClick: reset,
      shortcut: 'Ctrl+K'
    },
    {
      id: 'export',
      label: 'Export Profiler Data',
      icon: '💾',
      onClick: handleExport,
      shortcut: 'Ctrl+E'
    },
    {
      id: 'settings',
      label: 'Profiler Settings',
      icon: '⚙️',
      onClick: () => console.log('Settings clicked'),
      separator: true
    }
  ];

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      {/* Header with status */}
      <div style={{ 
        padding: '12px 16px', 
        borderBottom: "1px solid var(--dt-border-primary)",
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: "var(--dt-bg-secondary)"
      }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: "var(--dt-text-primary)" }}>
            Memory & Performance Profiler
          </h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <StatusIndicator
            status={isRunning ? 'active' : 'inactive'}
            label={isRunning ? 'Profiling' : 'Stopped'}
            size="sm"
          />
          {currentMemory && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
              <span>{formatBytes(currentMemory.heapUsed)} / {formatBytes(currentMemory.heapLimit)}</span>
              <ProgressBar
                value={(currentMemory.heapUsed / currentMemory.heapLimit) * 100}
                size="sm"
                style={{ width: '80px' }}
              />
            </div>
          )}
        </div>
      </div>

      {/* ConfigMenu Overlay */}
      <div style={{ position: 'absolute', top: '12px', right: '12px', zIndex: 10 }}>
        <ConfigMenu items={configMenuItems} size="sm" />
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div style={{ padding: '8px' }}>
          {alerts.slice(0, 3).map(alert => (
            <Alert
              key={alert.id}
              type={alert.severity as 'info' | 'warning' | 'error'}
              variant="default"
              title={alert.message}
              closable={true}
              onClose={() => dismissAlert(alert.id)}
              style={{ marginBottom: '4px' }}
            />
          ))}
        </div>
      )}

      <Tabs
        tabs={[
          { 
            id: 'overview', 
            label: 'Overview',
            content: null 
          },
          { 
            id: 'components', 
            label: 'Components',
            badge: components.length > 0 ? <Badge variant="default" size="xs">{components.length}</Badge> : undefined
          },
          { 
            id: 'leaks', 
            label: 'Leaks',
            badge: leaks.length > 0 ? <Badge variant="error" size="xs">{leaks.length}</Badge> : undefined
          },
          { 
            id: 'suggestions', 
            label: 'Suggestions',
            badge: suggestions.length > 0 ? <Badge variant="warning" size="xs">{suggestions.length}</Badge> : undefined
          },
          { 
            id: 'timeline', 
            label: 'Timeline',
            content: null 
          }
        ]}
        activeTab={activeTab}
        onTabChange={(tabId) => setActiveTab(tabId as any)}
        variant="underline"
        size="md"
      />

      <ScrollableContainer
        style={{ flex: 1 }}
        autoHideScrollbar={true}
      >
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
      </ScrollableContainer>

      <Footer
        stats={[
          {
            id: 'components',
            label: 'Components',
            value: components.length,
            tooltip: `${components.length} components tracked`
          },
          {
            id: 'memory-usage',
            label: 'Memory',
            value: currentMemory ? formatBytes(currentMemory.heapUsed) : 'N/A',
            tooltip: currentMemory ? `${formatBytes(currentMemory.heapUsed)} / ${formatBytes(currentMemory.heapLimit)} used` : 'No memory data'
          },
          {
            id: 'leaks',
            label: 'Leaks',
            value: leaks.length,
            variant: leaks.length > 0 ? 'error' : 'default',
            tooltip: `${leaks.length} memory leaks detected`
          },
          {
            id: 'suggestions',
            label: 'Suggestions',
            value: suggestions.length,
            variant: suggestions.length > 0 ? 'warning' : 'default',
            tooltip: `${suggestions.length} optimization suggestions`
          }
        ]}
        status={{
          type: isRunning ? 'connected' : 'disconnected',
          message: isRunning ? 'Profiling active' : 'Profiler stopped'
        }}
        metrics={currentMemory ? {
          memory: (currentMemory.heapUsed / currentMemory.heapLimit) * 100,
          ...(performance && { cpu: performance.memoryPressure === 'high' ? 70 : performance.memoryPressure === 'medium' ? 50 : 30 })
        } : undefined}
        size="sm"
        variant="compact"
      />
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

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp size={16} style={{ color: "var(--dt-status-error)" }} />;
      case 'down': return <TrendingDown size={16} style={{ color: "var(--dt-status-success)" }} />;
      default: return <Minus size={16} style={{ color: "var(--dt-text-tertiary)" }} />;
    }
  };

  const sortedComponents = [...components].sort((a, b) => b.totalMemory - a.totalMemory);

  const columns = [
    {
      key: 'name',
      header: 'Component',
      flex: 2,
      render: (_value: any, component: ComponentMemoryInfo) => (
        <span style={{ fontWeight: '500' }}>{component.name}</span>
      )
    },
    {
      key: 'instanceCount',
      header: 'Instances',
      width: 100,
      align: 'center' as const,
      render: (_value: any, component: ComponentMemoryInfo) => (
        <Badge variant="default" size="xs">{component.instanceCount}</Badge>
      )
    },
    {
      key: 'totalMemory',
      header: 'Total Memory',
      width: 120,
      align: 'right' as const,
      render: (_value: any, component: ComponentMemoryInfo) => (
        <span style={{ fontFamily: 'monospace' }}>{formatBytes(component.totalMemory)}</span>
      )
    },
    {
      key: 'averageMemoryPerInstance',
      header: 'Avg/Instance',
      width: 120,
      align: 'right' as const,
      render: (_value: any, component: ComponentMemoryInfo) => (
        <span style={{ fontFamily: 'monospace' }}>{formatBytes(component.averageMemoryPerInstance)}</span>
      )
    },
    {
      key: 'trend',
      header: 'Trend',
      width: 80,
      align: 'center' as const,
      render: (_value: any, component: ComponentMemoryInfo) => getTrendIcon(component.trend)
    },
    {
      key: 'status',
      header: 'Status',
      width: 100,
      render: (_value: any, component: ComponentMemoryInfo) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {component.suspiciousGrowth ? (
            <>
              <AlertTriangle size={16} style={{ color: "var(--dt-status-error)" }} />
              <Badge variant="warning" size="xs">Growing</Badge>
            </>
          ) : (
            <>
              <CheckCircle size={16} style={{ color: "var(--dt-status-success)" }} />
              <Badge variant="success" size="xs">Normal</Badge>
            </>
          )}
        </div>
      )
    }
  ];

  if (sortedComponents.length === 0) {
    return (
      <EmptyState
        title="No Component Data"
        description="Start profiling to see component memory usage"
        icon="🧩"
      />
    );
  }

  return (
    <DataTable
      data={sortedComponents}
      columns={columns}
      compact
      striped
      hover
      stickyHeader
    />
  );
}

function LeaksTab({ leaks }: { leaks: MemoryLeak[] }) {
  const getSeverityVariant = (severity: string) => {
    switch (severity) {
      case 'critical': return 'error';
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'info';
      default: return 'info';
    }
  };

  const sortedLeaks = [...leaks].sort((a, b) => {
    const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
    return (severityOrder as any)[b.severity] - (severityOrder as any)[a.severity];
  });

  if (sortedLeaks.length === 0) {
    return (
      <EmptyState
        title="No Memory Leaks Detected"
        description="Great! No memory leaks have been detected in your application."
        icon={<CheckCircle size={48} style={{ color: "var(--dt-status-success)" }} />}
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {sortedLeaks.map(leak => (
        <div key={leak.id} style={{ 
          border: "1px solid var(--dt-border-primary)", 
          borderRadius: '8px', 
          padding: '16px',
          background: "var(--dt-bg-primary)"
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'flex-start',
            marginBottom: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={20} style={{ color: "var(--dt-status-error)" }} />
              <div>
                <div style={{ fontWeight: '600', fontSize: '14px' }}>
                  {leak.component || 'Unknown Component'}
                </div>
                <div style={{ fontSize: '12px', color: "var(--dt-text-tertiary)" }}>
                  {leak.type}
                </div>
              </div>
            </div>
            <Badge variant={getSeverityVariant(leak.severity) as any} size="sm">
              {leak.severity}
            </Badge>
          </div>
          
          <div style={{ marginBottom: '12px', fontSize: '14px', color: "var(--dt-text-primary)" }}>
            {leak.description}
          </div>

          <div style={{ 
            display: 'flex', 
            gap: '16px', 
            marginBottom: '12px',
            fontSize: '12px',
            color: "var(--dt-text-tertiary)"
          }}>
            <span>Impact: ~{(leak.estimatedMemoryImpact / 1024).toFixed(1)} KB</span>
            <span>Detected: {new Date(leak.detectedAt).toLocaleTimeString()}</span>
          </div>

          <div style={{ 
            padding: '12px',
            background: "var(--dt-bg-secondary)",
            borderRadius: '6px',
            marginBottom: '12px',
            fontSize: '13px'
          }}>
            <strong>Recommendation:</strong> {leak.recommendation}
          </div>

          {leak.autoFixAvailable && (
            <button style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 12px',
              background: "var(--dt-border-focus)",
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: '500'
            }}>
              <Zap size={14} />
              Auto Fix Available
            </button>
          )}
        </div>
      ))}
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

export function MemoryProfilerPanel(props: MemoryProfilerPanelProps = {}) {
  const { theme = "auto" } = props

  const resolvedTheme = useMemo(() => {
    if (theme === "auto") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
    }
    return theme
  }, [theme])

  return (
    <ThemeProvider defaultTheme={resolvedTheme}>
      <MemoryProfilerPanelInner />
    </ThemeProvider>
  )
}
