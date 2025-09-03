import React, { useState, useMemo, useCallback, useRef } from 'react';
import { RenderWasteDetectorPanel, useRenderWasteDetector } from '@sucoza/render-waste-detector-devtools-plugin';

// Example components that demonstrate different render waste patterns

// Component with unnecessary re-renders due to object literal props
const ProblematicComponent = ({ data, style }: { data: any; style: any }) => {
  console.log('ProblematicComponent rendered');
  return (
    <div style={style}>
      <h3>Problematic Component</h3>
      <p>Data: {JSON.stringify(data)}</p>
      <p>This component re-renders when parent renders even if props haven't changed</p>
    </div>
  );
};

// Memoized version of the component
const MemoizedComponent = React.memo(({ data, style }: { data: any; style: any }) => {
  console.log('MemoizedComponent rendered');
  return (
    <div style={style}>
      <h3>Memoized Component</h3>
      <p>Data: {JSON.stringify(data)}</p>
      <p>This component only re-renders when props actually change</p>
    </div>
  );
});

// Component that triggers frequent state updates
const FrequentUpdater = () => {
  const [count, setCount] = useState(0);
  const [rapid, setRapid] = useState(0);
  
  // Expensive calculation without useMemo
  const expensiveValue = Array.from({ length: 1000 }, (_, i) => i * count).reduce((a, b) => a + b, 0);
  
  // Memoized expensive calculation
  const memoizedExpensiveValue = useMemo(() => {
    return Array.from({ length: 1000 }, (_, i) => i * count).reduce((a, b) => a + b, 0);
  }, [count]);

  const handleRapidUpdate = useCallback(() => {
    setRapid(prev => prev + 1);
  }, []);

  console.log('FrequentUpdater rendered');

  return (
    <div style={{ padding: '20px', border: '1px solid #ddd', margin: '10px', borderRadius: '8px' }}>
      <h3>Frequent Updater Component</h3>
      <div>
        <button onClick={() => setCount(count + 1)}>
          Count: {count}
        </button>
        <p>Expensive calculation result: {expensiveValue}</p>
        <p>Memoized calculation result: {memoizedExpensiveValue}</p>
      </div>
      <div>
        <button onClick={handleRapidUpdate}>
          Rapid updates: {rapid}
        </button>
        <button onClick={() => {
          // Trigger rapid updates to simulate render waste
          for (let i = 0; i < 5; i++) {
            setTimeout(() => setRapid(prev => prev + 1), i * 100);
          }
        }}>
          Trigger Rapid Updates
        </button>
      </div>
    </div>
  );
};

// Parent component that causes child re-renders
const ParentWithChildren = () => {
  const [parentState, setParentState] = useState(0);
  const [childData] = useState({ value: 'stable' });
  
  // This will cause unnecessary re-renders in children due to object literal
  const inlineStyle = { padding: '10px', backgroundColor: '#f0f0f0' };
  
  // Memoized style to prevent unnecessary re-renders
  const memoizedStyle = useMemo(() => ({
    padding: '10px',
    backgroundColor: '#e8f5e8'
  }), []);

  console.log('ParentWithChildren rendered');

  return (
    <div style={{ padding: '20px', border: '2px solid #333', margin: '10px', borderRadius: '8px' }}>
      <h2>Parent Component</h2>
      <button onClick={() => setParentState(parentState + 1)}>
        Update Parent State: {parentState}
      </button>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '20px' }}>
        {/* This will re-render unnecessarily due to inline style object */}
        <ProblematicComponent 
          data={childData} 
          style={inlineStyle}
        />
        
        {/* This will only re-render when props actually change */}
        <MemoizedComponent 
          data={childData} 
          style={memoizedStyle}
        />
      </div>
      
      <FrequentUpdater />
    </div>
  );
};

// Component with context that updates frequently
const ThemeContext = React.createContext({ theme: 'light', toggle: () => {} });

const ThemeConsumer = () => {
  const { theme } = React.useContext(ThemeContext);
  console.log('ThemeConsumer rendered');
  
  return (
    <div style={{ 
      padding: '10px', 
      backgroundColor: theme === 'light' ? '#fff' : '#333',
      color: theme === 'light' ? '#333' : '#fff',
      border: '1px solid #ccc',
      margin: '10px',
      borderRadius: '4px'
    }}>
      <h4>Theme Consumer</h4>
      <p>Current theme: {theme}</p>
    </div>
  );
};

const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setTheme] = useState('light');
  
  const contextValue = useMemo(() => ({
    theme,
    toggle: () => setTheme(theme === 'light' ? 'dark' : 'light')
  }), [theme]);

  return (
    <ThemeContext.Provider value={contextValue}>
      <div>
        <button onClick={contextValue.toggle} style={{ margin: '10px' }}>
          Toggle Theme ({theme})
        </button>
        {children}
      </div>
    </ThemeContext.Provider>
  );
};

