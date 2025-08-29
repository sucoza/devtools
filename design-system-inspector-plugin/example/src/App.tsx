import React, { useState } from 'react';
import { DesignSystemInspectorPanel } from '../../src';
import { ExampleComponents } from './components/ExampleComponents';

export function App() {
  const [showDevTools, setShowDevTools] = useState(false);

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      {/* Main Application */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        <header style={{
          background: 'var(--color-primary)',
          color: 'white',
          padding: 'var(--spacing-4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <h1 style={{
            fontSize: 'var(--font-size-2xl)',
            fontWeight: 'var(--font-weight-bold)',
            margin: 0
          }}>
            Design System Example
          </h1>
          <button
            onClick={() => setShowDevTools(!showDevTools)}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              color: 'white',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: 'var(--border-radius)',
              padding: 'var(--spacing-2) var(--spacing-4)',
              cursor: 'pointer',
              fontSize: 'var(--font-size-sm)',
              fontWeight: 'var(--font-weight-medium)'
            }}
          >
            {showDevTools ? 'Hide' : 'Show'} DevTools
          </button>
        </header>
        
        <main style={{ padding: 'var(--spacing-8)' }}>
          <ExampleComponents />
        </main>
      </div>
      
      {/* DevTools Panel */}
      {showDevTools && (
        <div style={{
          width: '800px',
          borderLeft: '1px solid var(--color-neutral-100)',
          background: 'white',
          flexShrink: 0
        }}>
          <DesignSystemInspectorPanel />
        </div>
      )}
    </div>
  );
}