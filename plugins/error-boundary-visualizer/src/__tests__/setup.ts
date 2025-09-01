import '@testing-library/jest-dom'
import { vi, beforeEach, beforeAll } from 'vitest'

// Mock window.matchMedia - ensure it's available globally
const mockMatchMedia = vi.fn().mockImplementation((query?: string) => ({
  matches: query === '(prefers-color-scheme: dark)',
  media: query || '',
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
}));

// Set up matchMedia immediately before any imports
beforeAll(() => {
  // Set up matchMedia on both window and global for jsdom
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: mockMatchMedia,
  });

  Object.defineProperty(global, 'matchMedia', {
    writable: true,
    configurable: true,
    value: mockMatchMedia,
  });
});

// Also set it up immediately for module initialization
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: mockMatchMedia,
  });
}

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock IntersectionObserver  
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock requestAnimationFrame
global.requestAnimationFrame = vi.fn(cb => setTimeout(cb, 16))
global.cancelAnimationFrame = vi.fn()

// Suppress specific console warnings during tests
const originalConsoleWarn = console.warn
console.warn = (message: any, ...args: any[]) => {
  // Suppress React warnings that are not relevant to our tests
  if (typeof message === 'string' && (
    message.includes('React does not recognize') ||
    message.includes('validateDOMNesting')
  )) {
    return
  }
  originalConsoleWarn(message, ...args)
}

// Set up fake timers if needed
beforeEach(() => {
  vi.clearAllMocks();
  // Ensure matchMedia is always available
  if (!window.matchMedia) {
    window.matchMedia = mockMatchMedia;
  }
});