import React from 'react'
import '@testing-library/jest-dom'
import { vi, beforeEach } from 'vitest'

// Mock @lingui/macro since the babel transform doesn't run in vitest
vi.mock('@lingui/macro', () => ({
  t: (strings: TemplateStringsArray, ...values: unknown[]) =>
    strings.reduce((result, str, i) => result + str + (values[i] ?? ''), ''),
  Trans: ({ children }: { children?: React.ReactNode }) =>
    React.createElement(React.Fragment, null, children),
  Plural: ({ value, one, other }: { value: number; one: string; other: string }) =>
    React.createElement(React.Fragment, null, value === 1 ? one : other),
}));

// Mock window.matchMedia for theme detection (use plain function to survive vi.clearAllMocks)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  configurable: true,
  value: (query: string) => ({
    matches: query === '(prefers-color-scheme: dark)',
    media: query || '',
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

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
global.requestAnimationFrame = vi.fn((cb) => {
  setTimeout(cb, 16);
  return 1; // Return a number as expected by requestAnimationFrame
}) as any;
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
});