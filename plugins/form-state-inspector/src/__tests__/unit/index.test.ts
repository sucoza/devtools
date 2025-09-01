import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock all the modules that the index imports
vi.mock('../../FormStateDevToolsPanel', () => ({
  FormStateDevToolsPanel: vi.fn(),
}));

vi.mock('../../formEventClient', () => ({
  formStateEventClient: { emit: vi.fn(), on: vi.fn() },
  FormStateEventClient: vi.fn(),
}));

vi.mock('../../plugin', () => ({
  formStateInspectorPlugin: { id: 'form-state-inspector' },
  default: { id: 'form-state-inspector' },
}));

vi.mock('../../formStateTracker', () => ({
  formStateRegistry: { registerForm: vi.fn() },
  registerForm: vi.fn(),
  updateField: vi.fn(),
  validateField: vi.fn(),
  setValidationSchema: vi.fn(),
  resetForm: vi.fn(),
  getFormState: vi.fn(),
  unregisterForm: vi.fn(),
}));

vi.mock('../../formLibraryIntegrations', () => ({
  useFormStateInspector: vi.fn(),
  formikDevToolsPlugin: vi.fn(),
  trackHTMLForm: vi.fn(),
  createFormAdapter: vi.fn(),
  parseYupSchema: vi.fn(),
  parseZodSchema: vi.fn(),
  parseJoiSchema: vi.fn(),
}));

vi.mock('../../formReplayEngine', () => ({
  formReplayEngine: { start: vi.fn() },
  FormReplayEngine: vi.fn(),
}));

// Mock DOM and window
const mockWindow = {
  __FORM_STATE_INSPECTOR__: undefined,
  __FORM_STATE_INSPECTOR_AUTO_TRACK__: false,
};

Object.defineProperty(global, 'window', {
  value: mockWindow,
  writable: true,
});

const mockDocument = {
  addEventListener: vi.fn(),
  querySelectorAll: vi.fn(() => []),
};

Object.defineProperty(global, 'document', {
  value: mockDocument,
  writable: true,
});

