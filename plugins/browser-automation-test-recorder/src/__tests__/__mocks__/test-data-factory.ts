/**
 * Test Data Factory
 * Utilities for creating test data and mock objects
 */

import type {
  RecordedEvent,
  RecordedEventTarget as _RecordedEventTarget,
  EventContext,
  ViewportInfo,
  RecordingSession as _RecordingSession,
  TestCase,
  GeneratedTest,
  CollaborationUser,
  SharedTestRecording,
  TestComment,
  TestReview,
  LibraryTest,
  MouseEventData as _MouseEventData,
  KeyboardEventData as _KeyboardEventData,
  FormEventData,
  NavigationEventData,
  EventType as _EventType,
  ReliabilityMetrics,
  EventMetadata,
} from '../../types';

let eventCounter = 0;
let sessionCounter = 0;
let testCounter = 0;
let userCounter = 0;

/**
 * Generate unique IDs for test objects
 */
export const generateId = (prefix = 'test') => {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Create mock viewport info
 */
export const createMockViewport = (overrides: Partial<ViewportInfo> = {}): ViewportInfo => ({
  width: 1024,
  height: 768,
  devicePixelRatio: 1,
  isLandscape: true,
  isMobile: false,
  ...overrides,
});

/**
 * Create mock event target
 */
export const createMockEventTarget = (overrides: Partial<RecordedEventTarget> = {}): RecordedEventTarget as _RecordedEventTarget => ({
  selector: '#test-button',
  xpath: '//*[@id="test-button"]',
  textContent: 'Click me',
  tagName: 'BUTTON',
  id: 'test-button',
  className: 'btn btn-primary',
  name: undefined,
  type: 'button',
  value: undefined,
  boundingRect: new DOMRect(100, 100, 120, 40),
  path: [
    {
      tagName: 'HTML',
      index: 0,
      selector: 'html',
      attributes: {},
    },
    {
      tagName: 'BODY',
      index: 0,
      selector: 'body',
      attributes: {},
    },
    {
      tagName: 'BUTTON',
      id: 'test-button',
      className: 'btn btn-primary',
      index: 0,
      selector: '#test-button',
      attributes: {
        id: 'test-button',
        class: 'btn btn-primary',
        type: 'button',
      },
    },
  ],
  alternativeSelectors: [
    '#test-button',
    'button[id="test-button"]',
    '.btn.btn-primary',
    'button.btn.btn-primary',
    'button:contains("Click me")',
  ],
  ...overrides,
});

/**
 * Create mock event context
 */
export const createMockEventContext = (overrides: Partial<EventContext> = {}): EventContext => ({
  url: 'https://example.com/test-page',
  title: 'Test Page',
  viewport: createMockViewport(),
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  performance: {
    domContentLoaded: 100,
    loadComplete: 250,
    firstPaint: 80,
    firstContentfulPaint: 120,
    largestContentfulPaint: 200,
    usedJSHeapSize: 1024 * 1024 * 5, // 5MB
    totalJSHeapSize: 1024 * 1024 * 10, // 10MB
    jsHeapSizeLimit: 1024 * 1024 * 100, // 100MB
    responseStart: 50,
    responseEnd: 90,
    domainLookupStart: 10,
    domainLookupEnd: 25,
    connectStart: 25,
    connectEnd: 40,
  },
  network: {
    requests: [],
    totalRequests: 0,
    failedRequests: 0,
    totalBytes: 0,
  },
  console: {
    messages: [],
    errorCount: 0,
    warningCount: 0,
  },
  ...overrides,
});

/**
 * Create mock reliability metrics
 */
export const createMockReliabilityMetrics = (overrides: Partial<ReliabilityMetrics> = {}): ReliabilityMetrics => ({
  selectorScore: 0.9,
  alternativesCount: 5,
  elementStable: true,
  positionStable: true,
  attributesStable: true,
  timingVariability: 0.1,
  networkDependency: false,
  confidence: 0.85,
  ...overrides,
});

/**
 * Create mock event metadata
 */
export const createMockEventMetadata = (overrides: Partial<EventMetadata> = {}): EventMetadata => ({
  screenshot: {
    id: generateId('screenshot'),
    format: 'png',
    quality: 90,
    fullPage: false,
    data: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
    size: 1024,
    dimensions: { width: 1024, height: 768 },
  },
  sessionId: generateId('session'),
  recordingMode: 'standard',
  reliability: createMockReliabilityMetrics(),
  annotations: [],
  custom: {},
  ...overrides,
});

/**
 * Create mock mouse event data
 */
export const createMockMouseEventData = (overrides: Partial<MouseEventData> = {}): MouseEventData as _MouseEventData => ({
  type: 'mouse',
  button: 0,
  buttons: 1,
  clientX: 150,
  clientY: 120,
  pageX: 150,
  pageY: 120,
  screenX: 200,
  screenY: 200,
  ctrlKey: false,
  shiftKey: false,
  altKey: false,
  metaKey: false,
  detail: 1,
  ...overrides,
});

/**
 * Create mock keyboard event data
 */
export const createMockKeyboardEventData = (overrides: Partial<KeyboardEventData> = {}): KeyboardEventData as _KeyboardEventData => ({
  type: 'keyboard',
  key: 'Enter',
  code: 'Enter',
  keyCode: 13,
  charCode: 0,
  ctrlKey: false,
  shiftKey: false,
  altKey: false,
  metaKey: false,
  repeat: false,
  inputValue: undefined,
  ...overrides,
});

/**
 * Create mock form event data
 */
export const createMockFormEventData = (overrides: Partial<FormEventData> = {}): FormEventData => ({
  type: 'form',
  eventType: 'change',
  value: 'test value',
  selectedOptions: undefined,
  files: undefined,
  formData: undefined,
  ...overrides,
});

/**
 * Create mock navigation event data
 */
export const createMockNavigationEventData = (overrides: Partial<NavigationEventData> = {}): NavigationEventData => ({
  type: 'navigation',
  url: 'https://example.com/new-page',
  title: 'New Page',
  referrer: 'https://example.com/previous-page',
  method: 'GET',
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  },
  timestamp: Date.now(),
  ...overrides,
});

