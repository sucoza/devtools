import { 
  FormState, 
  FieldState, 
  ValidationState, 
  FieldValidation, 
  FormPerformanceMetrics,
  FieldHistoryEntry,
  AccessibilityIssue,
  ValidationSchema,
  FormSubmission
} from './formEventClient';
import { formStateEventClient } from './formEventClient';

// Global registry for tracked forms
class FormStateRegistry {
  private forms: Map<string, FormState> = new Map();
  private performanceObserver: PerformanceObserver | null = null;
  private fieldObservers: Map<string, MutationObserver> = new Map();

  constructor() {
    this.initializePerformanceTracking();
    this.setupEventListeners();
  }

  private initializePerformanceTracking() {
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      this.performanceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.name.startsWith('form-validation-')) {
            const formId = entry.name.split('form-validation-')[1];
            this.updatePerformanceMetrics(formId, entry.duration);
          }
        });
      });
      
      this.performanceObserver.observe({ entryTypes: ['measure'] });
    }
  }

  private setupEventListeners() {
    // Listen for form state requests
    formStateEventClient.on('form-state-request', () => {
      this.broadcastFormsState();
    });

    // Listen for field history requests
    formStateEventClient.on('field-history-request', (event) => {
      this.handleFieldHistoryRequest(event.payload.formId, event.payload.fieldName);
    });
  }

  private broadcastFormsState() {
    const formsState: Record<string, FormState> = {};
    this.forms.forEach((form, formId) => {
      formsState[formId] = form;
    });
    
    formStateEventClient.emit('form-state-response', { forms: formsState });
    formStateEventClient.emit('form-state-update', { forms: formsState });
  }

  private handleFieldHistoryRequest(formId: string, fieldName?: string) {
    const form = this.forms.get(formId);
    if (!form) return;

    const history = fieldName 
      ? form.fieldHistory.filter(entry => entry.fieldName === fieldName)
      : form.fieldHistory;

    formStateEventClient.emit('field-history-response', {
      formId,
      fieldName,
      history
    });
  }

  private updatePerformanceMetrics(formId: string, validationTime: number) {
    const form = this.forms.get(formId);
    if (!form) return;

    const metrics = form.performanceMetrics;
    metrics.lastValidationTime = validationTime;
    metrics.averageValidationTime = (metrics.averageValidationTime + validationTime) / 2;
    
    formStateEventClient.emit('performance-update', { formId, metrics });
    this.broadcastFormsState();
  }

  // Register a new form for tracking
  registerForm(formId: string, formElement?: HTMLFormElement): FormState {
    const initialState: FormState = {
      formId,
      fields: {},
      isValid: true,
      isSubmitting: false,
      isDirty: false,
      submitCount: 0,
      timestamp: Date.now(),
      performanceMetrics: {
        formId,
        averageValidationTime: 0,
        totalRenderCount: 0,
        fieldRenderCounts: {},
        lastValidationTime: 0,
        formInitTime: Date.now(),
        totalInteractionTime: 0
      },
      fieldHistory: [],
      accessibilityIssues: []
    };

    this.forms.set(formId, initialState);

    // Set up DOM observation for the form if element is provided
    if (formElement) {
      this.setupFormObserver(formId, formElement);
      this.performAccessibilityAudit(formId, formElement);
    }

    formStateEventClient.emit('form-registered', { formId, initialState });
    this.broadcastFormsState();

    return initialState;
  }

  private setupFormObserver(formId: string, formElement: HTMLFormElement) {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' || mutation.type === 'attributes') {
          // Re-audit accessibility when form structure changes
          this.performAccessibilityAudit(formId, formElement);
        }
      });
    });

    observer.observe(formElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['aria-label', 'aria-labelledby', 'aria-describedby', 'required']
    });

    this.fieldObservers.set(formId, observer);

    // Setup form submission tracking
    formElement.addEventListener('submit', (event) => {
      this.handleFormSubmit(formId, event);
    });
  }

  // Update field state
  updateField(formId: string, fieldName: string, updates: Partial<FieldState>) {
    const form = this.forms.get(formId);
    if (!form) return;

    const currentField = form.fields[fieldName] || this.createDefaultFieldState(fieldName);
    const prevValue = currentField.value;
    
    // Update field with new values
    const updatedField: FieldState = {
      ...currentField,
      ...updates,
      timestamp: Date.now(),
      renderCount: currentField.renderCount + 1
    };

    form.fields[fieldName] = updatedField;

    // Update performance metrics
    form.performanceMetrics.fieldRenderCounts[fieldName] = updatedField.renderCount;
    form.performanceMetrics.totalRenderCount++;

    // Track field history if value changed
    if (updates.value !== undefined && updates.value !== prevValue) {
      this.addFieldHistoryEntry(formId, fieldName, updates.value, 'change');
      
      formStateEventClient.emit('field-change', {
        formId,
        fieldName,
        prevValue,
        nextValue: updates.value,
        timestamp: Date.now()
      });
    }

    // Update form-level state
    this.updateFormState(formId);
    this.broadcastFormsState();
  }

  private createDefaultFieldState(fieldName: string): FieldState {
    return {
      name: fieldName,
      value: '',
      isDirty: false,
      isTouched: false,
      isPristine: true,
      isValid: true,
      isRequired: false,
      validation: { state: 'valid' },
      type: 'text',
      timestamp: Date.now(),
      renderCount: 0
    };
  }

  private addFieldHistoryEntry(formId: string, fieldName: string, value: any, action: FieldHistoryEntry['action']) {
    const form = this.forms.get(formId);
    if (!form) return;

    const historyEntry: FieldHistoryEntry = {
      fieldName,
      value,
      timestamp: Date.now(),
      action
    };

    form.fieldHistory.push(historyEntry);
    
    // Keep history limited to prevent memory issues
    if (form.fieldHistory.length > 100) {
      form.fieldHistory = form.fieldHistory.slice(-100);
    }
  }

  // Validate a specific field
  validateField(formId: string, fieldName: string, validator?: (value: any) => FieldValidation): Promise<void> {
    return new Promise((resolve) => {
      const form = this.forms.get(formId);
      if (!form || !form.fields[fieldName]) {
        resolve();
        return;
      }

      const startTime = Date.now();
      performance.mark(`validation-start-${formId}-${fieldName}`);

      let validation: FieldValidation = { state: 'valid' };

      if (validator) {
        validation = validator(form.fields[fieldName].value);
      } else if (form.schema) {
        validation = this.validateWithSchema(form.schema, fieldName, form.fields[fieldName].value);
      }

      performance.mark(`validation-end-${formId}-${fieldName}`);
      performance.measure(
        `form-validation-${formId}`,
        `validation-start-${formId}-${fieldName}`,
        `validation-end-${formId}-${fieldName}`
      );

      const validationTime = Date.now() - startTime;

      // Update field validation state
      this.updateField(formId, fieldName, {
        validation,
        isValid: validation.state === 'valid',
        validationTime
      });

      formStateEventClient.emit('field-validation', {
        formId,
        fieldName,
        validation,
        validationTime,
        timestamp: Date.now()
      });

      resolve();
    });
  }

  private validateWithSchema(schema: ValidationSchema, fieldName: string, value: any): FieldValidation {
    try {
      switch (schema.type) {
        case 'yup':
          return this.validateWithYup(schema.schema, fieldName, value);
        case 'zod':
          return this.validateWithZod(schema.schema, fieldName, value);
        case 'joi':
          return this.validateWithJoi(schema.schema, fieldName, value);
        default:
          return { state: 'valid' };
      }
    } catch (error) {
      return {
        state: 'invalid',
        message: error instanceof Error ? error.message : 'Validation error'
      };
    }
  }

  private validateWithYup(schema: any, fieldName: string, value: any): FieldValidation {
    try {
      schema.validateSyncAt(fieldName, { [fieldName]: value });
      return { state: 'valid' };
    } catch (error: any) {
      return {
        state: 'invalid',
        message: error.message,
        rule: error.type
      };
    }
  }

  private validateWithZod(schema: any, fieldName: string, value: any): FieldValidation {
    try {
      const fieldSchema = schema.shape[fieldName];
      if (!fieldSchema) return { state: 'valid' };
      
      fieldSchema.parse(value);
      return { state: 'valid' };
    } catch (error: any) {
      return {
        state: 'invalid',
        message: error.issues?.[0]?.message || 'Validation error',
        rule: error.issues?.[0]?.code
      };
    }
  }

  private validateWithJoi(schema: any, fieldName: string, value: any): FieldValidation {
    try {
      const result = schema.validate({ [fieldName]: value });
      if (result.error) {
        const error = result.error.details[0];
        return {
          state: 'invalid',
          message: error.message,
          rule: error.type
        };
      }
      return { state: 'valid' };
    } catch (error: any) {
      return {
        state: 'invalid',
        message: error.message || 'Validation error'
      };
    }
  }

  private updateFormState(formId: string) {
    const form = this.forms.get(formId);
    if (!form) return;

    const fields = Object.values(form.fields);
    form.isValid = fields.every(field => field.isValid);
    form.isDirty = fields.some(field => field.isDirty);
    form.timestamp = Date.now();
  }

  private handleFormSubmit(formId: string, event: SubmitEvent) {
    const form = this.forms.get(formId);
    if (!form) return;

    const startTime = Date.now();
    form.isSubmitting = true;
    form.submitCount++;

    const values: Record<string, any> = {};
    const validationErrors: Record<string, string[]> = {};

    Object.entries(form.fields).forEach(([fieldName, field]) => {
      values[fieldName] = field.value;
      if (!field.isValid && field.validation.message) {
        validationErrors[fieldName] = [field.validation.message];
      }
    });

    const submission: FormSubmission = {
      formId,
      timestamp: startTime,
      values,
      isValid: form.isValid,
      validationErrors,
      duration: Date.now() - startTime,
      success: form.isValid && Object.keys(validationErrors).length === 0
    };

    form.isSubmitting = false;
    this.updateFormState(formId);

    formStateEventClient.emit('form-submit', { formId, submission });
    this.broadcastFormsState();
  }

  // Perform accessibility audit
  private performAccessibilityAudit(formId: string, formElement: HTMLFormElement) {
    const issues: AccessibilityIssue[] = [];
    const form = this.forms.get(formId);
    if (!form) return;

    // Find all form fields
    const fields = formElement.querySelectorAll('input, textarea, select');
    
    fields.forEach((field: Element) => {
      const htmlField = field as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
      const fieldName = htmlField.name || htmlField.id || 'unnamed-field';

      // Check for labels
      const hasLabel = this.hasAssociatedLabel(htmlField);
      if (!hasLabel) {
        issues.push({
          fieldName,
          severity: 'error',
          rule: 'missing-label',
          message: 'Form field is missing an associated label',
          suggestion: 'Add a <label> element or aria-label attribute'
        });
      }

      // Check for required fields without aria-required
      if (htmlField.hasAttribute('required') && !htmlField.hasAttribute('aria-required')) {
        issues.push({
          fieldName,
          severity: 'warning',
          rule: 'missing-aria-required',
          message: 'Required field should have aria-required="true"',
          suggestion: 'Add aria-required="true" to required fields'
        });
      }

      // Check for invalid fields without aria-invalid
      const fieldState = form.fields[fieldName];
      if (fieldState && !fieldState.isValid && !htmlField.hasAttribute('aria-invalid')) {
        issues.push({
          fieldName,
          severity: 'error',
          rule: 'missing-aria-invalid',
          message: 'Invalid field should have aria-invalid="true"',
          suggestion: 'Add aria-invalid="true" to invalid fields'
        });
      }

      // Check for error messages without proper association
      if (fieldState && !fieldState.isValid && fieldState.validation.message) {
        const hasErrorDescription = htmlField.hasAttribute('aria-describedby');
        if (!hasErrorDescription) {
          issues.push({
            fieldName,
            severity: 'error',
            rule: 'missing-error-description',
            message: 'Error message is not properly associated with field',
            suggestion: 'Use aria-describedby to associate error messages'
          });
        }
      }
    });

    form.accessibilityIssues = issues;
    
    formStateEventClient.emit('accessibility-audit', {
      formId,
      issues,
      timestamp: Date.now()
    });

    this.broadcastFormsState();
  }

  private hasAssociatedLabel(field: HTMLElement): boolean {
    // Check for explicit label association
    if (field.id) {
      const label = document.querySelector(`label[for="${field.id}"]`);
      if (label) return true;
    }

    // Check for implicit label association (field inside label)
    const parent = field.closest('label');
    if (parent) return true;

    // Check for aria-label
    if (field.hasAttribute('aria-label') && field.getAttribute('aria-label')?.trim()) {
      return true;
    }

    // Check for aria-labelledby
    if (field.hasAttribute('aria-labelledby')) {
      const labelIds = field.getAttribute('aria-labelledby')?.split(' ') || [];
      return labelIds.some(id => document.getElementById(id));
    }

    return false;
  }

  // Set validation schema for a form
  setValidationSchema(formId: string, schema: ValidationSchema) {
    const form = this.forms.get(formId);
    if (!form) return;

    form.schema = schema;
    this.broadcastFormsState();
  }

  // Reset form to initial state
  resetForm(formId: string) {
    const form = this.forms.get(formId);
    if (!form) return;

    // Reset all fields to pristine state
    Object.values(form.fields).forEach(field => {
      this.updateField(formId, field.name, {
        value: '',
        isDirty: false,
        isTouched: false,
        isPristine: true,
        isValid: true,
        validation: { state: 'valid' }
      });
    });

    // Add reset entry to history
    this.addFieldHistoryEntry(formId, 'form', null, 'reset');

    formStateEventClient.emit('form-reset', { formId, timestamp: Date.now() });
    this.broadcastFormsState();
  }

  // Get form state
  getFormState(formId: string): FormState | undefined {
    return this.forms.get(formId);
  }

  // Get all forms
  getAllForms(): Record<string, FormState> {
    const result: Record<string, FormState> = {};
    this.forms.forEach((form, formId) => {
      result[formId] = form;
    });
    return result;
  }

  // Cleanup form tracking
  unregisterForm(formId: string) {
    const observer = this.fieldObservers.get(formId);
    if (observer) {
      observer.disconnect();
      this.fieldObservers.delete(formId);
    }

    this.forms.delete(formId);
    this.broadcastFormsState();
  }

  // Cleanup all tracking
  destroy() {
    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
    }

    this.fieldObservers.forEach(observer => observer.disconnect());
    this.fieldObservers.clear();
    this.forms.clear();
  }
}

// Global registry instance
export const formStateRegistry = new FormStateRegistry();

// Convenience functions for form tracking
export function registerForm(formId: string, formElement?: HTMLFormElement): FormState {
  return formStateRegistry.registerForm(formId, formElement);
}

export function updateField(formId: string, fieldName: string, updates: Partial<FieldState>) {
  formStateRegistry.updateField(formId, fieldName, updates);
}

export function validateField(formId: string, fieldName: string, validator?: (value: any) => FieldValidation) {
  return formStateRegistry.validateField(formId, fieldName, validator);
}

export function setValidationSchema(formId: string, schema: ValidationSchema) {
  formStateRegistry.setValidationSchema(formId, schema);
}

export function resetForm(formId: string) {
  formStateRegistry.resetForm(formId);
}

export function getFormState(formId: string): FormState | undefined {
  return formStateRegistry.getFormState(formId);
}

export function unregisterForm(formId: string) {
  formStateRegistry.unregisterForm(formId);
}