import React from 'react';
import { clsx } from 'clsx';
import { 
  Search, 
  Settings, 
  Play, 
  Pause, 
  RotateCcw, 
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { useDesignSystemInspector } from '../hooks';
import { DashboardTab } from './tabs/DashboardTab';

interface TabItem {
  id: 'dashboard' | 'components' | 'tokens' | 'colors' | 'typography' | 'spacing' | 'issues';
  label: string;
  icon: string;
  count?: number;
  severity?: 'warning' | 'error';
}
import { ComponentsTab } from './tabs/ComponentsTab';
import { TokensTab } from './tabs/TokensTab';
import { ColorsTab } from './tabs/ColorsTab';
import { TypographyTab } from './tabs/TypographyTab';
import { SpacingTab } from './tabs/SpacingTab';
import { IssuesTab } from './tabs/IssuesTab';

/**
 * Main Design System Inspector DevTools Panel
 */
export function DesignSystemInspectorPanel() {
  const { state, actions } = useDesignSystemInspector();
  const {
    ui: { activeTab, searchQuery, showOnlyIssues },
    isAnalysisEnabled,
    isRealTimeMode,
    stats,
  } = state;

  const handleTabSelect = (tab: typeof activeTab) => {
    actions.selectTab(tab);
  };

  const handleSearch = (query: string) => {
    actions.setSearchQuery(query);
  };

  const handleToggleAnalysis = () => {
    if (isAnalysisEnabled) {
      actions.stopAnalysis();
    } else {
      actions.startAnalysis();
    }
  };

  const handleToggleRealTime = () => {
    if (isRealTimeMode) {
      actions.disableRealTime();
    } else {
      actions.enableRealTime();
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardTab />;
      case 'components':
        return <ComponentsTab />;
      case 'tokens':
        return <TokensTab />;
      case 'colors':
        return <ColorsTab />;
      case 'typography':
        return <TypographyTab />;
      case 'spacing':
        return <SpacingTab />;
      case 'issues':
        return <IssuesTab />;
      default:
        return <DashboardTab />;
    }
  };

  const tabs: TabItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'components', label: 'Components', icon: '🧩', count: stats.totalComponents },
    { id: 'tokens', label: 'Tokens', icon: '🎨', count: stats.totalTokens },
    { id: 'colors', label: 'Colors', icon: '🌈' },
    { id: 'typography', label: 'Typography', icon: '📝' },
    { id: 'spacing', label: 'Spacing', icon: '📏' },
    { id: 'issues', label: 'Issues', icon: '⚠️', count: stats.totalIssues, severity: stats.totalIssues > 0 ? 'warning' as const : undefined },
  ];

  return (
    <div className="design-system-inspector h-full flex flex-col bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="flex-none border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center space-x-4">
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
              Design System Inspector
            </h1>
            <div className="flex items-center space-x-2">
              {/* Analysis Status */}
              <div className={clsx(
                'flex items-center px-2 py-1 rounded-full text-xs font-medium',
                isAnalysisEnabled
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
              )}>
                {isAnalysisEnabled ? (
                  <>
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Active
                  </>
                ) : (
                  <>
                    <Pause className="w-3 h-3 mr-1" />
                    Inactive
                  </>
                )}
              </div>
              
              {/* Real-time Status */}
              {isAnalysisEnabled && (
                <div className={clsx(
                  'flex items-center px-2 py-1 rounded-full text-xs font-medium',
                  isRealTimeMode
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                )}>
                  {isRealTimeMode ? 'Real-time' : 'Static'}
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search components, tokens, issues..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            {/* Controls */}
            <button
              onClick={handleToggleAnalysis}
              className={clsx(
                'flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isAnalysisEnabled
                  ? 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900 dark:text-red-200 dark:hover:bg-red-800'
                  : 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900 dark:text-green-200 dark:hover:bg-green-800'
              )}
            >
              {isAnalysisEnabled ? (
                <>
                  <Pause className="w-4 h-4 mr-1" />
                  Stop
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-1" />
                  Start
                </>
              )}
            </button>
            
            <button
              onClick={handleToggleRealTime}
              disabled={!isAnalysisEnabled}
              className={clsx(
                'flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isRealTimeMode
                  ? 'bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:hover:bg-blue-800'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600',
                !isAnalysisEnabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              <RotateCcw className={clsx('w-4 h-4 mr-1', isRealTimeMode && 'animate-spin')} />
              Real-time
            </button>
            
            {/* Show Only Issues Toggle */}
            <button
              onClick={actions.toggleShowOnlyIssues}
              className={clsx(
                'flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                showOnlyIssues
                  ? 'bg-orange-100 text-orange-700 hover:bg-orange-200 dark:bg-orange-900 dark:text-orange-200 dark:hover:bg-orange-800'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
              )}
            >
              <AlertTriangle className="w-4 h-4 mr-1" />
              Issues Only
            </button>
            
            <button className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {/* Tab Navigation */}
        <div className="flex border-t border-gray-200 dark:border-gray-700">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabSelect(tab.id)}
              className={clsx(
                'flex items-center px-4 py-3 text-sm font-medium border-b-2 transition-colors',
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
              )}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
              {tab.count !== undefined && (
                <span className={clsx(
                  'ml-2 px-2 py-1 rounded-full text-xs font-medium',
                  tab.severity === 'warning'
                    ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    : activeTab === tab.id
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-200'
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                )}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-auto">
        {renderTabContent()}
      </div>
    </div>
  );
}