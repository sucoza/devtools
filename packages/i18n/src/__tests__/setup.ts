/**
 * Test setup for @sucoza/i18n
 */

// Mock console methods if needed
global.console = {
  ...console,
  // Uncomment to suppress logs during tests
  // log: vi.fn(),
  // warn: vi.fn(),
  // error: vi.fn(),
};