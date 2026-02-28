/**
 * Format Preview Component
 * Shows format examples for dates, numbers, currency, and pluralization
 */

import React, { useState, useMemo } from 'react';
import type { LanguageInfo, FormattingExample } from '../types/i18n';
import { i18nEventClient } from '../core/i18n-event-client';

interface FormatPreviewProps {
  currentLanguage: string;
  availableLanguages: LanguageInfo[];
}

export function FormatPreview({
  currentLanguage,
  availableLanguages
}: FormatPreviewProps) {
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([currentLanguage]);
  const [formatType, setFormatType] = useState<'date' | 'number' | 'currency' | 'plural' | 'ordinal'>('date');
  const [customValue, setCustomValue] = useState('');
  const [customOptions, setCustomOptions] = useState('{}');
  const [examples, setExamples] = useState<FormattingExample[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const defaultValues = {
    date: '2024-03-15T14:30:00.000Z',
    number: '1234567.89',
    currency: '1234.56',
    plural: '3',
    ordinal: '1'
  };

  const defaultOptions = {
    date: JSON.stringify({
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }, null, 2),
    number: JSON.stringify({
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }, null, 2),
    currency: JSON.stringify({
      style: 'currency',
      currency: 'USD'
    }, null, 2),
    plural: JSON.stringify({
      type: 'cardinal'
    }, null, 2),
    ordinal: JSON.stringify({
      type: 'ordinal'
    }, null, 2)
  };

  // Initialize with current format type defaults
  React.useEffect(() => {
    if (!customValue) {
      setCustomValue(defaultValues[formatType]);
    }
    if (customOptions === '{}') {
      setCustomOptions(defaultOptions[formatType]);
    }
  }, [formatType]);

  const generatePreview = async () => {
    setIsLoading(true);
    
    try {
      let options = {};
      try {
        options = JSON.parse(customOptions);
      } catch {
        console.warn('Invalid options JSON, using default');
      }

      let value: any = customValue;
      
      // Convert value based on format type
      switch (formatType) {
        case 'date':
          value = new Date(customValue).getTime();
          break;
        case 'number':
        case 'currency':
          value = parseFloat(customValue) || 0;
          break;
        case 'plural':
        case 'ordinal':
          value = parseInt(customValue) || 0;
          break;
      }

      // Request format preview from event client
      i18nEventClient.emit('i18n-format-preview-request', {
        type: formatType,
        value,
        languages: selectedLanguages,
        options
      });

      // Listen for response
      const unsubscribe = i18nEventClient.on('i18n-format-preview-response', (event) => {
        setExamples(event.payload.examples);
        setIsLoading(false);
        unsubscribe();
      });

      // Timeout after 5 seconds
      setTimeout(() => {
        setIsLoading(false);
        unsubscribe();
      }, 5000);

    } catch (error) {
      console.error('Failed to generate format preview:', error);
      setIsLoading(false);
      
      // Generate fallback examples
      generateFallbackExamples();
    }
  };

  const generateFallbackExamples = () => {
    const fallbackExamples: FormattingExample[] = selectedLanguages.map(lang => {
      let output = customValue;
      let options = {};
      
      try {
        options = JSON.parse(customOptions);
      } catch {
        // Use empty options if JSON is invalid
      }

      // Basic fallback formatting
      if (formatType === 'date') {
        try {
          const date = new Date(customValue);
          output = date.toLocaleDateString(lang, options as Intl.DateTimeFormatOptions);
        } catch {
          output = 'Invalid Date';
        }
      } else if (formatType === 'number') {
        try {
          const num = parseFloat(customValue);
          output = num.toLocaleString(lang, options as Intl.NumberFormatOptions);
        } catch {
          output = 'Invalid Number';
        }
      } else if (formatType === 'currency') {
        try {
          const num = parseFloat(customValue);
          output = num.toLocaleString(lang, {
            style: 'currency',
            currency: 'USD',
            ...options as Intl.NumberFormatOptions
          });
        } catch {
          output = 'Invalid Currency';
        }
      } else if (formatType === 'plural') {
        const num = parseInt(customValue) || 0;
        output = `${num} item${num === 1 ? '' : 's'}`;
      } else if (formatType === 'ordinal') {
        const num = parseInt(customValue) || 0;
        const suffix = ['th', 'st', 'nd', 'rd'][num % 100 > 10 && num % 100 < 14 ? 0 : (num % 10 < 4 ? num % 10 : 0)];
        output = `${num}${suffix}`;
      }

      return {
        type: formatType,
        input: customValue,
        output,
        locale: lang,
        options
      };
    });

    setExamples(fallbackExamples);
  };

  const presetExamples = useMemo(() => {
    const presets: Record<string, Array<{ label: string; value: string; options: string }>> = {
      date: [
        {
          label: 'Full Date & Time',
          value: '2024-03-15T14:30:00.000Z',
          options: JSON.stringify({
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }, null, 2)
        },
        {
          label: 'Short Date',
          value: '2024-03-15T14:30:00.000Z',
          options: JSON.stringify({
            year: '2-digit',
            month: 'short',
            day: 'numeric'
          }, null, 2)
        },
        {
          label: 'Relative Time',
          value: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
          options: JSON.stringify({
            style: 'relative',
            numeric: 'auto'
          }, null, 2)
        }
      ],
      number: [
        {
          label: 'Decimal',
          value: '1234567.89',
          options: JSON.stringify({
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          }, null, 2)
        },
        {
          label: 'Percentage',
          value: '0.85',
          options: JSON.stringify({
            style: 'percent',
            minimumFractionDigits: 1
          }, null, 2)
        },
        {
          label: 'Scientific',
          value: '123456789',
          options: JSON.stringify({
            notation: 'scientific',
            maximumFractionDigits: 2
          }, null, 2)
        }
      ],
      currency: [
        {
          label: 'USD',
          value: '1234.56',
          options: JSON.stringify({
            style: 'currency',
            currency: 'USD'
          }, null, 2)
        },
        {
          label: 'EUR',
          value: '1234.56',
          options: JSON.stringify({
            style: 'currency',
            currency: 'EUR'
          }, null, 2)
        },
        {
          label: 'JPY',
          value: '123456',
          options: JSON.stringify({
            style: 'currency',
            currency: 'JPY'
          }, null, 2)
        }
      ],
      plural: [
        {
          label: 'Cardinal (0)',
          value: '0',
          options: JSON.stringify({ type: 'cardinal' }, null, 2)
        },
        {
          label: 'Cardinal (1)',
          value: '1',
          options: JSON.stringify({ type: 'cardinal' }, null, 2)
        },
        {
          label: 'Cardinal (5)',
          value: '5',
          options: JSON.stringify({ type: 'cardinal' }, null, 2)
        }
      ],
      ordinal: [
        {
          label: '1st',
          value: '1',
          options: JSON.stringify({ type: 'ordinal' }, null, 2)
        },
        {
          label: '22nd',
          value: '22',
          options: JSON.stringify({ type: 'ordinal' }, null, 2)
        },
        {
          label: '103rd',
          value: '103',
          options: JSON.stringify({ type: 'ordinal' }, null, 2)
        }
      ]
    };

    return presets[formatType] || [];
  }, [formatType]);

  const toggleLanguage = (langCode: string) => {
    setSelectedLanguages(prev => 
      prev.includes(langCode)
        ? prev.filter(l => l !== langCode)
        : [...prev, langCode]
    );
  };

  const applyPreset = (preset: { value: string; options: string }) => {
    setCustomValue(preset.value);
    setCustomOptions(preset.options);
  };

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
          🎨 Format Preview
        </h4>
        <div style={{ fontSize: '11px', color: 'var(--dt-text-secondary)' }}>
          Test how dates, numbers, currency, and pluralization are formatted across different languages
        </div>
      </div>

      {/* Controls */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '20px',
        marginBottom: '20px'
      }}>
        {/* Format Type Selection */}
        <div style={{
          background: 'var(--dt-bg-tertiary)',
          padding: '15px',
          borderRadius: '4px',
          border: '1px solid var(--dt-border-primary)'
        }}>
          <h5 style={{ margin: '0 0 10px 0', color: 'var(--dt-border-focus)', fontSize: '12px' }}>
            Format Type
          </h5>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
            {[
              { type: 'date', label: 'Date & Time', icon: '📅' },
              { type: 'number', label: 'Numbers', icon: '🔢' },
              { type: 'currency', label: 'Currency', icon: '💰' },
              { type: 'plural', label: 'Pluralization', icon: '📝' },
              { type: 'ordinal', label: 'Ordinals', icon: '🥇' }
            ].map(item => (
              <button
                key={item.type}
                onClick={() => setFormatType(item.type as any)}
                style={{
                  padding: '8px 10px',
                  fontSize: '11px',
                  border: '1px solid var(--dt-border-primary)',
                  background: formatType === item.type ? 'var(--dt-border-focus)' : 'var(--dt-bg-secondary)',
                  color: formatType === item.type ? 'var(--dt-text-on-primary)' : 'var(--dt-text-primary)',
                  cursor: 'pointer',
                  borderRadius: '3px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span>{item.icon}</span>
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Language Selection */}
        <div style={{
          background: 'var(--dt-bg-tertiary)',
          padding: '15px',
          borderRadius: '4px',
          border: '1px solid var(--dt-border-primary)'
        }}>
          <h5 style={{ margin: '0 0 10px 0', color: 'var(--dt-border-focus)', fontSize: '12px' }}>
            Languages ({selectedLanguages.length})
          </h5>
          
          <div style={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: '6px',
            maxHeight: '120px',
            overflowY: 'auto'
          }}>
            {availableLanguages.map(lang => (
              <button
                key={lang.code}
                onClick={() => toggleLanguage(lang.code)}
                style={{
                  padding: '4px 8px',
                  fontSize: '10px',
                  border: '1px solid var(--dt-border-primary)',
                  background: selectedLanguages.includes(lang.code) ? 'var(--dt-border-focus)' : 'var(--dt-bg-secondary)',
                  color: selectedLanguages.includes(lang.code) ? 'var(--dt-text-on-primary)' : 'var(--dt-text-primary)',
                  cursor: 'pointer',
                  borderRadius: '2px',
                  whiteSpace: 'nowrap'
                }}
              >
                {lang.code.toUpperCase()} {lang.isRTL ? '(RTL)' : ''}
              </button>
            ))}
          </div>
          
          <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
            <button
              onClick={() => setSelectedLanguages(availableLanguages.map(l => l.code))}
              style={{
                padding: '4px 8px',
                fontSize: '10px',
                border: '1px solid var(--dt-border-primary)',
                background: 'var(--dt-bg-secondary)',
                color: 'var(--dt-text-primary)',
                cursor: 'pointer',
                borderRadius: '2px'
              }}
            >
              Select All
            </button>
            <button
              onClick={() => setSelectedLanguages([currentLanguage])}
              style={{
                padding: '4px 8px',
                fontSize: '10px',
                border: '1px solid var(--dt-border-primary)',
                background: 'var(--dt-bg-secondary)',
                color: 'var(--dt-text-primary)',
                cursor: 'pointer',
                borderRadius: '2px'
              }}
            >
              Current Only
            </button>
          </div>
        </div>
      </div>

      {/* Input and Options */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '20px',
        marginBottom: '20px'
      }}>
        {/* Custom Value Input */}
        <div style={{
          background: 'var(--dt-bg-tertiary)',
          padding: '15px',
          borderRadius: '4px',
          border: '1px solid var(--dt-border-primary)'
        }}>
          <h5 style={{ margin: '0 0 10px 0', color: 'var(--dt-border-focus)', fontSize: '12px' }}>
            Input Value
          </h5>
          
          <input
            type="text"
            value={customValue}
            onChange={(e) => setCustomValue(e.target.value)}
            placeholder={`Enter ${formatType} value...`}
            style={{
              width: '100%',
              padding: '8px 10px',
              borderRadius: '3px',
              border: '1px solid var(--dt-border-primary)',
              background: 'var(--dt-bg-primary)',
              color: 'var(--dt-text-primary)',
              fontSize: '11px',
              marginBottom: '10px'
            }}
          />
          
          <div style={{ fontSize: '10px', color: 'var(--dt-text-secondary)', marginBottom: '8px' }}>
            Presets:
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            {presetExamples.map((preset, index) => (
              <button
                key={index}
                onClick={() => applyPreset(preset)}
                style={{
                  padding: '3px 6px',
                  fontSize: '9px',
                  border: '1px solid var(--dt-border-primary)',
                  background: 'var(--dt-bg-secondary)',
                  color: 'var(--dt-text-primary)',
                  cursor: 'pointer',
                  borderRadius: '2px'
                }}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Format Options */}
        <div style={{
          background: 'var(--dt-bg-tertiary)',
          padding: '15px',
          borderRadius: '4px',
          border: '1px solid var(--dt-border-primary)'
        }}>
          <h5 style={{ margin: '0 0 10px 0', color: 'var(--dt-border-focus)', fontSize: '12px' }}>
            Format Options (JSON)
          </h5>
          
          <textarea
            value={customOptions}
            onChange={(e) => setCustomOptions(e.target.value)}
            placeholder="Enter format options as JSON..."
            style={{
              width: '100%',
              height: '100px',
              resize: 'vertical',
              padding: '8px',
              borderRadius: '3px',
              border: '1px solid var(--dt-border-primary)',
              background: 'var(--dt-bg-primary)',
              color: 'var(--dt-text-primary)',
              fontSize: '10px',
              fontFamily: 'monospace',
              lineHeight: '1.4'
            }}
          />
          
          <div style={{ fontSize: '9px', color: 'var(--dt-text-secondary)', marginTop: '6px' }}>
            See Intl.{formatType === 'date' ? 'DateTimeFormat' : formatType === 'currency' || formatType === 'number' ? 'NumberFormat' : 'PluralRules'} options
          </div>
        </div>
      </div>

      {/* Generate Button */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        marginBottom: '20px'
      }}>
        <button
          onClick={generatePreview}
          disabled={isLoading || selectedLanguages.length === 0}
          style={{
            padding: '10px 20px',
            fontSize: '12px',
            border: '1px solid var(--dt-border-primary)',
            background: isLoading ? 'var(--dt-bg-secondary)' : 'var(--dt-border-focus)',
            color: isLoading ? 'var(--dt-text-secondary)' : 'var(--dt-text-on-primary)',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            borderRadius: '4px',
            fontWeight: '600',
            minWidth: '120px'
          }}
        >
          {isLoading ? 'Generating...' : 'Generate Preview'}
        </button>
      </div>

      {/* Results */}
      {examples.length > 0 && (
        <div style={{
          background: 'var(--dt-bg-tertiary)',
          padding: '15px',
          borderRadius: '4px',
          border: '1px solid var(--dt-border-primary)'
        }}>
          <h5 style={{ margin: '0 0 15px 0', color: 'var(--dt-border-focus)', fontSize: '12px' }}>
            Format Results
          </h5>
          
          <div style={{ display: 'grid', gap: '8px' }}>
            {examples.map((example, index) => (
              <div
                key={index}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '80px 1fr 120px',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px',
                  background: 'var(--dt-bg-secondary)',
                  borderRadius: '3px',
                  border: '1px solid var(--dt-border-primary)'
                }}
              >
                <div style={{
                  fontSize: '11px',
                  fontWeight: '600',
                  color: 'var(--dt-status-success)',
                  textTransform: 'uppercase'
                }}>
                  {example.locale}
                </div>
                
                <div style={{
                  fontSize: '12px',
                  color: 'var(--dt-text-primary)',
                  fontFamily: formatType === 'date' || formatType === 'number' || formatType === 'currency' ? 'inherit' : 'monospace',
                  wordBreak: 'break-all'
                }}>
                  {example.output}
                </div>
                
                <div style={{
                  fontSize: '10px',
                  color: 'var(--dt-text-secondary)',
                  textAlign: 'right'
                }}>
                  {typeof example.input === 'string' ? example.input.substring(0, 20) : String(example.input).substring(0, 20)}
                </div>
              </div>
            ))}
          </div>
          
          {/* Copy all results */}
          <div style={{ marginTop: '10px', textAlign: 'center' }}>
            <button
              onClick={() => {
                const results = examples.map(e => `${e.locale}: ${e.output}`).join('\n');
                navigator.clipboard.writeText(results).catch(() => {});
              }}
              style={{
                padding: '6px 12px',
                fontSize: '10px',
                border: '1px solid var(--dt-border-primary)',
                background: 'var(--dt-bg-secondary)',
                color: 'var(--dt-text-primary)',
                cursor: 'pointer',
                borderRadius: '2px'
              }}
            >
              📋 Copy All Results
            </button>
          </div>
        </div>
      )}

      {/* Documentation */}
      <div style={{
        marginTop: '20px',
        padding: '15px',
        background: 'var(--dt-bg-tertiary)',
        borderRadius: '4px',
        border: '1px solid var(--dt-border-primary)',
        fontSize: '10px',
        color: 'var(--dt-text-secondary)'
      }}>
        <div style={{ marginBottom: '8px', color: 'var(--dt-border-focus)', fontWeight: '600' }}>
          💡 Format Type Guide:
        </div>
        <div style={{ display: 'grid', gap: '6px' }}>
          <div><strong style={{ color: 'var(--dt-status-warning)' }}>Date:</strong> ISO strings or timestamps (e.g., &ldquo;2024-03-15T14:30:00.000Z&rdquo;)</div>
          <div><strong style={{ color: 'var(--dt-status-warning)' }}>Number:</strong> Decimal numbers (e.g., &ldquo;1234567.89&rdquo;)</div>
          <div><strong style={{ color: 'var(--dt-status-warning)' }}>Currency:</strong> Numeric amounts (e.g., &ldquo;1234.56&rdquo;)</div>
          <div><strong style={{ color: 'var(--dt-status-warning)' }}>Plural:</strong> Integer counts (e.g., &ldquo;0&rdquo;, &ldquo;1&rdquo;, &ldquo;5&rdquo;)</div>
          <div><strong style={{ color: 'var(--dt-status-warning)' }}>Ordinal:</strong> Position numbers (e.g., &ldquo;1&rdquo;, &ldquo;22&rdquo;, &ldquo;103&rdquo;)</div>
        </div>
      </div>
    </div>
  );
}