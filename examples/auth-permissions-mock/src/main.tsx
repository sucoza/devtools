import React from 'react';
import { createRoot } from 'react-dom/client';
import { AuthPermissionsMockPanel } from '@sucoza/auth-permissions-mock-devtools-plugin';

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