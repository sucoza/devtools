import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { loggingEventClient } from './loggingEventClient';
import type { LogEntry, LogLevel, LoggerConfig, LogMetrics } from './loggingEventClient';
import { Footer, type FooterStat } from '@sucoza/shared-components';

const LOG_COLORS: Record<LogLevel, string> = {
  trace: '#7f8c8d',
  debug: '#95a5a6',
  info: '#3498db',
  warn: '#f39c12',
  error: '#e74c3c',
  fatal: '#c0392b',
};

const LOG_BG_COLORS: Record<LogLevel, string> = {
  trace: 'transparent',
  debug: 'transparent',
  info: 'transparent',
  warn: 'rgba(243, 156, 18, 0.1)',
  error: 'rgba(231, 76, 60, 0.1)',
  fatal: 'rgba(192, 57, 43, 0.2)',
};

// UI State persistence helpers
const LOGGER_UI_STATE_KEY = 'logger-devtools-ui-state';

interface LoggerUIState {
  searchQuery: string;
  levelFilter: LogLevel | 'all';
  categoryFilter: string;
  sourceFilter: string;
  autoScroll: boolean;
  showMetrics: boolean;
  selectedLogId: string | null;
  showSidebar: boolean;
  sidebarWidth: number;
  chartExpanded: boolean;
}

const saveUIState = (state: LoggerUIState) => {
  try {
    localStorage.setItem(LOGGER_UI_STATE_KEY, JSON.stringify(state));
  } catch {
    // Ignore localStorage errors
  }
};

