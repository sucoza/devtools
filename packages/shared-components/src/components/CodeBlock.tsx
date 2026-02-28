import React, { useState, useCallback, useMemo } from 'react';
import { Copy, Check, Maximize2, Minimize2, Download, WrapText } from 'lucide-react';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '../styles/plugin-styles';

export interface CodeBlockProps {
  code: string;
  language?: string;
  
  // Display options
  title?: string;
  filename?: string;
  showLineNumbers?: boolean;
  highlightLines?: number[];
  startLineNumber?: number;
  maxHeight?: number | string;
  wrap?: boolean;
  
  // Features
  copyable?: boolean;
  downloadable?: boolean;
  expandable?: boolean;
  showLanguage?: boolean;
  
  // Syntax highlighting
  theme?: 'dark' | 'light' | 'vscode';
  customTheme?: SyntaxTheme;
  
  // Callbacks
  onCopy?: (code: string) => void;
  onDownload?: (code: string, filename?: string) => void;
  onLineClick?: (lineNumber: number) => void;
  
  // Style
  className?: string;
  style?: React.CSSProperties;
}

export interface SyntaxTheme {
  background: string;
  text: string;
  comment: string;
  keyword: string;
  string: string;
  number: string;
  function: string;
  variable: string;
  operator: string;
  punctuation: string;
  className: string;
  property: string;
  tag: string;
  attribute: string;
  lineHighlight: string;
  lineNumber: string;
}

const THEMES: Record<string, SyntaxTheme> = {
  dark: {
    background: COLORS.background.primary,
    text: COLORS.text.primary,
    comment: '#6A9955',
    keyword: '#569CD6',
    string: '#CE9178',
    number: '#B5CEA8',
    function: '#DCDCAA',
    variable: '#9CDCFE',
    operator: '#D4D4D4',
    punctuation: '#D4D4D4',
    className: '#4EC9B0',
    property: '#9CDCFE',
    tag: '#569CD6',
    attribute: '#9CDCFE',
    lineHighlight: 'rgba(255, 255, 255, 0.1)',
    lineNumber: COLORS.text.muted,
  },
  light: {
    background: '#FFFFFF',
    text: '#000000',
    comment: '#008000',
    keyword: '#0000FF',
    string: '#A31515',
    number: '#09885A',
    function: '#795E26',
    variable: '#001080',
    operator: '#000000',
    punctuation: '#000000',
    className: '#267F99',
    property: '#001080',
    tag: '#800000',
    attribute: '#FF0000',
    lineHighlight: 'rgba(0, 0, 0, 0.05)',
    lineNumber: '#858585',
  },
  vscode: {
    background: '#1E1E1E',
    text: '#D4D4D4',
    comment: '#6A9955',
    keyword: '#569CD6',
    string: '#CE9178',
    number: '#B5CEA8',
    function: '#DCDCAA',
    variable: '#9CDCFE',
    operator: '#D4D4D4',
    punctuation: '#D4D4D4',
    className: '#4EC9B0',
    property: '#9CDCFE',
    tag: '#569CD6',
    attribute: '#9CDCFE',
    lineHighlight: '#2D2D30',
    lineNumber: '#858585',
  },
};

