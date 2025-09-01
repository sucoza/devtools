import '@testing-library/jest-dom/vitest';

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
    contrast(other: any) {
      return 4.5; // Mock good contrast ratio
    }
  }
}));