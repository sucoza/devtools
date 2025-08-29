import * as React from "react";
import { useSyncExternalStore } from "use-sync-external-store/shim";
import { clsx } from "clsx";
import {
  Activity,
  BarChart3,
  Flame,
  Lightbulb,
  Clock,
  Settings,
  Play,
  Square,
  Pause,
  RotateCcw,
  Download,
  Upload,
} from "lucide-react";

import type {
  RenderWasteDetectorPanelProps,
  DevToolsTab,
  RenderWasteDetectorState,
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
  defaultTab = "overview",
  defaultSettings,
  onTabChange,
  onEvent,
  onComponentSelect,
  onSuggestionApply,
  children,
}: RenderWasteDetectorPanelProps) {
  // Create or get event client
  const eventClient = (React as any).useMemo(() => {
    const client =
      getRenderWasteDetectorEventClient() ||
      createRenderWasteDetectorEventClient();

    // Apply default settings if provided
    if (defaultSettings) {
      client.updateSettings(defaultSettings);
    }

    return client;
  }, [defaultSettings]);

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
  const handleEvent = (action: any) => {
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
      (s: any) => s.id === suggestionId,
    );
    if (suggestion) {
      eventClient.applySuggestion(suggestionId);
      onSuggestionApply?.(suggestion);
    }
  };

  // Tab configuration
  const tabs: Array<{
    id: DevToolsTab;
    label: string;
    icon: any;
    component: any;
    badge?: number;
  }> = [
    {
      id: "overview",
      label: "Overview",
      icon: Activity,
      component: OverviewTab,
    },
    {
      id: "components",
      label: "Components",
      icon: BarChart3,
      component: ComponentsTab,
      badge: state.components.size,
    },
    {
      id: "heatmap",
      label: "Heat Map",
      icon: Flame,
      component: HeatMapTab,
    },
    {
      id: "suggestions",
      label: "Suggestions",
      icon: Lightbulb,
      component: SuggestionsTab,
      badge: state.suggestions.length,
    },
    {
      id: "timeline",
      label: "Timeline",
      icon: Clock,
      component: TimelineTab,
    },
    {
      id: "settings",
      label: "Settings",
      icon: Settings,
      component: SettingsTab,
    },
  ];

  const activeTab = state.ui.activeTab;
  const ActiveTabComponent =
    tabs.find((tab) => tab.id === activeTab)?.component || OverviewTab;

  // Calculate recording status
  const isRecording = state.recording.isRecording;
  const isPaused = state.recording.isPaused;
  const hasData = state.renderEvents.length > 0 || state.components.size > 0;

  return (
    <div
      className={clsx(
        "render-waste-detector-devtools",
        `theme-${theme}`,
        { compact: compact },
        className,
      )}
      style={style}
      data-testid="render-waste-detector-devtools"
    >
      {/* Header */}
      <div className="devtools-header">
        <div className="devtools-title">
          <Flame size={16} />
          <span>Render Waste Detector</span>
          {state.performance.isAnalyzing && (
            <div className="analysis-indicator">
              <div className="spinner" />
              <span>Analyzing...</span>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="quick-actions">
          <button
            onClick={() => {
              if (isRecording) {
                if (isPaused) {
                  eventClient.resumeRecording();
                } else {
                  eventClient.pauseRecording();
                }
              } else {
                eventClient.startRecording();
              }
            }}
            className={clsx("quick-action-btn", {
              recording: isRecording && !isPaused,
              paused: isPaused,
            })}
            title={
              isRecording
                ? isPaused
                  ? "Resume Recording"
                  : "Pause Recording"
                : "Start Recording"
            }
          >
            {isRecording && !isPaused ? (
              <Pause size={14} />
            ) : (
              <Activity size={14} />
            )}
          </button>

          <button
            onClick={() => eventClient.stopRecording()}
            disabled={!isRecording}
            className="quick-action-btn"
            title="Stop Recording"
          >
            <Square size={14} />
          </button>

          <button
            onClick={() => eventClient.clearRecording()}
            disabled={!hasData}
            className="quick-action-btn"
            title="Clear Data"
          >
            <RotateCcw size={14} />
          </button>

          <div className="divider" />

          <button
            onClick={async () => {
              if (!state.performance.isAnalyzing) {
                await eventClient.startAnalysis();
              }
            }}
            disabled={!hasData || state.performance.isAnalyzing}
            className="quick-action-btn analyze-btn"
            title="Analyze Render Waste"
          >
            <Lightbulb size={14} />
          </button>

          <button
            onClick={() => {
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
            }}
            disabled={!hasData}
            className="quick-action-btn"
            title="Export Session"
          >
            <Download size={14} />
          </button>

          <button
            onClick={() => {
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
            }}
            className="quick-action-btn"
            title="Import Session"
          >
            <Upload size={14} />
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="tab-navigation">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={clsx("tab-button", {
              active: activeTab === tab.id,
            })}
            title={tab.label}
          >
            <tab.icon size={compact ? 14 : 16} />
            {!compact && <span>{tab.label}</span>}
            {tab.badge !== undefined && tab.badge > 0 && (
              <span className="badge">{tab.badge}</span>
            )}
          </button>
        ))}
      </div>

      {/* Status Bar */}
      <div className="status-bar">
        <div className="status-item">
          <span className="status-label">Components:</span>
          <span className="status-value">{state.components.size}</span>
        </div>

        <div className="status-item">
          <span className="status-label">Render Events:</span>
          <span className="status-value">{state.renderEvents.length}</span>
        </div>

        <div className="status-item">
          <span className="status-label">Waste:</span>
          <span className="status-value waste-indicator">
            {state.stats.wastePercentage.toFixed(1)}%
          </span>
        </div>

        {isRecording && (
          <div className="status-item">
            <span className="status-label">Recording:</span>
            <span
              className={clsx("status-indicator", {
                active: !isPaused,
                paused: isPaused,
              })}
            >
              {isPaused ? "Paused" : "Active"}
            </span>
          </div>
        )}

        {state.performance.isAnalyzing && (
          <div className="status-item">
            <span className="status-label">Analysis:</span>
            <span className="status-value">
              {state.performance.analysisProgress}%
            </span>
          </div>
        )}

        <div className="status-spacer" />

        <div className="status-item">
          <span className="status-label">Session:</span>
          <span className="status-value">
            {state.recording.activeSession?.name || "None"}
          </span>
        </div>
      </div>

      {/* Main Content */}
      <div className="tab-content">
        <ActiveTabComponent
          state={state}
          eventClient={eventClient}
          dispatch={handleEvent}
          compact={compact}
          onComponentSelect={handleComponentSelect}
          onSuggestionApply={handleSuggestionApply}
        />
      </div>

      {children}

      <style>{`
        .render-waste-detector-devtools {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: var(--bg-primary, #ffffff);
          border: 1px solid var(--border-color, #e1e5e9);
          border-radius: 8px;
          font-family:
            system-ui,
            -apple-system,
            "Segoe UI",
            sans-serif;
          font-size: 13px;
          overflow: hidden;
        }

        .theme-dark .render-waste-detector-devtools {
          background: var(--bg-primary, #1a1a1a);
          border-color: var(--border-color, #333);
          color: var(--text-primary, #ffffff);
        }

        .devtools-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 12px;
          background: var(--bg-secondary, #f8f9fa);
          border-bottom: 1px solid var(--border-color, #e1e5e9);
          flex-shrink: 0;
        }

        .theme-dark .devtools-header {
          background: var(--bg-secondary, #2a2a2a);
          border-color: var(--border-color, #333);
        }

        .devtools-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 600;
          color: var(--text-primary, #1a1a1a);
        }

        .theme-dark .devtools-title {
          color: var(--text-primary, #ffffff);
        }

        .analysis-indicator {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          color: var(--color-primary, #007bff);
        }

        .spinner {
          width: 12px;
          height: 12px;
          border: 2px solid var(--color-primary, #007bff);
          border-top-color: transparent;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .quick-actions {
          display: flex;
          gap: 4px;
          align-items: center;
        }

        .quick-action-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          border: none;
          border-radius: 4px;
          background: transparent;
          color: var(--text-secondary, #6c757d);
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .quick-action-btn:hover {
          background: var(--bg-hover, #e9ecef);
          color: var(--text-primary, #1a1a1a);
        }

        .quick-action-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .quick-action-btn.recording {
          background: var(--color-success, #28a745);
          color: white;
        }

        .quick-action-btn.paused {
          background: var(--color-warning, #ffc107);
          color: #1a1a1a;
        }

        .quick-action-btn.analyze-btn:not(:disabled) {
          background: var(--color-primary, #007bff);
          color: white;
        }

        .theme-dark .quick-action-btn:hover {
          background: var(--bg-hover, #3a3a3a);
          color: var(--text-primary, #ffffff);
        }

        .divider {
          width: 1px;
          height: 16px;
          background: var(--border-color, #e1e5e9);
          margin: 0 4px;
        }

        .theme-dark .divider {
          background: var(--border-color, #333);
        }

        .tab-navigation {
          display: flex;
          background: var(--bg-secondary, #f8f9fa);
          border-bottom: 1px solid var(--border-color, #e1e5e9);
          flex-shrink: 0;
        }

        .theme-dark .tab-navigation {
          background: var(--bg-secondary, #2a2a2a);
          border-color: var(--border-color, #333);
        }

        .tab-button {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 12px;
          border: none;
          background: transparent;
          color: var(--text-secondary, #6c757d);
          cursor: pointer;
          transition: all 0.2s ease;
          border-bottom: 2px solid transparent;
          position: relative;
        }

        .tab-button:hover {
          background: var(--bg-hover, #e9ecef);
          color: var(--text-primary, #1a1a1a);
        }

        .tab-button.active {
          color: var(--color-primary, #007bff);
          border-bottom-color: var(--color-primary, #007bff);
          background: var(--bg-active, #ffffff);
        }

        .theme-dark .tab-button:hover {
          background: var(--bg-hover, #3a3a3a);
          color: var(--text-primary, #ffffff);
        }

        .theme-dark .tab-button.active {
          background: var(--bg-active, #1a1a1a);
        }

        .badge {
          background: var(--color-primary, #007bff);
          color: white;
          font-size: 10px;
          padding: 2px 6px;
          border-radius: 10px;
          min-width: 16px;
          height: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 500;
        }

        .status-bar {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 6px 12px;
          background: var(--bg-tertiary, #f1f3f4);
          border-bottom: 1px solid var(--border-color, #e1e5e9);
          font-size: 11px;
          flex-shrink: 0;
        }

        .theme-dark .status-bar {
          background: var(--bg-tertiary, #333);
          border-color: var(--border-color, #444);
        }

        .status-item {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .status-label {
          color: var(--text-secondary, #6c757d);
        }

        .status-value {
          font-weight: 500;
          color: var(--text-primary, #1a1a1a);
        }

        .theme-dark .status-value {
          color: var(--text-primary, #ffffff);
        }

        .waste-indicator {
          color: var(--color-danger, #dc3545);
        }

        .status-indicator {
          padding: 2px 6px;
          border-radius: 2px;
          font-size: 10px;
          font-weight: 500;
          text-transform: uppercase;
        }

        .status-indicator.active {
          background: var(--color-success, #28a745);
          color: white;
        }

        .status-indicator.paused {
          background: var(--color-warning, #ffc107);
          color: #1a1a1a;
        }

        .status-spacer {
          flex: 1;
        }

        .tab-content {
          flex: 1;
          padding: 12px;
          overflow-y: auto;
          overflow-x: hidden;
        }

        .compact .tab-content {
          padding: 8px;
        }

        .compact .devtools-header {
          padding: 6px 8px;
        }

        .compact .status-bar {
          padding: 4px 8px;
        }

        .compact .tab-button {
          padding: 6px 8px;
        }
      `}</style>
    </div>
  );
}

export default PluginPanel;
