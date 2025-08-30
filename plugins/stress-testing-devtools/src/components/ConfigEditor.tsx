import React, { useState, useEffect } from 'react'
import { StressTestConfig, ValidationRule } from '../types'
import { RequestImporter } from './RequestImporter'
import { ValidationRuleEditor } from './ValidationRuleEditor'
import { TestRequestRunner } from './TestRequestRunner'

interface ConfigEditorProps {
  configs: StressTestConfig[]
  onSave: (configs: StressTestConfig[]) => void
}

export const ConfigEditor: React.FC<ConfigEditorProps> = ({ configs, onSave }) => {
  const [activeTab, setActiveTab] = useState<'visual' | 'json'>('visual')
  const [configText, setConfigText] = useState(() => JSON.stringify(configs, null, 2))
  const [error, setError] = useState<string | null>(null)
  const [showImporter, setShowImporter] = useState(false)
  const [selectedConfigIndex, setSelectedConfigIndex] = useState<number | null>(null)
  const [_editingConfig, _setEditingConfig] = useState<StressTestConfig | null>(null)

  const selectedConfig = selectedConfigIndex !== null ? configs[selectedConfigIndex] : null

  useEffect(() => {
    setConfigText(JSON.stringify(configs, null, 2))
  }, [configs])

  const handleJsonSave = () => {
    try {
      const parsed = JSON.parse(configText)
      
      if (!Array.isArray(parsed)) {
        throw new Error('Configuration must be an array')
      }
      
      const requiredFields = ['name', 'method', 'path', 'inputParams', 'test']
      for (let i = 0; i < parsed.length; i++) {
        const config = parsed[i]
        for (const field of requiredFields) {
          if (!(field in config)) {
            throw new Error(`Missing required field '${field}' in config ${i + 1}`)
          }
        }
        
        if (!['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].includes(config.method)) {
          throw new Error(`Invalid HTTP method '${config.method}' in config ${i + 1}`)
        }
      }
      
      onSave(parsed)
      setError(null)
    } catch (_err: any) {
      setError(_err.message)
    }
  }

  const handleImportRequest = (importedConfig: StressTestConfig) => {
    const newConfigs = [...configs, importedConfig]
    onSave(newConfigs)
    setSelectedConfigIndex(newConfigs.length - 1)
  }

  const handleDeleteConfig = (index: number) => {
    if (confirm('Are you sure you want to delete this request configuration?')) {
      const newConfigs = configs.filter((_, i) => i !== index)
      onSave(newConfigs)
      if (selectedConfigIndex === index) {
        setSelectedConfigIndex(null)
      } else if (selectedConfigIndex !== null && selectedConfigIndex > index) {
        setSelectedConfigIndex(selectedConfigIndex - 1)
      }
    }
  }

  const handleDuplicateConfig = (config: StressTestConfig) => {
    const duplicated = {
      ...config,
      name: `${config.name} (Copy)`,
      validationRules: config.validationRules?.map(rule => ({
        ...rule,
        id: `${rule.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      }))
    }
    const newConfigs = [...configs, duplicated]
    onSave(newConfigs)
    setSelectedConfigIndex(newConfigs.length - 1)
  }

  const handleUpdateSelectedConfig = (updates: Partial<StressTestConfig>) => {
    if (selectedConfigIndex !== null) {
      const newConfigs = [...configs]
      newConfigs[selectedConfigIndex] = { ...newConfigs[selectedConfigIndex], ...updates }
      onSave(newConfigs)
    }
  }

  const handleValidationRulesChange = (rules: ValidationRule[]) => {
    if (selectedConfigIndex !== null) {
      handleUpdateSelectedConfig({ validationRules: rules })
    }
  }

  const handleValidationRulesGenerated = (rules: ValidationRule[]) => {
    if (selectedConfigIndex !== null) {
      const existingRules = selectedConfig?.validationRules || []
      const mergedRules = [...existingRules, ...rules]
      handleUpdateSelectedConfig({ validationRules: mergedRules })
    }
  }

  const handleExport = async () => {
    try {
      await navigator.clipboard.writeText(configText)
      alert('Configuration exported to clipboard')
    } catch {
      // console.error('Failed to copy to clipboard')
    }
  }

  const handleImportFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText()
      setConfigText(text)
      setActiveTab('json')
    } catch {
      const imported = prompt('Paste configuration JSON:')
      if (imported) {
        setConfigText(imported)
        setActiveTab('json')
      }
    }
  }

  return (
    <div className="config-editor">
      <div className="config-header">
        <h3>Request Configuration</h3>
        <div className="config-tabs">
          <button
            onClick={() => setActiveTab('visual')}
            className={`config-tab ${activeTab === 'visual' ? 'active' : ''}`}
          >
            📝 Visual Editor
          </button>
          <button
            onClick={() => setActiveTab('json')}
            className={`config-tab ${activeTab === 'json' ? 'active' : ''}`}
          >
            📄 JSON Editor
          </button>
        </div>
      </div>

      {activeTab === 'visual' ? (
        <div className="visual-editor">
          <div className="editor-layout">
            <div className="config-list">
              <div className="list-header">
                <h4>Requests ({configs.length})</h4>
                <div className="list-actions">
                  <button
                    onClick={() => setShowImporter(true)}
                    className="btn-primary import-btn"
                    title="Import from cURL, fetch, etc."
                  >
                    📥 Import
                  </button>
                  <button
                    onClick={() => {
                      const newConfig: StressTestConfig = {
                        name: 'New Request',
                        method: 'GET',
                        path: '/api/example',
                        inputParams: {},
                        test: 'response !== undefined',
                        validationRules: []
                      }
                      const newConfigs = [...configs, newConfig]
                      onSave(newConfigs)
                      setSelectedConfigIndex(newConfigs.length - 1)
                    }}
                    className="btn-secondary"
                  >
                    + Add
                  </button>
                </div>
              </div>

              <div className="request-list">
                {configs.length === 0 ? (
                  <div className="empty-list">
                    <p>No requests configured.</p>
                    <button
                      onClick={() => setShowImporter(true)}
                      className="btn-primary"
                    >
                      📥 Import Your First Request
                    </button>
                  </div>
                ) : (
                  configs.map((config, index) => (
                    <div
                      key={index}
                      className={`request-item ${selectedConfigIndex === index ? 'selected' : ''}`}
                      onClick={() => setSelectedConfigIndex(index)}
                    >
                      <div className="request-summary">
                        <div className="request-info">
                          <span className="method-badge">{config.method}</span>
                          <span className="request-name">{config.name}</span>
                        </div>
                        <div className="request-path">{config.path}</div>
                        {config.validationRules && config.validationRules.length > 0 && (
                          <div className="validation-indicator">
                            {config.validationRules.length} validation rule{config.validationRules.length !== 1 ? 's' : ''}
                          </div>
                        )}
                      </div>
                      
                      <div className="request-actions">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDuplicateConfig(config)
                          }}
                          className="btn-icon"
                          title="Duplicate"
                        >
                          📋
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteConfig(index)
                          }}
                          className="btn-icon delete"
                          title="Delete"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="config-details">
              {selectedConfig ? (
                <div className="selected-config">
                  <div className="config-form">
                    <div className="form-section">
                      <h4>Request Details</h4>
                      <div className="form-row">
                        <div className="form-group">
                          <label>Name:</label>
                          <input
                            type="text"
                            value={selectedConfig.name}
                            onChange={(e) => handleUpdateSelectedConfig({ name: e.target.value })}
                            className="form-input"
                          />
                        </div>
                        <div className="form-group method-group">
                          <label>Method:</label>
                          <select
                            value={selectedConfig.method}
                            onChange={(e) => handleUpdateSelectedConfig({ 
                              method: e.target.value as StressTestConfig['method'] 
                            })}
                            className="form-select"
                          >
                            <option value="GET">GET</option>
                            <option value="POST">POST</option>
                            <option value="PUT">PUT</option>
                            <option value="DELETE">DELETE</option>
                            <option value="PATCH">PATCH</option>
                          </select>
                        </div>
                      </div>

                      <div className="form-group">
                        <label>Path:</label>
                        <input
                          type="text"
                          value={selectedConfig.path}
                          onChange={(e) => handleUpdateSelectedConfig({ path: e.target.value })}
                          className="form-input"
                          placeholder="/api/endpoint"
                        />
                      </div>

                      <div className="form-group">
                        <label>Request Body/Params (JSON):</label>
                        <textarea
                          value={JSON.stringify(selectedConfig.inputParams, null, 2)}
                          onChange={(e) => {
                            try {
                              const parsed = JSON.parse(e.target.value || '{}')
                              handleUpdateSelectedConfig({ inputParams: parsed })
                            } catch {
                              // Invalid JSON, don't update
                            }
                          }}
                          className="form-textarea"
                          rows={6}
                        />
                      </div>

                      <div className="form-group">
                        <label>Headers (JSON):</label>
                        <textarea
                          value={JSON.stringify(selectedConfig.headers || {}, null, 2)}
                          onChange={(e) => {
                            try {
                              const parsed = JSON.parse(e.target.value || '{}')
                              handleUpdateSelectedConfig({ headers: parsed })
                            } catch {
                              // Invalid JSON, don't update
                            }
                          }}
                          className="form-textarea"
                          rows={4}
                        />
                      </div>

                      <div className="form-group">
                        <label>Legacy Test (Simple validation):</label>
                        <input
                          type="text"
                          value={selectedConfig.test}
                          onChange={(e) => handleUpdateSelectedConfig({ test: e.target.value })}
                          className="form-input"
                          placeholder="response !== undefined"
                        />
                        <div className="form-help">
                          Simple JavaScript expression for backwards compatibility. Use validation rules below for advanced validation.
                        </div>
                      </div>
                    </div>

                    <div className="form-section">
                      <TestRequestRunner
                        config={selectedConfig}
                        onValidationRulesGenerated={handleValidationRulesGenerated}
                        onConfigUpdate={handleUpdateSelectedConfig}
                      />
                    </div>

                    <div className="form-section">
                      <ValidationRuleEditor
                        rules={selectedConfig.validationRules || []}
                        onRulesChange={handleValidationRulesChange}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="no-selection">
                  <p>Select a request from the list to edit its configuration and validation rules.</p>
                  <p>Or import a new request to get started.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="json-editor">
          <div className="json-header">
            <div className="json-actions">
              <button onClick={handleImportFromClipboard} className="btn-secondary">
                📥 Import from Clipboard
              </button>
              <button onClick={handleExport} className="btn-secondary">
                📤 Export to Clipboard
              </button>
              <button onClick={handleJsonSave} className="btn-primary">
                💾 Save JSON
              </button>
            </div>
          </div>
          
          <div className="json-content">
            <textarea
              value={configText}
              onChange={(e) => setConfigText(e.target.value)}
              className="config-textarea"
              placeholder="Enter request configuration as JSON..."
              rows={20}
            />
            
            {error && (
              <div className="config-error">
                <strong>Error:</strong> {error}
              </div>
            )}
          </div>
        </div>
      )}

      {showImporter && (
        <div className="modal-overlay">
          <div className="modal-content">
            <RequestImporter
              onImport={handleImportRequest}
              onClose={() => setShowImporter(false)}
            />
          </div>
        </div>
      )}
    </div>
  )
}