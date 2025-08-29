import { formStateEventClient } from './formEventClient';
import { formStateRegistry, updateField } from './formStateTracker';
import type { FieldHistoryEntry, FormState } from './formEventClient';

export interface ReplayOptions {
  speed?: number; // Replay speed multiplier (1 = normal, 2 = 2x faster, 0.5 = half speed)
  startFrom?: number; // Timestamp to start replay from
  endAt?: number; // Timestamp to end replay at
  skipValidation?: boolean; // Skip validation during replay
  onStep?: (entry: FieldHistoryEntry, progress: number) => void; // Callback for each step
  onComplete?: () => void; // Callback when replay completes
}

export class FormReplayEngine {
  private isReplaying: boolean = false;
  private currentReplayId: string | null = null;
  private replayAbortController: AbortController | null = null;

  /**
   * Replay form interactions from history
   */
  async replayForm(formId: string, options: ReplayOptions = {}): Promise<void> {
    const {
      speed = 1,
      startFrom,
      endAt,
      skipValidation = false,
      onStep,
      onComplete
    } = options;

    // Stop any existing replay
    this.stopReplay();

    const formState = formStateRegistry.getFormState(formId);
    if (!formState || !formState.fieldHistory.length) {
      console.warn(`No history available for form ${formId}`);
      return;
    }

    this.isReplaying = true;
    this.currentReplayId = formId;
    this.replayAbortController = new AbortController();

    // Filter history based on time range
    let history = [...formState.fieldHistory];
    if (startFrom) {
      history = history.filter(entry => entry.timestamp >= startFrom);
    }
    if (endAt) {
      history = history.filter(entry => entry.timestamp <= endAt);
    }

    // Reset form to initial state
    formStateRegistry.resetForm(formId);

    // Emit replay start event
    formStateEventClient.emit('form-replay-start', {
      formId,
      startTimestamp: Date.now()
    });

    const totalSteps = history.length;
    let currentStep = 0;

    try {
      for (const entry of history) {
        // Check if replay was aborted
        if (this.replayAbortController.signal.aborted) {
          break;
        }

        currentStep++;
        const progress = (currentStep / totalSteps) * 100;

        // Apply the field change
        await this.applyHistoryEntry(formId, entry, skipValidation);

        // Emit step event
        formStateEventClient.emit('form-replay-step', {
          formId,
          historyEntry: entry
        });

        // Call step callback if provided
        if (onStep) {
          onStep(entry, progress);
        }

        // Calculate delay based on timestamp difference and speed
        if (currentStep < history.length) {
          const nextEntry = history[currentStep];
          const delay = Math.max(50, (nextEntry.timestamp - entry.timestamp) / speed);
          
          await this.delay(Math.min(delay, 1000)); // Cap at 1 second max delay
        }
      }

      // Emit replay complete event
      formStateEventClient.emit('form-replay-complete', {
        formId,
        duration: Date.now()
      });

      // Call complete callback if provided
      if (onComplete) {
        onComplete();
      }
    } catch (error) {
      console.error('Error during form replay:', error);
    } finally {
      this.isReplaying = false;
      this.currentReplayId = null;
      this.replayAbortController = null;
    }
  }

  /**
   * Stop the current replay
   */
  stopReplay(): void {
    if (this.replayAbortController) {
      this.replayAbortController.abort();
    }
    this.isReplaying = false;
    this.currentReplayId = null;
  }

  /**
   * Apply a single history entry to the form
   */
  private async applyHistoryEntry(
    formId: string,
    entry: FieldHistoryEntry,
    skipValidation: boolean
  ): Promise<void> {
    switch (entry.action) {
      case 'change':
        updateField(formId, entry.fieldName, {
          value: entry.value,
          isDirty: true,
          isPristine: false
        });
        
        if (!skipValidation) {
          await formStateRegistry.validateField(formId, entry.fieldName);
        }
        break;
        
      case 'focus':
        updateField(formId, entry.fieldName, {
          isTouched: true
        });
        break;
        
      case 'blur':
        if (!skipValidation) {
          await formStateRegistry.validateField(formId, entry.fieldName);
        }
        break;
        
      case 'reset':
        formStateRegistry.resetForm(formId);
        break;
    }
  }

