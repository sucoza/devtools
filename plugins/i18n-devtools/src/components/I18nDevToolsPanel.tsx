/**
 * Main I18n DevTools Panel
 * Provides comprehensive internationalization debugging and management interface
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { i18nEventClient } from '../core/i18n-event-client';
import type { 
  I18nState, 
  TranslationKey, 
  Translation, 
  LanguageInfo, 
  NamespaceInfo,
  TranslationUsage,
  FormattingExample,
  BundleAnalysis,
  I18nPerformanceMetrics
} from '../types/i18n';

// Subcomponents
import { KeyExplorer } from './KeyExplorer';
import { LanguageSwitcher } from './LanguageSwitcher';
import { TranslationEditor } from './TranslationEditor';
import { CoverageVisualization } from './CoverageVisualization';
import { MissingKeysPanel } from './MissingKeysPanel';
import { FormatPreview } from './FormatPreview';
import { BundleAnalyzer } from './BundleAnalyzer';
import { LayoutTester } from './LayoutTester';
import { PerformanceMetrics } from './PerformanceMetrics';

// UI State persistence helpers
const I18N_UI_STATE_KEY = 'i18n-devtools-ui-state';

interface I18nUIState {
  activeTab: string;
  selectedLanguage: string | null;
  selectedNamespace: string | null;
  selectedKey: string | null;
  searchQuery: string;
  showOnlyMissing: boolean;
  showOnlyUnused: boolean;
  autoRefresh: boolean;
  debugMode: boolean;
  expandedKeys: string[];
  expandedNamespaces: string[];
  panelLayout: 'horizontal' | 'vertical';
  sidebarCollapsed: boolean;
}

const saveUIState = (state: I18nUIState) => {
  try {
    localStorage.setItem(I18N_UI_STATE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('[I18n DevTools] Failed to save UI state:', e);
  }
};

const loadUIState = (): Partial<I18nUIState> => {
  try {
    const saved = localStorage.getItem(I18N_UI_STATE_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch (e) {
    return {};
  }
};

export function I18nDevToolsPanel() {
  // Load saved UI state
  const savedState = loadUIState();
  
  // Core state
  const [i18nState, setI18nState] = useState<I18nState>({
    currentLanguage: 'en',
    fallbackLanguage: 'en',
    availableLanguages: [],
    namespaces: [],
    translations: [],
    translationKeys: [],
    missingKeys: [],
    isLoading: true,
    lastUpdated: Date.now(),
  });
  
  // UI state
  const [activeTab, setActiveTab] = useState<string>(savedState.activeTab || 'keys');
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(savedState.selectedLanguage || null);
  const [selectedNamespace, setSelectedNamespace] = useState<string | null>(savedState.selectedNamespace || null);
  const [selectedKey, setSelectedKey] = useState<string | null>(savedState.selectedKey || null);
  const [searchQuery, setSearchQuery] = useState(savedState.searchQuery || '');
  const [showOnlyMissing, setShowOnlyMissing] = useState(savedState.showOnlyMissing ?? false);
  const [showOnlyUnused, setShowOnlyUnused] = useState(savedState.showOnlyUnused ?? false);
  const [autoRefresh, setAutoRefresh] = useState(savedState.autoRefresh ?? true);
  const [debugMode, setDebugMode] = useState(savedState.debugMode ?? false);
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set(savedState.expandedKeys || []));
  const [expandedNamespaces, setExpandedNamespaces] = useState<Set<string>>(new Set(savedState.expandedNamespaces || []));
  const [panelLayout, setPanelLayout] = useState<'horizontal' | 'vertical'>(savedState.panelLayout || 'horizontal');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(savedState.sidebarCollapsed ?? false);
  
  // Additional state
  const [searchResults, setSearchResults] = useState<TranslationKey[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [performanceMetrics, setPerformanceMetrics] = useState<I18nPerformanceMetrics | null>(null);
  const [copySuccess, setCopySuccess] = useState<string | null>(null);
  const [errors, setErrors] = useState<string[]>([]);

  // Effects
  useEffect(() => {
    // Subscribe to state updates
    const unsubscribeState = i18nEventClient.on('i18n-state-update', (event) => {
      setI18nState(event.payload.state);
    });

    // Subscribe to state responses
    const unsubscribeStateResponse = i18nEventClient.on('i18n-state-response', (event) => {
      setI18nState(event.payload.state);
    });

    // Subscribe to search results
    const unsubscribeSearchResults = i18nEventClient.on('i18n-search-results', (event) => {
      setSearchResults(event.payload.keys);
    });

    // Subscribe to performance metrics
    const unsubscribePerformanceMetrics = i18nEventClient.on('i18n-performance-metrics', (event) => {
      setPerformanceMetrics(event.payload.metrics);
    });

    // Subscribe to errors
    const unsubscribeError = i18nEventClient.on('i18n-error', (event) => {
      setErrors(prev => [...prev, event.payload.message].slice(-10));
    });

    // Request initial state
    i18nEventClient.emit('i18n-state-request', undefined);

    return () => {
      unsubscribeState();
      unsubscribeStateResponse();
      unsubscribeSearchResults();
      unsubscribePerformanceMetrics();
      unsubscribeError();
    };
  }, []);

  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefresh) return undefined;

    const interval = setInterval(() => {
      i18nEventClient.emit('i18n-state-request', undefined);
    }, 5000);

    return () => clearInterval(interval);
  }, [autoRefresh]);

  // Save UI state whenever it changes
  useEffect(() => {
    const currentState: I18nUIState = {
      activeTab,
      selectedLanguage,
      selectedNamespace,
      selectedKey,
      searchQuery,
      showOnlyMissing,
      showOnlyUnused,
      autoRefresh,
      debugMode,
      expandedKeys: Array.from(expandedKeys),
      expandedNamespaces: Array.from(expandedNamespaces),
      panelLayout,
      sidebarCollapsed,
    };
    saveUIState(currentState);
  }, [
    activeTab, selectedLanguage, selectedNamespace, selectedKey, searchQuery,
    showOnlyMissing, showOnlyUnused, autoRefresh, debugMode,
    expandedKeys, expandedNamespaces, panelLayout, sidebarCollapsed
  ]);

  // Callbacks
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    
    if (query.trim()) {
      i18nEventClient.emit('i18n-search-keys', {
        query: query.trim(),
        namespace: selectedNamespace || undefined,
        language: selectedLanguage || undefined,
        onlyMissing: showOnlyMissing,
        onlyUnused: showOnlyUnused,
      });
    } else {
      setSearchResults([]);
    }
  }, [selectedNamespace, selectedLanguage, showOnlyMissing, showOnlyUnused]);

  const handleLanguageChange = useCallback((language: string) => {
    i18nEventClient.emit('i18n-language-change-request', { language });
    setSelectedLanguage(language);
  }, []);

  const handleKeySelection = useCallback((key: string, namespace: string) => {
    setSelectedKey(key);
    setSelectedNamespace(namespace);
    setActiveTab('editor');
  }, []);

  const handleTranslationEdit = useCallback((key: string, namespace: string, language: string, value: string) => {
    i18nEventClient.emit('i18n-edit-translation', {
      key,
      namespace,
      language,
      value,
    });
  }, []);

  const toggleExpansion = useCallback((type: 'key' | 'namespace', id: string) => {
    if (type === 'key') {
      setExpandedKeys(prev => {
        const next = new Set(prev);
        if (next.has(id)) {
          next.delete(id);
        } else {
          next.add(id);
        }
        return next;
      });
    } else {
      setExpandedNamespaces(prev => {
        const next = new Set(prev);
        if (next.has(id)) {
          next.delete(id);
        } else {
          next.add(id);
        }
        return next;
      });
    }
  }, []);

  const copyToClipboard = useCallback(async (data: any, label: string) => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      setCopySuccess(label);
      setTimeout(() => setCopySuccess(null), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
      setCopySuccess('Failed to copy');
      setTimeout(() => setCopySuccess(null), 2000);
    }
  }, []);

  // Computed values
  const filteredTranslations = useMemo(() => {
    let translations = i18nState.translations;

    if (selectedLanguage) {
      translations = translations.filter(t => t.language === selectedLanguage);
    }

    if (selectedNamespace) {
      translations = translations.filter(t => t.namespace === selectedNamespace);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      translations = translations.filter(t => 
        t.key.toLowerCase().includes(query) ||
        String(t.value).toLowerCase().includes(query)
      );
    }

    if (showOnlyMissing) {
      translations = translations.filter(t => t.isMissing);
    }

    return translations;
  }, [i18nState.translations, selectedLanguage, selectedNamespace, searchQuery, showOnlyMissing]);

  const stats = useMemo(() => {
    const currentLang = selectedLanguage || i18nState.currentLanguage;
    const langTranslations = i18nState.translations.filter(t => t.language === currentLang);
    
    return {
      totalKeys: langTranslations.length,
      missingKeys: langTranslations.filter(t => t.isMissing).length,
      translatedKeys: langTranslations.filter(t => !t.isMissing).length,
      namespaces: i18nState.namespaces.length,
      languages: i18nState.availableLanguages.length,
    };
  }, [i18nState, selectedLanguage]);

  if (i18nState.isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100%',
        fontFamily: 'monospace',
        color: '#d4d4d4',
        background: '#1e1e1e'
      }}>
        <div>Loading i18n data...</div>
      </div>
    );
  }

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: '"SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, "Courier New", monospace',
      fontSize: '12px',
      background: '#1e1e1e',
      color: '#d4d4d4'
    }}>
      {/* Header */}
      <div style={{ 
        padding: '10px', 
        borderBottom: '1px solid #3c3c3c',
        background: '#252526',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <h3 style={{ margin: 0, color: '#cccccc', fontSize: '14px', fontWeight: '600' }}>
            🌐 i18n DevTools
          </h3>
          
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: '#969696' }}>
              {stats.translatedKeys}/{stats.totalKeys} keys • {stats.languages} languages • {stats.namespaces} namespaces
            </span>
            
            {i18nState.missingKeys.length > 0 && (
              <span style={{ 
                background: '#5a1d1d', 
                color: '#f48771', 
                padding: '2px 6px', 
                borderRadius: '3px',
                fontSize: '10px'
              }}>
                {i18nState.missingKeys.length} missing
              </span>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px' }}>
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            Auto-refresh
          </label>
          
          <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px' }}>
            <input
              type="checkbox"
              checked={debugMode}
              onChange={(e) => {
                setDebugMode(e.target.checked);
                i18nEventClient.setDebugMode(e.target.checked);
              }}
            />
            Debug mode
          </label>
          
          <button
            onClick={() => setPanelLayout(panelLayout === 'horizontal' ? 'vertical' : 'horizontal')}
            style={{
              padding: '4px 8px',
              fontSize: '10px',
              border: '1px solid #3c3c3c',
              background: '#2d2d30',
              color: '#cccccc',
              cursor: 'pointer',
              borderRadius: '3px'
            }}
          >
            {panelLayout === 'horizontal' ? '⫴' : '⫸'} Layout
          </button>
        </div>
      </div>

      {/* Search and filters */}
      <div style={{ 
        padding: '10px', 
        borderBottom: '1px solid #3c3c3c',
        background: '#252526',
        display: 'flex',
        gap: '10px',
        alignItems: 'center',
        flexWrap: 'wrap'
      }}>
        <input
          type="text"
          placeholder="Search keys and translations..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          style={{
            flex: '1 1 200px',
            minWidth: '200px',
            padding: '6px 10px',
            borderRadius: '4px',
            border: '1px solid #3c3c3c',
            background: '#1e1e1e',
            color: '#cccccc',
            fontSize: '12px'
          }}
        />

        <select
          value={selectedNamespace || ''}
          onChange={(e) => setSelectedNamespace(e.target.value || null)}
          style={{
            padding: '6px 10px',
            borderRadius: '4px',
            border: '1px solid #3c3c3c',
            background: '#1e1e1e',
            color: '#cccccc',
            fontSize: '11px'
          }}
        >
          <option value="">All namespaces</option>
          {i18nState.namespaces.map(ns => (
            <option key={ns.name} value={ns.name}>{ns.name}</option>
          ))}
        </select>

        <select
          value={selectedLanguage || ''}
          onChange={(e) => setSelectedLanguage(e.target.value || null)}
          style={{
            padding: '6px 10px',
            borderRadius: '4px',
            border: '1px solid #3c3c3c',
            background: '#1e1e1e',
            color: '#cccccc',
            fontSize: '11px'
          }}
        >
          <option value="">Current language ({i18nState.currentLanguage})</option>
          {i18nState.availableLanguages.map(lang => (
            <option key={lang.code} value={lang.code}>{lang.name} ({lang.code})</option>
          ))}
        </select>

        <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px' }}>
          <input
            type="checkbox"
            checked={showOnlyMissing}
            onChange={(e) => setShowOnlyMissing(e.target.checked)}
          />
          Missing only
        </label>

        <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px' }}>
          <input
            type="checkbox"
            checked={showOnlyUnused}
            onChange={(e) => setShowOnlyUnused(e.target.checked)}
          />
          Unused only
        </label>
      </div>

      {/* Tabs */}
      <div style={{ 
        display: 'flex', 
        borderBottom: '1px solid #3c3c3c',
        background: '#252526'
      }}>
        {[
          { id: 'keys', label: 'Keys Explorer', icon: '🔑' },
          { id: 'editor', label: 'Editor', icon: '✏️' },
          { id: 'languages', label: 'Languages', icon: '🌍' },
          { id: 'coverage', label: 'Coverage', icon: '📊' },
          { id: 'missing', label: 'Missing', icon: '❌' },
          { id: 'format', label: 'Format Preview', icon: '🎨' },
          { id: 'bundle', label: 'Bundle Analysis', icon: '📦' },
          { id: 'layout', label: 'Layout Test', icon: '🧪' },
          { id: 'performance', label: 'Performance', icon: '⚡' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '8px 16px',
              background: activeTab === tab.id ? '#1e1e1e' : 'transparent',
              border: 'none',
              borderBottom: activeTab === tab.id ? '2px solid #007acc' : '2px solid transparent',
              color: activeTab === tab.id ? '#cccccc' : '#969696',
              cursor: 'pointer',
              fontSize: '11px',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main content */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: panelLayout === 'horizontal' ? 'row' : 'column' }}>
        {/* Sidebar */}
        {!sidebarCollapsed && (activeTab === 'keys' || activeTab === 'editor') && (
          <div style={{ 
            [panelLayout === 'horizontal' ? 'width' : 'height']: '300px',
            borderRight: panelLayout === 'horizontal' ? '1px solid #3c3c3c' : 'none',
            borderBottom: panelLayout === 'vertical' ? '1px solid #3c3c3c' : 'none',
            padding: '10px',
            overflowY: 'auto',
            background: '#252526'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <h4 style={{ margin: 0, color: '#9cdcfe', fontSize: '12px' }}>
                Namespaces & Keys
              </h4>
              <button
                onClick={() => setSidebarCollapsed(true)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#969696',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                ×
              </button>
            </div>
            
            {i18nState.namespaces.map(namespace => (
              <div key={namespace.name} style={{ marginBottom: '10px' }}>
                <div
                  onClick={() => toggleExpansion('namespace', namespace.name)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 8px',
                    background: selectedNamespace === namespace.name ? '#094771' : '#2d2d30',
                    borderRadius: '3px',
                    cursor: 'pointer',
                    fontSize: '11px'
                  }}
                >
                  <span style={{ fontSize: '10px' }}>
                    {expandedNamespaces.has(namespace.name) ? '▾' : '▸'}
                  </span>
                  <span style={{ color: '#4ec9b0', fontWeight: '500' }}>{namespace.name}</span>
                  <span style={{ color: '#969696', marginLeft: 'auto' }}>
                    {namespace.totalKeys}
                  </span>
                </div>
                
                {expandedNamespaces.has(namespace.name) && (
                  <div style={{ marginLeft: '20px', marginTop: '6px' }}>
                    {filteredTranslations
                      .filter(t => t.namespace === namespace.name)
                      .slice(0, 20) // Limit for performance
                      .map(translation => (
                        <div
                          key={`${translation.namespace}:${translation.key}`}
                          onClick={() => handleKeySelection(translation.key, translation.namespace)}
                          style={{
                            padding: '4px 8px',
                            margin: '2px 0',
                            borderRadius: '2px',
                            background: selectedKey === translation.key ? '#094771' : 'transparent',
                            cursor: 'pointer',
                            fontSize: '10px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          {translation.isMissing && <span style={{ color: '#f48771' }}>!</span>}
                          <span style={{ color: translation.isMissing ? '#f48771' : '#cccccc' }}>
                            {translation.key.length > 30 ? `${translation.key.substring(0, 30)}...` : translation.key}
                          </span>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Toggle sidebar button */}
        {sidebarCollapsed && (activeTab === 'keys' || activeTab === 'editor') && (
          <button
            onClick={() => setSidebarCollapsed(false)}
            style={{
              position: 'absolute',
              top: '140px',
              left: '10px',
              background: '#252526',
              border: '1px solid #3c3c3c',
              color: '#969696',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '3px',
              fontSize: '12px',
              zIndex: 10
            }}
          >
            ☰
          </button>
        )}

        {/* Main panel */}
        <div style={{ flex: 1, overflow: 'hidden' }}>
          {activeTab === 'keys' && (
            <KeyExplorer
              translations={filteredTranslations}
              searchResults={searchResults}
              selectedKey={selectedKey}
              selectedNamespace={selectedNamespace}
              onKeySelect={handleKeySelection}
              expandedKeys={expandedKeys}
              onToggleExpansion={(id) => toggleExpansion('key', id)}
            />
          )}
          
          {activeTab === 'editor' && (
            <TranslationEditor
              i18nState={i18nState}
              selectedKey={selectedKey}
              selectedNamespace={selectedNamespace}
              selectedLanguage={selectedLanguage || i18nState.currentLanguage}
              isEditing={isEditing}
              onEdit={handleTranslationEdit}
              onEditingChange={setIsEditing}
            />
          )}
          
          {activeTab === 'languages' && (
            <LanguageSwitcher
              languages={i18nState.availableLanguages}
              currentLanguage={i18nState.currentLanguage}
              onLanguageChange={handleLanguageChange}
            />
          )}
          
          {activeTab === 'coverage' && (
            <CoverageVisualization
              namespaces={i18nState.namespaces}
              languages={i18nState.availableLanguages}
            />
          )}
          
          {activeTab === 'missing' && (
            <MissingKeysPanel
              missingKeys={i18nState.missingKeys}
              onKeySelect={handleKeySelection}
            />
          )}
          
          {activeTab === 'format' && (
            <FormatPreview
              currentLanguage={i18nState.currentLanguage}
              availableLanguages={i18nState.availableLanguages}
            />
          )}
          
          {activeTab === 'bundle' && (
            <BundleAnalyzer
              namespaces={i18nState.namespaces}
              languages={i18nState.availableLanguages}
            />
          )}
          
          {activeTab === 'layout' && (
            <LayoutTester
              languages={i18nState.availableLanguages}
              currentLanguage={i18nState.currentLanguage}
            />
          )}
          
          {activeTab === 'performance' && (
            <PerformanceMetrics
              metrics={performanceMetrics}
            />
          )}
        </div>
      </div>

      {/* Error display */}
      {errors.length > 0 && (
        <div style={{ 
          position: 'fixed',
          bottom: '10px',
          right: '10px',
          maxWidth: '300px',
          background: '#5a1d1d',
          border: '1px solid #8b3a3a',
          borderRadius: '4px',
          padding: '8px',
          fontSize: '11px',
          color: '#f48771',
          zIndex: 1000
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <strong>Errors:</strong>
            <button
              onClick={() => setErrors([])}
              style={{ background: 'none', border: 'none', color: '#f48771', cursor: 'pointer' }}
            >
              ×
            </button>
          </div>
          {errors.slice(-3).map((error, index) => (
            <div key={index} style={{ marginBottom: '2px' }}>
              {error}
            </div>
          ))}
        </div>
      )}

      {/* Copy success notification */}
      {copySuccess && (
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: '#1e5f1e',
          border: '1px solid #4ec9b0',
          borderRadius: '4px',
          padding: '10px 20px',
          fontSize: '12px',
          color: '#4ec9b0',
          zIndex: 1000
        }}>
          ✓ {copySuccess} copied to clipboard
        </div>
      )}
    </div>
  );
}