/**
 * Create mock recorded event
 */
export const createMockRecordedEvent = (
  type: EventType as _EventType = 'click',
  overrides: Partial<RecordedEvent> = {}
): RecordedEvent => {
  const id = generateId('event');
  const timestamp = Date.now();
  
  let data;
  switch (type) {
    case 'click':
    case 'mousedown':
    case 'mouseup':
      data = createMockMouseEventData();
      break;
    case 'keydown':
    case 'keyup':
    case 'input':
      data = createMockKeyboardEventData();
      break;
    case 'change':
    case 'submit':
    case 'focus':
    case 'blur':
      data = createMockFormEventData();
      break;
    case 'navigation':
      data = createMockNavigationEventData();
      break;
    default:
      data = createMockMouseEventData();
  }

  return {
    id,
    type,
    timestamp,
    sequence: eventCounter++,
    target: createMockEventTarget(),
    data,
    context: createMockEventContext(),
    metadata: createMockEventMetadata(),
    ...overrides,
  };
};

/**
 * Create mock recording session
 */
export const createMockRecordingSession = (overrides: Partial<RecordingSession> = {}): RecordingSession as _RecordingSession => {
  // Create event IDs instead of full events
  const eventIds = [
    generateId('event'),
    generateId('event'),
    generateId('event'),
    generateId('event'),
  ];

  return {
    id: generateId('session'),
    name: `Test Session ${sessionCounter++}`,
    startTime: Date.now() - 60000, // 1 minute ago
    url: 'https://example.com/test-page',
    viewport: createMockViewport(),
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    events: eventIds,
    metadata: {
      tags: ['e2e', 'form-submission'],
      description: 'Test recording session',
      category: 'user-flow',
    },
    ...overrides,
  };
};

/**
 * Create mock test case
 */
