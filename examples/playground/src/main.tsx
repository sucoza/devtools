import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { DevToolsManager } from '@sucoza/devtools-importer/react';

createRoot(document.getElementById('root')!).render(
  <>
    <StrictMode>
      <App />
    </StrictMode>
    <DevToolsManager />
  </>,
)
