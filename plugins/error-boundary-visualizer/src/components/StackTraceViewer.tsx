import React, { useState, useMemo } from 'react'
import { useErrorBoundaryDevTools } from '../core/store'
import type { EnhancedStackFrame } from '../types'

interface StackTraceViewerProps {
  stack: string
  maxFrames?: number
}

export const StackTraceViewer: React.FC<StackTraceViewerProps> = ({ 
  stack, 
  maxFrames = 20 
}) => {
  const { config } = useErrorBoundaryDevTools()
  const [expandedFrames, setExpandedFrames] = useState<Set<number>>(new Set())
  const [showFullTrace, setShowFullTrace] = useState(false)

  const theme = config.theme === 'auto' 
    ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : config.theme

  const parsedFrames = useMemo(() => {
    return parseStackTrace(stack)
  }, [stack])

  const displayedFrames = showFullTrace 
    ? parsedFrames 
    : parsedFrames.slice(0, maxFrames)

  const toggleFrameExpansion = (index: number) => {
    const newExpanded = new Set(expandedFrames)
    if (newExpanded.has(index)) {
      newExpanded.delete(index)
    } else {
      newExpanded.add(index)
    }
    setExpandedFrames(newExpanded)
  }

  const handleSourceNavigation = (frame: EnhancedStackFrame) => {
    if (frame.fileName && frame.lineNumber) {
      // In a real implementation, this would open the source file
      // Navigate to source: ${frame.fileName}:${frame.lineNumber}:${frame.columnNumber}
    }
  }

  const containerStyles: React.CSSProperties = {
    marginTop: '8px',
    border: `1px solid ${theme === 'dark' ? '#444' : '#ccc'}`,
    borderRadius: '4px',
    backgroundColor: theme === 'dark' ? '#1a1a1a' : '#ffffff',
    fontFamily: 'monaco, consolas, monospace',
    fontSize: '12px',
    overflow: 'hidden',
  }

  const headerStyles: React.CSSProperties = {
    padding: '8px 12px',
    backgroundColor: theme === 'dark' ? '#2d2d2d' : '#f8f9fa',
    borderBottom: `1px solid ${theme === 'dark' ? '#444' : '#ccc'}`,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  }

  const frameStyles = (frame: EnhancedStackFrame, index: number): React.CSSProperties => ({
    padding: '6px 12px',
    borderBottom: index < displayedFrames.length - 1 
      ? `1px solid ${theme === 'dark' ? '#333' : '#eee'}` 
      : 'none',
    backgroundColor: frame.isNative 
      ? (theme === 'dark' ? '#2a1a1a' : '#fff8f0')
      : 'transparent',
    cursor: frame.fileName ? 'pointer' : 'default',
    transition: 'background-color 0.2s',
  })

  const functionNameStyles: React.CSSProperties = {
    color: theme === 'dark' ? '#79c0ff' : '#0366d6',
    fontWeight: 'bold',
  }

  const fileNameStyles: React.CSSProperties = {
    color: theme === 'dark' ? '#f85149' : '#d73a49',
  }

  const locationStyles: React.CSSProperties = {
    color: theme === 'dark' ? '#ffa657' : '#e36209',
  }

  const sourceContextStyles: React.CSSProperties = {
    marginTop: '8px',
    padding: '8px',
    backgroundColor: theme === 'dark' ? '#0d1117' : '#f6f8fa',
    borderRadius: '4px',
    fontSize: '11px',
    overflow: 'auto',
  }

  const lineNumberStyles: React.CSSProperties = {
    color: theme === 'dark' ? '#7d8590' : '#656d76',
    marginRight: '12px',
    width: '40px',
    display: 'inline-block',
    textAlign: 'right',
  }

  const currentLineStyles: React.CSSProperties = {
    backgroundColor: theme === 'dark' ? '#3d1a00' : '#fff8f0',
    fontWeight: 'bold',
  }

  const toggleButtonStyles: React.CSSProperties = {
    background: 'none',
    border: 'none',
    color: theme === 'dark' ? '#58a6ff' : '#0366d6',
    cursor: 'pointer',
    fontSize: '12px',
    textDecoration: 'underline',
  }

  const badgeStyles = (_type: string): React.CSSProperties => ({
    display: 'inline-block',
    padding: '2px 6px',
    borderRadius: '10px',
    fontSize: '10px',
    fontWeight: 'bold',
    marginLeft: '8px',
    backgroundColor: theme === 'dark' ? '#444' : '#f0f0f0',
    color: theme === 'dark' ? '#fff' : '#666',
  })

  return (
    <div style={containerStyles}>
      <div style={headerStyles}>
        <span style={{ fontWeight: 'bold', color: theme === 'dark' ? '#ffffff' : '#333333' }}>
          Stack Trace ({parsedFrames.length} frames)
        </span>
        {parsedFrames.length > maxFrames && (
          <button 
            style={toggleButtonStyles}
            onClick={() => setShowFullTrace(!showFullTrace)}
          >
            {showFullTrace ? 'Show less' : `Show all ${parsedFrames.length} frames`}
          </button>
        )}
      </div>

      <div>
        {displayedFrames.map((frame, index) => (
          <div key={index}>
            <div
              style={frameStyles(frame, index)}
              onClick={() => handleSourceNavigation(frame)}
              onMouseEnter={(e) => {
                if (frame.fileName) {
                  e.currentTarget.style.backgroundColor = theme === 'dark' ? '#2d2d2d' : '#f8f9fa'
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = frame.isNative 
                  ? (theme === 'dark' ? '#2a1a1a' : '#fff8f0')
                  : 'transparent'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={functionNameStyles}>
                  {frame.functionName || '(anonymous)'}
                </span>
                {frame.isNative && <span style={badgeStyles('native')}>native</span>}
                {frame.isConstructor && <span style={badgeStyles('constructor')}>constructor</span>}
                {frame.isEval && <span style={badgeStyles('eval')}>eval</span>}
              </div>
              
              {frame.fileName && (
                <div style={{ marginTop: '2px', fontSize: '11px' }}>
                  <span style={fileNameStyles}>{frame.fileName}</span>
                  {frame.lineNumber && (
                    <span style={locationStyles}>
                      :{frame.lineNumber}
                      {frame.columnNumber && `:${frame.columnNumber}`}
                    </span>
                  )}
                </div>
              )}

              {frame.sourceContext && frame.sourceContext.length > 0 && (
                <div style={{ marginTop: '4px' }}>
                  <button
                    style={toggleButtonStyles}
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleFrameExpansion(index)
                    }}
                  >
                    {expandedFrames.has(index) ? 'Hide source' : 'Show source context'}
                  </button>
                </div>
              )}
            </div>

            {expandedFrames.has(index) && frame.sourceContext && (
              <div style={sourceContextStyles}>
                {frame.sourceContext.map((line, lineIndex) => {
                  const lineNumber = (frame.lineNumber || 0) - Math.floor(frame.sourceContext!.length / 2) + lineIndex
                  const isCurrentLine = lineNumber === frame.lineNumber
                  
                  return (
                    <div
                      key={lineIndex}
                      style={isCurrentLine ? currentLineStyles : {}}
                    >
                      <span style={lineNumberStyles}>{lineNumber}</span>
                      <span style={{ color: theme === 'dark' ? '#e6edf3' : '#24292f' }}>
                        {line}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// Stack trace parsing utility
function parseStackTrace(stack: string): EnhancedStackFrame[] {
  const lines = stack.split('\n').filter(line => line.trim())
  const frames: EnhancedStackFrame[] = []

  for (const line of lines) {
    const frame = parseStackFrame(line.trim())
    if (frame) {
      frames.push(frame)
    }
  }

  return frames
}

function parseStackFrame(line: string): EnhancedStackFrame | null {
  // Remove leading "at " if present
  const cleanLine = line.replace(/^\s*at\s+/, '')
  
  // Check for different stack trace formats
  let match: RegExpMatchArray | null

  // Format: "functionName (file:line:column)"
  match = cleanLine.match(/^(.+?)\s+\((.+?):(\d+):(\d+)\)$/)
  if (match) {
    return {
      functionName: match[1],
      fileName: match[2],
      lineNumber: parseInt(match[3], 10),
      columnNumber: parseInt(match[4], 10),
      isNative: false,
      isEval: false,
      isConstructor: match[1].includes('new '),
    }
  }

  // Format: "file:line:column"
  match = cleanLine.match(/^(.+?):(\d+):(\d+)$/)
  if (match) {
    return {
      fileName: match[1],
      lineNumber: parseInt(match[2], 10),
      columnNumber: parseInt(match[3], 10),
      isNative: false,
      isEval: false,
      isConstructor: false,
    }
  }

  // Format: "functionName"
  if (cleanLine && !cleanLine.includes('(') && !cleanLine.includes(':')) {
    return {
      functionName: cleanLine,
      isNative: cleanLine.includes('[native code]') || cleanLine.includes('<anonymous>'),
      isEval: cleanLine.includes('eval'),
      isConstructor: cleanLine.includes('new '),
    }
  }

  // Native code format
  if (cleanLine.includes('[native code]')) {
    return {
      functionName: cleanLine.replace(/\s*\[native code\].*/, ''),
      isNative: true,
      isEval: false,
      isConstructor: false,
    }
  }

  // Fallback: treat as function name
  if (cleanLine) {
    return {
      functionName: cleanLine,
      isNative: false,
      isEval: cleanLine.includes('eval'),
      isConstructor: cleanLine.includes('new '),
    }
  }

  return null
}