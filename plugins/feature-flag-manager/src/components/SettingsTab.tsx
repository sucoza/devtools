import React, { useState } from 'react';
import { FeatureFlagDevToolsState, FeatureFlagDevToolsClient } from '../types';

interface SettingsTabProps {
  state: FeatureFlagDevToolsState;
  client: FeatureFlagDevToolsClient;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({
  state,
  client
}) => {
  const [settings, setSettings] = useState(state.settings);
  const [showAddProvider, setShowAddProvider] = useState(false);
  const [newProviderForm, setNewProviderForm] = useState({
    name: '',
    type: 'custom' as 'launchdarkly' | 'splitio' | 'optimizely' | 'custom',
    enabled: true,
    config: {
      apiKey: '',
      clientId: '',
      environmentId: '',
      baseUrl: ''
    }
  });

  const handleSettingsUpdate = async (newSettings: any) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    
    try {
      // Update through client
      const currentState = client.getState();
      currentState.settings = updatedSettings;
    } catch (error) {
      console.error('Failed to update settings:', error);
    }
  };

  const handleAddProvider = async () => {
    if (!newProviderForm.name.trim()) {
      alert('Provider name is required');
      return;
    }

    try {
      await client.addProvider({
        name: newProviderForm.name,
        type: newProviderForm.type,
        enabled: newProviderForm.enabled,
        config: newProviderForm.config
      });
      
      // Reset form
      setNewProviderForm({
        name: '',
        type: 'custom',
        enabled: true,
        config: {
          apiKey: '',
          clientId: '',
          environmentId: '',
          baseUrl: ''
        }
      });
      setShowAddProvider(false);
    } catch (error) {
      console.error('Failed to add provider:', error);
      alert('Failed to add provider: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const handleRemoveProvider = async (providerName: string) => {
    if (confirm(`Are you sure you want to remove the provider "${providerName}"?`)) {
      try {
        await client.removeProvider(providerName);
      } catch (error) {
        console.error('Failed to remove provider:', error);
        alert('Failed to remove provider: ' + (error instanceof Error ? error.message : 'Unknown error'));
      }
    }
  };

  const handleClearStorage = () => {
    if (confirm('This will clear all local data including overrides and history. Are you sure?')) {
      localStorage.clear();
      alert('Local storage cleared. Please refresh the page.');
    }
  };

  const handleExportSettings = () => {
    const exportData = {
      settings: state.settings,
      providers: state.settings.providers,
      context: state.currentContext,
      timestamp: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    try {
      const a = document.createElement('a');
      a.href = url;
      a.download = `feature-flag-settings-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } finally {
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="settings-tab">
      <div className="settings-container">
        {/* General Settings */}
        <div className="settings-section">
          <h3>General Settings</h3>
          
          <div className="setting-row">
            <label className="setting-label">
              <input
                type="checkbox"
                checked={settings.autoRefresh}
                onChange={(e) => handleSettingsUpdate({ autoRefresh: e.target.checked })}
              />
              Auto-refresh flags
            </label>
            <p className="setting-description">
              Automatically refresh flags from providers at regular intervals
            </p>
          </div>

          <div className="setting-row">
            <label className="setting-label">
              Refresh Interval (seconds):
              <input
                type="number"
                min="1"
                max="300"
                value={settings.refreshInterval / 1000}
                onChange={(e) => handleSettingsUpdate({ 
                  refreshInterval: Math.max(1000, (parseInt(e.target.value) || 1) * 1000)
                })}
                className="setting-input"
                disabled={!settings.autoRefresh}
              />
            </label>
          </div>

          <div className="setting-row">
            <label className="setting-label">
              History Size:
              <input
                type="number"
                min="10"
                max="1000"
                value={settings.maxHistorySize}
                onChange={(e) => handleSettingsUpdate({ 
                  maxHistorySize: Math.max(10, parseInt(e.target.value)) 
                })}
                className="setting-input"
              />
            </label>
            <p className="setting-description">
              Maximum number of evaluation history entries to keep
            </p>
          </div>

          <div className="setting-row">
            <label className="setting-label">
              <input
                type="checkbox"
                checked={settings.persistOverrides}
                onChange={(e) => handleSettingsUpdate({ persistOverrides: e.target.checked })}
              />
              Persist overrides
            </label>
            <p className="setting-description">
              Save flag overrides to localStorage across browser sessions
            </p>
          </div>

          <div className="setting-row">
            <label className="setting-label">
              <input
                type="checkbox"
                checked={settings.showNotifications}
                onChange={(e) => handleSettingsUpdate({ showNotifications: e.target.checked })}
              />
              Show notifications
            </label>
            <p className="setting-description">
              Display success and error notifications for flag operations
            </p>
          </div>

          <div className="setting-row">
            <label className="setting-label">
              Theme:
              <select
                value={settings.theme}
                onChange={(e) => handleSettingsUpdate({ theme: e.target.value })}
                className="setting-select"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="auto">Auto</option>
              </select>
            </label>
          </div>
        </div>

        {/* Provider Management */}
        <div className="settings-section">
          <div className="section-header">
            <h3>Feature Flag Providers</h3>
            <button
              onClick={() => setShowAddProvider(!showAddProvider)}
              className="add-provider-button"
            >
              {showAddProvider ? 'Cancel' : 'Add Provider'}
            </button>
          </div>

          {/* Add Provider Form */}
          {showAddProvider && (
            <div className="add-provider-form">
              <div className="form-row">
                <label>
                  Provider Name:
                  <input
                    type="text"
                    value={newProviderForm.name}
                    onChange={(e) => setNewProviderForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="My Provider"
                    className="form-input"
                  />
                </label>

                <label>
                  Provider Type:
                  <select
                    value={newProviderForm.type}
                    onChange={(e) => setNewProviderForm(prev => ({ 
                      ...prev, 
                      type: e.target.value as any 
                    }))}
                    className="form-select"
                  >
                    <option value="custom">Custom API</option>
                    <option value="launchdarkly">LaunchDarkly</option>
                    <option value="splitio">Split.io</option>
                    <option value="optimizely">Optimizely</option>
                  </select>
                </label>
              </div>

              {/* Provider-specific config */}
              {newProviderForm.type === 'launchdarkly' && (
                <div className="config-section">
                  <h4>LaunchDarkly Configuration</h4>
                  <div className="form-row">
                    <label>
                      SDK Key:
                      <input
                        type="text"
                        value={newProviderForm.config.apiKey}
                        onChange={(e) => setNewProviderForm(prev => ({
                          ...prev,
                          config: { ...prev.config, apiKey: e.target.value }
                        }))}
                        placeholder="sdk-key-123..."
                        className="form-input"
                      />
                    </label>
                    <label>
                      Environment ID:
                      <input
                        type="text"
                        value={newProviderForm.config.environmentId}
                        onChange={(e) => setNewProviderForm(prev => ({
                          ...prev,
                          config: { ...prev.config, environmentId: e.target.value }
                        }))}
                        placeholder="production"
                        className="form-input"
                      />
                    </label>
                  </div>
                </div>
              )}

              {newProviderForm.type === 'custom' && (
                <div className="config-section">
                  <h4>Custom API Configuration</h4>
                  <div className="form-row">
                    <label>
                      Base URL:
                      <input
                        type="url"
                        value={newProviderForm.config.baseUrl}
                        onChange={(e) => setNewProviderForm(prev => ({
                          ...prev,
                          config: { ...prev.config, baseUrl: e.target.value }
                        }))}
                        placeholder="https://api.example.com"
                        className="form-input"
                      />
                    </label>
                    <label>
                      API Key:
                      <input
                        type="text"
                        value={newProviderForm.config.apiKey}
                        onChange={(e) => setNewProviderForm(prev => ({
                          ...prev,
                          config: { ...prev.config, apiKey: e.target.value }
                        }))}
                        placeholder="Bearer token or API key"
                        className="form-input"
                      />
                    </label>
                  </div>
                </div>
              )}

              <div className="form-actions">
                <button onClick={handleAddProvider} className="save-button">
                  Add Provider
                </button>
              </div>
            </div>
          )}

          {/* Existing Providers */}
          <div className="providers-list">
            {state.settings.providers.length === 0 ? (
              <div className="empty-providers">
                <p>No providers configured</p>
                <p className="empty-description">
                  Add a provider to connect to your feature flag service
                </p>
              </div>
            ) : (
              state.settings.providers.map((provider) => (
                <div key={provider.name} className="provider-card">
                  <div className="provider-header">
                    <div className="provider-info">
                      <h4>{provider.name}</h4>
                      <span className="provider-type">{provider.type}</span>
                    </div>
                    <div className="provider-actions">
                      <span className={`status-indicator ${provider.enabled ? 'enabled' : 'disabled'}`}>
                        {provider.enabled ? 'Enabled' : 'Disabled'}
                      </span>
                      <button
                        onClick={() => handleRemoveProvider(provider.name)}
                        className="remove-button"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                  
                  <div className="provider-config">
                    {Object.entries(provider.config).map(([key, value]) => (
                      value && (
                        <div key={key} className="config-item">
                          <span className="config-key">{key}:</span>
                          <span className="config-value">
                            {key.toLowerCase().includes('key') || key.toLowerCase().includes('token') 
                              ? '•'.repeat(Math.min(20, String(value).length))
                              : String(value)
                            }
                          </span>
                        </div>
                      )
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Data Management */}
        <div className="settings-section">
          <h3>Data Management</h3>
          
          <div className="data-actions">
            <button onClick={handleExportSettings} className="export-button">
              Export Settings
            </button>
            <button onClick={handleClearStorage} className="clear-button">
              Clear Local Data
            </button>
          </div>
        </div>

        {/* Debug Information */}
        <div className="settings-section">
          <h3>Debug Information</h3>
          <div className="debug-info">
            <div className="debug-item">
              <span>Storage Keys:</span>
              <span>{localStorage.length}</span>
            </div>
            <div className="debug-item">
              <span>Active Overrides:</span>
              <span>{state.overrides.size}</span>
            </div>
            <div className="debug-item">
              <span>History Entries:</span>
              <span>{state.evaluationHistory.length}</span>
            </div>
            <div className="debug-item">
              <span>Current User:</span>
              <span>{state.currentContext.userId || 'anonymous'}</span>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .settings-tab {
          height: 100%;
          overflow-y: auto;
          background-color: var(--dt-bg-tertiary);
        }
        
        .settings-container {
          max-width: 800px;
          margin: 0 auto;
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 32px;
        }
        
        .settings-section {
          background-color: var(--dt-bg-primary);
          border: 1px solid var(--dt-border-primary);
          border-radius: 8px;
          padding: 24px;
        }
        
        .settings-section h3 {
          margin: 0 0 20px 0;
          font-size: 18px;
          font-weight: 600;
          color: var(--dt-text-primary);
          border-bottom: 1px solid var(--dt-border-primary);
          padding-bottom: 8px;
        }
        
        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        
        .section-header h3 {
          margin: 0;
          border: none;
          padding: 0;
        }
        
        .setting-row {
          margin-bottom: 20px;
        }
        
        .setting-label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          font-weight: 500;
          color: var(--dt-text-primary);
          cursor: pointer;
        }
        
        .setting-label input[type="checkbox"] {
          margin-right: 4px;
        }
        
        .setting-input, .setting-select {
          margin-left: 8px;
          padding: 6px 8px;
          border: 1px solid var(--dt-border-primary);
          border-radius: 4px;
          font-size: 14px;
        }
        
        .setting-input:disabled {
          background-color: var(--dt-bg-tertiary);
          color: var(--dt-border-hover);
        }
        
        .setting-description {
          margin: 4px 0 0 0;
          font-size: 12px;
          color: var(--dt-text-secondary);
          line-height: 1.4;
        }
        
        .add-provider-button {
          padding: 8px 16px;
          background-color: var(--dt-border-focus);
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
        }
        
        .add-provider-form {
          background-color: var(--dt-bg-secondary);
          border: 1px solid var(--dt-border-primary);
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 20px;
        }
        
        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 16px;
        }
        
        .form-row label {
          display: flex;
          flex-direction: column;
          gap: 4px;
          font-size: 14px;
          font-weight: 500;
          color: var(--dt-text-primary);
        }
        
        .form-input, .form-select {
          padding: 8px;
          border: 1px solid var(--dt-border-primary);
          border-radius: 4px;
          font-size: 14px;
        }
        
        .config-section {
          border-top: 1px solid var(--dt-border-primary);
          padding-top: 16px;
          margin-top: 16px;
        }
        
        .config-section h4 {
          margin: 0 0 16px 0;
          font-size: 16px;
          font-weight: 600;
          color: var(--dt-text-primary);
        }
        
        .form-actions {
          display: flex;
          justify-content: flex-end;
          border-top: 1px solid var(--dt-border-primary);
          padding-top: 16px;
          margin-top: 16px;
        }
        
        .save-button {
          padding: 8px 20px;
          background-color: var(--dt-status-success);
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
        }
        
        .providers-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        
        .empty-providers {
          text-align: center;
          padding: 40px 20px;
          color: var(--dt-text-secondary);
        }
        
        .empty-providers p {
          margin: 0;
        }
        
        .empty-description {
          font-size: 12px;
          margin-top: 4px;
        }
        
        .provider-card {
          border: 1px solid var(--dt-border-primary);
          border-radius: 8px;
          padding: 16px;
          background-color: var(--dt-bg-tertiary);
        }
        
        .provider-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }
        
        .provider-info h4 {
          margin: 0 0 4px 0;
          font-size: 16px;
          font-weight: 600;
          color: var(--dt-text-primary);
        }
        
        .provider-type {
          font-size: 12px;
          text-transform: uppercase;
          color: var(--dt-text-secondary);
          font-weight: 600;
        }
        
        .provider-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .status-indicator {
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
        }
        
        .status-indicator.enabled {
          background-color: var(--dt-status-success-bg);
          color: var(--dt-status-success);
        }
        
        .status-indicator.disabled {
          background-color: var(--dt-status-error-bg);
          color: var(--dt-status-error);
        }
        
        .remove-button {
          padding: 6px 12px;
          background-color: var(--dt-status-error);
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
        }
        
        .provider-config {
          display: grid;
          gap: 8px;
        }
        
        .config-item {
          display: flex;
          gap: 8px;
          font-size: 12px;
        }
        
        .config-key {
          font-weight: 600;
          color: var(--dt-text-primary);
          min-width: 100px;
        }
        
        .config-value {
          color: var(--dt-text-secondary);
          font-family: monospace;
        }
        
        .data-actions {
          display: flex;
          gap: 12px;
        }
        
        .export-button {
          padding: 8px 16px;
          background-color: var(--dt-border-focus);
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
        }
        
        .clear-button {
          padding: 8px 16px;
          background-color: var(--dt-status-error);
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
        }
        
        .debug-info {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
        }
        
        .debug-item {
          display: flex;
          justify-content: space-between;
          padding: 12px;
          background-color: var(--dt-bg-secondary);
          border: 1px solid var(--dt-border-primary);
          border-radius: 6px;
        }
        
        .debug-item span:first-child {
          font-weight: 500;
          color: var(--dt-text-primary);
        }
        
        .debug-item span:last-child {
          font-family: monospace;
          color: var(--dt-text-secondary);
        }

      `}</style>
    </div>
  );
};