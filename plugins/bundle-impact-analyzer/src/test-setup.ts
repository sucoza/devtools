import '@testing-library/jest-dom';

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