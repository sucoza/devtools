import React, { useState, useEffect, useRef } from 'react';
import { WebSocketSignalRDevToolsPanel } from '../../../src';

interface Message {
  id: string;
  text: string;
  timestamp: Date;
  type: 'sent' | 'received' | 'system';
}

interface Connection {
  id: string;
  url: string;
  ws: WebSocket | null;
  status: 'disconnected' | 'connecting' | 'connected' | 'error';
  messages: Message[];
}

const WEBSOCKET_URLS = [
  'wss://echo.websocket.org',
  'wss://websocket-echo-server.herokuapp.com',
  'ws://localhost:8080',
];

function App() {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedUrl, setSelectedUrl] = useState(WEBSOCKET_URLS[0]);
  const [messageText, setMessageText] = useState('');
  const [autoSendEnabled, setAutoSendEnabled] = useState(false);
  const [autoSendInterval, setAutoSendInterval] = useState(5000);
  const autoSendRef = useRef<NodeJS.Timeout>();

  const addMessage = (connectionId: string, message: Message) => {
    setConnections(prev => prev.map(conn => 
      conn.id === connectionId 
        ? { ...conn, messages: [...conn.messages, message] }
        : conn
    ));
  };

  const updateConnectionStatus = (connectionId: string, status: Connection['status']) => {
    setConnections(prev => prev.map(conn => 
      conn.id === connectionId 
        ? { ...conn, status }
        : conn
    ));
  };

  const createConnection = () => {
    const connectionId = `conn-${Date.now()}`;
    const connection: Connection = {
      id: connectionId,
      url: selectedUrl,
      ws: null,
      status: 'connecting',
      messages: [],
    };

    setConnections(prev => [...prev, connection]);

    try {
      const ws = new WebSocket(selectedUrl);
      
      // Update connection with WebSocket instance
      setConnections(prev => prev.map(conn => 
        conn.id === connectionId 
          ? { ...conn, ws }
          : conn
      ));

      ws.addEventListener('open', () => {
        updateConnectionStatus(connectionId, 'connected');
        addMessage(connectionId, {
          id: `msg-${Date.now()}`,
          text: 'Connection established',
          timestamp: new Date(),
          type: 'system',
        });
      });

      ws.addEventListener('message', (event) => {
        addMessage(connectionId, {
          id: `msg-${Date.now()}`,
          text: event.data,
          timestamp: new Date(),
          type: 'received',
        });
      });

      ws.addEventListener('close', (event) => {
        updateConnectionStatus(connectionId, 'disconnected');
        addMessage(connectionId, {
          id: `msg-${Date.now()}`,
          text: `Connection closed (${event.code}: ${event.reason})`,
          timestamp: new Date(),
          type: 'system',
        });
      });

      ws.addEventListener('error', () => {
        updateConnectionStatus(connectionId, 'error');
        addMessage(connectionId, {
          id: `msg-${Date.now()}`,
          text: 'Connection error occurred',
          timestamp: new Date(),
          type: 'system',
        });
      });

    } catch (error) {
      updateConnectionStatus(connectionId, 'error');
      addMessage(connectionId, {
        id: `msg-${Date.now()}`,
        text: `Failed to create connection: ${error}`,
        timestamp: new Date(),
        type: 'system',
      });
    }
  };

  const closeConnection = (connectionId: string) => {
    const connection = connections.find(c => c.id === connectionId);
    if (connection?.ws) {
      connection.ws.close();
    }
  };

  const sendMessage = (connectionId: string, text: string) => {
    const connection = connections.find(c => c.id === connectionId);
    if (connection?.ws && connection.status === 'connected') {
      connection.ws.send(text);
      addMessage(connectionId, {
        id: `msg-${Date.now()}`,
        text,
        timestamp: new Date(),
        type: 'sent',
      });
    }
  };

  const sendToAllConnections = () => {
    if (!messageText.trim()) return;
    
    connections.forEach(conn => {
      if (conn.status === 'connected') {
        sendMessage(conn.id, messageText);
      }
    });
    
    setMessageText('');
  };

  const generateTestMessages = () => {
    const messages = [
      'Hello WebSocket!',
      '{"type": "test", "data": {"value": 123, "array": [1, 2, 3]}}',
      'Binary message test',
      '{"command": "ping", "timestamp": ' + Date.now() + '}',
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
    ];

    connections.forEach(conn => {
      if (conn.status === 'connected') {
        const randomMessage = messages[Math.floor(Math.random() * messages.length)];
        sendMessage(conn.id, randomMessage);
      }
    });
  };

  const simulateError = () => {
    connections.forEach(conn => {
      if (conn.ws) {
        // Force close with error code
        conn.ws.close(4000, 'Simulated error');
      }
    });
  };

  // Auto-send functionality
  useEffect(() => {
    if (autoSendEnabled) {
      autoSendRef.current = setInterval(() => {
        generateTestMessages();
      }, autoSendInterval);
    } else {
      if (autoSendRef.current) {
        clearInterval(autoSendRef.current);
      }
    }

    return () => {
      if (autoSendRef.current) {
        clearInterval(autoSendRef.current);
      }
    };
  }, [autoSendEnabled, autoSendInterval, connections]);

  return (
    <div className="container">
      <h1>WebSocket DevTools Example</h1>
      
      <div style={{ marginBottom: '20px', padding: '20px', background: 'white', borderRadius: '8px' }}>
        <h2>Connection Control</h2>
        
        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="url-select" style={{ display: 'block', marginBottom: '5px' }}>
            WebSocket URL:
          </label>
          <select 
            id="url-select"
            value={selectedUrl} 
            onChange={(e) => setSelectedUrl(e.target.value)}
            style={{ padding: '8px', width: '300px' }}
          >
            {WEBSOCKET_URLS.map(url => (
              <option key={url} value={url}>{url}</option>
            ))}
          </select>
          <button 
            onClick={createConnection}
            style={{ marginLeft: '10px', padding: '8px 16px' }}
          >
            Connect
          </button>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <input
            type="text"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder="Enter message to send..."
            style={{ padding: '8px', width: '300px' }}
            onKeyPress={(e) => e.key === 'Enter' && sendToAllConnections()}
          />
          <button 
            onClick={sendToAllConnections}
            style={{ marginLeft: '10px', padding: '8px 16px' }}
          >
            Send to All
          </button>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <button onClick={generateTestMessages} style={{ marginRight: '10px', padding: '8px 16px' }}>
            Generate Test Messages
          </button>
          <button onClick={simulateError} style={{ marginRight: '10px', padding: '8px 16px' }}>
            Simulate Errors
          </button>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'flex', alignItems: 'center' }}>
            <input
              type="checkbox"
              checked={autoSendEnabled}
              onChange={(e) => setAutoSendEnabled(e.target.checked)}
              style={{ marginRight: '8px' }}
            />
            Auto-send messages every
            <input
              type="number"
              value={autoSendInterval}
              onChange={(e) => setAutoSendInterval(parseInt(e.target.value))}
              style={{ margin: '0 8px', padding: '4px', width: '80px' }}
              min="1000"
              max="30000"
            />
            ms
          </label>
        </div>

        <div>
          <h3>Active Connections ({connections.length})</h3>
          {connections.map(conn => (
            <div key={conn.id} style={{ 
              display: 'flex', 
              alignItems: 'center', 
              marginBottom: '8px',
              padding: '8px',
              background: '#f8f9fa',
              borderRadius: '4px'
            }}>
              <span style={{ marginRight: '10px' }}>
                {conn.status === 'connected' ? '🟢' : 
                 conn.status === 'connecting' ? '🟡' : 
                 conn.status === 'error' ? '🔴' : '⚫'}
              </span>
              <span style={{ marginRight: '10px', fontFamily: 'monospace' }}>
                {conn.url}
              </span>
              <span style={{ marginRight: '10px' }}>
                ({conn.messages.length} messages)
              </span>
              <button 
                onClick={() => closeConnection(conn.id)}
                style={{ padding: '4px 8px' }}
              >
                Close
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="devtools-container">
        <WebSocketSignalRDevToolsPanel height={600} />
      </div>
    </div>
  );
}

export default App;