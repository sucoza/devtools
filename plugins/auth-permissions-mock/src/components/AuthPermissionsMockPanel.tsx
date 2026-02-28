import React, { useState } from 'react';
import clsx from 'clsx';
import {
  Shield,
  User,
  Key,
  Lock,
  Unlock,
  Settings,
  Copy,
  Download,
  Upload,
  Trash2
} from 'lucide-react';
import {
  Tabs,
  Badge,
  Alert,
  ScrollableContainer,
  ConfigMenu,
  ThemeProvider,
  useThemeOptional,
  type ConfigMenuItem
} from '@sucoza/shared-components';
import { useAuthMockClient } from '../core/devtools-client';


type TabType = 'overview' | 'scenarios' | 'roles' | 'permissions' | 'jwt' | 'storage' | 'settings';

function AuthPermissionsMockPanelInner() {
  const { state, client } = useAuthMockClient();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null);
  const [customToken, setCustomToken] = useState('');
  const [showWarning, _setShowWarning] = useState(true);
  const theme = useThemeOptional('light');

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
    navigator.clipboard.writeText(text).catch(() => {});
  };

  const configMenuItems: ConfigMenuItem[] = [
    {
      id: 'apply-scenario',
      label: selectedScenario ? 'Change Scenario' : 'Apply Scenario',
      icon: '🎭',
      onClick: () => {
        // Navigate to scenarios tab
        setActiveTab('scenarios');
      },
      shortcut: 'Ctrl+S'
    },
    {
      id: 'logout',
      label: 'Logout',
      icon: '🔒',
      onClick: handleLogout,
      disabled: !state.authState.isAuthenticated,
      shortcut: 'Ctrl+L'
    },
    {
      id: 'toggle-mock-mode',
      label: state.mockMode ? 'Disable Mock Mode' : 'Enable Mock Mode',
      icon: state.mockMode ? '🔴' : '🟢',
      onClick: () => {
        // Toggle mock mode functionality
        console.log('Mock mode toggle to be implemented');
      },
      separator: true,
      shortcut: 'Ctrl+M'
    },
    {
      id: 'export-config',
      label: 'Export Config',
      icon: '💾',
      onClick: handleExportConfig,
      shortcut: 'Ctrl+E'
    },
    {
      id: 'import-config',
      label: 'Import Config',
      icon: '📁',
      onClick: () => {
        // Trigger file input click
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => handleImportConfig(e as any);
        input.click();
      }
    },
    {
      id: 'clear-data',
      label: 'Clear All Data',
      icon: '🗑️',
      onClick: () => {
        if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
          client.clear();
        }
      },
      separator: true
    }
  ];

  const tabs = [
    {
      id: 'overview',
      label: 'Overview',
      icon: <Shield size={16} />,
      content: renderOverviewTab()
    },
    {
      id: 'scenarios',
      label: 'Scenarios',
      icon: <Settings size={16} />,
      badge: client.getScenarios().length > 0 ? <Badge size="xs" variant="info">{client.getScenarios().length}</Badge> : undefined,
      content: renderScenariosTab()
    },
    {
      id: 'roles',
      label: 'Roles',
      icon: <User size={16} />,
      badge: state.authState.roles.length > 0 ? <Badge size="xs" variant="primary">{state.authState.roles.length}</Badge> : undefined,
      content: renderRolesTab()
    },
    {
      id: 'permissions',
      label: 'Permissions',
      icon: <Key size={16} />,
      badge: state.authState.permissions.length > 0 ? <Badge size="xs" variant="success">{state.authState.permissions.length}</Badge> : undefined,
      content: renderPermissionsTab()
    },
    {
      id: 'jwt',
      label: 'JWT Editor',
      icon: <Lock size={16} />,
      content: renderJwtTab()
    },
    {
      id: 'storage',
      label: 'Storage',
      icon: <Settings size={16} />,
      badge: state.storageOperations.length > 0 ? <Badge size="xs" variant="info">{state.storageOperations.length}</Badge> : undefined,
      content: renderStorageTab()
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: <Settings size={16} />,
      content: renderSettingsTab()
    }
  ];

  function renderOverviewTab() {
    return (
      <ScrollableContainer>
        <div className="dt-content dt-p-8">
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
                      <span key={role} className="dt-badge dt-badge-info">{role}</span>
                    ))
                  ) : (
                    <span className="dt-empty-state">No roles assigned</span>
                  )}
                </div>
              </div>

              <div className="section">
                <h3>Active Permissions</h3>
                <div className="tag-list">
                  {state.authState.permissions.length > 0 ? (
                    state.authState.permissions.map(permission => (
                      <span key={permission} className="dt-badge dt-badge-success">{permission}</span>
                    ))
                  ) : (
                    <span className="dt-empty-state">No permissions assigned</span>
                  )}
                </div>
              </div>
            </div>

            {state.authState.isAuthenticated && (
              <button onClick={handleLogout} className="dt-btn dt-btn-danger">
                <Lock className="icon-sm" />
                Logout
              </button>
            )}
        </div>
      </ScrollableContainer>
    );
  }

  function renderScenariosTab() {
    return (
      <ScrollableContainer>
        <div className="dt-content dt-p-8">
            <h3>Mock Scenarios</h3>
            <div className="scenario-list">
              {client.getScenarios().map(scenario => (
                <div 
                  key={scenario.id} 
                  className={clsx('scenario-card', {
                    selected: selectedScenario === scenario.id
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
                    className="dt-btn dt-btn-primary dt-btn-sm"
                  >
                    Apply Scenario
                  </button>
                </div>
              ))}
            </div>
        </div>
      </ScrollableContainer>
    );
  }

  function renderRolesTab() {
    return (
      <ScrollableContainer>
        <div className="dt-content dt-p-8">
            <h3>Available Roles</h3>
            <div className="role-list">
              {client.getRoles().map(role => (
                <div key={role.id} className="dt-card">
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
                      <span key={perm} className="dt-badge dt-badge-success">{perm}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
        </div>
      </ScrollableContainer>
    );
  }

  function renderPermissionsTab() {
    return (
      <ScrollableContainer>
        <div className="dt-content dt-p-8">
            <h3>Available Permissions</h3>
            <div className="permission-list">
              {client.getPermissions().map(permission => (
                <div key={permission.id} className="dt-card">
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
      </ScrollableContainer>
    );
  }

  function renderJwtTab() {
    return (
      <ScrollableContainer>
        <div className="dt-content dt-p-8">
            <h3>JWT Token Editor</h3>
            <div className="jwt-section">
              <h4>Current Token</h4>
              {state.authState.token ? (
                <div className="token-display">
                  <code className="token-text">{state.authState.token}</code>
                  <button 
                    onClick={() => copyToClipboard(state.authState.token!)}
                    className="dt-btn dt-btn-icon"
                    title="Copy token"
                  >
                    <Copy className="icon-sm" />
                  </button>
                </div>
              ) : (
                <p className="dt-empty-state">No token present</p>
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
                  className="dt-btn dt-btn-primary"
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
                      } catch {
                        // Invalid token format, return null
                      }
                      return null;
                    })(),
                    null,
                    2
                  )}
                </pre>
              </div>
            )}
        </div>
      </ScrollableContainer>
    );
  }

  function renderStorageTab() {
    return (
      <ScrollableContainer>
        <div className="dt-content dt-p-8">
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
                <p className="dt-empty-state">No storage operations recorded</p>
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
      </ScrollableContainer>
    );
  }

  function renderSettingsTab() {
    return (
      <ScrollableContainer>
        <div className="dt-content dt-p-8">
            <h3>Settings</h3>
            
            <div className="settings-section">
              <h4>Configuration</h4>
              <div className="settings-actions">
                <button onClick={handleExportConfig} className="dt-btn dt-btn-secondary">
                  <Download className="icon-sm" />
                  Export Config
                </button>
                <label className="dt-btn dt-btn-secondary">
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
                  onChange={() => {
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
                className="dt-btn dt-btn-danger"
              >
                <Trash2 className="icon-sm" />
                Clear All Data
              </button>
            </div>
        </div>
      </ScrollableContainer>
    );
  }

  return (
    <div className="dt-plugin-panel" data-theme={theme} style={{ position: 'relative' }}>
      {/* Warning Banner */}
      {showWarning && state.mockMode && (
        <Alert
          variant="outlined"
          title="Mock Mode Active"
          description="Client-side only. Server validation still applies."
        />
      )}

      <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Tabs
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={(tabId) => setActiveTab(tabId as TabType)}
          variant="underline"
          size="md"
          panelStyle={{ flex: 1, padding: 0 }}
        />
      </div>

      {/* Custom ConfigMenu overlay */}
      <div style={{
        position: 'absolute',
        top: '12px',
        right: '12px',
        zIndex: 10
      }}>
        <ConfigMenu items={configMenuItems} size="sm" />
      </div>
    </div>
  );
}

export function AuthPermissionsMockPanel() {
  return (
    <ThemeProvider defaultTheme="light">
      <AuthPermissionsMockPanelInner />
    </ThemeProvider>
  );
}