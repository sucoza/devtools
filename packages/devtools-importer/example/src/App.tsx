import React, { useState, useEffect } from 'react';
import { DevToolsManager } from '@sucoza/devtools-importer/react';

function App() {
  const [apiData, setApiData] = useState<any[]>([]);
  const [wsMessages, setWsMessages] = useState<string[]>([]);

  // Simulate API calls to demonstrate DevTools
  useEffect(() => {
    const interval = setInterval(() => {
      fetch(`https://jsonplaceholder.typicode.com/posts/${Math.floor(Math.random() * 10) + 1}`)
        .then(response => response.json())
        .then(data => {
          setApiData(prev => [data, ...prev.slice(0, 4)]);
        })
        .catch(error => console.error('API Error:', error));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // Simulate WebSocket messages
  useEffect(() => {
    const interval = setInterval(() => {
      const messages = ['Hello World!', 'User joined', 'New message', 'Status update', 'System alert'];
      const randomMessage = messages[Math.floor(Math.random() * messages.length)];
      setWsMessages(prev => [randomMessage, ...prev.slice(0, 9)]);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>DevTools Importer Example</h1>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div>
          <h2>API Data</h2>
          <div style={{ background: '#f5f5f5', padding: '10px', borderRadius: '8px' }}>
            {apiData.length === 0 ? (
              <p>Loading API data...</p>
            ) : (
              apiData.map((post, index) => (
                <div key={index} style={{ marginBottom: '10px', padding: '8px', background: 'white', borderRadius: '4px' }}>
                  <strong>{post.title}</strong>
                  <p style={{ margin: '5px 0', fontSize: '14px', color: '#666' }}>
                    {post.body.substring(0, 100)}...
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        <div>
          <h2>WebSocket Messages</h2>
          <div style={{ background: '#f5f5f5', padding: '10px', borderRadius: '8px' }}>
            {wsMessages.length === 0 ? (
              <p>Waiting for messages...</p>
            ) : (
              wsMessages.map((message, index) => (
                <div key={index} style={{ marginBottom: '5px', padding: '5px', background: 'white', borderRadius: '4px', fontSize: '14px' }}>
                  <span style={{ color: '#888', fontSize: '12px' }}>
                    {new Date().toLocaleTimeString()}
                  </span>
                  {' - '}
                  {message}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div style={{ marginTop: '20px', padding: '10px', background: '#e8f4f8', borderRadius: '8px' }}>
        <h3>DevTools Instructions</h3>
        <p>
          The DevTools button should appear in the bottom-right corner of your screen.
          Click it to open the DevTools panel and explore the API Mock Interceptor and WebSocket DevTools.
        </p>
        <ul>
          <li>📡 <strong>API Mock Interceptor</strong>: Monitor and mock the JSONPlaceholder API calls</li>
          <li>🔌 <strong>WebSocket DevTools</strong>: Track simulated WebSocket messages</li>
        </ul>
      </div>

      {/* DevTools Manager - position configured in vite.config.ts */}
      <DevToolsManager 
        onError={(error) => console.error('DevTools Error:', error)}
        onPluginLoad={(pluginId) => console.log('Loaded plugin:', pluginId)}
      />
    </div>
  );
}

export default App;