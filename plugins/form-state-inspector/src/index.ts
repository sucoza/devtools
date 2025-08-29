// Main exports for Form State Inspector DevTools Plugin
export { FormStateDevToolsPanel } from './FormStateDevToolsPanel';
export { formStateEventClient, FormStateEventClient } from './formEventClient';
export { formStateInspectorPlugin, default as plugin } from './plugin';

// Form State Types
export type {
  FormState,
  FieldState,
  FieldValidation,
  ValidationState,
  FormSubmission,
  FormPerformanceMetrics,
  ValidationSchema,
  FieldHistoryEntry,
  AccessibilityIssue,
  FormStateEventMap
} from './formEventClient';

// Form State Tracker
import { formStateRegistry } from './formStateTracker';
import { formReplayEngine } from './formReplayEngine';
import { trackHTMLForm } from './formLibraryIntegrations';
import { formStateEventClient } from './formEventClient';
export {
  formStateRegistry,
  registerForm,
  updateField,
  validateField,
  setValidationSchema,
  resetForm,
  getFormState,
  unregisterForm
} from './formStateTracker';

// Form Library Integrations
export {
  useFormStateInspector,
  formikDevToolsPlugin,
  trackHTMLForm,
  createFormAdapter,
  parseYupSchema,
  parseZodSchema,
  parseJoiSchema,
  type FormLibraryAdapter
} from './formLibraryIntegrations';

// Form Replay Engine
export {
  formReplayEngine,
  FormReplayEngine,
  type ReplayOptions
} from './formReplayEngine';

// Initialize the plugin
export function initializeFormStateInspector() {
  if (typeof window !== 'undefined') {
    // Make the form state inspector available globally for debugging
    (window as any).__FORM_STATE_INSPECTOR__ = {
      registry: formStateRegistry,
      eventClient: formStateEventClient,
      replayEngine: formReplayEngine,
      version: '1.0.0'
    };

    // Auto-detect and track HTML forms if configured
    if ((window as any).__FORM_STATE_INSPECTOR_AUTO_TRACK__) {
      document.addEventListener('DOMContentLoaded', () => {
        const forms = document.querySelectorAll('form');
        forms.forEach((form, index) => {
          const formElement = form as HTMLFormElement;
          const formId = formElement.id || formElement.name || `form-${index}`;
          trackHTMLForm(formElement, formId);
        });
      });
    }

    console.log('🔍 Form State Inspector initialized');
  }
}

// Auto-initialize if in browser environment
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  initializeFormStateInspector();
}

// Default export - main panel component
export { FormStateDevToolsPanel as default } from './FormStateDevToolsPanel';