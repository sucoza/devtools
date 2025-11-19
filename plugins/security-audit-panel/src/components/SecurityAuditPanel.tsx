import React from 'react';
import { 
  Shield, 
  Play, 
  Square,
  RotateCcw, 
  Settings, 
  FileText,
  AlertTriangle,
  Search,
  Download
} from 'lucide-react';
import {
  PluginPanel,
  ScrollableContainer,
  Tabs,
  Badge,
  StatusIndicator,
  Toolbar,
  Footer,
  COLORS,
  SPACING,
  TYPOGRAPHY,
  RADIUS,
  ConfigMenu,
  type ConfigMenuItem,
} from '@sucoza/shared-components';
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

  // Tab configuration
  const tabs = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <Shield size={16} />,
      content: (
        <ScrollableContainer>
          <DashboardTab />
        </ScrollableContainer>
      ),
    },
    {
      id: 'vulnerabilities',
      label: 'Vulnerabilities',
      icon: <AlertTriangle size={16} />,
      content: (
        <ScrollableContainer>
          <VulnerabilitiesTab />
        </ScrollableContainer>
      ),
    },
    {
      id: 'scanners',
      label: 'Scanners',
      icon: <Search size={16} />,
      content: (
        <ScrollableContainer>
          <ScannersTab />
        </ScrollableContainer>
      ),
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: <FileText size={16} />,
      content: (
        <ScrollableContainer>
          <ReportsTab />
        </ScrollableContainer>
      ),
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: <Settings size={16} />,
      content: (
        <ScrollableContainer>
          <SettingsTab />
        </ScrollableContainer>
      ),
    },
  ];

  // Prepare toolbar actions
  const toolbarActions = [
    {
      id: 'start-scan',
      icon: <Play size={16} />,
      label: state.isScanning ? 'Scanning...' : 'Start Scan',
      onClick: handleStartScan,
      disabled: state.isScanning,
      variant: 'primary' as const,
    },
    ...(state.isScanning ? [{
      id: 'stop-scan',
      icon: <Square size={16} />,
      label: 'Stop',
      onClick: handleStopScan,
      variant: 'danger' as const,
    }] : []),
    {
      id: 'clear',
      icon: <RotateCcw size={16} />,
      label: 'Clear',
      onClick: handleClearVulnerabilities,
      disabled: state.metrics.totalVulnerabilities === 0,
    },
    {
      id: 'export',
      icon: <Download size={16} />,
      label: 'Export',
      onClick: handleExport,
      disabled: state.metrics.totalVulnerabilities === 0,
    },
  ];

  const getVulnerabilityCountBySeverity = (severity: string) => {
    return state.metrics.vulnerabilitiesBySeverity[severity as keyof typeof state.metrics.vulnerabilitiesBySeverity] || 0;
  };

  // Footer stats
  const footerStats = [
    { id: 'total', label: 'Total', value: state.metrics.totalVulnerabilities.toString() },
    { id: 'critical', label: 'Critical', value: getVulnerabilityCountBySeverity('critical').toString() },
    { id: 'high', label: 'High', value: getVulnerabilityCountBySeverity('high').toString() },
    { id: 'medium', label: 'Medium', value: getVulnerabilityCountBySeverity('medium').toString() },
    { id: 'low', label: 'Low', value: getVulnerabilityCountBySeverity('low').toString() },
    { id: 'security-score', label: 'Security Score', value: `${state.metrics.securityScore}/100` },
  ];

  // Convert actions into config menu items
  const configMenuItems: ConfigMenuItem[] = [
    {
      id: 'run-audit',
      label: state.isScanning ? 'Running...' : 'Run Security Audit',
      icon: '▶️',
      onClick: handleStartScan,
      disabled: state.isScanning,
      shortcut: 'Ctrl+R'
    },
    {
      id: 'quick-scan',
      label: 'Quick Scan',
      icon: '🔍',
      onClick: () => {
        // Quick scan implementation
        actions.quickScan();
      },
      disabled: state.isScanning,
      shortcut: 'Ctrl+Q'
    },
    {
      id: 'generate-report',
      label: 'Generate Report',
      icon: '📊',
      onClick: () => {
        // Generate report implementation
        actions.generateReport();
      },
      shortcut: 'Ctrl+G'
    },
    {
      id: 'export-results',
      label: 'Export Results',
      icon: '💾',
      onClick: handleExport,
      disabled: state.metrics.totalVulnerabilities === 0,
      shortcut: 'Ctrl+E'
    },
    {
      id: 'clear-results',
      label: 'Clear Results',
      icon: '🗑️',
      onClick: handleClearVulnerabilities,
      disabled: state.metrics.totalVulnerabilities === 0,
      shortcut: 'Ctrl+K'
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: '⚙️',
      onClick: () => actions.selectTab('settings'),
      separator: true
    }
  ];

  return (
    <div style={{ position: 'relative', height: '100%' }}>
      <PluginPanel
        title="Security Audit Panel"
        icon={Shield}
        className={className}
      >
      <Toolbar actions={toolbarActions} />

      {/* Severity Summary Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: SPACING.sm,
        backgroundColor: COLORS.background.tertiary,
        borderBottom: `1px solid ${COLORS.border.primary}`,
        gap: SPACING.md,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.md }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.xs }}>
            <div style={{
              width: '12px',
              height: '12px',
              backgroundColor: COLORS.status.error,
              borderRadius: RADIUS.sm
            }} />
            <span style={{ fontSize: TYPOGRAPHY.fontSize.sm, color: COLORS.text.primary }}>
              Critical: {getVulnerabilityCountBySeverity('critical')}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.xs }}>
            <div style={{
              width: '12px',
              height: '12px',
              backgroundColor: COLORS.status.warning,
              borderRadius: RADIUS.sm
            }} />
            <span style={{ fontSize: TYPOGRAPHY.fontSize.sm, color: COLORS.text.primary }}>
              High: {getVulnerabilityCountBySeverity('high')}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.xs }}>
            <div style={{
              width: '12px',
              height: '12px',
              backgroundColor: '#f59e0b',
              borderRadius: RADIUS.sm
            }} />
            <span style={{ fontSize: TYPOGRAPHY.fontSize.sm, color: COLORS.text.primary }}>
              Medium: {getVulnerabilityCountBySeverity('medium')}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.xs }}>
            <div style={{
              width: '12px',
              height: '12px',
              backgroundColor: COLORS.status.success,
              borderRadius: RADIUS.sm
            }} />
            <span style={{ fontSize: TYPOGRAPHY.fontSize.sm, color: COLORS.text.primary }}>
              Low: {getVulnerabilityCountBySeverity('low')}
            </span>
          </div>
        </div>

        <div style={{
          fontSize: TYPOGRAPHY.fontSize.sm,
          color: COLORS.text.secondary
        }}>
          Security Score: {state.metrics.securityScore}/100
        </div>
      </div>

      <Tabs
        activeTab={state.ui.activeTab}
        onTabChange={(tabId) => actions.selectTab(tabId as typeof state.ui.activeTab)}
        tabs={tabs}
      />

        <Footer stats={footerStats} />
      </PluginPanel>

      <div style={{ position: 'absolute', top: '12px', right: '12px', zIndex: 10 }}>
        <ConfigMenu items={configMenuItems} size="sm" />
      </div>
    </div>
  );
}