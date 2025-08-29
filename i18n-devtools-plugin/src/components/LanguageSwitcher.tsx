/**
 * Language Switcher Component
 * Provides language switching with instant preview and RTL support
 */

import React, { useState, useCallback } from 'react';
import type { LanguageInfo } from '../types/i18n';

interface LanguageSwitcherProps {
  languages: LanguageInfo[];
  currentLanguage: string;
  onLanguageChange: (language: string) => void;
}

export function LanguageSwitcher({
  languages,
  currentLanguage,
  onLanguageChange
}: LanguageSwitcherProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'completeness' | 'code'>('completeness');
  const [showOnlyIncomplete, setShowOnlyIncomplete] = useState(false);

  const filteredAndSortedLanguages = React.useMemo(() => {
    let filtered = languages.filter(lang => {
      const matchesSearch = searchQuery.trim() === '' || 
        lang.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lang.nativeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lang.code.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesFilter = !showOnlyIncomplete || lang.completeness < 100;
      
      return matchesSearch && matchesFilter;
    });

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'code':
          return a.code.localeCompare(b.code);
        case 'completeness':
          return b.completeness - a.completeness;
        default:
          return 0;
      }
    });
  }, [languages, searchQuery, sortBy, showOnlyIncomplete]);

  const getCompletenessColor = useCallback((completeness: number): string => {
    if (completeness >= 95) return '#4ec9b0'; // Green
    if (completeness >= 80) return '#d19a66'; // Orange
    if (completeness >= 50) return '#e5c07b'; // Yellow
    return '#f48771'; // Red
  }, []);

  const getCompletenessIcon = useCallback((completeness: number): string => {
    if (completeness >= 95) return '✅';
    if (completeness >= 80) return '⚠️';
    if (completeness >= 50) return '🔸';
    return '❌';
  }, []);

  const handleLanguageSelect = useCallback((languageCode: string) => {
    onLanguageChange(languageCode);
  }, [onLanguageChange]);

  const totalLanguages = languages.length;
  const completeLanguages = languages.filter(l => l.completeness >= 95).length;
  const averageCompleteness = languages.length > 0 
    ? Math.round(languages.reduce((sum, l) => sum + l.completeness, 0) / languages.length)
    : 0;

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
          🌍 Language Management
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
            <div style={{ fontSize: '10px', color: '#969696', marginBottom: '4px' }}>Total Languages</div>
            <div style={{ fontSize: '18px', fontWeight: '600', color: '#4ec9b0' }}>{totalLanguages}</div>
          </div>
          
          <div style={{ 
            background: '#252526', 
            padding: '10px', 
            borderRadius: '4px',
            border: '1px solid #3c3c3c'
          }}>
            <div style={{ fontSize: '10px', color: '#969696', marginBottom: '4px' }}>Complete (≥95%)</div>
            <div style={{ fontSize: '18px', fontWeight: '600', color: '#4ec9b0' }}>{completeLanguages}</div>
          </div>
          
          <div style={{ 
            background: '#252526', 
            padding: '10px', 
            borderRadius: '4px',
            border: '1px solid #3c3c3c'
          }}>
            <div style={{ fontSize: '10px', color: '#969696', marginBottom: '4px' }}>Avg Completeness</div>
            <div style={{ fontSize: '18px', fontWeight: '600', color: getCompletenessColor(averageCompleteness) }}>
              {averageCompleteness}%
            </div>
          </div>
          
          <div style={{ 
            background: '#252526', 
            padding: '10px', 
            borderRadius: '4px',
            border: '1px solid #3c3c3c'
          }}>
            <div style={{ fontSize: '10px', color: '#969696', marginBottom: '4px' }}>Current Language</div>
            <div style={{ fontSize: '18px', fontWeight: '600', color: '#007acc' }}>
              {currentLanguage.toUpperCase()}
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
        <div style={{ 
          display: 'flex', 
          gap: '10px', 
          alignItems: 'center',
          flexWrap: 'wrap',
          marginBottom: '10px'
        }}>
          <input
            type="text"
            placeholder="Search languages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              flex: '1 1 200px',
              minWidth: '150px',
              padding: '6px 10px',
              borderRadius: '4px',
              border: '1px solid #3c3c3c',
              background: '#1e1e1e',
              color: '#cccccc',
              fontSize: '12px'
            }}
          />

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'name' | 'completeness' | 'code')}
            style={{
              padding: '6px 10px',
              borderRadius: '4px',
              border: '1px solid #3c3c3c',
              background: '#1e1e1e',
              color: '#cccccc',
              fontSize: '11px'
            }}
          >
            <option value="completeness">Sort by Completeness</option>
            <option value="name">Sort by Name</option>
            <option value="code">Sort by Code</option>
          </select>

          <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px' }}>
            <input
              type="checkbox"
              checked={showOnlyIncomplete}
              onChange={(e) => setShowOnlyIncomplete(e.target.checked)}
            />
            Show incomplete only
          </label>
        </div>
        
        <div style={{ fontSize: '10px', color: '#969696' }}>
          Showing {filteredAndSortedLanguages.length} of {totalLanguages} languages
        </div>
      </div>

      {/* Language Grid */}
      <div style={{ 
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '12px'
      }}>
        {filteredAndSortedLanguages.map(language => {
          const isActive = language.code === currentLanguage;
          const isComplete = language.completeness >= 95;
          
          return (
            <div
              key={language.code}
              onClick={() => handleLanguageSelect(language.code)}
              style={{
                background: isActive ? '#094771' : '#252526',
                border: '1px solid',
                borderColor: isActive ? '#007acc' : '#3c3c3c',
                borderRadius: '6px',
                padding: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                position: 'relative'
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.borderColor = '#007acc';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.borderColor = '#3c3c3c';
                  e.currentTarget.style.transform = 'translateY(0)';
                }
              }}
            >
              {/* Header */}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '8px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ 
                    fontSize: '18px',
                    fontWeight: '700',
                    color: isActive ? '#ffffff' : '#cccccc'
                  }}>
                    {language.code.toUpperCase()}
                  </span>
                  
                  {language.isRTL && (
                    <span style={{ 
                      background: '#2d2d30', 
                      color: '#d19a66', 
                      padding: '2px 6px', 
                      borderRadius: '2px',
                      fontSize: '8px',
                      fontWeight: '600'
                    }}>
                      RTL
                    </span>
                  )}
                  
                  {language.isDefault && (
                    <span style={{ 
                      background: '#2d2d30', 
                      color: '#4ec9b0', 
                      padding: '2px 6px', 
                      borderRadius: '2px',
                      fontSize: '8px',
                      fontWeight: '600'
                    }}>
                      DEFAULT
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '14px' }}>
                    {getCompletenessIcon(language.completeness)}
                  </span>
                  {isActive && (
                    <span style={{ color: '#4ec9b0', fontSize: '14px' }}>●</span>
                  )}
                </div>
              </div>

              {/* Language Names */}
              <div style={{ marginBottom: '10px' }}>
                <div style={{ 
                  fontSize: '12px', 
                  fontWeight: '600',
                  color: isActive ? '#ffffff' : '#cccccc',
                  marginBottom: '2px'
                }}>
                  {language.name}
                </div>
                <div style={{ 
                  fontSize: '11px', 
                  color: '#969696',
                  fontStyle: 'italic'
                }}>
                  {language.nativeName}
                </div>
              </div>

              {/* Progress Bar */}
              <div style={{ marginBottom: '8px' }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginBottom: '4px'
                }}>
                  <span style={{ fontSize: '10px', color: '#969696' }}>
                    Translation Progress
                  </span>
                  <span style={{ 
                    fontSize: '10px', 
                    fontWeight: '600',
                    color: getCompletenessColor(language.completeness)
                  }}>
                    {Math.round(language.completeness)}%
                  </span>
                </div>
                
                <div style={{
                  width: '100%',
                  height: '6px',
                  background: '#2d2d30',
                  borderRadius: '3px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${language.completeness}%`,
                    height: '100%',
                    background: `linear-gradient(90deg, ${getCompletenessColor(language.completeness)} 0%, ${getCompletenessColor(language.completeness)}80 100%)`,
                    transition: 'width 0.3s ease'
                  }} />
                </div>
              </div>

              {/* Stats */}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                fontSize: '10px',
                color: '#969696'
              }}>
                <span>
                  {language.translatedKeys}/{language.totalKeys} keys
                </span>
                <span>
                  {language.missingKeys.length} missing
                </span>
              </div>

              {/* Missing keys indicator */}
              {language.missingKeys.length > 0 && (
                <div style={{
                  position: 'absolute',
                  top: '8px',
                  right: '8px',
                  background: '#5a1d1d',
                  color: '#f48771',
                  padding: '2px 6px',
                  borderRadius: '10px',
                  fontSize: '8px',
                  fontWeight: '600'
                }}>
                  {language.missingKeys.length}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filteredAndSortedLanguages.length === 0 && (
        <div style={{ 
          textAlign: 'center', 
          color: '#969696', 
          fontSize: '12px',
          marginTop: '40px'
        }}>
          {searchQuery.trim() 
            ? 'No languages match your search criteria'
            : 'No languages available'
          }
        </div>
      )}

      {/* Quick Actions */}
      <div style={{ 
        marginTop: '30px',
        padding: '15px',
        background: '#252526',
        borderRadius: '4px',
        border: '1px solid #3c3c3c'
      }}>
        <h5 style={{ margin: '0 0 10px 0', color: '#9cdcfe', fontSize: '12px' }}>
          Quick Actions
        </h5>
        
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={() => {
              const incompleteLanguages = languages.filter(l => l.completeness < 100);
              if (incompleteLanguages.length > 0) {
                handleLanguageSelect(incompleteLanguages[0].code);
              }
            }}
            style={{
              padding: '6px 12px',
              fontSize: '11px',
              border: '1px solid #3c3c3c',
              background: '#2d2d30',
              color: '#cccccc',
              cursor: 'pointer',
              borderRadius: '3px'
            }}
          >
            Switch to Most Incomplete
          </button>
          
          <button
            onClick={() => {
              const rtlLanguages = languages.filter(l => l.isRTL);
              if (rtlLanguages.length > 0) {
                handleLanguageSelect(rtlLanguages[0].code);
              }
            }}
            style={{
              padding: '6px 12px',
              fontSize: '11px',
              border: '1px solid #3c3c3c',
              background: '#2d2d30',
              color: '#cccccc',
              cursor: 'pointer',
              borderRadius: '3px'
            }}
          >
            Test RTL Language
          </button>
          
          <button
            onClick={() => {
              const defaultLang = languages.find(l => l.isDefault);
              if (defaultLang) {
                handleLanguageSelect(defaultLang.code);
              }
            }}
            style={{
              padding: '6px 12px',
              fontSize: '11px',
              border: '1px solid #3c3c3c',
              background: '#2d2d30',
              color: '#cccccc',
              cursor: 'pointer',
              borderRadius: '3px'
            }}
          >
            Reset to Default
          </button>
        </div>
      </div>
    </div>
  );
}