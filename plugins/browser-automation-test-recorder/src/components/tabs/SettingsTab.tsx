import React from 'react';
import { clsx } from 'clsx';
import { Settings, RotateCcw, Download, Upload } from 'lucide-react';

import type { TabComponentProps } from '../../types';

/**
 * Settings and configuration tab component
 */
export default function SettingsTab({ state, dispatch, compact }: TabComponentProps) {
  const { settings } = state;

  const handleResetSettings = () => {
    dispatch({ type: 'settings/reset' });
  };

  return (
    <div className="settings-tab">
      {/* Recording Settings */}
      <div className="settings-section">
        <h3>Recording Settings</h3>
        
        <div className="settings-group">
          <label className="setting-item">
            <span className="setting-label">Capture Screenshots:</span>
            <input
              type="checkbox"
              checked={settings.recordingOptions.captureScreenshots}
              onChange={(e) => dispatch({
                type: 'settings/update',
                payload: {
                  recordingOptions: {
                    ...settings.recordingOptions,
                    captureScreenshots: e.target.checked,
                  },
                },
              })}
            />
          </label>

          <label className="setting-item">
            <span className="setting-label">Capture Console Logs:</span>
            <input
              type="checkbox"
              checked={settings.recordingOptions.captureConsole}
              onChange={(e) => dispatch({
                type: 'settings/update',
                payload: {
                  recordingOptions: {
                    ...settings.recordingOptions,
                    captureConsole: e.target.checked,
                  },
                },
              })}
            />
          </label>

          <label className="setting-item">
            <span className="setting-label">Capture Network Requests:</span>
            <input
              type="checkbox"
              checked={settings.recordingOptions.captureNetwork}
              onChange={(e) => dispatch({
                type: 'settings/update',
                payload: {
                  recordingOptions: {
                    ...settings.recordingOptions,
                    captureNetwork: e.target.checked,
                  },
                },
              })}
            />
          </label>

          <label className="setting-item">
            <span className="setting-label">Debounce (ms):</span>
            <input
              type="number"
              min="0"
              max="5000"
              value={settings.recordingOptions.debounceMs}
              onChange={(e) => dispatch({
                type: 'settings/update',
                payload: {
                  recordingOptions: {
                    ...settings.recordingOptions,
                    debounceMs: parseInt(e.target.value) || 0,
                  },
                },
              })}
              className="number-input"
            />
          </label>

          <label className="setting-item">
            <span className="setting-label">Max Events:</span>
            <input
              type="number"
              min="10"
              max="10000"
              value={settings.recordingOptions.maxEvents}
              onChange={(e) => dispatch({
                type: 'settings/update',
                payload: {
                  recordingOptions: {
                    ...settings.recordingOptions,
                    maxEvents: parseInt(e.target.value) || 1000,
                  },
                },
              })}
              className="number-input"
            />
          </label>
        </div>
      </div>

      {/* Selector Settings */}
      <div className="settings-section">
        <h3>Selector Settings</h3>
        
        <div className="settings-group">
          <label className="setting-item">
            <span className="setting-label">Selector Mode:</span>
            <select
              value={settings.selectorOptions.mode}
              onChange={(e) => dispatch({
                type: 'settings/update',
                payload: {
                  selectorOptions: {
                    ...settings.selectorOptions,
                    mode: e.target.value as any,
                  },
                },
              })}
              className="select-input"
            >
              <option value="auto">Auto</option>
              <option value="css">CSS</option>
              <option value="xpath">XPath</option>
              <option value="text">Text</option>
              <option value="data-testid">Test ID</option>
            </select>
          </label>

          <label className="setting-item">
            <span className="setting-label">Timeout (ms):</span>
            <input
              type="number"
              min="1000"
              max="30000"
              value={settings.selectorOptions.timeout}
              onChange={(e) => dispatch({
                type: 'settings/update',
                payload: {
                  selectorOptions: {
                    ...settings.selectorOptions,
                    timeout: parseInt(e.target.value) || 5000,
                  },
                },
              })}
              className="number-input"
            />
          </label>

          <label className="setting-item">
            <span className="setting-label">Retries:</span>
            <input
              type="number"
              min="0"
              max="10"
              value={settings.selectorOptions.retries}
              onChange={(e) => dispatch({
                type: 'settings/update',
                payload: {
                  selectorOptions: {
                    ...settings.selectorOptions,
                    retries: parseInt(e.target.value) || 3,
                  },
                },
              })}
              className="number-input"
            />
          </label>
        </div>
      </div>

      {/* Playback Settings */}
      <div className="settings-section">
        <h3>Playback Settings</h3>
        
        <div className="settings-group">
          <label className="setting-item">
            <span className="setting-label">Default Speed:</span>
            <input
              type="range"
              min="0.1"
              max="3"
              step="0.1"
              value={settings.playbackOptions.defaultSpeed}
              onChange={(e) => dispatch({
                type: 'settings/update',
                payload: {
                  playbackOptions: {
                    ...settings.playbackOptions,
                    defaultSpeed: parseFloat(e.target.value),
                  },
                },
              })}
              className="range-input"
            />
            <span className="range-value">{settings.playbackOptions.defaultSpeed}x</span>
          </label>

          <label className="setting-item">
            <span className="setting-label">Wait Timeout (ms):</span>
            <input
              type="number"
              min="1000"
              max="30000"
              value={settings.playbackOptions.waitTimeout}
              onChange={(e) => dispatch({
                type: 'settings/update',
                payload: {
                  playbackOptions: {
                    ...settings.playbackOptions,
                    waitTimeout: parseInt(e.target.value) || 5000,
                  },
                },
              })}
              className="number-input"
            />
          </label>

          <label className="setting-item">
            <span className="setting-label">Screenshot on Error:</span>
            <input
              type="checkbox"
              checked={settings.playbackOptions.screenshotOnError}
              onChange={(e) => dispatch({
                type: 'settings/update',
                payload: {
                  playbackOptions: {
                    ...settings.playbackOptions,
                    screenshotOnError: e.target.checked,
                  },
                },
              })}
            />
          </label>

          <label className="setting-item">
            <span className="setting-label">Continue on Error:</span>
            <input
              type="checkbox"
              checked={settings.playbackOptions.continueOnError}
              onChange={(e) => dispatch({
                type: 'settings/update',
                payload: {
                  playbackOptions: {
                    ...settings.playbackOptions,
                    continueOnError: e.target.checked,
                  },
                },
              })}
            />
          </label>
        </div>
      </div>

      {/* UI Settings */}
      <div className="settings-section">
        <h3>UI Settings</h3>
        
        <div className="settings-group">
          <label className="setting-item">
            <span className="setting-label">Theme:</span>
            <select
              value={settings.uiOptions.theme}
              onChange={(e) => dispatch({
                type: 'ui/theme/set',
                payload: e.target.value as any,
              })}
              className="select-input"
            >
              <option value="auto">Auto</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </label>

          <label className="setting-item">
            <span className="setting-label">Show Minimap:</span>
            <input
              type="checkbox"
              checked={settings.uiOptions.showMinimap}
              onChange={(e) => dispatch({
                type: 'settings/update',
                payload: {
                  uiOptions: {
                    ...settings.uiOptions,
                    showMinimap: e.target.checked,
                  },
                },
              })}
            />
          </label>

          <label className="setting-item">
            <span className="setting-label">Show Timeline:</span>
            <input
              type="checkbox"
              checked={settings.uiOptions.showTimeline}
              onChange={(e) => dispatch({
                type: 'settings/update',
                payload: {
                  uiOptions: {
                    ...settings.uiOptions,
                    showTimeline: e.target.checked,
                  },
                },
              })}
            />
          </label>

          <label className="setting-item">
            <span className="setting-label">Auto Scroll:</span>
            <input
              type="checkbox"
              checked={settings.uiOptions.autoScroll}
              onChange={(e) => dispatch({
                type: 'settings/update',
                payload: {
                  uiOptions: {
                    ...settings.uiOptions,
                    autoScroll: e.target.checked,
                  },
                },
              })}
            />
          </label>
        </div>
      </div>

      {/* Actions */}
      <div className="actions-section">
        <h3>Actions</h3>
        
        <div className="action-buttons">
          <button
            onClick={handleResetSettings}
            className="secondary-button"
          >
            <RotateCcw size={16} />
            Reset to Defaults
          </button>

          <button
            onClick={() => dispatch({ type: 'settings/export' })}
            className="secondary-button"
          >
            <Download size={16} />
            Export Settings
          </button>

          <button
            onClick={() => {
              // This would trigger a file picker
              console.log('Import settings');
            }}
            className="secondary-button"
          >
            <Upload size={16} />
            Import Settings
          </button>
        </div>
      </div>

      <style jsx>{`
        .settings-tab {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .settings-section,
        .actions-section {
          background: var(--bg-secondary, #f8f9fa);
          border: 1px solid var(--border-color, #e1e5e9);
          border-radius: 6px;
          padding: 16px;
        }

        h3 {
          margin: 0 0 12px 0;
          font-size: 14px;
          font-weight: 600;
          color: var(--text-primary, #1a1a1a);
        }

        .settings-group {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .setting-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 13px;
          cursor: pointer;
        }

        .setting-label {
          color: var(--text-primary, #1a1a1a);
          font-weight: 500;
        }

        .number-input {
          width: 80px;
          padding: 4px 6px;
          border: 1px solid var(--border-color, #ced4da);
          border-radius: 4px;
          font-size: 13px;
        }

        .select-input {
          min-width: 120px;
          padding: 4px 6px;
          border: 1px solid var(--border-color, #ced4da);
          border-radius: 4px;
          font-size: 13px;
        }

        .range-input {
          flex: 1;
          max-width: 150px;
          margin: 0 8px;
        }

        .range-value {
          min-width: 40px;
          text-align: right;
          font-size: 12px;
          color: var(--text-secondary, #6c757d);
        }

        input[type="checkbox"] {
          cursor: pointer;
        }

        .action-buttons {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .secondary-button {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 12px;
          border: 1px solid var(--border-color, #ced4da);
          border-radius: 4px;
          background: var(--bg-primary, #ffffff);
          color: var(--text-primary, #1a1a1a);
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .secondary-button:hover {
          background: var(--bg-hover, #f1f3f4);
        }
      `}</style>
    </div>
  );
}