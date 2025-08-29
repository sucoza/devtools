/**
 * Performance Metrics Component
 * Displays i18n-related performance metrics and optimization suggestions
 */

import React, { useState, useEffect } from 'react';
import type { I18nPerformanceMetrics } from '../types/i18n';
import { i18nEventClient } from '../core/i18n-event-client';

interface PerformanceMetricsProps {
  metrics: I18nPerformanceMetrics | null;
}

export function PerformanceMetrics({
  metrics: initialMetrics
}: PerformanceMetricsProps) {
  const [metrics, setMetrics] = useState<I18nPerformanceMetrics | null>(initialMetrics);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'realtime' | '1h' | '24h' | '7d'>('realtime');
  const [showDetails, setShowDetails] = useState<string | null>(null);

  useEffect(() => {
    setMetrics(initialMetrics);
  }, [initialMetrics]);

  const refreshMetrics = async () => {
    setIsRefreshing(true);
    
    try {
      i18nEventClient.emit('i18n-performance-metrics', { metrics: {} as I18nPerformanceMetrics });
      
      const unsubscribe = i18nEventClient.on('i18n-performance-metrics', (event) => {
        setMetrics(event.payload.metrics);
        setIsRefreshing(false);
        unsubscribe();
      });

      // Timeout
      setTimeout(() => {
        setIsRefreshing(false);
        unsubscribe();
      }, 5000);
    } catch (error) {
      console.error('Failed to refresh metrics:', error);
      setIsRefreshing(false);
    }
  };

  const formatTime = (milliseconds: number): string => {
    if (milliseconds < 1) return `${(milliseconds * 1000).toFixed(0)}μs`;
    if (milliseconds < 1000) return `${milliseconds.toFixed(1)}ms`;
    return `${(milliseconds / 1000).toFixed(2)}s`;
  };

  const formatBytes = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  const formatPercentage = (value: number): string => {
    return `${(value * 100).toFixed(1)}%`;
  };

  const getPerformanceStatus = (metric: string, value: number): { status: 'good' | 'warning' | 'critical', color: string } => {
    switch (metric) {
      case 'initTime':
        if (value < 50) return { status: 'good', color: '#4ec9b0' };
        if (value < 200) return { status: 'warning', color: '#d19a66' };
        return { status: 'critical', color: '#f48771' };
      
      case 'averageKeyLookupTime':
        if (value < 1) return { status: 'good', color: '#4ec9b0' };
        if (value < 5) return { status: 'warning', color: '#d19a66' };
        return { status: 'critical', color: '#f48771' };
      
      case 'cacheHitRate':
        if (value > 0.9) return { status: 'good', color: '#4ec9b0' };
        if (value > 0.7) return { status: 'warning', color: '#d19a66' };
        return { status: 'critical', color: '#f48771' };
      
      case 'memoryUsage':
        if (value < 5 * 1024 * 1024) return { status: 'good', color: '#4ec9b0' };
        if (value < 20 * 1024 * 1024) return { status: 'warning', color: '#d19a66' };
        return { status: 'critical', color: '#f48771' };
      
      default:
        return { status: 'good', color: '#cccccc' };
    }
  };

  if (!metrics) {
    return (
      <div style={{
        padding: '40px',
        textAlign: 'center',
        color: '#969696',
        fontSize: '12px',
        background: '#1e1e1e',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '20px' }}>⚡</div>
        <div style={{ fontWeight: '600', marginBottom: '10px' }}>
          Performance Metrics
        </div>
        <div style={{ marginBottom: '20px' }}>
          No performance data available yet
        </div>
        <button
          onClick={refreshMetrics}
          disabled={isRefreshing}
          style={{
            padding: '8px 16px',
            fontSize: '11px',
            border: '1px solid #3c3c3c',
            background: isRefreshing ? '#2d2d30' : '#007acc',
            color: isRefreshing ? '#969696' : '#ffffff',
            cursor: isRefreshing ? 'not-allowed' : 'pointer',
            borderRadius: '3px',
            fontWeight: '600'
          }}
        >
          {isRefreshing ? 'Loading...' : 'Load Metrics'}
        </button>
      </div>
    );
  }

  return (
    <div style={{
      padding: '15px',
      height: '100%',
      overflowY: 'auto',
      background: '#1e1e1e'
    }}>
      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <h4 style={{ margin: 0, color: '#9cdcfe', fontSize: '14px', fontWeight: '600' }}>
            ⚡ Performance Metrics
          </h4>
          
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <select
              value={selectedTimeframe}
              onChange={(e) => setSelectedTimeframe(e.target.value as any)}
              style={{
                padding: '4px 8px',
                fontSize: '10px',
                border: '1px solid #3c3c3c',
                background: '#2d2d30',
                color: '#cccccc',
                cursor: 'pointer',
                borderRadius: '2px'
              }}
            >
              <option value="realtime">Real-time</option>
              <option value="1h">Last Hour</option>
              <option value="24h">Last 24h</option>
              <option value="7d">Last 7 days</option>
            </select>
            
            <button
              onClick={refreshMetrics}
              disabled={isRefreshing}
              style={{
                padding: '4px 8px',
                fontSize: '10px',
                border: '1px solid #3c3c3c',
                background: isRefreshing ? '#2d2d30' : '#007acc',
                color: isRefreshing ? '#969696' : '#ffffff',
                cursor: isRefreshing ? 'not-allowed' : 'pointer',
                borderRadius: '2px'
              }}
            >
              {isRefreshing ? '⟳' : '↻'} Refresh
            </button>
          </div>
        </div>
        
        <div style={{ fontSize: '11px', color: '#969696' }}>
          Monitor i18n performance and identify optimization opportunities
        </div>
      </div>

      {/* Key metrics overview */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: '12px',
        marginBottom: '20px'
      }}>
        {[
          {
            key: 'initTime',
            label: 'Initialization',
            value: formatTime(metrics.initTime),
            description: 'Time to initialize i18n system'
          },
          {
            key: 'averageKeyLookupTime',
            label: 'Key Lookup',
            value: formatTime(metrics.averageKeyLookupTime),
            description: 'Average translation lookup time'
          },
          {
            key: 'cacheHitRate',
            label: 'Cache Hit Rate',
            value: formatPercentage(metrics.cacheHitRate),
            description: 'Percentage of cached lookups'
          },
          {
            key: 'memoryUsage',
            label: 'Memory Usage',
            value: formatBytes(metrics.memoryUsage),
            description: 'Current memory consumption'
          }
        ].map(metric => {
          const status = getPerformanceStatus(metric.key, 
            metric.key === 'cacheHitRate' ? metrics.cacheHitRate :
            metric.key === 'memoryUsage' ? metrics.memoryUsage :
            metric.key === 'averageKeyLookupTime' ? metrics.averageKeyLookupTime :
            metrics.initTime
          );
          
          return (
            <div
              key={metric.key}
              style={{
                background: '#252526',
                padding: '12px',
                borderRadius: '4px',
                border: '1px solid',
                borderColor: showDetails === metric.key ? status.color : '#3c3c3c',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onClick={() => setShowDetails(showDetails === metric.key ? null : metric.key)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <div style={{ fontSize: '10px', color: '#9cdcfe', fontWeight: '600' }}>
                  {metric.label}
                </div>
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: status.color
                }} />
              </div>
              
              <div style={{ fontSize: '18px', fontWeight: '700', color: status.color, marginBottom: '4px' }}>
                {metric.value}
              </div>
              
              <div style={{ fontSize: '9px', color: '#969696' }}>
                {metric.description}
              </div>
              
              {showDetails === metric.key && (
                <div style={{ 
                  marginTop: '8px', 
                  padding: '8px', 
                  background: '#2d2d30', 
                  borderRadius: '2px',
                  fontSize: '9px',
                  color: '#cccccc'
                }}>
                  <div>Status: <span style={{ color: status.color, fontWeight: '600' }}>
                    {status.status.toUpperCase()}
                  </span></div>
                  <div style={{ marginTop: '4px' }}>
                    Raw value: {
                      metric.key === 'cacheHitRate' ? metrics.cacheHitRate.toFixed(4) :
                      metric.key === 'memoryUsage' ? metrics.memoryUsage.toLocaleString() + ' bytes' :
                      metric.key === 'averageKeyLookupTime' ? metrics.averageKeyLookupTime.toFixed(4) + ' ms' :
                      metrics.initTime.toFixed(4) + ' ms'
                    }
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Translation activity */}
      <div style={{
        background: '#252526',
        padding: '15px',
        borderRadius: '4px',
        border: '1px solid #3c3c3c',
        marginBottom: '20px'
      }}>
        <h5 style={{ margin: '0 0 15px 0', color: '#9cdcfe', fontSize: '12px' }}>
          Translation Activity
        </h5>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
          <div style={{
            padding: '10px',
            background: '#2d2d30',
            borderRadius: '3px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '16px', fontWeight: '700', color: '#4ec9b0', marginBottom: '4px' }}>
              {formatTime(metrics.translationTime)}
            </div>
            <div style={{ fontSize: '9px', color: '#969696' }}>
              Total Translation Time
            </div>
          </div>
          
          <div style={{
            padding: '10px',
            background: '#2d2d30',
            borderRadius: '3px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '16px', fontWeight: '700', color: '#f48771', marginBottom: '4px' }}>
              {metrics.missedTranslationsCount.toLocaleString()}
            </div>
            <div style={{ fontSize: '9px', color: '#969696' }}>
              Missed Translations
            </div>
          </div>
        </div>
      </div>

      {/* Bundle load times */}
      <div style={{
        background: '#252526',
        padding: '15px',
        borderRadius: '4px',
        border: '1px solid #3c3c3c',
        marginBottom: '20px'
      }}>
        <h5 style={{ margin: '0 0 15px 0', color: '#9cdcfe', fontSize: '12px' }}>
          Bundle Load Performance
        </h5>
        
        {Object.keys(metrics.bundleLoadTime).length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {Object.entries(metrics.bundleLoadTime)
              .sort(([,a], [,b]) => b - a)
              .slice(0, 10)
              .map(([namespace, time]) => {
                const maxTime = Math.max(...Object.values(metrics.bundleLoadTime));
                const widthPercentage = (time / maxTime) * 100;
                const timeStatus = getPerformanceStatus('bundleLoadTime', time);
                
                return (
                  <div key={namespace} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ minWidth: '80px', fontSize: '10px', color: '#4ec9b0', fontWeight: '500' }}>
                      {namespace}
                    </div>
                    
                    <div style={{ 
                      flex: 1, 
                      background: '#2d2d30', 
                      borderRadius: '3px', 
                      height: '16px', 
                      position: 'relative'
                    }}>
                      <div style={{
                        width: `${widthPercentage}%`,
                        height: '100%',
                        background: timeStatus.color,
                        borderRadius: '3px',
                        transition: 'width 0.3s ease'
                      }} />
                      <div style={{
                        position: 'absolute',
                        top: '50%',
                        left: '6px',
                        transform: 'translateY(-50%)',
                        fontSize: '8px',
                        fontWeight: '600',
                        color: widthPercentage > 30 ? '#ffffff' : '#cccccc'
                      }}>
                        {formatTime(time)}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        ) : (
          <div style={{ textAlign: 'center', color: '#969696', fontSize: '10px', padding: '20px' }}>
            No bundle load time data available
          </div>
        )}
      </div>

      {/* Performance recommendations */}
      <div style={{
        background: '#252526',
        padding: '15px',
        borderRadius: '4px',
        border: '1px solid #3c3c3c'
      }}>
        <h5 style={{ margin: '0 0 15px 0', color: '#9cdcfe', fontSize: '12px' }}>
          💡 Performance Recommendations
        </h5>
        
        <div style={{ display: 'grid', gap: '10px' }}>
          {/* Initialization performance */}
          {metrics.initTime > 200 && (
            <div style={{
              padding: '10px',
              background: '#5a1d1d',
              borderRadius: '3px',
              border: '1px solid #f48771'
            }}>
              <div style={{ color: '#f48771', fontSize: '11px', fontWeight: '600', marginBottom: '4px' }}>
                🐌 Slow Initialization ({formatTime(metrics.initTime)})
              </div>
              <div style={{ fontSize: '10px', color: '#cccccc' }}>
                Consider lazy loading translations or reducing the initial bundle size.
              </div>
            </div>
          )}
          
          {/* Cache performance */}
          {metrics.cacheHitRate < 0.8 && (
            <div style={{
              padding: '10px',
              background: '#2d2d30',
              borderRadius: '3px',
              border: '1px solid #d19a66'
            }}>
              <div style={{ color: '#d19a66', fontSize: '11px', fontWeight: '600', marginBottom: '4px' }}>
                📦 Low Cache Hit Rate ({formatPercentage(metrics.cacheHitRate)})
              </div>
              <div style={{ fontSize: '10px', color: '#cccccc' }}>
                Optimize caching strategy or increase cache size to improve performance.
              </div>
            </div>
          )}
          
          {/* Memory usage */}
          {metrics.memoryUsage > 10 * 1024 * 1024 && (
            <div style={{
              padding: '10px',
              background: '#2d2d30',
              borderRadius: '3px',
              border: '1px solid #d19a66'
            }}>
              <div style={{ color: '#d19a66', fontSize: '11px', fontWeight: '600', marginBottom: '4px' }}>
                🧠 High Memory Usage ({formatBytes(metrics.memoryUsage)})
              </div>
              <div style={{ fontSize: '10px', color: '#cccccc' }}>
                Consider implementing more aggressive garbage collection or reducing bundle sizes.
              </div>
            </div>
          )}
          
          {/* Missing translations */}
          {metrics.missedTranslationsCount > 50 && (
            <div style={{
              padding: '10px',
              background: '#2d2d30',
              borderRadius: '3px',
              border: '1px solid #f48771'
            }}>
              <div style={{ color: '#f48771', fontSize: '11px', fontWeight: '600', marginBottom: '4px' }}>
                ❌ High Miss Rate ({metrics.missedTranslationsCount} misses)
              </div>
              <div style={{ fontSize: '10px', color: '#cccccc' }}>
                Review missing translation keys to improve user experience and reduce fallbacks.
              </div>
            </div>
          )}
          
          {/* Good performance */}
          {metrics.initTime <= 50 && metrics.cacheHitRate >= 0.9 && metrics.averageKeyLookupTime <= 1 && (
            <div style={{
              padding: '10px',
              background: '#1e5f1e',
              borderRadius: '3px',
              border: '1px solid #4ec9b0'
            }}>
              <div style={{ color: '#4ec9b0', fontSize: '11px', fontWeight: '600', marginBottom: '4px' }}>
                ✅ Excellent Performance
              </div>
              <div style={{ fontSize: '10px', color: '#cccccc' }}>
                Your i18n system is performing optimally across all key metrics.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Technical details */}
      <div style={{
        marginTop: '20px',
        padding: '12px',
        background: '#252526',
        borderRadius: '4px',
        border: '1px solid #3c3c3c',
        fontSize: '9px',
        color: '#969696'
      }}>
        <div style={{ marginBottom: '6px', color: '#9cdcfe', fontWeight: '600' }}>
          Technical Details:
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px' }}>
          <div>Measurement Time: {new Date().toLocaleTimeString()}</div>
          <div>Timeframe: {selectedTimeframe === 'realtime' ? 'Real-time' : selectedTimeframe}</div>
          <div>Bundles Tracked: {Object.keys(metrics.bundleLoadTime).length}</div>
        </div>
      </div>
    </div>
  );
}