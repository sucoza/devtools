import React, { useState } from 'react';
import { clsx } from 'clsx';
import { 
  Lightbulb, 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  Code, 
  ChevronDown, 
  ChevronRight,
  Copy,
  MemoryStick,
  Zap
} from 'lucide-react';
import type { OptimizationRecommendation } from '../types';

export interface OptimizationRecommendationsProps {
  recommendations: OptimizationRecommendation[];
  onMarkCompleted?: (recommendationId: string) => void;
  compact?: boolean;
  className?: string;
}

export function OptimizationRecommendations({ 
  recommendations, 
  onMarkCompleted,
  compact = false,
  className 
}: OptimizationRecommendationsProps) {
  const [expandedRecommendations, setExpandedRecommendations] = useState<Set<string>>(new Set());
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const toggleExpanded = (recommendationId: string) => {
    const newExpanded = new Set(expandedRecommendations);
    if (newExpanded.has(recommendationId)) {
      newExpanded.delete(recommendationId);
    } else {
      newExpanded.add(recommendationId);
    }
    setExpandedRecommendations(newExpanded);
  };

  const copyCodeToClipboard = async (code: string, id: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(id);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (error) {
      console.error('Failed to copy code:', error);
    }
  };

  const getPriorityColor = (priority: OptimizationRecommendation['priority']) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-700';
      case 'high':
        return 'bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-700';
      case 'medium':
        return 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-700';
      case 'low':
        return 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-700';
      default:
        return 'bg-gray-50 border-gray-200 dark:bg-gray-900/20 dark:border-gray-700';
    }
  };

  const getPriorityIcon = (priority: OptimizationRecommendation['priority']) => {
    switch (priority) {
      case 'critical':
        return <div className="w-3 h-3 bg-red-500 rounded-full"></div>;
      case 'high':
        return <div className="w-3 h-3 bg-orange-500 rounded-full"></div>;
      case 'medium':
        return <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>;
      case 'low':
        return <div className="w-3 h-3 bg-blue-500 rounded-full"></div>;
      default:
        return <div className="w-3 h-3 bg-gray-500 rounded-full"></div>;
    }
  };

  const getTypeIcon = (type: OptimizationRecommendation['type']) => {
    switch (type) {
      case 'memoization':
        return <Clock className="h-5 w-5 text-blue-500" />;
      case 'lazy-loading':
        return <TrendingUp className="h-5 w-5 text-green-500" />;
      case 'virtualization':
        return <MemoryStick className="h-5 w-5 text-purple-500" />;
      case 'cleanup':
        return <Zap className="h-5 w-5 text-orange-500" />;
      case 'bundling':
        return <Code className="h-5 w-5 text-indigo-500" />;
      default:
        return <Lightbulb className="h-5 w-5 text-yellow-500" />;
    }
  };

  const formatMemory = (bytes: number): string => {
    if (bytes >= 1024 * 1024) {
      return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
    }
    return `${(bytes / 1024).toFixed(0)}KB`;
  };

  const sortedRecommendations = [...recommendations].sort((a, b) => {
    const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
    return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
  });

  if (recommendations.length === 0) {
    return (
      <div className={clsx(
        "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4",
        className
      )}>
        <div className="flex items-center space-x-2">
          <CheckCircle2 className="h-5 w-5 text-green-500" />
          <span className="text-green-800 dark:text-green-200 font-medium">
            No optimization recommendations at this time
          </span>
        </div>
        <p className="text-green-600 dark:text-green-300 text-sm mt-1">
          Your application&apos;s memory usage is optimized!
        </p>
      </div>
    );
  }

  if (compact) {
    return (
      <div className={clsx("space-y-2", className)}>
        <h3 className="text-lg font-semibold">Optimization Recommendations ({recommendations.length})</h3>
        <div className="space-y-2">
          {sortedRecommendations.slice(0, 3).map((recommendation) => (
            <div
              key={recommendation.id}
              className={clsx(
                "flex items-center justify-between p-3 rounded-lg border",
                getPriorityColor(recommendation.priority)
              )}
            >
              <div className="flex items-center space-x-3">
                {getTypeIcon(recommendation.type)}
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-sm">{recommendation.title}</span>
                    <div className="flex items-center space-x-1">
                      {getPriorityIcon(recommendation.priority)}
                      <span className="text-xs text-gray-500 capitalize">
                        {recommendation.priority}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 truncate max-w-md">
                    {recommendation.description}
                  </p>
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-xs text-green-600 dark:text-green-400 font-medium">
                  {formatMemory(recommendation.estimatedSavings.memory)} saved
                </div>
                <div className="text-xs text-blue-600 dark:text-blue-400">
                  +{recommendation.estimatedSavings.performance}% performance
                </div>
              </div>
            </div>
          ))}
          {recommendations.length > 3 && (
            <div className="text-center py-2">
              <span className="text-sm text-gray-500">
                ...and {recommendations.length - 3} more recommendations
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
        <h3 className="text-lg font-semibold">Optimization Recommendations</h3>
        <div className="text-sm text-gray-500">
          {recommendations.length} recommendation{recommendations.length !== 1 ? 's' : ''}
        </div>
      </div>

      <div className="space-y-4">
        {sortedRecommendations.map((recommendation) => {
          const isExpanded = expandedRecommendations.has(recommendation.id);
          
          return (
            <div
              key={recommendation.id}
              className={clsx(
                "border rounded-lg transition-all",
                getPriorityColor(recommendation.priority)
              )}
            >
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start space-x-3">
                    {getTypeIcon(recommendation.type)}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                          {recommendation.title}
                        </h4>
                        <div className="flex items-center space-x-1">
                          {getPriorityIcon(recommendation.priority)}
                          <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                            {recommendation.priority}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {recommendation.description}
                      </p>
                      <p className="text-sm font-medium text-green-700 dark:text-green-300">
                        {recommendation.impact}
                      </p>
                    </div>
                  </div>

                  {onMarkCompleted && (
                    <button
                      onClick={() => onMarkCompleted(recommendation.id)}
                      className="flex items-center space-x-1 px-3 py-1 bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 rounded text-sm font-medium transition-colors"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Mark Done</span>
                    </button>
                  )}
                </div>

                {/* Estimated Savings */}
                <div className="flex items-center space-x-4 mb-3">
                  <div className="flex items-center space-x-1 text-sm">
                    <MemoryStick className="h-4 w-4 text-green-500" />
                    <span className="text-green-600 dark:text-green-400 font-medium">
                      {formatMemory(recommendation.estimatedSavings.memory)} memory saved
                    </span>
                  </div>
                  <div className="flex items-center space-x-1 text-sm">
                    <Zap className="h-4 w-4 text-blue-500" />
                    <span className="text-blue-600 dark:text-blue-400 font-medium">
                      +{recommendation.estimatedSavings.performance}% performance
                    </span>
                  </div>
                </div>

                {/* Affected Components */}
                {recommendation.affectedComponents.length > 0 && (
                  <div className="mb-3">
                    <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Affected Components:
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {recommendation.affectedComponents.map((component) => (
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

                {/* Implementation Guide and Code Example */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => toggleExpanded(recommendation.id)}
                    className="flex items-center space-x-1 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 transition-colors"
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                    <span>View Implementation Guide</span>
                  </button>

                  {recommendation.codeExample && (
                    <div className="w-px h-4 bg-gray-300 dark:bg-gray-600"></div>
                  )}
                  
                  {recommendation.codeExample && (
                    <button
                      onClick={() => copyCodeToClipboard(recommendation.codeExample!, recommendation.id)}
                      className="flex items-center space-x-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                    >
                      <Copy className="h-4 w-4" />
                      <span>
                        {copiedCode === recommendation.id ? 'Copied!' : 'Copy Code'}
                      </span>
                    </button>
                  )}
                </div>

                {isExpanded && (
                  <div className="mt-4 space-y-4">
                    {/* Implementation Guide */}
                    <div className="bg-white dark:bg-gray-800 p-4 rounded border">
                      <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                        Implementation Guide
                      </h5>
                      <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-line">
                        {recommendation.implementationGuide}
                      </p>
                    </div>

                    {/* Code Example */}
                    {recommendation.codeExample && (
                      <div className="bg-gray-900 dark:bg-gray-950 rounded border overflow-hidden">
                        <div className="flex items-center justify-between px-4 py-2 bg-gray-800 dark:bg-gray-900 border-b border-gray-700">
                          <span className="text-sm font-medium text-gray-200">Example Implementation</span>
                          <button
                            onClick={() => copyCodeToClipboard(recommendation.codeExample!, recommendation.id)}
                            className="flex items-center space-x-1 text-xs text-gray-400 hover:text-gray-200 transition-colors"
                          >
                            <Copy className="h-3 w-3" />
                            <span>{copiedCode === recommendation.id ? 'Copied!' : 'Copy'}</span>
                          </button>
                        </div>
                        <pre className="p-4 text-sm text-gray-100 overflow-x-auto">
                          <code>{recommendation.codeExample}</code>
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}