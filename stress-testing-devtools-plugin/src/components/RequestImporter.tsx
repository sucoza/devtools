import React, { useState } from 'react'
import { StressTestConfig } from '../types'
import { RequestImportParser } from '../utils/import-parsers'

interface RequestImporterProps {
  onImport: (config: StressTestConfig) => void
  onClose: () => void
}

export const RequestImporter: React.FC<RequestImporterProps> = ({ onImport, onClose }) => {
  const [importText, setImportText] = useState('')
  const [parseResult, setParseResult] = useState<StressTestConfig | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [importType, setImportType] = useState<'auto' | 'curl' | 'fetch' | 'powershell' | 'http'>('auto')

  const handleParse = () => {
    setError(null)
    setParseResult(null)

    if (!importText.trim()) {
      setError('Please paste your request data')
      return
    }

    let result: StressTestConfig | null = null

    try {
      if (importType === 'auto') {
        result = RequestImportParser.parseAny(importText)
      } else if (importType === 'curl') {
        result = RequestImportParser.parseCurl(importText)
      } else if (importType === 'fetch') {
        result = RequestImportParser.parseFetch(importText)
      } else if (importType === 'powershell') {
        result = RequestImportParser.parsePowerShell(importText)
      } else if (importType === 'http') {
        // For HTTP raw requests, we'll use the parseAny method which handles it
        result = RequestImportParser.parseAny(importText)
      }

      if (result) {
        setParseResult(result)
        setError(null)
      } else {
        setError('Could not parse the request. Please check the format and try again.')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to parse request')
    }
  }

  const handleImport = () => {
    if (parseResult) {
      onImport(parseResult)
      onClose()
    }
  }

  const getPlaceholderText = () => {
    switch (importType) {
      case 'curl':
        return `curl -X POST https://api.example.com/users \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer token" \\
  -d '{"name": "John Doe", "email": "john@example.com"}'`

      case 'fetch':
        return `fetch("https://api.example.com/users", {
  "headers": {
    "content-type": "application/json",
    "authorization": "Bearer token"
  },
  "body": "{\\"name\\": \\"John Doe\\", \\"email\\": \\"john@example.com\\"}",
  "method": "POST"
});`

      case 'powershell':
        return `Invoke-RestMethod -Uri "https://api.example.com/users" \\
  -Method POST \\
  -Headers @{"Content-Type"="application/json"; "Authorization"="Bearer token"} \\
  -Body '{"name": "John Doe", "email": "john@example.com"}'`

      case 'http':
        return `POST /users HTTP/1.1
Host: api.example.com
Content-Type: application/json
Authorization: Bearer token

{"name": "John Doe", "email": "john@example.com"}`

      default:
        return 'Paste your cURL command, fetch() code, PowerShell Invoke-RestMethod, or raw HTTP request here...'
    }
  }

  const getExamples = () => {
    const examples = [
      {
        name: 'Chrome DevTools (Copy as cURL)',
        description: 'Right-click request → Copy → Copy as cURL',
        format: 'curl'
      },
      {
        name: 'Chrome DevTools (Copy as fetch)',
        description: 'Right-click request → Copy → Copy as fetch',
        format: 'fetch'
      },
      {
        name: 'Firefox DevTools',
        description: 'Right-click request → Copy → Copy as cURL',
        format: 'curl'
      },
      {
        name: 'Postman',
        description: 'Click Code → cURL or JavaScript - fetch',
        format: 'curl'
      },
      {
        name: 'PowerShell',
        description: 'Invoke-RestMethod or Invoke-WebRequest commands',
        format: 'powershell'
      }
    ]

    return examples
  }

  return (
    <div className="request-importer">
      <div className="importer-header">
        <h3>Import Request</h3>
        <button onClick={onClose} className="close-btn">×</button>
      </div>

      <div className="import-options">
        <label>Import Format:</label>
        <select 
          value={importType} 
          onChange={(e) => setImportType(e.target.value as any)}
          className="format-select"
        >
          <option value="auto">Auto-detect</option>
          <option value="curl">cURL</option>
          <option value="fetch">JavaScript fetch()</option>
          <option value="powershell">PowerShell</option>
          <option value="http">Raw HTTP</option>
        </select>
      </div>

      <div className="import-examples">
        <details className="examples-section">
          <summary>💡 How to copy requests from different tools</summary>
          <div className="examples-list">
            {getExamples().map((example, index) => (
              <div key={index} className="example-item">
                <strong>{example.name}:</strong>
                <span>{example.description}</span>
              </div>
            ))}
          </div>
        </details>
      </div>

      <div className="import-input">
        <label>Request Data:</label>
        <textarea
          value={importText}
          onChange={(e) => setImportText(e.target.value)}
          placeholder={getPlaceholderText()}
          className="import-textarea"
          rows={10}
        />
      </div>

      <div className="import-actions">
        <button onClick={handleParse} className="btn-primary parse-btn">
          📝 Parse Request
        </button>
      </div>

      {error && (
        <div className="import-error">
          <strong>Parse Error:</strong> {error}
        </div>
      )}

      {parseResult && (
        <div className="parse-preview">
          <h4>Parsed Request Preview</h4>
          <div className="preview-details">
            <div className="detail-row">
              <span className="detail-label">Name:</span>
              <span className="detail-value">{parseResult.name}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Method:</span>
              <span className="detail-value method-badge">{parseResult.method}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Path:</span>
              <span className="detail-value">{parseResult.path}</span>
            </div>
            {Object.keys(parseResult.headers || {}).length > 0 && (
              <div className="detail-row">
                <span className="detail-label">Headers:</span>
                <div className="headers-preview">
                  {Object.entries(parseResult.headers || {}).map(([key, value]) => (
                    <div key={key} className="header-item">
                      <code>{key}: {value}</code>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {Object.keys(parseResult.inputParams).length > 0 && (
              <div className="detail-row">
                <span className="detail-label">Body:</span>
                <pre className="body-preview">
                  {JSON.stringify(parseResult.inputParams, null, 2)}
                </pre>
              </div>
            )}
          </div>

          <div className="preview-actions">
            <button onClick={handleImport} className="btn-primary import-btn">
              ✅ Import Request
            </button>
            <input
              type="text"
              value={parseResult.name}
              onChange={(e) => setParseResult({...parseResult, name: e.target.value})}
              placeholder="Request name"
              className="name-input"
            />
          </div>
        </div>
      )}
    </div>
  )
}