import React, { useState } from 'react'
import { ValidationRule } from '../types'
import { ValidationEngine } from '../utils/validation-engine'

interface ValidationRuleEditorProps {
  rules: ValidationRule[]
  onRulesChange: (rules: ValidationRule[]) => void
}

export const ValidationRuleEditor: React.FC<ValidationRuleEditorProps> = ({
  rules,
  onRulesChange
}) => {
  const [editingRule, setEditingRule] = useState<ValidationRule | null>(null)
  const [showAddRule, setShowAddRule] = useState(false)

  const addRule = (type: ValidationRule['type']) => {
    const newRule = ValidationEngine.createDefaultRule(type)
    onRulesChange([...rules, newRule])
    setEditingRule(newRule)
    setShowAddRule(false)
  }

  const updateRule = (updatedRule: ValidationRule) => {
    const newRules = rules.map(rule => 
      rule.id === updatedRule.id ? updatedRule : rule
    )
    onRulesChange(newRules)
  }

  const deleteRule = (ruleId: string) => {
    onRulesChange(rules.filter(rule => rule.id !== ruleId))
    if (editingRule?.id === ruleId) {
      setEditingRule(null)
    }
  }

  const toggleRule = (ruleId: string) => {
    const newRules = rules.map(rule => 
      rule.id === ruleId ? { ...rule, enabled: !rule.enabled } : rule
    )
    onRulesChange(newRules)
  }

  const duplicateRule = (rule: ValidationRule) => {
    const newRule = {
      ...rule,
      id: `${rule.type}-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      name: `${rule.name} (Copy)`
    }
    onRulesChange([...rules, newRule])
  }

  const getOperatorOptions = (type: ValidationRule['type']) => {
    switch (type) {
      case 'status':
      case 'responseTime':
      case 'size':
        return ['equals', 'notEquals', 'greaterThan', 'lessThan', 'greaterThanOrEqual', 'lessThanOrEqual']
      case 'header':
        return ['equals', 'notEquals', 'contains', 'notContains', 'exists', 'notExists', 'regex']
      case 'body':
        return ['equals', 'notEquals', 'contains', 'notContains', 'exists', 'notExists', 'regex', 'jsonPath']
      case 'custom':
        return ['custom']
      default:
        return ['equals', 'notEquals', 'contains', 'notContains', 'exists', 'notExists']
    }
  }

  const needsTarget = (rule: ValidationRule) => {
    return rule.type === 'header' || (rule.type === 'body' && rule.operator === 'jsonPath')
  }

  const needsExpectedValue = (rule: ValidationRule) => {
    return !['exists', 'notExists', 'custom'].includes(rule.operator)
  }

  const needsCustomCode = (rule: ValidationRule) => {
    return rule.operator === 'custom' || rule.type === 'custom'
  }

  return (
    <div className="validation-rule-editor">
      <div className="rules-header">
        <h4>Validation Rules ({rules.length})</h4>
        <button
          onClick={() => setShowAddRule(!showAddRule)}
          className="btn-primary add-rule-btn"
        >
          + Add Rule
        </button>
      </div>

      {showAddRule && (
        <div className="add-rule-panel">
          <h5>Add New Validation Rule</h5>
          <div className="rule-type-grid">
            {['status', 'header', 'body', 'responseTime', 'size', 'custom'].map(type => (
              <button
                key={type}
                onClick={() => addRule(type as ValidationRule['type'])}
                className="rule-type-btn"
                title={getRuleTypeDescription(type as ValidationRule['type'])}
              >
                {getRuleTypeIcon(type as ValidationRule['type'])}
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowAddRule(false)}
            className="btn-secondary cancel-btn"
          >
            Cancel
          </button>
        </div>
      )}

      <div className="rules-list">
        {rules.map(rule => (
          <div key={rule.id} className={`rule-item ${!rule.enabled ? 'disabled' : ''}`}>
            <div className="rule-summary">
              <div className="rule-info">
                <div className="rule-header">
                  <span className="rule-type-badge">{rule.type}</span>
                  <span className="rule-name">{rule.name}</span>
                  <label className="rule-toggle">
                    <input
                      type="checkbox"
                      checked={rule.enabled}
                      onChange={() => toggleRule(rule.id)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
                <div className="rule-description">
                  {getRuleDescription(rule)}
                </div>
              </div>
              
              <div className="rule-actions">
                <button
                  onClick={() => setEditingRule(editingRule?.id === rule.id ? null : rule)}
                  className="btn-icon edit-btn"
                  title="Edit rule"
                >
                  ⚙️
                </button>
                <button
                  onClick={() => duplicateRule(rule)}
                  className="btn-icon duplicate-btn"
                  title="Duplicate rule"
                >
                  📋
                </button>
                <button
                  onClick={() => deleteRule(rule.id)}
                  className="btn-icon delete-btn"
                  title="Delete rule"
                >
                  🗑️
                </button>
              </div>
            </div>

            {editingRule?.id === rule.id && (
              <div className="rule-editor">
                <div className="form-group">
                  <label>Rule Name:</label>
                  <input
                    type="text"
                    value={editingRule.name}
                    onChange={(e) => setEditingRule({...editingRule, name: e.target.value})}
                    className="form-input"
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Type:</label>
                    <select
                      value={editingRule.type}
                      onChange={(e) => setEditingRule({
                        ...editingRule, 
                        type: e.target.value as ValidationRule['type'],
                        operator: 'equals' // Reset operator when type changes
                      })}
                      className="form-select"
                    >
                      <option value="status">Status Code</option>
                      <option value="header">Header</option>
                      <option value="body">Response Body</option>
                      <option value="responseTime">Response Time</option>
                      <option value="size">Response Size</option>
                      <option value="custom">Custom</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Operator:</label>
                    <select
                      value={editingRule.operator}
                      onChange={(e) => setEditingRule({
                        ...editingRule, 
                        operator: e.target.value as ValidationRule['operator']
                      })}
                      className="form-select"
                    >
                      {getOperatorOptions(editingRule.type).map(op => (
                        <option key={op} value={op}>
                          {op.replace(/([A-Z])/g, ' $1').toLowerCase()}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {needsTarget(editingRule) && (
                  <div className="form-group">
                    <label>
                      {editingRule.type === 'header' ? 'Header Name:' : 'JSON Path:'}
                    </label>
                    <input
                      type="text"
                      value={editingRule.target || ''}
                      onChange={(e) => setEditingRule({...editingRule, target: e.target.value})}
                      placeholder={
                        editingRule.type === 'header' 
                          ? 'e.g., content-type'
                          : 'e.g., data.users[0].name'
                      }
                      className="form-input"
                    />
                  </div>
                )}

                {needsExpectedValue(editingRule) && (
                  <div className="form-group">
                    <label>Expected Value:</label>
                    <input
                      type="text"
                      value={editingRule.expectedValue || ''}
                      onChange={(e) => {
                        let value: any = e.target.value
                        // Try to parse as number or boolean
                        if (!isNaN(Number(value)) && value !== '') {
                          value = Number(value)
                        } else if (value === 'true' || value === 'false') {
                          value = value === 'true'
                        }
                        setEditingRule({...editingRule, expectedValue: value})
                      }}
                      placeholder="Expected value"
                      className="form-input"
                    />
                  </div>
                )}

                {needsCustomCode(editingRule) && (
                  <div className="form-group">
                    <label>Custom Code:</label>
                    <textarea
                      value={editingRule.customCode || ''}
                      onChange={(e) => setEditingRule({...editingRule, customCode: e.target.value})}
                      placeholder="// Return true for validation success, false for failure&#10;// Available variables: response, status, headers, responseTime, responseSize&#10;return response.data && response.data.length > 0;"
                      className="form-textarea code-editor"
                      rows={6}
                    />
                    <div className="code-help">
                      <p>Available variables: <code>response</code>, <code>status</code>, <code>headers</code>, <code>responseTime</code>, <code>responseSize</code></p>
                      <p>Return <code>true</code> for success, <code>false</code> for failure, or an object with <code>{'{ passed: boolean, actualValue?: any, error?: string }'}</code></p>
                    </div>
                  </div>
                )}

                <div className="editor-actions">
                  <button
                    onClick={() => {
                      updateRule(editingRule)
                      setEditingRule(null)
                    }}
                    className="btn-primary"
                  >
                    Save Rule
                  </button>
                  <button
                    onClick={() => setEditingRule(null)}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        {rules.length === 0 && (
          <div className="no-rules">
            <p>No validation rules configured.</p>
            <p>Click &quot;Add Rule&quot; to create your first validation rule, or use &quot;Test Request&quot; to generate suggested rules automatically.</p>
          </div>
        )}
      </div>
    </div>
  )
}

function getRuleTypeIcon(type: ValidationRule['type']): string {
  const icons = {
    status: '📊',
    header: '📋',
    body: '📄',
    responseTime: '⏱️',
    size: '📏',
    custom: '⚙️'
  }
  return icons[type] || '📝'
}

function getRuleTypeDescription(type: ValidationRule['type']): string {
  const descriptions = {
    status: 'Validate HTTP status codes (200, 404, etc.)',
    header: 'Check response headers and their values',
    body: 'Validate response body content and structure',
    responseTime: 'Ensure response time meets performance requirements',
    size: 'Check response size constraints',
    custom: 'Write custom JavaScript validation logic'
  }
  return descriptions[type] || ''
}

function getRuleDescription(rule: ValidationRule): string {
  const { type, operator, target, expectedValue } = rule
  
  if (operator === 'custom') {
    return 'Custom validation logic'
  }
  
  let description = `${type.charAt(0).toUpperCase() + type.slice(1)} `
  
  if (target) {
    description += `"${target}" `
  }
  
  description += operator.replace(/([A-Z])/g, ' $1').toLowerCase()
  
  if (expectedValue !== undefined && !['exists', 'notExists'].includes(operator)) {
    description += ` ${JSON.stringify(expectedValue)}`
  }
  
  return description
}