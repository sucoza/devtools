import React, { useState, useEffect, useMemo } from 'react';
import { 
  FeatureFlagDevToolsClient, 
  FeatureFlagDevToolsState, 
  PanelTab 
} from '../types';
import {
  Tabs,
  Badge,
  Toolbar
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
import { RefreshCw, Settings, User } from 'lucide-react';

interface FeatureFlagManagerPanelProps {
  client: FeatureFlagDevToolsClient;
  theme?: 'light' | 'dark' | 'auto';
  defaultTab?: PanelTab;
  height?: number;
}

export const FeatureFlagManagerPanel: React.FC<FeatureFlagManagerPanelProps> = ({
  client,
  theme = 'auto',
  defaultTab = 'dashboard',
  height = 600
}) => {
  const [state, setState] = useState<FeatureFlagDevToolsState | null>(null);
  const [activeTab, setActiveTab] = useState<PanelTab>(defaultTab);
  const [showUserContext, setShowUserContext] = useState(false);
  const [notifications, setNotifications] = useState<Array<{ id: string; type: 'info' | 'success' | 'warning' | 'error'; message: string }>>([]);

  // Subscribe to state changes
  useEffect(() => {
    const unsubscribe = client.subscribe((newState) => {
      setState(newState);
    });

    return () => unsubscribe();
  }, [client]);

  // Handle theme
  const resolvedTheme = useMemo(() => {
    if (theme === 'auto') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return theme;
  }, [theme]);

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
        className={`feature-flag-manager-panel ${resolvedTheme}`}
        style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <div className="text-gray-500">Loading feature flags...</div>
      </div>
    );
  }

  const tabs = [
    {
      id: 'dashboard',
      label: 'Dashboard',
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
      label: 'Flags',
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
      label: 'Overrides',
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
      label: 'Experiments',
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
      label: 'Segments',
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
      label: 'History',
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
      label: 'Settings',
      icon: <Settings size={16} />,
      content: (
        <SettingsTab
          state={state}
          client={client}
        />
      )
    }
  ];

  return (
    <div 
      className={`feature-flag-manager-panel ${resolvedTheme}`}
      style={{ height, display: 'flex', flexDirection: 'column' }}
    >
      {/* Notifications */}
      {notifications.length > 0 && (
        <NotificationBar
          notifications={notifications}
          onRemove={removeNotification}
        />
      )}

      {/* Header */}
      <Toolbar
        title="Feature Flag Manager"
        actions={[
          {
            id: 'refresh',
            label: 'Refresh',
            icon: <RefreshCw size={16} />,
            onClick: handleRefresh,
            variant: 'primary',
            tooltip: 'Refresh flags'
          },
          {
            id: 'user-context',
            label: 'User Context',
            icon: <User size={16} />,
            onClick: () => setShowUserContext(!showUserContext),
            variant: showUserContext ? 'primary' : 'default',
            tooltip: 'Toggle user context panel'
          }
        ]}
        size="md"
        variant="default"
      />

      {/* User Context Panel */}
      {showUserContext && (
        <div style={{ padding: '16px', borderBottom: '1px solid #e5e7eb' }}>
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

      <style>{`
        .feature-flag-manager-panel {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
          font-size: 14px;
          background-color: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          overflow: hidden;
        }
        
        .feature-flag-manager-panel.dark {
          background-color: #1f2937;
          border-color: #374151;
          color: #f9fafb;
        }
        
        .panel-header {
          background-color: #f9fafb;
        }
        
        .dark .panel-header {
          background-color: #374151;
          border-color: #4b5563;
        }
        
        button:hover {
          opacity: 0.9;
        }
        
        button:active {
          transform: scale(0.98);
        }
      `}</style>
    </div>
  );
};