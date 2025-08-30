import React from 'react';
import { clsx } from 'clsx';
import { 
  Gauge, 
  MemoryStick, 
  Clock, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle2,
  Zap
} from 'lucide-react';
import type { MemorySnapshot } from '../types';

export interface PerformanceMetricsProps {
  memoryUsage: number;
  memoryUtilization: number;
  currentSnapshot?: MemorySnapshot | null;
  className?: string;
}

export function PerformanceMetrics({ 
  memoryUsage, 
  memoryUtilization,
  currentSnapshot,
  className 
}: PerformanceMetricsProps) {
  const formatMemory = (bytes: number): string => {
    if (bytes >= 1024 * 1024) {
      return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
    }
    return `${(bytes / 1024).toFixed(0)}KB`;
  };

  const getMemoryStatus = () => {
    if (memoryUtilization > 0.9) return { color: 'red', label: 'Critical', icon: AlertTriangle };
    if (memoryUtilization > 0.7) return { color: 'yellow', label: 'Warning', icon: AlertTriangle };
    if (memoryUtilization > 0.5) return { color: 'blue', label: 'Moderate', icon: Gauge };
    return { color: 'green', label: 'Good', icon: CheckCircle2 };
  };

  const getCoreWebVitalScore = (value: number, thresholds: [number, number]) => {
    if (value <= thresholds[0]) return 'good';
    if (value <= thresholds[1]) return 'needs-improvement';
    return 'poor';
  };

  const getScoreColor = (score: 'good' | 'needs-improvement' | 'poor') => {
    switch (score) {
      case 'good': return 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400';
      case 'needs-improvement': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'poor': return 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400';
    }
  };

  const memoryStatus = getMemoryStatus();
  const StatusIcon = memoryStatus.icon;

  const metrics = currentSnapshot?.performanceMetrics;

  return (
    <div className={clsx("space-y-6", className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Performance Overview</h3>
        <div className="flex items-center space-x-2">
          <StatusIcon className={`h-5 w-5 text-${memoryStatus.color}-500`} />
          <span className={`text-sm font-medium text-${memoryStatus.color}-600 dark:text-${memoryStatus.color}-400`}>
            {memoryStatus.label}
          </span>
        </div>
      </div>

      {/* Memory Status */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-base font-semibold">Memory Usage</h4>
          <div className={clsx(
            "px-3 py-1 rounded-full text-sm font-medium",
            memoryStatus.color === 'green' && "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
            memoryStatus.color === 'blue' && "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
            memoryStatus.color === 'yellow' && "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
            memoryStatus.color === 'red' && "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
          )}>
            {Math.round(memoryUtilization * 100)}%
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 mb-1">
              <MemoryStick className="h-4 w-4" />
              <span>Current Usage</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {formatMemory(memoryUsage)}
            </div>
          </div>

          {currentSnapshot && (
            <div>
              <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 mb-1">
                <Gauge className="h-4 w-4" />
                <span>Heap Limit</span>
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {formatMemory(currentSnapshot.memoryInfo.jsHeapSizeLimit)}
              </div>
            </div>
          )}
        </div>

        {/* Memory Progress Bar */}
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
          <div
            className={clsx(
              "h-3 rounded-full transition-all duration-500",
              memoryStatus.color === 'green' && "bg-green-500",
              memoryStatus.color === 'blue' && "bg-blue-500",
              memoryStatus.color === 'yellow' && "bg-yellow-500",
              memoryStatus.color === 'red' && "bg-red-500"
            )}
            style={{ width: `${Math.min(memoryUtilization * 100, 100)}%` }}
          />
        </div>
      </div>

      {/* Core Web Vitals */}
      {metrics && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h4 className="text-base font-semibold mb-4">Core Web Vitals</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Largest Contentful Paint */}
            <div className="text-center">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">LCP</span>
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                {metrics.lcp ? `${(metrics.lcp / 1000).toFixed(1)}s` : 'N/A'}
              </div>
              {metrics.lcp && (
                <span className={clsx(
                  "px-2 py-1 rounded-full text-xs font-medium",
                  getScoreColor(getCoreWebVitalScore(metrics.lcp, [2500, 4000]))
                )}>
                  {getCoreWebVitalScore(metrics.lcp, [2500, 4000]).replace('-', ' ')}
                </span>
              )}
            </div>

            {/* First Input Delay */}
            <div className="text-center">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <Zap className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">FID</span>
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                {metrics.fid ? `${metrics.fid.toFixed(0)}ms` : 'N/A'}
              </div>
              {metrics.fid && (
                <span className={clsx(
                  "px-2 py-1 rounded-full text-xs font-medium",
                  getScoreColor(getCoreWebVitalScore(metrics.fid, [100, 300]))
                )}>
                  {getCoreWebVitalScore(metrics.fid, [100, 300]).replace('-', ' ')}
                </span>
              )}
            </div>

            {/* Cumulative Layout Shift */}
            <div className="text-center">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <TrendingUp className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">CLS</span>
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                {metrics.cls ? metrics.cls.toFixed(3) : 'N/A'}
              </div>
              {metrics.cls !== undefined && (
                <span className={clsx(
                  "px-2 py-1 rounded-full text-xs font-medium",
                  getScoreColor(getCoreWebVitalScore(metrics.cls, [0.1, 0.25]))
                )}>
                  {getCoreWebVitalScore(metrics.cls, [0.1, 0.25]).replace('-', ' ')}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Additional Metrics */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between mb-3">
              <h5 className="font-medium text-gray-900 dark:text-gray-100">Memory Pressure</h5>
              <div className={clsx(
                "w-3 h-3 rounded-full",
                metrics.memoryPressure === 'low' && "bg-green-500",
                metrics.memoryPressure === 'medium' && "bg-yellow-500",
                metrics.memoryPressure === 'high' && "bg-red-500"
              )}></div>
            </div>
            <div className="text-lg font-semibold capitalize text-gray-900 dark:text-gray-100">
              {metrics.memoryPressure}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {metrics.memoryPressure === 'low' && "System has plenty of available memory"}
              {metrics.memoryPressure === 'medium' && "System is under moderate memory pressure"}
              {metrics.memoryPressure === 'high' && "System is under high memory pressure"}
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between mb-3">
              <h5 className="font-medium text-gray-900 dark:text-gray-100">Heap Utilization</h5>
              <Gauge className="h-4 w-4 text-gray-500" />
            </div>
            <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {Math.round(metrics.heapUtilization * 100)}%
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
              <div
                className={clsx(
                  "h-2 rounded-full transition-all",
                  metrics.heapUtilization > 0.8 ? "bg-red-500" :
                  metrics.heapUtilization > 0.6 ? "bg-yellow-500" : "bg-green-500"
                )}
                style={{ width: `${metrics.heapUtilization * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Performance Tips */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
            <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h5 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
              Performance Tips
            </h5>
            <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
              {memoryUtilization > 0.7 && (
                <li>• High memory usage detected - consider implementing lazy loading</li>
              )}
              {metrics?.cls && metrics.cls > 0.1 && (
                <li>• Layout shifts detected - add explicit dimensions to dynamic content</li>
              )}
              {metrics?.lcp && metrics.lcp > 2500 && (
                <li>• Slow loading detected - optimize images and critical resources</li>
              )}
              {memoryUtilization <= 0.5 && metrics?.cls && metrics.cls <= 0.1 && (
                <li>• Great performance! Your app is running efficiently</li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}