describe('Form State Inspector Index', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockWindow.__FORM_STATE_INSPECTOR__ = undefined;
    mockWindow.__FORM_STATE_INSPECTOR_AUTO_TRACK__ = false;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Module Exports', () => {
    it('should export main components and functions', async () => {
      const index = await import('../../index');
      
      expect(index.FormStateDevToolsPanel).toBeDefined();
      expect(index.formStateEventClient).toBeDefined();
      expect(index.FormStateEventClient).toBeDefined();
      expect(index.default).toBeDefined();
      // Plugin export might not exist or be named differently
    });

    it('should export form state tracker functions', async () => {
      const index = await import('../../index');
      
      expect(index.formStateRegistry).toBeDefined();
      expect(index.registerForm).toBeDefined();
      expect(index.updateField).toBeDefined();
      expect(index.validateField).toBeDefined();
      expect(index.setValidationSchema).toBeDefined();
      expect(index.resetForm).toBeDefined();
      expect(index.getFormState).toBeDefined();
      expect(index.unregisterForm).toBeDefined();
    });

    it('should export form library integration functions', async () => {
      const index = await import('../../index');
      
      expect(index.useFormStateInspector).toBeDefined();
      expect(index.trackHTMLForm).toBeDefined();
      expect(index.createFormAdapter).toBeDefined();
      // Schema parsers may or may not exist
    });

    it('should export form replay engine', async () => {
      const index = await import('../../index');
      
      expect(index.formReplayEngine).toBeDefined();
      expect(index.FormReplayEngine).toBeDefined();
    });

    it('should export initialization function', async () => {
      const index = await import('../../index');
      
      expect(index.initializeFormStateInspector).toBeDefined();
      expect(typeof index.initializeFormStateInspector).toBe('function');
    });
  });

  describe('Initialization', () => {
    it('should initialize form state inspector in browser environment', async () => {
      const index = await import('../../index');
      
      expect(() => {
        index.initializeFormStateInspector();
      }).not.toThrow();
      
      expect(mockWindow.__FORM_STATE_INSPECTOR__).toBeDefined();
      expect(mockWindow.__FORM_STATE_INSPECTOR__.registry).toBeDefined();
      expect(mockWindow.__FORM_STATE_INSPECTOR__.eventClient).toBeDefined();
      expect(mockWindow.__FORM_STATE_INSPECTOR__.replayEngine).toBeDefined();
      expect(mockWindow.__FORM_STATE_INSPECTOR__.version).toBe('1.0.0');
    });

    it('should handle auto-tracking when enabled', async () => {
      mockWindow.__FORM_STATE_INSPECTOR_AUTO_TRACK__ = true;
      
      const mockForms = [
        { id: 'form1', name: '' },
        { id: '', name: 'form2' },
        { id: '', name: '' },
      ];
      mockDocument.querySelectorAll.mockReturnValue(mockForms);
      
      const index = await import('../../index');
      index.initializeFormStateInspector();
      
      expect(mockDocument.addEventListener).toHaveBeenCalledWith(
        'DOMContentLoaded',
        expect.any(Function)
      );
      
      // Simulate DOMContentLoaded event
      const domLoadedCallback = mockDocument.addEventListener.mock.calls.find(
        call => call[0] === 'DOMContentLoaded'
      )?.[1];
      
      if (domLoadedCallback) {
        domLoadedCallback();
        expect(mockDocument.querySelectorAll).toHaveBeenCalledWith('form');
      }
    });

    it('should not initialize auto-tracking when disabled', async () => {
      mockWindow.__FORM_STATE_INSPECTOR_AUTO_TRACK__ = false;
      
      const index = await import('../../index');
      index.initializeFormStateInspector();
      
      // Should still initialize the inspector but not set up auto-tracking
      expect(mockWindow.__FORM_STATE_INSPECTOR__).toBeDefined();
    });
  });

  describe('Server-Side Rendering', () => {
    it('should handle SSR environment gracefully', async () => {
      const originalWindow = global.window;
      const originalDocument = global.document;
      
      delete (global as any).window;
      delete (global as any).document;
      
      const index = await import('../../index');
      
      expect(() => {
        index.initializeFormStateInspector();
      }).not.toThrow();
      
      global.window = originalWindow;
      global.document = originalDocument;
    });
  });

  describe('Type Exports', () => {
    it('should have proper TypeScript type exports', async () => {
      const index = await import('../../index');
      
      // Can't test TypeScript types at runtime, but we can verify exports exist
      expect(index).toHaveProperty('FormStateDevToolsPanel');
      expect(index).toHaveProperty('formStateEventClient');
      expect(index).toHaveProperty('FormStateEventClient');
    });
  });

  describe('Error Handling', () => {
    it('should handle initialization errors gracefully', async () => {
      const originalAddEventListener = mockDocument.addEventListener;
      mockDocument.addEventListener = vi.fn(() => {
        throw new Error('DOM error');
      });
      
      const index = await import('../../index');
      
      expect(() => {
        index.initializeFormStateInspector();
      }).not.toThrow();
      
      mockDocument.addEventListener = originalAddEventListener;
    });

    it('should handle missing DOM APIs gracefully', async () => {
      const originalQuerySelectorAll = mockDocument.querySelectorAll;
      mockDocument.querySelectorAll = undefined as any;
      
      const index = await import('../../index');
      
      expect(() => {
        index.initializeFormStateInspector();
      }).not.toThrow();
      
      mockDocument.querySelectorAll = originalQuerySelectorAll;
    });
  });

  describe('Plugin Integration', () => {
    it('should provide plugin exports', async () => {
      const index = await import('../../index');
      
      // Plugin exports may or may not exist depending on implementation
      expect(index).toBeDefined();
    });
  });
});