/**
 * Playwright Mock Implementation
 * Mock for Playwright Core used in test generation
 */

import { vi } from 'vitest';

export const mockPage = {
  // Navigation
  goto: vi.fn().mockResolvedValue(undefined),
  goBack: vi.fn().mockResolvedValue(undefined),
  goForward: vi.fn().mockResolvedValue(undefined),
  reload: vi.fn().mockResolvedValue(undefined),
  
  // Element interactions
  click: vi.fn().mockResolvedValue(undefined),
  dblclick: vi.fn().mockResolvedValue(undefined),
  fill: vi.fn().mockResolvedValue(undefined),
  type: vi.fn().mockResolvedValue(undefined),
  press: vi.fn().mockResolvedValue(undefined),
  hover: vi.fn().mockResolvedValue(undefined),
  focus: vi.fn().mockResolvedValue(undefined),
  blur: vi.fn().mockResolvedValue(undefined),
  selectOption: vi.fn().mockResolvedValue(undefined),
  check: vi.fn().mockResolvedValue(undefined),
  uncheck: vi.fn().mockResolvedValue(undefined),
  
  // Locators
  locator: vi.fn().mockReturnValue({
    click: vi.fn().mockResolvedValue(undefined),
    fill: vi.fn().mockResolvedValue(undefined),
    type: vi.fn().mockResolvedValue(undefined),
    hover: vi.fn().mockResolvedValue(undefined),
    isVisible: vi.fn().mockResolvedValue(true),
    isHidden: vi.fn().mockResolvedValue(false),
    isEnabled: vi.fn().mockResolvedValue(true),
    isDisabled: vi.fn().mockResolvedValue(false),
    isChecked: vi.fn().mockResolvedValue(false),
    textContent: vi.fn().mockResolvedValue('Mock text content'),
    innerText: vi.fn().mockResolvedValue('Mock inner text'),
    innerHTML: vi.fn().mockResolvedValue('<div>Mock HTML</div>'),
    getAttribute: vi.fn().mockResolvedValue('mock-attribute-value'),
    count: vi.fn().mockResolvedValue(1),
    nth: vi.fn().mockReturnThis(),
    first: vi.fn().mockReturnThis(),
    last: vi.fn().mockReturnThis(),
    waitFor: vi.fn().mockResolvedValue(undefined),
    screenshot: vi.fn().mockResolvedValue(Buffer.from('mock-screenshot')),
    boundingBox: vi.fn().mockResolvedValue({
      x: 100,
      y: 100,
      width: 200,
      height: 50,
    }),
  }),
  
  // Query selectors
  $: vi.fn().mockResolvedValue({
    click: vi.fn().mockResolvedValue(undefined),
    textContent: vi.fn().mockResolvedValue('Mock text'),
    getAttribute: vi.fn().mockResolvedValue('mock-value'),
    boundingBox: vi.fn().mockResolvedValue({
      x: 100,
      y: 100,
      width: 200,
      height: 50,
    }),
  }),
  $$: vi.fn().mockResolvedValue([
    {
      click: vi.fn().mockResolvedValue(undefined),
      textContent: vi.fn().mockResolvedValue('Mock text 1'),
    },
    {
      click: vi.fn().mockResolvedValue(undefined),
      textContent: vi.fn().mockResolvedValue('Mock text 2'),
    },
  ]),
  
  // Waiting
  waitForSelector: vi.fn().mockResolvedValue({
    click: vi.fn().mockResolvedValue(undefined),
    textContent: vi.fn().mockResolvedValue('Mock text'),
  }),
  waitForFunction: vi.fn().mockResolvedValue(undefined),
  waitForTimeout: vi.fn().mockResolvedValue(undefined),
  waitForLoadState: vi.fn().mockResolvedValue(undefined),
  waitForNavigation: vi.fn().mockResolvedValue(undefined),
  waitForRequest: vi.fn().mockResolvedValue({
    url: 'https://example.com/api/test',
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    postData: '{"test": "data"}',
  }),
  waitForResponse: vi.fn().mockResolvedValue({
    url: 'https://example.com/api/test',
    status: 200,
    headers: { 'content-type': 'application/json' },
    json: vi.fn().mockResolvedValue({ success: true }),
    text: vi.fn().mockResolvedValue('{"success": true}'),
  }),
  
  // Screenshots
  screenshot: vi.fn().mockResolvedValue(Buffer.from('mock-screenshot')),
  
  // Evaluation
  evaluate: vi.fn().mockResolvedValue('mock-result'),
  evaluateHandle: vi.fn().mockResolvedValue({
    jsonValue: vi.fn().mockResolvedValue('mock-json-value'),
    dispose: vi.fn().mockResolvedValue(undefined),
  }),
  
  // Page properties
  url: vi.fn().mockReturnValue('https://example.com/test-page'),
  title: vi.fn().mockResolvedValue('Test Page Title'),
  content: vi.fn().mockResolvedValue('<html><body>Mock page content</body></html>'),
  
  // Viewport
  setViewportSize: vi.fn().mockResolvedValue(undefined),
  viewportSize: vi.fn().mockReturnValue({ width: 1024, height: 768 }),
  
  // Events
  on: vi.fn(),
  off: vi.fn(),
  once: vi.fn(),
  
  // Network
  route: vi.fn().mockResolvedValue(undefined),
  unroute: vi.fn().mockResolvedValue(undefined),
  
  // Cookies
  addCookie: vi.fn().mockResolvedValue(undefined),
  clearCookies: vi.fn().mockResolvedValue(undefined),
  cookies: vi.fn().mockResolvedValue([]),
  
  // Context
  context: vi.fn().mockReturnValue({
    newPage: vi.fn().mockResolvedValue(mockPage),
    close: vi.fn().mockResolvedValue(undefined),
  }),
  
  // Closing
  close: vi.fn().mockResolvedValue(undefined),
  isClosed: vi.fn().mockReturnValue(false),
};

