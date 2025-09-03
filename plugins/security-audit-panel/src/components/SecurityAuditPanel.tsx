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
    { id: 'dashboard', label: 'Dashboard', icon: Shield },
    { id: 'vulnerabilities', label: 'Vulnerabilities', icon: AlertTriangle },
    { id: 'scanners', label: 'Scanners', icon: Search },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  // Prepare toolbar actions
  const toolbarActions = [
    {
      icon: Play,
      label: state.isScanning ? 'Scanning...' : 'Start Scan',
      onClick: handleStartScan,
      disabled: state.isScanning,
      variant: 'primary' as const,
    },
    ...(state.isScanning ? [{
      icon: Square,
      label: 'Stop',
      onClick: handleStopScan,
      variant: 'danger' as const,
    }] : []),
    {
      icon: RotateCcw,
      label: 'Clear',
      onClick: handleClearVulnerabilities,
      disabled: state.metrics.totalVulnerabilities === 0,
    },
    {
      icon: Download,
      label: 'Export',
      onClick: handleExport,
      disabled: state.metrics.totalVulnerabilities === 0,
      variant: 'secondary' as const,
    },
  ];

  const getVulnerabilityCountBySeverity = (severity: string) => {
    return state.metrics.vulnerabilitiesBySeverity[severity as keyof typeof state.metrics.vulnerabilitiesBySeverity] || 0;
  };

  // Footer stats
  const footerStats = [
    { label: 'Total', value: state.metrics.totalVulnerabilities.toString() },
    { label: 'Critical', value: getVulnerabilityCountBySeverity('critical').toString() },
    { label: 'High', value: getVulnerabilityCountBySeverity('high').toString() },
    { label: 'Medium', value: getVulnerabilityCountBySeverity('medium').toString() },
    { label: 'Low', value: getVulnerabilityCountBySeverity('low').toString() },
    { label: 'Security Score', value: `${state.metrics.securityScore}/100` },
  ];

  return (
    <PluginPanel
      title="Security Audit Panel"
      icon={Shield}
      className={className}
      headerContent={(
        <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.xs }}>
          {state.isScanning && (
            <StatusIndicator
              status="loading"
              size="sm"
              label=""
            />
          )}
          <span style={{ 
            fontSize: '12px',
            color: COLORS.text.secondary,
            ...TYPOGRAPHY.caption 
          }}>
            {state.metrics.totalVulnerabilities} vulnerabilities
          </span>
        </div>
      )}
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
              backgroundColor: COLORS.status.danger, 
              borderRadius: RADIUS.sm 
            }} />
            <span style={{ ...TYPOGRAPHY.body.small, color: COLORS.text.primary }}>
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
            <span style={{ ...TYPOGRAPHY.body.small, color: COLORS.text.primary }}>
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
            <span style={{ ...TYPOGRAPHY.body.small, color: COLORS.text.primary }}>
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
            <span style={{ ...TYPOGRAPHY.body.small, color: COLORS.text.primary }}>
              Low: {getVulnerabilityCountBySeverity('low')}
            </span>
          </div>
        </div>

        <div style={{ 
          ...TYPOGRAPHY.body.small, 
          color: COLORS.text.secondary 
        }}>
          Security Score: {state.metrics.securityScore}/100
        </div>
      </div>

      <Tabs
        activeTab={state.ui.activeTab}
        onTabChange={(tabId) => actions.selectTab(tabId as typeof state.ui.activeTab)}
        tabs={tabs}
      >
        <ScrollableContainer>
          {state.ui.activeTab === 'dashboard' && <DashboardTab />}
          {state.ui.activeTab === 'vulnerabilities' && <VulnerabilitiesTab />}
          {state.ui.activeTab === 'scanners' && <ScannersTab />}
          {state.ui.activeTab === 'reports' && <ReportsTab />}
          {state.ui.activeTab === 'settings' && <SettingsTab />}
        </ScrollableContainer>
      </Tabs>

      <Footer stats={footerStats} />
    </PluginPanel>
  );
}