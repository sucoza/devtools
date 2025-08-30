/**
 * Coverage Visualization Component
 * Displays translation coverage metrics with heat maps and charts
 */

import React, { useState, useMemo } from 'react';
import type { LanguageInfo, NamespaceInfo } from '../types/i18n';

interface CoverageVisualizationProps {
  namespaces: NamespaceInfo[];
  languages: LanguageInfo[];
}

export function CoverageVisualization({
  namespaces,
  languages
}: CoverageVisualizationProps) {
  const [viewMode, setViewMode] = useState<'heatmap' | 'charts' | 'table'>('heatmap');
  const [selectedNamespace, setSelectedNamespace] = useState<string | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);

  // Calculate coverage matrix
  const _coverageMatrix = useMemo(() => {
    const matrix: Record<string, Record<string, number>> = {};
    
    namespaces.forEach(ns => {
      matrix[ns.name] = { ...ns.translationCoverage };
    });
    
    return matrix;
  }, [namespaces]);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalKeys = namespaces.reduce((sum, ns) => sum + ns.totalKeys, 0);
    const averageCompleteness = languages.length > 0
      ? languages.reduce((sum, lang) => sum + lang.completeness, 0) / languages.length
      : 0;
    
    const completeLanguages = languages.filter(lang => lang.completeness >= 95).length;
    const completeNamespaces = namespaces.filter(ns => {
      const avgCoverage = Object.values(ns.translationCoverage).reduce((sum, cov) => sum + cov, 0) / Object.values(ns.translationCoverage).length;
      return avgCoverage >= 95;
    }).length;
    
    return {
      totalKeys,
      totalNamespaces: namespaces.length,
      totalLanguages: languages.length,
      averageCompleteness: Math.round(averageCompleteness),
      completeLanguages,
      completeNamespaces
    };
  }, [namespaces, languages]);

  const getCoverageColor = (coverage: number): string => {
    if (coverage >= 95) return '#4ec9b0';
    if (coverage >= 80) return '#d19a66';
    if (coverage >= 60) return '#e5c07b';
    if (coverage >= 40) return '#f48771';
    return '#5a1d1d';
  };

  const getCoverageIntensity = (coverage: number): number => {
    return Math.max(0.1, coverage / 100);
  };

  const renderHeatMap = () => (
    <div style={{ overflowX: 'auto', overflowY: 'auto' }}>
      <div style={{ 
        display: 'inline-block',
        minWidth: `${Math.max(600, languages.length * 80)}px`,
        minHeight: `${Math.max(400, namespaces.length * 40)}px`
      }}>
        {/* Header row */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: `200px repeat(${languages.length}, 1fr)`,
          gap: '2px',
          marginBottom: '2px'
        }}>
          <div style={{
            padding: '8px',
            background: '#252526',
            fontSize: '11px',
            fontWeight: '600',
            color: '#9cdcfe',
            borderRadius: '2px'
          }}>
            Namespace
          </div>
          {languages.map(lang => (
            <div
              key={lang.code}
              onClick={() => setSelectedLanguage(selectedLanguage === lang.code ? null : lang.code)}
              style={{
                padding: '8px',
                background: selectedLanguage === lang.code ? '#094771' : '#252526',
                fontSize: '11px',
                fontWeight: '600',
                color: selectedLanguage === lang.code ? '#ffffff' : '#cccccc',
                cursor: 'pointer',
                textAlign: 'center',
                borderRadius: '2px',
                border: '1px solid',
                borderColor: selectedLanguage === lang.code ? '#007acc' : 'transparent'
              }}
            >
              <div>{lang.code.toUpperCase()}</div>
              <div style={{ fontSize: '9px', color: '#969696' }}>
                {Math.round(lang.completeness)}%
              </div>
            </div>
          ))}
        </div>

        {/* Data rows */}
        {namespaces.map(ns => (
          <div
            key={ns.name}
            style={{
              display: 'grid',
              gridTemplateColumns: `200px repeat(${languages.length}, 1fr)`,
              gap: '2px',
              marginBottom: '2px'
            }}
          >
            <div
              onClick={() => setSelectedNamespace(selectedNamespace === ns.name ? null : ns.name)}
              style={{
                padding: '8px',
                background: selectedNamespace === ns.name ? '#094771' : '#2d2d30',
                fontSize: '11px',
                fontWeight: '500',
                color: selectedNamespace === ns.name ? '#ffffff' : '#4ec9b0',
                cursor: 'pointer',
                borderRadius: '2px',
                border: '1px solid',
                borderColor: selectedNamespace === ns.name ? '#007acc' : 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <span>{ns.name}</span>
              <span style={{ fontSize: '9px', color: '#969696' }}>
                {ns.totalKeys} keys
              </span>
            </div>
            
            {languages.map(lang => {
              const coverage = ns.translationCoverage[lang.code] || 0;
              const intensity = getCoverageIntensity(coverage);
              const color = getCoverageColor(coverage);
              
              return (
                <div
                  key={lang.code}
                  style={{
                    padding: '8px',
                    background: `${color}${Math.round(intensity * 255).toString(16).padStart(2, '0')}`,
                    border: '1px solid',
                    borderColor: color,
                    borderRadius: '2px',
                    fontSize: '11px',
                    fontWeight: '600',
                    color: coverage > 50 ? '#ffffff' : '#cccccc',
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.05)';
                    e.currentTarget.style.zIndex = '10';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.zIndex = '1';
                  }}
                  title={`${ns.name} - ${lang.code}: ${Math.round(coverage)}%`}
                >
                  {Math.round(coverage)}%
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );

  const renderCharts = () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
      {/* Language completeness chart */}
      <div style={{
        background: '#252526',
        padding: '15px',
        borderRadius: '4px',
        border: '1px solid #3c3c3c'
      }}>
        <h5 style={{ margin: '0 0 15px 0', color: '#9cdcfe', fontSize: '12px' }}>
          Language Completeness
        </h5>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {languages
            .sort((a, b) => b.completeness - a.completeness)
            .map(lang => (
              <div key={lang.code} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ 
                  minWidth: '40px', 
                  fontSize: '11px', 
                  color: '#cccccc',
                  fontWeight: '600'
                }}>
                  {lang.code.toUpperCase()}
                </div>
                
                <div style={{ flex: 1, background: '#2d2d30', borderRadius: '3px', height: '20px', position: 'relative' }}>
                  <div style={{
                    width: `${lang.completeness}%`,
                    height: '100%',
                    background: getCoverageColor(lang.completeness),
                    borderRadius: '3px',
                    transition: 'width 0.3s ease'
                  }} />
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '8px',
                    transform: 'translateY(-50%)',
                    fontSize: '10px',
                    fontWeight: '600',
                    color: lang.completeness > 50 ? '#ffffff' : '#cccccc'
                  }}>
                    {Math.round(lang.completeness)}%
                  </div>
                </div>
                
                <div style={{ 
                  minWidth: '60px', 
                  fontSize: '10px', 
                  color: '#969696',
                  textAlign: 'right'
                }}>
                  {lang.translatedKeys}/{lang.totalKeys}
                </div>
              </div>
            ))
          }
        </div>
      </div>

      {/* Namespace coverage chart */}
      <div style={{
        background: '#252526',
        padding: '15px',
        borderRadius: '4px',
        border: '1px solid #3c3c3c'
      }}>
        <h5 style={{ margin: '0 0 15px 0', color: '#9cdcfe', fontSize: '12px' }}>
          Namespace Coverage
        </h5>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {namespaces
            .sort((a, b) => {
              const aAvg = Object.values(a.translationCoverage).reduce((sum, cov) => sum + cov, 0) / Object.values(a.translationCoverage).length;
              const bAvg = Object.values(b.translationCoverage).reduce((sum, cov) => sum + cov, 0) / Object.values(b.translationCoverage).length;
              return bAvg - aAvg;
            })
            .map(ns => {
              const averageCoverage = Object.values(ns.translationCoverage).reduce((sum, cov) => sum + cov, 0) / Object.values(ns.translationCoverage).length;
              
              return (
                <div key={ns.name} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ 
                    minWidth: '80px', 
                    fontSize: '11px', 
                    color: '#4ec9b0',
                    fontWeight: '500'
                  }}>
                    {ns.name}
                  </div>
                  
                  <div style={{ flex: 1, background: '#2d2d30', borderRadius: '3px', height: '20px', position: 'relative' }}>
                    <div style={{
                      width: `${averageCoverage}%`,
                      height: '100%',
                      background: getCoverageColor(averageCoverage),
                      borderRadius: '3px',
                      transition: 'width 0.3s ease'
                    }} />
                    <div style={{
                      position: 'absolute',
                      top: '50%',
                      left: '8px',
                      transform: 'translateY(-50%)',
                      fontSize: '10px',
                      fontWeight: '600',
                      color: averageCoverage > 50 ? '#ffffff' : '#cccccc'
                    }}>
                      {Math.round(averageCoverage)}%
                    </div>
                  </div>
                  
                  <div style={{ 
                    minWidth: '60px', 
                    fontSize: '10px', 
                    color: '#969696',
                    textAlign: 'right'
                  }}>
                    {ns.totalKeys} keys
                  </div>
                </div>
              );
            })
          }
        </div>
      </div>

      {/* Coverage distribution */}
      <div style={{
        background: '#252526',
        padding: '15px',
        borderRadius: '4px',
        border: '1px solid #3c3c3c'
      }}>
        <h5 style={{ margin: '0 0 15px 0', color: '#9cdcfe', fontSize: '12px' }}>
          Coverage Distribution
        </h5>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
          {[
            { label: '95-100%', min: 95, max: 100, color: '#4ec9b0' },
            { label: '80-94%', min: 80, max: 94, color: '#d19a66' },
            { label: '60-79%', min: 60, max: 79, color: '#e5c07b' },
            { label: '0-59%', min: 0, max: 59, color: '#f48771' }
          ].map(range => {
            const count = languages.filter(lang => 
              lang.completeness >= range.min && lang.completeness <= range.max
            ).length;
            
            return (
              <div key={range.label} style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px',
                padding: '8px',
                background: '#2d2d30',
                borderRadius: '3px'
              }}>
                <div style={{
                  width: '12px',
                  height: '12px',
                  background: range.color,
                  borderRadius: '2px'
                }} />
                <div style={{ flex: 1, fontSize: '11px', color: '#cccccc' }}>
                  {range.label}
                </div>
                <div style={{ fontSize: '11px', fontWeight: '600', color: range.color }}>
                  {count}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  const renderTable = () => (
    <div style={{ overflowX: 'auto' }}>
      <table style={{
        width: '100%',
        borderCollapse: 'collapse',
        fontSize: '11px'
      }}>
        <thead>
          <tr style={{ background: '#252526' }}>
            <th style={{ 
              padding: '10px', 
              textAlign: 'left', 
              borderBottom: '1px solid #3c3c3c',
              color: '#9cdcfe',
              fontWeight: '600'
            }}>
              Namespace
            </th>
            <th style={{ 
              padding: '10px', 
              textAlign: 'right', 
              borderBottom: '1px solid #3c3c3c',
              color: '#9cdcfe',
              fontWeight: '600'
            }}>
              Total Keys
            </th>
            {languages.map(lang => (
              <th key={lang.code} style={{ 
                padding: '10px', 
                textAlign: 'center', 
                borderBottom: '1px solid #3c3c3c',
                color: '#9cdcfe',
                fontWeight: '600'
              }}>
                {lang.code.toUpperCase()}
              </th>
            ))}
            <th style={{ 
              padding: '10px', 
              textAlign: 'center', 
              borderBottom: '1px solid #3c3c3c',
              color: '#9cdcfe',
              fontWeight: '600'
            }}>
              Average
            </th>
          </tr>
        </thead>
        <tbody>
          {namespaces.map(ns => {
            const averageCoverage = Object.values(ns.translationCoverage).reduce((sum, cov) => sum + cov, 0) / Object.values(ns.translationCoverage).length;
            
            return (
              <tr key={ns.name} style={{ 
                background: selectedNamespace === ns.name ? '#094771' : 'transparent',
                cursor: 'pointer'
              }}
              onClick={() => setSelectedNamespace(selectedNamespace === ns.name ? null : ns.name)}
              >
                <td style={{ 
                  padding: '10px', 
                  borderBottom: '1px solid #3c3c3c',
                  color: '#4ec9b0',
                  fontWeight: '500'
                }}>
                  {ns.name}
                </td>
                <td style={{ 
                  padding: '10px', 
                  textAlign: 'right',
                  borderBottom: '1px solid #3c3c3c',
                  color: '#cccccc'
                }}>
                  {ns.totalKeys}
                </td>
                {languages.map(lang => {
                  const coverage = ns.translationCoverage[lang.code] || 0;
                  return (
                    <td key={lang.code} style={{ 
                      padding: '10px', 
                      textAlign: 'center',
                      borderBottom: '1px solid #3c3c3c',
                      color: getCoverageColor(coverage),
                      fontWeight: '600'
                    }}>
                      {Math.round(coverage)}%
                    </td>
                  );
                })}
                <td style={{ 
                  padding: '10px', 
                  textAlign: 'center',
                  borderBottom: '1px solid #3c3c3c',
                  color: getCoverageColor(averageCoverage),
                  fontWeight: '600'
                }}>
                  {Math.round(averageCoverage)}%
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  return (
    <div style={{
      padding: '15px',
      height: '100%',
      overflowY: 'auto',
      background: '#1e1e1e'
    }}>
      {/* Header with stats */}
      <div style={{ marginBottom: '20px' }}>
        <h4 style={{ margin: '0 0 10px 0', color: '#9cdcfe', fontSize: '14px', fontWeight: '600' }}>
          📊 Translation Coverage Analysis
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
            <div style={{ fontSize: '10px', color: '#969696', marginBottom: '4px' }}>Avg Coverage</div>
            <div style={{ fontSize: '18px', fontWeight: '600', color: getCoverageColor(stats.averageCompleteness) }}>
              {stats.averageCompleteness}%
            </div>
          </div>
          
          <div style={{
            background: '#252526',
            padding: '10px',
            borderRadius: '4px',
            border: '1px solid #3c3c3c'
          }}>
            <div style={{ fontSize: '10px', color: '#969696', marginBottom: '4px' }}>Complete Languages</div>
            <div style={{ fontSize: '18px', fontWeight: '600', color: '#4ec9b0' }}>
              {stats.completeLanguages}/{stats.totalLanguages}
            </div>
          </div>
          
          <div style={{
            background: '#252526',
            padding: '10px',
            borderRadius: '4px',
            border: '1px solid #3c3c3c'
          }}>
            <div style={{ fontSize: '10px', color: '#969696', marginBottom: '4px' }}>Complete Namespaces</div>
            <div style={{ fontSize: '18px', fontWeight: '600', color: '#4ec9b0' }}>
              {stats.completeNamespaces}/{stats.totalNamespaces}
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
              {stats.totalKeys}
            </div>
          </div>
        </div>
      </div>

      {/* View mode selector */}
      <div style={{
        display: 'flex',
        gap: '10px',
        alignItems: 'center',
        marginBottom: '20px',
        padding: '10px',
        background: '#252526',
        borderRadius: '4px',
        border: '1px solid #3c3c3c'
      }}>
        <span style={{ color: '#9cdcfe', fontSize: '11px', fontWeight: '600' }}>View:</span>
        {[
          { id: 'heatmap', label: 'Heat Map', icon: '🎨' },
          { id: 'charts', label: 'Charts', icon: '📊' },
          { id: 'table', label: 'Table', icon: '📋' }
        ].map(mode => (
          <button
            key={mode.id}
            onClick={() => setViewMode(mode.id as 'heatmap' | 'charts' | 'table')}
            style={{
              padding: '6px 12px',
              fontSize: '11px',
              border: '1px solid #3c3c3c',
              background: viewMode === mode.id ? '#007acc' : '#2d2d30',
              color: viewMode === mode.id ? '#ffffff' : '#cccccc',
              cursor: 'pointer',
              borderRadius: '3px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>{mode.icon}</span>
            {mode.label}
          </button>
        ))}
      </div>

      {/* Legend */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '20px',
        marginBottom: '20px',
        padding: '10px',
        background: '#252526',
        borderRadius: '4px',
        border: '1px solid #3c3c3c'
      }}>
        <span style={{ fontSize: '11px', color: '#9cdcfe', fontWeight: '600' }}>Coverage:</span>
        {[
          { label: '95-100%', color: '#4ec9b0' },
          { label: '80-94%', color: '#d19a66' },
          { label: '60-79%', color: '#e5c07b' },
          { label: '40-59%', color: '#f48771' },
          { label: '<40%', color: '#5a1d1d' }
        ].map(item => (
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{
              width: '12px',
              height: '12px',
              background: item.color,
              borderRadius: '2px'
            }} />
            <span style={{ fontSize: '10px', color: '#cccccc' }}>{item.label}</span>
          </div>
        ))}
      </div>

      {/* Content */}
      <div style={{ marginBottom: '20px' }}>
        {viewMode === 'heatmap' && renderHeatMap()}
        {viewMode === 'charts' && renderCharts()}
        {viewMode === 'table' && renderTable()}
      </div>
    </div>
  );
}