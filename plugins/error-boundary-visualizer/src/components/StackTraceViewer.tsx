import React, { useState, useMemo } from 'react'
import { Trans } from '@lingui/macro'
import { CodeBlock, Badge, Accordion, ScrollableContainer } from '@sucoza/shared-components'
import type { EnhancedStackFrame } from '../types'

interface StackTraceViewerProps {
  stack: string
  maxFrames?: number
}

export const StackTraceViewer: React.FC<StackTraceViewerProps> = ({ 
  stack, 
  maxFrames = 20 
}) => {
  const [showFullTrace, setShowFullTrace] = useState(false)

  const parsedFrames = useMemo(() => {
    return parseStackTrace(stack)
  }, [stack])

  const displayedFrames = showFullTrace 
    ? parsedFrames 
    : parsedFrames.slice(0, maxFrames)

  const handleSourceNavigation = (frame: EnhancedStackFrame) => {
    if (frame.fileName && frame.lineNumber) {
      // In a real implementation, this would open the source file
      console.log(`Navigate to source: ${frame.fileName}:${frame.lineNumber}:${frame.columnNumber}`)
    }
  }

  const frameToCode = (frame: EnhancedStackFrame): string => {
    let code = `at ${frame.functionName || '(anonymous)'}`
    
    if (frame.fileName) {
      code += ` (${frame.fileName}`
      if (frame.lineNumber) {
        code += `:${frame.lineNumber}`
        if (frame.columnNumber) {
          code += `:${frame.columnNumber}`
        }
      }
      code += ')'
    }

    return code
  }

  const frameAccordionItems = displayedFrames.map((frame, index) => ({
    id: `frame-${index}`,
    title: (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
        <span style={{ 
          fontFamily: 'monaco, consolas, monospace',
          fontSize: '12px',
          flex: 1 
        }}>
          {frame.functionName || '(anonymous)'}
        </span>
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          {frame.isNative && <Badge variant="info" size="sm">native</Badge>}
          {frame.isConstructor && <Badge variant="warning" size="sm">constructor</Badge>}
          {frame.isEval && <Badge variant="error" size="sm">eval</Badge>}
          {frame.fileName && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleSourceNavigation(frame)
              }}
              style={{
                background: 'none',
                border: '1px solid var(--color-border)',
                borderRadius: '4px',
                padding: '2px 6px',
                fontSize: '10px',
                cursor: 'pointer',
                color: 'var(--color-text-secondary)'
              }}
            >
              📂
            </button>
          )}
        </div>
      </div>
    ),
    content: (
      <div style={{ padding: '8px 0' }}>
        {/* File information */}
        {frame.fileName && (
          <div style={{
            marginBottom: '12px',
            fontSize: '12px',
            color: 'var(--color-text-secondary)'
          }}>
            <strong><Trans>File:</Trans></strong> {frame.fileName}
            {frame.lineNumber && (
              <span>
                :<span style={{ color: 'var(--color-accent)' }}>{frame.lineNumber}</span>
                {frame.columnNumber && 
                  <span>:<span style={{ color: 'var(--color-accent)' }}>{frame.columnNumber}</span></span>
                }
              </span>
            )}
          </div>
        )}

        {/* Source context if available */}
        {frame.sourceContext && frame.sourceContext.length > 0 && (
          <div>
            <div style={{
              marginBottom: '8px',
              fontSize: '12px',
              fontWeight: 'bold',
              color: 'var(--color-text-primary)'
            }}>
              <Trans>Source Context:</Trans>
            </div>
            <CodeBlock
              code={frame.sourceContext.map((line, lineIndex) => {
                const lineNumber = (frame.lineNumber || 0) - Math.floor(frame.sourceContext!.length / 2) + lineIndex
                const isCurrentLine = lineNumber === frame.lineNumber
                return `${lineNumber.toString().padStart(4, ' ')}${isCurrentLine ? '▶' : ' '} ${line}`
              }).join('\n')}
              language="javascript"
              showLineNumbers={false}
              maxHeight="200px"
            />
          </div>
        )}

        {/* Raw stack frame */}
        <div>
          <div style={{
            marginBottom: '8px',
            fontSize: '12px',
            fontWeight: 'bold',
            color: 'var(--color-text-primary)'
          }}>
            <Trans>Stack Frame:</Trans>
          </div>
          <CodeBlock
            code={frameToCode(frame)}
            language="text"
            showLineNumbers={false}
          />
        </div>
      </div>
    )
  }))

  return (
    <ScrollableContainer style={{ maxHeight: '400px' }}>
      <div style={{ padding: '8px 0' }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '12px',
          padding: '8px 0',
          borderBottom: '1px solid var(--color-border)'
        }}>
          <span style={{ fontWeight: 'bold', fontSize: '14px' }}>
            <Trans>Stack Trace ({parsedFrames.length} frames)</Trans>
          </span>
          {parsedFrames.length > maxFrames && (
            <button
              onClick={() => setShowFullTrace(!showFullTrace)}
              style={{
                background: 'none',
                border: '1px solid var(--color-border)',
                borderRadius: '4px',
                padding: '4px 8px',
                fontSize: '12px',
                cursor: 'pointer',
                color: 'var(--color-accent)'
              }}
            >
              {showFullTrace ? <Trans>Show less</Trans> : <Trans>Show all {parsedFrames.length} frames</Trans>}
            </button>
          )}
        </div>

        {/* Raw stack trace */}
        {displayedFrames.length > 0 && (
          <div style={{ marginBottom: '16px' }}>
            <div style={{
              marginBottom: '8px',
              fontSize: '12px',
              fontWeight: 'bold',
              color: 'var(--color-text-primary)'
            }}>
              <Trans>Raw Stack Trace:</Trans>
            </div>
            <CodeBlock
              code={stack}
              language="text"
              showLineNumbers={true}
              maxHeight="200px"
            />
          </div>
        )}

        {/* Parsed frames */}
        {displayedFrames.length > 0 && (
          <div>
            <div style={{
              marginBottom: '8px',
              fontSize: '12px',
              fontWeight: 'bold',
              color: 'var(--color-text-primary)'
            }}>
              <Trans>Parsed Frames:</Trans>
            </div>
            <Accordion 
              items={frameAccordionItems}
              multiple
            />
          </div>
        )}
      </div>
    </ScrollableContainer>
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