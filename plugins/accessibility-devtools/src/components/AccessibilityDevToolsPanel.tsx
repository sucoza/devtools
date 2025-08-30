import React from 'react';
import { clsx } from 'clsx';
import { 
  Eye, 
  EyeOff, 
  Play, 
  Pause, 
  Square, 
  Shield, 
  AlertTriangle, 
  Palette, 
  Keyboard, 
  Focus,
  MapPin,
  BarChart3
} from 'lucide-react';
import { useAccessibilityAudit } from '../hooks/useAccessibilityAudit';
import { IssueList } from './IssueList';
import { ColorContrastAnalyzer } from './ColorContrastAnalyzer';
import { KeyboardNavVisualizer } from './KeyboardNavVisualizer';
import { ARIAValidator } from './ARIAValidator';
import { LandmarkMapper } from './LandmarkMapper';
import { FocusDebugger } from './FocusDebugger';

export interface AccessibilityDevToolsPanelProps {
  className?: string;
}

/**
 * Main Accessibility DevTools Panel
 */
export function AccessibilityDevToolsPanel({ className }: AccessibilityDevToolsPanelProps) {
  const {
    currentAudit,
    scanState,
    scanOptions: _scanOptions,
    ui,
    selectedIssue: _selectedIssue,
    filters: _filters,
    settings,
    startScan,
    stopScan,
    pauseScan,
    resumeScan,
    updateSettings,
    selectTab,
    getIssueStats,
    getFilteredStats,
  } = useAccessibilityAudit();

  const stats = getIssueStats();
  const filteredStats = getFilteredStats();

  const handleScanToggle = () => {
    if (scanState.isScanning) {
      if (scanState.isPaused) {
        resumeScan();
      } else {
        pauseScan();
      }
    } else {
      startScan();
    }
  };

  const handleStopScan = () => {
    stopScan();
  };

  const renderActiveTab = () => {
    switch (ui.activeTab) {
      case 'violations':
        return <IssueList />;
      case 'color-contrast':
        return <ColorContrastAnalyzer />;
      case 'keyboard':
        return <KeyboardNavVisualizer />;
      case 'aria':
        return <ARIAValidator />;
      case 'landmarks':
        return <LandmarkMapper />;
      case 'focus':
        return <FocusDebugger />;
      case 'overview':
      default:
        return <IssueList showOverview={true} />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400';
      case 'serious': return 'text-orange-600 bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400';
      case 'moderate': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'minor': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  return (
    <div className={clsx('flex flex-col h-full bg-gray-50 dark:bg-gray-900', className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-500" />
          <span className="font-semibold text-gray-900 dark:text-white">
            Accessibility Auditor
          </span>
          <div className="flex items-center gap-1 ml-2">
            <div
              className={clsx(
                'w-2 h-2 rounded-full',
                scanState.isScanning ? 'bg-green-400 animate-pulse' : 'bg-gray-400'
              )}
            />
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {scanState.isScanning 
                ? scanState.isPaused ? 'Paused' : 'Scanning' 
                : 'Idle'
              }
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Scan Controls */}
          <button
            onClick={handleScanToggle}
            className={clsx(
              'flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors',
              scanState.isScanning
                ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-800/40'
            )}
            title={
              scanState.isScanning
                ? scanState.isPaused ? 'Resume Scan' : 'Pause Scan'
                : 'Start Scan'
            }
          >
            {scanState.isScanning 
              ? scanState.isPaused 
                ? <Play className="w-3 h-3" />
                : <Pause className="w-3 h-3" />
              : <Play className="w-3 h-3" />
            }
            {scanState.isScanning
              ? scanState.isPaused ? 'Resume' : 'Pause'
              : 'Scan'
            }
          </button>

          {scanState.isScanning && (
            <button
              onClick={handleStopScan}
              className="flex items-center gap-1 px-2 py-1 text-xs rounded bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-800/40 transition-colors"
              title="Stop Scan"
            >
              <Square className="w-3 h-3" />
              Stop
            </button>
          )}

          {/* Settings Toggle */}
          <button
            onClick={() => updateSettings({ enableOverlay: !settings.enableOverlay })}
            className={clsx(
              'flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors',
              settings.enableOverlay
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            )}
            title={settings.enableOverlay ? 'Hide Overlay' : 'Show Overlay'}
          >
            {settings.enableOverlay ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            Overlay
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="flex items-center justify-between px-3 py-2 bg-gray-100 dark:bg-gray-800 text-xs text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-4">
          <span>Total Issues: {stats.total}</span>
          {stats.critical > 0 && (
            <span className={clsx('px-1.5 py-0.5 rounded text-xs font-medium', getSeverityColor('critical'))}>
              Critical: {stats.critical}
            </span>
          )}
          {stats.serious > 0 && (
            <span className={clsx('px-1.5 py-0.5 rounded text-xs font-medium', getSeverityColor('serious'))}>
              Serious: {stats.serious}
            </span>
          )}
          {stats.moderate > 0 && (
            <span className={clsx('px-1.5 py-0.5 rounded text-xs font-medium', getSeverityColor('moderate'))}>
              Moderate: {stats.moderate}
            </span>
          )}
          {stats.minor > 0 && (
            <span className={clsx('px-1.5 py-0.5 rounded text-xs font-medium', getSeverityColor('minor'))}>
              Minor: {stats.minor}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {currentAudit && (
            <span>
              WCAG {settings.wcagLevel} • {currentAudit.testEngine.name} v{currentAudit.testEngine.version}
            </span>
          )}
          {filteredStats.total !== stats.total && (
            <span className="px-2 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded">
              Filtered: {filteredStats.total}
            </span>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
        <TabButton
          icon={BarChart3}
          label="Overview"
          count={stats.total}
          isActive={ui.activeTab === 'overview'}
          onClick={() => selectTab('overview')}
        />
        
        <TabButton
          icon={AlertTriangle}
          label="Violations"
          count={stats.total}
          isActive={ui.activeTab === 'violations'}
          onClick={() => selectTab('violations')}
          severity={stats.critical > 0 ? 'critical' : stats.serious > 0 ? 'serious' : undefined}
        />
        
        <TabButton
          icon={Palette}
          label="Color Contrast"
          isActive={ui.activeTab === 'color-contrast'}
          onClick={() => selectTab('color-contrast')}
        />
        
        <TabButton
          icon={Keyboard}
          label="Keyboard Nav"
          isActive={ui.activeTab === 'keyboard'}
          onClick={() => selectTab('keyboard')}
        />
        
        <TabButton
          icon={Shield}
          label="ARIA"
          isActive={ui.activeTab === 'aria'}
          onClick={() => selectTab('aria')}
        />
        
        <TabButton
          icon={MapPin}
          label="Landmarks"
          isActive={ui.activeTab === 'landmarks'}
          onClick={() => selectTab('landmarks')}
        />
        
        <TabButton
          icon={Focus}
          label="Focus"
          isActive={ui.activeTab === 'focus'}
          onClick={() => selectTab('focus')}
        />
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        {renderActiveTab()}
      </div>
    </div>
  );
}

interface TabButtonProps {
  icon: React.ElementType;
  label: string;
  count?: number;
  isActive: boolean;
  onClick: () => void;
  severity?: 'critical' | 'serious' | 'moderate' | 'minor';
}

function TabButton({ icon: Icon, label, count, isActive, onClick, severity }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'flex items-center gap-2 px-3 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
        isActive
          ? 'border-blue-500 text-blue-600 dark:text-blue-400'
          : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
      )}
    >
      <Icon className="w-4 h-4" />
      {label}
      {count !== undefined && (
        <span className={clsx(
          'px-1.5 py-0.5 text-xs rounded-full',
          severity === 'critical' ? 'bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400' :
          severity === 'serious' ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/50 dark:text-orange-400' :
          'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
        )}>
          {count}
        </span>
      )}
    </button>
  );
}

export default AccessibilityDevToolsPanel;