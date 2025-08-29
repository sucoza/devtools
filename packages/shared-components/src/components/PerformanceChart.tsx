import React from 'react';
import { clsx } from 'clsx';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';

export interface ChartDataPoint {
  timestamp: number;
  value: number;
  label?: string;
  metadata?: Record<string, any>;
}

export interface ChartSeries {
  name: string;
  data: ChartDataPoint[];
  color: string;
  unit?: string;
  formatter?: (value: number) => string;
}

export interface PerformanceChartProps {
  series: ChartSeries[];
  title?: string;
  height?: number;
  showLegend?: boolean;
  showGrid?: boolean;
  timeRange?: {
    start: number;
    end: number;
  };
  className?: string;
  onDataPointClick?: (point: ChartDataPoint, series: ChartSeries) => void;
}

/**
 * Shared PerformanceChart component for all DevTools plugins
 * Provides consistent chart rendering with configurable data sources
 */
export function PerformanceChart({
  series,
  title,
  height = 200,
  showLegend = true,
  showGrid = true,
  timeRange,
  className,
  onDataPointClick
}: PerformanceChartProps) {
  
  // Calculate chart dimensions and scales
  const chartWidth = 100; // percentage
  const chartHeight = height;
  
  const allDataPoints = series.flatMap(s => s.data);
  const allValues = allDataPoints.map(p => p.value);
  const allTimestamps = allDataPoints.map(p => p.timestamp);
  
  const minValue = Math.min(...allValues, 0);
  const maxValue = Math.max(...allValues);
  const minTime = timeRange?.start || Math.min(...allTimestamps);
  const maxTime = timeRange?.end || Math.max(...allTimestamps);
  
  const valueRange = maxValue - minValue || 1;
  const timeRange_ = maxTime - minTime || 1;
  
  // Generate SVG path for each series
  const generatePath = (data: ChartDataPoint[]) => {
    if (data.length === 0) return '';
    
    const points = data.map(point => {
      const x = ((point.timestamp - minTime) / timeRange_) * chartWidth;
      const y = chartHeight - ((point.value - minValue) / valueRange) * chartHeight;
      return `${x},${y}`;
    });
    
    return `M ${points.join(' L ')}`;
  };
  
  // Format value for display
  const formatValue = (value: number, formatter?: (value: number) => string) => {
    if (formatter) return formatter(value);
    if (value >= 1024 * 1024) return `${(value / 1024 / 1024).toFixed(1)}MB`;
    if (value >= 1024) return `${(value / 1024).toFixed(1)}KB`;
    return value.toString();
  };
  
  // Format time for display
  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };
  
  // Calculate trend
  const calculateTrend = (data: ChartDataPoint[]) => {
    if (data.length < 2) return 0;
    const recent = data.slice(-5);
    const first = recent[0].value;
    const last = recent[recent.length - 1].value;
    return last - first;
  };

  return (
    <div className={clsx('bg-white border border-gray-200 rounded-lg p-4', className)}>
      {/* Header */}
      {title && (
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Activity className="w-5 h-5 mr-2" />
            {title}
          </h3>
          <div className="flex items-center space-x-4 text-sm">
            {series.map(s => {
              const trend = calculateTrend(s.data);
              const latest = s.data[s.data.length - 1];
              return (
                <div key={s.name} className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: s.color }}
                  />
                  <span className="text-gray-600">{s.name}:</span>
                  <span className="font-mono">
                    {latest ? formatValue(latest.value, s.formatter) : 'N/A'}
                  </span>
                  {trend !== 0 && (
                    <span className={clsx(
                      'flex items-center',
                      trend > 0 ? 'text-red-500' : 'text-green-500'
                    )}>
                      {trend > 0 ? (
                        <TrendingUp className="w-4 h-4" />
                      ) : (
                        <TrendingDown className="w-4 h-4" />
                      )}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      {/* Chart */}
      <div className="relative">
        <svg
          width="100%"
          height={chartHeight}
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="overflow-visible"
        >
          {/* Grid lines */}
          {showGrid && (
            <g className="opacity-20">
              {/* Horizontal lines */}
              {[0, 0.25, 0.5, 0.75, 1].map(ratio => (
                <line
                  key={`h-${ratio}`}
                  x1={0}
                  y1={chartHeight - ratio * chartHeight}
                  x2={chartWidth}
                  y2={chartHeight - ratio * chartHeight}
                  stroke="#gray"
                  strokeWidth={0.5}
                />
              ))}
              {/* Vertical lines */}
              {[0, 0.25, 0.5, 0.75, 1].map(ratio => (
                <line
                  key={`v-${ratio}`}
                  x1={ratio * chartWidth}
                  y1={0}
                  x2={ratio * chartWidth}
                  y2={chartHeight}
                  stroke="#gray"
                  strokeWidth={0.5}
                />
              ))}
            </g>
          )}
          
          {/* Data series */}
          {series.map(s => (
            <g key={s.name}>
              <path
                d={generatePath(s.data)}
                fill="none"
                stroke={s.color}
                strokeWidth={2}
                className="hover:stroke-width-3 transition-all"
              />
              {/* Data points */}
              {s.data.map((point, idx) => (
                <circle
                  key={idx}
                  cx={((point.timestamp - minTime) / timeRange_) * chartWidth}
                  cy={chartHeight - ((point.value - minValue) / valueRange) * chartHeight}
                  r={2}
                  fill={s.color}
                  className="hover:r-4 cursor-pointer transition-all"
                  onClick={() => onDataPointClick?.(point, s)}
                >
                  <title>
                    {s.name}: {formatValue(point.value, s.formatter)} at {formatTime(point.timestamp)}
                  </title>
                </circle>
              ))}
            </g>
          ))}
        </svg>
        
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-500 -ml-12">
          {[1, 0.75, 0.5, 0.25, 0].map(ratio => (
            <div key={ratio}>
              {formatValue(minValue + ratio * valueRange)}
            </div>
          ))}
        </div>
        
        {/* X-axis labels */}
        <div className="flex justify-between text-xs text-gray-500 mt-2">
          <span>{formatTime(minTime)}</span>
          <span>{formatTime(maxTime)}</span>
        </div>
      </div>
      
      {/* Legend */}
      {showLegend && (
        <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-gray-100">
          {series.map(s => (
            <div key={s.name} className="flex items-center space-x-2 text-sm">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: s.color }}
              />
              <span>{s.name}</span>
              {s.unit && <span className="text-gray-500">({s.unit})</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}