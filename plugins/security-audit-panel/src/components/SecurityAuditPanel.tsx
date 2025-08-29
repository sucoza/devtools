import React from 'react';
import { clsx } from 'clsx';
import { 
  Shield, 
  Play, 
  Square,
  RotateCcw, 
  Settings, 
  FileText,
  AlertTriangle,
  Search,
  Filter,
  Download
} from 'lucide-react';
import { useSecurityAudit } from '../hooks';
import { DashboardTab } from './DashboardTab';
import { VulnerabilitiesTab } from './VulnerabilitiesTab';
import { ScannersTab } from './ScannersTab';
import { ReportsTab } from './ReportsTab';
import { SettingsTab } from './SettingsTab';

export interface SecurityAuditPanelProps {
  className?: string;
}

/**
 * Main Security Audit DevTools Panel
 */
export function SecurityAuditPanel({ className }: SecurityAuditPanelProps) {
  const { state, actions } = useSecurityAudit();

  const handleStartScan = async () => {
    if (!state.isScanning) {
      await actions.startScan();
    }
  };

  const handleStopScan = () => {
    if (state.isScanning) {
      actions.cancelScan();
    }
  };

  const handleClearVulnerabilities = () => {
    if (confirm('Are you sure you want to clear all vulnerabilities?')) {
      actions.clearVulnerabilities();
    }
  };

  const handleExport = () => {
    try {
      const data = actions.exportResults(state.config.exportFormat);
      const filename = `security-audit-${Date.now()}.${state.config.exportFormat}`;
      
      // Create and trigger download
      const blob = new Blob([data], { 
        type: state.config.exportFormat === 'json' ? 'application/json' : 'text/plain'
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const getTabIcon = (tab: string) => {
    switch (tab) {
      case 'dashboard':
        return <Shield className="w-4 h-4" />;
      case 'vulnerabilities':
        return <AlertTriangle className="w-4 h-4" />;
      case 'scanners':
        return <Search className="w-4 h-4" />;
      case 'reports':
        return <FileText className="w-4 h-4" />;
      case 'settings':
        return <Settings className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const renderActiveTab = () => {
    switch (state.ui.activeTab) {
      case 'dashboard':
        return <DashboardTab />;
      case 'vulnerabilities':
        return <VulnerabilitiesTab />;
      case 'scanners':
        return <ScannersTab />;
      case 'reports':
        return <ReportsTab />;
      case 'settings':
        return <SettingsTab />;
      default:
        return <DashboardTab />;
    }
  };

  const getVulnerabilityCountBySeverity = (severity: string) => {
    return state.metrics.vulnerabilitiesBySeverity[severity as keyof typeof state.metrics.vulnerabilitiesBySeverity] || 0;
  };

  return (
    <div className={clsx('flex flex-col h-full bg-gray-50 dark:bg-gray-900', className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-red-500" />
          <span className="font-semibold text-gray-900 dark:text-white">
            Security Audit Panel
          </span>
          <div className="flex items-center gap-1 ml-2">
            {state.isScanning && (
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            )}
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {state.metrics.totalVulnerabilities} vulnerabilities
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleStartScan}
            disabled={state.isScanning}
            className={clsx(
              'flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded',
              state.isScanning
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-green-100 text-green-700 hover:bg-green-200'
            )}
          >
            <Play className="w-4 h-4" />
            {state.isScanning ? 'Scanning...' : 'Start Scan'}
          </button>

          {state.isScanning && (
            <button
              onClick={handleStopScan}
              className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-red-700 bg-red-100 rounded hover:bg-red-200"
            >
              <Square className="w-4 h-4" />
              Stop
            </button>
          )}

          <button
            onClick={handleClearVulnerabilities}
            disabled={state.metrics.totalVulnerabilities === 0}
            className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RotateCcw className="w-4 h-4" />
            Clear
          </button>

          <button
            onClick={handleExport}
            disabled={state.metrics.totalVulnerabilities === 0}
            className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-100 rounded hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Severity Summary Bar */}
      <div className="flex items-center gap-4 px-3 py-2 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 text-sm">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span className="text-gray-700 dark:text-gray-300">
              Critical: {getVulnerabilityCountBySeverity('critical')}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-orange-500 rounded"></div>
            <span className="text-gray-700 dark:text-gray-300">
              High: {getVulnerabilityCountBySeverity('high')}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-yellow-500 rounded"></div>
            <span className="text-gray-700 dark:text-gray-300">
              Medium: {getVulnerabilityCountBySeverity('medium')}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span className="text-gray-700 dark:text-gray-300">
              Low: {getVulnerabilityCountBySeverity('low')}
            </span>
          </div>
        </div>

        <div className="ml-auto text-sm text-gray-600 dark:text-gray-400">
          Security Score: {state.metrics.securityScore}/100
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        {[
          { key: 'dashboard', label: 'Dashboard' },
          { key: 'vulnerabilities', label: 'Vulnerabilities' },
          { key: 'scanners', label: 'Scanners' },
          { key: 'reports', label: 'Reports' },
          { key: 'settings', label: 'Settings' },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => actions.selectTab(key as typeof state.ui.activeTab)}
            className={clsx(
              'flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors',
              state.ui.activeTab === key
                ? 'border-blue-500 text-blue-600 bg-blue-50 dark:bg-blue-900/20'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:border-gray-300'
            )}
          >
            {getTabIcon(key)}
            {label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        {renderActiveTab()}
      </div>
    </div>
  );
}