  /**
   * Create a delay promise
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Export form history for analysis or storage
   */
  exportFormHistory(formId: string): string {
    const formState = formStateRegistry.getFormState(formId);
    if (!formState) {
      throw new Error(`Form ${formId} not found`);
    }

    const exportData = {
      formId,
      timestamp: Date.now(),
      fieldHistory: formState.fieldHistory,
      performanceMetrics: formState.performanceMetrics,
      accessibilityIssues: formState.accessibilityIssues,
      fields: Object.entries(formState.fields).map(([name, field]) => ({
        name,
        type: field.type,
        isRequired: field.isRequired,
        finalValue: field.value,
        renderCount: field.renderCount
      }))
    };

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Import and replay form history
   */
  async importAndReplay(jsonData: string, options?: ReplayOptions): Promise<void> {
    try {
      const data = JSON.parse(jsonData);
      
      if (!data.formId || !data.fieldHistory) {
        throw new Error('Invalid import data format');
      }

      // Create a temporary form state with the imported history
      const tempFormId = `imported-${data.formId}-${Date.now()}`;
      const formState = formStateRegistry.registerForm(tempFormId);
      
      // Import the history
      formState.fieldHistory = data.fieldHistory;
      
      // Replay the imported form
      await this.replayForm(tempFormId, options);
      
      // Clean up temporary form
      formStateRegistry.unregisterForm(tempFormId);
    } catch (error) {
      console.error('Error importing form history:', error);
      throw error;
    }
  }

  /**
   * Generate test data for form fields
   */
  generateMockData(formId: string): Record<string, any> {
    const formState = formStateRegistry.getFormState(formId);
    if (!formState) {
      throw new Error(`Form ${formId} not found`);
    }

    const mockData: Record<string, any> = {};

    Object.entries(formState.fields).forEach(([fieldName, field]) => {
      mockData[fieldName] = this.generateMockValue(field);
    });

    return mockData;
  }

  /**
   * Generate a mock value based on field type
   */
  private generateMockValue(field: FieldState): any {
    switch (field.type) {
      case 'email':
        return `test.user.${Date.now()}@example.com`;
      case 'tel':
        return '+1-555-0123';
      case 'number':
        return Math.floor(Math.random() * 100);
      case 'date':
        return new Date().toISOString().split('T')[0];
      case 'datetime-local':
        return new Date().toISOString().slice(0, 16);
      case 'checkbox':
        return Math.random() > 0.5;
      case 'radio':
        return 'option1';
      case 'select':
        return 'option1';
      case 'textarea':
        return 'This is a test message generated for form testing purposes.';
      case 'password':
        return 'TestPassword123!';
      case 'url':
        return 'https://example.com';
      case 'color':
        return '#' + Math.floor(Math.random()*16777215).toString(16);
      case 'range':
        return 50;
      default:
        return `Test ${field.name} value`;
    }
  }

  /**
   * Fill form with mock data
   */
  async fillWithMockData(formId: string, options: { validate?: boolean } = {}): Promise<void> {
    const mockData = this.generateMockData(formId);
    
    for (const [fieldName, value] of Object.entries(mockData)) {
      updateField(formId, fieldName, {
        value,
        isDirty: true,
        isPristine: false,
        isTouched: true
      });
      
      if (options.validate) {
        await formStateRegistry.validateField(formId, fieldName);
      }
      
      // Small delay to simulate user typing
      await this.delay(100);
    }
  }

  /**
   * Check if a replay is currently in progress
   */
  isReplayInProgress(): boolean {
    return this.isReplaying;
  }

  /**
   * Get the current replay form ID
   */
  getCurrentReplayFormId(): string | null {
    return this.currentReplayId;
  }
}

// Global replay engine instance
export const formReplayEngine = new FormReplayEngine();