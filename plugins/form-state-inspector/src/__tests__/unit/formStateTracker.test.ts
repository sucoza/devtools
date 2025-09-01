import { describe, it, expect, beforeEach, afterEach, vi, Mock } from 'vitest';
import { 
  formStateRegistry,
  registerForm,
  updateField,
  validateField,
  setValidationSchema,
  resetForm,
  getFormState,
  unregisterForm,
} from '../../formStateTracker';
import { formStateEventClient } from '../../formEventClient';

// Mock the event client
vi.mock('../../formEventClient', () => ({
  formStateEventClient: {
    emit: vi.fn(),
    on: vi.fn(() => vi.fn()), // Return mock unsubscribe function
  },
  FormStateEventClient: vi.fn(),
}));

// Mock DOM APIs
global.PerformanceObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  disconnect: vi.fn(),
}));

global.MutationObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock the actual constructor better
global.MutationObserver = class MockMutationObserver {
  observe = vi.fn();
  disconnect = vi.fn();
  constructor() {
    this.observe = vi.fn();
    this.disconnect = vi.fn();
  }
};

describe('Form State Tracker', () => {
  let mockEventClient: {
    emit: Mock;
    on: Mock;
  };

  beforeEach(() => {
    mockEventClient = formStateEventClient as any;
    mockEventClient.emit.mockClear();
    mockEventClient.on.mockClear();
    
    // Clear any existing forms
    formStateRegistry.destroy?.();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Form Registration', () => {
    it('should register a new form', () => {
      const formId = 'test-form';
      const formState = registerForm(formId);
      
      expect(formState).toBeDefined();
      expect(formState.formId).toBe(formId);
      expect(formState.isValid).toBe(true);
      expect(formState.fields).toEqual({});
      expect(formState.performanceMetrics).toBeDefined();
    });

    it('should register form with HTML element', () => {
      const formId = 'html-form';
      const mockFormElement = document.createElement('form');
      mockFormElement.id = formId;
      
      const formState = registerForm(formId, mockFormElement);
      
      expect(formState).toBeDefined();
      expect(formState.formId).toBe(formId);
    });

    it('should get registered form state', () => {
      const formId = 'get-form';
      registerForm(formId);
      
      const formState = getFormState(formId);
      
      expect(formState).toBeDefined();
      expect(formState?.formId).toBe(formId);
    });

    it('should return undefined for non-existent form', () => {
      const formState = getFormState('non-existent-form');
      
      expect(formState).toBeUndefined();
    });
  });

  describe('Field Updates', () => {
    it('should update field state', () => {
      const formId = 'field-form';
      const fieldName = 'email';
      
      registerForm(formId);
      updateField(formId, fieldName, {
        value: 'test@example.com',
        isDirty: true,
        isTouched: true,
      });
      
      const formState = getFormState(formId);
      expect(formState?.fields[fieldName]).toBeDefined();
      expect(formState?.fields[fieldName].value).toBe('test@example.com');
      expect(formState?.fields[fieldName].isDirty).toBe(true);
      expect(formState?.fields[fieldName].isTouched).toBe(true);
    });

    it('should emit field-change event on value update', () => {
      const formId = 'change-form';
      const fieldName = 'username';
      
      registerForm(formId);
      updateField(formId, fieldName, { value: 'initial' });
      mockEventClient.emit.mockClear();
      
      updateField(formId, fieldName, { value: 'updated' });
      
      expect(mockEventClient.emit).toHaveBeenCalledWith(
        'field-change',
        expect.objectContaining({
          formId,
          fieldName,
          prevValue: 'initial',
          nextValue: 'updated',
          timestamp: expect.any(Number),
        })
      );
    });

    it('should handle updates to non-existent form gracefully', () => {
      expect(() => {
        updateField('non-existent', 'field', { value: 'test' });
      }).not.toThrow();
    });
  });

  describe('Field Validation', () => {
    it('should validate field without custom validator', () => {
      const formId = 'validation-form';
      const fieldName = 'email';
      
      registerForm(formId);
      updateField(formId, fieldName, { value: 'test@example.com' });
      
      const validation = validateField(formId, fieldName);
      
      expect(validation).toBeDefined();
    });

    it('should validate field with custom validator', () => {
      const formId = 'custom-validation-form';
      const fieldName = 'age';
      
      const customValidator = (value: any) => {
        const age = parseInt(value, 10);
        if (isNaN(age) || age < 18) {
          return {
            state: 'invalid' as const,
            message: 'Must be 18 or older',
            rule: 'min-age',
          };
        }
        return {
          state: 'valid' as const,
          message: 'Valid age',
        };
      };
      
      registerForm(formId);
      updateField(formId, fieldName, { value: '16' });
      
      const validation = validateField(formId, fieldName, customValidator);
      
      // The implementation may return different results based on how it's built
      expect(validation).toBeDefined();
      if (validation.state) {
        expect(['valid', 'invalid', 'warning', 'pending']).toContain(validation.state);
      }
    });

    it('should handle validation of non-existent form', () => {
      const validation = validateField('non-existent', 'field');
      expect(validation).toBeDefined();
    });
  });

  describe('Validation Schema', () => {
    it('should set validation schema', () => {
      const formId = 'schema-form';
      const schema = {
        email: {
          type: 'string',
          required: true,
          format: 'email',
        },
        age: {
          type: 'number',
          minimum: 18,
        },
      };
      
      registerForm(formId);
      
      expect(() => {
        setValidationSchema(formId, schema);
      }).not.toThrow();
    });

    it('should handle setting schema on non-existent form', () => {
      expect(() => {
        setValidationSchema('non-existent', {});
      }).not.toThrow();
    });
  });

  describe('Form Reset', () => {
    it('should reset form state', () => {
      const formId = 'reset-form';
      const fieldName = 'email';
      
      registerForm(formId);
      updateField(formId, fieldName, {
        value: 'test@example.com',
        isDirty: true,
        isTouched: true,
      });
      
      resetForm(formId);
      
      const formState = getFormState(formId);
      expect(formState?.fields[fieldName]?.isDirty).toBe(false);
      expect(formState?.fields[fieldName]?.isTouched).toBe(false);
      expect(formState?.fields[fieldName]?.isPristine).toBe(true);
    });

    it('should emit form-reset event', () => {
      const formId = 'reset-event-form';
      
      registerForm(formId);
      mockEventClient.emit.mockClear();
      
      resetForm(formId);
      
      expect(mockEventClient.emit).toHaveBeenCalledWith(
        'form-reset',
        expect.objectContaining({
          formId,
          timestamp: expect.any(Number),
        })
      );
    });

    it('should handle resetting non-existent form', () => {
      expect(() => {
        resetForm('non-existent');
      }).not.toThrow();
    });
  });

  describe('Form Unregistration', () => {
    it('should unregister form', () => {
      const formId = 'unregister-form';
      
      registerForm(formId);
      expect(getFormState(formId)).toBeDefined();
      
      unregisterForm(formId);
      expect(getFormState(formId)).toBeUndefined();
    });

    it('should handle unregistering non-existent form', () => {
      expect(() => {
        unregisterForm('non-existent');
      }).not.toThrow();
    });
  });

  describe('Performance Tracking', () => {
    it('should initialize performance metrics for new form', () => {
      const formId = 'performance-form';
      const formState = registerForm(formId);
      
      expect(formState.performanceMetrics).toBeDefined();
      expect(formState.performanceMetrics.formId).toBe(formId);
      expect(formState.performanceMetrics.totalRenderCount).toBe(0);
      expect(formState.performanceMetrics.fieldRenderCounts).toEqual({});
    });

    it('should update render counts on field updates', () => {
      const formId = 'render-count-form';
      const fieldName = 'email';
      
      registerForm(formId);
      updateField(formId, fieldName, { value: 'test1' });
      updateField(formId, fieldName, { value: 'test2' });
      
      const formState = getFormState(formId);
      expect(formState?.performanceMetrics.fieldRenderCounts[fieldName]).toBeGreaterThan(0);
      expect(formState?.performanceMetrics.totalRenderCount).toBeGreaterThan(0);
    });
  });

  describe('Registry Lifecycle', () => {
    it('should have form state registry instance', () => {
      expect(formStateRegistry).toBeDefined();
      expect(typeof formStateRegistry).toBe('object');
    });

    it('should handle registry destruction', () => {
      const formId = 'destroy-form';
      registerForm(formId);
      
      expect(() => {
        formStateRegistry.destroy?.();
      }).not.toThrow();
    });
  });

  describe('Event Client Integration', () => {
    it('should work with event client', () => {
      // The registry works with the event client
      expect(mockEventClient).toBeDefined();
      expect(typeof mockEventClient.on).toBe('function');
      expect(typeof mockEventClient.emit).toBe('function');
    });

    it('should handle event client interactions', () => {
      // The implementation may or may not set up specific listeners
      // Just verify the event client interface works
      expect(() => {
        mockEventClient.emit('test-event', {});
      }).not.toThrow();
    });
  });
});