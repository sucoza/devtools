import { EventClient } from '@tanstack/devtools-event-client';

// Form field validation state types
export type ValidationState = 'valid' | 'invalid' | 'warning' | 'pending';

export type FieldValidation = {
  state: ValidationState;
  message?: string;
  rule?: string;
};

// Form field state information
export type FieldState = {
  name: string;
  value: any;
  isDirty: boolean;
  isTouched: boolean;
  isPristine: boolean;
  isValid: boolean;
  isRequired: boolean;
  validation: FieldValidation;
  type: string; // input, textarea, select, checkbox, radio, etc.
  timestamp: number;
  renderCount: number;
  validationTime?: number; // Time taken for validation in ms
};

// Form submission tracking
export type FormSubmission = {
  formId: string;
  timestamp: number;
  values: Record<string, any>;
  isValid: boolean;
  validationErrors: Record<string, string[]>;
  duration: number; // Time from start to submit
  success: boolean;
  errorMessage?: string;
};

// Performance metrics for form operations
export type FormPerformanceMetrics = {
  formId: string;
  averageValidationTime: number;
  totalRenderCount: number;
  fieldRenderCounts: Record<string, number>;
  lastValidationTime: number;
  formInitTime: number;
  totalInteractionTime: number;
};

// Schema information for validation
export type ValidationSchema = {
  type: 'yup' | 'zod' | 'joi' | 'custom';
  schema: any; // The actual schema object
  parsedFields: Record<string, {
    type: string;
    required: boolean;
    validation: string[]; // List of validation rules
  }>;
};

// Field history for undo/redo functionality
export type FieldHistoryEntry = {
  fieldName: string;
  value: any;
  timestamp: number;
  action: 'change' | 'focus' | 'blur' | 'reset';
};

// Form state container
export type FormState = {
  formId: string;
  fields: Record<string, FieldState>;
  isValid: boolean;
  isSubmitting: boolean;
  isDirty: boolean;
  submitCount: number;
  timestamp: number;
  schema?: ValidationSchema;
  performanceMetrics: FormPerformanceMetrics;
  fieldHistory: FieldHistoryEntry[];
  accessibilityIssues: AccessibilityIssue[];
};

// Accessibility audit types
export type AccessibilityIssue = {
  fieldName: string;
  severity: 'error' | 'warning' | 'info';
  rule: string;
  message: string;
  suggestion: string;
};

// Event map for form state inspector
export type FormStateEventMap = {
  'form-state-update': {
    forms: Record<string, FormState>;
  };
  'form-registered': {
    formId: string;
    initialState: FormState;
  };
  'field-change': {
    formId: string;
    fieldName: string;
    prevValue: any;
    nextValue: any;
    timestamp: number;
  };
  'field-validation': {
    formId: string;
    fieldName: string;
    validation: FieldValidation;
    validationTime: number;
    timestamp: number;
  };
  'form-submit': {
    formId: string;
    submission: FormSubmission;
  };
  'form-reset': {
    formId: string;
    timestamp: number;
  };
  'accessibility-audit': {
    formId: string;
    issues: AccessibilityIssue[];
    timestamp: number;
  };
  'performance-update': {
    formId: string;
    metrics: FormPerformanceMetrics;
  };
  'form-state-request': void;
  'form-state-response': {
    forms: Record<string, FormState>;
  };
  'field-history-request': {
    formId: string;
    fieldName?: string;
  };
  'field-history-response': {
    formId: string;
    fieldName?: string;
    history: FieldHistoryEntry[];
  };
  'form-replay-start': {
    formId: string;
    startTimestamp: number;
  };
  'form-replay-step': {
    formId: string;
    historyEntry: FieldHistoryEntry;
  };
  'form-replay-complete': {
    formId: string;
    duration: number;
  };
};

export class FormStateEventClient extends EventClient<FormStateEventMap> {
  private static instance: FormStateEventClient | null = null;

  private constructor() {
    super({
      pluginId: 'form-state-inspector',
    } as any);
  }

  static getInstance(): FormStateEventClient {
    if (!FormStateEventClient.instance) {
      FormStateEventClient.instance = new FormStateEventClient();
    }
    return FormStateEventClient.instance;
  }
}

export const formStateEventClient = FormStateEventClient.getInstance() as any;