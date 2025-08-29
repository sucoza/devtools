import React, { useMemo } from 'react';
import { clsx } from 'clsx';
import { TrendingUp, TrendingDown, AlertTriangle, Zap } from 'lucide-react';
import type { MemoryTimelinePoint, MemoryWarning } from '../types';

export interface MemoryTimelineProps {
  timeline: MemoryTimelinePoint[];
  warnings: MemoryWarning[];
  className?: string;
}

export function MemoryTimeline({ timeline, warnings, className }: MemoryTimelineProps) {
  const { chartData, maxMemory, minMemory, memoryRange } = useMemo(() => {
    if (timeline.length === 0) {
      return { chartData: [], maxMemory: 0, minMemory: 0, memoryRange: 0 };
    }

    const maxMem = Math.max(...timeline.map(point => point.usedMemory));
    const minMem = Math.min(...timeline.map(point => point.usedMemory));
    const range = maxMem - minMem;

    const chartData = timeline.map((point, index) => ({
      ...point,
      x: (index / (timeline.length - 1)) * 100,
      y: range > 0 ? ((maxMem - point.usedMemory) / range) * 80 + 10 : 50
    }));

    return {
      chartData,
      maxMemory: maxMem,
      minMemory: minMem,
      memoryRange: range
    };
  }, [timeline]);

  const formatMemory = (bytes: number): string => {
    if (bytes >= 1024 * 1024) {
      return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
    }
    return `${(bytes / 1024).toFixed(0)}KB`;
  };

  const formatTime = (timestamp: number): string => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const getMemoryTrend = (): 'up' | 'down' | 'stable' => {
    if (timeline.length < 2) return 'stable';
    
    const recent = timeline.slice(-5);
    const first = recent[0].usedMemory;
    const last = recent[recent.length - 1].usedMemory;
    const difference = last - first;
    const threshold = first * 0.05; // 5% change threshold

    if (difference > threshold) return 'up';
    if (difference < -threshold) return 'down';
    return 'stable';
  };

  const trend = getMemoryTrend();

  if (timeline.length === 0) {
    return (
      <div className={clsx("flex items-center justify-center h-64 text-gray-500", className)}>
        <div className="text-center">
          <TrendingUp className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>No timeline data available</p>
          <p className="text-sm mt-1">Start profiling to see memory usage over time</p>
        </div>
      </div>
    );
  }

  return (
    <div className={clsx("space-y-4", className)}>
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Current</p>
              <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                {formatMemory(timeline[timeline.length - 1]?.usedMemory || 0)}
              </p>
            </div>
            <div className={clsx(
              "p-2 rounded",
              trend === 'up' ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400" :
              trend === 'down' ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400" :
              "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
            )}>
              {trend === 'up' ? (
                <TrendingUp className="h-4 w-4" />
              ) : trend === 'down' ? (
                <TrendingDown className="h-4 w-4" />
              ) : (
                <div className="w-4 h-1 bg-current rounded"></div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
          <div>
            <p className="text-sm font-medium text-green-900 dark:text-green-100">Peak</p>
            <p className="text-lg font-bold text-green-600 dark:text-green-400">
              {formatMemory(maxMemory)}
            </p>
          </div>
        </div>

        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3">
          <div>
            <p className="text-sm font-medium text-purple-900 dark:text-purple-100">Low</p>
            <p className="text-lg font-bold text-purple-600 dark:text-purple-400">
              {formatMemory(minMemory)}
            </p>
          </div>
        </div>

        <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3">
          <div>
            <p className="text-sm font-medium text-orange-900 dark:text-orange-100">Range</p>
            <p className="text-lg font-bold text-orange-600 dark:text-orange-400">
              {formatMemory(memoryRange)}
            </p>
          </div>
        </div>
      </div>

      {/* Timeline Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Memory Usage Over Time</h3>
          <div className="text-sm text-gray-500">
            {timeline.length} data points
          </div>
        </div>

        <div className="relative h-64 bg-gray-50 dark:bg-gray-900 rounded">
          {/* Y-axis labels */}
          <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-500 pr-2">
            <span>{formatMemory(maxMemory)}</span>
            <span>{formatMemory((maxMemory + minMemory) / 2)}</span>
            <span>{formatMemory(minMemory)}</span>
          </div>

          {/* Chart area */}
          <div className="ml-16 mr-4 h-full relative">
            {/* Grid lines */}
            <svg className="absolute inset-0 w-full h-full">
              {/* Horizontal grid lines */}
              {[25, 50, 75].map(y => (
                <line
                  key={y}
                  x1="0"
                  x2="100%"
                  y1={`${y}%`}
                  y2={`${y}%`}
                  stroke="currentColor"
                  strokeWidth="1"
                  className="text-gray-200 dark:text-gray-700"
                  strokeDasharray="2,2"
                />
              ))}

              {/* Memory usage line */}
              {chartData.length > 1 && (
                <polyline
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="2"
                  points={chartData.map(point => `${point.x},${point.y}`).join(' ')}
                />
              )}

              {/* Data points */}
              {chartData.map((point, index) => (
                <g key={index}>
                  <circle
                    cx={`${point.x}%`}
                    cy={`${point.y}%`}
                    r="3"
                    fill="#3b82f6"
                    className="hover:r-4 transition-all cursor-pointer"
                  />
                  
                  {/* GC events */}
                  {point.gcEvent && (
                    <g>
                      <circle
                        cx={`${point.x}%`}
                        cy={`${point.y}%`}
                        r="6"
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="2"
                      />
                      <Zap
                        x={`${point.x}%`}
                        y={`${point.y}%`}
                        width="8"
                        height="8"
                        className="text-green-500"
                      />
                    </g>
                  )}
                  
                  {/* Warnings */}
                  {point.warning && (
                    <g>
                      <circle
                        cx={`${point.x}%`}
                        cy={`${point.y}%`}
                        r="8"
                        fill="none"
                        stroke="#ef4444"
                        strokeWidth="2"
                      />
                      <AlertTriangle
                        x={`${point.x}%`}
                        y={`${point.y}%`}
                        width="10"
                        height="10"
                        className="text-red-500"
                      />
                    </g>
                  )}
                </g>
              ))}
            </svg>
          </div>

          {/* X-axis labels */}
          <div className="absolute bottom-0 left-16 right-4 flex justify-between text-xs text-gray-500 mt-2">
            <span>{timeline.length > 0 ? formatTime(timeline[0].timestamp) : ''}</span>
            <span>{timeline.length > 0 ? formatTime(timeline[timeline.length - 1].timestamp) : ''}</span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center space-x-6 mt-4 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-0.5 bg-blue-500"></div>
            <span>Memory Usage</span>
          </div>
          <div className="flex items-center space-x-2">
            <Zap className="h-3 w-3 text-green-500" />
            <span>GC Events</span>
          </div>
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-3 w-3 text-red-500" />
            <span>Warnings</span>
          </div>
        </div>
      </div>

      {/* Recent Events */}
      {timeline.slice(-5).some(point => point.gcEvent || point.warning) && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="text-lg font-semibold mb-3">Recent Events</h3>
          <div className="space-y-2">
            {timeline
              .slice(-5)
              .filter(point => point.gcEvent || point.warning)
              .map((point, index) => (
                <div key={index} className="flex items-center space-x-3 text-sm">
                  <span className="text-gray-500 w-20">
                    {formatTime(point.timestamp)}
                  </span>
                  {point.gcEvent && (
                    <div className="flex items-center space-x-2 text-green-600">
                      <Zap className="h-4 w-4" />
                      <span>
                        GC freed {formatMemory(point.gcEvent.memoryFreed)} 
                        ({point.gcEvent.type})
                      </span>
                    </div>
                  )}
                  {point.warning && (
                    <div className="flex items-center space-x-2 text-red-600">
                      <AlertTriangle className="h-4 w-4" />
                      <span>{point.warning.message}</span>
                    </div>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}