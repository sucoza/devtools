import React, { useState, useEffect, useMemo } from 'react';
import { Trans } from '@lingui/macro';
import {
  FeatureFlagDevToolsClient,
  FeatureFlagDevToolsState,
  PanelTab
} from '../types';
import {
  Tabs,
  Badge,
  ConfigMenu,
  type ConfigMenuItem,
  ThemeProvider,
  getColors,
  TYPOGRAPHY,
  SPACING,
  RADIUS
} from '@sucoza/shared-components';
import { DashboardTab } from './DashboardTab';
import { FlagsTab } from './FlagsTab';
import { OverridesTab } from './OverridesTab';
import { ExperimentsTab } from './ExperimentsTab';
import { SegmentsTab } from './SegmentsTab';
import { HistoryTab } from './HistoryTab';
import { SettingsTab } from './SettingsTab';
import { UserContextPanel } from './UserContextPanel';
import { NotificationBar } from './NotificationBar';
import { Settings } from 'lucide-react';

interface FeatureFlagManagerPanelProps {
  client: FeatureFlagDevToolsClient;
  theme?: 'light' | 'dark' | 'auto';
  defaultTab?: PanelTab;
  height?: number;
}

const FeatureFlagManagerPanelInner: React.FC<FeatureFlagManagerPanelProps & { resolvedTheme: 'light' | 'dark' }> = ({
  client,
  resolvedTheme,
  defaultTab = 'dashboard',
  height = 600
}) => {
  const [state, setState] = useState<FeatureFlagDevToolsState | null>(null);
  const [activeTab, setActiveTab] = useState<PanelTab>(defaultTab);
  const [showUserContext, setShowUserContext] = useState(false);
  const [notifications, setNotifications] = useState<Array<{ id: string; type: 'info' | 'success' | 'warning' | 'error'; message: string }>>([]);

  const COLORS = useMemo(() => getColors(resolvedTheme), [resolvedTheme]);

  // Subscribe to state changes
  useEffect(() => {
    const unsubscribe = client.subscribe((newState) => {
      setState(newState);
    });

    return () => unsubscribe();
  }, [client]);

  // Add notification
  const addNotification = (type: 'info' | 'success' | 'warning' | 'error', message: string) => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { id, type, message }]);

    // Auto remove after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  // Remove notification
  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Handle flag toggle
  const handleToggleFlag = async (flagId: string, enabled: boolean) => {
    try {
      const flag = state?.flags.get(flagId);
      if (flag && flag.type === 'boolean') {
        await client.setOverride({
          flagId,
          value: enabled,
          reason: 'Toggled from DevTools',
          userId: state?.currentContext.userId
        });
        addNotification('success', `Flag "${flag.name}" ${enabled ? 'enabled' : 'disabled'}`);
      }
    } catch (error) {
      addNotification('error', `Failed to toggle flag: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Handle context change
  const handleContextChange = async (context: any) => {
    try {
      await client.setEvaluationContext(context);
      addNotification('success', 'User context updated');
    } catch (error) {
      addNotification('error', `Failed to update context: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Handle refresh
  const handleRefresh = async () => {
    try {
      await client.refreshFlags();
      addNotification('success', 'Flags refreshed');
    } catch (error) {
      addNotification('error', `Failed to refresh flags: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  if (!state) {
    return (
      <div
        className="dt-plugin-panel"
        data-theme={resolvedTheme}
        style={{
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: TYPOGRAPHY.fontFamily.sans,
          fontSize: TYPOGRAPHY.fontSize.sm,
          backgroundColor: COLORS.background.primary,
          border: `1px solid ${COLORS.border.primary}`,
          borderRadius: RADIUS.lg,
          color: COLORS.text.primary
        }}
      >
        <div style={{ color: COLORS.text.muted }}>
          <Trans>Loading feature flags...</Trans>
        </div>
      </div>
    );
  }

  const tabs = [
    {
      id: 'dashboard',
      label: <Trans>Dashboard</Trans>,
      content: (
        <DashboardTab
          state={state}
          client={client}
          onToggleFlag={handleToggleFlag}
          onNavigateToTab={setActiveTab}
        />
      )
    },
    {
      id: 'flags',
      label: <Trans>Flags</Trans>,
      badge: state.flags.size > 0 ? <Badge size="xs" variant="primary">{state.flags.size}</Badge> : undefined,
      content: (
        <FlagsTab
          state={state}
          client={client}
          onToggleFlag={handleToggleFlag}
        />
      )
    },
    {
      id: 'overrides',
      label: <Trans>Overrides</Trans>,
      badge: state.overrides.size > 0 ? <Badge size="xs" variant="warning">{state.overrides.size}</Badge> : undefined,
      content: (
        <OverridesTab
          state={state}
          client={client}
        />
      )
    },
    {
      id: 'experiments',
      label: <Trans>Experiments</Trans>,
      badge: state.experiments.length > 0 ? <Badge size="xs" variant="info">{state.experiments.length}</Badge> : undefined,
      content: (
        <ExperimentsTab
          state={state}
          client={client}
        />
      )
    },
    {
      id: 'segments',
      label: <Trans>Segments</Trans>,
      badge: state.userSegments.length > 0 ? <Badge size="xs" variant="info">{state.userSegments.length}</Badge> : undefined,
      content: (
        <SegmentsTab
          state={state}
          client={client}
        />
      )
    },
    {
      id: 'history',
      label: <Trans>History</Trans>,
      badge: state.evaluationHistory.length > 0 ? <Badge size="xs" variant="default">{state.evaluationHistory.length}</Badge> : undefined,
      content: (
        <HistoryTab
          state={state}
          client={client}
        />
      )
    },
    {
      id: 'settings',
      label: <Trans>Settings</Trans>,
      icon: <Settings size={16} />,
      content: (
        <SettingsTab
          state={state}
          client={client}
        />
      )
    }
  ];

  const configMenuItems: ConfigMenuItem[] = [
    {
      id: 'refresh',
      label: <Trans>Refresh Flags</Trans>,
      icon: '🔄',
      onClick: handleRefresh,
      shortcut: 'Ctrl+R'
    },
    {
      id: 'user-context',
      label: showUserContext ? <Trans>Hide User Context</Trans> : <Trans>Show User Context</Trans>,
      icon: '👤',
      onClick: () => setShowUserContext(!showUserContext)
    },
    {
      id: 'add-flag',
      label: <Trans>Add New Flag</Trans>,
      icon: '➕',
      onClick: () => console.log('Add new flag clicked'),
      separator: true
    },
    {
      id: 'import-export',
      label: <Trans>Import/Export Flags</Trans>,
      icon: '💾',
      onClick: () => console.log('Import/Export clicked'),
      shortcut: 'Ctrl+E'
    },
    {
      id: 'clear-overrides',
      label: <Trans>Clear All Overrides</Trans>,
      icon: '🗑️',
      onClick: () => console.log('Clear overrides clicked')
    },
    {
      id: 'settings',
      label: <Trans>Settings</Trans>,
      icon: '⚙️',
      onClick: () => setActiveTab('settings'),
      separator: true
    }
  ];

  return (
    <div
      className="dt-plugin-panel"
      data-theme={resolvedTheme}
      style={{
        height,
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        fontFamily: TYPOGRAPHY.fontFamily.sans,
        fontSize: TYPOGRAPHY.fontSize.sm,
        backgroundColor: COLORS.background.primary,
        border: `1px solid ${COLORS.border.primary}`,
        borderRadius: RADIUS.lg,
        overflow: 'hidden',
        color: COLORS.text.primary
      }}
    >
      {/* Notifications */}
      {notifications.length > 0 && (
        <NotificationBar
          notifications={notifications}
          onRemove={removeNotification}
        />
      )}

      {/* ConfigMenu Overlay */}
      <div style={{ position: 'absolute', top: '12px', right: '12px', zIndex: 10 }}>
        <ConfigMenu items={configMenuItems} size="sm" />
      </div>

      {/* User Context Panel */}
      {showUserContext && (
        <div style={{
          padding: SPACING['2xl'],
          borderBottom: `1px solid ${COLORS.border.primary}`,
          backgroundColor: COLORS.background.secondary
        }}>
          <UserContextPanel
            context={state.currentContext}
            segments={state.userSegments}
            onChange={handleContextChange}
          />
        </div>
      )}

      {/* Tab Navigation and Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Tabs
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={(tabId) => setActiveTab(tabId as PanelTab)}
          variant="underline"
          size="md"
          panelStyle={{ flex: 1, overflow: 'hidden', padding: 0 }}
        />
      </div>

    </div>
  );
};

export const FeatureFlagManagerPanel: React.FC<FeatureFlagManagerPanelProps> = ({
  theme = 'auto',
  ...props
}) => {
  // Handle theme
  const resolvedTheme = useMemo(() => {
    if (theme === 'auto') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return theme;
  }, [theme]);

  return (
    <ThemeProvider defaultTheme={resolvedTheme}>
      <FeatureFlagManagerPanelInner {...props} resolvedTheme={resolvedTheme} />
    </ThemeProvider>
  );
};