export const createMockTestCase = (overrides: Partial<TestCase> = {}): TestCase => {
  const eventIds = [
    generateId('event'),
    generateId('event'),
    generateId('event'),
    generateId('event'),
  ];

  return {
    id: generateId('testcase'),
    name: `Test Case ${testCounter++}`,
    description: 'Generated test case from recorded events',
    events: eventIds,
    assertions: [
      {
        id: generateId('assertion'),
        type: 'visible',
        selector: '#success-message',
        expected: true,
        description: 'Success message should be visible',
      },
    ],
    metadata: {
      sessionId: generateId('session'),
      eventCount: eventIds.length,
      duration: 5000,
      url: 'https://example.com/test-page',
      viewport: createMockViewport(),
      assertions: 1,
      selectors: eventIds.length,
    },
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...overrides,
  };
};

/**
 * Create mock generated test
 */
export const createMockGeneratedTest = (overrides: Partial<GeneratedTest> = {}): GeneratedTest => ({
  id: generateId('generated'),
  name: `Generated Test ${testCounter++}`,
  format: 'playwright',
  framework: 'playwright',
  code: `
import { test, expect } from '@playwright/test';

test('Generated test case', async ({ page }) => {
  await page.goto('https://example.com/test-page');
  await page.click('#test-button');
  await page.fill('#test-input', 'test value');
  await page.click('#submit-button');
  await expect(page.locator('#success-message')).toBeVisible();
});
  `.trim(),
  metadata: {
    sessionId: generateId('session'),
    eventCount: 4,
    duration: 5000,
    url: 'https://example.com/test-page',
    viewport: createMockViewport(),
    assertions: 1,
    selectors: 4,
  },
  createdAt: Date.now(),
  ...overrides,
});

/**
 * Create mock collaboration user
 */
export const createMockCollaborationUser = (overrides: Partial<CollaborationUser> = {}): CollaborationUser => ({
  id: generateId('user'),
  name: `Test User ${userCounter++}`,
  email: `testuser${userCounter}@example.com`,
  avatar: 'https://example.com/avatar.jpg',
  role: 'editor',
  team: generateId('team'),
  status: 'online',
  lastActivity: Date.now(),
  permissions: {
    canView: true,
    canEdit: true,
    canShare: true,
    canReview: true,
    canComment: true,
    canDelete: false,
    canManageTeam: false,
    canApproveTests: false,
    canPublishTests: false,
    customPermissions: {},
  },
  ...overrides,
});

/**
 * Create mock shared test recording
 */
export const createMockSharedTestRecording = (overrides: Partial<SharedTestRecording> = {}): SharedTestRecording => ({
  id: generateId('shared'),
  originalId: generateId('original'),
  shareId: generateId('share'),
  name: 'Shared Test Recording',
  description: 'A test recording shared for collaboration',
  events: [
    createMockRecordedEvent('navigation'),
    createMockRecordedEvent('click'),
    createMockRecordedEvent('input'),
  ],
  metadata: {
    sessionId: generateId('session'),
    url: 'https://example.com/test',
    title: 'Test Page',
    viewport: createMockViewport(),
    userAgent: 'Mock User Agent',
    duration: 5000,
    eventCount: 3,
    tags: ['shared', 'collaboration'],
    category: 'user-flow',
    framework: 'playwright',
    language: 'typescript',
    complexity: 'medium',
    browserSupport: ['chrome', 'firefox', 'safari'],
    dependencies: ['@playwright/test'],
  },
  sharing: {
    visibility: 'team',
    allowFork: true,
    allowEdit: true,
    allowComment: true,
    allowDownload: true,
    requireLogin: true,
    permissions: {},
  },
  collaborators: [createMockCollaborationUser()],
  comments: [],
  reviews: [],
  versions: [],
  createdAt: Date.now() - 3600000, // 1 hour ago
  updatedAt: Date.now(),
  createdBy: generateId('user'),
  ...overrides,
});

/**
 * Create mock test comment
 */
export const createMockTestComment = (overrides: Partial<TestComment> = {}): TestComment => ({
  id: generateId('comment'),
  testId: generateId('test'),
  content: 'This is a test comment',
  author: createMockCollaborationUser(),
  mentions: [],
  attachments: [],
  reactions: [],
  createdAt: Date.now() - 1800000, // 30 minutes ago
  updatedAt: Date.now() - 1800000,
  edited: false,
  ...overrides,
});

/**
 * Create mock test review
 */