const loadUIState = (): Partial<LoggerUIState> => {
  try {
    const saved = localStorage.getItem(LOGGER_UI_STATE_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
};

export function LoggerDevToolsPanel() {
  // Load saved UI state
  const savedState = loadUIState();
  
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const logsRef = useRef<LogEntry[]>([]);
  
  // Keep ref in sync with state
  useEffect(() => {
    logsRef.current = logs;
  }, [logs]);
  const [config, setConfig] = useState<LoggerConfig>({
    enabled: true,
    level: 'info',
    categories: {},
    output: { console: true, devtools: true },
    maxLogs: 10000,
    batchSize: 50,
    flushInterval: 100,
    intercept: {
      enabled: false,
      console: true,
      preserveOriginal: true,
      includeTrace: false,
    },
  });
  const [metrics, setMetrics] = useState<LogMetrics>({
    totalLogs: 0,
    logsPerSecond: 0,
    errorRate: 0,
    warningRate: 0,
    logsByLevel: {
      trace: 0,
      debug: 0,
      info: 0,
      warn: 0,
      error: 0,
      fatal: 0,
    },
    logsByCategory: {},
    averageLogSize: 0,
    peakLogsPerSecond: 0,
    lastLogTime: Date.now(),
  });

  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
  const [searchQuery, setSearchQuery] = useState(savedState.searchQuery || '');
  const [levelFilter, setLevelFilter] = useState<LogLevel | 'all'>(savedState.levelFilter || 'all');
  const [categoryFilter, setCategoryFilter] = useState<string>(savedState.categoryFilter || 'all');
  const [sourceFilter, setSourceFilter] = useState<string>(savedState.sourceFilter || 'all');
  const [autoScroll, setAutoScroll] = useState(savedState.autoScroll ?? true);
  const [showMetrics, setShowMetrics] = useState(savedState.showMetrics ?? true);
  const [showSidebar, setShowSidebar] = useState(savedState.showSidebar ?? true);
  const [sidebarWidth, setSidebarWidth] = useState(savedState.sidebarWidth || 250);
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());
  const [chartHover, setChartHover] = useState<{ x: number; y: number; data: any } | null>(null);
  const [chartExpanded, setChartExpanded] = useState(savedState.chartExpanded ?? true);

  // Subscribe to events
  useEffect(() => {
    const unsubscribeLog = loggingEventClient.on('log-entry', (event: any) => {
      const entry = event.payload as LogEntry;
      setLogs(prev => {
        // Check if this log already exists to avoid duplicates
        if (prev.some(log => log.id === entry.id)) {
          return prev;
        }
        const newLogs = [...prev, entry];
        return newLogs.slice(-config.maxLogs);
      });
    });

    const unsubscribeBatch = loggingEventClient.on('log-batch', (event: any) => {
      const entries = event.payload as LogEntry[];
      setLogs(prev => {
        // Deduplicate by combining existing and new logs
        const logsMap = new Map<string, LogEntry>();
        prev.forEach(log => logsMap.set(log.id, log));
        entries.forEach(log => logsMap.set(log.id, log));
        const newLogs = Array.from(logsMap.values());
        return newLogs.slice(-config.maxLogs);
      });
    });

    const unsubscribeConfig = loggingEventClient.on('config-response', (event: any) => {
      setConfig(event.payload || event);
    });

    const unsubscribeLogs = loggingEventClient.on('logs-response', (event: any) => {
      const logsData = event.payload || event;
      
      // Ensure we have an array
      if (Array.isArray(logsData)) {
        // Deduplicate logs by ID before setting
        const uniqueLogs = Array.from(
          new Map<string, LogEntry>(logsData.map((log: LogEntry) => [log.id, log])).values()
        );
        setLogs(uniqueLogs);
      } else if (logsData && typeof logsData === 'object') {
        // If it's an object, check if it has logs property
        if ('logs' in logsData && Array.isArray(logsData.logs)) {
          const uniqueLogs = Array.from(
            new Map<string, LogEntry>(logsData.logs.map((log: LogEntry) => [log.id, log])).values()
          );
          setLogs(uniqueLogs);
        }
      }
    });

    const unsubscribeMetrics = loggingEventClient.on('metrics-update', (event: any) => {
      setMetrics(event.payload);
    });

    const unsubscribeClear = loggingEventClient.on('clear-logs', () => {
      setLogs([]);
    });

    // Request initial config and existing logs
    loggingEventClient.emit('config-request', undefined);
    loggingEventClient.emit('logs-request', undefined);
    
    // Also request logs after a small delay in case there's a timing issue
    setTimeout(() => {
      loggingEventClient.emit('logs-request', undefined);
    }, 50);

    return () => {
      unsubscribeLog();
      unsubscribeBatch();
      unsubscribeConfig();
      unsubscribeLogs();
      unsubscribeMetrics();
      unsubscribeClear();
    };
  }, [config.maxLogs]);
  
  // Additional effect to request logs when component becomes visible/active
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loggingEventClient.emit('logs-request', undefined);
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Also listen for focus events
    const handleFocus = () => {
      loggingEventClient.emit('logs-request', undefined);
    };
    
    window.addEventListener('focus', handleFocus);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // Auto-scroll effect
  useEffect(() => {
    if (autoScroll) {
      const container = document.getElementById('log-container');
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }
  }, [logs, autoScroll]);

  // Restore selected log after logs are loaded
  useEffect(() => {
    if (savedState.selectedLogId && logs.length > 0 && !selectedLog) {
      const logToRestore = logs.find(log => log.id === savedState.selectedLogId);
      if (logToRestore) {
        setSelectedLog(logToRestore);
      }
    }
  }, [logs, savedState.selectedLogId, selectedLog]);

  // Save UI state whenever it changes
  useEffect(() => {
    const currentState: LoggerUIState = {
      searchQuery,
      levelFilter,
      categoryFilter,
      sourceFilter,
      autoScroll,
      showMetrics,
      selectedLogId: selectedLog?.id || null,
      showSidebar,
      sidebarWidth,
      chartExpanded,
    };
    saveUIState(currentState);
  }, [searchQuery, levelFilter, categoryFilter, sourceFilter, autoScroll, showMetrics, selectedLog, showSidebar, sidebarWidth, chartExpanded]);

  // Generate facet data and time series from logs
  const { facetData, timeSeriesData } = useMemo(() => {
    const categories = new Map<string, number>();
    const levels = new Map<LogLevel, number>();
    const tags = new Map<string, number>();
    const sources = new Map<string, number>();

    // Time series aggregation - group by 10-second intervals
    const timeSlots = new Map<number, Record<LogLevel, number>>();
    const now = Date.now();
    const timeWindow = 5 * 60 * 1000; // Last 5 minutes
    const slotDuration = 10 * 1000; // 10 seconds per slot

    // Initialize time slots for the last 5 minutes
    for (let time = now - timeWindow; time <= now; time += slotDuration) {
      const slotKey = Math.floor(time / slotDuration) * slotDuration;
      timeSlots.set(slotKey, {
        trace: 0,
        debug: 0,
        info: 0,
        warn: 0,
        error: 0,
        fatal: 0,
      });
    }

    logs.forEach(log => {
      // Count levels
      levels.set(log.level, (levels.get(log.level) || 0) + 1);
      
      // Count categories
      if (log.category) {
        categories.set(log.category, (categories.get(log.category) || 0) + 1);
      }
      
      // Count tags
      if (log.tags) {
        log.tags.forEach(tag => {
          tags.set(tag, (tags.get(tag) || 0) + 1);
        });
      }
      
      // Count source files
      if (log.source?.file) {
        const fileName = log.source.file.split('/').pop() || log.source.file;
        sources.set(fileName, (sources.get(fileName) || 0) + 1);
      }

      // Add to time series if within window
      if (log.timestamp >= now - timeWindow) {
        const slotKey = Math.floor(log.timestamp / slotDuration) * slotDuration;
        const slot = timeSlots.get(slotKey);
        if (slot) {
          slot[log.level]++;
        }
      }
    });

    // Convert time series to array format for charting
    const timeSeriesArray = Array.from(timeSlots.entries())
      .sort(([a], [b]) => a - b)
      .map(([timestamp, levels]) => ({
        timestamp,
        ...levels,
      }));

    return {
      facetData: {
        categories: Array.from(categories.entries()).sort((a, b) => b[1] - a[1]),
        levels: Array.from(levels.entries()).sort((a, b) => b[1] - a[1]),
        tags: Array.from(tags.entries()).sort((a, b) => b[1] - a[1]),
        sources: Array.from(sources.entries()).sort((a, b) => b[1] - a[1]),
      },
      timeSeriesData: timeSeriesArray,
    };
  }, [logs]);

  // Filter logs
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      // Level filter
      if (levelFilter !== 'all' && log.level !== levelFilter) {
        return false;
      }

      // Category filter
      if (categoryFilter !== 'all' && log.category !== categoryFilter) {
        return false;
      }

      // Source filter
      if (sourceFilter !== 'all') {
        const logFileName = log.source?.file ? log.source.file.split('/').pop() : null;
        if (!logFileName || logFileName !== sourceFilter) {
          return false;
        }
      }

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          log.message.toLowerCase().includes(query) ||
          (log.category && log.category.toLowerCase().includes(query)) ||
          (log.tags && log.tags.some(tag => tag.toLowerCase().includes(query))) ||
          (log.data && JSON.stringify(log.data).toLowerCase().includes(query))
        );
      }

      return true;
    });
  }, [logs, levelFilter, categoryFilter, sourceFilter, searchQuery]);

  // Get unique categories
  const _categories = useMemo(() => {
    const cats = new Set<string>();
    logs.forEach(log => {
      if (log.category) cats.add(log.category);
    });
    return Array.from(cats);
  }, [logs]);

  const toggleLogExpansion = useCallback((logId: string) => {
    setExpandedLogs(prev => {
      const next = new Set(prev);
      if (next.has(logId)) {
        next.delete(logId);
      } else {
        next.add(logId);
      }
      return next;
    });
  }, []);

  const updateConfig = useCallback((updates: Partial<LoggerConfig>) => {
    const newConfig = { ...config, ...updates };
    setConfig(newConfig);
    loggingEventClient.emit('config-update', updates);
  }, [config]);

  const clearLogs = useCallback(() => {
    setLogs([]);
    loggingEventClient.emit('clear-logs', undefined);
  }, []);

  const exportLogs = useCallback((format: 'json' | 'csv' | 'txt') => {
    loggingEventClient.emit('export-logs', { format });
    
    // Create download
    let content = '';
    let mimeType = '';
    let extension = '';

    switch (format) {
      case 'json':
        content = JSON.stringify(filteredLogs, null, 2);
        mimeType = 'application/json';
        extension = 'json';
        break;
      case 'csv': {
        const headers = ['timestamp', 'level', 'category', 'message', 'data'];
        const rows = filteredLogs.map(log => [
          new Date(log.timestamp).toISOString(),
          log.level,
          log.category || '',
          log.message,
          JSON.stringify(log.data || ''),
        ]);
        content = [headers, ...rows].map(row => row.join(',')).join('\n');
        mimeType = 'text/csv';
        extension = 'csv';
        break;
      }
      case 'txt':
        content = filteredLogs.map(log => {
          const time = new Date(log.timestamp).toISOString();
          const cat = log.category ? `[${log.category}]` : '';
          return `[${time}] [${log.level}]${cat} ${log.message}`;
        }).join('\n');
        mimeType = 'text/plain';
        extension = 'txt';
        break;
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logs-${Date.now()}.${extension}`;
    a.click();
    URL.revokeObjectURL(url);
  }, [filteredLogs]);

  // Parse console-style formatting like "%c[Performance] LCP", "color: green", "1060ms (good)"
  const parseConsoleFormatting = (data: any[]): React.ReactNode => {
    if (!Array.isArray(data) || data.length === 0) return null;

    const [format, ...styleArgs] = data;
    
    if (typeof format !== 'string' || !format.includes('%c')) {
      return null; // Not console formatting
    }

    const parts: Array<{ text: string; style?: string }> = [];
    const formatParts = format.split('%c');
    let styleIndex = 0;

    parts.push({ text: formatParts[0] }); // Text before first %c

    for (let i = 1; i < formatParts.length; i++) {
      const style = styleArgs[styleIndex];
      const text = formatParts[i];
      
      if (typeof style === 'string') {
        parts.push({ text, style });
        styleIndex++;
      } else {
        parts.push({ text });
      }
    }

    // Add remaining args that aren't styles
    const remainingArgs = styleArgs.slice(styleIndex);
    if (remainingArgs.length > 0) {
      parts.push({ text: ' ' + remainingArgs.join(' ') });
    }

    return (
      <span>
        {parts.map((part, i) => (
          <span key={i} style={part.style ? parseCSSStyle(part.style) : undefined}>
            {part.text}
          </span>
        ))}
      </span>
    );
  };

  // Parse CSS string like "color: green; font-weight: bold"
  const parseCSSStyle = (cssString: string): React.CSSProperties => {
    const style: React.CSSProperties = {};
    cssString.split(';').forEach(rule => {
      const [prop, value] = rule.split(':').map(s => s.trim());
      if (prop && value) {
        // Convert kebab-case to camelCase
        const camelProp = prop.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
        (style as any)[camelProp] = value;
      }
    });
    return style;
  };

  // Render log message with console formatting support
  const renderLogMessage = (log: LogEntry): React.ReactNode => {
    const { message, data } = log;
    
    // Check if message contains %c and data array has style strings
    if (message.includes('%c') && Array.isArray(data) && data.length > 0) {
      const formatParts = message.split('%c');
      const styleArgs = data.filter(item => typeof item === 'string' && item.includes(':'));
      
      const parts: Array<{ text: string; style?: string }> = [];
      let styleIndex = 0;

      parts.push({ text: formatParts[0] }); // Text before first %c

      for (let i = 1; i < formatParts.length; i++) {
        const style = styleArgs[styleIndex];
        const text = formatParts[i];
        
        if (style) {
          parts.push({ text, style });
          styleIndex++;
        } else {
          parts.push({ text });
        }
      }

      return (
        <span>
          {parts.map((part, i) => (
            <span key={i} style={part.style ? parseCSSStyle(part.style) : undefined}>
              {part.text}
            </span>
          ))}
        </span>
      );
    }

    // Regular message display
    return <span>{message}</span>;
  };

  const renderLogData = (data: any, depth = 0): React.ReactNode => {
    if (data === null || data === undefined) {
      return <span style={{ color: '#7f8c8d' }}>null</span>;
    }

    if (typeof data === 'string') {
      if (data.startsWith('[') && data.endsWith(']')) {
        return <span style={{ color: '#95a5a6', fontStyle: 'italic' }}>{data}</span>;
      }
      return <span style={{ color: '#27ae60' }}>&quot;{data}&quot;</span>;
    }

    if (typeof data === 'number') {
      return <span style={{ color: '#3498db' }}>{data}</span>;
    }

    if (typeof data === 'boolean') {
      return <span style={{ color: '#e67e22' }}>{String(data)}</span>;
    }

    if (Array.isArray(data)) {
      if (depth > 2) {
        return <span style={{ color: '#7f8c8d' }}>[...]</span>;
      }

      // Check if this looks like console formatting
      const consoleFormatted = parseConsoleFormatting(data);
      if (consoleFormatted) {
        return consoleFormatted;
      }

      return (
        <span>
          [
          {data.map((item, i) => (
            <span key={i}>
              {i > 0 && ', '}
              {renderLogData(item, depth + 1)}
            </span>
          ))}
          ]
        </span>
      );
    }

    if (typeof data === 'object') {
      if (depth > 2) {
        return <span style={{ color: '#7f8c8d' }}>{'{ ... }'}</span>;
      }
      const entries = Object.entries(data);
      return (
        <span>
          {'{'}
          {entries.map(([key, value], i) => (
            <span key={key}>
              {i > 0 && ', '}
              <span style={{ color: '#e74c3c' }}>{key}</span>: {renderLogData(value, depth + 1)}
            </span>
          ))}
          {'}'}
        </span>
      );
    }

    return <span>{String(data)}</span>;
  };

  // Render full-width stacked bar chart with hover tooltips
  const renderMetricsChart = () => {
    if (timeSeriesData.length === 0) return null;

    const chartHeight = 60; // Taller for better visibility
    const maxValue = Math.max(...timeSeriesData.map(d => 
      d.trace + d.debug + d.info + d.warn + d.error + d.fatal
    ));
    
    if (maxValue === 0) return null;

    const levelOrder: LogLevel[] = ['fatal', 'error', 'warn', 'info', 'debug', 'trace'];
    
    return (
      <div style={{ 
        width: '100%', // Full width
        position: 'relative',
        minHeight: chartHeight,
        padding: '0 8px' // Small padding for better visual spacing
      }}>
        <div
          style={{ position: 'relative' }}
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const chartWidth = rect.width - 16; // Account for padding
            const dataIndex = Math.floor((x / chartWidth) * timeSeriesData.length);
            
            if (dataIndex >= 0 && dataIndex < timeSeriesData.length) {
              setChartHover({
                x: e.clientX,
                y: e.clientY,
                data: timeSeriesData[dataIndex]
              });
            }
          }}
          onMouseLeave={() => setChartHover(null)}
        >
          <svg 
            width="100%" 
            height={chartHeight} 
            style={{ 
              background: '#1a1a1a', 
              borderRadius: '3px',
              display: 'block'
            }}
            preserveAspectRatio="none"
            viewBox={`0 0 1000 ${chartHeight}`} // Use fixed viewBox width for consistent scaling
          >
            {/* Render bars for each time slot */}
            {timeSeriesData.map((d, i) => {
              const viewBoxWidth = 1000; // Fixed viewBox width
              const x = (i / timeSeriesData.length) * viewBoxWidth;
              const barWidth = Math.max(2, (viewBoxWidth / timeSeriesData.length) - 2); // Bars with small gaps
              const total = levelOrder.reduce((sum, level) => sum + d[level], 0);
              
              if (total === 0) return null;
              
              let currentY = chartHeight;
              
              return (
                <g key={i}>
                  {levelOrder.map(level => {
                    const value = d[level];
                    if (value === 0) return null;
                    
                    const barHeight = (value / maxValue) * chartHeight;
                    const y = currentY - barHeight;
                    
                    const rect = (
                      <rect
                        key={level}
                        x={x}
                        y={y}
                        width={barWidth}
                        height={barHeight}
                        fill={LOG_COLORS[level]}
                        fillOpacity={0.9}
                        stroke="none"
                      />
                    );
                    
                    currentY = y;
                    return rect;
                  })}
                </g>
              );
            })}
            
            {/* Grid lines */}
            {[0.25, 0.5, 0.75].map((ratio, i) => (
              <line
                key={i}
                x1={0}
                y1={chartHeight * ratio}
                x2={1000}
                y2={chartHeight * ratio}
                stroke="#3c3c3c"
                strokeWidth="0.5"
                strokeDasharray="4,4"
              />
            ))}
            
            {/* Max value label */}
            <text
              x={990}
              y={12}
              fill="#969696"
              fontSize="12"
              textAnchor="end"
            >
              {maxValue}
            </text>
          </svg>

          {/* Hover tooltip */}
          {chartHover && (
            <div
              style={{
                position: 'fixed',
                left: Math.min(chartHover.x + 10, window.innerWidth - 200),
                top: 'auto',
                bottom: 'auto',
                background: '#2d2d30',
                border: '1px solid #3c3c3c',
                borderRadius: '4px',
                padding: '6px 8px',
                fontSize: '10px',
                color: '#d4d4d4',
                boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                zIndex: 1000,
                pointerEvents: 'none',
                whiteSpace: 'nowrap'
              }}
            >
              <div style={{ marginBottom: '2px', color: '#969696', fontSize: '9px' }}>
                {new Date(chartHover.data.timestamp).toLocaleTimeString()}
              </div>
              {levelOrder.map(level => {
                const count = chartHover.data[level];
                if (count === 0) return null;
                return (
                  <div key={level} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <div
                      style={{
                        width: '8px',
                        height: '8px',
                        backgroundColor: LOG_COLORS[level],
                        borderRadius: '1px'
                      }}
                    />
                    <span>{count} {level}</span>
                  </div>
                );
              })}
              <div style={{ 
                marginTop: '2px', 
                paddingTop: '2px', 
                borderTop: '1px solid #3c3c3c',
                color: '#969696',
                fontSize: '9px'
              }}>
                Total: {levelOrder.reduce((sum, level) => sum + chartHover.data[level], 0)}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: '#1e1e1e',
      color: '#d4d4d4',
      fontFamily: '"SF Mono", Monaco, Consolas, monospace',
      fontSize: '12px',
    }}>
      {/* Header with controls */}
      <div style={{
        padding: '8px',
        borderBottom: '1px solid #3c3c3c',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        flexWrap: 'wrap',
      }}>
        <h3 style={{ margin: 0, fontSize: '14px', color: '#cccccc' }}>📝 Logger DevTools</h3>
        
        <button
          onClick={() => setShowSidebar(!showSidebar)}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#cccccc',
            padding: '2px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '11px',
          }}
          title="Toggle filters sidebar"
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            style={{
              fill: '#cccccc',
              transform: showSidebar ? 'rotate(0deg)' : 'rotate(-90deg)',
              transition: 'transform 0.1s ease',
            }}
          >
            <path d="M3 4l3 3 3-3z" />
          </svg>
          Filters
        </button>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <label style={{ color: '#969696' }}>Enabled:</label>
          <input
            type="checkbox"
            checked={config.enabled}
            onChange={(e) => updateConfig({ enabled: e.target.checked })}
          />
        </div>

        <input
          type="text"
          placeholder="Search logs..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            padding: '4px 8px',
            background: '#252526',
            border: '1px solid #3c3c3c',
            color: '#cccccc',
            borderRadius: '3px',
            flex: '1',
            minWidth: '150px',
          }}
        />

        <button
          onClick={() => {
            loggingEventClient.emit('logs-request', undefined);
          }}
          style={{
            padding: '4px 8px',
            background: '#2d2d30',
            border: '1px solid #3c3c3c',
            color: '#cccccc',
            borderRadius: '3px',
            cursor: 'pointer',
            marginRight: '8px'
          }}
        >
          🔄 Refresh
        </button>
        <button
          onClick={clearLogs}
          style={{
            padding: '4px 8px',
            background: '#2d2d30',
            border: '1px solid #3c3c3c',
            color: '#cccccc',
            borderRadius: '3px',
            cursor: 'pointer',
          }}
        >
          Clear
        </button>

        <div style={{ display: 'flex', gap: '5px' }}>
          <button
            onClick={() => exportLogs('json')}
            style={{
              padding: '4px 8px',
              background: '#2d2d30',
              border: '1px solid #3c3c3c',
              color: '#cccccc',
              borderRadius: '3px',
              cursor: 'pointer',
              fontSize: '11px',
            }}
          >
            JSON
          </button>
          <button
            onClick={() => exportLogs('csv')}
            style={{
              padding: '4px 8px',
              background: '#2d2d30',
              border: '1px solid #3c3c3c',
              color: '#cccccc',
              borderRadius: '3px',
              cursor: 'pointer',
              fontSize: '11px',
            }}
          >
            CSV
          </button>
          <button
            onClick={() => exportLogs('txt')}
            style={{
              padding: '4px 8px',
              background: '#2d2d30',
              border: '1px solid #3c3c3c',
              color: '#cccccc',
              borderRadius: '3px',
              cursor: 'pointer',
              fontSize: '11px',
            }}
          >
            TXT
          </button>
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#969696' }}>
          <input
            type="checkbox"
            checked={autoScroll}
            onChange={(e) => setAutoScroll(e.target.checked)}
          />
          Auto-scroll
        </label>

        <label style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#969696' }}>
          <input
            type="checkbox"
            checked={showMetrics}
            onChange={(e) => setShowMetrics(e.target.checked)}
          />
          Metrics
        </label>

        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <label style={{ color: '#969696' }}>Console Capture:</label>
          <input
            type="checkbox"
            checked={config.intercept.enabled}
            onChange={(e) => updateConfig({
              intercept: { ...config.intercept, enabled: e.target.checked }
            })}
          />
        </div>
      </div>


      {/* Activity Chart */}
      {showMetrics && (
        <div style={{
          background: '#252526',
          borderBottom: '1px solid #3c3c3c',
        }}>
          {/* Chart Header */}
          <div 
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 12px',
              cursor: 'pointer',
              borderBottom: chartExpanded ? '1px solid #3c3c3c' : 'none',
            }}
            onClick={() => setChartExpanded(!chartExpanded)}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              <span style={{ 
                color: '#969696', 
                fontSize: '11px',
                fontWeight: '500',
                transition: 'transform 0.2s ease',
                transform: chartExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
              }}>
                ▶
              </span>
              <span style={{ 
                color: '#cccccc', 
                fontSize: '12px',
                fontWeight: '500'
              }}>
                📈 Activity (last 5 minutes)
              </span>
            </div>
            <span style={{
              color: '#969696',
              fontSize: '10px',
            }}>
              {chartExpanded ? 'Click to collapse' : 'Click to expand'}
            </span>
          </div>
          
          {/* Chart Content */}
          {chartExpanded && (
            <div style={{
              padding: '12px',
              display: 'flex',
              justifyContent: 'center',
            }}>
              {renderMetricsChart()}
            </div>
          )}
        </div>
      )}

      {/* Main content area */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Facet Filter Sidebar */}
        {showSidebar && (
          <>
            <div style={{
              width: `${sidebarWidth}px`,
              background: '#252526',
              overflowY: 'auto',
              padding: '8px',
              fontSize: '11px',
            }}>
            <div style={{ marginBottom: '12px' }}>
              <h4 style={{ margin: '0 0 8px 0', color: '#cccccc', fontSize: '12px' }}>📊 Levels</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <div
                  style={{
                    padding: '2px 6px',
                    cursor: 'pointer',
                    backgroundColor: levelFilter === 'all' ? '#007acc' : 'transparent',
                    borderRadius: '3px',
                    display: 'flex',
                    justifyContent: 'space-between',
                  }}
                  onClick={() => setLevelFilter('all')}
                >
                  <span>All</span>
                  <span style={{ color: '#969696' }}>{logs.length}</span>
                </div>
                {facetData.levels.map(([level, count]) => (
                  <div
                    key={level}
                    style={{
                      padding: '2px 6px',
                      cursor: 'pointer',
                      backgroundColor: levelFilter === level ? '#007acc' : 'transparent',
                      borderRadius: '3px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                    onClick={() => setLevelFilter(level)}
                  >
                    <span style={{ color: LOG_COLORS[level] }}>{level}</span>
                    <span style={{ color: '#969696' }}>{count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <h4 style={{ margin: '0 0 8px 0', color: '#cccccc', fontSize: '12px' }}>🏷️ Categories</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <div
                  style={{
                    padding: '2px 6px',
                    cursor: 'pointer',
                    backgroundColor: categoryFilter === 'all' ? '#007acc' : 'transparent',
                    borderRadius: '3px',
                    display: 'flex',
                    justifyContent: 'space-between',
                  }}
                  onClick={() => setCategoryFilter('all')}
                >
                  <span>All</span>
                  <span style={{ color: '#969696' }}>{logs.length}</span>
                </div>
                {facetData.categories.slice(0, 10).map(([category, count]) => (
                  <div
                    key={category}
                    style={{
                      padding: '2px 6px',
                      cursor: 'pointer',
                      backgroundColor: categoryFilter === category ? '#007acc' : 'transparent',
                      borderRadius: '3px',
                      display: 'flex',
                      justifyContent: 'space-between',
                    }}
                    onClick={() => setCategoryFilter(category)}
                  >
                    <span style={{ 
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      maxWidth: '150px'
                    }}>{category}</span>
                    <span style={{ color: '#969696' }}>{count}</span>
                  </div>
                ))}
                {facetData.categories.length > 10 && (
                  <div style={{ color: '#969696', padding: '2px 6px', fontSize: '10px' }}>
                    +{facetData.categories.length - 10} more
                  </div>
                )}
              </div>
            </div>

            {facetData.tags.length > 0 && (
              <div style={{ marginBottom: '12px' }}>
                <h4 style={{ margin: '0 0 8px 0', color: '#cccccc', fontSize: '12px' }}>🏷️ Tags</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  {facetData.tags.slice(0, 8).map(([tag, count]) => (
                    <div
                      key={tag}
                      style={{
                        padding: '2px 6px',
                        cursor: 'pointer',
                        backgroundColor: 'transparent',
                        borderRadius: '3px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '10px',
                        color: '#4ec9b0',
                      }}
                      onClick={() => {
                        // Add tag to search query if not already present
                        if (!searchQuery.includes(tag)) {
                          setSearchQuery(searchQuery ? `${searchQuery} ${tag}` : tag);
                        }
                      }}
                    >
                      <span>{tag}</span>
                      <span style={{ color: '#969696' }}>{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {facetData.sources.length > 0 && (
              <div>
                <h4 style={{ margin: '0 0 8px 0', color: '#cccccc', fontSize: '12px' }}>📁 Sources</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <div
                    style={{
                      padding: '2px 6px',
                      cursor: 'pointer',
                      backgroundColor: sourceFilter === 'all' ? '#007acc' : 'transparent',
                      borderRadius: '3px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '10px',
                      color: '#dcdcaa',
                    }}
                    onClick={() => setSourceFilter('all')}
                  >
                    <span>All</span>
                    <span style={{ color: '#969696' }}>{logs.length}</span>
                  </div>
                  {facetData.sources.slice(0, 6).map(([source, count]) => (
                    <div
                      key={source}
                      style={{
                        padding: '2px 6px',
                        cursor: 'pointer',
                        backgroundColor: sourceFilter === source ? '#007acc' : 'transparent',
                        borderRadius: '3px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '10px',
                        color: '#dcdcaa',
                      }}
                      onClick={() => setSourceFilter(source)}
                    >
                      <span style={{ 
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        maxWidth: '120px'
                      }}>{source}</span>
                      <span style={{ color: '#969696' }}>{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {/* Resizer */}
          <div
            style={{
              width: '4px',
              background: '#3c3c3c',
              cursor: 'col-resize',
              borderLeft: '1px solid #2d2d30',
              borderRight: '1px solid #2d2d30',
              position: 'relative',
            }}
            onMouseDown={(e) => {
              e.preventDefault();
              const startX = e.clientX;
              const startWidth = sidebarWidth;

              const handleMouseMove = (e: MouseEvent) => {
                const newWidth = Math.max(200, Math.min(600, startWidth + (e.clientX - startX)));
                setSidebarWidth(newWidth);
              };

              const handleMouseUp = () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
              };

              document.addEventListener('mousemove', handleMouseMove);
              document.addEventListener('mouseup', handleMouseUp);
            }}
          >
            {/* Resize handle indicator */}
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '1px',
              height: '20px',
              background: '#666',
            }} />
          </div>
          </>
        )}

        {/* Log list */}
        <div
          id="log-container"
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '4px',
          }}
        >
          {filteredLogs.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              color: '#666', 
              marginTop: '20px' 
            }}>
              No logs to display
            </div>
          ) : (
            filteredLogs.map((log) => {
              const isExpanded = expandedLogs.has(log.id);
              return (
                <div
                  key={log.id}
                  onClick={() => setSelectedLog(log)}
                  onDoubleClick={() => toggleLogExpansion(log.id)}
                  style={{
                    padding: '4px 8px',
                    borderBottom: '1px solid #2d2d30',
                    cursor: 'pointer',
                    background: selectedLog?.id === log.id ? '#094771' : LOG_BG_COLORS[log.level],
                    fontSize: '11px',
                  }}
                >
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'baseline' }}>
                    <span style={{ color: '#666', fontSize: '10px' }}>
                      {new Date(log.timestamp).toLocaleTimeString('en-US', {
                        hour12: false,
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </span>
                    <span style={{ 
                      color: LOG_COLORS[log.level],
                      fontWeight: '500',
                      width: '45px',
                    }}>
                      [{log.level.toUpperCase()}]
                    </span>
                    {log.category && (
                      <span style={{ 
                        color: log.category === 'Console' ? '#ff8c00' : '#9cdcfe',
                        fontStyle: log.category === 'Console' ? 'italic' : 'normal'
                      }}>
                        [{log.category}]
                      </span>
                    )}
                    {log.context?.intercepted && (
                      <span style={{ 
                        color: '#ff8c00', 
                        fontSize: '10px',
                        background: 'rgba(255, 140, 0, 0.1)',
                        padding: '1px 4px',
                        borderRadius: '2px',
                        marginRight: '4px'
                      }}>
                        📟
                      </span>
                    )}
                    <span style={{ flex: 1 }}>{renderLogMessage(log)}</span>
                    {log.data !== undefined && (
                      <span style={{ color: '#969696' }}>
                        {isExpanded ? '▾' : '▸'}
                      </span>
                    )}
                  </div>
                  {isExpanded && log.data !== undefined && (
                    <div style={{ 
                      marginTop: '4px', 
                      marginLeft: '20px',
                      padding: '4px',
                      background: '#1e1e1e',
                      borderRadius: '3px',
                    }}>
                      {renderLogData(log.data)}
                    </div>
                  )}
                  {log.tags && log.tags.length > 0 && (
                    <div style={{ marginTop: '2px' }}>
                      {log.tags.map(tag => (
                        <span
                          key={tag}
                          style={{
                            padding: '1px 4px',
                            marginRight: '4px',
                            background: '#2d2d30',
                            borderRadius: '2px',
                            fontSize: '10px',
                            color: '#969696',
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Detail panel */}
        {selectedLog && (
          <div style={{
            width: '300px',
            borderLeft: '1px solid #3c3c3c',
            padding: '10px',
            overflowY: 'auto',
          }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#9cdcfe' }}>Log Details</h4>
            
            <div style={{ marginBottom: '10px' }}>
              <div style={{ color: '#969696', marginBottom: '2px' }}>Time:</div>
              <div>{new Date(selectedLog.timestamp).toLocaleString()}</div>
            </div>

            <div style={{ marginBottom: '10px' }}>
              <div style={{ color: '#969696', marginBottom: '2px' }}>Level:</div>
              <div style={{ color: LOG_COLORS[selectedLog.level] }}>
                {selectedLog.level.toUpperCase()}
              </div>
            </div>

            {selectedLog.category && (
              <div style={{ marginBottom: '10px' }}>
                <div style={{ color: '#969696', marginBottom: '2px' }}>Category:</div>
                <div>{selectedLog.category}</div>
              </div>
            )}

            <div style={{ marginBottom: '10px' }}>
              <div style={{ color: '#969696', marginBottom: '2px' }}>Message:</div>
              <div style={{ wordBreak: 'break-word' }}>{renderLogMessage(selectedLog)}</div>
            </div>

            {selectedLog.data !== undefined && (
              <div style={{ marginBottom: '10px' }}>
                <div style={{ color: '#969696', marginBottom: '2px' }}>Data:</div>
                <pre style={{
                  margin: 0,
                  padding: '4px',
                  background: '#252526',
                  borderRadius: '3px',
                  fontSize: '10px',
                  overflow: 'auto',
                }}>
                  {JSON.stringify(selectedLog.data, null, 2)}
                </pre>
              </div>
            )}

            {selectedLog.context && (
              <div style={{ marginBottom: '10px' }}>
                <div style={{ color: '#969696', marginBottom: '2px' }}>Context:</div>
                <pre style={{
                  margin: 0,
                  padding: '4px',
                  background: '#252526',
                  borderRadius: '3px',
                  fontSize: '10px',
                  overflow: 'auto',
                }}>
                  {JSON.stringify(selectedLog.context, null, 2)}
                </pre>
              </div>
            )}

            {selectedLog.source && (
              <div style={{ marginBottom: '10px' }}>
                <div style={{ color: '#969696', marginBottom: '2px' }}>Source:</div>
                <div style={{ fontSize: '10px' }}>
                  {selectedLog.source.file && (
                    <div>{selectedLog.source.file}:{selectedLog.source.line}:{selectedLog.source.column}</div>
                  )}
                  {selectedLog.source.function && (
                    <div>Function: {selectedLog.source.function}</div>
                  )}
                </div>
              </div>
            )}

            {selectedLog.stack && (
              <div style={{ marginBottom: '10px' }}>
                <div style={{ color: '#969696', marginBottom: '2px' }}>Stack Trace:</div>
                <pre style={{
                  margin: 0,
                  padding: '4px',
                  background: '#252526',
                  borderRadius: '3px',
                  fontSize: '10px',
                  overflow: 'auto',
                  color: '#e74c3c',
                }}>
                  {selectedLog.stack}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer with metrics */}
      {showMetrics && (
        <Footer
          size="sm"
          variant="default"
          stats={[
            // Total logs
            {
              id: 'total-logs',
              label: 'Total',
              value: metrics.totalLogs.toLocaleString(),
              tooltip: 'Total number of logs captured',
            },
            // Rate stats
            {
              id: 'logs-per-second',
              label: 'Rate',
              value: `${metrics.logsPerSecond}/s`,
              tooltip: `Current: ${metrics.logsPerSecond}/s, Peak: ${metrics.peakLogsPerSecond}/s`,
              variant: metrics.logsPerSecond > 10 ? 'warning' : 'default',
            },
            // Error rate
            {
              id: 'error-rate',
              label: 'Errors',
              value: `${metrics.errorRate.toFixed(1)}%`,
              variant: metrics.errorRate > 0 ? 'error' : 'success',
              tooltip: 'Percentage of logs that are errors or fatal',
            },
            // Warning rate
            {
              id: 'warning-rate',
              label: 'Warnings',
              value: `${metrics.warningRate.toFixed(1)}%`,
              variant: metrics.warningRate > 0 ? 'warning' : 'success',
              tooltip: 'Percentage of logs that are warnings',
            },
            // Log level counts
            ...Object.entries(metrics.logsByLevel)
              .filter(([, count]) => (count as number) > 0)
              .map(([level, count]): FooterStat => ({
                id: `level-${level}`,
                label: level.charAt(0).toUpperCase() + level.slice(1),
                value: (count as number).toLocaleString(),
                onClick: () => setLevelFilter(level as LogLevel),
                tooltip: `Click to filter by ${level} level`,
                variant: level === 'error' || level === 'fatal' ? 'error' : 
                        level === 'warn' ? 'warning' : 'default',
              })),
          ]}
        />
      )}
    </div>
  );
}