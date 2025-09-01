import React from "react";
import { Settings, Download, Upload, RotateCcw } from "lucide-react";
import "../styles.css";
import type {
  RenderWasteDetectorState,
  RenderWasteDetectorEventClient,
  DevToolsTab,
} from "../../types";

interface SettingsTabProps {
  state: RenderWasteDetectorState;
  eventClient: RenderWasteDetectorEventClient;
  dispatch: (action: unknown) => void;
  compact: boolean;
  onComponentSelect: (componentId: string | null) => void;
  onSuggestionApply: (suggestionId: string) => void;
}

export function SettingsTab({
  state,
  eventClient,
  dispatch,
  compact,
}: SettingsTabProps) {
  const { settings, ui } = state;

  const handleSettingChange = (key: string, value: unknown) => {
    eventClient.updateSettings({ [key]: value });
  };

  return (
    <div className="settings-tab">
      <div className="tab-header">
        <h2>Settings</h2>
        <div className="settings-actions">
          <button
            onClick={() => {
              const settingsJson = JSON.stringify(
                eventClient.exportSettings(),
                null,
                2,
              );
              const blob = new Blob([settingsJson], {
                type: "application/json",
              });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = "render-waste-detector-settings.json";
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="action-btn"
          >
            <Download size={16} />
            Export
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
                      const importedSettings = JSON.parse(
                        e.target?.result as string,
                      );
                      eventClient.importSettings(importedSettings);
                    } catch (error) {
                      console.error("Failed to import settings:", error);
                    }
                  };
                  reader.readAsText(file);
                }
              };
              input.click();
            }}
            className="action-btn"
          >
            <Upload size={16} />
            Import
          </button>
          <button
            onClick={() => eventClient.resetSettings()}
            className="action-btn danger"
          >
            <RotateCcw size={16} />
            Reset
          </button>
        </div>
      </div>

      <div className="settings-content">
        <div className="settings-sections">
          {/* Recording Settings */}
          <div className="settings-section">
            <h3>Recording Options</h3>

            <div className="setting-item">
              <label>
                <input
                  type="checkbox"
                  checked={settings.trackAllComponents}
                  onChange={(e) =>
                    handleSettingChange("trackAllComponents", e.target.checked)
                  }
                />
                Track All Components
              </label>
              <p className="setting-description">
                Track all components instead of just problematic ones
              </p>
            </div>

            <div className="setting-item">
              <label>
                <input
                  type="checkbox"
                  checked={settings.trackOnlyProblematic}
                  onChange={(e) =>
                    handleSettingChange(
                      "trackOnlyProblematic",
                      e.target.checked,
                    )
                  }
                />
                Track Only Problematic Components
              </label>
              <p className="setting-description">
                Focus tracking on components with render issues
              </p>
            </div>

            <div className="setting-item">
              <label>
                Minimum Render Threshold
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={settings.minRenderThreshold}
                  onChange={(e) =>
                    handleSettingChange(
                      "minRenderThreshold",
                      parseInt(e.target.value),
                    )
                  }
                />
              </label>
              <p className="setting-description">
                Minimum number of renders before component is tracked
              </p>
            </div>

            <div className="setting-item">
              <label>
                Max Recording Time (ms)
                <input
                  type="number"
                  min="10000"
                  max="3600000"
                  step="1000"
                  value={settings.maxRecordingTime}
                  onChange={(e) =>
                    handleSettingChange(
                      "maxRecordingTime",
                      parseInt(e.target.value),
                    )
                  }
                />
              </label>
              <p className="setting-description">
                Maximum recording duration in milliseconds
              </p>
            </div>

            <div className="setting-item">
              <label>
                Max Events
                <input
                  type="number"
                  min="100"
                  max="50000"
                  step="100"
                  value={settings.maxEvents}
                  onChange={(e) =>
                    handleSettingChange("maxEvents", parseInt(e.target.value))
                  }
                />
              </label>
              <p className="setting-description">
                Maximum number of render events to track
              </p>
            </div>

            <div className="setting-item">
              <label>
                Debounce (ms)
                <input
                  type="number"
                  min="0"
                  max="1000"
                  step="10"
                  value={settings.debounceMs}
                  onChange={(e) =>
                    handleSettingChange("debounceMs", parseInt(e.target.value))
                  }
                />
              </label>
              <p className="setting-description">
                Debounce time for rapid render events
              </p>
            </div>
          </div>

          {/* Analysis Settings */}
          <div className="settings-section">
            <h3>Analysis Options</h3>

            <div className="setting-item">
              <label>
                <input
                  type="checkbox"
                  checked={settings.enableHeatMap}
                  onChange={(e) =>
                    handleSettingChange("enableHeatMap", e.target.checked)
                  }
                />
                Enable Heat Map
              </label>
              <p className="setting-description">
                Generate visual heat map of render activity
              </p>
            </div>

            <div className="setting-item">
              <label>
                <input
                  type="checkbox"
                  checked={settings.enableSuggestions}
                  onChange={(e) =>
                    handleSettingChange("enableSuggestions", e.target.checked)
                  }
                />
                Enable Optimization Suggestions
              </label>
              <p className="setting-description">
                Generate performance optimization recommendations
              </p>
            </div>

            <div className="setting-item">
              <label>
                <input
                  type="checkbox"
                  checked={settings.enableVDomDiff}
                  onChange={(e) =>
                    handleSettingChange("enableVDomDiff", e.target.checked)
                  }
                />
                Enable Virtual DOM Diff Analysis
              </label>
              <p className="setting-description">
                Analyze virtual DOM changes between renders
              </p>
            </div>
          </div>

          {/* Filter Settings */}
          <div className="settings-section">
            <h3>Component Filters</h3>

            <div className="setting-item">
              <label>Exclude Patterns</label>
              <textarea
                rows={3}
                placeholder="Enter component name patterns to exclude (one per line)"
                value={settings.excludePatterns.join("\n")}
                onChange={(e) =>
                  handleSettingChange(
                    "excludePatterns",
                    e.target.value.split("\n").filter((p) => p.trim()),
                  )
                }
              />
              <p className="setting-description">
                Component name patterns to exclude from tracking
              </p>
            </div>

            <div className="setting-item">
              <label>Include Patterns</label>
              <textarea
                rows={3}
                placeholder="Enter component name patterns to include (one per line)"
                value={settings.includePatterns.join("\n")}
                onChange={(e) =>
                  handleSettingChange(
                    "includePatterns",
                    e.target.value.split("\n").filter((p) => p.trim()),
                  )
                }
              />
              <p className="setting-description">
                Component name patterns to specifically include (leave empty for
                all)
              </p>
            </div>
          </div>

          {/* UI Settings */}
          <div className="settings-section">
            <h3>Interface Options</h3>

            <div className="setting-item">
              <label>
                Theme
                <select
                  value={ui.theme}
                  onChange={(e) => eventClient.setTheme(e.target.value as "light" | "dark" | "auto")}
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="auto">Auto</option>
                </select>
              </label>
              <p className="setting-description">Choose the interface theme</p>
            </div>

            <div className="setting-item">
              <label>
                Default Tab
                <select
                  value={ui.activeTab}
                  onChange={(e) => eventClient.selectTab(e.target.value as DevToolsTab)}
                >
                  <option value="overview">Overview</option>
                  <option value="components">Components</option>
                  <option value="heatmap">Heat Map</option>
                  <option value="suggestions">Suggestions</option>
                  <option value="timeline">Timeline</option>
                  <option value="settings">Settings</option>
                </select>
              </label>
              <p className="setting-description">
                Default tab when opening the DevTools
              </p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .settings-tab {
          display: flex;
          flex-direction: column;
          height: 100%;
          gap: 16px;
        }

        .tab-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .tab-header h2 {
          margin: 0;
          font-size: 18px;
          color: var(--text-primary, #1a1a1a);
        }

        .settings-actions {
          display: flex;
          gap: 8px;
        }

        .action-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 12px;
          background: var(--bg-secondary, #f8f9fa);
          border: 1px solid var(--border-color, #e1e5e9);
          border-radius: 6px;
          cursor: pointer;
          font-size: 13px;
        }

        .action-btn.danger {
          background: var(--color-danger, #dc3545);
          color: white;
          border-color: var(--color-danger, #dc3545);
        }

        .settings-content {
          flex: 1;
          overflow-y: auto;
        }

        .settings-sections {
          display: flex;
          flex-direction: column;
          gap: 32px;
        }

        .settings-section {
          background: var(--bg-secondary, #f8f9fa);
          border: 1px solid var(--border-color, #e1e5e9);
          border-radius: 8px;
          padding: 20px;
        }

        .settings-section h3 {
          margin: 0 0 20px 0;
          font-size: 16px;
          color: var(--text-primary, #1a1a1a);
          font-weight: 600;
        }

        .setting-item {
          margin-bottom: 20px;
        }

        .setting-item:last-child {
          margin-bottom: 0;
        }

        .setting-item label {
          display: flex;
          flex-direction: column;
          gap: 8px;
          font-size: 14px;
          font-weight: 500;
          color: var(--text-primary, #1a1a1a);
        }

        .setting-item label input[type="checkbox"] {
          width: auto;
          align-self: flex-start;
        }

        .setting-item label input[type="number"],
        .setting-item label select {
          padding: 8px 12px;
          border: 1px solid var(--border-color, #e1e5e9);
          border-radius: 4px;
          background: var(--bg-primary, #ffffff);
          font-size: 13px;
        }

        .setting-item textarea {
          padding: 8px 12px;
          border: 1px solid var(--border-color, #e1e5e9);
          border-radius: 4px;
          background: var(--bg-primary, #ffffff);
          font-size: 13px;
          font-family: inherit;
          resize: vertical;
        }

        .setting-description {
          margin: 4px 0 0 0;
          font-size: 12px;
          color: var(--text-secondary, #6c757d);
          font-weight: normal;
          line-height: 1.4;
        }

        /* Dark theme */
        .theme-dark .tab-header h2 {
          color: var(--text-primary, #ffffff);
        }

        .theme-dark .action-btn {
          background: var(--bg-secondary, #2a2a2a);
          border-color: var(--border-color, #333);
        }

        .theme-dark .settings-section {
          background: var(--bg-secondary, #2a2a2a);
          border-color: var(--border-color, #333);
        }

        .theme-dark .settings-section h3 {
          color: var(--text-primary, #ffffff);
        }

        .theme-dark .setting-item label {
          color: var(--text-primary, #ffffff);
        }

        .theme-dark .setting-item label input[type="number"],
        .theme-dark .setting-item label select,
        .theme-dark .setting-item textarea {
          background: var(--bg-primary, #1a1a1a);
          border-color: var(--border-color, #333);
          color: var(--text-primary, #ffffff);
        }
      `}</style>
    </div>
  );
}

export default SettingsTab;
