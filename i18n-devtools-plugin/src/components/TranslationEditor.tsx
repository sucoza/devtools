/**
 * Translation Editor Component
 * Provides inline editing capabilities for translation values
 */

import React, { useState, useEffect, useCallback } from 'react';
import type { I18nState, Translation } from '../types/i18n';

interface TranslationEditorProps {
  i18nState: I18nState;
  selectedKey: string | null;
  selectedNamespace: string | null;
  selectedLanguage: string;
  isEditing: boolean;
  onEdit: (key: string, namespace: string, language: string, value: string) => void;
  onEditingChange: (isEditing: boolean) => void;
}

export function TranslationEditor({
  i18nState,
  selectedKey,
  selectedNamespace,
  selectedLanguage,
  isEditing,
  onEdit,
  onEditingChange
}: TranslationEditorProps) {
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [previewMode, setPreviewMode] = useState<'raw' | 'formatted'>('formatted');
  const [showAllLanguages, setShowAllLanguages] = useState(false);
  const [copySuccess, setCopySuccess] = useState<string | null>(null);

  // Get translations for the selected key
  const keyTranslations = React.useMemo(() => {
    if (!selectedKey || !selectedNamespace) return [];
    
    return i18nState.translations.filter(t => 
      t.key === selectedKey && t.namespace === selectedNamespace
    ).sort((a, b) => {
      // Sort with current language first, then alphabetically
      if (a.language === selectedLanguage) return -1;
      if (b.language === selectedLanguage) return 1;
      return a.language.localeCompare(b.language);
    });
  }, [i18nState.translations, selectedKey, selectedNamespace, selectedLanguage]);

  // Initialize edit values when key changes
  useEffect(() => {
    if (keyTranslations.length > 0) {
      const values: Record<string, string> = {};
      keyTranslations.forEach(t => {
        values[t.language] = typeof t.value === 'string' ? t.value : JSON.stringify(t.value);
      });
      setEditValues(values);
    }
  }, [keyTranslations]);

  const handleSave = useCallback(() => {
    if (!selectedKey || !selectedNamespace) return;
    
    Object.entries(editValues).forEach(([language, value]) => {
      const originalTranslation = keyTranslations.find(t => t.language === language);
      if (originalTranslation && originalTranslation.value !== value) {
        onEdit(selectedKey, selectedNamespace, language, value);
      }
    });
    
    onEditingChange(false);
  }, [selectedKey, selectedNamespace, editValues, keyTranslations, onEdit, onEditingChange]);

  const handleCancel = useCallback(() => {
    // Reset to original values
    const values: Record<string, string> = {};
    keyTranslations.forEach(t => {
      values[t.language] = typeof t.value === 'string' ? t.value : JSON.stringify(t.value);
    });
    setEditValues(values);
    onEditingChange(false);
  }, [keyTranslations, onEditingChange]);

  const copyToClipboard = useCallback(async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(label);
      setTimeout(() => setCopySuccess(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, []);

  const formatPreview = (value: string, language: string): string => {
    // Simple interpolation preview
    return value
      .replace(/\{\{(\w+)\}\}/g, (match, key) => `<${key}>`)
      .replace(/\{(\w+)\}/g, (match, key) => `[${key}]`);
  };

  const hasChanges = React.useMemo(() => {
    return keyTranslations.some(t => {
      const originalValue = typeof t.value === 'string' ? t.value : JSON.stringify(t.value);
      return editValues[t.language] !== originalValue;
    });
  }, [keyTranslations, editValues]);

  if (!selectedKey || !selectedNamespace) {
    return (
      <div style={{
        padding: '40px',
        textAlign: 'center',
        color: '#969696',
        fontSize: '12px',
        background: '#1e1e1e',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '20px' }}>✏️</div>
        <div style={{ fontWeight: '600', marginBottom: '10px' }}>
          Translation Editor
        </div>
        <div>
          Select a translation key to start editing
        </div>
      </div>
    );
  }

  if (keyTranslations.length === 0) {
    return (
      <div style={{
        padding: '20px',
        textAlign: 'center',
        color: '#f48771',
        fontSize: '12px',
        background: '#1e1e1e'
      }}>
        No translations found for key: {selectedKey}
      </div>
    );
  }

  return (
    <div style={{
      padding: '15px',
      height: '100%',
      overflowY: 'auto',
      background: '#1e1e1e'
    }}>
      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <h4 style={{ margin: '0 0 10px 0', color: '#9cdcfe', fontSize: '14px', fontWeight: '600' }}>
          ✏️ Translation Editor
        </h4>
        
        <div style={{
          background: '#252526',
          padding: '12px',
          borderRadius: '4px',
          border: '1px solid #3c3c3c'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <div>
              <div style={{ fontSize: '12px', fontWeight: '600', color: '#cccccc' }}>
                {selectedKey}
              </div>
              <div style={{ fontSize: '10px', color: '#969696' }}>
                {selectedNamespace}
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => copyToClipboard(selectedKey, 'Key')}
                style={{
                  padding: '4px 8px',
                  fontSize: '10px',
                  border: '1px solid #3c3c3c',
                  background: copySuccess === 'Key' ? '#1e5f1e' : '#2d2d30',
                  color: copySuccess === 'Key' ? '#4ec9b0' : '#cccccc',
                  cursor: 'pointer',
                  borderRadius: '2px'
                }}
              >
                {copySuccess === 'Key' ? '✓' : '📋'} Copy Key
              </button>
              
              <button
                onClick={() => setShowAllLanguages(!showAllLanguages)}
                style={{
                  padding: '4px 8px',
                  fontSize: '10px',
                  border: '1px solid #3c3c3c',
                  background: showAllLanguages ? '#007acc' : '#2d2d30',
                  color: showAllLanguages ? '#ffffff' : '#cccccc',
                  cursor: 'pointer',
                  borderRadius: '2px'
                }}
              >
                {showAllLanguages ? 'Current Only' : 'All Languages'}
              </button>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <span style={{ fontSize: '10px', color: '#969696' }}>
              {keyTranslations.length} language{keyTranslations.length !== 1 ? 's' : ''}
            </span>
            
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setPreviewMode(previewMode === 'raw' ? 'formatted' : 'raw')}
                style={{
                  padding: '2px 6px',
                  fontSize: '9px',
                  border: '1px solid #3c3c3c',
                  background: '#2d2d30',
                  color: '#cccccc',
                  cursor: 'pointer',
                  borderRadius: '2px'
                }}
              >
                {previewMode === 'raw' ? 'Formatted' : 'Raw'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Translation fields */}
      <div style={{ marginBottom: '20px' }}>
        {keyTranslations
          .filter(t => showAllLanguages || t.language === selectedLanguage)
          .map(translation => {
            const isCurrentLanguage = translation.language === selectedLanguage;
            const isMissing = translation.isMissing;
            const currentValue = editValues[translation.language] || '';
            const hasChanged = currentValue !== (typeof translation.value === 'string' ? translation.value : JSON.stringify(translation.value));
            
            return (
              <div
                key={translation.language}
                style={{
                  marginBottom: '15px',
                  background: isCurrentLanguage ? '#252526' : '#2a2a2a',
                  border: '1px solid',
                  borderColor: isCurrentLanguage ? '#007acc' : (isMissing ? '#8b3a3a' : '#3c3c3c'),
                  borderRadius: '4px',
                  overflow: 'hidden'
                }}
              >
                {/* Language header */}
                <div style={{
                  padding: '10px 12px',
                  background: isCurrentLanguage ? '#094771' : (isMissing ? '#5a1d1d' : '#2d2d30'),
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ 
                      fontSize: '12px', 
                      fontWeight: '600',
                      color: isCurrentLanguage ? '#ffffff' : (isMissing ? '#f48771' : '#cccccc')
                    }}>
                      {translation.language.toUpperCase()}
                    </span>
                    
                    {isCurrentLanguage && (
                      <span style={{
                        background: '#4ec9b0',
                        color: '#ffffff',
                        padding: '2px 6px',
                        borderRadius: '2px',
                        fontSize: '8px',
                        fontWeight: '700'
                      }}>
                        CURRENT
                      </span>
                    )}
                    
                    {isMissing && (
                      <span style={{
                        background: '#f48771',
                        color: '#ffffff',
                        padding: '2px 6px',
                        borderRadius: '2px',
                        fontSize: '8px',
                        fontWeight: '700'
                      }}>
                        MISSING
                      </span>
                    )}
                    
                    {hasChanged && (
                      <span style={{
                        background: '#d19a66',
                        color: '#ffffff',
                        padding: '2px 6px',
                        borderRadius: '2px',
                        fontSize: '8px',
                        fontWeight: '700'
                      }}>
                        MODIFIED
                      </span>
                    )}
                  </div>
                  
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      onClick={() => copyToClipboard(currentValue, translation.language)}
                      style={{
                        padding: '2px 6px',
                        fontSize: '9px',
                        border: '1px solid #3c3c3c',
                        background: copySuccess === translation.language ? '#1e5f1e' : '#2d2d30',
                        color: copySuccess === translation.language ? '#4ec9b0' : '#cccccc',
                        cursor: 'pointer',
                        borderRadius: '2px'
                      }}
                    >
                      {copySuccess === translation.language ? '✓' : '📋'}
                    </button>
                  </div>
                </div>
                
                {/* Edit area */}
                <div style={{ padding: '12px' }}>
                  <textarea
                    value={currentValue}
                    onChange={(e) => {
                      setEditValues(prev => ({
                        ...prev,
                        [translation.language]: e.target.value
                      }));
                      if (!isEditing) {
                        onEditingChange(true);
                      }
                    }}
                    placeholder={isMissing ? 'Enter translation...' : 'Translation value'}
                    style={{
                      width: '100%',
                      minHeight: '80px',
                      maxHeight: '200px',
                      resize: 'vertical',
                      padding: '8px',
                      border: '1px solid #3c3c3c',
                      borderRadius: '3px',
                      background: '#1e1e1e',
                      color: isMissing ? '#f48771' : '#cccccc',
                      fontSize: '11px',
                      fontFamily: 'monospace',
                      lineHeight: '1.4'
                    }}
                  />
                  
                  {/* Preview */}
                  {previewMode === 'formatted' && currentValue && (
                    <div style={{
                      marginTop: '8px',
                      padding: '8px',
                      background: '#2a2a2a',
                      borderRadius: '3px',
                      border: '1px solid #3c3c3c'
                    }}>
                      <div style={{ fontSize: '9px', color: '#9cdcfe', marginBottom: '4px' }}>
                        Preview:
                      </div>
                      <div style={{
                        fontSize: '11px',
                        color: '#cccccc',
                        fontStyle: 'italic',
                        lineHeight: '1.4'
                      }}>
                        {formatPreview(currentValue, translation.language)}
                      </div>
                    </div>
                  )}
                  
                  {/* Character count */}
                  <div style={{
                    marginTop: '6px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '9px',
                    color: '#969696'
                  }}>
                    <span>{currentValue.length} characters</span>
                    {hasChanged && (
                      <span style={{ color: '#d19a66' }}>
                        Modified
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
      </div>

      {/* Actions */}
      {isEditing && (
        <div style={{
          position: 'sticky',
          bottom: '0',
          background: '#252526',
          border: '1px solid #3c3c3c',
          borderRadius: '4px',
          padding: '12px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ fontSize: '11px', color: '#969696' }}>
            {hasChanges ? 'You have unsaved changes' : 'No changes to save'}
          </div>
          
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleCancel}
              style={{
                padding: '6px 12px',
                fontSize: '11px',
                border: '1px solid #3c3c3c',
                background: '#2d2d30',
                color: '#cccccc',
                cursor: 'pointer',
                borderRadius: '3px'
              }}
            >
              Cancel
            </button>
            
            <button
              onClick={handleSave}
              disabled={!hasChanges}
              style={{
                padding: '6px 12px',
                fontSize: '11px',
                border: '1px solid #3c3c3c',
                background: hasChanges ? '#1e5f1e' : '#2d2d30',
                color: hasChanges ? '#ffffff' : '#969696',
                cursor: hasChanges ? 'pointer' : 'not-allowed',
                borderRadius: '3px'
              }}
            >
              Save Changes
            </button>
          </div>
        </div>
      )}

      {/* Helper text */}
      <div style={{
        marginTop: '20px',
        padding: '12px',
        background: '#252526',
        borderRadius: '4px',
        border: '1px solid #3c3c3c',
        fontSize: '10px',
        color: '#969696'
      }}>
        <div style={{ marginBottom: '6px', color: '#9cdcfe', fontWeight: '600' }}>
          💡 Tips:
        </div>
        <ul style={{ margin: 0, paddingLeft: '16px' }}>
          <li>Use {'{{variable}}'} for interpolation placeholders</li>
          <li>Use {'_zero'}, {'_one'}, {'_other'} suffixes for pluralization</li>
          <li>Preview shows how interpolation will be formatted</li>
          <li>Changes are saved immediately upon clicking "Save Changes"</li>
        </ul>
      </div>
    </div>
  );
}