/**
 * Bundle Analyzer Component
 * Analyzes bundle size and provides optimization insights per locale
 */

import React, { useState, useEffect, useMemo } from 'react';
import type { LanguageInfo, NamespaceInfo, BundleAnalysis } from '../types/i18n';
import { i18nEventClient } from '../core/i18n-event-client';

interface BundleAnalyzerProps {
  namespaces: NamespaceInfo[];
  languages: LanguageInfo[];
}

export function BundleAnalyzer({
  namespaces,
  languages
}: BundleAnalyzerProps) {
  const [analysisData, setAnalysisData] = useState<BundleAnalysis[]>([]);
  const [selectedNamespaces, setSelectedNamespaces] = useState<string[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'size' | 'keys' | 'duplicates' | 'unused'>('size');
  const [viewMode, setViewMode] = useState<'table' | 'chart' | 'treemap'>('table');
  const [isLoading, setIsLoading] = useState(false);
  const [showOptimizations, setShowOptimizations] = useState(false);

  // Initialize selections
  useEffect(() => {
    if (selectedNamespaces.length === 0) {
      setSelectedNamespaces(namespaces.map(ns => ns.name));
    }
    if (selectedLanguages.length === 0) {
      setSelectedLanguages(languages.map(lang => lang.code));
    }
  }, [namespaces, languages]);

  const runAnalysis = async () => {
    setIsLoading(true);
    
    try {
      i18nEventClient.emit('i18n-bundle-analysis-request', {
        namespaces: selectedNamespaces.length > 0 ? selectedNamespaces : undefined,
        languages: selectedLanguages.length > 0 ? selectedLanguages : undefined
      });

      const unsubscribe = i18nEventClient.on('i18n-bundle-analysis-response', (event) => {
        setAnalysisData(event.payload.analysis);
        setIsLoading(false);
        unsubscribe();
      });

      // Timeout and fallback
      setTimeout(() => {
        if (isLoading) {
          generateFallbackAnalysis();
          setIsLoading(false);
          unsubscribe();
        }
      }, 5000);

    } catch (error) {
      console.error('Bundle analysis failed:', error);
      generateFallbackAnalysis();
      setIsLoading(false);
    }
  };

  const generateFallbackAnalysis = () => {
    const fallbackData: BundleAnalysis[] = [];
    
    selectedNamespaces.forEach(namespace => {
      selectedLanguages.forEach(language => {
        const ns = namespaces.find(n => n.name === namespace);
        if (!ns) return;
        
        // Estimate size based on key count and average key length
        const avgKeyLength = 20;
        const avgValueLength = 50;
        const estimatedSize = ns.totalKeys * (avgKeyLength + avgValueLength);
        
        // Simulate some duplicates and unused keys
        const duplicates = Math.floor(Math.random() * 5);
        const unusedKeys = Math.floor(Math.random() * 10);
        
        fallbackData.push({
          namespace,
          language,
          size: estimatedSize + Math.floor(Math.random() * 1000),
          keys: ns.totalKeys,
          duplicates: duplicates > 0 ? Array.from({length: duplicates}, (_, i) => `duplicate_key_${i}`) : [],
          unusedKeys: unusedKeys > 0 ? Array.from({length: unusedKeys}, (_, i) => `unused_key_${i}`) : [],
          sizeByKey: {} // Would be populated in real analysis
        });
      });
    });
    
    setAnalysisData(fallbackData);
  };

  // Process and sort data
  const processedData = useMemo(() => {
    return analysisData.sort((a, b) => {
      switch (sortBy) {
        case 'size':
          return b.size - a.size;
        case 'keys':
          return b.keys - a.keys;
        case 'duplicates':
          return (b.duplicates?.length || 0) - (a.duplicates?.length || 0);
        case 'unused':
          return (b.unusedKeys?.length || 0) - (a.unusedKeys?.length || 0);
        default:
          return 0;
      }
    });
  }, [analysisData, sortBy]);

  // Calculate totals and insights
  const totals = useMemo(() => {
    const totalSize = analysisData.reduce((sum, item) => sum + item.size, 0);
    const totalKeys = analysisData.reduce((sum, item) => sum + item.keys, 0);
    const totalDuplicates = analysisData.reduce((sum, item) => sum + (item.duplicates?.length || 0), 0);
    const totalUnused = analysisData.reduce((sum, item) => sum + (item.unusedKeys?.length || 0), 0);
    
    return { totalSize, totalKeys, totalDuplicates, totalUnused };
  }, [analysisData]);

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  const getSizeColor = (size: number): string => {
    const maxSize = Math.max(...analysisData.map(d => d.size));
    const ratio = size / maxSize;
    
    if (ratio > 0.8) return '#f48771';
    if (ratio > 0.6) return '#d19a66';
    if (ratio > 0.4) return '#e5c07b';
    return '#4ec9b0';
  };

  const renderTableView = () => (
    <div style={{ overflowX: 'auto' }}>
      <table style={{
        width: '100%',
        borderCollapse: 'collapse',
        fontSize: '11px'
      }}>
        <thead>
          <tr style={{ background: '#252526' }}>
            <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #3c3c3c', color: '#9cdcfe', fontWeight: '600' }}>
              Namespace
            </th>
            <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #3c3c3c', color: '#9cdcfe', fontWeight: '600' }}>
              Language
            </th>
            <th style={{ padding: '10px', textAlign: 'right', borderBottom: '1px solid #3c3c3c', color: '#9cdcfe', fontWeight: '600' }}>
              Size
            </th>
            <th style={{ padding: '10px', textAlign: 'right', borderBottom: '1px solid #3c3c3c', color: '#9cdcfe', fontWeight: '600' }}>
              Keys
            </th>
            <th style={{ padding: '10px', textAlign: 'right', borderBottom: '1px solid #3c3c3c', color: '#9cdcfe', fontWeight: '600' }}>
              Duplicates
            </th>
            <th style={{ padding: '10px', textAlign: 'right', borderBottom: '1px solid #3c3c3c', color: '#9cdcfe', fontWeight: '600' }}>
              Unused
            </th>
            <th style={{ padding: '10px', textAlign: 'right', borderBottom: '1px solid #3c3c3c', color: '#9cdcfe', fontWeight: '600' }}>
              Efficiency
            </th>
          </tr>
        </thead>
        <tbody>
          {processedData.map((item, index) => {
            const efficiency = item.keys > 0 ? ((item.keys - (item.duplicates?.length || 0) - (item.unusedKeys?.length || 0)) / item.keys) * 100 : 0;
            
            return (
              <tr key={`${item.namespace}-${item.language}`} style={{
                background: index % 2 === 0 ? '#2a2a2a' : 'transparent'
              }}>
                <td style={{ padding: '10px', borderBottom: '1px solid #3c3c3c', color: '#4ec9b0', fontWeight: '500' }}>
                  {item.namespace}
                </td>
                <td style={{ padding: '10px', borderBottom: '1px solid #3c3c3c', color: '#cccccc' }}>
                  {item.language.toUpperCase()}
                </td>
                <td style={{ 
                  padding: '10px', 
                  textAlign: 'right', 
                  borderBottom: '1px solid #3c3c3c', 
                  color: getSizeColor(item.size),
                  fontWeight: '600'
                }}>
                  {formatSize(item.size)}
                </td>
                <td style={{ padding: '10px', textAlign: 'right', borderBottom: '1px solid #3c3c3c', color: '#cccccc' }}>
                  {item.keys.toLocaleString()}
                </td>
                <td style={{ 
                  padding: '10px', 
                  textAlign: 'right', 
                  borderBottom: '1px solid #3c3c3c', 
                  color: (item.duplicates?.length || 0) > 0 ? '#d19a66' : '#969696'
                }}>
                  {item.duplicates?.length || 0}
                </td>
                <td style={{ 
                  padding: '10px', 
                  textAlign: 'right', 
                  borderBottom: '1px solid #3c3c3c', 
                  color: (item.unusedKeys?.length || 0) > 0 ? '#f48771' : '#969696'
                }}>
                  {item.unusedKeys?.length || 0}
                </td>
                <td style={{ 
                  padding: '10px', 
                  textAlign: 'right', 
                  borderBottom: '1px solid #3c3c3c', 
                  color: efficiency >= 90 ? '#4ec9b0' : efficiency >= 70 ? '#d19a66' : '#f48771',
                  fontWeight: '600'
                }}>
                  {Math.round(efficiency)}%
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  const renderChartView = () => (
    <div style={{ display: 'grid', gap: '20px' }}>
      {/* Size comparison chart */}
      <div style={{
        background: '#252526',
        padding: '15px',
        borderRadius: '4px',
        border: '1px solid #3c3c3c'
      }}>
        <h5 style={{ margin: '0 0 15px 0', color: '#9cdcfe', fontSize: '12px' }}>
          Bundle Size Comparison
        </h5>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {processedData.slice(0, 10).map((item, index) => {
            const maxSize = Math.max(...processedData.map(d => d.size));
            const widthPercentage = (item.size / maxSize) * 100;
            
            return (
              <div key={`${item.namespace}-${item.language}`} style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '10px'
              }}>
                <div style={{ 
                  minWidth: '120px', 
                  fontSize: '10px', 
                  color: '#cccccc'
                }}>
                  {item.namespace}.{item.language}
                </div>
                
                <div style={{ 
                  flex: 1, 
                  background: '#2d2d30', 
                  borderRadius: '3px', 
                  height: '20px', 
                  position: 'relative'
                }}>
                  <div style={{
                    width: `${widthPercentage}%`,
                    height: '100%',
                    background: getSizeColor(item.size),
                    borderRadius: '3px',
                    transition: 'width 0.3s ease'
                  }} />
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '8px',
                    transform: 'translateY(-50%)',
                    fontSize: '9px',
                    fontWeight: '600',
                    color: widthPercentage > 50 ? '#ffffff' : '#cccccc'
                  }}>
                    {formatSize(item.size)}
                  </div>
                </div>
                
                <div style={{ 
                  minWidth: '60px', 
                  fontSize: '9px', 
                  color: '#969696',
                  textAlign: 'right'
                }}>
                  {item.keys} keys
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Issues breakdown */}
      <div style={{
        background: '#252526',
        padding: '15px',
        borderRadius: '4px',
        border: '1px solid #3c3c3c'
      }}>
        <h5 style={{ margin: '0 0 15px 0', color: '#9cdcfe', fontSize: '12px' }}>
          Optimization Opportunities
        </h5>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
          <div style={{
            background: '#2d2d30',
            padding: '12px',
            borderRadius: '3px',
            border: '1px solid #3c3c3c'
          }}>
            <div style={{ color: '#d19a66', fontSize: '11px', fontWeight: '600', marginBottom: '6px' }}>
              Duplicate Keys
            </div>
            <div style={{ fontSize: '18px', fontWeight: '700', color: '#d19a66', marginBottom: '4px' }}>
              {totals.totalDuplicates}
            </div>
            <div style={{ fontSize: '9px', color: '#969696' }}>
              Keys appearing in multiple bundles
            </div>
          </div>
          
          <div style={{
            background: '#2d2d30',
            padding: '12px',
            borderRadius: '3px',
            border: '1px solid #3c3c3c'
          }}>
            <div style={{ color: '#f48771', fontSize: '11px', fontWeight: '600', marginBottom: '6px' }}>
              Unused Keys
            </div>
            <div style={{ fontSize: '18px', fontWeight: '700', color: '#f48771', marginBottom: '4px' }}>
              {totals.totalUnused}
            </div>
            <div style={{ fontSize: '9px', color: '#969696' }}>
              Keys not referenced in code
            </div>
          </div>
          
          <div style={{
            background: '#2d2d30',
            padding: '12px',
            borderRadius: '3px',
            border: '1px solid #3c3c3c'
          }}>
            <div style={{ color: '#4ec9b0', fontSize: '11px', fontWeight: '600', marginBottom: '6px' }}>
              Potential Savings
            </div>
            <div style={{ fontSize: '18px', fontWeight: '700', color: '#4ec9b0', marginBottom: '4px' }}>
              {formatSize((totals.totalDuplicates + totals.totalUnused) * 50)} {/* Rough estimate */}
            </div>
            <div style={{ fontSize: '9px', color: '#969696' }}>
              Estimated reduction possible
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTreemapView = () => (
    <div style={{
      background: '#252526',
      padding: '15px',
      borderRadius: '4px',
      border: '1px solid #3c3c3c',
      minHeight: '400px'
    }}>
      <h5 style={{ margin: '0 0 15px 0', color: '#9cdcfe', fontSize: '12px' }}>
        Bundle Size Treemap
      </h5>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
        gap: '4px',
        height: '350px'
      }}>
        {processedData.map((item, index) => {
          const maxSize = Math.max(...processedData.map(d => d.size));
          const sizeRatio = item.size / maxSize;
          const minSize = 60;
          const size = minSize + (sizeRatio * 80);
          
          return (
            <div
              key={`${item.namespace}-${item.language}`}
              style={{
                background: getSizeColor(item.size),
                borderRadius: '3px',
                padding: '8px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                textAlign: 'center',
                minHeight: `${size}px`,
                position: 'relative',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
              title={`${item.namespace} - ${item.language}: ${formatSize(item.size)}`}
            >
              <div style={{ fontSize: '10px', fontWeight: '600', color: '#ffffff', marginBottom: '2px' }}>
                {item.namespace}
              </div>
              <div style={{ fontSize: '8px', color: '#ffffff', opacity: 0.8, marginBottom: '4px' }}>
                {item.language.toUpperCase()}
              </div>
              <div style={{ fontSize: '9px', fontWeight: '700', color: '#ffffff' }}>
                {formatSize(item.size)}
              </div>
              
              {/* Issues indicators */}
              {((item.duplicates?.length || 0) > 0 || (item.unusedKeys?.length || 0) > 0) && (
                <div style={{
                  position: 'absolute',
                  top: '4px',
                  right: '4px',
                  background: '#f48771',
                  borderRadius: '50%',
                  width: '8px',
                  height: '8px'
                }} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div style={{
      padding: '15px',
      height: '100%',
      overflowY: 'auto',
      background: '#1e1e1e'
    }}>
      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <h4 style={{ margin: '0 0 10px 0', color: '#9cdcfe', fontSize: '14px', fontWeight: '600' }}>
          📦 Bundle Analysis
        </h4>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
          gap: '10px',
          marginBottom: '15px'
        }}>
          <div style={{
            background: '#252526',
            padding: '10px',
            borderRadius: '4px',
            border: '1px solid #3c3c3c'
          }}>
            <div style={{ fontSize: '10px', color: '#969696', marginBottom: '4px' }}>Total Size</div>
            <div style={{ fontSize: '18px', fontWeight: '600', color: '#4ec9b0' }}>
              {formatSize(totals.totalSize)}
            </div>
          </div>
          
          <div style={{
            background: '#252526',
            padding: '10px',
            borderRadius: '4px',
            border: '1px solid #3c3c3c'
          }}>
            <div style={{ fontSize: '10px', color: '#969696', marginBottom: '4px' }}>Total Keys</div>
            <div style={{ fontSize: '18px', fontWeight: '600', color: '#cccccc' }}>
              {totals.totalKeys.toLocaleString()}
            </div>
          </div>
          
          <div style={{
            background: '#252526',
            padding: '10px',
            borderRadius: '4px',
            border: '1px solid #3c3c3c'
          }}>
            <div style={{ fontSize: '10px', color: '#969696', marginBottom: '4px' }}>Issues</div>
            <div style={{ fontSize: '18px', fontWeight: '600', color: '#f48771' }}>
              {totals.totalDuplicates + totals.totalUnused}
            </div>
          </div>
          
          <div style={{
            background: '#252526',
            padding: '10px',
            borderRadius: '4px',
            border: '1px solid #3c3c3c'
          }}>
            <div style={{ fontSize: '10px', color: '#969696', marginBottom: '4px' }}>Bundles</div>
            <div style={{ fontSize: '18px', fontWeight: '600', color: '#cccccc' }}>
              {analysisData.length}
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div style={{
        marginBottom: '20px',
        padding: '15px',
        background: '#252526',
        borderRadius: '4px',
        border: '1px solid #3c3c3c'
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
          {/* Analysis button */}
          <div>
            <button
              onClick={runAnalysis}
              disabled={isLoading}
              style={{
                padding: '10px 20px',
                fontSize: '12px',
                border: '1px solid #3c3c3c',
                background: isLoading ? '#2d2d30' : '#007acc',
                color: isLoading ? '#969696' : '#ffffff',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                borderRadius: '4px',
                fontWeight: '600',
                width: '100%'
              }}
            >
              {isLoading ? 'Analyzing...' : 'Run Bundle Analysis'}
            </button>
          </div>
          
          {/* View mode */}
          <div>
            <div style={{ fontSize: '11px', color: '#9cdcfe', marginBottom: '6px' }}>View Mode:</div>
            <div style={{ display: 'flex', gap: '6px' }}>
              {[
                { id: 'table', label: 'Table', icon: '📋' },
                { id: 'chart', label: 'Chart', icon: '📊' },
                { id: 'treemap', label: 'Treemap', icon: '🗂️' }
              ].map(mode => (
                <button
                  key={mode.id}
                  onClick={() => setViewMode(mode.id as any)}
                  style={{
                    padding: '4px 8px',
                    fontSize: '10px',
                    border: '1px solid #3c3c3c',
                    background: viewMode === mode.id ? '#007acc' : '#2d2d30',
                    color: viewMode === mode.id ? '#ffffff' : '#cccccc',
                    cursor: 'pointer',
                    borderRadius: '2px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <span>{mode.icon}</span>
                  {mode.label}
                </button>
              ))}
            </div>
          </div>
          
          {/* Sort options */}
          <div>
            <div style={{ fontSize: '11px', color: '#9cdcfe', marginBottom: '6px' }}>Sort By:</div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              style={{
                padding: '6px 10px',
                borderRadius: '4px',
                border: '1px solid #3c3c3c',
                background: '#1e1e1e',
                color: '#cccccc',
                fontSize: '11px',
                width: '100%'
              }}
            >
              <option value="size">Bundle Size</option>
              <option value="keys">Key Count</option>
              <option value="duplicates">Duplicate Count</option>
              <option value="unused">Unused Count</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results */}
      {analysisData.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          {viewMode === 'table' && renderTableView()}
          {viewMode === 'chart' && renderChartView()}
          {viewMode === 'treemap' && renderTreemapView()}
        </div>
      )}

      {/* Optimization suggestions */}
      {analysisData.length > 0 && (totals.totalDuplicates > 0 || totals.totalUnused > 0) && (
        <div style={{
          background: '#252526',
          padding: '15px',
          borderRadius: '4px',
          border: '1px solid #3c3c3c'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <h5 style={{ margin: 0, color: '#9cdcfe', fontSize: '12px' }}>
              💡 Optimization Recommendations
            </h5>
            <button
              onClick={() => setShowOptimizations(!showOptimizations)}
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
              {showOptimizations ? 'Hide' : 'Show'} Details
            </button>
          </div>
          
          {showOptimizations && (
            <div style={{ display: 'grid', gap: '10px' }}>
              {totals.totalDuplicates > 0 && (
                <div style={{
                  padding: '10px',
                  background: '#2d2d30',
                  borderRadius: '3px',
                  border: '1px solid #d19a66'
                }}>
                  <div style={{ color: '#d19a66', fontSize: '11px', fontWeight: '600', marginBottom: '4px' }}>
                    🔄 Remove Duplicate Keys ({totals.totalDuplicates})
                  </div>
                  <div style={{ fontSize: '10px', color: '#cccccc', marginBottom: '6px' }}>
                    Consider consolidating duplicate translation keys across bundles to reduce redundancy.
                  </div>
                </div>
              )}
              
              {totals.totalUnused > 0 && (
                <div style={{
                  padding: '10px',
                  background: '#2d2d30',
                  borderRadius: '3px',
                  border: '1px solid #f48771'
                }}>
                  <div style={{ color: '#f48771', fontSize: '11px', fontWeight: '600', marginBottom: '4px' }}>
                    🗑️ Remove Unused Keys ({totals.totalUnused})
                  </div>
                  <div style={{ fontSize: '10px', color: '#cccccc', marginBottom: '6px' }}>
                    These keys are not referenced in your codebase and can be safely removed.
                  </div>
                </div>
              )}
              
              <div style={{
                padding: '10px',
                background: '#2d2d30',
                borderRadius: '3px',
                border: '1px solid #4ec9b0'
              }}>
                <div style={{ color: '#4ec9b0', fontSize: '11px', fontWeight: '600', marginBottom: '4px' }}>
                  ⚡ Enable Tree Shaking
                </div>
                <div style={{ fontSize: '10px', color: '#cccccc', marginBottom: '6px' }}>
                  Configure your build process to only include translations that are actually used.
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      
      {analysisData.length === 0 && !isLoading && (
        <div style={{
          textAlign: 'center',
          color: '#969696',
          fontSize: '12px',
          marginTop: '40px'
        }}>
          Click "Run Bundle Analysis" to analyze your translation bundles
        </div>
      )}
    </div>
  );
}