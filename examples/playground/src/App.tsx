import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { create } from 'zustand'
import { BrowserRouter, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom'
import './App.css'
import './setup-plugins'
import { createDevToolsStore } from "@sucoza/zustand-devtools-plugin";
import { useRouterDevTools } from '@sucoza/router-devtools-plugin';
import { ErrorBoundaryWrapper } from '@sucoza/error-boundary-visualizer-devtools-plugin';
import { logger } from '@sucoza/logger-devtools-plugin';

// ============================================================================
// ZUSTAND STORE (for Zustand DevTools)
// ============================================================================
interface AppState {
  count: number
  user: { name: string; email: string } | null
  theme: 'light' | 'dark'
  notifications: string[]
  increment: () => void
  decrement: () => void
  setUser: (user: { name: string; email: string } | null) => void
  setTheme: (theme: 'light' | 'dark') => void
  addNotification: (message: string) => void
  clearNotifications: () => void
}

const useAppStore = createDevToolsStore(
  "app",
  () => create<AppState>((set) => ({
    count: 0,
    user: null,
    theme: 'light',
    notifications: [],
    increment: () => set((state) => ({ count: state.count + 1 })),
    decrement: () => set((state) => ({ count: state.count - 1 })),
    setUser: (user) => set({ user }),
    setTheme: (theme) => set({ theme }),
    addNotification: (message) => set((state) => ({
      notifications: [...state.notifications, message]
    })),
    clearNotifications: () => set({ notifications: [] }),
  })));

// ============================================================================
// MOCK WEBSOCKET (for WebSocket/SignalR DevTools)
// ============================================================================
class MockWebSocket {
  url: string
  readyState: number = 0
  onopen: ((event: Event) => void) | null = null
  onmessage: ((event: MessageEvent) => void) | null = null
  onerror: ((event: Event) => void) | null = null
  onclose: ((event: CloseEvent) => void) | null = null
  private interval: NodeJS.Timeout | null = null

  constructor(url: string) {
    this.url = url
    setTimeout(() => {
      this.readyState = 1
      if (this.onopen) {
        this.onopen(new Event('open'))
      }
      this.simulateMessages()
    }, 100)
  }

  simulateMessages() {
    const messages = [
      { type: 'chat', data: 'Hello from WebSocket!' },
      { type: 'notification', data: 'New notification received' },
      { type: 'update', data: { timestamp: Date.now(), value: Math.random() } },
      { type: 'ping', data: 'Ping from server' },
    ]

    this.interval = setInterval(() => {
      if (this.readyState === 1 && this.onmessage) {
        const randomMessage = messages[Math.floor(Math.random() * messages.length)]
        this.onmessage(new MessageEvent('message', {
          data: JSON.stringify(randomMessage)
        }))
      }
    }, 3000)
  }

  send(data: string) {
    console.log('[WebSocket] Sending:', data)
  }

  close() {
    this.readyState = 3
    if (this.interval) {
      clearInterval(this.interval)
    }
    if (this.onclose) {
      this.onclose(new CloseEvent('close'))
    }
  }
}

// Override global WebSocket
(window as any).WebSocket = MockWebSocket

// ============================================================================
// ERROR BOUNDARY (for Error Boundary Visualizer)
// ============================================================================
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', background: '#fee', borderRadius: '8px' }}>
          <h2>Error Caught!</h2>
          <p>{this.state.error?.message}</p>
          <button onClick={() => this.setState({ hasError: false, error: null })}>
            Reset
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

// ============================================================================
// COMPONENTS FOR DIFFERENT DEMOS
// ============================================================================

// Component with intentional performance issues (for Render Waste Detector)
function ExpensiveComponent({ value }: { value: number }) {
  // Intentionally expensive computation
  const expensiveValue = useMemo(() => {
    let result = 0
    for (let i = 0; i < 1000000; i++) {
      result += Math.sqrt(i)
    }
    return result
  }, []) // Missing dependency to show in devtools

  return (
    <div style={{ padding: '10px', background: '#f0f0f0', borderRadius: '4px' }}>
      <h4>Expensive Component</h4>
      <p>Value: {value}</p>
      <p>Computed: {expensiveValue.toFixed(2)}</p>
    </div>
  )
}

// Component that can throw errors
function ErrorProneComponent({ shouldError }: { shouldError: boolean }) {
  if (shouldError) {
    throw new Error('Intentional error for testing Error Boundary Visualizer!')
  }
  return <div>Component is working fine</div>
}

// ============================================================================
// ROUTE COMPONENTS (for Router DevTools)
// ============================================================================
function Home() {
  return (
    <div>
      <h2>Home Page</h2>
      <p>Welcome to the DevTools Playground!</p>
    </div>
  )
}

function Dashboard() {
  const location = useLocation()
  return (
    <div>
      <h2>Dashboard</h2>
      <p>Current path: {location.pathname}</p>
    </div>
  )
}

function Settings() {
  return (
    <div>
      <h2>Settings</h2>
      <p>Configure your preferences here</p>
    </div>
  )
}

// ============================================================================
// MAIN APP COMPONENT
// ============================================================================
function AppContent() {
  // Zustand store
  const store = useAppStore()

  useRouterDevTools();
  
  // Local state
  const [wsConnected, setWsConnected] = useState(false)
  const [wsMessages, setWsMessages] = useState<string[]>([])
  const [shouldError, setShouldError] = useState(false)
  const [renderCount, setRenderCount] = useState(0)
  const [apiData, setApiData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [memoryIntensive, setMemoryIntensive] = useState(false)

  const wsRef = useRef<MockWebSocket | null>(null)
  const navigate = useNavigate()

  // Logger examples
  useEffect(() => {
    console.log('App mounted')
    console.info('Info: DevTools Playground is ready')
    console.warn('Warning: This is a demo application')
    console.debug('Debug: All plugins loaded')

    return () => {
      console.log('App unmounting')
    }
  }, [])

  // API calls (for API monitoring)
  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch('https://jsonplaceholder.typicode.com/posts?_limit=5')
      const data = await response.json()
      setApiData(data)
      console.log('Fetched data:', data)
    } catch (error) {
      console.error('API Error:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  // WebSocket management with DevTools integration
  const connectWebSocket = useCallback(() => {
    if (wsRef.current?.readyState === 1) return

    // Use the logger for WebSocket events
    const wsLogger = (window as any).__wsLogger || logger.child({ category: 'WebSocket' });

    const ws = new MockWebSocket('wss://demo.websocket.org') as any

    ws.onopen = () => {
      setWsConnected(true)
      setWsMessages(prev => ['Connected to WebSocket', ...prev.slice(0, 9)])
      wsLogger.info('WebSocket connected', { url: 'wss://demo.websocket.org' })
    }

    ws.onmessage = (event: MessageEvent) => {
      const message = JSON.parse(event.data)
      setWsMessages(prev => [`${message.type}: ${JSON.stringify(message.data)}`, ...prev.slice(0, 9)])
      wsLogger.debug('WebSocket message received', { type: message.type, data: message.data })
    }

    ws.onclose = () => {
      setWsConnected(false)
      setWsMessages(prev => ['Disconnected from WebSocket', ...prev.slice(0, 9)])
      wsLogger.info('WebSocket disconnected', { url: 'wss://demo.websocket.org' })
    }

    wsRef.current = ws
  }, [])

  const disconnectWebSocket = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
  }, [])

  // Memory intensive operation (for Memory Performance Profiler)
  const runMemoryIntensiveTask = useCallback(() => {
    setMemoryIntensive(true)

    // Create large arrays to show in memory profiler
    const largeArray = new Array(1000000).fill(0).map((_, i) => ({
      id: i,
      value: Math.random(),
      data: `Item ${i}`
    }))

    // Simulate processing
    setTimeout(() => {
      console.log('Processed', largeArray.length, 'items')
      setMemoryIntensive(false)
    }, 2000)
  }, [])

  // Auto-connect WebSocket
  useEffect(() => {
    connectWebSocket()
    return () => disconnectWebSocket()
  }, [connectWebSocket, disconnectWebSocket])

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      <h1>🚀 TanStack DevTools Playground</h1>
      <p>A comprehensive demo of all DevTools plugins. Press <kbd>Ctrl+Shift+Alt+D</kbd> to open DevTools.</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px', marginTop: '20px' }}>

        {/* Zustand Store Demo */}
        <section style={{ padding: '20px', background: '#f9f9f9', borderRadius: '8px' }}>
          <h2>🏪 Zustand Store</h2>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
            <button onClick={store.increment}>Increment ({store.count})</button>
            <button onClick={store.decrement}>Decrement</button>
            <button onClick={() => store.setTheme(store.theme === 'light' ? 'dark' : 'light')}>
              Toggle Theme ({store.theme})
            </button>
          </div>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
            <button onClick={() => store.setUser({ name: 'John Doe', email: 'john@example.com' })}>
              Set User
            </button>
            <button onClick={() => store.setUser(null)}>Clear User</button>
          </div>
          {store.user && (
            <div style={{ padding: '10px', background: '#e0e0e0', borderRadius: '4px' }}>
              User: {store.user.name} ({store.user.email})
            </div>
          )}
          <div style={{ marginTop: '10px' }}>
            <button onClick={() => store.addNotification(`Notification ${Date.now()}`)}>
              Add Notification ({store.notifications.length})
            </button>
            <button onClick={store.clearNotifications} style={{ marginLeft: '10px' }}>
              Clear All
            </button>
          </div>
        </section>

        {/* Router Demo */}
        <section style={{ padding: '20px', background: '#f9f9f9', borderRadius: '8px' }}>
          <h2>🧭 Router Navigation</h2>
          <nav style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
            <Link to="/">Home</Link>
            <Link to="/dashboard">Dashboard</Link>
            <Link to="/settings">Settings</Link>
          </nav>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
            <button onClick={() => navigate('/')}>Go Home</button>
            <button onClick={() => navigate('/dashboard')}>Go Dashboard</button>
            <button onClick={() => navigate(-1)}>Go Back</button>
          </div>
          <div style={{ padding: '10px', background: 'white', borderRadius: '4px', minHeight: '100px' }}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </div>
        </section>

        {/* WebSocket Demo */}
        <section style={{ padding: '20px', background: '#f9f9f9', borderRadius: '8px' }}>
          <h2>🔌 WebSocket/SignalR</h2>
          <div style={{ marginBottom: '10px' }}>
            Status: {wsConnected ? '🟢 Connected' : '🔴 Disconnected'}
          </div>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
            <button onClick={connectWebSocket} disabled={wsConnected}>Connect</button>
            <button onClick={disconnectWebSocket} disabled={!wsConnected}>Disconnect</button>
            <button
              onClick={() => {
                if (wsRef.current?.readyState === 1) {
                  wsRef.current.send(JSON.stringify({ type: 'test', data: 'Hello!' }))
                  setWsMessages(prev => ['Sent: test message', ...prev.slice(0, 9)])
                }
              }}
              disabled={!wsConnected}
            >
              Send Message
            </button>
          </div>
          <div style={{ maxHeight: '150px', overflow: 'auto', background: 'white', padding: '10px', borderRadius: '4px' }}>
            {wsMessages.map((msg, i) => (
              <div key={i} style={{ fontSize: '12px', marginBottom: '4px' }}>{msg}</div>
            ))}
          </div>
        </section>

        {/* Error Boundary Demo */}
        <section style={{ padding: '20px', background: '#f9f9f9', borderRadius: '8px' }}>
          <h2>⚠️ Error Boundary</h2>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
            <button onClick={() => setShouldError(!shouldError)}>
              {shouldError ? 'Disable' : 'Trigger'} Error
            </button>
            <button onClick={() => {
              console.error('Manual error log')
              throw new Error('Uncaught error!')
            }}>
              Throw Uncaught Error
            </button>
          </div>
          <ErrorBoundary>
            <ErrorProneComponent shouldError={shouldError} />
          </ErrorBoundary>
        </section>

        {/* Performance Demo */}
        <section style={{ padding: '20px', background: '#f9f9f9', borderRadius: '8px' }}>
          <h2>📊 Performance</h2>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
            <button onClick={() => setRenderCount(c => c + 1)}>
              Force Render ({renderCount})
            </button>
            <button onClick={runMemoryIntensiveTask} disabled={memoryIntensive}>
              {memoryIntensive ? 'Processing...' : 'Memory Test'}
            </button>
          </div>
          <ExpensiveComponent value={renderCount} />
          <div style={{ marginTop: '10px', fontSize: '12px' }}>
            Memory: {(performance as any).memory ?
              `${Math.round((performance as any).memory.usedJSHeapSize / 1048576)}MB` :
              'N/A'}
          </div>
        </section>

        {/* Logger Demo */}
        <section style={{ padding: '20px', background: '#f9f9f9', borderRadius: '8px' }}>
          <h2>📝 Logger</h2>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button onClick={() => console.log('Log message', { data: 'test' })}>
              Log
            </button>
            <button onClick={() => console.info('Info message')}>
              Info
            </button>
            <button onClick={() => console.warn('Warning message')}>
              Warn
            </button>
            <button onClick={() => console.error('Error message', new Error('Test'))}>
              Error
            </button>
            <button onClick={() => console.debug('Debug message')}>
              Debug
            </button>
            <button onClick={() => console.table([{ a: 1, b: 2 }, { a: 3, b: 4 }])}>
              Table
            </button>
            <button onClick={() => {
              console.group('Group')
              console.log('Inside group')
              console.groupEnd()
            }}>
              Group
            </button>
          </div>
        </section>

        {/* API Demo */}
        <section style={{ padding: '20px', background: '#f9f9f9', borderRadius: '8px' }}>
          <h2>🌐 API Calls</h2>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
            <button onClick={fetchData} disabled={loading}>
              {loading ? 'Loading...' : 'Fetch Posts'}
            </button>
            <button
              onClick={async () => {
                try {
                  await fetch('https://jsonplaceholder.typicode.com/posts', {
                    method: 'POST',
                    body: JSON.stringify({ title: 'Test', body: 'Test post' }),
                    headers: { 'Content-type': 'application/json' }
                  })
                  console.log('Posted data')
                } catch (error) {
                  console.error('Post error:', error)
                }
              }}
            >
              POST Data
            </button>
          </div>
          <div style={{ maxHeight: '150px', overflow: 'auto', background: 'white', padding: '10px', borderRadius: '4px' }}>
            {apiData.slice(0, 3).map((post: any) => (
              <div key={post.id} style={{ marginBottom: '8px' }}>
                <strong>{post.title}</strong>
              </div>
            ))}
          </div>
        </section>

        {/* Accessibility Demo */}
        <section style={{ padding: '20px', background: '#f9f9f9', borderRadius: '8px' }}>
          <h2>♿ Accessibility</h2>
          <form>
            <label style={{ display: 'block', marginBottom: '10px' }}>
              Name:
              <input type="text" style={{ marginLeft: '10px' }} />
            </label>
            <label style={{ display: 'block', marginBottom: '10px' }}>
              Email (no label association):
            </label>
            <input type="email" style={{ marginBottom: '10px' }} />
            <div>
              <button type="button">Button without ARIA</button>
              <button type="button" aria-label="Submit form">Button with ARIA</button>
            </div>
          </form>
          <div
            style={{ marginTop: '10px', padding: '5px', background: '#333', color: '#555' }}
          >
            Low contrast text (accessibility issue)
          </div>
          <img src="/vite.svg" alt="" style={{ width: '50px' }} />
          <img src="/vite.svg" alt="Vite logo" style={{ width: '50px', marginLeft: '10px' }} />
        </section>

        {/* Design System Demo */}
        <section style={{ padding: '20px', background: '#f9f9f9', borderRadius: '8px' }}>
          <h2>🎨 Design System</h2>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '10px' }}>
            <div style={{ width: '50px', height: '50px', background: '#007bff' }}></div>
            <div style={{ width: '50px', height: '50px', background: '#28a745' }}></div>
            <div style={{ width: '50px', height: '50px', background: '#dc3545' }}></div>
            <div style={{ width: '50px', height: '50px', background: '#ffc107' }}></div>
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button style={{ padding: '8px 16px', fontSize: '14px' }}>14px Button</button>
            <button style={{ padding: '8px 16px', fontSize: '16px' }}>16px Button</button>
            <button style={{ padding: '8px 16px', fontSize: '18px' }}>18px Button</button>
          </div>
          <div style={{ marginTop: '10px' }}>
            <p style={{ margin: '0', fontFamily: 'Arial' }}>Arial Font</p>
            <p style={{ margin: '0', fontFamily: 'Georgia' }}>Georgia Font</p>
            <p style={{ margin: '0', fontFamily: 'monospace' }}>Monospace Font</p>
          </div>
        </section>

      </div>

      <div style={{ marginTop: '30px', padding: '20px', background: '#e8f4fd', borderRadius: '8px' }}>
        <h2>📚 Plugin Guide</h2>
        <ul>
          <li><strong>Logger:</strong> Click the logger buttons to see console output tracking</li>
          <li><strong>Zustand:</strong> Interact with the store to see state changes</li>
          <li><strong>Router:</strong> Navigate between routes to see routing history</li>
          <li><strong>WebSocket/SignalR:</strong> Connect and send messages to track real-time connections</li>
          <li><strong>Error Boundary:</strong> Trigger errors to see error tracking and boundaries</li>
          <li><strong>Memory Performance:</strong> Run memory tests to see performance metrics</li>
          <li><strong>Render Waste:</strong> Force renders to detect unnecessary re-renders</li>
          <li><strong>Accessibility:</strong> The form has intentional accessibility issues to detect</li>
          <li><strong>Design System:</strong> Shows color palette and typography analysis</li>
        </ul>
      </div>
    </div>
  )
}

// Main App with Router and Error Boundary
function App() {
  return (
    <ErrorBoundaryWrapper
      boundaryName="PlaygroundApp"
      level="page"
      fallback={({ error, resetErrorBoundary }) => (
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <h2>🚨 Something went wrong in the playground</h2>
          <pre style={{ color: 'red', margin: '20px auto', maxWidth: '600px', textAlign: 'left' }}>
            {error.message}
          </pre>
          <button onClick={resetErrorBoundary} style={{ padding: '10px 20px' }}>
            Reset Playground
          </button>
        </div>
      )}
      onError={(error, errorInfo) => {
        logger.error('Playground Error', error, { errorInfo });
      }}
    >
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </ErrorBoundaryWrapper>
  )
}

export default App