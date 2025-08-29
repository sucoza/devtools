import React, { useState } from 'react';
import clsx from 'clsx';
import { 
  Shield, 
  User, 
  Key, 
  Lock, 
  Unlock, 
  Settings,
  AlertTriangle,
  Check,
  X,
  ChevronRight,
  ChevronDown,
  Copy,
  Download,
  Upload,
  RefreshCw,
  Trash2
} from 'lucide-react';
import { useAuthMockClient } from '../core/devtools-client';
import { AuthState, MockScenario, Role, Permission } from '../types/auth';
import '../styles.css';

type TabType = 'overview' | 'scenarios' | 'roles' | 'permissions' | 'jwt' | 'storage' | 'settings';

export function AuthPermissionsMockPanel() {
  const { state, client } = useAuthMockClient();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null);
  const [customToken, setCustomToken] = useState('');
  const [showWarning, setShowWarning] = useState(true);

  const handleApplyScenario = (scenarioId: string) => {
    client.applyScenario(scenarioId);
    setSelectedScenario(scenarioId);
  };

  const handleLogout = () => {
    client.mockLogout();
    setSelectedScenario(null);
  };

  const handleUpdateToken = () => {
    if (customToken) {
      client.updateToken(customToken);
    }
  };

  const handleExportConfig = () => {
    const config = client.exportConfig();
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'auth-mock-config.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportConfig = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const config = JSON.parse(e.target?.result as string);
          client.importConfig(config);
        } catch (error) {
          console.error('Failed to import config:', error);
        }
      };
      reader.readAsText(file);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="auth-mock-panel">
      {/* Warning Banner */}
      {showWarning && state.mockMode && (
        <div className="warning-banner">
          <AlertTriangle className="icon" />
          <span>Mock Mode Active - Client-side only. Server validation still applies.</span>
          <button onClick={() => setShowWarning(false)} className="close-btn">
            <X className="icon-sm" />
          </button>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="tab-navigation">
        {[
          { id: 'overview', label: 'Overview', icon: Shield },
          { id: 'scenarios', label: 'Scenarios', icon: Settings },
          { id: 'roles', label: 'Roles', icon: User },
          { id: 'permissions', label: 'Permissions', icon: Key },
          { id: 'jwt', label: 'JWT Editor', icon: Lock },
          { id: 'storage', label: 'Storage', icon: Settings },
          { id: 'settings', label: 'Settings', icon: Settings }
        ].map(tab => (
          <button
            key={tab.id}
            className={clsx('tab-btn', { active: activeTab === tab.id })}
            onClick={() => setActiveTab(tab.id as TabType)}
          >
            <tab.icon className="icon-sm" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="overview-tab">
            <div className="auth-status">
              <h3>Authentication Status</h3>
              <div className={clsx('status-indicator', { 
                authenticated: state.authState.isAuthenticated 
              })}>
                {state.authState.isAuthenticated ? (
                  <>
                    <Unlock className="icon" />
                    <span>Authenticated</span>
                  </>
                ) : (
                  <>
                    <Lock className="icon" />
                    <span>Not Authenticated</span>
                  </>
                )}
              </div>
            </div>

            {state.authState.user && (
              <div className="user-info">
                <h3>User Information</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <span className="label">ID:</span>
                    <span className="value">{state.authState.user.id || 'N/A'}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Email:</span>
                    <span className="value">{state.authState.user.email || 'N/A'}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Name:</span>
                    <span className="value">{state.authState.user.name || 'N/A'}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="roles-permissions">
              <div className="section">
                <h3>Active Roles</h3>
                <div className="tag-list">
                  {state.authState.roles.length > 0 ? (
                    state.authState.roles.map(role => (
                      <span key={role} className="tag role-tag">{role}</span>
                    ))
                  ) : (
                    <span className="empty-state">No roles assigned</span>
                  )}
                </div>
              </div>

              <div className="section">
                <h3>Active Permissions</h3>
                <div className="tag-list">
                  {state.authState.permissions.length > 0 ? (
                    state.authState.permissions.map(permission => (
                      <span key={permission} className="tag permission-tag">{permission}</span>
                    ))
                  ) : (
                    <span className="empty-state">No permissions assigned</span>
                  )}
                </div>
              </div>
            </div>

            {state.authState.isAuthenticated && (
              <button onClick={handleLogout} className="btn btn-danger">
                <Lock className="icon-sm" />
                Logout
              </button>
            )}
          </div>
        )}

        {/* Scenarios Tab */}
        {activeTab === 'scenarios' && (
          <div className="scenarios-tab">
            <h3>Mock Scenarios</h3>
            <div className="scenario-list">
              {client.getScenarios().map(scenario => (
                <div 
                  key={scenario.id} 
                  className={clsx('scenario-card', {
                    active: selectedScenario === scenario.id
                  })}
                >
                  <div className="scenario-header">
                    <h4>{scenario.name}</h4>
                    {selectedScenario === scenario.id && (
                      <span className="active-badge">Active</span>
                    )}
                  </div>
                  <p className="scenario-description">{scenario.description}</p>
                  <div className="scenario-details">
                    <span className="detail">
                      <User className="icon-xs" />
                      {scenario.authState.user?.email || 'Guest'}
                    </span>
                    <span className="detail">
                      <Shield className="icon-xs" />
                      {scenario.authState.roles.join(', ') || 'No roles'}
                    </span>
                  </div>
                  <button 
                    onClick={() => handleApplyScenario(scenario.id)}
                    className="btn btn-primary btn-sm"
                  >
                    Apply Scenario
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Roles Tab */}
        {activeTab === 'roles' && (
          <div className="roles-tab">
            <h3>Available Roles</h3>
            <div className="role-list">
              {client.getRoles().map(role => (
                <div key={role.id} className="role-card">
                  <div className="role-header">
                    <h4>{role.name}</h4>
                    <input 
                      type="checkbox" 
                      checked={state.authState.roles.includes(role.id)}
                      onChange={(e) => {
                        const newRoles = e.target.checked 
                          ? [...state.authState.roles, role.id]
                          : state.authState.roles.filter(r => r !== role.id);
                        client.updateRoles(newRoles);
                      }}
                    />
                  </div>
                  <p className="role-description">{role.description}</p>
                  <div className="permission-list">
                    {role.permissions.map(perm => (
                      <span key={perm} className="tag permission-tag">{perm}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Permissions Tab */}
        {activeTab === 'permissions' && (
          <div className="permissions-tab">
            <h3>Available Permissions</h3>
            <div className="permission-list">
              {client.getPermissions().map(permission => (
                <div key={permission.id} className="permission-card">
                  <div className="permission-header">
                    <div>
                      <h4>{permission.name}</h4>
                      <p className="permission-description">{permission.description}</p>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={state.authState.permissions.includes(permission.id)}
                      onChange={(e) => {
                        const newPermissions = e.target.checked 
                          ? [...state.authState.permissions, permission.id]
                          : state.authState.permissions.filter(p => p !== permission.id);
                        client.updatePermissions(newPermissions);
                      }}
                    />
                  </div>
                  {permission.resource && (
                    <div className="permission-details">
                      <span className="detail">Resource: {permission.resource}</span>
                      <span className="detail">Action: {permission.action}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* JWT Editor Tab */}
        {activeTab === 'jwt' && (
          <div className="jwt-tab">
            <h3>JWT Token Editor</h3>
            <div className="jwt-section">
              <h4>Current Token</h4>
              {state.authState.token ? (
                <div className="token-display">
                  <code className="token-text">{state.authState.token}</code>
                  <button 
                    onClick={() => copyToClipboard(state.authState.token!)}
                    className="btn btn-icon"
                    title="Copy token"
                  >
                    <Copy className="icon-sm" />
                  </button>
                </div>
              ) : (
                <p className="empty-state">No token present</p>
              )}
            </div>

            <div className="jwt-section">
              <h4>Custom Token</h4>
              <div className="token-input-group">
                <textarea 
                  value={customToken}
                  onChange={(e) => setCustomToken(e.target.value)}
                  placeholder="Paste a JWT token here..."
                  className="token-input"
                  rows={4}
                />
                <button 
                  onClick={handleUpdateToken}
                  className="btn btn-primary"
                  disabled={!customToken}
                >
                  Apply Token
                </button>
              </div>
            </div>

            {state.authState.token && (
              <div className="jwt-section">
                <h4>Decoded Payload</h4>
                <pre className="json-display">
                  {JSON.stringify(
                    (() => {
                      try {
                        const parts = state.authState.token.split('.');
                        if (parts.length === 3) {
                          return JSON.parse(atob(parts[1]));
                        }
                      } catch {}
                      return null;
                    })(),
                    null,
                    2
                  )}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* Storage Tab */}
        {activeTab === 'storage' && (
          <div className="storage-tab">
            <h3>Storage Operations</h3>
            <div className="storage-operations">
              {state.storageOperations.length > 0 ? (
                <div className="operation-list">
                  {state.storageOperations.slice(-20).reverse().map((op, index) => (
                    <div key={index} className="operation-item">
                      <span className="operation-time">
                        {new Date(op.timestamp).toLocaleTimeString()}
                      </span>
                      <span className={clsx('operation-type', op.operation)}>
                        {op.operation}
                      </span>
                      <span className="operation-key">{op.key}</span>
                      {op.value && (
                        <span className="operation-value" title={op.value}>
                          {op.value.substring(0, 50)}...
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="empty-state">No storage operations recorded</p>
              )}
            </div>

            <div className="storage-config">
              <h4>Storage Configuration</h4>
              <div className="config-item">
                <span className="label">Type:</span>
                <span className="value">{state.storageConfig.type}</span>
              </div>
              <div className="config-item">
                <span className="label">Token Key:</span>
                <span className="value">{state.storageConfig.key}</span>
              </div>
              {state.storageConfig.userKey && (
                <div className="config-item">
                  <span className="label">User Key:</span>
                  <span className="value">{state.storageConfig.userKey}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="settings-tab">
            <h3>Settings</h3>
            
            <div className="settings-section">
              <h4>Configuration</h4>
              <div className="settings-actions">
                <button onClick={handleExportConfig} className="btn btn-secondary">
                  <Download className="icon-sm" />
                  Export Config
                </button>
                <label className="btn btn-secondary">
                  <Upload className="icon-sm" />
                  Import Config
                  <input 
                    type="file" 
                    accept=".json"
                    onChange={handleImportConfig}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>
            </div>

            <div className="settings-section">
              <h4>Mock Mode</h4>
              <label className="toggle-label">
                <input 
                  type="checkbox" 
                  checked={state.mockMode}
                  onChange={(e) => {
                    // Toggle mock mode
                  }}
                />
                <span>Enable Mock Mode</span>
              </label>
              <p className="settings-description">
                When enabled, authentication state changes will be injected into the application.
                This only affects client-side behavior - server validation still applies.
              </p>
            </div>

            <div className="settings-section danger-zone">
              <h4>Danger Zone</h4>
              <button 
                onClick={() => client.clear()}
                className="btn btn-danger"
              >
                <Trash2 className="icon-sm" />
                Clear All Data
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}