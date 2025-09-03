/**
 * Main I18n DevTools Panel
 * Provides comprehensive internationalization debugging and management interface
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Globe, 
  Key, 
  Edit, 
  BarChart3, 
  AlertCircle, 
  Palette, 
  Package, 
  FlaskConical, 
  Zap
} from 'lucide-react';
import {
  PluginPanel,
  Badge,
  SearchInput,
  Dropdown,
  ScrollableContainer,
  Alert,
  StatusIndicator,
  EmptyState,
  Skeleton,
  ConfigMenu,
  type ConfigMenuItem
} from '@sucoza/shared-components';
import { i18nEventClient } from '../core/i18n-event-client';
import type { 
  I18nState, 
  TranslationKey, 
  Translation as _Translation, 
  LanguageInfo as _LanguageInfo, 
  NamespaceInfo as _NamespaceInfo,
  TranslationUsage as _TranslationUsage,
  FormattingExample as _FormattingExample,
  BundleAnalysis as _BundleAnalysis,
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
  } catch {
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

  const _copyToClipboard = useCallback(async (data: any, label: string) => {
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
      <PluginPanel
        title="i18n DevTools"
        icon={Globe}
        subtitle="Loading i18n data..."
      >
        <div className="p-8 space-y-4">
          <Skeleton width="100%" height="2rem" />
          <Skeleton width="80%" height="2rem" />
          <Skeleton width="60%" height="2rem" />
        </div>
      </PluginPanel>
    );
  }

  const tabs = [
    {
      id: 'keys',
      label: 'Keys Explorer',
      icon: Key,
      badge: i18nState.translationKeys.length > 0 ? { count: i18nState.translationKeys.length } : undefined,
      content: (
        <KeyExplorer
          translations={filteredTranslations}
          searchResults={searchResults}
          selectedKey={selectedKey}
          selectedNamespace={selectedNamespace}
          onKeySelect={handleKeySelection}
          expandedKeys={expandedKeys}
          onToggleExpansion={(id) => toggleExpansion('key', id)}
        />
      )
    },
    {
      id: 'editor',
      label: 'Editor',
      icon: Edit,
      content: (
        <TranslationEditor
          i18nState={i18nState}
          selectedKey={selectedKey}
          selectedNamespace={selectedNamespace}
          selectedLanguage={selectedLanguage || i18nState.currentLanguage}
          isEditing={isEditing}
          onEdit={handleTranslationEdit}
          onEditingChange={setIsEditing}
        />
      )
    },
    {
      id: 'languages',
      label: 'Languages',
      icon: Globe,
      badge: i18nState.availableLanguages.length > 0 ? { count: i18nState.availableLanguages.length } : undefined,
      content: (
        <LanguageSwitcher
          languages={i18nState.availableLanguages}
          currentLanguage={i18nState.currentLanguage}
          onLanguageChange={handleLanguageChange}
        />
      )
    },
    {
      id: 'coverage',
      label: 'Coverage',
      icon: BarChart3,
      content: (
        <CoverageVisualization
          namespaces={i18nState.namespaces}
          languages={i18nState.availableLanguages}
        />
      )
    },
    {
      id: 'missing',
      label: 'Missing',
      icon: AlertCircle,
      badge: i18nState.missingKeys.length > 0 ? { count: i18nState.missingKeys.length, variant: 'critical' as 'critical' | 'serious' | 'moderate' | 'minor' | 'default' } : undefined,
      content: (
        <MissingKeysPanel
          missingKeys={i18nState.missingKeys}
          onKeySelect={handleKeySelection}
        />
      )
    },
    {
      id: 'format',
      label: 'Format Preview',
      icon: Palette,
      content: (
        <FormatPreview
          currentLanguage={i18nState.currentLanguage}
          availableLanguages={i18nState.availableLanguages}
        />
      )
    },
    {
      id: 'bundle',
      label: 'Bundle Analysis',
      icon: Package,
      content: (
        <BundleAnalyzer
          namespaces={i18nState.namespaces}
          languages={i18nState.availableLanguages}
        />
      )
    },
    {
      id: 'layout',
      label: 'Layout Test',
      icon: FlaskConical,
      content: (
        <LayoutTester
          languages={i18nState.availableLanguages}
          currentLanguage={i18nState.currentLanguage}
        />
      )
    },
    {
      id: 'performance',
      label: 'Performance',
      icon: Zap,
      content: (
        <PerformanceMetrics
          metrics={performanceMetrics}
        />
      )
    }
  ];

  const configMenuItems: ConfigMenuItem[] = [
    {
      id: 'refresh',
      label: 'Refresh Data',
      icon: '🔄',
      onClick: () => i18nEventClient.emit('i18n-state-request', undefined),
      shortcut: 'Ctrl+R'
    },
    {
      id: 'debug-mode',
      label: debugMode ? 'Disable Debug Mode' : 'Enable Debug Mode',
      icon: '🐛',
      onClick: () => {
        const newDebugMode = !debugMode;
        setDebugMode(newDebugMode);
        i18nEventClient.setDebugMode(newDebugMode);
      }
    },
    {
      id: 'auto-refresh',
      label: autoRefresh ? 'Disable Auto Refresh' : 'Enable Auto Refresh',
      icon: autoRefresh ? '⏸️' : '🔄',
      onClick: () => setAutoRefresh(!autoRefresh)
    },
    {
      id: 'show-missing',
      label: showOnlyMissing ? 'Show All Keys' : 'Show Only Missing Keys',
      icon: '⚠️',
      onClick: () => setShowOnlyMissing(!showOnlyMissing),
      separator: true
    },
    {
      id: 'export-translations',
      label: 'Export Translations',
      icon: '💾',
      onClick: () => console.log('Export translations clicked'),
      shortcut: 'Ctrl+E'
    },
    {
      id: 'import-translations',
      label: 'Import Translations',
      icon: '📥',
      onClick: () => console.log('Import translations clicked')
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: '⚙️',
      onClick: () => console.log('Settings clicked'),
      separator: true
    }
  ];

  const metrics = [
    { label: 'Total Keys', value: stats.totalKeys },
    { label: 'Missing', value: stats.missingKeys },
    { label: 'Languages', value: stats.languages },
    { label: 'Namespaces', value: stats.namespaces }
  ];

  const namespaceOptions = [
    { value: '', label: 'All namespaces' },
    ...i18nState.namespaces.map(ns => ({ value: ns.name, label: ns.name }))
  ];

  const languageOptions = [
    { value: '', label: `Current language (${i18nState.currentLanguage})` },
    ...i18nState.availableLanguages.map(lang => ({ value: lang.code, label: `${lang.name} (${lang.code})` }))
  ];

  return (
    <div style={{ position: 'relative', height: '100%' }}>
      <PluginPanel
        title="i18n DevTools"
        icon={Globe}
        subtitle="Internationalization debugging and management"
        tabs={tabs}
        activeTabId={activeTab}
        onTabChange={setActiveTab}
        metrics={metrics}
        showMetrics={true}
        showSearch={true}
        searchValue={searchQuery}
        onSearchChange={handleSearch}
        searchPlaceholder="Search keys and translations..."
      />
      
      <div style={{ position: 'absolute', top: '12px', right: '12px', zIndex: 10 }}>
        <ConfigMenu items={configMenuItems} size="sm" />
      </div>
    </div>
  );
}