import React from 'react';
import { createRoot } from 'react-dom/client';
import { AuthPermissionsMockPanel } from '../src/index';

function App() {
  return (
    <div style={{ height: '100%' }}>
      <AuthPermissionsMockPanel />
    </div>
  );
}

const container = document.getElementById('plugin-container');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}