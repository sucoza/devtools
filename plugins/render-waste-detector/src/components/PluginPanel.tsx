import React, { useEffect, useMemo } from "react";
import { useSyncExternalStore } from "use-sync-external-store/shim";
import {
  Activity,
  BarChart3,
  Flame,
  Lightbulb,
  Clock,
  Settings,
} from "lucide-react";
import {
  PluginPanel as BasePluginPanel,
  ScrollableContainer,
  ConfigMenu,
  ThemeProvider,
} from '@sucoza/shared-components';
import '@sucoza/shared-components/dist/styles/theme.css';

import type {
  RenderWasteDetectorPanelProps,
  DevToolsTab,
  RenderWasteDetectorState,
  OptimizationSuggestion,
} from "../types";
import {
  createRenderWasteDetectorDevToolsClient,
  getRenderWasteDetectorDevToolsClient,
} from "../core";

// Tab Components
import OverviewTab from "./tabs/OverviewTab";
import ComponentsTab from "./tabs/ComponentsTab";
import HeatMapTab from "./tabs/HeatMapTab";
import SuggestionsTab from "./tabs/SuggestionsTab";
import TimelineTab from "./tabs/TimelineTab";
import SettingsTab from "./tabs/SettingsTab";

/**
 * Main Render Waste Detector DevTools Panel (Inner component)
 */
