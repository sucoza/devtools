/**
 * Mock implementations for Chrome DevTools Protocol
 * Used for testing browser automation features
 */

import { vi } from 'vitest';
import type { CDPDOMNode, CDPRemoteObject } from '../../types';

export const mockCDPDOMNode: CDPDOMNode = {
  nodeId: 1,
  backendNodeId: 1,
  nodeType: 1,
  nodeName: 'BUTTON',
  localName: 'button',
  nodeValue: '',
  attributes: ['id', 'test-button', 'class', 'btn btn-primary'],
  children: [
    {
      nodeId: 2,
      backendNodeId: 2,
      nodeType: 3,
      nodeName: '#text',
      localName: '',
      nodeValue: 'Click me',
    },
  ],
};

export const mockCDPRemoteObject: CDPRemoteObject = {
  type: 'object',
  subtype: 'node',
  className: 'HTMLButtonElement',
  description: 'button#test-button.btn.btn-primary',
  objectId: 'mock-object-id-1',
  preview: {
    type: 'object',
    subtype: 'node',
    description: 'button#test-button.btn.btn-primary',
    overflow: false,
    properties: [
      {
        name: 'id',
        type: 'string',
        value: 'test-button',
      },
      {
        name: 'className',
        type: 'string',
        value: 'btn btn-primary',
      },
    ],
  },
};

export const createMockCDPClient = () => ({
  // DOM domain
  DOM: {
    enable: vi.fn().mockResolvedValue({}),
    disable: vi.fn().mockResolvedValue({}),
    getDocument: vi.fn().mockResolvedValue({
      root: mockCDPDOMNode,
    }),
    querySelector: vi.fn().mockResolvedValue({
      nodeId: 1,
    }),
    querySelectorAll: vi.fn().mockResolvedValue({
      nodeIds: [1, 2, 3],
    }),
    resolveNode: vi.fn().mockResolvedValue({
      object: mockCDPRemoteObject,
    }),
    getOuterHTML: vi.fn().mockResolvedValue({
      outerHTML: '<button id="test-button" class="btn btn-primary">Click me</button>',
    }),
    getBoxModel: vi.fn().mockResolvedValue({
      model: {
        content: [100, 100, 200, 100, 200, 150, 100, 150],
        padding: [95, 95, 205, 95, 205, 155, 95, 155],
        border: [90, 90, 210, 90, 210, 160, 90, 160],
        margin: [85, 85, 215, 85, 215, 165, 85, 165],
        width: 100,
        height: 50,
      },
    }),
    highlightNode: vi.fn().mockResolvedValue({}),
    hideHighlight: vi.fn().mockResolvedValue({}),
  },

  // Runtime domain
  Runtime: {
    enable: vi.fn().mockResolvedValue({}),
    disable: vi.fn().mockResolvedValue({}),
    evaluate: vi.fn().mockResolvedValue({
      result: {
        type: 'string',
        value: 'test result',
      },
    }),
    callFunctionOn: vi.fn().mockResolvedValue({
      result: {
        type: 'object',
        value: { success: true },
      },
    }),
    getProperties: vi.fn().mockResolvedValue({
      result: [
        {
          name: 'tagName',
          value: { type: 'string', value: 'BUTTON' },
        },
        {
          name: 'id',
          value: { type: 'string', value: 'test-button' },
        },
      ],
    }),
  },

  // Page domain
  Page: {
    enable: vi.fn().mockResolvedValue({}),
    disable: vi.fn().mockResolvedValue({}),
    navigate: vi.fn().mockResolvedValue({
      frameId: 'mock-frame-id',
      loaderId: 'mock-loader-id',
    }),
    reload: vi.fn().mockResolvedValue({}),
    captureScreenshot: vi.fn().mockResolvedValue({
      data: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
    }),
    getLayoutMetrics: vi.fn().mockResolvedValue({
      layoutViewport: {
        pageX: 0,
        pageY: 0,
        clientWidth: 1024,
        clientHeight: 768,
      },
      visualViewport: {
        offsetX: 0,
        offsetY: 0,
        pageX: 0,
        pageY: 0,
        clientWidth: 1024,
        clientHeight: 768,
        scale: 1,
        zoom: 1,
      },
    }),
    setViewport: vi.fn().mockResolvedValue({}),
  },

  // Input domain
  Input: {
    dispatchMouseEvent: vi.fn().mockResolvedValue({}),
    dispatchKeyEvent: vi.fn().mockResolvedValue({}),
    dispatchTouchEvent: vi.fn().mockResolvedValue({}),
    insertText: vi.fn().mockResolvedValue({}),
  },

  // Network domain
  Network: {
    enable: vi.fn().mockResolvedValue({}),
    disable: vi.fn().mockResolvedValue({}),
    setRequestInterception: vi.fn().mockResolvedValue({}),
    continueInterceptedRequest: vi.fn().mockResolvedValue({}),
    getResponseBody: vi.fn().mockResolvedValue({
      body: JSON.stringify({ status: 'ok' }),
      base64Encoded: false,
    }),
  },

  // Console domain
  Console: {
    enable: vi.fn().mockResolvedValue({}),
    disable: vi.fn().mockResolvedValue({}),
  },

  // Performance domain
  Performance: {
    enable: vi.fn().mockResolvedValue({}),
    disable: vi.fn().mockResolvedValue({}),
    getMetrics: vi.fn().mockResolvedValue({
      metrics: [
        {
          name: 'Timestamp',
          value: Date.now(),
        },
        {
          name: 'JSHeapUsedSize',
          value: 1024 * 1024 * 10, // 10MB
        },
        {
          name: 'JSHeapTotalSize',
          value: 1024 * 1024 * 20, // 20MB
        },
      ],
    }),
  },

  // Event handlers
  on: vi.fn(),
  off: vi.fn(),
  once: vi.fn(),
  emit: vi.fn(),

  // Connection management
  close: vi.fn().mockResolvedValue({}),
});

export const createMockCDPSession = () => {
  const client = createMockCDPClient();
  
  const clientWithIndex = client as any;
  
  return {
    ...client,
    send: vi.fn().mockImplementation((method: string, params?: any) => {
      // Route CDP commands to appropriate domain methods
      const [domain, command] = method.split('.');
      if (clientWithIndex[domain] && clientWithIndex[domain][command]) {
        return clientWithIndex[domain][command](params);
      }
      return Promise.resolve({});
    }),
    connection: {
      url: 'ws://localhost:9222/devtools/browser/mock-id',
      send: vi.fn(),
      close: vi.fn(),
    },
  };
};

export const mockCDPEvents = {
  'DOM.documentUpdated': vi.fn(),
  'Page.loadEventFired': vi.fn(),
  'Page.domContentEventFired': vi.fn(),
  'Page.frameNavigated': vi.fn(),
  'Runtime.consoleAPICalled': vi.fn(),
  'Runtime.exceptionThrown': vi.fn(),
  'Network.requestWillBeSent': vi.fn(),
  'Network.responseReceived': vi.fn(),
  'Network.loadingFinished': vi.fn(),
  'Network.loadingFailed': vi.fn(),
  'Performance.metrics': vi.fn(),
  'Input.dragIntercepted': vi.fn(),
};

export default {
  createMockCDPClient,
  createMockCDPSession,
  mockCDPEvents,
  mockCDPDOMNode,
  mockCDPRemoteObject,
};