import React from 'react';
import ReactDOM from 'react-dom/client';
import { TanStackDevtools } from '@tanstack/react-devtools';
import App from './App';
import { formStateInspectorPlugin } from '../plugin';

// Initialize Form State Inspector
import '../index';

function Root() {
  return (
    <>
      <App />
      <TanStackDevtools 
        initialIsOpen={false}
        plugins={[formStateInspectorPlugin]}
      />
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);