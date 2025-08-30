import { formStateRegistry, updateField, validateField } from './formStateTracker';
import type { FieldState, FieldValidation, ValidationSchema } from './formEventClient';

// React Hook Form Integration
export function useFormStateInspector(formId: string, hookFormMethods?: any) {
  if (typeof window === 'undefined') return {
    updateField: () => {},
    validateField: () => ({ state: 'valid' as const }),
    resetForm: () => {},
    unregister: () => {}
  };

  // Register form on mount
  const _formState = formStateRegistry.registerForm(formId);

  if (hookFormMethods) {
    // React Hook Form specific integration
    const { watch, formState: rhfState, control: _control } = hookFormMethods;

    // Watch all fields
    const watchedValues = watch();

    // Update field states when values change
    Object.entries(watchedValues || {}).forEach(([fieldName, value]) => {
      const fieldState = rhfState.dirtyFields[fieldName];
      const touchedState = rhfState.touchedFields[fieldName];
      const errors = rhfState.errors[fieldName];

      updateField(formId, fieldName, {
        value,
        isDirty: !!fieldState,
        isTouched: !!touchedState,
        isPristine: !fieldState,
        isValid: !errors,
        validation: errors ? {
          state: 'invalid',
          message: errors.message,
          rule: errors.type
        } : { state: 'valid' }
      });
    });

    // Track form submission
    if (rhfState.isSubmitting) {
      formStateRegistry.updateFormState(formId);
    }
  }

  return {
    updateField: (fieldName: string, updates: Partial<FieldState>) => 
      updateField(formId, fieldName, updates),
    validateField: (fieldName: string, validator?: (value: any) => FieldValidation) => 
      validateField(formId, fieldName, validator),
    resetForm: () => formStateRegistry.resetForm(formId),
    unregister: () => formStateRegistry.unregisterForm(formId)
  };
}

// Formik Integration
export function formikDevToolsPlugin(formId: string) {
  return {
    name: 'form-state-inspector',
    
    onMount: (formik: any) => {
      // Register form
      formStateRegistry.registerForm(formId);
      
      // Set up initial field states
      Object.keys(formik.values).forEach(fieldName => {
        updateField(formId, fieldName, {
          value: formik.values[fieldName],
          isDirty: false,
          isTouched: false,
          isPristine: true,
          isValid: !formik.errors[fieldName],
          validation: formik.errors[fieldName] ? {
            state: 'invalid',
            message: formik.errors[fieldName]
          } : { state: 'valid' }
        });
      });
    },
    
    onChange: (formik: any) => {
      // Update field states on change
      Object.keys(formik.values).forEach(fieldName => {
        const isDirty = formik.initialValues[fieldName] !== formik.values[fieldName];
        const isTouched = !!formik.touched[fieldName];
        const hasError = !!formik.errors[fieldName];
        
        updateField(formId, fieldName, {
          value: formik.values[fieldName],
          isDirty,
          isTouched,
          isPristine: !isDirty,
          isValid: !hasError,
          validation: hasError ? {
            state: 'invalid',
            message: formik.errors[fieldName]
          } : { state: 'valid' }
        });
      });
    },
    
    onSubmit: (_values: any, _formik: any) => {
      formStateRegistry.handleFormSubmit(formId, {
        preventDefault: () => {},
        target: { elements: {} }
      } as any);
    },
    
    onReset: (_formik: any) => {
      formStateRegistry.resetForm(formId);
    }
  };
}

// Generic HTML Form Integration
export function trackHTMLForm(formElement: HTMLFormElement, formId?: string) {
  const id = formId || formElement.id || `form-${Date.now()}`;
  
  // Register form with DOM element
  const _formState = formStateRegistry.registerForm(id, formElement);
  
  // Track all form inputs
  const inputs = formElement.querySelectorAll('input, textarea, select');
  
  inputs.forEach((input: Element) => {
    const field = input as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
    const fieldName = field.name || field.id || `field-${Date.now()}`;
    
    // Initialize field state
    updateField(id, fieldName, {
      value: field.value,
      type: field.type || 'text',
      isRequired: field.hasAttribute('required'),
      isDirty: false,
      isTouched: false,
      isPristine: true,
      isValid: field.checkValidity(),
      validation: field.checkValidity() ? { state: 'valid' } : {
        state: 'invalid',
        message: field.validationMessage
      }
    });
    
    // Track changes
    field.addEventListener('input', (e) => {
      const target = e.target as HTMLInputElement;
      updateField(id, fieldName, {
        value: target.value,
        isDirty: true,
        isPristine: false,
        isValid: target.checkValidity(),
        validation: target.checkValidity() ? { state: 'valid' } : {
          state: 'invalid',
          message: target.validationMessage
        }
      });
    });
    
    // Track focus/blur
    field.addEventListener('focus', () => {
      updateField(id, fieldName, { isTouched: true });
    });
    
    field.addEventListener('blur', () => {
      // Run validation on blur
      validateField(id, fieldName, (_value) => {
        const isValid = field.checkValidity();
        return isValid ? { state: 'valid' } : {
          state: 'invalid',
          message: field.validationMessage
        };
      });
    });
  });
  
  return {
    formId: id,
    unregister: () => formStateRegistry.unregisterForm(id)
  };
}

