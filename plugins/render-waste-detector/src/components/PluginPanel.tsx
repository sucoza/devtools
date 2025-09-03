import React from "react";
import { useSyncExternalStore } from "use-sync-external-store/shim";
import {
  Activity,
  BarChart3,
  Flame,
  Lightbulb,
  Clock,
  Settings,
  Square,
  Pause,
  RotateCcw,
  Download,
  Upload,
} from "lucide-react";
import {
  PluginPanel as BasePluginPanel,
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

import type {
  RenderWasteDetectorPanelProps,
  DevToolsTab,
  RenderWasteDetectorState,
  RenderWasteDetectorAction,
  OptimizationSuggestion,
} from "../types";
import {
  createRenderWasteDetectorEventClient,
  getRenderWasteDetectorEventClient,
} from "../core";

// Tab Components
import OverviewTab from "./tabs/OverviewTab";
import ComponentsTab from "./tabs/ComponentsTab";
import HeatMapTab from "./tabs/HeatMapTab";
import SuggestionsTab from "./tabs/SuggestionsTab";
import TimelineTab from "./tabs/TimelineTab";
import SettingsTab from "./tabs/SettingsTab";

/**
 * Main Render Waste Detector DevTools Panel
 */
export function PluginPanel({
  className,
  style,
  theme = "auto",
  compact = false,
  defaultTab: _defaultTab = "overview",
  defaultSettings,
  onTabChange,
  onEvent,
  onComponentSelect,
  onSuggestionApply,
  children,
}: RenderWasteDetectorPanelProps) {
  // Create or get event client
  const eventClient = (() => {
    const client =
      getRenderWasteDetectorEventClient() ||
      createRenderWasteDetectorEventClient();

    // Apply default settings if provided
    if (defaultSettings) {
      client.updateSettings(defaultSettings);
    }

    return client;
  })();

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

  // Handle events
  const handleEvent = (action: RenderWasteDetectorAction) => {
    eventClient.dispatch(action);
    onEvent?.(action);
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

  // Prepare toolbar actions
  const toolbarActions = [
    {
      id: 'record-control',
      icon: isRecording && !isPaused ? Pause : Activity,
      label: isRecording
        ? isPaused
          ? "Resume Recording"
          : "Pause Recording"
        : "Start Recording",
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
      variant: (isRecording && !isPaused ? 'primary' : 'default') as 'primary' | 'default' | 'danger',
    },
    {
      id: 'stop',
      icon: Square,
      label: "Stop Recording",
      onClick: () => eventClient.stopRecording(),
      disabled: !isRecording,
    },
    {
      id: 'clear',
      icon: RotateCcw,
      label: "Clear Data",
      onClick: () => eventClient.clearRecording(),
      disabled: !hasData,
    },
    {
      id: 'analyze',
      icon: Lightbulb,
      label: "Analyze Render Waste",
      onClick: async () => {
        if (!state.performance.isAnalyzing) {
          await eventClient.startAnalysis();
        }
      },
      disabled: !hasData || state.performance.isAnalyzing,
      variant: 'primary' as 'primary' | 'default' | 'danger',
    },
    {
      id: 'export',
      icon: Download,
      label: "Export Session",
      onClick: () => {
        const session = eventClient.exportSession();
        if (session) {
          const blob = new Blob([JSON.stringify(session, null, 2)], {
            type: "application/json",
          });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `render-waste-session-${Date.now()}.json`;
          a.click();
          URL.revokeObjectURL(url);
        }
      },
      disabled: !hasData,
    },
    {
      icon: Upload,
      label: "Import Session",
      onClick: () => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".json";
        input.onchange = (e) => {
          const file = (e.target as HTMLInputElement).files?.[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
              try {
                const session = JSON.parse(e.target?.result as string);
                eventClient.importSession(session);
              } catch (error) {
                console.error("Failed to import session:", error);
              }
            };
            reader.readAsText(file);
          }
        };
        input.click();
      },
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

  return (
    <BasePluginPanel
      title="Render Waste Detector"
      icon={Flame}
      className={className}
    >
      <Toolbar actions={toolbarActions} />

      <div>
        <Tabs
          activeTab={activeTab}
          onTabChange={(tabId) => handleTabChange(tabId as DevToolsTab)}
          tabs={tabs.map(tab => ({
            id: tab.id,
            label: tab.label,
            icon: tab.icon,
            badge: tab.badge,
          }))}
        />
        <ScrollableContainer>
          {activeTab === "overview" && (
            <OverviewTab
              state={state}
              eventClient={eventClient}
              dispatch={handleEvent}
              compact={compact}
              onComponentSelect={handleComponentSelect}
              onSuggestionApply={handleSuggestionApply}
            />
          )}
          {activeTab === "components" && (
            <ComponentsTab
              state={state}
              eventClient={eventClient}
              dispatch={handleEvent}
              compact={compact}
              onComponentSelect={handleComponentSelect}
              onSuggestionApply={handleSuggestionApply}
            />
          )}
          {activeTab === "heatmap" && (
            <HeatMapTab
              state={state}
              eventClient={eventClient}
              dispatch={handleEvent}
              compact={compact}
              onComponentSelect={handleComponentSelect}
              onSuggestionApply={handleSuggestionApply}
            />
          )}
          {activeTab === "suggestions" && (
            <SuggestionsTab
              state={state}
              eventClient={eventClient}
              dispatch={handleEvent}
              compact={compact}
              onComponentSelect={handleComponentSelect}
              onSuggestionApply={handleSuggestionApply}
            />
          )}
          {activeTab === "timeline" && (
            <TimelineTab
              state={state}
              eventClient={eventClient}
              dispatch={handleEvent}
              compact={compact}
              onComponentSelect={handleComponentSelect}
              onSuggestionApply={handleSuggestionApply}
            />
          )}
          {activeTab === "settings" && (
            <SettingsTab
              state={state}
              eventClient={eventClient}
              dispatch={handleEvent}
              compact={compact}
              onComponentSelect={handleComponentSelect}
              onSuggestionApply={handleSuggestionApply}
            />
          )}
        </ScrollableContainer>
      </div>

      <Footer
        stats={footerStats.map((stat, index) => ({
          id: `stat-${index}`,
          ...stat
        }))}
      />

      {children}
    </BasePluginPanel>
  );
}

export default PluginPanel;
