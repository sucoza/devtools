import React, { useState } from 'react';
import { clsx } from 'clsx';
import { 
  AlertTriangle, 
  XCircle, 
  AlertCircle, 
  Info, 
  X, 
  Clock,
  Component,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import type { MemoryWarning } from '../types';

export interface MemoryWarningsProps {
  warnings: MemoryWarning[];
  onDismissWarning?: (warningId: string) => void;
  compact?: boolean;
  className?: string;
}

export function MemoryWarnings({ 
  warnings, 
  onDismissWarning,
  compact = false,
  className 
}: MemoryWarningsProps) {
  const [expandedWarnings, setExpandedWarnings] = useState<Set<string>>(new Set());

  const toggleExpanded = (warningId: string) => {
    const newExpanded = new Set(expandedWarnings);
    if (newExpanded.has(warningId)) {
      newExpanded.delete(warningId);
    } else {
      newExpanded.add(warningId);
    }
    setExpandedWarnings(newExpanded);
  };

  const getSeverityIcon = (severity: MemoryWarning['severity']) => {
    switch (severity) {
      case 'critical':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'high':
        return <AlertTriangle className="h-5 w-5 text-red-400" />;
      case 'medium':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'low':
        return <Info className="h-5 w-5 text-blue-500" />;
      default:
        return <Info className="h-5 w-5 text-gray-500" />;
    }
  };

  const getSeverityColor = (severity: MemoryWarning['severity']) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800';
      case 'high':
        return 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-700';
      case 'medium':
        return 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-700';
      case 'low':
        return 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-700';
      default:
        return 'bg-gray-50 border-gray-200 dark:bg-gray-900/20 dark:border-gray-700';
    }
  };

  const getTypeLabel = (type: MemoryWarning['type']) => {
    switch (type) {
      case 'memory-leak':
        return 'Memory Leak';
      case 'excessive-renders':
        return 'Excessive Renders';
      case 'large-object':
        return 'Large Object';
      case 'gc-pressure':
        return 'GC Pressure';
      case 'performance-degradation':
        return 'Performance';
      default:
        return type;
    }
  };

  const formatTime = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;
    if (diff < 60000) return 'just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    return new Date(timestamp).toLocaleTimeString();
  };

  const groupedWarnings = warnings.reduce((groups, warning) => {
    const key = warning.severity;
    if (!groups[key]) groups[key] = [];
    groups[key].push(warning);
    return groups;
  }, {} as Record<string, MemoryWarning[]>);

  const severityOrder: MemoryWarning['severity'][] = ['critical', 'high', 'medium', 'low'];

  if (warnings.length === 0) {
    return (
      <div className={clsx(
        "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4",
        className
      )}>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-green-800 dark:text-green-200 font-medium">
            No memory warnings detected
          </span>
        </div>
        <p className="text-green-600 dark:text-green-300 text-sm mt-1">
          Your application&apos;s memory usage looks healthy!
        </p>
      </div>
    );
  }

  if (compact) {
    return (
      <div className={clsx("space-y-2", className)}>
        <h3 className="text-lg font-semibold">Memory Warnings ({warnings.length})</h3>
        <div className="space-y-1">
          {warnings.slice(0, 3).map((warning) => (
            <div
              key={warning.id}
              className={clsx(
                "flex items-center justify-between p-3 rounded-lg border",
                getSeverityColor(warning.severity)
              )}
            >
              <div className="flex items-center space-x-3">
                {getSeverityIcon(warning.severity)}
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-sm">{getTypeLabel(warning.type)}</span>
                    <span className="text-xs text-gray-500 bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded">
                      {warning.severity}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 truncate max-w-md">
                    {warning.message}
                  </p>
                </div>
              </div>
              <div className="text-xs text-gray-500">
                {formatTime(warning.timestamp)}
              </div>
            </div>
          ))}
          {warnings.length > 3 && (
            <div className="text-center py-2">
              <span className="text-sm text-gray-500">
                ...and {warnings.length - 3} more warnings
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={clsx("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Memory Warnings</h3>
        <div className="text-sm text-gray-500">
          {warnings.length} warning{warnings.length !== 1 ? 's' : ''}
        </div>
      </div>

      {severityOrder.map((severity) => {
        const severityWarnings = groupedWarnings[severity] || [];
        if (severityWarnings.length === 0) return null;

        return (
          <div key={severity} className="space-y-2">
            <div className="flex items-center space-x-2">
              {getSeverityIcon(severity)}
              <h4 className="font-medium capitalize">{severity} ({severityWarnings.length})</h4>
            </div>

            <div className="space-y-2">
              {severityWarnings.map((warning) => {
                const isExpanded = expandedWarnings.has(warning.id);
                
                return (
                  <div
                    key={warning.id}
                    className={clsx(
                      "border rounded-lg transition-all",
                      getSeverityColor(warning.severity)
                    )}
                  >
                    <div className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="font-medium">{getTypeLabel(warning.type)}</span>
                            <span className="text-xs bg-white dark:bg-gray-800 px-2 py-1 rounded border">
                              {warning.severity}
                            </span>
                            <div className="flex items-center space-x-1 text-xs text-gray-500">
                              <Clock className="h-3 w-3" />
                              <span>{formatTime(warning.timestamp)}</span>
                            </div>
                          </div>

                          <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                            {warning.message}
                          </p>

                          {warning.affectedComponents.length > 0 && (
                            <div className="mb-3">
                              <div className="flex items-center space-x-1 text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                <Component className="h-3 w-3" />
                                <span>Affected Components:</span>
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {warning.affectedComponents.map((component) => (
                                  <span
                                    key={component}
                                    className="inline-flex items-center px-2 py-1 rounded text-xs bg-white dark:bg-gray-800 border"
                                  >
                                    {component}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {warning.recommendations.length > 0 && (
                            <button
                              onClick={() => toggleExpanded(warning.id)}
                              className="flex items-center space-x-1 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 transition-colors"
                            >
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                              <span>
                                View {warning.recommendations.length} recommendation{warning.recommendations.length !== 1 ? 's' : ''}
                              </span>
                            </button>
                          )}

                          {isExpanded && warning.recommendations.length > 0 && (
                            <div className="mt-3 space-y-2">
                              {warning.recommendations.map((recommendation, index) => (
                                <div
                                  key={index}
                                  className="bg-white dark:bg-gray-800 p-3 rounded border text-sm"
                                >
                                  <div className="flex items-start space-x-2">
                                    <div className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0 mt-0.5">
                                      <span className="text-blue-600 dark:text-blue-400 text-xs font-bold">
                                        {index + 1}
                                      </span>
                                    </div>
                                    <p className="text-gray-700 dark:text-gray-300">
                                      {recommendation}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {onDismissWarning && (
                          <button
                            onClick={() => onDismissWarning(warning.id)}
                            className="ml-4 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                            title="Dismiss warning"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}