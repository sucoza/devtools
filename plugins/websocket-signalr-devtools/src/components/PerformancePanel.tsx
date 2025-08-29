import React from 'react';
import { useDevToolsSelector } from '../core/devtools-store';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';

export function PerformancePanel() {
  const websocketMetrics = useDevToolsSelector(state => state.websocket.metrics);
  const signalrMetrics = useDevToolsSelector(state => state.signalr.metrics);
  const websocketConnections = useDevToolsSelector(state => Array.from(state.websocket.connections.values()));
  const signalrConnections = useDevToolsSelector(state => Array.from(state.signalr.connections.values()));
  const websocketMessages = useDevToolsSelector(state => state.websocket.messages);
  const signalrMessages = useDevToolsSelector(state => state.signalr.messages);

  // Generate time-based data for charts
  const timeSeriesData = React.useMemo(() => {
    const now = Date.now();
    const timeWindow = 5 * 60 * 1000; // 5 minutes
    const bucketSize = 10 * 1000; // 10 seconds
    
    const buckets = Math.floor(timeWindow / bucketSize);
    const data = [];

    for (let i = buckets; i >= 0; i--) {
      const bucketStart = now - (i * bucketSize);
      const bucketEnd = bucketStart + bucketSize;
      
      const wsMessages = websocketMessages.filter(m => 
        m.timestamp >= bucketStart && m.timestamp < bucketEnd
      ).length;
      
      const srMessages = signalrMessages.filter(m => 
        m.timestamp >= bucketStart && m.timestamp < bucketEnd
      ).length;

      data.push({
        time: new Date(bucketStart).toLocaleTimeString(),
        timestamp: bucketStart,
        websocket: wsMessages,
        signalr: srMessages,
        total: wsMessages + srMessages,
      });
    }

    return data;
  }, [websocketMessages, signalrMessages]);

  // Connection state distribution
  const connectionStatesData = React.useMemo(() => {
    const wsStates = new Map<string, number>();
    const srStates = new Map<string, number>();

    websocketConnections.forEach(conn => {
      wsStates.set(conn.state, (wsStates.get(conn.state) || 0) + 1);
    });

    signalrConnections.forEach(conn => {
      srStates.set(conn.state, (srStates.get(conn.state) || 0) + 1);
    });

    const data = [];
    const allStates = new Set([...wsStates.keys(), ...srStates.keys()]);
    
    allStates.forEach(state => {
      data.push({
        state,
        websocket: wsStates.get(state) || 0,
        signalr: srStates.get(state) || 0,
      });
    });

    return data;
  }, [websocketConnections, signalrConnections]);

  // Bytes transferred over time
  const bytesData = React.useMemo(() => {
    const data = timeSeriesData.map(bucket => {
      const wsBytes = websocketMessages
        .filter(m => m.timestamp >= bucket.timestamp && m.timestamp < bucket.timestamp + 10000)
        .reduce((sum, m) => sum + m.size, 0);
      
      const srBytes = signalrMessages
        .filter(m => m.timestamp >= bucket.timestamp && m.timestamp < bucket.timestamp + 10000)
        .reduce((sum, m) => sum + m.size, 0);

      return {
        ...bucket,
        websocketBytes: wsBytes,
        signalrBytes: srBytes,
        totalBytes: wsBytes + srBytes,
      };
    });

    return data;
  }, [timeSeriesData, websocketMessages, signalrMessages]);

  // Error distribution
  const errorData = React.useMemo(() => {
    const wsErrors = websocketConnections.reduce((sum, conn) => sum + conn.errors.length, 0);
    const srErrors = signalrConnections.reduce((sum, conn) => sum + conn.errors.length, 0);

    return [
      { name: 'WebSocket', value: wsErrors, color: '#8884d8' },
      { name: 'SignalR', value: srErrors, color: '#82ca9d' },
    ];
  }, [websocketConnections, signalrConnections]);

  // Hub method performance (SignalR)
  const hubMethodData = React.useMemo(() => {
    const methodStats = new Map<string, { invocations: number, avgTime: number, errors: number }>();

    signalrConnections.forEach(conn => {
      conn.hubMethods.forEach(method => {
        const existing = methodStats.get(method.name);
        if (existing) {
          existing.invocations += method.invocationCount;
          existing.avgTime = (existing.avgTime + method.averageExecutionTime) / 2;
          existing.errors += method.errorCount;
        } else {
          methodStats.set(method.name, {
            invocations: method.invocationCount,
            avgTime: method.averageExecutionTime,
            errors: method.errorCount,
          });
        }
      });
    });

    return Array.from(methodStats.entries())
      .map(([name, stats]) => ({
        name: name.substring(0, 20) + (name.length > 20 ? '...' : ''),
        fullName: name,
        invocations: stats.invocations,
        avgTime: Math.round(stats.avgTime),
        errors: stats.errors,
      }))
      .sort((a, b) => b.invocations - a.invocations)
      .slice(0, 10);
  }, [signalrConnections]);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  return (
    <div className="performance-panel">
      <div className="metrics-grid">
        <div className="metric-card">
          <h4>Total Connections</h4>
          <div className="metric-value">
            {websocketMetrics.totalConnections + signalrMetrics.totalConnections}
          </div>
          <div className="metric-breakdown">
            <span>WS: {websocketMetrics.totalConnections}</span>
            <span>SR: {signalrMetrics.totalConnections}</span>
          </div>
        </div>

        <div className="metric-card">
          <h4>Active Connections</h4>
          <div className="metric-value">
            {websocketMetrics.activeConnections + signalrMetrics.activeConnections}
          </div>
          <div className="metric-breakdown">
            <span>WS: {websocketMetrics.activeConnections}</span>
            <span>SR: {signalrMetrics.activeConnections}</span>
          </div>
        </div>

        <div className="metric-card">
          <h4>Total Messages</h4>
          <div className="metric-value">
            {websocketMetrics.totalMessages + signalrMetrics.totalMessages}
          </div>
          <div className="metric-breakdown">
            <span>WS: {websocketMetrics.totalMessages}</span>
            <span>SR: {signalrMetrics.totalMessages}</span>
          </div>
        </div>

        <div className="metric-card">
          <h4>Data Transferred</h4>
          <div className="metric-value">
            {Math.round((websocketMetrics.totalBytes + 0) / 1024)}KB
          </div>
          <div className="metric-breakdown">
            <span>WS: {Math.round(websocketMetrics.totalBytes / 1024)}KB</span>
          </div>
        </div>
      </div>

      <div className="charts-grid">
        <div className="chart-section">
          <h4>Message Activity (Last 5 minutes)</h4>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={timeSeriesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey="websocket" stackId="1" stroke="#8884d8" fill="#8884d8" />
              <Area type="monotone" dataKey="signalr" stackId="1" stroke="#82ca9d" fill="#82ca9d" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-section">
          <h4>Bytes Transferred</h4>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={bytesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip formatter={(value) => [`${value} bytes`, '']} />
              <Line type="monotone" dataKey="websocketBytes" stroke="#8884d8" name="WebSocket" />
              <Line type="monotone" dataKey="signalrBytes" stroke="#82ca9d" name="SignalR" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-section">
          <h4>Connection States</h4>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={connectionStatesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="state" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="websocket" fill="#8884d8" name="WebSocket" />
              <Bar dataKey="signalr" fill="#82ca9d" name="SignalR" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-section">
          <h4>Error Distribution</h4>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={errorData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => value > 0 ? `${name}: ${value}` : ''}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {errorData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {hubMethodData.length > 0 && (
          <div className="chart-section full-width">
            <h4>SignalR Hub Method Performance</h4>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={hubMethodData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis yAxisId="left" orientation="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip 
                  formatter={(value, name, props) => {
                    if (name === 'invocations') return [`${value} calls`, 'Invocations'];
                    if (name === 'avgTime') return [`${value}ms`, 'Avg Time'];
                    if (name === 'errors') return [`${value} errors`, 'Errors'];
                    return [value, name];
                  }}
                  labelFormatter={(label, payload) => {
                    const data = payload?.[0]?.payload;
                    return data?.fullName || label;
                  }}
                />
                <Bar yAxisId="left" dataKey="invocations" fill="#8884d8" name="Invocations" />
                <Bar yAxisId="right" dataKey="avgTime" fill="#82ca9d" name="Avg Time (ms)" />
                <Bar yAxisId="left" dataKey="errors" fill="#ff7c7c" name="Errors" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <style jsx>{`
        .performance-panel {
          padding: 16px;
          overflow: auto;
          height: 100%;
          background: var(--devtools-bg);
        }

        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
          margin-bottom: 32px;
        }

        .metric-card {
          background: var(--devtools-panel-bg);
          border: 1px solid var(--devtools-border);
          border-radius: 8px;
          padding: 16px;
          text-align: center;
        }

        .metric-card h4 {
          margin: 0 0 8px 0;
          font-size: 14px;
          color: var(--devtools-color);
          opacity: 0.8;
        }

        .metric-value {
          font-size: 28px;
          font-weight: 700;
          color: var(--devtools-accent);
          margin-bottom: 8px;
        }

        .metric-breakdown {
          display: flex;
          justify-content: space-around;
          font-size: 12px;
          color: var(--devtools-color);
          opacity: 0.7;
        }

        .charts-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
          gap: 24px;
        }

        .chart-section {
          background: var(--devtools-panel-bg);
          border: 1px solid var(--devtools-border);
          border-radius: 8px;
          padding: 16px;
        }

        .chart-section.full-width {
          grid-column: 1 / -1;
        }

        .chart-section h4 {
          margin: 0 0 16px 0;
          font-size: 16px;
          color: var(--devtools-color);
          font-weight: 600;
        }

        .chart-section :global(.recharts-cartesian-grid-horizontal line),
        .chart-section :global(.recharts-cartesian-grid-vertical line) {
          stroke: var(--devtools-border);
        }

        .chart-section :global(.recharts-text) {
          fill: var(--devtools-color);
          font-size: 12px;
        }

        .chart-section :global(.recharts-tooltip-wrapper) {
          background: var(--devtools-panel-bg);
          border: 1px solid var(--devtools-border);
          border-radius: 4px;
        }
      `}</style>
    </div>
  );
}