// Main App component
const App = () => {
  const [showDevTools, setShowDevTools] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  
  // Use the render waste detector hook
  const {
    state,
    actions,
    componentCount,
    renderEventCount,
    suggestionCount,
  } = useRenderWasteDetector({
    onRenderEvent: (event) => {
      console.log('Render event:', event);
    },
    onSuggestion: (suggestion) => {
      console.log('Optimization suggestion:', suggestion);
    },
  });

  const handleStartRecording = useCallback(() => {
    actions.startRecording({
      trackAllComponents: true,
      enableSuggestions: true,
      enableHeatMap: true,
      minRenderThreshold: 1,
    });
    setIsRecording(true);
  }, [actions]);

  const handleStopRecording = useCallback(() => {
    actions.stopRecording();
    setIsRecording(false);
  }, [actions]);

  return (
    <div style={{ 
      display: 'flex', 
      height: '100vh',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* Main content area */}
      <div style={{ flex: 1, padding: '20px', overflow: 'auto' }}>
        <header style={{ 
          padding: '20px', 
          backgroundColor: '#007bff', 
          color: 'white', 
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <h1>Render Waste Detector - Demo Application</h1>
          <p>This demo showcases various React render patterns to test the render waste detector.</p>
          
          <div style={{ marginTop: '16px' }}>
            <button
              onClick={handleStartRecording}
              disabled={isRecording}
              style={{
                padding: '8px 16px',
                marginRight: '8px',
                backgroundColor: isRecording ? '#6c757d' : '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: isRecording ? 'not-allowed' : 'pointer'
              }}
            >
              {isRecording ? 'Recording...' : 'Start Recording'}
            </button>
            
            <button
              onClick={handleStopRecording}
              disabled={!isRecording}
              style={{
                padding: '8px 16px',
                marginRight: '8px',
                backgroundColor: !isRecording ? '#6c757d' : '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: !isRecording ? 'not-allowed' : 'pointer'
              }}
            >
              Stop Recording
            </button>

            <button
              onClick={() => setShowDevTools(!showDevTools)}
              style={{
                padding: '8px 16px',
                backgroundColor: '#17a2b8',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              {showDevTools ? 'Hide' : 'Show'} DevTools
            </button>
          </div>
          
          {isRecording && (
            <div style={{ marginTop: '12px', fontSize: '14px' }}>
              <div>📊 Components: {componentCount}</div>
              <div>🔄 Render Events: {renderEventCount}</div>
              <div>💡 Suggestions: {suggestionCount}</div>
            </div>
          )}
        </header>

        <main>
          <ThemeProvider>
            <div>
              <ThemeConsumer />
              <ThemeConsumer />
            </div>
          </ThemeProvider>
          
          <ParentWithChildren />
          
          <div style={{ 
            padding: '20px', 
            border: '1px dashed #007bff', 
            margin: '20px 0',
            borderRadius: '8px',
            backgroundColor: '#f8f9fa'
          }}>
            <h3>Instructions</h3>
            <ol>
              <li><strong>Start Recording:</strong> Click "Start Recording" to begin monitoring render events</li>
              <li><strong>Trigger Renders:</strong> Interact with the components above to generate render events</li>
              <li><strong>View Analysis:</strong> Use the DevTools panel on the right to analyze render patterns</li>
              <li><strong>Get Suggestions:</strong> Click "Analyze" in the DevTools to get optimization recommendations</li>
            </ol>
            
            <h4>Components to Test:</h4>
            <ul>
              <li><strong>Parent Component:</strong> Updates parent state to trigger child re-renders</li>
              <li><strong>Problematic Component:</strong> Re-renders unnecessarily due to inline props</li>
              <li><strong>Memoized Component:</strong> Optimized with React.memo</li>
              <li><strong>Frequent Updater:</strong> Demonstrates expensive calculations and rapid state updates</li>
              <li><strong>Theme Components:</strong> Shows context-based re-renders</li>
            </ul>
          </div>
        </main>
      </div>

      {/* DevTools panel */}
      {showDevTools && (
        <div style={{ 
          width: '600px', 
          borderLeft: '1px solid #ddd',
          backgroundColor: '#fff'
        }}>
          <RenderWasteDetectorPanel
            defaultTab="overview"
            onComponentSelect={(componentId) => {
              console.log('Selected component:', componentId);
            }}
            onSuggestionApply={(suggestion) => {
              console.log('Applied suggestion:', suggestion);
            }}
          />
        </div>
      )}
    </div>
  );
};

export default App;