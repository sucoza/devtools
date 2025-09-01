import '@testing-library/jest-dom';

// Fix for React 19 and @testing-library/react compatibility
// React 19 requires globalThis.IS_REACT_ACT_ENVIRONMENT to be set
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

// Mock window.matchMedia since it's not available in jsdom
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {}, // deprecated
    removeListener: () => {}, // deprecated
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock MutationObserver
global.MutationObserver = class MutationObserver {
  constructor(public callback: MutationCallback) {}
  observe() {}
  disconnect() {}
  takeRecords(): MutationRecord[] {
    return [];
  }
};

// Mock PerformanceObserver
global.PerformanceObserver = class PerformanceObserver {
  static readonly supportedEntryTypes: readonly string[] = ['navigation', 'measure', 'mark'];
  
  constructor(public callback: PerformanceObserverCallback) {}
  observe() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
};

// Mock dynamic import function for testing
if (typeof window !== 'undefined') {
  (window as any).__original_import__ = (specifier: string) => {
    return Promise.resolve({ default: {}, [specifier]: 'mocked' });
  };
  
  // Mock window.eval to prevent dynamic import evaluation issues
  const originalEval = window.eval;
  window.eval = (code: string) => {
    // If it's trying to evaluate import statements, return a mock
    if (code.includes('import') || code.includes('__original_import__')) {
      return () => Promise.resolve({ default: {} });
    }
    return originalEval(code);
  };
}