export const createMockTestReview = (overrides: Partial<TestReview> = {}): TestReview => ({
  id: generateId('review'),
  testId: generateId('test'),
  reviewer: createMockCollaborationUser({ role: 'reviewer' }),
  status: 'pending',
  requestedAt: Date.now() - 3600000, // 1 hour ago
  comments: [],
  criteria: {
    functionalCorrectness: true,
    selectorReliability: true,
    performanceImpact: true,
    codeQuality: true,
    documentation: true,
    browserCompatibility: true,
    custom: {},
  },
  checklist: [
    {
      id: generateId('checklist'),
      description: 'Test covers the main user flow',
      required: true,
      checked: false,
    },
    {
      id: generateId('checklist'),
      description: 'Selectors are reliable and maintainable',
      required: true,
      checked: false,
    },
  ],
  changes: [],
  assignedBy: generateId('user'),
  ...overrides,
});

/**
 * Create mock library test
 */
export const createMockLibraryTest = (overrides: Partial<LibraryTest> = {}): LibraryTest => ({
  id: generateId('library'),
  name: 'Library Test Example',
  description: 'A test in the team library',
  recording: createMockSharedTestRecording(),
  category: generateId('category'),
  tags: ['library', 'reusable'],
  author: createMockCollaborationUser(),
  maintainers: [createMockCollaborationUser()],
  usage: {
    views: 150,
    downloads: 25,
    forks: 5,
    stars: 12,
    runs: 100,
    successRate: 0.95,
    lastUsed: Date.now() - 86400000, // 1 day ago
    popularityScore: 0.8,
  },
  quality: {
    reliabilityScore: 0.9,
    maintainabilityScore: 0.85,
    complexityScore: 0.6,
    documentationScore: 0.8,
    testCoverage: 0.9,
    browserCompatibility: 0.95,
    performanceScore: 0.8,
    overallScore: 0.84,
  },
  status: 'published',
  visibility: 'team',
  createdAt: Date.now() - 604800000, // 1 week ago
  updatedAt: Date.now() - 86400000, // 1 day ago
  ...overrides,
});

/**
 * Create a sequence of related events (user flow)
 */
export const createMockUserFlow = (steps: EventType as _EventType[]): RecordedEvent[] => {
  return steps.map((type, index) => 
    createMockRecordedEvent(type, {
      sequence: index,
      timestamp: Date.now() + (index * 1000), // 1 second apart
    })
  );
};

/**
 * Create events for a typical login flow
 */
export const createMockLoginFlow = (): RecordedEvent[] => {
  return [
    createMockRecordedEvent('navigation', {
      data: createMockNavigationEventData({
        url: 'https://example.com/login',
        title: 'Login Page',
      }),
    }),
    createMockRecordedEvent('click', {
      target: createMockEventTarget({
        selector: '#username',
        tagName: 'INPUT',
        type: 'text',
        id: 'username',
      }),
    }),
    createMockRecordedEvent('input', {
      target: createMockEventTarget({
        selector: '#username',
        tagName: 'INPUT',
        type: 'text',
        id: 'username',
        value: 'testuser',
      }),
      data: createMockKeyboardEventData({
        inputValue: 'testuser',
      }),
    }),
    createMockRecordedEvent('click', {
      target: createMockEventTarget({
        selector: '#password',
        tagName: 'INPUT',
        type: 'password',
        id: 'password',
      }),
    }),
    createMockRecordedEvent('input', {
      target: createMockEventTarget({
        selector: '#password',
        tagName: 'INPUT',
        type: 'password',
        id: 'password',
        value: 'password123',
      }),
      data: createMockKeyboardEventData({
        inputValue: 'password123',
      }),
    }),
    createMockRecordedEvent('click', {
      target: createMockEventTarget({
        selector: '#login-button',
        tagName: 'BUTTON',
        type: 'submit',
        id: 'login-button',
        textContent: 'Sign In',
      }),
    }),
  ];
};

/**
 * Reset counters (useful for tests)
 */
export const resetCounters = () => {
  eventCounter = 0;
  sessionCounter = 0;
  testCounter = 0;
  userCounter = 0;
};