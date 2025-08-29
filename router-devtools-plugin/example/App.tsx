/**
 * Example React application demonstrating Router DevTools Enhanced
 */

import React, { useState } from 'react';
import { 
  BrowserRouter, 
  Routes, 
  Route, 
  Link, 
  useParams, 
  useNavigate, 
  useSearchParams,
  Outlet 
} from 'react-router-dom';
import { RouterDevToolsPanel, useRouterDevTools } from '../src';

// Example components
function Home() {
  return (
    <div>
      <h1>Home Page</h1>
      <p>Welcome to the Router DevTools Enhanced demo!</p>
      <nav>
        <ul>
          <li><Link to="/users/123">User Profile</Link></li>
          <li><Link to="/products?category=electronics&sort=price">Products</Link></li>
          <li><Link to="/about">About</Link></li>
          <li><Link to="/dashboard">Dashboard</Link></li>
        </ul>
      </nav>
    </div>
  );
}

function UserProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const handleUserChange = (newId: string) => {
    navigate(`/users/${newId}`);
  };

  return (
    <div>
      <h1>User Profile</h1>
      <p>Current User ID: <strong>{id}</strong></p>
      
      <div>
        <h3>Try different users:</h3>
        <button onClick={() => handleUserChange('456')}>User 456</button>
        <button onClick={() => handleUserChange('789')}>User 789</button>
        <button onClick={() => handleUserChange('abc-def-ghi')}>User abc-def-ghi</button>
      </div>
      
      <Link to="/">← Back to Home</Link>
    </div>
  );
}

function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const category = searchParams.get('category') || '';
  const sort = searchParams.get('sort') || '';
  const page = searchParams.get('page') || '1';

  const updateFilter = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    setSearchParams(newParams);
  };

  return (
    <div>
      <h1>Products</h1>
      
      <div style={{ marginBottom: '20px', padding: '10px', border: '1px solid #ccc' }}>
        <h3>Filters (try editing in DevTools!):</h3>
        <p><strong>Category:</strong> {category || 'All'}</p>
        <p><strong>Sort:</strong> {sort || 'Default'}</p>
        <p><strong>Page:</strong> {page}</p>
        
        <div>
          <button onClick={() => updateFilter('category', 'electronics')}>Electronics</button>
          <button onClick={() => updateFilter('category', 'clothing')}>Clothing</button>
          <button onClick={() => updateFilter('category', '')}>All Categories</button>
        </div>
        
        <div>
          <button onClick={() => updateFilter('sort', 'price')}>Sort by Price</button>
          <button onClick={() => updateFilter('sort', 'name')}>Sort by Name</button>
          <button onClick={() => updateFilter('sort', '')}>Default Sort</button>
        </div>
        
        <div>
          <button onClick={() => updateFilter('page', '1')}>Page 1</button>
          <button onClick={() => updateFilter('page', '2')}>Page 2</button>
          <button onClick={() => updateFilter('page', '3')}>Page 3</button>
        </div>
      </div>
      
      <Link to="/">← Back to Home</Link>
    </div>
  );
}

function About() {
  return (
    <div>
      <h1>About</h1>
      <p>This is the about page demonstrating nested routing.</p>
      <nav>
        <ul>
          <li><Link to="team">Our Team</Link></li>
          <li><Link to="history">Our History</Link></li>
        </ul>
      </nav>
      <Outlet />
      <Link to="/">← Back to Home</Link>
    </div>
  );
}

function Team() {
  return (
    <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#f5f5f5' }}>
      <h2>Our Team</h2>
      <p>Meet the amazing people behind this project!</p>
    </div>
  );
}

function History() {
  return (
    <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#f5f5f5' }}>
      <h2>Our History</h2>
      <p>Founded in 2024, we've been building amazing developer tools.</p>
    </div>
  );
}

function Dashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const navigate = useNavigate();

  React.useEffect(() => {
    navigate(`/dashboard/${activeTab}`, { replace: true });
  }, [activeTab, navigate]);

  return (
    <div>
      <h1>Dashboard</h1>
      <nav style={{ marginBottom: '20px' }}>
        <button 
          onClick={() => setActiveTab('overview')}
          style={{ marginRight: '10px', fontWeight: activeTab === 'overview' ? 'bold' : 'normal' }}
        >
          Overview
        </button>
        <button 
          onClick={() => setActiveTab('analytics')}
          style={{ marginRight: '10px', fontWeight: activeTab === 'analytics' ? 'bold' : 'normal' }}
        >
          Analytics
        </button>
        <button 
          onClick={() => setActiveTab('settings')}
          style={{ fontWeight: activeTab === 'settings' ? 'bold' : 'normal' }}
        >
          Settings
        </button>
      </nav>
      
      <Outlet />
      <Link to="/">← Back to Home</Link>
    </div>
  );
}

function DashboardOverview() {
  return (
    <div>
      <h2>Dashboard Overview</h2>
      <p>Here's your dashboard overview with key metrics.</p>
    </div>
  );
}

function DashboardAnalytics() {
  return (
    <div>
      <h2>Analytics</h2>
      <p>Detailed analytics and reporting data.</p>
    </div>
  );
}

function DashboardSettings() {
  return (
    <div>
      <h2>Settings</h2>
      <p>Configure your dashboard preferences.</p>
    </div>
  );
}

function NotFound() {
  return (
    <div>
      <h1>404 - Page Not Found</h1>
      <p>The page you're looking for doesn't exist.</p>
      <Link to="/">← Back to Home</Link>
    </div>
  );
}

// Main App component
function App() {
  // Initialize Router DevTools
  useRouterDevTools();

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <BrowserRouter>
        <header style={{ marginBottom: '30px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
          <h1 style={{ margin: '0 0 10px 0', color: '#333' }}>Router DevTools Enhanced Demo</h1>
          <p style={{ margin: 0, color: '#666' }}>
            Navigate around to see the DevTools in action. Open your browser DevTools to see the Router panel.
          </p>
        </header>

        <div style={{ display: 'flex', gap: '20px' }}>
          {/* Main content */}
          <main style={{ flex: 1 }}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/users/:id" element={<UserProfile />} />
              <Route path="/products" element={<Products />} />
              <Route path="/about" element={<About />}>
                <Route path="team" element={<Team />} />
                <Route path="history" element={<History />} />
              </Route>
              <Route path="/dashboard" element={<Dashboard />}>
                <Route index element={<DashboardOverview />} />
                <Route path="overview" element={<DashboardOverview />} />
                <Route path="analytics" element={<DashboardAnalytics />} />
                <Route path="settings" element={<DashboardSettings />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>

          {/* DevTools Panel (for demonstration purposes) */}
          <aside style={{ 
            width: '400px', 
            height: '600px',
            border: '1px solid #ddd',
            borderRadius: '8px',
            overflow: 'hidden'
          }}>
            <div style={{ 
              padding: '10px', 
              backgroundColor: '#f8f9fa', 
              borderBottom: '1px solid #ddd',
              fontSize: '14px',
              fontWeight: 'bold'
            }}>
              Router DevTools Panel
            </div>
            <div style={{ height: 'calc(100% - 45px)' }}>
              <RouterDevToolsPanel />
            </div>
          </aside>
        </div>
      </BrowserRouter>
    </div>
  );
}

export default App;