function PluginPanelInner({
  className,
  style: _style,
  theme: _theme = "auto",
  compact = false,
  defaultTab: _defaultTab = "overview",
  defaultSettings,
  onTabChange,
  onEvent: _onEvent,
  onComponentSelect,
  onSuggestionApply,
  children,
}: RenderWasteDetectorPanelProps) {
  // Create or get event client
  const eventClient = useMemo(() => {
    return getRenderWasteDetectorDevToolsClient() || createRenderWasteDetectorDevToolsClient();
  }, []);

  // Apply default settings on mount only
  useEffect(() => {
    if (defaultSettings) {
      eventClient.updateSettings(defaultSettings);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Subscribe to state changes
  const state = useSyncExternalStore<RenderWasteDetectorState>(
    eventClient.subscribe,
    eventClient.getState,
    eventClient.getState,
  );

  // Handle tab changes
  const handleTabChange = (tab: DevToolsTab) => {
    eventClient.selectTab(tab);
    onTabChange?.(tab);
  };

  // Handle component selection
  const handleComponentSelect = (componentId: string | null) => {
    eventClient.selectComponent(componentId);
    onComponentSelect?.(componentId);
  };

  // Handle suggestion application
  const handleSuggestionApply = (suggestionId: string) => {
    const suggestion = state.suggestions.find(
      (s: OptimizationSuggestion) => s.id === suggestionId,
    );
    if (suggestion) {
      eventClient.applySuggestion(suggestionId);
      onSuggestionApply?.(suggestion);
    }
  };

  // Tab configuration
  const tabs = [
    {
      id: "overview",
      label: "Overview",
      icon: Activity,
    },
    {
      id: "components",
      label: "Components",
      icon: BarChart3,
      badge: state.components.size,
    },
    {
      id: "heatmap",
      label: "Heat Map",
      icon: Flame,
    },
    {
      id: "suggestions",
      label: "Suggestions",
      icon: Lightbulb,
      badge: state.suggestions.length,
    },
    {
      id: "timeline",
      label: "Timeline",
      icon: Clock,
    },
    {
      id: "settings",
      label: "Settings",
      icon: Settings,
    },
  ];

  const activeTab = state.ui.activeTab;

  // Calculate recording status
  const isRecording = state.recording.isRecording;
  const isPaused = state.recording.isPaused;
  const hasData = state.renderEvents.length > 0 || state.components.size > 0;

  // ConfigMenu items
  const configMenuItems = [
    {
      id: 'start-detection',
      label: isRecording
        ? isPaused
          ? 'Resume Detection'
          : 'Pause Detection'
        : 'Start Detection',
      icon: '▶️',
      shortcut: 'Ctrl+R',
      onClick: () => {
        if (isRecording) {
          if (isPaused) {
            eventClient.resumeRecording();
          } else {
            eventClient.pauseRecording();
          }
        } else {
          eventClient.startRecording();
        }
      },
    },
    {
      id: 'stop-detection',
      label: 'Stop Detection',
      icon: '⏹️',
      onClick: () => eventClient.stopRecording(),
      disabled: !isRecording,
    },
    {
      id: 'clear-results',
      label: 'Clear Results',
      icon: '🗑️',
      shortcut: 'Ctrl+K',
      onClick: () => eventClient.clearRecording(),
      disabled: !hasData,
    },
    {
      id: 'generate-report',
      label: 'Generate Report',
      icon: '📊',
      shortcut: 'Ctrl+G',
      onClick: async () => {
        if (!state.performance.isAnalyzing) {
          await eventClient.startAnalysis();
        }
      },
      disabled: !hasData || state.performance.isAnalyzing,
    },
    {
      id: 'export-session',
      label: 'Export Session',
      icon: '💾',
      shortcut: 'Ctrl+E',
      onClick: () => {
        const session = eventClient.exportSession();
        if (session) {
          const blob = new Blob([JSON.stringify(session, null, 2)], {
            type: "application/json",
          });
          const url = URL.createObjectURL(blob);
          try {
            const a = document.createElement("a");
            a.href = url;
            a.download = `render-waste-session-${Date.now()}.json`;
            a.click();
          } finally {
            URL.revokeObjectURL(url);
          }
        }
      },
      disabled: !hasData,
      separator: true,
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: '⚙️',
      shortcut: 'Ctrl+S',
      onClick: () => handleTabChange('settings'),
    },
  ];

  // Footer stats
  const footerStats = [
    { label: 'Components', value: state.components.size.toString() },
    { label: 'Render Events', value: state.renderEvents.length.toString() },
    { label: 'Waste', value: `${state.stats.wastePercentage.toFixed(1)}%` },
  ];

  if (isRecording) {
    footerStats.push({
      label: 'Recording',
      value: isPaused ? 'Paused' : 'Active',
    });
  }

  if (state.performance.isAnalyzing) {
    footerStats.push({
      label: 'Analysis',
      value: `${state.performance.analysisProgress}%`,
    });
  }

  footerStats.push({
    label: 'Session',
    value: state.recording.activeSession?.name || 'None',
  });

  const pluginTabs = tabs.map(tab => ({
    id: tab.id,
    label: tab.label,
    icon: tab.icon,
    badge: tab.badge ? { count: tab.badge } : undefined,
    content: (
      <ScrollableContainer style={{ height: '100%' }}>
        {tab.id === "overview" && (
          <OverviewTab
            state={state}
            eventClient={eventClient}
            compact={compact}
            onComponentSelect={handleComponentSelect}
            onSuggestionApply={handleSuggestionApply}
          />
        )}
        {tab.id === "components" && (
          <ComponentsTab
            state={state}
            eventClient={eventClient}
            compact={compact}
            onComponentSelect={handleComponentSelect}
            onSuggestionApply={handleSuggestionApply}
          />
        )}
        {tab.id === "heatmap" && (
          <HeatMapTab
            state={state}
            eventClient={eventClient}
            compact={compact}
            onComponentSelect={handleComponentSelect}
            onSuggestionApply={handleSuggestionApply}
          />
        )}
        {tab.id === "suggestions" && (
          <SuggestionsTab
            state={state}
            eventClient={eventClient}
            compact={compact}
            onComponentSelect={handleComponentSelect}
            onSuggestionApply={handleSuggestionApply}
          />
        )}
        {tab.id === "timeline" && (
          <TimelineTab
            state={state}
            eventClient={eventClient}
            compact={compact}
            onComponentSelect={handleComponentSelect}
            onSuggestionApply={handleSuggestionApply}
          />
        )}
        {tab.id === "settings" && (
          <SettingsTab
            state={state}
            eventClient={eventClient}
            compact={compact}
            onComponentSelect={handleComponentSelect}
            onSuggestionApply={handleSuggestionApply}
          />
        )}
      </ScrollableContainer>
    )
  }));

  return (
    <div className={className} style={{ position: 'relative' }}>
      <BasePluginPanel
        title="Render Waste Detector"
        icon={Flame}
        subtitle={
          isRecording 
            ? isPaused 
              ? 'Paused'
              : 'Recording'
            : 'Idle'
        }
        status={{
          isActive: isRecording,
          label: isRecording ? 'Recording' : 'Idle'
        }}
        tabs={pluginTabs}
        activeTabId={activeTab}
        onTabChange={(tabId) => handleTabChange(tabId as DevToolsTab)}
        metrics={footerStats}
        showMetrics={true}
      />
      
      {/* ConfigMenu overlay */}
      <div style={{
        position: 'absolute',
        top: '12px',
        right: '12px',
        zIndex: 10
      }}>
        <ConfigMenu items={configMenuItems} size="sm" />
      </div>
      
      {children}
    </div>
  );
}

/**
 * Render Waste Detector DevTools Panel with Theme Provider
 */
export function PluginPanel(props: RenderWasteDetectorPanelProps) {
  const { theme = "auto" } = props;

  // Resolve theme
  const resolvedTheme = useMemo(() => {
    if (theme === "auto") {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return theme;
  }, [theme]);

  return (
    <ThemeProvider defaultTheme={resolvedTheme}>
      <PluginPanelInner {...props} />
    </ThemeProvider>
  );
}

export default PluginPanel;
