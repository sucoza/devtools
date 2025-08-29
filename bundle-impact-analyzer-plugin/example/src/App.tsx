import React, { useState, useEffect } from 'react';
// Import from the plugin - in a real scenario this would come from the npm package
import { BundleImpactAnalyzerPanel } from '../src';

// Import some dependencies to make the bundle more interesting
import _ from 'lodash';
import moment from 'moment';

function App() {
  const [data, setData] = useState<number[]>([]);

  useEffect(() => {
    // Use lodash to generate some data
    const newData = _.range(10).map(() => Math.random() * 100);
    setData(newData);
  }, []);

  const handleRefresh = () => {
    // Use more lodash functions to create bundle impact
    const shuffled = _.shuffle(data);
    const filtered = _.filter(shuffled, (n) => n > 50);
    const mapped = _.map(filtered, (n) => n * 2);
    setData(mapped);
  };

  const currentTime = moment().format('YYYY-MM-DD HH:mm:ss');

  // Dynamic import example
  const handleLoadChart = async () => {
    try {
      const chartModule = await import('chart.js');
      console.log('Chart.js loaded:', chartModule);
    } catch (error) {
      console.error('Failed to load Chart.js:', error);
    }
  };

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ 
        background: 'white', 
        borderRadius: '8px', 
        padding: '20px', 
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)' 
      }}>
        <h1>Bundle Impact Analyzer - Example App</h1>
        <p>This example app demonstrates the Bundle Impact Analyzer plugin for TanStack DevTools.</p>
        
        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
          <button onClick={handleRefresh}>
            Refresh Data (uses lodash)
          </button>
          <button onClick={handleLoadChart}>
            Load Chart.js (dynamic import)
          </button>
        </div>

        <div style={{ fontSize: '14px', color: '#666' }}>
          <p>Current time: {currentTime}</p>
          <p>Data points: {data.length}</p>
          <p>Data sample: {data.slice(0, 5).map(n => n.toFixed(1)).join(', ')}</p>
        </div>
      </div>

      <div style={{ 
        flex: 1, 
        background: 'white', 
        borderRadius: '8px', 
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        overflow: 'hidden'
      }}>
        <BundleImpactAnalyzerPanel 
          theme="light"
          onTabChange={(tab) => console.log('Tab changed to:', tab)}
          onEvent={(event) => console.log('Plugin event:', event)}
        />
      </div>
    </div>
  );
}

export default App;