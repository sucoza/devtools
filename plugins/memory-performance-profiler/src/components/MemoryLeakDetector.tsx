import React, { useState } from 'react';
import { clsx } from 'clsx';
import { 
  AlertTriangle, 
  TrendingUp, 
  Component, 
  Clock,
  BarChart3,
  Eye,
  ChevronDown,
  ChevronRight,
  Search
} from 'lucide-react';
import type { MemoryLeakPattern } from '../types';

export interface MemoryLeakDetectorProps {
  leakPatterns: MemoryLeakPattern[];
  onAnalyzePattern?: (patternId: string) => void;
  className?: string;
}

export function MemoryLeakDetector({ 
  leakPatterns, 
  onAnalyzePattern,
  className 
}: MemoryLeakDetectorProps) {
  const [expandedPatterns, setExpandedPatterns] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  const toggleExpanded = (patternId: string) => {
    const newExpanded = new Set(expandedPatterns);
    if (newExpanded.has(patternId)) {
      newExpanded.delete(patternId);
    } else {
      newExpanded.add(patternId);
    }
    setExpandedPatterns(newExpanded);
  };

  const getPatternIcon = (pattern: MemoryLeakPattern['pattern']) => {
    switch (pattern) {
      case 'growing-array':
        return <TrendingUp className="h-5 w-5 text-red-500" />;
      case 'event-listeners':
        return <Component className="h-5 w-5 text-orange-500" />;
      case 'timers':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'closures':
        return <BarChart3 className="h-5 w-5 text-purple-500" />;
      case 'dom-refs':
        return <Eye className="h-5 w-5 text-blue-500" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getPatternTitle = (pattern: MemoryLeakPattern['pattern']) => {
    switch (pattern) {
      case 'growing-array':
        return 'Growing Array/Object';
      case 'event-listeners':
        return 'Unremoved Event Listeners';
      case 'timers':
        return 'Uncleaned Timers';
      case 'closures':
        return 'Closure Memory Retention';
      case 'dom-refs':
        return 'DOM Reference Leak';
      default:
        return 'Unknown Pattern';
    }
  };

  const getPatternDescription = (pattern: MemoryLeakPattern['pattern']) => {
    switch (pattern) {
      case 'growing-array':
        return 'Arrays or objects that continuously grow without cleanup';
      case 'event-listeners':
        return 'Event listeners attached but never removed, preventing garbage collection';
      case 'timers':
        return 'setInterval or setTimeout not properly cleared';
      case 'closures':
        return 'Closures holding references to large objects longer than necessary';
      case 'dom-refs':
        return 'References to DOM elements that have been removed from the document';
      default:
        return 'Unknown memory leak pattern detected';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400';
    if (confidence >= 0.6) return 'text-orange-600 bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400';
    if (confidence >= 0.4) return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400';
    return 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400';
  };

  const formatMemoryRate = (bytesPerSecond: number): string => {
    if (bytesPerSecond >= 1024 * 1024) {
      return `${(bytesPerSecond / 1024 / 1024).toFixed(1)}MB/s`;
    }
    if (bytesPerSecond >= 1024) {
      return `${(bytesPerSecond / 1024).toFixed(1)}KB/s`;
    }
    return `${bytesPerSecond.toFixed(0)}B/s`;
  };

  const formatTime = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;
    if (diff < 60000) return 'just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    return new Date(timestamp).toLocaleTimeString();
  };

  const filteredPatterns = leakPatterns.filter(pattern => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      getPatternTitle(pattern.pattern).toLowerCase().includes(query) ||
      pattern.affectedComponents.some(comp => comp.toLowerCase().includes(query))
    );
  });

  const sortedPatterns = [...filteredPatterns].sort((a, b) => {
    // Sort by confidence (higher first), then by memory growth rate
    if (Math.abs(a.confidence - b.confidence) > 0.1) {
      return b.confidence - a.confidence;
    }
    return b.memoryGrowthRate - a.memoryGrowthRate;
  });

  if (leakPatterns.length === 0) {
    return (
      <div className={clsx(
        "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-8",
        className
      )}>
        <div className="text-center">
          <div className="w-2 h-2 bg-green-500 rounded-full mx-auto mb-3"></div>
          <h3 className="text-lg font-semibold text-green-800 dark:text-green-200 mb-2">
            No Memory Leaks Detected
          </h3>
          <p className="text-green-600 dark:text-green-300">
            Your application&apos;s memory management looks healthy. Continue monitoring for optimal performance.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={clsx("space-y-6", className)}>
      {/* Header and Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Memory Leak Detection</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {leakPatterns.length} potential leak pattern{leakPatterns.length !== 1 ? 's' : ''} detected
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search patterns..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
            />
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-900 dark:text-red-100">High Confidence</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                {leakPatterns.filter(p => p.confidence >= 0.8).length}
              </p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-500" />
          </div>
        </div>

        <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-900 dark:text-orange-100">Growing Arrays</p>
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {leakPatterns.filter(p => p.pattern === 'growing-array').length}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-orange-500" />
          </div>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Affected Components</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {new Set(leakPatterns.flatMap(p => p.affectedComponents)).size}
              </p>
            </div>
            <Component className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-900 dark:text-purple-100">Avg Growth Rate</p>
              <p className="text-lg font-bold text-purple-600 dark:text-purple-400">
                {leakPatterns.length > 0 
                  ? formatMemoryRate(leakPatterns.reduce((sum, p) => sum + p.memoryGrowthRate, 0) / leakPatterns.length)
                  : '0 B/s'
                }
              </p>
            </div>
            <BarChart3 className="h-8 w-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Leak Patterns */}
      <div className="space-y-4">
        {sortedPatterns.map((pattern) => {
          const isExpanded = expandedPatterns.has(pattern.id);
          
          return (
            <div
              key={pattern.id}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
            >
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start space-x-3 flex-1">
                    {getPatternIcon(pattern.pattern)}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                          {getPatternTitle(pattern.pattern)}
                        </h4>
                        <span className={clsx(
                          "px-2 py-1 rounded-full text-xs font-medium",
                          getConfidenceColor(pattern.confidence)
                        )}>
                          {Math.round(pattern.confidence * 100)}% confidence
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {getPatternDescription(pattern.pattern)}
                      </p>
                      <div className="flex items-center space-x-4 text-sm">
                        <div className="flex items-center space-x-1">
                          <TrendingUp className="h-4 w-4 text-red-500" />
                          <span className="text-red-600 dark:text-red-400 font-medium">
                            {formatMemoryRate(pattern.memoryGrowthRate)} growth
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="h-4 w-4 text-gray-500" />
                          <span className="text-gray-600 dark:text-gray-400">
                            Detected {formatTime(pattern.detectedAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    {onAnalyzePattern && (
                      <button
                        onClick={() => onAnalyzePattern(pattern.id)}
                        className="flex items-center space-x-1 px-3 py-1 bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400 rounded text-sm font-medium transition-colors"
                      >
                        <Eye className="h-4 w-4" />
                        <span>Analyze</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Affected Components */}
                {pattern.affectedComponents.length > 0 && (
                  <div className="mb-3">
                    <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Affected Components ({pattern.affectedComponents.length}):
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {pattern.affectedComponents.map((component) => (
                        <span
                          key={component}
                          className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 dark:bg-gray-700 border"
                        >
                          <Component className="h-3 w-3 mr-1" />
                          {component}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sample Data Toggle */}
                {pattern.samples.length > 0 && (
                  <button
                    onClick={() => toggleExpanded(pattern.id)}
                    className="flex items-center space-x-1 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 transition-colors"
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                    <span>View {pattern.samples.length} sample{pattern.samples.length !== 1 ? 's' : ''}</span>
                  </button>
                )}

                {/* Expanded Sample Data */}
                {isExpanded && pattern.samples.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="space-y-3">
                      <h5 className="font-medium text-gray-900 dark:text-gray-100">
                        Memory Growth Timeline
                      </h5>
                      <div className="space-y-2">
                        {pattern.samples.slice(0, 5).map((sample, index) => (
                          <div
                            key={sample.id}
                            className="flex items-center justify-between py-2 px-3 bg-gray-50 dark:bg-gray-700 rounded text-sm"
                          >
                            <div className="flex items-center space-x-3">
                              <span className="text-gray-500 w-12">#{index + 1}</span>
                              <span className="text-gray-900 dark:text-gray-100">
                                {new Date(sample.timestamp).toLocaleTimeString()}
                              </span>
                            </div>
                            <div className="flex items-center space-x-4">
                              <span className="text-blue-600 dark:text-blue-400">
                                {(sample.memoryInfo.usedJSHeapSize / 1024 / 1024).toFixed(1)}MB
                              </span>
                              {index > 0 && (
                                <span className={clsx(
                                  "text-xs px-2 py-1 rounded",
                                  sample.memoryInfo.usedJSHeapSize > pattern.samples[index - 1].memoryInfo.usedJSHeapSize
                                    ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                    : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                )}>
                                  {sample.memoryInfo.usedJSHeapSize > pattern.samples[index - 1].memoryInfo.usedJSHeapSize ? '+' : ''}
                                  {((sample.memoryInfo.usedJSHeapSize - pattern.samples[index - 1].memoryInfo.usedJSHeapSize) / 1024).toFixed(0)}KB
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                        {pattern.samples.length > 5 && (
                          <div className="text-center py-2 text-sm text-gray-500">
                            ...and {pattern.samples.length - 5} more samples
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredPatterns.length === 0 && searchQuery && (
        <div className="text-center py-8 text-gray-500">
          <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>No leak patterns match your search</p>
        </div>
      )}
    </div>
  );
}