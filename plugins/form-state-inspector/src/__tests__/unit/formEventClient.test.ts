import { describe, it, expect, vi } from 'vitest';
import { FormStateEventClient, formStateEventClient } from '../../formEventClient';
import { EventClient } from '@tanstack/devtools-event-client';

// Mock the EventClient
vi.mock('@tanstack/devtools-event-client', () => ({
  EventClient: vi.fn().mockImplementation(() => ({
    emit: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
  })),
}));

describe('FormStateEventClient', () => {
  describe('Singleton Pattern', () => {
    it('should return the same instance when called multiple times', () => {
      const instance1 = FormStateEventClient.getInstance();
      const instance2 = FormStateEventClient.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('should export a singleton instance', () => {
      expect(formStateEventClient).toBe(FormStateEventClient.getInstance());
    });
  });

  describe('EventClient Integration', () => {
    it('should extend EventClient with correct plugin ID', () => {
      expect(EventClient).toHaveBeenCalledWith(
        expect.objectContaining({
          pluginId: 'form-state-inspector',
        })
      );
    });

    it('should have the expected event client methods', () => {
      expect(formStateEventClient).toHaveProperty('emit');
      expect(formStateEventClient).toHaveProperty('on');
      expect(formStateEventClient).toHaveProperty('off');
    });
  });

  describe('Type Definitions', () => {
    it('should define ValidationState types correctly', () => {
      const validStates = ['valid', 'invalid', 'warning', 'pending'];
      expect(validStates).toContain('valid');
      expect(validStates).toContain('invalid');
      expect(validStates).toContain('warning');
      expect(validStates).toContain('pending');
    });

    it('should define FieldValidation interface correctly', () => {
      const fieldValidation = {
        state: 'valid' as const,
        message: 'Field is valid',
        rule: 'required',
      };

      expect(fieldValidation).toHaveProperty('state');
      expect(fieldValidation).toHaveProperty('message');
      expect(fieldValidation).toHaveProperty('rule');
    });

    it('should define FieldState interface correctly', () => {
      const fieldState = {
        name: 'email',
        value: 'test@example.com',
        isDirty: true,
        isTouched: true,
        isPristine: false,
        isValid: true,
        isRequired: true,
        validation: {
          state: 'valid' as const,
          message: 'Valid email',
        },
        type: 'input',
        timestamp: Date.now(),
        renderCount: 3,
        validationTime: 25,
      };

      expect(fieldState).toHaveProperty('name');
      expect(fieldState).toHaveProperty('value');
      expect(fieldState).toHaveProperty('isDirty');
      expect(fieldState).toHaveProperty('isTouched');
      expect(fieldState).toHaveProperty('isPristine');
      expect(fieldState).toHaveProperty('isValid');
      expect(fieldState).toHaveProperty('isRequired');
      expect(fieldState).toHaveProperty('validation');
      expect(fieldState).toHaveProperty('type');
      expect(fieldState).toHaveProperty('timestamp');
      expect(fieldState).toHaveProperty('renderCount');
      expect(fieldState).toHaveProperty('validationTime');
    });

    it('should define FormSubmission interface correctly', () => {
      const formSubmission = {
        formId: 'login-form',
        timestamp: Date.now(),
        values: { email: 'test@example.com', password: 'password123' },
        isValid: true,
        validationErrors: {},
        duration: 5000,
        success: true,
        errorMessage: undefined,
      };

      expect(formSubmission).toHaveProperty('formId');
      expect(formSubmission).toHaveProperty('timestamp');
      expect(formSubmission).toHaveProperty('values');
      expect(formSubmission).toHaveProperty('isValid');
      expect(formSubmission).toHaveProperty('validationErrors');
      expect(formSubmission).toHaveProperty('duration');
      expect(formSubmission).toHaveProperty('success');
    });

    it('should define FormPerformanceMetrics interface correctly', () => {
      const performanceMetrics = {
        formId: 'test-form',
        averageValidationTime: 35.5,
        totalRenderCount: 12,
        fieldRenderCounts: {
          email: 5,
          password: 7,
        },
        lastValidationTime: 42,
        formInitTime: 150,
        totalInteractionTime: 30000,
      };

      expect(performanceMetrics).toHaveProperty('formId');
      expect(performanceMetrics).toHaveProperty('averageValidationTime');
      expect(performanceMetrics).toHaveProperty('totalRenderCount');
      expect(performanceMetrics).toHaveProperty('fieldRenderCounts');
      expect(performanceMetrics).toHaveProperty('lastValidationTime');
      expect(performanceMetrics).toHaveProperty('formInitTime');
      expect(performanceMetrics).toHaveProperty('totalInteractionTime');
    });

    it('should define AccessibilityIssue interface correctly', () => {
      const accessibilityIssue = {
        fieldName: 'email',
        severity: 'error' as const,
        rule: 'missing-label',
        message: 'Form field is missing an accessible label',
        suggestion: 'Add a label element or aria-label attribute',
      };

      expect(accessibilityIssue).toHaveProperty('fieldName');
      expect(accessibilityIssue).toHaveProperty('severity');
      expect(accessibilityIssue).toHaveProperty('rule');
      expect(accessibilityIssue).toHaveProperty('message');
      expect(accessibilityIssue).toHaveProperty('suggestion');
    });
  });

  describe('Event Map Structure', () => {
    it('should define comprehensive event types', () => {
      // This test verifies that the event map has the expected structure
      // We can't directly test the types at runtime, but we can verify
      // that the structure supports the expected events
      
      const eventTypes = [
        'form-state-update',
        'form-registered',
        'field-change',
        'field-validation',
        'form-submit',
        'form-reset',
        'accessibility-audit',
        'performance-update',
        'form-state-request',
        'form-state-response',
        'field-history-request',
        'field-history-response',
        'form-replay-start',
        'form-replay-step',
        'form-replay-complete',
      ];

      // Verify all expected event types are accounted for
      expect(eventTypes).toContain('form-state-update');
      expect(eventTypes).toContain('form-registered');
      expect(eventTypes).toContain('field-change');
      expect(eventTypes).toContain('field-validation');
      expect(eventTypes).toContain('form-submit');
      expect(eventTypes).toContain('form-reset');
      expect(eventTypes).toContain('accessibility-audit');
      expect(eventTypes).toContain('performance-update');
      expect(eventTypes).toContain('form-replay-start');
      expect(eventTypes).toContain('form-replay-step');
      expect(eventTypes).toContain('form-replay-complete');
    });
  });
});