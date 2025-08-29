import React, { useState } from 'react';
import { EvaluationContext, UserSegment } from '../types';

interface UserContextPanelProps {
  context: EvaluationContext;
  segments: UserSegment[];
  onChange: (context: EvaluationContext) => void;
}

export const UserContextPanel: React.FC<UserContextPanelProps> = ({
  context,
  segments,
  onChange
}) => {
  const [editedContext, setEditedContext] = useState(context);

  const handleFieldChange = (field: keyof EvaluationContext, value: any) => {
    const newContext = { ...editedContext, [field]: value };
    setEditedContext(newContext);
  };

  const handleAttributeChange = (key: string, value: any) => {
    const newContext = {
      ...editedContext,
      attributes: {
        ...editedContext.attributes,
        [key]: value
      }
    };
    setEditedContext(newContext);
  };

  const handleApplyChanges = () => {
    onChange(editedContext);
  };

  const handleReset = () => {
    setEditedContext(context);
  };

  const handleQuickSegment = (segmentId: string) => {
    const newContext = {
      ...editedContext,
      userSegment: segmentId
    };
    setEditedContext(newContext);
    onChange(newContext);
  };

  return (
    <div className="user-context-panel">
      <h4 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600' }}>
        User Context Simulator
      </h4>

      {/* Quick segment buttons */}
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
          Quick Segments:
        </label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {segments.map((segment) => (
            <button
              key={segment.id}
              onClick={() => handleQuickSegment(segment.id)}
              className={`segment-button ${editedContext.userSegment === segment.id ? 'active' : ''}`}
            >
              {segment.name}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        {/* Basic Fields */}
        <div>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
            User ID:
          </label>
          <input
            type="text"
            value={editedContext.userId || ''}
            onChange={(e) => handleFieldChange('userId', e.target.value)}
            className="context-input"
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
            Session ID:
          </label>
          <input
            type="text"
            value={editedContext.sessionId || ''}
            onChange={(e) => handleFieldChange('sessionId', e.target.value)}
            className="context-input"
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
            User Segment:
          </label>
          <select
            value={editedContext.userSegment || ''}
            onChange={(e) => handleFieldChange('userSegment', e.target.value)}
            className="context-input"
          >
            <option value="">None</option>
            {segments.map((segment) => (
              <option key={segment.id} value={segment.id}>
                {segment.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
            Environment:
          </label>
          <select
            value={editedContext.environment || 'development'}
            onChange={(e) => handleFieldChange('environment', e.target.value)}
            className="context-input"
          >
            <option value="development">Development</option>
            <option value="staging">Staging</option>
            <option value="production">Production</option>
            <option value="test">Test</option>
          </select>
        </div>
      </div>

      {/* Custom Attributes */}
      <div style={{ marginTop: '16px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
          Custom Attributes:
        </label>
        <div style={{ display: 'grid', gap: '8px' }}>
          {Object.entries(editedContext.attributes || {}).map(([key, value]) => (
            <div key={key} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                type="text"
                value={key}
                readOnly
                className="context-input"
                style={{ flex: '0 0 120px' }}
              />
              <input
                type="text"
                value={typeof value === 'string' ? value : JSON.stringify(value)}
                onChange={(e) => {
                  let parsedValue: any = e.target.value;
                  try {
                    // Try to parse as JSON for booleans, numbers, objects
                    if (e.target.value === 'true' || e.target.value === 'false') {
                      parsedValue = e.target.value === 'true';
                    } else if (!isNaN(Number(e.target.value)) && e.target.value !== '') {
                      parsedValue = Number(e.target.value);
                    } else if (e.target.value.startsWith('{') || e.target.value.startsWith('[')) {
                      parsedValue = JSON.parse(e.target.value);
                    }
                  } catch {
                    // Keep as string if parsing fails
                  }
                  handleAttributeChange(key, parsedValue);
                }}
                className="context-input"
                style={{ flex: 1 }}
              />
              <button
                onClick={() => {
                  const newAttributes = { ...editedContext.attributes };
                  delete newAttributes[key];
                  handleFieldChange('attributes', newAttributes);
                }}
                className="remove-button"
              >
                ×
              </button>
            </div>
          ))}
        </div>

        {/* Add new attribute */}
        <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
          <input
            type="text"
            placeholder="Attribute name"
            className="context-input"
            style={{ flex: '0 0 120px' }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const input = e.target as HTMLInputElement;
                const valueInput = input.nextElementSibling as HTMLInputElement;
                if (input.value && valueInput.value) {
                  handleAttributeChange(input.value, valueInput.value);
                  input.value = '';
                  valueInput.value = '';
                }
              }
            }}
          />
          <input
            type="text"
            placeholder="Value"
            className="context-input"
            style={{ flex: 1 }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const valueInput = e.target as HTMLInputElement;
                const nameInput = valueInput.previousElementSibling as HTMLInputElement;
                if (nameInput.value && valueInput.value) {
                  let parsedValue: any = valueInput.value;
                  try {
                    if (valueInput.value === 'true' || valueInput.value === 'false') {
                      parsedValue = valueInput.value === 'true';
                    } else if (!isNaN(Number(valueInput.value)) && valueInput.value !== '') {
                      parsedValue = Number(valueInput.value);
                    } else if (valueInput.value.startsWith('{') || valueInput.value.startsWith('[')) {
                      parsedValue = JSON.parse(valueInput.value);
                    }
                  } catch {
                    // Keep as string
                  }
                  handleAttributeChange(nameInput.value, parsedValue);
                  nameInput.value = '';
                  valueInput.value = '';
                }
              }
            }}
          />
        </div>
      </div>

      {/* Actions */}
      <div style={{ marginTop: '16px', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
        <button onClick={handleReset} className="reset-button">
          Reset
        </button>
        <button onClick={handleApplyChanges} className="apply-button">
          Apply Changes
        </button>
      </div>

      <style>{`
        .user-context-panel {
          color: inherit;
        }
        
        .context-input {
          width: 100%;
          padding: 6px 8px;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          font-size: 14px;
          background-color: white;
        }
        
        .segment-button {
          padding: 4px 8px;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          background-color: white;
          cursor: pointer;
          font-size: 12px;
          transition: all 0.2s;
        }
        
        .segment-button:hover {
          background-color: #f3f4f6;
        }
        
        .segment-button.active {
          background-color: #3b82f6;
          color: white;
          border-color: #3b82f6;
        }
        
        .remove-button {
          padding: 4px 8px;
          background-color: #ef4444;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
        }
        
        .remove-button:hover {
          background-color: #dc2626;
        }
        
        .reset-button {
          padding: 6px 12px;
          background-color: #6b7280;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
        }
        
        .apply-button {
          padding: 6px 12px;
          background-color: #10b981;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
        }
        
        /* Dark theme */
        :global(.dark) .context-input {
          background-color: #374151;
          border-color: #4b5563;
          color: #f3f4f6;
        }
        
        :global(.dark) .segment-button {
          background-color: #374151;
          border-color: #4b5563;
          color: #f3f4f6;
        }
        
        :global(.dark) .segment-button:hover {
          background-color: #4b5563;
        }
      `}</style>
    </div>
  );
};