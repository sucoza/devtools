/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock PerformanceObserver before importing the module
vi.stubGlobal('PerformanceObserver', class {
  observe() {}
  disconnect() {}
});

// We need to test the FormStateRegistry class.
// Since it's instantiated as a singleton, we'll test via the exported functions.
import { formStateRegistry } from './formStateTracker';

describe('FormStateRegistry', () => {
  beforeEach(() => {
    // Clean up between tests
    formStateRegistry.destroy();
  });

  describe('registerForm', () => {
    it('creates a form with initial state', () => {
      const state = formStateRegistry.registerForm('test-form');
      expect(state.formId).toBe('test-form');
      expect(state.isValid).toBe(true);
      expect(state.isDirty).toBe(false);
      expect(state.submitCount).toBe(0);
      expect(state.performanceMetrics.averageValidationTime).toBe(0);
    });
  });

  describe('updatePerformanceMetrics — running average fix', () => {
    it('calculates correct running average for validation times', () => {
      formStateRegistry.registerForm('avg-form');

      // Simulate performance entries by calling the internal method
      // Since updatePerformanceMetrics is private, we'll test via the public API
      // by directly checking the form state after metric updates.
      // We access the private method through any cast for testing purposes.
      const registry = formStateRegistry as any;

      registry.updatePerformanceMetrics('avg-form', 10);
      let state = formStateRegistry.getFormState('avg-form');
      // After 1 validation of 10ms: average should be 10
      expect(state!.performanceMetrics.averageValidationTime).toBe(10);

      registry.updatePerformanceMetrics('avg-form', 20);
      state = formStateRegistry.getFormState('avg-form');
      // After 2 validations of [10, 20]: average should be 15
      expect(state!.performanceMetrics.averageValidationTime).toBe(15);

      registry.updatePerformanceMetrics('avg-form', 30);
      state = formStateRegistry.getFormState('avg-form');
      // After 3 validations of [10, 20, 30]: average should be 20
      expect(state!.performanceMetrics.averageValidationTime).toBe(20);
    });

    it('handles single validation correctly', () => {
      formStateRegistry.registerForm('single-form');
      const registry = formStateRegistry as any;

      registry.updatePerformanceMetrics('single-form', 42);
      const state = formStateRegistry.getFormState('single-form');
      expect(state!.performanceMetrics.averageValidationTime).toBe(42);
      expect(state!.performanceMetrics.lastValidationTime).toBe(42);
    });

    it('handles zero validation time correctly', () => {
      formStateRegistry.registerForm('zero-form');
      const registry = formStateRegistry as any;

      registry.updatePerformanceMetrics('zero-form', 0);
      const state = formStateRegistry.getFormState('zero-form');
      expect(state!.performanceMetrics.averageValidationTime).toBe(0);
    });

    it('ignores updates for nonexistent forms', () => {
      const registry = formStateRegistry as any;
      // Should not throw
      registry.updatePerformanceMetrics('nonexistent', 100);
    });
  });

  describe('unregisterForm', () => {
    it('removes form and cleans up validation counts', () => {
      formStateRegistry.registerForm('cleanup-form');
      const registry = formStateRegistry as any;
      registry.updatePerformanceMetrics('cleanup-form', 50);

      formStateRegistry.unregisterForm('cleanup-form');

      // Form should be gone
      expect(formStateRegistry.getFormState('cleanup-form')).toBeUndefined();

      // Re-register and validate the average starts fresh
      formStateRegistry.registerForm('cleanup-form');
      registry.updatePerformanceMetrics('cleanup-form', 100);
      const state = formStateRegistry.getFormState('cleanup-form');
      // Should be 100 (not blended with old 50)
      expect(state!.performanceMetrics.averageValidationTime).toBe(100);
    });
  });

  describe('destroy', () => {
    it('cleans up all forms and state', () => {
      formStateRegistry.registerForm('form-1');
      formStateRegistry.registerForm('form-2');

      formStateRegistry.destroy();

      expect(formStateRegistry.getFormState('form-1')).toBeUndefined();
      expect(formStateRegistry.getFormState('form-2')).toBeUndefined();
    });
  });
});