export const mockBrowser = {
  newContext: vi.fn().mockResolvedValue({
    newPage: vi.fn().mockResolvedValue(mockPage),
    pages: vi.fn().mockReturnValue([mockPage]),
    close: vi.fn().mockResolvedValue(undefined),
  }),
  newPage: vi.fn().mockResolvedValue(mockPage),
  contexts: vi.fn().mockReturnValue([]),
  close: vi.fn().mockResolvedValue(undefined),
  isConnected: vi.fn().mockReturnValue(true),
};

export const mockBrowserType = {
  launch: vi.fn().mockResolvedValue(mockBrowser),
  connect: vi.fn().mockResolvedValue(mockBrowser),
  connectOverCDP: vi.fn().mockResolvedValue(mockBrowser),
  launchPersistentContext: vi.fn().mockResolvedValue({
    newPage: vi.fn().mockResolvedValue(mockPage),
    close: vi.fn().mockResolvedValue(undefined),
  }),
  name: vi.fn().mockReturnValue('chromium'),
  executablePath: vi.fn().mockReturnValue('/mock/path/to/browser'),
};

export const mockPlaywright = {
  chromium: mockBrowserType,
  firefox: mockBrowserType,
  webkit: mockBrowserType,
  devices: {
    'Desktop Chrome': {
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      viewport: { width: 1280, height: 720 },
      deviceScaleFactor: 1,
      isMobile: false,
      hasTouch: false,
    },
    'iPhone 12': {
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_4 like Mac OS X) AppleWebKit/605.1.15',
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 3,
      isMobile: true,
      hasTouch: true,
    },
  },
  selectors: {
    register: vi.fn(),
    setTestIdAttribute: vi.fn(),
  },
  expect: {
    configure: vi.fn(),
  },
};

// Mock the main playwright-core module
export default mockPlaywright;

// Mock specific exports
export const chromium = mockBrowserType;
export const firefox = mockBrowserType;
export const webkit = mockBrowserType;
export const devices = mockPlaywright.devices;
export const selectors = mockPlaywright.selectors;