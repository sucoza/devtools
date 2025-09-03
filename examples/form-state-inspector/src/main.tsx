import React from 'react';
import ReactDOM from 'react-dom/client';
import { TanStackDevtools } from '@tanstack/react-devtools';
import App from './App';
import { FormStateDevToolsPanel } from '@sucoza/form-state-inspector-devtools-plugin';

// Initialize Form State Inspector
import '@sucoza/form-state-inspector-devtools-plugin';

function Root() {
  return (
    <>
      <App />
      <TanStackDevtools
        plugins={[{
          name: "Form Inspector",
          render: () => <FormStateDevToolsPanel />
        }]}
      />
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);