// Custom Form Library Adapter
export interface FormLibraryAdapter {
  formId: string;
  getFieldValue: (fieldName: string) => any;
  getFieldError: (fieldName: string) => string | undefined;
  getFieldTouched: (fieldName: string) => boolean;
  getFieldDirty: (fieldName: string) => boolean;
  isFormValid: () => boolean;
  isFormDirty: () => boolean;
  getFormValues: () => Record<string, any>;
  onFieldChange?: (fieldName: string, value: any) => void;
  onSubmit?: (values: Record<string, any>) => void;
}

export function createFormAdapter(adapter: FormLibraryAdapter) {
  const { formId } = adapter;
  
  // Register form
  formStateRegistry.registerForm(formId);
  
  // Create update function
  const updateFormState = () => {
    const values = adapter.getFormValues();
    
    Object.keys(values).forEach(fieldName => {
      const value = adapter.getFieldValue(fieldName);
      const error = adapter.getFieldError(fieldName);
      const isTouched = adapter.getFieldTouched(fieldName);
      const isDirty = adapter.getFieldDirty(fieldName);
      
      updateField(formId, fieldName, {
        value,
        isDirty,
        isTouched,
        isPristine: !isDirty,
        isValid: !error,
        validation: error ? {
          state: 'invalid',
          message: error
        } : { state: 'valid' }
      });
    });
  };
  
  // Set up change tracking if provided
  if (adapter.onFieldChange) {
    const originalOnChange = adapter.onFieldChange;
    adapter.onFieldChange = (fieldName: string, value: any) => {
      originalOnChange(fieldName, value);
      updateFormState();
    };
  }
  
  // Set up submit tracking if provided
  if (adapter.onSubmit) {
    const originalOnSubmit = adapter.onSubmit;
    adapter.onSubmit = (values: Record<string, any>) => {
      formStateRegistry.handleFormSubmit(formId, {
        preventDefault: () => {},
        target: { elements: {} }
      } as any);
      originalOnSubmit(values);
    };
  }
  
  return {
    updateState: updateFormState,
    setSchema: (schema: ValidationSchema) => formStateRegistry.setValidationSchema(formId, schema),
    reset: () => formStateRegistry.resetForm(formId),
    unregister: () => formStateRegistry.unregisterForm(formId)
  };
}

// Validation Schema Helpers
export function parseYupSchema(schema: any): ValidationSchema {
  const fields: Record<string, any> = {};
  
  if (schema.fields) {
    Object.entries(schema.fields).forEach(([fieldName, fieldSchema]: [string, any]) => {
      fields[fieldName] = {
        type: fieldSchema._type || 'string',
        required: fieldSchema._exclusive?.required || false,
        validation: fieldSchema._tests?.map((test: any) => test.name) || []
      };
    });
  }
  
  return {
    type: 'yup',
    schema,
    parsedFields: fields
  };
}

export function parseZodSchema(schema: any): ValidationSchema {
  const fields: Record<string, any> = {};
  
  if (schema.shape) {
    Object.entries(schema.shape).forEach(([fieldName, fieldSchema]: [string, any]) => {
      fields[fieldName] = {
        type: fieldSchema._def?.typeName?.replace('Zod', '').toLowerCase() || 'string',
        required: !fieldSchema.isOptional(),
        validation: []
      };
    });
  }
  
  return {
    type: 'zod',
    schema,
    parsedFields: fields
  };
}

export function parseJoiSchema(schema: any): ValidationSchema {
  const fields: Record<string, any> = {};
  
  if (schema._ids && schema._ids._byKey) {
    schema._ids._byKey.forEach((value: any, key: string) => {
      fields[key] = {
        type: value.schema._type || 'string',
        required: value.schema._flags?.presence === 'required',
        validation: value.schema._rules?.map((rule: any) => rule.name) || []
      };
    });
  }
  
  return {
    type: 'joi',
    schema,
    parsedFields: fields
  };
}