// import { DevtoolsPlugin } from '@tanstack/react-devtools'; // Not available
type DevtoolsPlugin = any;
import { FormStateDevToolsPanel } from './FormStateDevToolsPanel';
import { formStateEventClient } from './formEventClient';

export const formStateInspectorPlugin: DevtoolsPlugin = {
  id: 'form-state-inspector',
  name: 'Form State Inspector',
  icon: '📝',
  component: FormStateDevToolsPanel,
  eventClient: formStateEventClient,
  order: 50, // Position in the DevTools tab list
  
  // Optional: Define when this plugin should be enabled
  isEnabled: () => {
    // Could check for presence of forms or specific libraries
    return typeof window !== 'undefined' && typeof document !== 'undefined';
  },
  
  // Optional: Initialize the plugin
  init: () => {
    console.log('🔍 Form State Inspector plugin initialized');
    
    // Auto-detect forms on page load
    if (typeof window !== 'undefined') {
      window.addEventListener('DOMContentLoaded', () => {
        const forms = document.querySelectorAll('form');
        console.log(`Form State Inspector: Found ${forms.length} forms on the page`);
      });
    }
  }
};

// Export for use with TanStack DevTools
export default formStateInspectorPlugin;