// Sanitize a CSS color value to prevent injection via customTheme props
const sanitizeCSSValue = (value: string): string =>
  value.replace(/[;"'<>&{}]/g, '');

// Simple syntax highlighting
const highlightSyntax = (code: string, language: string, theme: SyntaxTheme): string => {
  let highlighted = code;

  // Escape HTML
  highlighted = highlighted
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Sanitize theme color values to prevent CSS injection
  const safeTheme = {
    keyword: sanitizeCSSValue(theme.keyword),
    string: sanitizeCSSValue(theme.string),
    number: sanitizeCSSValue(theme.number),
    comment: sanitizeCSSValue(theme.comment),
    function: sanitizeCSSValue(theme.function),
  };

  // Language-specific highlighting
  if (['javascript', 'typescript', 'jsx', 'tsx', 'js', 'ts'].includes(language)) {
    // Keywords
    highlighted = highlighted.replace(
      /\b(const|let|var|function|return|if|else|for|while|do|switch|case|break|continue|class|extends|import|export|default|from|async|await|try|catch|finally|throw|new|typeof|instanceof|in|of|this|super|static|get|set|constructor|render)\b/g,
      `<span style="color: ${safeTheme.keyword}">$1</span>`
    );

    // Strings
    highlighted = highlighted.replace(
      /(["'`])(?:(?=(\\?))\2.)*?\1/g,
      `<span style="color: ${safeTheme.string}">$&</span>`
    );

    // Numbers
    highlighted = highlighted.replace(
      /\b(\d+(\.\d+)?)\b/g,
      `<span style="color: ${safeTheme.number}">$1</span>`
    );

    // Comments
    highlighted = highlighted.replace(
      /(\/\/.*$|\/\*[\s\S]*?\*\/)/gm,
      `<span style="color: ${safeTheme.comment}">$1</span>`
    );

    // Functions
    highlighted = highlighted.replace(
      /\b([a-zA-Z_$][a-zA-Z0-9_$]*)\s*(?=\()/g,
      `<span style="color: ${safeTheme.function}">$1</span>`
    );
  }

  return highlighted;
};

export function CodeBlock({
  code,
  language = 'text',
  title,
  filename,
  showLineNumbers = true,
  highlightLines = [],
  startLineNumber = 1,
  maxHeight,
  wrap = false,
  copyable = true,
  downloadable = false,
  expandable = true,
  showLanguage = true,
  theme = 'dark',
  customTheme,
  onCopy,
  onDownload,
  onLineClick,
  className,
  style,
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [wrapText, setWrapText] = useState(wrap);
  
  const syntaxTheme = customTheme || THEMES[theme] || THEMES.dark;
  
  // Split code into lines
  const lines = useMemo(() => code.split('\n'), [code]);
  
  // Highlight syntax for each line
  const highlightedLines = useMemo(() => {
    return lines.map(line => highlightSyntax(line, language, syntaxTheme));
  }, [lines, language, syntaxTheme]);
  
  // Handle copy
  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(code).catch(() => {
      // Clipboard write may fail (e.g., permissions denied)
    });
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    if (onCopy) onCopy(code);
  }, [code, onCopy]);
  
  // Handle download
  const handleDownload = useCallback(() => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `code.${language}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    if (onDownload) onDownload(code, filename);
  }, [code, filename, language, onDownload]);
  
  // Container styles
  const containerStyles: React.CSSProperties = {
    backgroundColor: syntaxTheme.background,
    borderRadius: RADIUS.md,
    border: `1px solid ${COLORS.border.primary}`,
    overflow: 'hidden',
    ...style,
  };
  
  const codeStyles: React.CSSProperties = {
    fontFamily: 'Consolas, Monaco, "Courier New", monospace',
    fontSize: '13px',
    lineHeight: '1.5',
    color: syntaxTheme.text,
    padding: SPACING.lg,
    overflow: 'auto',
    whiteSpace: wrapText ? 'pre-wrap' : 'pre',
    wordBreak: wrapText ? 'break-word' : 'normal',
    maxHeight: expanded ? 'none' : maxHeight,
    minHeight: '60px',
  };
  
  return (
    <div className={className} style={containerStyles}>
      {/* Header */}
      {(title || filename || showLanguage || copyable || downloadable || expandable) && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: `${SPACING.sm} ${SPACING.lg}`,
          borderBottom: `1px solid ${COLORS.border.primary}`,
          backgroundColor: COLORS.background.secondary,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.lg }}>
            {title && (
              <span style={{
                fontWeight: TYPOGRAPHY.fontWeight.medium,
                color: COLORS.text.primary,
                fontSize: TYPOGRAPHY.fontSize.sm,
              }}>
                {title}
              </span>
            )}
            {filename && (
              <span style={{
                color: COLORS.text.filename,
                fontSize: TYPOGRAPHY.fontSize.xs,
              }}>
                {filename}
              </span>
            )}
            {showLanguage && (
              <span style={{
                color: COLORS.text.muted,
                fontSize: TYPOGRAPHY.fontSize.xs,
                textTransform: 'uppercase',
              }}>
                {language}
              </span>
            )}
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.sm }}>
            {/* Wrap text toggle */}
            <button
              onClick={() => setWrapText(!wrapText)}
              style={{
                background: 'transparent',
                border: 'none',
                color: wrapText ? COLORS.text.accent : COLORS.text.muted,
                cursor: 'pointer',
                padding: SPACING.xs,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: RADIUS.sm,
                transition: 'all 0.2s ease',
              }}
              title="Toggle text wrap"
            >
              <WrapText size={16} />
            </button>
            
            {/* Download button */}
            {downloadable && (
              <button
                onClick={handleDownload}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: COLORS.text.muted,
                  cursor: 'pointer',
                  padding: SPACING.xs,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: RADIUS.sm,
                  transition: 'all 0.2s ease',
                }}
                title="Download code"
              >
                <Download size={16} />
              </button>
            )}
            
            {/* Expand button */}
            {expandable && maxHeight && (
              <button
                onClick={() => setExpanded(!expanded)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: COLORS.text.muted,
                  cursor: 'pointer',
                  padding: SPACING.xs,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: RADIUS.sm,
                  transition: 'all 0.2s ease',
                }}
                title={expanded ? 'Collapse' : 'Expand'}
              >
                {expanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </button>
            )}
            
            {/* Copy button */}
            {copyable && (
              <button
                onClick={handleCopy}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: copied ? COLORS.status.success : COLORS.text.muted,
                  cursor: 'pointer',
                  padding: SPACING.xs,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: RADIUS.sm,
                  transition: 'all 0.2s ease',
                }}
                title="Copy code"
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
              </button>
            )}
          </div>
        </div>
      )}
      
      {/* Code content */}
      <div style={codeStyles}>
        <table style={{ borderSpacing: 0, width: '100%' }}>
          <tbody>
            {highlightedLines.map((line, index) => {
              const lineNumber = startLineNumber + index;
              const isHighlighted = highlightLines.includes(lineNumber);
              
              return (
                <tr
                  key={startLineNumber + index}
                  style={{
                    backgroundColor: isHighlighted ? syntaxTheme.lineHighlight : 'transparent',
                    cursor: onLineClick ? 'pointer' : 'default',
                  }}
                  onClick={() => onLineClick && onLineClick(lineNumber)}
                >
                  {showLineNumbers && (
                    <td
                      style={{
                        color: syntaxTheme.lineNumber,
                        paddingRight: SPACING.lg,
                        textAlign: 'right',
                        userSelect: 'none',
                        width: '1%',
                        minWidth: '40px',
                        verticalAlign: 'top',
                      }}
                    >
                      {lineNumber}
                    </td>
                  )}
                  <td
                    style={{ paddingLeft: showLineNumbers ? 0 : SPACING.lg }}
                    dangerouslySetInnerHTML={{ __html: line || '&nbsp;' }}
                  />
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}