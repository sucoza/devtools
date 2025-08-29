import React, { useState, useEffect, useMemo } from 'react';
import { 
  FeatureFlagDevToolsClient, 
  FeatureFlagDevToolsState, 
  PanelTab 
} from '../types';
import { DashboardTab } from './DashboardTab';
import { FlagsTab } from './FlagsTab';
import { OverridesTab } from './OverridesTab';
import { ExperimentsTab } from './ExperimentsTab';
import { SegmentsTab } from './SegmentsTab';
import { HistoryTab } from './HistoryTab';
import { SettingsTab } from './SettingsTab';
import { TabNavigation } from './TabNavigation';
import { UserContextPanel } from './UserContextPanel';
import { NotificationBar } from './NotificationBar';

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

  const tabs: Array<{ id: PanelTab; label: string; count?: number }> = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'flags', label: 'Flags', count: state.flags.size },
    { id: 'overrides', label: 'Overrides', count: state.overrides.size },
    { id: 'experiments', label: 'Experiments', count: state.experiments.length },
    { id: 'segments', label: 'Segments', count: state.userSegments.length },
    { id: 'history', label: 'History', count: state.evaluationHistory.length },
    { id: 'settings', label: 'Settings' }
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
      <div className="panel-header" style={{ borderBottom: '1px solid #e5e7eb', padding: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>
            Feature Flag Manager
          </h2>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleRefresh}
              style={{
                padding: '6px 12px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Refresh
            </button>
            <button
              onClick={() => setShowUserContext(!showUserContext)}
              style={{
                padding: '6px 12px',
                backgroundColor: showUserContext ? '#10b981' : '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              User Context
            </button>
          </div>
        </div>

        {/* User Context Panel */}
        {showUserContext && (
          <div style={{ marginTop: '16px', padding: '16px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
            <UserContextPanel
              context={state.currentContext}
              segments={state.userSegments}
              onChange={handleContextChange}
            />
          </div>
        )}
      </div>

      {/* Tab Navigation */}
      <TabNavigation
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Tab Content */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        {activeTab === 'dashboard' && (
          <DashboardTab
            state={state}
            client={client}
            onToggleFlag={handleToggleFlag}
            onNavigateToTab={setActiveTab}
          />
        )}
        
        {activeTab === 'flags' && (
          <FlagsTab
            state={state}
            client={client}
            onToggleFlag={handleToggleFlag}
          />
        )}
        
        {activeTab === 'overrides' && (
          <OverridesTab
            state={state}
            client={client}
          />
        )}
        
        {activeTab === 'experiments' && (
          <ExperimentsTab
            state={state}
            client={client}
          />
        )}
        
        {activeTab === 'segments' && (
          <SegmentsTab
            state={state}
            client={client}
          />
        )}
        
        {activeTab === 'history' && (
          <HistoryTab
            state={state}
            client={client}
          />
        )}
        
        {activeTab === 'settings' && (
          <SettingsTab
            state={state}
            client={client}
          />
        )}
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