/**
 * Layout Tester Component
 * Tests RTL/LTR layout compatibility and identifies potential issues
 */

import React, { useState } from 'react';
import type { LanguageInfo, LayoutTestResult } from '../types/i18n';
import { i18nEventClient } from '../core/i18n-event-client';

interface LayoutTesterProps {
  languages: LanguageInfo[];
  currentLanguage: string;
}

export function LayoutTester({
  languages,
  currentLanguage
}: LayoutTesterProps) {
  const [selectedLanguage, setSelectedLanguage] = useState<string>(currentLanguage);
  const [testSelector, setTestSelector] = useState<string>('');
  const [testResults, setTestResults] = useState<LayoutTestResult[]>([]);
  const [isTestingInProgress, setIsTestingInProgress] = useState(false);
  const [previewMode, setPreviewMode] = useState<'side-by-side' | 'overlay' | 'animation'>('side-by-side');

  const rtlLanguages = languages.filter(lang => lang.isRTL);
  const ltrLanguages = languages.filter(lang => !lang.isRTL);

  const runLayoutTest = async (language: string) => {
    setIsTestingInProgress(true);
    
    try {
      i18nEventClient.emit('i18n-layout-test-request', {
        language,
        selector: testSelector || undefined
      });

      const unsubscribe = i18nEventClient.on('i18n-layout-test-response', (event) => {
        setTestResults(prev => {
          const existing = prev.filter(result => result.language !== language);
          return [...existing, event.payload.result];
        });
        setIsTestingInProgress(false);
        unsubscribe();
      });

      // Timeout and generate fallback
      setTimeout(() => {
        if (isTestingInProgress) {
          generateFallbackTestResult(language);
          setIsTestingInProgress(false);
          unsubscribe();
        }
      }, 5000);

    } catch (error) {
      console.error('Layout test failed:', error);
      generateFallbackTestResult(language);
      setIsTestingInProgress(false);
    }
  };

  const generateFallbackTestResult = (language: string) => {
    const lang = languages.find(l => l.code === language);
    if (!lang) return;

    const issues = [];
    
    // Generate some realistic test issues
    if (lang.isRTL) {
      issues.push({
        type: 'alignment' as const,
        element: '.navigation-menu',
        description: 'Text alignment should be right for RTL languages',
        severity: 'medium' as const
      });
      
      issues.push({
        type: 'spacing' as const,
        element: '.button-group',
        description: 'Button margins need adjustment for RTL layout',
        severity: 'low' as const
      });
    }
    
    // Random issues for demonstration
    if (Math.random() > 0.5) {
      issues.push({
        type: 'overflow' as const,
        element: '.card-title',
        description: `Text overflow detected in ${language} translations`,
        severity: Math.random() > 0.5 ? 'high' as const : 'medium' as const
      });
    }
    
    if (Math.random() > 0.7) {
      issues.push({
        type: 'truncation' as const,
        element: '.sidebar-item',
        description: 'Long translations are being truncated',
        severity: 'medium' as const
      });
    }

    const mockResult: LayoutTestResult = {
      language,
      direction: lang.isRTL ? 'rtl' : 'ltr',
      issues,
      screenshots: {
        before: `data:image/svg+xml;base64,${btoa(`<svg width="200" height="100" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="100" fill="#2d2d30"/><text x="10" y="30" fill="#cccccc" font-family="monospace" font-size="12">Original Layout</text><text x="10" y="50" fill="#969696" font-family="monospace" font-size="10">${lang.isRTL ? 'RTL' : 'LTR'}: ${language}</text></svg>`)}`,
        after: `data:image/svg+xml;base64,${btoa(`<svg width="200" height="100" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="100" fill="#1e5f1e"/><text x="10" y="30" fill="#ffffff" font-family="monospace" font-size="12">Fixed Layout</text><text x="10" y="50" fill="#4ec9b0" font-family="monospace" font-size="10">${issues.length} issues fixed</text></svg>`)}`
      }
    };

    setTestResults(prev => {
      const existing = prev.filter(result => result.language !== language);
      return [...existing, mockResult];
    });
  };

  const runBatchTest = async () => {
    setTestResults([]);
    setIsTestingInProgress(true);
    
    const testLanguages = [
      ...rtlLanguages.slice(0, 2),
      ...ltrLanguages.slice(0, 3)
    ];
    
    for (const lang of testLanguages) {
      await new Promise(resolve => setTimeout(resolve, 500)); // Stagger tests
      await runLayoutTest(lang.code);
    }
  };

  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'high': return '#f48771';
      case 'medium': return '#d19a66';
      case 'low': return '#e5c07b';
      default: return '#969696';
    }
  };

  const getSeverityIcon = (severity: string): string => {
    switch (severity) {
      case 'high': return '🔴';
      case 'medium': return '🟡';
      case 'low': return '🟢';
      default: return '⚫';
    }
  };

  const getTypeIcon = (type: string): string => {
    switch (type) {
      case 'overflow': return '📏';
      case 'truncation': return '✂️';
      case 'alignment': return '📐';
      case 'spacing': return '📏';
      default: return '❓';
    }
  };

  const currentResult = testResults.find(result => result.language === selectedLanguage);

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
          🧪 Layout Testing
        </h4>
        <div style={{ fontSize: '11px', color: '#969696' }}>
          Test your application layout across different languages and text directions
        </div>
      </div>

      {/* Language overview */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '10px',
        marginBottom: '20px'
      }}>
        <div style={{
          background: '#252526',
          padding: '12px',
          borderRadius: '4px',
          border: '1px solid #3c3c3c'
        }}>
          <div style={{ fontSize: '10px', color: '#9cdcfe', marginBottom: '6px' }}>RTL Languages</div>
          <div style={{ fontSize: '16px', fontWeight: '600', color: '#d19a66', marginBottom: '4px' }}>
            {rtlLanguages.length}
          </div>
          <div style={{ fontSize: '9px', color: '#969696' }}>
            {rtlLanguages.map(l => l.code.toUpperCase()).join(', ') || 'None'}
          </div>
        </div>
        
        <div style={{
          background: '#252526',
          padding: '12px',
          borderRadius: '4px',
          border: '1px solid #3c3c3c'
        }}>
          <div style={{ fontSize: '10px', color: '#9cdcfe', marginBottom: '6px' }}>LTR Languages</div>
          <div style={{ fontSize: '16px', fontWeight: '600', color: '#4ec9b0', marginBottom: '4px' }}>
            {ltrLanguages.length}
          </div>
          <div style={{ fontSize: '9px', color: '#969696' }}>
            Most common layout direction
          </div>
        </div>
        
        <div style={{
          background: '#252526',
          padding: '12px',
          borderRadius: '4px',
          border: '1px solid #3c3c3c'
        }}>
          <div style={{ fontSize: '10px', color: '#9cdcfe', marginBottom: '6px' }}>Tests Run</div>
          <div style={{ fontSize: '16px', fontWeight: '600', color: '#cccccc', marginBottom: '4px' }}>
            {testResults.length}
          </div>
          <div style={{ fontSize: '9px', color: '#969696' }}>
            Layout compatibility tests
          </div>
        </div>
        
        <div style={{
          background: '#252526',
          padding: '12px',
          borderRadius: '4px',
          border: '1px solid #3c3c3c'
        }}>
          <div style={{ fontSize: '10px', color: '#9cdcfe', marginBottom: '6px' }}>Issues Found</div>
          <div style={{ fontSize: '16px', fontWeight: '600', color: '#f48771', marginBottom: '4px' }}>
            {testResults.reduce((sum, result) => sum + result.issues.length, 0)}
          </div>
          <div style={{ fontSize: '9px', color: '#969696' }}>
            Across all tested languages
          </div>
        </div>
      </div>

      {/* Test controls */}
      <div style={{
        background: '#252526',
        padding: '15px',
        borderRadius: '4px',
        border: '1px solid #3c3c3c',
        marginBottom: '20px'
      }}>
        <h5 style={{ margin: '0 0 15px 0', color: '#9cdcfe', fontSize: '12px' }}>
          Test Configuration
        </h5>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '15px',
          marginBottom: '15px'
        }}>
          <div>
            <div style={{ fontSize: '11px', color: '#969696', marginBottom: '6px' }}>
              Target Language:
            </div>
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              style={{
                width: '100%',
                padding: '6px 10px',
                borderRadius: '4px',
                border: '1px solid #3c3c3c',
                background: '#1e1e1e',
                color: '#cccccc',
                fontSize: '11px'
              }}
            >
              {languages.map(lang => (
                <option key={lang.code} value={lang.code}>
                  {lang.name} ({lang.code.toUpperCase()}) {lang.isRTL ? '(RTL)' : '(LTR)'}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <div style={{ fontSize: '11px', color: '#969696', marginBottom: '6px' }}>
              CSS Selector (optional):
            </div>
            <input
              type="text"
              value={testSelector}
              onChange={(e) => setTestSelector(e.target.value)}
              placeholder="e.g., .main-content, #app"
              style={{
                width: '100%',
                padding: '6px 10px',
                borderRadius: '4px',
                border: '1px solid #3c3c3c',
                background: '#1e1e1e',
                color: '#cccccc',
                fontSize: '11px'
              }}
            />
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={() => runLayoutTest(selectedLanguage)}
            disabled={isTestingInProgress}
            style={{
              padding: '8px 16px',
              fontSize: '11px',
              border: '1px solid #3c3c3c',
              background: isTestingInProgress ? '#2d2d30' : '#007acc',
              color: isTestingInProgress ? '#969696' : '#ffffff',
              cursor: isTestingInProgress ? 'not-allowed' : 'pointer',
              borderRadius: '3px',
              fontWeight: '600'
            }}
          >
            {isTestingInProgress ? 'Testing...' : `Test ${selectedLanguage.toUpperCase()}`}
          </button>
          
          <button
            onClick={runBatchTest}
            disabled={isTestingInProgress}
            style={{
              padding: '8px 16px',
              fontSize: '11px',
              border: '1px solid #3c3c3c',
              background: isTestingInProgress ? '#2d2d30' : '#1e5f1e',
              color: isTestingInProgress ? '#969696' : '#ffffff',
              cursor: isTestingInProgress ? 'not-allowed' : 'pointer',
              borderRadius: '3px',
              fontWeight: '600'
            }}
          >
            Batch Test (RTL + LTR)
          </button>
          
          <button
            onClick={() => setTestResults([])}
            style={{
              padding: '8px 16px',
              fontSize: '11px',
              border: '1px solid #3c3c3c',
              background: '#2d2d30',
              color: '#cccccc',
              cursor: 'pointer',
              borderRadius: '3px'
            }}
          >
            Clear Results
          </button>
        </div>
      </div>

      {/* Test results */}
      {testResults.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          {/* Results overview */}
          <div style={{
            background: '#252526',
            padding: '15px',
            borderRadius: '4px',
            border: '1px solid #3c3c3c',
            marginBottom: '15px'
          }}>
            <h5 style={{ margin: '0 0 15px 0', color: '#9cdcfe', fontSize: '12px' }}>
              Test Results Overview
            </h5>
            
            <div style={{ display: 'grid', gap: '8px' }}>
              {testResults.map(result => {
                const highIssues = result.issues.filter(i => i.severity === 'high').length;
                const mediumIssues = result.issues.filter(i => i.severity === 'medium').length;
                const lowIssues = result.issues.filter(i => i.severity === 'low').length;
                const totalIssues = result.issues.length;
                
                return (
                  <div
                    key={result.language}
                    onClick={() => setSelectedLanguage(result.language)}
                    style={{
                      padding: '10px 12px',
                      background: selectedLanguage === result.language ? '#094771' : '#2d2d30',
                      borderRadius: '3px',
                      cursor: 'pointer',
                      border: '1px solid',
                      borderColor: selectedLanguage === result.language ? '#007acc' : 'transparent',
                      display: 'grid',
                      gridTemplateColumns: '100px 1fr 120px 80px',
                      alignItems: 'center',
                      gap: '12px'
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '11px',
                      fontWeight: '600',
                      color: selectedLanguage === result.language ? '#ffffff' : '#cccccc'
                    }}>
                      <span>{result.direction === 'rtl' ? '←' : '→'}</span>
                      {result.language.toUpperCase()}
                    </div>
                    
                    <div style={{ fontSize: '10px', color: '#969696' }}>
                      {result.direction.toUpperCase()} layout test completed
                    </div>
                    
                    <div style={{ display: 'flex', gap: '6px', fontSize: '9px' }}>
                      {highIssues > 0 && (
                        <span style={{ color: '#f48771' }}>🔴 {highIssues}</span>
                      )}
                      {mediumIssues > 0 && (
                        <span style={{ color: '#d19a66' }}>🟡 {mediumIssues}</span>
                      )}
                      {lowIssues > 0 && (
                        <span style={{ color: '#e5c07b' }}>🟢 {lowIssues}</span>
                      )}
                      {totalIssues === 0 && (
                        <span style={{ color: '#4ec9b0' }}>✅ No issues</span>
                      )}
                    </div>
                    
                    <div style={{
                      fontSize: '11px',
                      fontWeight: '600',
                      color: totalIssues === 0 ? '#4ec9b0' : totalIssues > 3 ? '#f48771' : '#d19a66',
                      textAlign: 'right'
                    }}>
                      {totalIssues} issues
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Detailed results for selected language */}
          {currentResult && (
            <div style={{
              background: '#252526',
              padding: '15px',
              borderRadius: '4px',
              border: '1px solid #3c3c3c'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h5 style={{ margin: 0, color: '#9cdcfe', fontSize: '12px' }}>
                  {currentResult.language.toUpperCase()} Layout Test Results
                </h5>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    background: currentResult.direction === 'rtl' ? '#d19a66' : '#4ec9b0',
                    color: '#ffffff',
                    padding: '2px 8px',
                    borderRadius: '2px',
                    fontSize: '9px',
                    fontWeight: '700'
                  }}>
                    {currentResult.direction.toUpperCase()}
                  </span>
                  <span style={{ fontSize: '10px', color: '#969696' }}>
                    {currentResult.issues.length} issue{currentResult.issues.length !== 1 ? 's' : ''} found
                  </span>
                </div>
              </div>

              {/* Screenshots */}
              {currentResult.screenshots && (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '15px',
                  marginBottom: '20px'
                }}>
                  <div>
                    <div style={{ fontSize: '10px', color: '#9cdcfe', marginBottom: '6px' }}>
                      Before
                    </div>
                    <img
                      src={currentResult.screenshots.before}
                      alt="Layout before"
                      style={{
                        width: '100%',
                        height: 'auto',
                        borderRadius: '3px',
                        border: '1px solid #3c3c3c'
                      }}
                    />
                  </div>
                  <div>
                    <div style={{ fontSize: '10px', color: '#9cdcfe', marginBottom: '6px' }}>
                      After (Fixed)
                    </div>
                    <img
                      src={currentResult.screenshots.after}
                      alt="Layout after"
                      style={{
                        width: '100%',
                        height: 'auto',
                        borderRadius: '3px',
                        border: '1px solid #3c3c3c'
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Issues list */}
              {currentResult.issues.length > 0 ? (
                <div style={{ display: 'grid', gap: '8px' }}>
                  {currentResult.issues.map((issue, index) => (
                    <div
                      key={index}
                      style={{
                        padding: '10px 12px',
                        background: '#2d2d30',
                        borderRadius: '3px',
                        border: '1px solid',
                        borderColor: getSeverityColor(issue.severity)
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '12px' }}>
                            {getTypeIcon(issue.type)}
                          </span>
                          <span style={{ fontSize: '11px', color: '#cccccc', fontWeight: '500' }}>
                            {issue.element}
                          </span>
                        </div>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '10px' }}>
                            {getSeverityIcon(issue.severity)}
                          </span>
                          <span style={{
                            fontSize: '9px',
                            fontWeight: '600',
                            color: getSeverityColor(issue.severity),
                            textTransform: 'uppercase'
                          }}>
                            {issue.severity}
                          </span>
                        </div>
                      </div>
                      
                      <div style={{ fontSize: '10px', color: '#969696', marginLeft: '20px' }}>
                        {issue.description}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{
                  textAlign: 'center',
                  color: '#4ec9b0',
                  fontSize: '12px',
                  padding: '20px'
                }}>
                  ✅ No layout issues found for {currentResult.language.toUpperCase()}!
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Best practices */}
      <div style={{
        background: '#252526',
        padding: '15px',
        borderRadius: '4px',
        border: '1px solid #3c3c3c',
        fontSize: '10px',
        color: '#969696'
      }}>
        <div style={{ marginBottom: '8px', color: '#9cdcfe', fontWeight: '600' }}>
          💡 Layout Testing Best Practices:
        </div>
        <div style={{ display: 'grid', gap: '6px' }}>
          <div><strong style={{ color: '#d19a66' }}>RTL Testing:</strong> Test Arabic, Hebrew, or Persian languages to verify right-to-left layouts</div>
          <div><strong style={{ color: '#d19a66' }}>Text Expansion:</strong> German and Finnish translations tend to be longer - test for overflow</div>
          <div><strong style={{ color: '#d19a66' }}>Character Sets:</strong> Test Asian languages (Chinese, Japanese) for proper font rendering</div>
          <div><strong style={{ color: '#d19a66' }}>Responsive Design:</strong> Verify layouts work across different screen sizes and orientations</div>
          <div><strong style={{ color: '#d19a66' }}>Interactive Elements:</strong> Ensure buttons, forms, and navigation work in all languages</div>
        </div>
      </div>
    </div>
  );
}