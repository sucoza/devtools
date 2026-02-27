import { useState, useEffect, useCallback, useRef } from 'react';
import { DevToolsManager } from '@sucoza/devtools-importer/react';

// Mock WebSocket for demonstration
class MockWebSocket {
  url: string;
  readyState: number = 0;
  onopen: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;

  constructor(url: string) {
    this.url = url;
    setTimeout(() => {
      this.readyState = 1;
      if (this.onopen) {
        this.onopen(new Event('open'));
      }
      this.simulateMessages();
    }, 100);
  }

  simulateMessages() {
    const messages = [
      { type: 'greeting', data: 'Hello World!' },
      { type: 'user_joined', data: 'User joined' },
      { type: 'message', data: 'New message' },
      { type: 'status', data: 'Status update' },
      { type: 'notification', data: 'New notification' }
    ];

    const interval = setInterval(() => {
      if (this.readyState === 1 && this.onmessage) {
        const randomMessage = messages[Math.floor(Math.random() * messages.length)];
        this.onmessage(new MessageEvent('message', { 
          data: JSON.stringify(randomMessage) 
        }));
      }
    }, 3000);

    // Store interval for cleanup
    (window as any).__wsInterval = interval;
  }

  send(data: string) {
    console.log('[WebSocket] Sending:', data);
  }

  close() {
    this.readyState = 3;
    if ((window as any).__wsInterval) {
      clearInterval((window as any).__wsInterval);
    }
    if (this.onclose) {
      this.onclose(new CloseEvent('close'));
    }
  }
}

// Override global WebSocket with our mock
(window as any).WebSocket = MockWebSocket;

interface Post {
  id: number;
  title: string;
  body: string;
  userId: number;
}

interface Todo {
  id: number;
  title: string;
  completed: boolean;
  userId: number;
}

