import '@testing-library/jest-dom/vitest';
import React from 'react';
import { vi } from 'vitest';

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

// Mock axe-core since it might not be available in test environment
vi.mock('axe-core', () => ({
  run: vi.fn().mockResolvedValue({
    violations: [],
    passes: [],
    inapplicable: [],
    incomplete: [],
  }),
  configure: vi.fn(),
  reset: vi.fn(),
}));

// Mock color.js for color contrast calculations
vi.mock('colorjs.io', () => ({
  default: class Color {
    constructor(public color: string) {}
    get(prop: string) {
      return prop === 'lch' ? { l: 50 } : 0.5;
    }
    contrast(_other: any) {
      return 4.5; // Mock good contrast ratio
    }
  }
}));