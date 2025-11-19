/**
 * Translation Editor Component
 * Provides inline editing capabilities for translation values
 */

import React, { useState, useEffect, useCallback } from 'react';
import type { I18nState, Translation as _Translation } from '../types/i18n';

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

  const formatPreview = (value: string, _language: string): string => {
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
        color: 'var(--dt-text-secondary)',
        fontSize: '12px',
        background: 'var(--dt-bg-primary)',
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
        color: 'var(--dt-status-error)',
        fontSize: '12px',
        background: 'var(--dt-bg-primary)'
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
      background: 'var(--dt-bg-primary)'
    }}>
      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <h4 style={{ margin: '0 0 10px 0', color: 'var(--dt-border-focus)', fontSize: '14px', fontWeight: '600' }}>
          ✏️ Translation Editor
        </h4>
        
        <div style={{
          background: 'var(--dt-bg-tertiary)',
          padding: '12px',
          borderRadius: '4px',
          border: '1px solid var(--dt-border-primary)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <div>
              <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--dt-text-primary)' }}>
                {selectedKey}
              </div>
              <div style={{ fontSize: '10px', color: 'var(--dt-text-secondary)' }}>
                {selectedNamespace}
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => copyToClipboard(selectedKey, 'Key')}
                style={{
                  padding: '4px 8px',
                  fontSize: '10px',
                  border: '1px solid var(--dt-border-primary)',
                  background: copySuccess === 'Key' ? 'var(--dt-status-success-bg)' : 'var(--dt-bg-secondary)',
                  color: copySuccess === 'Key' ? 'var(--dt-status-success)' : 'var(--dt-text-primary)',
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
                  border: '1px solid var(--dt-border-primary)',
                  background: showAllLanguages ? 'var(--dt-border-focus)' : 'var(--dt-bg-secondary)',
                  color: showAllLanguages ? 'var(--dt-text-on-primary)' : 'var(--dt-text-primary)',
                  cursor: 'pointer',
                  borderRadius: '2px'
                }}
              >
                {showAllLanguages ? 'Current Only' : 'All Languages'}
              </button>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <span style={{ fontSize: '10px', color: 'var(--dt-text-secondary)' }}>
              {keyTranslations.length} language{keyTranslations.length !== 1 ? 's' : ''}
            </span>
            
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setPreviewMode(previewMode === 'raw' ? 'formatted' : 'raw')}
                style={{
                  padding: '2px 6px',
                  fontSize: '9px',
                  border: '1px solid var(--dt-border-primary)',
                  background: 'var(--dt-bg-secondary)',
                  color: 'var(--dt-text-primary)',
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
                  background: isCurrentLanguage ? 'var(--dt-bg-tertiary)' : 'var(--dt-bg-secondary)',
                  border: '1px solid',
                  borderColor: isCurrentLanguage ? 'var(--dt-border-focus)' : (isMissing ? 'var(--dt-status-error)' : 'var(--dt-border-primary)'),
                  borderRadius: '4px',
                  overflow: 'hidden'
                }}
              >
                {/* Language header */}
                <div style={{
                  padding: '10px 12px',
                  background: isCurrentLanguage ? 'var(--dt-border-focus)' : (isMissing ? 'var(--dt-status-error-bg)' : 'var(--dt-bg-secondary)'),
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ 
                      fontSize: '12px', 
                      fontWeight: '600',
                      color: isCurrentLanguage ? 'var(--dt-text-on-primary)' : (isMissing ? 'var(--dt-status-error)' : 'var(--dt-text-primary)')
                    }}>
                      {translation.language.toUpperCase()}
                    </span>
                    
                    {isCurrentLanguage && (
                      <span style={{
                        background: 'var(--dt-status-success)',
                        color: 'var(--dt-text-on-primary)',
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
                        background: 'var(--dt-status-error)',
                        color: 'var(--dt-text-on-primary)',
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
                        background: 'var(--dt-status-warning)',
                        color: 'var(--dt-text-on-primary)',
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
                        border: '1px solid var(--dt-border-primary)',
                        background: copySuccess === translation.language ? 'var(--dt-status-success-bg)' : 'var(--dt-bg-secondary)',
                        color: copySuccess === translation.language ? 'var(--dt-status-success)' : 'var(--dt-text-primary)',
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
                      border: '1px solid var(--dt-border-primary)',
                      borderRadius: '3px',
                      background: 'var(--dt-bg-primary)',
                      color: isMissing ? 'var(--dt-status-error)' : 'var(--dt-text-primary)',
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
                      background: 'var(--dt-bg-secondary)',
                      borderRadius: '3px',
                      border: '1px solid var(--dt-border-primary)'
                    }}>
                      <div style={{ fontSize: '9px', color: 'var(--dt-border-focus)', marginBottom: '4px' }}>
                        Preview:
                      </div>
                      <div style={{
                        fontSize: '11px',
                        color: 'var(--dt-text-primary)',
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
                    color: 'var(--dt-text-secondary)'
                  }}>
                    <span>{currentValue.length} characters</span>
                    {hasChanged && (
                      <span style={{ color: 'var(--dt-status-warning)' }}>
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
          background: 'var(--dt-bg-tertiary)',
          border: '1px solid var(--dt-border-primary)',
          borderRadius: '4px',
          padding: '12px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ fontSize: '11px', color: 'var(--dt-text-secondary)' }}>
            {hasChanges ? 'You have unsaved changes' : 'No changes to save'}
          </div>
          
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleCancel}
              style={{
                padding: '6px 12px',
                fontSize: '11px',
                border: '1px solid var(--dt-border-primary)',
                background: 'var(--dt-bg-secondary)',
                color: 'var(--dt-text-primary)',
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
                border: '1px solid var(--dt-border-primary)',
                background: hasChanges ? 'var(--dt-status-success-bg)' : 'var(--dt-bg-secondary)',
                color: hasChanges ? 'var(--dt-text-on-primary)' : 'var(--dt-text-secondary)',
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
        background: 'var(--dt-bg-tertiary)',
        borderRadius: '4px',
        border: '1px solid var(--dt-border-primary)',
        fontSize: '10px',
        color: 'var(--dt-text-secondary)'
      }}>
        <div style={{ marginBottom: '6px', color: 'var(--dt-border-focus)', fontWeight: '600' }}>
          💡 Tips:
        </div>
        <ul style={{ margin: 0, paddingLeft: '16px' }}>
          <li>Use {'{{variable}}'} for interpolation placeholders</li>
          <li>Use {'_zero'}, {'_one'}, {'_other'} suffixes for pluralization</li>
          <li>Preview shows how interpolation will be formatted</li>
          <li>Changes are saved immediately upon clicking &ldquo;Save Changes&rdquo;</li>
        </ul>
      </div>
    </div>
  );
}