function App() {
  const [apiData, setApiData] = useState<Post[]>([]);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [wsMessages, setWsMessages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const wsRef = useRef<MockWebSocket | null>(null);

  // Load API data with different endpoints
  const loadPosts = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('https://jsonplaceholder.typicode.com/posts?_limit=5');
      const data = await response.json();
      setApiData(data);
    } catch (error) {
      console.error('API Error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadTodos = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('https://jsonplaceholder.typicode.com/todos?_limit=5');
      const data = await response.json();
      setTodos(data);
    } catch (error) {
      console.error('API Error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Create a new post
  const createPost = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('https://jsonplaceholder.typicode.com/posts', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Test Post',
          body: 'This is a test post from DevTools demo',
          userId: 1
        }),
        headers: {
          'Content-type': 'application/json; charset=UTF-8',
        },
      });
      const data = await response.json();
      console.log('Created post:', data);
      alert('Post created! Check the API Mock Interceptor.');
    } catch (error) {
      console.error('API Error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // WebSocket connection management
  const connectWebSocket = useCallback(() => {
    if (wsRef.current?.readyState === 1) {
      console.log('WebSocket already connected');
      return;
    }

    const ws = new MockWebSocket('wss://demo.websocket.org') as any;
    
    ws.onopen = () => {
      console.log('WebSocket connected');
      setWsConnected(true);
      setWsMessages(prev => [`${new Date().toLocaleTimeString()} - Connected`, ...prev.slice(0, 9)]);
    };

    ws.onmessage = (event: MessageEvent) => {
      try {
        const message = JSON.parse(event.data);
        setWsMessages(prev => [`${new Date().toLocaleTimeString()} - ${message.type}: ${message.data}`, ...prev.slice(0, 9)]);
      } catch {
        setWsMessages(prev => [`${new Date().toLocaleTimeString()} - ${event.data}`, ...prev.slice(0, 9)]);
      }
    };

    ws.onerror = (error: Event) => {
      console.error('WebSocket error:', error);
      setWsMessages(prev => [`${new Date().toLocaleTimeString()} - Error occurred`, ...prev.slice(0, 9)]);
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setWsConnected(false);
      setWsMessages(prev => [`${new Date().toLocaleTimeString()} - Disconnected`, ...prev.slice(0, 9)]);
    };

    wsRef.current = ws;
  }, []);

  const disconnectWebSocket = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  const sendWebSocketMessage = useCallback(() => {
    if (wsRef.current?.readyState === 1) {
      const message = JSON.stringify({
        type: 'user_message',
        data: `Test message at ${new Date().toLocaleTimeString()}`
      });
      wsRef.current.send(message);
      setWsMessages(prev => [`${new Date().toLocaleTimeString()} - Sent: user_message`, ...prev.slice(0, 9)]);
    }
  }, []);

  // Load initial data
  useEffect(() => {
    loadPosts();
    loadTodos();
  }, [loadPosts, loadTodos]);

  // Auto-connect WebSocket
  useEffect(() => {
    connectWebSocket();
    return () => {
      disconnectWebSocket();
    };
  }, [connectWebSocket, disconnectWebSocket]);

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>🚀 DevTools Plugin Playground</h1>
      <p style={{ color: '#666', marginBottom: '20px' }}>Test all DevTools plugins with interactive examples</p>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* API Mock Interceptor Demo */}
        <div>
          <h2>📡 API Mock Interceptor</h2>
          <div style={{ marginBottom: '10px', display: 'flex', gap: '10px' }}>
            <button 
              onClick={loadPosts} 
              disabled={loading}
              style={{ padding: '8px 16px', borderRadius: '4px', border: '1px solid #ddd', cursor: loading ? 'not-allowed' : 'pointer' }}
            >
              {loading ? 'Loading...' : 'Fetch Posts'}
            </button>
            <button 
              onClick={loadTodos}
              disabled={loading}
              style={{ padding: '8px 16px', borderRadius: '4px', border: '1px solid #ddd', cursor: loading ? 'not-allowed' : 'pointer' }}
            >
              Fetch Todos
            </button>
            <button 
              onClick={createPost}
              disabled={loading}
              style={{ padding: '8px 16px', borderRadius: '4px', border: '1px solid #ddd', cursor: loading ? 'not-allowed' : 'pointer' }}
            >
              Create Post
            </button>
          </div>
          
          <div style={{ background: '#f5f5f5', padding: '10px', borderRadius: '8px', maxHeight: '400px', overflow: 'auto' }}>
            <h3 style={{ margin: '0 0 10px 0' }}>Posts ({apiData.length})</h3>
            {apiData.length === 0 ? (
              <p>No posts loaded. Click "Fetch Posts" to load data.</p>
            ) : (
              apiData.map((post) => (
                <div key={post.id} style={{ marginBottom: '10px', padding: '8px', background: 'white', borderRadius: '4px' }}>
                  <strong>{post.title}</strong>
                  <p style={{ margin: '5px 0', fontSize: '14px', color: '#666' }}>
                    {post.body.substring(0, 100)}...
                  </p>
                </div>
              ))
            )}
            
            <h3 style={{ margin: '20px 0 10px 0' }}>Todos ({todos.length})</h3>
            {todos.length === 0 ? (
              <p>No todos loaded. Click "Fetch Todos" to load data.</p>
            ) : (
              todos.map((todo) => (
                <div key={todo.id} style={{ marginBottom: '5px', padding: '5px', background: 'white', borderRadius: '4px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input type="checkbox" checked={todo.completed} readOnly />
                    <span style={{ textDecoration: todo.completed ? 'line-through' : 'none' }}>
                      {todo.title}
                    </span>
                  </label>
                </div>
              ))
            )}
          </div>
        </div>

        {/* WebSocket DevTools Demo */}
        <div>
          <h2>🔌 WebSocket & SignalR</h2>
          <div style={{ marginBottom: '10px' }}>
            <div style={{ marginBottom: '10px', padding: '5px 10px', background: wsConnected ? '#d4f4dd' : '#fdd', borderRadius: '4px', display: 'inline-block' }}>
              Status: {wsConnected ? '🟢 Connected' : '🔴 Disconnected'}
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                onClick={connectWebSocket}
                disabled={wsConnected}
                style={{ padding: '8px 16px', borderRadius: '4px', border: '1px solid #ddd', cursor: wsConnected ? 'not-allowed' : 'pointer' }}
              >
                Connect
              </button>
              <button 
                onClick={disconnectWebSocket}
                disabled={!wsConnected}
                style={{ padding: '8px 16px', borderRadius: '4px', border: '1px solid #ddd', cursor: !wsConnected ? 'not-allowed' : 'pointer' }}
              >
                Disconnect
              </button>
              <button 
                onClick={sendWebSocketMessage}
                disabled={!wsConnected}
                style={{ padding: '8px 16px', borderRadius: '4px', border: '1px solid #ddd', cursor: !wsConnected ? 'not-allowed' : 'pointer' }}
              >
                Send Message
              </button>
            </div>
          </div>
          
          <div style={{ background: '#f5f5f5', padding: '10px', borderRadius: '8px', maxHeight: '400px', overflow: 'auto' }}>
            <h3 style={{ margin: '0 0 10px 0' }}>Messages ({wsMessages.length})</h3>
            {wsMessages.length === 0 ? (
              <p>No messages yet. Connect to see real-time messages.</p>
            ) : (
              wsMessages.map((message, index) => (
                <div key={index} style={{ marginBottom: '5px', padding: '5px', background: 'white', borderRadius: '4px', fontSize: '14px' }}>
                  {message}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div style={{ marginTop: '20px', padding: '15px', background: '#e8f4f8', borderRadius: '8px' }}>
        <h3>📚 DevTools Instructions</h3>
        <p>
          Press <kbd style={{ padding: '2px 6px', background: '#fff', borderRadius: '3px', border: '1px solid #ccc' }}>Ctrl</kbd> + 
          <kbd style={{ padding: '2px 6px', background: '#fff', borderRadius: '3px', border: '1px solid #ccc', margin: '0 4px' }}>Shift</kbd> + 
          <kbd style={{ padding: '2px 6px', background: '#fff', borderRadius: '3px', border: '1px solid #ccc', margin: '0 4px' }}>Alt</kbd> + 
          <kbd style={{ padding: '2px 6px', background: '#fff', borderRadius: '3px', border: '1px solid #ccc', marginLeft: '4px' }}>D</kbd> 
          {' '}to open the DevTools panel
        </p>
        
        <h4>Available Plugins:</h4>
        <ul>
          <li>📡 <strong>API Mock Interceptor</strong>: Monitor and mock API calls</li>
          <li>🔌 <strong>WebSocket/SignalR</strong>: Track real-time connections</li>
        </ul>
        
        <h4>Try these actions:</h4>
        <ul>
          <li>Click "Fetch Posts" or "Fetch Todos" to see API calls in the interceptor</li>
          <li>Click "Create Post" to see a POST request</li>
          <li>Connect WebSocket to see real-time message tracking</li>
          <li>Send messages through WebSocket to see them in the DevTools</li>
        </ul>
      </div>

      {/* DevTools Manager - position configured in vite.config.ts */}
      <DevToolsManager 
        onError={(error: Error) => console.error('DevTools Error:', error)}
        onPluginLoad={(pluginId: string) => console.log('Loaded plugin:', pluginId)}
      />
    </div>
  );
}

export default App;