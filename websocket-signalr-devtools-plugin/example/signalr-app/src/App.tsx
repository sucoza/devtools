import React, { useState, useEffect, useRef } from 'react';
import * as signalR from '@microsoft/signalr';
import { WebSocketSignalRDevToolsPanel } from '../../../src';

interface Message {
  id: string;
  text: string;
  timestamp: Date;
  type: 'sent' | 'received' | 'system';
  method?: string;
}

interface Connection {
  id: string;
  url: string;
  connection: signalR.HubConnection | null;
  status: 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error';
  messages: Message[];
}

const SIGNALR_URLS = [
  'https://localhost:5001/chathub',
  'https://localhost:5001/notificationhub',
  'http://localhost:5000/gamehub',
];

// Mock hub methods that might be available
const HUB_METHODS = [
  'SendMessage',
  'JoinGroup',
  'LeaveGroup',
  'SendNotification',
  'UpdateStatus',
  'BroadcastMessage',
  'ReceiveMessage',
  'UserJoined',
  'UserLeft',
];

function App() {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedUrl, setSelectedUrl] = useState(SIGNALR_URLS[0]);
  const [selectedMethod, setSelectedMethod] = useState(HUB_METHODS[0]);
  const [messageText, setMessageText] = useState('');
  const [methodArgs, setMethodArgs] = useState('["Hello", "World"]');
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

  const createConnection = async () => {
    const connectionId = `conn-${Date.now()}`;
    const connection: Connection = {
      id: connectionId,
      url: selectedUrl,
      connection: null,
      status: 'connecting',
      messages: [],
    };

    setConnections(prev => [...prev, connection]);

    try {
      const hubConnection = new signalR.HubConnectionBuilder()
        .withUrl(selectedUrl, {
          transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.ServerSentEvents,
          logMessageContent: true,
        })
        .withAutomaticReconnect({
          nextRetryDelayInMilliseconds: (retryContext) => {
            return Math.min(1000 * Math.pow(2, retryContext.previousRetryCount), 30000);
          }
        })
        .configureLogging(signalR.LogLevel.Debug)
        .build();

      // Update connection with SignalR instance
      setConnections(prev => prev.map(conn => 
        conn.id === connectionId 
          ? { ...conn, connection: hubConnection }
          : conn
      ));

      // Set up event handlers
      hubConnection.onclose((error) => {
        updateConnectionStatus(connectionId, 'disconnected');
        addMessage(connectionId, {
          id: `msg-${Date.now()}`,
          text: error ? `Connection closed with error: ${error.message}` : 'Connection closed',
          timestamp: new Date(),
          type: 'system',
        });
      });

      hubConnection.onreconnecting((error) => {
        updateConnectionStatus(connectionId, 'reconnecting');
        addMessage(connectionId, {
          id: `msg-${Date.now()}`,
          text: error ? `Reconnecting due to error: ${error.message}` : 'Reconnecting...',
          timestamp: new Date(),
          type: 'system',
        });
      });

      hubConnection.onreconnected((connectionIdString) => {
        updateConnectionStatus(connectionId, 'connected');
        addMessage(connectionId, {
          id: `msg-${Date.now()}`,
          text: `Reconnected with connection ID: ${connectionIdString}`,
          timestamp: new Date(),
          type: 'system',
        });
      });

      // Register handlers for common hub methods
      HUB_METHODS.forEach(methodName => {
        hubConnection.on(methodName, (...args) => {
          addMessage(connectionId, {
            id: `msg-${Date.now()}`,
            text: JSON.stringify(args),
            timestamp: new Date(),
            type: 'received',
            method: methodName,
          });
        });
      });

      // Start the connection
      await hubConnection.start();
      
      updateConnectionStatus(connectionId, 'connected');
      addMessage(connectionId, {
        id: `msg-${Date.now()}`,
        text: `Connected to ${selectedUrl}`,
        timestamp: new Date(),
        type: 'system',
      });

    } catch (error) {
      updateConnectionStatus(connectionId, 'error');
      addMessage(connectionId, {
        id: `msg-${Date.now()}`,
        text: `Failed to connect: ${error}`,
        timestamp: new Date(),
        type: 'system',
      });
    }
  };

  const closeConnection = async (connectionId: string) => {
    const connection = connections.find(c => c.id === connectionId);
    if (connection?.connection) {
      try {
        await connection.connection.stop();
      } catch (error) {
        addMessage(connectionId, {
          id: `msg-${Date.now()}`,
          text: `Error stopping connection: ${error}`,
          timestamp: new Date(),
          type: 'system',
        });
      }
    }
  };

  const sendMessage = async (connectionId: string, method: string, args: any[]) => {
    const connection = connections.find(c => c.id === connectionId);
    if (connection?.connection && connection.status === 'connected') {
      try {
        await connection.connection.invoke(method, ...args);
        addMessage(connectionId, {
          id: `msg-${Date.now()}`,
          text: JSON.stringify(args),
          timestamp: new Date(),
          type: 'sent',
          method,
        });
      } catch (error) {
        addMessage(connectionId, {
          id: `msg-${Date.now()}`,
          text: `Error invoking ${method}: ${error}`,
          timestamp: new Date(),
          type: 'system',
        });
      }
    }
  };

  const sendToAllConnections = async () => {
    if (!messageText.trim() && !methodArgs.trim()) return;
    
    let args: any[];
    try {
      args = methodArgs.trim() ? JSON.parse(methodArgs) : [messageText];
    } catch {
      args = [messageText];
    }

    for (const conn of connections) {
      if (conn.status === 'connected') {
        await sendMessage(conn.id, selectedMethod, args);
      }
    }
    
    setMessageText('');
  };

  const generateTestInvocations = async () => {
    const testData = [
      { method: 'SendMessage', args: ['user1', 'Hello from DevTools test!'] },
      { method: 'JoinGroup', args: ['test-group'] },
      { method: 'SendNotification', args: [{ type: 'info', message: 'Test notification', timestamp: Date.now() }] },
      { method: 'UpdateStatus', args: ['online', { lastSeen: new Date().toISOString() }] },
      { method: 'BroadcastMessage', args: [{ id: Math.random().toString(36), content: 'Broadcast test', priority: 'high' }] },
    ];

    for (const conn of connections) {
      if (conn.status === 'connected') {
        const randomData = testData[Math.floor(Math.random() * testData.length)];
        await sendMessage(conn.id, randomData.method, randomData.args);
      }
    }
  };

  const simulateStreamingData = async () => {
    for (const conn of connections) {
      if (conn.status === 'connected' && conn.connection) {
        try {
          // Simulate streaming invocation
          const stream = conn.connection.stream('GetRealtimeData', 'test-channel');
          
          // Simulate receiving stream data
          const streamSubscription = stream.subscribe({
            next: (data) => {
              addMessage(conn.id, {
                id: `msg-${Date.now()}`,
                text: JSON.stringify(data),
                timestamp: new Date(),
                type: 'received',
                method: 'GetRealtimeData (stream)',
              });
            },
            complete: () => {
              addMessage(conn.id, {
                id: `msg-${Date.now()}`,
                text: 'Stream completed',
                timestamp: new Date(),
                type: 'system',
              });
            },
            error: (error) => {
              addMessage(conn.id, {
                id: `msg-${Date.now()}`,
                text: `Stream error: ${error}`,
                timestamp: new Date(),
                type: 'system',
              });
            }
          });

          // Stop streaming after 5 seconds
          setTimeout(() => {
            streamSubscription.dispose();
          }, 5000);

        } catch (error) {
          addMessage(conn.id, {
            id: `msg-${Date.now()}`,
            text: `Error starting stream: ${error}`,
            timestamp: new Date(),
            type: 'system',
          });
        }
      }
    }
  };

  const simulateErrors = async () => {
    for (const conn of connections) {
      if (conn.status === 'connected') {
        try {
          // Invoke non-existent method to trigger error
          await sendMessage(conn.id, 'NonExistentMethod', ['test']);
        } catch {
          // Expected to fail
        }
      }
    }
  };

  // Auto-send functionality
  useEffect(() => {
    if (autoSendEnabled) {
      autoSendRef.current = setInterval(() => {
        generateTestInvocations();
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
      <h1>SignalR DevTools Example</h1>
      
      <div style={{ marginBottom: '20px', padding: '20px', background: 'white', borderRadius: '8px' }}>
        <h2>Connection Control</h2>
        
        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="url-select" style={{ display: 'block', marginBottom: '5px' }}>
            SignalR Hub URL:
          </label>
          <select 
            id="url-select"
            value={selectedUrl} 
            onChange={(e) => setSelectedUrl(e.target.value)}
            style={{ padding: '8px', width: '300px' }}
          >
            {SIGNALR_URLS.map(url => (
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
          <label htmlFor="method-select" style={{ display: 'block', marginBottom: '5px' }}>
            Hub Method:
          </label>
          <select 
            id="method-select"
            value={selectedMethod} 
            onChange={(e) => setSelectedMethod(e.target.value)}
            style={{ padding: '8px', width: '200px' }}
          >
            {HUB_METHODS.map(method => (
              <option key={method} value={method}>{method}</option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <input
            type="text"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder="Simple message..."
            style={{ padding: '8px', width: '200px', marginRight: '10px' }}
          />
          <input
            type="text"
            value={methodArgs}
            onChange={(e) => setMethodArgs(e.target.value)}
            placeholder='JSON args: ["arg1", "arg2"]'
            style={{ padding: '8px', width: '200px', marginRight: '10px' }}
          />
          <button 
            onClick={sendToAllConnections}
            style={{ padding: '8px 16px' }}
          >
            Invoke Method
          </button>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <button onClick={generateTestInvocations} style={{ marginRight: '10px', padding: '8px 16px' }}>
            Generate Test Calls
          </button>
          <button onClick={simulateStreamingData} style={{ marginRight: '10px', padding: '8px 16px' }}>
            Test Streaming
          </button>
          <button onClick={simulateErrors} style={{ marginRight: '10px', padding: '8px 16px' }}>
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
            Auto-invoke methods every
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
                 conn.status === 'reconnecting' ? '🔄' :
                 conn.status === 'error' ? '🔴' : '⚫'}
              </span>
              <span style={{ marginRight: '10px', fontFamily: 'monospace' }}>
                {conn.url}
              </span>
              <span style={{ marginRight: '10px' }}>
                ({conn.messages.length} messages)
              </span>
              <span style={{ marginRight: '10px', textTransform: 'capitalize' }}>
                {conn.status}
              </span>
              <button 
                onClick={() => closeConnection(conn.id)}
                style={{ padding: '4px 8px' }}
              >
                Disconnect
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